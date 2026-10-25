"use strict";

const { app, BrowserWindow, ipcMain, shell, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const { autoUpdater } = require("electron-updater");

const APP_ID = "com.jorgenovojulho.pacjhow";
const DEFAULT_SETTINGS = {
  // A aplicação instalada usa por predefinição as Releases públicas do GitHub.
  // O servidor local (http://127.0.0.1:8787/) fica disponível para testes.
  updateProvider: "github",
  updateServer: "http://127.0.0.1:8787/",
  githubRepo: "JorgeNovoJulho/PAC-JHOW",
  autoCheck: true
};

app.setAppUserModelId(APP_ID);
// A música do jogo deve começar sem exigir um gesto extra no desktop.
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

let mainWindow = null;
let settings = null;
let lastUpdate = { state: "idle" };
let updateDownloaded = false;
let checking = false;
let autoCheckTimer = null;

function settingsFile() {
  return path.join(app.getPath("userData"), "settings.json");
}

function logUpdate(message) {
  try {
    const line = new Date().toISOString() + " " + message + "\n";
    fs.appendFileSync(path.join(app.getPath("userData"), "updates.log"), line, "utf8");
  } catch (e) {}
}

function sendUpdate(data) {
  lastUpdate = Object.assign({ at: Date.now() }, data || {});
  logUpdate("update-status " + JSON.stringify(lastUpdate));
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("update-status", lastUpdate);
  }
}

function readSettings() {
  try {
    const raw = fs.readFileSync(settingsFile(), "utf8");
    return validateSettings(Object.assign({}, DEFAULT_SETTINGS, JSON.parse(raw)));
  } catch (e) {
    return Object.assign({}, DEFAULT_SETTINGS);
  }
}

function writeSettings(next) {
  const dir = app.getPath("userData");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(settingsFile(), JSON.stringify(next, null, 2), "utf8");
  return next;
}

function normalizeServerUrl(raw) {
  const text = String(raw || "").trim();
  if (!text) throw new Error("Indica o endereço do servidor de atualizações.");
  let url;
  try {
    url = new URL(text);
  } catch (e) {
    throw new Error("O endereço do servidor não é um URL válido.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("O servidor tem de usar HTTPS (ou HTTP apenas em localhost para testes).");
  }
  if (url.protocol === "http:") {
    const host = url.hostname.toLowerCase();
    if (host !== "127.0.0.1" && host !== "localhost" && host !== "::1") {
      throw new Error("Para um servidor real usa HTTPS. HTTP só é permitido em localhost.");
    }
  }
  if (url.username || url.password) throw new Error("O endereço não deve incluir utilizador/palavra-passe.");
  return url.href.endsWith("/") ? url.href : url.href + "/";
}

function normalizeRepo(raw) {
  const text = String(raw || "").trim();
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(text)) {
    throw new Error("O repositório GitHub deve estar no formato dono/repositório.");
  }
  return text;
}

function validateSettings(input) {
  const next = Object.assign({}, DEFAULT_SETTINGS, input || {});
  next.updateProvider = next.updateProvider === "github" ? "github" : "generic";
  next.autoCheck = !!next.autoCheck;
  next.githubRepo = normalizeRepo(next.githubRepo);
  next.updateServer = normalizeServerUrl(next.updateServer);
  return next;
}

function configureUpdater() {
  if (!app.isPackaged) return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;
  autoUpdater.allowDowngrade = false;
  autoUpdater.logger = {
    info: (m) => logUpdate("INFO " + String(m)),
    warn: (m) => logUpdate("WARN " + String(m)),
    error: (m) => logUpdate("ERROR " + String(m)),
    debug: (m) => logUpdate("DEBUG " + String(m))
  };

  if (settings.updateProvider === "github") {
    const parts = settings.githubRepo.split("/");
    autoUpdater.setFeedURL({
      provider: "github",
      owner: parts[0],
      repo: parts[1],
      releaseType: "release"
    });
  } else {
    autoUpdater.setFeedURL({
      provider: "generic",
      url: settings.updateServer
    });
  }
}

function friendlyUpdateError(err) {
  const text = String((err && err.message) || err || "");
  if (/ECONNREFUSED|ENOTFOUND|ETIMEDOUT|EAI_AGAIN/i.test(text)) {
    return "Não foi possível ligar ao servidor de atualizações. Confirma o endereço e se o servidor está ligado.";
  }
  if (/404|latest\.yml/i.test(text)) {
    return "O servidor respondeu, mas não encontrou o ficheiro de atualizações (latest.yml).";
  }
  return text || "Falha ao procurar atualizações.";
}

