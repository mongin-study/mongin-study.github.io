(function (HV) {
  "use strict";

  var rnd = HV.util.rnd;
  var pick = HV.util.pick;
  var shuffle = HV.util.shuffle;
  var read = HV.util.readNumber;

  var COLORS = [
    { id: "red", name: "đỏ", hex: "#ef4444" },
    { id: "blue", name: "xanh dương", hex: "#3b82f6" },
    { id: "yellow", name: "vàng", hex: "#eab308" },
    { id: "green", name: "xanh lá", hex: "#22c55e" },
    { id: "orange", name: "cam", hex: "#f97316" },
    { id: "purple", name: "tím", hex: "#a855f7" },
    { id: "pink", name: "hồng", hex: "#ec4899" }
  ];

  var BASIC_SHAPES = [
    { id: "circle", name: "hình tròn", sides: 0, vertices: 0 },
    { id: "square", name: "hình vuông", sides: 4, vertices: 4 },
    { id: "triangle", name: "hình tam giác", sides: 3, vertices: 3 }
  ];

  var ALL_SHAPES = BASIC_SHAPES.concat([
    { id: "rectangle", name: "hình chữ nhật", sides: 4, vertices: 4 },
    { id: "pentagon", name: "hình ngũ giác", sides: 5, vertices: 5 },
    { id: "hexagon", name: "hình lục giác", sides: 6, vertices: 6 },
    { id: "diamond", name: "hình thoi", sides: 4, vertices: 4 },
    { id: "star", name: "hình ngôi sao", sides: null, vertices: null },
    { id: "heart", name: "hình trái tim", sides: null, vertices: null }
  ]);

  var COUNTABLES = [
    { emoji: "🍎", name: "quả táo" },
    { emoji: "⭐", name: "ngôi sao" },
    { emoji: "🚗", name: "chiếc xe" },
    { emoji: "🐶", name: "chú cún" },
    { emoji: "🌸", name: "bông hoa" },
    { emoji: "🍪", name: "chiếc bánh" },
    { emoji: "🎈", name: "quả bóng bay" },
    { emoji: "🐟", name: "con cá" }
  ];

  function makeQuestions(cfg, build) {
    var count = Math.max(1, Math.min(24, cfg.count || 5));
    var out = [];
    var guard = 0;
    while (out.length < count && guard < count * 20) {
      guard += 1;
      var q = build(cfg, out.length);
      if (q && q.prompt) out.push(q);
    }
    return out;
  }

  function numberChoices(answer, howMany, lo, hi) {
    var set = {};
    set[answer] = true;
    var size = 1;
    for (var d = 1; d <= 14 && size < howMany; d++) {
      [answer - d, answer + d].forEach(function (v) {
        if (v >= lo && v <= hi && !set[v]) {
          set[v] = true;
          size += 1;
        }
      });
    }
    var guard = 0;
    var span = hi - lo + 1;
    while (size < howMany && size < span && guard < 40) {
      guard += 1;
      var v = rnd(lo, hi);
      if (!set[v]) {
        set[v] = true;
        size += 1;
      }
    }
    var arr = shuffle(Object.keys(set).map(Number));
    if (arr.length > howMany) {
      arr = arr.slice(0, howMany);
      if (arr.indexOf(answer) < 0) arr[0] = answer;
      arr = shuffle(arr);
    }
    return arr;
  }

  function qChoice(spec) {
    return {
      kind: "choice",
      prompt: spec.prompt,
      speak: spec.speak || spec.prompt,
      explain: spec.explain || "",
      scene: spec.scene || null,
      variant: spec.variant || "",
      columns: spec.columns || (spec.options.length === 3 ? 3 : 2),
      choices: spec.options.map(function (o) {
        return {
          text: o.text != null ? String(o.text) : "",
          emoji: o.emoji || "",
          emojis: o.emojis || null,
          shape: o.shape || "",
          color: o.color || "",
          size: o.size || 0,
          correct: !!o.correct
        };
      })
    };
  }

  function qKey(spec) {
    return {
      kind: "keypad",
      prompt: spec.prompt,
      speak: spec.speak || spec.prompt,
      explain: spec.explain || "",
      scene: spec.scene || null,
      answer: spec.answer,
      maxDigits: spec.maxDigits || String(Math.abs(spec.answer)).length
    };
  }

  function eq(text) {
    return { layout: "equation", text: text };
  }

  function pair100() {
    if (Math.random() < 0.55) {
      var aT = rnd(1, 7);
      var aO = rnd(0, 7);
      var bT = rnd(0, 9 - aT);
      var bO = rnd(0, 9 - aO);
      var a = aT * 10 + aO;
      var b = bT * 10 + bO;
      if (b === 0) b = rnd(1, Math.max(1, 9 - aO));
      if (a + b > 100 || a < 10) return null;
      return [a, b];
    }
    var x = rnd(12, 80);
    var xO = x % 10;
    if (xO === 0) return null;
    var bOnes = rnd(10 - xO, 9);
    var remain = 100 - x - bOnes;
    if (remain < 0) return null;
    var bTens = rnd(0, Math.min(8, Math.floor(remain / 10)));
    var y = bTens * 10 + bOnes;
    if (y <= 0 || x + y > 100) return null;
    return [x, y];
  }

  function pairSub100() {
    if (Math.random() < 0.5) {
      var aT = rnd(2, 9);
      var aO = rnd(1, 9);
      var bT = rnd(0, aT);
      var bO = rnd(0, aO);
      var a = aT * 10 + aO;
      var b = bT * 10 + bO;
      if (b <= 0 || b > a) return null;
      return [a, b];
    }
    var t = rnd(2, 9);
    var o = rnd(0, 7);
    var subO = rnd(o + 1, 9);
    var subT = rnd(0, t - 1);
    var A = t * 10 + o;
    var B = subT * 10 + subO;
    if (B <= 0 || B >= A) return null;
    return [A, B];
  }

  function storyAdd(nameA, nameB, unit) {
    return {
      op: "add",
      unit: unit,
      line: function (a, b) {
        return nameA + " có " + a + " " + unit + ", " + nameB + " có " + b + " " + unit + ". Vậy tổng cộng có bao nhiêu " + unit + "?";
      },
      say: function (a, b) {
        return nameA + " có " + read(a) + " " + unit + ", " + nameB + " có " + read(b) + " " + unit + ". Vậy tổng cộng có bao nhiêu " + unit + "?";
      }
    };
  }

  function storyGive(nameA, nameB, unit) {
    return {
      op: "sub",
      unit: unit,
      line: function (a, b) {
        return nameA + " có " + a + " " + unit + ". " + nameA + " cho " + nameB + " " + b + " " + unit + ". Vậy " + nameA + " còn bao nhiêu " + unit + "?";
      },
      say: function (a, b) {
        return nameA + " có " + read(a) + " " + unit + ". " + nameA + " cho " + nameB + " " + b + " " + unit + ". Vậy " + nameA + " còn bao nhiêu " + unit + "?";
      }
    };
  }

  function storyEat(name, unit) {
    return {
      op: "sub",
      unit: unit,
      line: function (a, b) {
        return name + " có " + a + " " + unit + ". " + name + " ăn " + b + " " + unit + ". Vậy còn lại bao nhiêu " + unit + "?";
      },
      say: function (a, b) {
        return name + " có " + read(a) + " " + unit + ". " + name + " ăn " + read(b) + " " + unit + ". Vậy còn lại bao nhiêu " + unit + "?";
      }
    };
  }

  var STORIES = [
    storyAdd("Mẹ Vy", "Gin", "cái kẹo"),
    storyAdd("Bố Hà", "Mon", "cái bánh"),
    storyAdd("Mon", "Gin", "quả táo"),
    storyAdd("Gin", "Mon", "chiếc ô tô đồ chơi"),
    storyAdd("bà", "Mon", "quả bóng bay"),
    storyAdd("ông", "Gin", "cây bút màu"),
    storyAdd("Cún Vàng", "Gin", "cái bánh"),
    storyGive("Mon", "Gin", "quả táo"),
    storyGive("Mẹ Vy", "Mon", "cái kẹo"),
    storyGive("Bố Hà", "Gin", "cây bút màu"),
    storyGive("Gin", "Mon", "quả bóng bay"),
    storyEat("Cún Vàng", "cái bánh"),
    storyEat("Gin", "cái kẹo")
  ];

  function shapeSet(name) {
    if (name === "basic") return BASIC_SHAPES;
    return ALL_SHAPES.filter(function (s) { return s.sides != null; });
  }

  var generators = {
    addition: function (cfg) {
      return makeQuestions(cfg, function () {
        var within = cfg.sumMax || cfg.within || 20;
        var pair = within > 20 ? pair100() : null;
        var a;
        var b;
        if (pair) {
          a = pair[0];
          b = pair[1];
        } else if (within > 20) return null;
        else {
          a = rnd(cfg.min || 1, Math.max(1, within - 1));
          b = rnd(1, Math.max(1, within - a));
        }
        var ans = a + b;
        var speak = read(a) + " cộng " + read(b) + " bằng mấy?";
        var scene = eq(a + " + " + b + " = ?");
        var explain = a + " + " + b + " = " + ans;
        if (cfg.input === "choice") {
          var nums = numberChoices(ans, cfg.choiceCount || 4, 0, Math.max(within, ans + 3));
          return qChoice({
            prompt: "Chọn kết quả đúng",
            speak: speak,
            scene: scene,
            explain: explain,
            options: nums.map(function (n) { return { text: String(n), correct: n === ans }; })
          });
        }
        return qKey({
          prompt: "Tính rồi điền số",
          speak: speak,
          scene: scene,
          answer: ans,
          maxDigits: String(Math.max(within, ans)).length,
          explain: explain
        });
      });
    },

    subtraction: function (cfg) {
      return makeQuestions(cfg, function () {
        var within = cfg.max || cfg.within || 20;
        var pair = within > 20 ? pairSub100() : [rnd(2, within), 0];
        if (within <= 20) {
          var a0 = rnd(2, within);
          pair = [a0, rnd(1, a0)];
        }
        if (!pair) return null;
        var a = pair[0];
        var b = pair[1];
        if (b > a || b <= 0) return null;
        var ans = a - b;
        var speak = read(a) + " trừ " + read(b) + " bằng mấy?";
        var scene = eq(a + " − " + b + " = ?");
        var explain = a + " − " + b + " = " + ans;
        if (cfg.input === "choice") {
          var nums = numberChoices(ans, 4, 0, within);
          return qChoice({
            prompt: "Chọn kết quả đúng",
            speak: speak,
            scene: scene,
            explain: explain,
            options: nums.map(function (n) { return { text: String(n), correct: n === ans }; })
          });
        }
        return qKey({
          prompt: "Tính rồi điền số",
          speak: speak,
          scene: scene,
          answer: ans,
          maxDigits: String(within).length,
          explain: explain
        });
      });
    },

    nextPrev: function (cfg) {
      return makeQuestions(cfg, function () {
        var lo = cfg.min != null ? cfg.min : 0;
        var hi = cfg.max != null ? cfg.max : 30;
        var next = Math.random() < 0.5;
        var n = next ? rnd(lo, hi - 1) : rnd(lo + 1, hi);
        var ans = next ? n + 1 : n - 1;
        var prompt = next ? "Số liền sau của " + n + " là số nào?" : "Số liền trước của " + n + " là số nào?";
        var speak = next
          ? "Số liền sau của " + read(n) + " là số nào?"
          : "Số liền trước của " + read(n) + " là số nào?";
        var nums = numberChoices(ans, cfg.choiceCount || 3, Math.max(0, lo - 1), hi + 1);
        return qChoice({
          prompt: prompt,
          speak: speak,
          scene: eq(String(n)),
          explain: next ? "Số liền sau là " + ans + "." : "Số liền trước là " + ans + ".",
          columns: nums.length === 3 ? 3 : 2,
          options: nums.map(function (v) { return { text: String(v), correct: v === ans }; })
        });
      });
    },

    wordProblem: function (cfg) {
      return makeQuestions(cfg, function () {
        var story = pick(STORIES);
        var a;
        var b;
        var ans;
        if (story.op === "add") {
          a = rnd(1, 12);
          b = rnd(1, Math.max(1, 18 - a));
          if (a + b > 20) b = 20 - a;
          ans = a + b;
        } else {
          a = rnd(3, 18);
          b = rnd(1, a - 1);
          ans = a - b;
        }
        var nums = numberChoices(ans, 4, 0, 20);
        var explain = story.op === "add"
          ? read(a) + " cộng " + read(b) + " bằng " + read(ans) + ". Vậy có " + read(ans) + " " + story.unit + "."
          : read(a) + " trừ " + read(b) + " bằng " + read(ans) + ". Vậy còn " + read(ans) + " " + story.unit + ".";
        return qChoice({
          prompt: story.line(a, b),
          speak: story.say(a, b),
          explain: explain,
          options: nums.map(function (n) { return { text: String(n), correct: n === ans }; })
        });
      });
    },

    numberBond: function (cfg) {
      return makeQuestions(cfg, function () {
        var total = cfg.total || 10;
        var known = rnd(0, total - 1);
        var ans = total - known;
        var speak = read(known) + " cộng số nào bằng " + read(total) + "?";
        return qKey({
          prompt: "Điền số còn thiếu",
          speak: speak,
          scene: { layout: "bond", whole: total, known: known },
          answer: ans,
          maxDigits: String(total).length,
          explain: known + " + " + ans + " = " + total
        });
      });
    },

    missingPart: function (cfg) {
      return makeQuestions(cfg, function () {
        var max = cfg.max || 20;
        var total = rnd(4, max);
        var known = rnd(1, total - 1);
        var ans = total - known;
        var flipped = Math.random() < 0.5;
        var text = flipped ? "? + " + known + " = " + total : known + " + ? = " + total;
        return qKey({
          prompt: "Điền số vào ô trống",
          speak: "Tìm số còn thiếu. " + read(known) + " cộng số còn thiếu bằng " + read(total),
          scene: eq(text),
          answer: ans,
          maxDigits: 2,
          explain: known + " + " + ans + " = " + total
        });
      });
    },

    sequence: function (cfg) {
      return makeQuestions(cfg, function () {
        var steps = cfg.steps && cfg.steps.length ? cfg.steps : [1, 2, 5, 10];
        var step = pick(steps);
        var length = cfg.length || 4;
        var max = cfg.max || 100;
        var min = cfg.min != null ? cfg.min : 0;
        var startMax = max - step * length;
        if (startMax < min) return null;
        var start = rnd(Math.max(min, step > 1 ? 0 : min), startMax);
        if (cfg.align) start = start - (start % step);
        if (start < min) start = min;
        var terms = [];
        for (var i = 0; i < length; i++) terms.push(start + i * step);
        var ans = start + length * step;
        if (ans > max || terms.some(function (n) { return n < 0; })) return null;
        var shown = terms.join(" , ") + " , ?";
        var speakBits = terms.map(read).join(", ");
        var speak = speakBits + ". Số tiếp theo là số nào?";
        if (cfg.input === "keypad") {
          return qKey({
            prompt: "Số tiếp theo là số nào?",
            speak: speak,
            scene: eq(shown),
            answer: ans,
            maxDigits: String(max).length,
            explain: "Cộng thêm " + step + ". Số tiếp theo là " + ans + "."
          });
        }
        var nums = numberChoices(ans, cfg.choiceCount || 3, Math.max(0, ans - 8), Math.min(max, ans + 8));
        return qChoice({
          prompt: "Chọn số tiếp theo",
          speak: speak,
          scene: eq(shown),
          explain: "Cộng thêm " + step + ", được " + ans + ".",
          columns: nums.length >= 3 ? 3 : 2,
          options: nums.map(function (n) { return { text: String(n), correct: n === ans }; })
        });
      });
    },

    oddOneOut: function (cfg) {
      return makeQuestions(cfg, function () {
        var mode = cfg.mode || "shape";
        if (mode === "visual") mode = Math.random() < 0.5 ? "shape" : "color";
        if (mode === "number") mode = Math.random() < 0.5 ? "parity" : "multiple";
        if (mode === "shape" || mode === "color") {
          var shapes = shuffle(BASIC_SHAPES.concat([{ id: "star", name: "ngôi sao" }, { id: "heart", name: "trái tim" }]));
          var colorA = pick(COLORS);
          var colorB = pick(COLORS.filter(function (c) { return c.id !== colorA.id; }));
          var same = shapes[0];
          var diff = shapes[1];
          var options;
          var explain;
          if (mode === "shape") {
            options = shuffle([
              { shape: same.id, color: colorA.hex, size: 78, correct: false },
              { shape: same.id, color: colorA.hex, size: 78, correct: false },
              { shape: same.id, color: colorA.hex, size: 78, correct: false },
              { shape: diff.id, color: colorA.hex, size: 78, correct: true }
            ]);
            explain = "Hình khác là " + diff.name + ".";
          } else {
            options = shuffle([
              { shape: same.id, color: colorA.hex, size: 78, correct: false },
              { shape: same.id, color: colorA.hex, size: 78, correct: false },
              { shape: same.id, color: colorA.hex, size: 78, correct: false },
              { shape: same.id, color: colorB.hex, size: 78, correct: true }
            ]);
            explain = "Màu khác là màu " + colorB.name + ".";
          }
          return qChoice({
            prompt: "Chạm vào cái khác",
            speak: "Chạm vào cái không giống các bạn",
            explain: explain,
            columns: 2,
            options: options
          });
        }
        var singleton;
        var others = [];
        var explainN;
        if (mode === "parity") {
          var oddOut = Math.random() < 0.5;
          function evenN() { return rnd(1, 12) * 2; }
          function oddN() { return evenN() - 1; }
          singleton = oddOut ? oddN() : evenN();
          while (others.length < 3) {
            var n = oddOut ? evenN() : oddN();
            if (n !== singleton && others.indexOf(n) < 0) others.push(n);
          }
          explainN = singleton + (singleton % 2 ? " là số lẻ." : " là số chẵn.") + " Các số kia thì khác.";
        } else {
          function mult() { return rnd(1, 10) * 5; }
          singleton = rnd(1, 40);
          if (singleton % 5 === 0) singleton += 1;
          while (others.length < 3) {
            var m = mult();
            if (others.indexOf(m) < 0 && m !== singleton) others.push(m);
          }
          explainN = singleton + " không thuộc dãy đếm cách 5.";
        }
        var nums = shuffle([singleton].concat(others));
        return qChoice({
          prompt: "Số nào khác các số còn lại?",
          speak: "Tìm số không cùng nhóm",
          explain: explainN,
          columns: 2,
          options: nums.map(function (n) { return { text: String(n), correct: n === singleton }; })
        });
      });
    },

    compareExpr: function (cfg) {
      return makeQuestions(cfg, function () {
        function expr() {
          if (Math.random() < 0.7) {
            var a = rnd(1, 9);
            var b = rnd(1, 9);
            return { text: a + " + " + b, v: a + b, say: read(a) + " cộng " + read(b) };
          }
          var x = rnd(4, 14);
          var y = rnd(1, x - 1);
          return { text: x + " − " + y, v: x - y, say: read(x) + " trừ " + read(y) };
        }
        var left = expr();
        var right = expr();
        var guard = 0;
        while (left.v === right.v && guard < 8) {
          right = expr();
          guard += 1;
        }
        if (left.v === right.v) return null;
        var bigger = left.v > right.v ? left : right;
        return qChoice({
          prompt: "Phép nào có kết quả lớn hơn?",
          speak: "Phép nào lớn hơn? " + left.say + ", hay " + right.say + "?",
          variant: "cards",
          explain: bigger.text + " = " + bigger.v + ", lớn hơn.",
          options: [
            { text: left.text, correct: left.v > right.v },
            { text: right.text, correct: right.v > left.v }
          ]
        });
      });
    },

    orderNumbers: function (cfg) {
      return makeQuestions(cfg, function () {
        var n = cfg.n || 3;
        var min = cfg.min != null ? cfg.min : 1;
        var max = cfg.max != null ? cfg.max : 10;
        if (max - min + 1 < n) return null;
        var set = [];
        var guard = 0;
        while (set.length < n && guard < 40) {
          guard += 1;
          var v = rnd(min, max);
          if (set.indexOf(v) < 0) set.push(v);
        }
        if (set.length < n) return null;
        var sorted = set.slice().sort(function (a, b) { return a - b; });
        return {
          kind: "order",
          prompt: "Chạm từ số bé đến số lớn",
          speak: "Chạm số bé trước, rồi đến số lớn hơn",
          explain: "Thứ tự đúng là " + sorted.join(", ") + ".",
          tokens: shuffle(set).map(function (num) {
            return { text: String(num), order: sorted.indexOf(num) };
          })
        };
      });
    },

    oddEven: function (cfg) {
      return makeQuestions(cfg, function () {
        var n = rnd(cfg.min || 1, cfg.max || 30);
        var even = n % 2 === 0;
        return qChoice({
          prompt: "Số " + n + " là số chẵn hay số lẻ?",
          speak: "Số " + read(n) + " là số chẵn hay số lẻ?",
          scene: { layout: "pairs", count: n },
          explain: even
            ? n + " chia hết thành từng cặp, nên là số chẵn."
            : n + " còn thừa 1 chấm, nên là số lẻ.",
          options: [
            { text: "Chẵn", correct: even },
            { text: "Lẻ", correct: !even }
          ]
        });
      });
    },

    compareNumbers: function (cfg) {
      return makeQuestions(cfg, function () {
        var min = cfg.min != null ? cfg.min : 0;
        var max = cfg.max != null ? cfg.max : 20;
        var mode = cfg.mode || "larger";
        var a = rnd(min, max);
        var b = rnd(min, max);
        var guard = 0;
        while (a === b && guard < 10) {
          b = rnd(min, max);
          guard += 1;
        }
        if (a === b) return null;
        var prompt = mode === "smaller" ? "Số nào nhỏ hơn?" : "Số nào lớn hơn?";
        var speak = mode === "smaller"
          ? "Trong hai số này, số nào nhỏ hơn?"
          : "Trong hai số này, số nào lớn hơn?";
        var correctA = mode === "smaller" ? a < b : a > b;
        return qChoice({
          prompt: prompt,
          speak: speak,
          variant: "cards",
          explain: (correctA ? a : b) + (mode === "smaller" ? " nhỏ hơn." : " lớn hơn."),
          options: [
            { text: String(a), correct: correctA },
            { text: String(b), correct: !correctA }
          ]
        });
      });
    },

    skipCount: function (cfg) {
      return makeQuestions(cfg, function () {
        var step = pick(cfg.steps && cfg.steps.length ? cfg.steps : [2, 5, 10]);
        var begin = step * rnd(1, 3);
        var terms = [0, 1, 2, 3].map(function (i) { return begin + i * step; });
        var ans = begin + 4 * step;
        if (ans > (cfg.max || 100)) return null;
        var nums = numberChoices(ans, 3, step, Math.min(100, ans + step * 3));
        return qChoice({
          prompt: "Đếm cách " + step + ". Số tiếp theo là số nào?",
          speak: "Đếm cách " + read(step) + ". " + terms.map(read).join(", ") + ". Tiếp theo là số nào?",
          scene: eq(terms.join(" , ") + " , ?"),
          explain: "Thêm " + step + " được " + ans + ".",
          columns: 3,
          options: nums.map(function (n) { return { text: String(n), correct: n === ans }; })
        });
      });
    },

    placeValue: function (cfg) {
      return makeQuestions(cfg, function () {
        var n = rnd(10, 99);
        var tens = Math.floor(n / 10);
        var ones = n % 10;
        var kind = pick(["tens", "ones", "value"]);
        var scene = { layout: "blocks", tens: tens, ones: ones };
        if (kind === "tens") {
          return qKey({
            prompt: "Số này có bao nhiêu chục?",
            speak: "Nhìn các thanh chục. Có bao nhiêu chục?",
            scene: scene,
            answer: tens,
            maxDigits: 2,
            explain: "Có " + tens + " chục. Số là " + n + "."
          });
        }
        if (kind === "ones") {
          return qKey({
            prompt: "Số này có bao nhiêu đơn vị?",
            speak: "Nhìn các chấm đơn vị. Có bao nhiêu đơn vị?",
            scene: scene,
            answer: ones,
            maxDigits: 2,
            explain: "Có " + ones + " đơn vị. Số là " + n + "."
          });
        }
        return qKey({
          prompt: "Đây là số mấy?",
          speak: "Có " + read(tens) + " chục và " + read(ones) + " đơn vị. Đây là số mấy?",
          scene: scene,
          answer: n,
          maxDigits: 2,
          explain: tens + " chục và " + ones + " đơn vị là " + n + "."
        });
      });
    },

    shapeName: function (cfg) {
      return makeQuestions(cfg, function () {
        var bank = cfg.set === "basic" ? BASIC_SHAPES : ALL_SHAPES;
        var shape = pick(bank);
        var color = pick(COLORS);
        var options = shuffle(bank).slice(0, 4);
        if (!options.some(function (s) { return s.id === shape.id; })) options[0] = shape;
        options = shuffle(options);
        return qChoice({
          prompt: "Đây là hình gì?",
          speak: "Đây là hình gì?",
          scene: { layout: "shapes", shapes: [{ shape: shape.id, color: color.hex, size: 140 }] },
          explain: "Đây là " + shape.name + ".",
          options: options.map(function (s) { return { text: s.name, correct: s.id === shape.id }; })
        });
      });
    },

    countSides: function (cfg) {
      return makeQuestions(cfg, function () {
        var bank = shapeSet(cfg.set || "all");
        var shape = pick(bank);
        var color = pick(COLORS);
        var ans = shape.sides;
        var pool = [];
        bank.forEach(function (s) {
          if (pool.indexOf(s.sides) < 0) pool.push(s.sides);
        });
        [0, 3, 4, 5, 6].forEach(function (n) {
          if (pool.indexOf(n) < 0 && pool.length < 4) pool.push(n);
        });
        var nums = numberChoices(ans, cfg.set === "basic" ? 2 : 4, 0, 6).filter(function (n, i, arr) {
          return arr.indexOf(n) === i;
        });
        if (nums.indexOf(ans) < 0) nums[0] = ans;
        return qChoice({
          prompt: "Hình này có mấy cạnh?",
          speak: "Đếm các cạnh. Hình này có mấy cạnh?",
          scene: { layout: "shapes", shapes: [{ shape: shape.id, color: color.hex, size: 140 }] },
          explain: shape.name + " có " + ans + " cạnh.",
          columns: nums.length === 2 ? 2 : 2,
          options: shuffle(nums).map(function (n) { return { text: String(n), correct: n === ans }; })
        });
      });
    },

    countVertices: function (cfg) {
      return makeQuestions(cfg, function () {
        var bank = shapeSet(cfg.set || "all").filter(function (s) { return s.vertices > 0; });
        var shape = pick(bank);
        var color = pick(COLORS);
        var ans = shape.vertices;
        var nums = numberChoices(ans, 4, 3, 6);
        return qChoice({
          prompt: "Hình này có mấy đỉnh?",
          speak: "Đếm các đỉnh, là các mũi nhọn. Có mấy đỉnh?",
          scene: { layout: "shapes", shapes: [{ shape: shape.id, color: color.hex, size: 140 }] },
          explain: shape.name + " có " + ans + " đỉnh.",
          options: nums.map(function (n) { return { text: String(n), correct: n === ans }; })
        });
      });
    },

    symmetry: function (cfg) {
      return makeQuestions(cfg, function () {
        var symmetric = Math.random() < 0.5;
        var a = pick(COLORS);
        var b = pick(COLORS);
        var c = pick(COLORS);
        var row;
        if (symmetric) row = [a, b, c, b, a];
        else {
          row = [pick(COLORS), pick(COLORS), pick(COLORS), pick(COLORS), pick(COLORS)];
          if (row[0].id === row[4].id && row[1].id === row[3].id) {
            var other = COLORS.filter(function (col) { return col.id !== row[0].id; })[0];
            row[4] = other;
          }
        }
        var isSym = row[0].id === row[4].id && row[1].id === row[3].id;
        return qChoice({
          prompt: "Hai bên vạch đứt có giống nhau không?",
          speak: "Nhìn hai bên đường kẻ. Chúng có giống nhau không?",
          scene: { layout: "mirror", colors: row.map(function (col) { return col.hex; }) },
          explain: isSym ? "Hai bên giống nhau. Đây là đối xứng." : "Hai bên không giống nhau.",
          options: [
            { text: "Có", correct: isSym },
            { text: "Không", correct: !isSym }
          ]
        });
      });
    },

    position: function (cfg) {
      return makeQuestions(cfg, function () {
        var axis = cfg.axis || "both";
        var useH = axis === "horizontal" || (axis === "both" && Math.random() < 0.45);
        if (!useH) {
          var sky = pick([
            ["🐦", "Con chim"],
            ["☁️", "Đám mây"],
            ["🦋", "Con bướm"],
            ["⭐", "Ngôi sao"]
          ]);
          var ground = pick([
            ["🐱", "Con mèo"],
            ["🐶", "Cún"],
            ["⚽", "Quả bóng"],
            ["🚗", "Chiếc xe"]
          ]);
          var askSky = Math.random() < 0.5;
          var who = askSky ? sky : ground;
          return qChoice({
            prompt: who[1] + " đang ở đâu?",
            speak: who[1] + " đang ở đâu?",
            scene: { layout: "zones", zones: [{ emoji: sky[0] }, { emoji: ground[0] }] },
            explain: askSky ? who[1] + " ở phía trên." : who[1] + " ở phía dưới.",
            options: [
              { text: "Ở trên", correct: askSky },
              { text: "Ở dưới", correct: !askSky }
            ]
          });
        }
        var left = pick([["🚗", "Chiếc xe"], ["🐶", "Cún"], ["🍎", "Quả táo"]]);
        var right = pick([["🐱", "Con mèo"], ["⭐", "Ngôi sao"], ["⚽", "Quả bóng"]]);
        var askLeft = Math.random() < 0.5;
        var item = askLeft ? left : right;
        return qChoice({
          prompt: item[1] + " ở bên nào?",
          speak: item[1] + " ở bên nào? Bên trái hay bên phải?",
          scene: { layout: "sides", left: { emoji: left[0] }, right: { emoji: right[0] } },
          explain: askLeft ? item[1] + " ở bên trái." : item[1] + " ở bên phải.",
          options: [
            { text: "Bên trái", correct: askLeft },
            { text: "Bên phải", correct: !askLeft }
          ]
        });
      });
    },

    moreSides: function (cfg) {
      return makeQuestions(cfg, function () {
        var bank = shapeSet("all");
        var a = pick(bank);
        var b = pick(bank);
        var guard = 0;
        while (a.sides === b.sides && guard < 8) {
          b = pick(bank);
          guard += 1;
        }
        if (a.sides === b.sides) return null;
        var colorA = pick(COLORS).hex;
        var colorB = pick(COLORS).hex;
        var more = a.sides > b.sides ? a : b;
        return qChoice({
          prompt: "Hình nào có nhiều cạnh hơn?",
          speak: "Hình nào có nhiều cạnh hơn?",
          variant: "cards",
          explain: more.name + " có " + more.sides + " cạnh, nhiều hơn.",
          options: [
            { shape: a.id, color: colorA, size: 96, correct: a.sides > b.sides },
            { shape: b.id, color: colorB, size: 96, correct: b.sides > a.sides }
          ]
        });
      });
    },

    countObjects: function (cfg) {
      return makeQuestions(cfg, function () {
        var min = cfg.min != null ? cfg.min : 1;
        var max = cfg.max != null ? cfg.max : 5;
        var n = rnd(min, max);
        var item = pick(COUNTABLES);
        var howMany = cfg.choiceCount || 3;
        var nums = numberChoices(n, howMany, Math.max(0, min - 1), Math.max(max + 2, 10));
        return qChoice({
          prompt: "Có bao nhiêu " + item.name + "?",
          speak: "Đếm các " + item.name + ". Có bao nhiêu?",
          scene: { layout: "emojis", items: Array(n).fill(item.emoji) },
          explain: "Có " + n + " " + item.name + ".",
          columns: nums.length === 3 ? 3 : 2,
          options: nums.map(function (v) { return { text: String(v), correct: v === n }; })
        });
      });
    },

    matchNumberGroup: function (cfg) {
      return makeQuestions(cfg, function () {
        var n = rnd(cfg.min || 1, cfg.max || 5);
        var item = pick(COUNTABLES);
        var nums = numberChoices(n, 3, 1, 6);
        return qChoice({
          prompt: "Nhóm nào có đúng " + n + " " + item.name + "?",
          speak: "Tìm nhóm có " + read(n) + " " + item.name,
          scene: { layout: "digit", text: String(n) },
          explain: "Nhóm đúng có " + n + " " + item.name + ".",
          columns: 3,
          options: nums.map(function (v) {
            return { emojis: Array(v).fill(item.emoji), correct: v === n };
          })
        });
      });
    },

    maker: function (cfg) {
      return makeQuestions(cfg, function () {
        var n = rnd(cfg.min || 1, cfg.max || 5);
        var item = pick([
          { emoji: "⭐", name: "ngôi sao" },
          { emoji: "🍎", name: "quả táo" },
          { emoji: "🌸", name: "bông hoa" },
          { emoji: "🚗", name: "chiếc xe" }
        ]);
        return {
          kind: "maker",
          prompt: "Làm đủ " + n + " " + item.name,
          speak: "Hãy làm đủ " + read(n) + " " + item.name,
          explain: "Đủ " + n + " " + item.name + " rồi.",
          emoji: item.emoji,
          answer: n
        };
      });
    },

    moreLess: function (cfg) {
      return makeQuestions(cfg, function () {
        var mode = cfg.mode || "more";
        if (mode === "both") mode = Math.random() < 0.5 ? "more" : "less";
        var a = rnd(1, 5);
        var b = rnd(1, 5);
        var guard = 0;
        while (a === b && guard < 8) {
          b = rnd(1, 5);
          guard += 1;
        }
        if (a === b) return null;
        var item = pick(COUNTABLES);
        var prompt = mode === "less" ? "Bên nào ít hơn?" : "Bên nào nhiều hơn?";
        var correctA = mode === "less" ? a < b : a > b;
        return qChoice({
          prompt: prompt,
          speak: prompt,
          variant: "cards",
          explain: "Một bên có " + a + ", bên kia có " + b + ".",
          options: [
            { emojis: Array(a).fill(item.emoji), correct: correctA },
            { emojis: Array(b).fill(item.emoji), correct: !correctA }
          ]
        });
      });
    },

    sizeCompare: function (cfg) {
      return makeQuestions(cfg, function () {
        var mode = cfg.mode || "bigger";
        if (mode === "both") mode = Math.random() < 0.5 ? "bigger" : "smaller";
        var shape = pick(BASIC_SHAPES.concat([{ id: "star" }, { id: "heart" }]));
        var color = pick(COLORS).hex;
        var bigCorrect = mode === "bigger";
        var prompt = mode === "bigger" ? "Cái nào to hơn?" : "Cái nào nhỏ hơn?";
        return qChoice({
          prompt: prompt,
          speak: prompt,
          variant: "cards",
          explain: mode === "bigger" ? "Cái to hơn là cái lớn." : "Cái nhỏ hơn là cái bé.",
          options: shuffle([
            { shape: shape.id, color: color, size: 120, correct: bigCorrect },
            { shape: shape.id, color: color, size: 62, correct: !bigCorrect }
          ])
        });
      });
    },

    patternNext: function (cfg) {
      return makeQuestions(cfg, function () {
        var kind = cfg.kind || "color";
        var type = pick(["abab", "aabb", "abc"]);
        if (kind === "color") {
          var cols = shuffle(COLORS).slice(0, 3);
          var seq;
          var next;
          if (type === "abab") {
            seq = [cols[0], cols[1], cols[0], cols[1]];
            next = cols[0];
          } else if (type === "aabb") {
            seq = [cols[0], cols[0], cols[1], cols[1]];
            next = cols[0];
          } else {
            seq = [cols[0], cols[1], cols[2], cols[0]];
            next = cols[1];
          }
          return qChoice({
            prompt: "Màu tiếp theo là màu nào?",
            speak: "Nhìn quy luật màu, chọn màu tiếp theo",
            scene: {
              layout: "pattern",
              pieces: seq.map(function (c) { return { shape: "circle", color: c.hex }; }).concat([{ mystery: true }])
            },
            explain: "Màu tiếp theo là màu " + next.name + ".",
            columns: 3,
            options: shuffle(cols).map(function (c) {
              return { shape: "circle", color: c.hex, size: 64, correct: c.id === next.id };
            })
          });
        }
        var shapes = shuffle(["circle", "square", "triangle", "star"]).slice(0, 3);
        var seqS;
        var nextS;
        if (type === "abab") {
          seqS = [shapes[0], shapes[1], shapes[0], shapes[1]];
          nextS = shapes[0];
        } else if (type === "aabb") {
          seqS = [shapes[0], shapes[0], shapes[1], shapes[1]];
          nextS = shapes[0];
        } else {
          seqS = [shapes[0], shapes[1], shapes[2], shapes[0]];
          nextS = shapes[1];
        }
        var ink = "#3b82f6";
        return qChoice({
          prompt: "Hình tiếp theo là hình nào?",
          speak: "Nhìn quy luật hình, chọn hình tiếp theo",
          scene: {
            layout: "pattern",
            pieces: seqS.map(function (s) { return { shape: s, color: ink }; }).concat([{ mystery: true }])
          },
          explain: "Hình tiếp theo lặp theo quy luật.",
          columns: 3,
          options: shuffle(shapes).map(function (s) {
            return { shape: s, color: ink, size: 64, correct: s === nextS };
          })
        });
      });
    },

    findShape: function (cfg) {
      return makeQuestions(cfg, function () {
        var bank = cfg.set === "wide"
          ? BASIC_SHAPES.concat([{ id: "star", name: "hình ngôi sao" }, { id: "heart", name: "hình trái tim" }])
          : BASIC_SHAPES;
        var target = pick(bank);
        var others = shuffle(bank.filter(function (s) { return s.id !== target.id; })).slice(0, 2);
        var options = shuffle([target].concat(others));
        return qChoice({
          prompt: "Chạm vào " + target.name,
          speak: "Chạm vào " + target.name,
          explain: "Đó là " + target.name + ".",
          columns: 3,
          options: options.map(function (s) {
            return {
              shape: s.id,
              color: pick(COLORS).hex,
              size: 92,
              correct: s.id === target.id
            };
          })
        });
      });
    },

    matchShape: function (cfg) {
      return makeQuestions(cfg, function () {
        var bank = BASIC_SHAPES.concat([
          { id: "star", name: "hình ngôi sao" },
          { id: "heart", name: "hình trái tim" },
          { id: "diamond", name: "hình thoi" }
        ]);
        var target = pick(bank);
        var others = shuffle(bank.filter(function (s) { return s.id !== target.id; })).slice(0, 2);
        var options = shuffle([target].concat(others));
        return qChoice({
          prompt: "Chạm vào hình giống hình này",
          speak: "Tìm hình giống hình ở trên",
          scene: { layout: "shapes", shapes: [{ shape: target.id, color: "#0ea5e9", size: 120 }] },
          explain: "Hình giống là " + target.name + ".",
          columns: 3,
          options: options.map(function (s) {
            return { shape: s.id, color: pick(COLORS).hex, size: 84, correct: s.id === target.id };
          })
        });
      });
    },

    colorMatch: function (cfg) {
      return makeQuestions(cfg, function () {
        var target = pick(COLORS);
        var opts = shuffle(COLORS).slice(0, 3);
        if (!opts.some(function (c) { return c.id === target.id; })) opts[0] = target;
        opts = shuffle(opts);
        return qChoice({
          prompt: "Chạm vào màu giống",
          speak: "Chạm vào màu giống hình này",
          scene: { layout: "shapes", shapes: [{ shape: "circle", color: target.hex, size: 130 }] },
          explain: "Đây là màu " + target.name + ".",
          columns: 3,
          options: opts.map(function (c) {
            return { color: c.hex, text: c.name, correct: c.id === target.id };
          })
        });
      });
    },

    sameColor: function (cfg) {
      return makeQuestions(cfg, function () {
        var target = pick(COLORS);
        var others = shuffle(COLORS.filter(function (c) { return c.id !== target.id; }));
        var shapes = ["circle", "square", "triangle", "star", "heart"];
        var items = [];
        var nTarget = rnd(2, 3);
        var nOther = rnd(2, 3);
        var i;
        for (i = 0; i < nTarget; i++) {
          items.push({ shape: pick(shapes), color: target.hex, target: true });
        }
        for (i = 0; i < nOther; i++) {
          items.push({ shape: pick(shapes), color: others[i % others.length].hex, target: false });
        }
        return {
          kind: "select",
          mode: "targets",
          prompt: "Chạm vào mọi hình màu " + target.name,
          speak: "Chạm vào tất cả hình màu " + target.name + ", rồi bấm Xong",
          explain: "Những hình màu " + target.name + " được chọn.",
          items: shuffle(items)
        };
      });
    }
  };

  HV.generators = generators;
})(globalThis.HV = globalThis.HV || {});
