// Sitios especiales del mapa (2026-11-04, a partir de las capturas del usuario):
// - Patio del templo grande (el Zōjō-ji, junto a la torre): grava, caminos de losas, farolillos de piedra y una puerta en la entrada
// - Zona de derrape en la gran explanada vacía al este: asfalto con marcas de neumático, conos y neumáticos apilados, sin carteles
// - Campo de béisbol en el campo de deporte rectangular del oeste: diamante de tierra, césped a franjas, líneas, red y gradas
// Los suelos se hacen con las mismas casillas que la acera (GSD de buildGround): solo donde hay acera, sin calles ni edificios

// Une varias geometrías (sin índices) en una sola, para usarla en instancias
function mergeGeo(list){list=list.map(g=>g.index?g.toNonIndexed():g);let n=0;for(const g of list)n+=g.attributes.position.count;const P=new Float32Array(n*3),N=new Float32Array(n*3);let o=0;
 for(let g of list){g=g.index?g.toNonIndexed():g;if(!g.attributes.normal)g.computeVertexNormals();P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);o+=g.attributes.position.count}
 const r=new THREE.BufferGeometry();r.setAttribute("position",new THREE.BufferAttribute(P,3));r.setAttribute("normal",new THREE.BufferAttribute(N,3));return r}
const PLC={};
// Casillas de acera libres alrededor de unas semillas (sin calle a menos de 0,8 m, sin edificio, parque ni agua), hasta maxR del centro
function placeCells(seeds,cx,cz,maxR){const N=GSN,GS=GSS,SD=GSD,set=new Set();
 const GB=MAP.green.map(g=>{const p=g.p;let a=1e9,b=1e9,c=-1e9,d=-1e9;for(let i=0;i<p.length;i+=2){a=Math.min(a,p[i]);c=Math.max(c,p[i]);b=Math.min(b,p[i+1]);d=Math.max(d,p[i+1])}return[a,b,c,d]});
 const green=(x,z)=>MAP.green.some((g,k)=>{const q=GB[k];return x>q[0]&&x<q[2]&&z>q[1]&&z<q[3]&&inPoly(g.p,x,z)});
 const ok=o=>{const i=o%N,j=(o/N)|0;if(i<1||j<1||i>N-3||j>N-3)return false;if(SD[o]<=.8||SD[o+1]<=.8||SD[o+N]<=.8||SD[o+N+1]<=.8)return false;
  const x=i*GS+GS/2,z=j*GS+GS/2;return Math.hypot(x-cx,z-cz)<maxR&&!inBuilding(x,z)&&!green(x,z)&&riverD(x,z)>1&&!inWater(x,z)};
 const q=[];for(const[x,z]of seeds){const o=Math.floor(z/GS)*N+Math.floor(x/GS);if(ok(o)&&!set.has(o)){set.add(o);q.push(o)}}
 while(q.length){const c=q.pop();for(const d of[1,-1,N,-N]){const e=c+d;if(!set.has(e)&&ok(e)){set.add(e);q.push(e)}}}
 return set}
const cellIn=(set,x,z)=>set.has(Math.floor(z/GSS)*GSN+Math.floor(x/GSS));
// Suelo de esas casillas a la altura de la acera (un poco por encima), con la textura repetida cada `rep` metros
function cellMesh(set,mat,rep,dy){const pos=[],uv=[],GS=GSS,N=GSN,y=CURB+(dy||.012);
 for(const o of set){const x=(o%N)*GS,z=((o/N)|0)*GS;pos.push(x,y,z,x,y,z+GS,x+GS,y,z+GS,x,y,z,x+GS,y,z+GS,x+GS,y,z);for(const[a,b]of[[x,z],[x,z+GS],[x+GS,z+GS],[x,z],[x+GS,z+GS],[x+GS,z]])uv.push(a/rep,b/rep)}
 // Casillas del borde que dan a una calle: solo la parte que queda a más de 0,5 m del bordillo (borde recto, sin escalones)
 const SD=GSD,done=new Set();for(const o of set)for(const d of[1,-1,N,-N]){const e=o+d;if(set.has(e)||done.has(e))continue;done.add(e);const i=e%N,j=(e/N)|0,cx=i*GS+GS/2,cz=j*GS+GS/2;if(inBuilding(cx,cz))continue;
  const C=[[i*GS,j*GS,SD[e]-.5],[(i+1)*GS,j*GS,SD[e+1]-.5],[(i+1)*GS,(j+1)*GS,SD[e+N+1]-.5],[i*GS,(j+1)*GS,SD[e+N]-.5]],P=[];if(C.every(q=>q[2]>0)||C.every(q=>q[2]<=0))continue;
  for(let k=0;k<4;k++){const a=C[k],b=C[(k+1)%4];if(a[2]>0)P.push(a);if((a[2]>0)!==(b[2]>0)){const t=a[2]/(a[2]-b[2]);P.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])}}
  for(let k=1;k<P.length-1;k++)for(const q of[P[0],P[k+1],P[k]]){pos.push(q[0],y,q[1]);uv.push(q[0]/rep,q[1]/rep)}}
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();
 const m=new THREE.Mesh(g,mat);m.receiveShadow=true;sc.add(m);return m}
