(function (HV) {
  "use strict";

  /* Paper worksheet "Bé ôn luyện trí tuệ".
     Stars stay on this screen. Nothing here is saved. */

  var U = HV.util;
  var el = U.el;

  function roundStars(child, first, total) {
    var base = 0;
    if (total && first > 0) {
      var ratio = first / total;
      base = ratio >= 0.999 ? 3 : ratio >= 0.6 ? 2 : 1;
    }
    if (child !== "mon") {
      var easy = total && first >= total ? 1 : 0;
      return {
        stars: easy,
        note: easy ? "Bài dễ chỉ được 1 sao khi đúng hết cả bài." : "Bài dễ cần đúng hết mới có 1 sao."
      };
    }
    return {
      stars: base * 2,
      note: base ? "Nhiều sao ×2 vì bài này khó hơn." : ""
    };
  }

  function say(text, chain) {
    if (!text || !HV.speech) return Promise.resolve(0);
    var job = HV.speech.speak(text, { lang: "vi", chain: !!chain });
    return Promise.resolve(job).then(function (sec) {
      return typeof sec === "number" && sec > 0 ? sec : 0.8;
    }).catch(function () { return 0.8; });
  }

  function renderIf(bag) {
    if (bag.on() && HV.ui && HV.ui.render) HV.ui.render();
  }

  function afterSound(bag, play, then) {
    var dur = 0;
    try { dur = play ? play() || 0 : 0; } catch (err) { dur = 0; }
    var e = bag.epoch;
    setTimeout(function () {
      if (e !== bag.epoch || !bag.session || !bag.on()) return;
      then();
    }, Math.round(dur * 1000) + 40);
  }

  function praiseThen(bag, then) {
    var voice = HV.engine && HV.engine.shouldVoicePraise && HV.engine.shouldVoicePraise();
    var line = voice && HV.engine.praise ? HV.engine.praise(bag.session.child, "vi") : "";
    bag.session.banner = line || "";
    renderIf(bag);
    var job = line ? say(line) : Promise.resolve(0.12);
    var e = bag.epoch;
    job.then(function (sec) {
      if (e !== bag.epoch || !bag.session || !bag.on()) return;
      setTimeout(function () {
        if (e !== bag.epoch || !bag.session || !bag.on()) return;
        then();
      }, line ? Math.max(420, Math.round((sec || 0.4) * 1000) + 160) : 160);
    });
  }

  function topbar(child, title, sub, onBack, onSpeak) {
    return el("header", { class: "topbar" }, [
      el("button", { class: "icon-btn", text: "←", "aria-label": "Quay lại", onClick: onBack }),
      el("div", { class: "top-title" }, [
        el("strong", { text: title }),
        el("span", { text: sub })
      ]),
      onSpeak
        ? el("button", {
          class: "icon-btn speak-btn",
          text: "🗣️",
          "aria-label": "Nghe lại",
          onClick: onSpeak
        })
        : el("span", { class: "icon-spacer" })
    ]);
  }

  function doneView(bag, title, noun, onReplay) {
    var child = bag.session.child;
    var award = bag.session.award || roundStars(child, bag.session.firsts, bag.session.total);
    var root = el("section", { class: "play", "data-activity": bag.name, "data-phase": "done" });
    root.appendChild(topbar(child, "Xong bài rồi", "", function () { bag.leave("#/c/" + child); }, null));
    var frame = el("div", { class: "result-photo is-" + child });
    frame.appendChild(el("span", { class: "spark spark-a", text: "✦" }));
    frame.appendChild(el("img", { class: "avatar", src: "assets/kids/" + child + ".webp", alt: "" }));
    frame.appendChild(el("span", { class: child === "gin" ? "deco-cape" : "deco-crown", text: child === "gin" ? "🦸" : "👑" }));
    var cast = el("div", { class: "result-art" });
    cast.appendChild(frame);
    if (HV.art) cast.appendChild(child === "mon" ? HV.art.puppy() : HV.art.car());
    root.appendChild(cast);
    root.appendChild(el("p", { class: "result-stars", text: U.starText(award.stars) }));
    root.appendChild(el("p", { class: "lede", text: "Đúng lần đầu " + bag.session.firsts + "/" + bag.session.total + " " + noun + "." }));
    if (award.note) root.appendChild(el("p", { class: "lede", text: award.note }));
    root.appendChild(el("p", { class: "fine", text: "Sao của bài chơi, không cộng vào sổ." }));
    root.appendChild(el("div", { class: "result-actions" }, [
      el("button", { class: "btn btn-primary", text: "Chơi lại", onClick: onReplay }),
      el("button", { class: "btn", text: "Về nhà", onClick: function () { bag.leave("#/c/" + child); } })
    ]));
    return root;
  }

  function played(child, id) {
    return HV.fresh && HV.fresh.done(child, id);
  }

  function markPlayed(child, id) {
    if (HV.storage && HV.storage.markPlayed) HV.storage.markPlayed(child, id);
  }

  function entryCard(child, id, klass, icon, title, text) {
    var done = played(child, id);
    return el("button", {
      class: "week-card " + klass + (done ? " is-played" : " is-new"),
      "data-go": "#/" + id + "/" + child,
      "data-state": done ? "played" : "new"
    }, [
      el("span", { class: "ex-icon act-icon", "aria-hidden": "true", text: icon }),
      done ? null : el("span", { class: "pay-badge", text: "Mới" }),
      el("h2", { text: title }),
      el("p", { text: text })
    ]);
  }

  function entryLesson(child, id, icon, title, text) {
    var done = played(child, id);
    return el("button", {
      class: "ex-card" + (done ? " is-played" : " is-new"),
      "data-go": "#/" + id + "/" + child,
      "data-state": done ? "played" : "new"
    }, [
      el("span", { class: "ex-icon", text: icon }),
      el("span", { class: "ex-copy" }, [
        el("strong", { text: title }),
        el("small", { text: text })
      ])
    ]);
  }

  function makeBag(name, hashPrefix) {
    return {
      name: name,
      epoch: 0,
      session: null,
      on: function () { return (location.hash || "").indexOf(hashPrefix) === 0; },
      leave: function (hash) {
        this.epoch += 1;
        this.session = null;
        if (hash) location.hash = hash;
      }
    };
  }

  function html(tag, attrs, markup) {
    var node = el(tag, attrs);
    node.innerHTML = markup;
    return node;
  }

  function svgEl(markup) {
    var wrap = document.createElement("div");
    wrap.innerHTML = markup;
    return wrap.firstChild;
  }

  /* ---------- Ngôi nhà số ---------- */

  var HOUSE_MON = [
    { id: "h4a", roof: 4, given: 1, answer: 3, side: "right" },
    { id: "h4b", roof: 4, given: 4, answer: 0, side: "right" },
    { id: "h5a", roof: 5, given: 2, answer: 3, side: "right" },
    { id: "h5b", roof: 5, given: 0, answer: 5, side: "right" },
    { id: "h6a", roof: 6, given: 4, answer: 2, side: "right" },
    { id: "h6b", roof: 6, given: 6, answer: 0, side: "right" },
    { id: "h7", roof: 7, given: 3, answer: 4, side: "right" },
    { id: "h8", roof: 8, given: 5, answer: 3, side: "right" },
    { id: "h9", roof: 9, given: 1, answer: 8, side: "right" },
    { id: "h10", roof: 10, given: 7, answer: 3, side: "right" }
  ];

  var HOUSE_GIN = [
    { id: "g2", roof: 2, given: 1, answer: 1, side: "right", emoji: "⭐" },
    { id: "g3a", roof: 3, given: 2, answer: 1, side: "right", emoji: "🍎" },
    { id: "g3b", roof: 3, given: 0, answer: 3, side: "right", emoji: "🚗" },
    { id: "g4a", roof: 4, given: 1, answer: 3, side: "right", emoji: "🌸" },
    { id: "g4b", roof: 4, given: 3, answer: 1, side: "right", emoji: "⭐" }
  ];

  function houseAsk(q) {
    return q.given + " cộng bao nhiêu bằng " + q.roof + "?";
  }

  function houseExplain(q) {
    var ask = houseAsk(q);
    if (q.answer === 0) return ask + " Không thêm. " + q.given + " cộng 0 bằng " + q.roof + ".";
    var steps = [];
    var n;
    for (n = q.given + 1; n <= q.roof; n++) steps.push(String(n));
    return ask + " Đếm thêm: " + steps.join(", ") + ". " + q.given + " cộng " + q.answer + " bằng " + q.roof + ".";
  }

  function houseExamples(roof, given, count) {
    var pairs = [];
    var a;
    for (a = 0; a <= roof && pairs.length < count; a++) {
      if (a === given) continue;
      var other = roof - a;
      if (a > 9 || other > 9) continue;
      pairs.push([a, other]);
    }
    if (pairs.length < count) {
      for (a = 0; a <= roof && pairs.length < count; a++) {
        if (a === given) continue;
        pairs.push([a, roof - a]);
      }
    }
    return pairs;
  }

  function houseCell(n, emoji, blank) {
    if (blank) return el("span", { class: "house-blank", text: "?" });
    if (!emoji || !n) return el("b", { text: String(n) });
    var pics = el("span", { class: "house-pics", "aria-hidden": "true" });
    var i;
    for (i = 0; i < n; i++) pics.appendChild(el("i", { text: emoji }));
    return el("span", { class: "house-fig" }, [
      pics,
      el("b", { text: String(n) })
    ]);
  }

  function houseFloor(left, right, emoji, askSide) {
    return el("div", { class: "house-floor" + (askSide ? " is-ask" : "") }, [
      houseCell(left, emoji, askSide === "left"),
      el("span", { class: "house-plus", text: "+" }),
      houseCell(right, emoji, askSide === "right")
    ]);
  }

  var nha = makeBag("nha-so", "#/nha-so/");

  function nhaCurrent() {
    return nha.session.items[nha.session.index];
  }

  function nhaBegin(child) {
    nha.epoch += 1;
    var bank = child === "gin" ? HOUSE_GIN : HOUSE_MON;
    nha.session = {
      child: child,
      items: U.shuffle(bank),
      index: 0,
      attempts: 0,
      firsts: 0,
      total: bank.length,
      phase: "play",
      mark: null,
      banner: "",
      busy: false
    };
    if (HV.engine && HV.engine.beginSessionPraise) HV.engine.beginSessionPraise();
    say("Điền số thích hợp vào mỗi ngôi nhà.").then(function () {
      if (!nha.session || nha.session.child !== child) return;
      return say(houseAsk(nhaCurrent()), true);
    });
  }

  function nhaAdvance() {
    var s = nha.session;
    if (!s) return;
    s.index += 1;
    s.attempts = 0;
    s.phase = "play";
    s.mark = null;
    s.banner = "";
    s.busy = false;
    if (s.index >= s.items.length) {
      s.phase = "done";
      s.award = roundStars(s.child, s.firsts, s.total);
      markPlayed(s.child, "nha-so");
      if (HV.audio && HV.audio.fanfare) HV.audio.fanfare();
      renderIf(nha);
      return;
    }
    renderIf(nha);
    say(houseAsk(nhaCurrent()));
  }

  function nhaGrade(value) {
    var s = nha.session;
    if (!s || s.busy || s.phase !== "play") return;
    var q = nhaCurrent();
    if (Number(value) === q.answer) {
      s.busy = true;
      if (s.attempts === 0) s.firsts += 1;
      s.mark = { good: String(value) };
      renderIf(nha);
      afterSound(nha, HV.audio && HV.audio.correct, function () { praiseThen(nha, nhaAdvance); });
      return;
    }
    s.attempts += 1;
    if (s.child === "gin" && s.attempts < 2) {
      s.mark = { bad: String(value) };
      s.banner = "Thử lại nhé";
      if (HV.audio && HV.audio.wrong) HV.audio.wrong();
      say("Thử lại nhé");
      renderIf(nha);
      return;
    }
    s.phase = "explain";
    s.busy = true;
    s.mark = { good: String(q.answer), bad: String(value) };
    if (HV.audio && HV.audio.wrong) HV.audio.wrong();
    say(houseExplain(q));
    renderIf(nha);
  }

  function nhaPlay() {
    var s = nha.session;
    var q = nhaCurrent();
    var child = s.child;
    var locked = s.busy || s.phase === "explain";
    var root = el("section", {
      class: "play stage ws-play is-" + child,
      "data-activity": "nha-so",
      "data-q": q.id,
      "data-roof": String(q.roof),
      "data-given": String(q.given)
    });
    root.appendChild(topbar(child, "Ngôi nhà số", "Câu " + (s.index + 1) + "/" + s.total, function () {
      nha.leave("#/c/" + child);
    }, function () {
      say(s.phase === "explain" ? houseExplain(q) : houseAsk(q));
    }));
    root.appendChild(el("p", { class: "prompt", text: houseAsk(q) }));
    var examples = houseExamples(q.roof, q.given, child === "gin" ? 1 : 2);
    var floors = el("div", { class: "house-floors" });
    if (examples[0]) floors.appendChild(houseFloor(examples[0][0], examples[0][1], q.emoji, ""));
    var left = q.side === "left" ? null : q.given;
    var right = q.side === "right" ? null : q.given;
    floors.appendChild(houseFloor(left, right, q.emoji, q.side));
    if (examples[1]) floors.appendChild(houseFloor(examples[1][0], examples[1][1], q.emoji, ""));
    var roofKids = [el("b", { text: String(q.roof) })];
    if (q.emoji) {
      var mini = el("span", { class: "house-pics is-mini", "aria-hidden": "true" });
      var i;
      for (i = 0; i < q.roof; i++) mini.appendChild(el("i", { text: q.emoji }));
      roofKids.push(mini);
    }
    root.appendChild(el("div", { class: "house" }, [
      el("div", { class: "house-roof" }, roofKids),
      floors
    ]));
    if (s.banner && s.phase !== "explain") {
      root.appendChild(el("p", { class: "tan-banner", role: "status", text: s.banner }));
    }
    var pad = el("div", { class: "ws-pad", "aria-label": "Chọn số" });
    var n;
    for (n = 0; n <= q.roof; n++) {
      (function (num) {
        var mark = s.mark || {};
        var cls = "choice";
        if (mark.good != null && String(num) === String(mark.good)) cls += " is-correct";
        if (mark.bad != null && String(num) === String(mark.bad)) cls += " is-wrong";
        var body = [el("span", { class: "choice-text", text: String(num) })];
        if (q.emoji) {
          var pics = el("span", { class: "house-pics", "aria-hidden": "true" });
          var k;
          for (k = 0; k < num; k++) pics.appendChild(el("i", { text: q.emoji }));
          body.unshift(pics);
        }
        pad.appendChild(el("button", {
          class: cls,
          "data-pick": String(num),
          disabled: locked ? true : null,
          "aria-label": String(num),
          onClick: function () { nhaGrade(num); }
        }, body));
      })(n);
    }
    root.appendChild(pad);
    if (s.phase === "explain") {
      var hops = el("div", { class: "hop-line", "aria-hidden": "true" });
      var h;
      for (h = q.given; h <= q.roof; h++) hops.appendChild(el("i", { class: h === q.given ? "is-start" : "", text: String(h) }));
      var box = el("div", { class: "feedback is-bad", role: "status" }, [
        el("strong", { text: "Chưa đúng" }),
        el("p", { text: houseExplain(q) }),
        hops,
        el("button", { class: "btn btn-next", text: "Hiểu rồi", onClick: nhaAdvance })
      ]);
      root.appendChild(box);
    }
    return root;
  }

  function nhaView(child) {
    if (nha.session && nha.session.child !== child) {
      nha.epoch += 1;
      nha.session = null;
    }
    if (!nha.session) nhaBegin(child);
    if (nha.session.phase === "done") {
      return doneView(nha, "Ngôi nhà số", "câu", function () {
        var who = child;
        nha.epoch += 1;
        nha.session = null;
        nhaBegin(who);
        renderIf(nha);
      });
    }
    return nhaPlay();
  }

  function nhaLines() {
    var lines = ["Điền số thích hợp vào mỗi ngôi nhà.", "Thử lại nhé"];
    HOUSE_MON.concat(HOUSE_GIN).forEach(function (q) {
      lines.push(houseAsk(q));
      lines.push(houseExplain(q));
    });
    return lines;
  }

  function nhaAudit() {
    var problems = [];
    if (HOUSE_MON.length !== 10) problems.push("mon " + HOUSE_MON.length);
    if (HOUSE_GIN.length < 4 || HOUSE_GIN.length > 6) problems.push("gin " + HOUSE_GIN.length);
    HOUSE_MON.forEach(function (q) {
      if (q.roof < 4 || q.roof > 10) problems.push(q.id + " roof");
      if (q.given < 0 || q.given > 9 || q.answer < 0 || q.answer > 9) problems.push(q.id + " digit");
      if (q.given + q.answer !== q.roof) problems.push(q.id + " sum");
      if (houseExamples(q.roof, q.given, 2).length < 2) problems.push(q.id + " floors");
    });
    var roofs = {};
    HOUSE_GIN.forEach(function (q) {
      roofs[q.roof] = true;
      if (q.roof < 2 || q.roof > 4) problems.push(q.id + " gin roof");
      if (q.given + q.answer !== q.roof) problems.push(q.id + " sum");
      if (!q.emoji) problems.push(q.id + " emoji");
    });
    if (!roofs[2] || !roofs[3] || !roofs[4]) problems.push("gin roofs");
    return problems;
  }

  HV.nhaSo = {
    card: function (child) {
      return entryCard(child, "nha-so", "house-entry", "🏠", "Ngôi nhà số", child === "gin"
        ? "Nhà 2, 3, 4 · chạm hình to"
        : "Điền số cho đủ mái · 10 câu");
    },
    lesson: function (child) {
      return entryLesson(child, "nha-so", "🏠", "Ngôi nhà số", child === "gin"
        ? "Hai tầng, hình to"
        : "Số trên mái, điền số còn thiếu");
    },
    view: nhaView,
    audit: nhaAudit,
    lines: nhaLines
  };

  /* ---------- Vẽ hình theo mã ---------- */

  var SHAPES = [
    { id: "cross", name: "dấu X", speak: "dấu X" },
    { id: "check", name: "dấu đúng", speak: "dấu đúng" },
    { id: "oval", name: "hình ô van", speak: "hình ô van" },
    { id: "triangle", name: "hình tam giác", speak: "hình tam giác" },
    { id: "heart", name: "trái tim", speak: "hình trái tim" },
    { id: "star", name: "ngôi sao", speak: "ngôi sao" },
    { id: "square", name: "hình vuông", speak: "hình vuông" },
    { id: "circle", name: "hình tròn", speak: "hình tròn" },
    { id: "moon", name: "mặt trăng", speak: "mặt trăng" },
    { id: "diamond", name: "hình thoi", speak: "hình thoi" }
  ];

  var GIN_SHAPE_IDS = ["circle", "triangle", "star", "heart", "square"];

  function shapeById(id) {
    var i;
    for (i = 0; i < SHAPES.length; i++) if (SHAPES[i].id === id) return SHAPES[i];
    return SHAPES[0];
  }

  function shapeSvg(id) {
    var body = {
      cross: '<path d="M22 16 L78 80 M78 16 L22 80" fill="none" stroke="#1d4e89" stroke-width="10" stroke-linecap="round"/>',
      check: '<path d="M20 50 L42 74 L88 24" fill="none" stroke="#178a4a" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>',
      oval: '<ellipse cx="54" cy="48" rx="36" ry="22" fill="#fde68a" stroke="#1d4e89" stroke-width="6"/>',
      triangle: '<path d="M54 12 L98 86 H10 Z" fill="#93c5fd" stroke="#1d4e89" stroke-width="6" stroke-linejoin="round"/>',
      heart: '<path d="M54 88 C18 58 14 32 30 24 c12-8 22 2 24 12 c2-10 12-20 24-12 c16 8 12 34-24 64z" fill="#fb7185" stroke="#9f1239" stroke-width="4"/>',
      star: '<path d="M54 8 L66 40 H100 L72 58 L82 92 L54 72 L26 92 L36 58 L8 40 H42 Z" fill="#f6d56a" stroke="#a16207" stroke-width="4" stroke-linejoin="round"/>',
      square: '<rect x="16" y="16" width="68" height="68" rx="8" fill="#86efac" stroke="#1d4e89" stroke-width="6"/>',
      circle: '<circle cx="54" cy="50" r="32" fill="#7ec8e3" stroke="#1d4e89" stroke-width="6"/>',
      moon: '<path d="M62 14 A34 34 0 1 0 62 86 A22 22 0 1 1 62 14 Z" fill="#f6d56a" stroke="#a16207" stroke-width="4"/>',
      diamond: '<path d="M54 8 L98 50 L54 92 L10 50 Z" fill="#c4b5fd" stroke="#1d4e89" stroke-width="6" stroke-linejoin="round"/>'
    }[id] || "";
    return '<svg viewBox="0 0 108 100" aria-hidden="true">' + body + "</svg>";
  }

  function shapeItems(map, count) {
    var nums = [];
    var n;
    var extra = [];
    for (n = 1; n <= map.length; n++) nums.push(n);
    while (nums.length < count) {
      if (!extra.length) extra = U.shuffle(nums.slice());
      nums.push(extra.pop());
    }
    return U.shuffle(nums).slice(0, count);
  }

  var ma = makeBag("ma-hinh", "#/ma-hinh/");

  function maCurrent() {
    return ma.session.items[ma.session.index];
  }

  function maSpeak(code) {
    return "Số " + code + ". Chạm hình đúng.";
  }

  function maExplain(code, shape) {
    return "Số " + code + " là " + shape.speak + ".";
  }

  function maBegin(child) {
    ma.epoch += 1;
    var gin = child === "gin";
    var pool = SHAPES.filter(function (shape) {
      return gin ? GIN_SHAPE_IDS.indexOf(shape.id) >= 0 : true;
    });
    var legend = U.shuffle(pool).slice(0, gin ? 3 : 5);
    var count = gin ? 5 : 10;
    ma.session = {
      child: child,
      legend: legend,
      items: shapeItems(legend, count),
      index: 0,
      attempts: 0,
      firsts: 0,
      total: count,
      phase: "play",
      stamp: "",
      mark: null,
      banner: "",
      busy: false
    };
    if (HV.engine && HV.engine.beginSessionPraise) HV.engine.beginSessionPraise();
    say("Vẽ hình theo mã.").then(function () {
      if (!ma.session || ma.session.child !== child) return;
      return say(maSpeak(maCurrent()), true);
    });
  }

  function maAdvance() {
    var s = ma.session;
    if (!s) return;
    s.index += 1;
    s.attempts = 0;
    s.phase = "play";
    s.stamp = "";
    s.mark = null;
    s.banner = "";
    s.busy = false;
    if (s.index >= s.items.length) {
      s.phase = "done";
      s.award = roundStars(s.child, s.firsts, s.total);
      markPlayed(s.child, "ma-hinh");
      if (HV.audio && HV.audio.fanfare) HV.audio.fanfare();
      renderIf(ma);
      return;
    }
    renderIf(ma);
    say(maSpeak(maCurrent()));
  }

  function maGrade(id) {
    var s = ma.session;
    if (!s || s.busy || s.phase !== "play") return;
    var code = maCurrent();
    var answer = s.legend[code - 1].id;
    s.stamp = id;
    if (id === answer) {
      s.busy = true;
      if (s.attempts === 0) s.firsts += 1;
      s.mark = { good: id };
      renderIf(ma);
      afterSound(ma, HV.audio && HV.audio.correct, function () { praiseThen(ma, maAdvance); });
      return;
    }
    s.attempts += 1;
    if (s.child === "gin" && s.attempts < 2) {
      s.mark = { bad: id };
      s.banner = "Thử lại nhé";
      if (HV.audio && HV.audio.wrong) HV.audio.wrong();
      say("Thử lại nhé");
      renderIf(ma);
      return;
    }
    s.phase = "explain";
    s.busy = true;
    s.mark = { good: answer, bad: id };
    s.stamp = answer;
    if (HV.audio && HV.audio.wrong) HV.audio.wrong();
    say(maExplain(code, shapeById(answer)));
    renderIf(ma);
  }

  function maPlay() {
    var s = ma.session;
    var code = maCurrent();
    var child = s.child;
    var locked = s.busy || s.phase === "explain";
    var answer = s.legend[code - 1];
    var root = el("section", {
      class: "play stage ws-play is-" + child,
      "data-activity": "ma-hinh",
      "data-code": String(code)
    });
    root.appendChild(topbar(child, "Vẽ hình theo mã", "Câu " + (s.index + 1) + "/" + s.total, function () {
      ma.leave("#/c/" + child);
    }, function () {
      say(s.phase === "explain" ? maExplain(code, answer) : maSpeak(code));
    }));
    root.appendChild(el("p", { class: "ws-kicker", text: "Mã hình" }));
    var legend = el("div", { class: "ws-legend" });
    s.legend.forEach(function (shape, index) {
      var num = index + 1;
      var mark = s.mark || {};
      var cls = "choice ws-stamp";
      if (mark.good && shape.id === mark.good) cls += " is-correct";
      if (mark.bad && shape.id === mark.bad) cls += " is-wrong";
      legend.appendChild(el("button", {
        class: cls,
        "data-code": String(num),
        "data-shape": shape.id,
        disabled: locked ? true : null,
        "aria-label": num + " " + shape.name,
        onClick: function () { maGrade(shape.id); }
      }, [
        el("b", { text: String(num) }),
        html("span", { class: "ws-glyph" }, shapeSvg(shape.id)),
        el("small", { text: shape.name })
      ]));
    });
    root.appendChild(legend);
    var frame = el("div", { class: "ws-frame", "data-code": String(code) });
    frame.appendChild(el("span", { class: "ws-code", text: String(code) }));
    if (s.stamp) frame.appendChild(html("div", { class: "ws-ink" }, shapeSvg(s.stamp)));
    else frame.appendChild(el("span", { class: "ws-wait", text: "Chạm hình" }));
    root.appendChild(frame);
    root.appendChild(el("p", { class: "prompt", text: "Số " + code + " vẽ hình gì?" }));
    if (s.banner && s.phase !== "explain") {
      root.appendChild(el("p", { class: "tan-banner", role: "status", text: s.banner }));
    }
    if (s.phase === "explain") {
      root.appendChild(el("div", { class: "feedback is-bad", role: "status" }, [
        el("strong", { text: "Chưa đúng" }),
        el("p", { text: maExplain(code, answer) }),
        el("button", { class: "btn btn-next", text: "Hiểu rồi", onClick: maAdvance })
      ]));
    }
    return root;
  }

  function maView(child) {
    if (ma.session && ma.session.child !== child) {
      ma.epoch += 1;
      ma.session = null;
    }
    if (!ma.session) maBegin(child);
    if (ma.session.phase === "done") {
      return doneView(ma, "Vẽ hình theo mã", "câu", function () {
        var who = child;
        ma.epoch += 1;
        ma.session = null;
        maBegin(who);
        renderIf(ma);
      });
    }
    return maPlay();
  }

  function maLines() {
    var lines = ["Vẽ hình theo mã.", "Thử lại nhé"];
    var n;
    SHAPES.forEach(function (shape) {
      for (n = 1; n <= 5; n++) {
        lines.push(maSpeak(n));
        lines.push(maExplain(n, shape));
      }
    });
    return lines;
  }

  function maAudit() {
    var problems = [];
    if (SHAPES.length < 8) problems.push("shapes");
    var ids = {};
    SHAPES.forEach(function (shape) {
      if (ids[shape.id]) problems.push("dup " + shape.id);
      ids[shape.id] = true;
      if (!shapeSvg(shape.id)) problems.push("svg " + shape.id);
    });
    GIN_SHAPE_IDS.forEach(function (id) {
      if (!ids[id]) problems.push("gin shape " + id);
    });
    var once = shapeItems(SHAPES.slice(0, 5), 10);
    if (once.length !== 10) problems.push("count");
    var seen = {};
    once.forEach(function (n) { seen[n] = true; });
    if (!seen[1] || !seen[5]) problems.push("cover");
    return problems;
  }

  HV.maHinh = {
    card: function (child) {
      return entryCard(child, "ma-hinh", "code-entry", "✏️", "Vẽ hình theo mã", child === "gin"
        ? "Ít hình, ô to"
        : "Nhìn mã, đóng hình · 10 câu");
    },
    lesson: function (child) {
      return entryLesson(child, "ma-hinh", "✏️", "Vẽ hình theo mã", child === "gin"
        ? "3 hình, chạm ô to"
        : "Mã số, rồi chọn hình");
    },
    view: maView,
    audit: maAudit,
    lines: maLines
  };

  /* ---------- Nối số ---------- */

  function starPts() {
    var pts = [];
    var i;
    for (i = 0; i < 10; i++) {
      var ang = (-90 + i * 36) * Math.PI / 180;
      var rad = i % 2 === 0 ? 136 : 64;
      pts.push([Math.round(160 + rad * Math.cos(ang)), Math.round(210 + rad * Math.sin(ang))]);
    }
    return pts;
  }

  var DOT_MON = [
    { id: "star", title: "Ngôi sao", speak: "Ngôi sao.", fill: "#f6d56a", pts: starPts() },
    {
      id: "crown",
      title: "Vương miện của Elsa",
      speak: "Vương miện.",
      fill: "#7ec8e3",
      pts: [[32, 320], [32, 210], [88, 100], [108, 250], [160, 44], [212, 250], [232, 100], [288, 210], [288, 320], [160, 380]]
    },
    {
      id: "pom",
      title: "Pom",
      speak: "Hình của Pom.",
      fill: "#f2c14e",
      pts: [[40, 180], [80, 280], [110, 170], [180, 110], [210, 44], [260, 100], [292, 160], [250, 220], [170, 300], [90, 390]]
    },
    {
      id: "butterfly",
      title: "Con bướm",
      speak: "Con bướm.",
      fill: "#c4b5fd",
      pts: [[160, 44], [36, 130], [100, 170], [28, 310], [108, 240], [160, 400], [212, 240], [292, 310], [220, 170], [284, 130]]
    },
    {
      id: "heart",
      title: "Trái tim",
      speak: "Trái tim.",
      fill: "#fb7185",
      pts: [[160, 112], [194, 44], [292, 58], [292, 198], [194, 328], [160, 396], [126, 328], [28, 198], [28, 58], [126, 44]]
    }
  ];

  var DOT_GIN = [
    {
      id: "car",
      title: "Chiếc xe",
      speak: "Chiếc xe.",
      fill: "#ef4444",
      pts: [[40, 320], [70, 150], [160, 80], [260, 160], [290, 340]]
    },
    {
      id: "shield",
      title: "Cái khiên",
      speak: "Cái khiên.",
      fill: "#60a5fa",
      pts: [[50, 50], [270, 50], [270, 200], [160, 380], [50, 200]]
    },
    {
      id: "dog",
      title: "Con chó",
      speak: "Con chó.",
      fill: "#f0b429",
      pts: [[40, 220], [110, 120], [200, 60], [290, 160], [150, 360]]
    }
  ];

  var dotCursor = { mon: 0, gin: 0 };
  var noi = makeBag("noi-so", "#/noi-so/");

  function dotMin(pts) {
    var best = 1e9;
    var i;
    var j;
    for (i = 0; i < pts.length; i++) {
      for (j = 0; j < i; j++) {
        var d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
        if (d < best) best = d;
      }
    }
    return best;
  }

  function dotBoard(pic, connected, hint, big) {
    var hit = big ? 34 : 24;
    var show = big ? 22 : 15;
    var parts = ['<svg class="ws-dotsvg" viewBox="0 0 320 440" role="img" aria-label="' + pic.title + '">'];
    if (connected >= pic.pts.length) {
      var poly = pic.pts.map(function (p) { return p[0] + "," + p[1]; }).join(" ");
      parts.push('<polygon points="' + poly + '" fill="' + pic.fill + '" opacity="0.45" stroke="none"/>');
    }
    if (connected >= 2) {
      var line = pic.pts.slice(0, connected).map(function (p) { return p[0] + "," + p[1]; }).join(" ");
      parts.push('<polyline points="' + line + '" fill="none" stroke="#1d4e89" stroke-width="' + (big ? 8 : 6) + '" stroke-linecap="round" stroke-linejoin="round"/>');
    }
    pic.pts.forEach(function (p, index) {
      var num = index + 1;
      var on = num <= connected;
      var hot = hint === num;
      parts.push('<g data-dot="' + num + '" role="button" aria-label="Số ' + num + '">');
      parts.push('<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + hit + '" fill="transparent"/>');
      parts.push('<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + show + '" fill="' + (on ? pic.fill : "#fff") + '" stroke="' + (hot ? "#c2410c" : "#1d4e89") + '" stroke-width="' + (hot ? 6 : 3) + '" pointer-events="none"/>');
      parts.push('<text x="' + p[0] + '" y="' + p[1] + '" text-anchor="middle" dominant-baseline="central" font-size="' + (big ? 22 : 16) + '" font-weight="800" fill="#1d4e89" pointer-events="none">' + num + "</text>");
      parts.push("</g>");
    });
    parts.push("</svg>");
    return parts.join("");
  }

  function noiBegin(child) {
    noi.epoch += 1;
    var list = child === "gin" ? DOT_GIN : DOT_MON;
    var pic = list[dotCursor[child] % list.length];
    noi.session = {
      child: child,
      pic: pic,
      connected: 0,
      missed: false,
      hint: 0,
      firsts: 0,
      total: pic.pts.length,
      phase: "play",
      banner: "",
      busy: false
    };
    if (HV.engine && HV.engine.beginSessionPraise) HV.engine.beginSessionPraise();
    say("Nối các số theo thứ tự.").then(function () {
      if (!noi.session || noi.session.child !== child) return;
      return say(pic.speak, true);
    }).then(function () {
      if (!noi.session || noi.session.child !== child) return;
      return say("Chạm số 1.", true);
    });
  }

  function noiFinish() {
    var s = noi.session;
    if (!s) return;
    dotCursor[s.child] += 1;
    s.phase = "done";
    s.award = roundStars(s.child, s.firsts, s.total);
    markPlayed(s.child, "noi-so");
    if (HV.audio && HV.audio.fanfare) HV.audio.fanfare();
    renderIf(noi);
  }

  function noiTap(num) {
    var s = noi.session;
    if (!s || s.busy || s.phase !== "play") return;
    if (num <= s.connected) return;
    var expect = s.connected + 1;
    if (num !== expect) {
      s.missed = true;
      s.hint = expect;
      s.banner = "Số tiếp theo là " + expect + ".";
      if (HV.audio && HV.audio.wrong) HV.audio.wrong();
      say(s.banner);
      renderIf(noi);
      return;
    }
    var first = !s.missed;
    s.missed = false;
    s.hint = 0;
    s.banner = "";
    s.connected += 1;
    if (first) s.firsts += 1;
    var done = s.connected >= s.total;
    if (done) s.busy = true;
    renderIf(noi);
    var voice = HV.engine && HV.engine.shouldVoicePraise && HV.engine.shouldVoicePraise();
    var line = voice && HV.engine.praise ? HV.engine.praise(s.child, "vi") : "";
    if (line) {
      s.banner = line;
      renderIf(noi);
      say(line);
    }
    if (HV.audio && HV.audio.correct) HV.audio.correct();
    if (!done) return;
    var e = noi.epoch;
    setTimeout(function () {
      if (e !== noi.epoch || !noi.session) return;
      noiFinish();
    }, line ? 1100 : 520);
  }

  function noiPlay() {
    var s = noi.session;
    var child = s.child;
    var pic = s.pic;
    var root = el("section", {
      class: "play stage ws-play ws-dots is-" + child,
      "data-activity": "noi-so",
      "data-pic": pic.id,
      "data-next": String(s.connected + 1)
    });
    root.appendChild(topbar(child, "Nối số", "Tìm số " + Math.min(s.total, s.connected + 1) + "/" + s.total, function () {
      noi.leave("#/c/" + child);
    }, function () {
      say(s.banner || pic.speak);
    }));
    root.appendChild(el("p", { class: "prompt", text: pic.title }));
    if (s.banner) root.appendChild(el("p", { class: "tan-banner", role: "status", text: s.banner }));
    var board = html("div", { class: "ws-board" }, dotBoard(pic, s.connected, s.hint, child === "gin"));
    board.addEventListener("click", function (event) {
      var node = event.target.closest ? event.target.closest("[data-dot]") : null;
      if (!node) return;
      noiTap(Number(node.getAttribute("data-dot")));
    });
    root.appendChild(board);
    return root;
  }

  function noiView(child) {
    if (noi.session && noi.session.child !== child) {
      noi.epoch += 1;
      noi.session = null;
    }
    if (!noi.session) noiBegin(child);
    if (noi.session.phase === "done") {
      var done = doneView(noi, "Nối số", "chấm", function () {
        var who = child;
        noi.epoch += 1;
        noi.session = null;
        noiBegin(who);
        renderIf(noi);
      });
      done.insertBefore(html("div", { class: "ws-board is-done" }, dotBoard(noi.session.pic, noi.session.pic.pts.length, 0, child === "gin")), done.querySelector(".result-stars"));
      return done;
    }
    return noiPlay();
  }

  function noiLines() {
    var lines = ["Nối các số theo thứ tự.", "Chạm số 1."];
    var n;
    DOT_MON.concat(DOT_GIN).forEach(function (pic) { lines.push(pic.speak); });
    for (n = 1; n <= 10; n++) {
      lines.push("Chạm số " + n + ".");
      lines.push("Số tiếp theo là " + n + ".");
    }
    return lines;
  }

  function noiAudit() {
    var problems = [];
    if (DOT_MON.length < 4) problems.push("mon pics");
    DOT_MON.forEach(function (pic) {
      if (pic.pts.length !== 10) problems.push(pic.id + " dots " + pic.pts.length);
      var gap = dotMin(pic.pts);
      if (gap < 64) problems.push(pic.id + " gap " + gap.toFixed(0));
      pic.pts.forEach(function (p, index) {
        if (p[0] < 16 || p[0] > 304 || p[1] < 16 || p[1] > 424) problems.push(pic.id + " edge " + index);
      });
    });
    if (DOT_GIN.length !== 3) problems.push("gin pics");
    DOT_GIN.forEach(function (pic) {
      if (pic.pts.length !== 5) problems.push(pic.id + " dots");
      var gap = dotMin(pic.pts);
      if (gap < 90) problems.push(pic.id + " gap " + gap.toFixed(0));
    });
    return problems;
  }

  HV.noiSo = {
    card: function (child) {
      return entryCard(child, "noi-so", "dot-entry", "🔢", "Nối số", child === "gin"
        ? "Nối 1 đến 5 · xe, khiên, chó"
        : "Nối 1 đến 10 · Pom, Elsa, sao");
    },
    lesson: function (child) {
      return entryLesson(child, "noi-so", "🔢", "Nối số", child === "gin"
        ? "Chấm to, nối 1 đến 5"
        : "Nối theo thứ tự, hiện hình");
    },
    view: noiView,
    audit: noiAudit,
    lines: noiLines
  };

  /* ---------- Đếm tranh ---------- */

  var KIND = {
    tree: { name: "cây" },
    flower: { name: "bông hoa" },
    butterfly: { name: "con bướm" },
    bee: { name: "con ong" },
    ladybug: { name: "bọ rùa" },
    duck: { name: "con vịt" },
    fish: { name: "con cá" },
    lotus: { name: "bông sen" },
    frog: { name: "con ếch" },
    dragonfly: { name: "con chuồn chuồn" },
    cloud: { name: "đám mây" },
    bird: { name: "con chim" },
    star: { name: "ngôi sao" },
    sun: { name: "mặt trời" },
    balloon: { name: "quả bóng bay" },
    book: { name: "quyển sách" },
    ball: { name: "quả bóng" },
    car: { name: "chiếc xe" },
    bear: { name: "gấu bông" },
    lamp: { name: "chiếc đèn" }
  };

  function icon(kind) {
    var body = {
      tree: '<rect x="28" y="38" width="8" height="20" rx="2" fill="#a16207"/><path d="M32 6 L54 40 H10 Z" fill="#16a34a"/>',
      flower: '<circle cx="32" cy="18" r="8" fill="#f9a8d4"/><circle cx="16" cy="30" r="8" fill="#fb7185"/><circle cx="48" cy="30" r="8" fill="#fb7185"/><circle cx="22" cy="46" r="8" fill="#f472b6"/><circle cx="42" cy="46" r="8" fill="#f472b6"/><circle cx="32" cy="32" r="7" fill="#facc15"/>',
      butterfly: '<ellipse cx="18" cy="28" rx="14" ry="10" fill="#c4b5fd"/><ellipse cx="46" cy="28" rx="14" ry="10" fill="#c4b5fd"/><ellipse cx="18" cy="44" rx="12" ry="9" fill="#a78bfa"/><ellipse cx="46" cy="44" rx="12" ry="9" fill="#a78bfa"/><rect x="29" y="16" width="6" height="32" rx="3" fill="#1d4e89"/>',
      bee: '<ellipse cx="32" cy="34" rx="16" ry="12" fill="#facc15" stroke="#1d4e89" stroke-width="3"/><path d="M24 28 H40 M24 36 H40" stroke="#1d4e89" stroke-width="3"/><ellipse cx="16" cy="24" rx="8" ry="5" fill="#e0f2fe"/><ellipse cx="48" cy="24" rx="8" ry="5" fill="#e0f2fe"/>',
      ladybug: '<ellipse cx="32" cy="36" rx="18" ry="16" fill="#ef4444"/><path d="M32 20 V52" stroke="#1d4e89" stroke-width="3"/><circle cx="24" cy="32" r="3" fill="#1d4e89"/><circle cx="40" cy="34" r="3" fill="#1d4e89"/><circle cx="28" cy="44" r="3" fill="#1d4e89"/><circle cx="32" cy="16" r="8" fill="#1d4e89"/>',
      duck: '<ellipse cx="30" cy="38" rx="18" ry="12" fill="#fde68a"/><circle cx="46" cy="28" r="9" fill="#fde68a"/><path d="M52 28 H62 L54 34 Z" fill="#fb923c"/>',
      fish: '<ellipse cx="30" cy="34" rx="16" ry="10" fill="#38bdf8"/><path d="M44 34 L58 24 V44 Z" fill="#0284c7"/><circle cx="22" cy="32" r="2" fill="#1d4e89"/>',
      lotus: '<ellipse cx="32" cy="40" rx="8" ry="14" fill="#f9a8d4"/><ellipse cx="20" cy="36" rx="8" ry="12" fill="#fb7185"/><ellipse cx="44" cy="36" rx="8" ry="12" fill="#fb7185"/><circle cx="32" cy="34" r="4" fill="#facc15"/>',
      frog: '<ellipse cx="32" cy="38" rx="16" ry="12" fill="#4ade80"/><circle cx="20" cy="22" r="7" fill="#4ade80"/><circle cx="44" cy="22" r="7" fill="#4ade80"/><circle cx="20" cy="22" r="3" fill="#1d4e89"/><circle cx="44" cy="22" r="3" fill="#1d4e89"/>',
      dragonfly: '<rect x="30" y="16" width="4" height="34" rx="2" fill="#0f766e"/><ellipse cx="18" cy="26" rx="12" ry="6" fill="#99f6e4"/><ellipse cx="46" cy="26" rx="12" ry="6" fill="#99f6e4"/><ellipse cx="18" cy="38" rx="10" ry="5" fill="#5eead4"/><ellipse cx="46" cy="38" rx="10" ry="5" fill="#5eead4"/>',
      cloud: '<ellipse cx="24" cy="36" rx="12" ry="8" fill="#fff"/><ellipse cx="40" cy="34" rx="14" ry="10" fill="#fff"/><ellipse cx="32" cy="28" rx="10" ry="8" fill="#fff"/>',
      bird: '<path d="M8 36 Q24 16 40 32 Q28 28 18 40 Z" fill="#1d4e89"/><path d="M36 32 Q52 18 58 34 Q46 30 34 40 Z" fill="#334155"/>',
      star: '<path d="M32 6 L38 24 H58 L42 34 L48 54 L32 42 L16 54 L22 34 L6 24 H26 Z" fill="#f6d56a" stroke="#a16207" stroke-width="2"/>',
      sun: '<circle cx="32" cy="32" r="12" fill="#facc15"/><path d="M32 6 V14 M32 50 V58 M6 32 H14 M50 32 H58 M14 14 L20 20 M44 44 L50 50 M50 14 L44 20 M20 44 L14 50" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>',
      balloon: '<ellipse cx="32" cy="26" rx="14" ry="16" fill="#fb7185"/><path d="M32 42 L32 58" stroke="#1d4e89" stroke-width="2"/>',
      book: '<path d="M10 16 H32 V52 H10 Z" fill="#93c5fd"/><path d="M32 16 H54 V52 H32 Z" fill="#60a5fa"/><path d="M32 16 V52" stroke="#1d4e89" stroke-width="3"/>',
      ball: '<circle cx="32" cy="32" r="16" fill="#fb923c"/><path d="M16 32 H48 M32 16 C24 24 24 40 32 48 M32 16 C40 24 40 40 32 48" fill="none" stroke="#fff" stroke-width="2"/>',
      car: '<rect x="8" y="28" width="48" height="16" rx="6" fill="#ef4444"/><path d="M16 28 L22 16 H42 L48 28" fill="#fb7185"/><circle cx="18" cy="46" r="5" fill="#1d4e89"/><circle cx="46" cy="46" r="5" fill="#1d4e89"/>',
      bear: '<circle cx="32" cy="36" r="14" fill="#d97706"/><circle cx="16" cy="20" r="7" fill="#d97706"/><circle cx="48" cy="20" r="7" fill="#d97706"/><circle cx="26" cy="34" r="2" fill="#1d4e89"/><circle cx="38" cy="34" r="2" fill="#1d4e89"/>',
      lamp: '<path d="M32 8 V18" stroke="#a16207" stroke-width="3"/><path d="M18 18 H46 L40 36 H24 Z" fill="#fde68a" stroke="#f59e0b" stroke-width="3"/><rect x="28" y="36" width="8" height="16" fill="#a16207"/>'
    }[kind] || "";
    return '<svg viewBox="0 0 64 64" aria-hidden="true">' + body + "</svg>";
  }

  function place(col, row, cols) {
    var span = cols === 3 ? 32 : 20;
    var origin = cols === 3 ? 18 : 10;
    var top0 = cols === 3 ? 22 : 20;
    var v = cols === 3 ? 30 : 30;
    return { left: origin + col * span, top: top0 + row * v };
  }

  function buildScene(id, title, speak, tone, cols, spots) {
    var items = spots.map(function (spot, index) {
      var at = place(spot[1], spot[2], cols);
      return { id: id + "-" + index, kind: spot[0], left: at.left, top: at.top };
    });
    var order = [];
    var seen = {};
    spots.forEach(function (spot) {
      if (seen[spot[0]]) return;
      seen[spot[0]] = true;
      order.push(spot[0]);
    });
    return { id: id, title: title, speak: speak, tone: tone, items: items, order: order };
  }

  var SCENES = {
    garden: buildScene("garden", "Vườn", "Đếm trong vườn.", "garden", 5, [
      ["tree", 0, 0], ["flower", 1, 0], ["tree", 2, 0], ["butterfly", 3, 0], ["tree", 4, 0],
      ["butterfly", 0, 1], ["bee", 1, 1], ["flower", 2, 1], ["ladybug", 3, 1], ["butterfly", 4, 1],
      ["flower", 0, 2], ["ladybug", 1, 2], ["bee", 2, 2], ["flower", 3, 2], ["ladybug", 4, 2]
    ]),
    pond: buildScene("pond", "Ao", "Đếm ở ao.", "pond", 5, [
      ["duck", 0, 0], ["fish", 1, 0], ["duck", 2, 0], ["dragonfly", 3, 0], ["duck", 4, 0],
      ["lotus", 0, 1], ["frog", 1, 1], ["fish", 2, 1], ["duck", 3, 1], ["dragonfly", 4, 1],
      ["dragonfly", 0, 2], ["fish", 1, 2], ["lotus", 2, 2], ["frog", 3, 2], ["lotus", 4, 2]
    ]),
    sky: buildScene("sky", "Bầu trời", "Đếm trên trời.", "sky", 5, [
      ["cloud", 0, 0], ["bird", 1, 0], ["star", 2, 0], ["sun", 3, 0], ["balloon", 4, 0],
      ["cloud", 0, 1], ["star", 1, 1], ["bird", 2, 1], ["star", 3, 1], ["bird", 4, 1],
      ["balloon", 0, 2], ["star", 1, 2], ["cloud", 2, 2], ["bird", 3, 2], ["star", 4, 2]
    ]),
    room: buildScene("room", "Phòng", "Đếm trong phòng.", "room", 5, [
      ["book", 0, 0], ["ball", 1, 0], ["car", 2, 0], ["bear", 3, 0], ["lamp", 4, 0],
      ["book", 0, 1], ["ball", 1, 1], ["bear", 2, 1], ["lamp", 3, 1], ["book", 4, 1],
      ["ball", 0, 2], ["car", 1, 2], ["bear", 2, 2], ["lamp", 3, 2], ["book", 4, 2]
    ]),
    tiny: buildScene("tiny", "Ao nhỏ", "Đếm ở ao.", "tiny", 3, [
      ["duck", 0, 0], ["duck", 1, 0], ["flower", 2, 0],
      ["duck", 0, 1], ["flower", 1, 1], ["butterfly", 2, 1],
      ["fish", 0, 2], ["butterfly", 1, 2], ["sun", 2, 2]
    ])
  };

  var COUNT_PACKS = [["garden", "pond"], ["sky", "room"]];
  var countPack = 0;
  var dem = makeBag("dem-tranh", "#/dem-tranh/");

  function countOf(scene, kind) {
    return scene.items.filter(function (item) { return item.kind === kind; }).length;
  }

  function countQuestions(sceneIds) {
    var list = [];
    sceneIds.forEach(function (id) {
      var scene = SCENES[id];
      scene.order.forEach(function (kind) {
        list.push({
          scene: id,
          kind: kind,
          count: countOf(scene, kind),
          name: KIND[kind].name
        });
      });
    });
    return list;
  }

  function countSpeak(q, child) {
    if (child === "gin") return "Chạm từng " + q.name + ".";
    return "Đếm các " + q.name + ". Có bao nhiêu?";
  }

  function countExplain(q) {
    var seq = [];
    var i;
    for (i = 1; i <= q.count; i++) seq.push(String(i));
    return seq.join(", ") + ". Có " + q.count + " " + q.name + ".";
  }

  function demCurrent() {
    return dem.session.items[dem.session.index];
  }

  function demBegin(child) {
    dem.epoch += 1;
    var ids = child === "gin" ? ["tiny"] : COUNT_PACKS[countPack % COUNT_PACKS.length];
    if (child !== "gin") countPack += 1;
    var items = countQuestions(ids);
    dem.session = {
      child: child,
      items: items,
      index: 0,
      attempts: 0,
      firsts: 0,
      total: items.length,
      phase: "play",
      tapped: {},
      missed: false,
      mark: null,
      banner: "",
      busy: false
    };
    if (HV.engine && HV.engine.beginSessionPraise) HV.engine.beginSessionPraise();
    var q = items[0];
    say("Đếm và điền số thích hợp.").then(function () {
      if (!dem.session || dem.session.child !== child) return;
      return say(SCENES[q.scene].speak, true);
    }).then(function () {
      if (!dem.session || dem.session.child !== child) return;
      return say(countSpeak(q, child), true);
    });
  }

  function demAnnounce() {
    var s = dem.session;
    var q = demCurrent();
    var prev = s.index > 0 ? s.items[s.index - 1] : null;
    if (!prev || prev.scene !== q.scene) {
      say(SCENES[q.scene].speak).then(function () {
        if (!dem.session) return;
        return say(countSpeak(q, s.child), true);
      });
      return;
    }
    say(countSpeak(q, s.child));
  }

  function demAdvance() {
    var s = dem.session;
    if (!s) return;
    s.index += 1;
    s.attempts = 0;
    s.phase = "play";
    s.tapped = {};
    s.missed = false;
    s.mark = null;
    s.banner = "";
    s.busy = false;
    if (s.index >= s.items.length) {
      s.phase = "done";
      s.award = roundStars(s.child, s.firsts, s.total);
      markPlayed(s.child, "dem-tranh");
      if (HV.audio && HV.audio.fanfare) HV.audio.fanfare();
      renderIf(dem);
      return;
    }
    renderIf(dem);
    demAnnounce();
  }

  function demGrade(value) {
    var s = dem.session;
    if (!s || s.busy || s.phase !== "play") return;
    var q = demCurrent();
    if (Number(value) === q.count) {
      s.busy = true;
      if (s.attempts === 0) s.firsts += 1;
      s.mark = { good: String(value) };
      renderIf(dem);
      afterSound(dem, HV.audio && HV.audio.correct, function () { praiseThen(dem, demAdvance); });
      return;
    }
    s.attempts += 1;
    s.phase = "explain";
    s.busy = true;
    s.mark = { good: String(q.count), bad: String(value) };
    if (HV.audio && HV.audio.wrong) HV.audio.wrong();
    say(countExplain(q));
    renderIf(dem);
  }

  function demTapItem(item) {
    var s = dem.session;
    if (!s || s.busy || s.phase !== "play" || s.child !== "gin") return;
    var q = demCurrent();
    if (item.kind !== q.kind) {
      s.missed = true;
      s.banner = "Chạm từng " + q.name + ".";
      if (HV.audio && HV.audio.wrong) HV.audio.wrong();
      say(countSpeak(q, "gin"));
      renderIf(dem);
      return;
    }
    if (s.tapped[item.id]) return;
    s.tapped[item.id] = true;
    if (HV.audio && HV.audio.tap) HV.audio.tap();
    var got = Object.keys(s.tapped).length;
    if (got < q.count) {
      renderIf(dem);
      return;
    }
    s.busy = true;
    if (!s.missed) s.firsts += 1;
    renderIf(dem);
    afterSound(dem, HV.audio && HV.audio.correct, function () { praiseThen(dem, demAdvance); });
  }

  function demOrdinals(scene, kind) {
    var list = scene.items.filter(function (item) { return item.kind === kind; }).slice().sort(function (a, b) {
      if (a.top !== b.top) return a.top - b.top;
      return a.left - b.left;
    });
    var map = {};
    list.forEach(function (item, index) { map[item.id] = index + 1; });
    return map;
  }

  function demPlay() {
    var s = dem.session;
    var q = demCurrent();
    var child = s.child;
    var scene = SCENES[q.scene];
    var locked = s.busy || s.phase === "explain";
    var ordinals = s.phase === "explain" ? demOrdinals(scene, q.kind) : {};
    var root = el("section", {
      class: "play stage ws-play is-" + child,
      "data-activity": "dem-tranh",
      "data-scene": scene.id,
      "data-ask": q.kind
    });
    root.appendChild(topbar(child, "Đếm tranh", scene.title + " · " + (s.index + 1) + "/" + s.total, function () {
      dem.leave("#/c/" + child);
    }, function () {
      say(s.phase === "explain" ? countExplain(q) : countSpeak(q, child));
    }));
    var stage = el("div", { class: "ws-scene is-" + scene.tone });
    scene.items.forEach(function (item) {
      var attrs = {
        class: "ws-hit" + (item.kind === q.kind ? " is-on" : "") + (s.tapped[item.id] ? " is-got" : ""),
        style: { left: item.left + "%", top: item.top + "%" },
        "data-kind": item.kind,
        "data-id": item.id,
        "aria-label": KIND[item.kind].name
      };
      if (ordinals[item.id]) attrs["data-ord"] = String(ordinals[item.id]);
      var kids = [html("span", { class: "ws-icon" }, icon(item.kind))];
      if (child === "gin") {
        attrs.disabled = locked ? true : null;
        attrs.onClick = function () { demTapItem(item); };
        stage.appendChild(el("button", attrs, kids));
      } else stage.appendChild(el("span", attrs, kids));
    });
    root.appendChild(stage);
    var boxes = el("div", { class: "ws-boxes" });
    scene.order.forEach(function (kind) {
      var past = s.items.slice(0, s.index).filter(function (item) {
        return item.scene === scene.id && item.kind === kind;
      })[0];
      var on = kind === q.kind;
      var label = "?";
      if (past) label = String(past.count);
      else if (on && child === "gin") label = String(Object.keys(s.tapped).length);
      else if (on && s.phase === "explain") label = String(q.count);
      boxes.appendChild(el("div", { class: "ws-box" + (on ? " is-on" : "") + (past ? " is-done" : "") }, [
        html("span", { class: "ws-icon" }, icon(kind)),
        el("b", { text: label })
      ]));
    });
    root.appendChild(boxes);
    var prompt = child === "gin" ? "Chạm từng " + q.name + "." : "Có mấy " + q.name + "?";
    root.appendChild(el("p", { class: "prompt", text: prompt }));
    if (s.banner && s.phase !== "explain") {
      root.appendChild(el("p", { class: "tan-banner", role: "status", text: s.banner }));
    }
    if (child !== "gin") {
      var hi = 9;
      var pad = el("div", { class: "ws-pad" });
      var n;
      for (n = 0; n <= hi; n++) {
        (function (num) {
          var mark = s.mark || {};
          var cls = "choice";
          if (mark.good != null && String(num) === String(mark.good)) cls += " is-correct";
          if (mark.bad != null && String(num) === String(mark.bad)) cls += " is-wrong";
          pad.appendChild(el("button", {
            class: cls,
            "data-pick": String(num),
            disabled: locked ? true : null,
            "aria-label": String(num),
            onClick: function () { demGrade(num); }
          }, [el("span", { class: "choice-text", text: String(num) })]));
        })(n);
      }
      root.appendChild(pad);
    }
    if (s.phase === "explain") {
      root.appendChild(el("div", { class: "feedback is-bad", role: "status" }, [
        el("strong", { text: "Chưa đúng" }),
        el("p", { text: countExplain(q) }),
        el("button", { class: "btn btn-next", text: "Hiểu rồi", onClick: demAdvance })
      ]));
    }
    return root;
  }

  function demView(child) {
    if (dem.session && dem.session.child !== child) {
      dem.epoch += 1;
      dem.session = null;
    }
    if (!dem.session) demBegin(child);
    if (dem.session.phase === "done") {
      return doneView(dem, "Đếm tranh", "câu", function () {
        var who = child;
        dem.epoch += 1;
        dem.session = null;
        demBegin(who);
        renderIf(dem);
      });
    }
    return demPlay();
  }

  function demLines() {
    var lines = [
      "Đếm và điền số thích hợp.",
      "Đếm trong vườn.",
      "Đếm ở ao.",
      "Đếm trên trời.",
      "Đếm trong phòng."
    ];
    countQuestions(["garden", "pond", "sky", "room", "tiny"]).forEach(function (q) {
      lines.push(countSpeak(q, "mon"));
      lines.push(countSpeak(q, "gin"));
      lines.push(countExplain(q));
    });
    return lines;
  }

  function demAudit() {
    var problems = [];
    var mon = countQuestions(["garden", "pond"]);
    var monB = countQuestions(["sky", "room"]);
    var gin = countQuestions(["tiny"]);
    if (mon.length !== 10 || monB.length !== 10) problems.push("mon pack " + mon.length + "/" + monB.length);
    if (gin.length < 4 || gin.length > 6) problems.push("gin " + gin.length);
    Object.keys(SCENES).forEach(function (id) {
      var scene = SCENES[id];
      if (scene.order.length < 4) problems.push(id + " kinds");
      scene.order.forEach(function (kind) {
        var n = countOf(scene, kind);
        if (!KIND[kind]) problems.push("kind " + kind);
        if (n < 1) problems.push(id + " empty " + kind);
        if (id === "tiny" && n > 5) problems.push("gin count " + n);
        if (id !== "tiny" && n > 6) problems.push(id + " busy " + kind);
      });
      var i;
      var j;
      for (i = 0; i < scene.items.length; i++) {
        for (j = 0; j < i; j++) {
          var a = scene.items[i];
          var b = scene.items[j];
          var d = Math.hypot(a.left - b.left, a.top - b.top);
          var need = id === "tiny" ? 28 : 18;
          if (d < need) problems.push(id + " close " + d.toFixed(0));
        }
      }
    });
    gin.forEach(function (q) {
      if (q.count > 5) problems.push("gin over " + q.kind);
    });
    return problems;
  }

  HV.demTranh = {
    card: function (child) {
      return entryCard(child, "dem-tranh", "count-entry", "🖼️", "Đếm tranh", child === "gin"
        ? "Chạm từng con trong tranh"
        : "Một tranh, nhiều ô số · 10 câu");
    },
    lesson: function (child) {
      return entryLesson(child, "dem-tranh", "🖼️", "Đếm tranh", child === "gin"
        ? "Tranh to, chạm để đếm"
        : "Đếm rồi điền số vào ô");
    },
    view: demView,
    audit: demAudit,
    lines: demLines
  };
})(globalThis.HV = globalThis.HV || {});
