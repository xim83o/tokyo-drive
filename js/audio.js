// Sonido: motor con grabaciones reales (sounds/engine, CC0 de domasx2 en OpenGameArt), chirrido, golpes y claxon
// Si las grabaciones no cargan, el motor se genera por código
let AC=null,mute=false,eo,eo2,eo3,ef,eg,ig,nf,ng,nb,aMaster,crashT=0;const ES=[];
// Canales con su propio volumen (menú de ajustes): motor, efectos (golpes y chirridos), lluvia y truenos, claxon
const BUS={};
function setVol(){if(typeof radioVol==="function")radioVol();if(!AC)return;const v=ENV.vol,t=AC.currentTime;aMaster.gain.setTargetAtTime(.5*v.m,t,.05);BUS.eng.gain.setTargetAtTime(v.e,t,.05);BUS.fx.gain.setTargetAtTime(v.fx,t,.05);BUS.rain.gain.setTargetAtTime(v.rain,t,.05);BUS.horn.gain.setTargetAtTime(v.horn,t,.05);BUS.amb.gain.setTargetAtTime(v.amb===undefined?1:v.amb,t,.05)}
function setMute(m){mute=m;$("snd").textContent=m?"🔇":"🔊";if(typeof radioVol==="function")radioVol()}
// Seis bucles del mismo motor a revoluciones crecientes: se mezclan los dos más cercanos a las rpm y se ajusta su velocidad de reproducción
// (se descargan durante la pantalla de carga; se decodifican al crear el sonido, que el navegador solo permite tras pulsar algo)
const ENGB=[0,1,2,3,4,5].map(i=>fetch(`sounds/engine/loop${i}.wav`).then(r=>r.ok?r.arrayBuffer():Promise.reject(r.status)));
function loadEngine(){Promise.all(ENGB).then(B=>Promise.all(B.map(b=>new Promise((ok,ko)=>AC.decodeAudioData(b,ok,ko)))))
 .then(bufs=>{bufs.forEach(b=>{const s=AC.createBufferSource(),g=AC.createGain();s.buffer=b;s.loop=true;g.gain.value=0;s.connect(g);g.connect(ef);s.start();ES.push({s,g})});eo.disconnect();eo2.disconnect();eo3.disconnect()})
 .catch(e=>console.warn("Sonido de motor por código:",e))}
function initAudio(){if(AC){if(AC.state==="suspended")AC.resume();return}
 try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){return}
 aMaster=AC.createGain();aMaster.gain.value=.5;aMaster.connect(AC.destination);
 for(const k of["eng","fx","rain","horn","amb"]){BUS[k]=AC.createGain();BUS[k].connect(aMaster)}setVol();
 // Motor de reserva: frecuencia de explosiones + subarmónico + 2º armónico, con saturación suave y filtro según acelerador
 ef=AC.createBiquadFilter();ef.type="lowpass";ef.Q.value=1.2;eg=AC.createGain();eg.gain.value=0;
 const ws=AC.createWaveShaper(),cu=new Float32Array(1024);for(let k=0;k<1024;k++){const x=k/511.5-1;cu[k]=Math.tanh(2.2*x)}ws.curve=cu;
 const mix=(type,gain)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=type;g.gain.value=gain;o.connect(g);g.connect(ws);o.start();return o};
 eo=mix("sawtooth",.35);eo2=mix("sine",.6);eo3=mix("triangle",.25);ws.connect(ef);ef.connect(eg);eg.connect(BUS.eng);
 nb=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate);const d=nb.getChannelData(0);for(let k=0;k<d.length;k++)d[k]=Math.random()*2-1;
 // Admisión: ruido filtrado que sube al acelerar
 const is=AC.createBufferSource(),inf=AC.createBiquadFilter();is.buffer=nb;is.loop=true;inf.type="bandpass";inf.frequency.value=700;inf.Q.value=.8;ig=AC.createGain();ig.gain.value=0;is.connect(inf);inf.connect(ig);ig.connect(BUS.eng);is.start();
 const ns=AC.createBufferSource();ns.buffer=nb;ns.loop=true;nf=AC.createBiquadFilter();nf.type="bandpass";nf.Q.value=3;ng=AC.createGain();ng.gain.value=0;ns.connect(nf);nf.connect(ng);ng.connect(BUS.fx);ns.start();loadEngine()}
