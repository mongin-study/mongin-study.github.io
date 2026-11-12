(function (HV) {
  "use strict";

  var U = HV.util;
  var el = U.el;
  var session = null;
  var epoch = 0;
  var SVGNS = "http://www.w3.org/2000/svg";

  /* Solved silhouettes. Each piece is a square, a right isosceles triangle,
     or a parallelogram. Local rotation 0 is the solved pose. */
  function P(kind, pts) { return { kind: kind, pts: pts }; }

  var MON = [
    {
      id: "star",
      title: "Ngôi sao",
      speak: "Ngôi sao.",
      pieces: [
        P("sq", [[122, 108], [198, 108], [198, 184], [122, 184]]),
        P("tri", [[122, 108], [198, 108], [160, 70]]),
        P("tri", [[122, 184], [198, 184], [160, 222]]),
        P("tri", [[198, 108], [198, 184], [236, 146]]),
        P("tri", [[122, 108], [122, 184], [84, 146]])
      ]
    },
    {
      id: "crown",
      title: "Vương miện",
      speak: "Vương miện.",
      pieces: [
        P("sq", [[42, 156], [110, 156], [110, 224], [42, 224]]),
        P("sq", [[110, 156], [178, 156], [178, 224], [110, 224]]),
        P("sq", [[178, 156], [246, 156], [246, 224], [178, 224]]),
        P("tri", [[42, 156], [110, 156], [76, 122]]),
        P("tri", [[110, 156], [178, 156], [144, 122]]),
        P("tri", [[178, 156], [246, 156], [212, 122]])
      ]
    },
    {
      id: "castle",
      title: "Lâu đài của Elsa",
      speak: "Lâu đài của Elsa.",
      pieces: [
        P("sq", [[34, 118], [106, 118], [106, 190], [34, 190]]),
        P("sq", [[106, 78], [178, 78], [178, 150], [106, 150]]),
        P("sq", [[178, 118], [250, 118], [250, 190], [178, 190]]),
        P("tri", [[34, 118], [106, 118], [70, 82]]),
        P("tri", [[106, 78], [178, 78], [142, 42]]),
        P("tri", [[178, 118], [250, 118], [214, 82]])
      ]
    },
    {
      id: "heart",
      title: "Trái tim",
      speak: "Trái tim.",
      pieces: [
        P("tri", [[70, 150], [160, 150], [115, 105]]),
        P("tri", [[160, 150], [250, 150], [205, 105]]),
        P("tri", [[70, 150], [250, 150], [160, 240]])
      ]
    },
    {
      id: "snow",
      title: "Bông tuyết",
      speak: "Bông tuyết.",
      pieces: [
        P("sq", [[128, 108], [192, 108], [192, 172], [128, 172]]),
        P("sq", [[128, 44], [192, 44], [192, 108], [128, 108]]),
        P("sq", [[128, 172], [192, 172], [192, 236], [128, 236]]),
        P("sq", [[64, 108], [128, 108], [128, 172], [64, 172]]),
        P("sq", [[192, 108], [256, 108], [256, 172], [192, 172]])
      ]
    },
    {
      id: "tower",
      title: "Tháp của Rapunzel",
      speak: "Tháp của Rapunzel.",
      pieces: [
        P("sq", [[128, 150], [200, 150], [200, 222], [128, 222]]),
        P("sq", [[128, 78], [200, 78], [200, 150], [128, 150]]),
        P("tri", [[128, 78], [200, 78], [164, 42]]),
        P("para", [[200, 88], [200, 132], [276, 116], [276, 72]])
      ]
    },
    {
      id: "boat",
      title: "Thuyền băng",
      speak: "Thuyền băng.",
      pieces: [
        P("tri", [[60, 168], [260, 168], [160, 268]]),
        P("tri", [[90, 168], [160, 168], [160, 98]]),
        P("tri", [[160, 108], [160, 168], [220, 168]]),
        P("para", [[160, 90], [160, 126], [236, 110], [236, 74]])
      ]
    },
    {
      id: "pom",
      title: "Pom",
      speak: "Xếp hình Pom.",
      pieces: [
        P("sq", [[108, 156], [204, 156], [204, 252], [108, 252]]),
        P("sq", [[136, 92], [200, 92], [200, 156], [136, 156]]),
        P("tri", [[148, 92], [188, 92], [148, 52]]),
        P("tri", [[136, 100], [136, 148], [88, 100]]),
        P("para", [[204, 176], [204, 224], [286, 204], [286, 156]])
      ]
    },
    {
      id: "butterfly",
      title: "Con bướm",
      speak: "Con bướm.",
      pieces: [
        P("sq", [[132, 96], [188, 96], [188, 152], [132, 152]]),
        P("sq", [[132, 152], [188, 152], [188, 208], [132, 208]]),
        P("tri", [[132, 96], [132, 152], [76, 96]]),
        P("tri", [[188, 96], [244, 96], [188, 152]]),
        P("tri", [[132, 152], [132, 208], [76, 208]]),
        P("tri", [[188, 152], [188, 208], [244, 208]])
      ]
    },
    {
      id: "unicorn",
      title: "Kỳ lân",
      speak: "Kỳ lân.",
      pieces: [
        P("sq", [[78, 150], [158, 150], [158, 230], [78, 230]]),
        P("sq", [[158, 150], [238, 150], [238, 230], [158, 230]]),
        P("sq", [[174, 86], [238, 86], [238, 150], [174, 150]]),
        P("tri", [[186, 86], [226, 86], [226, 46]]),
        P("para", [[78, 164], [78, 212], [8, 196], [8, 148]])
      ]
    }
  ];

  var GIN = [
    {
      id: "shield",
      title: "Cái khiên",
      speak: "Cái khiên.",
      easy: true,
      pieces: [
        P("tri", [[70, 60], [230, 60], [70, 220]]),
        P("tri", [[230, 60], [230, 220], [70, 220]])
      ]
    },
    {
      id: "house",
      title: "Cái nhà",
      speak: "Cái nhà.",
      pieces: [
        P("sq", [[95, 118], [225, 118], [225, 248], [95, 248]]),
        P("tri", [[95, 118], [225, 118], [160, 53]])
      ]
    },
    {
      id: "rocket",
      title: "Tên lửa",
      speak: "Tên lửa.",
      pieces: [
        P("sq", [[100, 128], [210, 128], [210, 238], [100, 238]]),
        P("tri", [[100, 128], [210, 128], [155, 73]]),
        P("tri", [[210, 168], [210, 238], [280, 238]])
      ]
    },
    {
      id: "hero",
      title: "Siêu anh hùng",
      speak: "Siêu anh hùng.",
      pieces: [
        P("sq", [[118, 108], [228, 108], [228, 218], [118, 218]]),
        P("tri", [[118, 108], [118, 208], [18, 108]]),
        P("tri", [[148, 108], [208, 108], [178, 78]])
      ]
    }
  ];

  function rotPt(p, deg) {
    var r = deg * Math.PI / 180;
    var c = Math.cos(r);
    var s = Math.sin(r);
    return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
  }

  function centroid(pts) {
    var x = 0;
    var y = 0;
    pts.forEach(function (p) { x += p[0]; y += p[1]; });
    return [x / pts.length, y / pts.length];
  }

  function centerPts(pts) {
    var c = centroid(pts);
    return pts.map(function (p) { return [p[0] - c[0], p[1] - c[1]]; });
  }

  function boundsOf(pts) {
    var minX = 1e9;
    var maxX = -1e9;
    var minY = 1e9;
    var maxY = -1e9;
    pts.forEach(function (p) {
      if (p[0] < minX) minX = p[0];
      if (p[0] > maxX) maxX = p[0];
      if (p[1] < minY) minY = p[1];
      if (p[1] > maxY) maxY = p[1];
    });
    return { minX: minX, maxX: maxX, minY: minY, maxY: maxY };
  }

  function worldPts(local, x, y, rot) {
    return local.map(function (p) {
      var q = rotPt(p, rot || 0);
      return [q[0] + x, q[1] + y];
    });
  }

  function ptsAttr(pts) {
    return pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ");
  }

  function svgEl(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (attrs[k] == null) return;
        n.setAttribute(k, String(attrs[k]));
      });
    }
    return n;
  }

  function dist(a, b) {
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
  }

