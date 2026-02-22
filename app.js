// GLADOON Browser: поиск по названию/описанию/скрытым тегам.
// Последние посещения: localStorage (без "истории команд").
// Лёгкий tilt: почти неподвижно.

const app = document.getElementById("app");
const tilt = document.getElementById("tilt");
const bubbles = document.getElementById("bubbles");

const topbar = document.getElementById("topbar");
const brand = document.getElementById("brand");
const btnHome = document.getElementById("btnHome");
const btnClear = document.getElementById("btnClear");

const home = document.getElementById("home");
const results = document.getElementById("results");
const list = document.getElementById("list");
const resultsTitle = document.getElementById("resultsTitle");
const resultsMeta = document.getElementById("resultsMeta");

const errbox = document.getElementById("errbox");
const errtext = document.getElementById("errtext");

const homeForm = document.getElementById("homeSearchForm");
const qHome = document.getElementById("qHome");

const searchForm = document.getElementById("searchForm");
const q = document.getElementById("q");

const recentGrid = document.getElementById("recentGrid");

const RECENTS_KEY = "gladoon_recent_v1";
const RECENTS_LIMIT = 6;

console.log("APP.JS VERSION: 2 (no json)");

const btnClearRecents = document.getElementById("btnClearRecents");

let SITES = [];

// ------------------------- utils -------------------------
function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalize(str){
  return String(str ?? "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-z0-9а-я_\-#\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(q){
  const n = normalize(q);
  if (!n) return [];
  return n.split(" ").filter(Boolean);
}

function getRecents(){
  try{
    const raw = localStorage.getItem(RECENTS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  }catch{
    return [];
  }
}

function setRecents(arr){
  localStorage.setItem(RECENTS_KEY, JSON.stringify(arr));
}

function pushRecent(site){
  const recents = getRecents();
  const id = site.url; // уникальность по url
  const filtered = recents.filter(x => x.url !== id);
  filtered.unshift({ title: site.title, description: site.description, url: site.url });
  setRecents(filtered.slice(0, RECENTS_LIMIT));
  renderRecents();
}

function openSite(site){
  pushRecent(site);
  // как в обычном браузере — новая вкладка
  window.open(site.url, "_blank", "noopener,noreferrer");
}

function showHome(){
  results.hidden = true;
  home.hidden = false;
  q.value = "";
  qHome.value = "";
  errbox.hidden = true;
  list.innerHTML = "";
  qHome.focus();
}

function showResults(){
  home.hidden = true;
  results.hidden = false;
  q.focus();
}

function showError(message){
  errbox.hidden = false;
  errtext.textContent = message;
}

function hideError(){
  errbox.hidden = true;
  errtext.textContent = "";
}

// ------------------------- search scoring -------------------------
// Требование: "животные", "утка", "ж" должны находить.
// Делает базовый "браузерный" поиск: prefix/substring/tokens.
function scoreSite(site, queryNorm, tokens){
  // searchable string: title + description + tags
  const title = normalize(site.title);
  const desc = normalize(site.description);
  const tags = Array.isArray(site.tags) ? site.tags.map(normalize).join(" ") : "";
  const hay = `${title} ${desc} ${tags}`.trim();

  let score = 0;

  // 1) точное совпадение по title
  if (queryNorm && title === queryNorm) score += 120;

  // 2) title startsWith / contains
  if (queryNorm && title.startsWith(queryNorm)) score += 90;
  if (queryNorm && title.includes(queryNorm)) score += 60;

  // 3) tags startsWith / contains
  if (queryNorm && tags.split(" ").some(t => t.startsWith(queryNorm))) score += 70;
  if (queryNorm && tags.includes(queryNorm)) score += 45;

  // 4) общее contains
  if (queryNorm && hay.includes(queryNorm)) score += 25;

  // 5) токены: каждый найденный токен добавляет
  for (const t of tokens){
    if (!t) continue;

    if (title.startsWith(t)) score += 22;
    else if (title.includes(t)) score += 16;

    if (tags.split(" ").some(x => x.startsWith(t))) score += 18;
    else if (tags.includes(t)) score += 12;

    if (desc.includes(t)) score += 8;
  }

  // маленький бонус за короткие совпадения типа "ж" (prefix)
  if (queryNorm && queryNorm.length <= 2){
    if (title.startsWith(queryNorm)) score += 18;
    if (tags.split(" ").some(x => x.startsWith(queryNorm))) score += 14;
  }

  return score;
}

function searchSites(query){
  const queryNorm = normalize(query);
  const tokens = tokenize(query);

  if (!queryNorm){
    return { error: "Пустой запрос. Введите хоть что-то, Гладунь вас не понимает..." };
  }

  const scored = SITES
    .map(s => ({ site: s, score: scoreSite(s, queryNorm, tokens) }))
    .filter(x => x.score > 0)
    .sort((a,b) => b.score - a.score);

  return { queryNorm, total: scored.length, items: scored.map(x => x.site) };
}

// ------------------------- rendering -------------------------
function renderResults(items, query, total){
  list.innerHTML = "";
  hideError();

  resultsTitle.textContent = `Результаты`;
  resultsMeta.textContent = total ? `Запрос: "${query}" • найдено: ${total}` : `Запрос: "${query}"`;

  if (!items.length){
    showError("Совпадений нет. Попробуй другое слово или более короткий фрагмент (например одну букву).");
    return;
  }

  const frag = document.createDocumentFragment();
  for (const s of items){
    const a = document.createElement("a");
    a.className = "item";
    a.href = s.url;
    a.innerHTML = `
      <div class="itemTitle">${escapeHtml(s.title)}</div>
      <div class="itemUrl">${escapeHtml(s.url)}</div>
      <div class="itemDesc">${escapeHtml(s.description || "")}</div>
    `;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      openSite(s);
    });
    frag.appendChild(a);
  }
  list.appendChild(frag);
}

