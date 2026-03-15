// GLADOON/SKIBIDINET Browser OS layer
// - Topbar + taskbar
// - Internet connection with password
// - Packet Fragmentation module for SKIBIDINET only
// - Search gated by rules

const tilt = document.getElementById("tilt");
const bubbles = document.getElementById("bubbles");

const brand = document.getElementById("brand");
const btnHome = document.getElementById("btnHome");
const btnHistory = document.getElementById("btnHistory");
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
let adSection = null;
let adBody = null;
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
const taskbar = document.getElementById("taskbar");
let btnAntivirus = null;
let virusScanInterval = null;
let virusInstallTimeout = null;

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

const SECRET_NOTES_CODE = "d18ed182d183d0b1d0b5d0b120d094d0b8d0bcd0b020d093d0bbd0b0d0b4d183d0bd";
const INTERNAL_NOTES_URL = "gladoon://notes";
const VIRUS_INSTALL_CHANCE = 0.10;
const KEY_VIRUS_INFECTED = "gladoon_virus_infected_v1";
const KEY_VIRUS_SCAN = "gladoon_virus_scan_v1";
const KEY_VIRUS_NAME = "gladoon_virus_name_v1";
const DEFAULT_GLADUN_NOTES = `Привiт, це я Дiма Гладун, пишу це собi шоб не забути шо це я
Я создав Gladoon, SKIBIDINET i модерiрую FAQ сайту в поддержку i секретний форум сша.

Gladoon став популярним бо це найкращий сервiс на якому навiть э ссилка на мiй ютубеп канал
а SKIBIDINET такий сайт який менi помогав робити морiартi. хз хто це, вiн вроде карти тосуе добре, я создав цей сайт шоб там найти друзiв

Нафiга я модерiрую 2 сайти. на ххххууу хрен його знае. менi сказали шо будуть платити за це, але вже працюю другий рiк i не можу понять коли це менi будуть платить вже

Надiюсь шо нiхто не узнае шо мой самий главний секрет, це те шо я создав SKIBIDINET i через це вiд мене вiдвернувся пiдiдi. але пiДiдi реальна падла бо вiн хоче расказати всiм це i постiйно погрожуе менi.

Короче то капец, це я Дiма Гладун, сподiваюсь шо не забуду де цi заметкi, та не скину ссылку якомусь клешнерукому на  цi заметки случайно.`;

const FALLBACK_ADVERTISING = [
  {
    id: 1,
    image: "advertising/1.png",
    title: "Joker Bank",
    caption: "Премиальный банк для тех, кто считает обычные проценты оскорблением.",
    url: "https://example.com/jokerbank"
  },
  {
    id: 2,
    image: "advertising/2.png",
    title: "Pi33EMANIA Network",
    caption: "Закрытая сеть, о которой все слышали, но никто не признается.",
    url: "https://example.com/pi33emania"
  }
];

// ===== Network Monitor state (объявить ДО applyExtensions/boot) =====
let monitorInterval = null;

// storage keys
const KEY_NET = "gladoon_net_connected_v1";         // boolean
const KEY_PKT = "gladoon_packets_enabled_v1";        // boolean
const KEY_SKIBI_SEEN = "gladoon_skibidinet_seen_v1"; // boolean (unlock icon)
const KEY_RECENTS_BASE = "gladoon_recent_v1";        // we can split per world later if you want

const RECENTS_LIMIT = 6; // лимит плиток в последних посещениях



// ================= EXTENSIONS CORE =================
const EXT_KEY = "gladoon_extensions_v1";

function getExtensions(){
  try{
    return JSON.parse(localStorage.getItem(EXT_KEY)) || {};
  }catch{
    return {};
  }
}

function setExtensions(data){
  localStorage.setItem(EXT_KEY, JSON.stringify(data));
}

function enableExt(name){
  const e = getExtensions();
  e[name] = true;
  setExtensions(e);
  applyExtensions();
}

function disableExt(name){
  const e = getExtensions();
  delete e[name];
  setExtensions(e);
  applyExtensions();
}

function hasExt(name){
  return !!getExtensions()[name];
}

