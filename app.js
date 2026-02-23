// GLADOON/SKIBIDINET Browser OS layer
// - Topbar + taskbar
// - Internet connection with password
// - Packet Fragmentation module for SKIBIDINET only
// - Search gated by rules

const tilt = document.getElementById("tilt");
const bubbles = document.getElementById("bubbles");

const brand = document.getElementById("brand");
const btnHome = document.getElementById("btnHome");
const btnClear = document.getElementById("btnClear");
const btnClearRecents = document.getElementById("btnClearRecents");

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
const special = document.getElementById("special");
const offlineGame = document.getElementById("offlineGame");
const wifiUnlock = document.getElementById("wifiUnlock");
const dinoCanvas = document.getElementById("dinoCanvas");
const dinoScoreEl = document.getElementById("dinoScore");
const btnDinoRestart = document.getElementById("btnDinoRestart");

const tbNet = document.getElementById("tbNet");
const netStatusText = document.getElementById("netStatusText");
const netPanel = document.getElementById("netPanel");
const netClose = document.getElementById("netClose");
const netManual = document.getElementById("netManual");
const netManualBtn = document.getElementById("netManualBtn");
const netManualHint = document.getElementById("netManualHint");
const wifiNet = document.getElementById("wifiNet");
const netDisconnect = document.getElementById("netDisconnect");

const wifiModal = document.getElementById("wifiModal");
const wifiClose = document.getElementById("wifiClose");
const wifiCancel = document.getElementById("wifiCancel");
const wifiPass = document.getElementById("wifiPass");
const wifiConnect = document.getElementById("wifiConnect");
const wifiMsg = document.getElementById("wifiMsg");

const tbPackets = document.getElementById("tbPackets");

// only exists on skibidinet.html
const pktModal = document.getElementById("pktModal");
const pktClose = document.getElementById("pktClose");
const pktCancel = document.getElementById("pktCancel");
const pktPass = document.getElementById("pktPass");
const pktEnable = document.getElementById("pktEnable");
const pktMsg = document.getElementById("pktMsg");

let SITES = [];

const APP = (document.body.dataset.app || "gladoon").toLowerCase();
const IS_SKIBI = APP.includes("skibi");

const WIFI_SSID = "WIFI-Pi33EMANIA";
const WIFI_PASSWORD = "6Cf8Vg2Bh1Nj7Mk9";
const PACKET_PASSWORD = "Oo3Pa5Sz0Dx6Cf8Vg2Bh1Nj7Mk9Lp3Qw5";

// storage keys
const KEY_NET = "gladoon_net_connected_v1";         // boolean
const KEY_PKT = "gladoon_packets_enabled_v1";        // boolean
const KEY_SKIBI_SEEN = "gladoon_skibidinet_seen_v1"; // boolean (unlock icon)
const KEY_RECENTS_BASE = "gladoon_recent_v1";        // we can split per world later if you want

const RECENTS_KEY = KEY_RECENTS_BASE; // keep common for now
const RECENTS_LIMIT = 6;

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

function getBool(key){
  return localStorage.getItem(key) === "1";
}
function setBool(key, v){
  localStorage.setItem(key, v ? "1" : "0");
}

function isNetConnected(){
  return getBool(KEY_NET);
}
function isPacketsEnabled(){
  return getBool(KEY_PKT);
}

function markSkibiSeen(){
  setBool(KEY_SKIBI_SEEN, true);
}
function isSkibiSeen(){
  return getBool(KEY_SKIBI_SEEN);
}

function updateTaskbar(){
  const net = isNetConnected();
  netStatusText.textContent = net ? "Интернет: ON" : "Интернет: OFF";

  // packets icon appears:
  // - on skibidinet page always
  // - on gladoon page only after you have visited skibidinet at least once
  if (tbPackets){
    const shouldShow = IS_SKIBI || isSkibiSeen();
    tbPackets.hidden = !shouldShow;

    if (!tbPackets.hidden){
      tbPackets.classList.toggle("danger", isPacketsEnabled());
      tbPackets.querySelector(".tbText").textContent =
        isPacketsEnabled() ? "Дробление пакетов: ON" : "Дробление пакетов";
    }
  }
}

