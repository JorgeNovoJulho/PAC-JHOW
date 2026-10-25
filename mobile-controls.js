"use strict";
(() => {
  if (!/Android/i.test(navigator.userAgent)) return;
  document.documentElement.classList.add("pac-mobile");
  const controls=document.createElement("nav");
  controls.id="pac-touch-controls";
  controls.setAttribute("aria-label","Controles Android");
  controls.innerHTML=`
    <div id="pac-joystick" role="application" aria-label="Alavanca virtual de movimento">
      <div class="pac-stick-groove"><div class="pac-stick-knob"></div></div>
    </div>
    <div class="pac-actions">
      <button type="button" data-key="c">CORRER</button>
      <button type="button" data-key="b">BOMBA</button>
      <button type="button" data-key=" ">TIRO</button>
      <button type="button" data-key="p">PAUSA</button>
    </div>
    <button type="button" id="pac-mobile-menu" aria-label="Configurações">⚙</button>`;
  document.getElementById("game-col").appendChild(controls);
  document.getElementById("pac-mobile-menu").addEventListener("click",()=>document.getElementById("btn-settings")?.click());
  const dispatch=(type,key)=>window.dispatchEvent(new KeyboardEvent(type,{key,bubbles:true,cancelable:true}));
  let pointer=null, activeKey=null;
  const stick=controls.querySelector("#pac-joystick");
  const knob=stick.querySelector(".pac-stick-knob");
  const deadzone=0.12;
  const hysteresis=1.22;
  function reset(){
    if(activeKey){dispatch("keyup",activeKey);activeKey=null;}
    pointer=null;knob.style.transform="translate(-50%,-50%)";
    stick.classList.remove("active");
  }
  function steer(e){
    const box=stick.getBoundingClientRect();
    const cx=box.left+box.width/2,cy=box.top+box.height/2;
    const dx=e.clientX-cx,dy=e.clientY-cy;
    const range=box.width*0.31;
    const length=Math.hypot(dx,dy);
    const scale=length>range?range/length:1;
    knob.style.transform=`translate(calc(-50% + ${dx*scale}px), calc(-50% + ${dy*scale}px))`;
    let next=null;
    if(length>range*deadzone){
      const ax=Math.abs(dx),ay=Math.abs(dy);
      const horizontal=activeKey==="ArrowLeft"||activeKey==="ArrowRight";
      const vertical=activeKey==="ArrowUp"||activeKey==="ArrowDown";
      const useHorizontal=horizontal?ax*hysteresis>=ay:vertical?ax>ay*hysteresis:ax>=ay;
      next=useHorizontal?(dx>0?"ArrowRight":"ArrowLeft"):(dy>0?"ArrowDown":"ArrowUp");
    }
    if(next!==activeKey){
      if(activeKey)dispatch("keyup",activeKey);
      activeKey=next;
      if(next)dispatch("keydown",next);
    }
  }
  stick.addEventListener("pointerdown",e=>{
    e.preventDefault();if(pointer!==null)return;
    pointer=e.pointerId;
    try{stick.setPointerCapture(pointer);}catch(_){}
    stick.classList.add("active");steer(e);
  });
  stick.addEventListener("pointermove",e=>{if(pointer===e.pointerId){e.preventDefault();steer(e);}});
  for(const event of ["pointerup","pointercancel","lostpointercapture"])
    stick.addEventListener(event,e=>{if(pointer===e.pointerId)reset();});
  const heldActions=new Map();
  controls.querySelectorAll("[data-key]").forEach(button=>{
    const key=button.dataset.key;
    button.addEventListener("pointerdown",e=>{
      e.preventDefault();if(heldActions.has(e.pointerId))return;
      heldActions.set(e.pointerId,key);dispatch("keydown",key);
      try{button.setPointerCapture(e.pointerId);}catch(_){}
    });
    for(const event of ["pointerup","pointercancel","lostpointercapture"])
      button.addEventListener(event,e=>{
        if(heldActions.has(e.pointerId)){dispatch("keyup",heldActions.get(e.pointerId));heldActions.delete(e.pointerId);}
      });
  });
  window.addEventListener("blur",()=>{
    reset();for(const key of heldActions.values())dispatch("keyup",key);heldActions.clear();
  });
  controls.addEventListener("contextmenu",e=>e.preventDefault());
})();
