"use strict";
(() => {
 if(!/Android/i.test(navigator.userAgent))return;
 const CURRENT="1.1.1";
 const API="https://api.github.com/repos/JorgeNovoJulho/PAC-JHOW/releases?per_page=30";
 const RELEASES="https://github.com/JorgeNovoJulho/PAC-JHOW/releases";
 const settings=document.querySelector("#ov-settings .settings-panel");
 if(!settings)return;
 const el=document.createElement("section");
 el.id="pac-android-updates";
 el.innerHTML='<h3>📲 Atualizações Android</h3><p>Origem: GitHub oficial — JorgeNovoJulho/PAC-JHOW</p><p>Versão instalada: <strong>v'+CURRENT+'</strong></p><p id="pac-android-update-status" role="status">Verificação automática ativada ao abrir o jogo.</p><div class="pac-update-actions"><button id="pac-check-updates" type="button">🔄 Verificar agora</button><button id="pac-download-update" type="button" hidden>⬇️ Baixar atualização</button></div><p class="hint">Ao encontrar uma versão nova, o APK é aberto para download no navegador. O Android exige sua confirmação para instalar. Versões beta com assinaturas de teste diferentes podem exigir reinstalação e causar perda dos dados locais.</p>';
 const music=document.getElementById("pac-mobile-music-settings");
 settings.insertBefore(el,music||document.getElementById("btn-settings-close"));
 const status=el.querySelector("#pac-android-update-status");
 const download=el.querySelector("#pac-download-update");
 const checkButton=el.querySelector("#pac-check-updates");
 const old=document.getElementById("update-provider");
 const oldElements=["update-provider","update-server-box","update-github-box","update-auto","btn-settings-save","btn-update-check","btn-update-download","btn-update-install","settings-mode-note","update-status"];
 for(const id of oldElements){const node=document.getElementById(id);if(node)node.style.display="none";}
 const version=document.getElementById("settings-version");
 if(version)version.textContent="v"+CURRENT+" · Android";
 const sub=settings.querySelector(".panel-sub");
 if(sub)sub.textContent="Música, preferências e atualizações";
 let latest=null,checking=false;
 function num(tag){const match=String(tag).match(/v?(\d+)\.(\d+)\.(\d+)(?:-android(?:-beta)?)?/);return match?match.slice(1,4).map(Number):null;}
 function newer(tag){const arr=num(tag),cur=num(CURRENT);if(!arr)return false;for(let i=0;i<3;i++){if(arr[i]!==cur[i])return arr[i]>cur[i];}return false;}
 async function check(showOk=false){
  if(checking)return;
  checking=true;checkButton.disabled=true;status.textContent="Consultando versões Android no GitHub...";
  try{
    const resp=await fetch(API,{headers:{Accept:"application/vnd.github+json"},cache:"no-store"});
    if(!resp.ok)throw new Error("Falha HTTP "+resp.status);
    const items=await resp.json();
    const candidates=items.filter(r=>!r.draft&&/android/i.test(r.tag_name||"")).flatMap(r=>(r.assets||[]).filter(a=>/\.apk$/i.test(a.name)).map(a=>({tag:r.tag_name,url:a.browser_download_url,published:r.published_at}))).filter(x=>newer(x.tag));
    candidates.sort((a,b)=>{const x=num(a.tag),y=num(b.tag);for(let i=0;i<3;i++){if(x[i]!==y[i])return y[i]-x[i];}return 0;});
    latest=candidates[0]||null;
    download.hidden=!latest;
    if(latest){status.textContent="Nova versão "+latest.tag+" disponível! Toque em Baixar atualização.";document.getElementById("pac-mobile-menu")?.classList.add("update-available");}
    else status.textContent="Seu PAC-JHOW Android está atualizado (v"+CURRENT+").";
  }catch(e){status.textContent="Não foi possível verificar agora. Confira a internet e tente novamente.";download.hidden=true;}
  finally{checking=false;checkButton.disabled=false;}
 }
 async function openExternal(url){
   try{
     const Browser=window.Capacitor?.Plugins?.Browser;
     if(Browser?.open){await Browser.open({url});return;}
   }catch(e){}
   window.open(url,"_system")||window.location.assign(url);
 }
 checkButton.addEventListener("click",()=>check(true));
 download.addEventListener("click",()=>{if(latest)openExternal(latest.url);});
 window.addEventListener("online",()=>check());
 document.getElementById("pac-mobile-menu")?.addEventListener("click",()=>{if(!checking)check();});
 setTimeout(()=>check(),1700);
})();
