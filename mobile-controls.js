"use strict";
(() => {
  if (!/Android/i.test(navigator.userAgent)) return;
  document.documentElement.classList.add("pac-mobile");
  const controls = document.createElement("nav");
  controls.id = "pac-touch-controls";
  controls.setAttribute("aria-label", "Controles de jogo para Android");
  controls.innerHTML = `
    <div class="pac-dpad">
      <button type="button" data-key="ArrowUp" aria-label="Cima">▲</button>
      <button type="button" data-key="ArrowLeft" aria-label="Esquerda">◀</button>
      <button type="button" data-key="ArrowDown" aria-label="Baixo">▼</button>
      <button type="button" data-key="ArrowRight" aria-label="Direita">▶</button>
    </div>
    <div class="pac-actions">
      <button type="button" data-key="c">CORRER</button>
      <button type="button" data-key="b">BOMBA</button>
      <button type="button" data-key=" ">TIRO</button>
      <button type="button" data-key="p">PAUSA</button>
    </div>
    <button type="button" id="pac-mobile-menu" aria-label="Configurações">⚙</button>`;
  document.body.appendChild(controls);
  const sideActions = document.createElement("div");
  sideActions.className = "pac-side-actions";
  controls.appendChild(sideActions);
  const actions = controls.querySelector(".pac-actions");
  for(const key of ["c","b"]) {
    const actionButton = actions.querySelector(`[data-key="${key}"]`);
    if(actionButton) sideActions.appendChild(actionButton);
  }
  const rotate = document.createElement("div");
  rotate.id = "pac-rotate";
  rotate.setAttribute("role", "status");
  rotate.innerHTML = "<span>📱</span><strong>Gire o celular para jogar</strong><p>Use o modo retrato para visualizar o labirinto e os controles.</p>";
  document.body.appendChild(rotate);
  controls.querySelector("#pac-mobile-menu").addEventListener("click", () => {
    document.getElementById("btn-settings")?.click();
  });
  const held = new Map();
  const dispatch = (type,key) => window.dispatchEvent(new KeyboardEvent(type,{key,bubbles:true,cancelable:true}));
  function release(pointerId) {
    const key=held.get(pointerId);
    if(key){ held.delete(pointerId); dispatch("keyup",key); }
  }
  controls.querySelectorAll("[data-key]").forEach(button=>{
    const key=button.dataset.key;
    button.addEventListener("pointerdown",ev=>{
      ev.preventDefault();
      dispatch("keydown",key);
      if(key.startsWith("Arrow")) held.set(ev.pointerId,key);
      try { button.setPointerCapture(ev.pointerId); } catch (_) {}
    });
    for (const type of ["pointerup","pointercancel","lostpointercapture"]) {
      button.addEventListener(type,ev=>{ release(ev.pointerId); });
    }
  });
  window.addEventListener("blur",()=>{for(const id of held.keys())release(id);});
  document.addEventListener("contextmenu",ev=>{
    if(controls.contains(ev.target))ev.preventDefault();
  });
})();
