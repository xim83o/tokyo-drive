// Clima: lluvia aleatoria (más o menos 1 de cada 5 días de juego), a veces con tormenta (relámpagos y truenos). La lluvia oscurece
// el cielo, añade niebla, moja el asfalto (charcos que reflejan las luces), reduce el agarre, levanta agua de las ruedas y, solo en la
// cámara interior, deja gotas en el cristal. En el menú de coches se puede elegir: Aleatorio, Despejado, Lluvia o Tormenta
const RAINQ=[700,1800,3600,6000],WSEED=Math.floor(Math.random()*1e6);
let rainMesh=null,rainN=0,rainT=0,wDay=-1,wPlan=null,thT=8,dropT=0;const RB=60,RH=34;
// "Días de juego" según el modo de hora: ciclo → días simulados; Tokio real → días reales; día/noche fijos → cada 15 min reales
function gameDay(){const el=(performance.now()/1000-T0)/60;if(ENV.mode==="real"){const d=new Date();return Math.floor(d.getTime()/864e5)+HOUR/24}
 if(ENV.mode==="cycle")return(10+el/ENV.cycle*24)/24;return el/15}
function planDay(d){const r=rng(WSEED+d*7919+13);r();const rain=r()<.2,start=r()*.75,dur=.06+r()*.18;return{rain,start,end:start+dur,amt:.5+r()*.5,storm:rain&&r()<.35}}
function buildRain(n){if(rainMesh){sc.remove(rainMesh);rainMesh.geometry.dispose()}rainN=n;if(!n){rainMesh=null;return}
 const p=new Float32Array(n*6),r=rng(5);for(let i=0;i<n;i++){const x=(r()-.5)*RB,y=r()*RH,z=(r()-.5)*RB;p.set([x,y,z,x,y-.7,z],i*6)}
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(p,3));
 rainMesh=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xb8c4d0,transparent:true,opacity:0,depthWrite:false,fog:false}));rainMesh.frustumCulled=false;sc.add(rainMesh)}
// Agua que levantan las ruedas sobre asfalto mojado
const SPR=[];let sprI=0;
function sprayInit(){const t=canvasTex(32,32,(g)=>{const gr=g.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,"rgba(255,255,255,.8)");gr.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=gr;g.fillRect(0,0,32,32)});
 for(let k=0;k<40;k++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,opacity:0,depthWrite:false,color:0xd8dde2}));s.visible=false;sc.add(s);SPR.push({s,l:9,vx:0,vy:0,vz:0})}}
// Gotas en el cristal (solo cámara interior): lienzo encima del juego
const DROPS=[];let dcv=null,dctx=null;
function dropsInit(){dcv=document.createElement("canvas");dcv.id="drops";dcv.style.cssText="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2";document.body.appendChild(dcv);dctx=dcv.getContext("2d")}
function drawDrops(dt,on){if(!dcv)dropsInit();const w=dcv.width=innerWidth/2|0,h=dcv.height=innerHeight/2|0;dcv.hidden=!on;if(!on){DROPS.length=0;return}
 const sp=Math.hypot(vx,vz);if(Math.random()<WEA.rain*dt*60*.5)DROPS.push({x:Math.random()*w,y:Math.random()*h,r:1.5+Math.random()*4.5,v:0,life:4+Math.random()*4});
 for(let i=DROPS.length-1;i>=0;i--){const d=DROPS[i];d.life-=dt;d.v+=(d.r>4?40:8)*dt+sp*.02;d.y+=d.v*dt;d.x+=sp*.15*(d.x/w-.5)*dt*20;if(d.life<0||d.y>h+10){DROPS.splice(i,1);continue}
  const g=dctx.createRadialGradient(d.x-d.r*.3,d.y-d.r*.3,0,d.x,d.y,d.r);g.addColorStop(0,"rgba(255,255,255,.55)");g.addColorStop(.6,"rgba(190,205,220,.25)");g.addColorStop(1,"rgba(120,135,150,.08)");
  dctx.fillStyle=g;dctx.beginPath();dctx.ellipse(d.x,d.y,d.r*.85,d.r,0,0,7);dctx.fill()}if(DROPS.length>220)DROPS.splice(0,DROPS.length-220)}
