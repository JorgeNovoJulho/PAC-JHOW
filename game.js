/* =========================================================================
 * PAC-JORGE — SR.BLACK EDITION  (Pac-Man / Móvel Studio)
 * -------------------------------------------------------------------------
 *  - 20 níveis, labirinto novo por nível, cores das paredes por nível
 *  - teletransporte nas laterais E no topo/fundo
 *  - 3 vidas por nível · continue / sair-e-guardar
 *  - 5 músicas vibrantes alternadas por nível (troca manual)
 *  - bombas: clique esquerdo / B — até 5 por nível; o fantasma que tocar
 *    explode e volta para a casa
 *  - fantasmas comidos pela pílula ficam na casa ATÉ o efeito acabar
 *  - até 3 frutas simultâneas a andar pelo labirinto (aparecem por turno)
 *  - 5 itens especiais no centro (5 s, +1000 ou bónus de tiros/bombas/vida)
 *  - tiro: clique direito / Espaço (5 por nível)
 * =========================================================================
 */
"use strict";

/* ------------------------------- Config -------------------------------- */
const TILE = 20;
const COLS = window.MAZE_COLS;   // 28
const ROWS = window.MAZE_ROWS_N; // 31
const MAX_LEVEL = 20;
const PAC_SPEED = 4.65;
const FRIGHT_SPEED = 1.9;
const EYES_SPEED = 6.6;
const TUNNEL_MULT = 0.55;
const EXTRA_LIFE_AT = 10000;
const FRUIT_VALUES = [100, 300, 500, 700, 1000, 2000, 3000, 5000];
const FRUIT_SPEED = 2.8;
const MAX_FRUITS = 3;
const FRUIT_SPAWN_EVERY = 6.5;
const FRUIT_TYPES = ["strawberry", "cherry", "apple"];
const FRUIT_BURSTS = { strawberry: "#ff6a9d", cherry: "#ff2f5e", apple: "#6fe08a" };
const SHOTS_PER_LEVEL = 5;
const SHOT_SPEED = 7.5;
const SHOT_RANGE = 9;
const BOMBS_PER_LEVEL = 5;
const SPRINT_PER_LEVEL = 5;
const SPRINT_TIME = 5;
const SPRINT_BONUS = 0.70;   // +70% de velocidade
const ITEM_TURN = 40;        // turno de 40 s entre itens especiais
const ITEM_LIFE = 5;         // componente de pulsar/visual do item
const MISSILE_PER_LEVEL = 2;
const MISSILE_TURN = 60;
const MONSTER_PER_LEVEL = 2;
const MONSTER_TURN = 60;
const MONSTER_FAST = 1.2;    // 20% mais rápido que a base dos fantasmas
const MONSTER_FRIGHT_SLOW = 0.5;

const GHOST_INFO = [
  { name: "Blinky", color: "#ff3b3b", glow: "#ff6a6a" },
  { name: "Pinky",  color: "#ff8fd5", glow: "#ffc0e8" },
  { name: "Inky",   color: "#38e0ff", glow: "#9df1ff" },
  { name: "Clyde",  color: "#ffab2e", glow: "#ffd488" }
];
const GHOST_SPEED_MULT = [1.0, 0.97, 0.94, 0.91];
const SCATTER_CORNERS = [
  { c: 25, r: 0 }, { c: 2, r: 0 }, { c: 25, r: 29 }, { c: 2, r: 29 }
];

/* Cores das paredes por nível */
const PALETTES = [
  { name: "Azul",   wall0: "#4b5fd4", wall1: "#2a3a9e", wall2: "#1d2870", glow: "rgba(120,180,255,0.95)", edge: "#a8ccff", bg: 0 },
  { name: "Lava",   wall0: "#ff8a3d", wall1: "#c24a2b", wall2: "#7a1f1f", glow: "rgba(255,150,90,0.92)",   edge: "#ffc07d", bg: 1 },
  { name: "Floresta", wall0: "#46d27a", wall1: "#23824f", wall2: "#164f33", glow: "rgba(90,230,150,0.92)", edge: "#9cffcd", bg: 2 },
  { name: "Roxo",   wall0: "#a95fe0", wall1: "#6b30a8", wall2: "#3d1c6b", glow: "rgba(190,120,255,0.92)", edge: "#e3c1ff", bg: 3 },
  { name: "Laranja", wall0: "#ffb03d", wall1: "#d16a1a", wall2: "#7a3a10", glow: "rgba(255,180,90,0.92)",  edge: "#ffd9a8", bg: 4 },
  { name: "Ciano",  wall0: "#35c8e0", wall1: "#1e7fa0", wall2: "#124a63", glow: "rgba(90,220,255,0.92)",  edge: "#aef2ff", bg: 5 },
  { name: "Rosa",   wall0: "#ff6ab0", wall1: "#c0276f", wall2: "#701340", glow: "rgba(255,130,190,0.92)", edge: "#ffc1de", bg: 6 },
  { name: "Vermelho", wall0: "#ff5b5b", wall1: "#bb2323", wall2: "#6e1010", glow: "rgba(255,120,120,0.92)", edge: "#ffb3b3", bg: 7 }
];
function paletteFor(level) { return PALETTES[((level - 1) % PALETTES.length + PALETTES.length) % PALETTES.length]; }

/* Itens especiais do centro */
const ITEM_TYPES = [
  { key: "gold",  label: "OURO",   color: "#ffd24a", effect: "points" },
  { key: "ruby",  label: "RUBI",   color: "#ff4d6d", effect: "points" },
  { key: "shots", label: "TIROS",  color: "#5fd4ff", effect: "shots" },
  { key: "bombs", label: "BOMBAS", color: "#b18cff", effect: "bombs" },
  { key: "life",  label: "VIDA",   color: "#7dffb0", effect: "life" }
];

function difficultyFor(level) {
  const L = Math.max(1, Math.min(level, MAX_LEVEL));
  return {
    gv: Math.min(4.3, 3.0 + (L - 1) * 0.07),
    fright: Math.max(5.0, 9.0 - (L - 1) * 0.25),
    release: [
      0,
      Math.max(1.2, 2.2 - (L - 1) * 0.06),
      Math.max(2.2, 4.0 - (L - 1) * 0.1),
      Math.max(3.4, 6.0 - (L - 1) * 0.14)
    ],
    sched: L <= 3 ? [[7, 20], [7, 20], [5, 20], [5, 20]] :
            L <= 6 ? [[5, 20], [5, 20], [3, 20], [3, 20]] :
            L <= 10 ? [[3, 20], [3, 20], [2, 20], [2, 20]] :
            L <= 14 ? [[2, 20], [2, 20], [1, 20], [1, 20]] :
                      [[1, 20], [1, 20], [1, 20], [1, 20]]
  };
}

/* ------------------------------- DOM/Canvas ---------------------------- */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const elScore = document.getElementById("score");
const elHigh = document.getElementById("highscore");
const elLives = document.getElementById("lives");
const elLevel = document.getElementById("level");
const elAmmo = document.getElementById("ammo");
const elBombs = document.getElementById("bombs");
const elSprint = document.getElementById("sprint");
const btnMute = document.getElementById("btn-mute");
const btnMusicPrev = document.getElementById("btn-music-prev");
const btnMusicNext = document.getElementById("btn-music-next");
const elMusicName = document.getElementById("music-name");

/* ------------------------------- Estado -------------------------------- */
const game = {
  state: "title",
  paused: false,
  level: 1,
  tunnelRowH: 14,
  score: 0,
  highscore: 0,
  lives: 3,
  combo: 0,
  dotsEaten: 0,
  dotsTotal: 0,
  extraLifeAt: EXTRA_LIFE_AT,
  frightT: 0,
  mode: "scatter",
  modePhase: 0,
  modeTimer: 0,
  globalTimer: 0,
  pacDesired: null,
  readyT: 0,
  clearT: 0,
  dyingT: 0,
  floating: [],
  particles: [],
  projectiles: [],
  ammo: SHOTS_PER_LEVEL,
  fireCd: 0,
  bombs: [],          // bombas no chão
  bombsLeft: BOMBS_PER_LEVEL,
  bombsMax: BOMBS_PER_LEVEL,
  sprintCharges: SPRINT_PER_LEVEL,
  sprintT: 0,
  fruits: [],         // até 3 frutas em simultâneo
  fruitsSpawned: 0,
  fruitSpawnT: 2,
  item: null,
  itemSpawnT: 8,
  missile: null,
  missileSpawnT: 35,
  missilesUsed: 0,
  monster: null,
  monsterSpawnT: 45,
  monstersUsed: 0,
  picLoaded: false,
  playerPic: null,
  speech: null,        // balão de fala do personagem
  deathFlashT: 0,      // pisca a foto em vermelho durante 2 s
  openCells: [],
  grid: null,
  wallCanvas: null
};

const pac = {
  x: 0, y: 0,
  dir: { x: 1, y: 0 },
  speed: PAC_SPEED,
  mouthT: 0,
  trail: [],
  onCenter() { tryTurnPacman(); }
};

const ghosts = [];
function makeGhost(id) {
  return {
    id,
    x: 0, y: 0,
    dir: { x: 0, y: -1 },
    state: "waiting",
    releaseTimer: 0,
    speed: 0,
    frightenedSpeed: FRIGHT_SPEED,
    holdFright: false,   // comido pela pílula: fica na casa até o efeito acabar
    bobT: id * 1.3,
    eyesT: 0,
    onCenter(c, r) { ghostOnCenter(this, c, r); }
  };
}
for (let i = 0; i < 4; i++) ghosts.push(makeGhost(i));

/* ------------------------------ Persistência ---------------------------- */
const HS_KEY = "movel-studio-pacman-highscores";
const SAVE_KEY = "movel-studio-pacman-save";
const NAME_KEY = "movel-studio-pacman-name";
const VOL_M_KEY = "movel-studio-pacman-vol-music";
const VOL_S_KEY = "movel-studio-pacman-vol-sfx";
const PHOTO_KEY = "pac-jhow-photo";
const MUSIC_KEY = "pac-jhow-custom-music";

function loadScores() {
  try { const s = JSON.parse(localStorage.getItem(HS_KEY)); return Array.isArray(s) ? s : []; }
  catch (e) { return []; }
}
function saveScores(list) { try { localStorage.setItem(HS_KEY, JSON.stringify(list.slice(0, 12))); } catch (e) {} }
function qualifiesForHs(score) {
  if (score <= 0) return false;
  const s = loadScores();
  if (s.length < 12) return true;
  return score > s[s.length - 1].score;
}
function addHighScore(name, score, level) {
  const s = loadScores();
  s.push({ name: name || "Jogador", score, level: level || 1, date: new Date().toISOString() });
  s.sort((a, b) => b.score - a.score);
  saveScores(s.slice(0, 12));
  return s.slice(0, 12);
}
function getLastName() { try { return localStorage.getItem(NAME_KEY) || ""; } catch (e) { return ""; } }
function setLastName(n) { try { localStorage.setItem(NAME_KEY, n); } catch (e) {} }
function loadState() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); return (s && s.level) ? { level: s.level, score: s.score || 0 } : null; }
  catch (e) { return null; }
}
function saveState() { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ level: game.level, score: game.score })); } catch (e) {} }
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

function renderHighScoreTables() {
  const s = loadScores();
  const render = (id) => {
    const box = document.getElementById(id);
    if (!box) return;
    if (s.length === 0) { box.innerHTML = `<div class="hs-empty">Ainda sem recordes. Sê o primeiro!</div>`; return; }
    box.innerHTML = s.slice(0, 8).map((e, i) =>
      `<div class="hs-row ${i === 0 ? "hs-first" : ""}">
         <span class="hs-pos">${i + 1}º</span>
         <span class="hs-name">${escapeHtml(e.name)}</span>
         <span class="hs-lvl">Nv ${e.level}</span>
         <span class="hs-score">${e.score.toLocaleString("pt-PT")}</span>
       </div>`).join("");
  };
  render("hs-table-title");
  render("hs-table-over");
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

/* ------------------------------- Utilidades ----------------------------- */
function opposite(a, b) { return a.x === -b.x && a.y === -b.y; }
function cellFromPos(x, y) { return { c: Math.floor(x), r: Math.floor(y) }; }
function dist(x1, y1, x2, y2) { return Math.hypot(x1 - x2, y1 - y2); }
function dirKey(d) { return (d.x || 0) + "," + (d.y || 0); }
function say(text, dur) { game.speech = { text: String(text), t: dur || 1.8, max: dur || 1.8 }; }

function hexToRgb(h) {
  const m = /^#?([a-f0-9]{6})$/i.exec(h || "");
  if (!m) return [255, 255, 255];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(h, a) {
  const [r, g, b] = hexToRgb(h);
  return "rgba(" + r + "," + g + "," + b + "," + a + ")";
}
function mixHex(h, t) {
  const [r, g, b] = hexToRgb(h);
  return "rgb(" + Math.round(r + (255 - r) * t) + "," + Math.round(g + (255 - g) * t) + "," + Math.round(b + (255 - b) * t) + ")";
}

/* ------------------------------ Sólida ---------------------------------- */
function isSolidCell(c, r, forGhost) {
  if (c < 0 || c >= COLS) {
    return r !== (game.tunnelRowH || 14);   // laterais: só no túnel horizontal
  }
  if (r < 0 || r >= ROWS) return !(c >= 12 && c <= 15); // vertical: só no corredor central
  const ch = game.grid[r][c];
  if (ch === "#") return true;
  if (ch === "-") return !forGhost;
  return false;
}

/* ---------------------------- Construção do nível ------------------------ */
function buildLevelGrid(level) {
  if (level === 1) return window.buildGrid();
  return window.buildGridFromRows(window.generateMaze(level + 70000));
}

function collectOpenCells(grid) {
  const out = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const ch = grid[r][c];
      if (ch === "#" || ch === "-") continue;
      if (c >= 11 && c <= 16 && r >= 13 && r <= 15) continue;
      out.push({ c, r });
    }
  }
  return out;
}

function initLevel(level) {
  game.level = Math.max(1, Math.min(level, MAX_LEVEL));
  elLevel.textContent = game.level;
  game.lives = 3;
  game.grid = buildLevelGrid(game.level);
  game.tunnelRowH = game.level === 1 ? window.CLASSIC_TUN : window.GEN_TUN;
  game.dotsEaten = 0;
  game.dotsTotal = window.countPelletsOnGrid(game.grid);
  game.combo = 0;
  game.frightT = 0;
  game.mode = "scatter";
  game.modePhase = 0;
  game.ammo = SHOTS_PER_LEVEL;
  game.bombsLeft = BOMBS_PER_LEVEL;
  game.bombsMax = BOMBS_PER_LEVEL;
  game.sprintCharges = SPRINT_PER_LEVEL;
  game.sprintT = 0;
  game.projectiles = [];
  game.bombs = [];
  game.fruits = [];
  game.fruitsSpawned = 0;
  game.fruitSpawnT = 2;
  game.item = null;
  game.itemSpawnT = 8;
  game.missile = null;
  game.missileSpawnT = 35;
  game.missilesUsed = 0;
  game.monster = null;
  game.monsterSpawnT = 30 + Math.random() * 30;   // monstro só surge entre 30 e 60 s
  game.monstersUsed = 0;
  game.openCells = collectOpenCells(game.grid);
  buildEyeField();
  const diff = difficultyFor(game.level);
  game.modeTimer = diff.sched[0][0];
  game.wallCanvas = renderWallCanvas();
  game.pacDesired = null;

  updateLives();
  updateAmmo();
  updateBombs();
  updateSprint();
  if (!customMusicActive) AudioSys.playTrack((game.level - 1) % 5);
  syncMusicUI();
  enterReady(diff);
}

