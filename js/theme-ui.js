/**
 * MathCore — tema (só na página inicial), glow nos cartões de volume, fundo matemático atmosférico
 */
(function () {
  "use strict";

  var root = document.documentElement;
  var KEY = "mathcore-theme";
  var body = document.body;

  function setTheme(mode) {
    if (mode === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem(KEY, mode);
    } catch (e) {}
    if (typeof updateToggleLabel === "function") updateToggleLabel();
  }

  function currentMode() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  var updateToggleLabel;
  var isLanding = body.classList.contains("mathcore-landing");

  if (isLanding) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle theme-toggle--inbar";
    btn.setAttribute("aria-label", "Alternar tema claro ou escuro");

    updateToggleLabel = function () {
      var dark = currentMode() === "dark";
      btn.setAttribute("aria-pressed", dark ? "true" : "false");
      btn.setAttribute("title", dark ? "Modo claro" : "Modo escuro");
      btn.innerHTML = dark
        ? '<span class="theme-toggle__icon" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg></span>'
        : '<span class="theme-toggle__icon" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg></span>';
    };

    btn.addEventListener("click", function () {
      setTheme(currentMode() === "dark" ? "light" : "dark");
    });

    updateToggleLabel();
    var anchor = document.getElementById("landing-theme-anchor");
    if (anchor) {
      anchor.appendChild(btn);
    } else {
      body.appendChild(btn);
    }
  }

  function onVolumeCardMove(e) {
    var card = e.currentTarget;
    var r = card.getBoundingClientRect();
    var x = ((e.clientX - r.left) / r.width) * 100;
    var y = ((e.clientY - r.top) / r.height) * 100;
    card.style.setProperty("--glow-x", x + "%");
    card.style.setProperty("--glow-y", y + "%");
  }

  function onVolumeCardLeave(e) {
    e.currentTarget.style.removeProperty("--glow-x");
    e.currentTarget.style.removeProperty("--glow-y");
  }

  document.querySelectorAll(".volume-card").forEach(function (card) {
    card.addEventListener("mousemove", onVolumeCardMove);
    card.addEventListener("mouseleave", onVolumeCardLeave);
  });

  function pseudoRandom(i) {
    var x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  function svgShape(kind) {
    var stroke = "currentColor";
    var sw = 1.35;
    if (kind === "circle") {
      return (
        "<svg viewBox='0 0 24 24' fill='none' aria-hidden='true'><circle cx='12' cy='12' r='7' stroke='" +
        stroke +
        "' stroke-width='" +
        sw +
        "'/></svg>"
      );
    }
    if (kind === "triangle") {
      return (
        "<svg viewBox='0 0 24 24' fill='none' aria-hidden='true'><path d='M12 4L20 19H4L12 4Z' stroke='" +
        stroke +
        "' stroke-width='" +
        sw +
        "' stroke-linejoin='round'/></svg>"
      );
    }
    if (kind === "axes") {
      return (
        "<svg viewBox='0 0 24 24' fill='none' aria-hidden='true'><path d='M4 20L4 4H20' stroke='" +
        stroke +
        "' stroke-width='" +
        sw +
        "' stroke-linecap='round'/><path d='M4 20H20' stroke='" +
        stroke +
        "' stroke-width='" +
        sw * 0.85 +
        "' stroke-linecap='round' opacity='0.65'/></svg>"
      );
    }
    if (kind === "hex") {
      return (
        "<svg viewBox='0 0 24 24' fill='none' aria-hidden='true'><path d='M7 4h10l5 8-5 8H7l-5-8 5-8z' stroke='" +
        stroke +
        "' stroke-width='" +
        sw +
        "' stroke-linejoin='round'/></svg>"
      );
    }
    return (
      "<svg viewBox='0 0 24 24' fill='none' aria-hidden='true'><rect x='5' y='5' width='14' height='14' rx='2' stroke='" +
      stroke +
      "' stroke-width='" +
      sw +
      "'/></svg>"
    );
  }

  var ATMOSPHERE_SPECS = [
    { kind: "text", text: "\u2211" },
    { kind: "text", text: "\u222B" },
    { kind: "text", text: "\u03C0" },
    { kind: "text", text: "\u221A" },
    { kind: "text", text: "\u221E" },
    { kind: "text", text: "\u0394" },
    { kind: "text", text: "\u03B8" },
    { kind: "text", text: "\u03BB" },
    { kind: "text", text: "f(x)" },
    { kind: "text", text: "e^{i\u03C0}" },
    { kind: "text", text: "lim" },
    { kind: "text", text: "\u2202/\u2202x" },
    { kind: "shape", shape: "circle" },
    { kind: "shape", shape: "triangle" },
    { kind: "shape", shape: "axes" },
    { kind: "shape", shape: "hex" },
    { kind: "shape", shape: "square" },
    { kind: "text", text: "a\u00B2 + b\u00B2" },
    { kind: "text", text: "sin \u03B8" },
    { kind: "text", text: "\u2200" },
    { kind: "text", text: "\u211D" },
    { kind: "text", text: "\u2208" },
    { kind: "shape", shape: "axes" },
    { kind: "shape", shape: "circle" },
    { kind: "text", text: "x \u21A6 y" },
    { kind: "text", text: "dx/dt" }
  ];

  var GRID_SLOTS = [
    [7, 8],
    [18, 12],
    [32, 6],
    [48, 14],
    [63, 9],
    [82, 11],
    [93, 18],
    [12, 28],
    [28, 32],
    [44, 26],
    [58, 34],
    [76, 30],
    [88, 38],
    [8, 48],
    [22, 55],
    [38, 50],
    [52, 58],
    [68, 52],
    [85, 48],
    [15, 72],
    [35, 68],
    [55, 76],
    [72, 70],
    [90, 78],
    [42, 88],
    [6, 88]
  ];

  function ensureMathAtmosphere(host, mode) {
    // UI premium: sem símbolos/fórmulas no fundo
    return;
    // eslint-disable-next-line no-unreachable
    if (!host || host.querySelector(".math-atmosphere")) return;
    var wrap = document.createElement("div");
    wrap.className = "math-atmosphere" + (mode === "landing" ? " math-atmosphere--landing" : "");
    wrap.setAttribute("aria-hidden", "true");

    var n = Math.min(ATMOSPHERE_SPECS.length, GRID_SLOTS.length);
    for (var i = 0; i < n; i++) {
      var spec = ATMOSPHERE_SPECS[i];
      var slot = GRID_SLOTS[i];
      var el = document.createElement("div");
      el.className = "math-atmosphere__el" + (spec.kind === "text" ? " math-atmosphere__el--text" : "");

      var jitterX = (pseudoRandom(i) - 0.5) * 4;
      var jitterY = (pseudoRandom(i + 17) - 0.5) * 4;
      el.style.setProperty("--x", slot[0] + jitterX + "%");
      el.style.setProperty("--y", slot[1] + jitterY + "%");

      var rot = (pseudoRandom(i + 31) - 0.5) * 34;
      el.style.setProperty("--r", rot + "deg");

      var baseO = mode === "landing" ? 0.07 : 0.045;
      var o = baseO + pseudoRandom(i + 5) * (mode === "landing" ? 0.08 : 0.06);
      el.style.setProperty("--o", String(o));

      var fs = 14 + pseudoRandom(i + 9) * (mode === "landing" ? 20 : 28);
      if (spec.kind === "text") el.style.setProperty("--fs", fs + "px");

      var shapeSize = 16 + pseudoRandom(i + 41) * 36;
      if (spec.kind === "shape") el.style.setProperty("--s", shapeSize + "px");

      var dur = 16 + pseudoRandom(i + 23) * 14;
      el.style.setProperty("--t", dur + "s");

      var dx = (pseudoRandom(i + 51) - 0.5) * 18;
      var dy = (pseudoRandom(i + 61) - 0.5) * 14;
      el.style.setProperty("--dx", dx + "px");
      el.style.setProperty("--dy", dy + "px");

      var px = (pseudoRandom(i + 71) - 0.5) * 10;
      var py = (pseudoRandom(i + 81) - 0.5) * 10;
      el.style.setProperty("--px", px + "px");
      el.style.setProperty("--py", py + "px");

      if (spec.kind === "text") {
        el.textContent = spec.text;
      } else {
        el.innerHTML = svgShape(spec.shape);
      }

      wrap.appendChild(el);
    }

    host.insertBefore(wrap, host.firstChild);
  }

  // Atmosfera matemática removida (fundo limpo)
})();
