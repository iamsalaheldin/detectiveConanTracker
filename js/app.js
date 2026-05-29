/* متتبّع مشاهدة المحقق كونان — app logic
 * No build step. Data comes from window.DC_EPISODES / window.DC_MOVIES (baked JS).
 * Watch progress lives in localStorage so the app works straight from file://.
 */
(function () {
  "use strict";

  var STORE_KEY = "dc-tracker-v1";
  var $ = function (sel, root) { return (root || document).querySelector(sel); };

  // Plot-tag metadata (from the Detective Conan World "Plot Legend"). Order = display order.
  var TAGS = [
    { key: "bo", label: "المنظمة السوداء" },
    { key: "fbi", label: "الإف بي آي" },
    { key: "mk", label: "كيد اللص" },
    { key: "romance", label: "رومانسية" },
    { key: "past", label: "ماضي الشخصيات" },
    { key: "char", label: "تطوّر الشخصيات" },
    { key: "new", label: "شخصية جديدة" },
    { key: "db", label: "فريق المحققين الصغار" },
  ];
  var TAG_LABEL = {};
  TAGS.forEach(function (t) { TAG_LABEL[t.key] = t.label; });

  // Movie posters via MediaWiki's stable file path (no per-file hash needed).
  var DCW_FILE = "https://www.detectiveconanworld.com/wiki/Special:FilePath/";
  var POSTER_EXC = { 23: "Movie_23.png" }; // most posters are Movie_N.jpg; a few differ
  function moviePoster(m) {
    if (m.crossover) return DCW_FILE + "Lupin_III_vs._Detective_Conan_The_Movie.jpg";
    return DCW_FILE + (POSTER_EXC[m.number] || "Movie_" + m.number + ".jpg");
  }

  /* ---------------------------------------------------------------- state */
  var state = loadState(); // { id: { watched:bool, rating:0-5, note:"" } }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }
  var saveTimer = null;
  function saveState() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
    }, 150);
  }
  function entry(id) {
    if (!state[id]) state[id] = { watched: false, rating: 0, note: "", favorite: false, watchedAt: null };
    return state[id];
  }

  /* ----------------------------------------------------- build timeline */
  // Merge episodes + movies into one ordered list; each movie sits right after
  // its `afterEpisode` anchor on the anime timeline.
  function buildTimeline() {
    var movies = (window.DC_MOVIES || []).slice().sort(function (a, b) { return a.afterEpisode - b.afterEpisode; });

    var byAnchor = {};
    movies.forEach(function (m) {
      (byAnchor[m.afterEpisode] = byAnchor[m.afterEpisode] || []).push(m);
    });

    var classify = window.DC_CLASSIFY || {};
    // index Arabic-titled episodes by number, then walk the UNION of episode numbers
    // from both sources so episodes DCW knows but the Arabic source doesn't yet
    // (e.g. the newest ones) still appear — using the DCW English title as a fallback.
    var epMap = {};
    (window.DC_EPISODES || []).forEach(function (e) { epMap[e.number] = e; });
    var numSet = {};
    Object.keys(epMap).forEach(function (n) { numSet[n] = 1; });
    Object.keys(classify).forEach(function (n) { numSet[n] = 1; });
    var allNums = Object.keys(numSet).map(Number).sort(function (a, b) { return a - b; });

    var items = [];
    var lastSeason = 1;
    allNums.forEach(function (num) {
      var ep = epMap[num];
      var cls = classify[num] || {};
      if (ep) lastSeason = ep.season; // carry season forward for synthesized episodes
      items.push({
        id: "ep-" + num,
        type: "episode",
        number: num,
        numberLabel: ep ? (ep.numberLabel || String(num)) : String(num),
        intNumber: cls.intNumber || "",
        title: ep ? ep.title : (cls.title || "الحلقة " + num),
        subtitle: ep ? (ep.dubTitle || "") : "",
        pendingArabic: !ep, // title is the English DCW fallback until Arabic catches up
        kind: cls.kind || (ep ? ep.kind : "canon"), // DCW classification is authoritative
        tags: cls.tags || [],
        season: ep ? ep.season : lastSeason,
        manga: ep ? (ep.manga || "") : "",
        airDate: ep ? (ep.airDate || "") : "",
      });
      (byAnchor[num] || []).forEach(function (m) {
        items.push({
          id: m.id,
          type: "movie",
          number: m.number,
          label: m.label,
          title: m.title,
          subtitle: m.year ? String(m.year) : "",
          afterEpisode: m.afterEpisode,
          crossover: !!m.crossover,
          season: null,
        });
      });
    });
    return items;
  }

  var TIMELINE = buildTimeline();
  var EP_TOTAL = TIMELINE.filter(function (i) { return i.type === "episode"; }).length;
  var MV_TOTAL = TIMELINE.filter(function (i) { return i.type === "movie"; }).length;

  // season -> {total, label}
  var SEASONS = (function () {
    var map = {};
    TIMELINE.forEach(function (i) {
      if (i.type !== "episode") return;
      (map[i.season] = map[i.season] || { season: i.season, total: 0 }).total++;
    });
    return Object.keys(map).map(function (k) { return map[k]; })
      .sort(function (a, b) { return a.season - b.season; });
  })();

  /* --------------------------------------------------------- filters UI */
  var filters = { status: "all", type: "all", kind: "all", season: "all", tag: "all", q: "",
                  favOnly: false, canonOnly: false };

  function passesFilter(item) {
    var st = state[item.id];
    var watched = !!(st && st.watched);
    if (filters.favOnly && !(st && st.favorite)) return false;
    // canon-only "skip filler" path: hide filler episodes but keep canon episodes + all movies
    if (filters.canonOnly && item.type === "episode" && item.kind === "filler") return false;
    if (filters.status === "watched" && !watched) return false;
    if (filters.status === "unwatched" && watched) return false;
    if (filters.type !== "all" && item.type !== filters.type) return false;
    if (filters.kind !== "all") {
      if (item.type !== "episode" || item.kind !== filters.kind) return false;
    }
    if (filters.tag !== "all") {
      if (item.type !== "episode" || !item.tags || item.tags.indexOf(filters.tag) === -1) return false;
    }
    if (filters.season !== "all" && String(item.season) !== filters.season) {
      // movies have no season; only show them under "all"
      return false;
    }
    if (filters.q) {
      var q = filters.q;
      var tagText = (item.tags || []).map(function (k) { return TAG_LABEL[k] || ""; }).join(" ");
      var hay = (item.title + " " + (item.subtitle || "") + " " + (item.label || "") +
        " " + item.numberLabel + " " + (item.intNumber || "") + " " + tagText + " " +
        (item.type === "movie" ? "فيلم film" : "حلقة")).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  }

  /* ------------------------------------------------------- render cards */
  var timelineEl = $("#timeline");
  var emptyEl = $("#empty");

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function starsHtml(id, rating) {
    var out = '<div class="stars" data-id="' + id + '" role="radiogroup" aria-label="التقييم">';
    for (var s = 1; s <= 5; s++) {
      out += '<button type="button" class="star' + (s <= rating ? " on" : "") +
        '" data-star="' + s + '" aria-label="' + s + ' من 5">★</button>';
    }
    out += "</div>";
    return out;
  }

  function cardHtml(item) {
    var st = state[item.id] || {};
    var watched = !!st.watched;
    var rating = st.rating || 0;
    var note = st.note || "";
    var fav = !!st.favorite;
    var isMovie = item.type === "movie";

    var badge = isMovie
      ? '<span class="card-num movie-num">' +
          '<img class="badge-poster" src="' + escapeHtml(moviePoster(item)) + '" alt="" loading="lazy" onerror="this.remove()" />' +
          "<b>" + (item.crossover ? "✦" : escapeHtml(String(item.number))) + "</b></span>"
      : '<span class="card-num" title="رقم ياباني / رقم دولي">' + escapeHtml(item.numberLabel) +
          (item.intNumber && item.intNumber !== item.numberLabel
            ? '<small>دولي ' + escapeHtml(item.intNumber) + "</small>" : "") +
        "</span>";

    var tag = isMovie
      ? '<span class="tag tag-movie">' + (item.crossover ? "كروس أوفر" : "فيلم") + "</span>"
      : '<span class="tag tag-' + item.kind + '">' + (item.kind === "filler" ? "حشو" : "قصة أصلية") + "</span>";

    var tagPills = !isMovie && item.tags && item.tags.length
      ? '<div class="tag-pills">' + item.tags.map(function (k) {
          return '<span class="pill pill-' + k + '">' + (TAG_LABEL[k] || k) + "</span>";
        }).join("") + "</div>"
      : "";

    var meta = [];
    if (isMovie) {
      if (item.subtitle) meta.push("سنة " + escapeHtml(item.subtitle));
      meta.push("بعد الحلقة " + item.afterEpisode);
    } else {
      meta.push("الموسم " + item.season);
      if (item.airDate) meta.push(escapeHtml(item.airDate));
      if (item.manga) meta.push(escapeHtml(item.manga));
      if (item.pendingArabic) meta.push('<em class="pending">العنوان بالإنجليزية مؤقتًا</em>');
    }

    var sub = !isMovie && item.subtitle
      ? '<span class="card-sub">الدبلجة: ' + escapeHtml(item.subtitle) + "</span>" : "";

    return (
      '<article class="card' + (isMovie ? " is-movie" : "") + (item.crossover ? " is-crossover" : "") +
        (watched ? " watched" : "") + '" data-id="' + item.id + '" data-type="' + item.type + '">' +
        badge +
        '<div class="card-body">' +
          '<div class="card-top">' + tag +
            '<h3 class="card-title" dir="auto">' + escapeHtml(item.title) + "</h3>" +
            '<button class="fav-toggle' + (fav ? " on" : "") + '" type="button" data-id="' + item.id +
              '" aria-pressed="' + fav + '" title="إضافة إلى المفضّلة">★</button>' +
          "</div>" +
          sub +
          '<div class="card-meta">' + meta.map(function (m) { return "<span>" + m + "</span>"; }).join("") + "</div>" +
          tagPills +
          '<div class="card-detail">' +
            '<div class="rating-row"><span class="rate-label">تقييمك:</span>' + starsHtml(item.id, rating) + "</div>" +
            '<textarea class="note" data-id="' + item.id + '" rows="2" placeholder="ملاحظاتك عن الحلقة…">' + escapeHtml(note) + "</textarea>" +
          "</div>" +
        "</div>" +
        '<button class="watch-toggle" type="button" data-id="' + item.id + '" aria-pressed="' + watched + '" title="تبديل حالة المشاهدة">' +
          '<span class="check">✓</span><span class="stamp">شوهد</span>' +
        "</button>" +
      "</article>"
    );
  }

  function render() {
    var visible = TIMELINE.filter(passesFilter);
    var html = [];
    var lastSeason = null;
    for (var i = 0; i < visible.length; i++) {
      var item = visible[i];
      if (item.type === "episode" && item.season !== lastSeason) {
        lastSeason = item.season;
        html.push(seasonHeaderHtml(item.season));
      }
      html.push(cardHtml(item));
    }
    timelineEl.innerHTML = html.join("");
    emptyEl.hidden = visible.length !== 0;
    $("#result-count").textContent =
      visible.length ? "عرض " + visible.length.toLocaleString("ar-EG") + " عنصرًا" : "";
    updateProgress();
  }

  function seasonHeaderHtml(season) {
    var info = SEASONS.filter(function (s) { return s.season === season; })[0] || { total: 0 };
    var watched = TIMELINE.filter(function (i) {
      return i.type === "episode" && i.season === season && state[i.id] && state[i.id].watched;
    }).length;
    var pct = info.total ? Math.round((watched / info.total) * 100) : 0;
    return (
      '<div class="season-header" id="season-' + season + '">' +
        '<span class="season-badge">الموسم ' + season + "</span>" +
        '<span class="season-count">' + watched + " / " + info.total + "</span>" +
        '<span class="season-mini"><span style="width:' + pct + '%"></span></span>' +
      "</div>"
    );
  }

  /* -------------------------------------------------------- progress UI */
  function updateProgress() {
    var epW = 0, mvW = 0;
    for (var id in state) {
      if (!state[id] || !state[id].watched) continue;
      if (id.indexOf("ep-") === 0) epW++;
      else mvW++;
    }
    var total = EP_TOTAL + MV_TOTAL;
    var done = epW + mvW;
    var pct = total ? Math.round((done / total) * 100) : 0;

    $("#progress-fill").style.width = pct + "%";
    $("#progress-label").textContent = pct + "%";
    $("#stats").innerHTML =
      '<strong>' + done.toLocaleString("ar-EG") + "</strong> من " +
      total.toLocaleString("ar-EG") + " مُشاهَد";
    $("#mini-stats").innerHTML =
      '<span class="mini ep"><b>' + epW + "</b> / " + EP_TOTAL + " حلقة</span>" +
      '<span class="mini mv"><b>' + mvW + "</b> / " + MV_TOTAL + " فيلم</span>";
  }

  /* ------------------------------------------------------------ events */
  // event delegation on the timeline
  timelineEl.addEventListener("click", function (e) {
    var toggle = e.target.closest(".watch-toggle");
    if (toggle) { toggleWatched(toggle.dataset.id); return; }

    var favBtn = e.target.closest(".fav-toggle");
    if (favBtn) { toggleFavorite(favBtn.dataset.id); return; }

    var star = e.target.closest(".star");
    if (star) { setRating(star.parentNode.dataset.id, +star.dataset.star); return; }

    // clicking a card body (not interactive elements) expands/collapses detail
    var card = e.target.closest(".card");
    if (card && !e.target.closest(".note")) {
      card.classList.toggle("open");
    }
  });

  timelineEl.addEventListener("input", function (e) {
    if (e.target.classList.contains("note")) {
      entry(e.target.dataset.id).note = e.target.value;
      saveState();
    }
  });

  function toggleWatched(id) {
    var en = entry(id);
    en.watched = !en.watched;
    en.watchedAt = en.watched ? new Date().toISOString() : null; // record/clear watch date
    saveState();
    var card = timelineEl.querySelector('.card[data-id="' + CSS.escape(id) + '"]');
    if (card) {
      card.classList.toggle("watched", en.watched);
      var t = card.querySelector(".watch-toggle");
      if (t) t.setAttribute("aria-pressed", String(en.watched));
    }
    // status filter may hide this item now
    if (filters.status !== "all") render();
    else { updateProgress(); refreshSeasonHeader(id); }
  }

  function toggleFavorite(id) {
    var en = entry(id);
    en.favorite = !en.favorite;
    saveState();
    var card = timelineEl.querySelector('.card[data-id="' + CSS.escape(id) + '"]');
    if (card) {
      var b = card.querySelector(".fav-toggle");
      if (b) { b.classList.toggle("on", en.favorite); b.setAttribute("aria-pressed", String(en.favorite)); }
    }
    if (filters.favOnly && !en.favorite) render(); // it just left the favorites view
  }

  function setRating(id, value) {
    var en = entry(id);
    en.rating = en.rating === value ? 0 : value; // click same star again to clear
    saveState();
    var wrap = timelineEl.querySelector('.stars[data-id="' + CSS.escape(id) + '"]');
    if (wrap) {
      wrap.querySelectorAll(".star").forEach(function (s) {
        s.classList.toggle("on", +s.dataset.star <= en.rating);
      });
    }
  }

  function refreshSeasonHeader(id) {
    if (id.indexOf("ep-") !== 0) return;
    var item = TIMELINE.filter(function (i) { return i.id === id; })[0];
    if (!item) return;
    var header = $("#season-" + item.season);
    if (header) header.outerHTML = seasonHeaderHtml(item.season);
  }

  // filter chips
  document.querySelectorAll(".chip-group").forEach(function (group) {
    group.addEventListener("click", function (e) {
      var chip = e.target.closest(".chip");
      if (!chip) return;
      group.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("is-active"); });
      chip.classList.add("is-active");
      filters[group.dataset.filter] = chip.dataset.value;
      render();
    });
  });

  // season dropdown
  var seasonSel = $("#filter-season");
  seasonSel.innerHTML =
    '<option value="all">كل المواسم</option>' +
    SEASONS.map(function (s) { return '<option value="' + s.season + '">الموسم ' + s.season + " (" + s.total + ")</option>"; }).join("");
  seasonSel.addEventListener("change", function () {
    filters.season = seasonSel.value;
    render();
  });

  // tag filter chips (built dynamically from TAGS)
  var tagGroup = $("#filter-tag");
  if (tagGroup) {
    tagGroup.innerHTML =
      '<button class="chip is-active" data-value="all">كل الأقواس</button>' +
      TAGS.map(function (t) {
        return '<button class="chip chip-tag pill-' + t.key + '" data-value="' + t.key + '">' + t.label + "</button>";
      }).join("");
    tagGroup.addEventListener("click", function (e) {
      var chip = e.target.closest(".chip");
      if (!chip) return;
      tagGroup.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("is-active"); });
      chip.classList.add("is-active");
      filters.tag = chip.dataset.value;
      render();
    });
  }

  // search (debounced)
  var searchTimer = null;
  $("#search").addEventListener("input", function (e) {
    var v = e.target.value.trim().toLowerCase();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () { filters.q = v; render(); }, 180);
  });

  /* ----------------------------------------- quick actions & helpers */
  // reset every filter and sync the toolbar UI back to its default state
  function resetFilters() {
    filters = { status: "all", type: "all", kind: "all", season: "all", tag: "all", q: "",
                favOnly: false, canonOnly: false };
    document.querySelectorAll(".chip-group").forEach(function (group) {
      group.querySelectorAll(".chip").forEach(function (c) {
        c.classList.toggle("is-active", c.dataset.value === "all");
      });
    });
    if (seasonSel) seasonSel.value = "all";
    var sb = $("#search"); if (sb) sb.value = "";
    document.querySelectorAll(".quick-toggle").forEach(function (b) { b.classList.remove("is-active"); });
  }

  // jump to an item on the tracker page, clearing filters if it's hidden, then flash it
  function goToItem(id) {
    showPage("tracker");
    var sel = '.card[data-id="' + CSS.escape(id) + '"]';
    if (!timelineEl.querySelector(sel)) { resetFilters(); render(); }
    var card = timelineEl.querySelector(sel);
    if (!card) return;
    card.scrollIntoView({ block: "center" });
    card.classList.remove("flash"); void card.offsetWidth; card.classList.add("flash");
  }

  var continueBtn = $("#btn-continue");
  if (continueBtn) continueBtn.addEventListener("click", function () {
    var next = TIMELINE.filter(function (i) { return !(state[i.id] && state[i.id].watched); })[0];
    if (next) goToItem(next.id);
    else toast("أحسنت! لقد شاهدت كل شيء 🎉");
  });

  var randomBtn = $("#btn-random");
  if (randomBtn) randomBtn.addEventListener("click", function () {
    var pool = TIMELINE.filter(passesFilter); // respects current filters
    if (!pool.length) { toast("لا توجد عناصر مطابقة للاختيار منها"); return; }
    goToItem(pool[Math.floor(Math.random() * pool.length)].id);
  });

  // favorites-only & canon-path toggles
  document.querySelectorAll(".quick-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var on = btn.classList.toggle("is-active");
      filters[btn.dataset.toggle] = on;
      btn.setAttribute("aria-pressed", String(on));
      render();
    });
  });

  /* --------------------------------------------------- export / import */
  function toast(msg) {
    var el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    el.classList.add("show");
    setTimeout(function () { el.classList.remove("show"); }, 2400);
    setTimeout(function () { el.hidden = true; }, 2800);
  }

  $("#btn-export").addEventListener("click", function () {
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "dc-tracker-backup.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("تم تصدير نسخة احتياطية من تقدّمك ✓");
  });

  $("#btn-import").addEventListener("click", function () { $("#file-import").click(); });
  $("#file-import").addEventListener("change", function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (typeof data !== "object" || data === null) throw new Error("bad");
        // merge: imported entries overwrite, others kept
        Object.keys(data).forEach(function (id) {
          var d = data[id] || {};
          state[id] = {
            watched: !!d.watched,
            rating: Math.max(0, Math.min(5, +d.rating || 0)),
            note: typeof d.note === "string" ? d.note : "",
            favorite: !!d.favorite,
            watchedAt: typeof d.watchedAt === "string" ? d.watchedAt : null,
          };
        });
        saveState();
        render();
        toast("تم استيراد تقدّمك بنجاح ✓");
      } catch (err) {
        toast("تعذّر قراءة الملف — تأكد أنه نسخة صحيحة");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  });

  /* ----------------------------------------------- chronology page */
  function renderChronology() {
    var host = $("#chronology");
    if (!host || !window.DC_TIMELINE) return;
    host.innerHTML = window.DC_TIMELINE.map(function (group) {
      var items = group.events.map(function (ev) {
        return (
          '<li class="chrono-item">' +
            '<span class="chrono-dot" aria-hidden="true"></span>' +
            '<span class="chrono-when">' + escapeHtml(ev.when) + "</span>" +
            '<span class="chrono-text">' + escapeHtml(ev.text) + "</span>" +
          "</li>"
        );
      }).join("");
      return (
        '<section class="chrono-era">' +
          '<header class="chrono-era-head">' +
            '<span class="chrono-era-title">' + escapeHtml(group.era) + "</span>" +
            (group.note ? '<span class="chrono-era-note">' + escapeHtml(group.note) + "</span>" : "") +
          "</header>" +
          '<ul class="chrono-list">' + items + "</ul>" +
        "</section>"
      );
    }).join("");
  }
  renderChronology();

  /* ----------------------------------------------- characters page */
  function renderCharacters() {
    var host = $("#characters");
    if (!host || !window.DC_CHARACTERS) return;
    host.innerHTML = window.DC_CHARACTERS.map(function (group) {
      var cards = group.chars.map(function (c) {
        var initial = (c.name || "؟").trim().charAt(0);
        return (
          '<article class="char-tile">' +
            '<span class="char-portrait" data-i="' + escapeHtml(initial) + '">' +
              '<img src="' + escapeHtml(c.img) + '" alt="' + escapeHtml(c.name) +
                '" loading="lazy" onerror="this.remove()" />' +
            "</span>" +
            '<div class="char-tile-body">' +
              '<h4>' + escapeHtml(c.name) + "</h4>" +
              "<p>" + escapeHtml(c.desc) + "</p>" +
            "</div>" +
          "</article>"
        );
      }).join("");
      return (
        '<section class="char-group' + (group.villain ? " char-group-villain" : "") + '">' +
          '<header class="chrono-era-head"><span class="chrono-era-title">' +
            escapeHtml(group.group) + "</span></header>" +
          '<div class="char-tiles">' + cards + "</div>" +
        "</section>"
      );
    }).join("");
  }
  renderCharacters();

  /* ------------------------------------------------- stats dashboard */
  function fmtNum(n) { return n.toLocaleString("ar-EG"); }
  function pctOf(a, b) { return b ? Math.round((a / b) * 100) : 0; }

  function fmtDuration(mins) {
    if (mins <= 0) return "اكتمل";
    var d = Math.floor(mins / 1440), h = Math.round((mins % 1440) / 60);
    if (d > 0) return fmtNum(d) + " يومًا" + (h ? " و" + h + " ساعة" : "");
    if (mins >= 60) return fmtNum(Math.round(mins / 60)) + " ساعة";
    return fmtNum(mins) + " دقيقة";
  }

  function computeStats() {
    var s = {
      epW: 0, mvW: 0, canonW: 0, canonT: 0, fillerW: 0, fillerT: 0,
      favs: 0, ratedCount: 0, ratingSum: 0, ratingDist: [0, 0, 0, 0, 0],
      history: [],
    };
    TIMELINE.forEach(function (i) {
      var st = state[i.id];
      var w = !!(st && st.watched);
      if (i.type === "episode") {
        if (i.kind === "filler") { s.fillerT++; if (w) s.fillerW++; }
        else { s.canonT++; if (w) s.canonW++; }
        if (w) s.epW++;
      } else if (w) s.mvW++;
      if (st && st.favorite) s.favs++;
      if (st && st.rating) { s.ratedCount++; s.ratingSum += st.rating; s.ratingDist[st.rating - 1]++; }
      if (st && st.watched && st.watchedAt) s.history.push({ item: i, at: st.watchedAt });
    });
    s.history.sort(function (a, b) { return a.at < b.at ? 1 : -1; });
    // estimated remaining time: ~24 min/episode, ~105 min/movie
    s.remMins = (EP_TOTAL - s.epW) * 24 + (MV_TOTAL - s.mvW) * 105;
    return s;
  }

  function statCard(value, label, sub, cls) {
    return '<div class="stat-card ' + (cls || "") + '"><span class="stat-value">' + value +
      '</span><span class="stat-label">' + label + "</span>" +
      (sub ? '<span class="stat-sub">' + sub + "</span>" : "") + "</div>";
  }

  function barRow(label, w, t, extra) {
    var p = pctOf(w, t);
    return '<div class="bar-row"><span class="bar-label">' + label + '</span>' +
      '<span class="bar-track"><span class="bar-fill ' + (extra || "") + '" style="width:' + p + '%"></span></span>' +
      '<span class="bar-num">' + fmtNum(w) + " / " + fmtNum(t) + "</span></div>";
  }

  function renderStats() {
    var host = $("#stats-body");
    if (!host) return;
    var s = computeStats();
    var totalW = s.epW + s.mvW, totalT = EP_TOTAL + MV_TOTAL;
    var avg = s.ratedCount ? (s.ratingSum / s.ratedCount).toFixed(1) : "—";

    // summary cards
    var cards =
      statCard(pctOf(totalW, totalT) + "%", "نسبة الإنجاز الكلية", fmtNum(totalW) + " / " + fmtNum(totalT)) +
      statCard(fmtNum(s.epW), "حلقات مشاهَدة", "من " + fmtNum(EP_TOTAL), "c-ep") +
      statCard(fmtNum(s.mvW), "أفلام مشاهَدة", "من " + fmtNum(MV_TOTAL), "c-mv") +
      statCard(fmtNum(s.favs), "في المفضّلة", "", "c-fav") +
      statCard(avg + " ★", "متوسّط تقييمك", fmtNum(s.ratedCount) + " مُقيَّم", "c-rate") +
      statCard(fmtDuration(s.remMins), "الوقت المتبقّي (تقديري)", "للمحتوى غير المشاهَد", "c-time");

    // canon vs filler + episodes/movies bars
    var bars =
      barRow("القصة الأصلية", s.canonW, s.canonT, "f-canon") +
      barRow("الحشو", s.fillerW, s.fillerT, "f-filler") +
      barRow("الحلقات", s.epW, EP_TOTAL, "f-ep") +
      barRow("الأفلام", s.mvW, MV_TOTAL, "f-mv");

    // ratings distribution (5★ down to 1★)
    var maxR = Math.max.apply(null, s.ratingDist.concat([1]));
    var dist = "";
    for (var r = 5; r >= 1; r--) {
      var c = s.ratingDist[r - 1];
      dist += '<div class="bar-row"><span class="bar-label">' + r + " ★</span>" +
        '<span class="bar-track"><span class="bar-fill f-rate" style="width:' + pctOf(c, maxR) + '%"></span></span>' +
        '<span class="bar-num">' + fmtNum(c) + "</span></div>";
    }

    // per-tag completion
    var tagBars = TAGS.map(function (t) {
      var tot = 0, w = 0;
      TIMELINE.forEach(function (i) {
        if (i.type === "episode" && i.tags && i.tags.indexOf(t.key) !== -1) {
          tot++; if (state[i.id] && state[i.id].watched) w++;
        }
      });
      return barRow(t.label, w, tot, "f-tag pill-" + t.key);
    }).join("");

    // per-season completion
    var seasonBars = SEASONS.map(function (se) {
      var w = TIMELINE.filter(function (i) {
        return i.type === "episode" && i.season === se.season && state[i.id] && state[i.id].watched;
      }).length;
      return barRow("الموسم " + se.season, w, se.total, "f-season");
    }).join("");

    // recent watch history grouped by date
    var hist;
    if (!s.history.length) {
      hist = '<p class="muted">لم تسجّل أي مشاهدة بعد. ستظهر هنا الحلقات التي تعلّمها كـ«مُشاهَد».</p>';
    } else {
      var groups = {}, order = [];
      s.history.slice(0, 60).forEach(function (h) {
        var key = h.at.slice(0, 10);
        if (!groups[key]) { groups[key] = []; order.push(key); }
        groups[key].push(h.item);
      });
      hist = order.map(function (key) {
        var dateLabel = new Date(key + "T00:00:00").toLocaleDateString("ar-EG",
          { year: "numeric", month: "long", day: "numeric" });
        var rows = groups[key].map(function (it) {
          var num = it.type === "movie" ? (it.label || "فيلم") : "حلقة " + it.numberLabel;
          return '<li><a href="#" class="hist-link" data-goto="' + it.id + '"><span class="hist-num">' +
            escapeHtml(num) + "</span> " + escapeHtml(it.title) + "</a></li>";
        }).join("");
        return '<div class="hist-day"><h4 class="hist-date">' + escapeHtml(dateLabel) + " · " +
          fmtNum(groups[key].length) + " عنصر</h4><ul class=\"hist-list\">" + rows + "</ul></div>";
      }).join("");
    }

    host.innerHTML =
      '<div class="stat-cards">' + cards + "</div>" +
      '<section class="panel stat-block"><h3 class="story-h">القصة مقابل الحشو</h3>' +
        '<div class="bars">' + bars + "</div></section>" +
      '<section class="panel stat-block"><h3 class="story-h">توزيع تقييماتك</h3>' +
        '<div class="bars">' + dist + "</div></section>" +
      '<section class="panel stat-block"><h3 class="story-h">الإنجاز حسب القوس</h3>' +
        '<div class="bars">' + tagBars + "</div></section>" +
      '<section class="panel stat-block"><h3 class="story-h">الإنجاز حسب الموسم</h3>' +
        '<div class="bars bars-scroll">' + seasonBars + "</div></section>" +
      '<section class="panel stat-block"><h3 class="story-h">سجلّ المشاهدة الأخير</h3>' + hist + "</section>";
  }

  // clicking a history entry jumps to that item on the tracker
  var statsBodyEl = $("#stats-body");
  if (statsBodyEl) statsBodyEl.addEventListener("click", function (e) {
    var link = e.target.closest(".hist-link");
    if (link) { e.preventDefault(); goToItem(link.dataset.goto); }
  });

  /* ------------------------------------------- reference sub-pages */
  function setHtml(sel, html) { var el = $(sel); if (el) el.innerHTML = html; }

  function renderMovies() {
    var movies = (window.DC_MOVIES || []);
    setHtml("#movies-body",
      '<p class="muted sub-intro">الأفلام بترتيب مشاهدتها على الخط الزمني للأنمي. انقر أيّ فيلم للانتقال إليه في القائمة.</p>' +
      '<div class="movie-grid">' + movies.map(function (m) {
        var st = state[m.id] || {};
        return '<button class="movie-card' + (st.watched ? " watched" : "") + (m.crossover ? " is-crossover" : "") +
          '" data-goto="' + m.id + '" type="button">' +
          '<span class="movie-poster"><img src="' + escapeHtml(moviePoster(m)) + '" alt="' + escapeHtml(m.title) +
            '" loading="lazy" onerror="this.closest(\'.movie-poster\').classList.add(\'noposter\');this.remove()" />' +
            '<span class="movie-num">' + (m.crossover ? "✦" : escapeHtml(String(m.number))) + "</span></span>" +
          '<span class="movie-info"><span class="movie-name">' + escapeHtml(m.title) + "</span>" +
          '<span class="movie-meta">' + (m.year ? escapeHtml(String(m.year)) + " · " : "") +
            "بعد الحلقة " + m.afterEpisode + "</span></span>" +
          (st.watched ? '<span class="movie-seen">شوهد ✓</span>' : "") +
          "</button>";
      }).join("") + "</div>");
  }

  function renderArcs() {
    var arcs = (window.DC_REFERENCE && window.DC_REFERENCE.arcs) || [];
    setHtml("#arcs-body", '<div class="arc-list">' + arcs.map(function (a) {
      return '<article class="arc-card"><div class="arc-head"><h3>' + escapeHtml(a.name) + "</h3>" +
        '<span class="arc-eps">' + escapeHtml(a.eps) + "</span></div>" +
        "<p>" + escapeHtml(a.desc) + "</p></article>";
    }).join("") + "</div>");
  }

  function renderBlackOrg() {
    var R = window.DC_REFERENCE || {};
    var members = (R.blackorg || []).map(function (m) {
      return '<article class="dossier-card' + (m.villain ? " villain" : " ally") + '">' +
        '<div class="dossier-code">' + escapeHtml(m.code) + "</div>" +
        '<div class="dossier-name">' + escapeHtml(m.name) + "</div>" +
        '<p class="dossier-role">' + escapeHtml(m.role) + "</p>" +
        '<span class="dossier-tag">' + (m.villain ? "عضو" : "مخترِق/منشقّ") + "</span></article>";
    }).join("");
    setHtml("#blackorg-body",
      '<div class="aptx-box"><span class="aptx-k">APTX 4869</span><p>' + escapeHtml(R.aptx || "") + "</p></div>" +
      '<div class="dossier-grid">' + members + "</div>");
  }

  function renderGadgets() {
    var g = (window.DC_REFERENCE && window.DC_REFERENCE.gadgets) || [];
    setHtml("#gadgets-body", '<div class="gadget-grid">' + g.map(function (x) {
      return '<article class="gadget-card"><span class="gadget-ic">' + x.icon + "</span>" +
        "<h4>" + escapeHtml(x.name) + "</h4><p>" + escapeHtml(x.desc) + "</p></article>";
    }).join("") + "</div>");
  }

  function renderGlossary() {
    var g = (window.DC_REFERENCE && window.DC_REFERENCE.glossary) || [];
    setHtml("#glossary-body", '<dl class="glossary">' + g.map(function (x) {
      return "<dt>" + escapeHtml(x.term) + "</dt><dd>" + escapeHtml(x.def) + "</dd>";
    }).join("") + "</dl>");
  }

  function listTable(rows) {
    return '<table class="lore-table"><thead><tr><th>#</th><th>العنوان</th><th>التاريخ</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return "<tr><td class='lt-num'>" + r.n + "</td><td dir=\"auto\">" + escapeHtml(r.title) +
          "</td><td class='lt-date'>" + escapeHtml(r.date || "—") + "</td></tr>";
      }).join("") + "</tbody></table>";
  }

  function renderSpecials() {
    var L = window.DC_LORE || {};
    var ovas = L.ovas || [], specials = L.specials || [];
    setHtml("#specials-body",
      '<p class="muted sub-intro">العناوين بالإنجليزية كما وردت في المصدر.</p>' +
      '<section class="lore-block"><h3 class="story-h">الحلقات الخاصة (' + specials.length + ")</h3>" +
        listTable(specials) + "</section>" +
      '<section class="lore-block"><h3 class="story-h">إصدارات OVA (' + ovas.length + ")</h3>" +
        listTable(ovas) + "</section>");
  }

  function renderManga() {
    var vols = (window.DC_LORE && window.DC_LORE.volumes) || [];
    setHtml("#manga-body",
      '<p class="muted sub-intro">عدد المجلّدات: ' + fmtNum(vols.length) + " — مع نطاق فصول كلٍّ منها وتاريخ صدوره الياباني.</p>" +
      '<div class="vol-grid">' + vols.map(function (v) {
        return '<div class="vol-chip"><span class="vol-n">' + v.vol + "</span>" +
          '<span class="vol-ch">الفصول ' + escapeHtml(v.chapters) + "</span>" +
          (v.date ? '<span class="vol-d">' + escapeHtml(v.date) + "</span>" : "") + "</div>";
      }).join("") + "</div>");
  }

  function renderSongs() {
    var songs = (window.DC_LORE && window.DC_LORE.songs) || [];
    var SEC = { "Opening themes": "شارات البداية", "Closing themes": "شارات النهاية",
                "Movie themes": "شارات الأفلام", "Drama themes": "شارات الدراما" };
    var order = ["Opening themes", "Closing themes", "Movie themes", "Drama themes"];
    var html = '<p class="muted sub-intro">عناوين الشارات ومؤدّوها فقط.</p>';
    order.forEach(function (sec) {
      var rows = songs.filter(function (s) { return s.section === sec; });
      if (!rows.length) return;
      html += '<section class="lore-block"><h3 class="story-h">' + (SEC[sec] || sec) + " (" + rows.length + ")</h3>" +
        '<table class="lore-table"><thead><tr><th>#</th><th>العنوان</th><th>المؤدّي</th><th>الحلقات/السنة</th></tr></thead><tbody>' +
        rows.map(function (s) {
          return "<tr><td class='lt-num'>" + s.n + "</td><td dir=\"auto\">" + escapeHtml(s.title) +
            "</td><td dir=\"auto\">" + escapeHtml(s.artist) + "</td><td class='lt-date'>" +
            escapeHtml(s.episodes || s.year || "") + "</td></tr>";
        }).join("") + "</tbody></table></section>";
    });
    setHtml("#songs-body", html);
  }

  // render all reference content once
  renderMovies(); renderArcs(); renderBlackOrg(); renderGadgets();
  renderGlossary(); renderSpecials(); renderManga(); renderSongs();

  // hub cards + back buttons navigate like tabs
  document.querySelectorAll(".hub-card, .back-btn").forEach(function (el) {
    el.addEventListener("click", function () { showPage(el.dataset.page); });
  });
  // movie cards jump to the tracker timeline
  var moviesBody = $("#movies-body");
  if (moviesBody) moviesBody.addEventListener("click", function (e) {
    var b = e.target.closest("[data-goto]");
    if (b) goToItem(b.dataset.goto);
  });

  /* ------------------------------------------------------- page nav */
  var REF_PAGES = ["reference", "movies", "arcs", "blackorg", "gadgets", "glossary", "specials", "manga", "songs"];
  var navTabs = document.querySelectorAll(".nav-tab");
  function showPage(page) {
    document.querySelectorAll(".page").forEach(function (p) {
      p.hidden = p.id !== "page-" + page;
    });
    if (page === "stats") renderStats(); // recompute from latest progress on each visit
    if (page === "movies") renderMovies(); // reflect latest watched state on movie cards
    // reference sub-pages keep the "المرجع" tab highlighted
    var activeTab = REF_PAGES.indexOf(page) !== -1 ? "reference" : page;
    navTabs.forEach(function (t) { t.classList.toggle("is-active", t.dataset.page === activeTab); });
    if (location.hash !== "#" + page) {
      try { history.replaceState(null, "", "#" + page); } catch (e) {}
    }
    window.scrollTo(0, 0);
  }
  navTabs.forEach(function (t) {
    t.addEventListener("click", function () { showPage(t.dataset.page); });
  });
  var initialPage = (location.hash || "").replace("#", "");
  var DEEP_PAGES = ["story", "characters", "chrono", "stats"].concat(REF_PAGES);
  if (DEEP_PAGES.indexOf(initialPage) !== -1) showPage(initialPage);

  /* --------------------------------------------------------------- go */
  render();
})();