function placeEntities(diff) {
  pac.x = window.PACMAN_START.x; pac.y = window.PACMAN_START.y;
  pac.dir = { x: 1, y: 0 };
  pac.speed = PAC_SPEED;
  pac.mouthT = 0;
  pac.trail = [];
  game.pacDesired = null;
  const spawns = window.GHOST_SPAWNS;
  for (let i = 0; i < ghosts.length; i++) {
    const g = ghosts[i];
    g.x = spawns[i].c + 0.5; g.y = spawns[i].r + 0.5;
    g.dir = { x: 0, y: -1 };
    g.state = "waiting";
    g.releaseTimer = diff.release[i];
    g.holdFright = false;
    g.respawned = false;
    g.eyesT = 0;
    g.bobT = i * 1.3;
  }
}

function enterReady(diff) {
  placeEntities(diff);
  game.readyT = 1.5;
  game.state = "ready";
  AudioSys.sfx.levelStart();
  syncMusicUI();
}

/* ------------------------------ Paredes (paletas) ------------------------ */
function rrPath(x, y, w, h, r, p) {
  r = Math.min(r, w / 2, h / 2);
  p.moveTo(x + r, y);
  p.arcTo(x + w, y, x + w, y + h, r);
  p.arcTo(x + w, y + h, x, y + h, r);
  p.arcTo(x, y + h, x, y, r);
  p.arcTo(x, y, x + w, y, r);
  p.closePath();
}

function renderWallCanvas() {
  const cv = document.createElement("canvas");
  cv.width = COLS * TILE; cv.height = ROWS * TILE;
  const x = cv.getContext("2d");
  const P = paletteFor(game.level);
  const solidDraw = (c, r) => (c >= 0 && c < COLS && r >= 0 && r < ROWS) && isSolidCell(c, r, true);

  const floor = x.createLinearGradient(0, 0, 0, cv.height);
  floor.addColorStop(0, "#0a0f33");
  floor.addColorStop(0.5, "#0d0e3c");
  floor.addColorStop(1, "#170f49");
  x.fillStyle = floor;
  x.fillRect(0, 0, cv.width, cv.height);

  const nebula = [
    { cx: 0.18, cy: 0.25, r: 0.32, c: "rgba(64,110,255,0.16)" },
    { cx: 0.85, cy: 0.2, r: 0.28, c: "rgba(180,70,255,0.13)" },
    { cx: 0.72, cy: 0.85, r: 0.34, c: "rgba(40,200,255,0.10)" },
    { cx: 0.15, cy: 0.8, r: 0.3, c: "rgba(255,120,180,0.10)" }
  ];
  for (const nb of nebula) {
    const g = x.createRadialGradient(nb.cx * cv.width, nb.cy * cv.height, 0, nb.cx * cv.width, nb.cy * cv.height, nb.r * cv.height);
    g.addColorStop(0, nb.c);
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, cv.width, cv.height);
  }
  let ss = 777;
  for (let i = 0; i < 150; i++) {
    ss = (ss * 16807) % 2147483647; const px = ss % cv.width;
    ss = (ss * 16807) % 2147483647; const py = ss % cv.height;
    ss = (ss * 16807) % 2147483647; const size = 0.7 + ((ss % 30) / 30) * 1.6;
    ss = (ss * 16807) % 2147483647; const a = 0.04 + ((ss % 70) / 70) * 0.16;
    x.fillStyle = "rgba(200,215,255," + a.toFixed(3) + ")";
    x.beginPath(); x.arc(px, py, size, 0, Math.PI * 2); x.fill();
  }

  /* sombras dos blocos */
  x.fillStyle = "rgba(0,0,22,0.42)";
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!isSolidCell(c, r, true)) continue;
      rrPath(c * TILE + 1.5, r * TILE + 3, TILE - 3, TILE - 2, 5, x);
      x.fill();
    }
  }

  /* blocos cor de paleta */
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!isSolidCell(c, r, true)) continue;
      const px = c * TILE, py = r * TILE;
      const grad = x.createLinearGradient(0, py, 0, py + TILE);
      grad.addColorStop(0, P.wall0);
      grad.addColorStop(0.5, P.wall1);
      grad.addColorStop(1, P.wall2);
      x.fillStyle = grad;
      rrPath(px + 1.5, py + 1, TILE - 3, TILE - 2, 5, x);
      x.fill();
      const sheen = x.createLinearGradient(0, py + 1, 0, py + TILE * 0.5);
      sheen.addColorStop(0, "rgba(255,255,255,0.30)");
      sheen.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = sheen;
      rrPath(px + 1.5, py + 1, TILE - 3, TILE * 0.5 - 1, 5, x);
      x.fill();
      x.fillStyle = "rgba(0,0,40,0.15)";
      x.fillRect(px + 1.5, py + TILE - 4, TILE - 3, 2);
    }
  }

  /* faces laterais das paredes (profundidade 3D) */
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!isSolidCell(c, r, true) || solidDraw(c, r + 1)) continue;
      const px = c * TILE, py = r * TILE;
      const front = x.createLinearGradient(0, py + TILE - 2, 0, py + TILE + 8);
      front.addColorStop(0, "rgba(6,8,26,0.55)");
      front.addColorStop(1, "rgba(6,8,26,0)");
      x.fillStyle = front;
      x.fillRect(px + 1.5, py + TILE - 2, TILE - 3, 9);
      // sombra refletida no chão por baixo do bloco
      x.fillStyle = "rgba(30,120,255,0.10)";
      x.fillRect(px + 1.5, py + TILE + 3, TILE - 3, 3);
    }
  }

  /* contorno néon */
  x.lineCap = "round";
  x.strokeStyle = P.edge;
  x.lineWidth = 2.6;
  x.shadowColor = P.glow;
  x.shadowBlur = 11;
  x.beginPath();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!isSolidCell(c, r, true)) continue;
      const px = c * TILE, py = r * TILE;
      const edges = [
        { open: !solidDraw(c, r - 1), dy: 0, hor: true },
        { open: !solidDraw(c, r + 1), dy: TILE, hor: true },
        { open: !solidDraw(c - 1, r), dx: 0, hor: false },
        { open: !solidDraw(c + 1, r), dx: TILE, hor: false }
      ];
      for (const e of edges) {
        if (!e.open) continue;
        const a = e.hor ? "x" : "y";
        const x1 = px + (a === "x" ? (e.dx || 0) + 5.5 : 4.5);
        const y1 = py + (a === "y" ? (e.dy || 0) + 5.5 : 4.5);
        const x2 = px + (a === "x" ? (e.dx || 0) + TILE - 5.5 : 4.5);
        const y2 = py + (a === "y" ? (e.dy || 0) + TILE - 5.5 : 4.5);
        x.moveTo(x1, y1); x.lineTo(x2, y2);
      }
    }
  }
  x.stroke();
  x.shadowBlur = 0;

  const v = x.createRadialGradient(cv.width / 2, cv.height / 2, cv.height * 0.3, cv.width / 2, cv.height / 2, cv.height * 0.85);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(2,3,18,0.62)");
  x.fillStyle = v;
  x.fillRect(0, 0, cv.width, cv.height);

  return cv;
}

/* ------------------------------ Movimento ------------------------------- */
function moveEntity(e, dt, forGhost) {
  let step = e.speed * dt;
  const d = e.dir;
  if ((d.x === 0 && d.y === 0) || step <= 0) return;
  let guard = 0;
  let decided = false;
  while (step > 1e-6 && guard++ < 20) {
    const axis = d.x !== 0 ? "x" : "y";
    const sign = d[axis] > 0 ? 1 : -1;
    const other = axis === "x" ? "y" : "x";
    const lead = e[axis] + sign * 0.5;
    const leadCell = Math.floor(lead);
    const otherCoord = Math.floor(e[other]);
    const col = axis === "x" ? leadCell : otherCoord;
    const row = axis === "x" ? otherCoord : leadCell;
    if (isSolidCell(col, row, forGhost)) {
      e[axis] = (sign > 0) ? leadCell - 0.5 : leadCell + 1.5;
      e[other] = Math.round(e[other] * 2) / 2;
      step = 0;
      // bateu na parede: está no centro da célula → escolhe novo caminho
      decided = true;
      if (e.onCenter) {
        const cc = Math.round(e.x - 0.5);
        const rr = Math.round(e.y - 0.5);
        e.onCenter(cc, rr);
      }
      break;
    }
    const nextCenter = sign > 0
      ? Math.floor(e[axis] + 0.5) + 0.5
      : Math.ceil(e[axis] - 0.5) - 0.5;
    const toC = Math.abs(nextCenter - e[axis]);
    const move = Math.min(step, toC);
    e[axis] += sign * move;
    step -= move;
    if (Math.abs(e[axis] - nextCenter) < 1e-6) {
      e[axis] = nextCenter;
      e[other] = Math.round(e[other] * 2) / 2;
      const c = Math.round(e.x - 0.5);
      const r = Math.round(e.y - 0.5);
      if (e.onCenter) { e.onCenter(c, r); decided = true; }
    }
  }
  if (!decided) {
    const kx = Math.round(e.x - 0.5);
    const ky = Math.round(e.y - 0.5);
    if (Math.abs(e.x - (kx + 0.5)) < 1e-6 && Math.abs(e.y - (ky + 0.5)) < 1e-6) {
      if (e.onCenter) e.onCenter(kx, ky);
    }
  }
  wrapEntity(e, forGhost);
}

/* Teletransportes: laterais (túnel) e topo/fundo (corredor central) */
function wrapEntity(e) {
  const col = Math.round(e.x - 0.5);
  const row = Math.round(e.y - 0.5);
  if (e.x <= 0) {
    if (!isSolidCell(COLS - 1, row, false)) e.x += COLS; else e.x = 0.5;
  } else if (e.x >= COLS) {
    if (!isSolidCell(0, row, false)) e.x -= COLS; else e.x = COLS - 0.5;
  }
  if (e.y <= 0) {
    if (col >= 12 && col <= 15) e.y += ROWS; else e.y = 0.5;
  } else if (e.y >= ROWS) {
    if (col >= 12 && col <= 15) e.y -= ROWS; else e.y = ROWS - 0.5;
  }
}

/* ------------------------------ Pac-Man -------------------------------- */
function tryTurnPacman() {
  const des = game.pacDesired;
  if (!des) return;
  if (opposite(pac.dir, des)) { pac.dir = { ...des }; return; }
  if (dirKey(pac.dir) === dirKey(des)) return;
  const cx = Math.round(pac.x - 0.5);
  const cy = Math.round(pac.y - 0.5);
  if (Math.abs(pac.x - (cx + 0.5)) < 0.11 && Math.abs(pac.y - (cy + 0.5)) < 0.11) {
    if (!isSolidCell(cx + des.x, cy + des.y, false)) {
      pac.dir = { ...des };
      pac.x = cx + 0.5;
      pac.y = cy + 0.5;
    }
  }
}

function eatPelletAt() {
  const c = Math.floor(pac.x), r = Math.floor(pac.y);
  if (!game.grid[r]) return;
  const ch = game.grid[r][c];
  if (ch === ".") {
    game.grid[r][c] = " ";
    addScore(10);
    game.dotsEaten++;
    AudioSys.sfx.waka(Math.floor(pac.mouthT * 10) % 2 === 0);
  } else if (ch === "o") {
    game.grid[r][c] = " ";
    addScore(50);
    game.dotsEaten++;
    activateFright();
    say("Sai correndo...");
    fam("powerUp");
    spawnBurst(c + 0.5, r + 0.5, "#ffd24a", 14, 3.2);
  }
}

/* ------------------------------ FRUTAS (≥3 em turnos) --------------------- */
function makeFruit() {
  return {
    x: 0, y: 0,
    dir: { x: 1, y: 0 },
    speed: FRUIT_SPEED,
    type: FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)],
    walkT: Math.random() * 6,
    onCenter(c, r) { chooseFruitDir(this, c, r); }
  };
}
function chooseFruitDir(f, c, r) {
  const cands = [{ x: 0, y: -1 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }]
    .filter((d) => !opposite(d, f.dir));
  const open = cands.filter((d) => !isSolidCell(c + d.x, r + d.y, false));
  f.dir = open.length ? open[Math.floor(Math.random() * open.length)] : { x: -f.dir.x, y: -f.dir.y };
}
function pickOpenCellFar() {
  let cell = null;
  for (let tries = 0; tries < 30 && !cell; tries++) {
    const i = Math.floor(Math.random() * game.openCells.length);
    const cc = game.openCells[i];
    if (dist(cc.c + 0.5, cc.r + 0.5, pac.x, pac.y) > 4) cell = cc;
  }
  return cell || game.openCells[Math.floor(Math.random() * game.openCells.length)];
}
function spawnFruit() {
  if (game.fruitsSpawned >= MAX_FRUITS) return;   // neste nível, as comidas não voltam
  if (game.fruits.length >= MAX_FRUITS) return;
  const cell = pickOpenCellFar();
  const f = makeFruit();
  f.x = cell.c + 0.5; f.y = cell.r + 0.5;
  const opts = [];
  if (!isSolidCell(cell.c + 1, cell.r, false)) opts.push({ x: 1, y: 0 });
  if (!isSolidCell(cell.c - 1, cell.r, false)) opts.push({ x: -1, y: 0 });
  if (!isSolidCell(cell.c, cell.r + 1, false)) opts.push({ x: 0, y: 1 });
  if (!isSolidCell(cell.c, cell.r - 1, false)) opts.push({ x: 0, y: -1 });
  f.dir = opts.length ? opts[Math.floor(Math.random() * opts.length)] : { x: 1, y: 0 };
  game.fruits.push(f);
  game.fruitsSpawned++;
  AudioSys.sfx.fruitTick();
}
function eatFruit(f) {
  const idx = game.fruits.indexOf(f);
  if (idx >= 0) game.fruits.splice(idx, 1);
  const v = FRUIT_VALUES[Math.min(game.level - 1, FRUIT_VALUES.length - 1)];
  addScore(v);
  fam("eatFruit");
  say("Delicia...");
  addFloating(f.x, f.y, "+" + v, "#8dffc2");
  spawnBurst(f.x, f.y, FRUIT_BURSTS[f.type] || "#ff6a9d", 16, 3.4);
}
function updateFruits(dt) {
  // aparecer por turnos, até 3
  game.fruitSpawnT -= dt;
  if (game.fruitSpawnT <= 0) {
    if (game.fruits.length < MAX_FRUITS) spawnFruit();
    game.fruitSpawnT = FRUIT_SPAWN_EVERY;
  }
  for (let i = game.fruits.length - 1; i >= 0; i--) {
    const f = game.fruits[i];
    f.walkT += dt;
    f.speed = FRUIT_SPEED;
    moveEntity(f, dt, false);
    if (dist(pac.x, pac.y, f.x, f.y) < 0.58) eatFruit(f);
  }
}

