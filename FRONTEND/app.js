//
// SNOWWFLIX POLISH + MOBILE FEATURES
//

document.addEventListener("DOMContentLoaded", () => {


/* =========================
   NAVBAR SCROLL EFFECT
========================= */

const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {

    if(window.scrollY > 20){
        navbar.style.boxShadow =
        "0 8px 25px rgba(0,0,0,.5)";
    }
    else{
        navbar.style.boxShadow = "none";
    }

});



/* =========================
   MOVIE CARD ANIMATION
========================= */

// Animate cards if any already exist; never leave them stuck invisible
  const cards = document.querySelectorAll(".movie-card");
  cards.forEach((card, index) => {
    card.style.opacity = "1";
    card.style.transform = "translateY(0)";
  });



/* =========================
   BUTTON RIPPLE EFFECT
========================= */

const buttons =
document.querySelectorAll(
".primary-btn,.ghost-btn"
);


buttons.forEach(btn=>{

btn.addEventListener("click",function(e){

    const ripple=document.createElement("span");

    ripple.style.position="absolute";
    ripple.style.width="20px";
    ripple.style.height="20px";
    ripple.style.background="rgba(255,255,255,.5)";
    ripple.style.borderRadius="50%";
    ripple.style.transform="scale(0)";
    ripple.style.animation="ripple .5s linear";

    this.style.position="relative";
    this.appendChild(ripple);


    setTimeout(()=>{
        ripple.remove();
    },500);


});


});



/* =========================
   MOBILE MENU
========================= */

const menuBtn =
document.querySelector(".mobile-menu-btn");

const menu =
document.querySelector(".nav-left");


if(menuBtn){

menuBtn.addEventListener("click",()=>{

    menu.classList.toggle("mobile-open");

});

}



/* =========================
   IMAGE LAZY LOADING
========================= */

const images =
document.querySelectorAll("img");


images.forEach(img=>{

img.loading="lazy";

});



/* Back-to-top button removed (was too large on mobile) */

}); // end DOMContentLoaded polish

const API_KEY = "AIzaSyB6zk-Y9XP5fKPgKCA4IGvO0a5cjkglK6g";
const BASE_URL = "https://www.googleapis.com/youtube/v3";
// Free YouTube search proxies (no API key / quota). Tried when Google quota is exhausted.
const PIPED_SEARCH_ENDPOINTS = [
  "https://api.piped.private.coffee/search",
  "https://pipedapi.adminforge.de/search",
  "https://pipedapi.reallyaweso.me/search"
];

let movies = [];
let nextPageToken = "";
let fetching = false;
let heroIndex = 0;
let heroInterval;
let heroPool = [];
const categoryData = {};

const CATEGORY_QUERIES = {
  trending: "trending movie trailers",
  top50: "best movie trailers of all time",
  thriller: "thriller movie official trailer",
  horror: "horror movie official trailer",
  animation: "animated movie official trailer",
  romance: "romance movie official trailer",
  drama: "drama movie official trailer"
};

// Category-specific fallbacks so filtering works even when YouTube quota is exceeded
const FALLBACK_BY_CAT = {
  trending: [
    { id: "TcMBFSGVi1c", title: "Avengers: Endgame - Official Trailer", thumb: "https://i.ytimg.com/vi/TcMBFSGVi1c/mqdefault.jpg", channel: "Marvel Studios" },
    { id: "8g18jFHCLXk", title: "Dune | Official Trailer", thumb: "https://i.ytimg.com/vi/8g18jFHCLXk/mqdefault.jpg", channel: "Warner Bros." },
    { id: "zSWdZVtXT7E", title: "Interstellar Official Trailer", thumb: "https://i.ytimg.com/vi/zSWdZVtXT7E/mqdefault.jpg", channel: "Paramount" },
    { id: "EXeTwQWrcwY", title: "The Dark Knight Trailer", thumb: "https://i.ytimg.com/vi/EXeTwQWrcwY/mqdefault.jpg", channel: "Warner Bros." },
    { id: "YoHD9XEInc0", title: "Inception Official Trailer", thumb: "https://i.ytimg.com/vi/YoHD9XEInc0/mqdefault.jpg", channel: "Warner Bros." },
    { id: "zAGVQLHvwOY", title: "Joker Official Trailer", thumb: "https://i.ytimg.com/vi/zAGVQLHvwOY/mqdefault.jpg", channel: "Warner Bros." },
    { id: "giXco2jaZ_4", title: "Top Gun: Maverick Official Trailer", thumb: "https://i.ytimg.com/vi/giXco2jaZ_4/mqdefault.jpg", channel: "Paramount" },
    { id: "n9xhJrPXop4", title: "Dune: Part Two Official Trailer", thumb: "https://i.ytimg.com/vi/n9xhJrPXop4/mqdefault.jpg", channel: "Warner Bros." }
  ],
  top50: [
    { id: "EXeTwQWrcwY", title: "The Dark Knight Trailer", thumb: "https://i.ytimg.com/vi/EXeTwQWrcwY/mqdefault.jpg", channel: "Warner Bros." },
    { id: "zSWdZVtXT7E", title: "Interstellar Official Trailer", thumb: "https://i.ytimg.com/vi/zSWdZVtXT7E/mqdefault.jpg", channel: "Paramount" },
    { id: "YoHD9XEInc0", title: "Inception Official Trailer", thumb: "https://i.ytimg.com/vi/YoHD9XEInc0/mqdefault.jpg", channel: "Warner Bros." },
    { id: "TcMBFSGVi1c", title: "Avengers: Endgame - Official Trailer", thumb: "https://i.ytimg.com/vi/TcMBFSGVi1c/mqdefault.jpg", channel: "Marvel Studios" },
    { id: "6ZfuNTqbHE8", title: "Avengers: Infinity War Official Trailer", thumb: "https://i.ytimg.com/vi/6ZfuNTqbHE8/mqdefault.jpg", channel: "Marvel Studios" },
    { id: "aWzlQ2N6qqg", title: "Doctor Strange in the Multiverse of Madness", thumb: "https://i.ytimg.com/vi/aWzlQ2N6qqg/mqdefault.jpg", channel: "Marvel Studios" },
    { id: "8g18jFHCLXk", title: "Dune | Official Trailer", thumb: "https://i.ytimg.com/vi/8g18jFHCLXk/mqdefault.jpg", channel: "Warner Bros." },
    { id: "zAGVQLHvwOY", title: "Joker Official Trailer", thumb: "https://i.ytimg.com/vi/zAGVQLHvwOY/mqdefault.jpg", channel: "Warner Bros." }
  ],
  thriller: [
    { id: "EXeTwQWrcwY", title: "The Dark Knight Trailer", thumb: "https://i.ytimg.com/vi/EXeTwQWrcwY/mqdefault.jpg", channel: "Warner Bros." },
    { id: "zAGVQLHvwOY", title: "Joker Official Trailer", thumb: "https://i.ytimg.com/vi/zAGVQLHvwOY/mqdefault.jpg", channel: "Warner Bros." },
    { id: "YoHD9XEInc0", title: "Inception Official Trailer", thumb: "https://i.ytimg.com/vi/YoHD9XEInc0/mqdefault.jpg", channel: "Warner Bros." },
    { id: "hNCmb-4oXJA", title: "Us - Official Trailer", thumb: "https://i.ytimg.com/vi/hNCmb-4oXJA/mqdefault.jpg", channel: "Universal Pictures" },
    { id: "sRfnevzM9kQ", title: "Get Out - Official Trailer", thumb: "https://i.ytimg.com/vi/sRfnevzM9kQ/mqdefault.jpg", channel: "Universal Pictures" },
    { id: "DzfpyUB60YY", title: "Get Out Official Trailer 1", thumb: "https://i.ytimg.com/vi/DzfpyUB60YY/mqdefault.jpg", channel: "Rotten Tomatoes Trailers" }
  ],
  horror: [
    { id: "V6wWKNij_1M", title: "Hereditary | Official Trailer HD | A24", thumb: "https://i.ytimg.com/vi/V6wWKNij_1M/mqdefault.jpg", channel: "A24" },
    { id: "x_me3xsvDgk", title: "It Official Trailer", thumb: "https://i.ytimg.com/vi/x_me3xsvDgk/mqdefault.jpg", channel: "Warner Bros." },
    { id: "WR7cc5t7tv8", title: "A Quiet Place (2018) - Official Trailer", thumb: "https://i.ytimg.com/vi/WR7cc5t7tv8/mqdefault.jpg", channel: "Paramount Pictures" },
    { id: "k10ETZ41q5o", title: "The Conjuring - Official Main Trailer", thumb: "https://i.ytimg.com/vi/k10ETZ41q5o/mqdefault.jpg", channel: "Warner Bros." },
    { id: "sRfnevzM9kQ", title: "Get Out - Official Trailer", thumb: "https://i.ytimg.com/vi/sRfnevzM9kQ/mqdefault.jpg", channel: "Universal Pictures" },
    { id: "bMgfsdYoEEo", title: "The Conjuring: Last Rites | Official Trailer", thumb: "https://i.ytimg.com/vi/bMgfsdYoEEo/mqdefault.jpg", channel: "Warner Bros." },
    { id: "hNCmb-4oXJA", title: "Us - Official Trailer", thumb: "https://i.ytimg.com/vi/hNCmb-4oXJA/mqdefault.jpg", channel: "Universal Pictures" }
  ],
  animation: [
    { id: "g4Hbz2jLxvQ", title: "Spider-Man: Into the Spider-Verse Trailer", thumb: "https://i.ytimg.com/vi/g4Hbz2jLxvQ/mqdefault.jpg", channel: "Sony Pictures" },
    { id: "xlnPHQ3TLX8", title: "Coco - Official US Trailer", thumb: "https://i.ytimg.com/vi/xlnPHQ3TLX8/mqdefault.jpg", channel: "Pixar" },
    { id: "CaimKeDcudo", title: "Disney's Encanto | Official Trailer", thumb: "https://i.ytimg.com/vi/CaimKeDcudo/mqdefault.jpg", channel: "Walt Disney Animation Studios" },
    { id: "_inKs4eeHiI", title: "KUNG FU PANDA 4 | Official Trailer", thumb: "https://i.ytimg.com/vi/_inKs4eeHiI/mqdefault.jpg", channel: "Universal Pictures" },
    { id: "8ugaeA-nMTc", title: "Frozen 2 Official Trailer", thumb: "https://i.ytimg.com/vi/8ugaeA-nMTc/mqdefault.jpg", channel: "Disney" },
    { id: "jjudmcSxzpc", title: "COCO Official Trailer (2017) Disney Pixar", thumb: "https://i.ytimg.com/vi/jjudmcSxzpc/mqdefault.jpg", channel: "ONE Media" }
  ],
  romance: [
    { id: "FC6biTjEyZw", title: "The Notebook Official Trailer", thumb: "https://i.ytimg.com/vi/FC6biTjEyZw/mqdefault.jpg", channel: "New Line" },
    { id: "1d0Zf9sXlHk", title: "Titanic Official Trailer", thumb: "https://i.ytimg.com/vi/1d0Zf9sXlHk/mqdefault.jpg", channel: "Paramount" },
    { id: "0pdqf4P9MB8", title: "Pride & Prejudice Trailer", thumb: "https://i.ytimg.com/vi/0pdqf4P9MB8/mqdefault.jpg", channel: "Focus Features" },
    { id: "ZQ-YX-5bAs0", title: "Crazy Rich Asians Trailer", thumb: "https://i.ytimg.com/vi/ZQ-YX-5bAs0/mqdefault.jpg", channel: "Warner Bros." },
    { id: "Y1xs_xPb46M", title: "Notting Hill Trailer", thumb: "https://i.ytimg.com/vi/Y1xs_xPb46M/mqdefault.jpg", channel: "Universal" },
    { id: "dZOaI_Fn5o4", title: "Anyone But You Trailer", thumb: "https://i.ytimg.com/vi/dZOaI_Fn5o4/mqdefault.jpg", channel: "Sony" }
  ],
  drama: [
    { id: "6hB3S9bIaco", title: "The Shawshank Redemption Trailer", thumb: "https://i.ytimg.com/vi/6hB3S9bIaco/mqdefault.jpg", channel: "Warner Bros." },
    { id: "bLvqoHBptjg", title: "Forrest Gump Trailer", thumb: "https://i.ytimg.com/vi/bLvqoHBptjg/mqdefault.jpg", channel: "Paramount" },
    { id: "7d_jQycdQGo", title: "Whiplash Official Trailer", thumb: "https://i.ytimg.com/vi/7d_jQycdQGo/mqdefault.jpg", channel: "Sony" },
    { id: "zSWdZVtXT7E", title: "Interstellar Official Trailer", thumb: "https://i.ytimg.com/vi/zSWdZVtXT7E/mqdefault.jpg", channel: "Paramount" },
    { id: "lB95KLmpLR4", title: "The Social Network Trailer", thumb: "https://i.ytimg.com/vi/lB95KLmpLR4/mqdefault.jpg", channel: "Sony" },
    { id: "YoHD9XEInc0", title: "Inception Official Trailer", thumb: "https://i.ytimg.com/vi/YoHD9XEInc0/mqdefault.jpg", channel: "Warner Bros." }
  ],
  search: [
    { id: "8g18jFHCLXk", title: "Dune | Official Trailer", thumb: "https://i.ytimg.com/vi/8g18jFHCLXk/mqdefault.jpg", channel: "Warner Bros." },
    { id: "n9xhJrPXop4", title: "Dune: Part Two Official Trailer", thumb: "https://i.ytimg.com/vi/n9xhJrPXop4/mqdefault.jpg", channel: "Warner Bros." },
    { id: "U2Qp5pL3ovA", title: "Dune Official Trailer HD", thumb: "https://i.ytimg.com/vi/U2Qp5pL3ovA/mqdefault.jpg", channel: "Warner Bros." },
    { id: "zSWdZVtXT7E", title: "Interstellar Official Trailer", thumb: "https://i.ytimg.com/vi/zSWdZVtXT7E/mqdefault.jpg", channel: "Paramount" },
    { id: "YoHD9XEInc0", title: "Inception Official Trailer", thumb: "https://i.ytimg.com/vi/YoHD9XEInc0/mqdefault.jpg", channel: "Warner Bros." }
  ]
};

