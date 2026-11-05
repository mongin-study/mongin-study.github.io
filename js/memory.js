(function (HV) {
  "use strict";

  var U = HV.util;
  var el = U.el;
  var builtin = [];
  var play = null;

  function fallbackDecks() {
    return [
      { id: "gin-colors", child: "gin", title: "Màu sắc", pairs: [
        { id: "red", a: { color: "#ef4444" }, b: { text: "đỏ" } },
        { id: "yellow", a: { color: "#eab308" }, b: { text: "vàng" } },
        { id: "blue", a: { color: "#3b82f6" }, b: { text: "xanh" } }
      ] },
      { id: "gin-animals", child: "gin", title: "Con vật và xe", pairs: [
        { id: "cat", a: { emoji: "🐱" }, b: { text: "mèo" } },
        { id: "dog", a: { emoji: "🐶" }, b: { text: "cún" } },
        { id: "car", a: { emoji: "🚗" }, b: { text: "xe" } },
        { id: "bus", a: { emoji: "🚌" }, b: { text: "buýt" } }
      ] },
      { id: "mon-numbers", child: "mon", title: "Số và đồ vật", pairs: [
        { id: "two", a: { text: "2" }, b: { emoji: "⭐⭐" } },
        { id: "three", a: { text: "3" }, b: { emoji: "🍎🍎🍎" } },
        { id: "four", a: { text: "4" }, b: { emoji: "🚗🚗🚗🚗" } },
        { id: "five", a: { text: "5" }, b: { emoji: "🎈🎈🎈🎈🎈" } }
      ] },
      { id: "mon-letters", child: "mon", title: "Chữ và âm", pairs: [
        { id: "b", a: { text: "b" }, b: { text: "bờ" } },
        { id: "m", a: { text: "m" }, b: { text: "mờ" } },
        { id: "a", a: { text: "a" }, b: { text: "âm a" } },
        { id: "o", a: { text: "o" }, b: { text: "âm o" } },
        { id: "e", a: { text: "e" }, b: { text: "âm e" } }
      ] }
    ];
  }

  function decksFor(child) {
    var pool = builtin.length ? builtin : fallbackDecks();
    var extra = Array.isArray(HV.dailyMemory) ? HV.dailyMemory : [];
    return pool.concat(extra).filter(function (deck) {
      return deck && deck.child === child && deck.pairs && deck.pairs.length >= 3 && deck.pairs.length <= 6;
    });
  }

  function card(child) {
    return el("button", { class: "week-card memory-card", "data-go": "#/memory/" + child }, [
      el("span", { class: "pay-badge", text: "Mới" }),
      el("h2", { text: "Trí nhớ lật thẻ 🃏" }),
      el("p", { text: child === "gin" ? "3–4 cặp màu, con vật, xe" : "4–6 cặp số, chữ và màu · nhiều sao" })
    ]);
  }

  function face(side) {
    var node = el("span", { class: "mem-face" });
    if (side.color) {
      var sw = el("i", { class: "swatch" });
      sw.style.background = side.color;
      node.appendChild(sw);
    }
    if (side.emoji) node.appendChild(el("b", { text: side.emoji }));
    if (side.text) node.appendChild(el("small", { text: side.text }));
    return node;
  }

  function start(child, deck) {
    var cards = [];
    deck.pairs.forEach(function (pair) {
      cards.push({ pair: pair.id, side: pair.a, up: false, matched: false, missed: false });
      cards.push({ pair: pair.id, side: pair.b, up: false, matched: false, missed: false });
    });
    play = {
      child: child,
      deck: deck,
      cards: U.shuffle(cards),
      open: [],
      lock: false,
      firstTry: deck.pairs.length,
      done: false
    };
    if (HV.speech) HV.speech.speak("Tìm hai thẻ giống nhau.", { lang: "vi" });
    if (HV.ui && HV.ui.render) HV.ui.render();
  }

  function finish() {
    if (!play || play.done) return;
    play.done = true;
    var total = play.deck.pairs.length;
    var correct = Math.max(0, play.firstTry);
    var award = play.child === "mon"
      ? HV.storage.awardFor("mon", { id: "memory-" + play.deck.id, category: "memory", subject: "math" }, correct, total)
      : { stars: HV.storage.starsFor(correct, total), note: "" };
    play.stars = award.stars;
    play.note = award.note || "";
    HV.storage.recordRound(play.child, {
      id: "memory-" + play.deck.id,
      title: "Lật thẻ · " + play.deck.title,
      category: "memory",
      subject: "math",
      correct: correct,
      total: total,
      stars: award.stars
    });
    if (HV.audio) HV.audio.fanfare();
    var line = HV.engine && HV.engine.praise ? HV.engine.praise(play.child) : "Giỏi quá!";
    play.praise = line;
    if (HV.speech) HV.speech.speak(line, { lang: "vi", chain: true });
    if (HV.ui && HV.ui.render) HV.ui.render();
  }

  function flip(index) {
    if (!play || play.lock || play.done) return;
    var card = play.cards[index];
    if (!card || card.up || card.matched) return;
    card.up = true;
    play.open.push(index);
    if (play.open.length < 2) {
      if (HV.ui && HV.ui.render) HV.ui.render();
      return;
    }
    play.lock = true;
    var i = play.open[0];
    var j = play.open[1];
    var a = play.cards[i];
    var b = play.cards[j];
    if (a.pair === b.pair) {
      a.matched = b.matched = true;
      if (a.missed || b.missed) play.firstTry -= 1;
      play.open = [];
      play.lock = false;
      if (HV.audio) HV.audio.correct();
      var cheer = HV.engine && HV.engine.praise ? HV.engine.praise(play.child) : "Đúng rồi!";
      if (HV.speech) HV.speech.speak(cheer, { lang: "vi" });
      if (play.cards.every(function (c) { return c.matched; })) finish();
      else if (HV.ui && HV.ui.render) HV.ui.render();
      return;
    }
    a.missed = b.missed = true;
    if (HV.audio) HV.audio.wrong();
    if (HV.ui && HV.ui.render) HV.ui.render();
    setTimeout(function () {
      if (!play) return;
      a.up = b.up = false;
      play.open = [];
      play.lock = false;
      if (HV.ui && HV.ui.render) HV.ui.render();
    }, 800);
  }

  function board() {
    var root = el("section", { class: "play" });
    root.appendChild(el("header", { class: "topbar" }, [
      el("button", { class: "icon-btn", text: "←", onClick: function () {
        var who = play.child;
        play = null;
        var dest = "#/memory/" + who;
        if (location.hash === dest && HV.ui && HV.ui.render) HV.ui.render();
        else location.hash = dest;
      } }),
      el("div", { class: "top-title" }, [
        el("strong", { text: play.deck.title }),
        el("span", { text: "Lật thẻ" })
      ])
    ]));
    var grid = el("div", { class: "mem-grid cols-" + (play.cards.length > 8 ? 4 : 3) });
    play.cards.forEach(function (card, index) {
      var btn = el("button", {
        class: "mem-card" + (card.up || card.matched ? " is-up" : "") + (card.matched ? " is-matched" : ""),
        onClick: function () { flip(index); }
      }, [
        el("span", { class: "mem-inner" }, [
          el("span", { class: "mem-back", text: "?" }),
          face(card.side)
        ])
      ]);
      grid.appendChild(btn);
    });
    root.appendChild(grid);
    return root;
  }

  function doneView() {
    var child = play.child;
    var root = el("section", { class: "play" });
    root.appendChild(el("header", { class: "topbar" }, [
      el("button", { class: "icon-btn", "data-go": "#/c/" + child, text: "←" }),
      el("div", { class: "top-title" }, [el("strong", { text: "Xong bài rồi" })])
    ]));
    var frame = el("div", { class: "result-photo is-" + child });
    frame.appendChild(el("span", { class: "spark spark-a", text: "✦" }));
    frame.appendChild(el("img", { class: "avatar", src: "assets/kids/" + child + ".webp", alt: "" }));
    frame.appendChild(el("span", { class: child === "gin" ? "deco-cape" : "deco-crown", text: child === "gin" ? "🦸" : "👑" }));
    var cast = el("div", { class: "result-art" });
    cast.appendChild(frame);
    cast.appendChild(child === "mon" && HV.art ? HV.art.puppy() : HV.art.car());
    root.appendChild(cast);
    root.appendChild(el("h2", { text: play.praise || "Giỏi quá!" }));
    root.appendChild(el("p", { class: "result-stars", text: U.starText(play.stars) }));
    root.appendChild(el("p", { class: "lede", text: "Nhớ đúng lần đầu " + play.firstTry + "/" + play.deck.pairs.length + " cặp." }));
    if (play.note) root.appendChild(el("p", { class: "lede", text: play.note }));
    root.appendChild(el("button", { class: "btn btn-primary", text: "Bộ khác", onClick: function () {
      play = null;
      if (HV.ui && HV.ui.render) HV.ui.render();
    } }));
    return root;
  }

  function view(child) {
    if (play && play.child === child && play.done) return doneView();
    if (play && play.child === child) return board();
    var root = el("section", { class: "menu" });
    root.appendChild(el("header", { class: "topbar" }, [
      el("button", { class: "icon-btn", "data-go": "#/c/" + child, text: "←" }),
      el("div", { class: "top-title" }, [
        el("strong", { text: "Lật thẻ" }),
        el("span", { text: "Tìm cặp giống nhau" })
      ])
    ]));
    var list = el("div", { class: "ex-list" });
    decksFor(child).forEach(function (deck) {
      var fresh = String(deck.id || "").indexOf("daily-") === 0;
      list.appendChild(el("button", { class: "ex-card", onClick: function () { start(child, deck); } }, [
        el("span", { class: "ex-icon", text: "🃏" }),
        el("span", { class: "ex-copy" }, [
          el("strong", { text: deck.title }),
          el("small", { text: deck.pairs.length + " cặp" }),
          fresh ? el("span", { class: "pay-badge", text: "Mới" }) : null
        ])
      ]));
    });
    root.appendChild(list);
    return root;
  }

  function load() {
    fetch("content/memory/decks.json", { cache: "no-cache" }).then(function (res) {
      return res.ok ? res.json() : null;
    }).then(function (json) {
      if (json && Array.isArray(json.decks) && json.decks.length) builtin = json.decks;
    }).catch(function () {});
  }

  if (typeof window !== "undefined") load();
  HV.memory = { card: card, view: view };
})(globalThis.HV = globalThis.HV || {});
