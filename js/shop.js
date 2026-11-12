(function (HV) {
  "use strict";

  var U = HV.util;
  var el = U.el;
  var session = null;
  var epoch = 0;

  /* Play money only. This file never reads or writes scores, stickers, or Firebase. */
  var MON = [
    {
      id: "kem-exact",
      mode: "note",
      prompt: "Kem giá 2.000đ. Chạm tờ vừa đủ.",
      speak: "Kem giá hai nghìn. Chạm tờ vừa đủ.",
      explain: "Kem giá hai nghìn. Tờ hai nghìn là vừa đủ.",
      goods: [{ emoji: "🍦", name: "Kem", price: 2000 }],
      choices: [1000, 2000, 5000],
      answer: 2000
    },
    {
      id: "banh-exact",
      mode: "note",
      prompt: "Bánh giá 5.000đ. Chạm tờ vừa đủ.",
      speak: "Bánh giá năm nghìn. Chạm tờ vừa đủ.",
      explain: "Bánh giá năm nghìn. Tờ năm nghìn là vừa đủ.",
      goods: [{ emoji: "🍰", name: "Bánh", price: 5000 }],
      choices: [1000, 2000, 5000],
      answer: 5000
    },
    {
      id: "nhan-exact",
      mode: "note",
      prompt: "Nhãn dán giá 1.000đ. Chạm tờ vừa đủ.",
      speak: "Nhãn dán giá một nghìn. Chạm tờ vừa đủ.",
      explain: "Nhãn dán giá một nghìn. Tờ một nghìn là vừa đủ.",
      goods: [{ emoji: "🌟", name: "Nhãn dán", price: 1000 }],
      choices: [1000, 2000, 5000],
      answer: 1000
    },
    {
      id: "add-3",
      mode: "amount",
      prompt: "Kem 2.000đ và nhãn dán 1.000đ. Hết bao nhiêu?",
      speak: "Kem hai nghìn và nhãn dán một nghìn. Hết bao nhiêu?",
      explain: "Hai nghìn cộng một nghìn. Đếm thêm một: ba nghìn.",
      goods: [
        { emoji: "🍦", name: "Kem", price: 2000 },
        { emoji: "🌟", name: "Nhãn dán", price: 1000 }
      ],
      choices: [2000, 3000, 4000, 5000],
      answer: 3000
    },
    {
      id: "add-4",
      mode: "amount",
      prompt: "Hai que kem, mỗi que 2.000đ. Hết bao nhiêu?",
      speak: "Hai que kem, mỗi que hai nghìn. Hết bao nhiêu?",
      explain: "Hai nghìn cộng hai nghìn bằng bốn nghìn.",
      goods: [
        { emoji: "🍦", name: "Kem", price: 2000 },
        { emoji: "🍦", name: "Kem", price: 2000 }
      ],
      choices: [2000, 3000, 4000, 5000],
      answer: 4000
    },
    {
      id: "pay-5",
      mode: "pay",
      prompt: "Que kem giá 5.000đ. Trả đủ 5.000đ.",
      speak: "Que kem giá năm nghìn. Trả đủ năm nghìn.",
      explain: "Cần đủ năm nghìn. Một tờ năm nghìn là vừa đủ.",
      goods: [{ emoji: "🍦", name: "Kem", price: 5000 }],
      answer: 5000
    },
    {
      id: "change-3",
      mode: "amount",
      prompt: "Kem 2.000đ. Con đưa tờ 5.000đ. Pom trả lại bao nhiêu?",
      speak: "Kem giá hai nghìn. Con đưa tờ năm nghìn. Pom trả lại bao nhiêu?",
      explain: "Năm nghìn trừ hai nghìn. Đếm lùi: bốn nghìn, ba nghìn. Pom trả lại ba nghìn.",
      goods: [{ emoji: "🍦", name: "Kem", price: 2000 }],
      paid: [5000],
      choices: [1000, 2000, 3000, 5000],
      answer: 3000
    },
    {
      id: "change-2",
      mode: "amount",
      prompt: "Bánh 5.000đ. Con đưa 5.000đ và 2.000đ. Pom trả lại bao nhiêu?",
      speak: "Bánh giá năm nghìn. Con đưa tờ năm nghìn và tờ hai nghìn. Pom trả lại bao nhiêu?",
      explain: "Năm nghìn cộng hai nghìn là bảy nghìn. Bảy nghìn trừ năm nghìn còn hai nghìn.",
      goods: [{ emoji: "🍰", name: "Bánh", price: 5000 }],
      paid: [5000, 2000],
      choices: [1000, 2000, 3000, 5000],
      answer: 2000
    },
    {
      id: "dearer",
      mode: "item",
      prompt: "Món nào đắt hơn?",
      speak: "Kem năm nghìn và nhãn dán một nghìn. Món nào đắt hơn?",
      explain: "Năm nghìn lớn hơn một nghìn. Kem đắt hơn.",
      goods: [
        { id: "kem", emoji: "🍦", name: "Kem", price: 5000 },
        { id: "nhan", emoji: "🌟", name: "Nhãn dán", price: 1000 }
      ],
      answer: "kem"
    },
    {
      id: "story-4",
      mode: "amount",
      prompt: "Hai nhãn 1.000đ và một kem 2.000đ. Hết bao nhiêu?",
      speak: "Hai nhãn dán, mỗi nhãn một nghìn, và một que kem hai nghìn. Hết bao nhiêu?",
      explain: "Một nghìn cộng một nghìn bằng hai nghìn. Hai nghìn cộng hai nghìn bằng bốn nghìn.",
      goods: [
        { emoji: "🌟", name: "Nhãn", price: 1000 },
        { emoji: "🌟", name: "Nhãn", price: 1000 },
        { emoji: "🍦", name: "Kem", price: 2000 }
      ],
      choices: [2000, 3000, 4000, 5000],
      answer: 4000
    }
  ];

  var GIN = [
    {
      id: "hear-2",
      mode: "coins",
      prompt: "Chạm số hai.",
      speak: "Chạm số hai.",
      explain: "Có hai đồng xu.",
      choices: [{ id: "1", coins: 1 }, { id: "2", coins: 2 }, { id: "3", coins: 3 }],
      answer: "2"
    },
    {
      id: "note-1",
      mode: "note",
      prompt: "Chạm tờ một nghìn.",
      speak: "Chạm tờ một nghìn.",
      explain: "Đây là tờ một nghìn.",
      choices: [1000, 2000, 5000],
      answer: 1000
    },
    {
      id: "hear-1",
      mode: "coins",
      prompt: "Chạm số một.",
      speak: "Chạm số một.",
      explain: "Có một đồng xu.",
      choices: [{ id: "1", coins: 1 }, { id: "2", coins: 2 }, { id: "3", coins: 3 }],
      answer: "1"
    },
    {
      id: "note-2",
      mode: "note",
      prompt: "Chạm tờ hai nghìn.",
      speak: "Chạm tờ hai nghìn.",
      explain: "Đây là tờ hai nghìn.",
      choices: [1000, 2000, 5000],
      answer: 2000
    },
    {
      id: "hear-3",
      mode: "coins",
      prompt: "Chạm số ba.",
      speak: "Chạm số ba.",
      explain: "Có ba đồng xu.",
      choices: [{ id: "1", coins: 1 }, { id: "3", coins: 3 }, { id: "2", coins: 2 }],
      answer: "3"
    },
    {
      id: "ice",
      mode: "picture",
      prompt: "Chạm que kem.",
      speak: "Chạm que kem.",
      explain: "Que kem đây.",
      choices: [
        { id: "banh", emoji: "🍰" },
        { id: "kem", emoji: "🍦" },
        { id: "nhan", emoji: "🌟" }
      ],
      answer: "kem"
    }
  ];

  function vnd(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ";
  }

  function onHash() {
    return (location.hash || "").indexOf("#/shop/") === 0;
  }

  function say(text, chain) {
    if (!text || !HV.speech) return Promise.resolve(0);
    var job = HV.speech.speak(text, { lang: "vi", chain: !!chain });
    return Promise.resolve(job).then(function (sec) {
      return typeof sec === "number" && sec > 0 ? sec : 0.8;
    }).catch(function () { return 0.8; });
  }

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

  function itemsFor(child) {
    return child === "gin" ? GIN : MON;
  }

  function current() {
    return session.items[session.index];
  }

  function handSum() {
    return (session.hand || []).reduce(function (sum, n) { return sum + n; }, 0);
  }

  function leave(hash) {
    epoch += 1;
    session = null;
    if (hash) location.hash = hash;
  }

  function begin(child) {
    epoch += 1;
    session = {
      child: child,
      items: itemsFor(child),
      index: 0,
      attempts: 0,
      firsts: 0,
      phase: "play",
      hand: [],
      mark: null,
      banner: "",
      busy: false
    };
    if (HV.engine && HV.engine.beginSessionPraise) HV.engine.beginSessionPraise();
    say("Cửa hàng của Pom.").then(function () {
      if (!session || session.child !== child) return;
      return say(current().speak, true);
    });
  }

  function renderNow() {
    if (onHash() && HV.ui && HV.ui.render) HV.ui.render();
  }

  function praiseThen(then) {
    var voice = HV.engine && HV.engine.shouldVoicePraise && HV.engine.shouldVoicePraise();
    var line = voice && HV.engine.praise ? HV.engine.praise(session.child, "vi") : "";
    session.banner = line || "Đúng!";
    renderNow();
    var job = line ? say(line) : Promise.resolve(0.2);
    var e = epoch;
    job.then(function (sec) {
      if (e !== epoch || !session || !onHash()) return;
      setTimeout(function () {
        if (e !== epoch || !session || !onHash()) return;
        then();
      }, Math.max(380, Math.round((sec || 0.2) * 1000) + 180));
    });
  }

  function afterSound(play, then) {
    var dur = 0;
    try { dur = play ? play() || 0 : 0; } catch (err) { dur = 0; }
    var e = epoch;
    setTimeout(function () {
      if (e !== epoch || !session || !onHash()) return;
      then();
    }, Math.round(dur * 1000) + 30);
  }

  function cheerDone(child, note, correct, total) {
    var line = HV.engine && HV.engine.praise ? HV.engine.praise(child, "vi") : "";
    var explain = note || ("Đúng lần đầu " + U.readNumber(correct) + " trên " + U.readNumber(total) + " câu.");
    var lines = [];
    if (line) lines.push({ text: line, lang: "vi" });
    lines.push({ text: explain, lang: "vi" });
    var job = HV.engine && HV.engine.speakLines ? HV.engine.speakLines(lines) : Promise.resolve();
    Promise.resolve(job).then(function () {
      if (HV.audio && HV.audio.fanfare) HV.audio.fanfare();
    });
  }

  function advance() {
    if (!session) return;
    session.index += 1;
    session.attempts = 0;
    session.phase = "play";
    session.mark = null;
    session.banner = "";
    session.hand = [];
    session.busy = false;
    if (session.index >= session.items.length) {
      session.phase = "done";
      session.award = roundStars(session.child, session.firsts, session.items.length);
      if (HV.storage && HV.storage.markPlayed) HV.storage.markPlayed(session.child, "shop");
      renderNow();
      cheerDone(session.child, session.award.note, session.firsts, session.items.length);
      return;
    }
    renderNow();
    say(current().speak);
  }

  function grade(value) {
    if (!session || session.busy || session.phase !== "play") return;
    var q = current();
    var good = String(value) === String(q.answer);
    if (good) {
      session.busy = true;
      if (session.attempts === 0) session.firsts += 1;
      session.mark = { good: String(value) };
      renderNow();
      afterSound(HV.audio && HV.audio.correct, function () {
        if (session && session.index >= session.items.length - 1) advance();
        else praiseThen(advance);
      });
      return;
    }
    session.attempts += 1;
    if (session.child === "gin" && session.attempts < 2) {
      session.mark = { bad: String(value) };
      session.banner = "Thử lại nhé";
      if (HV.audio && HV.audio.wrong) HV.audio.wrong();
      say("Thử lại nhé");
      renderNow();
      return;
    }
    session.phase = "explain";
    session.busy = true;
    session.mark = { good: String(q.answer), bad: String(value) };
    if (HV.audio && HV.audio.wrong) HV.audio.wrong();
    say(q.explain);
    renderNow();
  }

  function addNote(value) {
    if (!session || session.busy || session.phase !== "play") return;
    if (session.hand.length >= 6) return;
    session.hand.push(value);
    if (HV.audio && HV.audio.tap) HV.audio.tap();
    renderNow();
  }

  function removeAt(index) {
    if (!session || session.busy || session.phase !== "play") return;
    session.hand.splice(index, 1);
    renderNow();
  }

  function submitPay() {
    if (!session || session.busy || session.phase !== "play") return;
    if (!session.hand.length) {
      session.banner = "Chọn tờ tiền đã nhé.";
      say("Chọn tờ tiền đã nhé.");
      renderNow();
      return;
    }
    grade(handSum());
  }

  function noteFace(value) {
    return el("span", { class: "note-face note-" + value }, [
      el("small", { text: "Tiền chơi" }),
      el("b", { class: "note-value", text: vnd(value).replace("đ", "") }),
      el("small", { class: "note-unit", text: "đồng" })
    ]);
  }

  function choiceClass(id) {
    var mark = session.mark || {};
    var cls = "choice";
    if (mark.good != null && String(id) === String(mark.good)) cls += " is-correct";
    if (mark.bad != null && String(id) === String(mark.bad)) cls += " is-wrong";
    return cls;
  }

  function locked() {
    return session.busy || session.phase === "explain";
  }

  function choiceButton(id, kids) {
    return el("button", {
      class: choiceClass(id),
      "data-pick": String(id),
      disabled: locked() ? true : null,
      onClick: function () { grade(id); }
    }, kids);
  }

  function goodsRow(goods, asChoices) {
    var row = el("div", { class: "goods" });
    (goods || []).forEach(function (good) {
      var body = [
        el("span", { class: "good-emoji", text: good.emoji }),
        good.name ? el("strong", { text: good.name }) : null,
        good.price != null ? el("span", { class: "price-tag", text: vnd(good.price) }) : null
      ];
      if (asChoices) row.appendChild(choiceButton(good.id, body));
      else row.appendChild(el("div", { class: "good-card" }, body));
    });
    return row;
  }

  function coinRow(count) {
    var row = el("span", { class: "coin-row", "aria-hidden": "true" });
    for (var i = 0; i < count; i++) row.appendChild(el("i", { class: "coin" }));
    return row;
  }

  function answers(q) {
    var wrap = el("div", { class: "choices is-cards" + (q.choices && q.choices.length > 3 ? " cols-2" : " cols-3") });
    if (q.mode === "coins") {
      q.choices.forEach(function (choice) {
        wrap.appendChild(choiceButton(choice.id, [
          coinRow(choice.coins),
          el("span", { class: "choice-text", text: String(choice.coins) })
        ]));
      });
      return wrap;
    }
    if (q.mode === "picture") {
      q.choices.forEach(function (choice) {
        wrap.appendChild(choiceButton(choice.id, [
          el("span", { class: "good-emoji", text: choice.emoji })
        ]));
      });
      return wrap;
    }
    if (q.mode === "note" || q.mode === "amount") {
      q.choices.forEach(function (value) {
        var face = value === 1000 || value === 2000 || value === 5000
          ? noteFace(value)
          : el("span", { class: "choice-text", text: vnd(value) });
        wrap.appendChild(choiceButton(value, [face]));
      });
      return wrap;
    }
    return wrap;
  }

  function payDesk() {
    var bank = el("div", { class: "choices cols-3" });
    [1000, 2000, 5000].forEach(function (value) {
      bank.appendChild(el("button", {
        class: choiceClass(value),
        "data-note": String(value),
        disabled: locked() ? true : null,
        onClick: function () { addNote(value); }
      }, [noteFace(value)]));
    });
    var hand = el("div", { class: "shop-hand" });
    if (!session.hand.length) hand.appendChild(el("span", { class: "tray-hint", text: "Chạm tờ tiền để trả" }));
    session.hand.forEach(function (value, index) {
      hand.appendChild(el("button", {
        class: "choice note-mini",
        disabled: locked() ? true : null,
        "aria-label": "Bỏ tờ " + vnd(value),
        onClick: function () { removeAt(index); }
      }, [noteFace(value)]));
    });
    return el("div", { class: "pay-desk" }, [
      bank,
      hand,
      el("p", { class: "shop-sum", text: "Đang trả " + vnd(handSum()) }),
      el("button", {
        class: "btn btn-primary",
        text: "Trả tiền",
        disabled: locked() ? true : null,
        onClick: submitPay
      })
    ]);
  }

  function playView() {
    var child = session.child;
    var q = current();
    var root = el("section", {
      class: "play stage shop-play is-" + child,
      "data-activity": "shop",
      "data-q": q.id
    });
    root.appendChild(el("header", { class: "topbar" }, [
      el("button", {
        class: "icon-btn",
        text: "←",
        "aria-label": "Quay lại",
        onClick: function () { leave("#/c/" + child); }
      }),
      el("div", { class: "top-title" }, [
        el("strong", { text: "Cửa hàng của Pom" }),
        el("span", { text: "Câu " + (session.index + 1) + "/" + session.items.length })
      ]),
      el("button", {
        class: "icon-btn speak-btn",
        text: "🗣️",
        "aria-label": "Nghe lại",
        onClick: function () { say(q.speak); }
      })
    ]));
    var sign = el("div", { class: "shop-sign" });
    if (HV.art && HV.art.puppy) sign.appendChild(HV.art.puppy());
    sign.appendChild(el("div", {}, [
      el("strong", { text: "Pom bán hàng" }),
      el("span", { text: "Tiền chơi" })
    ]));
    root.appendChild(sign);
    if (q.mode !== "item" && q.mode !== "picture" && q.mode !== "coins") root.appendChild(goodsRow(q.goods, false));
    if (q.paid && q.paid.length) {
      var paid = el("p", { class: "shop-paid", text: "Con đưa: " + q.paid.map(vnd).join(" + ") });
      root.appendChild(paid);
    }
    root.appendChild(el("p", { class: "prompt", text: q.prompt }));
    if (session.banner && session.phase !== "explain") {
      root.appendChild(el("p", { class: "tan-banner", role: "status", text: session.banner }));
    }
    if (q.mode === "item") root.appendChild(goodsRow(q.goods, true));
    else if (q.mode === "pay") root.appendChild(payDesk());
    else root.appendChild(answers(q));
    if (session.phase === "explain") {
      root.appendChild(el("div", { class: "feedback is-bad", role: "status" }, [
        el("strong", { text: "Chưa đúng" }),
        el("p", { text: q.explain }),
        el("button", { class: "btn btn-next", text: "Hiểu rồi", onClick: advance })
      ]));
    }
    return root;
  }

  function doneView() {
    var child = session.child;
    var award = session.award || roundStars(child, session.firsts, session.items.length);
    var root = el("section", { class: "play", "data-activity": "shop", "data-phase": "done" });
    root.appendChild(el("header", { class: "topbar" }, [
      el("button", { class: "icon-btn", text: "←", "aria-label": "Quay lại", onClick: function () { leave("#/c/" + child); } }),
      el("div", { class: "top-title" }, [el("strong", { text: "Xong bài rồi" })])
    ]));
    var frame = el("div", { class: "result-photo is-" + child });
    frame.appendChild(el("span", { class: "spark spark-a", text: "✦" }));
    frame.appendChild(el("img", { class: "avatar", src: "assets/kids/" + child + ".webp", alt: "" }));
    frame.appendChild(el("span", { class: child === "gin" ? "deco-cape" : "deco-crown", text: child === "gin" ? "🦸" : "👑" }));
    var cast = el("div", { class: "result-art" });
    cast.appendChild(frame);
    if (HV.art) cast.appendChild(child === "mon" ? HV.art.puppy() : HV.art.car());
    root.appendChild(cast);
    root.appendChild(el("p", { class: "result-stars", text: U.starText(award.stars) }));
    root.appendChild(el("p", { class: "lede", text: "Đúng lần đầu " + session.firsts + "/" + session.items.length + " câu." }));
    if (award.note) root.appendChild(el("p", { class: "lede", text: award.note }));
    root.appendChild(el("p", { class: "fine", text: "Sao của bài chơi, không cộng vào sổ." }));
    root.appendChild(el("div", { class: "result-actions" }, [
      el("button", { class: "btn btn-primary", text: "Chơi lại", onClick: function () {
        var who = child;
        epoch += 1;
        session = null;
        begin(who);
        renderNow();
      } }),
      el("button", { class: "btn", text: "Về nhà", onClick: function () { leave("#/c/" + child); } })
    ]));
    return root;
  }

  function view(child) {
    if (session && session.child !== child) {
      epoch += 1;
      session = null;
    }
    if (!session) begin(child);
    if (session.phase === "done") return doneView();
    return playView();
  }

  function playedMark(child) {
    return HV.fresh && HV.fresh.done(child, "shop");
  }

  function card(child) {
    var played = playedMark(child);
    return el("button", {
      class: "week-card shop-entry" + (played ? " is-played" : " is-new"),
      "data-go": "#/shop/" + child,
      "data-state": played ? "played" : "new"
    }, [
      el("span", { class: "ex-icon act-icon", "aria-hidden": "true", text: "🍦" }),
      played ? null : el("span", { class: "pay-badge", text: "Mới" }),
      el("h2", { text: "Cửa hàng của Pom" }),
      el("p", { text: child === "gin" ? "Chạm tờ tiền và số" : "Đếm, cộng và trả lại tiền · 10 câu" })
    ]);
  }

  function lesson(child) {
    var played = playedMark(child);
    return el("button", {
      class: "ex-card" + (played ? " is-played" : " is-new"),
      "data-go": "#/shop/" + child,
      "data-state": played ? "played" : "new"
    }, [
      el("span", { class: "ex-icon", text: "🍦" }),
      el("span", { class: "ex-copy" }, [
        el("strong", { text: "Cửa hàng của Pom" }),
        el("small", { text: child === "gin" ? "Chạm số và tờ tiền" : "Cộng và thối tiền chơi" })
      ])
    ]);
  }

  function audit() {
    var problems = [];
    if (MON.length !== 10) problems.push("mon " + MON.length);
    if (GIN.length !== 6) problems.push("gin " + GIN.length);
    function check(list, child) {
      list.forEach(function (q) {
        if (!q.speak || !q.explain || !q.prompt) problems.push(q.id + " missing line");
        if (/\d/.test(q.speak) || /\d/.test(q.explain)) problems.push(q.id + " digits in speech");
        if (q.mode === "pay") {
          if (q.answer !== 5000 && q.answer !== 1000 && q.answer !== 2000 && q.answer !== 3000 && q.answer !== 4000) {
            problems.push(q.id + " pay");
          }
          return;
        }
        var ids = [];
        if (q.mode === "item") ids = q.goods.map(function (g) { return String(g.id); });
        else if (q.mode === "coins" || q.mode === "picture") ids = q.choices.map(function (c) { return String(c.id); });
        else ids = (q.choices || []).map(String);
        if (ids.indexOf(String(q.answer)) < 0) problems.push(q.id + " answer missing");
        if (child === "gin" && q.mode === "pay") problems.push("gin pay");
      });
    }
    check(MON, "mon");
    check(GIN, "gin");
    return problems;
  }

  HV.shop = {
    card: card,
    lesson: lesson,
    view: view,
    audit: audit,
    questions: { mon: MON, gin: GIN }
  };
})(globalThis.HV = globalThis.HV || {});