function snapTol(local) {
  var b = boundsOf(local);
  var diag = Math.hypot(b.maxX - b.minX, b.maxY - b.minY);
  return Math.max(14, Math.min(28, diag * 0.15));
}

function shapeNear(piecePts, slotPts, tol) {
  if (piecePts.length !== slotPts.length) return false;
  var c1 = centroid(piecePts);
  var c2 = centroid(slotPts);
  if (dist(c1, c2) > tol) return false;
  for (var i = 0; i < slotPts.length; i++) {
    var ok = false;
    for (var j = 0; j < piecePts.length; j++) {
      if (dist(slotPts[i], piecePts[j]) <= tol) { ok = true; break; }
    }
    if (!ok) return false;
  }
  return true;
}

  function palette(child) {
    return child === "gin"
      ? ["#ff9a3c", "#ef4444", "#f6d56a", "#60a5fa", "#fb7185"]
      : ["#7ec8e3", "#3d93d8", "#f2c14e", "#fb7185", "#c4b5fd", "#86efac", "#93c5fd", "#f6d56a"];
  }

  function kindLabel(kind) {
    if (kind === "sq") return "Hình vuông";
    if (kind === "para") return "Hình bình hành";
    return "Hình tam giác";
  }

  function puzzlesFor(child) {
    return child === "gin" ? GIN : MON;
  }

  function onHash() {
    return (location.hash || "").indexOf("#/tangram/") === 0;
  }

  function say(text, chain) {
    if (!text || !HV.speech) return Promise.resolve(0);
    var job = HV.speech.speak(text, { lang: "vi", chain: !!chain });
    return Promise.resolve(job).then(function (sec) {
      return typeof sec === "number" && sec > 0 ? sec : 0.8;
    }).catch(function () { return 0.8; });
  }

  function roundStars(child, first, total) {
    var base = 0;
    if (total && first > 0) {
      var ratio = first / total;
      base = ratio >= 0.999 ? 3 : ratio >= 0.6 ? 2 : 1;
    }
    if (child !== "mon") {
      var easy = total && first >= total ? 1 : 0;
      return {
        stars: easy,
        note: easy ? "Bài dễ chỉ được 1 sao khi đúng hết cả bài." : "Bài dễ cần đúng hết mới có 1 sao."
      };
    }
    return {
      stars: base * 2,
      note: base ? "Nhiều sao ×2 vì bài này khó hơn." : ""
    };
  }

  function detach() {
    if (session && session.detach) {
      session.detach();
      session.detach = null;
    }
  }