const FALLBACK_MOVIES = FALLBACK_BY_CAT.trending;


function lightThumb(urlOrId) {
  if (!urlOrId) return "";
  const s = String(urlOrId);
  if (s.includes("ytimg.com")) {
    return s
      .replace(/\/(default|hqdefault|maxresdefault|sddefault|mqdefault)\.jpg/i, "/mqdefault.jpg")
      .replace(/\/(default|hqdefault|maxresdefault|sddefault)\.webp/i, "/mqdefault.jpg");
  }
  if (/^[\w-]{11}$/.test(s)) return "https://i.ytimg.com/vi/" + s + "/mqdefault.jpg";
  return s;
}


function getFallback(cat, max = 10) {
  const key = (cat || "trending").toLowerCase().trim();
  let pool = FALLBACK_BY_CAT[key];

  // Free-text / search: scan ALL fallback titles for matches
  if (!pool) {
    const q = key.replace(/\s+(official\s+)?trailer(s)?$/i, "").trim();
    const all = [];
    const seen = new Set();
    Object.keys(FALLBACK_BY_CAT).forEach((k) => {
      (FALLBACK_BY_CAT[k] || []).forEach((m) => {
        if (!m || !m.id || seen.has(m.id)) return;
        seen.add(m.id);
        all.push(m);
      });
    });
    const needle = q.toLowerCase();
    const matched = all.filter((m) => (m.title || "").toLowerCase().includes(needle));
    if (matched.length) {
      pool = matched;
    } else if (needle.includes("horror")) pool = FALLBACK_BY_CAT.horror;
    else if (needle.includes("thriller")) pool = FALLBACK_BY_CAT.thriller;
    else if (needle.includes("animat") || needle.includes("pixar") || needle.includes("disney")) pool = FALLBACK_BY_CAT.animation;
    else if (needle.includes("romance") || needle.includes("love")) pool = FALLBACK_BY_CAT.romance;
    else if (needle.includes("drama")) pool = FALLBACK_BY_CAT.drama;
    else pool = FALLBACK_BY_CAT.trending;
  }

  const list = [];
  const src = pool || FALLBACK_BY_CAT.trending || [];
  for (let i = 0; i < Math.min(max, Math.max(src.length, max)); i++) {
    const m = src[i % src.length];
    list.push({
      id: m.id,
      title: m.title,
      thumb: m.thumb || ("https://i.ytimg.com/vi/" + m.id + "/mqdefault.jpg"),
      channel: m.channel || ""
    });
  }
  return list;
}


