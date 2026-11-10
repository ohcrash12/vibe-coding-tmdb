const API_KEY = window.TMDB_API_KEY;
const API_URL = "https://api.themoviedb.org/3/movie/now_playing";
const POSTER_BASE = "https://image.tmdb.org/t/p/w342";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";

const heroEl = document.querySelector("#hero");
const rowsEl = document.querySelector("#rows");
const statusEl = document.querySelector("#status");
const headerEl = document.querySelector(".header");

const ROW_TITLES = ["지금 극장에서", "이번 주 인기작", "새로 만나는 작품", "더 많은 현재 상영작"];

window.addEventListener("scroll", () => {
  headerEl.classList.toggle("is-solid", window.scrollY > 24);
});

async function fetchPage(page) {
  const params = new URLSearchParams({
    api_key: API_KEY,
    language: "ko-KR",
    region: "KR",
    page: String(page),
  });
  const response = await fetch(`${API_URL}?${params}`);
  if (!response.ok) {
    throw new Error("현재 상영작을 불러오지 못했습니다.");
  }
  return response.json();
}

async function loadNowPlaying() {
  const firstPage = await fetchPage(1);
  const extraPages = await Promise.all(
    Array.from({ length: Math.max(firstPage.total_pages - 1, 0) }, (_, index) =>
      fetchPage(index + 2)
    )
  );

  return [firstPage, ...extraPages]
    .flatMap((page) => page.results)
    .filter((movie) => movie.poster_path && movie.title);
}

function renderHero(movie) {
  const backdrop = movie.backdrop_path
    ? `${BACKDROP_BASE}${movie.backdrop_path}`
    : `${POSTER_BASE}${movie.poster_path}`;
  const rating = Number(movie.vote_average).toFixed(1);

  heroEl.hidden = false;
  heroEl.style.backgroundImage = `url("${backdrop}")`;
  heroEl.innerHTML = `
    <div class="hero-content">
      <p class="eyebrow">NOW PLAYING</p>
      <h1>${escapeHtml(movie.title)}</h1>
      <div class="meta">
        평점 ${rating}
        <span>${escapeHtml(movie.release_date || "")}</span>
      </div>
      <p class="overview">${escapeHtml(movie.overview || "줄거리 정보가 없습니다.")}</p>
    </div>
  `;
}

function renderRows(movies) {
  const chunkSize = 12;
  rowsEl.innerHTML = "";

  for (let index = 0; index < movies.length; index += chunkSize) {
    const chunk = movies.slice(index, index + chunkSize);
    const title = ROW_TITLES[Math.floor(index / chunkSize)] || "현재 상영작";
    const row = document.createElement("section");
    row.className = "row";
    row.innerHTML = `
      <h2>${title}</h2>
      <div class="scroller">
        <button class="arrow prev" type="button" aria-label="이전 영화">‹</button>
        <div class="track">
          ${chunk.map(renderCard).join("")}
        </div>
        <button class="arrow next" type="button" aria-label="다음 영화">›</button>
      </div>
    `;
    rowsEl.appendChild(row);
  }

  rowsEl.querySelectorAll(".scroller").forEach((scroller) => {
    const track = scroller.querySelector(".track");
    scroller.querySelector(".prev").addEventListener("click", () => {
      track.scrollBy({ left: -track.clientWidth * 0.8, behavior: "smooth" });
    });
    scroller.querySelector(".next").addEventListener("click", () => {
      track.scrollBy({ left: track.clientWidth * 0.8, behavior: "smooth" });
    });
  });
}

function renderCard(movie) {
  return `
    <article class="card">
      <div class="poster-wrap">
        <img
          src="${POSTER_BASE}${movie.poster_path}"
          alt="${escapeHtml(movie.title)} 포스터"
          loading="lazy"
        />
      </div>
      <p class="title">${escapeHtml(movie.title)}</p>
      <p class="release-date">${escapeHtml(movie.release_date || "")}</p>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function init() {
  try {
    if (!API_KEY || API_KEY === "YOUR_TMDB_API_KEY") {
      throw new Error("config.js에 TMDB API 키를 설정해주세요. (config.example.js 참고)");
    }

    const movies = await loadNowPlaying();
    if (movies.length === 0) {
      statusEl.textContent = "현재 상영 중인 영화가 없습니다.";
      return;
    }

    statusEl.hidden = true;
    renderHero(movies[0]);
    renderRows(movies);
  } catch (error) {
    statusEl.classList.add("is-error");
    statusEl.textContent = error.message;
  }
}

init();
