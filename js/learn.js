(function (HV) {
  "use strict";

  var rnd = HV.util.rnd;
  var shuffle = HV.util.shuffle;

  var LETTERS = [
    { ch: "a", name: "a", sound: "a" },
    { ch: "ă", name: "ă", sound: "á" },
    { ch: "â", name: "â", sound: "ớ" },
    { ch: "b", name: "bờ", sound: "bờ" },
    { ch: "c", name: "cờ", sound: "cờ" },
    { ch: "d", name: "dờ", sound: "dờ" },
    { ch: "đ", name: "đờ", sound: "đờ" },
    { ch: "e", name: "e", sound: "e" },
    { ch: "ê", name: "ê", sound: "ê" },
    { ch: "g", name: "gờ", sound: "gờ" },
    { ch: "h", name: "hắt", sound: "hắt" },
    { ch: "i", name: "i", sound: "i" },
    { ch: "k", name: "ca", sound: "ca" },
    { ch: "l", name: "lờ", sound: "lờ" },
    { ch: "m", name: "mờ", sound: "mờ" },
    { ch: "n", name: "nờ", sound: "nờ" },
    { ch: "o", name: "o", sound: "o" },
    { ch: "ô", name: "ô", sound: "ô" },
    { ch: "ơ", name: "ơ", sound: "ơ" },
    { ch: "p", name: "pờ", sound: "pờ" },
    { ch: "q", name: "quờ", sound: "quờ" },
    { ch: "r", name: "rờ", sound: "rờ" },
    { ch: "s", name: "sờ", sound: "sờ" },
    { ch: "t", name: "tờ", sound: "tờ" },
    { ch: "u", name: "u", sound: "u" },
    { ch: "ư", name: "ư", sound: "ư" },
    { ch: "v", name: "vờ", sound: "vờ" },
    { ch: "x", name: "xờ", sound: "xờ" },
    { ch: "y", name: "i dài", sound: "i dài" }
  ];

  var GIN_LETTERS = ["a", "o", "e", "i", "u", "b", "m", "c"];

  var TONES = [
    { mark: "ngang", sample: "ba", say: "ba. Dấu ngang." },
    { mark: "huyền", sample: "bà", say: "bà. Dấu huyền." },
    { mark: "sắc", sample: "bá", say: "bá. Dấu sắc." },
    { mark: "hỏi", sample: "bả", say: "bả. Dấu hỏi." },
    { mark: "ngã", sample: "bã", say: "bã. Dấu ngã." },
    { mark: "nặng", sample: "bạ", say: "bạ. Dấu nặng." }
  ];

  var RHYMES = ["an", "am", "at", "ao", "au", "ăn", "ăng", "ong", "ông", "iêng", "ươn", "oang"];

  var SPELLS = [
    { say: "bờ a ba", word: "ba", other: ["bà", "bá", "be"], scene: "b + a" },
    { say: "bờ a ba huyền bà", word: "bà", other: ["ba", "bá", "bả"], scene: "b + a + huyền" },
    { say: "mờ a ma sắc má", word: "má", other: ["ma", "mà", "mẹ"], scene: "m + a + sắc" },
    { say: "mờ e me huyền mẹ", word: "mẹ", other: ["me", "bé", "má"], scene: "m + e + huyền" },
    { say: "bờ e be sắc bé", word: "bé", other: ["be", "bè", "mẹ"], scene: "b + e + sắc" },
    { say: "bờ o bo huyền bò", word: "bò", other: ["bo", "bó", "cá"], scene: "b + o + huyền" },
    { say: "cờ a ca sắc cá", word: "cá", other: ["ca", "cà", "bò"], scene: "c + a + sắc" },
    { say: "bờ i bi", word: "bi", other: ["ba", "be", "bo"], scene: "b + i" },
    { say: "bờ ô bô", word: "bô", other: ["bo", "ba", "bê"], scene: "b + ô" },
    { say: "mờ ơ mơ", word: "mơ", other: ["mo", "me", "ma"], scene: "m + ơ" },
    { say: "lờ a la", word: "la", other: ["le", "lo", "ba"], scene: "l + a" },
    { say: "vờ o vo", word: "vo", other: ["ve", "va", "bo"], scene: "v + o" }
  ];

  var VI_WORDS = [
    { emoji: "👩", word: "mẹ", say: "Đây là mẹ. Chữ nào đúng?" },
    { emoji: "👶", word: "bé", say: "Đây là bé. Chữ nào đúng?" },
    { emoji: "🐄", word: "bò", say: "Đây là con bò. Chữ nào đúng?" },
    { emoji: "🐟", word: "cá", say: "Đây là con cá. Chữ nào đúng?" },
    { emoji: "🐱", word: "mèo", say: "Đây là con mèo. Chữ nào đúng?" },
    { emoji: "🌸", word: "hoa", say: "Đây là hoa. Chữ nào đúng?" },
    { emoji: "🏠", word: "nhà", say: "Đây là nhà. Chữ nào đúng?" },
    { emoji: "🐔", word: "gà", say: "Đây là con gà. Chữ nào đúng?" }
  ];

  var VI_SENTENCES = [
    { emojis: ["👶", "🐱"], text: "Bé có mèo.", wrong: ["Mẹ có bò.", "Bé có cá."] },
    { emojis: ["👩", "🌸"], text: "Mẹ có hoa.", wrong: ["Bé có mèo.", "Mẹ có cá."] },
    { emojis: ["👶", "🐟"], text: "Bé thấy cá.", wrong: ["Bé thấy bò.", "Mẹ có hoa."] },
    { emojis: ["👩", "👶"], text: "Mẹ và bé.", wrong: ["Bò và cá.", "Bé có gà."] }
  ];

  var EN_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  var EN_PHONICS = [
    { letter: "A", say: "Which letter says a?" },
    { letter: "B", say: "Which letter says b?" },
    { letter: "C", say: "Which letter says k?" },
    { letter: "M", say: "Which letter says mmm?" },
    { letter: "S", say: "Which letter says sss?" },
    { letter: "T", say: "Which letter says t?" }
  ];
  var COLORS = [
    { name: "red", emoji: "🔴", vi: "đỏ" },
    { name: "blue", emoji: "🔵", vi: "xanh dương" },
    { name: "yellow", emoji: "🟡", vi: "vàng" },
    { name: "green", emoji: "🟢", vi: "xanh lá" },
    { name: "orange", emoji: "🟠", vi: "cam" },
    { name: "purple", emoji: "🟣", vi: "tím" },
    { name: "pink", emoji: "🩷", vi: "hồng" },
    { name: "black", emoji: "⚫", vi: "đen" }
  ];
  var EN_NUMBERS = [
    { n: "one", emoji: "⭐" },
    { n: "two", emoji: "⭐" },
    { n: "three", emoji: "⭐" },
    { n: "four", emoji: "⭐" },
    { n: "five", emoji: "⭐" }
  ];
  var ANIMALS = [
    { name: "cat", emoji: "🐱" },
    { name: "dog", emoji: "🐶" },
    { name: "bird", emoji: "🐦" },
    { name: "fish", emoji: "🐟" },
    { name: "cow", emoji: "🐄" },
    { name: "duck", emoji: "🦆" },
    { name: "pig", emoji: "🐷" },
    { name: "rabbit", emoji: "🐰" }
  ];
  var FAMILY = [
    { name: "mom", emoji: "👩" },
    { name: "dad", emoji: "👨" },
    { name: "baby", emoji: "👶" },
    { name: "sister", emoji: "👧" },
    { name: "brother", emoji: "👦" },
    { name: "grandma", emoji: "👵" }
  ];
  var FRUITS = [
    { name: "apple", emoji: "🍎" },
    { name: "banana", emoji: "🍌" },
    { name: "orange", emoji: "🍊" },
    { name: "grape", emoji: "🍇" },
    { name: "mango", emoji: "🥭" },
    { name: "watermelon", emoji: "🍉" }
  ];
  var BODY = [
    { name: "eye", emoji: "👁️" },
    { name: "ear", emoji: "👂" },
    { name: "nose", emoji: "👃" },
    { name: "mouth", emoji: "👄" },
    { name: "hand", emoji: "✋" },
    { name: "foot", emoji: "🦶" }
  ];

  function choiceQ(spec) {
    var n = spec.options.length;
    return {
      kind: "choice",
      lang: spec.lang || "vi",
      prompt: spec.prompt,
      speak: spec.speak || spec.prompt,
      explain: spec.explain || "",
      scene: spec.scene || null,
      columns: spec.columns || (n === 3 ? 3 : 2),
      choices: spec.options
    };
  }

  function textOpts(correct, pool, howMany) {
    var others = shuffle(pool.filter(function (x) { return x !== correct; })).slice(0, howMany - 1);
    return shuffle([{ text: correct, correct: true }].concat(others.map(function (x) {
      return { text: x, correct: false };
    })));
  }

  function take(bank, n) {
    return shuffle(bank).slice(0, Math.min(n, bank.length));
  }

  HV.subjectCategories.vietnamese = [
    { id: "letters", title: "Chữ cái", icon: "🅰️", kids: ["mon", "gin"], blurb: { mon: "29 chữ và âm", gin: "Nhìn chữ, nghe âm" } },
    { id: "tones", title: "Dấu thanh", icon: "🎵", kids: ["mon"], blurb: { mon: "Sắc huyền hỏi ngã nặng", gin: "" } },
    { id: "rhymes", title: "Vần", icon: "🔤", kids: ["mon"], blurb: { mon: "an, ông, iêng...", gin: "" } },
    { id: "spell", title: "Đánh vần", icon: "✨", kids: ["mon"], blurb: { mon: "Âm, vần, rồi tiếng", gin: "" } },
    { id: "words", title: "Từ và câu", icon: "🖼️", kids: ["mon"], blurb: { mon: "Nhìn tranh, đọc chữ", gin: "" } }
  ];

  HV.subjectCategories.english = [
    { id: "letters", title: "Alphabet", icon: "🅰️", kids: ["mon", "gin"], blurb: { mon: "Letters and sounds", gin: "A, B, and C" } },
    { id: "phonics", title: "Phonics", icon: "👂", kids: ["mon"], blurb: { mon: "Hear the sound", gin: "" } },
    { id: "colors", title: "Colors", icon: "🎨", kids: ["mon", "gin"], blurb: { mon: "Tên màu bằng tiếng Anh", gin: "Đỏ, vàng, xanh" } },
    { id: "numbers", title: "Numbers", icon: "🔟", kids: ["mon"], blurb: { mon: "One to five", gin: "" } },
    { id: "animals", title: "Animals", icon: "🐶", kids: ["mon", "gin"], blurb: { mon: "Con vật quen", gin: "Mèo, chó, chim, cá" } },
    { id: "family", title: "Family", icon: "👨‍👩‍👧", kids: ["mon"], blurb: { mon: "Mom, dad, baby", gin: "" } },
    { id: "fruits", title: "Fruits", icon: "🍎", kids: ["mon"], blurb: { mon: "Tên trái cây", gin: "" } },
    { id: "body", title: "Body", icon: "✋", kids: ["mon"], blurb: { mon: "Eye, ear, hand", gin: "" } },
    { id: "listen", title: "Listen", icon: "🎧", kids: ["mon", "gin"], blurb: { mon: "Chạm tranh vừa nghe", gin: "Nghe rồi chạm" } }
  ];

  function letterQuestions(pool, count, howMany, mode) {
    return take(pool, count).map(function (letter) {
      var names = pool.map(function (x) { return x.ch; });
      if (mode === "hear") {
        return choiceQ({
          prompt: "Nghe và chạm đúng chữ",
          speak: letter.sound,
          explain: "Đó là chữ " + letter.ch + ", âm " + letter.sound + ".",
          columns: howMany === 3 ? 3 : 2,
          options: textOpts(letter.ch, names, howMany)
        });
      }
      return choiceQ({
        prompt: "Đây là chữ gì?",
        speak: "Đây là chữ gì?",
        explain: "Chữ " + letter.ch + ". Âm " + letter.name + ".",
        scene: { layout: "digit", text: letter.ch },
        columns: howMany === 3 ? 3 : 2,
        options: textOpts(letter.ch, names, howMany)
      });
    });
  }

  HV.generators.viLetters = function (cfg) {
    var pool = LETTERS.filter(function (L) {
      if (cfg.set === "gin") return GIN_LETTERS.indexOf(L.ch) >= 0;
      if (cfg.set === "vowel") return "aăâeêioôơuưy".indexOf(L.ch) >= 0;
      return true;
    });
    return letterQuestions(pool, cfg.count || 4, cfg.choices || 4, cfg.mode || "see");
  };

  HV.generators.viTones = function (cfg) {
    var marks = TONES.map(function (t) { return t.mark; });
    return take(TONES, cfg.count || 4).map(function (tone) {
      return choiceQ({
        prompt: "Dấu gì?",
        speak: tone.say,
        explain: tone.sample + " mang dấu " + tone.mark + ".",
        scene: { layout: "digit", text: tone.sample },
        options: textOpts(tone.mark, marks, 4)
      });
    });
  };

  HV.generators.viRhymes = function (cfg) {
    return take(RHYMES, cfg.count || 4).map(function (rhyme) {
      return choiceQ({
        prompt: "Đây là vần gì?",
        speak: "Đọc vần. Đây là vần gì?",
        explain: "Vần " + rhyme + ".",
        scene: { layout: "digit", text: rhyme },
        options: textOpts(rhyme, RHYMES, 4)
      });
    });
  };

  HV.generators.viSpell = function (cfg) {
    return take(SPELLS, cfg.count || 4).map(function (item) {
      return choiceQ({
        prompt: "Đánh vần rồi chọn tiếng đúng",
        speak: item.say,
        explain: item.say + ".",
        scene: { layout: "equation", text: item.scene },
        options: textOpts(item.word, [item.word].concat(item.other), 4)
      });
    });
  };

  HV.generators.viWords = function (cfg) {
    var words = VI_WORDS.map(function (w) { return w.word; });
    return take(VI_WORDS, cfg.count || 4).map(function (item) {
      return choiceQ({
        prompt: "Chữ nào đúng?",
        speak: item.say,
        explain: "Đó là " + item.word + ".",
        scene: { layout: "emojis", items: [item.emoji] },
        options: textOpts(item.word, words, 3),
        columns: 3
      });
    });
  };

  HV.generators.viSentences = function (cfg) {
    return take(VI_SENTENCES, cfg.count || 3).map(function (item) {
      var texts = [item.text].concat(item.wrong);
      return choiceQ({
        prompt: "Câu nào đúng với tranh?",
        speak: "Nhìn tranh. Câu nào đúng?",
        explain: item.text,
        scene: { layout: "emojis", items: item.emojis },
        options: textOpts(item.text, texts, 3),
        columns: 1
      });
    });
  };

  function enWord(bank, count, howMany, prompt, speakOf) {
    var names = bank.map(function (x) { return x.name; });
    return take(bank, count).map(function (item) {
      return choiceQ({
        lang: "en",
        prompt: prompt,
        speak: speakOf(item),
        explain: "It is " + item.name + ".",
        scene: { layout: "emojis", items: [item.emoji] },
        columns: howMany === 3 ? 3 : 2,
        options: textOpts(item.name, names, howMany)
      });
    });
  }

  function enListen(bank, count, howMany) {
    return take(bank, count).map(function (item) {
      var others = shuffle(bank.filter(function (x) { return x.name !== item.name; })).slice(0, howMany - 1);
      var options = shuffle([{ emoji: item.emoji, correct: true }].concat(others.map(function (x) {
        return { emoji: x.emoji, correct: false };
      })));
      return choiceQ({
        lang: "en",
        prompt: "Tap what you hear",
        speak: "Tap the " + item.name + ".",
        explain: "It is the " + item.name + ".",
        columns: howMany === 3 ? 3 : 2,
        options: options
      });
    });
  }

  HV.generators.enLetters = function (cfg) {
    var pool = cfg.set === "abc" ? ["A", "B", "C"] : EN_LETTERS;
    var howMany = cfg.choices || 4;
    return take(pool, cfg.count || 4).map(function (letter) {
      return choiceQ({
        lang: "en",
        prompt: "What letter is this?",
        speak: "What letter is this?",
        explain: "It is the letter " + letter + ".",
        scene: { layout: "digit", text: letter },
        columns: howMany === 3 ? 3 : 2,
        options: textOpts(letter, pool, howMany)
      });
    });
  };

  HV.generators.enPhonics = function (cfg) {
    var letters = EN_PHONICS.map(function (x) { return x.letter; });
    return take(EN_PHONICS, cfg.count || 4).map(function (item) {
      return choiceQ({
        lang: "en",
        prompt: "Which letter?",
        speak: item.say,
        explain: "The letter " + item.letter + ".",
        columns: 3,
        options: textOpts(item.letter, letters, 3)
      });
    });
  };

  HV.generators.enColors = function (cfg) {
    var pool = cfg.set === "easy" ? COLORS.slice(0, 4) : COLORS;
    return enWord(pool, cfg.count || 4, cfg.choices || 4, "What color is this?", function (item) {
      return "What color is this?";
    });
  };

  HV.generators.enNumbers = function (cfg) {
    return take(EN_NUMBERS, cfg.count || 4).map(function (item) {
      var count = { one: 1, two: 2, three: 3, four: 4, five: 5 }[item.n];
      var names = EN_NUMBERS.map(function (x) { return x.n; });
      var stars = [];
      for (var i = 0; i < count; i++) stars.push("⭐");
      return choiceQ({
        lang: "en",
        prompt: "How many stars?",
        speak: "How many stars?",
        explain: "There are " + item.n + ".",
        scene: { layout: "emojis", items: stars },
        columns: 3,
        options: textOpts(item.n, names, 3)
      });
    });
  };

  HV.generators.enAnimals = function (cfg) {
    var pool = cfg.set === "easy" ? ANIMALS.slice(0, 4) : ANIMALS;
    return enWord(pool, cfg.count || 4, cfg.choices || (cfg.set === "easy" ? 3 : 4), "What animal is this?", function () {
      return "What animal is this?";
    });
  };

  HV.generators.enFamily = function (cfg) {
    return enWord(FAMILY, cfg.count || 4, 3, "Who is this?", function () { return "Who is this?"; });
  };

  HV.generators.enFruits = function (cfg) {
    return enWord(FRUITS, cfg.count || 4, 3, "What fruit is this?", function () { return "What fruit is this?"; });
  };

  HV.generators.enBody = function (cfg) {
    return enWord(BODY, cfg.count || 4, 3, "What is this?", function () { return "What is this?"; });
  };

  HV.generators.enListen = function (cfg) {
    var pool = cfg.set === "easy" ? ANIMALS.slice(0, 4).concat(COLORS.slice(0, 4)) : ANIMALS.concat(COLORS.slice(0, 4));
    return enListen(pool, cfg.count || 4, cfg.choices || 3);
  };

  function ex(partial) {
    partial.subject = partial.subject || "vietnamese";
    HV.catalog.push(partial);
  }

  ex({ id: "mon-vi-letters", child: "mon", subject: "vietnamese", category: "letters", title: "Nhận mặt chữ", subtitle: "29 chữ cái", icon: "🅰️", generator: "viLetters", config: { count: 5, choices: 4, mode: "see" } });
  ex({ id: "mon-vi-sounds", child: "mon", subject: "vietnamese", category: "letters", title: "Nghe âm chữ", subtitle: "Chạm đúng chữ", icon: "👂", generator: "viLetters", config: { count: 4, choices: 4, mode: "hear" } });
  ex({ id: "mon-vi-tones", child: "mon", subject: "vietnamese", category: "tones", title: "Dấu thanh", subtitle: "Sắc, huyền, hỏi, ngã, nặng", icon: "🎵", generator: "viTones", config: { count: 4 } });
  ex({ id: "mon-vi-rhymes", child: "mon", subject: "vietnamese", category: "rhymes", title: "Đọc vần", subtitle: "an, ông, iêng", icon: "🔤", generator: "viRhymes", config: { count: 4 } });
  ex({ id: "mon-vi-spell", child: "mon", subject: "vietnamese", category: "spell", title: "Đánh vần", subtitle: "Âm rồi vần rồi tiếng", icon: "✨", generator: "viSpell", config: { count: 4 } });
  ex({ id: "mon-vi-words", child: "mon", subject: "vietnamese", category: "words", title: "Chữ và tranh", subtitle: "Chọn chữ đúng", icon: "🖼️", generator: "viWords", config: { count: 4 } });
  ex({ id: "mon-vi-sentences", child: "mon", subject: "vietnamese", category: "words", title: "Đọc câu ngắn", subtitle: "Nhìn tranh, chọn câu", icon: "📘", generator: "viSentences", config: { count: 3 } });

  ex({ id: "gin-vi-letters", child: "gin", subject: "vietnamese", category: "letters", title: "Chữ to", subtitle: "a, o, e và vài chữ", icon: "🅰️", generator: "viLetters", config: { count: 4, choices: 3, set: "gin", mode: "see" } });
  ex({ id: "gin-vi-sounds", child: "gin", subject: "vietnamese", category: "letters", title: "Nghe chữ", subtitle: "Chạm chữ vừa nghe", icon: "👂", generator: "viLetters", config: { count: 3, choices: 3, set: "gin", mode: "hear" } });

  function enEx(partial) {
    partial.subject = "english";
    HV.catalog.push(partial);
  }
  enEx({ id: "mon-en-letters", child: "mon", category: "letters", title: "Alphabet", subtitle: "What letter is this?", icon: "🅰️", generator: "enLetters", config: { count: 5, choices: 4 } });
  enEx({ id: "mon-en-phonics", child: "mon", category: "phonics", title: "Letter sounds", subtitle: "Hear the sound", icon: "👂", generator: "enPhonics", config: { count: 4 } });
  enEx({ id: "mon-en-colors", child: "mon", category: "colors", title: "Colors", subtitle: "Name the color", icon: "🎨", generator: "enColors", config: { count: 4, choices: 4 } });
  enEx({ id: "mon-en-numbers", child: "mon", category: "numbers", title: "Numbers", subtitle: "How many stars?", icon: "⭐", generator: "enNumbers", config: { count: 4 } });
  enEx({ id: "mon-en-animals", child: "mon", category: "animals", title: "Animals", subtitle: "Cat, dog, bird", icon: "🐶", generator: "enAnimals", config: { count: 4, choices: 4 } });
  enEx({ id: "mon-en-family", child: "mon", category: "family", title: "Family", subtitle: "Mom and dad", icon: "👩", generator: "enFamily", config: { count: 4 } });
  enEx({ id: "mon-en-fruits", child: "mon", category: "fruits", title: "Fruits", subtitle: "Apple and banana", icon: "🍎", generator: "enFruits", config: { count: 4 } });
  enEx({ id: "mon-en-body", child: "mon", category: "body", title: "My body", subtitle: "Eye, ear, hand", icon: "✋", generator: "enBody", config: { count: 4 } });
  enEx({ id: "mon-en-listen", child: "mon", category: "listen", title: "Tap what you hear", subtitle: "Listening", icon: "🎧", generator: "enListen", config: { count: 4, choices: 3 } });

  enEx({ id: "gin-en-letters", child: "gin", category: "letters", title: "A B C", subtitle: "Ba chữ đầu", icon: "🅰️", generator: "enLetters", config: { count: 3, choices: 3, set: "abc" } });
  enEx({ id: "gin-en-colors", child: "gin", category: "colors", title: "Colors", subtitle: "Red, yellow, blue", icon: "🎨", generator: "enColors", config: { count: 4, choices: 3, set: "easy" } });
  enEx({ id: "gin-en-animals", child: "gin", category: "animals", title: "Animals", subtitle: "Cat and dog", icon: "🐶", generator: "enAnimals", config: { count: 4, choices: 3, set: "easy" } });
  enEx({ id: "gin-en-listen", child: "gin", category: "listen", title: "Listen and tap", subtitle: "Nghe rồi chạm", icon: "🎧", generator: "enListen", config: { count: 3, choices: 3, set: "easy" } });

  function pushSpeak(list, lang, text) {
    if (text) list.push({ lang: lang, text: String(text) });
  }

  HV.learnSpeaks = function () {
    var lines = [];
    ["Yes!", "Great!", "Yay!", "Correct!", "Wonderful!", "Not quite", "Try again.", "See stars", "Next"].forEach(function (s) {
      pushSpeak(lines, "en", s);
    });
    LETTERS.forEach(function (L) {
      pushSpeak(lines, "vi", "Đây là chữ gì?");
      pushSpeak(lines, "vi", "Nghe và chạm đúng chữ");
      pushSpeak(lines, "vi", L.sound);
      pushSpeak(lines, "vi", "Chữ " + L.ch + ". Âm " + L.name + ".");
      pushSpeak(lines, "vi", "Đó là chữ " + L.ch + ", âm " + L.sound + ".");
    });
    TONES.forEach(function (t) {
      pushSpeak(lines, "vi", "Dấu gì?");
      pushSpeak(lines, "vi", t.say);
      pushSpeak(lines, "vi", t.sample + " mang dấu " + t.mark + ".");
    });
    RHYMES.forEach(function (r) {
      pushSpeak(lines, "vi", "Đọc vần. Đây là vần gì?");
      pushSpeak(lines, "vi", "Đây là vần gì?");
      pushSpeak(lines, "vi", "Vần " + r + ".");
    });
    SPELLS.forEach(function (s) {
      pushSpeak(lines, "vi", "Đánh vần rồi chọn tiếng đúng");
      pushSpeak(lines, "vi", s.say);
      pushSpeak(lines, "vi", s.say + ".");
    });
    VI_WORDS.forEach(function (w) {
      pushSpeak(lines, "vi", w.say);
      pushSpeak(lines, "vi", "Chữ nào đúng?");
      pushSpeak(lines, "vi", "Đó là " + w.word + ".");
    });
    VI_SENTENCES.forEach(function (s) {
      pushSpeak(lines, "vi", "Nhìn tranh. Câu nào đúng?");
      pushSpeak(lines, "vi", "Câu nào đúng với tranh?");
      pushSpeak(lines, "vi", s.text);
    });
    EN_LETTERS.forEach(function (L) {
      pushSpeak(lines, "en", "What letter is this?");
      pushSpeak(lines, "en", "It is the letter " + L + ".");
    });
    EN_PHONICS.forEach(function (p) {
      pushSpeak(lines, "en", p.say);
      pushSpeak(lines, "en", "The letter " + p.letter + ".");
      pushSpeak(lines, "en", "Which letter?");
    });
    COLORS.forEach(function (c) {
      pushSpeak(lines, "en", "What color is this?");
      pushSpeak(lines, "en", "It is " + c.name + ".");
      pushSpeak(lines, "en", "Tap the " + c.name + ".");
      pushSpeak(lines, "en", "It is the " + c.name + ".");
    });
    EN_NUMBERS.forEach(function (n) {
      pushSpeak(lines, "en", "How many stars?");
      pushSpeak(lines, "en", "There are " + n.n + ".");
    });
    ANIMALS.concat(FAMILY).concat(FRUITS).concat(BODY).forEach(function (item) {
      pushSpeak(lines, "en", "What animal is this?");
      pushSpeak(lines, "en", "Who is this?");
      pushSpeak(lines, "en", "What fruit is this?");
      pushSpeak(lines, "en", "What is this?");
      pushSpeak(lines, "en", "It is " + item.name + ".");
      pushSpeak(lines, "en", "Tap the " + item.name + ".");
      pushSpeak(lines, "en", "It is the " + item.name + ".");
    });
    return lines;
  };
})(globalThis.HV = globalThis.HV || {});