function renderRecents(){
  const recents = getRecents();
  recentGrid.innerHTML = "";

  if (!recents.length){
    const empty = document.createElement("div");
    empty.className = "tile";
    empty.style.cursor = "default";
    empty.innerHTML = `
      <div class="tileTitle">Пусто</div>
      <div class="tileDesc">Открой любой сайт из результатов — он появится здесь.</div>
    `;
    recentGrid.appendChild(empty);
    return;
  }

  const frag = document.createDocumentFragment();
  for (const r of recents){
    const btn = document.createElement("div");
    btn.className = "tile";
    btn.innerHTML = `
      <div class="tileTitle">${escapeHtml(r.title)}</div>
      <div class="tileDesc">${escapeHtml(r.description || "")}</div>
    `;
    btn.addEventListener("click", () => {
      window.open(r.url, "_blank", "noopener,noreferrer");
    });
    frag.appendChild(btn);
  }
  recentGrid.appendChild(frag);
}

// ------------------------- events -------------------------
function doSearch(query){
  showResults();
  q.value = query; // синхронизируем верхнюю строку

  const res = searchSites(query);
  if (res.error){
    renderResults([], query, 0);
    showError(res.error);
    return;
  }
  renderResults(res.items, query, res.total);
}

homeForm.addEventListener("submit", (e) => {
  e.preventDefault();
  doSearch(qHome.value);
});

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  doSearch(q.value);
});

btnHome.addEventListener("click", showHome);
brand.addEventListener("click", showHome);

btnClear.addEventListener("click", () => {
  q.value = "";
  list.innerHTML = "";
  hideError();
  resultsMeta.textContent = "";
  resultsTitle.textContent = "Результаты";
  q.focus();
});

// ------------------------- bubbles -------------------------
function seedBubbles(count = 18){
  bubbles.innerHTML = "";
  for (let i=0;i<count;i++){
    const b = document.createElement("div");
    b.className = "bubble";

    const size = 6 + Math.random()*18;
    const left = Math.random()*100;
    const top = 65 + Math.random()*35;
    const dur = 4.5 + Math.random()*6.5;
    const delay = -(Math.random()*dur);

    b.style.width = `${size}px`;
    b.style.height = `${size}px`;
    b.style.left = `${left}%`;
    b.style.top = `${top}%`;
    b.style.animationDuration = `${dur}s`;
    b.style.animationDelay = `${delay}s`;

    bubbles.appendChild(b);
  }
}

// ------------------------- tiny tilt (почти стоит) -------------------------
let mx = 0, my = 0;
let tx = 0, ty = 0;
let raf = 0;

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

function animateTilt(){
  raf = 0;
  tx += (mx - tx) * 0.08;
  ty += (my - ty) * 0.08;

  // было ±10deg — теперь почти незаметно: ±1.6deg
  const rx = clamp(ty * -1.6, -1.6, 1.6);
  const ry = clamp(tx *  1.6, -1.6, 1.6);

  tilt.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
  raf = requestAnimationFrame(animateTilt);
}

window.addEventListener("pointermove", (e) => {
  const r = tilt.getBoundingClientRect();
  const cx = r.left + r.width/2;
  const cy = r.top  + r.height/2;
  mx = clamp((e.clientX - cx)/r.width,  -0.6, 0.6);
  my = clamp((e.clientY - cy)/r.height, -0.6, 0.6);
  if (!raf) raf = requestAnimationFrame(animateTilt);
}, { passive: true });

// ------------------------- load sites (no fetch) -------------------------
function loadSitesFromGlobal(){
  const data = window.GLADOON_SITES;

  if (!Array.isArray(data)){
    throw new Error("GLADOON_SITES не найден. Проверь, что sites.js подключен ДО app.js");
  }

  SITES = data
    .filter(x => x && x.title && x.url)
    .map(x => ({
      title: String(x.title),
      description: String(x.description ?? ""),
      url: String(x.url),
      tags: Array.isArray(x.tags) ? x.tags.map(String) : []
    }));
}

// ------------------------- boot -------------------------
(function boot(){
  seedBubbles();
  renderRecents();
  showHome();

  try{
    loadSitesFromGlobal();
  }catch(err){
    console.error(err);
    qHome.placeholder = "Ошибка: sites.js не подключен";
    alert("GLADOON: не смог загрузить список сайтов.\nПроверь sites.js и порядок подключения скриптов.\n\n" + (err?.message || err));
  }
})();

function clearRecents(){
  localStorage.removeItem(RECENTS_KEY);
  renderRecents();
}

btnClearRecents.addEventListener("click", () => {
  const ok = confirm("Очистить список последних посещений?");
  if (ok) clearRecents();
});