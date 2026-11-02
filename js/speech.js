(function (HV) {
  "use strict";

  function enabled() {
    try { return HV.storage.data().settings.speech !== false; }
    catch (e) { return true; }
  }

  function pickVoice() {
    if (!window.speechSynthesis) return null;
    var voices = [];
    try { voices = window.speechSynthesis.getVoices() || []; } catch (e) { return null; }
    var exact = null;
    var loose = null;
    voices.forEach(function (v) {
      var lang = (v.lang || "").toLowerCase();
      if (lang === "vi-vn") exact = exact || v;
      else if (lang.indexOf("vi") === 0) loose = loose || v;
    });
    return exact || loose;
  }

  function speak(text, opts) {
    if (!enabled() || !text || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(String(text));
      u.lang = "vi-VN";
      u.rate = opts && opts.rate ? opts.rate : 0.92;
      u.pitch = opts && opts.pitch ? opts.pitch : 1.04;
      var v = pickVoice();
      if (v) u.voice = v;
      u.onerror = function () {};
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  function cancel() {
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } catch (e) {}
  }

  if (typeof window !== "undefined" && window.speechSynthesis && window.speechSynthesis.addEventListener) {
    window.speechSynthesis.addEventListener("voiceschanged", function () {});
  }

  HV.speech = {
    speak: speak,
    cancel: cancel,
    pickVoice: pickVoice,
    supported: function () { return typeof window !== "undefined" && !!window.speechSynthesis; }
  };
})(globalThis.HV = globalThis.HV || {});
