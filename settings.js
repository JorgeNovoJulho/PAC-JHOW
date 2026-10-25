/* =========================================================================
 * PAC-JHOW — Opções e atualizações (versão instalada / Electron)
 * -------------------------------------------------------------------------
 * A área de opções funciona também no navegador, mas só a aplicação .exe
 * pode transferir e instalar atualizações.
 * ========================================================================= */
"use strict";

(function () {
  const desktop = window.PAC_DESKTOP || null;
  const isDesktop = !!(desktop && desktop.isDesktop);

  const overlay = document.getElementById("ov-settings");
  const btnSettings = document.getElementById("btn-settings");
  const btnClose = document.getElementById("btn-settings-close");
  const btnSave = document.getElementById("btn-settings-save");
  const btnCheck = document.getElementById("btn-update-check");
  const btnDownload = document.getElementById("btn-update-download");
  const btnInstall = document.getElementById("btn-update-install");
  const providerEl = document.getElementById("update-provider");
  const serverEl = document.getElementById("update-server");
  const repoEl = document.getElementById("update-repo");
  const serverBox = document.getElementById("update-server-box");
  const githubBox = document.getElementById("update-github-box");
  const autoEl = document.getElementById("update-auto");
  const versionEl = document.getElementById("settings-version");
  const statusEl = document.getElementById("update-status");
  const modeNote = document.getElementById("settings-mode-note");

  if (!overlay || !btnSettings) return;

  let pausedBySettings = false;
  let currentState = "idle";
  let lastVersion = "";

  function setStatus(text, kind) {
    if (!statusEl) return;
    statusEl.textContent = text || "—";
    statusEl.classList.toggle("ok", kind === "ok");
    statusEl.classList.toggle("err", kind === "err");
  }

  function applyProvider() {
    const provider = providerEl ? providerEl.value : "generic";
    if (serverBox) serverBox.hidden = provider !== "generic";
    if (githubBox) githubBox.hidden = provider !== "github";
  }

  function collectSettings() {
    return {
      updateProvider: providerEl ? providerEl.value : "generic",
      updateServer: serverEl ? serverEl.value.trim() : "",
      githubRepo: repoEl ? repoEl.value.trim() : "",
      autoCheck: !!(autoEl && autoEl.checked)
    };
  }

  function fillSettings(s) {
    if (!s) return;
    if (providerEl) providerEl.value = s.updateProvider === "github" ? "github" : "generic";
    if (serverEl) serverEl.value = s.updateServer || "http://127.0.0.1:8787/";
    if (repoEl) repoEl.value = s.githubRepo || "JorgeNovoJulho/PAC-JHOW";
    if (autoEl) autoEl.checked = s.autoCheck !== false;
    applyProvider();
  }

  function updateBadge(on) {
    if (btnSettings) btnSettings.classList.toggle("update-available", !!on);
    btnSettings.title = on ? "Atualização disponível — abre as Opções" : "Opções e atualizações";
  }

  function renderUpdateState(data) {
    if (!data || !data.state) return;
    currentState = data.state;
    if (data.version) lastVersion = data.version;

    if (data.state === "checking") {
      setStatus("A procurar atualizações...");
      if (btnDownload) btnDownload.hidden = true;
      if (btnInstall) btnInstall.hidden = true;
      return;
    }
    if (data.state === "available") {
      setStatus("Nova versão " + (lastVersion ? "v" + lastVersion : "") + " disponível. Transferência automática iniciada.", "ok");
      if (btnDownload) btnDownload.hidden = true;
      if (btnInstall) btnInstall.hidden = true;
      updateBadge(true);
      return;
    }
    if (data.state === "not-available") {
      setStatus("Já tens a versão mais recente" + (lastVersion ? " (v" + lastVersion + ")." : "."), "ok");
      if (btnDownload) btnDownload.hidden = true;
      if (btnInstall) btnInstall.hidden = true;
      updateBadge(false);
      return;
    }
    if (data.state === "progress") {
      const pct = Math.max(0, Math.min(100, Math.round(data.percent || 0)));
      setStatus("A transferir a atualização... " + pct + "%");
      if (btnDownload) btnDownload.hidden = true;
      return;
    }
    if (data.state === "downloaded") {
      setStatus("Atualização " + (lastVersion ? "v" + lastVersion + " " : "") + "transferida. Será instalada ao fechar o jogo normalmente.", "ok");
      if (btnDownload) btnDownload.hidden = true;
      if (btnInstall) btnInstall.hidden = false;
      updateBadge(true);
      return;
    }
    if (data.state === "error") {
      setStatus(data.message || "Não foi possível procurar atualizações.", "err");
      if (btnDownload) btnDownload.hidden = true;
      if (btnInstall) btnInstall.hidden = true;
      return;
    }
  }

  function openSettings() {
    if (!isDesktop) {
      setStatus("As atualizações automáticas só estão disponíveis na versão instalada (.exe).", "err");
    }
    if (game && game.state === "play" && !game.paused) {
      game.paused = true;
      pausedBySettings = true;
    } else {
      pausedBySettings = false;
    }
    showOverlay("ov-settings");
    try { AudioSys.sfx.click(); } catch (e) {}
    if (isDesktop) refreshInfo();
  }

  function closeSettings() {
    hideOverlay("ov-settings");
    try { AudioSys.sfx.click(); } catch (e) {}
    if (pausedBySettings) {
      pausedBySettings = false;
      game.paused = false;
    }
  }

  async function refreshInfo() {
    if (!isDesktop) return;
    try {
      const info = await desktop.getAppInfo();
      if (versionEl) versionEl.textContent = "v" + info.version + " · " + (info.platform || "Windows");
      fillSettings(info.settings);
      if (info.lastUpdate) renderUpdateState(info.lastUpdate);
    } catch (e) {
      setStatus("Não foi possível ler as opções da aplicação.", "err");
    }
  }

  async function saveSettings() {
    if (!isDesktop) {
      setStatus("Esta versão não instala atualizações. Usa o PAC-JHOW instalado no Windows.", "err");
      return false;
    }
    try {
      const res = await desktop.saveSettings(collectSettings());
      if (!res || !res.ok) {
        setStatus((res && res.error) || "Não foi possível guardar as opções.", "err");
        return false;
      }
      fillSettings(res.settings);
      setStatus("Opções guardadas.", "ok");
      return true;
    } catch (e) {
      setStatus("Não foi possível guardar as opções.", "err");
      return false;
    }
  }

  async function checkForUpdates() {
    if (!isDesktop) {
      setStatus("As atualizações automáticas só estão disponíveis na versão instalada (.exe).", "err");
      return;
    }
    const saved = await saveSettings();
    if (!saved) return;
    updateBadge(false);
    setStatus("A procurar atualizações...");
    try {
      const res = await desktop.checkForUpdates();
      if (!res || !res.ok) setStatus((res && res.error) || "Não foi possível procurar atualizações.", "err");
    } catch (e) {
      setStatus("Não foi possível contactar o servidor de atualizações.", "err");
    }
  }

  async function downloadUpdate() {
    if (!isDesktop) return;
    if (btnDownload) btnDownload.disabled = true;
    setStatus("A preparar a transferência...");
    try {
      const res = await desktop.downloadUpdate();
      if (!res || !res.ok) setStatus((res && res.error) || "Não foi possível transferir a atualização.", "err");
    } catch (e) {
      setStatus("Não foi possível transferir a atualização.", "err");
    } finally {
      if (btnDownload) btnDownload.disabled = false;
    }
  }

  async function installUpdate() {
    if (!isDesktop) return;
    if (btnInstall) btnInstall.disabled = true;
    setStatus("A instalar... a aplicação vai reiniciar.");
    try {
      const res = await desktop.installUpdate();
      if (!res || !res.ok) {
        setStatus((res && res.error) || "Não foi possível instalar a atualização.", "err");
        if (btnInstall) btnInstall.disabled = false;
      }
    } catch (e) {
      setStatus("Não foi possível instalar a atualização.", "err");
      if (btnInstall) btnInstall.disabled = false;
    }
  }

  btnSettings.addEventListener("click", openSettings);
  if (btnClose) btnClose.addEventListener("click", closeSettings);
  if (btnSave) btnSave.addEventListener("click", saveSettings);
  if (btnCheck) btnCheck.addEventListener("click", checkForUpdates);
  if (btnDownload) btnDownload.addEventListener("click", downloadUpdate);
  if (btnInstall) btnInstall.addEventListener("click", installUpdate);
  if (providerEl) providerEl.addEventListener("change", applyProvider);

  // Esc fecha as opções antes de chegar ao atalho de pausa do jogo.
  document.addEventListener("keydown", (ev) => {
    if (overlay.classList.contains("show") && ev.key === "Escape") {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      closeSettings();
      return;
    }
    if ((ev.ctrlKey || ev.metaKey) && ev.key === ",") {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      openSettings();
    }
  }, true);

  if (isDesktop) {
    document.documentElement.classList.add("desktop-app");
    if (modeNote) modeNote.textContent = "As atualizações são transferidas do servidor configurado e só são instaladas depois da tua confirmação.";
    if (typeof desktop.onUpdateStatus === "function") desktop.onUpdateStatus(renderUpdateState);
    if (typeof desktop.onOpenSettings === "function") desktop.onOpenSettings(openSettings);
    refreshInfo();
  } else {
    if (versionEl) versionEl.textContent = "versão web";
    if (modeNote) modeNote.textContent = "Esta área só instala atualizações na aplicação PAC-JHOW para Windows (.exe).";
    [providerEl, serverEl, repoEl, autoEl, btnSave, btnCheck, btnDownload, btnInstall].forEach((el) => {
      if (el) el.disabled = true;
    });
    setStatus("Versão web: sem atualizações automáticas. Usa o PAC-JHOW instalado.", "err");
  }
})();
