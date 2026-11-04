// Entrada: teclado (teclas configurables en Ajustes), mando y táctil (touchIn viene de touch.js)
const keys={};let prev=[];
const K=a=>{const k=ENV.keys[a];return!!(keys[k[0]]||(k[1]&&keys[k[1]]))},isK=(a,code)=>ENV.keys[a].includes(code);
function act(a){initAudio();if(a==="set"){if(state==="set")closeSettings();else if(state==="play"||state==="cars")openSettings();return}
 if(state!=="play")return;if(a==="map")show("map");else if(a==="cars")show("cars");else if(a==="cam")mode=(mode+1)%4}
addEventListener("keydown",e=>{if(rebind){e.preventDefault();rebind(e.code);return}
 // Escribiendo en un cuadro de texto (nota de la captura, número del dorsal…) las teclas no mueven el coche ni abren menús
 const tg=e.target;if(tg&&(tg.tagName==="TEXTAREA"||(tg.tagName==="INPUT"&&tg.type!=="range"&&tg.type!=="checkbox")))return;
 if(DEV&&e.code==="KeyP"&&!e.repeat){e.preventDefault();devShot();return}
 keys[e.code]=1;keyAct=1;initAudio();if(e.code==="Space"||e.code.startsWith("Arrow"))e.preventDefault();if(e.repeat)return;
 if(isK("snd",e.code))setMute(!mute);if(isK("radio",e.code)){if(!RADIO.on)radioToggle();else radioNext(1)}if(isK("trf",e.code))setNpc(npcLvl+1);
 if(isK("set",e.code)){if(state==="devcity"||state==="devscn"){devBack();return}if(state==="liv")closeLiv();else if(state==="set"||state==="play")act("set");else if(spawned)resume();return}
 if(isK("map",e.code))act("map");if(isK("cars",e.code))act("cars");if(isK("cam",e.code))act("cam")});
addEventListener("keyup",e=>keys[e.code]=0);
function input(){let t=K("up")?1:0,b=K("down")?1:0,s=(K("right")?1:0)-(K("left")?1:0),hb=K("hb");
 const g=[...(navigator.getGamepads?navigator.getGamepads():[])].find(x=>x);
 if(g){const ax=g.axes[0]||0;if(Math.abs(ax)>.12)s=ax;t=Math.max(t,g.buttons[7]?g.buttons[7].value:0);b=Math.max(b,g.buttons[6]?g.buttons[6].value:0);hb=hb||g.buttons[0].pressed;
  const p=g.buttons.map(x=>x.pressed),e=i=>p[i]&&!prev[i];
  if(e(3))act("map");if(e(8))act("cars");if(e(2))act("cam");if(e(9))act("set");prev=p}
 if(touchIn.s)s=touchIn.s;t=Math.max(t,touchIn.t);b=Math.max(b,touchIn.b);hb=hb||!!touchIn.hb;
 return{t,b,s,hb}}
