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

const cards = document.querySelectorAll(".movie-card");

cards.forEach((card,index)=>{

    card.style.opacity="0";
    card.style.transform="translateY(20px)";


    setTimeout(()=>{

        card.style.transition=
        "all .5s ease";

        card.style.opacity="1";
        card.style.transform="translateY(0)";

    }, index * 80);


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



/* =========================
   BACK TO TOP BUTTON
========================= */

const topBtn=document.createElement("button");

topBtn.innerHTML="↑";

topBtn.className="top-btn";

document.body.appendChild(topBtn);


window.addEventListener("scroll",()=>{

if(window.scrollY > 500){
    topBtn.style.display="block";
}
else{
    topBtn.style.display="none";
}

});


topBtn.onclick=()=>{

window.scrollTo({
top:0,
behavior:"smooth"
});

};



});
const API_KEY = "AIzaSyBNtzDkvwHeGQurfUpigjVXWtdVtrjTwvE";
const BASE_URL = "https://www.googleapis.com/youtube/v3";

let movies = [];
let nextPageToken = "";
let fetching = false;

let heroIndex = 0;
let heroInterval;

const movieGrid = document.getElementById("movie-grid");
const searchBar = document.getElementById("search-bar");
const suggestions = document.getElementById("suggestions");
const heroPoster = document.getElementById("hero-poster");
const heroTitle = document.getElementById("hero-title");
const heroWatch = document.getElementById("hero-watch");
const trailerModal = document.getElementById("trailer-modal");
const playerFrame = document.getElementById("player-frame");

// ================= FETCH =================
async function fetchMovies(query = "hollywood trailers", append = true) {
  if (fetching) return;
  fetching = true;

  try {
    const res = await fetch(
      `${BASE_URL}/search?part=snippet&maxResults=12&q=${encodeURIComponent(query)} official trailer&type=video&key=${API_KEY}&pageToken=${nextPageToken}`
    );

    const data = await res.json();
    if (!data.items) {
      fetching = false;
      return;
    }

    nextPageToken = data.nextPageToken || "";

    const items = data.items.map(i => ({
      id: i.id.videoId,
      title: i.snippet.title,
      thumb: i.snippet.thumbnails.high.url
    }));

    if (append) movies.push(...items);
    else movies = items;

    renderMovies();

    if (!append && items.length) {
      heroIndex = 0;
      setHero(items[0]);
    }

  } catch (err) {
    console.error("Fetch error:", err);
  }

  fetching = false;
}

// ================= RENDER =================
function renderMovies() {
  movieGrid.innerHTML = "";

  movies.forEach((m, index) => {
    const card = document.createElement("div");
    card.className = "movie-card";

    card.innerHTML = `
      <div class="iframe-wrap">
        <iframe
          src="https://www.youtube.com/embed/${m.id}?mute=1&controls=0&rel=0"
          allow="autoplay; encrypted-media"
          allowfullscreen
        ></iframe>
      </div>
      <h3>${m.title}</h3>
    `;

    const iframe = card.querySelector("iframe");

    // ▶ PLAY ON HOVER
    card.addEventListener("mouseenter", () => {
      clearInterval(heroInterval);
      heroIndex = index;
      setHero(movies[index]);

      iframe.src = `https://www.youtube.com/embed/${m.id}?autoplay=1&mute=0&controls=0&rel=0`;
    });

    // ⏸ STOP WHEN LEAVE
    card.addEventListener("mouseleave", () => {
      iframe.src = `https://www.youtube.com/embed/${m.id}?mute=1&controls=0&rel=0`;
      startHeroRotation();
    });

    // 🎬 DOUBLE CLICK = BIG SCREEN
    card.addEventListener("dblclick", () => {
      openBigScreen(m.id, m.title);
    });

    movieGrid.appendChild(card);
  });

  startHeroRotation();
}

// ================= HERO =================
function setHero(movie) {
  if (!heroPoster || !movie) return;

  heroPoster.style.opacity = "0";
  heroPoster.style.transform = "scale(1.05)";

  setTimeout(() => {
    heroPoster.style.backgroundImage = `
      linear-gradient(0deg, rgba(0,0,0,0.7), rgba(0,0,0,0.3)),
      url(${movie.thumb})
    `;
    heroPoster.style.backgroundSize = "cover";
    heroPoster.style.backgroundPosition = "center";

    if (heroTitle) heroTitle.innerText = movie.title;
    if (heroWatch) heroWatch.onclick = () => openBigScreen(movie.id, movie.title);

    heroPoster.style.transition = "all 0.8s ease";
    heroPoster.style.opacity = "1";
    heroPoster.style.transform = "scale(1)";
  }, 300);
}

