/* =========================================================================
 * Pac-Man (Móvel Studio) — Labirintos
 * -------------------------------------------------------------------------
 * Legendas:
 *   '#'  : parede (bloqueia todos)
 *   '.'  : pílula / ponto (10 pts)
 *   'o'  : pílula de energia (50 pts, deixa os fantasmas vulneráveis)
 *   ' '  : caminho livre (inclui o túnel e o interior da casa dos fantasmas)
 *   '-'  : porta da casa dos fantasmas (só os fantasmas atravessam)
 *
 * O nível 1 usa o labirinto clássico (28x31). Os níveis seguintes usam um
 * labirinto diferente gerado proceduralmente (semente = nível), sempre
 * conectado, com casa dos fantasmas e túnel funcionais.
 * =========================================================================
 */
"use strict";

const MAZE_ROWS = [
  "############    ############",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#o####.#####.##.#####.####o#",
  "#.####.#####.##.#####.####.#",
  "#..........................#",
  "#.####.##.########.##.####.#",
  "#.####.##.########.##.####.#",
  "#......##....##....##......#",
  "######.##### ## #####.######",
  "######.##### ## #####.######",
  "######.##          ##.######",
  "######.## ###--### ##.######",
  "######.## #      # ##.######",
  "      .   #      #   .      ",
  "######.## #      # ##.######",
  "######.## ######## ##.######",
  "######.##          ##.######",
  "######.## ######## ##.######",
  "######.##          ##.######",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#.####.#####.##.#####.####.#",
  "#o..##.......  .......##..o#",
  "###.##.##.########.##.##.###",
  "###.##.##.########.##.##.###",
  "#......##....##....##......#",
  "#.##########.##.##########.#",
  "#.##########.##.##########.#",
  "#..........................#",
  "############    ############"
];
/* Nota: teletransporte vertical NUMA passagem central (colunas 12-15 no
   topo e no fundo); o resto do topo/fundo é parede. A linha 14 é o túnel
   horizontal (laterais). */

const MAZE_COLS = MAZE_ROWS[0].length; // 28
const MAZE_ROWS_N = MAZE_ROWS.length;  // 31
const CLASSIC_TUN = 14;                // túnel horizontal do clássico
const GEN_TUN = 16;                    // túnel horizontal dos gerados

/* Posições centrais fixas (coordenadas em "tiles" — ver game.js) */
const PACMAN_START   = { x: 13.5, y: 23.5 };
const GHOST_HOME     = { c: 13, r: 11 };     // célula mesmo acima da porta
const DOOR_TILE_A    = { c: 13, r: 12 };     // piso da porta (esquerdo)
const DOOR_TILE_B    = { c: 14, r: 12 };     // piso da porta (direito)
const FRUIT_TILE     = { x: 13.5, y: 23.5 };
const GHOST_SPAWNS   = [
  { c: 13, r: 11 }, // Blinky — logo acima da porta (sai de imediato)
  { c: 13, r: 14 }, // Pinky  — centro da casa
  { c: 12, r: 14 }, // Inky   — esquerda da casa
  { c: 16, r: 14 }  // Clyde  — direita da casa
];

/* -------------------------------------------------------------------------
 * Grelha internável: cria a matriz 2D editável a partir do labirinto dado.
 * ------------------------------------------------------------------------- */
function buildGridFromRows(rows) {
  const grid = [];
  for (let r = 0; r < rows.length; r++) grid.push(rows[r].split(""));
  return grid;
}
function buildGrid() {
  return buildGridFromRows(MAZE_ROWS);
}

/* Linha do túnel horizontal (lados). Ignora o topo/fundo (corredores verticais). */
function findTunnelRow(grid) {
  const last = grid.length - 1;
  for (let r = 0; r < grid.length; r++) {
    if (r === 0 || r === last) continue;
    if (grid[r][0] !== "#") return r;
  }
  return 14;
}

/* -------------------------------------------------------------------------
 * Grelhas
 * ------------------------------------------------------------------------- */
function inBounds(c, r, grid) {
  const H = grid.length, W = grid[0].length;
  return c >= 0 && c < W && r >= 0 && r < H;
}

/* Sólida para um dado agente. A porta ('-') só é sólida para o Pac-Man.
 * Teletransportes: a linha do túnel liga os lados; o topo e o fundo (linhas
 * 0 e H-1, sempre corredores abertos) ligam em cima/baixo.
 */
function isSolid(c, r, forGhost, grid) {
  const g = grid || MAZE_ROWS;
  if (!inBounds(c, r, g)) {
    if (r < 0 || r >= g.length) return !(c >= 12 && c <= 15); // vertical: só no corredor central
    return r !== findTunnelRow(g);                             // lateral: só no túnel horizontal
  }
  const ch = g[r][c];
  if (ch === "#") return true;
  if (ch === "-") return !forGhost;
  return false;
}

