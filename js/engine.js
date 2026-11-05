(function (HV) {
  "use strict";

  var el = HV.util.el;
  var clear = HV.util.clear;
  var clamp = HV.util.clamp;

  var SHAPES = {
    circle: 1, oval: 1, square: 1, rectangle: 1, triangle: 1,
    diamond: 1, pentagon: 1, hexagon: 1, star: 1, heart: 1
  };

  function allowShape(s) {
    return SHAPES[s] ? s : "";
  }

  function allowColor(c) {
    return /^#[0-9a-fA-F]{6}$/.test(c || "") ? c : "";
  }

  function sanitizeScene(scene) {
    if (!scene || typeof scene !== "object") return null;
    var layout = String(scene.layout || "");
    if (layout === "equation" || layout === "digit") {
      return { layout: layout, text: String(scene.text || "").slice(0, 80) };
    }
    if (layout === "emojis") {
      var items = Array.isArray(scene.items) ? scene.items.map(function (x) { return String(x).slice(0, 8); }).slice(0, 12) : [];
      return { layout: layout, items: items };
    }
    if (layout === "shapes") {
      var shapes = (scene.shapes || []).slice(0, 4).map(function (s) {
        return {
          shape: allowShape(s.shape) || "circle",
          color: allowColor(s.color) || "#3b82f6",
          size: clamp(Number(s.size) || 100, 36, 180)
        };
      });
      return { layout: layout, shapes: shapes };
    }
    if (layout === "pattern") {
      var pieces = (scene.pieces || []).slice(0, 8).map(function (p) {
        return {
          mystery: !!p.mystery,
          shape: allowShape(p.shape) || "circle",
          color: allowColor(p.color) || "#94a3b8",
          emoji: p.emoji ? String(p.emoji).slice(0, 8) : ""
        };
      });
      return { layout: layout, pieces: pieces };
    }
    if (layout === "mirror") {
      var colors = (scene.colors || []).slice(0, 7).map(function (c) { return allowColor(c) || "#cbd5e1"; });
      return { layout: layout, colors: colors };
    }
    if (layout === "zones") {
      var zones = (scene.zones || []).slice(0, 2).map(function (z) {
        return { emoji: String((z && z.emoji) || "").slice(0, 8) };
      });
      return { layout: layout, zones: zones };
    }
    if (layout === "sides") {
      return {
        layout: layout,
        left: { emoji: String(scene.left && scene.left.emoji || "").slice(0, 8) },
        right: { emoji: String(scene.right && scene.right.emoji || "").slice(0, 8) }
      };
    }
    if (layout === "blocks") {
      return {
        layout: layout,
        tens: clamp(Number(scene.tens) || 0, 0, 10),
        ones: clamp(Number(scene.ones) || 0, 0, 10)
      };
    }
    if (layout === "pairs") {
      return { layout: layout, count: clamp(Number(scene.count) || 0, 0, 30) };
    }
    if (layout === "bond") {
      return {
        layout: layout,
        whole: clamp(Number(scene.whole) || 0, 0, 100),
        known: clamp(Number(scene.known) || 0, 0, 100)
      };
    }
    return null;
  }

  function normalize(raw) {
    if (!raw || typeof raw !== "object") return null;
    var kind = raw.kind;
    var q = {
      kind: kind,
      lang: raw.lang === "en" ? "en" : "vi",
      prompt: String(raw.prompt || "").slice(0, 280),
      speak: String(raw.speak || raw.prompt || "").slice(0, 320),
      explain: raw.explain ? String(raw.explain).slice(0, 220) : "",
      scene: sanitizeScene(raw.scene),
      variant: raw.variant === "cards" ? "cards" : ""
    };
    if (!q.prompt) return null;
    if (kind === "choice") {
      var choices = (raw.choices || []).map(function (c, i) {
        return {
          id: "c" + i,
          text: c.text != null ? String(c.text).slice(0, 80) : "",
          emoji: c.emoji ? String(c.emoji).slice(0, 8) : "",
          emojis: Array.isArray(c.emojis) ? c.emojis.map(function (e) { return String(e).slice(0, 8); }).slice(0, 12) : [],
          shape: allowShape(c.shape),
          color: allowColor(c.color),
          size: clamp(Number(c.size) || 0, 0, 180),
          correct: !!c.correct
        };
      }).filter(function (c) {
        return c.text || c.emoji || c.emojis.length || c.shape || c.color;
      });
      if (choices.length < 2 || !choices.some(function (c) { return c.correct; })) return null;
      q.choices = choices;
      q.columns = Number(raw.columns) || (choices.length === 3 ? 3 : 2);
      if (q.columns !== 3) q.columns = 2;
      return q;
    }
    if (kind === "keypad") {
      if (typeof raw.answer !== "number" || !isFinite(raw.answer)) return null;
      q.answer = raw.answer;
      q.maxDigits = clamp(Number(raw.maxDigits) || String(Math.abs(Math.round(raw.answer))).length, 1, 4);
      return q;
    }
    if (kind === "maker") {
      q.answer = clamp(Number(raw.answer) || 1, 1, 10);
      q.emoji = String(raw.emoji || "⭐").slice(0, 8);
      return q;
    }
    if (kind === "spell") {
      var letters = String(raw.word || "").toLowerCase().replace(/[^a-z]/g, "").split("");
      if (letters.length < 2 || letters.length > 7) return null;
      if (letters.some(function (ch, i) { return letters.indexOf(ch) !== i; })) return null;
      q.kind = "order";
      q.hint = "Tap the letters";
      q.tokens = HV.util.shuffle(letters.map(function (ch, i) {
        return { id: "t" + i, text: ch.toUpperCase(), order: i };
      }));
      return q;
    }
    if (kind === "order") {
      var tokens = (raw.tokens || []).map(function (t, i) {
        return {
          id: "t" + i,
          text: String(t.text || "").slice(0, 12),
          order: Number(t.order)
        };
      }).filter(function (t) { return t.text; });
      if (tokens.length < 2 || tokens.some(function (t) { return !isFinite(t.order); })) return null;
      q.tokens = tokens;
      q.hint = raw.hint ? String(raw.hint).slice(0, 40) : "";
      return q;
    }
    if (kind === "select") {
      q.mode = raw.mode === "targets" ? "targets" : "count";
      q.count = Number(raw.count) || 0;
      q.items = (raw.items || []).map(function (it, i) {
        return {
          id: "i" + i,
          emoji: it.emoji ? String(it.emoji).slice(0, 8) : "",
          shape: allowShape(it.shape),
          color: allowColor(it.color),
          target: !!it.target
        };
      }).filter(function (it) { return it.emoji || it.shape || it.color; });
      if (!q.items.length) return null;
      if (q.mode === "count" && (q.count < 1 || q.count > q.items.length)) return null;
      if (q.mode === "targets" && !q.items.some(function (it) { return it.target; })) return null;
      return q;
    }
    return null;
  }

  function renderScene(scene) {
    if (!scene) return null;
    if (scene.layout === "equation") {
      return el("div", { class: "scene scene-equation", text: scene.text });
    }
    if (scene.layout === "digit") {
      return el("div", { class: "scene scene-digit", text: scene.text });
    }
    if (scene.layout === "emojis") {
      var row = el("div", { class: "scene scene-emojis" });
      scene.items.forEach(function (item) {
        row.appendChild(el("span", { class: "emoji-bit", text: item }));
      });
      return row;
    }
    if (scene.layout === "shapes") {
      var box = el("div", { class: "scene scene-shapes" });
      scene.shapes.forEach(function (s) {
        box.appendChild(HV.art.shape(s.shape, s.color, s.size));
      });
      return box;
    }
    if (scene.layout === "pattern") {
      var prow = el("div", { class: "scene scene-pattern" });
      scene.pieces.forEach(function (p) {
        if (p.mystery) prow.appendChild(el("div", { class: "mystery", text: "?" }));
        else prow.appendChild(el("div", { class: "pattern-cell" }, HV.art.shape(p.shape || "circle", p.color, 58)));
      });
      return prow;
    }
    if (scene.layout === "mirror") {
      var mirror = el("div", { class: "scene scene-mirror" });
      scene.colors.forEach(function (color) {
        var dot = el("i", { class: "mirror-dot" });
        dot.style.background = color;
        mirror.appendChild(dot);
      });
      mirror.appendChild(el("i", { class: "mirror-line" }));
      return mirror;
    }
    if (scene.layout === "zones") {
      var zones = el("div", { class: "scene scene-zones" });
      var sky = el("div", { class: "zone zone-sky" });
      var ground = el("div", { class: "zone zone-ground" });
      if (scene.zones[0]) sky.appendChild(el("span", { text: scene.zones[0].emoji }));
      if (scene.zones[1]) ground.appendChild(el("span", { text: scene.zones[1].emoji }));
      zones.appendChild(sky);
      zones.appendChild(ground);
      return zones;
    }
    if (scene.layout === "sides") {
      return el("div", { class: "scene scene-sides" }, [
        el("div", { class: "side" }, el("span", { text: scene.left.emoji || "" })),
        el("div", { class: "side" }, el("span", { text: scene.right.emoji || "" }))
      ]);
    }
    if (scene.layout === "blocks") {
      var blocks = el("div", { class: "scene scene-blocks" });
      var tensCol = el("div", { class: "block-col" });
      tensCol.appendChild(el("p", { class: "block-label", text: "chục" }));
      var rods = el("div", { class: "rods" });
      for (var t = 0; t < scene.tens; t++) rods.appendChild(el("i", { class: "rod" }));
      if (!scene.tens) rods.appendChild(el("i", { class: "rod is-empty", text: "0" }));
      tensCol.appendChild(rods);
      var onesCol = el("div", { class: "block-col" });
      onesCol.appendChild(el("p", { class: "block-label", text: "đơn vị" }));
      var dots = el("div", { class: "ones" });
      for (var o = 0; o < scene.ones; o++) dots.appendChild(el("i", { class: "one" }));
      if (!scene.ones) dots.appendChild(el("i", { class: "one is-empty", text: "0" }));
      onesCol.appendChild(dots);
      blocks.appendChild(tensCol);
      blocks.appendChild(onesCol);
      return blocks;
    }
    if (scene.layout === "pairs") {
      var pairs = el("div", { class: "scene scene-pairs" });
      for (var p = 0; p < scene.count; p++) {
        var dotp = el("i", { class: p === scene.count - 1 && scene.count % 2 === 1 ? "pair-dot is-extra" : "pair-dot" });
        pairs.appendChild(dotp);
      }
      return pairs;
    }
    if (scene.layout === "bond") {
      return el("div", { class: "scene scene-bond" }, [
        el("div", { class: "bond-whole", text: String(scene.whole) }),
        el("div", { class: "bond-arms" }),
        el("div", { class: "bond-parts" }, [
          el("div", { text: String(scene.known) }),
          el("div", { class: "is-q", text: "?" })
        ])
      ]);
    }
    return null;
  }

  function choiceFace(c) {
    var bits = [];
    if (c.emojis && c.emojis.length) {
      var cluster = el("span", { class: "choice-emojis" });
      c.emojis.forEach(function (e) { cluster.appendChild(el("i", { text: e })); });
      bits.push(cluster);
    } else if (c.emoji) bits.push(el("span", { class: "choice-emoji", text: c.emoji }));
    if (c.shape) bits.push(HV.art.shape(c.shape, c.color || "#3b82f6", c.size || 78));
    else if (c.color) {
      var sw = el("span", { class: "swatch" });
      sw.style.background = c.color;
      bits.push(sw);
    }
    if (c.text) bits.push(el("span", { class: "choice-text", text: c.text }));
    return bits;
  }

  var PRAISE = [
    "Yahoooo!",
    "Ui ôi đỉnh thế!",
    "Yahiii giỏi quá!",
    "Woaaa siêu quá!",
    "Tuyệt cú mèo!",
    "Hoan hô bé!",
    "Đỉnh của chóp!",
    "Giỏi xuất sắc luôn!",
    "Hay quá trời!",
    "Úi giỏi quá đi!",
    "Chuẩn luôn!",
    "Xuất sắc!",
    "Ôi đúng rồi!",
    "Quá đỉnh!",
    "Giỏi quá xá!",
    "Bùng nổ luôn!",
    "Ô kê la!",
    "Tuyệt vời ông mặt trời!",
    "Đúng bài quá!",
    "Mê quá đi!",
    "Siêu luôn!",
    "Giỏi dữ vậy!",
    "Trời ơi giỏi!",
    "Đỉnh thật sự!",
    "Hay không chịu được!",
    "A ha đúng rồi!",
    "Quá đã!",
    "Giỏi hết chỗ nói!"
  ];
  var PRAISE_EXTRA = {
    mon: [
      "Elsa khen Mon giỏi quá!",
      "Cún Vàng vẫy đuôi rồi nè!",
      "Mon ơi giỏi quá!",
      "Mon đúng rồi nè!",
      "Mẹ Vy khen Mon giỏi lắm!",
      "Bố Hà vỗ tay cho Mon!",
      "Cún Vàng nhảy lên vì Mon!",
      "Mon làm được rồi!"
    ],
    gin: [
      "Siêu anh hùng Gin đỉnh quá!",
      "Gin ơi giỏi quá!",
      "Gin đúng rồi!",
      "Mẹ Vy khen Gin giỏi lắm!",
      "Bố Hà cười với Gin!",
      "Ô tô của Gin kêu bíp bíp!",
      "Gin làm được rồi!",
      "Cún Vàng vẫy đuôi cho Gin!"
    ]
  };
  var praiseBag = { mon: [], gin: [] };

  function praise(child) {
    var key = child === "gin" ? "gin" : "mon";
    var daily = Array.isArray(HV.dailyPraise) ? HV.dailyPraise : [];
    var list = PRAISE.concat(PRAISE_EXTRA[key] || []).concat(daily);
    if (!praiseBag[key].length) praiseBag[key] = HV.util.shuffle(list);
    var line = praiseBag[key].pop();
    if (line === praiseBag.last && praiseBag[key].length) {
      var swap = praiseBag[key].pop();
      praiseBag[key].push(line);
      line = swap;
    }
    praiseBag.last = line;
    return line;
  }

  function voiceFor(child) {
    return child === "gin" ? { rate: 0.86, pitch: 1.12 } : { rate: 0.95, pitch: 1.02 };
  }

  function mount(container, question, opts) {
    clear(container);
    var child = opts.child || "mon";
    var lang = question.lang === "en" ? "en" : "vi";
    var attempts = 0;
    var settled = false;
    var busy = false;
    var locked = false;
    var pending = null;
    var maxAttempts = child === "gin" ? 2 : 1;
    var firstSuccess = false;

    function cleanup() {
      if (pending) clearTimeout(pending);
      document.removeEventListener("keydown", onKey);
    }

    function finish(first, extra) {
      if (settled) return;
      settled = true;
      if (pending) clearTimeout(pending);
      document.removeEventListener("keydown", onKey);
      opts.onDone(!!first, extra || null);
    }

    function lockInputs() {
      locked = true;
      container.querySelectorAll("button").forEach(function (b) {
        if (!b.classList.contains("btn-next")) b.disabled = true;
      });
    }

    function speakNow(text, forceLang, chain) {
      var optsVoice = voiceFor(child);
      optsVoice.lang = forceLang || lang;
      if (chain) optsVoice.chain = true;
      var spoken = HV.speech.speak(text, optsVoice);
      return Promise.resolve(spoken).then(function (sec) {
        return typeof sec === "number" && sec > 0 ? sec : 1.1;
      }).catch(function () { return 1.1; });
    }

    function afterSound(play, then) {
      var dur = 0;
      try { dur = play() || 0; } catch (e) { dur = 0; }
      var timer = setTimeout(then, Math.round(dur * 1000) + 40);
      if (opts.track) opts.track(timer);
    }

    function hopAid(scene) {
      if (!scene || scene.layout !== "equation") return null;
      var raw = String(scene.text || "");
      var plus = raw.match(/(\d+)\s*\+\s*(\d+)/);
      var minus = raw.match(/(\d+)\s*[−-]\s*(\d+)/);
      var up = !!plus;
      var m = plus || minus;
      if (!m) return null;
      var a = Number(m[1]);
      var b = Number(m[2]);
      if (!b || b > 8) return null;
      var row = el("div", { class: "hop-line", "aria-hidden": "true" });
      row.appendChild(el("i", { class: "is-start", text: String(a) }));
      var n = a;
      for (var i = 1; i <= b; i++) {
        n = up ? n + 1 : n - 1;
        row.appendChild(el("i", { text: String(n) }));
      }
      return row;
    }

    function showFeedback(good, text, first) {
      lockInputs();
      firstSuccess = !!first;
      var showExplain = !!text && (!good || opts.hard);
      var line = good ? praise(child) : (lang === "en" ? "Not quite" : "Chưa đúng");
      var face = good ? el("img", {
        class: "praise-face",
        src: "assets/kids/" + (child === "gin" ? "gin" : "mon") + ".webp",
        alt: ""
      }) : null;
      var nextLabel = !good
        ? (lang === "en" ? "Got it" : "Hiểu rồi")
        : (opts.isLast ? (lang === "en" ? "See stars" : "Xem sao") : (lang === "en" ? "Next" : "Tiếp tục"));
      var bar = el("div", { class: "feedback " + (good ? "is-good" : "is-bad"), role: "status" }, [
        face,
        el("strong", { text: line }),
        showExplain ? el("p", { text: text }) : null,
        showExplain ? hopAid(question.scene) : null,
        el("button", {
          class: "btn btn-next",
          text: nextLabel,
          onClick: function () { finish(firstSuccess, good ? null : { retry: true }); }
        })
      ]);
      container.appendChild(bar);
      var sayLang = good ? "vi" : lang;
      afterSound(good ? HV.audio.correct : HV.audio.wrong, function () {
        if (settled) return;
        var firstSay = good ? speakNow(line, "vi") : speakNow(text || (lang === "en" ? "Try again." : "Chưa đúng, mình xem đáp án nhé"), sayLang);
        firstSay.then(function (sec) {
          if (settled) return;
          if (good && showExplain) {
            return speakNow(text, "vi", true).then(function (more) {
              if (settled) return;
              pending = setTimeout(function () { finish(firstSuccess); }, Math.max(700, Math.round((more || 1) * 1000) + 400));
              if (opts.track) opts.track(pending);
            });
          }
          if (!good) return;
          pending = setTimeout(function () { finish(firstSuccess); }, Math.max(600, Math.round(sec * 1000) + 400));
          if (opts.track) opts.track(pending);
        });
      });
    }

    function softWrong(node, say) {
      attempts += 1;
      busy = true;
      if (node) node.classList.add("is-wrong");
      afterSound(HV.audio.wrong, function () {
        if (settled) return;
        speakNow(say || (lang === "en" ? "Try again." : "Thử lại nhé"), lang);
      });
      setTimeout(function () {
        busy = false;
        if (node) node.classList.remove("is-wrong");
      }, 700);
    }

    var onKey = function () {};
    var sceneNode = renderScene(question.scene);
    if (sceneNode) container.appendChild(sceneNode);

    if (question.kind === "choice") {
      var grid = el("div", { class: "choices cols-" + question.columns + (question.variant === "cards" ? " is-cards" : "") });
      question.choices.forEach(function (choice) {
        var btn = el("button", { class: "choice" }, choiceFace(choice));
        btn.addEventListener("click", function () {
          if (locked || busy || settled) return;
          if (choice.correct) {
            attempts += 1;
            btn.classList.add("is-correct");
            showFeedback(true, question.explain, attempts === 1);
          } else if (attempts + 1 < maxAttempts) {
            softWrong(btn, "Thử lại nhé");
          } else {
            attempts += 1;
            btn.classList.add("is-wrong");
            grid.querySelectorAll(".choice").forEach(function (other, idx) {
              if (question.choices[idx] && question.choices[idx].correct) other.classList.add("is-correct");
            });
            var right = question.choices.filter(function (c) { return c.correct; })[0];
            var label = right && right.text ? right.text : "đáp án được tô màu";
            showFeedback(false, question.explain || ("Đáp án là " + label), false);
          }
        });
        grid.appendChild(btn);
      });
      container.appendChild(grid);
    }

    if (question.kind === "keypad") {
      var entry = "";
      var display = el("div", { class: "keypad-display is-empty", text: "•" });
      function sync() {
        display.textContent = entry || "•";
        display.classList.toggle("is-empty", !entry);
      }
      function pushDigit(d) {
        if (locked || settled) return;
        if (entry.length >= question.maxDigits) return;
        entry += String(d);
        sync();
        HV.audio.tap();
      }
      function back() {
        if (locked || settled) return;
        entry = entry.slice(0, -1);
        sync();
      }
      function submit() {
        if (locked || settled || busy || !entry) return;
        var value = Number(entry);
        if (value === question.answer) {
          attempts += 1;
          display.classList.add("is-correct");
          showFeedback(true, question.explain, attempts === 1);
        } else if (attempts + 1 < maxAttempts) {
          attempts += 1;
          busy = true;
          display.classList.add("is-shake");
          HV.audio.wrong();
          speakNow(lang === "en" ? "Try again." : "Chưa đúng, thử lại nhé");
          setTimeout(function () {
            busy = false;
            entry = "";
            sync();
            display.classList.remove("is-shake");
          }, 450);
        } else {
          attempts += 1;
          display.classList.add("is-wrong");
          showFeedback(false, "Đáp án là " + question.answer + (question.explain ? ". " + question.explain : ""), false);
        }
      }
      var keys = el("div", { class: "keypad" });
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "←", "0", "✓"].forEach(function (k) {
        var b = el("button", { class: "key" + (k === "✓" ? " is-go" : k === "←" ? " is-del" : ""), text: k });
        b.addEventListener("click", function () {
          if (k === "←") back();
          else if (k === "✓") submit();
          else pushDigit(k);
        });
        keys.appendChild(b);
      });
      var padWrap = el("div", { class: "pad-wrap" }, [display, keys]);
      container.appendChild(padWrap);
      container.classList.add("is-split");
      onKey = function (e) {
        if (settled || locked) return;
        if (e.key >= "0" && e.key <= "9") pushDigit(e.key);
        else if (e.key === "Backspace") { e.preventDefault(); back(); }
        else if (e.key === "Enter") submit();
      };
      document.addEventListener("keydown", onKey);
    }

    if (question.kind === "maker") {
      var count = 0;
      var stage = el("div", { class: "maker-stage" });
      function draw() {
        clear(stage);
        if (!count) stage.appendChild(el("p", { class: "maker-empty", text: "Chưa có gì" }));
        for (var i = 0; i < count; i++) stage.appendChild(el("span", { text: question.emoji }));
      }
      draw();
      var controls = el("div", { class: "maker-controls" }, [
        el("button", {
          class: "btn maker-btn",
          text: "Bớt",
          onClick: function () {
            if (locked || count <= 0) return;
            count -= 1;
            draw();
            HV.audio.tap();
          }
        }),
        el("button", {
          class: "btn btn-primary maker-btn",
          text: "Thêm " + question.emoji,
          onClick: function () {
            if (locked || count >= question.answer + 4) return;
            count += 1;
            draw();
            HV.audio.tap();
          }
        }),
        el("button", {
          class: "btn btn-accent maker-btn",
          text: "Xong",
          onClick: function () {
            if (locked || settled) return;
            if (count === question.answer) {
              attempts += 1;
              showFeedback(true, question.explain, attempts === 1);
            } else if (attempts + 1 < maxAttempts) {
              softWrong(stage, count < question.answer ? "Chưa đủ, thêm nữa nhé" : "Hơi nhiều rồi, bớt bớt nhé");
            } else {
              attempts += 1;
              showFeedback(false, "Cần đúng " + question.answer + ". " + (question.explain || ""), false);
            }
          }
        })
      ]);
      container.appendChild(stage);
      container.appendChild(controls);
      container.classList.add("is-split");
    }

    if (question.kind === "select") {
      var selected = {};
      var need = question.mode === "count"
        ? question.count
        : question.items.filter(function (it) { return it.target; }).length;
      var counter = el("p", { class: "select-count", text: "Đã chọn 0 / " + need });
      var gridS = el("div", { class: "select-grid" });
      question.items.forEach(function (item) {
        var face = [];
        if (item.emoji) face.push(el("span", { class: "choice-emoji", text: item.emoji }));
        if (item.shape || item.color) face.push(HV.art.shape(item.shape || "circle", item.color || "#3b82f6", 72));
        var btn = el("button", { class: "select-item", "aria-pressed": "false" }, face);
        btn.addEventListener("click", function () {
          if (locked || settled) return;
          selected[item.id] = !selected[item.id];
          btn.classList.toggle("is-on", !!selected[item.id]);
          btn.setAttribute("aria-pressed", selected[item.id] ? "true" : "false");
          var n = Object.keys(selected).filter(function (k) { return selected[k]; }).length;
          counter.textContent = "Đã chọn " + n + " / " + need;
          HV.audio.tap();
        });
        gridS.appendChild(btn);
      });
      var done = el("button", {
        class: "btn btn-primary select-done",
        text: "Xong",
        onClick: function () {
          if (locked || settled) return;
          var ids = Object.keys(selected).filter(function (k) { return selected[k]; });
          var ok = false;
          if (question.mode === "count") ok = ids.length === question.count;
          else {
            var targets = question.items.filter(function (it) { return it.target; }).map(function (it) { return it.id; });
            ok = ids.length === targets.length && targets.every(function (id) { return ids.indexOf(id) >= 0; });
          }
          if (ok) {
            attempts += 1;
            showFeedback(true, question.explain, attempts === 1);
          } else if (attempts + 1 < maxAttempts) {
            softWrong(gridS, "Chưa đúng, đếm lại nhé");
          } else {
            attempts += 1;
            if (question.mode === "targets") {
              gridS.querySelectorAll(".select-item").forEach(function (node, idx) {
                if (question.items[idx].target) node.classList.add("is-correct");
              });
            }
            showFeedback(false, question.explain || ("Cần chọn đúng " + need), false);
          }
        }
      });
      container.appendChild(counter);
      container.appendChild(gridS);
      container.appendChild(done);
    }

    if (question.kind === "order") {
      var pool = question.tokens.slice();
      var placed = [];
      var tray = el("div", { class: "order-tray" });
      var bank = el("div", { class: "order-bank" });
      function paint() {
        clear(tray);
        clear(bank);
        if (!placed.length) tray.appendChild(el("span", { class: "tray-hint", text: question.hint || "Số bé đứng trước" }));
        placed.forEach(function (tok) {
          tray.appendChild(el("span", { class: "token is-placed", text: tok.text }));
        });
        pool.forEach(function (tok) {
          var b = el("button", { class: "token", text: tok.text });
          b.addEventListener("click", function () {
            if (locked || settled) return;
            pool = pool.filter(function (p) { return p.id !== tok.id; });
            placed.push(tok);
            HV.audio.tap();
            paint();
            if (!pool.length) check();
          });
          bank.appendChild(b);
        });
      }
      function check() {
        var expect = question.tokens.slice().sort(function (a, b) { return a.order - b.order; });
        var ok = placed.every(function (tok, i) { return tok.id === expect[i].id; });
        if (ok) {
          attempts += 1;
          tray.classList.add("is-correct");
          showFeedback(true, question.explain, attempts === 1);
        } else if (attempts + 1 < maxAttempts) {
          attempts += 1;
          tray.classList.add("is-shake");
          HV.audio.wrong();
          speakNow(lang === "en" ? "Try again." : "Chưa đúng thứ tự, thử lại nhé");
          setTimeout(function () {
            pool = question.tokens.slice();
            placed = [];
            tray.classList.remove("is-shake");
            paint();
          }, 500);
        } else {
          attempts += 1;
          placed = expect.slice();
          pool = [];
          paint();
          tray.classList.add("is-correct");
          showFeedback(false, question.explain || "Thứ tự đúng đang hiện ở trên.", false);
        }
      }
      var reset = el("button", {
        class: "btn order-reset",
        text: lang === "en" ? "Again" : "Làm lại",
        onClick: function () {
          if (locked || settled || !placed.length) return;
          pool = question.tokens.slice();
          placed = [];
          paint();
        }
      });
      paint();
      container.appendChild(tray);
      container.appendChild(bank);
      container.appendChild(reset);
    }

    return cleanup;
  }

  HV.engine = {
    normalize: normalize,
    mount: mount,
    resetPraise: function () { praiseBag.mon = []; praiseBag.gin = []; praiseBag.last = ""; }
  };
})(globalThis.HV = globalThis.HV || {});