// ================= HERO AUTO ROTATE (7 SEC) =================
function startHeroRotation() {
  clearInterval(heroInterval);

  heroInterval = setInterval(() => {
    if (!movies.length) return;

    heroIndex = (heroIndex + 1) % movies.length;
    setHero(movies[heroIndex]);
  }, 7000); // 🔥 changed to 7 seconds
}

// ================= BIG SCREEN =================
function openBigScreen(id, title) {
  if (!trailerModal) return;

  document.getElementById("player-title").innerText = title;
  playerFrame.src = `https://www.youtube.com/embed/${id}?autoplay=1&controls=1&rel=0`;

  trailerModal.classList.remove("hidden");
}

// CLOSE BUTTON (X)
document.getElementById("btn-close-player")?.addEventListener("click", () => {
  trailerModal.classList.add("hidden");
  playerFrame.src = "";
});

// FULLSCREEN BUTTON (custom button with id="btn-fullscreen")
document.getElementById("btn-fullscreen")?.addEventListener("click", () => {
  if (playerFrame.requestFullscreen) {
    playerFrame.requestFullscreen();
  } else if (playerFrame.webkitRequestFullscreen) {
    playerFrame.webkitRequestFullscreen();
  } else if (playerFrame.msRequestFullscreen) {
    playerFrame.msRequestFullscreen();
  }
});

// ================= SCROLL LOAD =================
window.addEventListener("scroll", () => {
  if (
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 &&
    nextPageToken &&
    !fetching
  ) {
    fetchMovies(searchBar.value.trim() || "hollywood trailers", true);
  }
});

// ================= SEARCH =================
function runSearch() {
  movies = [];
  nextPageToken = "";
  fetchMovies(searchBar.value.trim() || "hollywood trailers", false);
  suggestions.classList.add("hidden");
}

document.getElementById("search-btn")?.addEventListener("click", runSearch);

searchBar?.addEventListener("keypress", e => {
  if (e.key === "Enter") runSearch();
});

searchBar?.addEventListener("input", async () => {
  const q = searchBar.value.trim();
  if (!q) {
    suggestions.classList.add("hidden");
    return;
  }

  const res = await fetch(
    `${BASE_URL}/search?part=snippet&maxResults=6&q=${encodeURIComponent(q)} trailer&type=video&key=${API_KEY}`
  );

  const data = await res.json();
  suggestions.innerHTML = "";

  (data.items || []).forEach(i => {
    const li = document.createElement("li");
    li.innerText = i.snippet.title;
    li.onclick = () => {
      searchBar.value = i.snippet.title;
      runSearch();
    };
    suggestions.appendChild(li);
  });

  suggestions.classList.remove("hidden");
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

// ================= MODALS FIX =================
document.getElementById("signin-open")?.addEventListener("click", () => {
  document.getElementById("account-modal")?.classList.remove("hidden");
});
document.getElementById("account-close")?.addEventListener("click", () => {
  document.getElementById("account-modal")?.classList.add("hidden");
});
document.getElementById("settings-open")?.addEventListener("click", () => {
  document.getElementById("settings-modal")?.classList.remove("hidden");
});
document.getElementById("settings-close")?.addEventListener("click", () => {
  document.getElementById("settings-modal")?.classList.add("hidden");
});

// ================= INIT =================
fetchMovies();
async function fetchDatabaseMovies() {
  try {
    const res = await fetch("http://localhost:3000/movies");
    const data = await res.json();

    movies = data;

    renderDatabaseMovies();

  } catch (error) {
    console.log("Database error:", error);
  }
}


function renderDatabaseMovies() {

  movieGrid.innerHTML = "";

  movies.forEach(movie => {

    const card = document.createElement("div");
    card.className = "movie-card";

    card.innerHTML = `
      <img src="${movie.poster}" alt="${movie.title}">
      <h3>${movie.title}</h3>
      <p>${movie.year} • ${movie.genre}</p>
    `;

    card.onclick = () => {
      openBigScreen(movie.trailer, movie.title);
    };

    movieGrid.appendChild(card);

  });

}


fetchDatabaseMovies();
const menuToggle = document.getElementById("menu-toggle");
const sideMenu = document.getElementById("side-menu");

menuToggle.addEventListener("click", () => {
    sideMenu.classList.toggle("active");
});

document.addEventListener("click", (e) => {
    if (!sideMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        sideMenu.classList.remove("active");
    }
});

// Search icon focuses the search bar
document.getElementById("search-icon").addEventListener("click", () => {
    sideMenu.classList.add("active");
    document.getElementById("search-bar").focus();
});

// Notification button
document.getElementById("notification-btn").addEventListener("click", () => {
    alert("No new notifications.");
});
window.addEventListener("load",()=>{

setTimeout(()=>{

const splash=document.getElementById("splash-screen");

splash.style.opacity="0";

splash.style.transition="1s ease";


setTimeout(()=>{

splash.remove();

},1000);


},10000);


});