function leave(hash) {
  detach();
  epoch += 1;
  session = null;
  if (hash) location.hash = hash;
}

  function spinFor(kind, spec, index, child) {
    if (spec.easy) return 0;
    if (child === "gin") {
      if (kind === "sq") return 0;
      return 315;
    }
    if (kind === "sq") return 45;
    if (kind === "para") return 90;
    return 270;
  }

  function loadPuzzle() {
    var spec = session.list[session.index];
    var colors = palette(session.child);
    var slots = spec.pieces.map(function (piece, i) {
      var c = centroid(piece.pts);
      return {
        id: "s" + i,
        kind: piece.kind,
        local: centerPts(piece.pts),
        x: c[0],
        y: c[1],
        abs: piece.pts,
        filled: false
      };
    });
    var pieces = slots.map(function (slot, i) {
      return {
        id: "p" + i,
        kind: slot.kind,
        local: slot.local,
        x: 0,
        y: 0,
        rot: spinFor(slot.kind, spec, i, session.child),
        locked: false,
        color: colors[i % colors.length],
        selected: i === 0
      };
    });
    var board = boundsOf(spec.pieces.reduce(function (all, piece) {
      return all.concat(piece.pts);
    }, []));
    var trayTop = Math.max(board.maxY + 22, 250);
    var gap = 12;
    var maxW = 304;
    var x = 12;
    var y = trayTop;
    var rowH = 0;
    pieces.forEach(function (piece) {
      var b = boundsOf(piece.local);
      var w = b.maxX - b.minX;
      var h = b.maxY - b.minY;
      var cell = Math.sqrt(w * w + h * h) + 8;
      if (x > 12 && x + cell > maxW) {
        x = 12;
        y += rowH + gap;
        rowH = 0;
      }
      piece.x = x + cell / 2;
      piece.y = y + cell / 2;
      piece.homeX = piece.x;
      piece.homeY = piece.y;
      x += cell + 8;
      rowH = Math.max(rowH, cell);
    });
    session.puzzle = spec;
    session.slots = slots;
    session.pieces = pieces;
    session.trayTop = trayTop;
    session.viewH = Math.ceil(y + rowH + 14);
    session.puzzleMiss = false;
    session.hinted = false;
    session.banner = "";
    session.advancing = false;
  }

  function begin(child) {
    detach();
    epoch += 1;
    session = {
      child: child,
      list: puzzlesFor(child),
      index: 0,
      firsts: 0,
      phase: "play",
      detach: null
    };
    loadPuzzle();
    if (HV.engine && HV.engine.beginSessionPraise) HV.engine.beginSessionPraise();
    say("Xếp các miếng vào khung.").then(function () {
      if (!session || session.child !== child) return;
      return say(session.puzzle.speak, true);
    });
  }

  function pieceById(id) {
    for (var i = 0; i < session.pieces.length; i++) {
      if (session.pieces[i].id === id) return session.pieces[i];
    }
    return null;
  }

  function selectedPiece() {
    for (var i = 0; i < session.pieces.length; i++) {
      if (session.pieces[i].selected && !session.pieces[i].locked) return session.pieces[i];
    }
    for (var j = 0; j < session.pieces.length; j++) {
      if (!session.pieces[j].locked) return session.pieces[j];
    }
    return null;
  }

  function trySnap(piece) {
    if (!piece || piece.locked || (session && session.advancing)) return null;
    var pts = worldPts(piece.local, piece.x, piece.y, piece.rot);
    var best = null;
    var bestD = 1e9;
    session.slots.forEach(function (slot) {
      if (slot.filled) return;
      var slotPts = worldPts(slot.local, slot.x, slot.y, 0);
      if (!shapeNear(pts, slotPts, snapTol(slot.local))) return;
      var d = dist(centroid(pts), [slot.x, slot.y]);
      if (d < bestD) { best = slot; bestD = d; }
    });
    if (!best) return null;
    var c = centroid(pts);
    piece.x += best.x - c[0];
    piece.y += best.y - c[1];
    piece.locked = true;
    piece.selected = false;
    best.filled = true;
    return best;
  }

  function allLocked() {
    return session.pieces.every(function (p) { return p.locked; });
  }

  function paintPiece(piece) {
    var attr = ptsAttr(worldPts(piece.local, piece.x, piece.y, piece.rot));
    document.querySelectorAll('[data-piece="' + piece.id + '"] polygon').forEach(function (node) {
      node.setAttribute("points", attr);
    });
    var ring = document.querySelector('[data-ring="' + piece.id + '"]');
    if (ring) ring.setAttribute("points", attr);
  }

  function afterSound(play, then) {
    var dur = 0;
    try { dur = play ? play() || 0 : 0; } catch (e) { dur = 0; }
    var e = epoch;
    setTimeout(function () {
      if (e !== epoch || !onHash()) return;
      then();
    }, Math.round(dur * 1000) + 40);
  }

  function praiseThen(then) {
    var voice = HV.engine && HV.engine.shouldVoicePraise && HV.engine.shouldVoicePraise();
    var line = voice && HV.engine.praise ? HV.engine.praise(session.child, "vi") : "";
    session.banner = line || "Đúng hình rồi!";
    if (HV.ui && HV.ui.render) HV.ui.render();
    var job = line ? say(line) : Promise.resolve(0.25);
    var e = epoch;
    job.then(function (sec) {
      if (e !== epoch || !onHash()) return;
      setTimeout(function () {
        if (e !== epoch || !onHash()) return;
        then();
      }, Math.max(420, Math.round((sec || 0.2) * 1000) + 220));
    });
  }

  function finishPuzzle() {
    if (session.advancing) return;
    session.advancing = true;
    if (!session.puzzleMiss) session.firsts += 1;
    var last = session.index >= session.list.length - 1;
    afterSound(HV.audio && HV.audio.correct, function () {
      praiseThen(function () {
        if (!session) return;
        if (last) {
          session.phase = "done";
          session.award = roundStars(session.child, session.firsts, session.list.length);
          if (HV.storage && HV.storage.markPlayed) HV.storage.markPlayed(session.child, "tangram");
          if (HV.audio && HV.audio.fanfare) HV.audio.fanfare();
          if (HV.ui && HV.ui.render) HV.ui.render();
          return;
        }
        session.index += 1;
        loadPuzzle();
        if (HV.ui && HV.ui.render) HV.ui.render();
        say(session.puzzle.speak);
      });
    });
  }

  function onPlaced(piece, moved) {
    var snapped = trySnap(piece);
    if (snapped) {
      if (allLocked()) {
        if (HV.ui && HV.ui.render) HV.ui.render();
        finishPuzzle();
      } else if (HV.audio) {
        HV.audio.correct();
        if (HV.ui && HV.ui.render) HV.ui.render();
      } else if (HV.ui && HV.ui.render) HV.ui.render();
      return;
    }
    if (moved && piece.y < session.trayTop - 6) {
      session.puzzleMiss = true;
      if (!session.hinted) {
        session.hinted = true;
        session.banner = "Xoay miếng cho khớp khung nhé.";
        say(session.banner);
        if (HV.ui && HV.ui.render) return;
      }
    }
    paintPiece(piece);
  }

  function rotatePiece(piece) {
    if (!piece || piece.locked || session.advancing) return;
    piece.selected = true;
    session.pieces.forEach(function (p) { p.selected = p.id === piece.id; });
    piece.rot = (piece.rot + 45) % 360;
    if (HV.audio && HV.audio.tap) HV.audio.tap();
    onPlaced(piece, false);
  }

  function clientPoint(svg, x, y) {
    var pt = svg.createSVGPoint();
    pt.x = x;
    pt.y = y;
    var m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    var p = pt.matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }

  function boardView() {
    var child = session.child;
    var spec = session.puzzle;
    var root = el("section", { class: "play stage tan-play", "data-activity": "tangram", "data-puzzle": spec.id });
    root.appendChild(el("header", { class: "topbar" }, [
      el("button", {
        class: "icon-btn",
        text: "←",
        "aria-label": "Quay lại",
        onClick: function () { leave("#/c/" + child); }
      }),
      el("div", { class: "top-title" }, [
        el("strong", { text: "Xếp hình" }),
        el("span", { text: "Hình " + (session.index + 1) + "/" + session.list.length })
      ]),
      el("button", {
        class: "icon-btn speak-btn",
        text: "🗣️",
        "aria-label": "Nghe lại",
        onClick: function () { say(spec.speak); }
      })
    ]));
    root.appendChild(el("p", { class: "tan-goal", text: spec.title }));
    if (session.banner) root.appendChild(el("p", { class: "tan-banner", role: "status", text: session.banner }));

    var wrap = el("div", { class: "tan-board" });
    var svg = svgEl("svg", {
      class: "tan-svg",
      viewBox: "0 0 320 " + session.viewH,
      role: "img",
      "aria-label": spec.title
    });
    svg.appendChild(svgEl("rect", {
      x: 8, y: 8, width: 304, height: Math.max(40, session.trayTop - 16),
      rx: 22, fill: "#f8fbff", stroke: "#d5e2f2", "stroke-width": 2
    }));
    session.slots.forEach(function (slot) {
      var ghost = svgEl("polygon", {
        points: ptsAttr(slot.abs),
        "data-slot": slot.id,
        "data-x": slot.x.toFixed(1),
        "data-y": slot.y.toFixed(1),
        fill: child === "gin" ? "rgba(255, 183, 3, 0.28)" : "rgba(47, 126, 184, 0.16)",
        stroke: child === "gin" ? "#c2410c" : "#1d4e89",
        "stroke-width": child === "gin" ? 3 : 1.6,
        "stroke-opacity": child === "gin" ? 0.9 : 0.45,
        "stroke-linejoin": "round",
        "pointer-events": "none"
      });
      svg.appendChild(ghost);
    });
    svg.appendChild(svgEl("rect", {
      x: 8,
      y: session.trayTop - 6,
      width: 304,
      height: Math.max(36, session.viewH - session.trayTop),
      rx: 22,
      fill: "#fffdf8",
      stroke: "#e4dccb",
      "stroke-dasharray": "7 6",
      "stroke-width": 2
    }));
    session.pieces.forEach(function (piece) {
      var pts = ptsAttr(worldPts(piece.local, piece.x, piece.y, piece.rot));
      var g = svgEl("g", {
        "data-piece": piece.id,
        "data-rot": String(piece.rot),
        "data-locked": piece.locked ? "1" : "0",
        role: "button",
        "aria-label": kindLabel(piece.kind)
      });
      g.appendChild(svgEl("polygon", {
        points: pts,
        fill: "transparent",
        stroke: "transparent",
        "stroke-width": 22,
        "stroke-linejoin": "round"
      }));
      g.appendChild(svgEl("polygon", {
        points: pts,
        fill: piece.color,
        stroke: "#1d4e89",
        "stroke-width": piece.locked ? 2.4 : 2,
        "stroke-linejoin": "round",
        "pointer-events": "none",
        opacity: piece.locked ? "1" : "0.96"
      }));
      if (piece.selected && !piece.locked) {
        g.appendChild(svgEl("polygon", {
          points: pts,
          "data-ring": piece.id,
          fill: "none",
          stroke: "#1d4e89",
          "stroke-width": 3,
          "stroke-dasharray": "7 5",
          "pointer-events": "none"
        }));
      }
      svg.appendChild(g);
    });
    wrap.appendChild(svg);
    root.appendChild(wrap);
    root.appendChild(el("button", {
      class: "tan-rotate",
      text: "Xoay ↻",
      "aria-label": "Xoay miếng",
      onClick: function () { rotatePiece(selectedPiece()); }
    }));

    var drag = null;
    function idFrom(node) {
      while (node && node !== svg) {
        if (node.getAttribute && node.getAttribute("data-piece")) return node.getAttribute("data-piece");
        node = node.parentNode;
      }
      return "";
    }
    function down(e) {
      if (!session || session.phase !== "play") return;
      if (e.button != null && e.button !== 0) return;
      var id = idFrom(e.target);
      if (!id) return;
      var piece = pieceById(id);
      if (!piece || piece.locked) return;
      e.preventDefault();
      var p = clientPoint(svg, e.clientX, e.clientY);
      session.pieces.forEach(function (item) { item.selected = item.id === id; });
      drag = { id: id, dx: piece.x - p.x, dy: piece.y - p.y, moved: false, pointer: e.pointerId };
      svg.appendChild(pieceGroup(id));
      try { svg.setPointerCapture(e.pointerId); } catch (err) {}
    }
    function pieceGroup(id) {
      return svg.querySelector('[data-piece="' + id + '"]');
    }
    function move(e) {
      if (!drag || !session || e.pointerId !== drag.pointer) return;
      var piece = pieceById(drag.id);
      if (!piece || piece.locked) return;
      var p = clientPoint(svg, e.clientX, e.clientY);
      var nx = p.x + drag.dx;
      var ny = p.y + drag.dy;
      if (Math.hypot(nx - piece.x, ny - piece.y) > 4) drag.moved = true;
      piece.x = Math.max(6, Math.min(314, nx));
      piece.y = Math.max(6, Math.min(session.viewH - 6, ny));
      paintPiece(piece);
    }
    function up(e) {
      if (!drag || (e && e.pointerId != null && e.pointerId !== drag.pointer)) return;
      var piece = pieceById(drag.id);
      var moved = drag.moved;
      drag = null;
      if (!piece || !session) return;
      if (!moved) {
        rotatePiece(piece);
        return;
      }
      onPlaced(piece, true);
    }
    svg.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    session.detach = function () {
      svg.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    return root;
  }

  function doneView() {
    var child = session.child;
    var award = session.award || roundStars(child, session.firsts, session.list.length);
    var root = el("section", { class: "play", "data-activity": "tangram", "data-phase": "done" });
    root.appendChild(el("header", { class: "topbar" }, [
      el("button", { class: "icon-btn", text: "←", "aria-label": "Quay lại", onClick: function () { leave("#/c/" + child); } }),
      el("div", { class: "top-title" }, [el("strong", { text: "Xong bài rồi" })])
    ]));
    var frame = el("div", { class: "result-photo is-" + child });
    frame.appendChild(el("span", { class: "spark spark-a", text: "✦" }));
    frame.appendChild(el("img", { class: "avatar", src: "assets/kids/" + child + ".webp", alt: "" }));
    frame.appendChild(el("span", { class: child === "gin" ? "deco-cape" : "deco-crown", text: child === "gin" ? "🦸" : "👑" }));
    var cast = el("div", { class: "result-art" });
    cast.appendChild(frame);
    if (HV.art) cast.appendChild(child === "mon" ? HV.art.puppy() : HV.art.car());
    root.appendChild(cast);
    root.appendChild(el("p", { class: "result-stars", text: U.starText(award.stars) }));
    root.appendChild(el("p", { class: "lede", text: "Đúng lần đầu " + session.firsts + "/" + session.list.length + " hình." }));
    if (award.note) root.appendChild(el("p", { class: "lede", text: award.note }));
    root.appendChild(el("p", { class: "fine", text: "Sao của bài chơi, không cộng vào sổ." }));
    root.appendChild(el("div", { class: "result-actions" }, [
      el("button", { class: "btn btn-primary", text: "Chơi lại", onClick: function () {
        var who = child;
        detach();
        epoch += 1;
        session = null;
        begin(who);
        if (HV.ui && HV.ui.render) HV.ui.render();
      } }),
      el("button", { class: "btn", text: "Về nhà", onClick: function () { leave("#/c/" + child); } })
    ]));
    return root;
  }

  function view(child) {
    detach();
    if (session && session.child !== child) {
      epoch += 1;
      session = null;
    }
    if (!session) begin(child);
    if (session.phase === "done") return doneView();
    return boardView();
  }

  function playedMark(child) {
    return HV.fresh && HV.fresh.done(child, "tangram");
  }

  function card(child) {
    var played = playedMark(child);
    return el("button", {
      class: "week-card tan-entry" + (played ? " is-played" : " is-new"),
      "data-go": "#/tangram/" + child,
      "data-state": played ? "played" : "new"
    }, [
      el("span", { class: "ex-icon act-icon", "aria-hidden": "true", text: "🧩" }),
      played ? null : el("span", { class: "pay-badge", text: "Mới" }),
      el("h2", { text: "Xếp hình vào khung" }),
      el("p", { text: child === "gin" ? "2–3 miếng to · nhà, khiên, tên lửa" : "Lâu đài, tháp, Pom · 10 hình" })
    ]);
  }

  function lesson(child) {
    var played = playedMark(child);
    return el("button", {
      class: "ex-card" + (played ? " is-played" : " is-new"),
      "data-go": "#/tangram/" + child,
      "data-state": played ? "played" : "new"
    }, [
      el("span", { class: "ex-icon", text: "🧩" }),
      el("span", { class: "ex-copy" }, [
        el("strong", { text: "Xếp hình vào khung" }),
        el("small", { text: child === "gin" ? "Miếng to, xếp vào khung" : "Tam giác, vuông, bình hành" })
      ])
    ]);
  }

  function sideVectors(pts) {
    var sides = [];
    for (var k = 0; k < pts.length; k++) {
      var p = pts[k];
      var q = pts[(k + 1) % pts.length];
      sides.push([q[0] - p[0], q[1] - p[1]]);
    }
    return sides;
  }

  function classify(pts) {
    if (pts.length === 3) {
      for (var i = 0; i < 3; i++) {
        var a = pts[i];
        var b = pts[(i + 1) % 3];
        var c = pts[(i + 2) % 3];
        var abx = b[0] - a[0];
        var aby = b[1] - a[1];
        var acx = c[0] - a[0];
        var acy = c[1] - a[1];
        var lab = Math.hypot(abx, aby);
        var lac = Math.hypot(acx, acy);
        if (Math.abs(abx * acx + aby * acy) < 2 && Math.abs(lab - lac) < 2 && lab > 24) return "tri";
      }
      return "bad-tri";
    }
    if (pts.length === 4) {
      var sides = sideVectors(pts);
      function vneg(u, v) {
        return Math.abs(u[0] + v[0]) < 2 && Math.abs(u[1] + v[1]) < 2;
      }
      if (!vneg(sides[0], sides[2]) || !vneg(sides[1], sides[3])) return "bad-quad";
      var l0 = Math.hypot(sides[0][0], sides[0][1]);
      var l1 = Math.hypot(sides[1][0], sides[1][1]);
      var perp = Math.abs(sides[0][0] * sides[1][0] + sides[0][1] * sides[1][1]) < 2;
      if (perp && Math.abs(l0 - l1) < 2) return "sq";
      if (l0 > 16 && l1 > 16) return "para";
      return "bad-quad";
    }
    return "bad";
  }

  function pip(pt, poly) {
    var inside = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0];
      var yi = poly[i][1];
      var xj = poly[j][0];
      var yj = poly[j][1];
      var hit = ((yi > pt[1]) !== (yj > pt[1])) &&
        (pt[0] < (xj - xi) * (pt[1] - yi) / ((yj - yi) || 1e-9) + xi);
      if (hit) inside = !inside;
    }
    return inside;
  }

  function overlapRatio(pieces) {
    var box = boundsOf(pieces.reduce(function (all, piece) { return all.concat(piece.pts); }, []));
    var step = 2;
    var overlap = 0;
    var total = 0;
    for (var y = box.minY + step / 2; y < box.maxY; y += step) {
      for (var x = box.minX + step / 2; x < box.maxX; x += step) {
        var n = 0;
        for (var i = 0; i < pieces.length; i++) if (pip([x, y], pieces[i].pts)) n += 1;
        if (n) total += 1;
        if (n > 1) overlap += 1;
      }
    }
    return total ? overlap / total : 0;
  }

  function audit() {
    var problems = [];
    if (MON.length !== 10) problems.push("mon count " + MON.length);
    if (GIN.length !== 4) problems.push("gin count " + GIN.length);
    function check(list, child) {
      list.forEach(function (spec) {
        var n = spec.pieces.length;
        if (child === "gin" && (n < 2 || n > 3)) problems.push(spec.id + " pieces " + n);
        if (child === "mon" && (n < 3 || n > 6)) problems.push(spec.id + " pieces " + n);
        spec.pieces.forEach(function (piece, index) {
          var got = classify(piece.pts);
          if (got !== piece.kind) problems.push(spec.id + " #" + index + " " + piece.kind + " -> " + got);
          piece.pts.forEach(function (p) {
            if (p[0] < 4 || p[0] > 316 || p[1] < 4 || p[1] > 300) {
              problems.push(spec.id + " #" + index + " out " + p.join(","));
            }
          });
        });
        var ratio = overlapRatio(spec.pieces);
        if (ratio > 0.02) problems.push(spec.id + " overlap " + ratio.toFixed(3));
        spec.pieces.forEach(function (piece, index) {
          var c = centroid(piece.pts);
          var local = centerPts(piece.pts);
          var tol = snapTol(local);
          function fits(rot) {
            return shapeNear(worldPts(local, c[0], c[1], rot), piece.pts, tol);
          }
          if (!fits(0)) problems.push(spec.id + " #" + index + " rot0 miss");
          if (fits(45)) problems.push(spec.id + " #" + index + " rot45 false");
          if (piece.kind === "sq" && !fits(90)) problems.push(spec.id + " #" + index + " sq90");
          if (piece.kind === "tri" && fits(90)) problems.push(spec.id + " #" + index + " tri90 false");
          if (piece.kind === "para" && (fits(90) || !fits(180))) problems.push(spec.id + " #" + index + " para turn");
        });
      });
    }
    check(MON, "mon");
    check(GIN, "gin");
    return problems;
  }

  HV.tangram = {
    card: card,
    lesson: lesson,
    view: view,
    audit: audit,
    puzzles: { mon: MON, gin: GIN }
  };
})(globalThis.HV = globalThis.HV || {});
