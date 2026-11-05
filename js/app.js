(function (HV) {
  "use strict";

  var U = HV.util;
  var S = HV.storage;
  var el = U.el;
  var clear = U.clear;

  var state = {
    route: { name: "home" },
    daily: { date: U.todayStr(), exercises: [], pending: true, error: false },
    session: null,
    destroy: null,
    timers: [],
    modal: null,
    toast: "",
    toastTimer: 0,
    draft: null,
    pendingImport: null,
    sync: { state: "local", detail: "Máy này" }
  };

  function syncLabel() {
    if (state.sync.state === "online") return "Đã đồng bộ";
    if (state.sync.state === "connecting") return "Đang nối sổ sao";
    if (state.sync.state === "offline") return "Ngoại tuyến";
    if (state.sync.state === "error") return "Chưa nối mạng";
    return "Máy này";
  }

  function knownChild(id) {
    return id === "mon" || id === "gin";
  }

  function knownSubject(id) {
    return id === "math" || id === "english" || id === "vietnamese";
  }

  function categoriesFor(subject) {
    var map = HV.subjectCategories || {};
    if (map[subject]) return map[subject];
    if (subject === "math") return HV.categories;
    return [];
  }

  function findCategory(subject, id) {
    return categoriesFor(subject).filter(function (c) { return c.id === id; })[0] || null;
  }

  function subjectOf(ex) {
    return ex && knownSubject(ex.subject) ? ex.subject : "math";
  }

  function parseRoute() {
    var raw = (location.hash || "").replace(/^#/, "");
    var parts = raw.split("/").filter(Boolean);
    if (!parts.length) return { name: "home" };
    if (parts[0] === "c" && knownChild(parts[1])) {
      var child = parts[1];
      if (parts[2] && knownSubject(parts[2])) {
        if (parts[3] === "lv" && /^[1-4]$/.test(parts[4] || "")) {
          return { name: "level", child: child, subject: parts[2], level: Number(parts[4]) };
        }
        if (parts[3] && findCategory(parts[2], parts[3])) {
          return { name: "category", child: child, subject: parts[2], category: parts[3] };
        }
        return { name: "subject", child: child, subject: parts[2] };
      }
      if (parts[2] && findCategory("math", parts[2])) {
        return { name: "category", child: child, subject: "math", category: parts[2] };
      }
      return { name: "menu", child: child };
    }
    if (parts[0] === "play" && parts[1]) return { name: "play", id: decodeURIComponent(parts[1]) };
    if (parts[0] === "board" && knownChild(parts[1])) return { name: "board", child: parts[1] };
    if (parts[0] === "parents") return { name: "parents" };
    return { name: "home" };
  }

  function applyChrome(child) {
    if (child) document.body.setAttribute("data-child", child);
    else document.body.removeAttribute("data-child");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", child === "gin" ? "#ffb703" : child === "mon" ? "#8ec9f5" : "#f6f1e6");
  }

  function weekStars(child) {
    return S.summarizeWeek(child, U.weekStart(U.todayStr())).stars;
  }

  function voiceFor(child) {
    return child === "gin" ? { rate: 0.86, pitch: 1.12 } : { rate: 0.95, pitch: 1.02 };
  }

  function kidPhoto(child, size) {
    return el("img", {
      class: "avatar avatar-" + size,
      src: "assets/kids/" + child + ".webp",
      alt: "",
      width: "512",
      height: "512"
    });
  }

  function cleanup() {
    state.timers.forEach(function (t) { clearTimeout(t); });
    state.timers = [];
    if (state.destroy) {
      state.destroy();
      state.destroy = null;
    }
    HV.speech.cancel();
  }

  function toast(msg) {
    state.toast = msg;
    var old = document.querySelector(".toast");
    if (old) old.remove();
    var node = el("div", { class: "toast", role: "status", text: msg });
    document.getElementById("app").appendChild(node);
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(function () {
      state.toast = "";
      if (node.parentNode) node.parentNode.removeChild(node);
    }, 3200);
  }

  function openModal(modal) {
    state.modal = modal;
    var old = document.querySelector(".modal-back");
    if (old) old.remove();
    document.getElementById("app").appendChild(viewModal());
  }

  function closeModal() {
    state.modal = null;
    state.pendingImport = null;
    var old = document.querySelector(".modal-back");
    if (old) old.remove();
  }

  function topbar(opts) {
    var settings = S.data().settings;
    var soundOn = settings.sound !== false;
    var speechOn = settings.speech !== false;
    return el("header", { class: "topbar" }, [
      opts.back
        ? el("button", { class: "icon-btn", "data-go": opts.back, "aria-label": "Quay lại", text: "←" })
        : el("span", { class: "icon-spacer" }),
      opts.child === "mon" || opts.child === "gin" ? kidPhoto(opts.child, "sm") : null,
      el("div", { class: "top-title" }, [
        el("strong", { text: opts.title }),
        opts.sub ? el("span", { text: opts.sub }) : null
      ]),
      opts.child
        ? el("button", { class: "star-pill", "data-go": "#/board/" + opts.child, "aria-label": "Bảng xếp hạng", text: "★ " + weekStars(opts.child) })
        : el("span", { class: "sync-chip", "data-sync": "1", text: syncLabel() }),
      el("button", {
        class: "icon-btn" + (speechOn ? "" : " is-off"),
        "data-act": "toggle-speech",
        "data-setting": "speech",
        "aria-pressed": String(speechOn),
        "aria-label": speechOn ? "Tắt đọc to" : "Bật đọc to",
        text: "🗣️"
      }),
      el("button", {
        class: "icon-btn" + (soundOn ? "" : " is-off"),
        "data-act": "toggle-sound",
        "data-setting": "sound",
        "aria-pressed": String(soundOn),
        "aria-label": soundOn ? "Tắt tiếng" : "Bật tiếng",
        text: soundOn ? "🔔" : "🔕"
      })
    ]);
  }

  function syncText() {
    var label = syncLabel();
    if (state.sync.detail && state.sync.detail !== label) return label + " · " + state.sync.detail;
    return label;
  }

  function syncLine() {
    return el("p", { class: "sync-line", "data-sync": "1", text: syncText() });
  }

  function viewHome() {
    var mon = S.allTime("mon");
    var gin = S.allTime("gin");
    var root = el("section", { class: "home" });
    root.appendChild(el("div", { class: "home-hero" }, [
      el("p", { class: "kicker", text: "Học cùng Mon và Gin" }),
      el("h1", { text: "Học vui" }),
      el("p", { class: "lede", text: "Chạm vào bạn nào học hôm nay." })
    ]));
    var grid = el("div", { class: "kid-grid" });
    grid.appendChild(kidCard("mon", mon.stars));
    grid.appendChild(kidCard("gin", gin.stars));
    root.appendChild(grid);
    root.appendChild(el("div", { class: "home-foot" }, [
      syncLine(),
      el("button", { class: "text-link", "data-go": "#/parents", text: "Phụ huynh xem sao" }),
      el("p", { class: "fine", text: "Không cần mật khẩu. Sao được lưu trên máy và đồng bộ khi có mạng." })
    ]));
    return root;
  }

  function kidCard(id, stars) {
    var meta = HV.kids[id];
    var btn = el("button", {
      class: "kid-card kid-" + id,
      "data-go": "#/c/" + id,
      "aria-label": "Vào học cùng " + meta.name + ", " + meta.age
    });
    if (id === "mon") HV.art.flakes(btn, 10);
    var art = el("div", { class: "card-art" });
    if (id === "mon") {
      art.appendChild(kidPhoto("mon", "lg"));
      art.appendChild(HV.art.puppy());
    } else {
      art.appendChild(kidPhoto("gin", "lg"));
      art.appendChild(HV.art.car());
    }
    btn.appendChild(art);
    btn.appendChild(el("p", { class: "kid-kicker", text: meta.tagline }));
    btn.appendChild(el("h2", { text: meta.name }));
    btn.appendChild(el("p", { class: "kid-age", text: meta.age }));
    btn.appendChild(el("span", { class: "enter-pill", text: "★ " + stars + " sao  ·  Vào học" }));
    return btn;
  }

  function subjectMeta(id) {
    return (HV.subjects || []).filter(function (s) { return s.id === id; })[0] || { id: id, title: id, short: id, icon: "📘", blurb: { mon: "", gin: "" } };
  }

  function subjectPills(by) {
    var row = el("div", { class: "sub-pills" });
    (HV.subjects || []).forEach(function (sub) {
      var stars = by && by[sub.id] ? by[sub.id].stars : 0;
      row.appendChild(el("span", { class: "sub-pill", text: sub.icon + " " + sub.short + " " + stars }));
    });
    return row;
  }

  function categoryTier(child, subject, category) {
    var best = 1;
    HV.catalog.forEach(function (ex) {
      if (ex.child === child && subjectOf(ex) === subject && ex.category === category) {
        best = Math.max(best, S.monTier(ex));
      }
    });
    return best;
  }

  function orderedExercises(child, list) {
    if (child !== "mon") return list.slice();
    return list.slice().sort(function (a, b) {
      var oa = S.cardOffer(child, a);
      var ob = S.cardOffer(child, b);
      if (oa.mastered !== ob.mastered) return oa.mastered ? 1 : -1;
      return ob.tier - oa.tier;
    });
  }

  function exerciseCard(child, ex, best) {
    var offer = child === "mon" ? S.cardOffer(child, ex) : null;
    return el("button", {
      class: "ex-card" + (offer && offer.tier >= 2 ? " is-rich" : "") + (offer && offer.mastered ? " is-mastered" : ""),
      "data-go": "#/play/" + encodeURIComponent(ex.id)
    }, [
      el("span", { class: "ex-icon", text: ex.icon || "✏️" }),
      el("span", { class: "ex-copy" }, [
        el("strong", { text: ex.title }),
        el("small", { text: ex.subtitle || "" }),
        offer && offer.badge ? el("span", { class: "pay-badge", text: offer.badge }) : null,
        offer ? el("small", { text: offer.value }) : null
      ]),
      el("span", { class: "stars", text: best == null ? "Chưa có sao" : U.starText(best) })
    ]);
  }

  function viewMenu(child) {
    var meta = HV.kids[child];
    var root = el("section", { class: "menu" });
    var stats = S.allTime(child);
    root.appendChild(topbar({ title: "Chào " + meta.name, sub: "Hôm nay mình học gì?", back: "#/", child: child }));
    root.appendChild(syncLine());
    root.appendChild(todayBlock(child));
    var grid = el("div", { class: "subject-grid" });
    (HV.subjects || []).forEach(function (sub) {
      var mine = HV.catalog.filter(function (ex) { return ex.child === child && subjectOf(ex) === sub.id; });
      var stars = stats.bySubject && stats.bySubject[sub.id] ? stats.bySubject[sub.id].stars : 0;
      var rich = child === "mon" && mine.some(function (ex) { return S.monTier(ex) >= 2; });
      grid.appendChild(el("button", { class: "subject-card subject-" + sub.id + (rich ? " is-rich" : ""), "data-go": "#/c/" + child + "/" + sub.id }, [
        el("span", { class: "cat-icon", text: sub.icon }),
        el("span", { class: "cat-name", text: sub.title }),
        el("span", { class: "cat-blurb", text: sub.blurb[child] || "" }),
        rich ? el("span", { class: "pay-badge", text: "Nhiều sao" }) : null,
        el("span", { class: "cat-meta", text: mine.length + " bài · " + stars + " sao" })
      ]));
    });
    root.appendChild(grid);
    root.appendChild(el("button", { class: "btn btn-primary board-link", "data-go": "#/board/" + child, text: "Bảng xếp hạng tuần này" }));
    return root;
  }

  function practiceHome(entry) {
    if (!entry) return "#/";
    if (entry.child === "mon" && subjectOf(entry) === "english" && entry.level) {
      return "#/c/mon/english/lv/" + entry.level;
    }
    return "#/c/" + entry.child + "/" + subjectOf(entry);
  }

  function viewMonEnglish(child) {
    var prog = S.englishLevels(child);
    var root = el("section", { class: "menu" });
    root.appendChild(topbar({ title: "Tiếng Anh", sub: "Cấp gợi ý: " + prog.suggested, back: "#/c/" + child, child: child }));
    root.appendChild(syncLine());
    root.appendChild(todayBlock(child, "english"));
    root.appendChild(el("p", { class: "lede", text: "Cấp mở khi đủ sao tiếng Anh, hoặc khi cấp trước đúng hơn 85% (ít nhất 8 câu)." }));
    var grid = el("div", { class: "level-grid" });
    (HV.englishLevelsInfo || []).slice().sort(function (a, b) { return b.level - a.level; }).forEach(function (info) {
      var open = prog.unlocked[info.level];
      var stats = prog.levels[info.level];
      var acc = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0;
      var gate = prog.gates[info.level];
      var note = open
        ? (prog.reason[info.level] === "accuracy" ? "Mở vì đúng " + acc + "%" : stats.stars + " sao · đúng " + acc + "%")
        : "Cần " + gate + " sao Anh, hoặc đúng hơn 85% ở cấp " + (info.level - 1);
      var levelTier = info.level >= 4 ? 3 : info.level === 3 ? 2 : info.level === 1 ? 0 : 1;
      var card = el("button", {
        class: "level-card" + (open ? "" : " is-locked") + (prog.suggested === info.level ? " is-now" : "") + (levelTier >= 2 ? " is-rich" : ""),
        "data-go": open ? "#/c/mon/english/lv/" + info.level : "",
        disabled: open ? null : true
      }, [
        el("span", { class: "cat-name", text: (open ? "" : "🔒 ") + info.title }),
        el("span", { class: "cat-blurb", text: info.blurb }),
        levelTier >= 2 ? el("span", { class: "pay-badge", text: "Nhiều sao ×" + levelTier }) : null,
        el("span", { class: "cat-meta", text: note })
      ]);
      grid.appendChild(card);
    });
    root.appendChild(grid);
    return root;
  }

  function viewEnglishLevel(child, level) {
    var prog = S.englishLevels(child);
    var info = (HV.englishLevelsInfo || []).filter(function (x) { return x.level === level; })[0];
    var root = el("section", { class: "menu" });
    root.appendChild(topbar({
      title: info ? info.title : "Cấp " + level,
      sub: "Tiếng Anh",
      back: "#/c/" + child + "/english",
      child: child
    }));
    if (!prog.unlocked[level]) {
      root.appendChild(el("p", { class: "lede", text: "Cấp này chưa mở. Học cấp trước thật đúng, hoặc gom thêm sao tiếng Anh." }));
      return root;
    }
    var list = el("div", { class: "ex-list" });
    var englishHere = HV.catalog.filter(function (ex) {
      return ex.child === "mon" && subjectOf(ex) === "english" && (ex.level || 1) === level;
    });
    orderedExercises("mon", englishHere).forEach(function (ex) {
      var best = S.allTime(child).byExercise[ex.id] ? S.allTime(child).byExercise[ex.id].bestStars : 0;
      list.appendChild(exerciseCard("mon", ex, best));
    });
    root.appendChild(list);
    return root;
  }

  function viewSubject(child, subject) {
    if (subject === "english" && child === "mon") return viewMonEnglish(child);
    var meta = subjectMeta(subject);
    var root = el("section", { class: "menu" });
    var stats = S.allTime(child);
    root.appendChild(topbar({ title: meta.title, sub: meta.blurb[child] || HV.kids[child].name, back: "#/c/" + child, child: child }));
    root.appendChild(syncLine());
    root.appendChild(todayBlock(child, subject));
    var grid = el("div", { class: "cat-grid" });
    var cats = categoriesFor(subject).filter(function (cat) {
      if (cat.kids && cat.kids.indexOf(child) < 0) return false;
      return HV.catalog.some(function (ex) {
        return ex.child === child && subjectOf(ex) === subject && ex.category === cat.id;
      });
    });
    if (child === "mon") {
      cats.sort(function (a, b) {
        return categoryTier(child, subject, b.id) - categoryTier(child, subject, a.id);
      });
    }
    cats.forEach(function (cat) {
      var count = HV.catalog.filter(function (ex) {
        return ex.child === child && subjectOf(ex) === subject && ex.category === cat.id;
      }).length;
      var catStats = stats.byCategory[subject + ":" + cat.id] || { stars: 0 };
      var tier = child === "mon" ? categoryTier(child, subject, cat.id) : 1;
      grid.appendChild(el("button", { class: "cat-card" + (tier >= 2 ? " is-rich" : ""), "data-go": "#/c/" + child + "/" + subject + "/" + cat.id }, [
        el("span", { class: "cat-icon", text: cat.icon }),
        el("span", { class: "cat-name", text: cat.title }),
        el("span", { class: "cat-blurb", text: (cat.blurb && cat.blurb[child]) || "" }),
        tier >= 2 ? el("span", { class: "pay-badge", text: "Nhiều sao ×" + tier }) : null,
        el("span", { class: "cat-meta", text: count + " bài · " + catStats.stars + " sao" })
      ]));
    });
    root.appendChild(grid);
    return root;
  }

  function todayBlock(child, subject) {
    var wrap = el("section", { class: "today" });
    wrap.appendChild(el("h2", { text: subject ? "Bài mới · " + subjectMeta(subject).title : "Bài mới hôm nay" }));
    if (state.daily.pending) {
      wrap.appendChild(el("p", { class: "muted", text: "Đang mở bài mới..." }));
      return wrap;
    }
    if (state.daily.error) {
      wrap.appendChild(el("p", { class: "muted", text: "Chưa tải được bài mới. Các bài sẵn có vẫn chơi được." }));
      return wrap;
    }
    var list = state.daily.exercises.filter(function (ex) {
      return ex.child === child && (!subject || subjectOf(ex) === subject);
    });
    if (!list.length) {
      wrap.appendChild(el("p", { class: "muted", text: "Hôm nay chưa có bài mới." }));
      return wrap;
    }
    var row = el("div", { class: "today-row" });
    orderedExercises(child, list).forEach(function (ex) {
      var best = S.todayBest(child, ex.id);
      var offer = child === "mon" ? S.cardOffer(child, ex) : null;
      row.appendChild(el("button", { class: "today-card" + (offer && offer.tier >= 2 ? " is-rich" : ""), "data-go": "#/play/" + encodeURIComponent(ex.id) }, [
        el("span", { class: "ribbon", text: best == null ? "Mới" : "Đã chơi" }),
        el("span", { class: "today-icon", text: ex.icon || "✨" }),
        el("span", { class: "today-subject", text: subjectMeta(subjectOf(ex)).short }),
        el("span", { class: "today-title", text: ex.title }),
        offer && offer.badge ? el("span", { class: "pay-badge", text: offer.badge }) : null,
        offer ? el("span", { class: "fine", text: offer.value }) : null,
        el("span", { class: "stars", text: best == null ? "Chưa có sao" : U.starText(best) })
      ]));
    });
    wrap.appendChild(row);
    return wrap;
  }

  function viewCategory(child, subject, category) {
    var cat = findCategory(subject, category);
    var stats = S.allTime(child);
    var root = el("section", { class: "category" });
    if (!cat) {
      root.appendChild(topbar({ title: "Không thấy mục", back: "#/c/" + child, child: child }));
      return root;
    }
    root.appendChild(topbar({ title: cat.title, sub: (cat.blurb && cat.blurb[child]) || "", back: "#/c/" + child + "/" + subject, child: child }));
    var list = el("div", { class: "ex-list" });
    var here = HV.catalog.filter(function (ex) {
      return ex.child === child && subjectOf(ex) === subject && ex.category === category;
    });
    orderedExercises(child, here).forEach(function (ex) {
      var best = stats.byExercise[ex.id] ? stats.byExercise[ex.id].bestStars : 0;
      list.appendChild(exerciseCard(child, ex, best));
    });
    root.appendChild(list);
    return root;
  }

  function findExercise(id) {
    var found = HV.catalog.filter(function (ex) { return ex.id === id; })[0];
    if (found) return found;
    return state.daily.exercises.filter(function (ex) { return ex.id === id; })[0] || null;
  }

  function materialize(entry, count) {
    try {
      var list = [];
      if (entry.questions && entry.questions.length && !count) list = entry.questions;
      else if (entry.generator && HV.generators[entry.generator]) {
        var cfg = Object.assign({}, entry.config || {});
        if (count) cfg.count = count;
        list = HV.generators[entry.generator](cfg);
      }
      return list.map(HV.engine.normalize).filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  function questionKey(q) {
    var mark = "";
    if (q.choices) {
      q.choices.forEach(function (c) {
        if (c.correct) mark += (c.text || "") + (c.emoji || "") + (c.shape || "") + (c.color || "");
      });
    }
    return [q.kind, q.lang, q.speak, q.prompt, q.answer, q.word, mark].join("§");
  }

  function sessionTarget(child, baseLen, entry) {
    var listen = entry && (entry.generator === "enListen" || (entry.category === "listen" && subjectOf(entry) === "english"));
    if (child === "gin" && listen) return Math.max(16, baseLen);
    if (child === "gin") return Math.max(baseLen, Math.round(baseLen * 1.5));
    if (baseLen >= 16 && baseLen <= 20) return baseLen;
    if (baseLen > 20) return 20;
    return 18;
  }

  function generatedPool(entry, count) {
    var out = [];
    var seen = {};
    function takeList(list) {
      (list || []).forEach(function (q) {
        var key = questionKey(q);
        if (!key || seen[key]) return;
        seen[key] = true;
        out.push(q);
      });
    }
    function take(gen, cfg) {
      if (!gen || !HV.generators[gen]) return;
      try {
        var next = Object.assign({}, cfg || {}, { count: count });
        takeList((HV.generators[gen](next) || []).map(HV.engine.normalize).filter(Boolean));
      } catch (e) {}
    }
    var subject = subjectOf(entry);
    if (entry.generator) take(entry.generator, entry.config);
    (state.daily.exercises || []).forEach(function (ex) {
      if (!ex || ex === entry || ex.child !== entry.child || subjectOf(ex) !== subject || ex.category !== entry.category) return;
      takeList((ex.questions || []).map(HV.engine.normalize).filter(Boolean));
      if (ex.generator) take(ex.generator, ex.config);
    });
    if (out.length < count) {
      HV.catalog.forEach(function (ex) {
        if (!ex || ex.child !== entry.child || subjectOf(ex) !== subject || ex.category !== entry.category) return;
        if (ex.generator) take(ex.generator, ex.config);
      });
    }
    return out;
  }

  function expandQuestions(entry, base) {
    var child = entry.child === "gin" ? "gin" : "mon";
    var target = sessionTarget(child, base.length, entry);
    if (base.length >= target) return base.slice(0, target);
    var seen = {};
    base.forEach(function (q) { seen[questionKey(q)] = true; });
    var extra = generatedPool(entry, target + 8).filter(function (q) {
      var key = questionKey(q);
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
    var out = base.slice();
    extra = U.shuffle(extra);
    extra.forEach(function (q) {
      if (out.length >= target) return;
      if (out.length && questionKey(out[out.length - 1]) === questionKey(q)) return;
      out.push(q);
    });
    var cycle = U.shuffle(out.slice());
    var guard = 0;
    var i = 0;
    while (out.length < target && cycle.length > 1 && guard < target * 12) {
      guard += 1;
      var q = cycle[i % cycle.length];
      i += 1;
      if (questionKey(q) === questionKey(out[out.length - 1])) continue;
      out.push(q);
      if (i % cycle.length === 0) cycle = U.shuffle(cycle);
    }
    return out.slice(0, target);
  }

  function beginSession(id) {
    var entry = findExercise(id);
    if (!entry) {
      state.session = { missing: true, id: id };
      return;
    }
    var questions = expandQuestions(entry, materialize(entry));
    if (!questions.length) {
      state.session = { empty: true, entry: entry };
      return;
    }
    state.session = {
      entry: entry,
      questions: questions,
      index: 0,
      first: [],
      phase: "quiz"
    };
  }

  function viewPlay() {
    var session = state.session;
    var root = el("section", { class: "play" });
    if (!session || session.missing) {
      root.appendChild(topbar({ title: "Không thấy bài", back: "#/", child: null }));
      root.appendChild(el("p", { class: "muted", text: "Bài này không có. Mình về trang chọn bạn nhé." }));
      return root;
    }
    if (session.empty) {
      root.appendChild(topbar({ title: session.entry.title, back: "#/c/" + session.entry.child, child: session.entry.child }));
      root.appendChild(el("p", { class: "muted", text: "Bài chưa có câu hỏi." }));
      return root;
    }
    var child = session.entry.child;
    if (session.phase === "result") return viewResult(root, session);
    root.appendChild(topbar({
      title: session.entry.title,
      sub: "Câu " + (session.index + 1) + " / " + session.questions.length,
      back: practiceHome(session.entry) === "#/c/" + child + "/" + subjectOf(session.entry)
        ? "#/c/" + child + "/" + subjectOf(session.entry) + "/" + session.entry.category
        : practiceHome(session.entry),
      child: child
    }));
    var dots = el("div", { class: "dots", id: "dots" });
    session.questions.forEach(function (_, i) {
      dots.appendChild(el("i", { class: i < session.index ? "is-done" : i === session.index ? "is-now" : "" }));
    });
    root.appendChild(dots);
    var bubble = el("div", { class: "prompt-bubble" }, [
      el("p", { id: "prompt-text", class: "prompt" }),
      el("button", { class: "icon-btn speak-btn", "data-act": "replay-speech", "aria-label": "Nghe lại", text: "🗣️" })
    ]);
    root.appendChild(bubble);
    root.appendChild(el("div", { id: "stage", class: "stage" }));
    root.appendChild(el("button", { class: "text-link quit-link", "data-act": "ask-quit", text: "Dừng bài" }));
    return root;
  }

  function mountCurrentQuestion() {
    var session = state.session;
    if (!session || session.phase !== "quiz") return;
    var q = session.questions[session.index];
    var prompt = document.getElementById("prompt-text");
    if (prompt) prompt.textContent = q.prompt;
    var sub = document.querySelector(".top-title span");
    if (sub) sub.textContent = "Câu " + (session.index + 1) + " / " + session.questions.length;
    var dots = document.getElementById("dots");
    if (dots) {
      Array.prototype.forEach.call(dots.children, function (dot, i) {
        dot.className = i < session.index ? "is-done" : i === session.index ? "is-now" : "";
      });
    }
    var stage = document.getElementById("stage");
    if (!stage) return;
    if (state.destroy) state.destroy();
    state.destroy = HV.engine.mount(stage, q, {
      child: session.entry.child,
      isLast: session.index === session.questions.length - 1,
      track: function (t) { state.timers.push(t); },
      onDone: onQuestionDone
    });
    var voice = voiceFor(session.entry.child);
    voice.lang = q.lang === "en" ? "en" : "vi";
    HV.speech.speak(q.speak, voice);
  }

  function onQuestionDone(first) {
    var session = state.session;
    if (!session || session.phase !== "quiz") return;
    session.first[session.index] = !!first;
    session.index += 1;
    if (session.index >= session.questions.length) {
      session.phase = "result";
      render();
    } else mountCurrentQuestion();
  }

  function viewResult(root, session) {
    var child = session.entry.child;
    var total = session.questions.length;
    var correct = session.first.filter(Boolean).length;
    if (!session.recorded) {
      var fresh = child === "mon"
        ? S.awardFor(child, session.entry, correct, total)
        : { stars: S.starsFor(correct, total), note: "", tier: 1 };
      session.award = fresh;
      var before = weekStars(child);
      var unlockBefore = null;
      if (child === "mon" && subjectOf(session.entry) === "english") {
        unlockBefore = S.englishLevels(child).unlocked;
      }
      var stars = session.award.stars;
      session.record = S.recordRound(child, {
        id: session.entry.id,
        title: session.entry.title,
        category: session.entry.category,
        subject: subjectOf(session.entry),
        level: Number(session.entry.level) || 0,
        correct: correct,
        total: total,
        stars: stars
      });
      session.recorded = true;
      session.stars = stars;
      session.correct = correct;
      session.crossed = null;
      if (session.record && session.record.saved !== false) {
        var targets = S.data().settings.targets[child];
        var after = session.record.week.stars;
        targets.forEach(function (target, i) {
          if (before < target && after >= target) session.crossed = HV.rewards[child][i];
        });
      }
      var unlockedNow = false;
      if (child === "mon" && subjectOf(session.entry) === "english" && unlockBefore) {
        var afterLevels = S.englishLevels(child).unlocked;
        [2, 3, 4].forEach(function (n) {
          if (afterLevels[n] && !unlockBefore[n]) unlockedNow = true;
        });
      }
      session.celebrate = session.crossed || unlockedNow ? "jingle" : "fanfare";
      celebrateResult(stars, session.celebrate);
    }
    var award = session.award || { note: "" };
    var stars = session.stars;
    root.appendChild(topbar({ title: "Xong bài rồi", sub: HV.kids[child].name, back: "#/c/" + child, child: child }));
    var card = el("div", { class: "result-card" });
    card.appendChild(burst());
    if (child === "mon") {
      var cast = el("div", { class: "result-art" });
      cast.appendChild(HV.art.princess());
      cast.appendChild(HV.art.puppy());
      card.appendChild(cast);
    } else {
      var ginArt = el("div", { class: "result-art" });
      ginArt.appendChild(HV.art.tiger());
      ginArt.appendChild(HV.art.car());
      card.appendChild(ginArt);
    }
    card.appendChild(el("p", { class: "result-stars", text: U.starText(session.stars) }));
    card.appendChild(el("h2", { text: resultHeadline(session.stars, child) }));
    card.appendChild(el("p", { class: "lede", text: "Đúng lần đầu " + session.correct + "/" + total + " câu." }));
    if (award.note) card.appendChild(el("p", { class: "lede", text: award.note }));
    card.appendChild(el("p", { class: "lede", text: "Tuần này: " + weekStars(child) + " sao." }));
    if (session.crossed) {
      card.appendChild(el("p", { class: "milestone-banner", text: "Đạt mốc " + session.crossed.icon + " " + session.crossed.name + "!" }));
    }
    if (session.record && session.record.saved === false) {
      card.appendChild(el("p", { class: "muted", text: "Máy đầy bộ nhớ, sao chưa lưu được." }));
    }
    card.appendChild(el("div", { class: "result-actions" }, [
      el("button", { class: "btn btn-primary", "data-act": "replay", text: "Chơi lại" }),
      el("button", { class: "btn", "data-go": practiceHome(session.entry), text: "Bài khác" }),
      el("button", { class: "btn", "data-go": "#/board/" + child, text: "Bảng xếp hạng" })
    ]));
    root.appendChild(card);
    return root;
  }

  function resultHeadline(stars, child) {
    if (stars >= 6) return "Bài khó, nhiều sao!";
    if (stars >= 3) return child === "gin" ? "Giỏi quá!" : "Tuyệt lắm!";
    if (stars === 2) return "Làm tốt lắm!";
    if (stars === 1) return "Cố lên, mình học được rồi!";
    return child === "mon" ? "Mình thử bài khó hơn nhé!" : "Mình học tiếp nhé!";
  }

  function burst() {
    var box = el("div", { class: "confetti", "aria-hidden": "true" });
    var colors = ["#f6d56a", "#7ec8e3", "#fb7185", "#22c55e", "#a855f7", "#fff"];
    for (var i = 0; i < 36; i++) {
      var bit = el("i");
      bit.style.left = (6 + (i * 5.2) % 90) + "%";
      bit.style.background = colors[i % colors.length];
      bit.style.animationDelay = (i * 0.04) + "s";
      box.appendChild(bit);
    }
    return box;
  }

  function viewBoard(child) {
    var meta = HV.kids[child];
    var week = S.summarizeWeek(child, U.weekStart(U.todayStr()));
    var miles = S.milestoneState(child, week.stars);
    var rewards = HV.rewards[child];
    var root = el("section", { class: "board board-" + child });
    if (child === "mon") {
      var lanterns = el("div", { class: "lanterns", "aria-hidden": "true" });
      for (var i = 0; i < 5; i++) {
        var lamp = el("i");
        lamp.style.left = (6 + i * 18) + "%";
        lamp.style.animationDelay = (i * 0.35) + "s";
        lanterns.appendChild(lamp);
      }
      root.appendChild(lanterns);
      HV.art.flakes(root, 12);
    }
    root.appendChild(topbar({ title: "Bảng xếp hạng", sub: meta.name, back: "#/c/" + child, child: child }));
    var hero = el("div", { class: "board-hero" });
    var copy = el("div", { class: "board-copy" });
    copy.appendChild(el("p", { class: "kicker", text: "Tuần này · thứ Hai đến Chủ nhật" }));
    copy.appendChild(el("h1", { text: week.stars + " sao" }));
    copy.appendChild(el("p", { class: "lede", text: week.exercisesDone + " bài · đúng " + week.correct + "/" + week.answered }));
    copy.appendChild(subjectPills(week.bySubject));
    copy.appendChild(el("p", { class: "fine", text: "Bố mẹ xem cuối tuần để thưởng. Mốc thưởng tính tổng sao mọi môn." }));
    hero.appendChild(copy);
    var cast = el("div", { class: "board-cast" });
    if (child === "mon") {
      cast.appendChild(kidPhoto("mon", "board"));
      cast.appendChild(HV.art.tower());
      cast.appendChild(HV.art.puppy());
    } else {
      cast.appendChild(kidPhoto("gin", "board"));
      cast.appendChild(HV.art.car());
    }
    hero.appendChild(cast);
    root.appendChild(hero);
    root.appendChild(dayRow(week));
    root.appendChild(milestoneRow(rewards, miles, week.stars));
    var past = S.listWeeks(child).filter(function (w) { return w.weekStart !== week.weekStart; });
    var pastBox = el("section", { class: "past" });
    pastBox.appendChild(el("h2", { text: "Các tuần trước" }));
    if (!past.length) pastBox.appendChild(el("p", { class: "muted", text: "Chưa có tuần nào trước." }));
    past.slice(0, 8).forEach(function (w) {
      pastBox.appendChild(el("p", { class: "past-line", text: U.formatVi(w.weekStart) + " – " + U.formatVi(w.weekEnd) + " · " + w.stars + " sao · " + w.exercisesDone + " bài" }));
    });
    root.appendChild(pastBox);
    return root;
  }

  function dayRow(week) {
    var today = U.todayStr();
    var row = el("div", { class: "day-row" });
    week.days.forEach(function (day) {
      var pill = el("div", { class: "day-pill" + (day.date === today ? " is-today" : "") + (day.stats.stars ? " has-stars" : "") });
      pill.appendChild(el("span", { class: "dow", text: U.DOW_SHORT[day.dow] }));
      pill.appendChild(el("strong", { text: String(day.stats.stars) }));
      pill.appendChild(el("span", { text: "sao" }));
      row.appendChild(pill);
    });
    return row;
  }

  function milestoneRow(rewards, miles, stars) {
    var row = el("div", { class: "miles" });
    rewards.forEach(function (reward, i) {
      var target = miles.targets[i];
      var reached = stars >= target;
      var pct = Math.max(0, Math.min(100, Math.round((stars / target) * 100)));
      var card = el("article", { class: "mile" + (reached ? " is-reached" : "") });
      card.appendChild(el("span", { class: "mile-icon", text: reward.icon }));
      card.appendChild(el("h3", { text: reward.name }));
      card.appendChild(el("p", { text: target + " sao" }));
      var bar = el("div", { class: "bar" });
      var fill = el("span");
      fill.style.width = pct + "%";
      bar.appendChild(fill);
      card.appendChild(bar);
      card.appendChild(el("p", { class: "fine", text: reached ? "Đạt rồi" : stars + "/" + target }));
      row.appendChild(card);
    });
    return row;
  }

  function viewParents() {
    if (!state.draft) {
      var targets = S.data().settings.targets;
      state.draft = { mon: targets.mon.slice(), gin: targets.gin.slice() };
    }
    var root = el("section", { class: "parents" });
    root.appendChild(topbar({ title: "Sổ sao của bố mẹ", sub: "Mon và Gin", back: "#/" }));
    root.appendChild(el("p", { class: "lede", text: "Hai iPad dùng chung một sổ. Khi có mạng, sao gộp lại ở đây." }));
    root.appendChild(soundSetting());
    root.appendChild(syncLine());
    var grid = el("div", { class: "parents-grid" });
    grid.appendChild(parentKid("mon"));
    grid.appendChild(parentKid("gin"));
    root.appendChild(grid);
    root.appendChild(backupBox());
    root.appendChild(el("p", { class: "fine", text: "Gin: 1 sao khi đúng một phần, 2 sao từ 60%, 3 sao khi đúng hết. Mon: bài dễ tối đa 1 sao mỗi mục trong ngày, bài khó ×2 hoặc ×3. Sao đã có không bị bớt. Mốc tuần của Mon vẫn 15, 30 và 50." }));
    return root;
  }

  function soundSetting() {
    var on = S.data().settings.sound !== false;
    return el("div", { class: "sound-setting" }, [
      el("p", { text: "Âm thanh hiệu ứng" }),
      el("button", {
        class: "btn sound-toggle" + (on ? " btn-primary" : ""),
        "data-act": "toggle-sound",
        "data-setting": "sound",
        "aria-pressed": String(on),
        text: on ? "Đang bật" : "Đang tắt"
      })
    ]);
  }

  function celebrateResult(stars, kind) {
    var lead = stars > 0 ? HV.audio.star() : 0;
    setTimeout(function () {
      if (kind === "jingle") HV.audio.jingle();
      else HV.audio.fanfare();
    }, Math.round((lead || 0) * 1000) + 30);
  }

  function parentKid(child) {
    var meta = HV.kids[child];
    var week = S.summarizeWeek(child, U.weekStart(U.todayStr()));
    var all = S.allTime(child);
    var card = el("article", { class: "parent-card kid-tint-" + child });
    card.appendChild(el("h2", { text: meta.name + " · tuần này " + week.stars + " sao" }));
    card.appendChild(subjectPills(week.bySubject));
    card.appendChild(el("p", { class: "muted", text: "Tất cả: " + all.stars + " sao · " + all.rounds + " bài · đúng " + all.correct + "/" + all.answered }));
    card.appendChild(el("h3", { text: "Mốc thưởng tuần" }));
    var editor = el("div", { class: "target-editor" });
    state.draft[child].forEach(function (value, index) {
      editor.appendChild(el("div", { class: "stepper" }, [
        el("button", { "data-act": "step", "data-child": child, "data-i": String(index), "data-dir": "-1", "aria-label": "Giảm mốc", text: "−" }),
        el("span", { text: String(value) }),
        el("button", { "data-act": "step", "data-child": child, "data-i": String(index), "data-dir": "1", "aria-label": "Tăng mốc", text: "+" })
      ]));
    });
    card.appendChild(editor);
    card.appendChild(el("button", { class: "btn btn-primary", "data-act": "save-targets", "data-child": child, text: "Lưu mốc của " + meta.name }));
    card.appendChild(el("h3", { text: "Từng ngày tuần này" }));
    week.days.forEach(function (day) {
      var block = el("div", { class: "day-log" });
      block.appendChild(el("strong", { text: U.DOW[day.dow] + " " + U.formatVi(day.date) }));
      if (!day.stats.exercisesDone) {
        block.appendChild(el("p", { class: "muted", text: "Chưa học" }));
      } else {
        block.appendChild(el("p", { text: day.stats.exercisesDone + " bài · đúng " + day.stats.correct + "/" + day.stats.answered + " · " + day.stats.stars + " sao" }));
        day.stats.items.forEach(function (item) {
          block.appendChild(el("p", { class: "log-item", text: "• " + subjectMeta(item.subject || "math").short + " — " + (item.title || item.id) + " — " + item.stars + " sao (" + item.correct + "/" + item.total + ")" }));
        });
      }
      card.appendChild(block);
    });
    var past = S.listWeeks(child).filter(function (w) { return w.weekStart !== week.weekStart; });
    card.appendChild(el("h3", { text: "Tuần trước" }));
    if (!past.length) card.appendChild(el("p", { class: "muted", text: "Chưa có." }));
    past.forEach(function (w) {
      card.appendChild(el("p", { class: "past-line", text: U.formatVi(w.weekStart) + "–" + U.formatVi(w.weekEnd) + ": " + w.stars + " sao, " + w.exercisesDone + " bài, đúng " + w.correct + "/" + w.answered }));
    });
    card.appendChild(el("button", { class: "text-link danger", "data-act": "ask-reset", "data-child": child, text: "Xóa tiến độ của " + meta.name }));
    return card;
  }

  function backupBox() {
    var box = el("section", { class: "backup" });
    box.appendChild(el("h2", { text: "Bản sao lưu" }));
    box.appendChild(el("p", { class: "muted", text: "Tải hoặc chép tệp JSON. Khôi phục sẽ gộp thêm, không xóa sao đang có." }));
    box.appendChild(el("div", { class: "backup-actions" }, [
      el("button", { class: "btn", "data-act": "export-file", text: "Tải tệp" }),
      el("button", { class: "btn", "data-act": "export-copy", text: "Chép bản sao" }),
      el("label", { class: "btn" }, [
        "Chọn tệp",
        el("input", { id: "import-file", type: "file", accept: "application/json,.json" })
      ])
    ]));
    box.appendChild(el("label", { class: "paste-label", text: "Hoặc dán bản sao" }));
    box.appendChild(el("textarea", { id: "import-text", rows: "4", placeholder: "Dán JSON vào đây" }));
    box.appendChild(el("button", { class: "btn btn-primary", "data-act": "import-paste", text: "Khôi phục từ chữ dán" }));
    return box;
  }

  function viewModal() {
    var modal = state.modal || {};
    var body = [];
    if (modal.type === "quit") {
      body = [
        el("h2", { text: "Dừng bài này nhé?" }),
        el("p", { text: "Sao chỉ được lưu khi làm xong bài." }),
        el("div", { class: "modal-actions" }, [
          el("button", { class: "btn btn-primary", "data-act": "modal-close", text: "Học tiếp" }),
          el("button", { class: "btn", "data-act": "quit-yes", text: "Dừng" })
        ])
      ];
    } else if (modal.type === "reset") {
      var name = HV.kids[modal.child].name;
      var stars = S.allTime(modal.child).stars;
      body = [
        el("h2", { text: "Xóa hết sao của " + name + "?" }),
        el("p", { text: "Sẽ mất " + stars + " sao trên máy này và trên sổ chung." }),
        el("div", { class: "modal-actions" }, [
          el("button", { class: "btn", "data-act": "modal-close", text: "Giữ lại" }),
          el("button", { class: "btn btn-danger", "data-act": "reset-yes", "data-child": modal.child, text: "Xóa" })
        ])
      ];
    } else if (modal.type === "import") {
      var preview = modal.preview;
      body = [
        el("h2", { text: "Gộp bản sao này?" }),
        el("p", { text: "Mon: " + preview.mon.stars + " sao, " + preview.mon.rounds + " bài." }),
        el("p", { text: "Gin: " + preview.gin.stars + " sao, " + preview.gin.rounds + " bài." }),
        el("div", { class: "modal-actions" }, [
          el("button", { class: "btn", "data-act": "modal-close", text: "Không" }),
          el("button", { class: "btn btn-primary", "data-act": "import-yes", text: "Gộp vào" })
        ])
      ];
    } else if (modal.type === "export-text") {
      body = [
        el("h2", { text: "Bản sao" }),
        el("textarea", { id: "export-text", rows: "8" }),
        el("div", { class: "modal-actions" }, [
          el("button", { class: "btn btn-primary", "data-act": "modal-close", text: "Đóng" })
        ])
      ];
    }
    var card = el("div", { class: "modal", role: "dialog", "aria-modal": "true" }, body);
    var back = el("div", { class: "modal-back" }, card);
    if (modal.type === "export-text") {
      setTimeout(function () {
        var area = document.getElementById("export-text");
        if (area) area.value = modal.text || "";
      }, 0);
    }
    return back;
  }

  function render() {
    cleanup();
    var route = state.route;
    var child = route.child || (state.session && state.session.entry && state.session.entry.child) || "";
    applyChrome(child);
    document.title = route.name === "home" ? "Học vui" : "Học vui · " + (child ? HV.kids[child].name : "Bố mẹ");
    var root = document.getElementById("app");
    clear(root);
    var shell = el("main", { class: "shell", "data-screen": route.name });
    if (route.name === "menu") shell.appendChild(viewMenu(route.child));
    else if (route.name === "subject") shell.appendChild(viewSubject(route.child, route.subject));
    else if (route.name === "level") shell.appendChild(viewEnglishLevel(route.child, route.level));
    else if (route.name === "category") shell.appendChild(viewCategory(route.child, route.subject, route.category));
    else if (route.name === "play") shell.appendChild(viewPlay());
    else if (route.name === "board") shell.appendChild(viewBoard(route.child));
    else if (route.name === "parents") shell.appendChild(viewParents());
    else shell.appendChild(viewHome());
    root.appendChild(shell);
    if (state.modal) root.appendChild(viewModal());
    if (state.toast) root.appendChild(el("div", { class: "toast", role: "status", text: state.toast }));
    if (route.name === "play" && state.session && state.session.phase === "quiz") mountCurrentQuestion();
  }

  function onRoute() {
    var route = parseRoute();
    var sameQuiz = route.name === "play" && state.route.name === "play" && state.route.id === route.id && state.session && state.session.phase === "quiz";
    state.route = route;
    if (route.name === "play") {
      if (!sameQuiz) beginSession(route.id);
    } else {
      state.session = null;
      if (route.name !== "parents") state.draft = null;
    }
    render();
  }

  function updateToggles() {
    ["sound", "speech"].forEach(function (key) {
      var on = S.data().settings[key] !== false;
      document.querySelectorAll('[data-setting="' + key + '"]').forEach(function (btn) {
        btn.setAttribute("aria-pressed", String(on));
        btn.classList.toggle("is-off", !on);
        if (key === "sound" && btn.classList.contains("icon-btn")) btn.textContent = on ? "🔔" : "🔕";
        if (key === "sound" && btn.classList.contains("sound-toggle")) {
          btn.textContent = on ? "Đang bật" : "Đang tắt";
          btn.classList.toggle("btn-primary", on);
        }
      });
    });
  }

  function updateSyncBadge() {
    document.querySelectorAll("[data-sync]").forEach(function (node) {
      if (node.classList.contains("sync-line")) node.textContent = syncText();
      else node.textContent = syncLabel();
    });
  }

  function readImportText(text) {
    try {
      var json = JSON.parse(text);
      var preview = S.previewImport(json);
      state.pendingImport = json;
      openModal({ type: "import", preview: preview });
    } catch (e) {
      toast(e && e.message ? e.message : "Tệp không đọc được.");
    }
  }

  function onClick(e) {
    HV.audio.unlock();
    var btn = e.target.closest("button");
    if (btn && !btn.closest(".stage") && !btn.classList.contains("choice")) {
      if (btn.classList.contains("kid-mon")) HV.audio.bark();
      else if (btn.classList.contains("kid-gin")) HV.audio.vroom();
      else if (!btn.classList.contains("speak-btn")) HV.audio.tap();
    }
    var goEl = e.target.closest("[data-go]");
    if (goEl) {
      var dest = goEl.getAttribute("data-go");
      if (state.session && state.session.phase === "quiz") {
        state.pendingExit = dest;
        openModal({ type: "quit" });
        return;
      }
      location.hash = dest;
      return;
    }
    var actEl = e.target.closest("[data-act]");
    if (!actEl) return;
    var act = actEl.getAttribute("data-act");
    if (act === "toggle-sound" || act === "toggle-speech") {
      var key = act === "toggle-sound" ? "sound" : "speech";
      S.setSetting(key, S.data().settings[key] === false);
      if (key === "speech" && S.data().settings.speech === false) HV.speech.cancel();
      updateToggles();
      return;
    }
    if (act === "replay-speech") {
      var session = state.session;
      if (session && session.phase === "quiz") {
        var again = voiceFor(session.entry.child);
        again.lang = session.questions[session.index].lang === "en" ? "en" : "vi";
        HV.speech.speak(session.questions[session.index].speak, again);
      }
      return;
    }
    if (act === "ask-quit") {
      openModal({ type: "quit" });
      return;
    }
    if (act === "modal-close") {
      state.pendingExit = null;
      closeModal();
      return;
    }
    if (act === "quit-yes") {
      var dest = state.pendingExit;
      state.pendingExit = null;
      closeModal();
      if (!dest) {
        var backChild = state.session && state.session.entry ? state.session.entry.child : "";
        dest = backChild ? "#/c/" + backChild + (state.session.entry ? "/" + subjectOf(state.session.entry) : "") : "#/";
      }
      location.hash = dest;
      return;
    }
    if (act === "replay") {
      if (state.session && state.session.entry) beginSession(state.session.entry.id);
      render();
      return;
    }
    if (act === "step") {
      var child = actEl.getAttribute("data-child");
      var index = Number(actEl.getAttribute("data-i"));
      var dir = Number(actEl.getAttribute("data-dir"));
      if (!state.draft) return;
      var next = state.draft[child].slice();
      next[index] = U.clamp(next[index] + dir, 1, 500);
      state.draft[child] = next;
      render();
      return;
    }
    if (act === "save-targets") {
      var who = actEl.getAttribute("data-child");
      var result = S.setTargets(who, state.draft[who]);
      toast(result.ok ? "Đã lưu mốc thưởng." : result.message);
      if (result.ok) state.draft = null;
      render();
      return;
    }
    if (act === "ask-reset") {
      openModal({ type: "reset", child: actEl.getAttribute("data-child") });
      return;
    }
    if (act === "reset-yes") {
      var kid = actEl.getAttribute("data-child");
      closeModal();
      S.resetChild(kid);
      state.draft = null;
      toast("Đã xóa tiến độ của " + HV.kids[kid].name + ".");
      render();
      return;
    }
    if (act === "export-file") {
      var payload = JSON.stringify(S.exportPayload(), null, 2);
      var blob = new Blob([payload], { type: "application/json" });
      var link = document.createElement("a");
      var url = URL.createObjectURL(blob);
      link.href = url;
      link.download = "hoc-vui-sao-" + U.todayStr() + ".json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
      return;
    }
    if (act === "export-copy") {
      var text = JSON.stringify(S.exportPayload(), null, 2);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          toast("Đã chép. Hãy dán vào Ghi chú để giữ.");
        }).catch(function () {
          openModal({ type: "export-text", text: text });
        });
      } else openModal({ type: "export-text", text: text });
      return;
    }
    if (act === "import-paste") {
      var area = document.getElementById("import-text");
      readImportText(area ? area.value : "");
      return;
    }
    if (act === "import-yes" && state.pendingImport) {
      try {
        S.importPayload(state.pendingImport);
        closeModal();
        state.draft = null;
        toast("Đã gộp bản sao.");
        render();
      } catch (err) {
        toast(err && err.message ? err.message : "Không khôi phục được.");
      }
    }
  }

  function onChange(e) {
    if (e.target && e.target.id === "import-file" && e.target.files && e.target.files[0]) {
      var reader = new FileReader();
      reader.onload = function () { readImportText(String(reader.result || "")); };
      reader.onerror = function () { toast("Không đọc được tệp."); };
      reader.readAsText(e.target.files[0]);
      e.target.value = "";
    }
  }

  function loadDaily() {
    var date = U.todayStr();
    return fetch("content/daily/" + date + ".json", { cache: "no-cache" }).then(function (res) {
      if (res.status === 404) return { date: date, exercises: [], pending: false, error: false };
      if (!res.ok) return { date: date, exercises: [], pending: false, error: true };
      return res.json().then(function (json) {
        var exercises = Array.isArray(json.exercises) ? json.exercises.filter(function (ex) {
          if (!ex || !ex.id || !knownChild(ex.child) || !ex.title) return false;
          if (!(ex.generator || (ex.questions && ex.questions.length))) return false;
          if (ex.subject && ex.subject !== "math" && ex.subject !== "english" && ex.subject !== "vietnamese") return false;
          ex.subject = ex.subject || "math";
          return true;
        }) : [];
        return { date: date, exercises: exercises, pending: false, error: false };
      });
    }).catch(function () {
      return { date: date, exercises: [], pending: false, error: true };
    });
  }

  HV.ui = {
    setSync: function (info) {
      state.sync = info || state.sync;
      updateSyncBadge();
    },
    notify: function () {
      if (state.session && state.session.phase === "quiz") {
        updateSyncBadge();
        var pill = document.querySelector(".star-pill");
        if (pill && state.session.entry) pill.textContent = "★ " + weekStars(state.session.entry.child);
        return;
      }
      if (state.route.name === "parents") state.draft = null;
      render();
    }
  };

  function boot() {
    document.addEventListener("pointerdown", function () {
      HV.audio.unlock();
      if (HV.speech.unlock) HV.speech.unlock();
    }, { passive: true });
    window.addEventListener("hashchange", onRoute);
    var app = document.getElementById("app");
    app.addEventListener("click", onClick);
    app.addEventListener("change", onChange);
    loadDaily().then(function (daily) {
      state.daily = daily;
      if (state.route.name === "play" && (!state.session || state.session.missing || state.session.empty)) {
        beginSession(state.route.id);
      }
      if (!(state.session && state.session.phase === "quiz" && document.getElementById("stage"))) render();
    });
    onRoute();
    if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
      navigator.serviceWorker.register("./sw.js").catch(function () {});
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(globalThis.HV = globalThis.HV || {});