function getMode(){
  const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  return file.includes("skibidinet") ? "skibidinet" : "gladoon";
}

const MODE = getMode();

// раздельные хранилища
const RECENTS_KEY = MODE === "skibidinet"
  ? "skibidinet_recent_v1"
  : "gladoon_recent_v1";

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

function isVirusInfected(){
  return getBool(KEY_VIRUS_INFECTED);
}
function setVirusInfected(v){
  setBool(KEY_VIRUS_INFECTED, v);
}
function isVirusScanRunning(){
  return getBool(KEY_VIRUS_SCAN);
}
function setVirusScanRunning(v){
  setBool(KEY_VIRUS_SCAN, v);
}
function getVirusName(){
  return localStorage.getItem(KEY_VIRUS_NAME) || "unknown.exe";
}
function setVirusName(v){
  localStorage.setItem(KEY_VIRUS_NAME, String(v || "unknown.exe"));
}

function ensureUiEnhancers(){
  if (document.getElementById("gladoonDynamicFx")) return;
  const style = document.createElement("style");
  style.id = "gladoonDynamicFx";
  style.textContent = `
    .internalPageWide{
      width:min(1120px, 100%);
      margin:0 auto;
      padding:8px 0 2px;
    }
    .internalPageFlags{
      display:flex; justify-content:space-between; align-items:center; gap:12px;
      margin:0 0 14px;
      color:rgba(233,236,255,.62);
      font-size:12px; letter-spacing:.08em; text-transform:uppercase;
    }
    .internalPageFlags .flag{
      padding:6px 10px; border-radius:999px;
      border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.05);
      backdrop-filter:blur(8px);
    }
    .notesDoc{
      width:100%;
      min-height:420px;
      border-radius:28px;
      border:1px solid rgba(255,255,255,.16);
      background:
        linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,.03)),
        radial-gradient(circle at top right, rgba(79,215,255,.10), transparent 36%),
        radial-gradient(circle at top left, rgba(155,107,255,.12), transparent 42%);
      box-shadow:0 36px 120px rgba(0,0,0,.50);
      overflow:hidden;
      position:relative;
    }
    .notesDoc::before{
      content:""; position:absolute; inset:0; pointer-events:none;
      background:
        linear-gradient(90deg, transparent 0 92%, rgba(255,255,255,.04) 92% 100%),
        linear-gradient(180deg, transparent 0 85%, rgba(255,255,255,.03) 85% 100%);
      opacity:.8;
    }
    .notesDocHead{
      display:flex; justify-content:space-between; align-items:flex-start; gap:16px;
      padding:22px 24px 18px;
      border-bottom:1px solid rgba(255,255,255,.10);
      background:linear-gradient(90deg, rgba(155,107,255,.18), rgba(79,215,255,.08), rgba(255,255,255,.03));
    }
    .notesDocTitle{
      font-family:var(--brand);
      font-size:clamp(24px, 4vw, 34px);
      letter-spacing:.08em;
      margin-bottom:6px;
    }
    .notesDocSub{
      color:rgba(233,236,255,.62);
      font-size:13px;
    }
    .notesDocSeal{
      flex:0 0 auto;
      padding:10px 12px;
      border-radius:16px;
      border:1px solid rgba(255,255,255,.12);
      background:rgba(255,255,255,.05);
      font-size:11px;
      text-transform:uppercase;
      letter-spacing:.12em;
      color:rgba(233,236,255,.72);
      text-align:right;
    }
    .notesDocBody{
      padding:24px;
    }
    .notesDocText{
      min-height:280px;
      border-radius:22px;
      border:1px solid rgba(255,255,255,.10);
      background:
        linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02)),
        repeating-linear-gradient(180deg, rgba(255,255,255,.025) 0 28px, rgba(255,255,255,.00) 28px 29px);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.05);
      padding:22px 22px 20px;
    }
    .notesDocText pre{
      margin:0;
      white-space:pre-wrap;
      font:15px/1.9 var(--ui);
      color:rgba(233,236,255,.92);
    }
    .adPanel{
      width:min(980px, calc(100% - 24px));
      margin:18px auto 6px;
      border-radius:24px;
      border:1px solid rgba(255,255,255,.14);
      background:
        linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03)),
        radial-gradient(circle at 100% 0, rgba(255,95,214,.10), transparent 32%),
        radial-gradient(circle at 0 0, rgba(79,215,255,.08), transparent 28%);
      box-shadow:0 22px 70px rgba(0,0,0,.34);
      overflow:hidden;
      transition:transform .14s ease, border-color .14s ease, box-shadow .14s ease;
    }
    .adPanel:hover{
      transform:translateY(-2px);
      border-color:rgba(255,255,255,.22);
      box-shadow:0 28px 90px rgba(0,0,0,.42);
    }
    .adPanel[hidden]{ display:none !important; }
    .adPanelHead{
      display:flex; justify-content:space-between; align-items:center; gap:12px;
      padding:14px 16px;
      border-bottom:1px solid rgba(255,255,255,.10);
      background:rgba(255,255,255,.04);
    }
    .adPanelTitle{
      font-family:var(--brand);
      letter-spacing:.12em;
      font-size:12px;
      color:rgba(233,236,255,.74);
      text-transform:uppercase;
    }
    .adPanelBadge{
      padding:5px 10px;
      border-radius:999px;
      border:1px solid rgba(255,255,255,.12);
      background:rgba(255,255,255,.05);
      font-size:11px;
      color:rgba(233,236,255,.62);
    }
    .adPanelBody{
      display:block;
      padding:16px;
      text-decoration:none;
      color:inherit;
    }
    .adPanelImageWrap{
      width:100%;
      border-radius:18px;
      border:1px solid rgba(255,255,255,.10);
      background:rgba(255,255,255,.04);
      overflow:hidden;
      display:grid;
      place-items:center;
      min-height:180px;
    }
    .adPanelImage{
      display:block;
      max-width:min(100%, 900px);
      max-height:420px;
      width:auto;
      height:auto;
      object-fit:contain;
    }
    .adPanelCaption{
      margin-top:14px;
    }
    .adPanelAdTitle{
      font-weight:900;
      font-size:18px;
      color:rgba(233,236,255,.95);
      margin-bottom:6px;
    }
    .adPanelAdText{
      color:rgba(233,236,255,.66);
      line-height:1.55;
      font-size:14px;
    }

    .virusToast{
      position:fixed; left:50%; top:84px; transform:translateX(-50%); z-index:12000;
      padding:12px 16px; border-radius:14px; border:1px solid rgba(255,255,255,.16);
      background:rgba(20,20,30,.88); backdrop-filter:blur(16px);
      box-shadow:0 20px 50px rgba(0,0,0,.45); font-weight:800; letter-spacing:.03em;
    }
    body.virus-infected{
      animation: virusJolt .10s steps(2,end) infinite;
      overflow-x:hidden;
    }
    body.virus-infected::before{
      content:""; position:fixed; inset:-2px; pointer-events:none; z-index:9998;
      background:
        repeating-linear-gradient(0deg, rgba(255,255,255,.08) 0 2px, rgba(0,0,0,0) 2px 5px),
        repeating-linear-gradient(90deg, rgba(255,0,64,.08) 0 3px, transparent 3px 44px, rgba(0,255,255,.07) 44px 47px, transparent 47px 100px),
        linear-gradient(90deg, rgba(255,0,80,.10), rgba(0,255,255,.08), rgba(255,255,255,.04));
      mix-blend-mode:screen; opacity:.95; animation: virusLines .09s linear infinite;
    }
    body.virus-infected::after{
      content:""; position:fixed; inset:-18px; pointer-events:none; z-index:9997;
      background:
        radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,.12) 60%, rgba(0,0,0,.36) 100%),
        linear-gradient(180deg, rgba(255,0,0,.05), transparent 20%, rgba(0,255,255,.04) 80%, rgba(255,255,255,.03));
      animation: virusFlash .45s steps(2,end) infinite;
    }
    body.virus-infected .card,
    body.virus-infected .topbarFixed,
    body.virus-infected .taskbar,
    body.virus-infected .panelCard,
    body.virus-infected .flyCard,
    body.virus-infected .extWindow{
      filter:saturate(1.35) contrast(1.14);
      animation: virusSkew .11s steps(2,end) infinite;
    }
    body.virus-infected .home,
    body.virus-infected .results{
      animation: virusJump .15s steps(2,end) infinite;
    }
    body.virus-infected .item,
    body.virus-infected .tile,
    body.virus-infected .tbIcon,
    body.virus-infected .adPanel,
    body.virus-infected .notesDoc{ position:relative; }
    body.virus-infected .item::after,
    body.virus-infected .tile::after,
    body.virus-infected .adPanel::after,
    body.virus-infected .notesDoc::after{
      content:""; position:absolute; inset:0; pointer-events:none;
      background:
        linear-gradient(90deg, transparent 0 14%, rgba(255,0,64,.14) 14% 20%, transparent 20% 42%, rgba(0,255,255,.13) 42% 48%, transparent 48% 73%, rgba(255,255,255,.08) 73% 78%, transparent 78% 100%);
      mix-blend-mode:screen;
      animation: virusSlice .20s linear infinite;
    }
    .tbIcon.antivirusThreat{ border-color:rgba(255,95,214,.38); background:rgba(255,95,214,.10); }
    .tbIcon.antivirusThreat.scanning{ border-color:rgba(79,215,255,.38); background:rgba(79,215,255,.10); }
    @keyframes virusSkew{
      0%{ transform:translate(0,0) skewX(0deg) scale(1);}
      15%{ transform:translate(4px,-2px) skewX(1.8deg) scale(1.002);}
      30%{ transform:translate(-6px,3px) skewX(-2.4deg) scale(.998);}
      45%{ transform:translate(3px,0) skewX(1.3deg) scale(1.004);}
      60%{ transform:translate(-2px,-3px) skewX(-1deg) scale(.996);}
      75%{ transform:translate(6px,2px) skewX(2.2deg) scale(1.003);}
      100%{ transform:translate(0,0) skewX(0deg) scale(1);}
    }
    @keyframes virusLines{ from{transform:translateY(0);} to{transform:translateY(9px);} }
    @keyframes virusFlash{ 0%,100%{opacity:.20;} 10%{opacity:.52;} 11%{opacity:.08;} 35%{opacity:.34;} 36%{opacity:.16;} 70%{opacity:.46;} }
    @keyframes virusJolt{
      0%,100%{filter:none;}
      20%{filter:hue-rotate(10deg) contrast(1.05);}
      50%{filter:hue-rotate(-8deg) contrast(1.12);}
      80%{filter:saturate(1.18);}
    }
    @keyframes virusJump{
      0%,100%{transform:translate(0,0);}
      33%{transform:translate(-3px,1px);}
      66%{transform:translate(4px,-2px);}
    }
    @keyframes virusSlice{
      0%{clip-path:inset(0 0 0 0);}
      50%{clip-path:inset(6% 0 12% 0);}
      100%{clip-path:inset(0 0 0 0);}
    }
  `;
  document.head.appendChild(style);
}

