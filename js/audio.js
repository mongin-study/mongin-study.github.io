(function (HV) {
  "use strict";

  var ctx = null;
  var nodes = [];

  function context() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") {
      ctx.resume().catch(function () {});
    }
    return ctx;
  }

  function enabled() {
    try { return HV.storage.data().settings.sound !== false; }
    catch (e) { return true; }
  }

  function track(node) {
    nodes.push(node);
    node.onended = function () {
      nodes = nodes.filter(function (n) { return n !== node; });
    };
  }

  function cut() {
    nodes.forEach(function (node) {
      try { node.stop(); } catch (e) {}
    });
    nodes = [];
  }

  function tone(freq, when, dur, type, gain) {
    var c = context();
    if (!c) return;
    dur = Math.max(dur, 0.04);
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), when + Math.min(0.02, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(when);
    o.stop(when + dur + 0.02);
    track(o);
  }

  function glide(from, to, when, dur, type, gain) {
    var c = context();
    if (!c) return;
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(Math.max(from, 40), when);
    o.frequency.exponentialRampToValueAtTime(Math.max(to, 40), when + dur);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(when);
    o.stop(when + dur + 0.02);
    track(o);
  }

  function noise(when, dur, gain, freq, q) {
    var c = context();
    if (!c) return;
    var len = Math.max(1, Math.floor(c.sampleRate * dur));
    var buf = c.createBuffer(1, len, c.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    var src = c.createBufferSource();
    src.buffer = buf;
    var filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = q || 0.8;
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), when + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(c.destination);
    src.start(when);
    src.stop(when + dur + 0.02);
    track(src);
  }

  function play(seq) {
    try {
      var c = context();
      if (!c || !enabled()) return 0;
      var t0 = c.currentTime + 0.02;
      var end = 0;
      seq.forEach(function (n) {
        tone(n.f, t0 + n.t, n.d, n.type || "sine", n.g || 0.04);
        end = Math.max(end, n.t + n.d);
      });
      return end;
    } catch (e) {
      return 0;
    }
  }

  HV.audio = {
    unlock: function () {
      try { context(); } catch (e) {}
    },
    cut: cut,
    tap: function () {
      return play([{ f: 880, t: 0, d: 0.045, g: 0.028, type: "sine" }]);
    },
    correct: function () {
      return play([
        { f: 784, t: 0, d: 0.1, g: 0.045 },
        { f: 1175, t: 0.06, d: 0.12, g: 0.04 },
        { f: 1568, t: 0.12, d: 0.18, g: 0.032 },
        { f: 2093, t: 0.16, d: 0.14, g: 0.02, type: "triangle" }
      ]);
    },
    wrong: function () {
      try {
        var c = context();
        if (!c || !enabled()) return 0;
        var t = c.currentTime + 0.02;
        glide(320, 140, t, 0.22, "sine", 0.04);
        tone(210, t + 0.08, 0.14, "triangle", 0.018);
        return 0.26;
      } catch (e) {
        return 0;
      }
    },
    star: function () {
      return play([
        { f: 1319, t: 0, d: 0.07, g: 0.03 },
        { f: 1760, t: 0.06, d: 0.12, g: 0.028 },
        { f: 2093, t: 0.12, d: 0.16, g: 0.02 }
      ]);
    },
    fanfare: function () {
      try {
        var c = context();
        if (!c || !enabled()) return 0;
        var t0 = c.currentTime + 0.02;
        [523, 659, 784, 1046].forEach(function (f, i) {
          tone(f, t0 + i * 0.11, i === 3 ? 0.28 : 0.14, "sine", 0.04);
        });
        [0.42, 0.52, 0.62, 0.72].forEach(function (t, i) {
          noise(t0 + t, 0.12, 0.016, 1400 + i * 180, 0.6);
        });
        return 0.9;
      } catch (e) {
        return 0;
      }
    },
    jingle: function () {
      return play([
        { f: 523, t: 0, d: 0.12, g: 0.04 },
        { f: 659, t: 0.1, d: 0.12, g: 0.04 },
        { f: 784, t: 0.2, d: 0.12, g: 0.042 },
        { f: 1046, t: 0.3, d: 0.16, g: 0.04 },
        { f: 1319, t: 0.44, d: 0.28, g: 0.036 }
      ]);
    },
    bark: function () {
      try {
        var c = context();
        if (!c || !enabled()) return 0;
        var t = c.currentTime + 0.02;
        noise(t, 0.09, 0.03, 480, 2.2);
        noise(t + 0.14, 0.11, 0.028, 560, 2);
        tone(520, t, 0.08, "sine", 0.02);
        tone(600, t + 0.14, 0.09, "sine", 0.018);
        return 0.3;
      } catch (e) {
        return 0;
      }
    },
    vroom: function () {
      try {
        var c = context();
        if (!c || !enabled()) return 0;
        var t = c.currentTime + 0.02;
        glide(110, 180, t, 0.22, "sawtooth", 0.02);
        glide(180, 90, t + 0.2, 0.22, "sawtooth", 0.016);
        noise(t, 0.4, 0.012, 180, 0.7);
        return 0.46;
      } catch (e) {
        return 0;
      }
    }
  };
})(globalThis.HV = globalThis.HV || {});