function countPelletsOnGrid(grid) {
  let n = 0;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const ch = grid[r][c];
      if (ch === "." || ch === "o") n++;
    }
  }
  return n;
}

/* -------------------------------------------------------------------------
 * Gerador de labirintos (procedural, determinístico por semente)
 * ------------------------------------------------------------------------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GEN_COLS = 28, GEN_ROWS = 31;

/* Mantém o labirinto ligado depois de fechar a casa dos fantasmas */
function repairConnectivity(g, W, H, sc, sr) {
  const inHouse = (c, r) => c >= 11 && c <= 16 && r >= 13 && r <= 15;
  const inDoor = (c, r) => r === 12 && (c === 13 || c === 14);
  const inRing = (c, r) =>
    ((r === 12 || r === 16) && c >= 10 && c <= 17) ||
    ((c === 10 || c === 17) && r >= 12 && r <= 16);
  const reachable = () => {
    const seen = new Set([sc + "," + sr]);
    const q = [[sc, sr]];
    while (q.length) {
      const [c, r] = q.shift();
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = c + dc, nr = r + dr;
        if (nc < 0 || nc >= W || nr < 0 || nr >= H) continue;
        if (g[nr][nc] === "#" || g[nr][nc] === "-") continue;
        if (inHouse(nc, nr)) continue;
        const k = nc + "," + nr;
        if (seen.has(k)) continue;
        seen.add(k); q.push([nc, nr]);
      }
    }
    return seen;
  };

  for (let pass = 0; pass < 8; pass++) {
    const seen = reachable();
    const lost = [];
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        if (g[r][c] === "#" || g[r][c] === "-") continue;
        if (inHouse(c, r)) continue;
        if (!seen.has(c + "," + r)) lost.push([c, r]);
      }
    }
    if (!lost.length) return;

    for (const [lc, lr] of lost) {
      // Dijkstra 0-1: abrir paredes custa 1, andar em corredor custa 0.
      const dist = Array.from({ length: H }, () => new Array(W).fill(Infinity));
      const prev = Array.from({ length: H }, () => new Array(W).fill(null));
      const dq = [[lc, lr]];
      dist[lr][lc] = 0;
      let target = null;
      while (dq.length) {
        const [c, r] = dq.shift();
        if (seen.has(c + "," + r)) { target = [c, r]; break; }
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nc = c + dc, nr = r + dr;
          if (nc < 0 || nc >= W || nr < 0 || nr >= H) continue;
          if (inHouse(nc, nr) || inDoor(nc, nr) || inRing(nc, nr)) continue;
          const w = g[nr][nc] === "#" ? 1 : 0;
          const nd = dist[r][c] + w;
          if (nd < dist[nr][nc]) {
            dist[nr][nc] = nd;
            prev[nr][nc] = [c, r];
            if (w === 0) dq.unshift([nc, nr]); else dq.push([nc, nr]);
          }
        }
      }
      if (!target) continue;
      let cur = target;
      while (cur) {
        const [c, r] = cur;
        if (g[r][c] === "#") g[r][c] = " ";
        cur = prev[r][c];
      }
    }
  }
}

