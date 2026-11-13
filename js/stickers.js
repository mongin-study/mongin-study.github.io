(function (HV) {
  "use strict";

  var U = HV.util;
  var el = U.el;
  var KEY = "hoc-vui-stickers";

  var CATALOG = [
    { id: "elsa-plain", name: "Elsa thường", emoji: "👸", cost: 6, tier: "easy", who: "mon", group: "Elsa" },
    { id: "elsa-smile", name: "Elsa vui", emoji: "😊", cost: 6, tier: "easy", who: "mon", group: "Elsa" },
    { id: "elsa-glitter", name: "Elsa lấp lánh", emoji: "✨", cost: 6, tier: "easy", who: "mon", group: "Elsa" },
    { id: "elsa-ice", name: "Elsa băng", emoji: "🧊", cost: 8, tier: "easy", who: "mon", group: "Elsa" },
    { id: "elsa-snow", name: "Elsa tuyết", emoji: "❄️", cost: 8, tier: "easy", who: "mon", group: "Elsa" },
    { id: "elsa-wand", name: "Elsa đũa phép", emoji: "🪄", cost: 8, tier: "easy", who: "mon", group: "Elsa" },
    { id: "elsa-heart", name: "Elsa trái tim", emoji: "💖", cost: 12, tier: "mid", who: "mon", group: "Elsa" },
    { id: "elsa-blue", name: "Elsa váy xanh", emoji: "👗💙", cost: 12, tier: "mid", who: "mon", group: "Elsa" },
    { id: "elsa-flake", name: "Elsa bông tuyết", emoji: "❄️", cost: 14, tier: "mid", who: "mon", group: "Elsa" },
    { id: "elsa-purple", name: "Elsa váy tím", emoji: "👗💜", cost: 14, tier: "mid", who: "mon", group: "Elsa" },
    { id: "elsa-olaf", name: "Elsa và Olaf", emoji: "⛄", cost: 14, tier: "mid", who: "mon", group: "Elsa" },
    { id: "elsa-dress", name: "Váy Elsa", emoji: "👗", cost: 16, tier: "mid", who: "mon", group: "Elsa" },
    { id: "elsa-pink", name: "Elsa váy hồng", emoji: "👗💗", cost: 16, tier: "mid", who: "mon", group: "Elsa" },
    { id: "elsa-anna", name: "Elsa và Anna", emoji: "👭", cost: 16, tier: "mid", who: "mon", group: "Elsa" },
    { id: "elsa-magic", name: "Elsa phép thuật", emoji: "🪄", cost: 24, tier: "rare", who: "mon", group: "Elsa" },
    { id: "elsa-sven", name: "Elsa và Sven", emoji: "🦌", cost: 24, tier: "rare", who: "mon", group: "Elsa" },
    { id: "elsa-star", name: "Elsa ngôi sao", emoji: "⭐", cost: 24, tier: "rare", who: "mon", group: "Elsa" },
    { id: "elsa-rainbow", name: "Elsa cầu vồng", emoji: "🌈", cost: 26, tier: "rare", who: "mon", group: "Elsa" },
    { id: "elsa-crown", name: "Vương miện Elsa", emoji: "👑", cost: 28, tier: "rare", who: "mon", group: "Elsa" },
    { id: "elsa-castle", name: "Elsa lâu đài", emoji: "🏰", cost: 28, tier: "rare", who: "mon", group: "Elsa" },
    { id: "elsa-princess", name: "Elsa công chúa", emoji: "👸👑", cost: 40, tier: "legend", who: "mon", group: "Elsa" },
    { id: "elsa-trio", name: "Elsa, Anna và Olaf", emoji: "👭", cost: 44, tier: "legend", who: "mon", group: "Elsa" },
    { id: "elsa-queen", name: "Nữ hoàng băng", emoji: "👑❄️", cost: 48, tier: "legend", who: "mon", group: "Elsa" },
    { id: "elsa-sky", name: "Elsa bầu trời sao", emoji: "🌌", cost: 52, tier: "legend", who: "mon", group: "Elsa" },
    { id: "elsa-legend", name: "Elsa huyền thoại", emoji: "🌟", cost: 60, tier: "legend", who: "mon", group: "Elsa" },
    { id: "rapunzel-smile", name: "Rapunzel cười", emoji: "😊", cost: 6, tier: "easy", who: "mon", group: "Rapunzel", src: "assets/stickers/rapunzel-smile.svg" },
    { id: "rapunzel-hair", name: "Tóc vàng dài", emoji: "💇", cost: 6, tier: "easy", who: "mon", group: "Rapunzel", src: "assets/stickers/rapunzel-hair.svg" },
    { id: "rapunzel-flower", name: "Hoa hồng tháp", emoji: "🌸", cost: 6, tier: "easy", who: "mon", group: "Rapunzel", src: "assets/stickers/rapunzel-flower.svg" },
    { id: "rapunzel-sun", name: "Nắng ban mai", emoji: "☀️", cost: 8, tier: "easy", who: "mon", group: "Rapunzel", src: "assets/stickers/rapunzel-sun.svg" },
    { id: "rapunzel-ribbon", name: "Nơ tím oải hương", emoji: "🎀", cost: 8, tier: "easy", who: "mon", group: "Rapunzel", src: "assets/stickers/rapunzel-ribbon.svg" },
    { id: "rapunzel-gown", name: "Váy tím Rapunzel", emoji: "👗", cost: 12, tier: "mid", who: "mon", group: "Rapunzel", src: "assets/stickers/rapunzel-gown.svg" },
    { id: "rapunzel-braid", name: "Bím tóc vàng", emoji: "💛", cost: 14, tier: "mid", who: "mon", group: "Rapunzel", src: "assets/stickers/rapunzel-braid.svg" },
    { id: "rapunzel-lantern", name: "Đèn lồng ấm", emoji: "🏮", cost: 14, tier: "mid", who: "mon", group: "Rapunzel", src: "assets/stickers/rapunzel-lantern.svg" },
    { id: "rapunzel-chameleon", name: "Tắc kè bạn", emoji: "🦎", cost: 14, tier: "mid", who: "mon", group: "Rapunzel", src: "assets/stickers/rapunzel-chameleon.svg" },
    { id: "rapunzel-wreath", name: "Vòng hoa Rapunzel", emoji: "💐", cost: 16, tier: "mid", who: "mon", group: "Rapunzel", src: "assets/stickers/rapunzel-wreath.svg" },
    { id: "rapunzel-friend", name: "Rapunzel và tắc kè", emoji: "🦎", cost: 16, tier: "mid", who: "mon", group: "Rapunzel", src: "assets/stickers/rapunzel-friend.svg" },
    { id: "rapunzel-window", name: "Cửa sổ tháp", emoji: "🪟", cost: 24, tier: "rare", who: "mon", group: "Rapunzel", src: "assets/stickers/rapunzel-window.svg" },
    { id: "rapunzel-crown", name: "Vương miện hoa", emoji: "👑", cost: 24, tier: "rare", who: "mon", group: "Rapunzel", src: "assets/stickers/rapunzel-crown.svg" },
    { id: "rapunzel-magic", name: "Tóc phép thuật", emoji: "✨", cost: 26, tier: "rare", who: "mon", group: "Rapunzel", src: "assets/stickers/rapunzel-magic.svg" },
    { id: "rapunzel-tower", name: "Tháp Rapunzel", emoji: "🏰", cost: 28, tier: "rare", who: "mon", group: "Rapunzel", src: "assets/stickers/rapunzel-tower.svg" },
    { id: "rapunzel-boat", name: "Thuyền hoa", emoji: "⛵", cost: 28, tier: "rare", who: "mon", group: "Rapunzel", src: "assets/stickers/rapunzel-boat.svg" },
    { id: "rapunzel-lanterns", name: "Đêm đèn lồng", emoji: "🏮", cost: 40, tier: "legend", who: "mon", group: "Rapunzel", src: "assets/stickers/rapunzel-lanterns.svg" },
    { id: "rapunzel-princess", name: "Công chúa Rapunzel", emoji: "👸", cost: 48, tier: "legend", who: "mon", group: "Rapunzel", src: "assets/stickers/rapunzel-princess.svg" },
    { id: "rapunzel-kingdom", name: "Vương quốc đèn", emoji: "🌟", cost: 60, tier: "legend", who: "mon", group: "Rapunzel", src: "assets/stickers/rapunzel-kingdom.svg" },
    { id: "uni-white", name: "Kỳ lân trắng", emoji: "🦄", cost: 6, tier: "easy", who: "mon", group: "Kỳ lân", src: "assets/stickers/uni-white.svg" },
    { id: "uni-pink", name: "Kỳ lân hồng", emoji: "💗", cost: 6, tier: "easy", who: "mon", group: "Kỳ lân", src: "assets/stickers/uni-pink.svg" },
    { id: "star-smile", name: "Ngôi sao cười", emoji: "⭐", cost: 6, tier: "easy", who: "mon", group: "Kỳ lân", src: "assets/stickers/star-smile.svg" },
    { id: "uni-baby", name: "Kỳ lân tí hon", emoji: "🦄", cost: 8, tier: "easy", who: "mon", group: "Kỳ lân", src: "assets/stickers/uni-baby.svg" },
    { id: "spark-heart", name: "Tim lấp lánh", emoji: "💖", cost: 8, tier: "easy", who: "mon", group: "Kỳ lân", src: "assets/stickers/spark-heart.svg" },
    { id: "pony-cream", name: "Pony kem", emoji: "🐴", cost: 8, tier: "easy", who: "mon", group: "Kỳ lân", src: "assets/stickers/pony-cream.svg" },
    { id: "uni-pastel", name: "Kỳ lân pastel", emoji: "🦄", cost: 12, tier: "mid", who: "mon", group: "Kỳ lân", src: "assets/stickers/uni-pastel.svg" },
    { id: "wand-pink", name: "Đũa phép hồng", emoji: "🪄", cost: 12, tier: "mid", who: "mon", group: "Kỳ lân", src: "assets/stickers/wand-pink.svg" },
    { id: "uni-mane", name: "Bờm cầu vồng", emoji: "🌈", cost: 14, tier: "mid", who: "mon", group: "Kỳ lân", src: "assets/stickers/uni-mane.svg" },
    { id: "uni-stars", name: "Kỳ lân ngắm sao", emoji: "⭐", cost: 14, tier: "mid", who: "mon", group: "Kỳ lân", src: "assets/stickers/uni-stars.svg" },
    { id: "flower-magic", name: "Hoa phép màu", emoji: "🌷", cost: 14, tier: "mid", who: "mon", group: "Kỳ lân", src: "assets/stickers/flower-magic.svg" },
    { id: "pony-pink", name: "Pony má hồng", emoji: "🐴", cost: 16, tier: "mid", who: "mon", group: "Kỳ lân", src: "assets/stickers/pony-pink.svg" },
    { id: "uni-fly", name: "Kỳ lân bay", emoji: "✨", cost: 24, tier: "rare", who: "mon", group: "Kỳ lân", src: "assets/stickers/uni-fly.svg" },
    { id: "rainbow-arch", name: "Cầu vồng kẹo", emoji: "🌈", cost: 24, tier: "rare", who: "mon", group: "Kỳ lân", src: "assets/stickers/rainbow-arch.svg" },
    { id: "uni-rainbow", name: "Kỳ lân cầu vồng", emoji: "🦄", cost: 26, tier: "rare", who: "mon", group: "Kỳ lân", src: "assets/stickers/uni-rainbow.svg" },
    { id: "wand-star", name: "Đũa sao vàng", emoji: "🪄", cost: 26, tier: "rare", who: "mon", group: "Kỳ lân", src: "assets/stickers/wand-star.svg" },
    { id: "carriage-flower", name: "Xe ngựa hoa", emoji: "🎠", cost: 28, tier: "rare", who: "mon", group: "Kỳ lân", src: "assets/stickers/carriage-flower.svg" },
    { id: "uni-cloud", name: "Kỳ lân trên mây", emoji: "☁️", cost: 28, tier: "rare", who: "mon", group: "Kỳ lân", src: "assets/stickers/uni-cloud.svg" },
    { id: "uni-crown", name: "Kỳ lân vương miện", emoji: "👑", cost: 40, tier: "legend", who: "mon", group: "Kỳ lân", src: "assets/stickers/uni-crown.svg" },
    { id: "uni-legend", name: "Kỳ lân huyền thoại", emoji: "🌟", cost: 52, tier: "legend", who: "mon", group: "Kỳ lân", src: "assets/stickers/uni-legend.svg" },
    { id: "dream-sky", name: "Bầu trời cổ tích", emoji: "🌙", cost: 60, tier: "legend", who: "mon", group: "Kỳ lân", src: "assets/stickers/dream-sky.svg" },
    { id: "hero-mask", name: "Mặt nạ anh hùng", emoji: "🎭", cost: 8, tier: "easy", who: "gin", group: "Anh hùng" },
    { id: "hero-cape", name: "Áo choàng", emoji: "🦸", cost: 16, tier: "mid", who: "gin", group: "Anh hùng" },
    { id: "hero-bolt", name: "Tia sét vàng", emoji: "⚡", cost: 28, tier: "rare", who: "gin", group: "Anh hùng" },
    { id: "puppy-nap", name: "Pom ngủ", emoji: "🐶", cost: 6, tier: "easy", who: "both", group: "Pom" },
    { id: "puppy-sit", name: "Pom ngồi", emoji: "🐶", cost: 8, tier: "easy", who: "both", group: "Pom" },
    { id: "puppy-heart", name: "Pom và tim", emoji: "💛", cost: 16, tier: "mid", who: "both", group: "Pom" },
    { id: "puppy-gold", name: "Pom hiếm", emoji: "🌟", cost: 28, tier: "rare", who: "both", group: "Pom" },
    { id: "puppy-crown", name: "Pom vương miện", emoji: "🐶👑", cost: 40, tier: "legend", who: "both", group: "Pom" },
    { id: "hero-shield", name: "Khiên anh hùng", emoji: "🛡️", cost: 6, tier: "easy", who: "gin", group: "Anh hùng", src: "assets/stickers/hero-shield.svg" },
    { id: "hero-fly", name: "Anh hùng bay", emoji: "🦸", cost: 8, tier: "easy", who: "gin", group: "Anh hùng", src: "assets/stickers/hero-fly.svg" },
    { id: "hero-fist", name: "Nắm đấm sức mạnh", emoji: "✊", cost: 8, tier: "easy", who: "gin", group: "Anh hùng", src: "assets/stickers/hero-fist.svg" },
    { id: "hero-star", name: "Sao anh hùng", emoji: "⭐", cost: 12, tier: "mid", who: "gin", group: "Anh hùng", src: "assets/stickers/hero-star.svg" },
    { id: "hero-robo", name: "Rô-bốt bạn", emoji: "🤖", cost: 14, tier: "mid", who: "gin", group: "Anh hùng", src: "assets/stickers/hero-robo.svg" },
    { id: "hero-night", name: "Anh hùng đêm", emoji: "🌙", cost: 16, tier: "mid", who: "gin", group: "Anh hùng", src: "assets/stickers/hero-night.svg" },
    { id: "hero-team", name: "Đội anh hùng", emoji: "🦸", cost: 24, tier: "rare", who: "gin", group: "Anh hùng", src: "assets/stickers/hero-team.svg" },
    { id: "hero-gold", name: "Anh hùng vàng", emoji: "✨", cost: 28, tier: "rare", who: "gin", group: "Anh hùng", src: "assets/stickers/hero-gold.svg" },
    { id: "hero-city", name: "Thành phố anh hùng", emoji: "🌃", cost: 40, tier: "legend", who: "gin", group: "Anh hùng", src: "assets/stickers/hero-city.svg" },
    { id: "hero-legend", name: "Anh hùng huyền thoại", emoji: "🌟", cost: 52, tier: "legend", who: "gin", group: "Anh hùng", src: "assets/stickers/hero-legend.svg" },
    { id: "veh-fire", name: "Xe cứu hỏa", emoji: "🚒", cost: 6, tier: "easy", who: "gin", group: "Xe cộ", src: "assets/stickers/veh-fire.svg" },
    { id: "veh-police", name: "Xe cảnh sát", emoji: "🚓", cost: 8, tier: "easy", who: "gin", group: "Xe cộ", src: "assets/stickers/veh-police.svg" },
    { id: "veh-rocket", name: "Tên lửa", emoji: "🚀", cost: 8, tier: "easy", who: "gin", group: "Xe cộ", src: "assets/stickers/veh-rocket.svg" },
    { id: "veh-train", name: "Tàu hỏa", emoji: "🚂", cost: 12, tier: "mid", who: "gin", group: "Xe cộ", src: "assets/stickers/veh-train.svg" },
    { id: "veh-digger", name: "Xe xúc", emoji: "🚜", cost: 12, tier: "mid", who: "gin", group: "Xe cộ", src: "assets/stickers/veh-digger.svg" },
    { id: "veh-plane", name: "Máy bay", emoji: "✈️", cost: 14, tier: "mid", who: "gin", group: "Xe cộ", src: "assets/stickers/veh-plane.svg" },
    { id: "veh-boat", name: "Tàu thủy", emoji: "🚢", cost: 16, tier: "mid", who: "gin", group: "Xe cộ", src: "assets/stickers/veh-boat.svg" },
    { id: "veh-race", name: "Xe đua đỏ", emoji: "🏎️", cost: 16, tier: "mid", who: "gin", group: "Xe cộ", src: "assets/stickers/veh-race.svg" },
    { id: "veh-sub", name: "Tàu ngầm", emoji: "🛳️", cost: 24, tier: "rare", who: "gin", group: "Xe cộ", src: "assets/stickers/veh-sub.svg" },
    { id: "veh-ufo", name: "Đĩa bay", emoji: "🛸", cost: 28, tier: "rare", who: "gin", group: "Xe cộ", src: "assets/stickers/veh-ufo.svg" },
    { id: "dino-egg", name: "Trứng khủng long", emoji: "🥚", cost: 6, tier: "easy", who: "gin", group: "Khủng long", src: "assets/stickers/dino-egg.svg" },
    { id: "dino-long", name: "Cổ dài dễ thương", emoji: "🦕", cost: 6, tier: "easy", who: "gin", group: "Khủng long", src: "assets/stickers/dino-long.svg" },
    { id: "dino-baby", name: "Khủng long con", emoji: "🐣", cost: 8, tier: "easy", who: "gin", group: "Khủng long", src: "assets/stickers/dino-baby.svg" },
    { id: "dino-trex", name: "Khủng long bạo chúa", emoji: "🦖", cost: 8, tier: "easy", who: "gin", group: "Khủng long", src: "assets/stickers/dino-trex.svg" },
    { id: "dino-tri", name: "Ba sừng vui", emoji: "🦕", cost: 12, tier: "mid", who: "gin", group: "Khủng long", src: "assets/stickers/dino-tri.svg" },
    { id: "dino-fly", name: "Khủng long bay", emoji: "🦇", cost: 14, tier: "mid", who: "gin", group: "Khủng long", src: "assets/stickers/dino-fly.svg" },
    { id: "dino-stego", name: "Lưng gai", emoji: "🦕", cost: 16, tier: "mid", who: "gin", group: "Khủng long", src: "assets/stickers/dino-stego.svg" },
    { id: "dino-roar", name: "Khủng long gầm", emoji: "🦖", cost: 24, tier: "rare", who: "gin", group: "Khủng long", src: "assets/stickers/dino-roar.svg" },
    { id: "dino-king", name: "Vua khủng long", emoji: "👑", cost: 40, tier: "legend", who: "gin", group: "Khủng long", src: "assets/stickers/dino-king.svg" },
    { id: "pix-alien", name: "Bạn xanh ba mắt", emoji: "👽", cost: 6, tier: "easy", who: "gin", group: "Phiêu lưu", src: "assets/stickers/pix-alien.svg" },
    { id: "pix-nemo", name: "Nemo bơi", emoji: "🐠", cost: 8, tier: "easy", who: "gin", group: "Phiêu lưu", src: "assets/stickers/pix-nemo.svg" },
    { id: "pix-mickey", name: "Mickey vui", emoji: "🐭", cost: 8, tier: "easy", who: "gin", group: "Phiêu lưu", src: "assets/stickers/pix-mickey.svg" },
    { id: "pix-forky", name: "Forky vui", emoji: "🍴", cost: 8, tier: "easy", who: "gin", group: "Phiêu lưu", src: "assets/stickers/pix-forky.svg" },
    { id: "pix-woody", name: "Woody cao bồi", emoji: "🤠", cost: 12, tier: "mid", who: "gin", group: "Phiêu lưu", src: "assets/stickers/pix-woody.svg" },
    { id: "pix-mater", name: "Mater kéo xe", emoji: "🚚", cost: 12, tier: "mid", who: "gin", group: "Phiêu lưu", src: "assets/stickers/pix-mater.svg" },
    { id: "pix-dory", name: "Dory xanh", emoji: "🐟", cost: 12, tier: "mid", who: "gin", group: "Phiêu lưu", src: "assets/stickers/pix-dory.svg" },
    { id: "pix-buzz", name: "Buzz phi hành", emoji: "🧑‍🚀", cost: 14, tier: "mid", who: "gin", group: "Phiêu lưu", src: "assets/stickers/pix-buzz.svg" },
    { id: "pix-simba", name: "Simba sư tử", emoji: "🦁", cost: 14, tier: "mid", who: "gin", group: "Phiêu lưu", src: "assets/stickers/pix-simba.svg" },
    { id: "pix-mike", name: "Mike một mắt", emoji: "👁️", cost: 14, tier: "mid", who: "gin", group: "Phiêu lưu", src: "assets/stickers/pix-mike.svg" },
    { id: "pix-stitch", name: "Stitch tinh nghịch", emoji: "💙", cost: 16, tier: "mid", who: "gin", group: "Phiêu lưu", src: "assets/stickers/pix-stitch.svg" },
    { id: "pix-mcqueen", name: "McQueen đỏ", emoji: "🚗", cost: 16, tier: "mid", who: "gin", group: "Phiêu lưu", src: "assets/stickers/pix-mcqueen.svg" },
    { id: "pix-walle", name: "Wall-e hộp", emoji: "🤖", cost: 16, tier: "mid", who: "gin", group: "Phiêu lưu", src: "assets/stickers/pix-walle.svg" },
    { id: "pix-sully", name: "Sully lông xù", emoji: "👹", cost: 24, tier: "rare", who: "gin", group: "Phiêu lưu", src: "assets/stickers/pix-sully.svg" },
    { id: "pix-baymax", name: "Baymax ôm", emoji: "🤍", cost: 28, tier: "rare", who: "gin", group: "Phiêu lưu", src: "assets/stickers/pix-baymax.svg" },
    { id: "pix-buzz-fly", name: "Buzz bay cao", emoji: "🚀", cost: 40, tier: "legend", who: "gin", group: "Phiêu lưu", src: "assets/stickers/pix-buzz-fly.svg" },
    { id: "pix-simba-rock", name: "Simba trên đá", emoji: "🦁", cost: 48, tier: "legend", who: "gin", group: "Phiêu lưu", src: "assets/stickers/pix-simba-rock.svg" },
    { id: "pix-mickey-star", name: "Mickey ngôi sao", emoji: "⭐", cost: 60, tier: "legend", who: "gin", group: "Phiêu lưu", src: "assets/stickers/pix-mickey-star.svg" },
    { id: "fun-panda", name: "Gấu trúc ăn tre", emoji: "🐼", cost: 6, tier: "easy", who: "gin", group: "Thú vui", src: "assets/stickers/fun-panda.svg" },
    { id: "fun-cat", name: "Mèo đeo kính", emoji: "🐱", cost: 6, tier: "easy", who: "gin", group: "Thú vui", src: "assets/stickers/fun-cat.svg" },
    { id: "fun-frog", name: "Ếch nhảy", emoji: "🐸", cost: 6, tier: "easy", who: "gin", group: "Thú vui", src: "assets/stickers/fun-frog.svg" },
    { id: "fun-monkey", name: "Khỉ đu dây", emoji: "🐵", cost: 8, tier: "easy", who: "gin", group: "Thú vui", src: "assets/stickers/fun-monkey.svg" },
    { id: "fun-penguin", name: "Cánh cụt trượt", emoji: "🐧", cost: 8, tier: "easy", who: "gin", group: "Thú vui", src: "assets/stickers/fun-penguin.svg" },
    { id: "fun-bunny", name: "Thỏ cà rốt", emoji: "🐰", cost: 8, tier: "easy", who: "gin", group: "Thú vui", src: "assets/stickers/fun-bunny.svg" },
    { id: "fun-pig", name: "Heo đội mũ", emoji: "🐷", cost: 8, tier: "easy", who: "gin", group: "Thú vui", src: "assets/stickers/fun-pig.svg" },
    { id: "fun-elephant", name: "Voi phun nước", emoji: "🐘", cost: 12, tier: "mid", who: "gin", group: "Thú vui", src: "assets/stickers/fun-elephant.svg" },
    { id: "fun-bear", name: "Gấu ôm mật", emoji: "🐻", cost: 12, tier: "mid", who: "gin", group: "Thú vui", src: "assets/stickers/fun-bear.svg" },
    { id: "fun-owl", name: "Cú đội mũ", emoji: "🦉", cost: 12, tier: "mid", who: "gin", group: "Thú vui", src: "assets/stickers/fun-owl.svg" },
    { id: "fun-hippo", name: "Hà mã cười", emoji: "🦛", cost: 14, tier: "mid", who: "gin", group: "Thú vui", src: "assets/stickers/fun-hippo.svg" },
    { id: "fun-fox", name: "Cáo tinh nghịch", emoji: "🦊", cost: 14, tier: "mid", who: "gin", group: "Thú vui", src: "assets/stickers/fun-fox.svg" },
    { id: "fun-giraffe", name: "Hươu cao cổ", emoji: "🦒", cost: 14, tier: "mid", who: "gin", group: "Thú vui", src: "assets/stickers/fun-giraffe.svg" },
    { id: "fun-uni", name: "Kỳ lân con Gin", emoji: "🦄", cost: 16, tier: "mid", who: "gin", group: "Thú vui", src: "assets/stickers/fun-uni.svg" },
    { id: "fun-croc", name: "Cá sấu cười", emoji: "🐊", cost: 16, tier: "mid", who: "gin", group: "Thú vui", src: "assets/stickers/fun-croc.svg" },
    { id: "fun-lion", name: "Sư tử ngáp", emoji: "🦁", cost: 24, tier: "rare", who: "gin", group: "Thú vui", src: "assets/stickers/fun-lion.svg" },
    { id: "fun-party", name: "Khỉ liên hoan", emoji: "🎉", cost: 28, tier: "rare", who: "gin", group: "Thú vui", src: "assets/stickers/fun-party.svg" },
    { id: "cute-bird", name: "Chim hồng", emoji: "🐦", cost: 6, tier: "easy", who: "mon", group: "Thú vui", src: "assets/stickers/cute-bird.svg" },
    { id: "cute-bunny", name: "Thỏ nơ hồng", emoji: "🐰", cost: 6, tier: "easy", who: "mon", group: "Thú vui", src: "assets/stickers/cute-bunny.svg" },
    { id: "cute-panda", name: "Gấu trúc má hồng", emoji: "🐼", cost: 6, tier: "easy", who: "mon", group: "Thú vui", src: "assets/stickers/cute-panda.svg" },
    { id: "cute-kitten", name: "Mèo con nơ", emoji: "🐱", cost: 8, tier: "easy", who: "mon", group: "Thú vui", src: "assets/stickers/cute-kitten.svg" },
    { id: "cute-penguin", name: "Cánh cụt nơ", emoji: "🐧", cost: 8, tier: "easy", who: "mon", group: "Thú vui", src: "assets/stickers/cute-penguin.svg" },
    { id: "cute-frog", name: "Ếch vương miện", emoji: "🐸", cost: 8, tier: "easy", who: "mon", group: "Thú vui", src: "assets/stickers/cute-frog.svg" },
    { id: "cute-butterfly", name: "Bướm pastel", emoji: "🦋", cost: 8, tier: "easy", who: "mon", group: "Thú vui", src: "assets/stickers/cute-butterfly.svg" },
    { id: "cute-fox", name: "Cáo pastel", emoji: "🦊", cost: 12, tier: "mid", who: "mon", group: "Thú vui", src: "assets/stickers/cute-fox.svg" },
    { id: "cute-elephant", name: "Voi hoa", emoji: "🐘", cost: 12, tier: "mid", who: "mon", group: "Thú vui", src: "assets/stickers/cute-elephant.svg" },
    { id: "cute-hippo", name: "Hà mã hồng", emoji: "🦛", cost: 12, tier: "mid", who: "mon", group: "Thú vui", src: "assets/stickers/cute-hippo.svg" },
    { id: "cute-bear", name: "Gấu ôm tim", emoji: "🧸", cost: 14, tier: "mid", who: "mon", group: "Thú vui", src: "assets/stickers/cute-bear.svg" },
    { id: "cute-deer", name: "Nai hoa", emoji: "🦌", cost: 14, tier: "mid", who: "mon", group: "Thú vui", src: "assets/stickers/cute-deer.svg" },
    { id: "cute-owl", name: "Cú dễ thương", emoji: "🦉", cost: 14, tier: "mid", who: "mon", group: "Thú vui", src: "assets/stickers/cute-owl.svg" },
    { id: "cute-uni", name: "Kỳ lân con ngủ", emoji: "🦄", cost: 16, tier: "mid", who: "mon", group: "Thú vui", src: "assets/stickers/cute-uni.svg" },
    { id: "cute-swan", name: "Thiên nga", emoji: "🦢", cost: 16, tier: "mid", who: "mon", group: "Thú vui", src: "assets/stickers/cute-swan.svg" },
    { id: "cute-seal", name: "Hải cẩu ôm bóng", emoji: "🦭", cost: 24, tier: "rare", who: "mon", group: "Thú vui", src: "assets/stickers/cute-seal.svg" },
    { id: "cute-panda-heart", name: "Gấu trúc và tim", emoji: "💗", cost: 40, tier: "legend", who: "mon", group: "Thú vui", src: "assets/stickers/cute-panda-heart.svg" },
    { id: "dis-bow", name: "Nơ chấm bi", emoji: "🎀", cost: 6, tier: "easy", who: "mon", group: "Disney", src: "assets/stickers/dis-bow.svg" },
    { id: "dis-apple", name: "Táo đỏ", emoji: "🍎", cost: 6, tier: "easy", who: "mon", group: "Disney", src: "assets/stickers/dis-apple.svg" },
    { id: "dis-minnie", name: "Minnie vui", emoji: "🎀", cost: 8, tier: "easy", who: "mon", group: "Disney", src: "assets/stickers/dis-minnie.svg" },
    { id: "dis-daisy", name: "Daisy vui", emoji: "🌼", cost: 8, tier: "easy", who: "mon", group: "Disney", src: "assets/stickers/dis-daisy.svg" },
    { id: "dis-heihei", name: "Heihei ngốc", emoji: "🐔", cost: 8, tier: "easy", who: "mon", group: "Disney", src: "assets/stickers/dis-heihei.svg" },
    { id: "dis-olaf", name: "Olaf ôm", emoji: "⛄", cost: 8, tier: "easy", who: "mon", group: "Disney", src: "assets/stickers/dis-olaf.svg" },
    { id: "dis-flounder", name: "Cá vàng Flounder", emoji: "🐠", cost: 8, tier: "easy", who: "mon", group: "Disney", src: "assets/stickers/dis-flounder.svg" },
    { id: "dis-marie", name: "Marie mèo trắng", emoji: "🐱", cost: 12, tier: "mid", who: "mon", group: "Disney", src: "assets/stickers/dis-marie.svg" },
    { id: "dis-slipper", name: "Hài thủy tinh", emoji: "👠", cost: 12, tier: "mid", who: "mon", group: "Disney", src: "assets/stickers/dis-slipper.svg" },
    { id: "dis-anna", name: "Anna áo choàng", emoji: "🧥", cost: 12, tier: "mid", who: "mon", group: "Disney", src: "assets/stickers/dis-anna.svg" },
    { id: "dis-belle", name: "Belle váy vàng", emoji: "👗", cost: 14, tier: "mid", who: "mon", group: "Disney", src: "assets/stickers/dis-belle.svg" },
    { id: "dis-snow", name: "Bạch Tuyết", emoji: "🍎", cost: 14, tier: "mid", who: "mon", group: "Disney", src: "assets/stickers/dis-snow.svg" },
    { id: "dis-ariel", name: "Ariel tóc đỏ", emoji: "🧜‍♀️", cost: 14, tier: "mid", who: "mon", group: "Disney", src: "assets/stickers/dis-ariel.svg" },
    { id: "dis-bambi", name: "Bambi nai", emoji: "🦌", cost: 14, tier: "mid", who: "mon", group: "Disney", src: "assets/stickers/dis-bambi.svg" },
    { id: "dis-elsa-wave", name: "Elsa vẫy tay", emoji: "❄️", cost: 14, tier: "mid", who: "mon", group: "Disney", src: "assets/stickers/dis-elsa-wave.svg" },
    { id: "dis-moana", name: "Moana biển", emoji: "🌊", cost: 16, tier: "mid", who: "mon", group: "Disney", src: "assets/stickers/dis-moana.svg" },
    { id: "dis-dumbo", name: "Dumbo tai to", emoji: "🐘", cost: 16, tier: "mid", who: "mon", group: "Disney", src: "assets/stickers/dis-dumbo.svg" },
    { id: "dis-stitch-flower", name: "Stitch ôm hoa", emoji: "🌸", cost: 16, tier: "mid", who: "mon", group: "Disney", src: "assets/stickers/dis-stitch-flower.svg" },
    { id: "dis-jasmine", name: "Jasmine", emoji: "💎", cost: 16, tier: "mid", who: "mon", group: "Disney", src: "assets/stickers/dis-jasmine.svg" },
    { id: "dis-cinderella", name: "Lọ Lem", emoji: "👗", cost: 16, tier: "mid", who: "mon", group: "Disney", src: "assets/stickers/dis-cinderella.svg" },
    { id: "dis-rose", name: "Hoa hồng Belle", emoji: "🌹", cost: 16, tier: "mid", who: "mon", group: "Disney", src: "assets/stickers/dis-rose.svg" },
    { id: "dis-pumpkin", name: "Xe bí ngô", emoji: "🎃", cost: 24, tier: "rare", who: "mon", group: "Disney", src: "assets/stickers/dis-pumpkin.svg" },
    { id: "dis-moana-boat", name: "Moana và thuyền", emoji: "⛵", cost: 24, tier: "rare", who: "mon", group: "Disney", src: "assets/stickers/dis-moana-boat.svg" },
    { id: "dis-fairy", name: "Tiên xanh", emoji: "🧚", cost: 28, tier: "rare", who: "mon", group: "Disney", src: "assets/stickers/dis-fairy.svg" },
    { id: "dis-dumbo-fly", name: "Dumbo bay", emoji: "✨", cost: 40, tier: "legend", who: "mon", group: "Disney", src: "assets/stickers/dis-dumbo-fly.svg" },
    { id: "dis-ariel-sing", name: "Ariel hát", emoji: "🎤", cost: 48, tier: "legend", who: "mon", group: "Disney", src: "assets/stickers/dis-ariel-sing.svg" },
    { id: "dis-castle", name: "Lâu đài tim", emoji: "🏰", cost: 60, tier: "legend", who: "mon", group: "Disney", src: "assets/stickers/dis-castle.svg" },
  ];

  function empty() {
    return { mon: { owned: [], spends: [] }, gin: { owned: [], spends: [] } };
  }

  function read() {
    try {
      var data = JSON.parse(localStorage.getItem(KEY) || "");
      if (!data || !data.mon || !data.gin) return empty();
      return data;
    } catch (e) { return empty(); }
  }

  function write(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }

  function mergeIn(remote) {
    if (!remote) return;
    var data = read();
    ["mon", "gin"].forEach(function (child) {
      var src = remote[child];
      if (!src) return;
      var owned = {};
      (data[child].owned || []).concat(src.owned || []).forEach(function (id) { owned[id] = true; });
      var spends = {};
      (data[child].spends || []).concat(src.spends || []).forEach(function (s) {
        if (s && s.sticker) spends[s.sticker + "|" + s.at] = s;
      });
      data[child] = { owned: Object.keys(owned), spends: Object.keys(spends).map(function (k) { return spends[k]; }) };
    });
    write(data);
  }

  function spentThisWeek(child) {
    var week = U.weekStart(U.todayStr());
    return (read()[child].spends || []).reduce(function (sum, s) {
      return sum + (s.week === week ? Number(s.cost) || 0 : 0);
    }, 0);
  }

  function spendable(child) {
    var earned = HV.storage.summarizeWeek(child, U.weekStart(U.todayStr())).stars;
    return Math.max(0, earned - spentThisWeek(child));
  }

  function visible(child) {
    return CATALOG.filter(function (s) { return s.who === child || s.who === "both"; });
  }

  function tierOf(sticker) {
    if (sticker.tier === "legend" || sticker.tier === "rare" || sticker.tier === "mid" || sticker.tier === "easy") return sticker.tier;
    if (sticker.cost >= 40) return "legend";
    if (sticker.cost >= 24) return "rare";
    if (sticker.cost >= 12) return "mid";
    return "easy";
  }

  function emojiSpan(sticker) {
    return el("span", { class: "sticker-emoji" + (Array.from(sticker.emoji).length > 1 ? " is-duo" : ""), text: sticker.emoji });
  }

  function stickerFace(sticker) {
    if (!sticker.src) return emojiSpan(sticker);
    return el("img", {
      class: "sticker-art",
      src: sticker.src,
      alt: sticker.name,
      width: "200",
      height: "200",
      onError: function (ev) {
        var img = ev.currentTarget;
        if (img.parentNode) img.parentNode.replaceChild(emojiSpan(sticker), img);
      }
    });
  }

  function tierText(sticker) {
    var tier = tierOf(sticker);
    if (tier === "legend") return "siêu hiếm";
    if (tier === "rare") return "hiếm";
    if (tier === "mid") return "vừa";
    return "dễ";
  }

  function delight(sticker) {
    var lead = 0;
    try {
      if (HV.audio && HV.audio.wish) lead = Number(HV.audio.wish()) || 0;
      else if (HV.audio && HV.audio.fanfare) lead = Number(HV.audio.fanfare()) || 0;
    } catch (e) {}
    if (!HV.speech || !sticker || !sticker.name) return;
    var delay = Math.round((lead || 0) * 1000) + 60;
    setTimeout(function () {
      HV.speech.speak(sticker.name, { lang: "vi", keepSound: true });
    }, delay);
  }

  function buy(child, sticker) {
    var data = read();
    if (data[child].owned.indexOf(sticker.id) >= 0) return;
    var pocket = spendable(child);
    if (pocket < sticker.cost) return;
    var spend = { sticker: sticker.id, week: U.weekStart(U.todayStr()), cost: sticker.cost, at: Date.now() };
    data[child].owned.push(sticker.id);
    data[child].spends.push(spend);
    write(data);
    if (HV.cloud && HV.cloud.saveAlbumAdd) HV.cloud.saveAlbumAdd(child, sticker.id, spend);
    delight(sticker);
    if (HV.ui && HV.ui.render) HV.ui.render();
  }

  function card(child) {
    var ownedIds = read()[child].owned;
    var mine = visible(child);
    var owned = mine.filter(function (s) { return ownedIds.indexOf(s.id) >= 0; }).length;
    var elsaLeft = mine.filter(function (s) {
      return s.group === "Elsa" && ownedIds.indexOf(s.id) < 0;
    }).length;
    var blurb = child === "mon"
      ? "Mới: Rapunzel và kỳ lân · Elsa còn " + elsaLeft + " · đã có " + owned + "/" + mine.length
      : "Đổi được " + spendable(child) + " sao · đã có " + owned + " sticker";
    var played = ownedIds.length > 0;
    return el("button", {
      class: "week-card sticker-card" + (played ? " is-played" : " is-new"),
      "data-go": "#/stickers/" + child,
      "data-state": played ? "played" : "new"
    }, [
      el("span", { class: "ex-icon act-icon", "aria-hidden": "true", text: "⭐" }),
      played ? null : el("span", { class: "pay-badge", text: "Mới" }),
      el("h2", { text: "Album sticker" }),
      el("p", { text: blurb })
    ]);
  }

  function view(child) {
    var data = read()[child];
    var root = el("section", { class: "menu" });
    root.appendChild(el("header", { class: "topbar" }, [
      el("button", { class: "icon-btn", "data-go": "#/c/" + child, text: "←" }),
      el("div", { class: "top-title" }, [
        el("strong", { text: "Album sticker" }),
        el("span", { text: "Sao đổi được: " + spendable(child) })
      ])
    ]));
    var mine = visible(child);
    var elsaAll = mine.filter(function (s) { return s.group === "Elsa"; });
    var elsaOwned = elsaAll.filter(function (s) { return data.owned.indexOf(s.id) >= 0; }).length;
    root.appendChild(el("p", { class: "lede", text: child === "mon"
      ? "Elsa đã có " + elsaOwned + "/" + elsaAll.length + ". Rapunzel và kỳ lân mới đang chờ Mon."
      : "Dùng sao em kiếm tuần này để đổi sticker." }));
    ["Rapunzel", "Kỳ lân", "Elsa", "Disney", "Anh hùng", "Xe cộ", "Khủng long", "Phiêu lưu", "Thú vui", "Pom"].forEach(function (group) {
      var items = mine.filter(function (s) { return s.group === group; }).slice().sort(function (a, b) {
        return a.cost - b.cost;
      });
      if (!items.length) return;
      root.appendChild(el("h2", { class: "sticker-head", text: group }));
      var grid = el("div", { class: "sticker-grid" });
      items.forEach(function (sticker) {
        var has = data.owned.indexOf(sticker.id) >= 0;
        var afford = spendable(child) >= sticker.cost;
        var tier = tierOf(sticker);
        var cell = el("article", { class: "sticker" + (has ? " is-owned" : "") + (tier === "rare" ? " is-rare" : "") + (tier === "legend" ? " is-legend" : "") });
        cell.appendChild(stickerFace(sticker));
        cell.appendChild(el("strong", { text: sticker.name }));
        cell.appendChild(el("p", { text: tierText(sticker) }));
        if (has) cell.appendChild(el("p", { class: "pay-badge", text: "Đã có" }));
        else cell.appendChild(el("button", {
          class: "btn" + (afford ? " btn-primary" : ""),
          disabled: afford ? null : true,
          text: afford ? "Đổi " + sticker.cost + " sao" : "Cần " + sticker.cost + " sao",
          onClick: function () { buy(child, sticker); }
        }));
        grid.appendChild(cell);
      });
      root.appendChild(grid);
    });
    return root;
  }

  function parentPanel() {
    var box = el("section", { class: "past" });
    box.appendChild(el("h2", { text: "Album sticker" }));
    box.appendChild(el("p", { text: "Đổi sticker chỉ trừ sao đổi được trong tuần. Mốc 15/30/50 và sổ sao cũ không đổi." }));
    ["mon", "gin"].forEach(function (child) {
      var owned = read()[child].owned;
      var names = CATALOG.filter(function (s) { return owned.indexOf(s.id) >= 0; }).map(function (s) { return s.name; });
      box.appendChild(el("p", { text: (child === "gin" ? "Gin" : "Mon") + ": " + (names.length ? names.join(", ") : "chưa đổi sticker") + " · còn " + spendable(child) + " sao đổi được" }));
    });
    return box;
  }

  HV.stickers = { card: card, view: view, parentPanel: parentPanel, spendable: spendable, ingest: mergeIn };
})(globalThis.HV = globalThis.HV || {});