/* ------------------------------ ITENS ESPECIAIS -------------------------- */
function centerOpenCell() {
  const cx = Math.floor(COLS / 2), cy = 15;
  for (let d = 0; d < 22; d++) {
    for (let dc = -d; dc <= d; dc++) {
      for (let dr = -d; dr <= d; dr++) {
        const c = cx + dc, r = cy + dr;
        if (c < 1 || c > COLS - 2 || r < 1 || r > ROWS - 2) continue;
        if (c >= 11 && c <= 16 && r >= 13 && r <= 15) continue;
        if (!isSolidCell(c, r, false)) return { c, r };
      }
    }
  }
  return { c: cx, r: 15 };
}
function spawnItem() {
  const cc = centerOpenCell();
  const type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
  game.item = {
    typeKey: type.key,
    label: type.label,
    color: type.color,
    effect: type.effect,
    x: cc.c + 0.5, y: cc.r + 0.5,
    t: ITEM_LIFE
  };
}
function collectItem() {
  const it = game.item;
  game.item = null;
  const color = it.color;
  if (it.effect === "points") {
    addScore(1000);
    boostSprint();                      // item de 1000 também recompensa a corrida
    addFloating(it.x, it.y, "+1000", color);
    if (it.typeKey === "ruby") fam("itemRuby"); else fam("itemGold");
    spawnBurst(it.x, it.y, color, 20, 3.6);
  } else if (it.effect === "shots") {
    if (game.ammo < SHOTS_PER_LEVEL) game.ammo = SHOTS_PER_LEVEL;
    else game.ammo = Math.min(8, game.ammo + 3);
    updateAmmo();
    addFloating(it.x, it.y, "TIROS +", color);
    fam("itemShots");
    spawnBurst(it.x, it.y, color, 16, 3.2);
  } else if (it.typeKey === "bombs") {
    if (game.bombsLeft < game.bombsMax) game.bombsLeft = game.bombsMax;
    else game.bombsLeft = Math.min(8, game.bombsLeft + 3);
    updateBombs();
    addFloating(it.x, it.y, "BOMBAS +", color);
    fam("itemBombs");
    spawnBurst(it.x, it.y, color, 16, 3.2);
  } else if (it.typeKey === "life") {
    game.lives++;
    updateLives();
    addFloating(it.x, it.y, "VIDA +1", color);
    fam("itemLife");
    spawnBurst(it.x, it.y, color, 20, 3.4);
  }
}
function updateItem(dt) {
  if (game.item) {
    // fica até ser comido
    if (dist(pac.x, pac.y, game.item.x, game.item.y) < 0.62) collectItem();
  } else {
    game.itemSpawnT -= dt;
    if (game.itemSpawnT <= 0) {
      spawnItem();
      game.itemSpawnT = ITEM_TURN;   // novo turno a cada 40 s
    }
  }
}

/* ------------------------------ MÍSSIL ---------------------------------- */
function missileInitialDir(cell) {
  const opts = [];
  if (!isSolidCell(cell.c + 1, cell.r, false)) opts.push({ x: 1, y: 0 });
  if (!isSolidCell(cell.c - 1, cell.r, false)) opts.push({ x: -1, y: 0 });
  if (!isSolidCell(cell.c, cell.r + 1, false)) opts.push({ x: 0, y: 1 });
  if (!isSolidCell(cell.c, cell.r - 1, false)) opts.push({ x: 0, y: -1 });
  return opts.length ? opts[Math.floor(Math.random() * opts.length)] : { x: 1, y: 0 };
}
function spawnMissile() {
  if (game.missilesUsed >= MISSILE_PER_LEVEL || game.missile) return;
  const cell = pickOpenCellFar();
  game.missile = {
    x: cell.c + 0.5, y: cell.r + 0.5,
    dir: missileInitialDir(cell), speed: 5.4, walkT: Math.random() * 6,
    onCenter(c, r) { chooseFruitDir(game.missile, c, r); }
  };
  game.missilesUsed++;
  fam("missile");
  addFloating(cell.c + 0.5, cell.r + 0.5, "MÍSSIL!", "#9fd8ff");
}
function collectDots(n) {
  const cells = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (game.grid[r][c] === ".") cells.push([c, r]);
  for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = cells[i]; cells[i] = cells[j]; cells[j] = t; }
  const take = Math.min(n, cells.length);
  let pts = 0;
  for (let k = 0; k < take; k++) { const [c, r] = cells[k]; game.grid[r][c] = " "; game.dotsEaten++; pts += 10; }
  if (pts > 0) { addScore(pts); addFloating(pac.x, pac.y, "25% +" + pts, "#8dffc2"); }
}
function eatMissile() {
  const m = game.missile;
  game.missile = null;
  spawnBurst(m.x, m.y, "#9fd8ff", 30, 4.2);
  fam("missileBoom");
  say("Hi Hi vantagem");
  addFloating(m.x, m.y, "MÍSSIL!", "#9fd8ff");
  // mata TODOS os fantasmas não mortos
  for (const g of ghosts) {
    if (g.state !== "active" && g.state !== "fright" && g.state !== "leaving") continue;
    g.state = "eyes";
    g.speed = EYES_SPEED;
    g.eyesT = 0;
  }
  // recolhe frutas, item atual e bombas do chão
  while (game.fruits.length) eatFruit(game.fruits[0]);
  if (game.item) collectItem();
  if (game.bombs.length) { addScore(game.bombs.length * 100); game.bombs = []; }
  // recolhe 25% dos pontos que ainda existem
  collectDots(Math.round((game.dotsTotal - game.dotsEaten) * 0.25));
  if (game.state === "play") checkLevelClear();
}
function updateMissile(dt) {
  if (game.missile) {
    const m = game.missile;
    m.walkT += dt;
    m.speed = 5.4;
    moveEntity(m, dt, false);
    // o míssil mata fantasmas e o monstro que encontrar no caminho (metade dos pontos)
    for (const g of ghosts) {
      if (g.state !== "active" && g.state !== "fright" && g.state !== "leaving") continue;
      if (dist(m.x, m.y, g.x, g.y) < 0.72) {
        spawnBurst(g.x, g.y, "#9fd8ff", 20, 3.8);
        addScore(100);
        addFloating(g.x, g.y, 100, "#bfe9ff");
        g.state = "eyes";
        g.speed = EYES_SPEED;
        g.eyesT = 0;
        fam("eatGhost");
      }
    }
    if (game.monster && dist(m.x, m.y, game.monster.x, game.monster.y) < 0.72) {
      spawnBurst(game.monster.x, game.monster.y, "#ff5470", 22, 4);
      killMonster(100);
    }
    if (dist(pac.x, pac.y, m.x, m.y) < 0.6) eatMissile();
  } else {
    game.missileSpawnT -= dt;
    if (game.missileSpawnT <= 0 && game.missilesUsed < MISSILE_PER_LEVEL) { spawnMissile(); game.missileSpawnT = MISSILE_TURN; }
  }
}

/* ------------------------------ MONSTRO --------------------------------- */
function chooseMonsterDir(m, c, r) {
  const cands = [{ x: 0, y: -1 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }].filter((d) => !opposite(d, m.dir));
  const open = cands.filter((d) => !isSolidCell(c + d.x, r + d.y, true));
  const pool = open.length ? open : [{ x: -m.dir.x, y: -m.dir.y }];
  const t = cellFromPos(pac.x, pac.y);
  if (game.frightT > 0) {
    // foge do Pac-Man: escolhe o caminho que mais se afasta
    let best = pool[0], bs = -Infinity;
    for (const d of pool) {
      const dc = (c + d.x) - t.c, dr = (r + d.y) - t.r;
      const sc = dc * dc + dr * dr;
      if (sc > bs) { best = d; bs = sc; }
    }
    m.dir = best;
    return;
  }
  const PRIO = { "0,-1": 0, "-1,0": 1, "0,1": 2, "1,0": 3 };
  let best = pool[0], bs = Infinity, bp = Infinity;
  for (const d of pool) {
    const dc = (c + d.x) - t.c, dr = (r + d.y) - t.r;
    const sc = Math.abs(dc) + Math.abs(dr);
    const pr = PRIO[dirKey(d)] !== undefined ? PRIO[dirKey(d)] : 99;
    if (sc < bs || (sc === bs && pr < bp)) { best = d; bs = sc; bp = pr; }
  }
  m.dir = best;
}
function monsterSpeedFor() {
  let s = difficultyFor(game.level).gv * MONSTER_FAST; // +20% sobre a base
  if (game.frightT > 0) s *= MONSTER_FRIGHT_SLOW;      // -50% com efeito da pílula
  return s;
}
function spawnMonster() {
  if (game.monstersUsed >= MONSTER_PER_LEVEL || game.monster) return;
  const cell = pickOpenCellFar();
  game.monster = {
    x: cell.c + 0.5, y: cell.r + 0.5,
    dir: missileInitialDir(cell), speed: 0, walkT: 0,
    onCenter(c, r) { chooseMonsterDir(game.monster, c, r); }
  };
  game.monstersUsed++;
  AudioSys.sfx.monster();
  spawnBurst(cell.c + 0.5, cell.r + 0.5, "#ff5470", 16, 3);
  addFloating(cell.c + 0.5, cell.r + 0.5, "⚠ MONSTRO!", "#ff5470");
}
function killMonster(points) {
  const m = game.monster;
  if (!m) return;
  const pts = points || 200;
  game.monster = null;
  addScore(pts);
  spawnBurst(m.x, m.y, "#ff5470", 26, 4.2);
  spawnBurst(m.x, m.y, "#ffd24a", 14, 3);
  addFloating(m.x, m.y, pts, "#ffa7b8");
  fam("monsterKilled");
}
function restoreDots() {
  const need = game.dotsEaten;
  if (need <= 0) return;
  const cells = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (game.grid[r][c] !== " ") continue;
    if (c >= 11 && c <= 16 && r >= 13 && r <= 15) continue;
    cells.push([c, r]);
  }
  for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = cells[i]; cells[i] = cells[j]; cells[j] = t; }
  const take = Math.min(need, cells.length);
  for (let k = 0; k < take; k++) { const [c, r] = cells[k]; game.grid[r][c] = "."; }
  game.dotsEaten -= take;
  if (take > 0) addFloating(pac.x, pac.y, "PONTOS RESTAURADOS", "#ffa7b8");
}
function monsterEatPacman() {
  if (game.state !== "play") return;
  AudioSys.sfx.monsterBite();   // o som do monstro mantém-se (assustador)
  // penalidade: perde 20% da pontuação e os pontinhos comidos voltam
  game.score = Math.max(0, Math.floor(game.score * 0.8));
  elScore.textContent = game.score.toLocaleString("pt-PT");
  restoreDots();
  killPacman("monster");
}
function updateMonster(dt) {
  if (!game.monster) {
    game.monsterSpawnT -= dt;
    if (game.monsterSpawnT <= 0 && game.monstersUsed < MONSTER_PER_LEVEL) { spawnMonster(); game.monsterSpawnT = MONSTER_TURN; }
    return;
  }
  const m = game.monster;
  m.walkT += dt;
  m.speed = monsterSpeedFor();
  const row = Math.round(m.y - 0.5);
  if (row === game.tunnelRowH) m.speed *= TUNNEL_MULT;
  moveEntity(m, dt, true);
  if (dist(pac.x, pac.y, m.x, m.y) < 0.62) {
    if (game.frightT > 0) killMonster();
    else monsterEatPacman();
  }
}

/* ------------------------------ BOMBAS ---------------------------------- */
function placeBomb() {
  if (game.state !== "play") return;
  if (game.bombsLeft <= 0) { say("Sem munição, reload"); return; }
  const cell = cellFromPos(pac.x, pac.y);
  game.bombs.push({ x: cell.c + 0.5, y: cell.r + 0.5, t: Math.random() * 6 });
  game.bombsLeft--;
  updateBombs();
  fam("place");
  say("Explode tonto...");
  spawnBurst(cell.c + 0.5, cell.r + 0.5, "#b18cff", 8, 2.4);
}
function updateBombs2(dt) {
  for (let i = game.bombs.length - 1; i >= 0; i--) {
    const b = game.bombs[i];
    b.t += dt;
    let boom = false;
    for (const g of ghosts) {
      if (g.state !== "active" && g.state !== "fright" && g.state !== "leaving") continue;
      if (dist(b.x, b.y, g.x, g.y) < 0.6) {
        game.bombs.splice(i, 1);
        spawnBurst(b.x, b.y, "#ff9d3d", 30, 4.5);
        spawnBurst(b.x, b.y, "#fff0b0", 14, 3);
        fam("bomb");
        g.state = "eyes";
        g.speed = EYES_SPEED;
        g.eyesT = 0;
        addScore(100);
        addFloating(g.x, g.y, 100, "#ffd9a8");
        boom = true;
        break;
      }
    }
    // explosão também atinge o monstro
    if (!boom && game.monster && dist(b.x, b.y, game.monster.x, game.monster.y) < 0.6) {
      game.bombs.splice(i, 1);
      spawnBurst(b.x, b.y, "#ff9d3d", 30, 4.5);
      spawnBurst(b.x, b.y, "#fff0b0", 14, 3);
      fam("bomb");
      killMonster();
    }
  }
}
function updateAmmo() {
  if (!elAmmo) return;
  const slots = Math.min(8, Math.max(SHOTS_PER_LEVEL, game.ammo));
  const used = slots - game.ammo;
  let html = "";
  for (let i = 0; i < slots; i++) html += '<span class="ammo' + (i < used ? " used" : "") + '">●</span>';
  elAmmo.innerHTML = html;
}
function updateBombs() {
  if (!elBombs) return;
  const slots = Math.min(8, Math.max(BOMBS_PER_LEVEL, game.bombsLeft));
  const used = slots - game.bombsLeft;
  let html = "";
  for (let i = 0; i < slots; i++) html += '<span class="ammo bomb' + (i < used ? " used" : "") + '">●</span>';
  elBombs.innerHTML = html;
}

/* ------------------------------ CORRIDA (sprint) ------------------------- */
function updateSprint() {
  if (!elSprint) return;
  const slots = Math.min(8, Math.max(SPRINT_PER_LEVEL, game.sprintCharges));
  const used = slots - game.sprintCharges;
  let html = "";
  for (let i = 0; i < slots; i++) html += '<span class="ammo sprint' + (i < used ? " used" : "") + '">●</span>';
  elSprint.innerHTML = html;
}
function activateSprint() {
  if (game.state !== "play") return;
  if (game.sprintT > 0) return;          // já em corrida
  if (game.sprintCharges <= 0) return;   // sem cargas
  game.sprintCharges--;
  game.sprintT = SPRINT_TIME;
  updateSprint();
  fam("sprint");
  say("Ninguem me segura!");
  spawnBurst(pac.x, pac.y, "#7de8ff", 18, 3.6);
  addFloating(pac.x, pac.y, "CORRIDA!", "#7de8ff");
}
function boostSprint() {                 // recompensa de item (+1000)
  if (game.sprintCharges < SPRINT_PER_LEVEL) game.sprintCharges = SPRINT_PER_LEVEL;
  else game.sprintCharges = Math.min(8, game.sprintCharges + 3);
  updateSprint();
}

/* ------------------------------ TIRO ------------------------------------ */
function fireShot() {
  if (game.state !== "play" || game.fireCd > 0) return;
  if (game.ammo <= 0) { say("Sem munição, reload"); game.fireCd = 0.5; return; }
  game.ammo--;
  game.fireCd = 0.35;
  updateAmmo();
  fam("shoot");
  say("Toma...");
  game.projectiles.push({
    x: pac.x, y: pac.y,
    dir: { x: pac.dir.x, y: pac.dir.y },
    life: SHOT_RANGE / SHOT_SPEED
  });
}
function updateProjectiles(dt) {
  game.fireCd -= dt;
  for (let i = game.projectiles.length - 1; i >= 0; i--) {
    const p = game.projectiles[i];
    p.x += p.dir.x * SHOT_SPEED * dt;
    p.y += p.dir.y * SHOT_SPEED * dt;
    p.life -= dt;
    const noseC = Math.floor(p.x + p.dir.x * 0.5);
    const noseR = Math.floor(p.y + p.dir.y * 0.5);
    if (isSolidCell(noseC, noseR, false)) {
      spawnBurst(p.x, p.y, "#9fc7ff", 8, 2.4);
      game.projectiles.splice(i, 1);
      continue;
    }
    let hit = null;
    for (const g of ghosts) {
      if (g.state !== "active" && g.state !== "fright" && g.state !== "leaving") continue;
      if (dist(p.x, p.y, g.x, g.y) < 0.55) { hit = g; break; }
    }
    if (hit) {
      spawnBurst(p.x, p.y, hit.state === "fright" ? "#7db8ff" : GHOST_INFO[hit.id].glow, 18, 3.6);
      hit.state = "eyes";
      hit.speed = EYES_SPEED;
      hit.eyesT = 0;
      addScore(100);
      AudioSys.sfx.hit();
      addFloating(hit.x, hit.y, 100, "#ffe9a8");
      game.projectiles.splice(i, 1);
      continue;
    }
    // tiro acerta o monstro
    if (game.monster && dist(p.x, p.y, game.monster.x, game.monster.y) < 0.55) {
      spawnBurst(p.x, p.y, "#ff5470", 18, 3.6);
      killMonster();
      AudioSys.sfx.hit();
      game.projectiles.splice(i, 1);
      continue;
    }
    if (p.life <= 0 || p.x < 0 || p.x > COLS || p.y < 0 || p.y > ROWS) game.projectiles.splice(i, 1);
  }
}

