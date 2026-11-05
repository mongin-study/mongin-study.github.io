(function (HV) {
  "use strict";

  var U = HV.util;
  var el = U.el;
  var KEY = "hoc-vui-stickers";

  var CATALOG = [
    { id: "elsa-snow", name: "Elsa tuyết", emoji: "❄️", cost: 8, who: "mon", group: "Elsa" },
    { id: "elsa-dress", name: "Váy Elsa", emoji: "👗", cost: 16, who: "mon", group: "Elsa" },
    { id: "elsa-crown", name: "Vương miện Elsa", emoji: "👑", cost: 28, who: "mon", group: "Elsa", rare: true },
    { id: "hero-mask", name: "Mặt nạ anh hùng", emoji: "🎭", cost: 8, who: "gin", group: "Anh hùng" },
    { id: "hero-cape", name: "Áo choàng", emoji: "🦸", cost: 16, who: "gin", group: "Anh hùng" },
    { id: "hero-bolt", name: "Tia sét vàng", emoji: "⚡", cost: 28, who: "gin", group: "Anh hùng", rare: true },
    { id: "puppy-sit", name: "Cún Vàng ngồi", emoji: "🐶", cost: 8, who: "both", group: "Cún Vàng" },
    { id: "puppy-heart", name: "Cún Vàng và tim", emoji: "💛", cost: 16, who: "both", group: "Cún Vàng" },
    { id: "puppy-gold", name: "Cún Vàng hiếm", emoji: "🌟", cost: 28, who: "both", group: "Cún Vàng", rare: true }
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
    var owned = read()[child].owned.length;
    return el("button", { class: "week-card sticker-card", "data-go": "#/stickers/" + child }, [
      el("span", { class: "pay-badge", text: "Mới" }),
      el("h2", { text: "Album sticker ⭐" }),
      el("p", { text: "Đổi được " + spendable(child) + " sao · đã có " + owned + " sticker" })
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
    root.appendChild(el("p", { class: "lede", text: "Dùng sao em kiếm tuần này để đổi sticker." }));
    var grid = el("div", { class: "sticker-grid" });
    visible(child).forEach(function (sticker) {
      var has = data.owned.indexOf(sticker.id) >= 0;
      var afford = spendable(child) >= sticker.cost;
      var cell = el("article", { class: "sticker" + (has ? " is-owned" : "") + (sticker.rare ? " is-rare" : "") });
      cell.appendChild(el("span", { class: "sticker-emoji", text: sticker.emoji }));
      cell.appendChild(el("strong", { text: sticker.name }));
      cell.appendChild(el("p", { text: sticker.group + (sticker.rare ? " · hiếm" : "") }));
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
