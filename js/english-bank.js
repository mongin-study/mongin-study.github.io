(function (HV) {
  "use strict";

  /* Cambridge Pre-A1 style bank. emoji optional. a/an is derived, with a few fixes. */
  var RAW = [
    ["animals", 2, "cat|🐱 dog|🐶 bird|🐦 fish|🐟 cow|🐄 duck|🦆 pig|🐷 rabbit|🐰 horse|🐴 sheep|🐑 goat|🐐 frog|🐸 mouse|🐭 hen|🐔 bee|🐝"],
    ["animals", 3, "snake|🐍 bear|🐻 lion|🦁 tiger|🐯 monkey|🐵 elephant|🐘 zebra|🦓 giraffe|🦒 butterfly|🦋 spider|🕷️ whale|🐳 dolphin|🐬 penguin|🐧 kangaroo|🦘 camel|🐫 ant|🐜"],
    ["body", 3, "eye|👁️ ear|👂 nose|👃 mouth|👄 hand|✋ foot|🦶 head|🗣️ hair|💇 face|😊 arm|💪 leg|🦵 knee|🦵 toe|🦶 finger|👆 tooth|🦷"],
    ["clothes", 3, "hat|🎩 cap|🧢 dress|👗 shirt|👕 shoe|👟 sock|🧦 coat|🧥 bag|👜 skirt|👗 jacket|🧥 jeans|👖 boot|🥾 glasses|👓"],
    ["colors", 2, "red|🔴 blue|🔵 yellow|🟡 green|🟢 orange|🟠 purple|🟣 pink|🩷 black|⚫ white|⚪ brown|🟤 gray|🩶"],
    ["family", 3, "mom|👩 dad|👨 baby|👶 sister|👧 brother|👦 grandma|👵 grandpa|👴 boy|👦 girl|👧 friend|🧒 family|👨‍👩‍👧"],
    ["food", 3, "bread|🍞 rice|🍚 egg|🥚 milk|🥛 cake|🍰 cookie|🍪 juice|🧃 water|💧 soup|🍲 meat|🍖 cheese|🧀 chicken|🍗 fish|🐟 ice|🍨 sugar|🍬 salt|🧂"],
    ["fruit", 3, "apple|🍎 banana|🍌 orange|🍊 grape|🍇 mango|🥭 watermelon|🍉 pear|🍐 lemon|🍋 peach|🍑 cherry|🍒 coconut|🥥 pineapple|🍍 strawberry|🍓 kiwi|🥝"],
    ["home", 3, "bed|🛏️ chair|🪑 table|🪑 door|🚪 window|🪟 house|🏠 room|🚪 kitchen|🍳 bathroom|🛁 clock|🕐 lamp|💡 sofa|🛋️ mirror|🪞 cup|🥤 plate|🍽️ bowl|🥣 spoon|🥄 key|🔑"],
    ["school", 3, "book|📖 pen|🖊️ pencil|✏️ teacher|👩‍🏫 school|🏫 desk|🪑 ruler|📏 crayon|🖍️ paper|📄 class|🏫 bag|🎒"],
    ["sports", 3, "ball|⚽ game|🎮 football|⚽ tennis|🎾 bike|🚲 swim|🏊 run|🏃 jump|🤸 kick|🦵"],
    ["toys", 3, "doll|🪆 kite|🪁 robot|🤖 teddy|🧸 balloon|🎈 drum|🥁 puzzle|🧩 block|🧱 yo-yo|🪀"],
    ["transport", 3, "car|🚗 bus|🚌 boat|⛵ ship|🚢 plane|✈️ train|🚆 truck|🚚 taxi|🚕 helicopter|🚁"],
    ["weather", 3, "sun|☀️ rain|🌧️ cloud|☁️ wind|💨 snow|❄️ hot|🔥 cold|🧊"],
    ["places", 3, "park|🏞️ shop|🏪 zoo|🦁 farm|🐄 beach|🏖️ garden|🌷 street|🛣️ hospital|🏥"],
    ["nature", 3, "tree|🌳 flower|🌸 grass|🌿 leaf|🍃 star|⭐ moon|🌙 rock|🪨 sand|⏳ river|🏞️ sea|🌊"],
    ["jobs", 3, "doctor|🧑‍⚕️ cook|👨‍🍳 farmer|🧑‍🌾 driver|🚗 nurse|🧑‍⚕️ pilot|🧑‍✈️ clown|🤡"],
    ["actions", 3, "sit|🪑 stand|🧍 eat|🍽️ drink|🥤 read|📖 sleep|😴 walk|🚶 fly|🕊️ throw|🤾 catch|🤲 climb|🧗 open|🚪 close|🚪 look|👀 smile|😊 wash|🧼 draw|✏️ sing|🎤 dance|💃"],
    ["adjectives", 3, "big|🐘 small|🐭 happy|😊 sad|😢 fast|💨 slow|🐢 new|✨ old|📜 long|📏 short|✂️ clean|🧼 dirty|💩 tall|🦒"],
    ["sight", 2, "the a I see is it in on and to go my you we can look like said are was they she he for this that with have what where"],
    ["cvc", 2, "cat|🐱 hat|🎩 mat|🧶 bat|🦇 rat|🐀 sat|🪑 pat|✋ van|🚐 map|🗺️ pen|🖊️ bed|🛏️ cup|🥤 sun|☀️ pig|🐷 box|📦 fox|🦊 log|🪵 mop|🧹 net|🕸️ pot|🍲 bag|👜 fan|🌀 man|👨 pan|🍳 can|🥫 jam|🍯 web|🕸️ top|🔝 hop|🐰 run|🏃 dig|⛏️ sit|🪑"],
    ["blends", 3, "ship|🚢 shop|🏪 fish|🐟 chip|🍟 chin|😀 chat|💬 thin|📏 bath|🛁 moth|🦋 black|⚫ blue|🔵 flag|🚩 frog|🐸 drip|💧 stop|🛑 snap|📸 swim|🏊 tree|🌳 drum|🥁 grab|✋ plum|🍑 crab|🦀 slip|🍌 spot|🔵 twin|👯 brick|🧱 clam|🐚 drop|💧 frog|🐸 plan|🗺️ sled|🛷 snack|🍪 spin|🌀 stick|🪵 swim|🏊 trap|🪤 trip|🧳"],
    ["home2", 4, "sofa|🛋️ carpet|🧶 curtain|🪟 pillow|🛏️ blanket|🛏️ stairs|🪜 roof|🏠 garden|🌷 fence|🪵 garage|🚗 basement|📦 attic|🏠"],
    ["school2", 4, "eraser|🧽 sharpener|✏️ notebook|📓 homework|📘 recess|🏃 classroom|🏫 alphabet|🔤 story|📗 question|❓ answer|💬"],
    ["food2", 4, "breakfast|🍳 lunch|🥪 dinner|🍽️ snack|🍪 sandwich|🥪 salad|🥗 pizza|🍕 noodle|🍜 yogurt|🥛 honey|🍯 butter|🧈 jam|🍯 cereal|🥣"],
    ["clothes2", 4, "sweater|🧥 scarf|🧣 glove|🧤 belt|👔 button|🔘 pocket|👖 zipper|🤐 uniform|👕 pajamas|🛌 slippers|🥿"],
    ["time", 4, "morning|🌅 afternoon|🌞 night|🌙 today|📅 tomorrow|📆 yesterday|📆 week|🗓️ year|📅 birthday|🎂"],
    ["feelings", 4, "angry|😠 scared|😨 tired|😴 hungry|😋 thirsty|🥤 brave|🦁 kind|💝 proud|😊 shy|😳 excited|🤩"],
    ["city", 4, "library|📚 museum|🏛️ airport|🛫 station|🚉 bridge|🌉 market|🧺 cinema|🎬 playground|🛝"],
    ["more", 3, "phone|📱 camera|📷 computer|💻 tablet|📱 music|🎵 song|🎶 picture|🖼️ photo|📷 gift|🎁 party|🎉 candle|🕯️ card|💳 money|💵 ticket|🎫 map|🗺️ letter|✉️ stamp|📮"]
  ];

  var AN = { apple: 1, orange: 1, egg: 1, umbrella: 1, eye: 1, ear: 1, arm: 1, elephant: 1, ant: 1, eraser: 1, alphabet: 1, answer: 1, ice: 1, onion: 1 };

  var words = [];
  var seen = {};
  RAW.forEach(function (row) {
    var theme = row[0];
    var level = row[1];
    row[2].split(/\s+/).forEach(function (bit) {
      if (!bit) return;
      var parts = bit.split("|");
      var w = parts[0];
      if (seen[w]) {
        if ((theme === "cvc" || theme === "blends") && !seen[w].phonics) seen[w].phonics = theme;
        return;
      }
      var item = {
        w: w,
        emoji: parts[1] || "",
        theme: theme,
        level: level,
        a: AN[w] ? "an" : "a",
        phonics: theme === "cvc" || theme === "blends" ? theme : ""
      };
      seen[w] = item;
      words.push(item);
    });
  });

  HV.opposites = [
    ["hot", "cold"], ["big", "small"], ["happy", "sad"], ["fast", "slow"],
    ["new", "old"], ["long", "short"], ["clean", "dirty"], ["up", "down"],
    ["in", "out"], ["open", "close"], ["day", "night"], ["wet", "dry"],
    ["full", "empty"], ["loud", "quiet"], ["hard", "soft"], ["young", "old"],
    ["tall", "short"], ["light", "dark"], ["front", "back"], ["left", "right"]
  ];

  HV.wordFamilies = {
    at: ["cat", "hat", "mat", "bat", "rat"],
    an: ["can", "fan", "man", "pan", "van"],
    ig: ["pig", "dig"],
    op: ["hop", "top", "mop"],
    un: ["sun", "run"],
    ed: ["bed", "red"],
    ip: ["ship", "chip", "slip", "trip"],
    og: ["dog", "log", "frog"]
  };

  HV.sightWords = RAW.filter(function (r) { return r[0] === "sight"; })[0][2].split(/\s+/);

  HV.englishWords = words;
  HV.englishWordCount = words.length;
})(globalThis.HV = globalThis.HV || {});