let flashT=0;
function weather(dt){if(!ready)return;if(!SPR.length)sprayInit();const lv=qLevel();if(rainN!==RAINQ[lv])buildRain(RAINQ[lv]);
 // Lluvia objetivo según el modo elegido
 let target=0,storm=false;const gd=gameDay();
 if(ENV.wx==="rain"){target=.75}else if(ENV.wx==="storm"){target=1;storm=true}else if(ENV.wx!=="clear"){const d=Math.floor(gd);if(d!==wDay){wDay=d;wPlan=planDay(d)}const f=gd-d;
  if(wPlan.rain){const a=Math.min(1,Math.max(0,(f-wPlan.start)*30),Math.max(0,(wPlan.end-f)*30));target=wPlan.amt*a;storm=wPlan.storm&&a>.5}}
 WEA.rain+=(target-WEA.rain)*Math.min(1,dt*.25);WEA.cloud=.35+WEA.rain*.6;WEA.wet=WEA.rain>WEA.wet?WEA.wet+(WEA.rain-WEA.wet)*Math.min(1,dt*.15):Math.max(WEA.rain,WEA.wet-dt*.004);
 // Gotas cayendo alrededor de la cámara (caja que la sigue), con algo de viento
 if(rainMesh){rainMesh.material.opacity=Math.min(.55,WEA.rain*.6)*(state==="play"||state==="cars"?1:0);rainMesh.visible=WEA.rain>.02;
  if(rainMesh.visible){const p=rainMesh.geometry.attributes.position.array,fall=(18+WEA.rain*6)*dt,wx=2.5*dt,c=cam.position;rainMesh.position.set(c.x,0,c.z);
   for(let i=0;i<p.length;i+=6){let y=p[i+1]-fall,x=p[i]+wx;if(y<0){y+=RH;x=(Math.random()-.5)*RB;p[i+2]=(Math.random()-.5)*RB}if(x>RB/2)x-=RB;
    p[i]=x;p[i+1]=y;p[i+3]=x-.12;p[i+4]=y-.7-WEA.rain*.3;p[i+5]=p[i+2]}
   rainMesh.geometry.attributes.position.needsUpdate=true}}
 // Agua de las ruedas
 const sp=Math.hypot(vx,vz);if(state==="play"&&WEA.wet>.25&&sp>7){rainT+=dt;if(rainT>.035){rainT=0;const m=SPR[sprI];sprI=(sprI+1)%SPR.length;const s=Math.random()<.5?-1:1,c=Math.cos(h),sn=Math.sin(h);
  m.s.position.set(px+s*cur.w/2*c-sn*cur.l*.4,.35,pz-s*cur.w/2*sn-c*cur.l*.4);m.s.visible=true;m.l=0;m.vx=vx*.35+(Math.random()-.5)*2;m.vy=1+Math.random();m.vz=vz*.35+(Math.random()-.5)*2;m.o=Math.min(.5,WEA.wet*.6)*Math.min(1,sp/25)}}
 for(const m of SPR){if(m.l>=.9)continue;m.l+=dt;const u=m.l/.9,z=.8+u*2.5;m.s.position.x+=m.vx*dt;m.s.position.y+=m.vy*dt;m.s.position.z+=m.vz*dt;m.vy-=4*dt;m.s.scale.set(z,z,1);m.s.material.opacity=m.o*(1-u);if(u>=1)m.s.visible=false}
 // Tormenta: relámpago doble y trueno unos segundos después
 WEA.flash=Math.max(0,WEA.flash-dt*5);if(storm&&WEA.rain>.5){thT-=dt;if(thT<0){thT=8+Math.random()*20;WEA.flash=1;flashT=.18;const d=1+Math.random()*3;setTimeout(()=>thunderSnd(.6+Math.random()*.4),d*1000)}}
 if(flashT>0){flashT-=dt;if(flashT<=0&&Math.random()<.7)WEA.flash=.8}
 // Gotas en el cristal solo con la cámara interior
 dropT+=dt;if(dropT>.05){drawDrops(dropT,state==="play"&&mode===3&&WEA.rain>.05);dropT=0}
 rainAudio()}