function generateMaze(seed) {  const rng = mulberry32((seed * 2654435761 + 1234567) >>> 0 || 1);
  const W = GEN_COLS, H = GEN_ROWS, TUN = GEN_TUN;
  const g = [];
  for (let r = 0; r < H; r++) g.push(new Array(W).fill("#"));

  const inHouse = (c, r) => c >= 11 && c <= 16 && r >= 12 && r <= 15;
  const pacCell = (c, r) => c === 13 && r === 23;

  // --- casa dos fantasmas -------------------------------------------------
  for (let r = 13; r <= 15; r++) for (let c = 11; c <= 16; c++) g[r][c] = " ";
  g[12][13] = "-";
  g[12][14] = "-";

  // --- túnel (linha aberta de ponta a ponta) ------------------------------
  for (let c = 0; c < W; c++) g[TUN][c] = " ";
  // --- corredor vertical central (teletransporte cima↔baixo) --------------
  for (let c = 12; c <= 15; c++) { g[0][c] = " "; g[H - 1][c] = " "; }

  // --- nós do labirinto de corredores (células ímpares) -------------------
  const key = (c, r) => c + "," + r;
  function neighbors(c, r) {
    const out = [];
    const deltas = [[2, 0, "x"], [-2, 0, "x"], [0, 2, "y"], [0, -2, "y"]];
    for (const [dc, dr, ax] of deltas) {
      const nc = c + dc, nr = r + dr;
      const wc = ax === "x" ? c + dc / 2 : c;
      const wr = ax === "y" ? r + dr / 2 : r;
      if (nc < 1 || nc > W - 2 || nr < 1 || nr > H - 2) continue;
      if (inHouse(nc, nr) || inHouse(wc, wr)) continue; // casa intocável (só pela porta)
      out.push({ c: nc, r: nr, wc, wr });
    }
    // baralhar de forma determinística
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = out[i]; out[i] = out[j]; out[j] = t;
    }
    return out;
  }

  // DFS spanning tree → garante que tudo fica ligado
  g[1][1] = " "; // nó inicial aberto
  const start = { c: 1, r: 1 };
  const seen = new Set([key(1, 1)]);
  const stack = [start];
  while (stack.length) {
    const n = stack.pop();
    for (const nb of neighbors(n.c, n.r)) {
      if (seen.has(key(nb.c, nb.r))) continue;
      g[nb.r][nb.c] = " ";             // abrir o nó vizinho
      g[nb.wr][nb.wc] = " ";           // abrir a passagem entre nós
      seen.add(key(nb.c, nb.r));
      stack.push({ c: nb.c, r: nb.r });
    }
  }

  // laços adicionais → labirinto menos fechado (fluir melhor para o jogador)
  const opened = new Set();
  for (let r = 1; r < H - 1; r += 2) {
    for (let c = 1; c < W - 1; c += 2) {
      if (inHouse(c, r)) continue;
      for (const nb of neighbors(c, r)) {
        const wk = key(nb.wc, nb.wr);
        if (g[nb.wr][nb.wc] === " " || opened.has(wk)) continue;
        if (rng() < 0.30) { g[nb.wr][nb.wc] = " "; opened.add(wk); }
      }
    }
  }

  // --- casa dos fantasmas: quatro paredes e porta ao centro ---------------
  for (let c = 10; c <= 17; c++) { g[12][c] = "#"; g[16][c] = "#"; }
  for (let r = 12; r <= 16; r++) { g[r][10] = "#"; g[r][17] = "#"; }
  g[12][13] = "-";
  g[12][14] = "-";
  repairConnectivity(g, W, H, 13, 23);

  // --- posição do Pac-Man (13, 23) fica aberta ----------------------------
  g[23][13] = " ";

  // --- pílulas de energia (4, perto dos cantos) ---------------------------
  const anchors = [[3, 3], [23, 3], [3, 27], [23, 27]];
  const placed = new Set();
  for (const [ac, ar] of anchors) {
    outer:
    for (let d = 0; d < 30; d++) {
      for (let dc = -d; dc <= d; dc++) {
        for (let dr = -d; dr <= d; dr++) {
          const c = ac + dc, r = ar + dr;
          if (c < 1 || c > W - 2 || r < 1 || r > H - 2) continue;
          if (r === TUN) continue;
          if (inHouse(c, r) || pacCell(c, r) || placed.has(key(c, r))) continue;
          if (Math.abs(c - 13) + Math.abs(r - 23) < 6) continue; // longe do início
          if (g[r][c] === " " && g[r][c] !== "-") {
            g[r][c] = "o";
            placed.add(key(c, r));
            break outer;
          }
        }
      }
    }
  }

  // --- pílulas (pontos) em todos os caminhos, menos na casa ----------------
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      if (g[r][c] !== " ") continue;
      if (inHouse(c, r)) continue;
      if (pacCell(c, r)) continue;
      g[r][c] = ".";
    }
  }

  return g.map((row) => row.join(""));
}

/* Exportação para o navegador e para o Node (validação) */
if (typeof window !== "undefined") {
  window.MAZE_ROWS = MAZE_ROWS;
  window.MAZE_COLS = MAZE_COLS;
  window.MAZE_ROWS_N = MAZE_ROWS_N;
  window.CLASSIC_TUN = CLASSIC_TUN;
  window.GEN_TUN = GEN_TUN;
  window.buildGrid = buildGrid;
  window.buildGridFromRows = buildGridFromRows;
  window.findTunnelRow = findTunnelRow;
  window.inBounds = inBounds;
  window.isSolid = isSolid;
  window.countPelletsOnGrid = countPelletsOnGrid;
  window.generateMaze = generateMaze;
  window.PACMAN_START = PACMAN_START;
  window.GHOST_HOME = GHOST_HOME;
  window.DOOR_TILE_A = DOOR_TILE_A;
  window.DOOR_TILE_B = DOOR_TILE_B;
  window.FRUIT_TILE = FRUIT_TILE;
  window.GHOST_SPAWNS = GHOST_SPAWNS;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    MAZE_ROWS, MAZE_COLS, MAZE_ROWS_N, CLASSIC_TUN, GEN_TUN,
    buildGrid, buildGridFromRows, findTunnelRow,
    inBounds, isSolid, countPelletsOnGrid, generateMaze,
    PACMAN_START, GHOST_HOME, DOOR_TILE_A, DOOR_TILE_B,
    FRUIT_TILE, GHOST_SPAWNS
  };
}
