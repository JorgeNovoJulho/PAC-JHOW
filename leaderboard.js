/* PAC-JHOW — ranking mundial público, somente leitura.
 * O GitHub distribui o placar; a escrita requer um serviço seguro separado.
 * Nenhum token do GitHub deve ser incluído no jogo.
 */
"use strict";
(() => {
  const URL = "https://raw.githubusercontent.com/JorgeNovoJulho/PAC-JHOW/main/data/leaderboard.json";
  const TARGETS = ["global-hs-title", "global-hs-over"];
  const INTERVAL = 5 * 60 * 1000;
  const fmt = new Intl.NumberFormat("pt-BR");
  function line(message) {
    TARGETS.forEach(id => {
      const box = document.getElementById(id);
      if (box) box.textContent = message;
    });
  }
  function valid(entry) {
    return entry && typeof entry.name === "string" && entry.name.trim() &&
      Number.isSafeInteger(entry.score) && entry.score >= 0 &&
      Number.isInteger(entry.level) && entry.level >= 1 && entry.level <= 20;
  }
  function render(entries) {
    const top = entries.filter(valid).sort((a, b) => b.score - a.score).slice(0, 10);
    TARGETS.forEach(id => {
      const box = document.getElementById(id);
      if (!box) return;
      box.replaceChildren();
      if (!top.length) {
        box.textContent = "Nenhum recorde mundial publicado ainda.";
        return;
      }
      top.forEach((entry, index) => {
        const row = document.createElement("div");
        row.className = "hs-row" + (index === 0 ? " hs-first" : "");
        function span(css, value) {
          const el = document.createElement("span");
          el.className = css;
          el.textContent = value;
          row.appendChild(el);
        }
        span("hs-pos", (index + 1) + "º");
        span("hs-name", entry.name.slice(0, 24));
        span("hs-lvl", "Nv " + entry.level);
        span("hs-score", fmt.format(entry.score));
        box.appendChild(row);
      });
    });
  }
  async function refresh() {
    try {
      const response = await fetch(URL + "?t=" + Math.floor(Date.now() / INTERVAL), { cache: "no-store" });
      if (!response.ok) throw new Error("Ranking indisponível");
      const json = await response.json();
      if (!json || !Array.isArray(json.scores)) throw new Error("Formato inválido");
      render(json.scores);
    } catch (err) {
      line("Ranking mundial indisponível no momento. Os recordes locais continuam disponíveis.");
    }
  }

  // A URL é publicada separadamente para ativar o serviço sem republicar o instalador.
  const CONFIG_URL = "https://raw.githubusercontent.com/JorgeNovoJulho/PAC-JHOW/main/data/leaderboard-config.json";
  const QUEUE_KEY = "pac-jhow-pending-global-scores";
  let submissionUrl = null;
  function getQueue() {
    try { const q = JSON.parse(localStorage.getItem(QUEUE_KEY)); return Array.isArray(q) ? q.slice(0, 20) : []; }
    catch (_) { return []; }
  }
  function putQueue(q) { try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-20))); } catch (_) {} }
  function submit(name, score, level) {
    if (!Number.isSafeInteger(score) || score <= 0 || !Number.isInteger(level) || level < 1 || level > 20) return;
    const q = getQueue();
    q.push({id: crypto.randomUUID(), name: String(name).trim().slice(0, 12) || "Jogador", score, level});
    putQueue(q);
    flush();
  }
  let flushing = false;
  async function flush() {
    if (!submissionUrl || flushing) return;
    flushing = true;
    try {
      const q = getQueue();
      while(q.length) {
        const response = await fetch(submissionUrl, {
          method: "POST", headers: {"Content-Type":"application/json"},
          body: JSON.stringify(q[0])
        });
        if (!response.ok && response.status !== 409 && response.status !== 400) break;
        q.shift();
        putQueue(q);
      }
    } catch (_) { /* offline: retain queue */ }
    finally { flushing = false; }
  }
  async function loadConfig() {
    try {
      const response = await fetch(CONFIG_URL + "?t=" + Math.floor(Date.now()/INTERVAL), {cache:"no-store"});
      if (!response.ok) return;
      const cfg = await response.json();
      if (typeof cfg.submissionUrl === "string") {
        const url = new URL(cfg.submissionUrl);
        if (url.protocol === "https:" && url.pathname.endsWith("/scores")) submissionUrl = url.href;
      }
      await flush();
    } catch (_) { /* disabled or offline */ }
  }
  window.PAC_LEADERBOARD = Object.freeze({submit, refresh: () => refresh()});
  loadConfig();
  window.addEventListener("online", () => { loadConfig(); refresh(); });
  setInterval(() => { loadConfig(); }, INTERVAL);
  refresh();
  setInterval(refresh, INTERVAL);
})();
