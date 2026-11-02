(function (HV) {
  "use strict";

  var ctx = null;

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

  function tone(freq, when, dur, type, gain) {
    var c = context();
    if (!c || !enabled()) return;
    dur = Math.max(dur, 0.05);
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), when + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(when);
    o.stop(when + dur + 0.02);
  }

  function play(seq) {
    try {
      var c = context();
      if (!c || !enabled()) return;
      var t0 = c.currentTime + 0.01;
      seq.forEach(function (n) {
        tone(n.f, t0 + n.t, n.d, n.type || "sine", n.g || 0.07);
      });
    } catch (e) {}
  }

  HV.audio = {
    unlock: function () {
      try { context(); } catch (e) {}
    },
    tap: function () {
      play([{ f: 740, t: 0, d: 0.06, g: 0.035 }]);
    },
    correct: function () {
      play([
        { f: 523.25, t: 0, d: 0.12, g: 0.06 },
        { f: 659.25, t: 0.09, d: 0.12, g: 0.06 },
        { f: 783.99, t: 0.18, d: 0.2, g: 0.07 }
      ]);
    },
    wrong: function () {
      play([
        { f: 311, t: 0, d: 0.12, type: "triangle", g: 0.035 },
        { f: 247, t: 0.1, d: 0.16, type: "triangle", g: 0.03 }
      ]);
    },
    fanfare: function () {
      play([
        { f: 523, t: 0, d: 0.14, g: 0.06 },
        { f: 659, t: 0.13, d: 0.14, g: 0.06 },
        { f: 784, t: 0.26, d: 0.14, g: 0.065 },
        { f: 1046, t: 0.4, d: 0.32, g: 0.07 }
      ]);
    },
    star: function () {
      play([
        { f: 880, t: 0, d: 0.08, g: 0.045 },
        { f: 1175, t: 0.08, d: 0.16, g: 0.05 }
      ]);
    }
  };
})(globalThis.HV = globalThis.HV || {});
