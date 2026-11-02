// Entrada: teclado, mando y táctil (touchIn viene de touch.js)
const keys={};let prev=[];
function act(a){initAudio();if(state!=="play")return;if(a==="map")show("map");else if(a==="cars")show("cars");else if(a==="cam")mode=(mode+1)%5}
addEventListener("keydown",e=>{keys[e.code]=1;keyAct=1;initAudio();if(e.code==="KeyN"&&!e.repeat)setMute(!mute);if(e.code==="KeyT"&&!e.repeat)setNpc(npcLvl+1);if(e.code==="Space")e.preventDefault();if(e.repeat)return;
 if(e.code==="Escape"&&spawned&&state!=="play")resume();
 if(e.code==="KeyM")act("map");if(e.code==="KeyC")act("cars");if(e.code==="KeyV")act("cam")});
addEventListener("keyup",e=>keys[e.code]=0);
function input(){let t=keys.KeyW||keys.ArrowUp?1:0,b=keys.KeyS||keys.ArrowDown?1:0,s=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),hb=!!keys.Space;
 const g=[...(navigator.getGamepads?navigator.getGamepads():[])].find(x=>x);
 if(g){const ax=g.axes[0]||0;if(Math.abs(ax)>.12)s=ax;t=Math.max(t,g.buttons[7]?g.buttons[7].value:0);b=Math.max(b,g.buttons[6]?g.buttons[6].value:0);hb=hb||g.buttons[0].pressed;
  const p=g.buttons.map(x=>x.pressed),e=i=>p[i]&&!prev[i];
  if(e(3))act("map");if(e(8))act("cars");if(e(2))act("cam");prev=p}
 if(touchIn.s)s=touchIn.s;t=Math.max(t,touchIn.t);b=Math.max(b,touchIn.b);hb=hb||!!touchIn.hb;
 return{t,b,s,hb}}