function thump(v){if(!AC||mute)return;const t=AC.currentTime,s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=nb;f.type="lowpass";f.frequency.value=450;
 g.gain.setValueAtTime(Math.min(1,v/20),t);g.gain.exponentialRampToValueAtTime(.001,t+.4);s.connect(f);f.connect(g);g.connect(BUS.fx);s.start(t);s.stop(t+.45)}
function hornSnd(dist,p){if(!AC||mute)return;const v=.22*Math.max(0,1-dist/70);if(v<.01)return;const t=AC.currentTime,f=AC.createBiquadFilter(),g=AC.createGain();
 f.type="lowpass";f.frequency.value=1800;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.02);g.gain.setValueAtTime(v,t+.3);g.gain.linearRampToValueAtTime(0,t+.36);
 for(const fr of[392,494]){const o=AC.createOscillator();o.type="square";o.frequency.value=fr*(p||1);o.connect(f);o.start(t);o.stop(t+.4)}f.connect(g);g.connect(BUS.horn)}
// Lluvia generada por código: ruido filtrado continuo más gotas sueltas; dentro del coche suena más apagada y se oyen las gotas en el techo
let rainG=null,rainF=null;
function rainAudio(){if(!AC)return;if(!rainG){const s=AC.createBufferSource(),hp=AC.createBiquadFilter();s.buffer=nb;s.loop=true;s.playbackRate.value=.7;hp.type="highpass";hp.frequency.value=350;rainF=AC.createBiquadFilter();rainF.type="lowpass";rainF.frequency.value=3000;
  rainG=AC.createGain();rainG.gain.value=0;s.connect(hp);hp.connect(rainF);rainF.connect(rainG);rainG.connect(BUS.rain);s.start()}
 const t=AC.currentTime,inside=mode===3&&state==="play",v=mute?0:WEA.rain*(inside?.16:.22)*(SEASON===3?.12:1);rainG.gain.setTargetAtTime(v,t,.3);rainF.frequency.setTargetAtTime(inside?1100:3200,t,.3);
 if(!mute&&WEA.rain>.1&&Math.random()<WEA.rain*(inside?.5:.25)){const b=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();b.buffer=nb;f.type="bandpass";f.frequency.value=inside?900+Math.random()*600:2500+Math.random()*3000;f.Q.value=4;
  g.gain.setValueAtTime(WEA.rain*(inside?.18:.06),t);g.gain.exponentialRampToValueAtTime(.001,t+.05);b.connect(f);f.connect(g);g.connect(BUS.rain);b.start(t,Math.random());b.stop(t+.06)}}
