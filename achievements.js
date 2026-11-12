"use strict";
(() => {
 const KEY="pac-jhow-achievements-v1";
 const defs=[
  {id:"first-pellet",name:"Primeira Mordida",desc:"Colete seu primeiro ponto",goal:1,type:"pellet",reward:"Distintivo Bronze"},
  {id:"collector",name:"Fome de Pontos",desc:"Colete 250 pontos do labirinto",goal:250,type:"pellet",reward:"Distintivo Prata"},
  {id:"ghost",name:"Caçador de Fantasmas",desc:"Derrote 10 fantasmas",goal:10,type:"ghost",reward:"Distintivo Fantasma"},
  {id:"bomb",name:"Mestre das Bombas",desc:"Acerte 5 inimigos com bombas",goal:5,type:"bomb",reward:"Distintivo Explosão"},
  {id:"survivor",name:"Sobrevivente",desc:"Conclua cinco fases",goal:5,type:"level",reward:"Distintivo Sobrevivente"},
  {id:"champion",name:"Rei do Labirinto",desc:"Conclua os 20 níveis",goal:20,type:"level",reward:"Medalha Lenda PAC-JHOW"}
 ];
 let progress={};try{progress=JSON.parse(localStorage.getItem(KEY)||"{}")||{}}catch(_){}
 const notice=document.createElement("div");notice.id="pac-achievement-toast";notice.setAttribute("role","status");document.body.appendChild(notice);
 const panel=document.createElement("section");panel.id="pac-achievements";
 panel.innerHTML='<h3>🏅 Conquistas e recompensas</h3><div id="pac-achievement-list"></div>';
 const settings=document.querySelector("#ov-settings .settings-panel");
 if(settings)settings.appendChild(panel);
 const clamp=(v,max)=>Math.max(0,Math.min(max,Number(v)||0));
 function render(){
  const list=panel.querySelector("#pac-achievement-list");
  list.replaceChildren();
  for(const d of defs){
   const p=clamp(progress[d.id],d.goal),done=p>=d.goal;
   const row=document.createElement("div");row.className="pac-achievement-row";
   const title=document.createElement("strong");title.textContent=(done?"🏆 ":"🔒 ")+d.name;
   const desc=document.createElement("span");desc.textContent=d.desc+" · "+p+"/"+d.goal;
   const reward=document.createElement("small");reward.textContent="Recompensa: "+d.reward+(done?" · desbloqueada":"");
   row.append(title,desc,reward);list.appendChild(row);
  }
 }
 let toastTimer;
 function add(type,amount=1){
  for(const d of defs.filter(d=>d.type===type)){
   const prev=clamp(progress[d.id],d.goal);
   if(prev>=d.goal)continue;
   progress[d.id]=clamp(prev+amount,d.goal);
   if(progress[d.id]===d.goal){
    notice.textContent="🏆 "+d.name+" — "+d.reward;
    notice.classList.add("show");
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>notice.classList.remove("show"),3600);
    window.PAC_SAY_EVENT?.("ranking");
   }
  }
  try{localStorage.setItem(KEY,JSON.stringify(progress));}catch(_){}
  render();
 }
 render();
 window.PAC_ACHIEVEMENTS={add,list:()=>defs.map(d=>({...d,current:clamp(progress[d.id],d.goal)}))};
})();