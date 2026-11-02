(function (HV) {
  "use strict";

  var shuffle = HV.util.shuffle;

  function choiceQ(spec) {
    var n = spec.options.length;
    return {
      kind: "choice",
      lang: "en",
      prompt: spec.prompt,
      speak: spec.speak || spec.prompt,
      explain: spec.explain || "",
      scene: spec.scene || null,
      columns: n === 3 ? 3 : 2,
      choices: spec.options
    };
  }

  function textOpts(correct, pool, howMany) {
    var seen = {};
    var others = [];
    shuffle(pool.filter(function (x) { return x !== correct; })).forEach(function (x) {
      if (seen[x]) return;
      seen[x] = true;
      others.push(x);
    });
    return shuffle([{ text: correct, correct: true }].concat(others.slice(0, howMany - 1).map(function (x) {
      return { text: x, correct: false };
    })));
  }

  function take(bank, n) {
    return shuffle(bank).slice(0, Math.min(n, bank.length));
  }

  function words(filter) {
    return HV.englishWords.filter(filter);
  }

  var CVC = words(function (w) { return w.phonics === "cvc" && w.emoji; });
  var BLENDS = words(function (w) { return w.phonics === "blends" && w.emoji; });
  var VERBS = words(function (w) { return w.theme === "actions" && w.emoji; });
  var VOCAB = words(function (w) { return w.emoji && w.theme !== "sight"; });
  var SPELLABLE = words(function (w) {
    return /^[a-z]{3,6}$/.test(w.w) && new Set(w.w).size === w.w.length && (w.phonics === "cvc" || w.phonics === "blends");
  });

  function pictureChoices(bank, item) {
    var used = {};
    used[item.emoji] = true;
    var pics = [];
    shuffle(bank).forEach(function (p) {
      if (pics.length >= 2) return;
      if (p.w === item.w || !p.emoji || used[p.emoji]) return;
      used[p.emoji] = true;
      pics.push(p);
    });
    return shuffle([{ emoji: item.emoji, correct: true }].concat(pics.map(function (p) {
      return { emoji: p.emoji, correct: false };
    })));
  }

  var SENTENCES = [
    { text: "The cat is on the bed.", ok: ["🐱", "🛏️"], bad: [["🐶", "🛏️"], ["🐱", "🛁"]] },
    { text: "The bird is in the tree.", ok: ["🐦", "🌳"], bad: [["🐟", "🌳"], ["🐦", "🏠"]] },
    { text: "The duck is on the boat.", ok: ["🦆", "⛵"], bad: [["🐷", "⛵"], ["🦆", "🚌"]] },
    { text: "Mom has an apple.", ok: ["👩", "🍎"], bad: [["👩", "🍌"], ["👨", "🍎"]] },
    { text: "The dog is under the table.", ok: ["🐶", "🪑"], bad: [["🐶", "🛏️"], ["🐱", "🪑"]] },
    { text: "Dad can read a book.", ok: ["👨", "📖"], bad: [["👩", "📖"], ["👨", "⚽"]] }
  ];

  var GRAMMAR = [
    { say: "I see a cat.", prompt: "a or an?", options: ["a", "an"], correct: "a", explain: "We say a cat." },
    { say: "I see an apple.", prompt: "a or an?", options: ["a", "an"], correct: "an", explain: "We say an apple." },
    { say: "I see an egg.", prompt: "a or an?", options: ["a", "an"], correct: "an", explain: "We say an egg." },
    { say: "This is a cat.", prompt: "This or these?", options: ["This", "These"], correct: "This", explain: "One cat. We say this." },
    { say: "These are cats.", prompt: "This or these?", options: ["This", "These"], correct: "These", explain: "Many cats. We say these." },
    { say: "The cat is small.", prompt: "is or are?", options: ["is", "are"], correct: "is", explain: "One cat is small." },
    { say: "The cats are small.", prompt: "is or are?", options: ["is", "are"], correct: "are", explain: "Many cats are small." },
    { say: "What is the plural of cat?", prompt: "Pick the plural.", options: ["cats", "caties", "cates"], correct: "cats", explain: "One cat. Two cats." },
    { say: "What is the plural of box?", prompt: "Pick the plural.", options: ["boxes", "boxs", "boxies"], correct: "boxes", explain: "One box. Two boxes." },
    { say: "The cat is on the bed.", prompt: "Where is the cat?", options: ["on", "in", "under"], correct: "on", explain: "The cat is on the bed." },
    { say: "The cat is under the bed.", prompt: "Where is the cat?", options: ["on", "in", "under"], correct: "under", explain: "The cat is under the bed." },
    { say: "The ball is in the box.", prompt: "Where is the ball?", options: ["on", "in", "under"], correct: "in", explain: "The ball is in the box." },
    { say: "A bird can fly.", prompt: "can or can't?", options: ["can", "can't"], correct: "can", explain: "A bird can fly." },
    { say: "A fish can't fly.", prompt: "can or can't?", options: ["can", "can't"], correct: "can't", explain: "A fish can't fly." }
  ];

  var QA = [
    { say: "The cat is black. What color is the cat?", options: ["black", "red", "blue"], correct: "black", explain: "The cat is black." },
    { say: "Sam has two dogs. How many dogs?", options: ["two", "one", "four"], correct: "two", explain: "Sam has two dogs." },
    { say: "The book is on the desk. Where is the book?", options: ["on the desk", "in the bath", "under the bus"], correct: "on the desk", explain: "The book is on the desk." },
    { say: "Anna can swim. Can Anna swim?", options: ["yes", "no"], correct: "yes", explain: "Yes. Anna can swim." },
    { say: "The fish can't walk. Can the fish walk?", options: ["yes", "no"], correct: "no", explain: "No. The fish can't walk." },
    { say: "Tom is a boy. Who is Tom?", options: ["a boy", "a girl", "a cat"], correct: "a boy", explain: "Tom is a boy." }
  ];

  var STORIES = [
    {
      text: "Sam has a cat. The cat is black. It sits on the bed.",
      questions: [
        { q: "What color is the cat?", options: ["black", "red", "blue"], correct: "black" },
        { q: "Where does the cat sit?", options: ["on the bed", "in the sea", "under the bus"], correct: "on the bed" }
      ]
    },
    {
      text: "Mom and Dad go to the park. They have a ball. The dog can run.",
      questions: [
        { q: "Where do they go?", options: ["to the park", "to the moon", "to the bath"], correct: "to the park" },
        { q: "What can the dog do?", options: ["run", "fly", "read"], correct: "run" }
      ]
    },
    {
      text: "Ben has an apple and a banana. He can eat the apple. He is happy.",
      questions: [
        { q: "What can Ben eat?", options: ["the apple", "the shoe", "the bus"], correct: "the apple" },
        { q: "How does Ben feel?", options: ["happy", "sad", "angry"], correct: "happy" }
      ]
    }
  ];

  HV.generators.enReadCvc = function (cfg) {
    return take(CVC, cfg.count || 4).map(function (item) {
      return choiceQ({
        prompt: "Read the word. Tap the picture.",
        speak: "Read this word.",
        explain: "It says " + item.w + ".",
        scene: { layout: "digit", text: item.w },
        columns: 3,
        options: pictureChoices(CVC, item)
      });
    });
  };

  HV.generators.enFamilies = function (cfg) {
    var keys = Object.keys(HV.wordFamilies);
    return take(keys, cfg.count || 4).map(function (key) {
      var family = HV.wordFamilies[key];
      var head = family[0];
      var rhyme = family[1] || family[0];
      var distract = ["dog", "sun", "bed", "fish", "tree"].filter(function (w) {
        return family.indexOf(w) < 0;
      });
      return choiceQ({
        prompt: "Which word rhymes with " + head + "?",
        speak: "Which word rhymes with " + head + "?",
        explain: head + " and " + rhyme + " are in the " + key + " family.",
        options: textOpts(rhyme, [rhyme].concat(distract), 3)
      });
    });
  };

  HV.generators.enSight = function (cfg) {
    var bank = HV.sightWords.filter(function (w) { return w.length > 1; });
    return take(bank, cfg.count || 4).map(function (word) {
      return choiceQ({
        prompt: "Tap the word you hear",
        speak: "Find the word " + word + ".",
        explain: "The word is " + word + ".",
        columns: 3,
        options: textOpts(word, bank, 3)
      });
    });
  };

  HV.generators.enBlends = function (cfg) {
    return take(BLENDS, cfg.count || 4).map(function (item) {
      return choiceQ({
        prompt: "Read the word. Tap the picture.",
        speak: "Read this word.",
        explain: "It says " + item.w + ".",
        scene: { layout: "digit", text: item.w },
        columns: 3,
        options: pictureChoices(BLENDS, item)
      });
    });
  };

  HV.generators.enSpell = function (cfg) {
    return take(SPELLABLE, cfg.count || 4).map(function (item) {
      return {
        kind: "spell",
        lang: "en",
        word: item.w,
        prompt: "Listen and spell",
        speak: "Spell " + item.w + ".",
        explain: item.w.toUpperCase().split("").join(" ") + " spells " + item.w + "."
      };
    });
  };

  HV.generators.enOpposites = function (cfg) {
    return take(HV.opposites, cfg.count || 4).map(function (pair) {
      var others = HV.opposites.map(function (p) { return p[1]; }).filter(function (w) { return w !== pair[1]; });
      return choiceQ({
        prompt: "What is the opposite of " + pair[0] + "?",
        speak: "What is the opposite of " + pair[0] + "?",
        explain: "The opposite of " + pair[0] + " is " + pair[1] + ".",
        columns: 3,
        options: textOpts(pair[1], [pair[1]].concat(others), 3)
      });
    });
  };

  HV.generators.enVerbs = function (cfg) {
    return take(VERBS, cfg.count || 4).map(function (item) {
      var names = VERBS.map(function (v) { return v.w; });
      return choiceQ({
        prompt: "What is he doing?",
        speak: "What is he doing?",
        explain: "He can " + item.w + ".",
        scene: { layout: "emojis", items: [item.emoji] },
        columns: 3,
        options: textOpts(item.w, names, 3)
      });
    });
  };

  HV.generators.enBank = function (cfg) {
    return take(HV.englishWords, cfg.count || 5).map(function (item) {
      var pool = HV.englishWords.map(function (w) { return w.w; });
      var explain = item.theme === "sight"
        ? "The word is " + item.w + "."
        : "It is " + item.a + " " + item.w + ".";
      return choiceQ({
        prompt: "Tap the word you hear",
        speak: "Find the word " + item.w + ".",
        explain: explain,
        scene: item.emoji ? { layout: "emojis", items: [item.emoji] } : null,
        columns: 3,
        options: textOpts(item.w, pool, 3)
      });
    });
  };

  HV.generators.enVocab = function (cfg) {
    var pool = VOCAB;
    return take(pool, cfg.count || 4).map(function (item) {
      var pics = take(pool.filter(function (x) { return x.w !== item.w && x.emoji !== item.emoji; }), 2);
      return choiceQ({
        prompt: "What is this?",
        speak: "What is this? It is " + item.a + " " + item.w + ".",
        explain: "It is " + item.a + " " + item.w + ".",
        scene: { layout: "emojis", items: [item.emoji] },
        columns: 3,
        options: textOpts(item.w, [item.w].concat(pics.map(function (p) { return p.w; })), 3)
      });
    });
  };

  HV.generators.enSentences = function (cfg) {
    return take(SENTENCES, cfg.count || 4).map(function (item) {
      return choiceQ({
        prompt: item.text,
        speak: item.text,
        explain: item.text,
        columns: 3,
        options: shuffle([{ emojis: item.ok, correct: true }].concat(item.bad.map(function (e) {
          return { emojis: e, correct: false };
        })))
      });
    });
  };

  HV.generators.enGrammar = function (cfg) {
    return take(GRAMMAR, cfg.count || 4).map(function (item) {
      return choiceQ({
        prompt: item.prompt,
        speak: item.say,
        explain: item.explain,
        columns: item.options.length === 3 ? 3 : 2,
        options: textOpts(item.correct, item.options, item.options.length)
      });
    });
  };

  HV.generators.enQA = function (cfg) {
    return take(QA, cfg.count || 4).map(function (item) {
      return choiceQ({
        prompt: item.say,
        speak: item.say,
        explain: item.explain,
        columns: item.options.length === 2 ? 2 : 3,
        options: textOpts(item.correct, item.options, item.options.length)
      });
    });
  };

  HV.generators.enStory = function (cfg) {
    var picked = take(STORIES, cfg.count || 2);
    var out = [];
    picked.forEach(function (story) {
      story.questions.forEach(function (q) {
        out.push(choiceQ({
          prompt: story.text + " " + q.q,
          speak: story.text + " " + q.q,
          explain: "The answer is " + q.correct + ".",
          options: textOpts(q.correct, q.options, q.options.length)
        }));
      });
    });
    return out.slice(0, cfg.count || 4);
  };

  function addEx(partial) {
    partial.child = "mon";
    partial.subject = "english";
    HV.catalog.push(partial);
  }

  addEx({ id: "mon-en-cvc", level: 2, category: "reading", title: "Read CVC words", subtitle: "cat, sun, map", icon: "🔤", generator: "enReadCvc", config: { count: 4 } });
  addEx({ id: "mon-en-families", level: 2, category: "reading", title: "Word families", subtitle: "-at, -an, -op", icon: "👪", generator: "enFamilies", config: { count: 4 } });
  addEx({ id: "mon-en-sight", level: 2, category: "reading", title: "Sight words", subtitle: "the, see, look", icon: "👁️", generator: "enSight", config: { count: 4 } });
  addEx({ id: "mon-en-blends", level: 3, category: "reading", title: "Blends", subtitle: "sh, ch, th, bl", icon: "🚢", generator: "enBlends", config: { count: 4 } });
  addEx({ id: "mon-en-spell", level: 3, category: "spelling", title: "Listen and spell", subtitle: "Tap the letters", icon: "✏️", generator: "enSpell", config: { count: 4 } });
  addEx({ id: "mon-en-opposites", level: 3, category: "words", title: "Opposites", subtitle: "hot and cold", icon: "↔️", generator: "enOpposites", config: { count: 4 } });
  addEx({ id: "mon-en-verbs", level: 3, category: "words", title: "Action verbs", subtitle: "run, jump, read", icon: "🏃", generator: "enVerbs", config: { count: 4 } });
  addEx({ id: "mon-en-vocab", level: 3, category: "words", title: "Picture words", subtitle: "What is this?", icon: "🖼️", generator: "enVocab", config: { count: 4 } });
  addEx({ id: "mon-en-bank", level: 3, category: "words", title: "Vocabulary bank", subtitle: "300+ words", icon: "📚", generator: "enBank", config: { count: 5 } });
  addEx({ id: "mon-en-sentences", level: 4, category: "sentences", title: "Read a sentence", subtitle: "Tap the picture", icon: "🖼️", generator: "enSentences", config: { count: 4 } });
  addEx({ id: "mon-en-grammar", level: 4, category: "sentences", title: "Little grammar", subtitle: "a/an, is/are, can", icon: "🧩", generator: "enGrammar", config: { count: 4 } });
  addEx({ id: "mon-en-qa", level: 4, category: "sentences", title: "Listen and answer", subtitle: "What color is the cat?", icon: "❓", generator: "enQA", config: { count: 4 } });
  addEx({ id: "mon-en-story", level: 4, category: "sentences", title: "Short stories", subtitle: "Read and answer", icon: "📗", generator: "enStory", config: { count: 4 } });

  HV.catalog.forEach(function (ex) {
    if (ex.child === "mon" && ex.subject === "english" && !ex.level) ex.level = 1;
  });

  HV.englishLevelsInfo = [
    { level: 1, title: "Cấp 1 · Bắt đầu", blurb: "Chữ, màu, con vật" },
    { level: 2, title: "Cấp 2 · Đọc âm", blurb: "CVC, vần, từ nhìn là đọc" },
    { level: 3, title: "Cấp 3 · Từ", blurb: "Phụ âm ghép, đánh vần, 300 từ" },
    { level: 4, title: "Cấp 4 · Câu", blurb: "Ngữ pháp, câu, truyện" }
  ];

  var prevSpeaks = HV.learnSpeaks;
  HV.learnSpeaks = function () {
    var lines = prevSpeaks ? prevSpeaks() : [];
    function add(text) { if (text) lines.push({ lang: "en", text: text }); }
    add("Read this word.");
    CVC.forEach(function (w) { add("It says " + w.w + "."); });
    Object.keys(HV.wordFamilies).forEach(function (key) {
      var family = HV.wordFamilies[key];
      add("Which word rhymes with " + family[0] + "?");
      add(family[0] + " and " + (family[1] || family[0]) + " are in the " + key + " family.");
    });
    HV.sightWords.forEach(function (w) {
      if (w.length < 2) return;
      add("Find the word " + w + ".");
      add("The word is " + w + ".");
    });
    BLENDS.forEach(function (w) { add("It says " + w.w + "."); });
    SPELLABLE.forEach(function (w) {
      add("Spell " + w.w + ".");
      add(w.w.toUpperCase().split("").join(" ") + " spells " + w.w + ".");
    });
    HV.opposites.forEach(function (pair) {
      add("What is the opposite of " + pair[0] + "?");
      add("The opposite of " + pair[0] + " is " + pair[1] + ".");
    });
    add("What is he doing?");
    VERBS.forEach(function (w) { add("He can " + w.w + "."); });
    add("What is this?");
    HV.englishWords.forEach(function (w) {
      add("Find the word " + w.w + ".");
      if (w.theme === "sight") add("The word is " + w.w + ".");
      else add("It is " + w.a + " " + w.w + ".");
    });
    VOCAB.forEach(function (w) {
      add("What is this? It is " + w.a + " " + w.w + ".");
      add("It is " + w.a + " " + w.w + ".");
    });
    SENTENCES.forEach(function (s) { add(s.text); });
    GRAMMAR.forEach(function (g) { add(g.say); add(g.explain); add(g.prompt); });
    QA.forEach(function (q) { add(q.say); add(q.explain); });
    STORIES.forEach(function (story) {
      story.questions.forEach(function (q) {
        add(story.text + " " + q.q);
        add("The answer is " + q.correct + ".");
      });
    });
    add("Listen and spell");
    add("Tap the letters");
    return lines;
  };
})(globalThis.HV = globalThis.HV || {});
