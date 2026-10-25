export default {
 async fetch(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = origin === "null" || origin.startsWith("file://") || /^https:\/\/([a-z0-9-]+\.)?github\.io$/.test(origin);
  const headers = { "Access-Control-Allow-Origin": allowed ? origin : "null", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store" };
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (new URL(request.url).pathname !== "/scores" || request.method !== "POST") return Response.json({error:"not_found"},{status:404,headers});
  const ip = request.headers.get("CF-Connecting-IP") || "";
  if (!ip) return Response.json({error:"ip_missing"},{status:400,headers});
  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > 2048) return Response.json({error:"too_large"},{status:413,headers});
  let input;
  try { input = await request.json(); } catch { return Response.json({error:"invalid_json"},{status:400,headers}); }
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const score = input.score, level = input.level;
  const id = typeof input.id === "string" ? input.id : "";
  if (!/^[\p{L}\p{N} _.-]{1,12}$/u.test(name) || !Number.isSafeInteger(score) || score <= 0 || score > 100000000 || !Number.isInteger(level) || level < 1 || level > 20 || !/^[a-f0-9-]{36}$/i.test(id))
    return Response.json({error:"invalid_score"},{status:400,headers});
  // Anonymous clients are not trusted. These checks mitigate spam but do not prove gameplay.
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip + ":" + env.IP_SALT));
  const key = Array.from(new Uint8Array(digest)).map(n => n.toString(16).padStart(2,"0")).join("");
  const last = await env.DB.prepare("SELECT created_at FROM submissions WHERE ip_hash = ? ORDER BY created_at DESC LIMIT 1").bind(key).first();
  const now = Date.now();
  if (last && now - last.created_at < 60000) return Response.json({error:"rate_limited"},{status:429,headers});
  try {
   await env.DB.prepare("INSERT INTO submissions (id,name,score,level,ip_hash,created_at) VALUES (?,?,?,?,?,?)").bind(id,name,score,level,key,now).run();
  } catch (e) { return Response.json({error:"duplicate_or_storage_failure"},{status:409,headers}); }
  return Response.json({ok:true,queued:true},{status:202,headers});
 },
 async scheduled(event,env,ctx) {
  ctx.waitUntil((async () => {
   const rows = await env.DB.prepare("SELECT name, score, level FROM submissions ORDER BY score DESC, created_at ASC LIMIT 10").all();
   const content = JSON.stringify({schemaVersion:1,updatedAt:new Date().toISOString(),scores:rows.results.map(({name,score,level})=>({name,score,level}))},null,2)+"\n";
   const url = "https://api.github.com/repos/JorgeNovoJulho/PAC-JHOW/contents/data/leaderboard.json";
   const auth = {Authorization:"Bearer "+env.GITHUB_TOKEN,Accept:"application/vnd.github+json","User-Agent":"PAC-JHOW-Leaderboard","X-GitHub-Api-Version":"2022-11-28"};
   const current = await fetch(url,{headers:auth});
   if(!current.ok) throw Error("GitHub read "+current.status);
   const old = await current.json();
   const encoded = btoa(Array.from(new TextEncoder().encode(content),b=>String.fromCharCode(b)).join(""));
   const res = await fetch(url,{method:"PUT",headers:{...auth,"Content-Type":"application/json"},body:JSON.stringify({message:"chore: sync verified-format global leaderboard",content:encoded,sha:old.sha,branch:"main"})});
   if(!res.ok) throw Error("GitHub update "+res.status);
  })());
 }
};