function showToast(message, timeout = 1800){
  ensureUiEnhancers();
  const old = document.getElementById("virusToast");
  if (old) old.remove();
  const toast = document.createElement("div");
  toast.id = "virusToast";
  toast.className = "virusToast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), timeout);
}


function getAdvertisingPool(){
  const data = Array.isArray(window.ADVERTISING_DATA) && window.ADVERTISING_DATA.length
    ? window.ADVERTISING_DATA
    : FALLBACK_ADVERTISING;
  return data
    .filter(Boolean)
    .map((ad, index) => ({
      id: ad.id ?? (index + 1),
      image: String(ad.image || `advertising/${index + 1}.png`),
      title: String(ad.title || `Реклама #${index + 1}`),
      caption: String(ad.caption || ""),
      url: String(ad.url || "#")
    }));
}

function ensureAdSection(){
  if (adSection && document.body.contains(adSection)) return adSection;
  const card = document.getElementById("app");
  if (!card) return null;

  adSection = document.createElement("section");
  adSection.id = "adPanel";
  adSection.className = "adPanel";
  adSection.innerHTML = `
    <div class="adPanelHead">
      <div class="adPanelTitle">Реклама</div>
      <div class="adPanelBadge">спонсорский блок</div>
    </div>
    <a class="adPanelBody" id="adPanelBody" href="#" target="_blank" rel="noopener noreferrer">
      <div class="adPanelImageWrap">
        <img class="adPanelImage" id="adPanelImage" alt="Реклама">
      </div>
      <div class="adPanelCaption">
        <div class="adPanelAdTitle" id="adPanelAdTitle">Реклама</div>
        <div class="adPanelAdText" id="adPanelAdText"></div>
      </div>
    </a>
  `;
  card.appendChild(adSection);
  adBody = adSection.querySelector("#adPanelBody");
  return adSection;
}