function canSearch(){
  // Base: must have internet
  if (!isNetConnected()) return { ok:false, reason:"Нет подключения к Интернету. Подключись справа снизу." };

  // GLADOON blocks if packets enabled
  if (!IS_SKIBI && isPacketsEnabled()){
    return { ok:false, reason:"Подключение подозрительное: обнаружено 'Дробление пакетов'. Отключи его (SKIBIDINET-режим) и оставайся только на Интернете." };
  }

  // SKIBIDINET requires packets enabled
  if (IS_SKIBI && !isPacketsEnabled()){
    return { ok:false, reason:"SKIBIDINET требует 'Дробление пакетов'. Включи модуль на панели задач." };
  }

  return { ok:true };
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
  const id = site.url;
  const filtered = recents.filter(x => x.url !== id);
  filtered.unshift({ title: site.title, description: site.description, url: site.url });
  setRecents(filtered.slice(0, RECENTS_LIMIT));
  renderRecents();
}

function openSite(site){
  pushRecent(site);
  window.open(site.url, "_blank", "noopener,noreferrer");
}

function showHome(){
  results.hidden = true;
  home.hidden = false;
  q.value = "";
  qHome.value = "";
  errbox.hidden = true;
  list.innerHTML = "";
  if (special){ special.innerHTML=""; special.hidden=true; }
  qHome?.focus();
}

function showResults(){
  home.hidden = true;
  results.hidden = false;
  q?.focus();
}

function showError(message){
  errbox.hidden = false;
  errtext.textContent = message;
}
function hideError(){
  errbox.hidden = true;
  errtext.textContent = "";
}

// =========================
// OFFLINE DINO (Chrome-like)
// =========================
const DINO_BEST_KEY = "gladoon_dino_best_v1";
const DINO_WIFI_UNLOCK_KEY = "gladoon_dino_wifi_unlock_v1";

let dino = {
  running: false,
  raf: 0,
  lastTs: 0,

  y: 0,
  vy: 0,
  onGround: true,

  speed: 360,
  speedUp: 6,
  groundY: 170,

  obs: [],
  nextObs: 0,

  score: 0,
  best: 0,
  alive: true,

  w: 28,
  h: 34,

  // NEW: jump hold
  jumpHeld: false,
  holdTime: 0,
  maxHold: 0.18,
  holdBoost: 2200,
  maxHeight: 120
};

function dinoGetBest(){
  const v = Number(localStorage.getItem(DINO_BEST_KEY) || "0");
  return Number.isFinite(v) ? v : 0;
}
function dinoSetBest(v){
  localStorage.setItem(DINO_BEST_KEY, String(Math.max(0, Math.floor(v))));
}

function dinoReset(){
  dino.jumpHeld = false;
  dino.holdTime = 0;

  dino.speed = 360;
  dino.obs = [];
  dino.nextObs = 0.65; // сек до первого препятствия

  dino.score = 0;
  dino.best = dinoGetBest();
  dino.alive = true;

  dinoUpdateScore();
  updateWifiUnlockUI();
}

function wifiUnlockIsOpen(){
  return localStorage.getItem(DINO_WIFI_UNLOCK_KEY) === "1";
}
function wifiUnlockOpen(){
  localStorage.setItem(DINO_WIFI_UNLOCK_KEY, "1");
}

function updateWifiUnlockUI(){
  if (!wifiUnlock) return;
  wifiUnlock.hidden = !wifiUnlockIsOpen();
}

function dinoUpdateScore(){
  if (!dinoScoreEl) return;
  dinoScoreEl.textContent = `Score: ${Math.floor(dino.score)} • Best: ${Math.floor(dino.best)}`;
}

function dinoSpawnObstacle(){
  // типы: маленький/большой "кактус"
  const big = Math.random() < 0.35;
  const w = big ? 22 : 14;
  const h = big ? 44 : 30;

  dino.obs.push({
    x: dinoCanvas.width + 30,
    y: dino.groundY - h,
    w,
    h
  });
}