function pseudoRatings(seed) {
  const s = String(seed || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const imdb = (6.5 + (s % 30) / 10).toFixed(1);
  const rt = 55 + (s % 40);
  return { imdb, rt };
}

const movieGrid = document.getElementById("movie-grid");
const searchBar = document.getElementById("search-bar");
const suggestions = document.getElementById("suggestions");
const heroPoster = document.getElementById("hero-poster");
const heroTitle = document.getElementById("hero-title");
const heroWatch = document.getElementById("hero-watch");
const heroMeta = document.getElementById("hero-meta");
const heroDots = document.getElementById("hero-dots");
const trailerModal = document.getElementById("trailer-modal");
const playerFrame = document.getElementById("player-frame");

async function fetchCategory(cat, max = 8) {
  const query = CATEGORY_QUERIES[cat] || cat;
  try {
    const res = await fetch(
      `${BASE_URL}/search?part=snippet&maxResults=${max}&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`
    );
    const data = await res.json();
    if (data.error) {
      console.warn("YouTube API error (fallback):", cat, data.error.message);
      return getFallback(cat, max);
    }
    if (!data.items || !data.items.length) {
      console.warn("No items for", cat, "— using fallback");
      return getFallback(cat, max);
    }
    return data.items
      .filter((i) => i.id && i.id.videoId)
      .map((i) => ({
        id: i.id.videoId,
        title: i.snippet.title,
        thumb: lightThumb((i.snippet.thumbnails.medium || i.snippet.thumbnails.default || i.snippet.thumbnails.high || {}).url || ""),
        channel: i.snippet.channelTitle
      }));
  } catch (err) {
    console.warn("Category fetch error (fallback):", cat, err);
    return getFallback(cat, max);
  }
}

async function fetchMovies(query = "trending movie trailers", append = true) {
  if (fetching) return;
  fetching = true;
  try {
    const res = await fetch(
      `${BASE_URL}/search?part=snippet&maxResults=8&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}&pageToken=${nextPageToken}`
    );
    const data = await res.json();
    if (data.error || !data.items || !data.items.length) {
      console.warn("fetchMovies failed — using fallback", data.error?.message);
      const items = getFallback(query || "search", 12);
      if (append) movies.push(...items);
      else movies = items;
      if (!append && items.length) {
        heroPool = items.slice(0, 8);
        heroIndex = 0;
        setHero(heroPool[0]);
        buildHeroDots();
        startHeroRotation();
      }
      if (movieGrid && !movieGrid.classList.contains("hidden")) renderMovies();
      fetching = false;
      return;
    }
    nextPageToken = data.nextPageToken || "";
    const items = data.items
      .filter((i) => i.id && i.id.videoId)
      .map((i) => ({
        id: i.id.videoId,
        title: i.snippet.title,
        thumb: lightThumb((i.snippet.thumbnails.medium || i.snippet.thumbnails.default || i.snippet.thumbnails.high || {}).url || ""),
        channel: i.snippet.channelTitle
      }));
    if (append) movies.push(...items);
    else movies = items;
    if (!append && items.length) {
      heroPool = items.slice(0, 8);
      heroIndex = 0;
      setHero(heroPool[0]);
      buildHeroDots();
      startHeroRotation();
    }
    if (movieGrid && !movieGrid.classList.contains("hidden")) renderMovies();
  } catch (err) {
    console.warn("Fetch error (fallback):", err);
    const items = getFallback(query || "search", 12);
    if (append) movies.push(...items);
    else movies = items;
    if (!append && items.length) {
      heroPool = items.slice(0, 8);
      heroIndex = 0;
      setHero(heroPool[0]);
      buildHeroDots();
      startHeroRotation();
    }
    if (movieGrid && !movieGrid.classList.contains("hidden")) renderMovies();
  }
  fetching = false;
}

function createCard(m, index, listRef, options = {}) {
  const card = document.createElement("article");
  card.className = "movie-card" + (options.topRated ? " card-top50" : "");
  const ratings = options.topRated ? pseudoRatings(m.id || m.title) : null;
  const ratingHtml = ratings
    ? `<div class="card-ratings"><span class="badge-imdb" title="IMDb style">★ ${ratings.imdb}</span><span class="badge-rt" title="Rotten Tomatoes style">${ratings.rt}%</span></div>`
    : "";
  card.innerHTML = `
    <div class="card-thumb">
      <img src="${lightThumb(m.id)}" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/' + this.dataset.vid + '/hqdefault.jpg';" data-vid="${m.id}" />
      <div class="card-play">▶</div>
      ${ratings ? `<div class="card-rank">#${index + 1}</div>` : ""}
    </div>
    <div class="card-body">
      <h3 title="${String(m.title||"").replace(/"/g, "&quot;")}">${m.title}</h3>
      <p class="card-channel">${m.channel || ""}</p>
      ${ratingHtml}
    </div>
  `;
  card.addEventListener("click", () => openBigScreen(m.id, m.title));
  card.addEventListener("mouseenter", () => {
    clearInterval(heroInterval);
    if (listRef && listRef[index]) {
      setHero(listRef[index]);
    }
  });
  card.addEventListener("mouseleave", () => startHeroRotation());
  return card;
}

function renderMovies() {
  if (!movieGrid) return;
  movieGrid.innerHTML = "";
  movies.forEach((m, index) => {
    movieGrid.appendChild(createCard(m, index, movies));
  });
}

function renderRow(containerId, items, options = {}) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = "";
  if (!items || !items.length) {
    el.innerHTML = `<p class="row-empty">No trailers loaded for this category. Try refreshing.</p>`;
    return;
  }
  const seen = new Set();
  const unique = [];
  items.forEach((m) => {
    if (!m || !m.id || seen.has(m.id)) return;
    seen.add(m.id);
    unique.push(m);
  });
  unique.forEach((m, index) => {
    el.appendChild(createCard(m, index, unique, options));
  });
}

function renderHeroCards(pool) {
  const rail = document.getElementById("hero-cards-rail");
  if (!rail) return;
  const slice = (pool || []).slice(0, 4);
  rail.innerHTML = "";
  slice.forEach((m, i) => {
    const mini = document.createElement("button");
    mini.type = "button";
    mini.className = "hero-mini-card" + (i === 0 ? " active" : "");
    mini.innerHTML = `
      <img src="${lightThumb(m.id)}" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/' + this.dataset.vid + '/hqdefault.jpg';" data-vid="${m.id}" />
      <span class="hero-mini-title">${m.title.replace(/</g, "&lt;").slice(0, 42)}</span>
    `;
    mini.addEventListener("click", () => {
      heroIndex = i;
      setHero(heroPool[i] || m);
      startHeroRotation();
      [...rail.children].forEach((c, idx) => c.classList.toggle("active", idx === i));
    });
    rail.appendChild(mini);
  });
}

function paintCategory(cat, items, options) {
  categoryData[cat] = items;
  indexMovies(items);
  renderRow("row-" + cat, items, options || {});
}

async function loadAllRows() {
  const rest = ["top50", "thriller", "horror", "animation", "romance", "drama"];

  // INSTANT: paint local fallbacks first (0 network wait)
  const trendingNow = getFallback("trending", 5);
  paintCategory("trending", trendingNow);
  heroPool = trendingNow.slice(0, 4);
  heroIndex = 0;
  setHero(heroPool[0]);
  buildHeroDots();
  startHeroRotation();
  movies = trendingNow;

  rest.forEach((cat) => {
    paintCategory(cat, getFallback(cat, 5), { topRated: cat === "top50" });
  });

  // Refresh from YouTube in background (new API key)
  const softRefresh = async () => {
    if (!navigator.onLine) return;
    const modal = document.getElementById("trailer-modal");
    if (modal && !modal.classList.contains("hidden")) return;

    const cats = ["trending", "top50", "thriller", "horror", "animation", "romance", "drama"];
    for (const cat of cats) {
      try {
        if (modal && !modal.classList.contains("hidden")) return;
        const fresh = await fetchCategory(cat, 8);
        if (fresh && fresh.length) {
          paintCategory(cat, fresh, { topRated: cat === "top50" });
          categoryData[cat + "_fresh"] = true;
          if (cat === "trending") {
            heroPool = fresh.slice(0, 5);
            heroIndex = 0;
            setHero(heroPool[0]);
            buildHeroDots();
            startHeroRotation();
            movies = fresh;
          }
        }
      } catch (_) {}
      await new Promise((r) => setTimeout(r, 350));
    }
  };

  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(() => { softRefresh(); }, { timeout: 4000 });
  } else {
    setTimeout(softRefresh, 1200);
  }
}

// Lazy-refresh a category from network only when user taps its chip
async function ensureCategoryFresh(cat) {
  if (!cat || cat === "watch") return;
  if (categoryData[cat + "_fresh"]) return;
  if (!navigator.onLine) return;
  try {
    const items = await fetchCategory(cat, 5);
    if (items && items.length) {
      paintCategory(cat, items, { topRated: cat === "top50" });
      categoryData[cat + "_fresh"] = true;
    }
  } catch (_) {}
}

function buildHeroDots() {
  if (!heroDots) return;
  heroDots.innerHTML = "";
  heroPool.forEach((_, i) => {
    const d = document.createElement("button");
    d.type = "button";
    d.className = "hero-dot" + (i === heroIndex ? " active" : "");
    d.setAttribute("aria-label", "Slide " + (i + 1));
    d.addEventListener("click", () => {
      heroIndex = i;
      setHero(heroPool[i]);
      updateDots();
      startHeroRotation();
    });
    heroDots.appendChild(d);
  });
}

function updateDots() {
  if (!heroDots) return;
  [...heroDots.children].forEach((d, i) => {
    d.classList.toggle("active", i === heroIndex);
  });
}

let heroFadeTimer = null;
let heroToken = 0;
function setHero(movie) {
  if (!heroPoster || !movie) return;
  const token = ++heroToken;
  // Update text immediately so title always matches the intended movie (no race with fade)
  if (heroTitle) heroTitle.textContent = movie.title || "";
  if (heroMeta) heroMeta.textContent = (movie.channel ? movie.channel + " · " : "") + "Official trailer";
  if (heroWatch) {
    heroWatch.onclick = (e) => {
      e.preventDefault();
      openBigScreen(movie.id, movie.title);
    };
  }
  updateDots();
  if (heroFadeTimer) clearTimeout(heroFadeTimer);
  heroPoster.classList.add("hero-fading");
  heroFadeTimer = setTimeout(() => {
    if (token !== heroToken) return; // superseded by a newer setHero
    heroPoster.style.backgroundImage = `
      linear-gradient(105deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 42%, rgba(0,0,0,0.2) 100%),
      url(${movie.thumb})
    `;
    heroPoster.style.backgroundSize = "cover";
    heroPoster.style.backgroundPosition = "center center";
    heroPoster.classList.remove("hero-fading");
  }, 220);
}

// Auto-rotate hero (~12 seconds)
function startHeroRotation() {
  clearInterval(heroInterval);
  if (!heroPool.length) return;
  // Don't rotate while a trailer is open — saves main-thread work for playback
  const modal = document.getElementById("trailer-modal");
  if (modal && !modal.classList.contains("hidden")) return;
  heroInterval = setInterval(() => {
    heroIndex = (heroIndex + 1) % heroPool.length;
    setHero(heroPool[heroIndex]);
  }, 12000);
}
function stopHeroRotation() {
  clearInterval(heroInterval);
  heroInterval = null;
}

document.getElementById("hero-prev")?.addEventListener("click", () => {
  if (!heroPool.length) return;
  heroIndex = (heroIndex - 1 + heroPool.length) % heroPool.length;
  setHero(heroPool[heroIndex]);
  startHeroRotation();
});
document.getElementById("hero-next")?.addEventListener("click", () => {
  if (!heroPool.length) return;
  heroIndex = (heroIndex + 1) % heroPool.length;
  setHero(heroPool[heroIndex]);
  startHeroRotation();
});

// Category chips — filter view: show selected genre row, hide others (except search results)
function applyCategoryFilter(cat) {
  document.querySelectorAll(".cat-chip").forEach((c) => {
    c.classList.toggle("active", c.getAttribute("data-cat") === cat);
  });
  const rows = document.querySelectorAll(".row-block");
  rows.forEach((block) => {
    const row = block.getAttribute("data-row");
    if (row === "search-results") {
      // hide search results when browsing a category
      if (cat !== "trending") block.classList.add("hidden");
      return;
    }
    if (cat === "trending" || cat === "watch") {
      block.classList.remove("row-filtered-out");
    } else {
      block.classList.toggle("row-filtered-out", row !== cat);
    }
  });
  const target = document.querySelector(`.row-block[data-row="${cat}"]`);
  if (target) {
    target.classList.remove("row-filtered-out");
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  // Hero + pool from that category
  const items = categoryData[cat] || [];
  if (items.length) {
    heroPool = items.slice(0, 6);
    heroIndex = 0;
    setHero(heroPool[0]);
    buildHeroDots();
    startHeroRotation();
    movies = items;
  }
  // Soft network refresh only for the category the user asked for
  ensureCategoryFresh(cat);
}

document.getElementById("category-nav")?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-cat]");
  if (!btn) return;
  const cat = btn.getAttribute("data-cat");
  applyCategoryFilter(cat);
});

document.querySelectorAll(".row-more").forEach((btn) => {
  btn.addEventListener("click", () => {
    const cat = btn.getAttribute("data-cat");
    document.querySelector(`.cat-chip[data-cat="${cat}"]`)?.click();
  });
});

// Logo home — clear search, restore all trailers, refresh hero
document.getElementById("logo-home")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("side-menu")?.classList.remove("active");
  // Clear search UI
  const top = document.getElementById("top-search");
  if (top) top.value = "";
  if (typeof searchBar !== "undefined" && searchBar) searchBar.value = "";
  hideAllSuggestions();
  const searchBlock = document.getElementById("search-results-block");
  if (searchBlock) searchBlock.classList.add("hidden");
  const searchRow = document.getElementById("row-search-results");
  if (searchRow) searchRow.innerHTML = "";
  // Show all genre rows again
  document.querySelectorAll(".row-block").forEach((b) => {
    if (b.getAttribute("data-row") !== "search-results") b.classList.remove("row-filtered-out");
  });
  document.querySelectorAll(".cat-chip").forEach((c) => {
    c.classList.toggle("active", c.getAttribute("data-cat") === "trending");
  });
  // Restore trending hero / rows from cached data or reload
  const trend = categoryData.trending || [];
  if (trend.length) {
    movies = trend;
    heroPool = trend.slice(0, 8);
    heroIndex = 0;
    setHero(heroPool[0]);
    buildHeroDots();
    startHeroRotation();
    renderRow("row-trending", trend);
    const h = document.querySelector('.row-block[data-row="trending"] h2');
    if (h) h.textContent = "🔥 Trending";
  } else {
    loadAllRows();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Profile chip opens menu or auth
document.getElementById("profile-chip")?.addEventListener("click", () => {
  if (window.currentUser) {
    document.getElementById("side-menu")?.classList.add("active");
  } else {
    document.getElementById("signin-open")?.click();
  }
});


// ================= SNOWWFLIX PLAYER =================
let ytPlayer = null;
let playerMuted = false;
let currentVideoMeta = { id: "", title: "" };
let isMinimized = false;

function extractYoutubeId(input) {
  if (!input) return "";
  const s = String(input).trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : "";
}

function hideEndedOverlay() {
  document.getElementById("sf-ended-overlay")?.classList.add("hidden");
}

function showEndedOverlay() {
  const overlay = document.getElementById("sf-ended-overlay");
  const grid = document.getElementById("sf-suggestions");
  const titleEl = document.getElementById("sf-ended-title");
  if (!overlay || !grid) return;

  // Build suggestions from in-app movie lists only (never YouTube links)
  const pool = [];
  const seen = new Set([currentVideoMeta.id]);
  const sources = [movies, heroPool].filter(Boolean);
  document.querySelectorAll(".row-scroller .movie-card").forEach(() => {});
  // Collect from global movies + heroPool
  [...(movies || []), ...(heroPool || [])].forEach((m) => {
    if (m && m.id && !seen.has(m.id)) {
      seen.add(m.id);
      pool.push(m);
    }
  });
  // Also scrape rendered cards data from rows if available via thumb alt - skip
  const picks = pool.slice(0, 6);
  grid.innerHTML = "";
  if (titleEl) titleEl.textContent = "Continue watching on Snowwflix";

  if (!picks.length) {
    grid.innerHTML = '<p class="sf-empty-sug">Browse more trailers on the home page.</p>';
  } else {
    picks.forEach((m) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sf-sug-card";
      btn.innerHTML = `
        <img src="${lightThumb(m.id)}" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/' + this.dataset.vid + '/hqdefault.jpg';" data-vid="${m.id}" />
        <span>${m.title}</span>`;
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        hideEndedOverlay();
        openBigScreen(m.id, m.title);
      });
      grid.appendChild(btn);
    });
  }
  overlay.classList.remove("hidden");
}

function destroyYt() {
  try {
    if (ytPlayer && ytPlayer.destroy) ytPlayer.destroy();
  } catch (_) {}
  ytPlayer = null;
  const mount = document.getElementById("player-frame");
  if (mount) mount.innerHTML = "";
}

function openBigScreen(id, title) {
  const modal = document.getElementById("trailer-modal");
  const mount = document.getElementById("player-frame");
  const titleEl = document.getElementById("player-title");
  const sub = document.getElementById("player-sub");
  const videoId = extractYoutubeId(id);

  if (!modal || !mount || !videoId) {
    console.warn("Invalid video", id);
    return;
  }

  // Always start every video from the beginning — destroy previous player completely
  destroyYt();
  stopProgressLoop && stopProgressLoop();
  const played = document.getElementById("sf-progress-played");
  const thumb = document.getElementById("sf-progress-thumb");
  const tCur = document.getElementById("sf-time-current");
  const tDur = document.getElementById("sf-time-duration");
  if (played) played.style.width = "0%";
  if (thumb) thumb.style.left = "0%";
  if (tCur) tCur.textContent = "0:00";
  if (tDur) tDur.textContent = "0:00";

  currentVideoMeta = { id: videoId, title: title || "Trailer" };
  isMinimized = false;
  playerMuted = false;
  modal.classList.remove("sf-minimized");
  hideEndedOverlay();

  if (titleEl) titleEl.textContent = title || "Trailer";
  if (sub) sub.textContent = "Watching on Snowwflix · Official trailer";

  modal.classList.remove("hidden");
  modal.dataset.videoId = videoId;
  document.body.style.overflow = "hidden";
  document.getElementById("sf-big-play")?.classList.add("hidden");
  document.getElementById("sf-btn-play") && (document.getElementById("sf-btn-play").textContent = "❚❚");
  try { if (typeof stopHeroRotation === "function") stopHeroRotation(); } catch (_) {}
  document.getElementById("sf-btn-mute") && (document.getElementById("sf-btn-mute").textContent = "🔊");

  // Prefer IFrame API for end detection + custom controls
  const startEmbed = () => {
    const holder = document.createElement("div");
    holder.id = "yt-player-mount";
    mount.appendChild(holder);

    const onReady = (e) => {
      try {
        // Single play call — avoid seek+play thrash that stalls decoder on some browsers
        e.target.playVideo();
        // If still buffering after a moment, nudge play again
        setTimeout(() => {
          try {
            const st = e.target.getPlayerState && e.target.getPlayerState();
            if (st !== 1) e.target.playVideo();
          } catch (_) {}
        }, 600);
      } catch (_) {}
      if (typeof startProgressLoop === "function") startProgressLoop();
      try { if (typeof stopHeroRotation === "function") stopHeroRotation(); } catch (_) {}
      // Keep keyboard on the page — never let the iframe steal focus
      try {
        const ifr = document.querySelector("#player-frame iframe, #yt-player-mount iframe");
        if (ifr) {
          ifr.style.pointerEvents = "none";
          ifr.setAttribute("tabindex", "-1");
        }
        document.getElementById("trailer-modal")?.focus?.();
      } catch (_) {}
      captionsOn = false;
      const ccBtn = document.getElementById("sf-btn-cc");
      if (ccBtn) ccBtn.classList.remove("is-on");
    };
    const onState = (e) => {
      const playBtn = document.getElementById("sf-btn-play");
      const big = document.getElementById("sf-big-play");
      // YT.PlayerState.ENDED = 0, PLAYING = 1, PAUSED = 2
      if (e.data === 0) {
        showEndedOverlay();
        if (playBtn) playBtn.textContent = "▶";
        if (big) big.classList.remove("hidden");
      } else if (e.data === 1) {
        hideEndedOverlay();
        if (playBtn) playBtn.textContent = "❚❚";
        if (big) big.classList.add("hidden");
      } else if (e.data === 2) {
        if (playBtn) playBtn.textContent = "▶";
        if (big) big.classList.remove("hidden");
      }
    };

    if (typeof YT !== "undefined" && YT.Player) {
      ytPlayer = new YT.Player("yt-player-mount", {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          playsinline: 1,
          cc_load_policy: 0,
          showinfo: 0,
          origin: window.location.origin || undefined
        },
        events: { onReady, onStateChange: onState }
      });
    } else {
      // Fallback iframe (still branded frame; limited end detection)
      mount.innerHTML = "";
      const iframe = document.createElement("iframe");
      iframe.src =
        "https://www.youtube.com/embed/" +
        encodeURIComponent(videoId) +
        "?autoplay=1&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1&iv_load_policy=3&start=0";
      iframe.allow = "accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen";
      iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      iframe.setAttribute("allowfullscreen", "");
      iframe.style.cssText = "position:absolute;inset:0;width:100%;height:100%;border:0;pointer-events:none;";
      iframe.setAttribute("tabindex", "-1");
      mount.appendChild(iframe);
    }
  };

  if (typeof YT === "undefined" || !YT.Player) {
    // wait briefly for API
    let tries = 0;
    const wait = setInterval(() => {
      tries++;
      if ((typeof YT !== "undefined" && YT.Player) || tries > 8) {
        clearInterval(wait);
        startEmbed();
      }
    }, 100);
  } else {
    startEmbed();
  }
}

function closeTrailerPlayer() {
  const modal = document.getElementById("trailer-modal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("sf-minimized");
  }
  // Leave fullscreen + unlock orientation if user closes while FS
  try { exitPlayerFullscreen(); } catch (_) {}
  hideEndedOverlay();
  destroyYt();
  stopProgressLoop();
  document.body.style.overflow = "";
  isMinimized = false;
  try { if (typeof startHeroRotation === "function") startHeroRotation(); } catch (_) {}
}

function stopTrailer() {
  try {
    if (ytPlayer) {
      if (ytPlayer.stopVideo) ytPlayer.stopVideo();
      else if (ytPlayer.pauseVideo) ytPlayer.pauseVideo();
    }
  } catch (_) {}
  destroyYt();
  document.getElementById("sf-big-play")?.classList.remove("hidden");
  const playBtn = document.getElementById("sf-btn-play");
  if (playBtn) playBtn.textContent = "▶";
}

document.getElementById("btn-close-player")?.addEventListener("click", closeTrailerPlayer);
document.getElementById("sf-btn-stop")?.addEventListener("click", stopTrailer);
document.getElementById("sf-ended-close")?.addEventListener("click", closeTrailerPlayer);
document.querySelector("#trailer-modal .modal-backdrop")?.addEventListener("click", () => {
  if (!isMinimized) closeTrailerPlayer();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeTrailerPlayer();
});

document.getElementById("sf-btn-minimize")?.addEventListener("click", () => {
  const modal = document.getElementById("trailer-modal");
  if (!modal) return;
  isMinimized = !isMinimized;
  modal.classList.toggle("sf-minimized", isMinimized);
});

document.getElementById("sf-btn-play")?.addEventListener("click", () => {
  if (!ytPlayer) {
    if (currentVideoMeta.id) openBigScreen(currentVideoMeta.id, currentVideoMeta.title);
    return;
  }
  const s = ytPlayer.getPlayerState ? ytPlayer.getPlayerState() : -1;
  if (s === 1) ytPlayer.pauseVideo();
  else ytPlayer.playVideo();
});
document.getElementById("sf-big-play")?.addEventListener("click", () => {
  if (ytPlayer && ytPlayer.playVideo) ytPlayer.playVideo();
  else if (currentVideoMeta.id) openBigScreen(currentVideoMeta.id, currentVideoMeta.title);
});
document.getElementById("sf-btn-mute")?.addEventListener("click", () => {
  if (!ytPlayer) return;
  playerMuted = !playerMuted;
  if (playerMuted) {
    ytPlayer.mute();
    document.getElementById("sf-btn-mute").textContent = "🔇";
  } else {
    ytPlayer.unMute();
    document.getElementById("sf-btn-mute").textContent = "🔊";
  }
});
document.getElementById("sf-btn-replay")?.addEventListener("click", () => {
  hideEndedOverlay();
  if (ytPlayer && ytPlayer.seekTo) {
    ytPlayer.seekTo(0);
    ytPlayer.playVideo();
  } else if (currentVideoMeta.id) {
    openBigScreen(currentVideoMeta.id, currentVideoMeta.title);
  }
});
document.getElementById("sf-ended-replay")?.addEventListener("click", () => {
  hideEndedOverlay();
  if (currentVideoMeta.id) openBigScreen(currentVideoMeta.id, currentVideoMeta.title);
});

// ---- Snowwflix progress bar (seek forward / back) ----
function formatTime(sec) {
  sec = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ":" + String(s).padStart(2, "0");
}

let progressTimer = null;
function updateProgressUI() {
  if (!ytPlayer || !ytPlayer.getCurrentTime) return;
  // Don't hammer the iframe while the tab is hidden — browser already throttles
  if (document.hidden) return;
  try {
    const cur = ytPlayer.getCurrentTime() || 0;
    const dur = ytPlayer.getDuration() || 0;
    const pct = dur > 0 ? (cur / dur) * 100 : 0;
    const played = document.getElementById("sf-progress-played");
    const thumb = document.getElementById("sf-progress-thumb");
    const tCur = document.getElementById("sf-time-current");
    const tDur = document.getElementById("sf-time-duration");
    if (played) played.style.width = pct + "%";
    if (thumb) thumb.style.left = pct + "%";
    if (tCur) tCur.textContent = formatTime(cur);
    if (tDur) tDur.textContent = formatTime(dur);
  } catch (_) {}
}

function startProgressLoop() {
  stopProgressLoop();
  updateProgressUI();
  // 4 updates/sec is enough — rAF at 60fps was starving the YouTube decoder
  progressTimer = setInterval(updateProgressUI, 250);
}

function stopProgressLoop() {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
}

// When tab is visible again, nudge playback if player is open
document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  const modal = document.getElementById("trailer-modal");
  if (!modal || modal.classList.contains("hidden")) return;
  try {
    if (ytPlayer && typeof ytPlayer.playVideo === "function") {
      const st = ytPlayer.getPlayerState && ytPlayer.getPlayerState();
      // -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
      if (st === 2 || st === 3 || st === 5 || st === -1) {
        ytPlayer.playVideo();
      }
    }
  } catch (_) {}
  updateProgressUI();
});

(function initProgressSeek() {
  const wrap = document.getElementById("sf-progress-wrap");
  if (!wrap) return;
  function seekFromEvent(e) {
    if (!ytPlayer || !ytPlayer.getDuration) return;
    const track = wrap.querySelector(".sf-progress-track");
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const ratio = Math.min(1, Math.max(0, x / rect.width));
    try {
      const dur = ytPlayer.getDuration() || 0;
      ytPlayer.seekTo(ratio * dur, true);
      updateProgressUI();
    } catch (_) {}
  }
  let dragging = false;
  wrap.addEventListener("mousedown", (e) => { dragging = true; seekFromEvent(e); });
  window.addEventListener("mousemove", (e) => { if (dragging) seekFromEvent(e); });
  window.addEventListener("mouseup", () => { dragging = false; });
  wrap.addEventListener("touchstart", (e) => { dragging = true; seekFromEvent(e); }, { passive: true });
  wrap.addEventListener("touchmove", (e) => { if (dragging) seekFromEvent(e); }, { passive: true });
  wrap.addEventListener("touchend", () => { dragging = false; });
})();

document.getElementById("sf-btn-back10")?.addEventListener("click", () => {
  if (!ytPlayer || !ytPlayer.getCurrentTime) return;
  try {
    const t = Math.max(0, (ytPlayer.getCurrentTime() || 0) - 10);
    ytPlayer.seekTo(t, true);
  } catch (_) {}
});
document.getElementById("sf-btn-fwd10")?.addEventListener("click", () => {
  if (!ytPlayer || !ytPlayer.getCurrentTime) return;
  try {
    const t = (ytPlayer.getCurrentTime() || 0) + 10;
    ytPlayer.seekTo(t, true);
  } catch (_) {}
});

// Watch Later → settings watch list
function sfToast(msg, isError) {
  const tw = document.getElementById("toast-wrap");
  if (!tw) { alert(msg); return; }
  const t = document.createElement("div");
  t.className = "sf-toast";
  t.textContent = msg;
  t.style.cssText = "background:" + (isError ? "#da3633" : "#1f6feb") + ";color:#fff;padding:12px 16px;border-radius:12px;margin-top:8px;box-shadow:0 8px 24px rgba(0,0,0,.45);font-size:0.92rem;max-width:280px";
  tw.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

function requireAccount(actionLabel) {
  const user = window.currentUser || window.auth?.currentUser;
  if (user) return true;
  sfToast("Login to " + (actionLabel || "continue"), true);
  // gentle nudge to open auth
  setTimeout(() => {
    document.getElementById("signin-open")?.click();
  }, 600);
  return false;
}

function getStoreList(key) {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}
function saveStoreList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

function pushUniqueVideo(key, meta, max) {
  if (!meta || !meta.id) return false;
  const list = getStoreList(key);
  if (list.some((x) => x.id === meta.id)) return false;
  list.unshift({
    id: meta.id,
    title: meta.title || "Trailer",
    thumb: "https://i.ytimg.com/vi/" + meta.id + "/default.jpg",
    channel: meta.channel || "",
    addedAt: Date.now()
  });
  saveStoreList(key, list.slice(0, max || 50));
  return true;
}

function removeFromStore(key, id) {
  const list = getStoreList(key).filter((x) => x.id !== id);
  saveStoreList(key, list);
}

function isLiked(id) {
  return getStoreList("snowwflix_likes").some((x) => x.id === id);
}

function updateLikeButton() {
  const btn = document.getElementById("sf-btn-like");
  if (!btn || !currentVideoMeta.id) return;
  btn.textContent = isLiked(currentVideoMeta.id) ? "♥" : "♡";
  btn.classList.toggle("is-liked", isLiked(currentVideoMeta.id));
}

function addToHistory(meta) {
  const user = window.currentUser || window.auth?.currentUser;
  if (!user || !meta || !meta.id) return;
  const list = getStoreList("snowwflix_watch_history").filter((x) => x.id !== meta.id);
  list.unshift({
    id: meta.id,
    title: meta.title || "Trailer",
    thumb: "https://i.ytimg.com/vi/" + meta.id + "/default.jpg",
    channel: meta.channel || "",
    addedAt: Date.now()
  });
  saveStoreList("snowwflix_watch_history", list.slice(0, 80));
  // optional cloud sync
  try {
    if (window.db && user.uid) {
      window.db.collection("users").doc(user.uid).collection("history").doc(meta.id).set({
        title: meta.title || "",
        thumb: "https://i.ytimg.com/vi/" + meta.id + "/default.jpg",
        watchedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true }).catch(() => {});
    }
  } catch (_) {}
}

document.getElementById("sf-btn-watchlater")?.addEventListener("click", () => {
  if (!currentVideoMeta.id) return;
  if (!requireAccount("save Watch Later")) return;
  const list = getStoreList("snowwflix_watch_later");
  if (list.some((x) => x.id === currentVideoMeta.id)) {
    sfToast("Already in Watch Later");
    return;
  }
  pushUniqueVideo("snowwflix_watch_later", currentVideoMeta, 50);
  try {
    const user = window.currentUser || window.auth?.currentUser;
    if (window.db && user?.uid) {
      window.db.collection("users").doc(user.uid).collection("watchLater").doc(currentVideoMeta.id).set({
        title: currentVideoMeta.title || "",
        thumb: "https://i.ytimg.com/vi/" + currentVideoMeta.id + "/default.jpg",
        addedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true }).catch(() => {});
    }
  } catch (_) {}
  sfToast("Saved to Watch Later");
});

document.getElementById("sf-btn-like")?.addEventListener("click", () => {
  if (!currentVideoMeta.id) return;
  if (!requireAccount("like videos")) return;
  if (isLiked(currentVideoMeta.id)) {
    removeFromStore("snowwflix_likes", currentVideoMeta.id);
    try {
      const user = window.currentUser || window.auth?.currentUser;
      if (window.db && user?.uid) {
        window.db.collection("users").doc(user.uid).collection("likes").doc(currentVideoMeta.id).delete().catch(() => {});
      }
    } catch (_) {}
    sfToast("Removed from Liked");
  } else {
    pushUniqueVideo("snowwflix_likes", currentVideoMeta, 100);
    try {
      const user = window.currentUser || window.auth?.currentUser;
      if (window.db && user?.uid) {
        window.db.collection("users").doc(user.uid).collection("likes").doc(currentVideoMeta.id).set({
          title: currentVideoMeta.title || "",
          thumb: "https://i.ytimg.com/vi/" + currentVideoMeta.id + "/default.jpg",
          likedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(() => {});
      }
    } catch (_) {}
    sfToast("Added to Liked Videos");
  }
  updateLikeButton();
});

// Subscribe — opens the movie/trailer channel on YouTube (movies only discovery path)
document.getElementById("sf-btn-subscribe")?.addEventListener("click", () => {
  if (!currentVideoMeta.id) return;
  // Link to the YouTube video page so the user can subscribe to that channel
  const url = "https://www.youtube.com/watch?v=" + encodeURIComponent(currentVideoMeta.id);
  window.open(url, "_blank", "noopener,noreferrer");
  sfToast("Open YouTube to subscribe to this movie channel");
});

// Download → open y2mate with this video already selected (720p page)
function updateDownloadLink(videoId) {
  const a = document.getElementById("sf-btn-download");
  if (!a) return;
  const id = videoId || currentVideoMeta?.id || "";
  const ytUrl = "https://www.youtube.com/watch?v=" + encodeURIComponent(id);
  // y2mate youtube path pre-loads the video conversion page
  const y2mateUrl = id
    ? "https://www.y2mate.com/youtube/" + encodeURIComponent(id)
    : "https://www.y2mate.com/";
  a.href = y2mateUrl;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.onclick = (e) => {
    e.preventDefault();
    try { navigator.clipboard.writeText(ytUrl); } catch (_) {}
    // Open y2mate with video pre-selected; user picks 720p and downloads
    const win = window.open(y2mateUrl, "_blank", "noopener,noreferrer");
    if (!win) {
      // popup blocked — navigate same tab
      window.location.href = y2mateUrl;
    }
    if (typeof sfToast === "function") {
      sfToast("Opening download page with this trailer… pick 720p on y2mate");
    }
  };
}

// Hook progress loop into openBigScreen via monkey-patch after open
const _openBigScreen = openBigScreen;
openBigScreen = function (id, title) {
  _openBigScreen(id, title);
  updateDownloadLink(extractYoutubeId(id));
  startProgressLoop();
  const sub = document.getElementById("player-sub");
  if (sub) sub.textContent = "Watching on Snowwflix · Official trailer";
  updateLikeButton();
  addToHistory(currentVideoMeta);
};
const _closeTrailerPlayer = closeTrailerPlayer;
closeTrailerPlayer = function () {
  stopProgressLoop();
  try { exitPlayerFullscreen(); } catch (_) {}
  _closeTrailerPlayer();
};


function isFsActive() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
}

let chromeHideTimer = null;
function showPlayerChrome() {
  const stage = document.getElementById("player-surface");
  stage?.classList.remove("sf-chrome-hidden");
  clearTimeout(chromeHideTimer);
  // No auto-hide timer — single tap toggles chrome off when user wants
}
function hidePlayerChrome() {
  const stage = document.getElementById("player-surface");
  if (stage?.classList.contains("sf-fs-fallback") || stage?.classList.contains("is-fullscreen")) {
    stage.classList.add("sf-chrome-hidden");
  }
  clearTimeout(chromeHideTimer);
}
function togglePlayerChrome() {
  const stage = document.getElementById("player-surface");
  if (!stage) return;
  if (stage.classList.contains("sf-chrome-hidden")) showPlayerChrome();
  else hidePlayerChrome();
}

/** True for phones/tablets (touch + narrow), not laptop/desktop */
function isMobileDevice() {
  try {
    const ua = navigator.userAgent || "";
    if (/Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return true;
    const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    const narrow = Math.min(window.innerWidth, window.innerHeight) <= 900;
    const touch = (navigator.maxTouchPoints || 0) > 0 || "ontouchstart" in window;
    // Phones/tablets only — exclude desktop with touch screens when viewport is large
    if (touch && narrow) return true;
    if (coarse && narrow) return true;
    return false;
  } catch (_) {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
  }
}

function applyCssLandscapeFallback() {
  if (!isMobileDevice()) return;
  const stage = document.getElementById("player-surface");
  const modal = document.getElementById("trailer-modal");
  // If still portrait after lock attempt, force landscape via CSS transform
  const portrait = window.matchMedia && window.matchMedia("(orientation: portrait)").matches;
  if (portrait) {
    stage?.classList.add("sf-force-landscape");
    modal?.classList.add("sf-force-landscape");
    document.documentElement.classList.add("sf-force-landscape");
  } else {
    stage?.classList.remove("sf-force-landscape");
    modal?.classList.remove("sf-force-landscape");
    document.documentElement.classList.remove("sf-force-landscape");
  }
}

function clearCssLandscapeFallback() {
  document.getElementById("player-surface")?.classList.remove("sf-force-landscape");
  document.getElementById("trailer-modal")?.classList.remove("sf-force-landscape");
  document.documentElement.classList.remove("sf-force-landscape");
}

function lockLandscapeIfMobile() {
  if (!isMobileDevice()) return;
  const tryLock = function (mode) {
    try {
      const o = screen.orientation;
      if (o && typeof o.lock === "function") {
        return o.lock(mode);
      }
    } catch (_) {}
    return Promise.reject();
  };
  // Must be called while in fullscreen context on most browsers
  Promise.resolve()
    .then(function () { return tryLock("landscape"); })
    .catch(function () { return tryLock("landscape-primary"); })
    .catch(function () { return tryLock("landscape-secondary"); })
    .catch(function () {
      try {
        if (screen.lockOrientation) screen.lockOrientation("landscape");
        else if (screen.mozLockOrientation) screen.mozLockOrientation("landscape");
        else if (screen.msLockOrientation) screen.msLockOrientation("landscape");
      } catch (_) {}
    })
    .finally(function () {
      // If OS refused lock (common on iOS), use CSS rotate fallback
      setTimeout(applyCssLandscapeFallback, 120);
      setTimeout(applyCssLandscapeFallback, 400);
    });
}

function unlockOrientationIfMobile() {
  clearCssLandscapeFallback();
  if (!isMobileDevice()) return;
  try {
    const o = screen.orientation || screen.mozOrientation || screen.msOrientation;
    if (o && typeof o.unlock === "function") {
      o.unlock();
    } else if (screen.unlockOrientation) {
      screen.unlockOrientation();
    } else if (screen.mozUnlockOrientation) {
      screen.mozUnlockOrientation();
    } else if (screen.msUnlockOrientation) {
      screen.msUnlockOrientation();
    }
  } catch (_) {}
}

function enterPlayerFullscreen() {
  const stage = document.getElementById("player-surface");
  const modal = document.getElementById("trailer-modal");
  if (!stage) return;
  stage.classList.add("is-fullscreen", "sf-fs-fallback");
  modal?.classList.add("sf-modal-fs");
  document.documentElement.classList.add("sf-player-fs-active");
  document.body.classList.add("sf-player-fs-active");
  // Start with chrome visible briefly, then fade
  stage.classList.remove("sf-chrome-hidden");
  showPlayerChrome();

  // Prefer fullscreen on the modal (covers the whole browser chrome better)
  const target = modal || stage;
  const req =
    target.requestFullscreen ||
    target.webkitRequestFullscreen ||
    target.webkitRequestFullScreen ||
    target.msRequestFullscreen;
  // Try orientation lock immediately (same user-gesture stack) then again after FS resolves
  lockLandscapeIfMobile();
  if (req) {
    try {
      const p = req.call(target);
      if (p && typeof p.then === "function") {
        p.then(function () {
          lockLandscapeIfMobile();
        }).catch(function () {
          lockLandscapeIfMobile();
        });
      } else {
        lockLandscapeIfMobile();
      }
    } catch (_) {
      lockLandscapeIfMobile();
    }
  }
}

function exitPlayerFullscreen() {
  const stage = document.getElementById("player-surface");
  const modal = document.getElementById("trailer-modal");
  stage?.classList.remove("is-fullscreen", "sf-fs-fallback", "sf-chrome-hidden");
  modal?.classList.remove("sf-modal-fs");
  document.documentElement.classList.remove("sf-player-fs-active");
  document.body.classList.remove("sf-player-fs-active");
  clearTimeout(chromeHideTimer);
  unlockOrientationIfMobile();
  if (isFsActive()) {
    try {
      (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen)?.call(document);
    } catch (_) {}
  }
}

function togglePlayerFullscreen() {
  const stage = document.getElementById("player-surface");
  if (isFsActive() || stage?.classList.contains("sf-fs-fallback")) exitPlayerFullscreen();
  else enterPlayerFullscreen();
}

function togglePlayPause() {
  if (!ytPlayer) {
    if (currentVideoMeta.id) openBigScreen(currentVideoMeta.id, currentVideoMeta.title);
    return;
  }
  try {
    const s = ytPlayer.getPlayerState ? ytPlayer.getPlayerState() : -1;
    if (s === 1) ytPlayer.pauseVideo();
    else ytPlayer.playVideo();
  } catch (_) {}
}

document.getElementById("btn-fullscreen")?.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  togglePlayerFullscreen();
});

["fullscreenchange", "webkitfullscreenchange", "MSFullscreenChange"].forEach((ev) => {
  document.addEventListener(ev, () => {
    // If browser exited native FS (system UI / back gesture), clear our state + unlock orientation
    if (!isFsActive()) {
      const stage = document.getElementById("player-surface");
      if (stage?.classList.contains("is-fullscreen") || stage?.classList.contains("sf-fs-fallback")) {
        stage.classList.remove("is-fullscreen", "sf-fs-fallback", "sf-chrome-hidden");
        document.getElementById("trailer-modal")?.classList.remove("sf-modal-fs");
        document.documentElement.classList.remove("sf-player-fs-active");
        document.body.classList.remove("sf-player-fs-active");
        clearTimeout(chromeHideTimer);
        unlockOrientationIfMobile();
      }
    } else {
      // Entered native FS — lock landscape on phones
      lockLandscapeIfMobile();
    }
  });
});

// Keep CSS landscape fallback in sync if user rotates the phone while fullscreen
window.addEventListener("orientationchange", () => {
  const stage = document.getElementById("player-surface");
  if (stage?.classList.contains("is-fullscreen") || stage?.classList.contains("sf-fs-fallback")) {
    setTimeout(applyCssLandscapeFallback, 150);
  }
});
if (screen.orientation && typeof screen.orientation.addEventListener === "function") {
  screen.orientation.addEventListener("change", () => {
    const stage = document.getElementById("player-surface");
    if (stage?.classList.contains("is-fullscreen") || stage?.classList.contains("sf-fs-fallback")) {
      setTimeout(applyCssLandscapeFallback, 150);
    }
  });
}

// --- Captions state ---
let captionsOn = false;
function toggleCaptions() {
  if (!ytPlayer) {
    sfToast && sfToast("Play a trailer first", true);
    return;
  }
  const ccBtn = document.getElementById("sf-btn-cc");
  try {
    if (!captionsOn) {
      // Turn CC on
      if (ytPlayer.loadModule) ytPlayer.loadModule("captions");
      // Prefer English if available; empty track list still enables default
      try {
        ytPlayer.setOption && ytPlayer.setOption("captions", "track", { languageCode: "en" });
      } catch (_) {}
      try {
        ytPlayer.setOption && ytPlayer.setOption("captions", "reload", true);
      } catch (_) {}
      captionsOn = true;
      ccBtn?.classList.add("is-on");
      sfToast && sfToast("Subtitles on");
    } else {
      if (ytPlayer.unloadModule) ytPlayer.unloadModule("captions");
      captionsOn = false;
      ccBtn?.classList.remove("is-on");
      sfToast && sfToast("Subtitles off");
    }
  } catch (err) {
    console.warn("CC toggle", err);
    sfToast && sfToast("Subtitles not available for this trailer", true);
  }
}
document.getElementById("sf-btn-cc")?.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  toggleCaptions();
});

// Keyboard — capture phase so it works even if focus drifts
document.addEventListener("keydown", (e) => {
  const modal = document.getElementById("trailer-modal");
  if (!modal || modal.classList.contains("hidden")) return;
  const tag = (e.target && e.target.tagName) || "";
  if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;

  if (e.key === "Escape") {
    e.preventDefault();
    if (document.getElementById("player-surface")?.classList.contains("sf-fs-fallback") || isFsActive()) {
      exitPlayerFullscreen();
    } else {
      closeTrailerPlayer();
    }
    return;
  }
  if (e.key === "f" || e.key === "F") {
    e.preventDefault();
    e.stopPropagation();
    togglePlayerFullscreen();
    return;
  }
  if (e.key === " " || e.code === "Space" || e.key === "Backspace" || e.key === "k" || e.key === "K") {
    e.preventDefault();
    e.stopPropagation();
    togglePlayPause();
    return;
  }
  if (e.key === "c" || e.key === "C") {
    e.preventDefault();
    toggleCaptions();
    return;
  }
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    try { if (ytPlayer?.getCurrentTime) ytPlayer.seekTo(Math.max(0, ytPlayer.getCurrentTime() - 10), true); } catch (_) {}
  }
  if (e.key === "ArrowRight") {
    e.preventDefault();
    try { if (ytPlayer?.getCurrentTime) ytPlayer.seekTo((ytPlayer.getCurrentTime() || 0) + 10, true); } catch (_) {}
  }
  if (e.key === "m" || e.key === "M") {
    e.preventDefault();
    document.getElementById("sf-btn-mute")?.click();
  }
}, true);

// Gestures on video stage / shields
// Phone fullscreen: single tap = show top+bottom chrome (X, exit FS, etc); double tap = exit fullscreen
// Outside fullscreen: single tap = play/pause; double tap = enter fullscreen
// Laptop: same; mouse move still reveals chrome
(function bindStageGestures() {
  const stage = document.getElementById("sf-player-stage");
  if (!stage) return;
  let lastTap = 0;
  let singleTimer = null;
  const TAP_GAP = 320;

  function isInFullscreen() {
    const surface = document.getElementById("player-surface");
    return !!(surface?.classList.contains("sf-fs-fallback") || surface?.classList.contains("is-fullscreen") || isFsActive());
  }

  function onTap(e) {
    if (e.target.closest("button, a, .sf-player-controls, .sf-progress-wrap, .sf-player-bottom, .sf-player-top")) {
      // interacting with controls keeps chrome visible
      showPlayerChrome();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const now = Date.now();
    const inFs = isInFullscreen();
    if (now - lastTap < TAP_GAP) {
      // Double tap
      clearTimeout(singleTimer);
      lastTap = 0;
      if (inFs) {
        // Exit fullscreen but stay on the player (controls stay usable)
        exitPlayerFullscreen();
      } else {
        enterPlayerFullscreen();
      }
    } else {
      // Potential single tap — wait to distinguish from double
      lastTap = now;
      clearTimeout(singleTimer);
      singleTimer = setTimeout(() => {
        if (isInFullscreen()) {
          // Single tap toggles controls on/off (no auto-hide wait)
          togglePlayerChrome();
        } else {
          togglePlayPause();
        }
      }, TAP_GAP);
    }
  }

  stage.addEventListener("click", onTap, true);
  stage.addEventListener("dblclick", (e) => {
    if (e.target.closest("button, a, .sf-player-controls, .sf-progress-wrap, .sf-player-bottom, .sf-player-top")) return;
    e.preventDefault();
    clearTimeout(singleTimer);
    lastTap = 0;
    if (isInFullscreen()) exitPlayerFullscreen();
    else enterPlayerFullscreen();
  }, true);

  document.getElementById("sf-shield-full")?.addEventListener("click", onTap, true);
  document.getElementById("sf-shield-full")?.addEventListener("dblclick", (e) => {
    e.preventDefault();
    clearTimeout(singleTimer);
    lastTap = 0;
    if (isInFullscreen()) exitPlayerFullscreen();
    else enterPlayerFullscreen();
  }, true);

  // Edge shields: single tap shows chrome in FS (easier on phone)
  ["sf-shield-top", "sf-shield-bottom"].forEach((id) => {
    // class-based nodes
  });
  document.querySelectorAll(".sf-shield-top, .sf-shield-bottom, .sf-shield-right").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (!isInFullscreen()) return;
      e.preventDefault();
      e.stopPropagation();
      togglePlayerChrome();
    }, true);
  });

  // Mouse move reveals chrome in FS (desktop); phones use single-tap toggle only
  const surfaceEl = document.getElementById("player-surface");
  surfaceEl?.addEventListener("mousemove", () => {
    if (isInFullscreen() && !(typeof isMobileDevice === "function" && isMobileDevice())) {
      showPlayerChrome();
    }
  });
})();

// Keep focus on modal when open so keys work
const _openBigScreenKb = openBigScreen;
openBigScreen = function (id, title) {
  _openBigScreenKb(id, title);
  setTimeout(() => {
    const modal = document.getElementById("trailer-modal");
    if (modal) {
      modal.setAttribute("tabindex", "-1");
      try { modal.focus({ preventScroll: true }); } catch (_) { try { modal.focus(); } catch (__) {} }
    }
    document.querySelectorAll("#player-frame iframe, #yt-player-mount iframe").forEach((ifr) => {
      ifr.style.pointerEvents = "none";
      ifr.setAttribute("tabindex", "-1");
    });
  }, 200);
};

// ================= SCROLL LOAD =================
window.addEventListener("scroll", () => {
  if (
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 &&
    nextPageToken &&
    !fetching
  ) {
    fetchMovies(((searchBar && searchBar.value) || (document.getElementById("top-search") && document.getElementById("top-search").value) || "trending movie trailers").trim(), true);
  }
});

// ================= SEARCH =================
function hideAllSuggestions() {
  document.getElementById("suggestions")?.classList.add("hidden");
  document.getElementById("top-suggestions")?.classList.add("hidden");
}

function runSearch() {
  const q = ((searchBar && searchBar.value) || (document.getElementById("top-search") && document.getElementById("top-search").value) || "").trim();
  hideAllSuggestions();
  if (!q) return;
  // Keep both inputs in sync, then use the dedicated search flow
  const top = document.getElementById("top-search");
  if (top) top.value = q;
  runTopSearch();
}

document.getElementById("search-btn")?.addEventListener("click", runSearch);

searchBar?.addEventListener("keypress", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    runSearch();
  }
});

// Local title index for instant predictive search (e.g. "D" → Dune…)
const localSearchIndex = [];
function indexMovies(list) {
  (list || []).forEach((m) => {
    if (!m || !m.id || !m.title) return;
    if (localSearchIndex.some((x) => x.id === m.id)) return;
    localSearchIndex.push({
      id: m.id,
      title: m.title,
      thumb: m.thumb || "",
      channel: m.channel || ""
    });
  });
}


// Seed predictive search from every fallback movie (works offline / quota exceeded)
(function seedSearchIndex() {
  try {
    Object.keys(FALLBACK_BY_CAT || {}).forEach((k) => {
      indexMovies(FALLBACK_BY_CAT[k]);
    });
  } catch (_) {}
})();

function localSuggest(q, limit = 8) {
  const needle = q.toLowerCase().trim();
  if (!needle) return [];
  // Ensure index is never empty
  if (!localSearchIndex.length) {
    try {
      Object.keys(FALLBACK_BY_CAT || {}).forEach((k) => indexMovies(FALLBACK_BY_CAT[k]));
    } catch (_) {}
  }
  const starts = [];
  const contains = [];
  localSearchIndex.forEach((m) => {
    const t = (m.title || "").toLowerCase();
    const ch = (m.channel || "").toLowerCase();
    if (!t) return;
    if (t.startsWith(needle) || t.split(/\s+/).some((w) => w.startsWith(needle))) starts.push(m);
    else if (t.includes(needle) || ch.includes(needle)) contains.push(m);
  });
  const out = starts.concat(contains);
  // Dedupe
  const seen = new Set();
  return out.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  }).slice(0, limit);
}

function renderSuggestList(boxEl, items, inputEl, onPick) {
  if (!boxEl) return;
  // Deduplicate by id
  const seen = new Set();
  const unique = [];
  (items || []).forEach((m) => {
    if (!m || !m.id || seen.has(m.id)) return;
    seen.add(m.id);
    unique.push(m);
  });
  boxEl.innerHTML = "";
  unique.forEach((m) => {
    const li = document.createElement("li");
    li.setAttribute("role", "option");
    li.innerHTML = `<img src="${m.thumb || ""}" alt="" loading="lazy" /><span>${(m.title || "").replace(/</g, "&lt;")}</span>`;
    li.onclick = () => {
      if (inputEl) inputEl.value = m.title;
      boxEl.classList.add("hidden");
      hideAllSuggestions();
      if (onPick) onPick(m.title, m.id, m.title);
    };
    boxEl.appendChild(li);
  });
  if (unique.length) boxEl.classList.remove("hidden");
  else boxEl.classList.add("hidden");
}

async function fillSuggestions(inputEl, boxEl, onPick) {
  if (!inputEl || !boxEl) return;
  const q = inputEl.value.trim();
  if (!q) {
    boxEl.classList.add("hidden");
    boxEl.innerHTML = "";
    return;
  }
  // Instant local matches (even 1 character)
  const local = localSuggest(q, 8);
  if (local.length) renderSuggestList(boxEl, local, inputEl, onPick);

  // Enrich from API (short debounce handled by caller)
  try {
    // Prefer official API; if quota is dead, Piped still powers suggestions
    let apiItems = await searchViaYoutubeApi(q, 8);
    if (!apiItems.length) apiItems = await searchViaPiped(q, 8);
    indexMovies(apiItems);
    const seen = new Set(local.map((m) => m.id));
    const merged = local.slice();
    apiItems.forEach((m) => {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        merged.push(m);
      }
    });
    if (merged.length) {
      renderSuggestList(boxEl, merged.slice(0, 8), inputEl, onPick);
    } else {
      const fb = getFallback(q, 8);
      if (fb.length) {
        indexMovies(fb);
        renderSuggestList(boxEl, fb, inputEl, onPick);
      } else {
        boxEl.innerHTML = '<li class="suggest-empty"><span>Press Enter to search "' + q.replace(/</g, "") + '"</span></li>';
        boxEl.classList.remove("hidden");
      }
    }
  } catch (e) {
    if (!local.length) {
      const fb = getFallback(q, 8);
      if (fb.length) {
        indexMovies(fb);
        renderSuggestList(boxEl, fb, inputEl, onPick);
      } else {
        boxEl.innerHTML = '<li class="suggest-empty"><span>Press Enter to search</span></li>';
        boxEl.classList.remove("hidden");
      }
    }
  }
}

let suggestTimer;
searchBar?.addEventListener("input", () => {
  const q = searchBar.value.trim();
  // Show local hits immediately
  if (q) {
    const local = localSuggest(q, 8);
    if (local.length && suggestions) renderSuggestList(suggestions, local, searchBar, () => runSearch());
  } else if (suggestions) {
    suggestions.classList.add("hidden");
  }
  clearTimeout(suggestTimer);
  suggestTimer = setTimeout(() => {
    fillSuggestions(searchBar, suggestions, () => runSearch());
  }, 120);
});

const topSearch = document.getElementById("top-search");
const topSuggestions = document.getElementById("top-suggestions");
let topSuggestTimer;
topSearch?.addEventListener("input", () => {
  const q = topSearch.value.trim();
  if (!q) {
    topSuggestions?.classList.add("hidden");
    return;
  }
  // Instant local predictions
  let local = localSuggest(q, 8);
  if (!local.length) {
    // Scan all fallbacks by title
    local = getFallback(q, 8);
    indexMovies(local);
  }
  if (topSuggestions) {
    if (local.length) {
      renderSuggestList(topSuggestions, local, topSearch, (title, videoId, fullTitle) => {
        if (videoId) openBigScreen(videoId, fullTitle || title);
        else runTopSearch();
      });
    } else {
      topSuggestions.innerHTML = "<li class=\"suggest-empty\"><span>Press Enter to search \"" + q.replace(/</g,"") + "\"</span></li>";
      topSuggestions.classList.remove("hidden");
    }
  }
  clearTimeout(topSuggestTimer);
  topSuggestTimer = setTimeout(() => {
    fillSuggestions(topSearch, topSuggestions, (title, videoId, fullTitle) => {
      if (videoId) openBigScreen(videoId, fullTitle || title);
      else runTopSearch();
    });
  }, 180);
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrap") && !e.target.closest(".top-search-wrap")) {
    suggestions?.classList.add("hidden");
    topSuggestions?.classList.add("hidden");
  }
});

// ================= DROPDOWN =================
document.querySelectorAll(".dropdown-content button").forEach(btn => {
  btn.addEventListener("click", () => {
    let q = "hollywood trailers";
    if (btn.dataset.filter === "trending") q = "trending movie trailers";
    if (btn.dataset.filter === "top_rated") q = "top rated movie trailers";
    if (btn.dataset.filter === "horror") q = "horror movie trailers";

    movies = [];
    nextPageToken = "";
    fetchMovies(q, false);
  });
});

// Auth modal open/close is handled by js/auth.js
// Settings panel is handled by js/settings.js (uses #settings-panel)

// ================= INIT =================
loadAllRows();

// Optional local DB (only if you run a backend on :3000) — disabled by default
async function fetchDatabaseMovies() {
  try {
    const res = await fetch("http://localhost:3000/movies");
    const data = await res.json();
    movies = data;
    renderDatabaseMovies();
  } catch (error) {
    // silent — no backend is expected for the static frontend
  }
}

function renderDatabaseMovies() {
  if (!movieGrid) return;
  movieGrid.innerHTML = "";
  movies.forEach(movie => {
    const card = document.createElement("div");
    card.className = "movie-card";
    card.innerHTML = `
      <img src="${movie.poster}" alt="${movie.title}">
      <h3>${movie.title}</h3>
      <p>${movie.year} • ${movie.genre}</p>
    `;
    card.onclick = () => openBigScreen(movie.trailer, movie.title);
    movieGrid.appendChild(card);
  });
}

const menuToggle = document.getElementById("menu-toggle");
const sideMenu = document.getElementById("side-menu");

function closeSideMenu() {
  sideMenu?.classList.remove("active");
  document.body.classList.remove("sf-menu-open");
}
function openSideMenu() {
  sideMenu?.classList.add("active");
  document.body.classList.add("sf-menu-open");
}

if (menuToggle && sideMenu) {
  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    if (sideMenu.classList.contains("active")) closeSideMenu();
    else openSideMenu();
  });
  document.getElementById("side-menu-close")?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeSideMenu();
  });
  document.addEventListener("click", (e) => {
    if (!sideMenu.contains(e.target) && !menuToggle.contains(e.target)) {
      closeSideMenu();
    }
  });
}

// Search icon focuses the search bar
// Top navbar search — searches YouTube for any movie title worldwide
let searchInFlight = 0;

function applySearchResults(q, items) {
  const block = document.getElementById("search-results-block");
  const titleEl = document.getElementById("search-results-title");
  const list = dedupeMovies(items || []);
  indexMovies(list);
  if (block) block.classList.remove("hidden");
  if (titleEl) titleEl.textContent = "🔍 " + q + (list.length ? " (" + list.length + ")" : "");
  renderRow("row-search-results", list);
  if (list.length) {
    heroPool = list.slice(0, 8);
    heroIndex = 0;
    setHero(heroPool[0]);
    buildHeroDots();
    startHeroRotation();
    movies = list;
  }
  block?.scrollIntoView({ behavior: "smooth", block: "start" });
  return list;
}

function showSearchLoading(q) {
  const block = document.getElementById("search-results-block");
  const titleEl = document.getElementById("search-results-title");
  const row = document.getElementById("row-search-results");
  if (block) block.classList.remove("hidden");
  if (titleEl) titleEl.textContent = "🔍 Searching for \"" + q + "\"…";
  if (row) {
    row.innerHTML = '<p class="row-empty" style="padding:1rem 0.5rem;opacity:.8">Looking up trailers on YouTube…</p>';
  }
  block?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function runTopSearch() {
  const q = (document.getElementById("top-search")?.value || "").trim();
  // Always hide predictive dropdown when searching (Enter or Search button)
  hideAllSuggestions();
  document.getElementById("top-suggestions")?.classList.add("hidden");
  document.getElementById("suggestions")?.classList.add("hidden");
  if (!q) return;
  movies = [];
  nextPageToken = "";

  // Instant local hints while network loads (fallback catalog only)
  const localHits = localSuggest(q, 16);
  if (localHits.length) {
    applySearchResults(q, localHits);
  } else {
    showSearchLoading(q);
  }

  // Always query YouTube so any movie title in the world can be found
  fetchCategoryQueryToRow(q);

  const nav = document.getElementById("category-nav");
  if (nav) window.scrollTo({ top: nav.offsetTop || 0, behavior: "smooth" });
  // Blur input so mobile keyboard closes and dropdown stays gone
  try { document.getElementById("top-search")?.blur(); } catch (_) {}
}

function dedupeMovies(list) {
  const seen = new Set();
  const out = [];
  (list || []).forEach((m) => {
    if (!m || !m.id || seen.has(m.id)) return;
    seen.add(m.id);
    out.push(m);
  });
  return out;
}

/** Map official YouTube Data API search items → movie cards */
function mapYoutubeApiItems(raw) {
  return (raw || [])
    .filter((i) => i.id && i.id.videoId)
    .map((i) => ({
      id: i.id.videoId,
      title: i.snippet.title,
      thumb: lightThumb(
        (i.snippet.thumbnails.medium || i.snippet.thumbnails.default || i.snippet.thumbnails.high || {}).url || ""
      ),
      channel: i.snippet.channelTitle || ""
    }));
}

/** Map Piped / Invidious-style search items → movie cards */
function mapPipedItems(raw) {
  const list = Array.isArray(raw) ? raw : raw && raw.items ? raw.items : [];
  return list
    .filter((i) => i && (i.url || i.id || i.videoId))
    .map((i) => {
      let id = i.videoId || i.id || "";
      if (!id && i.url) {
        const m = String(i.url).match(/(?:v=|\/watch\?v=|\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
        if (m) id = m[1];
        else {
          const tail = String(i.url).split("/").pop();
          if (tail && /^[a-zA-Z0-9_-]{6,}$/.test(tail)) id = tail;
        }
      }
      if (!id) return null;
      const title = i.title || i.name || "Trailer";
      const channel = i.uploaderName || i.uploader || i.author || i.channelName || "";
      const thumb =
        (typeof i.thumbnail === "string" && i.thumbnail) ||
        (i.thumbnail && i.thumbnail.url) ||
        (Array.isArray(i.thumbnails) && i.thumbnails[0] && (i.thumbnails[0].url || i.thumbnails[0])) ||
        lightThumb(id);
      return { id, title, thumb: lightThumb(id) || thumb, channel };
    })
    .filter(Boolean);
}

/** Search Piped instances (no Google quota). Returns [] on total failure. */
async function searchViaPiped(term, max = 20) {
  const q = encodeURIComponent(term + " official trailer");
  for (const base of PIPED_SEARCH_ENDPOINTS) {
    try {
      const url = base + "?q=" + q + "&filter=videos";
      const res = await fetch(url, { method: "GET", mode: "cors" });
      if (!res.ok) continue;
      const data = await res.json();
      const items = mapPipedItems(data).slice(0, max);
      if (items.length) {
        console.log("Search via Piped OK:", base, items.length);
        return items;
      }
    } catch (err) {
      console.warn("Piped search failed:", base, err && err.message);
    }
  }
  return [];
}

/** Official YouTube Data API search. Returns [] if quota / error. */
async function searchViaYoutubeApi(term, max = 25) {
  const queries = [term + " official trailer", term + " movie trailer", term + " trailer"];
  const items = [];
  const seen = new Set();
  for (const searchQ of queries) {
    try {
      const res = await fetch(
        `${BASE_URL}/search?part=snippet&maxResults=${max}&q=${encodeURIComponent(searchQ)}&type=video&videoEmbeddable=true&key=${API_KEY}`
      );
      const data = await res.json();
      if (data.error) {
        console.warn("YouTube API error:", data.error.message || data.error);
        // Quota exhausted → stop trying official API
        if (String(data.error.message || "").toLowerCase().includes("quota") || data.error.code === 403 || data.error.code === 429) {
          return items;
        }
        continue;
      }
      mapYoutubeApiItems(data.items).forEach((m) => {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          items.push(m);
        }
      });
      if (items.length >= 12) break;
    } catch (err) {
      console.warn("YouTube API fetch failed:", err);
    }
  }
  return items;
}

async function fetchCategoryQueryToRow(q) {
  if (!q || !String(q).trim()) return;
  const term = String(q).trim();
  const requestId = ++searchInFlight;
  const titleEl = document.getElementById("search-results-title");
  const block = document.getElementById("search-results-block");

  try {
    // 1) Official YouTube API (works when quota remains)
    let items = await searchViaYoutubeApi(term, 25);
    if (requestId !== searchInFlight) return;

    // 2) Piped proxies — no API key, works when Google quota is exceeded
    if (!items.length) {
      items = await searchViaPiped(term, 20);
      if (requestId !== searchInFlight) return;
    }

    // 3) Local hard-coded catalog (popular titles only)
    if (!items.length) {
      console.warn("All network search failed — local fallback for:", term);
      items = getFallback(term, 16);
    }

    items = dedupeMovies(items);
    applySearchResults(term, items);

    if (!items.length && titleEl) {
      titleEl.textContent = '🔍 No trailers found for "' + term + '"';
      if (block) block.classList.remove("hidden");
      const row = document.getElementById("row-search-results");
      if (row) {
        row.innerHTML =
          '<p class="row-empty" style="padding:1rem 0.5rem">No trailers found. Try another title (e.g. “Oppenheimer”, “Spider-Man”, “The Matrix”).</p>';
      }
    }
  } catch (e) {
    if (requestId !== searchInFlight) return;
    console.warn("fetchCategoryQueryToRow error — using fallback", e);
    const items = dedupeMovies(getFallback(term, 16));
    applySearchResults(term, items);
  }
}

document.getElementById("clear-search-results")?.addEventListener("click", () => {
  const block = document.getElementById("search-results-block");
  if (block) block.classList.add("hidden");
  document.getElementById("row-search-results") && (document.getElementById("row-search-results").innerHTML = "");
  const top = document.getElementById("top-search");
  if (top) top.value = "";
  hideAllSuggestions();
});

document.getElementById("top-search-btn")?.addEventListener("click", runTopSearch);
document.getElementById("top-search")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    hideAllSuggestions();
    runTopSearch();
  }
});
window.addEventListener("load", () => {
  setTimeout(() => {
    const splash = document.getElementById("splash-screen");
    if (!splash) return;
    splash.style.transition = "opacity 0.6s ease";
    splash.style.opacity = "0";
    setTimeout(() => {
      try { splash.remove(); } catch (_) {}
    }, 700);
  }, 500);
});
// Pause luxury hero while user hovers
document.getElementById("hero")?.addEventListener("mouseenter", () => clearInterval(heroInterval));
document.getElementById("hero")?.addEventListener("mouseleave", () => startHeroRotation());

// Footer quick actions
document.getElementById("footer-settings")?.addEventListener("click", () => {
  document.getElementById("settings-open")?.click();
});
document.getElementById("footer-account")?.addEventListener("click", () => {
  document.getElementById("profile-chip")?.click();
});


/* =========================
   USAGE TIME + RATE PROMPT (after ~1 hour)
========================= */
(function trackUsageAndRate() {
  const KEY_START = "snowwflix_session_accum";
  const KEY_RATED = "snowwflix_user_rating";
  const KEY_PROMPTED = "snowwflix_rate_prompted";
  const HOUR_MS = 60 * 60 * 1000;
  let accum = parseInt(localStorage.getItem(KEY_START) || "0", 10) || 0;
  let last = Date.now();
  setInterval(() => {
    const now = Date.now();
    accum += now - last;
    last = now;
    localStorage.setItem(KEY_START, String(accum));
    if (accum >= HOUR_MS && !localStorage.getItem(KEY_RATED) && !localStorage.getItem(KEY_PROMPTED)) {
      localStorage.setItem(KEY_PROMPTED, "1");
      showRatePrompt();
    }
  }, 15000);

  function showRatePrompt() {
    if (document.getElementById("sf-rate-modal")) return;
    const modal = document.createElement("div");
    modal.id = "sf-rate-modal";
    modal.className = "sf-rate-modal";
    modal.innerHTML = `
      <div class="sf-rate-card">
        <button type="button" class="sf-rate-close" aria-label="Close">✕</button>
        <div class="sf-rate-emoji">❄️</div>
        <h3>Enjoying Snowwflix?</h3>
        <p>You've been exploring for a while. A 5★ rating helps us grow — it only takes a second.</p>
        <div class="sf-rate-stars-lg" id="sf-rate-prompt-stars">
          <button type="button" data-stars="1">★</button>
          <button type="button" data-stars="2">★</button>
          <button type="button" data-stars="3">★</button>
          <button type="button" data-stars="4">★</button>
          <button type="button" data-stars="5">★</button>
        </div>
        <button type="button" class="primary-btn" id="sf-rate-later">Maybe later</button>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector(".sf-rate-close").onclick = () => modal.remove();
    modal.querySelector("#sf-rate-later").onclick = () => modal.remove();
    modal.querySelectorAll("#sf-rate-prompt-stars button").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const rating = parseInt(btn.getAttribute("data-stars"), 10);
        localStorage.setItem(KEY_RATED, String(rating));
        const user = window.currentUser || window.auth?.currentUser;
        const who = user?.email || user?.displayName || "Guest";
        const uid = user?.uid || "anonymous";
        try {
          if (window.db && window.firebase) {
            await window.db.collection("ratings").add({
              rating,
              email: user?.email || null,
              displayName: user?.displayName || null,
              uid,
              source: "hour_prompt",
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          }
        } catch (_) {}
        if (rating === 5) {
          const subject = encodeURIComponent("Snowwflix 5★ rating");
          const body = encodeURIComponent("Stars: 5\\nWho: " + who + "\\nUID: " + uid + "\\nTime: " + new Date().toISOString());
          window.location.href = "mailto:lordesnoww@gmail.com?subject=" + subject + "&body=" + body;
        }
        modal.innerHTML = `<div class="sf-rate-card"><h3>Thank you!</h3><p>Your ${rating}★ rating was recorded.</p><button type="button" class="primary-btn" id="sf-rate-done">Close</button></div>`;
        modal.querySelector("#sf-rate-done").onclick = () => modal.remove();
      });
    });
  }
})();

// Expose openBigScreen for settings Watch Later
window.openBigScreen = openBigScreen;