/* ------------------------------ Fantasmas -------------------------------- */
function ghostTarget(g) {
  const pc = cellFromPos(pac.x, pac.y);
  if (game.mode === "scatter") return { ...SCATTER_CORNERS[g.id] };
  switch (g.id) {
    case 0: return { c: pc.c, r: pc.r };
    case 1: return {
      c: Math.max(0, Math.min(COLS - 1, pc.c + pac.dir.x * 4)),
      r: Math.max(0, Math.min(ROWS - 1, pc.r + pac.dir.y * 4))
    };
    case 2: {
      const bl = ghosts[0];
      const bc = Math.round(bl.x - 0.5), br = Math.round(bl.y - 0.5);
      return { c: Math.max(0, Math.min(COLS - 1, pc.c * 2 - bc)), r: Math.max(0, Math.min(ROWS - 1, pc.r * 2 - br)) };
    }
    default:
      return dist(pac.x, pac.y, g.x, g.y) > 8 ? { c: pc.c, r: pc.r } : { ...SCATTER_CORNERS[3] };
  }
}
function insideHouseArea(c, r) { return c >= 11 && c <= 16 && r >= 13 && r <= 15; }

/* Campo de distâncias até à casinha: os olhinhos seguem sempre o caminho certo */
let eyeField = null;
function buildEyeField() {
  const W = COLS, H = ROWS;
  const d = Array.from({ length: H }, () => new Array(W).fill(Infinity));
  const home = window.GHOST_HOME;
  d[home.r][home.c] = 0;
  const q = [[home.c, home.r]];
  while (q.length) {
    const [c, r] = q.shift();
    const step = d[r][c] + 1;
    for (const dd of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dd[0], nr = r + dd[1];
      if (nc < 0 || nc >= W || nr < 0 || nr >= H) continue;
      if (game.grid[nr][nc] === "#") continue;
      if (d[nr][nc] <= step) continue;
      d[nr][nc] = step;
      q.push([nc, nr]);
    }
  }
  eyeField = d;
}

function chooseGhostDir(g, c, r) {
  const inHouse = insideHouseArea(c, r);
  const cands = [{ x: 0, y: -1 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }]
    .filter((d) => !opposite(d, g.dir));
  const open = cands.filter((d) => !isSolidCell(c + d.x, r + d.y, true));
  const pool = open.length ? open : [{ x: -g.dir.x, y: -g.dir.y }];

  /* Olhinhos (e fantasmas a sair) seguem o campo BFS até à casinha */
  if (g.state === "eyes" || g.state === "leaving") {
    let best = pool[0], bd = Infinity;
    if (eyeField) {
      for (const d of pool) {
        const nc = c + d.x, nr = r + d.y;
        if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
        const v = eyeField[nr][nc];
        if (isFinite(v) && v < bd) { bd = v; best = d; }
      }
    }
    g.dir = best;
    return;
  }

  let target;
  if (g.state === "fright") {
    target = inHouse ? { c: window.GHOST_HOME.c, r: window.GHOST_HOME.r } : null;
  } else if (inHouse) {
    target = { c: window.GHOST_HOME.c, r: window.GHOST_HOME.r };
  } else {
    target = ghostTarget(g);
  }
  if (g.state === "fright" && !target) {
    g.dir = open.length ? open[Math.floor(Math.random() * open.length)] : { x: -g.dir.x, y: -g.dir.y };
    return;
  }
  const PRIO = { "0,-1": 0, "-1,0": 1, "0,1": 2, "1,0": 3 };
  let best = pool[0], bestScore = Infinity, bestPrio = Infinity;
  for (const d of pool) {
    const dc = (c + d.x) - target.c, dr = (r + d.y) - target.r;
    const sc = Math.abs(dc) + Math.abs(dr);
    const prio = PRIO[dirKey(d)] !== undefined ? PRIO[dirKey(d)] : 99;
    if (sc < bestScore || (sc === bestScore && prio < bestPrio)) {
      best = d; bestScore = sc; bestPrio = prio;
    }
  }
  g.dir = best;
}
function ghostOnCenter(g, c, r) {
  if (g.state === "waiting") return;
  if (g.state === "eyes") {
    if (c === window.GHOST_HOME.c && r === window.GHOST_HOME.r) { respawnGhost(g); return; }
    chooseGhostDir(g, c, r);
    return;
  } else if (g.state === "leaving" && c === window.GHOST_HOME.c && r === window.GHOST_HOME.r) {
    g.state = "active";
    g.respawned = false;
  }
  chooseGhostDir(g, c, r);
}

/* Recolocar um fantasma morto dentro da casa */
function respawnGhost(g) {
  const s = g.id === 0 ? { c: 13, r: 13 } : window.GHOST_SPAWNS[g.id];
  g.x = s.c + 0.5;
  g.y = s.r + 0.5;
  g.dir = { x: 0, y: -1 };
  g.state = "waiting";
  g.holdFright = true;       // comido pela pílula → fica até o efeito acabar
  g.respawned = true;
  g.releaseTimer = 999;
  g.eyesT = 0;
}
function ghostSpeedFor(g) {
  if (g.state === "eyes") return EYES_SPEED;
  if (g.state === "fright") return g.frightenedSpeed;
  if (g.state === "leaving") return 4.0;
  let s = difficultyFor(game.level).gv * GHOST_SPEED_MULT[g.id];
  if (g.id === 0) {
    const left = game.dotsTotal - game.dotsEaten;
    if (left <= 8) s *= 1.2;
    else if (left <= 15) s *= 1.1;
  }
  return s;
}
function updateGhost(g, dt) {
  g.bobT += dt;
  if (g.state === "waiting") {
    if (g.holdFright) {
      if (game.frightT > 0) return;
      g.holdFright = false;
      g.releaseTimer = Math.max(0.5, (difficultyFor(game.level).release[g.id] || 1));
    }
    g.releaseTimer -= dt;
    if (g.releaseTimer <= 0) g.state = "leaving";
    return;
  }
  if (g.state === "eyes") {
    g.eyesT += dt;
    // segurança: nunca fica preso fora da casa
    if (g.eyesT > 20) { respawnGhost(g); return; }
  }
  g.speed = ghostSpeedFor(g);
  const row = Math.round(g.y - 0.5);
  if (row === game.tunnelRowH) g.speed *= TUNNEL_MULT;
  moveEntity(g, dt, true);
  // chegou perto de casa → recoloca para não "passar por cima"
  if (g.state === "eyes") {
    const home = window.GHOST_HOME;
    if (dist(g.x, g.y, home.c + 0.5, home.r + 0.5) < 1.1) respawnGhost(g);
  }
}

/* ------------------------------ Lógica ---------------------------------- */
function activateFright() {
  game.frightT = Math.max(game.frightT, difficultyFor(game.level).fright);
  game.combo = 0;
  for (const g of ghosts) {
    if (g.state === "leaving" && g.respawned) {
      // fantasma morto a sair: volta a esperar até a vitamina acabar
      g.state = "waiting";
      g.holdFright = true;
      g.releaseTimer = 999;
      continue;
    }
    if (g.state === "eyes" || g.state === "waiting" || g.state === "leaving") {
      continue;
    }
    if (g.state === "fright") continue;
    g.state = "fright";
    g.frightenedSpeed = FRIGHT_SPEED * GHOST_SPEED_MULT[g.id];
    g.dir = { x: -g.dir.x, y: -g.dir.y };
  }
}
function onModeSwitch() {
  game.mode = game.mode === "scatter" ? "chase" : "scatter";
  for (const g of ghosts) {
    if (g.state === "active") g.dir = { x: -g.dir.x, y: -g.dir.y };
  }
}
/* Som por ação: engraçado quando o personagem está com foto */
function fam(kind) {
  if (game.picLoaded && AudioSys.sfx["fny_" + kind]) { AudioSys.sfx["fny_" + kind](); return; }
  if (AudioSys.sfx[kind]) AudioSys.sfx[kind]();
}

function addScore(v) {
  game.score += v;
  if (game.score > game.highscore) {
    game.highscore = game.score;
    elHigh.textContent = game.highscore.toLocaleString("pt-PT");
  }
  if (game.score >= game.extraLifeAt) {
    game.extraLifeAt += EXTRA_LIFE_AT;
    game.lives++;
    AudioSys.sfx.extraLife();
    addFloating(pac.x, pac.y, "VIDA EXTRA!", "#ffd24a");
    spawnBurst(pac.x, pac.y, "#ffd24a", 20, 3.4);
    updateLives();
  }
  elScore.textContent = game.score.toLocaleString("pt-PT");
}
function addFloating(x, y, text, color) { game.floating.push({ x, y, text, color, t: 1.3 }); }

