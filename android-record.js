"use strict";
(() => {
 if(!/Android/i.test(navigator.userAgent)) return;
 const endpoint="https://raw.githubusercontent.com/JorgeNovoJulho/PAC-JHOW/main/data/leaderboard.json";
 const field=()=>document.getElementById("pac-rank-name");
 const points=()=>document.getElementById("pac-rank-points");
 const avatar=()=>document.querySelector(".pac-rank-avatar");
 const progress=()=>document.getElementById("pac-rank-progress-fill");
 let requestId=0;
 async function load(){
   const id=++requestId;
   if(field())field().textContent="Carregando recordes...";
   if(progress())progress().style.width="12%";
   const controller=new AbortController();
   const timeout=setTimeout(()=>controller.abort(),10000);
   let timer=setInterval(()=>{if(progress())progress().style.width=Math.min(90,parseFloat(progress().style.width||"12")+8)+"%";},450);
   try {
    const response=await fetch(endpoint+"?t="+Date.now(),{signal:controller.signal,cache:"no-store"});
    if(!response.ok) throw new Error("Ranking indisponível");
    const data=await response.json();
    if(!Array.isArray(data.scores))throw new Error("Formato de ranking inválido");
    const scores=data.scores.filter(x=>x&&typeof x.name==="string"&&Number.isSafeInteger(x.score)&&x.score>=0).sort((a,b)=>b.score-a.score);
    if(id!==requestId)return;
    const best=scores[0];
    if(field())field().textContent=best?best.name:"Ainda não há recordista global";
    if(points())points().textContent=best?best.score.toLocaleString("pt-BR")+" pontos · 1º lugar":"Seja o primeiro a liderar!";
    const imageUrl=best&&(best.photoUrl||best.avatarUrl||best.photo);
    if(avatar()){
      avatar().replaceChildren();
      if(typeof imageUrl==="string"){
        try{
          const url=new URL(imageUrl);
          if(url.protocol==="https:"){
            const img=document.createElement("img");
            img.alt="Foto pública do recordista";
            img.referrerPolicy="no-referrer";
            img.src=url.href;
            img.onerror=()=>{avatar().textContent="👑";};
            avatar().appendChild(img);
          }else avatar().textContent="👑";
        }catch(_){avatar().textContent="👑";}
      }else avatar().textContent="👑";
    }
   }catch(_){if(id===requestId){if(field())field().textContent="Ranking indisponível";if(points())points().textContent="Tente novamente com internet.";}}
   finally{
     clearTimeout(timeout);clearInterval(timer);
     if(id===requestId){if(progress())progress().style.width="100%";setTimeout(()=>{const p=document.querySelector(".pac-rank-progress");if(p)p.style.opacity="0";},700);}
   }
 }
 setTimeout(load,150);
 window.addEventListener("online",load);
 setInterval(load,5*60*1000);
})();
