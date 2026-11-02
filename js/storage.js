(function (HV) {
  "use strict";

  var KEY = "hoc-vui-v1";
  var U = HV.util;
  var DEFAULT_TARGETS = { mon: [15, 30, 50], gin: [10, 20, 35] };
  var mem = null;

  function emptyData() {
    return {
      settings: {
        sound: true,
        speech: true,
        targets: {
          mon: DEFAULT_TARGETS.mon.slice(),
          gin: DEFAULT_TARGETS.gin.slice()
        }
      },
      kids: { mon: { daily: {} }, gin: { daily: {} } }
    };
  }

  function validTargets(arr) {
    if (!Array.isArray(arr) || arr.length !== 3) return false;
    var nums = arr.map(function (n) { return Number(n); });
    if (nums.some(function (n) { return !Number.isInteger(n) || n < 1 || n > 500; })) return false;
    return nums[0] < nums[1] && nums[1] < nums[2];
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return emptyData();
      var data = JSON.parse(raw);
      if (!data || !data.kids || !data.kids.mon || !data.kids.gin) return emptyData();
      if (!data.settings) data.settings = emptyData().settings;
      if (!data.settings.targets) data.settings.targets = {};
      if (!validTargets(data.settings.targets.mon)) data.settings.targets.mon = DEFAULT_TARGETS.mon.slice();
      if (!validTargets(data.settings.targets.gin)) data.settings.targets.gin = DEFAULT_TARGETS.gin.slice();
      if (typeof data.settings.sound !== "boolean") data.settings.sound = true;
      if (typeof data.settings.speech !== "boolean") data.settings.speech = true;
      ["mon", "gin"].forEach(function (id) {
        if (!data.kids[id].daily || typeof data.kids[id].daily !== "object") data.kids[id].daily = {};
      });
      return data;
    } catch (e) {
      return emptyData();
    }
  }

  function data() {
    if (!mem) mem = load();
    return mem;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data()));
      return true;
    } catch (e) {
      return false;
    }
  }

  function subjectId(item) {
    return item && (item.subject === "english" || item.subject === "vietnamese") ? item.subject : "math";
  }

  function emptySubjectBucket() {
    return {
      math: { stars: 0, correct: 0, answered: 0, exercisesDone: 0 },
      english: { stars: 0, correct: 0, answered: 0, exercisesDone: 0 },
      vietnamese: { stars: 0, correct: 0, answered: 0, exercisesDone: 0 }
    };
  }

  function dayStats(bucket) {
    var items = bucket && Array.isArray(bucket.items) ? bucket.items : [];
    var bySubject = emptySubjectBucket();
    items.forEach(function (item) {
      var slot = bySubject[subjectId(item)];
      slot.stars += Number(item.stars) || 0;
      slot.correct += Number(item.correct) || 0;
      slot.answered += Number(item.total) || 0;
      slot.exercisesDone += 1;
    });
    return {
      exercisesDone: items.length,
      correct: items.reduce(function (s, i) { return s + (Number(i.correct) || 0); }, 0),
      answered: items.reduce(function (s, i) { return s + (Number(i.total) || 0); }, 0),
      stars: items.reduce(function (s, i) { return s + (Number(i.stars) || 0); }, 0),
      bySubject: bySubject,
      items: items
    };
  }

  function summarizeWeek(child, weekStart) {
    var kid = data().kids[child];
    var days = [];
    var stars = 0;
    var correct = 0;
    var answered = 0;
    var exercisesDone = 0;
    var bySubject = emptySubjectBucket();
    for (var i = 0; i < 7; i++) {
      var date = U.addDays(weekStart, i);
      var stats = dayStats(kid.daily[date]);
      days.push({ date: date, dow: i, stats: stats });
      stars += stats.stars;
      correct += stats.correct;
      answered += stats.answered;
      exercisesDone += stats.exercisesDone;
      ["math", "english", "vietnamese"].forEach(function (id) {
        bySubject[id].stars += stats.bySubject[id].stars;
        bySubject[id].correct += stats.bySubject[id].correct;
        bySubject[id].answered += stats.bySubject[id].answered;
        bySubject[id].exercisesDone += stats.bySubject[id].exercisesDone;
      });
    }
    return {
      weekStart: weekStart,
      weekEnd: U.addDays(weekStart, 6),
      stars: stars,
      correct: correct,
      answered: answered,
      exercisesDone: exercisesDone,
      bySubject: bySubject,
      days: days
    };
  }

  function listWeeks(child) {
    var kid = data().kids[child];
    var set = {};
    Object.keys(kid.daily).forEach(function (date) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) set[U.weekStart(date)] = true;
    });
    set[U.weekStart(U.todayStr())] = true;
    return Object.keys(set).sort().reverse().map(function (ws) {
      return summarizeWeek(child, ws);
    });
  }

  function allTime(child) {
    var kid = data().kids[child];
    var byExercise = {};
    var byCategory = {};
    var recent = [];
    var stars = 0;
    var correct = 0;
    var answered = 0;
    var rounds = 0;
    var bySubject = emptySubjectBucket();
    Object.keys(kid.daily).forEach(function (date) {
      var stats = dayStats(kid.daily[date]);
      stars += stats.stars;
      correct += stats.correct;
      answered += stats.answered;
      rounds += stats.exercisesDone;
      stats.items.forEach(function (item) {
        var sid = subjectId(item);
        bySubject[sid].stars += Number(item.stars) || 0;
        bySubject[sid].correct += Number(item.correct) || 0;
        bySubject[sid].answered += Number(item.total) || 0;
        bySubject[sid].exercisesDone += 1;
        recent.push({
          date: date,
          id: item.id,
          title: item.title,
          category: item.category,
          subject: sid,
          correct: Number(item.correct) || 0,
          total: Number(item.total) || 0,
          stars: Number(item.stars) || 0,
          at: Number(item.at) || 0
        });
        var b = byExercise[item.id] || {
          id: item.id,
          title: item.title,
          category: item.category,
          played: 0,
          bestStars: 0,
          correct: 0,
          answered: 0,
          lastAt: 0
        };
        b.played += 1;
        b.bestStars = Math.max(b.bestStars, Number(item.stars) || 0);
        b.correct += Number(item.correct) || 0;
        b.answered += Number(item.total) || 0;
        b.lastAt = Math.max(b.lastAt, Number(item.at) || 0);
        b.title = item.title || b.title;
        byExercise[item.id] = b;
        var c = byCategory[sid + ":" + (item.category || "")] || { correct: 0, answered: 0, stars: 0, played: 0 };
        byCategory[sid + ":" + (item.category || "")] = c;
        c.correct += Number(item.correct) || 0;
        c.answered += Number(item.total) || 0;
        c.stars += Number(item.stars) || 0;
        c.played += 1;
      });
    });
    recent.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    return {
      stars: stars,
      correct: correct,
      answered: answered,
      rounds: rounds,
      byExercise: byExercise,
      byCategory: byCategory,
      bySubject: bySubject,
      recent: recent.slice(0, 40)
    };
  }

  function starsFor(correct, total) {
    if (!total || correct <= 0) return 0;
    var r = correct / total;
    if (r >= 0.999) return 3;
    if (r >= 0.6) return 2;
    return 1;
  }

  function recordRound(child, round) {
    var kid = data().kids[child];
    if (!kid) return null;
    var date = U.todayStr();
    if (!kid.daily[date] || !Array.isArray(kid.daily[date].items)) kid.daily[date] = { items: [] };
    kid.daily[date].items.push({
      id: String(round.id || ""),
      title: String(round.title || ""),
      category: String(round.category || ""),
      subject: round.subject === "english" || round.subject === "vietnamese" ? round.subject : "math",
      correct: Number(round.correct) || 0,
      total: Number(round.total) || 0,
      stars: U.clamp(Number(round.stars) || 0, 0, 3),
      at: Date.now(),
      nonce: Math.random().toString(36).slice(2, 10)
    });
    var saved = save();
    var week = summarizeWeek(child, U.weekStart(date));
    return { date: date, week: week, saved: saved };
  }

  function todayBest(child, id) {
    var bucket = data().kids[child].daily[U.todayStr()];
    if (!bucket || !bucket.items) return null;
    var items = bucket.items.filter(function (i) { return i.id === id; });
    if (!items.length) return null;
    return items.reduce(function (m, i) { return Math.max(m, Number(i.stars) || 0); }, 0);
  }

  function setTargets(child, arr) {
    if (!validTargets(arr)) {
      return { ok: false, message: "Ba mốc phải là số nguyên, tăng dần, từ 1 đến 500." };
    }
    data().settings.targets[child] = arr.map(Number);
    save();
    return { ok: true };
  }

  function setSetting(key, value) {
    data().settings[key] = value;
    save();
  }

  function resetChild(child) {
    if (!data().kids[child]) return;
    var epoch = Number(data().kids[child].resetEpoch) || 0;
    data().kids[child] = { daily: {}, resetEpoch: epoch };
    save();
  }

  function exportPayload() {
    return {
      app: "hoc-vui",
      version: 1,
      exportedAt: new Date().toISOString(),
      data: JSON.parse(JSON.stringify(data()))
    };
  }

  function countKid(kid) {
    var stars = 0;
    var rounds = 0;
    var days = 0;
    var daily = (kid && kid.daily) || {};
    Object.keys(daily).forEach(function (date) {
      var items = (daily[date] && daily[date].items) || [];
      if (items.length) days += 1;
      rounds += items.length;
      items.forEach(function (i) { stars += Number(i.stars) || 0; });
    });
    return { stars: stars, rounds: rounds, days: days };
  }

  function validate(obj) {
    if (!obj || obj.app !== "hoc-vui" || obj.version !== 1 || !obj.data) {
      throw new Error("Tệp không phải bản sao của Học vui.");
    }
    ["mon", "gin"].forEach(function (id) {
      var kid = obj.data.kids && obj.data.kids[id];
      if (!kid || typeof kid.daily !== "object" || !kid.daily) {
        throw new Error("Thiếu dữ liệu của " + (id === "mon" ? "Mon" : "Gin") + ".");
      }
      Object.keys(kid.daily).forEach(function (date) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Có ngày không hợp lệ trong tệp.");
        if (!kid.daily[date] || !Array.isArray(kid.daily[date].items)) {
          throw new Error("Nhật ký một ngày bị lỗi.");
        }
      });
    });
    var targets = obj.data.settings && obj.data.settings.targets;
    if (targets) {
      if (targets.mon && !validTargets(targets.mon)) throw new Error("Mốc thưởng của Mon không hợp lệ.");
      if (targets.gin && !validTargets(targets.gin)) throw new Error("Mốc thưởng của Gin không hợp lệ.");
    }
  }

  function previewImport(obj) {
    validate(obj);
    return {
      mon: countKid(obj.data.kids.mon),
      gin: countKid(obj.data.kids.gin),
      exportedAt: obj.exportedAt || ""
    };
  }

  function itemKey(item) {
    if (item && item.nonce) return "n:" + item.nonce;
    return ["a", item.at || 0, item.id || "", item.correct || 0, item.total || 0, item.stars || 0].join("|");
  }

  function cleanItem(item) {
    return {
      id: String(item.id || ""),
      title: String(item.title || ""),
      category: String(item.category || ""),
      subject: item.subject === "english" || item.subject === "vietnamese" ? item.subject : "math",
      correct: Math.max(0, Number(item.correct) || 0),
      total: Math.max(0, Number(item.total) || 0),
      stars: U.clamp(Number(item.stars) || 0, 0, 3),
      at: Number(item.at) || 0,
      nonce: String(item.nonce || "")
    };
  }

  function importPayload(obj) {
    validate(obj);
    var current = data();
    var settings = obj.data.settings || {};
    if (typeof settings.sound === "boolean") current.settings.sound = settings.sound;
    if (typeof settings.speech === "boolean") current.settings.speech = settings.speech;
    if (settings.targets && validTargets(settings.targets.mon)) {
      current.settings.targets.mon = settings.targets.mon.map(Number);
    }
    if (settings.targets && validTargets(settings.targets.gin)) {
      current.settings.targets.gin = settings.targets.gin.map(Number);
    }
    ["mon", "gin"].forEach(function (id) {
      var kid = current.kids[id];
      if (!kid.daily || typeof kid.daily !== "object") kid.daily = {};
      var src = obj.data.kids[id].daily || {};
      Object.keys(src).forEach(function (date) {
        var map = {};
        var existing = (kid.daily[date] && kid.daily[date].items) || [];
        existing.forEach(function (item) { map[itemKey(item)] = item; });
        src[date].items.slice(0, 200).forEach(function (item) {
          var clean = cleanItem(item);
          map[itemKey(clean)] = clean;
        });
        var list = Object.keys(map).map(function (k) { return map[k]; });
        list.sort(function (a, b) { return (a.at || 0) - (b.at || 0); });
        kid.daily[date] = { items: list };
      });
      var importedEpoch = Number(obj.data.kids[id].resetEpoch) || 0;
      if (importedEpoch > (Number(kid.resetEpoch) || 0)) kid.resetEpoch = importedEpoch;
    });
    if (!save()) throw new Error("Không lưu được trên máy này.");
  }

  function milestoneState(child, weekStars) {
    var targets = data().settings.targets[child].slice();
    var reached = 0;
    targets.forEach(function (t) {
      if (weekStars >= t) reached += 1;
    });
    return { targets: targets, reached: reached, next: targets[reached] || null };
  }

  HV.storage = {
    KEY: KEY,
    DEFAULT_TARGETS: DEFAULT_TARGETS,
    data: data,
    save: save,
    recordRound: recordRound,
    summarizeWeek: summarizeWeek,
    listWeeks: listWeeks,
    allTime: allTime,
    dayStats: dayStats,
    starsFor: starsFor,
    todayBest: todayBest,
    setTargets: setTargets,
    setSetting: setSetting,
    resetChild: resetChild,
    exportPayload: exportPayload,
    previewImport: previewImport,
    importPayload: importPayload,
    milestoneState: milestoneState,
    validTargets: validTargets,
    reload: function () { mem = null; return data(); }
  };
})(globalThis.HV = globalThis.HV || {});
