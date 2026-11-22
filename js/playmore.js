(function (HV) {
  "use strict";

  /* Story order for Mon, listen-and-color for Gin.
     Stars stay on the finish screen. This file does not write the sổ sao. */

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

  function say(text, lang, chain) {
    if (!text || !HV.speech) return Promise.resolve(0);
    var job = HV.speech.speak(text, { lang: lang || "vi", chain: !!chain });
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
    var gen = bag.session ? bag.session.gen : 0;
    setTimeout(function () {
      if (e !== bag.epoch || !bag.session || bag.session.gen !== gen || !bag.on()) return;
      then();
    }, Math.round(dur * 1000) + 40);
  }

  function voicePraise(bag, lang) {
    var voice = HV.engine && HV.engine.shouldVoicePraise && HV.engine.shouldVoicePraise();
    if (!voice || !HV.engine.praise) return "";
    return HV.engine.praise(bag.session.child, lang || "vi") || "";
  }

  function markPlayed(child, id) {
    if (HV.storage && HV.storage.markPlayed) HV.storage.markPlayed(child, id);
  }

  function played(child, id) {
    return HV.fresh && HV.fresh.done(child, id);
  }

  function topbar(child, title, sub, onBack, onSpeak) {
    return el("header", { class: "topbar" }, [
      el("button", { class: "icon-btn", text: "←", "aria-label": "Quay lại", onClick: onBack }),
      el("div", { class: "top-title" }, [
        el("strong", { text: title }),
        el("span", { text: sub })
      ]),
      onSpeak
        ? el("button", { class: "icon-btn speak-btn", text: "🗣️", "aria-label": "Nghe lại", onClick: onSpeak })
        : el("span", { class: "icon-spacer" })
    ]);
  }

  function doneView(bag, noun, praiseLang) {
    var child = bag.session.child;
    var award = bag.session.award;
    var root = el("section", { class: "play", "data-activity": bag.name, "data-phase": "done" });
    root.appendChild(topbar(child, "Xong bài rồi", "", function () { bag.leave("#/c/" + child); }, null));
    if (bag.session.gallery) root.appendChild(bag.session.gallery);
    var frame = el("div", { class: "result-photo is-" + child });
    frame.appendChild(el("span", { class: "spark spark-a", text: "✦" }));
    frame.appendChild(el("img", { class: "avatar", src: "assets/kids/" + child + ".webp", alt: "" }));
    frame.appendChild(el("span", { class: child === "gin" ? "deco-cape" : "deco-crown", text: child === "gin" ? "🦸" : "👑" }));
    var cast = el("div", { class: "result-art" });
    cast.appendChild(frame);
    if (HV.art) cast.appendChild(child === "mon" ? HV.art.puppy() : HV.art.car());
    root.appendChild(cast);
    root.appendChild(el("h2", { text: bag.session.praiseLine || (child === "gin" ? "Bingo!" : "Mon ơi giỏi quá!") }));
    root.appendChild(el("p", { class: "result-stars", text: U.starText(award.stars) }));
    root.appendChild(el("p", { class: "lede", text: "Đúng lần đầu " + bag.session.firsts + "/" + bag.session.total + " " + noun + "." }));
    if (award.note) root.appendChild(el("p", { class: "lede", text: award.note }));
    root.appendChild(el("p", { class: "fine", text: "Sao của bài chơi, không cộng vào sổ." }));
    root.appendChild(el("div", { class: "result-actions" }, [
      el("button", { class: "btn btn-primary", text: "Chơi lại", onClick: function () { bag.replay(); } }),
      el("button", { class: "btn", text: "Về nhà", onClick: function () { bag.leave("#/c/" + child); } })
    ]));
    if (!bag.session.praiseSaid) {
      bag.session.praiseSaid = true;
      say(bag.session.praiseLine, praiseLang);
    }
    return root;
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

  function html(tag, attrs, markup) {
    var node = el(tag, attrs);
    node.innerHTML = markup;
    return node;
  }

  function makeBag(name, hashPrefix) {
    return {
      name: name,
      epoch: 0,
      session: null,
      on: function () { return (location.hash || "").indexOf(hashPrefix) === 0; },
      leave: function (hash) {
        this.epoch += 1;
        if (this.session && this.session.detach) this.session.detach();
        this.session = null;
        if (hash) location.hash = hash;
      },
      replay: function () {}
    };
  }

  /* ---------- pictures for the stories ---------- */

  function g(x, y, inner) {
    return '<g transform="translate(' + x + " " + y + ')">' + inner + "</g>";
  }
  var ELSA = '<circle cx="0" cy="-6" r="12" fill="#ffd8bf"/><path d="M-13 -10 Q0 -26 13 -10 Q8 0 0 -2 Q-8 0 -13 -10" fill="#e7f4ff"/><path d="M-16 8 h32 l7 28 h-46z" fill="#3d93d8"/>';
  var RAP = '<circle cx="0" cy="-8" r="12" fill="#ffd8bf"/><path d="M-14 -12 Q0 -28 14 -12 L18 36 Q0 44 -18 36z" fill="#f6d56a"/><path d="M-14 8 h28 l4 26 h-36z" fill="#c4b5fd"/>';
  var MON = '<circle cx="0" cy="-6" r="12" fill="#ffd8bf"/><path d="M-12 -8 Q0 -22 12 -8 Q6 2 0 0 Q-6 2 -12 -8" fill="#6b3a2a"/><path d="M-15 8 h30 l6 28 h-42z" fill="#fb7185"/>';
  var POM = '<ellipse cx="8" cy="10" rx="18" ry="12" fill="#f2c14e"/><circle cx="-8" cy="0" r="11" fill="#f2c14e"/><ellipse cx="-16" cy="-8" rx="5" ry="8" fill="#e0a04a"/><circle cx="-12" cy="-1" r="1.6" fill="#2b2118"/><path d="M22 8 q16 -14 8 -22" fill="none" stroke="#e0a04a" stroke-width="4" stroke-linecap="round"/>';
  var SNOWMAN = '<circle cx="0" cy="18" r="16" fill="#fff" stroke="#9ec5e8" stroke-width="2"/><circle cx="0" cy="-2" r="11" fill="#fff" stroke="#9ec5e8" stroke-width="2"/><path d="M8 -2 h16 l-6 4z" fill="#fb923c"/>';
  var LANTERN = '<path d="M0 0 l10 6 v16 l-10 6 l-10 -6 v-16z" fill="#f6d56a" stroke="#e2a51d" stroke-width="2"/>';

  function scene(bg, inner) {
    return '<svg viewBox="0 0 160 112" aria-hidden="true"><rect width="160" height="112" rx="12" fill="' + bg + '"/>' + inner + "</svg>";
  }

  function flakes() {
    return '<g fill="#fff">' +
      '<circle cx="18" cy="16" r="3"/><circle cx="40" cy="28" r="2"/><circle cx="70" cy="14" r="3"/>' +
      '<circle cx="100" cy="24" r="2"/><circle cx="130" cy="12" r="3"/><circle cx="146" cy="30" r="2"/>' +
      "</g>";
  }

  var ART = {
    "snow-fall": scene("#d7ecff", flakes() + g(78, 70, ELSA)),
    "snow-roll": scene("#e7f3ff", g(48, 78, '<circle cx="0" cy="0" r="14" fill="#fff" stroke="#9ec5e8"/>') + g(78, 70, '<circle cx="0" cy="6" r="18" fill="#fff" stroke="#9ec5e8"/>') + g(118, 62, ELSA)),
    "snow-face": scene("#e7f3ff", g(80, 58, SNOWMAN) + g(124, 64, ELSA)),
    "snow-hug": scene("#e7f3ff", g(58, 60, SNOWMAN) + g(96, 62, ELSA) + '<path d="M70 28 c6 -8 14 -8 18 0" fill="none" stroke="#fb7185" stroke-width="3"/>'),
    "pom-play": scene("#d9f5d0", '<circle cx="28" cy="78" r="8" fill="#fb7185"/><circle cx="48" cy="86" r="7" fill="#f6d56a"/><circle cx="40" cy="70" r="6" fill="#c4b5fd"/>' + g(100, 62, POM)),
    "pom-lost": scene("#cfe8c0", '<ellipse cx="46" cy="70" rx="28" ry="18" fill="#4ade80"/><ellipse cx="70" cy="78" rx="22" ry="14" fill="#22c55e"/>' + g(58, 58, POM)),
    "pom-look": scene("#e8f6ff", g(80, 64, MON) + '<path d="M108 58 q16 -8 8 6" fill="none" stroke="#1d4e89" stroke-width="3"/>'),
    "pom-found": scene("#fff4d6", g(58, 66, POM) + g(96, 62, MON)),
    "lantern-window": scene("#1e3a5f", '<rect x="58" y="22" width="44" height="70" fill="#6b7280"/><rect x="68" y="34" width="24" height="28" fill="#fde68a"/>' + g(80, 78, RAP)),
    "lantern-hold": scene("#243b5a", g(70, 64, RAP) + g(112, 48, LANTERN)),
    "lantern-up": scene("#1e3a5f", g(40, 70, LANTERN) + g(80, 40, LANTERN) + g(118, 64, RAP)),
    "lantern-sky": scene("#16243f", g(30, 30, LANTERN) + g(70, 18, LANTERN) + g(110, 34, LANTERN) + g(50, 62, LANTERN) + g(96, 70, LANTERN)),
    "play-fall": scene("#d7ecff", flakes() + g(50, 70, MON) + g(100, 66, POM)),
    "play-throw": scene("#e7f3ff", '<circle cx="90" cy="40" r="8" fill="#fff"/>' + g(48, 68, MON) + g(108, 66, POM)),
    "play-laugh": scene("#e7f3ff", flakes() + g(56, 68, MON) + g(104, 66, POM) + '<path d="M78 30 q8 8 16 0" fill="none" stroke="#fb7185" stroke-width="3"/>'),
    "castle-spark": scene("#e0f2fe", g(70, 66, ELSA) + '<path d="M108 40 l8 16 h-16z" fill="#7dd3fc"/>'),
    "castle-rise": scene("#dbeafe", '<path d="M30 90 V48 h16 v14 h14 V36 h16 v26 h14 V48 h16 v42z" fill="#bfdbfe" stroke="#3b82f6" stroke-width="2"/>'),
    "castle-elsa": scene("#dbeafe", '<path d="M24 92 V50 h18 v16 h16 V38 h18 v28 h16 V50 h18 v42z" fill="#dbeafe" stroke="#3b82f6"/>' + g(78, 70, ELSA)),
    "garden-hair": scene("#dcfce7", '<circle cx="30" cy="80" r="8" fill="#fb7185"/><circle cx="48" cy="86" r="6" fill="#f6d56a"/>' + g(96, 60, RAP)),
    "garden-sniff": scene("#dcfce7", '<circle cx="46" cy="70" r="10" fill="#f472b6"/>' + g(90, 64, POM)),
    "garden-sit": scene("#dcfce7", g(56, 68, RAP) + g(104, 70, POM)),
    "crown-box": scene("#fff7ed", '<rect x="58" y="48" width="44" height="32" rx="4" fill="#f6d56a" stroke="#e2a51d" stroke-width="3"/>' + g(40, 66, MON)),
    "crown-see": scene("#fff7ed", '<path d="M70 40 l8 16 h-20z M90 28 l8 28 h-20z M110 40 l8 16 h-20z" fill="#f6d56a" stroke="#e2a51d"/>'),
    "crown-wear": scene("#fff7ed", g(80, 68, MON) + '<path d="M64 40 l6 12 h-14z M80 30 l6 18 h-16z M96 40 l6 12 h-14z" fill="#f6d56a"/>'),
    "bone-dig": scene("#f5e6c8", '<ellipse cx="70" cy="80" rx="22" ry="8" fill="#d6b48a"/>' + g(100, 60, POM)),
    "bone-find": scene("#f5e6c8", '<rect x="60" y="62" width="28" height="8" rx="4" fill="#fff" stroke="#d6d3d1" transform="rotate(-20 74 66)"/>' + g(108, 64, POM)),
    "bone-wag": scene("#fff7ed", g(80, 64, POM) + '<path d="M118 40 q20 8 8 20" fill="none" stroke="#e0a04a" stroke-width="4" stroke-linecap="round"/>'),
    "braid-long": scene("#faf5ff", g(80, 50, RAP)),
    "braid-do": scene("#faf5ff", g(70, 58, RAP) + '<path d="M96 40 q8 20 0 36" fill="none" stroke="#f6d56a" stroke-width="6"/>'),
    "braid-bow": scene("#faf5ff", g(78, 58, RAP) + '<path d="M96 36 l10 8 l-10 8 l-10 -8z" fill="#fb7185"/>'),
    "book-pick": scene("#f8fafc", '<rect x="96" y="48" width="28" height="34" rx="2" fill="#93c5fd" stroke="#1d4e89"/>' + g(60, 66, MON)),
    "book-sit": scene("#f8fafc", g(56, 68, MON) + g(104, 72, POM)),
    "book-read": scene("#f8fafc", '<rect x="70" y="58" width="26" height="20" fill="#93c5fd" stroke="#1d4e89"/>' + g(48, 66, MON) + g(112, 72, POM)),
    "skate-lace": scene("#e0f2fe", '<ellipse cx="70" cy="78" rx="16" ry="6" fill="#1d4e89"/>' + g(108, 62, ELSA)),
    "skate-slide": scene("#e0f2fe", '<path d="M20 84 h120" stroke="#93c5fd" stroke-width="6"/>' + g(50, 62, ELSA) + g(100, 64, MON)),
    "skate-spin": scene("#e0f2fe", '<circle cx="80" cy="70" r="26" fill="none" stroke="#7dd3fc" stroke-width="3" stroke-dasharray="4 3"/>' + g(68, 64, ELSA) + g(98, 66, MON)),
    "glove-cold": scene("#e0f2fe", flakes() + g(80, 64, MON) + '<path d="M96 70 h12 M96 78 h10" stroke="#1d4e89" stroke-width="3" stroke-linecap="round"/>'),
    "glove-run": scene("#fff7ed", g(80, 64, POM)),
    "glove-carry": scene("#fff7ed", '<rect x="96" y="58" width="16" height="18" rx="4" fill="#fb7185"/>' + g(60, 64, POM)),
    "glove-warm": scene("#fff7ed", '<rect x="92" y="62" width="14" height="16" rx="4" fill="#fb7185"/>' + g(48, 66, MON) + g(100, 68, POM)),
    "tea-set": scene("#fff7ed", '<rect x="40" y="70" width="80" height="6" fill="#e7e5e4"/><circle cx="60" cy="60" r="8" fill="#fff" stroke="#fb7185"/><circle cx="84" cy="60" r="8" fill="#fff" stroke="#7ec8e3"/>' + g(120, 64, ELSA)),
    "tea-pour": scene("#fff7ed", '<path d="M70 36 h16 v20 h-16z" fill="#93c5fd"/>' + '<circle cx="96" cy="64" r="8" fill="#fff" stroke="#fb7185"/>' + g(40, 66, ELSA)),
    "tea-sip": scene("#fff7ed", '<circle cx="70" cy="70" r="8" fill="#fff" stroke="#fb7185"/>' + g(46, 62, ELSA) + g(100, 64, MON)),
    "boat-shore": scene("#dbeafe", '<path d="M0 80 h160 v32 h-160z" fill="#7ec8e3"/>' + g(70, 58, RAP)),
    "boat-step": scene("#dbeafe", '<path d="M78 72 q20 16 40 0 l-6 16 h-28z" fill="#f6d56a" stroke="#e2a51d"/>' + g(50, 58, RAP)),
    "boat-wave": scene("#bae6fd", '<path d="M70 64 q24 18 48 0 l-8 18 h-32z" fill="#f6d56a"/>' + g(86, 52, RAP) + '<path d="M20 90 q16 8 32 0 q16 8 32 0 q16 8 32 0" fill="none" stroke="#3b82f6" stroke-width="3"/>')
  };

  function frameArt(id) {
    return ART[id] || scene("#f8fafc", "");
  }

  var STORIES = [
    {
      id: "elsa-snow",
      title: "Elsa làm người tuyết",
      frames: [
        { id: "snow-fall", name: "Tuyết rơi", say: "Tuyết rơi kín sân.", why: "Đầu tiên tuyết rơi, mới có tuyết để nặn." },
        { id: "snow-roll", name: "Nặn tuyết", say: "Elsa nặn hai cục tuyết tròn.", why: "Tiếp theo Elsa nặn thân người tuyết." },
        { id: "snow-face", name: "Gắn mặt", say: "Elsa gắn mắt và mũi cà rốt.", why: "Rồi Elsa gắn mặt cho người tuyết." },
        { id: "snow-hug", name: "Ôm bạn tuyết", say: "Elsa ôm người tuyết và cười.", why: "Cuối cùng người tuyết xong, Elsa ôm bạn." }
      ]
    },
    {
      id: "pom-lost",
      title: "Pom đi lạc",
      frames: [
        { id: "pom-play", name: "Pom chơi", say: "Pom chơi trong vườn.", why: "Đầu tiên Pom đang chơi trong vườn." },
        { id: "pom-lost", name: "Pom lạc", say: "Pom lạc sau bụi cây.", why: "Tiếp theo Pom đi lạc, không thấy đường về." },
        { id: "pom-look", name: "Mon đi tìm", say: "Mon đi tìm Pom.", why: "Rồi Mon đi tìm Pom." },
        { id: "pom-found", name: "Ôm Pom", say: "Mon tìm thấy Pom và ôm Pom.", why: "Cuối cùng Mon tìm thấy Pom." }
      ]
    },
    {
      id: "lanterns",
      title: "Rapunzel thả đèn trời",
      frames: [
        { id: "lantern-window", name: "Ở trên tháp", say: "Rapunzel đứng ở cửa sổ tháp.", why: "Đầu tiên Rapunzel ở trên tháp." },
        { id: "lantern-hold", name: "Cầm đèn", say: "Rapunzel cầm một đèn trời.", why: "Tiếp theo Rapunzel cầm đèn trời." },
        { id: "lantern-up", name: "Thả đèn", say: "Rapunzel thả đèn lên trời.", why: "Rồi Rapunzel thả đèn bay lên." },
        { id: "lantern-sky", name: "Đầy đèn", say: "Trời đầy đèn lồng vàng.", why: "Cuối cùng đèn bay kín bầu trời." }
      ]
    },
    {
      id: "snow-play",
      title: "Mon và Pom chơi tuyết",
      frames: [
        { id: "play-fall", name: "Tuyết rơi", say: "Tuyết rơi, Mon và Pom ra sân.", why: "Đầu tiên tuyết rơi, hai bạn ra sân." },
        { id: "play-throw", name: "Ném tuyết", say: "Mon và Pom ném tuyết.", why: "Tiếp theo hai bạn ném tuyết." },
        { id: "play-laugh", name: "Cùng cười", say: "Hai bạn cười trên tuyết.", why: "Cuối cùng hai bạn cười với nhau." }
      ]
    },
    {
      id: "castle",
      title: "Elsa xây lâu đài",
      frames: [
        { id: "castle-spark", name: "Băng lấp lánh", say: "Elsa giơ tay, băng lấp lánh.", why: "Đầu tiên Elsa dùng phép băng." },
        { id: "castle-rise", name: "Lâu đài mọc", say: "Lâu đài băng mọc lên.", why: "Tiếp theo lâu đài mọc lên." },
        { id: "castle-elsa", name: "Đứng trước lâu đài", say: "Elsa đứng trước lâu đài.", why: "Cuối cùng lâu đài xong, Elsa đứng phía trước." }
      ]
    },
    {
      id: "garden",
      title: "Rapunzel và Pom trong vườn",
      frames: [
        { id: "garden-hair", name: "Ra vườn", say: "Rapunzel xõa tóc dài trong vườn.", why: "Đầu tiên Rapunzel ra vườn." },
        { id: "garden-sniff", name: "Ngửi hoa", say: "Pom ngửi một bông hoa.", why: "Tiếp theo Pom ngửi hoa." },
        { id: "garden-sit", name: "Ngồi cạnh nhau", say: "Rapunzel và Pom ngồi cạnh nhau.", why: "Cuối cùng hai bạn ngồi cạnh nhau." }
      ]
    },
    {
      id: "crown",
      title: "Mon đội vương miện",
      frames: [
        { id: "crown-box", name: "Mở hộp", say: "Mon mở một hộp.", why: "Đầu tiên Mon mở hộp." },
        { id: "crown-see", name: "Thấy vương miện", say: "Trong hộp có một vương miện.", why: "Tiếp theo Mon thấy vương miện." },
        { id: "crown-wear", name: "Đội vương miện", say: "Mon đội vương miện và cười.", why: "Cuối cùng Mon đội vương miện." }
      ]
    },
    {
      id: "bone",
      title: "Pom tìm xương",
      frames: [
        { id: "bone-dig", name: "Đào đất", say: "Pom đào đất trong vườn.", why: "Đầu tiên Pom đào đất." },
        { id: "bone-find", name: "Thấy xương", say: "Pom thấy một chiếc xương.", why: "Tiếp theo Pom thấy xương." },
        { id: "bone-wag", name: "Vẫy đuôi", say: "Pom vẫy đuôi và ngậm xương.", why: "Cuối cùng Pom vui và ngậm xương." }
      ]
    },
    {
      id: "braid",
      title: "Rapunzel tết tóc",
      frames: [
        { id: "braid-long", name: "Tóc dài", say: "Tóc Rapunzel rất dài.", why: "Đầu tiên tóc Rapunzel còn xõa." },
        { id: "braid-do", name: "Tết tóc", say: "Rapunzel tết tóc.", why: "Tiếp theo Rapunzel tết tóc." },
        { id: "braid-bow", name: "Buộc nơ", say: "Rapunzel buộc một chiếc nơ.", why: "Cuối cùng Rapunzel buộc nơ lên tóc." }
      ]
    },
    {
      id: "book",
      title: "Mon đọc sách cho Pom",
      frames: [
        { id: "book-pick", name: "Lấy sách", say: "Mon lấy một quyển sách.", why: "Đầu tiên Mon lấy sách." },
        { id: "book-sit", name: "Ngồi xuống", say: "Mon ngồi xuống, Pom ngồi cạnh.", why: "Tiếp theo hai bạn ngồi xuống." },
        { id: "book-read", name: "Đọc cho Pom", say: "Mon đọc, Pom nghe.", why: "Cuối cùng Mon đọc cho Pom nghe." }
      ]
    },
    {
      id: "skate",
      title: "Elsa và Mon trượt băng",
      frames: [
        { id: "skate-lace", name: "Buộc giày", say: "Elsa buộc giày trượt.", why: "Đầu tiên phải buộc giày đã." },
        { id: "skate-slide", name: "Trượt đi", say: "Elsa và Mon trượt trên băng.", why: "Tiếp theo hai bạn trượt đi." },
        { id: "skate-spin", name: "Quay cười", say: "Hai bạn quay và cười.", why: "Cuối cùng hai bạn quay một vòng." }
      ]
    },
    {
      id: "gloves",
      title: "Pom mang găng cho Mon",
      frames: [
        { id: "glove-cold", name: "Mon lạnh", say: "Mon lạnh và xoa hai tay.", why: "Đầu tiên Mon thấy lạnh." },
        { id: "glove-run", name: "Pom chạy đi", say: "Pom chạy đi tìm.", why: "Tiếp theo Pom chạy đi tìm đồ ấm." },
        { id: "glove-carry", name: "Ngậm găng", say: "Pom ngậm đôi găng tay.", why: "Rồi Pom mang găng về." },
        { id: "glove-warm", name: "Đeo găng", say: "Mon đeo găng và ôm Pom.", why: "Cuối cùng Mon đeo găng và ôm Pom." }
      ]
    },
    {
      id: "tea",
      title: "Tiệc trà của Elsa",
      frames: [
        { id: "tea-set", name: "Bày tách", say: "Elsa bày những tách trà.", why: "Đầu tiên Elsa bày tách." },
        { id: "tea-pour", name: "Rót trà", say: "Elsa rót trà vào tách.", why: "Tiếp theo Elsa rót trà." },
        { id: "tea-sip", name: "Uống trà", say: "Elsa và Mon uống trà.", why: "Cuối cùng hai bạn uống trà." }
      ]
    },
    {
      id: "boat",
      title: "Rapunzel ngồi thuyền",
      frames: [
        { id: "boat-shore", name: "Bên bờ", say: "Rapunzel đứng bên bờ nước.", why: "Đầu tiên Rapunzel đứng trên bờ." },
        { id: "boat-step", name: "Xuống thuyền", say: "Rapunzel bước xuống thuyền.", why: "Tiếp theo Rapunzel xuống thuyền." },
        { id: "boat-wave", name: "Thuyền trôi", say: "Thuyền trôi, Rapunzel vẫy tay.", why: "Cuối cùng thuyền trôi đi." }
      ]
    }
  ];

  function slotNames(n) {
    if (n === 4) return ["Đầu tiên", "Tiếp theo", "Tiếp nữa", "Cuối cùng"];
    return ["Đầu tiên", "Tiếp theo", "Cuối cùng"];
  }

  var storyBag = makeBag("ke-chuyen", "#/ke-chuyen/");

  function storyNow() {
    return storyBag.session.queue[storyBag.session.index];
  }

  function storyBegin(child) {
    storyBag.epoch += 1;
    if (storyBag.session && storyBag.session.detach) storyBag.session.detach();
    var queue = U.shuffle(STORIES).slice(0, 10);
    storyBag.session = {
      child: child,
      queue: queue,
      index: 0,
      firsts: 0,
      total: queue.length,
      phase: "play",
      slots: [],
      pick: "",
      order: [],
      readAt: 0,
      gen: 0,
      banner: "",
      praiseLine: "",
      praiseSaid: false,
      detach: null
    };
    storyLoad();
    if (HV.engine && HV.engine.beginSessionPraise) HV.engine.beginSessionPraise();
    say("Sắp xếp tranh kể chuyện.").then(function () {
      if (!storyBag.session) return;
      return say("Xếp từ đầu tiên đến cuối cùng.", "vi", true);
    });
  }

  function storyLoad() {
    var s = storyBag.session;
    var story = storyNow();
    s.phase = "play";
    s.slots = story.frames.map(function () { return ""; });
    s.pick = "";
    s.order = U.shuffle(story.frames.map(function (frame) { return frame.id; }));
    s.readAt = 0;
    s.banner = "";
    s.gen += 1;
  }

  function storyFrame(id) {
    var frames = storyNow().frames;
    var i;
    for (i = 0; i < frames.length; i++) if (frames[i].id === id) return frames[i];
    return null;
  }

  function storyPlace(id, slot) {
    var s = storyBag.session;
    if (!s || s.phase !== "play") return;
    var i;
    for (i = 0; i < s.slots.length; i++) if (s.slots[i] === id) s.slots[i] = "";
    if (s.slots[slot]) {
      /* the picture already there goes back to the tray */
    }
    s.slots[slot] = id;
    s.pick = "";
    s.banner = "";
    renderIf(storyBag);
  }

  function storyLift(id) {
    var s = storyBag.session;
    var i;
    for (i = 0; i < s.slots.length; i++) if (s.slots[i] === id) s.slots[i] = "";
    s.pick = id;
    renderIf(storyBag);
  }

  function storyAdvance() {
    var s = storyBag.session;
    if (!s) return;
    s.gen += 1;
    s.index += 1;
    if (s.index >= s.queue.length) {
      s.phase = "done";
      s.award = roundStars(s.child, s.firsts, s.total);
      s.praiseLine = HV.engine && HV.engine.praise ? HV.engine.praise(s.child, "vi") : "Mon ơi giỏi quá!";
      markPlayed(s.child, "ke-chuyen");
      if (HV.audio && HV.audio.fanfare) HV.audio.fanfare();
      renderIf(storyBag);
      return;
    }
    storyLoad();
    renderIf(storyBag);
    say(storyNow().title);
  }

  function storyRead(i, gen) {
    var s = storyBag.session;
    if (!s || s.gen !== gen || s.phase !== "read") return;
    var frames = storyNow().frames;
    if (i >= frames.length) {
      s.phase = "invite";
      renderIf(storyBag);
      say("Con kể lại chuyện này cho Pom nghe nhé.");
      return;
    }
    s.readAt = i;
    renderIf(storyBag);
    say(frames[i].say).then(function () {
      storyRead(i + 1, gen);
    });
  }

  function storyCorrect() {
    var s = storyBag.session;
    s.firsts += 1;
    s.phase = "read";
    s.readAt = 0;
    s.gen += 1;
    var gen = s.gen;
    var line = voicePraise(storyBag, "vi");
    s.banner = line;
    renderIf(storyBag);
    var start = function () { storyRead(0, gen); };
    if (line) say(line).then(function () { if (storyBag.session && storyBag.session.gen === gen) start(); });
    else start();
  }

  function storySubmit() {
    var s = storyBag.session;
    if (!s || s.phase !== "play") return;
    var i;
    for (i = 0; i < s.slots.length; i++) {
      if (!s.slots[i]) {
        s.banner = "Xếp đủ tranh đã nhé.";
        say(s.banner);
        renderIf(storyBag);
        return;
      }
    }
    var frames = storyNow().frames;
    var good = true;
    for (i = 0; i < frames.length; i++) if (s.slots[i] !== frames[i].id) good = false;
    if (good) {
      if (HV.audio && HV.audio.correct) HV.audio.correct();
      afterSound(storyBag, null, storyCorrect);
      return;
    }
    s.phase = "explain";
    s.gen += 1;
    s.banner = "";
    if (HV.audio && HV.audio.wrong) HV.audio.wrong();
    renderIf(storyBag);
    var gen = s.gen;
    say("Chưa đúng thứ tự.").then(function () {
      var step = 0;
      function next() {
        if (!storyBag.session || storyBag.session.gen !== gen) return;
        if (step >= frames.length) return;
        say(frames[step].why, "vi", true).then(function () {
          step += 1;
          next();
        });
      }
      next();
    });
  }

  function storyCard(frame, picked) {
    return el("button", {
      class: "story-card" + (picked ? " is-pick" : ""),
      "data-frame": frame.id,
      "aria-label": frame.name,
      type: "button"
    }, [
      html("span", { class: "story-art" }, frameArt(frame.id)),
      el("small", { text: frame.name })
    ]);
  }

  function storyPlay() {
    var s = storyBag.session;
    var story = storyNow();
    var names = slotNames(story.frames.length);
    var root = el("section", {
      class: "play stage ws-play story-play",
      "data-activity": "ke-chuyen",
      "data-story": story.id
    });
    root.appendChild(topbar(s.child, "Sắp xếp tranh", "Câu " + (s.index + 1) + "/" + s.total, function () {
      storyBag.leave("#/c/" + s.child);
    }, function () { say("Xếp từ đầu tiên đến cuối cùng."); }));
    root.appendChild(el("p", { class: "prompt", text: story.title }));
    if (s.banner) root.appendChild(el("p", { class: "tan-banner", role: "status", text: s.banner }));
    var slots = el("div", { class: "story-slots" });
    s.slots.forEach(function (id, index) {
      var frame = id ? storyFrame(id) : null;
      var slot = el("div", {
        class: "story-slot" + (frame && s.pick === id ? " is-pick" : ""),
        "data-slot": String(index)
      }, [
        el("b", { text: names[index] }),
        frame ? storyCard(frame, false) : el("span", { class: "story-empty", text: "Chạm tranh" })
      ]);
      slots.appendChild(slot);
    });
    root.appendChild(slots);
    var used = {};
    s.slots.forEach(function (id) { if (id) used[id] = true; });
    var pool = el("div", { class: "story-pool" });
    s.order.forEach(function (id) {
      if (used[id]) return;
      pool.appendChild(storyCard(storyFrame(id), s.pick === id));
    });
    root.appendChild(pool);
    root.appendChild(el("button", { class: "btn btn-primary", text: "Xong", onClick: storySubmit }));
    bindStoryPointer(root);
    return root;
  }

  function bindStoryPointer(root) {
    if (storyBag.session.detach) storyBag.session.detach();
    var drag = null;
    function frameOf(node) {
      var card = node && node.closest ? node.closest("[data-frame]") : null;
      return card ? card.getAttribute("data-frame") : "";
    }
    function down(e) {
      if (!storyBag.session || storyBag.session.phase !== "play") return;
      var id = frameOf(e.target);
      var slot = e.target.closest ? e.target.closest("[data-slot]") : null;
      if (!id && !slot) return;
      drag = { id: id, x: e.clientX, y: e.clientY, moved: false, pointer: e.pointerId };
    }
    function move(e) {
      if (!drag || e.pointerId !== drag.pointer) return;
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 12) drag.moved = true;
    }
    function up(e) {
      if (!drag || (e && e.pointerId != null && e.pointerId !== drag.pointer)) return;
      var id = drag.id;
      var moved = drag.moved;
      drag = null;
      var s = storyBag.session;
      if (!s || s.phase !== "play") return;
      if (moved) {
        var under = document.elementFromPoint(e.clientX, e.clientY);
        var slot = under && under.closest ? under.closest("[data-slot]") : null;
        if (slot) storyPlace(id, Number(slot.getAttribute("data-slot")));
        return;
      }
      var slotTap = e.target.closest ? e.target.closest("[data-slot]") : null;
      if (s.pick && slotTap) {
        storyPlace(s.pick, Number(slotTap.getAttribute("data-slot")));
        return;
      }
      if (slotTap && id) {
        storyLift(id);
        return;
      }
      s.pick = s.pick === id ? "" : id;
      renderIf(storyBag);
    }
    root.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    storyBag.session.detach = function () {
      root.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }

  function storyStrip(highlight) {
    var frames = storyNow().frames;
    var row = el("div", { class: "story-strip" });
    frames.forEach(function (frame, index) {
      row.appendChild(el("div", { class: "story-slot" + (index === highlight ? " is-on" : "") }, [
        el("b", { text: String(index + 1) }),
        html("span", { class: "story-art" }, frameArt(frame.id)),
        el("small", { text: frame.name })
      ]));
    });
    return row;
  }

  function storyReadView() {
    var s = storyBag.session;
    var frame = storyNow().frames[s.readAt];
    var root = el("section", { class: "play story-play", "data-activity": "ke-chuyen", "data-phase": "read" });
    root.appendChild(topbar(s.child, storyNow().title, "Nghe chuyện", function () {
      storyBag.leave("#/c/" + s.child);
    }, function () { say(frame.say); }));
    if (s.banner) root.appendChild(el("p", { class: "tan-banner", text: s.banner }));
    root.appendChild(html("div", { class: "story-hero" }, frameArt(frame.id)));
    root.appendChild(el("p", { class: "prompt", text: frame.say }));
    root.appendChild(storyStrip(s.readAt));
    return root;
  }

  function storyInvite() {
    var s = storyBag.session;
    var root = el("section", { class: "play story-play", "data-activity": "ke-chuyen", "data-phase": "invite" });
    root.appendChild(topbar(s.child, storyNow().title, "Kể lại", function () {
      storyBag.leave("#/c/" + s.child);
    }, function () { say("Con kể lại chuyện này cho Pom nghe nhé."); }));
    root.appendChild(storyStrip(-1));
    root.appendChild(el("p", { class: "prompt", text: "Con kể lại chuyện này cho Pom nghe nhé." }));
    root.appendChild(el("div", { class: "result-actions" }, [
      el("button", { class: "btn btn-primary", text: "Bé kể lại", onClick: function () {
        s.phase = "retell";
        s.readAt = 0;
        s.gen += 1;
        if (HV.speech) HV.speech.cancel();
        renderIf(storyBag);
      } }),
      el("button", { class: "btn", text: s.index + 1 >= s.queue.length ? "Xem sao" : "Câu tiếp", onClick: storyAdvance })
    ]));
    return root;
  }

  function storyRetell() {
    var s = storyBag.session;
    var frames = storyNow().frames;
    var frame = frames[s.readAt];
    var last = s.readAt >= frames.length - 1;
    var root = el("section", { class: "play story-play", "data-activity": "ke-chuyen", "data-phase": "retell" });
    root.appendChild(topbar(s.child, "Bé kể lại", (s.readAt + 1) + "/" + frames.length, function () {
      storyBag.leave("#/c/" + s.child);
    }, null));
    root.appendChild(html("div", { class: "story-hero" }, frameArt(frame.id)));
    root.appendChild(el("p", { class: "prompt", text: frame.name }));
    root.appendChild(storyStrip(s.readAt));
    root.appendChild(el("button", {
      class: "btn btn-primary",
      text: last ? "Kể xong" : "Tiếp",
      onClick: function () {
        if (!last) {
          s.readAt += 1;
          renderIf(storyBag);
          return;
        }
        s.phase = "invite";
        renderIf(storyBag);
      }
    }));
    return root;
  }

  function storyExplain() {
    var s = storyBag.session;
    var frames = storyNow().frames;
    var names = slotNames(frames.length);
    var root = el("section", { class: "play story-play", "data-activity": "ke-chuyen", "data-phase": "explain" });
    root.appendChild(topbar(s.child, storyNow().title, "Xem lại", function () {
      storyBag.leave("#/c/" + s.child);
    }, function () { say(frames[0].why); }));
    root.appendChild(el("p", { class: "prompt", text: "Chưa đúng thứ tự." }));
    var list = el("div", { class: "story-why" });
    frames.forEach(function (frame, index) {
      list.appendChild(el("div", { class: "story-slot" }, [
        html("span", { class: "story-art" }, frameArt(frame.id)),
        el("b", { text: names[index] + ": " + frame.name }),
        el("p", { text: frame.why })
      ]));
    });
    root.appendChild(list);
    root.appendChild(el("button", { class: "btn btn-next", text: "Hiểu rồi", onClick: storyAdvance }));
    return root;
  }

  function storyView(child) {
    if (child !== "mon") {
      var bounce = el("section", { class: "play" });
      bounce.appendChild(topbar("mon", "Sắp xếp tranh", "", function () { location.hash = "#/c/" + child; }, null));
      bounce.appendChild(el("p", { class: "lede", text: "Bài này dành cho Mon." }));
      return bounce;
    }
    if (storyBag.session && storyBag.session.child !== child) {
      storyBag.epoch += 1;
      if (storyBag.session.detach) storyBag.session.detach();
      storyBag.session = null;
    }
    if (!storyBag.session) storyBegin(child);
    if (storyBag.session.detach) {
      storyBag.session.detach();
      storyBag.session.detach = null;
    }
    var phase = storyBag.session.phase;
    if (phase === "done") return doneView(storyBag, "chuyện", "vi");
    if (phase === "read") return storyReadView();
    if (phase === "invite") return storyInvite();
    if (phase === "retell") return storyRetell();
    if (phase === "explain") return storyExplain();
    return storyPlay();
  }

  storyBag.replay = function () {
    var child = storyBag.session ? storyBag.session.child : "mon";
    storyBag.epoch += 1;
    if (storyBag.session && storyBag.session.detach) storyBag.session.detach();
    storyBag.session = null;
    storyBegin(child);
    renderIf(storyBag);
  };

  function storyLines() {
    var lines = [
      "Sắp xếp tranh kể chuyện.",
      "Xếp từ đầu tiên đến cuối cùng.",
      "Xếp đủ tranh đã nhé.",
      "Chưa đúng thứ tự.",
      "Con kể lại chuyện này cho Pom nghe nhé."
    ];
    STORIES.forEach(function (story) {
      lines.push(story.title);
      story.frames.forEach(function (frame) {
        lines.push(frame.say);
        lines.push(frame.why);
      });
    });
    return lines;
  }

  function storyAudit() {
    var problems = [];
    if (STORIES.length < 12) problems.push("bank " + STORIES.length);
    var ids = {};
    STORIES.forEach(function (story) {
      if (ids[story.id]) problems.push("dup " + story.id);
      ids[story.id] = true;
      if (story.frames.length < 3 || story.frames.length > 4) problems.push(story.id + " len");
      var seen = {};
      story.frames.forEach(function (frame) {
        if (seen[frame.id]) problems.push("frame " + frame.id);
        seen[frame.id] = true;
        if (!frame.say || !frame.why || !frame.name) problems.push("line " + frame.id);
        if (!ART[frame.id]) problems.push("art " + frame.id);
      });
    });
    return problems;
  }

  HV.story = {
    card: function (child) {
      if (child !== "mon") return null;
      return entryCard(child, "ke-chuyen", "story-entry", "📖", "Sắp xếp tranh kể chuyện", "10 chuyện · Elsa, Pom, Rapunzel");
    },
    lesson: function (child) {
      if (child !== "mon") return null;
      return entryLesson(child, "ke-chuyen", "📖", "Sắp xếp tranh kể chuyện", "Xếp đầu tiên, tiếp theo, cuối cùng");
    },
    view: storyView,
    audit: storyAudit,
    lines: storyLines,
    bank: STORIES
  };

  /* ---------- Tô màu theo lời nghe (Mon và Gin) ---------- */

  var PAINTS = [
    { id: "red", hex: "#ef4444" },
    { id: "blue", hex: "#3b82f6" },
    { id: "yellow", hex: "#facc15" },
    { id: "green", hex: "#22c55e" },
    { id: "orange", hex: "#fb923c" },
    { id: "purple", hex: "#a855f7" },
    { id: "pink", hex: "#f472b6" },
    { id: "brown", hex: "#a16207" }
  ];
  // Mon has four more colors, so her listening stretches to "light blue", "gray", "black".
  var PAINTS_MON = PAINTS.concat([
    { id: "light blue", hex: "#7dd3fc" },
    { id: "gray", hex: "#9ca3af" },
    { id: "black", hex: "#1f2937" },
    { id: "white", hex: "#ffffff" }
  ]);

  function paintsFor(child) {
    return child === "mon" ? PAINTS_MON : PAINTS;
  }

  function hexOf(id) {
    var i;
    for (i = 0; i < PAINTS_MON.length; i++) if (PAINTS_MON[i].id === id) return PAINTS_MON[i].hex;
    return "#fff";
  }

  function paint(id, fills, dflt) {
    return (fills && fills[id]) || dflt || "#ffffff";
  }

  var INK = "#1d4e89";
  var BG = "#fff8ec";

  function part(name, inner) {
    return '<g data-part="' + name + '" role="button" aria-label="' + name + '">' + inner + "</g>";
  }
  function svgOpen(w, h, label) {
    return '<svg viewBox="0 0 ' + w + " " + h + '" class="paint-svg" role="img" aria-label="' + label + '"><rect width="' + w + '" height="' + h + '" fill="' + BG + '"/>';
  }
  function stroke(w) {
    return ' stroke="' + INK + '" stroke-width="' + (w || 5) + '" stroke-linejoin="round" stroke-linecap="round"';
  }

  function heroSvg(f) {
    return svgOpen(200, 260, "Superhero") +
      part("cape", '<path d="M48 78 L18 236 L100 196 L182 236 L152 78 Z" fill="' + paint("cape", f) + '"' + stroke() + "/>") +
      part("boots", '<path d="M62 176 h30 v48 h-40 z M108 176 h30 v48 h-40 z" fill="' + paint("boots", f) + '"' + stroke() + "/>") +
      '<rect x="68" y="92" width="64" height="88" rx="16" fill="#fff"' + stroke() + "/>" +
      part("star", '<path d="M100 112 l8 16 h18 l-14 12 6 18 -18 -12 -18 12 6 -18 -14 -12 h18z" fill="' + paint("star", f) + '"' + stroke(4) + "/>") +
      '<circle cx="100" cy="62" r="32" fill="#fff"' + stroke() + "/>" +
      part("mask", '<path d="M70 58 h60 v16 q-14 12 -30 0 q-16 12 -30 0z" fill="' + paint("mask", f) + '"' + stroke(4) + "/>") +
      '<circle cx="88" cy="64" r="4" fill="' + INK + '"/><circle cx="112" cy="64" r="4" fill="' + INK + '"/></svg>';
  }

  function pomSvg(f) {
    return svgOpen(240, 180, "Pom") +
      part("tail", '<path d="M168 78 q48 -8 36 -48" fill="none" stroke="' + paint("tail", f) + '" stroke-width="16" stroke-linecap="round"/>') +
      part("body", '<ellipse cx="132" cy="108" rx="58" ry="36" fill="' + paint("body", f) + '"' + stroke() + "/>") +
      part("ear", '<ellipse cx="62" cy="62" rx="22" ry="30" fill="' + paint("ear", f) + '"' + stroke() + "/>") +
      '<circle cx="78" cy="86" r="34" fill="#fff"' + stroke() + "/>" +
      part("collar", '<path d="M58 108 h48 v16 h-48z" fill="' + paint("collar", f) + '"' + stroke(4) + "/>") +
      part("nose", '<ellipse cx="52" cy="98" rx="16" ry="12" fill="' + paint("nose", f) + '"' + stroke(4) + "/>") +
      '<circle cx="70" cy="78" r="4" fill="' + INK + '"/></svg>';
  }

  function shieldSvg(f) {
    return svgOpen(200, 230, "Shield") +
      part("shield", '<path d="M36 28 H164 V120 Q164 190 100 214 Q36 190 36 120 Z" fill="' + paint("shield", f) + '"' + stroke() + "/>") +
      part("star", '<path d="M100 70 l12 24 h26 l-20 16 8 26 -26 -16 -26 16 8 -26 -20 -16 h26z" fill="' + paint("star", f) + '"' + stroke(4) + "/>") +
      part("handle", '<rect x="78" y="176" width="44" height="28" rx="10" fill="' + paint("handle", f) + '"' + stroke() + "/>") +
      "</svg>";
  }

  function wheel(cx, cy, r) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"';
  }
  function wheelsOf(f, spots, r) {
    return part("wheels", spots.map(function (x) {
      return wheel(x[0], x[1], r) + ' fill="' + paint("wheels", f) + '"' + stroke(5) + "/>" +
        wheel(x[0], x[1], Math.round(r / 2.6)) + ' fill="#fff"' + stroke(3) + "/>";
    }).join(""));
  }

  function raceCarSvg(f) {
    return svgOpen(240, 140, "Race car") +
      part("spoiler", '<path d="M12 48 h34 v10 h-34z M24 58 v14 h10 v-14" fill="' + paint("spoiler", f) + '"' + stroke(4) + "/>") +
      part("body", '<path d="M14 98 V78 Q14 68 28 66 L70 62 L92 40 Q98 34 108 34 H152 Q162 34 168 42 L186 62 L216 68 Q228 72 228 86 V98 Z" fill="' + paint("body", f) + '"' + stroke() + "/>") +
      part("stripe", '<rect x="16" y="78" width="210" height="9" fill="' + paint("stripe", f) + '"' + stroke(3) + "/>") +
      part("window", '<path d="M98 44 L82 62 H130 V40 H108 Q102 40 98 44Z M138 40 H152 Q157 40 161 46 L172 62 H138Z" fill="' + paint("window", f, "#dff1ff") + '"' + stroke(4) + "/>") +
      wheelsOf(f, [[58, 100], [188, 100]], 20) + "</svg>";
  }

  function taxiSvg(f) {
    return svgOpen(240, 140, "Taxi") +
      part("sign", '<rect x="106" y="22" width="44" height="14" rx="4" fill="' + paint("sign", f) + '"' + stroke(4) + "/>") +
      part("body", '<path d="M16 98 V80 Q16 70 28 68 L64 66 L84 42 H156 L178 66 L212 70 Q226 74 226 86 V98 Z" fill="' + paint("body", f) + '"' + stroke() + "/>") +
      part("stripe", '<path d="M18 80 h206 v8 h-206z" fill="' + paint("stripe", f) + '"' + stroke(3) + "/>") +
      part("window", '<path d="M90 48 L74 66 H122 V48Z M130 48 H152 L168 66 H130Z" fill="' + paint("window", f, "#dff1ff") + '"' + stroke(4) + "/>") +
      wheelsOf(f, [[60, 100], [186, 100]], 20) + "</svg>";
  }

  function busSvg(f) {
    var wins = "";
    [30, 78, 126, 174].forEach(function (x) { wins += '<rect x="' + x + '" y="38" width="38" height="28" rx="6"/>'; });
    return svgOpen(260, 150, "Bus") +
      part("body", '<rect x="12" y="24" width="236" height="92" rx="16" fill="' + paint("body", f) + '"' + stroke() + "/>") +
      part("stripe", '<rect x="14" y="82" width="232" height="14" fill="' + paint("stripe", f) + '"' + stroke(3) + "/>") +
      part("windows", '<g fill="' + paint("windows", f, "#dff1ff") + '"' + stroke(4) + ">" + wins + "</g>") +
      wheelsOf(f, [[66, 118], [196, 118]], 20) + "</svg>";
  }

  function fireTruckSvg(f) {
    return svgOpen(260, 150, "Fire truck") +
      part("ladder", '<path d="M18 36 H150 M18 50 H150 M30 36 V50 M52 36 V50 M74 36 V50 M96 36 V50 M118 36 V50 M140 36 V50" fill="none" stroke="' + paint("ladder", f, "#c7a46a") + '" stroke-width="7" stroke-linecap="round"/>') +
      part("body", '<path d="M12 62 H160 V112 H12 Z M160 52 H214 L242 82 V112 H160 Z" fill="' + paint("body", f) + '"' + stroke() + "/>") +
      part("window", '<path d="M170 60 H208 L230 82 H170Z" fill="' + paint("window", f, "#dff1ff") + '"' + stroke(4) + "/>") +
      part("light", '<rect x="180" y="38" width="26" height="14" rx="6" fill="' + paint("light", f) + '"' + stroke(4) + "/>") +
      wheelsOf(f, [[56, 116], [198, 116]], 20) + "</svg>";
  }

  function dumpTruckSvg(f) {
    return svgOpen(260, 150, "Dump truck") +
      part("bed", '<path d="M10 44 H150 L160 108 H10 Z" fill="' + paint("bed", f) + '"' + stroke() + "/>") +
      part("cab", '<path d="M160 56 H206 L240 88 V108 H160 Z" fill="' + paint("cab", f) + '"' + stroke() + "/>") +
      part("window", '<path d="M170 64 H202 L222 88 H170Z" fill="' + paint("window", f, "#dff1ff") + '"' + stroke(4) + "/>") +
      wheelsOf(f, [[56, 114], [112, 114], [200, 114]], 18) + "</svg>";
  }

  function princessSvg(f) {
    return svgOpen(200, 270, "Ice princess") +
      part("cape", '<path d="M70 96 L26 250 L100 226 L174 250 L130 96 Z" fill="' + paint("cape", f) + '"' + stroke() + "/>") +
      part("hair", '<path d="M66 60 Q64 28 100 26 Q136 28 134 60 L150 150 Q144 186 132 168 L128 100 L72 100 L68 168 Q56 186 50 150 Z" fill="' + paint("hair", f) + '"' + stroke() + "/>") +
      part("dress", '<path d="M80 100 H120 L158 232 Q100 252 42 232 Z" fill="' + paint("dress", f) + '"' + stroke() + "/>") +
      part("snowflake", '<path d="M100 150 v52 M74 176 h52 M82 158 l36 36 M118 158 l-36 36" fill="none" stroke="' + paint("snowflake", f, "#bfe3ff") + '" stroke-width="7" stroke-linecap="round"/>') +
      '<circle cx="100" cy="66" r="26" fill="#ffe0cc"' + stroke() + "/>" +
      '<circle cx="91" cy="68" r="3.5" fill="' + INK + '"/><circle cx="109" cy="68" r="3.5" fill="' + INK + '"/>' +
      '<path d="M92 80 q8 7 16 0" fill="none"' + stroke(3) + "/>" +
      part("crown", '<path d="M76 42 L82 22 L92 36 L100 18 L108 36 L118 22 L124 42 Z" fill="' + paint("crown", f) + '"' + stroke(4) + "/>") +
      "</svg>";
  }

  function snowmanSvg(f) {
    return svgOpen(200, 270, "Snowman") +
      part("arms", '<path d="M54 140 L12 112 M146 140 L188 112 M30 124 l-10 -14 M170 124 l10 -14" fill="none" stroke="' + paint("arms", f, "#8b5e34") + '" stroke-width="8" stroke-linecap="round"/>') +
      '<circle cx="100" cy="196" r="58" fill="#fff"' + stroke() + "/>" +
      '<circle cx="100" cy="120" r="40" fill="#fff"' + stroke() + "/>" +
      part("buttons", '<circle cx="100" cy="168" r="7" fill="' + paint("buttons", f, "#cbd5e1") + '"' + stroke(3) + '/><circle cx="100" cy="196" r="7" fill="' + paint("buttons", f, "#cbd5e1") + '"' + stroke(3) + '/><circle cx="100" cy="224" r="7" fill="' + paint("buttons", f, "#cbd5e1") + '"' + stroke(3) + "/>") +
      '<circle cx="86" cy="108" r="4" fill="' + INK + '"/><circle cx="114" cy="108" r="4" fill="' + INK + '"/>' +
      part("nose", '<path d="M100 116 L140 124 L100 130 Z" fill="' + paint("nose", f, "#fb923c") + '"' + stroke(3) + "/>") +
      part("scarf", '<path d="M62 146 Q100 164 138 146 L138 162 Q100 180 62 162 Z M112 156 L124 196 L106 196 Z" fill="' + paint("scarf", f) + '"' + stroke(4) + "/>") +
      part("hat", '<path d="M66 90 H134 L124 34 H76 Z M56 90 H144 V100 H56 Z" fill="' + paint("hat", f) + '"' + stroke(4) + "/>") +
      "</svg>";
  }

  function castleSvg(f) {
    return svgOpen(240, 240, "Ice castle") +
      part("wall", '<rect x="64" y="110" width="112" height="104" fill="' + paint("wall", f) + '"' + stroke() + "/>") +
      part("towers", '<rect x="24" y="96" width="46" height="118" fill="' + paint("towers", f) + '"' + stroke() + '/><rect x="170" y="96" width="46" height="118" fill="' + paint("towers", f) + '"' + stroke() + '/><rect x="94" y="70" width="52" height="60" fill="' + paint("towers", f) + '"' + stroke() + "/>") +
      part("roofs", '<path d="M18 98 L47 52 L76 98 Z M164 98 L193 52 L222 98 Z M88 72 L120 22 L152 72 Z" fill="' + paint("roofs", f) + '"' + stroke() + "/>") +
      part("flag", '<path d="M120 22 V4 L146 12 L120 20" fill="' + paint("flag", f) + '"' + stroke(4) + "/>") +
      part("door", '<path d="M98 214 V174 Q120 150 142 174 V214 Z" fill="' + paint("door", f) + '"' + stroke() + "/>") +
      "</svg>";
  }

  function unicornSvg(f) {
    return svgOpen(240, 226, "Unicorn") + '<g transform="translate(0 16)">' +
      part("tail", '<path d="M60 88 Q14 84 20 150 Q34 120 56 112 Z" fill="' + paint("tail", f) + '"' + stroke(4) + "/>") +
      '<path d="M78 122 V186 M102 126 V186 M150 126 V186 M174 122 V186" fill="none" stroke="' + INK + '" stroke-width="14" stroke-linecap="round"/>' +
      part("body", '<ellipse cx="120" cy="108" rx="70" ry="40" fill="' + paint("body", f) + '"' + stroke() + "/>") +
      part("saddle", '<path d="M96 70 Q120 58 144 70 L142 100 H98 Z" fill="' + paint("saddle", f, "#e9d5ff") + '"' + stroke(4) + "/>") +
      '<path d="M172 90 L196 40 L214 52 L200 112 Z" fill="#fff"' + stroke() + "/>" +
      '<circle cx="204" cy="58" r="30" fill="#fff"' + stroke() + "/>" +
      part("horn", '<path d="M198 32 L208 -2 L216 32 Z" fill="' + paint("horn", f) + '"' + stroke(4) + "/>") +
      part("mane", '<path d="M176 40 Q160 60 170 100 Q182 76 184 56 Z" fill="' + paint("mane", f) + '"' + stroke(4) + "/>") +
      '<circle cx="212" cy="54" r="4" fill="' + INK + '"/></g></svg>';
  }

  function penguinSvg(f) {
    return svgOpen(200, 250, "Penguin") +
      part("feet", '<path d="M56 226 q20 -16 40 0 z M104 226 q20 -16 40 0 z" fill="' + paint("feet", f, "#fde68a") + '"' + stroke(4) + "/>") +
      part("body", '<ellipse cx="100" cy="130" rx="64" ry="92" fill="' + paint("body", f, "#e5e7eb") + '"' + stroke() + "/>") +
      '<ellipse cx="100" cy="152" rx="40" ry="64" fill="#fff"/>' +
      '<circle cx="84" cy="88" r="5" fill="' + INK + '"/><circle cx="116" cy="88" r="5" fill="' + INK + '"/>' +
      part("beak", '<path d="M88 100 L112 100 L100 118 Z" fill="' + paint("beak", f, "#fb923c") + '"' + stroke(3) + "/>") +
      part("scarf", '<path d="M48 124 Q100 146 152 124 L152 144 Q100 166 48 144 Z" fill="' + paint("scarf", f) + '"' + stroke(4) + "/>") +
      "</svg>";
  }

  var PICTURES = {
    hero: { title: "Superhero", svg: heroSvg },
    pom: { title: "Pom", svg: pomSvg },
    shield: { title: "Shield", svg: shieldSvg },
    racecar: { title: "Race car", svg: raceCarSvg },
    taxi: { title: "Taxi", svg: taxiSvg },
    bus: { title: "Bus", svg: busSvg },
    firetruck: { title: "Fire truck", svg: fireTruckSvg },
    dumptruck: { title: "Dump truck", svg: dumpTruckSvg },
    princess: { title: "Ice princess", svg: princessSvg },
    snowman: { title: "Snowman", svg: snowmanSvg },
    castle: { title: "Ice castle", svg: castleSvg },
    unicorn: { title: "Unicorn", svg: unicornSvg },
    penguin: { title: "Penguin", svg: penguinSvg }
  };

  var PART_WORD = {
    cape: "cape", mask: "mask", star: "star", boots: "boots", ear: "ear", nose: "nose", collar: "collar", shield: "shield",
    handle: "handle", spoiler: "spoiler", body: "body", stripe: "stripe", window: "window", wheels: "wheels", sign: "sign",
    windows: "windows", ladder: "ladder", light: "light", bed: "dump bed", cab: "cab", hair: "hair", dress: "dress",
    snowflake: "snowflake", crown: "crown", arms: "arms", buttons: "buttons", scarf: "scarf", hat: "hat", wall: "wall",
    towers: "towers", roofs: "roofs", flag: "flag", door: "door", tail: "tail", saddle: "saddle", horn: "horn", mane: "mane",
    feet: "feet", beak: "beak"
  };
  var CAR_WORD = { racecar: "race car", taxi: "taxi", bus: "bus", firetruck: "fire truck", dumptruck: "dump truck" };

  function stepLine(pic, partId, color) {
    var verb = (partId.length + color.length) % 2 ? "Color" : "Make";
    var word = PART_WORD[partId] || partId;
    var plural = /s$/.test(word) && word !== "bus";
    var target = word === "body" && CAR_WORD[pic] ? "the " + CAR_WORD[pic] : "the " + word;
    if (verb === "Make") return "Make " + target + " " + color + "!";
    return "Color " + target + " " + color + "!" + (plural ? "" : "");
  }
  function S(pic, partId, color) {
    return { pic: pic, part: partId, color: color, say: stepLine(pic, partId, color) };
  }

  var SETS = {
    gin: [
      [S("hero", "cape", "blue"), S("hero", "mask", "red"), S("hero", "star", "yellow"), S("hero", "boots", "green"),
        S("pom", "ear", "brown"), S("pom", "nose", "pink"), S("pom", "collar", "orange"),
        S("shield", "shield", "purple"), S("shield", "star", "pink"), S("shield", "handle", "brown")],
      [S("racecar", "body", "red"), S("racecar", "spoiler", "blue"), S("racecar", "stripe", "yellow"),
        S("bus", "body", "yellow"), S("bus", "windows", "blue"), S("bus", "stripe", "green"),
        S("firetruck", "body", "red"), S("firetruck", "ladder", "brown"), S("firetruck", "light", "yellow"), S("firetruck", "window", "blue")],
      [S("taxi", "body", "yellow"), S("taxi", "sign", "red"), S("taxi", "window", "blue"),
        S("dumptruck", "cab", "orange"), S("dumptruck", "bed", "green"), S("dumptruck", "window", "pink"), S("dumptruck", "wheels", "purple"),
        S("racecar", "body", "green"), S("racecar", "stripe", "orange"), S("racecar", "spoiler", "pink")],
      [S("bus", "body", "orange"), S("bus", "windows", "purple"), S("bus", "stripe", "pink"),
        S("taxi", "body", "blue"), S("taxi", "sign", "yellow"), S("taxi", "stripe", "green"),
        S("firetruck", "body", "orange"), S("firetruck", "ladder", "blue"), S("firetruck", "light", "pink"), S("firetruck", "window", "green")],
      [S("hero", "cape", "red"), S("hero", "mask", "yellow"), S("hero", "star", "blue"), S("hero", "boots", "purple"),
        S("pom", "body", "orange"), S("pom", "collar", "green"), S("pom", "tail", "pink"),
        S("shield", "shield", "green"), S("shield", "star", "yellow"), S("shield", "handle", "red")]
    ],
    mon: [
      [S("princess", "dress", "light blue"), S("princess", "crown", "yellow"), S("princess", "cape", "purple"), S("princess", "snowflake", "pink"),
        S("snowman", "hat", "black"), S("snowman", "scarf", "red"), S("snowman", "nose", "orange"),
        S("castle", "roofs", "blue"), S("castle", "door", "brown"), S("castle", "flag", "green")],
      [S("unicorn", "mane", "pink"), S("unicorn", "horn", "yellow"), S("unicorn", "tail", "purple"), S("unicorn", "saddle", "red"),
        S("pom", "ear", "brown"), S("pom", "nose", "black"), S("pom", "collar", "blue"),
        S("penguin", "body", "black"), S("penguin", "beak", "orange"), S("penguin", "scarf", "green")],
      [S("snowman", "scarf", "blue"), S("snowman", "hat", "purple"), S("snowman", "buttons", "red"), S("snowman", "arms", "brown"),
        S("castle", "wall", "gray"), S("castle", "roofs", "red"), S("castle", "flag", "yellow"),
        S("princess", "hair", "yellow"), S("princess", "dress", "pink"), S("princess", "crown", "orange")],
      [S("penguin", "body", "blue"), S("penguin", "scarf", "red"), S("penguin", "feet", "orange"),
        S("unicorn", "mane", "green"), S("unicorn", "tail", "pink"), S("unicorn", "saddle", "purple"),
        S("castle", "roofs", "purple"), S("castle", "door", "red"), S("castle", "flag", "orange"), S("castle", "towers", "light blue")]
    ]
  };

  function setPictures(steps) {
    var seen = [];
    steps.forEach(function (step) { if (seen.indexOf(step.pic) < 0) seen.push(step.pic); });
    return seen;
  }

  var colorBag = makeBag("to-mau", "#/to-mau/");
  var setCursor = { mon: null, gin: null };

  function dayNumber() {
    return Math.floor(Date.now() / 86400000);
  }

  function colorNow() {
    return colorBag.session.steps[colorBag.session.index];
  }

  function colorBegin(child, advance) {
    var sets = SETS[child];
    if (setCursor[child] == null) setCursor[child] = dayNumber() % sets.length;
    else if (advance) setCursor[child] = (setCursor[child] + 1) % sets.length;
    var steps = sets[setCursor[child]].slice();
    var fills = {};
    setPictures(steps).forEach(function (id) { fills[id] = {}; });
    colorBag.epoch += 1;
    colorBag.session = {
      child: child,
      steps: steps,
      index: 0,
      firsts: 0,
      total: steps.length,
      phase: "play",
      attempts: 0,
      color: "",
      fills: fills,
      banner: "",
      gen: 0,
      praiseLine: "",
      praiseSaid: false,
      gallery: null
    };
    if (HV.engine && HV.engine.beginSessionPraise) HV.engine.beginSessionPraise();
    say(steps[0].say, "en");
  }

  function colorAdvance() {
    var s = colorBag.session;
    if (!s) return;
    s.gen += 1;
    s.index += 1;
    s.attempts = 0;
    s.phase = "play";
    s.banner = "";
    s.color = "";
    if (s.index >= s.steps.length) {
      s.phase = "done";
      s.award = roundStars(s.child, s.firsts, s.total);
      s.praiseLine = HV.engine && HV.engine.praise ? HV.engine.praise(s.child, "en") : "Bingo!";
      s.gallery = colorGallery();
      markPlayed(s.child, "to-mau");
      if (HV.audio && HV.audio.fanfare) HV.audio.fanfare();
      renderIf(colorBag);
      return;
    }
    renderIf(colorBag);
    say(colorNow().say, "en");
  }

  function colorGallery() {
    var s = colorBag.session;
    var row = el("div", { class: "paint-gallery" });
    setPictures(s.steps).forEach(function (id) {
      row.appendChild(html("div", { class: "paint-done" }, PICTURES[id].svg(s.fills[id])));
    });
    return row;
  }

  function colorApply(part) {
    var s = colorBag.session;
    if (!s || s.phase !== "play") return;
    var now = Date.now();
    if (s.paintAt && now - s.paintAt < 280) return;
    s.paintAt = now;
    var q = colorNow();
    if (q.pic !== part.pic) return;
    if (!s.color) {
      s.banner = "Pick a color.";
      say(q.say, "en");
      renderIf(colorBag);
      return;
    }
    var good = part.part === q.part && s.color === q.color;
    if (good) {
      s.fills[q.pic][q.part] = hexOf(q.color);
      if (s.attempts === 0) s.firsts += 1;
      s.phase = "lock";
      renderIf(colorBag);
      var line = voicePraise(colorBag, "en");
      s.banner = line;
      if (line) renderIf(colorBag);
      afterSound(colorBag, HV.audio && HV.audio.correct, function () {
        if (line) say(line, "en").then(function () { colorAdvance(); });
        else colorAdvance();
      });
      return;
    }
    s.attempts += 1;
    if (s.attempts < 2) {
      s.banner = "Listen again.";
      if (HV.audio && HV.audio.wrong) HV.audio.wrong();
      say(q.say, "en");
      renderIf(colorBag);
      return;
    }
    s.fills[q.pic][q.part] = hexOf(q.color);
    s.phase = "show";
    s.banner = q.say;
    if (HV.audio && HV.audio.wrong) HV.audio.wrong();
    say(q.say, "en");
    renderIf(colorBag);
  }

  function colorPlay() {
    var s = colorBag.session;
    var q = colorNow();
    var root = el("section", {
      class: "play stage ws-play paint-play is-" + s.child,
      "data-activity": "to-mau",
      "data-pic": q.pic,
      "data-ask": q.part,
      "data-color": q.color
    });
    root.appendChild(topbar(s.child, "Tô màu", (s.index + 1) + "/" + s.total, function () {
      colorBag.leave("#/c/" + s.child);
    }, function () { say(q.say, "en"); }));
    root.appendChild(el("p", { class: "prompt paint-prompt", text: q.say }));
    if (s.banner) root.appendChild(el("p", { class: "tan-banner", role: "status", text: s.banner }));
    var board = html("div", { class: "paint-board" + (s.phase === "show" ? " is-show" : "") }, PICTURES[q.pic].svg(s.fills[q.pic]));
    if (s.phase === "play") {
      var onPaint = function (event) {
        var node = event.target.closest ? event.target.closest("[data-part]") : null;
        if (!node) return;
        colorApply({ pic: q.pic, part: node.getAttribute("data-part") });
      };
      board.addEventListener("click", onPaint);
      board.addEventListener("pointerup", onPaint);
    }
    root.appendChild(board);
    var swatches = el("div", { class: "paint-swatches" + (s.child === "mon" ? " is-wide" : "") });
    paintsFor(s.child).forEach(function (swatch) {
      swatches.appendChild(el("button", {
        class: "paint-swatch" + (s.color === swatch.id ? " is-on" : ""),
        style: { background: swatch.hex },
        "data-swatch": swatch.id,
        "aria-label": swatch.id,
        disabled: s.phase === "play" ? null : true,
        onClick: function () {
          if (!colorBag.session || colorBag.session.phase !== "play") return;
          colorBag.session.color = swatch.id;
          colorBag.session.banner = "";
          if (HV.audio && HV.audio.tap) HV.audio.tap();
          renderIf(colorBag);
        }
      }));
    });
    root.appendChild(swatches);
    if (s.phase === "show") {
      root.appendChild(el("button", { class: "btn btn-primary", text: "Next", onClick: colorAdvance }));
    }
    return root;
  }

  function colorView(child) {
    if (!SETS[child]) return el("section", { class: "play" });
    if (colorBag.session && colorBag.session.child !== child) {
      colorBag.epoch += 1;
      colorBag.session = null;
    }
    if (!colorBag.session) colorBegin(child, false);
    if (colorBag.session.phase === "done") return doneView(colorBag, "câu", "en");
    return colorPlay();
  }

  colorBag.replay = function () {
    var child = colorBag.session ? colorBag.session.child : "gin";
    colorBag.epoch += 1;
    colorBag.session = null;
    colorBegin(child, true);
    renderIf(colorBag);
  };

  function colorAudit() {
    var problems = [];
    Object.keys(SETS).forEach(function (child) {
      var known = paintsFor(child).map(function (p) { return p.id; });
      SETS[child].forEach(function (steps, i) {
        var tag = child + i;
        if (steps.length !== 10) problems.push(tag + " steps " + steps.length);
        steps.forEach(function (step) {
          if (!PICTURES[step.pic]) problems.push(tag + " pic " + step.pic);
          else if (PICTURES[step.pic].svg({}).indexOf('data-part="' + step.part + '"') < 0) problems.push(tag + " part " + step.pic + "." + step.part);
          if (known.indexOf(step.color) < 0) problems.push(tag + " swatch " + step.color);
          if (!step.say) problems.push(tag + " say");
        });
        if (setPictures(steps).length > 4) problems.push(tag + " pictures");
      });
    });
    return problems;
  }

  HV.coloring = {
    card: function (child) {
      if (!SETS[child]) return null;
      return entryCard(child, "to-mau", "paint-entry", "🎨", "Tô màu theo lời nghe",
        child === "mon" ? "Nghe màu, tô công chúa băng, lâu đài, kỳ lân" : "Nghe màu, tô ô tô, xe buýt và Pom");
    },
    lesson: function (child) {
      if (!SETS[child]) return null;
      return entryLesson(child, "to-mau", "🎨", "Tô màu theo lời nghe", child === "mon" ? "Color the dress light blue" : "Color the car red");
    },
    view: colorView,
    audit: colorAudit,
    lines: function () {
      var out = ["Pick a color.", "Listen again.", "Next"];
      Object.keys(SETS).forEach(function (child) {
        SETS[child].forEach(function (steps) { steps.forEach(function (step) { out.push(step.say); }); });
      });
      return out;
    },
    steps: SETS.gin[0],
    sets: SETS,
    pictures: PICTURES
  };
})(globalThis.HV = globalThis.HV || {});