function renderRandomAd(force = false){
  ensureUiEnhancers();
  const panel = ensureAdSection();
  if (!panel) return;

  if (hasExt("adblock")){
    panel.hidden = true;
    return;
  }

  const pool = getAdvertisingPool();
  if (!pool.length){
    panel.hidden = true;
    return;
  }

  const ad = pool[Math.floor(Math.random() * pool.length)];
  panel.hidden = false;

  const body = panel.querySelector("#adPanelBody");
  const img = panel.querySelector("#adPanelImage");
  const title = panel.querySelector("#adPanelAdTitle");
  const text = panel.querySelector("#adPanelAdText");

  body.href = ad.url || "#";
  title.textContent = ad.title;
  text.textContent = ad.caption;
  img.src = ad.image;
  img.alt = ad.title;
}
function renderGladunNotes(){
  showResults();
  hideOfflineGame();
  hideError();
  if (special){ special.innerHTML = ""; special.hidden = true; }
  list.innerHTML = `
    <div class="internalPageWide">
      <div class="internalPageFlags">
        <span class="flag">Скрытая страница</span>
        <span class="flag">${INTERNAL_NOTES_URL}</span>
      </div>

      <article class="notesDoc">
        <div class="notesDocHead">
          <div>
            <div class="notesDocTitle">Заметки Гладуна</div>
            <div class="notesDocSub">Доступ получен через ручной ввод • документ только для чтения</div>
          </div>
          <div class="notesDocSeal">внутренний архив<br>Гладуна</div>
        </div>

        <div class="notesDocBody">
          <div class="notesDocText">
            <pre>${escapeHtml(DEFAULT_GLADUN_NOTES)}</pre>
          </div>
        </div>
      </article>
    </div>
  `;
  resultsTitle.textContent = "Уголок Гладуняки";
  resultsMeta.textContent = INTERNAL_NOTES_URL;
}

