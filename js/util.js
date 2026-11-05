(function (HV) {
  "use strict";

  function rnd(a, b) {
    if (a > b) {
      var t = a;
      a = b;
      b = t;
    }
    return a + Math.floor(Math.random() * (b - a + 1));
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function readNumber(n) {
    n = Math.round(Number(n));
    if (!isFinite(n)) return "";
    if (n < 0) return "âm " + readNumber(-n);
    var d = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    if (n < 10) return d[n];
    if (n === 10) return "mười";
    if (n < 20) {
      var o = n - 10;
      if (o === 5) return "mười lăm";
      return "mười " + d[o];
    }
    if (n === 100) return "một trăm";
    if (n > 100) return String(n);
    var tens = Math.floor(n / 10);
    var ones = n % 10;
    var s = d[tens] + " mươi";
    if (ones === 0) return s;
    if (ones === 1) return s + " mốt";
    if (ones === 4) return s + " tư";
    if (ones === 5) return s + " lăm";
    return s + " " + d[ones];
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function formatDate(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function todayStr(date) {
    return formatDate(date || new Date());
  }

  function parseDate(s) {
    var p = String(s).split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function addDays(s, n) {
    var d = parseDate(s);
    d.setDate(d.getDate() + n);
    return formatDate(d);
  }

  /* Week starts Monday and ends Sunday. */
  function weekStart(s) {
    var d = parseDate(s);
    var day = d.getDay();
    var delta = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + delta);
    return formatDate(d);
  }

  function formatVi(s) {
    var d = parseDate(s);
    return d.getDate() + "/" + (d.getMonth() + 1);
  }

  var DOW = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
  var DOW_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  function appendKids(n, kids) {
    if (kids == null) return;
    var list = Array.isArray(kids) ? kids : [kids];
    list.forEach(function (c) {
      if (c == null || c === false) return;
      if (Array.isArray(c)) appendKids(n, c);
      else if (c && c.nodeType) n.appendChild(c);
      else n.appendChild(document.createTextNode(String(c)));
    });
  }

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === "class") n.className = v;
        else if (k === "text") n.textContent = v;
        else if (k === "style" && typeof v === "object") Object.assign(n.style, v);
        else if (k.slice(0, 2) === "on" && typeof v === "function") {
          n.addEventListener(k.slice(2).toLowerCase(), v);
        } else n.setAttribute(k, v === true ? "" : String(v));
      });
    }
    if (tag === "button" && !n.hasAttribute("type")) n.type = "button";
    appendKids(n, kids);
    return n;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function starText(n) {
    var s = "";
    var v = Math.max(0, Math.round(Number(n) || 0));
    var shown = Math.min(v, 3);
    for (var i = 0; i < 3; i++) s += i < shown ? "★" : "☆";
    if (v > 3) return s + " " + v;
    return s;
  }

  HV.util = {
    rnd: rnd,
    pick: pick,
    shuffle: shuffle,
    clamp: clamp,
    readNumber: readNumber,
    todayStr: todayStr,
    parseDate: parseDate,
    formatDate: formatDate,
    addDays: addDays,
    weekStart: weekStart,
    formatVi: formatVi,
    DOW: DOW,
    DOW_SHORT: DOW_SHORT,
    el: el,
    clear: clear,
    starText: starText
  };
})(globalThis.HV = globalThis.HV || {});
