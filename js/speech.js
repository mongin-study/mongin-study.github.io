(function (HV) {
  "use strict";

  var ctx = null;
  var epoch = 0;
  var sources = [];
  var manifest = null;
  var manifestKeys = [];
  var loading = null;
  var enManifest = null;
  var enLoading = null;
  var buffers = {};
  var voiceCache = null;
  var last = { mode: "", norm: "", keys: [] };

  function enabled() {
    try { return HV.storage.data().settings.speech !== false; }
    catch (e) { return true; }
  }

  function readNum(n) {
    return HV.util && HV.util.readNumber ? HV.util.readNumber(n) : String(n);
  }

  /* Spoken Vietnamese only: no emoji, no English symbol names, digits as words. */
  function normalize(text) {
    var s = String(text || "").normalize("NFC");
    s = s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\uFE0F\u200D]/gu, " ");
    s = s.replace(/[+＋]/g, " cộng ");
    s = s.replace(/[−–—]/g, " trừ ");
    s = s.replace(/-/g, " trừ ");
    s = s.replace(/=/g, " bằng ");
    s = s.replace(/[×✕]/g, " nhân ");
    s = s.replace(/[÷]/g, " chia ");
    s = s.replace(/\d+/g, function (n) { return " " + readNum(n) + " "; });
    s = s.replace(/[?？!！.,;:…"'“”‘’()[\]{}]/g, " ");
    s = s.replace(/\s+/g, " ").trim().toLowerCase();
    return s;
  }

  function assetUrl(path) {
    try { return new URL(path, document.baseURI).href; }
    catch (e) { return path; }
  }

  function loadManifest() {
    if (manifest) return Promise.resolve(manifest);
    if (loading) return loading;
    loading = fetch(assetUrl("assets/audio/manifest.json"))
      .then(function (res) { return res.ok ? res.json() : { clips: {} }; })
      .then(function (json) {
        manifest = (json && json.clips) || {};
        manifestKeys = Object.keys(manifest).sort(function (a, b) { return b.length - a.length; });
        return manifest;
      })
      .catch(function () {
        manifest = {};
        manifestKeys = [];
        return manifest;
      });
    return loading;
  }

  function normalizeEn(text) {
    var s = String(text || "").normalize("NFC");
    s = s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\uFE0F\u200D]/gu, " ");
    s = s.replace(/[?？!！.,;:"'“”‘’()[\]{}]/g, " ");
    s = s.replace(/\s+/g, " ").trim().toLowerCase();
    return s;
  }

  function loadEn() {
    if (enManifest) return Promise.resolve(enManifest);
    if (enLoading) return enLoading;
    enLoading = fetch(assetUrl("assets/audio/en/manifest.json"))
      .then(function (res) { return res.ok ? res.json() : { clips: {} }; })
      .then(function (json) {
        enManifest = (json && json.clips) || {};
        return enManifest;
      })
      .catch(function () {
        enManifest = {};
        return enManifest;
      });
    return enLoading;
  }

  function tokenize(norm) {
    if (!norm || !manifestKeys.length) return null;
    if (manifest[norm]) return [norm];
    var i = 0;
    var out = [];
    while (i < norm.length) {
      while (norm.charAt(i) === " ") i += 1;
      if (i >= norm.length) break;
      var found = "";
      for (var k = 0; k < manifestKeys.length; k++) {
        var key = manifestKeys[k];
        if (norm.slice(i, i + key.length) !== key) continue;
        var end = i + key.length;
        if (end < norm.length && norm.charAt(end) !== " ") continue;
        found = key;
        break;
      }
      if (!found) return null;
      out.push(found);
      i += found.length;
    }
    return out.length ? out : null;
  }

  function context() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") ctx.resume().catch(function () {});
    return ctx;
  }

  function unlock() {
    try {
      var c = context();
      if (!c) return;
      var buf = c.createBuffer(1, 1, 22050);
      var src = c.createBufferSource();
      src.buffer = buf;
      src.connect(c.destination);
      src.start(0);
    } catch (e) {}
    loadManifest();
  }

  function stopSources() {
    sources.forEach(function (src) {
      try { src.stop(); } catch (e) {}
    });
    sources = [];
  }

  function loadBuffer(url) {
    if (buffers[url]) return buffers[url];
    var c = context();
    buffers[url] = fetch(url).then(function (res) {
      if (!res.ok) throw new Error("audio");
      return res.arrayBuffer();
    }).then(function (ab) {
      return c.decodeAudioData(ab.slice(0));
    });
    return buffers[url];
  }

  function clipRate(opts) {
    var r = opts && opts.rate ? opts.rate : 1;
    if (r < 0.9) return 0.94;
    return 1;
  }

  function playKeys(keys, opts, my, norm, clipMap) {
    var map = clipMap || manifest;
    var c = context();
    if (!c) return Promise.reject(new Error("no audio"));
    var rate = clipRate(opts);
    return Promise.all(keys.map(function (key) {
      return loadBuffer(assetUrl(map[key]));
    })).then(function (bufs) {
      if (my !== epoch) return 0;
      if (c.state === "suspended") c.resume().catch(function () {});
      var t = c.currentTime + 0.03;
      var start = t;
      var lastSrc = null;
      bufs.forEach(function (buf, idx) {
        if (!buf) return;
        var src = c.createBufferSource();
        src.buffer = buf;
        src.playbackRate.value = rate;
        src.connect(c.destination);
        src.start(t);
        sources.push(src);
        lastSrc = src;
        var gap = 0.04;
        if (idx + 1 < keys.length && isNumberKey(keys[idx]) && isNumberKey(keys[idx + 1])) gap = 0.09;
        t += buf.duration / rate + gap;
      });
      last = { mode: "clips", lang: (opts && opts.lang) || "vi", norm: norm, keys: keys.slice() };
      var dur = Math.max(0.3, t - start);
      return new Promise(function (resolve) {
        var finished = false;
        function done() {
          if (finished) return;
          finished = true;
          resolve(dur);
        }
        if (lastSrc) lastSrc.onended = done;
        else done();
        setTimeout(done, Math.ceil(dur * 1000) + 80);
      });
    });
  }

  function isNumberKey(key) {
    if (!HV.util || !HV.util.readNumber) return false;
    for (var n = 0; n <= 100; n++) {
      if (HV.util.readNumber(n) === key) return true;
    }
    return false;
  }

  function whenVoices() {
    var synth = window.speechSynthesis;
    if (!synth) return Promise.resolve([]);
    if (voiceCache && voiceCache.length) return Promise.resolve(voiceCache);
    return new Promise(function (resolve) {
      var done = false;
      function grab() {
        if (done) return true;
        var list = [];
        try { list = synth.getVoices() || []; } catch (e) { list = []; }
        if (!list.length) return false;
        done = true;
        voiceCache = list;
        resolve(list);
        return true;
      }
      if (grab()) return;
      function onChange() { grab(); }
      try { synth.addEventListener("voiceschanged", onChange); } catch (e) {}
      setTimeout(function () {
        if (done) return;
        done = true;
        try { synth.removeEventListener("voiceschanged", onChange); } catch (e) {}
        try { voiceCache = synth.getVoices() || []; } catch (e2) { voiceCache = []; }
        resolve(voiceCache);
      }, 1600);
    });
  }

  function pickVoice(voices) {
    var vi = [];
    (voices || []).forEach(function (v) {
      var lang = String(v.lang || "").toLowerCase().replace("_", "-");
      if (lang.indexOf("vi") === 0) vi.push(v);
    });
    if (!vi.length) return null;
    var linh = null;
    var exact = null;
    vi.forEach(function (v) {
      var name = String(v.name || "").toLowerCase();
      var lang = String(v.lang || "").toLowerCase().replace("_", "-");
      if (name.indexOf("linh") >= 0) linh = linh || v;
      if (lang === "vi-vn") exact = exact || v;
    });
    return linh || exact || vi[0];
  }

  function speakVi(norm, opts, my) {
    if (!window.speechSynthesis || !norm) return Promise.resolve(0);
    var guess = guessSeconds(norm);
    return whenVoices().then(function (voices) {
      if (my !== epoch) return 0;
      var voice = pickVoice(voices);
      if (!voice) return guess;
      return new Promise(function (resolve) {
        var done = false;
        function finish() {
          if (done) return;
          done = true;
          resolve(guess);
        }
        try {
          window.speechSynthesis.cancel();
          var u = new SpeechSynthesisUtterance(norm);
          u.lang = "vi-VN";
          u.voice = voice;
          u.rate = opts && opts.rate ? Math.max(0.85, opts.rate) : 0.9;
          u.pitch = opts && opts.pitch ? Math.max(1.05, opts.pitch) : 1.25;
          u.onend = finish;
          u.onerror = finish;
          window.speechSynthesis.speak(u);
          last = { mode: "vi", norm: norm, keys: [], voice: voice.name || voice.lang };
          setTimeout(finish, guess * 1000 + 700);
        } catch (e) { finish(); }
      });
    });
  }

  function pickEnVoice(voices) {
    var list = [];
    (voices || []).forEach(function (v) {
      var lang = String(v.lang || "").toLowerCase().replace("_", "-");
      if (lang.indexOf("en") === 0) list.push(v);
    });
    if (!list.length) return null;
    var ana = null;
    var us = null;
    list.forEach(function (v) {
      var name = String(v.name || "").toLowerCase();
      var lang = String(v.lang || "").toLowerCase().replace("_", "-");
      if (name.indexOf("ana") >= 0) ana = ana || v;
      if (lang === "en-us") us = us || v;
    });
    return ana || us || list[0];
  }

  function speakEnVoice(norm, opts, my) {
    if (!window.speechSynthesis || !norm) return Promise.resolve(0);
    var guess = guessSeconds(norm);
    return whenVoices().then(function (voices) {
      if (my !== epoch) return 0;
      var voice = pickEnVoice(voices);
      if (!voice) return guess;
      var lang = String(voice.lang || "").toLowerCase();
      if (lang.indexOf("en") !== 0) return guess;
      return new Promise(function (resolve) {
        var done = false;
        function finish() {
          if (done) return;
          done = true;
          resolve(guess);
        }
        try {
          window.speechSynthesis.cancel();
          var u = new SpeechSynthesisUtterance(norm);
          u.lang = "en-US";
          u.voice = voice;
          u.rate = opts && opts.rate ? Math.min(1.15, opts.rate + 0.08) : 1.05;
          u.pitch = opts && opts.pitch ? opts.pitch : 1.15;
          u.onend = finish;
          u.onerror = finish;
          window.speechSynthesis.speak(u);
          last = { mode: "en", norm: norm, keys: [], voice: voice.name || voice.lang };
          setTimeout(finish, guess * 1000 + 700);
        } catch (e) { finish(); }
      });
    });
  }

  function guessSeconds(text) {
    var words = String(text || "").trim().split(/\s+/).filter(Boolean).length;
    return Math.max(0.8, Math.min(4.2, 0.45 + words * 0.38));
  }

  var chain = Promise.resolve();

  function speak(text, opts) {
    opts = opts || {};
    if (!opts.chain) {
      cancel();
      chain = Promise.resolve();
    }
    var my = epoch;
    var job = chain.then(function () {
      if (my !== epoch) return 0;
      return speakBody(text, opts, my);
    });
    chain = job.then(function () {}, function () {});
    return job;
  }

  function speakBody(text, opts, my) {
    if (!enabled() || !text) return Promise.resolve(0);
    if (!opts.chain && HV.audio && HV.audio.cut) HV.audio.cut();
    var lang = opts && opts.lang === "en" ? "en" : "vi";
    if (lang === "en") {
      var enNorm = normalizeEn(text);
      if (!enNorm) return Promise.resolve(0);
      return loadEn().then(function () {
        if (my !== epoch) return 0;
        if (enManifest[enNorm]) {
          return playKeys([enNorm], opts, my, enNorm, enManifest).catch(function () {
            if (my !== epoch) return 0;
            return speakEnVoice(enNorm, opts, my);
          });
        }
        return speakEnVoice(enNorm, opts, my);
      }).catch(function () {
        if (my !== epoch) return 0;
        return speakEnVoice(enNorm, opts, my);
      });
    }
    var norm = normalize(text);
    if (!norm) return Promise.resolve(0);
    return loadManifest().then(function () {
      if (my !== epoch) return 0;
      var keys = tokenize(norm);
      if (!keys) return speakVi(norm, opts, my);
      return playKeys(keys, opts, my, norm).catch(function () {
        if (my !== epoch) return 0;
        return speakVi(norm, opts, my);
      });
    }).catch(function () {
      if (my !== epoch) return 0;
      return speakVi(norm, opts, my);
    });
  }

  function cancel() {
    epoch += 1;
    stopSources();
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } catch (e) {}
  }

  if (typeof window !== "undefined") {
    window.addEventListener("pointerdown", unlock, { passive: true });
    loadManifest();
    loadEn();
    whenVoices();
  }

  HV.speech = {
    speak: speak,
    cancel: cancel,
    unlock: unlock,
    pickVoice: pickVoice,
    pickEnVoice: pickEnVoice,
    normalize: normalize,
    normalizeEn: normalizeEn,
    tokenize: function (text) { return tokenize(normalize(text)); },
    last: function () { return last; },
    supported: function () { return typeof window !== "undefined" && (!!window.speechSynthesis || !!manifest); }
  };
})(globalThis.HV = globalThis.HV || {});