const plMat=(tex,o)=>beamMat(new THREE.MeshLambertMaterial(Object.assign({map:tex,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-3},o||{})));

function buildPlaces(){try{buildTemple()}catch(e){console.error(e)}try{buildDrift()}catch(e){console.error(e)}try{buildBaseball()}catch(e){console.error(e)}}

// --- Patio del templo ---
function buildTemple(){const area=R=>{let A=0;for(let i=0,j=R.length-2;i<R.length;j=i,i+=2)A+=R[j]*R[i+1]-R[i]*R[j+1];return Math.abs(A)/2};
 const cen=R=>{let x=0,z=0;for(let i=0;i<R.length;i+=2){x+=R[i];z+=R[i+1]}return[x/(R.length/2),z/(R.length/2)]};
 // El templo grande más cercano a la torre (el Zōjō-ji; hay otro templo grande más lejos, al oeste)
 let T=null,td=1e9;for(const b of MAP.buildings)if(b.k===1&&area(b.p)>1500){const[x,z]=cen(b.p),d=Math.hypot(x-TX,z-TZ);if(d<td){td=d;T=b}}if(!T)return;
 const[tx,tz]=cen(T.p),o=obb(T.p);
 // Semillas: anillo alrededor del templo
 const seeds=[];for(let a=0;a<PI*2;a+=PI/16)for(const d of[o.hu+6,o.hv+6,40])seeds.push([tx+Math.cos(a)*d,tz+Math.sin(a)*d]);
 const set=placeCells(seeds,tx,tz,140);if(set.size<50)return;PLC.temple=set;
 // Grava clara con piedrecitas y marcas de rastrillo
 const grav=canvasTex(512,512,(g,w)=>{g.fillStyle="#8d877b";g.fillRect(0,0,w,w);const r=rng(41);for(let i=0;i<26000;i++){const v=100+r()*70|0;g.fillStyle=`rgba(${v},${v-6},${v-18},.55)`;g.fillRect(r()*w,r()*w,1+r()*2,1+r()*2)}
  g.strokeStyle="rgba(120,110,95,.18)";g.lineWidth=2;for(let y=8;y<w;y+=16){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke()}},true);
 cellMesh(set,plMat(grav),6);
 // Caminos de losas: del templo a la puerta grande (la que haya cerca) y al otro lado hacia la calle
 const stone=canvasTex(256,256,(g,w)=>{g.fillStyle="#9d9a93";g.fillRect(0,0,w,w);const r=rng(7);for(let y=0;y<4;y++)for(let x=0;x<4;x++){const v=165+r()*30|0;g.fillStyle=`rgb(${v},${v-3},${v-8})`;g.fillRect(x*64+(y%2)*32+2,y*64+2,60,60)}},true);
 const gates=MAP.buildings.filter(b=>b.k===3).map(b=>cen(b.p)).filter(([x,z])=>Math.hypot(x-tx,z-tz)<200);
 const dirs=[];if(gates.length){gates.sort((a,b)=>Math.hypot(a[0]-tx,a[1]-tz)-Math.hypot(b[0]-tx,b[1]-tz));const[gx,gz]=gates[0],l=Math.hypot(gx-tx,gz-tz);dirs.push([(gx-tx)/l,(gz-tz)/l]);dirs.push([-(gx-tx)/l,-(gz-tz)/l])}
 else dirs.push([Math.cos(o.a),Math.sin(o.a)],[-Math.cos(o.a),-Math.sin(o.a)]);
 // y hacia la explanada más grande (el centro de las casillas de grava), si no coincide con los otros caminos
 {let bd=null,bl=0;for(let k=0;k<32;k++){const a=k/32*PI*2,d=[Math.cos(a),Math.sin(a)];let run=0,st=false;for(let s=0;s<160;s+=2){const x=tx+d[0]*s,z=tz+d[1]*s;if(cellIn(set,x,z)){st=true;run+=2}else if(st&&!inBuilding(x,z))break}if(run>bl){bl=run;bd=d}}
  if(bd&&bl>30&&dirs.every(q=>q[0]*bd[0]+q[1]*bd[1]<.8))dirs.push(bd)}
 const pth=[],lan=[],sp=new Set();const pw=2.6;
 for(const[dx,dz]of dirs){let last=null,started=false,gap=0;const lx=-dz,lz=dx;
  for(let d=0;d<200;d+=1){const x=tx+dx*d,z=tz+dz*d;const inn=cellIn(set,x,z)&&cellIn(set,x+lx*pw,z+lz*pw)&&cellIn(set,x-lx*pw,z-lz*pw);
   // (huecos pequeños en la grava, como un parterre o una farola, no cortan el camino: solo una calle o 10 m sin grava)
   if(!inn){if(started&&(roadAt(x,z)>=0||++gap>10))break;continue}started=true;gap=0;
   pth.push([x,z]);if(Math.round(d)%9===0)for(const s of[-1,1]){const X=x+lx*(pw+2)*s,Z=z+lz*(pw+2)*s;if(cellIn(set,X,Z))lan.push([X,0,Z,Math.atan2(dx,dz)])}last=[x,z,d]}
  // Puerta en la entrada del lado de la calle (si no hay ya una puerta grande de verdad cerca de ese extremo)
  if(last&&!gates.some(([gx,gz])=>Math.hypot(gx-last[0],gz-last[1])<25))sp.add(JSON.stringify([last[0]-dx*4,last[1]-dz*4,Math.atan2(dx,dz)]))}
 {const pos=[],uv=[],y=CURB+.03;for(let i=1;i<pth.length;i++){const[a,b]=pth[i-1],[c,d]=pth[i];if(Math.hypot(c-a,d-b)>1.5)continue;const l=Math.hypot(c-a,d-b)||1,lx=-(d-b)/l*pw,lz=(c-a)/l*pw;
   const P=[[a+lx,b+lz],[c+lx,d+lz],[c-lx,d-lz],[a-lx,b-lz]];for(const k of[0,1,2,0,2,3]){pos.push(P[k][0],y,P[k][1]);uv.push(P[k][0]/4,P[k][1]/4)}}
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();
  const n=g.attributes.normal.array;for(let i=1;i<n.length;i+=3)n[i]=Math.abs(n[i]);const m=new THREE.Mesh(g,plMat(stone,{side:THREE.DoubleSide,polygonOffsetFactor:-2}));m.receiveShadow=true;sc.add(m)}
 // Farolillos de piedra (tōrō): base, poste, caja de la luz, tejadillo y remate
 const lg=mergeGeo([new THREE.BoxGeometry(1,.3,1).translate(0,.15,0),new THREE.CylinderGeometry(.16,.2,1.1,8).translate(0,.85,0),new THREE.BoxGeometry(.75,.2,.75).translate(0,1.5,0),
  new THREE.BoxGeometry(.55,.5,.55).translate(0,1.85,0),new THREE.ConeGeometry(.65,.45,4).rotateY(PI/4).translate(0,2.32,0),new THREE.SphereGeometry(.12,8,6).translate(0,2.62,0)]);
 inst(lg,new THREE.MeshLambertMaterial({color:0x9c998f}),lan,0,true);for(const q of lan)addCirc(q[0],q[2],.55);
 for(const s of sp){const[x,z,a]=JSON.parse(s);templeGate(x,z,a)}}