function ensureAntivirusButton(){
  if (!taskbar) return null;
  if (btnAntivirus && document.body.contains(btnAntivirus)) return btnAntivirus;
  btnAntivirus = document.createElement("button");
  btnAntivirus.type = "button";
  btnAntivirus.id = "tbAntivirus";
  btnAntivirus.className = "tbIcon antivirusThreat";
  btnAntivirus.innerHTML = `<span class="tbGlyph">⚠</span><span class="tbText">Антивирус зафиксировал угрозу</span>`;
  const right = taskbar.querySelector('.tbRight') || taskbar;
  right.prepend(btnAntivirus);
  btnAntivirus.addEventListener('click', startAntivirusScan);
  return btnAntivirus;
}

function updateVirusUi(){
  ensureUiEnhancers();
  const infected = isVirusInfected();
  document.body.classList.toggle('virus-infected', infected);
  if (!infected){
    btnAntivirus?.remove();
    btnAntivirus = null;
    stopAntivirusScan(false);
    return;
  }
  const btn = ensureAntivirusButton();
  if (!btn) return;
  const scanning = isVirusScanRunning();
  btn.classList.toggle('scanning', scanning);
  btn.querySelector('.tbGlyph').textContent = scanning ? '🛡' : '⚠';
  btn.querySelector('.tbText').textContent = scanning
    ? `Антивирус ищет угрозу: ${getVirusName()}`
    : 'Антивирус зафиксировал угрозу';
}

