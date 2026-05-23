/* Aplica tema antes da pintura para evitar flash (FOUC). */
try {
  if (localStorage.getItem("mathcore-theme") === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  }
} catch (e) {}
