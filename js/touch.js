// Controles táctiles (solo móvil): joystick a la izquierda que gira y acelera (hacia delante) o frena y da marcha atrás (hacia atrás);
// a la derecha, botón de freno (para frenar fuerte o provocar el derrape en curva) y freno de mano
const touchIn={t:0,b:0,s:0,hb:0,jb:0,bb:0};
if(MOBILE){
 const joy=$("joy"),knob=$("knob"),JR=55;let jid=null;
 const jmove=e=>{const r=joy.getBoundingClientRect();let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);const d=Math.hypot(dx,dy);if(d>JR){dx*=JR/d;dy*=JR/d}
  knob.style.transform=`translate(${dx}px,${dy}px)`;const s=dx/JR,y=-dy/JR;touchIn.s=Math.abs(s)<.08?0:s;
  touchIn.t=y>.15?Math.min(1,(y-.15)/.7):0;touchIn.jb=y<-.25?Math.min(1,(-y-.25)/.6):0;touchIn.b=Math.max(touchIn.jb,touchIn.bb)};
 joy.addEventListener("pointerdown",e=>{e.preventDefault();jid=e.pointerId;joy.setPointerCapture(jid);jmove(e);keyAct=1;initAudio()});
 joy.addEventListener("pointermove",e=>{if(e.pointerId===jid)jmove(e)});
 const jend=e=>{if(e.pointerId!==jid)return;jid=null;knob.style.transform="";touchIn.s=touchIn.t=touchIn.jb=0;touchIn.b=touchIn.bb};
 joy.addEventListener("pointerup",jend);joy.addEventListener("pointercancel",jend);
 for(const[id,k]of[["tBrk","bb"],["tHb","hb"]]){const el=$(id);
  el.addEventListener("pointerdown",e=>{e.preventDefault();el.setPointerCapture(e.pointerId);touchIn[k]=1;touchIn.b=Math.max(touchIn.jb,touchIn.bb);el.classList.add("on");keyAct=1;initAudio()});
  const up=()=>{touchIn[k]=0;touchIn.b=Math.max(touchIn.jb,touchIn.bb);el.classList.remove("on")};el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up)}
 addEventListener("contextmenu",e=>e.preventDefault())}
// Pantalla completa y bloqueo en horizontal al elegir coche (los navegadores lo exigen tras un toque)
function goFull(){if(!MOBILE||document.fullscreenElement)return;const d=document.documentElement;
 if(d.requestFullscreen)d.requestFullscreen().then(()=>{if(screen.orientation&&screen.orientation.lock)screen.orientation.lock("landscape").catch(()=>{})}).catch(()=>{})}
