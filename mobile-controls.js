"use strict";
(() => {
  const isAndroid = /Android/i.test(navigator.userAgent);
  if (!isAndroid) return;
  document.documentElement.classList.add("pac-mobile");
  const controls = document.createElement("nav");
  controls.id = "pac-touch-controls";
  controls.setAttribute("aria-label", "Comandos de toque");
  controls.innerHTML = '<div class="pac-dpad"><button data-key="ArrowUp" aria-label="Cima">▲</button><div><button data-key="ArrowLeft" aria-label="Esquerda">◀</button><button data-key="ArrowDown" aria-label="Baixo">▼</button><button data-key="ArrowRight" aria-label="Direita">▶</button></div></div><div class="pac-actions"><button data-key="c">CORRER</button><button data-key="b">BOMBA</button><button data-key=" ">TIRO</button><button data-key="p">PAUSA</button></div>';
  document.body.appendChild(controls);
  let held = null;
  const keyEvent = (type,key) => window.dispatchEvent(new KeyboardEvent(type,{key,bubbles:true,cancelable:true}));
  const release = () => { if(held){keyEvent("keyup",held);held=null;} };
  controls.querySelectorAll("button").forEach(button => {
    const key = button.dataset.key;
    button.addEventListener("pointerdown",e=>{
      e.preventDefault();
      if(key.startsWith("Arrow")) { release(); held=key; }
      keyEvent("keydown",key);
      button.setPointerCapture(e.pointerId);
    });
    for(const eventName of ["pointerup","pointercancel","lostpointercapture"]) {
      button.addEventListener(eventName,e=>{
        if(held===key)release();
        else if(!key.startsWith("Arrow"))keyEvent("keyup",key);
      });
    }
  });
  window.addEventListener("blur",release);
})();