// Puerta de templo de dos pisos (estilo sanmon), roja con tejados oscuros. a = dirección del camino que la cruza
function templeGate(x,z,a){const G=new THREE.Group(),red=new THREE.MeshLambertMaterial({color:0xb5382c}),roof=new THREE.MeshLambertMaterial({color:0x3b3f45}),wh=new THREE.MeshLambertMaterial({color:0xe9e3d6});
 const box=(w,h,d,m,px,py,pz)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(px,py,pz);o.castShadow=true;o.receiveShadow=true;G.add(o);return o};
 const W2=7,D2=3.2;for(const u of[-W2,-2.4,2.4,W2])for(const v of[-D2,D2]){const c=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,6,10),red);c.position.set(u,3,v);c.castShadow=true;G.add(c)}
 box(W2*2+1,.6,D2*2+1,red,0,6.2,0);
 const hip=(w,d,h,y)=>{const g=new THREE.CylinderGeometry(.4,1,h,4,1).rotateY(PI/4);g.scale(w/1.41,1,d/1.41);const o=new THREE.Mesh(g,roof);o.position.y=y+h/2;o.castShadow=true;G.add(o)};
 hip(W2*2+5,D2*2+5,1.6,6.5);box(W2*2-1,3.2,D2*2-.6,red,0,9.7,0);box(W2*2-1.6,1.2,D2*2-.4,wh,0,9.3,0);hip(W2*2+4,D2*2+4,2.4,11.2);
 G.position.set(x,CURB,z);G.rotation.y=a+PI/2;sc.add(G);
 const c=Math.cos(G.rotation.y),s=Math.sin(G.rotation.y);for(const u of[-W2,-2.4,2.4,W2])for(const v of[-D2,D2])addCirc(x+u*c+v*s,z-u*s+v*c,.6)}