async function checkForUpdates() {
  if (!app.isPackaged) {
    return { ok: false, error: "As atualizações só funcionam na aplicação instalada (.exe)." };
  }
  if (checking) return { ok: true, alreadyChecking: true };
  if (!settings) settings = readSettings();
  configureUpdater();
  checking = true;
  sendUpdate({ state: "checking" });
  try {
    const result = await autoUpdater.checkForUpdates();
    const version = result && result.updateInfo ? result.updateInfo.version : "";
    return { ok: true, version };
  } catch (err) {
    const message = friendlyUpdateError(err);
    sendUpdate({ state: "error", message });
    return { ok: false, error: message };
  } finally {
    checking = false;
  }
}

function registerIpc() {
  ipcMain.handle("app:info", () => ({
    version: app.getVersion(),
    platform: process.platform,
    isPackaged: app.isPackaged,
    settings,
    lastUpdate
  }));

  ipcMain.handle("app:open-data", async () => {
    const result = await shell.openPath(app.getPath("userData"));
    return { ok: !result, error: result || "" };
  });

  ipcMain.handle("settings:get", () => settings);

  ipcMain.handle("settings:save", (_event, input) => {
    try {
      settings = writeSettings(validateSettings(input));
      configureUpdater();
      logUpdate("settings saved " + JSON.stringify(settings));
      return { ok: true, settings };
    } catch (err) {
      return { ok: false, error: err.message || "Opções inválidas." };
    }
  });

  ipcMain.handle("update:check", () => checkForUpdates());

  ipcMain.handle("update:download", async () => {
    if (!app.isPackaged) {
      return { ok: false, error: "As atualizações só funcionam na aplicação instalada (.exe)." };
    }
    if (!updateDownloaded) {
      try {
        sendUpdate({ state: "progress", percent: 0 });
        await autoUpdater.downloadUpdate();
        return { ok: true };
      } catch (err) {
        const message = friendlyUpdateError(err);
        sendUpdate({ state: "error", message });
        return { ok: false, error: message };
      }
    }
    return { ok: true };
  });

  ipcMain.handle("update:install", () => {
    if (!updateDownloaded) return { ok: false, error: "Ainda não há uma atualização transferida." };
    setImmediate(() => {
      try {
        autoUpdater.quitAndInstall(false, true);
      } catch (err) {
        sendUpdate({ state: "error", message: friendlyUpdateError(err) });
      }
    });
    return { ok: true };
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 980,
    minHeight: 680,
    show: false,
    backgroundColor: "#070a26",
    icon: path.join(__dirname, "..", "pacman.ico"),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.loadFile(path.join(__dirname, "..", "index.html"));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("file://")) {
      event.preventDefault();
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function buildMenu() {
  const template = [
    {
      label: "Jogo",
      submenu: [
        {
          label: "Opções e atualizações",
          accelerator: "CmdOrCtrl+,",
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("open-settings");
          }
        },
        { type: "separator" },
        { role: "quit", label: "Sair" }
      ]
    },
    {
      label: "Ver",
      submenu: [
        { role: "togglefullscreen", label: "Ecrã inteiro" },
        { role: "reload", label: "Recarregar" }
      ]
    },
    {
      label: "Ajuda",
      submenu: [
        { label: "PAC-JHOW v" + app.getVersion(), enabled: false },
        {
          label: "Abrir pasta de dados",
          click: () => shell.openPath(app.getPath("userData"))
        },
        {
          label: "Abrir repositório no GitHub",
          click: () => shell.openExternal("https://github.com/JorgeNovoJulho/PAC-JHOW")
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

autoUpdater.on("checking-for-update", () => sendUpdate({ state: "checking" }));
autoUpdater.on("update-available", (info) => {
  updateDownloaded = false;
  sendUpdate({ state: "available", version: info && info.version ? info.version : "" });
});
autoUpdater.on("update-not-available", (info) => {
  sendUpdate({ state: "not-available", version: info && info.version ? info.version : "" });
});
autoUpdater.on("download-progress", (progress) => {
  sendUpdate({ state: "progress", percent: progress ? progress.percent : 0 });
});
autoUpdater.on("update-downloaded", (info) => {
  updateDownloaded = true;
  sendUpdate({ state: "downloaded", version: info && info.version ? info.version : "" });
});
autoUpdater.on("error", (err) => {
  sendUpdate({ state: "error", message: friendlyUpdateError(err) });
});

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    settings = readSettings();
    registerIpc();
    buildMenu();
    configureUpdater();
    createWindow();

    if (settings.autoCheck && app.isPackaged) {
      autoCheckTimer = setTimeout(() => {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        checkForUpdates();
      }, 5000);
    }

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (autoCheckTimer) clearTimeout(autoCheckTimer);
    if (process.platform !== "darwin") app.quit();
  });
}
