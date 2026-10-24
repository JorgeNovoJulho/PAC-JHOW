"use strict";

/*
 * Servidor local de atualizações do PAC-JHOW.
 *
 * Uso:
 *   npm run update-server
 *   node update-server/server.js --dir dist --port 8787
 *
 * Serve os ficheiros gerados pelo electron-builder:
 *   latest.yml, PAC-JHOW-Setup-x.y.z.exe, *.blockmap
 * A aplicação instalada usa http://127.0.0.1:8787/ nas Opções.
 *
 * Para o servidor real, publica a mesma pasta num alojamento HTTPS.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const root = path.resolve(argValue("--dir", process.env.PAC_UPDATE_DIR || path.join(__dirname, "..", "dist")));
const port = Number(argValue("--port", process.env.PAC_UPDATE_PORT || 8787));
const host = argValue("--host", process.env.PAC_UPDATE_HOST || "127.0.0.1");

const MIME = {
  ".yml": "text/yaml; charset=utf-8",
  ".yaml": "text/yaml; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".exe": "application/octet-stream",
  ".blockmap": "application/octet-stream",
  ".zip": "application/zip",
  ".html": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

function readLatest() {
  try {
    const text = fs.readFileSync(path.join(root, "latest.yml"), "utf8");
    const version = (text.match(/^version:\s*(.+)$/m) || [])[1];
    const file = (text.match(/^path:\s*(.+)$/m) || [])[1];
    return { version: version ? version.trim() : "", file: file ? file.trim() : "" };
  } catch (e) {
    return null;
  }
}

function send(res, status, body, type) {
  res.writeHead(status, {
    "Content-Type": type || "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  if (urlPath === "/" || urlPath === "/index.html") {
    const latest = readLatest();
    const ready = latest && latest.version;
    const file = latest && latest.file ? latest.file : "PAC-JHOW-Setup-x.y.z.exe";
    const body = `<!doctype html>
<html lang="pt-PT"><meta charset="utf-8"><title>PAC-JHOW — servidor de atualizações</title>
<style>body{font-family:Segoe UI,sans-serif;background:#070a26;color:#e6edff;padding:40px;max-width:760px;margin:auto}h1{color:#ffd24a}a{color:#7db8ff}code{background:#10163f;padding:2px 6px;border-radius:4px}.ok{color:#7dffb0}.warn{color:#ff9d9d}</style>
<h1>PAC-JHOW — servidor de atualizações</h1>
<p>Pasta: <code>${root.replace(/</g, "&lt;")}</code></p>
<p>${ready ? `<span class="ok">Versão publicada: v${latest.version}</span>` : `<span class="warn">Ainda não existe latest.yml. Gera o instalador com <code>npm run dist</code>.</span>`}</p>
${ready ? `<p><a href="/${encodeURIComponent(latest.file)}">Transferir ${latest.file}</a> · <a href="/latest.yml">latest.yml</a></p>` : ""}
<p>Na aplicação: <b>Opções → Servidor próprio / local → http://127.0.0.1:${port}/</b>.</p>
<p>Para produção usa um servidor HTTPS e aponta a aplicação para esse endereço.</p>
</html>`;
    return send(res, 200, body, "text/html; charset=utf-8");
  }

  if (urlPath === "/-/health") {
    return send(res, 200, JSON.stringify({ ok: true, root, latest: readLatest() }), "application/json; charset=utf-8");
  }

  const relative = urlPath.replace(/^\/+/, "");
  const target = path.resolve(root, relative);
  if (!target.startsWith(root + path.sep) && target !== root) {
    return send(res, 403, "Forbidden");
  }

  fs.stat(target, (err, stat) => {
    if (err || !stat.isFile()) {
      return send(res, 404, "Não encontrado: " + relative);
    }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(target).toLowerCase()] || "application/octet-stream",
      "Content-Length": stat.size,
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*"
    });
    fs.createReadStream(target).pipe(res);
  });
});

server.listen(port, host, () => {
  console.log("PAC-JHOW update server: http://" + host + ":" + port + "/");
  console.log("Pasta servida: " + root);
  const latest = readLatest();
  console.log(latest && latest.version ? "Versão publicada: " + latest.version : "Sem latest.yml (gera o instalador primeiro).");
});