// --- Zona de derrape (sin carteles: se nota por las marcas, los conos y los neumáticos) ---
function buildDrift(){const cx=1553,cz=1155;let best=null;
 // La explanada grande y vacía al sureste del templo (la de la captura): la región libre más grande cerca de ese punto
 const set=placeCells([[cx,cz],[cx+20,cz],[cx-20,cz],[cx,cz+20],[cx,cz-20]],cx,cz,150);if(set.size<200)return;PLC.drift=set;
 const tex=canvasTex(1024,1024,(g,w)=>{g.fillStyle="#46484d";g.fillRect(0,0,w,w);const r=rng(99);for(let i=0;i<30000;i++){const v=58+r()*36|0;g.fillStyle=`rgba(${v},${v},${v+3},.6)`;g.fillRect(r()*w,r()*w,1+r()*1.5,1+r()*1.5)}
  // Rayas de aparcamiento viejas y casi borradas
  g.strokeStyle="rgba(220,220,210,.07)";g.lineWidth=4;for(let x=40;x<w;x+=80){g.beginPath();g.moveTo(x,60);g.lineTo(x,260);g.stroke()}
  // Marcas de neumático: círculos (donuts), curvas largas y ochos
  g.lineCap="round";const arc=(x,y,R,a0,a1,al)=>{for(const o of[-9,9]){g.strokeStyle=`rgba(10,10,12,${al})`;g.lineWidth=7;g.beginPath();g.arc(x,y,R+o,a0,a1);g.stroke()}};
  for(let i=0;i<3;i++)arc(r()*w,r()*w,35+r()*30,0,PI*2,.08+r()*.07);
  for(let i=0;i<6;i++){const a=r()*PI*2;arc(r()*w,r()*w,120+r()*260,a,a+.5+r()*1.2,.06+r()*.08)}
  {const x=r()*w,y=r()*w,R=40;arc(x-R,y,R,0,PI*2,.09);arc(x+R,y,R,0,PI*2,.09)}},true);
 cellMesh(set,plMat(tex),110,.014);
 // Conos y neumáticos: en unos pocos sitios, como si alguien hubiera montado un recorrido y se hubiera ido
 const cells=[...set],r=rng(5),cones=[],tires=[];const pick=()=>{const o=cells[Math.floor(r()*cells.length)];return[(o%GSN)*GSS+GSS/2,((o/GSN)|0)*GSS+GSS/2]};
 for(let k=0;k<4;k++){const[x,z]=pick(),a=r()*PI*2;for(let i=0;i<6;i++){const X=x+Math.sin(a)*i*7,Z=z+Math.cos(a)*i*7;if(cellIn(set,X,Z))cones.push([X,CURB,Z,r()*PI,1,1,r()<.15?0xffffff:0xff6a1a])}}
 for(let k=0;k<5;k++){const[x,z]=pick();for(let i=0;i<3;i++){const X=x+(i%2)*.7,Z=z+(i>1?.6:0);if(!cellIn(set,X,Z))continue;const h=2+Math.floor(r()*3);for(let j=0;j<h;j++)tires.push([X,CURB+j*.26,Z,r()*PI]);addCirc(X,Z,.45)}}
 const cg=mergeGeo([new THREE.BoxGeometry(.42,.04,.42).translate(0,.02,0),new THREE.ConeGeometry(.17,.68,12).translate(0,.38,0)]);
 inst(cg,new THREE.MeshLambertMaterial({color:0xffffff}),cones,0,true);
 inst(new THREE.TorusGeometry(.3,.12,6,14).rotateX(PI/2).translate(0,.12,0),new THREE.MeshLambertMaterial({color:0x1d1e21}),tires,0,true)}

