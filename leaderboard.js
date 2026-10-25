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
  refresh();
  setInterval(refresh, INTERVAL);
})();