function spawnBurst(x, y, color, n, spd) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = (0.4 + Math.random()) * spd;
    game.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.45, t: 0, color, r: 1.2 + Math.random() * 1.8 });
  }
  if (game.particles.length > 400) game.particles.splice(0, game.particles.length - 400);
}
function updateParticles(dt) {
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const p = game.particles[i];
    p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= 0.92; p.vy *= 0.92;
    if (p.t >= p.life) game.particles.splice(i, 1);
  }
}
function drawParticles() {
  for (const p of game.particles) {
    ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x * TILE, p.y * TILE, p.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function checkCollisions() {
  for (const g of ghosts) {
    if (g.state === "waiting" || g.state === "leaving") continue;
    if (dist(pac.x, pac.y, g.x, g.y) < 0.62) {
      if (g.state === "fright") {
        game.combo = Math.min(game.combo + 1, 4);
        const pts = 200 * Math.pow(2, game.combo - 1);
        addScore(pts);
        if (game.picLoaded) fam("eatGhost"); else AudioSys.sfx.eatGhost(game.combo - 1);
        addFloating(g.x, g.y, pts, "#7db8ff");
        spawnBurst(g.x, g.y, "#7db8ff", 18, 3.6);
        g.state = "eyes";
        g.speed = EYES_SPEED;
        g.eyesT = 0;
      } else if (g.state === "active") {
        killPacman("ghost");
        return;
      }
    }
  }
}
function killPacman(cause) {
  if (game.state !== "play") return;
  game.state = "dying";
  game.dyingT = 1.9;
  game.deathFlashT = 2;             // a foto pisca em vermelho durante 2 s
  fam("death");
  const msg = cause === "monster" ? "Lazarento..." : cause === "ghost" ? "Tomei no tórax..." : "Me lasquei...";
  say(msg, 2.4);
  flashPhotoPreview();
  game.floating = [];
  spawnBurst(pac.x, pac.y, "#ffd24a", 26, 4);
}
function resetAfterDeath() {
  game.lives--;
  updateLives();
  if (game.lives <= 0) { gameOver(); return; }
  game.combo = 0;
  game.frightT = 0;
  game.mode = "scatter";
  game.modePhase = 0;
  const diff = difficultyFor(game.level);
  game.modeTimer = diff.sched[0][0];
  enterReady(diff);
}
function gameOver() {
  game.state = "gameover";
  AudioSys.sfx.gameOver();
  AudioSys.stopMusic();
  document.getElementById("final-score").textContent = game.score.toLocaleString("pt-PT");
  document.getElementById("final-level").textContent = game.level;
  document.getElementById("continue-level").textContent = game.level;
  const q = qualifiesForHs(game.score);
  document.getElementById("hs-form").style.display = q ? "" : "none";
  const input = document.getElementById("hs-name");
  if (q && input) input.value = getLastName();
  renderHighScoreTables();
  showOverlay("ov-gameover");
}
function continueLevel() {
  AudioSys.lock();
  AudioSys.sfx.continue();
  hideOverlay("ov-gameover");
  game.paused = false;
  initLevel(game.level);
}
function quitAndSave() {
  if (qualifiesForHs(game.score)) {
    const name = (document.getElementById("hs-name") ? document.getElementById("hs-name").value.trim() : "") || getLastName() || "Jogador";
    addHighScore(name, game.score, game.level);
    setLastName(name);
  }
  saveState();
  renderHighScoreTables();
  goToTitle();
}
function completeGame() {
  game.state = "complete";
  AudioSys.sfx.win();
  AudioSys.stopMusic();
  document.getElementById("complete-score").textContent = game.score.toLocaleString("pt-PT");
  if (qualifiesForHs(game.score)) addHighScore(getLastName() || "Jogador", game.score, game.level);
  clearSave();
  renderHighScoreTables();
  showOverlay("ov-complete");
}
function goToTitle() {
  game.state = "title";
  hideOverlay("ov-gameover");
  hideOverlay("ov-pause");
  hideOverlay("ov-complete");
  showOverlay("ov-title");
  renderHighScoreTables();
  updateTitleButtons();
  AudioSys.lock();
  if (!customMusicActive) AudioSys.setEnabled(AudioSys.isEnabled());
  syncMusicUI();
}

/* ------------------------------ Update ---------------------------------- */
function updatePlay(dt) {
  game.globalTimer += dt;
  pac.mouthT += dt * 11 * (pac.speed / PAC_SPEED);

  game.modeTimer -= dt;
  if (game.modeTimer <= 0) {
    const diff = difficultyFor(game.level);
    game.modePhase = Math.min(game.modePhase + 1, diff.sched.length - 1);
    game.modeTimer = diff.sched[game.modePhase][game.mode === "scatter" ? 1 : 0];
    onModeSwitch();
  }

  if (game.frightT > 0) {
    game.frightT -= dt;
    if (game.frightT <= 0) {
      for (const g of ghosts) if (g.state === "fright") g.state = "active";
    }
  }

  tryTurnPacman();
  pac.speed = PAC_SPEED;
  const pr = Math.round(pac.y - 0.5);
  if (pr === game.tunnelRowH) pac.speed *= TUNNEL_MULT;
  if (game.sprintT > 0) {
    game.sprintT -= dt;
    pac.speed *= (1 + SPRINT_BONUS);   // +70% durante a corrida
    if (game.sprintT <= 0) game.sprintT = 0;
  }
  moveEntity(pac, dt, false);
  eatPelletAt();
  pac.trail.push({ x: pac.x, y: pac.y });
  if (pac.trail.length > 7) pac.trail.shift();

  updateFruits(dt);
  updateItem(dt);
  updateMissile(dt);
  updateMonster(dt);
  updateBombs2(dt);

  for (const g of ghosts) updateGhost(g, dt);
  checkCollisions();
  if (game.state === "dying") return;

  updateProjectiles(dt);
  checkLevelClear();
  updateFloating(dt);
}
function updateFloating(dt) {
  for (let i = game.floating.length - 1; i >= 0; i--) {
    game.floating[i].t -= dt;
    if (game.floating[i].t <= 0) game.floating.splice(i, 1);
  }
}
function update(dt) {
  if (game.paused) return;
  if (game.speech) {
    game.speech.t -= dt;
    if (game.speech.t <= 0) game.speech = null;
  }
  if (game.deathFlashT > 0) game.deathFlashT = Math.max(0, game.deathFlashT - dt);
  updateParticles(dt);
  switch (game.state) {
    case "ready":
      game.readyT -= dt;
      if (game.readyT <= 0) game.state = "play";
      break;
    case "play":
      updatePlay(dt);
      break;
    case "dying":
      game.dyingT -= dt;
      pac.mouthT += dt * 18;
      if (game.dyingT <= 0) resetAfterDeath();
      break;
    case "levelClear":
      game.clearT -= dt;
      updateFloating(dt);
      if (game.clearT <= 0) {
        if (game.level >= MAX_LEVEL) completeGame();
        else initLevel(game.level + 1);
      }
      break;
  }
}
function checkLevelClear() {
  if (game.dotsEaten >= game.dotsTotal) {
    game.state = "levelClear";
    game.clearT = 2.2;
    const bonus = 1000 + game.level * 100;
    addScore(bonus);
    addFloating(COLS / 2, 11.5, "NÍVEL COMPLETO!", "#ffd24a");
    AudioSys.sfx.levelStart();
  }
}

/* ------------------------------ Arranque -------------------------------- */
function startGame(opts) {
  opts = opts || { mode: "new" };
  AudioSys.lock();
  hideOverlay("ov-title");
  hideOverlay("ov-gameover");
  hideOverlay("ov-pause");
  hideOverlay("ov-complete");
  game.paused = false;
  try { game.highscore = Math.max(0, ...loadScores().map((e) => e.score || 0)); } catch (e) {}
  elHigh.textContent = game.highscore.toLocaleString("pt-PT");
  if (opts.mode === "continue" && loadState()) {
    const st = loadState();
    game.score = st.score || 0;
    game.extraLifeAt = EXTRA_LIFE_AT * (Math.floor(game.score / EXTRA_LIFE_AT) + 1);
    elScore.textContent = game.score.toLocaleString("pt-PT");
    initLevel(st.level || 1);
  } else {
    clearSave();
    game.score = 0;
    game.extraLifeAt = EXTRA_LIFE_AT;
    elScore.textContent = "0";
    initLevel(1);
  }
}
function updateLives() {
  const n = Math.max(0, game.lives);
  elLives.innerHTML = n
    ? Array.from({ length: n }, () => '<span class="life-pac">●</span>').join("")
    : '<span class="life-empty">—</span>';
}

/* ------------------------------ Overlays -------------------------------- */
function showOverlay(id) { document.getElementById(id).classList.add("show"); }
function hideOverlay(id) { document.getElementById(id).classList.remove("show"); }
function setPause(on) {
  game.paused = on;
  document.getElementById("ov-pause").classList.toggle("show", on);
  if (on) { AudioSys.sfx.pause(); AudioSys.stopMusic(); }
  else { AudioSys.sfx.resume(); if (!customMusicActive) AudioSys.playTrack(game.level ? (game.level - 1) % 5 : 0); syncMusicUI(); }
}
function updateTitleButtons() {
  const st = loadState();
  const btn = document.getElementById("btn-continue-save");
  const bar = document.getElementById("save-bar");
  const playBtn = document.getElementById("btn-play");
  if (!btn) return;
  if (st) {
    btn.style.display = "";
    if (bar) bar.style.display = "";
    if (playBtn) playBtn.style.display = "none";
    document.getElementById("save-level").textContent = st.level;
    document.getElementById("save-score").textContent = (st.score || 0).toLocaleString("pt-PT");
    const hint = document.getElementById("save-hint");
    if (hint) hint.textContent = "Jogo guardado no nível " + st.level + ". Queres continuar de onde parou ou começar um novo jogo?";
  } else {
    btn.style.display = "none";
    if (bar) bar.style.display = "none";
    if (playBtn) playBtn.style.display = "";
  }
}

/* ------------------------------ Música ---------------------------------- */
function syncMusicUI() {
  const btnPause = document.getElementById("btn-music-pause");
  if (btnPause) btnPause.textContent = (customMusicActive && customMusicIsPlaying()) ? "⏸ Pausa" : "▶ Tocar";
  if (customMusicActive && savedMusic) {
    if (elMusicName) elMusicName.textContent = "🎵 " + savedMusic.name;
    if (btnMute) btnMute.textContent = customMusicIsPlaying() ? "🔊" : "🔇";
    return;
  }
  const idx = AudioSys.getTrackIndex() + 1;
  const total = AudioSys.trackCount();
  if (elMusicName) elMusicName.textContent = AudioSys.getTrackName() + "  (" + idx + "/" + total + ")";
  if (btnMute) btnMute.textContent = AudioSys.isEnabled() ? "🔊" : "🔇";
}
function toggleMusic() {
  AudioSys.lock();
  if (customMusicActive) { pauseCustomMusic(); syncMusicUI(); return; }
  AudioSys.setEnabled(!AudioSys.isEnabled());
  syncMusicUI();
}

/* ------------------------------ Entrada --------------------------------- */
const KEYDIRS = {
  "ArrowUp": { x: 0, y: -1 }, "ArrowDown": { x: 0, y: 1 },
  "ArrowLeft": { x: -1, y: 0 }, "ArrowRight": { x: 1, y: 0 },
  "w": { x: 0, y: -1 }, "W": { x: 0, y: -1 },
  "s": { x: 0, y: 1 }, "S": { x: 0, y: 1 },
  "a": { x: -1, y: 0 }, "A": { x: -1, y: 0 },
  "d": { x: 1, y: 0 }, "D": { x: 1, y: 0 }
};
const heldKeys = new Set();

window.addEventListener("keydown", (ev) => {
  AudioSys.lock();
  const k = ev.key;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(k)) ev.preventDefault();
  if (KEYDIRS[k]) {
    heldKeys.add(k);
    game.keyHeld = KEYDIRS[k];
    if (game.state === "play" || game.state === "ready") game.pacDesired = KEYDIRS[k];
    return;
  }
  if (k === "c" || k === "C") { if (!ev.repeat) activateSprint(); return; }
  if (k === "b" || k === "B") { if (!ev.repeat) placeBomb(); return; }
  if (k === " ") {
    if (game.state === "title") startGame();
    else if (game.paused) setPause(false);
    else if (game.state === "gameover") continueLevel();
    else if (game.state === "play") { if (!ev.repeat) fireShot(); }
    return;
  }
  if (k === "Enter") {
    if (game.state === "title") startGame();
    else if (game.paused) setPause(false);
    else if (game.state === "gameover") continueLevel();
    return;
  }
  if (k === "1" || k === "2" || k === "3" || k === "4" || k === "5") {
    AudioSys.lock();
    leaveCustomForDefault();
    AudioSys.playTrack(parseInt(k, 10) - 1);
    syncMusicUI();
    AudioSys.sfx.click();
    return;
  }
  if (k === "p" || k === "P" || k === "Escape") {
    if (game.state === "play" && !game.paused) setPause(true);
    else if (game.paused) setPause(false);
    return;
  }
  if (k === "m" || k === "M") toggleMusic();
});
window.addEventListener("keyup", (ev) => {
  heldKeys.delete(ev.key);
  if (heldKeys.size === 0) game.keyHeld = null;
});

/* Rato: mover aponta o caminho · esquerdo=BOMBA · direito=TIRO ·
   esquerdo+direito juntos = CORRIDA */
let lastMouseDir = null;
const mouseBtns = { 0: false, 2: false };
function mouseDirFromEvent(ev) {
  const rect = canvas.getBoundingClientRect();
  const mx = (ev.clientX - rect.left) * (canvas.width / rect.width);
  const my = (ev.clientY - rect.top) * (canvas.height / rect.height);
  const px = pac.x * TILE, py = pac.y * TILE;
  const dx = mx - px, dy = my - py;
  if (Math.hypot(dx, dy) < 20) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
  return dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
}
canvas.addEventListener("pointermove", (ev) => {
  if ((game.state === "play" || game.state === "ready") && heldKeys.size === 0) {
    const raw = mouseDirFromEvent(ev);
    if (raw) {
      if (lastMouseDir && lastMouseDir.x === raw.x && lastMouseDir.y === raw.y) game.pacDesired = raw;
      lastMouseDir = raw;
    }
  }
});
canvas.addEventListener("pointerdown", (ev) => {
  AudioSys.lock();
  if (ev.button !== 0 && ev.button !== 2) return;
  mouseBtns[ev.button] = true;
  if (mouseBtns[0] && mouseBtns[2]) { activateSprint(); return; }   // corrida
  if (game.state !== "play" && game.state !== "ready") return;
  if (ev.button === 2) fireShot();
  else if (ev.button === 0) placeBomb();
});
canvas.addEventListener("pointerup", (ev) => { mouseBtns[ev.button] = false; });
canvas.addEventListener("contextmenu", (ev) => ev.preventDefault());
window.addEventListener("blur", () => { if (game.state === "play" && !game.paused) setPause(true); });

/* Botões */
document.getElementById("btn-play").addEventListener("click", () => { AudioSys.lock(); AudioSys.sfx.click(); startGame({ mode: "new" }); });
document.getElementById("btn-continue-save").addEventListener("click", () => { AudioSys.lock(); AudioSys.sfx.click(); startGame({ mode: "continue" }); });
document.getElementById("btn-resume").addEventListener("click", () => { AudioSys.sfx.click(); setPause(false); });
document.getElementById("btn-continue").addEventListener("click", () => { AudioSys.sfx.click(); continueLevel(); });
document.getElementById("btn-quit-save").addEventListener("click", () => { AudioSys.sfx.click(); quitAndSave(); });
document.getElementById("btn-quit-save-p").addEventListener("click", () => { AudioSys.sfx.click(); quitAndSave(); });
document.getElementById("btn-menu").addEventListener("click", () => { AudioSys.sfx.click(); quitAndSave(); });
document.getElementById("btn-menu-title").addEventListener("click", () => { AudioSys.sfx.click(); goToTitle(); });
document.getElementById("btn-new-journey").addEventListener("click", () => { AudioSys.lock(); AudioSys.sfx.click(); clearSave(); startGame({ mode: "new" }); });
document.getElementById("btn-new-game").addEventListener("click", () => { AudioSys.lock(); AudioSys.sfx.click(); clearSave(); startGame({ mode: "new" }); });
document.getElementById("btn-gameover-home").addEventListener("click", () => { AudioSys.sfx.click(); goToTitle(); });
btnMute.addEventListener("click", toggleMusic);
btnMusicPrev.addEventListener("click", () => { AudioSys.lock(); leaveCustomForDefault(); AudioSys.prevTrack(); syncMusicUI(); AudioSys.sfx.click(); });
btnMusicNext.addEventListener("click", () => { AudioSys.lock(); leaveCustomForDefault(); AudioSys.nextTrack(); syncMusicUI(); AudioSys.sfx.click(); });

/* =======================================================================
 * FOTO DO PERSONAGEM — carregar, pré-visualizar, remover e persistir
 * ===================================================================== */
function setPhotoStatus(text) {
  for (const id of ["pic-status", "pic-status-panel"]) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
}

function setPhotoPreview(dataUrl) {
  const pv = document.getElementById("pic-preview");
  const empty = document.getElementById("pic-preview-empty");
  const rm = document.getElementById("btn-pic-remove");
  if (pv) {
    if (dataUrl) { pv.src = dataUrl; pv.hidden = false; }
    else { pv.removeAttribute("src"); pv.hidden = true; }
  }
  if (empty) empty.hidden = !!dataUrl;
  if (rm) rm.disabled = !dataUrl;
}

function applyPhoto(dataUrl, opts) {
  opts = opts || {};
  const img = new Image();
  img.onload = () => {
    game.playerPic = img;
    game.picLoaded = true;
    setPhotoPreview(dataUrl);
    setPhotoStatus("Foto carregada ✓ — sons engraçados ativados!");
    if (opts.save !== false) {
      try { localStorage.setItem(PHOTO_KEY, dataUrl); }
      catch (e) { setPhotoStatus("Foto ativa, mas não coube na memória do jogo."); }
    }
    if (opts.sound) { try { AudioSys.sfx.fny_pic(); } catch (e) {} }
  };
  img.onerror = () => {
    setPhotoStatus("Não foi possível abrir essa imagem.");
  };
  img.src = dataUrl;
}

function removePhoto() {
  game.playerPic = null;
  game.picLoaded = false;
  try { localStorage.removeItem(PHOTO_KEY); } catch (e) {}
  setPhotoPreview(null);
  setPhotoStatus("Sem foto — Pac-Man clássico");
}

function restorePhoto() {
  let data = null;
  try { data = localStorage.getItem(PHOTO_KEY); } catch (e) {}
  if (data) applyPhoto(data, { save: false });
  else setPhotoPreview(null);
}

function flashPhotoPreview() {
  const pv = document.getElementById("pic-preview");
  if (!pv || pv.hidden) return;
  pv.classList.remove("dead-flash");
  void pv.offsetWidth;
  pv.classList.add("dead-flash");
  setTimeout(() => pv.classList.remove("dead-flash"), 2100);
}

function handlePhotoFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const raw = reader.result;
    const img = new Image();
    img.onload = () => {
      // reduz para 900 px no lado maior (mantém alta qualidade no jogo)
      const max = 900;
      const k = Math.min(1, max / Math.max(img.width, img.height));
      if (k < 1) {
        const cv = document.createElement("canvas");
        cv.width = Math.max(1, Math.round(img.width * k));
        cv.height = Math.max(1, Math.round(img.height * k));
        const cx = cv.getContext("2d");
        cx.imageSmoothingEnabled = true;
        cx.imageSmoothingQuality = "high";
        cx.fillStyle = "#ffffff";
        cx.fillRect(0, 0, cv.width, cv.height);
        cx.drawImage(img, 0, 0, cv.width, cv.height);
        applyPhoto(cv.toDataURL("image/jpeg", 0.9), { save: true, sound: true });
      } else {
        applyPhoto(raw, { save: true, sound: true });
      }
    };
    img.onerror = () => {
      setPhotoStatus("Não foi possível abrir essa imagem.");
    };
    img.src = raw;
  };
  reader.readAsDataURL(file);
}

const picFile = document.getElementById("pic-file");
if (picFile) {
  picFile.addEventListener("change", (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (file) handlePhotoFile(file);
    ev.target.value = "";
  });
}
const btnPicRemove = document.getElementById("btn-pic-remove");
if (btnPicRemove) btnPicRemove.addEventListener("click", () => {
  try { AudioSys.sfx.click(); } catch (e) {}
  removePhoto();
});

/* =======================================================================
 * MÚSICA PERSONALIZADA — URL, YouTube ou ficheiro do dispositivo
 * Persistência: metadados em localStorage; ficheiros grandes em IndexedDB.
 * ===================================================================== */
let savedMusic = null;          // { kind: "url"|"yt"|"file", src, name, active }
let customMusicActive = false;
let ytPlayer = null;
let ytApiLoading = false;
let ytApiQueue = [];
const customAudio = new Audio();
customAudio.preload = "auto";
customAudio.addEventListener("ended", () => { if (customMusicActive) onCustomMusicEnded(); });
customAudio.addEventListener("play", () => { syncMusicUI(); });
customAudio.addEventListener("pause", () => { syncMusicUI(); });
customAudio.addEventListener("error", () => {
  if (customMusicActive) setMusicStatus("Não foi possível tocar este áudio. Verifica o link.");
});

function setMusicStatus(t) {
  const el = document.getElementById("music-status");
  if (el) el.textContent = t;
}

