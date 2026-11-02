(function (HV) {
  "use strict";

  function inline(svgText, className) {
    var wrap = document.createElement("div");
    wrap.className = "illu " + (className || "");
    wrap.innerHTML = svgText;
    var svg = wrap.querySelector("svg");
    if (svg) {
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
    }
    return wrap;
  }

  function princess() {
    return inline(
      '<svg viewBox="0 0 200 250">' +
        '<path d="M58 150c-22 20-28 62-16 84 18-16 28-16 36-8" fill="#b9ddfb"/>' +
        '<path d="M142 150c22 20 28 62 16 84-18-16-28-16-36-8" fill="#b9ddfb"/>' +
        '<path d="M62 146c8-8 68-8 76 0l22 86c-18 16-102 16-120 0z" fill="#3d93d8"/>' +
        '<path d="M86 156c8 18 20 18 28 0v70c-8 6-20 6-28 0z" fill="#f4fbff"/>' +
        '<circle cx="78" cy="188" r="4" fill="#fff"/>' +
        '<circle cx="122" cy="196" r="3.5" fill="#fff"/>' +
        '<path d="M100 176l4 6 7 .6-5.2 4.4 1.6 6.6L100 190l-7.4 3.6 1.6-6.6-5.2-4.4 7-.6z" fill="#f2c14e"/>' +
        '<circle cx="100" cy="108" r="34" fill="#ffd8bf"/>' +
        '<path d="M66 112c2-36 22-58 34-58s32 22 34 58c-10-16-22-20-34-20s-24 4-34 20z" fill="#e7f4ff"/>' +
        '<ellipse cx="64" cy="96" rx="16" ry="18" fill="#d5ecff"/>' +
        '<ellipse cx="138" cy="100" rx="15" ry="16" fill="#d5ecff"/>' +
        '<ellipse cx="86" cy="110" rx="5" ry="6.5" fill="#1d4e89"/>' +
        '<ellipse cx="116" cy="110" rx="5" ry="6.5" fill="#1d4e89"/>' +
        '<circle cx="88" cy="108" r="1.7" fill="#fff"/>' +
        '<circle cx="118" cy="108" r="1.7" fill="#fff"/>' +
        '<path d="M90 124q10 9 20 0" fill="none" stroke="#d07a8a" stroke-width="2.4" stroke-linecap="round"/>' +
        '<ellipse cx="74" cy="120" rx="6" ry="3.2" fill="#ffb4c4" opacity=".85"/>' +
        '<ellipse cx="126" cy="120" rx="6" ry="3.2" fill="#ffb4c4" opacity=".85"/>' +
        '<path d="M78 84l8-24 14 16 12-20 8 28z" fill="#f6d56a" stroke="#e0b03a" stroke-width="2" stroke-linejoin="round"/>' +
        '<circle cx="100" cy="74" r="4" fill="#7ec8e3"/>' +
      "</svg>",
      "illu-princess"
    );
  }

  function puppy() {
    return inline(
      '<svg viewBox="0 0 190 160">' +
        '<g class="pup-hearts">' +
          '<path class="pup-heart" d="M48 36c-3.2-5-12-3.2-12 3.4 0 5 12 12 12 12s12-7 12-12c0-6.6-8.8-8.4-12-3.4z"/>' +
          '<path class="pup-heart" d="M86 22c-2.6-4-9.4-2.4-9.4 2.8 0 4 9.4 9.6 9.4 9.6s9.4-5.6 9.4-9.6c0-5.2-6.8-6.8-9.4-2.8z"/>' +
        "</g>" +
        '<g class="pup-hop">' +
          '<path class="pup-tail" d="M148 96q28-10 22-36" fill="none" stroke="#e0a04a" stroke-width="10" stroke-linecap="round"/>' +
          '<ellipse cx="104" cy="100" rx="50" ry="32" fill="#f0b429"/>' +
          '<ellipse cx="108" cy="110" rx="24" ry="16" fill="#ffe3b0"/>' +
          '<rect x="70" y="112" width="16" height="26" rx="8" fill="#e09a2e"/>' +
          '<rect x="118" y="112" width="16" height="26" rx="8" fill="#e09a2e"/>' +
          '<circle cx="52" cy="78" r="32" fill="#f2c14e"/>' +
          '<g class="pup-ear pup-ear-l"><ellipse cx="26" cy="74" rx="14" ry="22" fill="#d8922c" transform="rotate(-18 26 74)"/></g>' +
          '<g class="pup-ear pup-ear-r"><ellipse cx="74" cy="58" rx="12" ry="20" fill="#d8922c" transform="rotate(18 74 58)"/></g>' +
          '<ellipse cx="34" cy="90" rx="16" ry="12" fill="#ffe7b8"/>' +
          '<ellipse cx="24" cy="88" rx="5" ry="3.6" fill="#3a2a22"/>' +
          '<circle cx="44" cy="70" r="4.2" fill="#2b2118"/>' +
          '<circle cx="62" cy="68" r="4.2" fill="#2b2118"/>' +
          '<circle cx="45.4" cy="68.4" r="1.4" fill="#fff"/>' +
          '<circle cx="63.4" cy="66.4" r="1.4" fill="#fff"/>' +
          '<path d="M30 98q6 12 12 0" fill="#ff8fa3"/>' +
        "</g>" +
      "</svg>",
      "illu-puppy"
    );
  }

  function tiger() {
    return inline(
      '<svg viewBox="0 0 180 160">' +
        '<ellipse cx="90" cy="118" rx="48" ry="28" fill="#ff9a3c"/>' +
        '<circle cx="90" cy="72" r="40" fill="#ffb15a"/>' +
        '<circle cx="48" cy="78" r="16" fill="#ffb15a"/>' +
        '<circle cx="132" cy="78" r="16" fill="#ffb15a"/>' +
        '<ellipse cx="90" cy="86" rx="18" ry="14" fill="#ffe0bf"/>' +
        '<circle cx="74" cy="66" r="6" fill="#2b2118"/>' +
        '<circle cx="106" cy="66" r="6" fill="#2b2118"/>' +
        '<circle cx="76" cy="64" r="2" fill="#fff"/>' +
        '<circle cx="108" cy="64" r="2" fill="#fff"/>' +
        '<ellipse cx="90" cy="84" rx="5" ry="3.5" fill="#3a2a22"/>' +
        '<path d="M82 94q8 8 16 0" fill="none" stroke="#c2410c" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M70 48l8 16M90 42l2 18M110 48l-6 16" stroke="#7c2d12" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M60 78h14M108 78h14M78 108h8M96 112h10" stroke="#7c2d12" stroke-width="3" stroke-linecap="round"/>' +
      "</svg>",
      "illu-tiger"
    );
  }

  function car() {
    return inline(
      '<svg viewBox="0 0 200 140">' +
        '<g class="car-bob">' +
          '<rect x="28" y="58" width="146" height="42" rx="18" fill="#ef4444"/>' +
          '<path d="M62 58l16-26h52l18 26" fill="#fb7185"/>' +
          '<path d="M78 40h48l10 16H70z" fill="#dbeafe"/>' +
          '<g class="wheel">' +
            '<circle cx="62" cy="102" r="16" fill="#1f2937"/>' +
            '<circle cx="62" cy="102" r="7" fill="#f8fafc"/>' +
            '<rect x="60.2" y="88" width="3.6" height="9" rx="1" fill="#f8fafc"/>' +
          "</g>" +
          '<g class="wheel">' +
            '<circle cx="146" cy="102" r="16" fill="#1f2937"/>' +
            '<circle cx="146" cy="102" r="7" fill="#f8fafc"/>' +
            '<rect x="144.2" y="88" width="3.6" height="9" rx="1" fill="#f8fafc"/>' +
          "</g>" +
          '<circle cx="92" cy="74" r="3" fill="#1f2937"/>' +
          '<circle cx="108" cy="74" r="3" fill="#1f2937"/>' +
          '<path d="M94 84q8 6 16 0" fill="none" stroke="#1f2937" stroke-width="2" stroke-linecap="round"/>' +
          '<circle cx="40" cy="74" r="4" fill="#fde68a"/>' +
          '<circle cx="162" cy="74" r="4" fill="#fde68a"/>' +
        "</g>" +
      "</svg>",
      "illu-car"
    );
  }

  function tower() {
    return inline(
      '<svg viewBox="0 0 220 320">' +
        '<ellipse cx="110" cy="300" rx="78" ry="14" fill="#d9f99d"/>' +
        '<path d="M78 118h64v168h-64z" fill="#efe7ff"/>' +
        '<path d="M78 118h64v168h-64z" fill="none" stroke="#c4b5fd" stroke-width="4"/>' +
        '<path d="M70 118l40-62 40 62z" fill="#7c3aed"/>' +
        '<rect x="104" y="62" width="12" height="22" fill="#f6d56a"/>' +
        '<path d="M98 168c8 10 16 10 24 0v34c-6 8-18 8-24 0z" fill="#fde68a"/>' +
        '<path d="M110 196c8 16 6 40-2 70c-6-8-10-6-14-2c6-28 8-46 16-68z" fill="#f0b429"/>' +
        '<path d="M110 250c10 8 8 24 2 40" fill="none" stroke="#e09a2e" stroke-width="6" stroke-linecap="round"/>' +
        '<circle cx="92" cy="286" r="7" fill="#fb7185"/>' +
        '<circle cx="112" cy="292" r="6" fill="#f472b6"/>' +
        '<circle cx="128" cy="284" r="7" fill="#facc15"/>' +
        '<circle cx="40" cy="70" r="6" fill="#fff" opacity=".85"/>' +
        '<circle cx="180" cy="48" r="5" fill="#fff" opacity=".8"/>' +
        '<path d="M24 96h18v22h-18z" fill="#f6d56a"/>' +
        '<path d="M24 96h18l-9-10z" fill="#f59e0b"/>' +
        '<path d="M176 120h16v20h-16z" fill="#f6d56a"/>' +
        '<path d="M176 120h16l-8-9z" fill="#f59e0b"/>' +
      "</svg>",
      "illu-tower"
    );
  }

  var SHAPE_INNER = {
    circle: '<circle cx="50" cy="50" r="36"/>',
    oval: '<ellipse cx="50" cy="50" rx="40" ry="26"/>',
    square: '<rect x="14" y="14" width="72" height="72" rx="12"/>',
    rectangle: '<rect x="8" y="26" width="84" height="48" rx="12"/>',
    triangle: '<polygon points="50,12 90,84 10,84"/>',
    diamond: '<polygon points="50,8 90,50 50,92 10,50"/>',
    pentagon: '<polygon points="50,8 90,38 76,88 24,88 10,38"/>',
    hexagon: '<polygon points="50,10 86,30 86,70 50,90 14,70 14,30"/>',
    star: '<polygon points="50,6 61,36 94,38 68,58 76,90 50,74 24,90 32,58 6,38 39,36"/>',
    heart: '<path d="M50 84C18 62 10 40 22 28c12-12 24-4 28 8 4-12 16-20 28-8 12 12 4 34-28 56z"/>'
  };

  function shape(name, color, size) {
    var key = SHAPE_INNER[name] ? name : "circle";
    var hex = /^#[0-9a-fA-F]{6}$/.test(color || "") ? color : "#3b82f6";
    var s = Math.max(28, Math.min(180, Number(size) || 80));
    return inline(
      '<svg viewBox="0 0 100 100" width="' + s + '" height="' + s + '">' +
        '<g fill="' + hex + '" stroke="rgba(15,23,42,.18)" stroke-width="4" stroke-linejoin="round">' +
        SHAPE_INNER[key] +
        "</g></svg>",
      "illu-shape"
    );
  }

  function flakes(host, count) {
    var layer = document.createElement("div");
    layer.className = "flakes";
    layer.setAttribute("aria-hidden", "true");
    for (var i = 0; i < count; i++) {
      var dot = document.createElement("i");
      dot.style.left = (i * 17 + (i % 3) * 7) % 100 + "%";
      dot.style.animationDuration = 7 + (i % 5) + "s";
      dot.style.animationDelay = -(i * 0.7) + "s";
      dot.style.opacity = String(0.45 + (i % 4) * 0.12);
      dot.style.width = dot.style.height = 6 + (i % 4) * 2 + "px";
      layer.appendChild(dot);
    }
    host.appendChild(layer);
    return layer;
  }

  HV.art = {
    princess: princess,
    puppy: puppy,
    tiger: tiger,
    car: car,
    tower: tower,
    shape: shape,
    flakes: flakes
  };
})(globalThis.HV = globalThis.HV || {});
