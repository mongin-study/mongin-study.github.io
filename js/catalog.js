(function (HV) {
  "use strict";

  HV.categories = [
    {
      id: "arithmetic",
      title: "Số học",
      icon: "🔢",
      blurb: { mon: "Cộng, trừ và bài toán", gin: "Đếm và so nhiều ít" }
    },
    {
      id: "logic",
      title: "Tư duy logic",
      icon: "🧩",
      blurb: { mon: "Quy luật và số còn thiếu", gin: "Tìm giống và tìm khác" }
    },
    {
      id: "number",
      title: "Lý thuyết số",
      icon: "✨",
      blurb: { mon: "Chẵn, lẻ, so sánh", gin: "Số lớn hơn, số bé hơn" }
    },
    {
      id: "geometry",
      title: "Hình học",
      icon: "🔷",
      blurb: { mon: "Hình, cạnh và vị trí", gin: "Hình, màu và chỗ đứng" }
    }
  ];

  function ex(partial) {
    return partial;
  }

  HV.catalog = [
    ex({ id: "mon-add-20", child: "mon", category: "arithmetic", title: "Cộng trong 20", subtitle: "Cộng hai số, tổng không quá 20", icon: "➕", generator: "addition", config: { count: 5, sumMax: 20, input: "keypad" } }),
    ex({ id: "mon-sub-20", child: "mon", category: "arithmetic", title: "Trừ trong 20", subtitle: "Trừ không bị âm", icon: "➖", generator: "subtraction", config: { count: 5, within: 20, input: "keypad" } }),
    ex({ id: "mon-add-100", child: "mon", category: "arithmetic", title: "Cộng trong 100", subtitle: "Có lúc nhớ, có lúc không", icon: "❄️", generator: "addition", config: { count: 5, sumMax: 100, input: "keypad" } }),
    ex({ id: "mon-sub-100", child: "mon", category: "arithmetic", title: "Trừ trong 100", subtitle: "Trừ số có hai chữ số", icon: "🧊", generator: "subtraction", config: { count: 5, within: 100, input: "keypad" } }),
    ex({ id: "mon-next-prev", child: "mon", category: "arithmetic", title: "Số liền trước, liền sau", subtitle: "Tìm số đứng cạnh", icon: "🔁", generator: "nextPrev", config: { count: 5, min: 0, max: 50, choiceCount: 4 } }),
    ex({ id: "mon-word", child: "mon", category: "arithmetic", title: "Bài toán có lời", subtitle: "Đọc câu chuyện rồi tính", icon: "📖", generator: "wordProblem", config: { count: 5 } }),

    ex({ id: "mon-bond-10", child: "mon", category: "logic", title: "Số liên kết đến 10", subtitle: "Hai số cộng lại thành 10", icon: "🔗", generator: "numberBond", config: { count: 5, total: 10 } }),
    ex({ id: "mon-bond-20", child: "mon", category: "logic", title: "Số liên kết đến 20", subtitle: "Hai số cộng lại thành 20", icon: "🌟", generator: "numberBond", config: { count: 5, total: 20 } }),
    ex({ id: "mon-missing", child: "mon", category: "logic", title: "Điền số còn thiếu", subtitle: "Tìm số trong phép cộng", icon: "⬜", generator: "missingPart", config: { count: 5, max: 20 } }),
    ex({ id: "mon-sequence", child: "mon", category: "logic", title: "Dãy số", subtitle: "Một chữ số: 1, 3, 5, 7", icon: "➡️", generator: "sequence", config: { count: 5, steps: [1, 2], length: 4, digits: 1, max: 9, input: "choice" } }),
    ex({ id: "mon-odd-one", child: "mon", category: "logic", title: "Tìm số khác nhóm", subtitle: "Số nào không cùng quy luật", icon: "🔎", generator: "oddOneOut", config: { count: 5, mode: "number" } }),
    ex({ id: "mon-compare-expr", child: "mon", category: "logic", title: "Phép nào lớn hơn", subtitle: "So sánh hai phép tính", icon: "⚖️", generator: "compareExpr", config: { count: 5 } }),

    ex({ id: "mon-odd-even", child: "mon", category: "number", title: "Chẵn hay lẻ", subtitle: "Nhìn cặp chấm rồi chọn", icon: "🔵", generator: "oddEven", config: { count: 5, min: 1, max: 30 } }),
    ex({ id: "mon-compare", child: "mon", category: "number", title: "So sánh hai số", subtitle: "Số lớn hơn", icon: "🔼", generator: "compareNumbers", config: { count: 5, min: 0, max: 100, mode: "larger" } }),
    ex({ id: "mon-skip", child: "mon", category: "number", title: "Đếm cách 2, 5, 10", subtitle: "Đếm nhảy cóc", icon: "🦘", generator: "skipCount", config: { count: 5, steps: [2, 5, 10] } }),
    ex({ id: "mon-place", child: "mon", category: "number", title: "Hàng chục, hàng đơn vị", subtitle: "Tách số thành chục và đơn vị", icon: "🧱", generator: "placeValue", config: { count: 5 } }),
    ex({ id: "mon-pattern-num", child: "mon", category: "number", title: "Dãy hai chữ số", subtitle: "Khó hơn · thêm 2, 5 hoặc 10", icon: "📈", generator: "sequence", config: { count: 5, steps: [2, 5, 10], length: 4, digits: 2, min: 10, max: 99, align: true, input: "choice" } }),

    ex({ id: "mon-shape-name", child: "mon", category: "geometry", title: "Đây là hình gì", subtitle: "Gọi tên hình", icon: "🔷", generator: "shapeName", config: { count: 5, set: "all" } }),
    ex({ id: "mon-sides", child: "mon", category: "geometry", title: "Đếm cạnh", subtitle: "Cạnh là nét thẳng quanh hình", icon: "📏", generator: "countSides", config: { count: 5, set: "all" } }),
    ex({ id: "mon-vertices", child: "mon", category: "geometry", title: "Đếm đỉnh", subtitle: "Đỉnh là mũi nhọn", icon: "📍", generator: "countVertices", config: { count: 5 } }),
    ex({ id: "mon-symmetry", child: "mon", category: "geometry", title: "Đối xứng", subtitle: "Hai bên có giống nhau không", icon: "🪞", generator: "symmetry", config: { count: 5 } }),
    ex({ id: "mon-position", child: "mon", category: "geometry", title: "Vị trí", subtitle: "Trên, dưới, trái, phải", icon: "🧭", generator: "position", config: { count: 5, axis: "both" } }),
    ex({ id: "mon-more-sides", child: "mon", category: "geometry", title: "Hình nhiều cạnh hơn", subtitle: "So sánh hai hình", icon: "🔺", generator: "moreSides", config: { count: 5 } }),

    ex({ id: "gin-count-5", child: "gin", category: "arithmetic", title: "Đếm đến 5", subtitle: "Đếm đồ vật", icon: "🍎", generator: "countObjects", config: { count: 4, min: 1, max: 5, choiceCount: 3 } }),
    ex({ id: "gin-count-10", child: "gin", category: "arithmetic", title: "Đếm đến 10", subtitle: "Đếm nhiều hơn một chút", icon: "🚗", generator: "countObjects", config: { count: 4, min: 5, max: 10, choiceCount: 3 } }),
    ex({ id: "gin-match-number", child: "gin", category: "arithmetic", title: "Nhìn số, chọn nhóm", subtitle: "Tìm nhóm đúng số lượng", icon: "🔟", generator: "matchNumberGroup", config: { count: 4, min: 1, max: 5 } }),
    ex({ id: "gin-maker", child: "gin", category: "arithmetic", title: "Làm đủ số", subtitle: "Chạm thêm cho đủ", icon: "⭐", generator: "maker", config: { count: 4, min: 1, max: 5 } }),
    ex({ id: "gin-more", child: "gin", category: "arithmetic", title: "Bên nào nhiều hơn", subtitle: "Nhìn hai nhóm", icon: "➕", generator: "moreLess", config: { count: 4, mode: "more" } }),
    ex({ id: "gin-less", child: "gin", category: "arithmetic", title: "Bên nào ít hơn", subtitle: "Nhóm nào ít đồ hơn", icon: "➖", generator: "moreLess", config: { count: 4, mode: "less" } }),

    ex({ id: "gin-match-shape", child: "gin", category: "logic", title: "Hình giống nhau", subtitle: "Tìm hình giống hình mẫu", icon: "🟢", generator: "matchShape", config: { count: 4 } }),
    ex({ id: "gin-pattern-color", child: "gin", category: "logic", title: "Quy luật màu", subtitle: "Màu nào đứng tiếp", icon: "🎨", generator: "patternNext", config: { count: 4, kind: "color" } }),
    ex({ id: "gin-pattern-shape", child: "gin", category: "logic", title: "Quy luật hình", subtitle: "Hình nào đứng tiếp", icon: "🔷", generator: "patternNext", config: { count: 4, kind: "shape" } }),
    ex({ id: "gin-odd-one", child: "gin", category: "logic", title: "Cái khác", subtitle: "Chạm vào cái không giống", icon: "👀", generator: "oddOneOut", config: { count: 4, mode: "visual" } }),
    ex({ id: "gin-same-color", child: "gin", category: "logic", title: "Cùng một màu", subtitle: "Chọn hết hình cùng màu", icon: "🎯", generator: "sameColor", config: { count: 4 } }),

    ex({ id: "gin-bigger", child: "gin", category: "number", title: "Số nào lớn hơn", subtitle: "Hai số, chọn số lớn", icon: "🔼", generator: "compareNumbers", config: { count: 4, min: 1, max: 10, mode: "larger" } }),
    ex({ id: "gin-smaller", child: "gin", category: "number", title: "Số nào nhỏ hơn", subtitle: "Hai số, chọn số bé", icon: "🔽", generator: "compareNumbers", config: { count: 4, min: 1, max: 10, mode: "smaller" } }),
    ex({ id: "gin-order", child: "gin", category: "number", title: "Xếp từ bé đến lớn", subtitle: "Chạm đúng thứ tự", icon: "1️⃣", generator: "orderNumbers", config: { count: 4, n: 3, min: 1, max: 5 } }),
    ex({ id: "gin-next", child: "gin", category: "number", title: "Số tiếp theo", subtitle: "Đếm thêm một", icon: "➡️", generator: "sequence", config: { count: 4, steps: [1], length: 3, digits: 1, min: 1, max: 9, input: "choice", choiceCount: 3 } }),

    ex({ id: "gin-find-shape", child: "gin", category: "geometry", title: "Tìm hình", subtitle: "Tròn, vuông, tam giác", icon: "⭕", generator: "findShape", config: { count: 4, set: "basic" } }),
    ex({ id: "gin-color", child: "gin", category: "geometry", title: "Màu giống", subtitle: "Chạm đúng màu", icon: "🎨", generator: "colorMatch", config: { count: 4 } }),
    ex({ id: "gin-size", child: "gin", category: "geometry", title: "To hơn, nhỏ hơn", subtitle: "So kích thước", icon: "🔵", generator: "sizeCompare", config: { count: 4, mode: "both" } }),
    ex({ id: "gin-position", child: "gin", category: "geometry", title: "Ở trên hay ở dưới", subtitle: "Nhìn chỗ đứng", icon: "⬆️", generator: "position", config: { count: 4, axis: "vertical" } }),
    ex({ id: "gin-sides", child: "gin", category: "geometry", title: "Đếm cạnh", subtitle: "Tam giác và hình vuông", icon: "🔺", generator: "countSides", config: { count: 4, set: "basic" } })
  ];

  HV.rewards = {
    mon: [
      { icon: "❄️", name: "Bông tuyết bạc" },
      { icon: "🏮", name: "Đèn lồng vàng" },
      { icon: "👑", name: "Vương miện tòa tháp" }
    ],
    gin: [
      { icon: "🚗", name: "Xe đồ chơi" },
      { icon: "🐯", name: "Huy hiệu hổ con" },
      { icon: "🏆", name: "Cúp đường đua" }
    ]
  };

  HV.kids = {
    mon: { name: "Mon", age: "6 tuổi", tagline: "Băng tuyết và Pom" },
    gin: { name: "Gin", age: "3 tuổi", tagline: "Xe hơi và thú" }
  };

  HV.catalog.forEach(function (ex) {
    if (!ex.subject) ex.subject = "math";
  });

  HV.subjects = [
    {
      id: "math",
      title: "Toán",
      short: "Toán",
      icon: "🔢",
      blurb: { mon: "Số, phép tính và hình", gin: "Đếm, so và hình" }
    },
    {
      id: "english",
      title: "Tiếng Anh",
      short: "Anh",
      icon: "🔤",
      blurb: { mon: "Đọc CVC, câu và 300 từ", gin: "Màu, con vật và nghe" }
    },
    {
      id: "vietnamese",
      title: "Tiếng Việt",
      short: "Việt",
      icon: "📖",
      blurb: { mon: "Chữ, vần và đánh vần", gin: "Nhận mặt chữ cái" }
    }
  ];

  HV.subjectCategories = { math: HV.categories };
})(globalThis.HV = globalThis.HV || {});