function stopAntivirusScan(clearState = true){
  if (virusScanInterval){
    clearInterval(virusScanInterval);
    virusScanInterval = null;
  }
  if (clearState) setVirusScanRunning(false);
}

function cureVirus(){
  stopAntivirusScan();
  setVirusInfected(false);
  setVirusName('');
  updateVirusUi();
  showToast('Угроза устранена. Интерфейс восстановлен.', 2400);
}

function startAntivirusScan(){
  if (!isVirusInfected()) return;
  if (virusScanInterval) return;
  setVirusScanRunning(true);
  updateVirusUi();
  showToast('Поиск угрозы запущен...', 1500);
  virusScanInterval = setInterval(() => {
    if (!isVirusInfected()){
      stopAntivirusScan();
      updateVirusUi();
      return;
    }
    if (Math.random() < 0.01){
      cureVirus();
      return;
    }
    const btn = ensureAntivirusButton();
    if (btn){
      btn.querySelector('.tbText').textContent = `Антивирус ищет угрозу: ${getVirusName()}`;
    }
  }, 1000);
}

function infectSystem(label){
  const clean = String(label || 'unknown').trim() || 'unknown';
  setVirusName(clean + '.exe');
  setVirusInfected(true);
  updateVirusUi();
  showToast('Установка...', 1200);
  if (virusInstallTimeout) clearTimeout(virusInstallTimeout);
  virusInstallTimeout = setTimeout(() => {
    showToast('Обнаружены артефакты интерфейса.', 1800);
  }, 1000);
}

function buildVirusBait(query){
  const label = String(query || 'unknown').trim() || 'unknown';
  return {
    title: label,
    description: 'Быстрая зеркальная копия страницы. Источник нестабилен, но отвечает быстрее обычного.',
    url: `https://${normalize(label).replace(/\s+/g,'-') || 'mirror'}.mirror.cache/launch`,
    isVirus: true
  };
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

function saveHistory(site){
  const arr = JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]");
  arr.unshift({
    title:site.title,
    url:site.url,
    time:Date.now()
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(0,50)));
}

function openSite(site){
  if (site?.internal === "notes"){
    renderGladunNotes();
    return;
  }
  if (site?.isVirus){
    pushRecent(site);
    const installing = document.createElement("div");
    installing.className = "virusToast";
    installing.id = "virusToastInstalling";
    installing.textContent = "Установка...";
    document.body.appendChild(installing);
    setTimeout(() => installing.remove(), 1200);
    setTimeout(() => infectSystem(site.title), 900);
    return;
  }
  if (hasExt("history")) saveHistory(site);
  pushRecent(site);
  window.open(site.url, "_blank", "noopener,noreferrer");
  saveHistory(site);
}

function showHome(){
  results.hidden = true;
  home.hidden = false;
  q.value = "";
  qHome.value = "";
  errbox.hidden = true;
  list.innerHTML = "";
  if (special){ special.innerHTML=""; special.hidden=true; }
  renderRandomAd(true);
  qHome?.focus();
}

