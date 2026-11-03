// Sonido: motor con grabaciones reales (sounds/engine, CC0 de domasx2 en OpenGameArt), chirrido, golpes y claxon
// Si las grabaciones no cargan, el motor se genera por código
let AC=null,mute=false,eo,eo2,eo3,ef,eg,ig,nf,ng,nb,aMaster,crashT=0;const ES=[];
// Canales con su propio volumen (menú de ajustes): motor, efectos (golpes y chirridos), lluvia y truenos, claxon
const BUS={};
function setVol(){if(typeof radioVol==="function")radioVol();if(!AC)return;const v=ENV.vol,t=AC.currentTime;aMaster.gain.setTargetAtTime(.5*v.m,t,.05);BUS.eng.gain.setTargetAtTime(v.e,t,.05);BUS.fx.gain.setTargetAtTime(v.fx,t,.05);BUS.rain.gain.setTargetAtTime(v.rain,t,.05);BUS.horn.gain.setTargetAtTime(v.horn,t,.05)}
function setMute(m){mute=m;$("snd").textContent=m?"🔇":"🔊";if(typeof radioVol==="function")radioVol()}
// Seis bucles del mismo motor a revoluciones crecientes: se mezclan los dos más cercanos a las rpm y se ajusta su velocidad de reproducción
function loadEngine(){Promise.all([0,1,2,3,4,5].map(i=>fetch(`sounds/engine/loop${i}.wav`).then(r=>r.arrayBuffer()).then(b=>new Promise((ok,ko)=>AC.decodeAudioData(b,ok,ko)))))
 .then(bufs=>{bufs.forEach(b=>{const s=AC.createBufferSource(),g=AC.createGain();s.buffer=b;s.loop=true;g.gain.value=0;s.connect(g);g.connect(ef);s.start();ES.push({s,g})});eo.disconnect();eo2.disconnect();eo3.disconnect()})
 .catch(e=>console.warn("Sonido de motor por código:",e))}
function initAudio(){if(AC){if(AC.state==="suspended")AC.resume();return}
 try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){return}
 aMaster=AC.createGain();aMaster.gain.value=.5;aMaster.connect(AC.destination);
 for(const k of["eng","fx","rain","horn"]){BUS[k]=AC.createGain();BUS[k].connect(aMaster)}setVol();
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
