// Sonido (generado por código): motor, chirrido y golpes
let AC=null,mute=false,eo,eo2,eo3,ef,eg,ig,nf,ng,nb,aMaster,crashT=0;
function setMute(m){mute=m;$("snd").textContent=m?"🔇":"🔊"}
function initAudio(){if(AC){if(AC.state==="suspended")AC.resume();return}
 try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){return}
 aMaster=AC.createGain();aMaster.gain.value=.5;aMaster.connect(AC.destination);
 // Motor: frecuencia de explosiones (fundamental) + subarmónico grave + 2º armónico, con saturación suave y filtro según acelerador
 ef=AC.createBiquadFilter();ef.type="lowpass";ef.Q.value=1.2;eg=AC.createGain();eg.gain.value=0;
 const ws=AC.createWaveShaper(),cu=new Float32Array(1024);for(let k=0;k<1024;k++){const x=k/511.5-1;cu[k]=Math.tanh(2.2*x)}ws.curve=cu;
 const mix=(type,gain)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=type;g.gain.value=gain;o.connect(g);g.connect(ws);o.start();return o};
 eo=mix("sawtooth",.35);eo2=mix("sine",.6);eo3=mix("triangle",.25);ws.connect(ef);ef.connect(eg);eg.connect(aMaster);
 nb=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate);const d=nb.getChannelData(0);for(let k=0;k<d.length;k++)d[k]=Math.random()*2-1;
 // Admisión: ruido filtrado que sube al acelerar
 const is=AC.createBufferSource(),inf=AC.createBiquadFilter();is.buffer=nb;is.loop=true;inf.type="bandpass";inf.frequency.value=700;inf.Q.value=.8;ig=AC.createGain();ig.gain.value=0;is.connect(inf);inf.connect(ig);ig.connect(aMaster);is.start();
 const ns=AC.createBufferSource();ns.buffer=nb;ns.loop=true;nf=AC.createBiquadFilter();nf.type="bandpass";nf.Q.value=3;ng=AC.createGain();ng.gain.value=0;ns.connect(nf);nf.connect(ng);ng.connect(aMaster);ns.start()}
function thump(v){if(!AC||mute)return;const t=AC.currentTime,s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=nb;f.type="lowpass";f.frequency.value=450;
 g.gain.setValueAtTime(Math.min(1,v/20),t);g.gain.exponentialRampToValueAtTime(.001,t+.4);s.connect(f);f.connect(g);g.connect(aMaster);s.start(t);s.stop(t+.45)}
function hornSnd(dist,p){if(!AC||mute)return;const v=.22*Math.max(0,1-dist/70);if(v<.01)return;const t=AC.currentTime,f=AC.createBiquadFilter(),g=AC.createGain();
 f.type="lowpass";f.frequency.value=1800;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.02);g.gain.setValueAtTime(v,t+.3);g.gain.linearRampToValueAtTime(0,t+.36);
 for(const fr of[392,494]){const o=AC.createOscillator();o.type="square";o.frequency.value=fr*(p||1);o.connect(f);o.start(t);o.stop(t+.4)}f.connect(g);g.connect(aMaster)}
function audio(off){if(!AC)return;const t=AC.currentTime,on=!off&&!mute,sp=Math.hypot(vx,vz),vf=vx*Math.sin(h)+vz*Math.cos(h);
 const sq=Math.max(slipV>3.5&&sp>6?Math.min(1,(slipV-3)/6):0,brkL>.6&&vf>12?.5:0),f=(900+rpmD*(cur.rl-900))/30;
 eo.frequency.setTargetAtTime(f,t,.03);eo2.frequency.setTargetAtTime(f*.5,t,.03);eo3.frequency.setTargetAtTime(f*2,t,.03);ef.frequency.setTargetAtTime(300+rpmD*1400+thrL*1100,t,.05);
 eg.gain.setTargetAtTime(on?.09+thrL*.11:0,t,.06);ig.gain.setTargetAtTime(on?thrL*rpmD*.05:0,t,.08);nf.frequency.setTargetAtTime(1800+sq*900,t,.05);ng.gain.setTargetAtTime(on?sq*.16:0,t,.05)}