function parseYouTube(url) {
  const m = String(url || "").match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

/* IndexedDB simples para guardar o ficheiro de música */
let mediaDBPromise = null;
function mediaDB() {
  if (!mediaDBPromise) {
    mediaDBPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) { reject(new Error("sem IndexedDB")); return; }
      const req = indexedDB.open("pac-jhow-media", 1);
      req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains("files")) req.result.createObjectStore("files"); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return mediaDBPromise;
}
function idbPut(key, blob) {
  return mediaDB().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").put(blob, key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  }));
}
function idbGet(key) {
  return mediaDB().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readonly");
    const r = tx.objectStore("files").get(key);
    r.onsuccess = () => resolve(r.result || null);
    r.onerror = () => reject(r.error);
  }));
}
function idbDel(key) {
  return mediaDB().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").delete(key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  })).catch(() => {});
}

function persistMusic() {
  try {
    if (!savedMusic) localStorage.removeItem(MUSIC_KEY);
    else {
      const data = { kind: savedMusic.kind, name: savedMusic.name, active: !!savedMusic.active };
      if (savedMusic.kind !== "file") data.src = savedMusic.src;
      localStorage.setItem(MUSIC_KEY, JSON.stringify(data));
    }
  } catch (e) {
    setMusicStatus("Música ativa, mas não coube na memória do jogo.");
  }
}

function stopCustomPlayback(keepActive) {
  try { customAudio.pause(); customAudio.currentTime = 0; } catch (e) {}
  if (ytPlayer && ytPlayer.stopVideo) { try { ytPlayer.stopVideo(); } catch (e) {} }
  const wrap = document.getElementById("yt-wrap");
  if (wrap && !ytPlayer) wrap.hidden = true;
  if (!keepActive) customMusicActive = false;
}

function loadYTApi(cb) {
  if (window.YT && window.YT.Player) { cb(); return; }
  ytApiQueue.push(cb);
  if (ytApiLoading) return;
  ytApiLoading = true;
  window.onYouTubeIframeAPIReady = () => {
    ytApiLoading = false;
    const q = ytApiQueue.slice();
    ytApiQueue = [];
    for (const fn of q) { try { fn(); } catch (e) {} }
  };
  const s = document.createElement("script");
  s.src = "https://www.youtube.com/iframe_api";
  s.onerror = () => { ytApiLoading = false; setMusicStatus("Sem internet para carregar o YouTube."); };
  document.head.appendChild(s);
}

function playYouTube(id) {
  loadYTApi(() => {
    const wrap = document.getElementById("yt-wrap");
    if (wrap) wrap.hidden = false;
    if (ytPlayer && ytPlayer.loadVideoById) {
      ytPlayer.loadVideoById(id);
      ytPlayer.playVideo();
      return;
    }
    ytPlayer = new YT.Player("yt-player", {
      width: "100%", height: "120", videoId: id,
      playerVars: { autoplay: 1, rel: 0, playsinline: 1 },
      events: {
        onReady: (e) => { try { e.target.playVideo(); } catch (err) {} },
        onStateChange: (e) => {
          if (e.data === 0) onCustomMusicEnded();
          if (e.data === 1) { setMusicStatus("A tocar: " + (savedMusic ? savedMusic.name : "YouTube")); syncMusicUI(); }
          if (e.data === 2) { setMusicStatus("Música em pausa."); syncMusicUI(); }
        },
        onError: () => setMusicStatus("O YouTube não permitiu tocar este vídeo.")
      }
    });
  });
}

function playCustomMusic(kind, src, name, opts) {
  opts = opts || {};
  customMusicActive = true;
  savedMusic = { kind, src: src, name: name || "Música personalizada", active: true };
  if (opts.persist !== false) persistMusic();
  AudioSys.stopMusic();
  const ended = document.getElementById("music-ended");
  if (ended) ended.hidden = true;
  if (kind === "yt") {
    const id = parseYouTube(src);
    if (!id) { customMusicActive = false; setMusicStatus("URL de YouTube inválida."); return; }
    setMusicStatus("A carregar: " + savedMusic.name);
    playYouTube(id);
  } else {
    try {
      customAudio.src = src;
      customAudio.currentTime = 0;
      const p = customAudio.play();
      if (p && p.catch) p.catch(() => setMusicStatus("Música pronta. Prime ▶ para tocar."));
      setMusicStatus("A tocar: " + savedMusic.name);
    } catch (e) {
      setMusicStatus("Não foi possível tocar este áudio.");
    }
  }
  syncMusicUI();
}

function onCustomMusicEnded() {
  const ended = document.getElementById("music-ended");
  if (ended) ended.hidden = false;
  setMusicStatus("A música terminou. Repetir ou voltar às músicas do jogo?");
  syncMusicUI();
}

function replayCustomMusic() {
  if (!savedMusic) return;
  try { AudioSys.sfx.click(); } catch (e) {}
  const ended = document.getElementById("music-ended");
  if (ended) ended.hidden = true;
  if (savedMusic.kind === "yt") playYouTube(parseYouTube(savedMusic.src));
  else {
    try { customAudio.currentTime = 0; customAudio.play().catch(() => {}); } catch (e) {}
  }
  setMusicStatus("A tocar: " + savedMusic.name);
  syncMusicUI();
}

function pauseCustomMusic() {
  if (!customMusicActive) {
    if (savedMusic) {
      playCustomMusic(savedMusic.kind, savedMusic.src, savedMusic.name, { persist: true });
    } else {
      setMusicStatus("Carrega uma música ou escreve um link.");
    }
    return;
  }
  if (!savedMusic) { setMusicStatus("Nenhuma música personalizada ativa."); return; }
  if (savedMusic.kind === "yt" && ytPlayer) {
    let st = -1;
    try { st = ytPlayer.getPlayerState(); } catch (e) {}
    if (st === 1) { try { ytPlayer.pauseVideo(); } catch (e) {} setMusicStatus("Música em pausa."); }
    else { try { ytPlayer.playVideo(); } catch (e) {} setMusicStatus("A tocar: " + savedMusic.name); }
    syncMusicUI();
    return;
  }
  if (customAudio.paused) {
    try { customAudio.play().catch(() => {}); } catch (e) {}
    setMusicStatus("A tocar: " + savedMusic.name);
  } else {
    try { customAudio.pause(); } catch (e) {}
    setMusicStatus("Música em pausa.");
  }
  syncMusicUI();
}

function leaveCustomForDefault() {
  if (!customMusicActive) return;
  stopCustomPlayback(false);
  try {
    if (savedMusic) { savedMusic.active = false; persistMusic(); }
  } catch (e) {}
  const ended = document.getElementById("music-ended");
  if (ended) ended.hidden = true;
  const wrap = document.getElementById("yt-wrap");
  if (wrap) wrap.hidden = true;
  setMusicStatus(savedMusic ? "Músicas padrão do jogo (a tua música continua guardada)." : "Música padrão do jogo");
  AudioSys.lock();
  AudioSys.setEnabled(true);
}

function useDefaultMusic() {
  leaveCustomForDefault();
  AudioSys.lock();
  AudioSys.setEnabled(true);
  AudioSys.playTrack(0);
  syncMusicUI();
  setMusicStatus(savedMusic ? "Músicas padrão do jogo (a tua música continua guardada)." : "Música padrão do jogo");
}

function removeCustomMusic() {
  stopCustomPlayback(false);
  savedMusic = null;
  try { localStorage.removeItem(MUSIC_KEY); } catch (e) {}
  idbDel("music");
  const input = document.getElementById("music-url");
  if (input) input.value = "";
  const ended = document.getElementById("music-ended");
  if (ended) ended.hidden = true;
  const wrap = document.getElementById("yt-wrap");
  if (wrap) wrap.hidden = true;
  AudioSys.lock();
  AudioSys.setEnabled(true);
  AudioSys.playTrack(0);
  syncMusicUI();
  setMusicStatus("Música padrão do jogo");
}

function customMusicIsPlaying() {
  if (!customMusicActive) return false;
  if (savedMusic && savedMusic.kind === "yt") {
    try { return !!(ytPlayer && ytPlayer.getPlayerState && ytPlayer.getPlayerState() === 1); } catch (e) { return false; }
  }
  return !customAudio.paused;
}

function restoreCustomMusic() {
  try {
    const raw = localStorage.getItem(MUSIC_KEY);
    if (raw) savedMusic = JSON.parse(raw);
  } catch (e) { savedMusic = null; }
  if (!savedMusic || !savedMusic.src && savedMusic.kind !== "file") return;
  if (savedMusic.kind === "file") {
    idbGet("music").then((blob) => {
      if (!blob) { setMusicStatus("Ficheiro de música não encontrado."); return; }
      savedMusic.src = URL.createObjectURL(blob);
      setMusicStatus("Música guardada: " + savedMusic.name + (savedMusic.active ? " — toca no primeiro clique." : " — prime ▶ para ouvir."));
      armMusicAutoplay();
    }).catch(() => setMusicStatus("Música guardada, mas não foi possível recuperar o ficheiro."));
    return;
  }
  const input = document.getElementById("music-url");
  if (input && savedMusic.kind !== "file") input.value = savedMusic.src;
  setMusicStatus("Música guardada: " + savedMusic.name + (savedMusic.active ? " — toca no primeiro clique." : " — prime ▶ para ouvir."));
  armMusicAutoplay();
}

function armMusicAutoplay() {
  if (!savedMusic || !savedMusic.active || customMusicActive) return;
  const resume = () => {
    document.removeEventListener("pointerdown", resume);
    document.removeEventListener("keydown", resume);
    if (savedMusic && savedMusic.active && !customMusicActive) {
      playCustomMusic(savedMusic.kind, savedMusic.src, savedMusic.name, { persist: false });
    }
  };
  document.addEventListener("pointerdown", resume, { once: true });
  document.addEventListener("keydown", resume, { once: true });
}

/* Eventos do quadro de música */
const musicUrlInput = document.getElementById("music-url");
const btnMusicUrl = document.getElementById("btn-music-url");
const musicFileInput = document.getElementById("music-file");
if (btnMusicUrl) {
  btnMusicUrl.addEventListener("click", () => {
    const url = (musicUrlInput ? musicUrlInput.value : "").trim();
    if (!url) { setMusicStatus("Escreve um link de música ou de vídeo do YouTube."); return; }
    const yt = parseYouTube(url);
    playCustomMusic(yt ? "yt" : "url", url, yt ? "YouTube" : decodeURIComponent(url.split("/").pop() || url), {});
  });
}
if (musicFileInput) {
  musicFileInput.addEventListener("change", (ev) => {
    const file = ev.target.files && ev.target.files[0];
    ev.target.value = "";
    if (!file) return;
    const url = URL.createObjectURL(file);
    // tenta guardar no IndexedDB (não há limite de ~5 MB)
    idbPut("music", file).then(() => {
      playCustomMusic("file", url, file.name, {});
    }).catch(() => {
      // fallback: dataURL em localStorage (pode falhar em ficheiros grandes)
      const r = new FileReader();
      r.onload = () => playCustomMusic("file", r.result, file.name, {});
      r.readAsDataURL(file);
    });
  });
}
const btnMusicPause = document.getElementById("btn-music-pause");
if (btnMusicPause) btnMusicPause.addEventListener("click", () => { try { AudioSys.sfx.click(); } catch (e) {} pauseCustomMusic(); });
const btnMusicDefault = document.getElementById("btn-music-default");
if (btnMusicDefault) btnMusicDefault.addEventListener("click", () => { try { AudioSys.sfx.click(); } catch (e) {} useDefaultMusic(); });
const btnMusicBackDefault = document.getElementById("btn-music-back-default");
if (btnMusicBackDefault) btnMusicBackDefault.addEventListener("click", () => { try { AudioSys.sfx.click(); } catch (e) {} useDefaultMusic(); });
const btnMusicRemove = document.getElementById("btn-music-remove");
if (btnMusicRemove) btnMusicRemove.addEventListener("click", () => { try { AudioSys.sfx.click(); } catch (e) {} removeCustomMusic(); });
const btnMusicReplay = document.getElementById("btn-music-replay");
if (btnMusicReplay) btnMusicReplay.addEventListener("click", replayCustomMusic);

/* Volumes */
function initVolumeUI() {
  const slM = document.getElementById("vol-music");
  const slS = document.getElementById("vol-sfx");
  const read = (k, def) => { try { const v = parseFloat(localStorage.getItem(k)); return isFinite(v) ? v : def; } catch (e) { return def; } };
  const mv = read(VOL_M_KEY, 70);
  const sv = read(VOL_S_KEY, 95);
  AudioSys.setMusicVolume(mv / 100);
  AudioSys.setSfxVolume(sv / 100);
  if (slM) {
    slM.value = mv;
    slM.addEventListener("input", () => { AudioSys.lock(); AudioSys.setMusicVolume(slM.value / 100); try { localStorage.setItem(VOL_M_KEY, String(slM.value)); } catch (e) {} });
  }
  if (slS) {
    slS.value = sv;
    slS.addEventListener("input", () => { AudioSys.lock(); AudioSys.setSfxVolume(slS.value / 100); try { localStorage.setItem(VOL_S_KEY, String(slS.value)); } catch (e) {} });
  }
}

/* ------------------------------ Render ----------------------------------- */
function drawShadow(x, y, rx, ry, a) {
  ctx.fillStyle = "rgba(0,0,10," + (a === undefined ? 0.35 : a) + ")";
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}

/* Cores das pílulas — chamar a atenção do jogador */
const PELLET_COLORS = ["#ffe08a", "#7fe8ff", "#a5ffc6", "#ff9fc4", "#d6c3ff", "#ffd27e"];

/* Foto emoldurada dentro da casinha dos fantasmas */
function drawHousePhoto() {
  if (!game.picLoaded || !game.playerPic) return;
  const img = game.playerPic;
  const w = 80, h = 52;
  const x0 = 11 * TILE + (6 * TILE - w) / 2;
  const y0 = 13 * TILE + (3 * TILE - h) / 2;
  ctx.save();
  ctx.globalAlpha = 0.96;
  // moldura dourada
  ctx.shadowColor = "rgba(255,210,74,0.55)";
  ctx.shadowBlur = 10;
  rrPath(x0 - 3, y0 - 3, w + 6, h + 6, 5, ctx);
  ctx.fillStyle = "rgba(255,210,74,0.22)";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,228,150,0.9)";
  ctx.lineWidth = 2;
  rrPath(x0 - 3, y0 - 3, w + 6, h + 6, 5, ctx);
  ctx.stroke();
  // imagem (cover crop, alta qualidade)
  ctx.save();
  rrPath(x0, y0, w, h, 3, ctx);
  ctx.clip();
  const sa = img.width / img.height, da = w / h;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (sa > da) { sw = img.height * da; sx = (img.width - sw) / 2; }
  else { sh = img.width / da; sy = (img.height - sh) * 0.35; }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, sw, sh, x0, y0, w, h);
  if (game.deathFlashT > 0) {
    const blink = 0.5 + 0.5 * Math.sin(performance.now() / 55);
    ctx.fillStyle = "rgba(255,28,28," + (0.20 + 0.60 * blink).toFixed(3) + ")";
    ctx.fillRect(x0, y0, w, h);
  }
  ctx.restore();
  // brilho de vidro
  const gl = ctx.createLinearGradient(x0, y0, x0, y0 + h);
  gl.addColorStop(0, "rgba(255,255,255,0.18)");
  gl.addColorStop(0.45, "rgba(255,255,255,0.02)");
  gl.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gl;
  rrPath(x0, y0, w, h, 3, ctx);
  ctx.fill();
  ctx.restore();
}