function showResults(){
  home.hidden = true;
  results.hidden = false;
  const panel = ensureAdSection();
  if (panel) panel.hidden = true;
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

function findClosestSite(query){
  const q = normalize(query);
  if (!q) return null;

  let best = null;
  let bestScore = 0;

  for (const s of SITES){
    const title = normalize(s.title);
    let score = 0;

    if (title.startsWith(q)) score += 5;
    if (title.includes(q)) score += 3;

    for (let i = 0; i < q.length; i++){
      if (title.includes(q[i])) score += 1;
    }

    if (score > bestScore){
      bestScore = score;
      best = s;
    }
  }

  return bestScore >= 3 ? best : null;
}

function searchSites(query){
  const queryNorm = normalize(query);
  const tokens = tokenize(query);

  if (!queryNorm){
    return { error:"Пустой запрос. Гладун вас не понимает." };
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

  // ❌ ничего не найдено
  if (!items.length){
    showError("Совпадений нет.");

    // 🔎 пытаемся угадать
    const guess = findClosestSite(query);

    if (guess){
      const suggest = document.createElement("div");
      suggest.className = "suggestBox";

      suggest.innerHTML = `
        Возможно вы имели в виду:
        <span class="suggestLink">${escapeHtml(guess.title)}</span>
      `;

      suggest.querySelector(".suggestLink").addEventListener("click", () => {
        openSite(guess);
      });

      list.appendChild(suggest);
    }

    return;
  }

  // обычный вывод
  const frag = document.createDocumentFragment();
  for (const s of items){
    const a = document.createElement("a");
    a.className = `item${s.isVirus ? " virusItem" : ""}`;
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
      <div class="tileTitle">Лента пуста.</div>
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

// ===== History+ storage key (раздельно для GLADOON / SKIBIDINET) =====
const HISTORY_KEY = IS_SKIBI ? "skibi_history_v1" : "gladoon_history_v1";

function getHistory(){
  try{
    const raw = localStorage.getItem(HISTORY_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  }catch{
    return [];
  }
}

function setHistory(arr){
  localStorage.setItem(HISTORY_KEY, JSON.stringify(arr));
}

function saveHistory(site){
  const arr = getHistory();
  // уникальность по url
  const filtered = arr.filter(x => x.url !== site.url);
  filtered.unshift({
    title: site.title,
    url: site.url,
    time: Date.now()
  });
  setHistory(filtered.slice(0, 80));
}

function doSearch(query){

  // ===== HISTORY+ (локальная страница, должна работать даже без интернета) =====
  const qnEarly = normalize(query);
  if (qnEarly === "history" || qnEarly === "gladoon://history" || qnEarly === "skibidinet://history"){
    showResults();
    hideOfflineGame();
    if (special){ special.innerHTML=""; special.hidden=true; }
    list.innerHTML = "";
    hideError();

    if (!hasExt("history")){
      showError("History+ не установлено. Открой 🧩 Расширения и включи History+.");
      resultsTitle.textContent = "История";
      resultsMeta.textContent = "Расширение отключено";
      return;
    }

    const arr = getHistory();

    resultsTitle.textContent = "История";
    resultsMeta.textContent = arr.length
      ? `Записей: ${arr.length} • локально (${IS_SKIBI ? "SKIBIDINET" : "GLADOON"})`
      : `История пуста • локально (${IS_SKIBI ? "SKIBIDINET" : "GLADOON"})`;

    if (!arr.length){
      showError("История пуста. Открой пару сайтов — и они появятся здесь.");
      return;
    }

    const frag = document.createDocumentFragment();
    for (const h of arr){
      const a = document.createElement("a");
      a.className = "item";
      a.href = h.url;

      const time = new Date(h.time).toLocaleString();
      a.innerHTML = `
        <div class="itemTitle">${escapeHtml(h.title)}</div>
        <div class="itemUrl">${escapeHtml(h.url)}</div>
        <div class="itemDesc">${escapeHtml(time)}</div>
      `;

      a.addEventListener("click", (e) => {
        e.preventDefault();
        // в историю заново не пишем при открытии истории
        window.open(h.url, "_blank", "noopener,noreferrer");
      });

      frag.appendChild(a);
    }
    list.appendChild(frag);
    return;
  }

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

  if (qn === normalize(INTERNAL_NOTES_URL) || qn === normalize("заметки гладуна")) {
    renderGladunNotes();
    return;
  }

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

  const items = [...res.items];
  if (query.trim() && Math.random() < VIRUS_INSTALL_CHANCE){
    items.unshift(buildVirusBait(query));
  }

  renderResults(items, query, items.length);
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

function submitManualCode(){
  const raw = netManual.value.trim();
  const code = normalize(raw);
  if (!code){
    netManualHint.textContent = "Пусто. Введи хоть что-то.";
    return;
  }

  if (code === normalize(SECRET_NOTES_CODE)){
    netManualHint.textContent = "Код принят. Открываю внутренний архив...";
    netManual.value = "";
    closeNetPanel();
    renderGladunNotes();
    return;
  }

  netManualHint.textContent = `Код принят: ${code}. (ничего не произошло)`;
  netManual.value = "";
}

netManualBtn.addEventListener("click", submitManualCode);
netManual?.addEventListener("keydown", (e) => {
  if (e.key === "Enter"){
    e.preventDefault();
    submitManualCode();
  }
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
  ensureUiEnhancers();
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
  applyExtensions();
  updateVirusUi();
  if (isVirusScanRunning() && isVirusInfected()) startAntivirusScan();
})();

function findClosest(query){
  const q = normalize(query);
  let best = null;
  let bestScore = 0;

  for (const s of SITES){
    const name = normalize(s.title);

    let score = 0;

    if (name.startsWith(q)) score += 5;
    if (name.includes(q)) score += 3;

    // совпадение по буквам
    for (let i=0;i<q.length;i++){
      if (name.includes(q[i])) score += 1;
    }

    if (score > bestScore){
      bestScore = score;
      best = s;
    }
  }

  return bestScore > 2 ? best : null;
}

// ================= EXT PANEL =================
const btnExt = document.getElementById("btnExt");
const extWindow = document.getElementById("extWindow");
const extList = document.getElementById("extList");
const extClose = document.getElementById("extClose");

btnExt?.addEventListener("click", () => {
  extWindow.hidden = !extWindow.hidden;
  renderExtensions();
});

extClose?.addEventListener("click", () => {
  extWindow.hidden = true;
});

function renderExtensions(){
  const installed = getExtensions();

  const all = [
    {id:"theme", name:"Theme Switcher"},
    {id:"compact", name:"Compact Mode"},
    {id:"monitor", name:"Network Monitor"},
    {id:"history", name:"History+"},
    {id:"adblock", name:"Adblock"}
  ];

  extList.innerHTML = "";

  for(const e of all){
    const div = document.createElement("div");
    div.className = "extItem";

    const active = installed[e.id];

    div.innerHTML = `
  <span class="extName">${e.name}</span>
  <button data-state="${active ? "on" : "off"}">${active ? "Вкл" : "Выкл"}</button>
  `;

    div.querySelector("button").onclick = () => {
      active ? disableExt(e.id) : enableExt(e.id);
      renderExtensions();
    };

    extList.appendChild(div);
  }
}

function applyExtensions(){
  document.body.classList.toggle("ext-compact", hasExt("compact"));
  document.body.classList.toggle("theme-dark", hasExt("theme"));

  if(hasExt("monitor")) startMonitor();
  else stopMonitor();

  if (btnHistory) btnHistory.hidden = !hasExt("history");
  if (btnHistory && !btnHistory.dataset.boundHistory){
    btnHistory.dataset.boundHistory = "1";
    btnHistory.addEventListener("click", () => {
      doSearch("history");
    });
  }

  const panel = ensureAdSection();
  if (panel){
    panel.hidden = hasExt("adblock");
    if (!hasExt("adblock")) renderRandomAd();
  }
}

function startMonitor(){
  if (monitorInterval) return;

  let el = document.getElementById("netMon");
  if (!el){
    el = document.createElement("div");
    el.id = "netMon";
    document.body.appendChild(el);
  }

  // позиция СЛЕВА над taskbar
  el.style.position = "fixed";
  el.style.left = "16px";     // ← теперь слева
  el.style.bottom = "80px";   // ← над панелью задач
  el.style.zIndex = "9999";
  el.style.fontSize = "12px";
  el.style.padding = "6px 10px";
  el.style.borderRadius = "10px";
  el.style.background = "rgba(0,0,0,.6)";
  el.style.backdropFilter = "blur(6px)";
  el.style.border = "1px solid rgba(255,255,255,.15)";
  el.style.pointerEvents = "none";

  monitorInterval = setInterval(()=>{
    const ping = 20 + Math.floor(Math.random()*80);
    el.textContent = "Пинг: " + ping + "ms";
  }, 900);
}

function stopMonitor(){
  clearInterval(monitorInterval);
  monitorInterval = null;
  document.getElementById("netMon")?.remove();
}