function dinoJump(){
  if (!dino.running) return;
  if (!dino.alive) return;
  if (!dino.onGround) return;

  dino.vy = 620;      // стартовый импульс вверх (как мы уже фиксили)
  dino.onGround = false;
  dino.holdTime = 0;  // начинаем считать удержание
}

function dinoRestart(){
  if (!offlineGame) return;
  dinoReset();
}

function dinoStop(){
  dino.running = false;
  if (dino.raf) cancelAnimationFrame(dino.raf);
  dino.raf = 0;
  dino.lastTs = 0;
}

function dinoStart(){
  if (!offlineGame || !dinoCanvas) return;

  // подгоняем канвас под размер контейнера (retina-safe)
  const cssW = offlineGame.clientWidth ? Math.min(960, offlineGame.clientWidth) : 900;
  const cssH = 220;
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  dinoCanvas.width = Math.floor(cssW * dpr);
  dinoCanvas.height = Math.floor(cssH * dpr);
  dinoCanvas.style.width = cssW + "px";
  dinoCanvas.style.height = cssH + "px";

  dino.groundY = Math.floor(190 * dpr);
  dino.w = Math.floor(28 * dpr);
  dino.h = Math.floor(34 * dpr);

  dinoReset();
  dino.running = true;
  dino.lastTs = performance.now();

  const ctx = dinoCanvas.getContext("2d");
  ctx.setTransform(1,0,0,1,0,0);

  function rectsOverlap(a, b){
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function tick(ts){
    if (!dino.running) return;
    const dt = Math.min(0.033, Math.max(0.001, (ts - dino.lastTs) / 1000));
    dino.lastTs = ts;

    // update
    if (dino.alive){
      dino.score += dt * 12;
      dino.speed += dt * dino.speedUp;
    }

    // gravity (y = высота над землёй, вверх = +)
dino.vy -= 1800 * dt;      // гравитация тянет вниз
dino.y  += dino.vy * dt;   // растёт — вверх, падает — вниз

// земля
if (dino.y <= 0){
  dino.y = 0;
  dino.vy = 0;
  dino.onGround = true;
}

    // obstacles timing
    dino.nextObs -= dt;
    if (dino.alive && dino.nextObs <= 0){
      dinoSpawnObstacle();
      // следующее препятствие через 0.7..1.45 сек (чуть зависит от скорости)
      const base = 0.7 + Math.random()*0.75;
      const speedFactor = Math.max(0.55, 420 / dino.speed);
      dino.nextObs = base * speedFactor;
    }

    // move obstacles
    for (const o of dino.obs){
      o.x -= dino.speed * dt;
    }
    // cleanup
    dino.obs = dino.obs.filter(o => o.x + o.w > -50);

    // collision
    if (dino.alive){
      const player = {
        x: Math.floor(dinoCanvas.width * 0.10),
        y: dino.groundY - dino.h - dino.y,
        w: dino.w,
        h: dino.h
      };
      for (const o of dino.obs){
        if (rectsOverlap(player, o)){
          dino.alive = false;
          dino.best = Math.max(dino.best, dino.score);
          dinoSetBest(dino.best);
          if (dino.best >= 400){
          wifiUnlockOpen();
          updateWifiUnlockUI();
        }
          dinoUpdateScore();
          break;
        }
      }
    }
    

    // draw
    ctx.clearRect(0,0,dinoCanvas.width,dinoCanvas.height);

    // ground line
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "rgba(233,236,255,.15)";
    ctx.fillRect(0, dino.groundY + Math.floor(8*(window.devicePixelRatio||1)), dinoCanvas.width, Math.floor(2*(window.devicePixelRatio||1)));

    // obstacles
    ctx.fillStyle = "rgba(233,236,255,.70)";
    for (const o of dino.obs){
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }

    // dino (simple rectangle style)
    const dx = Math.floor(dinoCanvas.width * 0.10);
    const dy = dino.groundY - dino.h - dino.y;
    ctx.fillStyle = dino.alive ? "rgba(233,236,255,.92)" : "rgba(255,95,214,.85)";
    ctx.fillRect(dx, dy, dino.w, dino.h);

    // text overlay when dead
    if (!dino.alive){
      ctx.fillStyle = "rgba(233,236,255,.85)";
      ctx.font = `${Math.floor(14*(window.devicePixelRatio||1))}px ui-monospace, Menlo, Consolas`;
      ctx.fillText("OFFLINE. Press R to restart.", Math.floor(dinoCanvas.width*0.34), Math.floor(dinoCanvas.height*0.52));
    }

    // update score UI
    dinoUpdateScore();

    dino.raf = requestAnimationFrame(tick);
  }

  dino.raf = requestAnimationFrame(tick);
}

function showOfflineGame(){
  showResults();
  if (special){ special.innerHTML = ""; special.hidden = true; }
  list.innerHTML = "";
  hideError();

  if (offlineGame){
    offlineGame.hidden = false;
    updateWifiUnlockUI();
    dinoStart();
  }
  updateWifiUnlockUI();
}

function hideOfflineGame(){
  if (offlineGame){
    offlineGame.hidden = true;
  }
  dinoStop();
}

// controls
window.addEventListener("keydown", (e) => {
  if (!offlineGame || offlineGame.hidden) return;

  if (e.code === "Space" || e.code === "ArrowUp"){
    e.preventDefault();
    dinoJump();
  }
  if (e.code === "KeyR"){
    e.preventDefault();
    dinoRestart();
  }
});

btnDinoRestart?.addEventListener("click", () => dinoRestart());

function scoreSite(site, queryNorm, tokens){
  const title = normalize(site.title);
  const desc = normalize(site.description);
  const tags = Array.isArray(site.tags) ? site.tags.map(normalize).join(" ") : "";
  const hay = `${title} ${desc} ${tags}`.trim();

  let score = 0;
  if (queryNorm && title === queryNorm) score += 120;
  if (queryNorm && title.startsWith(queryNorm)) score += 90;
  if (queryNorm && title.includes(queryNorm)) score += 60;

  if (queryNorm && tags.split(" ").some(t => t.startsWith(queryNorm))) score += 70;
  if (queryNorm && tags.includes(queryNorm)) score += 45;

  if (queryNorm && hay.includes(queryNorm)) score += 25;

  for (const t of tokens){
    if (!t) continue;

    if (title.startsWith(t)) score += 22;
    else if (title.includes(t)) score += 16;

    if (tags.split(" ").some(x => x.startsWith(t))) score += 18;
    else if (tags.includes(t)) score += 12;

    if (desc.includes(t)) score += 8;
  }

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
    return { error:"Пустой запрос. Введи хоть что-то." };
  }

  const scored = SITES
    .map(s => ({ site:s, score:scoreSite(s, queryNorm, tokens) }))
    .filter(x => x.score > 0)
    .sort((a,b) => b.score - a.score);

  return { queryNorm, total: scored.length, items: scored.map(x => x.site) };
}

