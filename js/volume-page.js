/**
 * MathCore — página de volume (sidebar só nesta página, pesquisa, modal de resumo)
 *
 * Dados: window.MATHCORE_VOLUME (ver js/vol-10-*.js e vol-11-*.js)
 * Pesquisa global: window.MATHCORE_GLOBAL_INDEX (js/global-search-index.js)
 * Imagens de resumos: images/<slug>.png
 */
(function () {
  "use strict";

  var data = window.MATHCORE_VOLUME;
  if (!data || !data.themes) return;

  var mainEl = document.getElementById("main-content");
  var sidebarEl = document.getElementById("sidebar-tree");
  var searchInput = document.getElementById("search-topics");
  var modalBackdrop = document.getElementById("topic-modal-backdrop");
  var modal = document.getElementById("topic-modal");
  var modalTitle = document.getElementById("topic-modal-title");
  var modalImg = document.getElementById("topic-modal-img");
  var modalPlaceholder = document.getElementById("topic-modal-placeholder");
  var modalCloseBtn = document.querySelector("[data-close-modal]");
  var sidebarToggleBtn = document.getElementById("sidebar-toggle");
  var sidebarVolLabel = document.getElementById("sidebar-vol-label");

  var searchWrap = searchInput ? searchInput.closest(".topbar__search-wrap") : null;
  var globalPanel = null;
  var globalResults = [];
  var selectedGlobalIdx = -1;
  var searchDebounce = null;
  var SEARCH_DEBOUNCE_MS = 48;

  var currentTopicSlug = null;
  var topicIndex = new Map();

  function normalizeSearch(s) {
    return s
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function highlightQueryInLine(original, qNorm) {
    if (!qNorm) return escapeHtml(original);
    var pos = normalizeSearch(original).indexOf(qNorm);
    if (pos === -1) return escapeHtml(original);
    var endMatch = pos + qNorm.length;
    var start = 0;
    var end = original.length;
    var i;
    for (i = 0; i <= original.length; i++) {
      if (normalizeSearch(original.slice(0, i)).length > pos) {
        start = i - 1;
        if (start < 0) start = 0;
        break;
      }
    }
    for (i = start; i <= original.length; i++) {
      if (normalizeSearch(original.slice(0, i)).length >= endMatch) {
        end = i;
        break;
      }
    }
    return (
      escapeHtml(original.slice(0, start)) +
      '<mark class="search-results__mark">' +
      escapeHtml(original.slice(start, end)) +
      "</mark>" +
      escapeHtml(original.slice(end))
    );
  }

  function pickHighlightNorm(line, words) {
    var best = "";
    var lineN = normalizeSearch(line);
    for (var w = 0; w < words.length; w++) {
      var word = words[w];
      if (!word) continue;
      if (lineN.indexOf(word) !== -1 && word.length >= best.length) best = word;
    }
    return best;
  }

  function highlightLineHTML(line, words, fullNorm) {
    if (!words.length) return escapeHtml(line);
    var lineN = normalizeSearch(line);
    if (fullNorm && lineN.indexOf(fullNorm) !== -1) return highlightQueryInLine(line, fullNorm);
    var hn = pickHighlightNorm(line, words);
    if (!hn) return escapeHtml(line);
    return highlightQueryInLine(line, hn);
  }

  function sectionMatches(sec, q) {
    if (!q) return true;
    if (sec.items && sec.items.length) {
      return sec.items.some(function (it) {
        return normalizeSearch(it.num + " " + it.title).indexOf(q) !== -1;
      });
    }
    if (sec.slug) {
      return normalizeSearch(sec.num + " " + sec.title).indexOf(q) !== -1;
    }
    return false;
  }

  function themeMatches(theme, q) {
    if (!q) return true;
    return theme.sections.some(function (s) {
      return sectionMatches(s, q);
    });
  }

  function filterThemes(qNorm) {
    return data.themes
      .map(function (theme) {
        if (!themeMatches(theme, qNorm)) return null;
        if (!qNorm) return theme;
        var secs = theme.sections
          .map(function (sec) {
            if (!sectionMatches(sec, qNorm)) return null;
            if (!sec.items || !sec.items.length) return sec;
            var items = sec.items.filter(function (it) {
              return normalizeSearch(it.num + " " + it.title).indexOf(qNorm) !== -1;
            });
            if (!items.length) return null;
            return { num: sec.num, title: sec.title, items: items };
          })
          .filter(Boolean);
        return secs.length ? { id: theme.id, title: theme.title, sections: secs } : null;
      })
      .filter(Boolean);
  }

  function globalMatchesBlob(entry, words) {
    var blob = normalizeSearch(entry.line + " " + entry.theme + " " + entry.vol + " " + entry.page);
    for (var i = 0; i < words.length; i++) {
      if (blob.indexOf(words[i]) === -1) return false;
    }
    return true;
  }

  function scoreGlobal(entry, words, fullNorm) {
    if (!words.length) return -1;
    if (!globalMatchesBlob(entry, words)) return -1;
    var line = normalizeSearch(entry.line);
    var theme = normalizeSearch(entry.theme);
    var vol = normalizeSearch(entry.vol);
    var score = 0;
    var w;
    for (w = 0; w < words.length; w++) {
      var word = words[w];
      if (!word) continue;
      if (line.indexOf(word) === 0) score += 100;
      else if (line.indexOf(word) !== -1) score += 72;
      else if (theme.indexOf(word) !== -1) score += 38;
      else if (vol.indexOf(word) !== -1) score += 22;
      else score += 8;
    }
    if (fullNorm && line.indexOf(fullNorm) !== -1) score += 40;
    return score;
  }

  function openTopicModal(title, slug) {
    modalTitle.textContent = title;
    modalImg.removeAttribute("src");
    modalImg.alt = "";
    modalImg.classList.add("is-hidden");
    modalPlaceholder.classList.remove("is-hidden");
    modalPlaceholder.textContent = "A carregar o resumo…";

    var pathPng = "images/" + slug + ".png";
    var img = new Image();
    img.onload = function () {
      modalImg.src = pathPng;
      modalImg.alt = title;
      modalImg.classList.remove("is-hidden");
      modalPlaceholder.classList.add("is-hidden");
    };
    img.onerror = function () {
      modalImg.classList.add("is-hidden");
      modalPlaceholder.classList.remove("is-hidden");
      modalPlaceholder.textContent = "Não foi encontrada a imagem do resumo para este tópico.";
    };
    img.src = pathPng;

    requestAnimationFrame(function () {
      modalBackdrop.classList.add("is-open");
      modal.classList.add("is-open");
    });
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modalBackdrop.classList.remove("is-open");
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  function setSidebarLabel() {
    if (!sidebarVolLabel) return;
    sidebarVolLabel.textContent = "Vol. " + String(data.volNumber || "");
  }

  function setupSidebarToggle() {
    if (!sidebarToggleBtn) return;
    var KEY = "mathcore-sidebar-collapsed";
    try {
      if (localStorage.getItem(KEY) === "1") document.body.classList.add("sidebar-collapsed");
    } catch (e) {}

    sidebarToggleBtn.addEventListener("click", function () {
      var collapsed = document.body.classList.toggle("sidebar-collapsed");
      try {
        localStorage.setItem(KEY, collapsed ? "1" : "0");
      } catch (e) {}
      sidebarToggleBtn.setAttribute("aria-pressed", collapsed ? "true" : "false");
    });

    sidebarToggleBtn.setAttribute("aria-pressed", document.body.classList.contains("sidebar-collapsed") ? "true" : "false");
  }

  function ensureTopicIndex(themes) {
    topicIndex.clear();
    themes.forEach(function (theme) {
      theme.sections.forEach(function (sec) {
        if (sec.items && sec.items.length) {
          sec.items.forEach(function (it) {
            topicIndex.set(it.slug, {
              slug: it.slug,
              title: it.title,
              num: it.num,
              themeTitle: theme.title,
              sectionTitle: sec.num + ". " + sec.title,
            });
          });
        } else if (sec.slug) {
          topicIndex.set(sec.slug, {
            slug: sec.slug,
            title: sec.title,
            num: sec.num,
            themeTitle: theme.title,
            sectionTitle: null,
          });
        }
      });
    });
  }

  function renderEmptyState() {
    mainEl.innerHTML = "";
    var wrap = document.createElement("div");
    wrap.className = "volume-viewer";
    var card = document.createElement("div");
    card.className = "volume-empty";
    var h = document.createElement("h2");
    h.className = "volume-empty__title";
    h.textContent = "Selecione um tema no painel lateral para começar a estudar.";
    var p = document.createElement("p");
    p.className = "volume-empty__text";
    p.textContent = "Escolha um conteúdo para visualizar o resumo.";
    card.appendChild(h);
    card.appendChild(p);
    wrap.appendChild(card);
    mainEl.appendChild(wrap);
  }

  function setActiveSidebar(slug) {
    if (!sidebarEl) return;
    sidebarEl.querySelectorAll("[data-topic-slug]").forEach(function (el) {
      el.classList.toggle("is-active", el.getAttribute("data-topic-slug") === slug);
      el.setAttribute("aria-current", el.getAttribute("data-topic-slug") === slug ? "true" : "false");
    });
  }

  function renderViewer(topic) {
    mainEl.innerHTML = "";
    var wrap = document.createElement("div");
    wrap.className = "volume-viewer";

    var card = document.createElement("section");
    card.className = "viewer-card is-fading";

    var head = document.createElement("div");
    head.className = "viewer-card__head";

    var title = document.createElement("h2");
    title.className = "viewer-card__title";
    title.innerHTML = "<span>" + escapeHtml(topic.num ? topic.num + " · " : "") + "</span>" + escapeHtml(topic.title);

    var actions = document.createElement("div");
    actions.className = "viewer-card__actions";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "viewer-btn";
    btn.textContent = "Ver em ecrã completo";
    btn.addEventListener("click", function () {
      openTopicModal(topic.title, topic.slug);
    });

    actions.appendChild(btn);
    head.appendChild(title);
    head.appendChild(actions);

    var body = document.createElement("div");
    body.className = "viewer-card__body";

    var imgWrap = document.createElement("div");
    imgWrap.className = "viewer-image-wrap";

    var img = document.createElement("img");
    img.alt = topic.title;
    img.loading = "eager";

    var pathPng = "images/" + topic.slug + ".png";
    img.src = pathPng;

    imgWrap.appendChild(img);
    body.appendChild(imgWrap);

    card.appendChild(head);
    card.appendChild(body);
    wrap.appendChild(card);
    mainEl.appendChild(wrap);

    requestAnimationFrame(function () {
      card.classList.remove("is-fading");
    });
  }

  function selectTopicBySlug(slug, opts) {
    if (!slug || !topicIndex.has(slug)) return false;
    currentTopicSlug = slug;
    var topic = topicIndex.get(slug);
    setActiveSidebar(slug);
    renderViewer(topic);
    if (!opts || !opts.skipHash) {
      try {
        history.replaceState(null, "", "#topic-" + slug);
      } catch (e) {
        window.location.hash = "topic-" + slug;
      }
    }
    return true;
  }

  function renderSidebar(themes) {
    sidebarEl.innerHTML = "";
    themes.forEach(function (theme) {
      var group = document.createElement("div");
      group.className = "sidebar-group";

      var themeTitle = document.createElement("div");
      themeTitle.className = "sidebar-group__title";
      themeTitle.textContent = theme.title;
      group.appendChild(themeTitle);

      var ul = document.createElement("ul");
      ul.className = "sidebar-tree-nested sidebar-tree-nested--obsidian";

      theme.sections.forEach(function (sec) {
        if (sec.items && sec.items.length) {
          var sLi = document.createElement("li");
          sLi.className = "sidebar-section";
          var sLabel = document.createElement("div");
          sLabel.className = "sidebar-section__label";
          sLabel.textContent = sec.num + ". " + sec.title;
          sLi.appendChild(sLabel);

          var inner = document.createElement("ul");
          inner.className = "sidebar-section__items";

          sec.items.forEach(function (it) {
            var li = document.createElement("li");
            var b = document.createElement("button");
            b.type = "button";
            b.className = "sidebar-item";
            b.textContent = it.num + " " + it.title;
            b.setAttribute("data-topic-slug", it.slug);
            b.addEventListener("click", function () {
              selectTopicBySlug(it.slug);
            });
            li.appendChild(b);
            inner.appendChild(li);
          });

          sLi.appendChild(inner);
          ul.appendChild(sLi);
        } else if (sec.slug) {
          var li2 = document.createElement("li");
          var b2 = document.createElement("button");
          b2.type = "button";
          b2.className = "sidebar-item";
          b2.textContent = sec.num + ". " + sec.title;
          b2.setAttribute("data-topic-slug", sec.slug);
          b2.addEventListener("click", function () {
            selectTopicBySlug(sec.slug);
          });
          li2.appendChild(b2);
          ul.appendChild(li2);
        }
      });

      group.appendChild(ul);
      sidebarEl.appendChild(group);
    });
  }

  function navigateGlobal(entry) {
    if (globalPanel) globalPanel.classList.remove("is-open");
    window.location.href = entry.page + "#" + entry.anchor;
  }

  function syncGlobalActive() {
    if (!globalPanel) return;
    var opts = globalPanel.querySelectorAll(".search-results__btn");
    opts.forEach(function (b, i) {
      b.classList.toggle("is-active", i === selectedGlobalIdx);
      b.setAttribute("aria-selected", i === selectedGlobalIdx ? "true" : "false");
    });
  }

  function renderGlobalPanel(words, fullNorm, rawTrim) {
    if (!globalPanel || !window.MATHCORE_GLOBAL_INDEX || !window.MATHCORE_GLOBAL_INDEX.length) {
      if (globalPanel) {
        globalPanel.classList.remove("is-open");
        globalPanel.innerHTML = "";
      }
      if (searchInput) searchInput.setAttribute("aria-expanded", "false");
      return;
    }

    if (!rawTrim) {
      globalPanel.classList.remove("is-open");
      globalPanel.innerHTML = "";
      searchInput.setAttribute("aria-expanded", "false");
      globalResults = [];
      selectedGlobalIdx = -1;
      return;
    }

    var index = window.MATHCORE_GLOBAL_INDEX;
    var scored = [];
    var i;
    for (i = 0; i < index.length; i++) {
      var sc = scoreGlobal(index[i], words, fullNorm);
      if (sc >= 0) scored.push({ entry: index[i], score: sc });
    }
    scored.sort(function (a, b) {
      return b.score - a.score;
    });
    globalResults = scored.slice(0, 14).map(function (x) {
      return x.entry;
    });

    globalPanel.innerHTML = "";

    if (!globalResults.length) {
      var emptyHead = document.createElement("div");
      emptyHead.className = "search-results__head";
      emptyHead.innerHTML = "<span>Resultados</span>";
      var empty = document.createElement("div");
      empty.className = "search-results__empty";
      empty.textContent = "Sem correspondências nos volumes. Tenta outras palavras ou verifica a ortografia.";
      globalPanel.appendChild(emptyHead);
      globalPanel.appendChild(empty);
      globalPanel.classList.add("is-open");
      searchInput.setAttribute("aria-expanded", "true");
      selectedGlobalIdx = -1;
      return;
    }

    var head = document.createElement("div");
    head.className = "search-results__head";
    head.innerHTML =
      "<span>Resultados em todos os volumes</span><span class=\"search-results__count\">" +
      globalResults.length +
      "</span>";

    var ul = document.createElement("ul");
    ul.className = "search-results__list";
    ul.setAttribute("role", "listbox");

    globalResults.forEach(function (entry, idx) {
      var li = document.createElement("li");
      li.className = "search-results__item";
      li.setAttribute("role", "none");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "search-results__btn";
      btn.setAttribute("role", "option");
      btn.setAttribute("id", "global-search-opt-" + idx);
      var titleEl = document.createElement("div");
      titleEl.className = "search-results__title";
      titleEl.innerHTML = highlightLineHTML(entry.line, words, fullNorm);
      var meta = document.createElement("div");
      meta.className = "search-results__meta";
      meta.textContent = entry.vol + " · " + entry.theme;
      btn.appendChild(titleEl);
      btn.appendChild(meta);
      btn.addEventListener("click", function () {
        navigateGlobal(entry);
      });
      li.appendChild(btn);
      ul.appendChild(li);
    });

    globalPanel.appendChild(head);
    globalPanel.appendChild(ul);
    globalPanel.classList.add("is-open");
    searchInput.setAttribute("aria-expanded", "true");
    selectedGlobalIdx = -1;
    syncGlobalActive();
  }

  function applySearch(raw) {
    var trimmed = raw.trim();
    var q = normalizeSearch(trimmed);
    var words = q.split(/\s+/).filter(Boolean);
    var fullNorm = q;
    var filtered = filterThemes(q);
    renderSidebar(filtered);
    renderGlobalPanel(words, fullNorm, trimmed);

    if (!filtered.length) {
      renderEmptyState();
      return;
    }
    // mantém o tópico selecionado se ainda existir no índice filtrado
    ensureTopicIndex(filtered);
    if (currentTopicSlug && topicIndex.has(currentTopicSlug)) {
      setActiveSidebar(currentTopicSlug);
    } else if (!currentTopicSlug) {
      renderEmptyState();
    }
  }

  if (searchInput) {
    if (searchWrap && window.MATHCORE_GLOBAL_INDEX && window.MATHCORE_GLOBAL_INDEX.length) {
      globalPanel = document.createElement("div");
      globalPanel.className = "search-results";
      globalPanel.id = "global-search-results";
      globalPanel.setAttribute("aria-hidden", "true");
      searchWrap.appendChild(globalPanel);
      searchInput.setAttribute("aria-expanded", "false");
      searchInput.setAttribute("autocomplete", "off");
      searchInput.setAttribute("role", "combobox");
      searchInput.setAttribute("aria-controls", "global-search-results");
      searchInput.setAttribute("aria-autocomplete", "list");

      document.addEventListener("mousedown", function (e) {
        if (!searchWrap.contains(e.target)) {
          globalPanel.classList.remove("is-open");
          searchInput.setAttribute("aria-expanded", "false");
        }
      });

      searchInput.addEventListener("keydown", function (e) {
        if (!globalPanel.classList.contains("is-open")) return;
        var opts = globalPanel.querySelectorAll(".search-results__btn");
        if (!opts.length) return;
        if (e.key === "ArrowDown") {
          e.preventDefault();
          selectedGlobalIdx = Math.min(selectedGlobalIdx + 1, opts.length - 1);
          syncGlobalActive();
          opts[selectedGlobalIdx].scrollIntoView({ block: "nearest" });
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          selectedGlobalIdx = Math.max(selectedGlobalIdx - 1, 0);
          syncGlobalActive();
          opts[selectedGlobalIdx].scrollIntoView({ block: "nearest" });
        } else if (e.key === "Enter") {
          if (globalResults.length) {
            e.preventDefault();
            var pick = selectedGlobalIdx >= 0 ? globalResults[selectedGlobalIdx] : globalResults[0];
            navigateGlobal(pick);
          }
        }
      });
    }

    searchInput.addEventListener("input", function () {
      var v = searchInput.value;
      if (searchDebounce) clearTimeout(searchDebounce);
      searchDebounce = setTimeout(function () {
        applySearch(v);
        searchDebounce = null;
      }, SEARCH_DEBOUNCE_MS);
    });

    searchInput.addEventListener("focus", function () {
      if (searchInput.value.trim()) applySearch(searchInput.value);
    });
  }

  modalCloseBtn.addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", closeModal);
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    closeModal();
    if (globalPanel && globalPanel.classList.contains("is-open")) {
      globalPanel.classList.remove("is-open");
      if (searchInput) searchInput.setAttribute("aria-expanded", "false");
      selectedGlobalIdx = -1;
    }
  });

  setSidebarLabel();
  setupSidebarToggle();

  ensureTopicIndex(data.themes);
  renderSidebar(data.themes);
  renderEmptyState();

  // Deep-link: #topic-<slug>
  var h = window.location.hash || "";
  if (h.indexOf("#topic-") === 0) {
    var slug = h.slice("#topic-".length);
    if (slug) selectTopicBySlug(slug, { skipHash: true });
  }
})();