// Ambiente generado por código: viento según la velocidad, rumor de la ciudad según el tráfico y trenes que se oyen al pasar cerca
let AMB=null,ambHorn=20,ambClk=0;
// Golpe metálico de la rueda en la junta del raíl
function trainClk(t,v){const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=nb;f.type="bandpass";f.frequency.value=1500;f.Q.value=1.2;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.07);s.connect(f);f.connect(g);g.connect(BUS.amb);s.start(t,Math.random());s.stop(t+.08)}
// Bocina del tren al acercarse: dos notas, para que se distinga del tráfico
function trainHorn(v){const t=AC.currentTime,f=AC.createBiquadFilter(),g=AC.createGain();f.type="lowpass";f.frequency.value=2400;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.05);g.gain.setValueAtTime(v,t+1.1);g.gain.linearRampToValueAtTime(0,t+1.3);for(const fr of[523,659]){const o=AC.createOscillator();o.type="sawtooth";o.frequency.value=fr;o.connect(f);o.start(t);o.stop(t+1.35)}f.connect(g);g.connect(BUS.amb)}
function ambAudio(dt){if(!AC)return;if(!AMB){const nz=(type,fr,q)=>{const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=nb;s.loop=true;f.type=type;f.frequency.value=fr;f.Q.value=q;g.gain.value=0;s.connect(f);f.connect(g);g.connect(BUS.amb);s.start(0,Math.random());return{f,g}};AMB={w:nz("bandpass",420,.35),c:nz("bandpass",520,.35),t:nz("bandpass",320,.6)};
  const o=AC.createOscillator(),g=AC.createGain();o.type="triangle";o.frequency.value=620;g.gain.value=0;o.connect(g);g.connect(BUS.amb);o.start();AMB.m={o,g}}   // m: zumbido de los motores eléctricos
 const t=AC.currentTime,on=!mute&&(state==="play"||state==="spec"),sp=Math.hypot(vx,vz),inside=mode===3&&state==="play",high=HWL.on?1:0;
 // Viento: suave y grave, sube poco a poco con la velocidad y va a ráfagas lentas (nunca por encima del motor)
 AMB.w.g.gain.setTargetAtTime(on?Math.min(.3,(sp/60)**2*.16+.01+high*.02)*(1+Math.sin(t*.7)*.18+Math.sin(t*1.9)*.1)*(inside?.4:1):0,t,.4);AMB.w.f.frequency.setTargetAtTime(300+sp*5,t,.4);
 AMB.c.g.gain.setTargetAtTime(on?(.16+npcLvl*.09)*(high?.55:1)*(inside?.6:1):0,t,.4);
 let d=1e9,near=null;for(const q of TRN.pool)if(q.r)for(const m of q.cars)if(m.visible){const e=Math.hypot(m.position.x-px,m.position.z-pz);if(e<d){d=e;near=q}}const k=Math.max(0,1-d/380),s2=k*k*(inside?.6:1);
 // Tren: rodadura, zumbido de motores, traqueteo y bocina
 AMB.t.g.gain.setTargetAtTime(on?s2*.9:0,t,.3);AMB.m.g.gain.setTargetAtTime(on?s2*.12:0,t,.3);
 if(near&&on){const vr=near.prevD===undefined?0:(d-near.prevD)/Math.max(dt,.001);near.prevD=d;AMB.m.o.frequency.setTargetAtTime(620*(1-Math.max(-.12,Math.min(.12,vr/340))),t,.2);if(d<280&&!near.hk){near.hk=true;trainHorn(.45*k+.12)}}
 ambClk-=dt;if(on&&k>.08&&ambClk<0){ambClk=.62;trainClk(t,s2*1.5+.03);trainClk(t+.11,s2*1.2+.03)}
 ambHorn-=dt;if(on&&npcLvl>0&&ambHorn<0){ambHorn=18+Math.random()*30;hornSnd(30+Math.random()*30,.9+Math.random()*.25)}}
function thunderSnd(v){if(!AC||mute)return;const t=AC.currentTime,s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=nb;s.loop=true;s.playbackRate.value=.35;f.type="lowpass";f.frequency.setValueAtTime(380,t);f.frequency.exponentialRampToValueAtTime(90,t+4);
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v*.9,t+.15);g.gain.exponentialRampToValueAtTime(v*.3,t+1.2);g.gain.exponentialRampToValueAtTime(.001,t+5);s.connect(f);f.connect(g);g.connect(BUS.rain);s.start(t);s.stop(t+5.2)}
function audio(off){if(!AC)return;const t=AC.currentTime,on=!off&&!mute,sp=Math.hypot(vx,vz),vf=vx*Math.sin(h)+vz*Math.cos(h);
 const sq=Math.max(slipV>3.5&&sp>6?Math.min(1,(slipV-3)/6):0,brkL>.6&&vf>12?.5:0),f=(900+rpmD*(cur.rl-900))/30;
 eo.frequency.setTargetAtTime(f,t,.03);eo2.frequency.setTargetAtTime(f*.5,t,.03);eo3.frequency.setTargetAtTime(f*2,t,.03);
 if(ES.length){// Posición 0-5 entre los bucles; cada coche suena más agudo o más grave según su régimen máximo; leve vibración para que no suene repetitivo
  const p=Math.min(5,rpmD*5.4),cf=Math.sqrt(cur.rl/7500),jit=1+Math.sin(t*7.3)*.004+Math.sin(t*2.9)*.006;
  ES.forEach((e,i)=>{const w=Math.max(0,1-Math.abs(p-i));e.g.gain.setTargetAtTime(Math.sqrt(w),t,.04);e.s.playbackRate.setTargetAtTime(Math.pow(1.22,p-i)*cf*jit,t,.03)});
  ef.frequency.setTargetAtTime(1200+rpmD*3000+thrL*4000,t,.05);eg.gain.setTargetAtTime(on?.55+thrL*.45:0,t,.06)}
 else{ef.frequency.setTargetAtTime(300+rpmD*1400+thrL*1100,t,.05);eg.gain.setTargetAtTime(on?.09+thrL*.11:0,t,.06)}ig.gain.setTargetAtTime(on?thrL*rpmD*.05:0,t,.08);nf.frequency.setTargetAtTime(1800+sq*900,t,.05);ng.gain.setTargetAtTime(on?sq*.16:0,t,.05)}