function renderResults(items, query, total){
  list.innerHTML = "";
  hideError();

  resultsTitle.textContent = "Результаты";
  resultsMeta.textContent = total
    ? `Запрос: "${query}" • найдено: ${total}`
    : `Запрос: "${query}"`;

  if (!items.length){
    showError("Совпадений нет. Попробуй другое слово или более короткий фрагмент.");
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
      <div class="tileDesc">Открой любой сайт — он появится здесь.</div>
    `;
    recentGrid.appendChild(empty);
    return;
  }

  const frag = document.createDocumentFragment();
  recents.forEach((r, index) => {
    const btn = document.createElement("div");
    btn.className = "tile";
    btn.innerHTML = `
      <div class="tileRemove" title="Удалить">×</div>
      <div class="tileTitle">${escapeHtml(r.title)}</div>
      <div class="tileDesc">${escapeHtml(r.description || "")}</div>
    `;

    btn.addEventListener("click", (e) => {
      if (e.target.classList.contains("tileRemove")) return;
      window.open(r.url, "_blank", "noopener,noreferrer");
    });

    btn.querySelector(".tileRemove").addEventListener("click", (e) => {
      e.stopPropagation();
      const rec = getRecents();
      rec.splice(index, 1);
      setRecents(rec);
      renderRecents();
    });

    frag.appendChild(btn);
  });

  recentGrid.appendChild(frag);
}

function doSearch(query){
  // 1) gate check (ВАЖНО: проверяем наш "интернет", а не navigator.onLine)
  const gate = canSearch();

  // Если именно "нет интернета" — запускаем Dino
  if (!gate.ok && !isNetConnected()){
    showOfflineGame();
    resultsMeta.textContent = "Offline mode: Dino";
    return;
  }

  // Если доступ заблокирован по другой причине — обычная ошибка (без Dino)
  if (!gate.ok){
    showResults();
    hideOfflineGame();
    if (special){ special.innerHTML=""; special.hidden=true; }
    list.innerHTML = "";
    showError(gate.reason);
    resultsMeta.textContent = IS_SKIBI ? "Доступ ограничен (SKIBIDINET)" : "Доступ ограничен (GLADOON)";
    return;
  }

  // 2) доступ разрешён — скрываем Dino, продолжаем обычный поиск
  hideOfflineGame();

  if (special){
    special.innerHTML = "";
    special.hidden = true;
  }

  const qn = normalize(query);

  // --- ПАСХАЛКА КОЛБАСКА ---
  if (qn === "колбаска"){
    showResults();
    if (special){
      special.innerHTML = `
        <img src="https://brestmeat.by/upload/resize_cache/webp/iblock/887/jq1k6kcbo3ofrky3f4cgx2xlhuiufrlj.webp">
      `;
      special.hidden = false;
    }
    list.innerHTML = "";
    hideError();
    resultsMeta.textContent = "найдена колбаска";
    return;
  }

  showResults();
  q.value = query;

  const res = searchSites(query);
  if (res.error){
    renderResults([], query, 0);
    showError(res.error);
    return;
  }
  renderResults(res.items, query, res.total);
}

/* ====== INTERNET PANEL + WIFI ====== */
function toggleNetPanel(){
  netPanel.hidden = !netPanel.hidden;
}
function openWifiModal(){
  wifiMsg.textContent = "";
  wifiPass.value = "";
  wifiModal.hidden = false;
  wifiPass.focus();
}
function closeWifiModal(){
  wifiModal.hidden = true;
}
function closeNetPanel(){
  netPanel.hidden = true;
}

function connectWifi(pass){
  if (pass === WIFI_PASSWORD){
    setBool(KEY_NET, true);
    wifiMsg.textContent = "Подключено.";
    updateTaskbar();
    closeWifiModal();
    closeNetPanel();
    return true;
  }
  wifiMsg.textContent = "Неверный пароль.";
  return false;
}

function disconnectNet(){
  setBool(KEY_NET, false);
  updateTaskbar();
}

/* ====== PACKETS ====== */
function openPacketsModal(){
  if (!IS_SKIBI){
    // from GLADOON you can only disable (to clean yourself), enabling is "suspicious"
    // but you said it appears after visiting SKIBIDINET: so we allow toggle UI
    // We'll still require password to enable.
  }
  if (!pktModal) return;
  pktMsg.textContent = "";
  pktPass.value = "";
  pktModal.hidden = false;
  pktPass.focus();
}
function closePacketsModal(){
  if (!pktModal) return;
  pktModal.hidden = true;
}

function enablePackets(pass){
  if (pass === PACKET_PASSWORD){
    setBool(KEY_PKT, true);
    if (pktMsg) pktMsg.textContent = "Дробление пакетов включено.";
    updateTaskbar();
    closePacketsModal();
    return true;
  }
  if (pktMsg) pktMsg.textContent = "Неверный ключ.";
  return false;
}

function disablePackets(){
  setBool(KEY_PKT, false);
  updateTaskbar();
}

/* ===== Secret: 10 clicks portal both ways ===== */
(function initPortal(){
  const SECRET_CLICKS = 10;
  const SECRET_WINDOW_MS = 2000;
  let clicks = [];

  function portalTarget(){
    const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    return file.includes("skibidinet") ? "index.html" : "skibidinet.html";
  }

  if (!brand) return;

  brand.addEventListener("click", () => {
    const now = Date.now();
    clicks.push(now);
    clicks = clicks.filter(t => now - t <= SECRET_WINDOW_MS);

    if (clicks.length >= SECRET_CLICKS){
      clicks = [];
      window.location.href = portalTarget();
      return;
    }

    showHome();
  });
})();

/* ===== events ===== */
homeForm.addEventListener("submit", (e) => {
  e.preventDefault();
  doSearch(qHome.value);
});

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  doSearch(q.value);
});

btnHome.addEventListener("click", showHome);

btnClear.addEventListener("click", () => {
  q.value = "";
  list.innerHTML = "";
  hideError();
  resultsMeta.textContent = "";
  resultsTitle.textContent = "Результаты";
  if (special){ special.innerHTML=""; special.hidden=true; }
  q.focus();
});

btnClearRecents.addEventListener("click", () => {
  const ok = confirm("Очистить список последних посещений?");
  if (!ok) return;
  localStorage.removeItem(RECENTS_KEY);
  renderRecents();
});

/* taskbar internet */
tbNet.addEventListener("click", toggleNetPanel);
netClose.addEventListener("click", closeNetPanel);

netManualBtn.addEventListener("click", () => {
  const code = normalize(netManual.value);
  if (!code){
    netManualHint.textContent = "Пусто. Введи хоть что-то.";
    return;
  }
  // “коды” — можно позже использовать как секреты.
  netManualHint.textContent = `Код принят: ${code}. (ничего не произошло)`;
  netManual.value = "";
});

wifiNet.addEventListener("click", openWifiModal);

wifiConnect.addEventListener("click", () => connectWifi(wifiPass.value));
wifiClose.addEventListener("click", closeWifiModal);
wifiCancel.addEventListener("click", closeWifiModal);
wifiPass.addEventListener("keydown", (e) => {
  if (e.key === "Enter") connectWifi(wifiPass.value);
  if (e.key === "Escape") closeWifiModal();
});

netDisconnect.addEventListener("click", () => {
  disconnectNet();
  closeNetPanel();
});

/* packets button behavior */
if (tbPackets){
  tbPackets.addEventListener("click", () => {
    // if enabled -> allow quick disable without password (like toggling off)
    if (isPacketsEnabled()){
      const ok = confirm("Отключить 'Дробление пакетов'?");
      if (ok) disablePackets();
      return;
    }

    // if not enabled -> open modal (password required)
    if (pktModal){
      openPacketsModal();
    }else{
      // GLADOON page has no modal, but can show hint
      alert("Этот модуль активируется только в SKIBIDINET (впервые открой SKIBIDINET).");
    }
  });
}

/* packets modal only exists in SKIBI */
if (pktModal){
  pktEnable.addEventListener("click", () => enablePackets(pktPass.value));
  pktClose.addEventListener("click", closePacketsModal);
  pktCancel.addEventListener("click", closePacketsModal);
  pktPass.addEventListener("keydown", (e) => {
    if (e.key === "Enter") enablePackets(pktPass.value);
    if (e.key === "Escape") closePacketsModal();
  });
}

/* tiny tilt */
let mx = 0, my = 0;
let tx = 0, ty = 0;
let raf = 0;
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
function animateTilt(){
  raf = 0;
  tx += (mx - tx) * 0.08;
  ty += (my - ty) * 0.08;
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
}, { passive:true });

function seedBubbles(count = 16){
  if (!bubbles) return;
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

/* load sites (no fetch) */
function loadSitesFromGlobal(){
  const data = window.SITES_DATA;
  if (!Array.isArray(data)){
    throw new Error("SITES_DATA не найден. Проверь подключение sites.js / skibidinet.js ДО app.js");
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

/* boot */
(function boot(){
  seedBubbles();
  renderRecents();
  showHome();

  // visiting skibidinet unlocks packets icon in gladoon
  if (IS_SKIBI) markSkibiSeen();
  updateTaskbar();

  try{
    loadSitesFromGlobal();
  }catch(err){
    console.error(err);
    alert("Не смог загрузить список сайтов: " + (err?.message || err));
  }
})();