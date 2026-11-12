(function (HV) {
  "use strict";

  var U = HV.util;
  var el = U.el;
  var KEY = "hoc-vui-weekly";
  var session = null;
  var clock = 0;
  var praiseLines = {};
  var justFinished = "";

  function bkk() {
    var parts = {};
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Bangkok",
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    var wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[parts.weekday];
    return { ymd: parts.year + "-" + parts.month + "-" + parts.day, wd: wd };
  }

  function saturdayOf(info) {
    var delta = info.wd === 6 ? 0 : info.wd === 0 ? -1 : (6 - info.wd);
    return U.addDays(info.ymd, delta);
  }

  function daysUntil(info) {
    if (info.wd === 6 || info.wd === 0) return 0;
    return 6 - info.wd;
  }

  function readLocal() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
    catch (e) { return []; }
  }

  function writeLocal(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
  }

  function merged() {
    var map = {};
    readLocal().forEach(function (t) { if (t && t.id) map[t.id] = t; });
    (HV.weeklyRemote || []).forEach(function (t) {
      if (!t || !t.id) return;
      var prev = map[t.id] || {};
      map[t.id] = Object.assign({}, prev, t);
      if (!t.rewardNote && prev.rewardNote) map[t.id].rewardNote = prev.rewardNote;
    });
    return Object.keys(map).map(function (id) { return map[id]; }).sort(function (a, b) {
      return String(b.week || "").localeCompare(String(a.week || ""));
    });
  }

  function findResult(child, week) {
    var id = child + "_" + week;
    var hit = null;
    merged().forEach(function (t) { if (t.id === id) hit = t; });
    return hit;
  }

  function medalFor(child, pct) {
    var gin = child === "gin";
    if (pct >= 90) return { id: "gold", name: "Vàng", bonus: gin ? 8 : 20, icon: "🥇" };
    if (pct >= 75) return { id: "silver", name: "Bạc", bonus: gin ? 4 : 12, icon: "🥈" };
    if (pct >= 60) return { id: "bronze", name: "Đồng", bonus: gin ? 2 : 6, icon: "🥉" };
    return { id: "none", name: "Chưa có huy chương", bonus: 0, icon: "🌱" };
  }

  function fallback(child, week) {
    var out = [];
    function take(gen, cfg, subject, n) {
      if (!HV.generators || !HV.generators[gen]) return;
      var list = [];
      try { list = HV.generators[gen](Object.assign({ count: n, seed: week }, cfg)) || []; }
      catch (e) { list = []; }
      list.forEach(function (q) {
        q.subject = subject;
        q.lang = subject === "english" ? "en" : "vi";
        out.push(q);
      });
    }
    if (child === "gin") {
      take("enListen", { set: "gin", count: 8, gradual: true }, "english", 8);
      return out.slice(0, 8);
    }
    take("addition", { sumMax: 100, input: "choice" }, "math", 4);
    take("subtraction", { within: 20, input: "choice" }, "math", 2);
    take("wordProblem", {}, "math", 3);
    take("missingPart", { max: 20 }, "math", 3);
    take("sequence", { steps: [2, 4, 5, 10], length: 4, max: 60, input: "choice" }, "math", 3);
    take("shapeName", { set: "all" }, "math", 2);
    take("countSides", { set: "all" }, "math", 2);
    take("enListen", { set: "mon", count: 3, choices: 4 }, "english", 3);
    take("viSpell", {}, "vietnamese", 3);
    return out.slice(0, 25);
  }

  function loadPaper(child, week) {
    return fetch("content/weekly/" + week + ".json", { cache: "no-cache" }).then(function (res) {
      if (!res.ok) return fallback(child, week);
      return res.json().then(function (json) {
        var list = json && (json[child] || json.questions);
        if (!list || !list.length) return fallback(child, week);
        return list;
      });
    }).catch(function () { return fallback(child, week); });
  }

  function status(child) {
    var info = bkk();
    var week = saturdayOf(info);
    var open = info.wd === 6 || info.wd === 0;
    return {
      week: week,
      open: open,
      days: daysUntil(info),
      result: findResult(child, week)
    };
  }

  function card(child) {
    var st = status(child);
    var waiting = !st.open && !st.result;
    var played = !!st.result;
    var btn = el("button", {
      class: "week-card" + (waiting ? " is-wait" : "") + (played ? " is-played" : waiting ? "" : " is-new"),
      "data-go": "#/weekly/" + child,
      "data-state": played ? "played" : waiting ? "wait" : "new"
    });
    btn.appendChild(el("span", { class: "ex-icon act-icon", "aria-hidden": "true", text: st.result && st.result.icon ? st.result.icon : "🏆" }));
    if (st.result && st.result.medal && st.result.medal !== "none") {
      btn.appendChild(el("p", { class: "kicker", text: "Bài kiểm tra tuần" }));
      btn.appendChild(el("h2", { text: "Huy chương " + st.result.medalName }));
      btn.appendChild(el("p", { text: st.result.percent + "% · " + st.result.bonus + " sao thưởng" }));
    } else if (st.open) {
      btn.appendChild(el("p", { class: "kicker", text: child === "gin" ? "8 câu nghe" : "Thứ Bảy · một lần" }));
      btn.appendChild(el("h2", { text: "Bài kiểm tra tuần" }));
      btn.appendChild(el("p", { text: st.result ? "Xem kết quả tuần này" : "Bắt đầu khi sẵn sàng. Không có giờ giới hạn." }));
    } else {
      btn.appendChild(el("p", { class: "kicker", text: "Thói quen cuối tuần" }));
      btn.appendChild(el("h2", { text: "Còn " + st.days + " ngày nữa" }));
      btn.appendChild(el("p", { text: "đến bài kiểm tra tuần" }));
    }
    return btn;
  }

  function subjectName(id) {
    if (id === "english") return "Tiếng Anh";
    if (id === "vietnamese") return "Tiếng Việt";
    return "Toán";
  }

  function paintQuestion() {
    var q = session.questions[session.index];
    var root = el("section", { class: "play" });
    root.appendChild(el("header", { class: "topbar" }, [
      el("button", { class: "icon-btn", "data-go": "#/c/" + session.child, text: "←" }),
      el("div", { class: "top-title" }, [
        el("strong", { text: "Bài kiểm tra tuần" }),
        el("span", { text: "Câu " + (session.index + 1) + " / " + session.questions.length })
      ]),
      el("span", { class: "star-pill", text: clockText() })
    ]));
    root.appendChild(el("p", { class: "week-q", text: q.prompt || "" }));
    if (q.scene && (q.scene.layout === "equation" || q.scene.layout === "digit")) {
      root.appendChild(el("p", { class: "week-q", text: q.scene.text || "" }));
    } else if (q.scene && q.scene.layout === "emojis") {
      root.appendChild(el("p", { class: "week-q", text: (q.scene.items || []).join(" ") }));
    }
    if (q.kind === "keypad") {
      root.appendChild(miniKeypad(q));
    } else {
      var grid = el("div", { class: "choices cols-2" });
      (q.choices || []).forEach(function (choice, idx) {
        var btn = el("button", { class: "choice", text: choice.text || choice.emoji || "?" });
        if (choice.emoji && !choice.text) btn.textContent = choice.emoji;
        btn.addEventListener("click", function () { choose(idx); });
        grid.appendChild(btn);
      });
      root.appendChild(grid);
    }
    var voice = { lang: q.lang === "en" ? "en" : "vi", rate: 0.95, pitch: 1 };
    if (HV.speech) HV.speech.speak(q.speak || q.prompt, voice);
    return root;
  }

  function miniKeypad(q) {
    var entry = "";
    var wrap = el("div");
    var display = el("div", { class: "keypad-display is-empty", text: "•" });
    wrap.appendChild(display);
    var keys = el("div", { class: "keypad" });
    function sync() {
      display.textContent = entry || "•";
      display.classList.toggle("is-empty", !entry);
    }
    "123456789".split("").forEach(function (d) {
      keys.appendChild(el("button", { class: "key", text: d, onClick: function () {
        if (entry.length >= (q.maxDigits || 2)) return;
        entry += d;
        sync();
      } }));
    });
    keys.appendChild(el("button", { class: "key is-del", text: "⌫", onClick: function () { entry = entry.slice(0, -1); sync(); } }));
    keys.appendChild(el("button", { class: "key", text: "0", onClick: function () {
      if (entry.length >= (q.maxDigits || 2)) return;
      entry += "0";
      sync();
    } }));
    keys.appendChild(el("button", { class: "key is-go", text: "OK", onClick: function () {
      if (!entry) return;
      var value = Number(entry);
      var correct = value === Number(q.answer);
      session.answers.push({ correct: correct, prompt: q.prompt, explain: q.explain || "", subject: q.subject || "math" });
      advance();
    } }));
    wrap.appendChild(keys);
    return wrap;
  }

  function choose(idx) {
    var q = session.questions[session.index];
    var choice = (q.choices || [])[idx] || {};
    session.answers.push({
      correct: !!choice.correct,
      prompt: q.prompt,
      explain: q.explain || "",
      subject: q.subject || "math"
    });
    advance();
  }

  function advance() {
    session.index += 1;
    if (session.index >= session.questions.length) finish();
    else if (HV.ui && HV.ui.render) HV.ui.render();
  }

  function finish() {
    clearInterval(clock);
    var correct = session.answers.filter(function (a) { return a.correct; }).length;
    var total = session.answers.length || session.questions.length;
    var pct = total ? Math.round((correct / total) * 100) : 0;
    var medal = medalFor(session.child, pct);
    var by = { math: { correct: 0, total: 0 }, english: { correct: 0, total: 0 }, vietnamese: { correct: 0, total: 0 } };
    var wrongs = [];
    session.answers.forEach(function (a) {
      var key = by[a.subject] ? a.subject : "math";
      by[key].total += 1;
      if (a.correct) by[key].correct += 1;
      else wrongs.push({ prompt: a.prompt, explain: a.explain, subject: key });
    });
    var result = {
      id: session.child + "_" + session.week,
      child: session.child,
      week: session.week,
      correct: correct,
      total: total,
      percent: pct,
      medal: medal.id,
      medalName: medal.name,
      icon: medal.icon,
      bonus: medal.bonus,
      seconds: Math.round((Date.now() - session.started) / 1000),
      bySubject: by,
      wrongs: wrongs,
      rewardNote: "",
      at: Date.now()
    };
    var list = readLocal().filter(function (t) { return t.id !== result.id; });
    list.push(result);
    writeLocal(list);
    if (medal.bonus && HV.storage) {
      HV.storage.recordRound(session.child, {
        id: "weekly-" + session.child + "-" + session.week,
        title: "Bài kiểm tra tuần",
        category: "weekly",
        subject: "math",
        correct: correct,
        total: total,
        stars: medal.bonus
      });
    }
    if (HV.cloud && HV.cloud.saveWeekly) HV.cloud.saveWeekly(result);
    justFinished = result.id;
    session = null;
    if (HV.ui && HV.ui.render) HV.ui.render();
  }

  function clockText() {
    if (!session) return "0:00";
    var s = Math.max(0, Math.round((Date.now() - session.started) / 1000));
    return Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
  }

  function report(child, result) {
    var praiseLang = child === "gin" ? "en" : "vi";
    if (justFinished === result.id && !praiseLines[result.id] && HV.engine && HV.engine.praise) {
      praiseLines[result.id] = HV.engine.praise(child, praiseLang);
      if (HV.speech) {
        var job = HV.speech.speak(praiseLines[result.id], { lang: praiseLang });
        var wrong = (result.wrongs || []).filter(function (w) { return w && w.explain; })[0];
        if (wrong) {
          Promise.resolve(job).then(function () {
            if (!praiseLines[result.id] || !HV.speech) return;
            HV.speech.speak(wrong.explain, { lang: wrong.subject === "english" ? "en" : "vi", chain: true });
          });
        }
      }
    }
    var root = el("section", { class: "play week-report" });
    root.appendChild(el("header", { class: "topbar" }, [
      el("button", { class: "icon-btn", "data-go": "#/c/" + child, text: "←" }),
      el("div", { class: "top-title" }, [
        el("strong", { text: "Kết quả tuần" }),
        el("span", { text: result.week || "" })
      ])
    ]));
    root.appendChild(el("p", { class: "medal", text: (result.icon || "🌱") + " " + (result.medalName || "Chưa có huy chương") }));
    if (praiseLines[result.id]) root.appendChild(el("h2", { text: praiseLines[result.id] }));
    root.appendChild(el("h2", { text: result.percent + "%" }));
    root.appendChild(el("p", { class: "lede", text: "Đúng " + result.correct + "/" + result.total + " câu. Thưởng " + (result.bonus || 0) + " sao." }));
    ["math", "english", "vietnamese"].forEach(function (id) {
      var row = result.bySubject && result.bySubject[id];
      if (!row || !row.total) return;
      root.appendChild(el("p", { text: subjectName(id) + ": " + row.correct + "/" + row.total }));
    });
    if (result.rewardNote) root.appendChild(el("p", { class: "milestone-banner", text: result.rewardNote }));
    var wrongs = result.wrongs || [];
    if (wrongs.length) {
      root.appendChild(el("h3", { text: "Câu chưa đúng" }));
      wrongs.forEach(function (w) {
        root.appendChild(el("p", { class: "lede", text: (w.prompt || "") + (w.explain ? " " + w.explain : "") }));
      });
    } else {
      root.appendChild(el("p", { text: "Không có câu nào sai." }));
    }
    return root;
  }

  function view(child) {
    var st = status(child);
    if (st.result) return report(child, st.result);
    if (!st.open) {
      var wait = el("section", { class: "play" });
      wait.appendChild(el("header", { class: "topbar" }, [
        el("button", { class: "icon-btn", "data-go": "#/c/" + child, text: "←" }),
        el("div", { class: "top-title" }, [el("strong", { text: "Bài kiểm tra tuần" })])
      ]));
      wait.appendChild(el("h2", { text: "Còn " + st.days + " ngày nữa" }));
      wait.appendChild(el("p", { class: "lede", text: "Bài mở vào thứ Bảy. Nếu quên, vẫn làm được trong ngày Chủ nhật." }));
      return wait;
    }
    if (!session || session.child !== child || session.week !== st.week) {
      var intro = el("section", { class: "play" });
      intro.appendChild(el("header", { class: "topbar" }, [
        el("button", { class: "icon-btn", "data-go": "#/c/" + child, text: "←" }),
        el("div", { class: "top-title" }, [
          el("strong", { text: "Bài kiểm tra tuần 🏆" }),
          el("span", { text: st.week })
        ])
      ]));
      intro.appendChild(el("p", { class: "lede", text: child === "gin"
        ? "Tám câu nghe và chạm. Làm một lần. Không bị giờ đuổi."
        : "Khoảng 25 câu Toán, Tiếng Anh và Tiếng Việt. Làm một lần trong thứ Bảy hoặc Chủ nhật. Đồng hồ chỉ để xem, không trừ điểm." }));
      intro.appendChild(el("button", { class: "btn btn-primary", text: "Bắt đầu", onClick: function () {
        loadPaper(child, st.week).then(function (questions) {
          session = { child: child, week: st.week, questions: questions, index: 0, answers: [], started: Date.now() };
          clearInterval(clock);
          clock = setInterval(function () {
            var node = document.querySelector(".star-pill");
            if (node && session) node.textContent = clockText();
          }, 1000);
          if (HV.ui && HV.ui.render) HV.ui.render();
        });
      } }));
      return intro;
    }
    return paintQuestion();
  }

  function parentPanel() {
    var box = el("section", { class: "past" });
    box.appendChild(el("h2", { text: "Bài kiểm tra tuần" }));
    var list = merged();
    if (!list.length) {
      box.appendChild(el("p", { class: "muted", text: "Chưa có bài kiểm tra nào." }));
      return box;
    }
    list.forEach(function (t) {
      var row = el("div", { class: "day-log" });
      row.appendChild(el("strong", { text: (t.child === "gin" ? "Gin" : "Mon") + " · " + (t.week || "") }));
      row.appendChild(el("p", { text: (t.icon || "") + " " + (t.medalName || t.medal || "") + " · " + (t.percent || 0) + "% · thưởng " + (t.bonus || 0) + " sao" }));
      var input = el("input", { class: "week-note", value: t.rewardNote || "", placeholder: "Thưởng: đi công viên" });
      var save = el("button", { class: "btn", text: "Lưu thưởng", onClick: function () {
        var note = input.value.trim();
        var all = readLocal();
        var found = false;
        all.forEach(function (item) {
          if (item.id === t.id) { item.rewardNote = note; found = true; }
        });
        if (!found) all.push(Object.assign({}, t, { rewardNote: note }));
        writeLocal(all);
        if (HV.cloud && HV.cloud.saveWeeklyNote) HV.cloud.saveWeeklyNote(t.id, note);
      } });
      row.appendChild(input);
      row.appendChild(save);
      box.appendChild(row);
    });
    return box;
  }

  HV.weekly = { card: card, view: view, parentPanel: parentPanel, status: status };
})(globalThis.HV = globalThis.HV || {});