function drawPellets() {  const g = game.grid;
  if (!g) return;
  const pulse = 0.5 + 0.5 * Math.sin(game.globalTimer * 6);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const ch = g[r][c];
      const cx = (c + 0.5) * TILE, cy = (r + 0.5) * TILE;
      if (ch === ".") {
        const ph = (((c * 7 + r * 13) % 9) / 9) * Math.PI * 2;
        const tw = 0.5 + 0.5 * Math.sin(game.globalTimer * 3 + ph);
        const col = "#ffe08a";
        // halo
        ctx.fillStyle = "rgba(255,224,138," + (0.16 + 0.10 * tw).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(cx, cy + 1, 4.4 + 1.0 * tw, 0, Math.PI * 2); ctx.fill();
        // núcleo (um pouco menor, cor única)
        const grad = ctx.createRadialGradient(cx - 0.8, cy - 0.8, 0.3, cx, cy, 2.8);
        grad.addColorStop(0, "#fffbe0");
        grad.addColorStop(1, col);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(cx, cy, 2.6 + 0.6 * tw, 0, Math.PI * 2); ctx.fill();
      } else if (ch === "o") {
        // VITAMINA: grande, colorida, pulsante
        const vcol = ["#ffd24a", "#ff7ab8", "#7fe8ff", "#a5ff6e", "#d6a2ff"][c % 5];
        const glow = (0.4 + 0.6 * pulse);
        ctx.fillStyle = "rgba(255,255,255," + (0.10 + 0.12 * pulse).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(cx, cy + 2, 9 + 4 * pulse, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = rgba(vcol, 0.30 + 0.25 * pulse);
        ctx.beginPath(); ctx.arc(cx, cy + 1.5, 7 + 3 * pulse, 0, Math.PI * 2); ctx.fill();
        const grad = ctx.createRadialGradient(cx - 1.5, cy - 1.5, 1, cx, cy, 6.2);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.42, vcol);
        grad.addColorStop(1, rgba(vcol, 0.55));
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(cx, cy, 5.2 + 1.4 * pulse, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255," + (0.55 + 0.4 * pulse).toFixed(2) + ")";
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(cx, cy, 7 + 2 * pulse, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = glow;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(cx + 2.5, cy - 2.5, 1.2, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }
}

function drawPacman() {
  const px = pac.x * TILE, py = pac.y * TILE;
  drawShadow(px, py + 3, 7, 3, 0.38);
  if (game.state === "dying" && !(game.picLoaded && game.playerPic)) {
    const t = 1 - Math.max(0, game.dyingT / 1.9);
    const R = 8 * (1 - t);
    if (R < 0.5) return;
    const dg = ctx.createRadialGradient(px - 2, py - 3, 1, px, py, R);
    dg.addColorStop(0, "#fff6c8");
    dg.addColorStop(1, "#f2a018");
    ctx.fillStyle = dg;
    ctx.beginPath(); ctx.arc(px, py, R, 0, Math.PI * 2); ctx.fill();
    return;
  }
  const tl = pac.trail;
  for (let i = 0; i < tl.length; i++) {
    const k = i / tl.length;
    ctx.fillStyle = "rgba(255,205,80," + (0.10 * k).toFixed(3) + ")";
    ctx.beginPath(); ctx.arc(tl[i].x * TILE, tl[i].y * TILE, 7 * k, 0, Math.PI * 2); ctx.fill();
  }
  // linhas de velocidade durante a corrida
  if (game.sprintT > 0) {
    ctx.lineCap = "round";
    for (let i = 0; i < 7; i++) {
      const tt = ((game.globalTimer * 14 + i * 0.9) % 7) / 7;
      const bx = px - pac.dir.x * (12 + tt * 36);
      const by = py - pac.dir.y * (12 + tt * 36);
      ctx.strokeStyle = "rgba(125,232,255," + (0.55 * (1 - tt)).toFixed(3) + ")";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx + pac.dir.y * 3.5, by - pac.dir.x * 3.5);
      ctx.lineTo(bx - pac.dir.y * 3.5, by + pac.dir.x * 3.5);
      ctx.stroke();
    }
  }

  // Personagem com foto carregada → quadro com a imagem
  if (game.picLoaded && game.playerPic) {
    drawPhotoPanel(px, py, game.state === "dying" ? game.dyingT / 1.9 : 0);
    return;
  }

  ctx.save();
  ctx.translate(px, py);
  const sq = Math.sin(pac.mouthT * 10);
  ctx.scale(1 + 0.055 * sq, 1 - 0.055 * sq);
  ctx.rotate(Math.sin(pac.mouthT * 6) * 0.05);
  const ang = Math.atan2(pac.dir.y, pac.dir.x);
  const mouth = 0.12 + 0.32 * (0.5 + 0.5 * Math.sin(pac.mouthT * 9));
  ctx.shadowColor = "rgba(255,205,60,0.85)";
  ctx.shadowBlur = 16;
  const grad = ctx.createRadialGradient(-3, -3.6, 1, 0, 0, 9);
  grad.addColorStop(0, "#fffae0");
  grad.addColorStop(0.45, "#ffd43b");
  grad.addColorStop(0.85, "#ffab18");
  grad.addColorStop(1, "#e08a10");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, 8.2, ang + mouth, ang - mouth);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(120,58,10,0.88)";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, 7.8, ang + mouth * 0.75, ang - mouth * 0.75, true);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.beginPath(); ctx.ellipse(-2.8, -3.8, 2.5, 1.7, -0.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/* Quadro com a foto do jogador no lugar do Pac-Man redondo */
function drawPhotoPanel(px, py, deadT) {
  const S = 20;
  ctx.save();
  ctx.translate(px, py);
  if (deadT > 0) {
    const t = Math.min(1, Math.max(0, deadT));
    const k = 1 - t;
    if (k <= 0.01) { ctx.restore(); return; }
    ctx.rotate(t * 2.6);
    ctx.globalAlpha = Math.max(0.15, 1 - t);
    photoSquare(S * k);
  } else {
    photoSquare(S);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}
function photoSquare(S) {
  const x = -S / 2, y = -S / 2;
  ctx.shadowColor = game.sprintT > 0 ? "rgba(125,232,255,0.9)" : "rgba(255,210,74,0.75)";
  ctx.shadowBlur = 12;
  rrPath(x - 2, y - 2, S + 4, S + 4, 5, ctx);
  ctx.fillStyle = "rgba(255,225,140,0.22)";
  ctx.fill();
  ctx.shadowBlur = 0;
  if (game.playerPic) {
    ctx.save();
    rrPath(x, y, S, S, 4, ctx);
    ctx.clip();
    const img = game.playerPic;
    const saR = img.width / img.height;
    let dw = S, dh = S, dx = x, dy = y;
    if (saR > 1) { dw = S * saR; dx = x - (dw - S) / 2; }
    else { dh = S / saR; dy = y - (dh - S) * 0.18; }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, dx, dy, dw, dh);
    if (game.deathFlashT > 0) {
      const blink = 0.5 + 0.5 * Math.sin(performance.now() / 55);
      ctx.fillStyle = "rgba(255,28,28," + (0.18 + 0.55 * blink).toFixed(3) + ")";
      ctx.fillRect(x, y, S, S);
    }
    ctx.restore();
  }
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 1;
  rrPath(x + 1, y + 1, S - 2, S - 2, 3, ctx);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,205,80,0.95)";
  ctx.lineWidth = 2;
  rrPath(x, y, S, S, 4, ctx);
  ctx.stroke();
  const sa = Math.atan2(pac.dir.y, pac.dir.x);
  ctx.save();
  ctx.translate(Math.cos(sa) * (S / 2 + 1.5), Math.sin(sa) * (S / 2 + 1.5));
  ctx.rotate(sa);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.moveTo(4.5, 0); ctx.lineTo(-2, -3); ctx.lineTo(-2, 3); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawGhostBody(x, y, color, topColor) {  const w = 15, h = 13;
  const grad = ctx.createLinearGradient(0, y - h * 0.7, 0, y + h / 2);
  grad.addColorStop(0, topColor || mixHex(color, 0.5));
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y + h / 2 - 1);
  ctx.lineTo(x - w / 2, y - h * 0.15);
  ctx.arc(x, y - h * 0.15, w / 2, Math.PI, 0);
  ctx.lineTo(x + w / 2, y + h / 2 - 1);
  ctx.lineTo(x + w / 2 - 2.5, y + h / 2 - 2);
  ctx.quadraticCurveTo(x + w / 2 - 2.5, y + h / 2 + 3, x + w / 2 - 5, y + h / 2 - 1);
  ctx.lineTo(x + w / 2 - 7.5, y + h / 2 - 2);
  ctx.quadraticCurveTo(x + w / 2 - 7.5, y + h / 2 + 3, x + w / 2 - 10, y + h / 2 - 1);
  ctx.lineTo(x - w / 2 + 2.5, y + h / 2 - 2);
  ctx.quadraticCurveTo(x - w / 2 + 2.5, y + h / 2 + 3, x - w / 2, y + h / 2 - 1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.30)";
  ctx.beginPath(); ctx.ellipse(x - 3, y - 2.6, 3.4, 2.2, -0.4, 0, Math.PI * 2); ctx.fill();
}
function drawGhostEyes(g, x, y) {
  const lx = g.dir.x * 1.6, ly = g.dir.y * 1.6;
  const bl = Math.abs(((g.id + g.bobT * 0.9) % 3.0) - 1.5) < 0.15 ? 0.12 : 1;
  const ey = 4 * bl;
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.ellipse(x - 4.4, y - 1.5, 3.4, Math.max(0.5, ey), 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 4.4, y - 1.5, 3.4, Math.max(0.5, ey), 0, 0, Math.PI * 2); ctx.fill();
  if (bl > 0.5) {
    ctx.fillStyle = "#2a6cff";
    ctx.beginPath(); ctx.arc(x - 4.4 + lx, y - 1.5 + ly, 1.9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 4.4 + lx, y - 1.5 + ly, 1.9, 0, Math.PI * 2); ctx.fill();
  }
}
function drawGhost(g) {
  const bob = g.state === "waiting" ? Math.sin(g.bobT * 3) * 1.5 : 0;
  const x = g.x * TILE, y = g.y * TILE + bob;
  if (g.state === "eyes") {
    const lx = g.dir.x * 1.9, ly = g.dir.y * 1.9;
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(x - 3.5, y, 2.7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 3.5, y, 2.7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#2a6cff";
    ctx.beginPath(); ctx.arc(x - 3.5 + lx, y + ly, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 3.5 + lx, y + ly, 1.5, 0, Math.PI * 2); ctx.fill();
    return;
  }
  if (g.state === "waiting") {
    ctx.save();
    ctx.beginPath(); ctx.rect(x - 9, y - 9, 18, 13); ctx.clip();
    drawGhostBody(x, y, GHOST_INFO[g.id].color);
    drawGhostEyes(g, x, y);
    ctx.restore();
    return;
  }
  if (g.state === "fright") {
    const flash = game.frightT < 2.5 && Math.floor(game.globalTimer * 9) % 2 === 0;
    const base = flash ? "#eaf2ff" : "#2b3df0";
    drawShadow(x, y + 6, 7, 2.8, 0.35);
    drawGhostBody(x, y, base, flash ? "#ffffff" : "#5a6bff");
    return;
  }
  drawShadow(x, y + 6, 7, 2.8, 0.35);
  ctx.shadowColor = rgba(GHOST_INFO[g.id].glow, 0.7);
  ctx.shadowBlur = 10;
  drawGhostBody(x, y, GHOST_INFO[g.id].color);
  ctx.shadowBlur = 0;
  drawGhostEyes(g, x, y);
}

function drawFruitEntity(f) {
  const x = f.x * TILE, y = f.y * TILE;
  const bob = Math.sin(f.walkT * 6) * 1.6;
  drawShadow(x, y + 5 + bob, 5.4, 2.2, 0.38);

  if (f.type === "cherry") {
    // duas cerejas ligadas
    ctx.shadowColor = "rgba(255,47,94,0.85)";
    ctx.shadowBlur = 10;
    for (const sx of [-2.6, 2.6]) {
      const g2 = ctx.createRadialGradient(x + sx - 1, y - 2 + bob, 1, x + sx, y + bob, 4.2);
      g2.addColorStop(0, "#ff8aa8");
      g2.addColorStop(1, "#e01040");
      ctx.fillStyle = g2;
      ctx.beginPath(); ctx.arc(x + sx, y + 1.5 + bob, 3.4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#2fbb4f"; ctx.lineWidth = 1.4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x - 2.2, y - 1.6 + bob); ctx.quadraticCurveTo(x - 1, y - 6 + bob, x, y - 5 + bob); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 2.2, y - 1.6 + bob); ctx.quadraticCurveTo(x + 1, y - 6 + bob, x, y - 5 + bob); ctx.stroke();
    ctx.fillStyle = "#3fd463";
    ctx.beginPath(); ctx.ellipse(x + 1, y - 5 + bob, 1.6, 0.9, 0.5, 0, Math.PI * 2); ctx.fill();
    return;
  }
  if (f.type === "apple") {
    // maçã verde
    ctx.shadowColor = "rgba(111,224,138,0.85)";
    ctx.shadowBlur = 10;
    const g2 = ctx.createRadialGradient(x - 1.6, y - 3.4 + bob, 1, x, y + bob, 5);
    g2.addColorStop(0, "#e0ffc0");
    g2.addColorStop(0.5, "#7fdd63");
    g2.addColorStop(1, "#3f9e43");
    ctx.fillStyle = g2;
    ctx.beginPath(); ctx.arc(x, y + 0.5 + bob, 4.2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#7a4a2b"; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x, y - 3.6 + bob); ctx.lineTo(x + 0.4, y - 6 + bob); ctx.stroke();
    ctx.fillStyle = "#3fd463";
    ctx.beginPath(); ctx.ellipse(x + 1.6, y - 5.6 + bob, 2, 1, 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath(); ctx.ellipse(x - 1.8, y - 1.4 + bob, 1.3, 0.8, -0.5, 0, Math.PI * 2); ctx.fill();
    return;
  }
  // morango
  ctx.shadowColor = "rgba(255,90,130,0.85)";
  ctx.shadowBlur = 12;
  const grad = ctx.createRadialGradient(x - 2, y - 3.5 + bob, 1, x, y + bob, 6);
  grad.addColorStop(0, "#ffd7e2");
  grad.addColorStop(0.45, "#ff4d7e");
  grad.addColorStop(1, "#d8124a");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x, y - 5 + bob);
  ctx.bezierCurveTo(x + 6, y - 3 + bob, x + 5, y + 4 + bob, x, y + 5.5 + bob);
  ctx.bezierCurveTo(x - 5, y + 4 + bob, x - 6, y - 3 + bob, x, y - 5 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath(); ctx.ellipse(x - 1.8, y - 2.5 + bob, 1.5, 0.9, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,220,140,0.9)";
  [[-1.5, 0.5], [1.6, 1.2], [-0.3, 2.2], [2.3, -1.5], [-2.6, -0.8]].forEach(([dx, dy]) => {
    ctx.beginPath(); ctx.arc(x + dx, y + dy + bob, 0.6, 0, Math.PI * 2); ctx.fill();
  });
  ctx.strokeStyle = "#2fbb4f"; ctx.lineWidth = 1.5; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x - 0.5, y - 4.4 + bob); ctx.quadraticCurveTo(x - 1.5, y - 8 + bob, x + 0.5, y - 7 + bob); ctx.stroke();
  ctx.fillStyle = "#3fd463";
  ctx.beginPath(); ctx.ellipse(x + 1.2, y - 7 + bob, 2.1, 1.1, 0.6, 0, Math.PI * 2); ctx.fill();
}

function drawItem() {
  if (!game.item) return;
  const it = game.item;
  const x = it.x * TILE, y = it.y * TILE;
  const span = 1 - Math.max(0, it.t / ITEM_LIFE); // fim de vida
  const pulse = 0.5 + 0.5 * Math.sin(game.globalTimer * 5);
  const R = 5 + 0.6 * pulse;
  drawShadow(x, y + 6, 6.5, 2.6, 0.4);
  // anel pulsante
  ctx.strokeStyle = rgba(it.color, 0.4 + 0.4 * pulse);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, R + 3 + (1 - pulse) * 3, 0, Math.PI * 2); ctx.stroke();
  if (span < 0.8) {
    ctx.globalAlpha = Math.max(0, 1 - (span / 0.2));
    ctx.beginPath(); ctx.arc(x, y, (span) * 30, 0, Math.PI * 2); ctx.fillStyle = rgba(it.color, 0.15); ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.shadowColor = rgba(it.color, 0.9);
  ctx.shadowBlur = 12;
  const grad = ctx.createRadialGradient(x - 2, y - 2.5, 1, x, y, R + 1);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.4, it.color);
  grad.addColorStop(1, rgba(it.color, 0.7));
  ctx.fillStyle = grad;
  ctx.beginPath();
  // estrela de 4 pontas
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + game.globalTimer * 0.4;
    const rr = i % 2 === 0 ? R + 2 : R * 0.42;
    const sx = x + Math.cos(a) * rr;
    const sy = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawBombs() {
  for (const b of game.bombs) {
    const x = b.x * TILE, y = b.y * TILE;
    const bl = 0.5 + 0.5 * Math.sin(b.t * 7);
    drawShadow(x, y + 6.5, 5.5, 2.4, 0.42);
    const grad = ctx.createRadialGradient(x - 1.5, y - 1.5, 1, x, y, 4.6);
    grad.addColorStop(0, "#5f5f74");
    grad.addColorStop(1, "#17172a");
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y + 1, 4.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,80,80," + (0.4 + 0.5 * bl).toFixed(2) + ")";
    ctx.beginPath(); ctx.arc(x, y - 2, 1.6 + 0.5 * bl, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#3a3a55"; ctx.lineWidth = 1.6;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * 3.2, y + 1 + Math.sin(a) * 3.2);
      ctx.lineTo(x + Math.cos(a) * 5.2, y + 1 + Math.sin(a) * 5.2);
      ctx.stroke();
    }
  }
}

function drawMissile() {
  if (!game.missile) return;
  const m = game.missile;
  const x = m.x * TILE, y = m.y * TILE;
  const ang = Math.atan2(m.dir.y, m.dir.x);
  const pulse = 0.5 + 0.5 * Math.sin(m.walkT * 10);
  drawShadow(x, y + 4, 6.5, 2.6, 0.42);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  // aura pulsante
  ctx.fillStyle = "rgba(140,225,255," + (0.12 + 0.10 * pulse).toFixed(3) + ")";
  ctx.beginPath(); ctx.arc(0, 0, 9 + 2 * pulse, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(205,245,255," + (0.35 + 0.45 * pulse).toFixed(2) + ")";
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, 0, 7 + 3 * pulse, 0, Math.PI * 2); ctx.stroke();
  ctx.shadowColor = "rgba(140,225,255,0.95)";
  ctx.shadowBlur = 12;
  // corpo claro em gradiente
  const grad = ctx.createLinearGradient(-10, 0, 6, 0);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.5, "#8fd6ff");
  grad.addColorStop(1, "#3f8dff");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(7.5, 0);
  ctx.lineTo(2, -3.4);
  ctx.lineTo(-8, -3.4);
  ctx.lineTo(-10.5, 0);
  ctx.lineTo(-8, 3.4);
  ctx.lineTo(2, 3.4);
  ctx.closePath();
  ctx.fill();
  // riscas vivas no corpo
  ctx.fillStyle = "#fff";
  ctx.fillRect(-8, -2.4, 2.6, 4.8);
  // nariz vermelho vivo + barbatanas
  ctx.fillStyle = "#ff4d6d";
  ctx.beginPath(); ctx.moveTo(7.5, 0); ctx.lineTo(2, -3); ctx.lineTo(2, 3); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-1.5, 0); ctx.lineTo(-6, -5); ctx.lineTo(-7.5, 0); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-1.5, 0); ctx.lineTo(-6, 5); ctx.lineTo(-7.5, 0); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  // chama pulsante
  const fl = (3 + 4 * pulse);
  const fgrad = ctx.createLinearGradient(-10.5, 0, -10.5 - fl * 2, 0);
  fgrad.addColorStop(0, "#fff3b0");
  fgrad.addColorStop(0.6, "#ffb84d");
  fgrad.addColorStop(1, "rgba(255,120,60,0)");
  ctx.fillStyle = fgrad;
  ctx.beginPath();
  ctx.moveTo(-10.5, -2.4);
  ctx.lineTo(-10.5 - fl * 2, 0);
  ctx.lineTo(-10.5, 2.4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMonster() {
  if (!game.monster) return;
  const m = game.monster;
  const x = m.x * TILE, y = m.y * TILE;
  const pulse = 0.5 + 0.5 * Math.sin(m.walkT * 8);
  const sad = game.frightT > 0;
  drawShadow(x, y + 6, 8, 3, 0.45);
  ctx.strokeStyle = "rgba(255,60,90," + (0.5 + 0.4 * pulse).toFixed(2) + ")";
  ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.arc(x, y, 9 + pulse * 3, 0, Math.PI * 2); ctx.stroke();
  ctx.shadowColor = "rgba(255,60,90,0.85)";
  ctx.shadowBlur = 14;
  const grad = ctx.createRadialGradient(x - 2, y - 3, 2, x, y, 9);
  grad.addColorStop(0, sad ? "#7d8bff" : "#ff3a55");
  grad.addColorStop(1, sad ? "#2b3df0" : "#8f0e28");
  ctx.fillStyle = grad;
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI) / 8;
    const rr = (i % 2 === 0 ? 8.5 : 6.2);
    const px = x + Math.cos(angle) * rr;
    const py = y + Math.sin(angle) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  const ex = sad ? 3 : 5, ey = sad ? 4 : 6;
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(x - ex, y - ey, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + ex, y - ey, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#220";
  ctx.beginPath(); ctx.arc(x - ex - 0.5, y - ey + 0.3, 1.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + ex + 0.5, y - ey + 0.3, 1.1, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(x - 3.5, y + 3);
  for (let i = 0; i <= 4; i++) {
    const sx = x - 3.5 + i * 1.75;
    ctx.lineTo(sx, y + 3 + (i % 2 ? -1.4 : 1.4));
  }
  ctx.stroke();
  ctx.font = "900 11px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ff5470";
  ctx.fillText("!", x, y - 11 - pulse * 1.5);
}

const TWINKLE = (function () {
  const a = [];
  let s = 31337;
  for (let i = 0; i < 18; i++) {
    s = (s * 16807) % 2147483647; const x = s % COLS;
    s = (s * 16807) % 2147483647; const y = (s % (ROWS - 2)) + 1;
    s = (s * 16807) % 2147483647;
    a.push({ x, y, ph: i * 1.7, size: 0.8 + ((s % 10) / 10) * 1.4 });
  }
  return a;
})();

function drawProjectiles() {
  for (const p of game.projectiles) {
    const x = p.x * TILE, y = p.y * TILE;
    const ang = Math.atan2(p.dir.y, p.dir.x);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.shadowColor = "rgba(130,210,255,0.95)";
    ctx.shadowBlur = 10;
    const grad = ctx.createLinearGradient(-16, 0, 3, 0);
    grad.addColorStop(0, "rgba(130,210,255,0)");
    grad.addColorStop(1, "#c2f2ff");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3.4;
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(0, 0); ctx.stroke();
    const core = ctx.createRadialGradient(-1, 0, 0.3, 0, 0, 3.4);
    core.addColorStop(0, "#ffffff");
    core.addColorStop(1, "#5fd4ff");
    ctx.fillStyle = core;
    ctx.beginPath(); ctx.arc(0, 0, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

function drawFloating() {
  ctx.font = "700 13px 'Segoe UI', system-ui, sans-serif";
  ctx.textAlign = "center";
  for (const f of game.floating) {
    const a = Math.max(0, Math.min(1, f.t / 0.4));
    ctx.globalAlpha = a;
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.strokeText(f.text, f.x * TILE, (f.y - 0.6) * TILE);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x * TILE, (f.y - 0.6) * TILE);
  }
  ctx.globalAlpha = 1;
}
function drawSpeech() {
  const s = game.speech;
  if (!s || s.t <= 0) return;
  const text = s.text;
  const ax = pac.x * TILE;
  const ay = pac.y * TILE - 2;
  const maxText = 138;
  ctx.save();
  ctx.font = "700 11px 'Trebuchet MS', 'Segoe UI', system-ui, sans-serif";
  const words = String(text).split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (line && ctx.measureText(test).width > maxText) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  let tw = 0;
  for (const l of lines) tw = Math.max(tw, ctx.measureText(l).width);
  const w = Math.ceil(tw) + 14;
  const h = lines.length * 13 + 10;

  // coloca o balão atrás do personagem (não tapa o caminho à frente)
  const gap = 14;
  let bx, by;
  if (pac.dir.x > 0) { bx = ax - gap - w; by = ay - h / 2; }
  else if (pac.dir.x < 0) { bx = ax + gap; by = ay - h / 2; }
  else if (pac.dir.y < 0) { bx = ax - w / 2; by = ay + gap; }
  else { bx = ax - w / 2; by = ay - gap - h; } // baixo (ou parado): acima
  bx = Math.max(4, Math.min(canvas.width - w - 4, bx));
  by = Math.max(4, Math.min(canvas.height - h - 4, by));

  const alpha = Math.min(1, s.t / 0.3);
  ctx.globalAlpha = alpha;

  // rabicho aponta para o bordo mais próximo do personagem
  const bubbleCx = bx + w / 2, bubbleCy = by + h / 2;
  const dx = ax - bubbleCx, dy = ay - bubbleCy;
  ctx.beginPath();
  if (Math.abs(dx) > Math.abs(dy) * 1.2) {
    const edgeX = dx > 0 ? bx + w : bx;
    const edgeY = Math.max(by + 8, Math.min(by + h - 8, ay));
    const tipX = dx > 0 ? ax - 9 : ax + 9;
    ctx.moveTo(edgeX, edgeY - 5);
    ctx.lineTo(edgeX, edgeY + 5);
    ctx.lineTo(tipX, ay);
  } else {
    const edgeY = dy > 0 ? by + h : by;
    const edgeX = Math.max(bx + 10, Math.min(bx + w - 10, ax));
    const tipY = dy > 0 ? ay - 9 : ay + 9;
    ctx.moveTo(edgeX - 5, edgeY);
    ctx.lineTo(edgeX + 5, edgeY);
    ctx.lineTo(ax, tipY);
  }
  ctx.closePath();
  ctx.fillStyle = "rgba(255,252,240,0.98)";
  ctx.fill();
  ctx.strokeStyle = "#1a2050";
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // corpo
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 8;
  rrPath(bx, by, w, h, 8, ctx);
  ctx.fillStyle = "rgba(255,252,240,0.98)";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#1a2050";
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // texto
  ctx.fillStyle = "#121736";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], bx + 7, by + 5 + i * 13);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
}

function drawMessages() {
  ctx.textAlign = "center";
  const font700 = "800 26px 'Segoe UI', system-ui, sans-serif";
  const fontSub = "600 14px 'Segoe UI', system-ui, sans-serif";
  if (game.state === "ready") {
    ctx.font = fontSub;
    ctx.fillStyle = "#a8c4ff";
    ctx.fillText("NÍVEL " + game.level, COLS * TILE / 2, 12.4 * TILE);
    ctx.shadowColor = "rgba(255,210,74,0.85)";
    ctx.shadowBlur = 14;
    ctx.font = font700;
    ctx.fillStyle = "#ffd24a";
    ctx.fillText("PREPARA-TE!", COLS * TILE / 2, 14 * TILE);
    ctx.shadowBlur = 0;
  } else if (game.state === "levelClear") {
    ctx.shadowColor = "rgba(125,255,176,0.85)";
    ctx.shadowBlur = 14;
    ctx.font = font700;
    ctx.fillStyle = "#7dffb0";
    ctx.fillText("NÍVEL COMPLETO!", COLS * TILE / 2, 13 * TILE);
    ctx.shadowBlur = 0;
    ctx.font = fontSub;
    ctx.fillStyle = "#a8c4ff";
    ctx.fillText("Bónus +" + (1000 + game.level * 100), COLS * TILE / 2, 14 * TILE);
  }
}
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!game.wallCanvas) return;
  const pulseA = 0.05 + 0.03 * (0.5 + 0.5 * Math.sin(game.globalTimer * 1.4));
  const light = ctx.createRadialGradient(canvas.width / 2, canvas.height * 0.45, 40, canvas.width / 2, canvas.height * 0.45, canvas.height * 0.7);
  light.addColorStop(0, "rgba(120,160,255," + pulseA.toFixed(3) + ")");
  light.addColorStop(1, "rgba(120,160,255,0)");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(game.wallCanvas, 0, 0);
  for (const st of TWINKLE) {
    const al = 0.04 + 0.07 * (0.5 + 0.5 * Math.sin(game.globalTimer * 2 + st.ph));
    ctx.fillStyle = "rgba(215,228,255," + al.toFixed(3) + ")";
    ctx.beginPath(); ctx.arc((st.x + 0.5) * TILE, (st.y + 0.5) * TILE, st.size, 0, Math.PI * 2); ctx.fill();
  }
  drawPellets();
  drawHousePhoto();
  for (const f of game.fruits) drawFruitEntity(f);
  drawItem();
  for (const g of ghosts) drawGhost(g);
  if (game.state !== "gameover" && game.state !== "complete") drawPacman();
  drawSpeech();
  drawBombs();
  drawMissile();
  drawMonster();
  drawProjectiles();
  drawParticles();
  drawFloating();
  drawMessages();
}

/* ------------------------- Loop (fixed timestep) ------------------------- */
let lastT = performance.now();
let acc = 0;
const STEP = 1 / 60;
function loop(now) {
  try {
    let raw = (now - lastT) / 1000;
    lastT = now;
    if (raw > 0.25) raw = 0.25;
    acc += raw;
    while (acc >= STEP) {
      update(STEP);
      acc -= STEP;
      if (game.paused) { acc = 0; break; }
    }
    draw();
  } catch (err) {
    // nunca deixa o jogo congelar por um erro num frame
    console.error("PAC-JHOW frame error:", err);
  }
  requestAnimationFrame(loop);
}

/* ------------------------------ Boot ------------------------------------- */
window.addEventListener("load", () => {
  game.grid = window.buildGrid();
  game.tunnelRowH = window.CLASSIC_TUN;
  game.dotsTotal = window.countPelletsOnGrid(game.grid);
  game.wallCanvas = renderWallCanvas();
  pac.x = window.PACMAN_START.x; pac.y = window.PACMAN_START.y;
  const spawns = window.GHOST_SPAWNS;
  for (let i = 0; i < ghosts.length; i++) {
    ghosts[i].x = spawns[i].c + 0.5;
    ghosts[i].y = spawns[i].r + 0.5;
    ghosts[i].state = "waiting";
    ghosts[i].dir = { x: 0, y: -1 };
  }
  try { game.highscore = Math.max(0, ...loadScores().map((e) => e.score || 0)); } catch (e) {}
  elHigh.textContent = game.highscore.toLocaleString("pt-PT");
  elLives.innerHTML = "";
  elLevel.textContent = "1";
  updateAmmo();
  updateBombs();
  updateTitleButtons();
  restorePhoto();
  restoreCustomMusic();
  initVolumeUI();
  AudioSys.lock();
  if (!savedMusic || !savedMusic.active) AudioSys.playTrack(0);
  syncMusicUI();
  showOverlay("ov-title");
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    try {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    } catch (e) {}
  }
  requestAnimationFrame(loop);
});