// --- Campo de béisbol ---
function buildBaseball(){const area=R=>{let A=0;for(let i=0,j=R.length-2;i<R.length;j=i,i+=2)A+=R[j]*R[i+1]-R[i]*R[j+1];return Math.abs(A)/2};
 // El campo de deporte rectangular de unos 100 × 57 m (el rectángulo verde de la captura)
 let F=null;for(const g of MAP.green){if(g.k!==2||g.p.length!==8)continue;const a=area(g.p);if(a<4000||a>9000)continue;if(!F||Math.hypot(g.p[0]-1139,g.p[1]-945)<Math.hypot(F.p[0]-1139,F.p[1]-945))F=g}if(!F)return;
 const p=F.p;let o0=0,ul=Math.hypot(p[2]-p[0],p[3]-p[1]),vl=Math.hypot(p[6]-p[0],p[7]-p[1]);
 // Esquina de la base de meta: la primera; u = lado largo, v = lado corto
 let O=[p[0],p[1]],U=[(p[2]-p[0])/ul,(p[3]-p[1])/ul],V=[(p[6]-p[0])/vl,(p[7]-p[1])/vl];if(vl>ul){const t=U;U=V;V=t;const q=ul;ul=vl;vl=q}
 const L=(u,v)=>[O[0]+U[0]*u+V[0]*v,O[1]+U[1]*u+V[1]*v];
 const PX=10;const tex=canvasTex(Math.round(ul*PX),Math.round(vl*PX),(g,w,h)=>{const X=u=>u*PX,Y=v=>v*PX;
  // Césped a franjas
  for(let i=0;i<w;i+=40){g.fillStyle=(i/40)%2?"#4f8f3f":"#5a9c48";g.fillRect(i,0,40,h)}
  const hx=6,hy=6,B=27.4,dirt="#b5835a";
  // Tierra del cuadro: abanico alrededor de la meta y el diamante
  g.fillStyle=dirt;g.beginPath();g.moveTo(X(hx),Y(hy));g.arc(X(hx),Y(hy),X(B+9),0,PI/2);g.closePath();g.fill();
  g.fillStyle="#5a9c48";g.beginPath();g.moveTo(X(hx+3),Y(hy+3));g.lineTo(X(hx+B-3.5),Y(hy+3));g.lineTo(X(hx+B-3.5),Y(hy+B-3.5));g.lineTo(X(hx+3),Y(hy+B-3.5));g.closePath();g.fill();
  // Círculo de la meta, montículo y bases
  g.fillStyle=dirt;g.beginPath();g.arc(X(hx),Y(hy),X(4),0,PI*2);g.fill();g.beginPath();g.arc(X(hx+B/2),Y(hy+B/2),X(2.7),0,PI*2);g.fill();
  g.fillStyle="#fff";for(const[u,v]of[[hx+B,hy],[hx+B,hy+B],[hx,hy+B]])g.fillRect(X(u)-4,Y(v)-4,8,8);g.fillRect(X(hx+B/2)-3,Y(hy+B/2)-1,6,2);
  g.beginPath();g.moveTo(X(hx)-4,Y(hy)-4);g.lineTo(X(hx)+4,Y(hy)-4);g.lineTo(X(hx)+4,Y(hy)+2);g.lineTo(X(hx),Y(hy)+5);g.lineTo(X(hx)-4,Y(hy)+2);g.fill();
  // Líneas de foul hasta el final del campo, cajas de bateo y pista de aviso junto a los bordes
  g.strokeStyle="#f2f2ee";g.lineWidth=2.5;g.beginPath();g.moveTo(X(hx),Y(hy));g.lineTo(X(ul-1),Y(hy));g.moveTo(X(hx),Y(hy));g.lineTo(X(hx),Y(vl-1));g.stroke();
  g.strokeRect(X(hx+.6),Y(hy-1.8),X(1.2),Y(1.1));g.strokeRect(X(hx-1.8),Y(hy+.6),X(1.1),Y(1.2));
  g.fillStyle="#a3774f";g.fillRect(X(ul-3),0,X(3),h);g.fillRect(0,Y(vl-3),w,Y(3));
  const r=rng(3);for(let i=0;i<9000;i++){g.fillStyle=`rgba(0,0,0,${r()*.06})`;g.fillRect(r()*w,r()*h,2,2)}});
 {const y=CURB+.02,P=[L(0,0),L(ul,0),L(ul,vl),L(0,vl)],pos=[],uv=[[0,1],[1,1],[1,0],[0,0]].map(([a,b])=>[a,b]),U2=[];
  for(const k of[0,2,1,0,3,2]){pos.push(P[k][0],y,P[k][1]);U2.push(uv[k][0],uv[k][1])}
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(U2,2));g.computeVertexNormals();
  const n=g.attributes.normal.array;for(let i=1;i<n.length;i+=3)n[i]=1;const m=new THREE.Mesh(g,plMat(tex,{side:THREE.DoubleSide,polygonOffsetFactor:-2}));m.receiveShadow=true;sc.add(m)}
 // Red detrás de la meta y valla en los dos lados del fondo (malla metálica que deja ver a través)
 const net=canvasTex(64,64,(g,w)=>{g.clearRect(0,0,w,w);g.strokeStyle="rgba(60,64,70,.85)";g.lineWidth=2;for(let i=-w;i<w*2;i+=16){g.beginPath();g.moveTo(i,0);g.lineTo(i+w,w);g.stroke();g.beginPath();g.moveTo(i+w,0);g.lineTo(i,w);g.stroke()}},true);
 const nm=new THREE.MeshLambertMaterial({map:net,transparent:true,side:THREE.DoubleSide,depthWrite:false}),post=new THREE.MeshLambertMaterial({color:0x5c6068});
 const fence=(a,b,h)=>{const[x0,z0]=a,[x1,z1]=b,l=Math.hypot(x1-x0,z1-z0);const pl=new THREE.Mesh(new THREE.PlaneGeometry(l,h),nm);net.repeat&&0;pl.geometry.attributes.uv.array.forEach((v,i,arr)=>{arr[i]=i%2?v*h/1.2:v*l/1.2});
  pl.position.set((x0+x1)/2,CURB+h/2,(z0+z1)/2);pl.rotation.y=-Math.atan2(z1-z0,x1-x0);sc.add(pl);
  for(let t=0;t<=l;t+=Math.max(3,l/Math.ceil(l/4))){const c=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,h,6),post);c.position.set(x0+(x1-x0)*t/l,CURB+h/2,z0+(z1-z0)*t/l);sc.add(c)}
  for(let t=0;t<l;t+=.5){const f=t/l,g=Math.min(1,(t+.5)/l);addEdge(x0+(x1-x0)*f,z0+(z1-z0)*f,x0+(x1-x0)*g,z0+(z1-z0)*g)}};
 fence(L(0,9),L(2.2,2.2),5.5);fence(L(2.2,2.2),L(9,0),5.5);fence(L(ul-.4,.4),L(ul-.4,vl-.4),2.2);fence(L(.4,vl-.4),L(ul-.4,vl-.4),2.2);
 // Gradas pequeñas de hormigón en las dos bandas (fuera de las líneas de foul)
 const st=new THREE.MeshLambertMaterial({color:0xa9abaf});const stand=(u0,v0,alongU)=>{const len=16;for(let k=0;k<3;k++){const w=alongU?len:1,d=alongU?1:len,u=alongU?u0+len/2:u0+k,v=alongU?v0+k:v0+len/2;
   const[x,z]=L(alongU?u:u0+k+.5,alongU?v0+k+.5:v);const o=new THREE.Mesh(new THREE.BoxGeometry(alongU?len:1,.45*(3-k),alongU?1:len),st);o.position.set(x,CURB+.225*(3-k),z);o.rotation.y=-Math.atan2(U[1],U[0]);o.castShadow=o.receiveShadow=true;sc.add(o)}
  const a=L(u0,v0),b=alongU?L(u0+len,v0+3):L(u0+3,v0+len);const c0=alongU?L(u0,v0+1.5):L(u0+1.5,v0),c1=alongU?L(u0+len,v0+1.5):L(u0+1.5,v0+len);addCaps(c0[0],c0[1],c1[0],c1[1],1.6)};
 stand(34,1.2,true);stand(1.2,34,false)}
