// Controles táctiles (solo móvil): joystick de dirección a la izquierda, pedales a la derecha
const touchIn={t:0,b:0,s:0,hb:0};
if(MOBILE){
 const joy=$("joy"),knob=$("knob"),JR=55;let jid=null;
 const jmove=e=>{const r=joy.getBoundingClientRect();let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);const d=Math.hypot(dx,dy);if(d>JR){dx*=JR/d;dy*=JR/d}
  knob.style.transform=`translate(${dx}px,${dy}px)`;const s=dx/JR;touchIn.s=Math.abs(s)<.08?0:s};
 joy.addEventListener("pointerdown",e=>{e.preventDefault();jid=e.pointerId;joy.setPointerCapture(jid);jmove(e);keyAct=1;initAudio()});
 joy.addEventListener("pointermove",e=>{if(e.pointerId===jid)jmove(e)});
 const jend=e=>{if(e.pointerId!==jid)return;jid=null;knob.style.transform="";touchIn.s=0};
 joy.addEventListener("pointerup",jend);joy.addEventListener("pointercancel",jend);
 for(const[id,k]of[["tGas","t"],["tBrk","b"],["tHb","hb"]]){const el=$(id);
  el.addEventListener("pointerdown",e=>{e.preventDefault();el.setPointerCapture(e.pointerId);touchIn[k]=1;el.classList.add("on");keyAct=1;initAudio()});
  const up=()=>{touchIn[k]=0;el.classList.remove("on")};el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up)}
 addEventListener("contextmenu",e=>e.preventDefault())}
// Pantalla completa y bloqueo en horizontal al elegir coche (los navegadores lo exigen tras un toque)
function goFull(){if(!MOBILE||document.fullscreenElement)return;const d=document.documentElement;
 if(d.requestFullscreen)d.requestFullscreen().then(()=>{if(screen.orientation&&screen.orientation.lock)screen.orientation.lock("landscape").catch(()=>{})}).catch(()=>{})}
