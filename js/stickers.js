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
    { id: "hero-mask", name: "Mặt nạ anh hùng", emoji: "🎭", cost: 8, tier: "easy", who: "gin", group: "Anh hùng" },
    { id: "hero-cape", name: "Áo choàng", emoji: "🦸", cost: 16, tier: "mid", who: "gin", group: "Anh hùng" },
    { id: "hero-bolt", name: "Tia sét vàng", emoji: "⚡", cost: 28, tier: "rare", who: "gin", group: "Anh hùng" },
    { id: "puppy-nap", name: "Cún Vàng ngủ", emoji: "🐶", cost: 6, tier: "easy", who: "both", group: "Cún Vàng" },
    { id: "puppy-sit", name: "Cún Vàng ngồi", emoji: "🐶", cost: 8, tier: "easy", who: "both", group: "Cún Vàng" },
    { id: "puppy-heart", name: "Cún Vàng và tim", emoji: "💛", cost: 16, tier: "mid", who: "both", group: "Cún Vàng" },
    { id: "puppy-gold", name: "Cún Vàng hiếm", emoji: "🌟", cost: 28, tier: "rare", who: "both", group: "Cún Vàng" },
    { id: "puppy-crown", name: "Cún Vàng vương miện", emoji: "🐶👑", cost: 40, tier: "legend", who: "both", group: "Cún Vàng" }
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

  function tierText(sticker) {
    var tier = tierOf(sticker);
    if (tier === "legend") return "siêu hiếm";
    if (tier === "rare") return "hiếm";
    if (tier === "mid") return "vừa";
    return "dễ";
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
    if (HV.audio) HV.audio.fanfare();
    if (HV.speech) HV.speech.speak("Đổi được sticker rồi!", { lang: "vi" });
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
      ? "Còn " + elsaLeft + " sticker Elsa · đã có " + owned + "/" + mine.length
      : "Đổi được " + spendable(child) + " sao · đã có " + owned + " sticker";
    return el("button", { class: "week-card sticker-card", "data-go": "#/stickers/" + child }, [
      el("span", { class: "pay-badge", text: "Mới" }),
      el("h2", { text: "Album sticker ⭐" }),
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
      ? "Elsa đã có " + elsaOwned + "/" + elsaAll.length + ". Còn nhiều sticker mới để sưu."
      : "Dùng sao em kiếm tuần này để đổi sticker." }));
    ["Elsa", "Anh hùng", "Cún Vàng"].forEach(function (group) {
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
        cell.appendChild(el("span", { class: "sticker-emoji" + (Array.from(sticker.emoji).length > 1 ? " is-duo" : ""), text: sticker.emoji }));
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
