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
// Matriz de posición, giro (eje Y) y escala
const M4=(x,y,z,ry,sx,sy,sz)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),ry||0),new THREE.Vector3(sx||1,sy||1,sz||1));
// Punto local (u a lo ancho, v hacia delante) de un objeto girado ry, en coordenadas del mundo
const lw=(x,z,ry,u,v)=>[x+u*Math.cos(ry)+v*Math.sin(ry),z-u*Math.sin(ry)+v*Math.cos(ry)];
// Rectángulo girado como polígono de choque (como un edificio de altura h)
const rectPoly=(x,z,ry,hu,hv,h)=>{const R=[];for(const[u,v]of[[-hu,-hv],[hu,-hv],[hu,hv],[-hu,hv]])R.push(...lw(x,z,ry,u,v));addPoly(R,h)};
// Piezas sueltas de colores unidas en una sola malla (colores por vértice): add(geometría, color, matriz)
function vcBuild(){const P=[],N=[],C=[],c=new THREE.Color();
 return{add(g,col,m){g=g.index?g.toNonIndexed():g.clone();if(m)g.applyMatrix4(m);if(!g.attributes.normal)g.computeVertexNormals();c.set(col);
   const p=g.attributes.position.array,n=g.attributes.normal.array;for(let i=0;i<p.length;i++){P.push(p[i]);N.push(n[i])}for(let i=0;i<p.length/3;i++)C.push(c.r,c.g,c.b)},
  // pieza en coordenadas locales de un objeto colocado con la matriz W
  at(W,g,col,px,py,pz,sx,sy,sz,r){this.add(g,col,W.clone().multiply(M4(px,py,pz,r||0,sx,sy,sz)))},
  mesh(){if(!P.length)return null;const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(P,3));g.setAttribute("normal",new THREE.Float32BufferAttribute(N,3));g.setAttribute("color",new THREE.Float32BufferAttribute(C,3));
   const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true}));m.castShadow=m.receiveShadow=true;sc.add(m);return m}}}
// Geometrías base: caja de 1 m, prisma triangular a lo largo de X con el pico arriba (tejadillo de muro) y tejado a cuatro aguas (lado de la base ≈1,41)
const PBOX=new THREE.BoxGeometry(1,1,1),PPRI=new THREE.CylinderGeometry(1,1,1,3).rotateZ(Math.PI/2).rotateX(-Math.PI/2);
const hipG=t=>new THREE.CylinderGeometry(t,1,1,4,1).rotateY(Math.PI/4),cylG=(a,b,s)=>new THREE.CylinderGeometry(a,b,1,s||10);
// Luces de los sitios por la noche (env.js): [material, valor de día, aumento de noche] y [material, opacidad de noche]
NM.plN=[];NM.plO=[];

function buildPlaces(){try{buildTemple()}catch(e){console.error(e)}try{buildDrift()}catch(e){console.error(e)}try{buildBaseball()}catch(e){console.error(e)}try{buildMegaTower()}catch(e){console.error(e)}try{buildTrains()}catch(e){console.error(e)}}

// --- Megatorre de la empresa inventada Kurogane (黒鉄): monolito negro de 300 m, diseño propio, en la explanada del sur junto a la avenida ---
// Cinco cuerpos escalonados de cristal oscuro, aristas y franjas de neón rojo, pantallas gigantes y corona con mástil
const MGT={x:1364,z:1608,ry:.35,done:false};
// Reserva el sitio antes de decorate, para que no salgan árboles ni farolas dentro de la torre
function megaSite(){if(MGT.done)return;MGT.done=true;rectPoly(MGT.x,MGT.z,MGT.ry,27.5,27.5,300)}
function buildMegaTower(){megaSite();const{x,z,ry}=MGT,W=M4(x,CURB,z,ry),TR=[[27,0,26],[22,26,118],[18,118,196],[14,196,252],[10,252,284]];
 // Fachada: ventanas oscuras; algunas encendidas (mismo dibujo en el mapa de color y en el de luz)
 const cells=[];{const r=rng(77);for(let j=0;j<64;j++)for(let i=0;i<32;i++){const q=r();cells.push(q<.13?(r()<.2?"#ff3a3a":"#ffd9a8"):null)}}
 const draw=(em)=>(g,w,h)=>{g.fillStyle=em?"#000":"#0b0d12";g.fillRect(0,0,w,h);cells.forEach((c,k)=>{const i=k%32,j=(k/32)|0;if(em&&!c)return;g.fillStyle=em?c:c?"#3b404a":"#171c25";g.fillRect(i*16+2,j*16+3,12,9)});
   if(!em){g.fillStyle="#05060a";for(let i=0;i<32;i+=4)g.fillRect(i*16,0,2,h);for(let j=0;j<64;j+=8)g.fillRect(0,j*16,w,2)}};
 const wm=new THREE.MeshLambertMaterial({map:canvasTex(512,1024,draw(false),true),emissiveMap:canvasTex(512,1024,draw(true),true),emissive:0xffffff,emissiveIntensity:.02,envMap:SKYCUBE,reflectivity:.25,side:THREE.DoubleSide});NM.win.push(wm);NM.plN.push([wm,.02,1.2]);
 {const pos=[],uv=[];for(const[hs,y0,y1]of TR){const C=[[-hs,hs],[hs,hs],[hs,-hs],[-hs,-hs]];for(let k=0;k<4;k++){const A=lw(x,z,ry,...C[k]),B2=lw(x,z,ry,...C[(k+1)%4]),a=CURB+y0,b=CURB+y1,U=2*hs/28,v0=y0/84,v1=y1/84;
   pos.push(A[0],a,A[1],B2[0],a,B2[1],B2[0],b,B2[1],A[0],a,A[1],B2[0],b,B2[1],A[0],b,A[1]);uv.push(0,v0,U,v0,U,v1,0,v0,U,v1,0,v1)}}
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();const m=new THREE.Mesh(g,wm);m.castShadow=m.receiveShadow=true;sc.add(m)}
 // Cornisas, tejados y corona
 const B=vcBuild(),RK="#0a0b10";for(const[hs,,y1]of TR)B.at(W,PBOX,RK,0,y1,0,2*hs+1.2,1,2*hs+1.2);
 for(const u of[-8,8])for(const v of[-8,8])B.at(W,PBOX,RK,u,290,v,1.6,12,1.6);B.at(W,PBOX,RK,0,296,0,18,.8,18);B.at(W,PBOX,RK,0,287,0,9,6,9);B.at(W,cylG(.15,1,8),"#22252c",0,289.5,0,1,21,1);B.mesh();
 // Neón rojo: aristas de cada cuerpo, banda bajo cada cornisa y dos franjas por cara
 const G=[],gb=(sx,sy,sz,lx,ly,lz)=>G.push(PBOX.clone().applyMatrix4(W.clone().multiply(M4(lx,ly,lz,0,sx,sy,sz))));
 TR.forEach(([hs,y0,y1],t)=>{const h=y1-y0,m=(y0+y1)/2,e=hs+.15;for(const s of[-1,1])for(const u of[-1,1])gb(.7,h,.7,s*e,m,u*e);
  for(const s of[-1,1]){gb(2*hs+.6,.8,.4,0,y1-1.1,s*(hs+.2));gb(.4,.8,2*hs+.6,s*(hs+.2),y1-1.1,0)}
  if(t>0&&t<4)for(const s of[-1,1])for(const u of[-1,1]){gb(.5,h-8,.3,u*hs*.5,m,s*(hs+.15));gb(.3,h-8,.5,s*(hs+.15),m,u*hs*.5)}});
 for(const s of[-1,1]){gb(18.4,.5,.3,0,296.5,s*9.1);gb(.3,.5,18.4,s*9.1,296.5,0)}gb(.8,.8,.8,0,300,0);
 const rm=new THREE.MeshLambertMaterial({color:0x500a0c,emissive:0xff1622,emissiveIntensity:.8});NM.plN.push([rm,.8,1.7]);sc.add(new THREE.Mesh(mergeGeo(G),rm));
 // Cara k: 0 +z, 1 +x, 2 -z, 3 -x. Plano pegado a esa cara del cuerpo de medio ancho hs
 const onFace=(mat,w,h,k,hs,y,off)=>{const a=k*PI/2,q=lw(x,z,ry,Math.sin(a)*(hs+.3)+Math.cos(a)*(off||0),Math.cos(a)*(hs+.3)-Math.sin(a)*(off||0)),m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);m.position.set(q[0],CURB+y,q[1]);m.rotation.y=ry+a;sc.add(m);return m};
 // Pantallas gigantes (los mismos anuncios inventados de la ciudad, se redibujan desde env.js)
 const led=[0,1].map(i=>{const cv=document.createElement("canvas");cv.width=320;cv.height=180;const t=new THREE.CanvasTexture(cv),m=new THREE.MeshBasicMaterial({map:t,toneMapped:false});NM.led.push({g:cv.getContext("2d"),t,ph:i*2.3+.4});NM.ledT.push(m);return m});
 for(let k=0;k<4;k++){onFace(led[k%2],40,22.5,k,27,13);if(k%2===0)onFace(led[1-(k/2)],34,19,k,22,92)}
 // Logo y nombre de la empresa, y letrero vertical
 const lt=canvasTex(512,640,(g,w)=>{g.fillStyle="#06070b";g.fillRect(0,0,w,640);g.strokeStyle=g.fillStyle="#ff2a32";g.lineWidth=22;g.lineJoin="miter";const c=256,cy=220,R=165;g.beginPath();for(let i=0;i<6;i++){const a=PI/6+i*PI/3;g[i?"lineTo":"moveTo"](c+Math.cos(a)*R,cy+Math.sin(a)*R)}g.closePath();g.stroke();
  g.beginPath();g.moveTo(c-85,cy+95);g.lineTo(c-30,cy-110);g.lineTo(c+10,cy-110);g.lineTo(c-45,cy+95);g.closePath();g.fill();g.beginPath();g.moveTo(c+85,cy+95);g.lineTo(c-5,cy-20);g.lineTo(c+35,cy-20);g.lineTo(c+125,cy+95);g.closePath();g.fill();
  g.textAlign="center";g.textBaseline="middle";g.font="bold 74px Arial,sans-serif";g.fillText("KUROGANE",c,520);g.font="bold 42px 'Yu Gothic','Meiryo',sans-serif";g.fillText("黒鉄",c,595)});
 const lm=new THREE.MeshLambertMaterial({map:lt,emissiveMap:lt,emissive:0xffffff,emissiveIntensity:.7});NM.plN.push([lm,.7,1.6]);for(let k=0;k<4;k++)onFace(lm,20,25,k,14,228);
 const bt=canvasTex(128,1024,(g,w,h)=>{g.fillStyle="#06070b";g.fillRect(0,0,w,h);g.fillStyle="#ff2a32";g.font="bold 200px 'Yu Gothic','Meiryo',sans-serif";g.textAlign="center";g.textBaseline="middle";[..."黒鉄重工"].forEach((c,i)=>g.fillText(c,64,128+i*256,120))});
 const bm=new THREE.MeshLambertMaterial({map:bt,emissiveMap:bt,emissive:0xffffff,emissiveIntensity:.6});NM.plN.push([bm,.6,1.5]);for(const k of[1,3])onFace(bm,7.5,60,k,18,157);
 // En el mapa, como un edificio más
 const R=[];for(const[u,v]of[[-27,-27],[27,-27],[27,27],[-27,27]])R.push(...lw(x,z,ry,u,v));MAP.buildings.push({p:R,h:300,c:"#ff2a32"})}

// --- Patio del templo ---
function buildTemple(){const area=R=>{let A=0;for(let i=0,j=R.length-2;i<R.length;j=i,i+=2)A+=R[j]*R[i+1]-R[i]*R[j+1];return Math.abs(A)/2};
 const cen=R=>{let x=0,z=0;for(let i=0;i<R.length;i+=2){x+=R[i];z+=R[i+1]}return[x/(R.length/2),z/(R.length/2)]};
 // El templo grande más cercano a la torre (el Zōjō-ji; hay otro templo grande más lejos, al oeste)
 let T=null,td=1e9;for(const b of MAP.buildings)if(b.k===1&&area(b.p)>1500){const[x,z]=cen(b.p),d=Math.hypot(x-TX,z-TZ);if(d<td){td=d;T=b}}if(!T)return;
 const[tx,tz]=cen(T.p),o=obb(T.p);
 // Semillas: anillo alrededor del templo
 const seeds=[];for(let a=0;a<PI*2;a+=PI/16)for(const d of[o.hu+6,o.hv+6,40])seeds.push([tx+Math.cos(a)*d,tz+Math.sin(a)*d]);
 const set=placeCells(seeds,tx,tz,140);if(set.size<50)return;PLC.temple=set;
 // Grava gris clara con piedrecitas y marcas de rastrillo
 const grav=canvasTex(512,512,(g,w)=>{g.fillStyle="#8e8f8c";g.fillRect(0,0,w,w);const r=rng(41);for(let i=0;i<26000;i++){const v=100+r()*75|0;g.fillStyle=`rgba(${v},${v},${v-2},.55)`;g.fillRect(r()*w,r()*w,1+r()*2,1+r()*2)}
  g.strokeStyle="rgba(105,106,104,.2)";g.lineWidth=2;for(let y=8;y<w;y+=16){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke()}},true);
 // (el tinte azulado compensa la luz cálida del sol, para que se vea gris y no color arena)
 cellMesh(set,plMat(grav,{color:0xb0b8c8}),6);
 // Caminos de losas: del templo a la puerta grande (la que haya cerca) y al otro lado hacia la calle
 const stone=canvasTex(256,256,(g,w)=>{g.fillStyle="#9d9a93";g.fillRect(0,0,w,w);const r=rng(7);for(let y=0;y<4;y++)for(let x=0;x<4;x++){const v=165+r()*30|0;g.fillStyle=`rgb(${v},${v-3},${v-8})`;g.fillRect(x*64+(y%2)*32+2,y*64+2,60,60)}},true);
 const gates=MAP.buildings.filter(b=>b.k===3).map(b=>cen(b.p)).filter(([x,z])=>Math.hypot(x-tx,z-tz)<200);
 const dirs=[];if(gates.length){gates.sort((a,b)=>Math.hypot(a[0]-tx,a[1]-tz)-Math.hypot(b[0]-tx,b[1]-tz));const[gx,gz]=gates[0],l=Math.hypot(gx-tx,gz-tz);dirs.push([(gx-tx)/l,(gz-tz)/l]);dirs.push([-(gx-tx)/l,-(gz-tz)/l])}
 else dirs.push([Math.cos(o.a),Math.sin(o.a)],[-Math.cos(o.a),-Math.sin(o.a)]);
 // y hacia la explanada más grande (el centro de las casillas de grava), si no coincide con los otros caminos
 {let bd=null,bl=0;for(let k=0;k<32;k++){const a=k/32*PI*2,d=[Math.cos(a),Math.sin(a)];let run=0,st=false;for(let s=0;s<160;s+=2){const x=tx+d[0]*s,z=tz+d[1]*s;if(cellIn(set,x,z)){st=true;run+=2}else if(st&&!inBuilding(x,z))break}if(run>bl){bl=run;bd=d}}
  if(bd&&bl>30&&dirs.every(q=>q[0]*bd[0]+q[1]*bd[1]<.8))dirs.push(bd)}
 const pth=[],lan=[],sp=new Set(),ends=[];const pw=2.6;
 for(const[dx,dz]of dirs){let last=null,first=null,started=false,gap=0;const lx=-dz,lz=dx;
  for(let d=0;d<200;d+=1){const x=tx+dx*d,z=tz+dz*d;const inn=cellIn(set,x,z)&&cellIn(set,x+lx*pw,z+lz*pw)&&cellIn(set,x-lx*pw,z-lz*pw);
   // (huecos pequeños en la grava, como un parterre o una farola, no cortan el camino: solo una calle o 10 m sin grava)
   if(!inn){if(started&&(roadAt(x,z)>=0||++gap>10))break;continue}started=true;gap=0;
   pth.push([x,z]);if(!first)first=[x,z];if(Math.round(d)%9===0)for(const s of[-1,1]){const X=x+lx*(pw+2)*s,Z=z+lz*(pw+2)*s;if(cellIn(set,X,Z))lan.push([X,0,Z,Math.atan2(dx,dz)])}last=[x,z,d]}
  // Puerta en la entrada del lado de la calle (si no hay ya una puerta grande de verdad cerca de ese extremo)
  if(last&&!gates.some(([gx,gz])=>Math.hypot(gx-last[0],gz-last[1])<25))sp.add(JSON.stringify([last[0]-dx*4,last[1]-dz*4,Math.atan2(dx,dz)]));
  if(first)ends.push({d:[dx,dz],first,last})}
 {const pos=[],uv=[],y=CURB+.03;for(let i=1;i<pth.length;i++){const[a,b]=pth[i-1],[c,d]=pth[i];if(Math.hypot(c-a,d-b)>1.5)continue;const l=Math.hypot(c-a,d-b)||1,lx=-(d-b)/l*pw,lz=(c-a)/l*pw;
   const P=[[a+lx,b+lz],[c+lx,d+lz],[c-lx,d-lz],[a-lx,b-lz]];for(const k of[0,1,2,0,2,3]){pos.push(P[k][0],y,P[k][1]);uv.push(P[k][0]/4,P[k][1]/4)}}
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();
  const n=g.attributes.normal.array;for(let i=1;i<n.length;i+=3)n[i]=Math.abs(n[i]);const m=new THREE.Mesh(g,plMat(stone,{side:THREE.DoubleSide,polygonOffsetFactor:-2}));m.receiveShadow=true;sc.add(m)}
 // Farolillos de piedra (tōrō): base, poste, caja de la luz, tejadillo y remate
 const lg=mergeGeo([new THREE.BoxGeometry(1,.3,1).translate(0,.15,0),new THREE.CylinderGeometry(.16,.2,1.1,8).translate(0,.85,0),new THREE.BoxGeometry(.75,.2,.75).translate(0,1.5,0),
  new THREE.BoxGeometry(.55,.5,.55).translate(0,1.85,0),new THREE.ConeGeometry(.65,.45,4).rotateY(PI/4).translate(0,2.32,0),new THREE.SphereGeometry(.12,8,6).translate(0,2.62,0)]);
 inst(lg,new THREE.MeshLambertMaterial({color:0x9c998f}),lan,0,true);for(const q of lan)addCirc(q[0],q[2],.55);
 const gl=[...sp].map(s=>JSON.parse(s));for(const[x,z,a]of gl)templeGate(x,z,a);
 try{templeWall(set,pth,pw,gl)}catch(e){console.error(e)}
 try{templeExtras(set,pth,pw,gl,ends,tx,tz)}catch(e){console.error(e)}}
// Muro bajo de tejas (tsuijibei) por el lado de la calle, a 1,2 m del bordillo: base de piedra, muro ocre con cinco rayas blancas
// y tejadillo. Deja hueco donde salen los caminos y en las puertas
function templeWall(set,pth,pw,gl){const N=GSN,GS=GSS,SD=GSD,WD=1.2,K=new Set();
 for(const o of set)for(let dj=-2;dj<=2;dj++)for(let di=-2;di<=2;di++)K.add(o+dj*N+di);
 // junto al patio y sin calle de por medio (no en la acera de enfrente)
 const near=(x,z)=>{const i=Math.floor(x/GS),j=Math.floor(z/GS);for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const o=(j+dj)*N+i+di;if(!set.has(o))continue;const cx=(i+di)*GS+GS/2,cz=(j+dj)*GS+GS/2;
   let ok=true;for(let t=.25;t<1;t+=.25)if(roadAt(x+(cx-x)*t,z+(cz-z)*t)>=0)ok=false;if(ok)return true}return false};
 const roadNear=(x,z)=>{for(let k=0;k<8;k++){const a=k*PI/4;if(roadAt(x+Math.cos(a)*2.6,z+Math.sin(a)*2.6)>=0)return true}return false};
 const B=vcBuild();let n=0;
 // Un trozo de muro (salvo dentro de un edificio o del agua, en los caminos y en las puertas)
 const put=(a,b,l,mx,mz)=>{if(inBuilding(mx,mz)||inBuilding(a[0],a[1])||inBuilding(b[0],b[1])||inWater(mx,mz))return;if(pth.some(p=>Math.hypot(p[0]-mx,p[1]-mz)<pw+1.4))return;
  if(gl.some(([gx,gz,ga])=>{const c=Math.cos(ga),s=Math.sin(ga),dx=mx-gx,dz=mz-gz;return Math.abs(dx*c-dz*s)<7.6&&Math.abs(dx*s+dz*c)<6}))return;
  const W=M4(mx,CURB,mz,Math.atan2(-(b[1]-a[1]),b[0]-a[0]));B.at(W,PBOX,"#77746c",0,.2,0,l+.4,.4,.8);B.at(W,PBOX,"#d8c08a",0,1.25,0,l+.32,1.7,.56);
  for(let s=0;s<5;s++)B.at(W,PBOX,"#f1ece0",0,1.45+s*.13,0,l+.33,.05,.58);B.at(W,PBOX,"#6b4a32",0,2.15,0,l+.34,.12,.6);B.at(W,PPRI,"#3b3f45",0,2.45,0,l+.6,.42,.8);addCaps(a[0],a[1],b[0],b[1],.4);n++};
 for(const o of K){const i=o%N,j=(o/N)|0;if(i<1||j<1||i>N-3||j>N-3)continue;
  const C=[[i*GS,j*GS,SD[o]-WD],[(i+1)*GS,j*GS,SD[o+1]-WD],[(i+1)*GS,(j+1)*GS,SD[o+N+1]-WD],[i*GS,(j+1)*GS,SD[o+N]-WD]],X=[];
  for(let k=0;k<4;k++){const a=C[k],b=C[(k+1)%4];if((a[2]>0)!==(b[2]>0)){const t=a[2]/(a[2]-b[2]);X.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])}}
  for(let k=0;k+1<X.length;k+=2){const a=X[k],b=X[k+1],mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2,l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l<.05)continue;
   if(!roadNear(mx,mz)||!near(mx,mz))continue;put(a,b,l,mx,mz)}}
 // El resto del contorno (lo que no da a la calle) sigue el borde de la grava, con las esquinas en diagonal para que no salga en escalera.
 // Así el patio queda cerrado y las casas de alrededor se quedan fuera del muro
 const val=(i,j)=>{let c=0;for(const[u,v]of[[0,0],[-1,0],[0,-1],[-1,-1]])if(set.has((j+v)*N+i+u))c++;return c/4-.4},rdNear=(x,z)=>{for(let k=0;k<8;k++){const a=k*PI/4;for(const r of[2.6,5.5])if(roadAt(x+Math.cos(a)*r,z+Math.sin(a)*r)>=0)return true}return false};
 for(const o of K){const i=o%N,j=(o/N)|0;if(i<1||j<1||i>N-3||j>N-3)continue;const C=[[i*GS,j*GS,val(i,j)],[(i+1)*GS,j*GS,val(i+1,j)],[(i+1)*GS,(j+1)*GS,val(i+1,j+1)],[i*GS,(j+1)*GS,val(i,j+1)]],X=[];
  for(let k=0;k<4;k++){const a=C[k],b=C[(k+1)%4];if((a[2]>0)!==(b[2]>0)){const t=a[2]/(a[2]-b[2]);X.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])}}
  for(let k=0;k+1<X.length;k+=2){const a=X[k],b=X[k+1],mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2,l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l<.05||rdNear(mx,mz))continue;put(a,b,l,mx,mz)}}
 B.mesh();PLC.wall=n}
// Pagoda de cinco pisos, campanario, fuente para lavarse las manos, puesto de amuletos y tablillas de deseos,
// en los sitios despejados de la grava (lejos de los caminos, los farolillos, los árboles y el borde)
function templeExtras(set,pth,pw,gl,ends,tx,tz){const N=GSN,GS=GSS;
 // Distancia (en casillas) de cada casilla de grava al borde
 const DT=new Map();{let q=[];for(const o of set){if([1,-1,N,-N].some(d=>!set.has(o+d))){DT.set(o,1);q.push(o)}}
  while(q.length){const nq=[];for(const c of q){const v=DT.get(c);for(const d of[1,-1,N,-N]){const e=c+d;if(set.has(e)&&!DT.has(e)){DT.set(e,v+1);nq.push(e)}}}q=nq}}
 const pathN=(x,z)=>{let m=1e9,p=null;for(const q of pth){const d=(q[0]-x)**2+(q[1]-z)**2;if(d<m){m=d;p=q}}return[Math.sqrt(m),p]};
 const used=gl.map(([x,z])=>[x,z,9]);
 const spot=(r,score,minP,maxP)=>{let best=null,bs=1e9;for(const[o,v]of DT){if((v-.5)*GS<r)continue;const x=(o%N)*GS+GS/2,z=((o/N)|0)*GS+GS/2,s=score(x,z);if(s>=bs)continue;
   if(used.some(u=>Math.hypot(u[0]-x,u[1]-z)<u[2]+r+2))continue;const[pd]=pathN(x,z);if(pd<minP||pd>maxP)continue;if(blockedAt(x,z,r))continue;best=[x,z];bs=s}
  if(!best)return null;used.push([best[0],best[1],r]);const[,p]=pathN(best[0],best[1]);return[best[0],best[1],p?Math.atan2(p[0]-best[0],p[1]-best[1]):0]};
 const B=vcBuild(),dT=(x,z)=>Math.hypot(x-tx,z-tz);
 // Pagoda: en la explanada, a unos 70 m del centro del templo (fuera de su sombra); campanario a otro lado, lejos de la pagoda
 const pg=spot(7.5,(x,z)=>Math.abs(dT(x,z)-70),7.5+pw+2,40);if(pg){pagoda(B,...pg);lowFence(B,pg[0],pg[1],pg[2],6.6)}
 const bt=spot(5,(x,z)=>Math.abs(dT(x,z)-60)+(pg?Math.max(0,50-Math.hypot(x-pg[0],z-pg[1]))*3:0),5+pw+2,40);if(bt){bellTower(B,...bt);lowFence(B,bt[0],bt[1],bt[2],4.6)}
 // Fuente junto al camino principal, entrando por la puerta; amuletos y tablillas junto al templo
 const e0=ends[0];if(e0){const[dx,dz]=e0.d,ex=e0.last[0]-dx*16,ez=e0.last[1]-dz*16;
  const ch=spot(2.6,(x,z)=>Math.hypot(x-ex,z-ez),pw+2.4,pw+7);if(ch)chozuya(B,...ch);
  const fx=e0.first[0]+dx*12,fz=e0.first[1]+dz*12,om=spot(3,(x,z)=>Math.hypot(x-fx,z-fz),pw+3,pw+9);if(om){omamori(B,...om);
   const em=spot(2,(x,z)=>Math.abs(Math.hypot(x-om[0],z-om[1])-7),pw+2,pw+10);if(em)emaRack(B,...em)}}
 B.mesh();PLC.extras={pagoda:pg,bell:bt,ends,gates:gl}}
function pagoda(B,x,z,ry){const W=M4(x,CURB,z,ry),R="#b5382c",WH="#e9e3d6",RF="#3b3f45",BR="#8a7440";
 B.at(W,PBOX,"#8a8780",0,.45,0,9,.9,9);B.at(W,PBOX,"#8a8780",0,.2,5.1,3,.4,1.4);
 const th=3.3;for(let i=0;i<5;i++){const s=6.2-i*.6,y=.9+i*th,S=s+3.4;
  if(i)B.at(W,PBOX,R,0,y+.12,0,s+1,.24,s+1);
  B.at(W,PBOX,R,0,y+1.05,0,s,2.1,s);B.at(W,PBOX,"#3a2a22",0,y+.95,0,s*.34,1.5,s+.06);B.at(W,PBOX,"#3a2a22",0,y+.95,0,s+.06,1.5,s*.34);
  B.at(W,PBOX,WH,0,y+2.25,0,s+.5,.35,s+.5);B.at(W,hipG(.5),RF,0,y+2.87,0,S/1.414,.9,S/1.414)}
 const yt=.9+5*th;B.at(W,PBOX,RF,0,yt+.2,0,1.6,.4,1.6);B.at(W,cylG(.14,.18,8),BR,0,yt+4.2,0,1,8,1);
 for(let k=0;k<9;k++)B.at(W,cylG(1,1,12),BR,0,yt+1.3+k*.55,0,.62-k*.025,.1,.62-k*.025);
 B.at(W,new THREE.SphereGeometry(1,10,8),BR,0,yt+8.3,0,.32,.5,.32);rectPoly(x,z,ry,4.5,4.5,20)}
function bellTower(B,x,z,ry){const W=M4(x,CURB,z,ry),R="#b5382c",BZ="#5f6a4e";
 B.at(W,PBOX,"#8a8780",0,.55,0,6.4,1.1,6.4);for(const u of[-2.4,2.4])for(const v of[-2.4,2.4])B.at(W,cylG(1,1,10),R,u,3.2,v,.22,4.2,.22);
 for(const s of[-2.4,2.4]){B.at(W,PBOX,R,0,5.15,s,5.2,.3,.3);B.at(W,PBOX,R,s,5.15,0,.3,.3,5.2)}
 B.at(W,hipG(.25),"#3b3f45",0,6.4,0,8.6/1.414,2.2,8.6/1.414);B.at(W,PBOX,"#3b3f45",0,7.55,0,2.6,.3,.3);
 B.at(W,cylG(.75,.92,16),BZ,0,3.6,0,1,1.8,1);B.at(W,new THREE.SphereGeometry(.75,14,8,0,PI*2,0,PI/2),BZ,0,4.5,0);B.at(W,cylG(.08,.08,6),"#3a3a3a",0,4.95,0,1,.9,1);
 B.at(W,PBOX,BZ,0,3.05,0,1.86,.08,1.86);   // banda de la campana
 B.add(cylG(.17,.17,10).rotateX(PI/2),"#8a6a48",W.clone().multiply(M4(0,3.5,2.05,0,1,1,2.2)));B.at(W,PBOX,R,0,5.4,0,5.2,.3,.3);
 for(const v of[1.2,2.9])B.at(W,cylG(.03,.03,4),"#d8cfb8",0,4.35,v,1,1.7,1);rectPoly(x,z,ry,3.2,3.2,5)}
// Valla baja de piedra (tamagaki) alrededor de un cuadrado de medio lado hs, con la entrada en el lado de delante
function lowFence(B,x,z,ry,hs){const W=M4(x,CURB,z,ry),st="#9c998f",n=Math.max(3,Math.round(hs*2/1.6));
 for(let k=0;k<4;k++){const pts=[];for(let i=0;i<=n;i++){const t=-hs+i*2*hs/n;pts.push(k===0?[t,hs]:k===1?[hs,t]:k===2?[t,-hs]:[-hs,t])}
  for(let i=0;i<pts.length;i++){const[u,v]=pts[i];if(k===0&&Math.abs(u)<1.4)continue;B.at(W,PBOX,st,u,.45,v,.22,.9,.22);
   if(i){const[u0,v0]=pts[i-1];if(k===0&&(Math.abs(u0)<1.4||Math.abs(u)<1.4))continue;const l=Math.hypot(u-u0,v-v0),r=Math.atan2(-(v-v0),u-u0);
    for(const y of[.35,.72])B.at(W,PBOX,st,(u+u0)/2,y,(v+v0)/2,l,.1,.1,r);const a=lw(x,z,ry,u0,v0),b=lw(x,z,ry,u,v);addCaps(a[0],a[1],b[0],b[1],.15)}}}}
// Fuente para lavarse las manos (chōzuya): tejadillo sobre cuatro postes y pila de piedra con agua
function chozuya(B,x,z,ry){const W=M4(x,CURB,z,ry),WD="#6b4a32";
 B.at(W,PBOX,"#8f8d86",0,.08,0,3.4,.16,2.4);for(const u of[-1.35,1.35])for(const v of[-.85,.85])B.at(W,cylG(1,1,8),WD,u,1.4,v,.12,2.6,.12);
 B.at(W,PBOX,WD,0,2.7,0,3.2,.18,1.9);B.at(W,PPRI,"#3b3f45",0,3.25,0,3.9,.95,1.65);
 B.at(W,PBOX,"#8f8d86",0,.5,0,2.1,.72,.95);B.at(W,PBOX,"#4d7f96",0,.87,0,1.9,.03,.78);
 for(let i=0;i<5;i++)B.at(W,cylG(1,1,6),"#c9a676",-.8+i*.4,.92,.42,.05,.08,.05);rectPoly(x,z,ry,1.6,1.1,3.4)}
// Puesto de amuletos (juyosho): caseta de madera con ventanilla, cortina blanca y amuletos de colores en el mostrador
function omamori(B,x,z,ry){const W=M4(x,CURB,z,ry),r=rng(17),cs=["#c8302a","#e0b030","#2f6fb0","#3a8a4a","#d070a0","#ffffff","#7a3fa0"];
 B.at(W,PBOX,"#7a5a3c",0,1.25,0,4.2,2.5,2.4);B.at(W,PBOX,"#2a2420",0,1.5,1.18,3.4,1.05,.06);B.at(W,PBOX,"#f2efe6",0,2.2,1.22,3.8,.32,.05);
 B.at(W,PBOX,"#c9a676",0,.95,1.45,3.8,.08,.6);for(let row=0;row<2;row++)for(let i=0;i<16;i++)B.at(W,PBOX,cs[(r()*cs.length)|0],-1.7+i*.226,1.08,1.3+row*.25,.13,.18,.04);
 B.at(W,hipG(.35),"#3b3f45",0,2.85,0,5.6/1.414,.8,3.8/1.414);rectPoly(x,z,ry,2.1,1.2,3)}
// Tablillas de deseos (ema): dos postes con dos travesaños y muchas tablillas colgadas
function emaRack(B,x,z,ry){const W=M4(x,CURB,z,ry),r=rng(23),WD="#6b4a32";
 for(const u of[-1.6,1.6])B.at(W,cylG(1,1,8),WD,u,.95,0,.08,1.9,.08);for(const y of[1.1,1.6])B.at(W,PBOX,WD,0,y,0,3.3,.06,.06);
 B.at(W,PPRI,"#3b3f45",0,2.0,0,3.7,.32,.5);
 for(const y of[1.1,1.6])for(let i=0;i<13;i++)for(const s of[-1,1])if(r()<.85)B.at(W,PBOX,r()<.15?"#e8d2a0":"#d9b77e",-1.45+i*.24+(r()-.5)*.05,y-.12,s*.035,.2,.15,.015,(r()-.5)*.25);
 const a=lw(x,z,ry,-1.6,0),b=lw(x,z,ry,1.6,0);addCaps(a[0],a[1],b[0],b[1],.2)}
// Puerta de templo de dos pisos (estilo sanmon), roja con tejados oscuros. a = dirección del camino que la cruza
function templeGate(x,z,a){const G=new THREE.Group(),red=new THREE.MeshLambertMaterial({color:0xb5382c}),roof=new THREE.MeshLambertMaterial({color:0x3b3f45}),wh=new THREE.MeshLambertMaterial({color:0xe9e3d6});
 const box=(w,h,d,m,px,py,pz)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(px,py,pz);o.castShadow=true;o.receiveShadow=true;G.add(o);return o};
 const W2=7,D2=3.2;for(const u of[-W2,-2.4,2.4,W2])for(const v of[-D2,D2]){const c=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,6,10),red);c.position.set(u,3,v);c.castShadow=true;G.add(c)}
 box(W2*2+1,.6,D2*2+1,red,0,6.2,0);
 const hip=(w,d,h,y)=>{const g=new THREE.CylinderGeometry(.4,1,h,4,1).rotateY(PI/4);g.scale(w/1.41,1,d/1.41);const o=new THREE.Mesh(g,roof);o.position.y=y+h/2;o.castShadow=true;G.add(o)};
 hip(W2*2+5,D2*2+5,1.6,6.5);box(W2*2-1,3.2,D2*2-.6,red,0,9.7,0);box(W2*2-1.6,1.2,D2*2-.4,wh,0,9.3,0);hip(W2*2+4,D2*2+4,2.4,11.2);
 // (a lo ancho, cruzando el camino: el eje X local queda perpendicular al camino)
 G.position.set(x,CURB,z);G.rotation.y=a;sc.add(G);
 const c=Math.cos(G.rotation.y),s=Math.sin(G.rotation.y);for(const u of[-W2,-2.4,2.4,W2])for(const v of[-D2,D2])addCirc(x+u*c+v*s,z-u*s+v*c,.6)}

// --- Zona de derrape (sin carteles: se nota por las marcas, los conos y los neumáticos) ---
// La explanada grande y vacía al sureste del templo (la de la captura): la región libre más grande cerca de ese punto.
// Se calcula antes de decorate, para que no salgan árboles dentro
function driftSite(){if(PLC.drift!==undefined)return PLC.drift;const cx=1553,cz=1155,set=placeCells([[cx,cz],[cx+20,cz],[cx-20,cz],[cx,cz+20],[cx,cz-20]],cx,cz,150);PLC.drift=set.size<200?null:set;return PLC.drift}
function buildDrift(){const set=driftSite();if(!set)return;
 const tex=canvasTex(1024,1024,(g,w)=>{g.fillStyle="#46484d";g.fillRect(0,0,w,w);const r=rng(99);for(let i=0;i<30000;i++){const v=58+r()*36|0;g.fillStyle=`rgba(${v},${v},${v+3},.6)`;g.fillRect(r()*w,r()*w,1+r()*1.5,1+r()*1.5)}
  // Rayas de aparcamiento viejas y casi borradas
  g.strokeStyle="rgba(220,220,210,.07)";g.lineWidth=4;for(let x=40;x<w;x+=80){g.beginPath();g.moveTo(x,60);g.lineTo(x,260);g.stroke()}
  // Marcas de neumático: círculos (donuts), curvas largas y ochos
  g.lineCap="round";const arc=(x,y,R,a0,a1,al)=>{for(const o of[-9,9]){g.strokeStyle=`rgba(10,10,12,${al})`;g.lineWidth=7;g.beginPath();g.arc(x,y,R+o,a0,a1);g.stroke()}};
  for(let i=0;i<8;i++)arc(r()*w,r()*w,35+r()*30,0,PI*2,.1+r()*.08);
  for(let i=0;i<18;i++){const a=r()*PI*2;arc(r()*w,r()*w,120+r()*260,a,a+.5+r()*1.2,.08+r()*.1)}
  for(let i=0;i<3;i++){const x=r()*w,y=r()*w,R=40;arc(x-R,y,R,0,PI*2,.11);arc(x+R,y,R,0,PI*2,.11)}},true);
 cellMesh(set,plMat(tex),110,.014);
 driftProps(set)}
// Todo lo que hay en la zona: circuito de neumáticos, conos que se pueden tirar, contenedores y camión, luces portátiles, grada y coches viejos
function driftProps(set){const N=GSN,cells=[...set],r=rng(5);let sx=0,sz=0;for(const o of cells){sx+=(o%N)*GSS+GSS/2;sz+=((o/N)|0)*GSS+GSS/2}const cx=sx/cells.length,cz=sz/cells.length;
 // Circuito: dos óvalos de neumáticos con huecos para entrar y salir
 const tires=[],wall=(rx,rz,a0,a1)=>{let last=null;const n=Math.ceil((a1-a0)*Math.max(rx,rz)/.8);for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n,X=cx+Math.cos(a)*rx,Z=cz+Math.sin(a)*rz;if(!cellIn(set,X,Z)||blockedAt(X,Z,.5)){last=null;continue}
   const col=i%7===0?0xe8e8e4:0x1d1e21;for(let j=0;j<2;j++)tires.push([X,CURB+j*.26,Z,r()*PI,1,1,col]);if(last)addCaps(last[0],last[1],X,Z,.42);last=[X,Z]}};
 for(const[a,b]of[[.25,2.6],[3.4,5.8]])wall(46,28,a,b);for(const[a,b]of[[.6,1.9],[2.6,4.1],[4.7,5.7]])wall(74,54,a,b);
 // Sitios despejados fuera del circuito (distancia de cada casilla al borde de la zona)
 const DT=new Map();{let q=[];for(const o of set)if([1,-1,N,-N].some(d=>!set.has(o+d))){DT.set(o,1);q.push(o)}while(q.length){const nq=[];for(const c of q){const v=DT.get(c);for(const d of[1,-1,N,-N]){const e=c+d;if(set.has(e)&&!DT.has(e)){DT.set(e,v+1);nq.push(e)}}}q=nq}}
 const used=[],out=(x,z)=>((x-cx)/80)**2+((z-cz)/60)**2>1;
 const spot=(hr,tx,tz)=>{let best=null,bs=1e9;for(const[o,v]of DT){if((v-.5)*GSS<hr)continue;const x=(o%N)*GSS+GSS/2,z=((o/N)|0)*GSS+GSS/2,s=Math.hypot(x-tx,z-tz);if(s>=bs||!out(x,z)||used.some(u=>Math.hypot(u[0]-x,u[1]-z)<u[2]+hr+1)||blockedAt(x,z,hr))continue;best=[x,z];bs=s}
  if(best){used.push([best[0],best[1],hr]);best.push(Math.atan2(cx-best[0],cz-best[1]))}return best};
 // Contenedores (con chapa ondulada, color por contenedor) en dos montones y un camión al lado de uno
 const ct=[],B=vcBuild(),cc=[0xb5402c,0x2c6a8a,0x3f7a4a,0xc98a2a,0x7d8288],yard=(q)=>{if(!q)return;const[x,z,a]=q;for(let i=0;i<3;i++){const u=-2.8+i*2.8,p=lw(x,z,a,u,0);ct.push([p[0],CURB+1.3,p[1],a,1,1,cc[(r()*cc.length)|0]])}for(let i=0;i<2;i++){const p=lw(x,z,a,-1.4+i*2.8,0);ct.push([p[0],CURB+3.9,p[1],a,1,1,cc[(r()*cc.length)|0]])}rectPoly(x,z,a,4.3,6.2,5.2)};
 yard(spot(8,cx-120,cz-40));yard(spot(8,cx+120,cz+70));
 const tk=spot(9,cx+120,cz-70);if(tk){const[x,z,a]=tk,W=M4(x,CURB,z,a);B.at(W,PBOX,"#d9dadc",0,1.9,4.9,2.4,2.4,2.2);B.at(W,PBOX,"#20242c",0,2.45,6.02,2.2,.9,.06);B.at(W,PBOX,"#3a3d42",0,.9,-.5,2.4,.3,12.4);for(const v of[5,-3,-4.6])for(const s of[-1,1])B.add(cylG(.5,.5,12).rotateZ(PI/2),"#17181b",W.clone().multiply(M4(s*1.05,.5,v,0,.42,1,1)));
  const p=lw(x,z,a,0,-1.6);ct.push([p[0],CURB+2.35,p[1],a,1,1,cc[1]]);rectPoly(x,z,a,1.4,6.4,4)}
 if(ct.length)inst(new THREE.BoxGeometry(2.44,2.6,12.2),new THREE.MeshLambertMaterial({map:canvasTex(128,32,(g,w,h)=>{g.fillStyle="#fff";g.fillRect(0,0,w,h);g.fillStyle="#b4b4b4";for(let i=0;i<w;i+=8)g.fillRect(i,0,3,h)})}),ct,0,true);
 // Luces portátiles: mástil, panel de focos y charco de luz en el suelo por la noche
 const{lm,gm,gt}=plLamp(),pm=new THREE.MeshBasicMaterial({map:gt,color:0xfff0d8,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-4});NM.plO.push([pm,.65]);
 for(const[tx,tz]of[[-90,-68],[90,-68],[90,68],[-90,68]]){const q=spot(2,cx+tx,cz+tz);if(!q)continue;const[x,z,a]=q,W=M4(x,CURB,z,a);B.at(W,PBOX,"#c99a2a",0,.5,0,1.6,1,2.6);B.at(W,cylG(.08,.14,8),"#6d7178",0,6,0,1,10,1);addCirc(x,z,1.2);
  const G=new THREE.Group();G.position.set(x,CURB+11.2,z);G.rotation.y=a;const H=new THREE.Group();H.rotation.x=.45;G.add(H);const pn=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.7),lm);pn.position.z=.1;H.add(pn);const bk=new THREE.Mesh(new THREE.BoxGeometry(2.8,1.9,.15),new THREE.MeshLambertMaterial({color:0x33363c}));H.add(bk);sc.add(G);
  const s=new THREE.Sprite(gm);s.position.set(x,CURB+11,z);s.scale.set(8,8,1);sc.add(s);const f=lw(x,z,a,0,22),gp=new THREE.Mesh(new THREE.PlaneGeometry(66,66).rotateX(-PI/2),pm);gp.position.set(f[0],CURB+.05,f[1]);sc.add(gp)}
 // Grada metálica pequeña, mirando al circuito
 const gs=spot(9,cx,cz-120);if(gs){const[x,z,a]=gs,W=M4(x,CURB,z,a);for(let k=0;k<5;k++)B.at(W,PBOX,k%2?"#8d9298":"#a6abb1",0,.35+k*.45,2.4-k*1.1,17,.12+k*.9,1.1);for(const u of[-8.2,0,8.2])B.at(W,PBOX,"#5c6068",u,1.6,-2.6,.14,3.2,.14);B.at(W,PBOX,"#5c6068",0,3.05,-2.8,17,.1,.1);rectPoly(x,z,a,8.6,3,2.6)}
 // Coches viejos aparcados
 for(const[tx,tz,c]of[[-110,20,"#7a3a2c"],[-100,70,"#4a5560"],[110,10,"#8a8466"],[40,-100,"#384a3c"],[-40,100,"#6b6f74"]]){const q=spot(3.2,cx+tx,cz+tz);if(!q)continue;const[x,z]=q,a=q[2]+1.2,W=M4(x,CURB,z,a);B.at(W,PBOX,c,0,.6,0,1.8,.6,4.3);B.at(W,PBOX,c,0,1.15,-.25,1.55,.55,2.1);B.at(W,PBOX,"#14171c",0,1.17,-.25,1.58,.32,2.14);for(const u of[-.82,.82])for(const v of[-1.35,1.35])B.add(cylG(.32,.32,10).rotateZ(PI/2),"#17181b",W.clone().multiply(M4(u,.32,v,0,.6,1,1)));rectPoly(x,z,a,1,2.3,1.6)}
 B.mesh();
 // Conos: filas de slalom y marcando el circuito. No chocan: el coche los tira (conesTick) y vuelven a su sitio al rato
 const cones=[];for(let a=.1;a<6.2;a+=.26){const X=cx+Math.cos(a)*60,Z=cz+Math.sin(a)*41;if(cellIn(set,X,Z)&&!blockedAt(X,Z,.6))cones.push([X,CURB,Z,r()*PI,1,1,a*4%1<.15?0xffffff:0xff6a1a])}
 for(let k=0;k<6;k++){const o=cells[Math.floor(r()*cells.length)],x=(o%N)*GSS+GSS/2,z=((o/N)|0)*GSS+GSS/2,a=r()*PI*2;for(let i=0;i<6;i++){const X=x+Math.sin(a)*i*7,Z=z+Math.cos(a)*i*7;if(cellIn(set,X,Z)&&!blockedAt(X,Z,.6))cones.push([X,CURB,Z,r()*PI,1,1,r()<.15?0xffffff:0xff6a1a])}}
 const cg=mergeGeo([new THREE.BoxGeometry(.42,.04,.42).translate(0,.02,0),new THREE.ConeGeometry(.17,.68,12).translate(0,.38,0)]);
 CN.m=inst(cg,new THREE.MeshLambertMaterial({color:0xffffff}),cones,0,true);CN.m.frustumCulled=false;CN.cx=cx;CN.cz=cz;CN.l=cones.map(e=>({x:e[0],z:e[2],hx:e[0],hz:e[2],y:CURB,a:e[3],fly:false,vx:0,vy:0,vz:0,rx:0,rz:0,sx:0,sz:0,t:0}));
 inst(new THREE.TorusGeometry(.3,.12,6,14).rotateX(PI/2).translate(0,.12,0),new THREE.MeshLambertMaterial({color:0xffffff}),tires,0,true)}
const CN={m:null,l:[],cx:0,cz:0},_co=new THREE.Object3D();
// El coche tira los conos que toca (salen en la dirección del golpe, rebotan en el suelo) y a los 12 s vuelven a su sitio si el coche no está encima
function conesTick(dt){if(!CN.m)return;const near=state==="play"&&Math.hypot(px-CN.cx,pz-CN.cz)<190,sp=Math.hypot(vx,vz),fx=Math.sin(h),fz=Math.cos(h);let dirty=false;
 CN.l.forEach((c,i)=>{if(!c.fly){if(!near||sp<1)return;const dx=c.x-px,dz=c.z-pz;if(dx*dx+dz*dz>25)return;const f=dx*fx+dz*fz,s=dx*fz-dz*fx;if(Math.abs(f)>cur.l/2+.25||Math.abs(s)>cur.w/2+.25)return;
   const k=(Math.random()-.5)*.5;c.fly=true;c.t=0;c.vx=vx*.85+fz*s*1.5+k*sp*.4;c.vz=vz*.85-fx*s*1.5-k*sp*.4;c.vy=2+Math.min(7,sp*.22);c.sx=(Math.random()-.5)*14;c.sz=(Math.random()-.5)*14}
  else{c.t+=dt;c.vy-=9.8*dt;c.x+=c.vx*dt;c.y+=c.vy*dt;c.z+=c.vz*dt;c.rx+=c.sx*dt;c.rz+=c.sz*dt;if(c.y<CURB){c.y=CURB;c.vy*=-.35;c.vx*=.6;c.vz*=.6;c.sx*=.6;c.sz*=.6}
   if(c.t>12&&Math.hypot(c.hx-px,c.hz-pz)>8){c.fly=false;c.x=c.hx;c.z=c.hz;c.y=CURB;c.rx=c.rz=0}}
  _co.position.set(c.x,c.y,c.z);_co.rotation.set(c.rx,c.a,c.rz);_co.scale.set(1,1,1);_co.updateMatrix();CN.m.setMatrixAt(i,_co.matrix);dirty=true});
 if(dirty)CN.m.instanceMatrix.needsUpdate=true}
// --- Trenes: recorren las vías elevadas de borde a borde del mapa y desaparecen al llegar (decorativos). Sale uno cada 45 s en una línea libre ---
const TRN={routes:[],pool:[],t:40};
function buildTrains(){const key=(x,z)=>Math.round(x)+"_"+Math.round(z),nd=new Map();ELV.forEach((r,i)=>{const p=r.p,n=p.length;for(const[k,e]of[[key(p[0],p[1]),0],[key(p[n-2],p[n-1]),1]]){if(!nd.has(k))nd.set(k,[]);nd.get(k).push([i,e])}});
 const seen=new Set(),ed=(x,z)=>Math.min(x,z,W-x,W-z);
 for(const[,l]of nd){if(l.length!==1)continue;let[i,e]=l[0];if(seen.has(i))continue;const pts=[];
  for(;;){seen.add(i);const r=ELV[i],n=r.p.length/2;for(let k=0;k<n;k++){const q=e?n-1-k:k;if(!pts.length||Math.hypot(pts[pts.length-1][0]-r.p[q*2],pts[pts.length-1][2]-r.p[q*2+1])>.5)pts.push([r.p[q*2],r.ys[q],r.p[q*2+1]])}
   const lq=pts[pts.length-1],nx=(nd.get(key(lq[0],lq[2]))||[]).find(([j])=>!seen.has(j));if(!nx)break;i=nx[0];e=nx[1]}
  const D=[0];for(let k=1;k<pts.length;k++)D.push(D[k-1]+Math.hypot(pts[k][0]-pts[k-1][0],pts[k][2]-pts[k-1][2]));const a=pts[0],b=pts[pts.length-1];
  if(D[D.length-1]>600&&ed(a[0],a[2])<45&&ed(b[0],b[2])<45)TRN.routes.push({pts,D,L:D[D.length-1],busy:false})}
 if(!TRN.routes.length)return;
 // Tren de cercanías de diseño propio: caja de acero con techo redondeado, bajos, bogies y equipos en el techo; el coche de cabeza lleva morro con parabrisas y faros
 const sh=new THREE.Shape();sh.moveTo(-1.42,-.95);sh.lineTo(-1.42,1.05);sh.quadraticCurveTo(-1.42,1.6,-.7,1.72);sh.lineTo(.7,1.72);sh.quadraticCurveTo(1.42,1.6,1.42,1.05);sh.lineTo(1.42,-.95);sh.closePath();
 const body=new THREE.ExtrudeGeometry(sh,{depth:19.8,bevelEnabled:false,curveSegments:5}).translate(0,0,-9.9),I=new THREE.Matrix4(),WB=head=>{const B=vcBuild();B.add(body,"#d6dadd",I);B.at(I,PBOX,"#2a2d33",0,-1.2,0,2.6,.5,17.5);
   for(const z of[-6.8,6.8]){B.at(I,PBOX,"#1d1f24",0,-1.5,z,2.3,.45,3.2);for(const u of[-1.1,1.1])B.add(cylG(.42,.42,12).rotateZ(Math.PI/2),"#101114",I.clone().multiply(M4(0,-1.45,z+u,0,1,2.5,1)))}
   for(const z of[-6,0,6])B.at(I,PBOX,"#9aa0a6",0,1.82,z,1.5,.28,3);
   if(head==="p"){for(const u of[-.6,.6])B.at(I,PBOX,"#30343a",u,2.3,0,.08,.9,.08);B.at(I,PBOX,"#30343a",0,2.74,0,1.5,.07,.3)}
   if(head==="c"){B.add(new THREE.CylinderGeometry(.72,1,1,4,1).rotateY(Math.PI/4).rotateX(Math.PI/2),"#d6dadd",I.clone().multiply(M4(0,.35,10.4,0,2.02,1.85,1)));B.at(I,PBOX,"#121720",0,.9,10.9,2,.95,.08);B.at(I,PBOX,"#1f5fa8",0,-.3,10.86,2.1,.8,.06);for(const u of[-.75,.75])B.at(I,PBOX,"#fff3c4",u,-.1,10.9,.34,.2,.06)}
   const m=B.mesh();sc.remove(m);return m};
 const mC=WB("c"),mP=WB("p"),mM=WB("");
 // Costados: ventanas con viajeros en sombra, puertas y banda azul
 const st=canvasTex(1024,128,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle="#1f5fa8";g.fillRect(0,88,w,14);g.fillStyle="#7fb0dc";g.fillRect(0,104,w,4);for(let i=0;i<4;i++){const x=70+i*235;g.fillStyle="#c9ced2";g.fillRect(x,8,84,112);g.fillStyle="#3b4148";g.fillRect(x+2,8,39,112);g.fillRect(x+43,8,39,112);g.fillStyle="#26303a";g.fillRect(x+7,20,29,46);g.fillRect(x+48,20,29,46)}
   const r=rng(61);for(let i=0;i<5;i++){const x=i*235-92,w2=142;if(x<-w2)continue;g.fillStyle="#1c2530";g.fillRect(x,20,w2,50);g.fillStyle="rgba(150,185,215,.35)";g.fillRect(x+6,22,w2/2,14);g.fillStyle="#d6dadd";for(let k=1;k<3;k++)g.fillRect(x+k*w2/3,20,3,50);g.fillStyle="#0e1319";for(let k=0;k<5;k++)if(r()<.6){g.beginPath();g.arc(x+12+r()*(w2-24),58,7,0,7);g.fill()}}});
 const sp=[];for(const s of[-1,1]){const a=s*1.435,z0=-9.8*s,z1=9.8*s;sp.push([a,-.95,z0,0,0],[a,-.95,z1,1,0],[a,1.05,z1,1,1],[a,-.95,z0,0,0],[a,1.05,z1,1,1],[a,1.05,z0,0,1])}
 const sg=new THREE.BufferGeometry();sg.setAttribute("position",new THREE.Float32BufferAttribute(sp.flatMap(q=>q.slice(0,3)),3));sg.setAttribute("uv",new THREE.Float32BufferAttribute(sp.flatMap(q=>q.slice(3)),2));sg.computeVertexNormals();
 const S=new THREE.MeshLambertMaterial({map:st,transparent:true,alphaTest:.3,side:THREE.DoubleSide});
 for(let i=0;i<4;i++){const cars=[];for(let k=0;k<4;k++){const G=new THREE.Group(),src=k===0||k===3?mC:k===1?mP:mM,bd=new THREE.Mesh(src.geometry,src.material);bd.castShadow=true;if(k===3)bd.rotation.y=Math.PI;G.add(bd,new THREE.Mesh(sg,S));G.visible=false;sc.add(G);cars.push(G)}TRN.pool.push({cars,r:null,d:0,dir:1})}}
const _pa=new THREE.Vector3(),_pb=new THREE.Vector3();
function routeAt(r,s,o){const D=r.D;let a=0,b=D.length-1;while(b-a>1){const m=(a+b)>>1;if(D[m]<=s)a=m;else b=m}const f=(s-D[a])/((D[b]-D[a])||1),p=r.pts[a],q=r.pts[b];return o.set(p[0]+(q[0]-p[0])*f,p[1]+(q[1]-p[1])*f+2.05,p[2]+(q[2]-p[2])*f)}
function trainsTick(dt){if(!TRN.routes.length)return;TRN.t+=dt;if(TRN.t>45){const f=TRN.routes.filter(r=>!r.busy),t=TRN.pool.find(q=>!q.r);if(f.length&&t){TRN.t=0;t.r=f[Math.floor(Math.random()*f.length)];t.r.busy=true;t.d=0;t.dir=Math.random()<.5?1:-1;t.hk=false;t.prevD=undefined}}
 for(const t of TRN.pool){if(!t.r)continue;const r=t.r;t.d+=36*dt;t.cars.forEach((m,k)=>{const s=t.d-k*20.6-10;if(s<10||s>r.L-10){m.visible=false;return}const u=t.dir>0?s:r.L-s,e=t.dir;routeAt(r,u+9*e,_pa);routeAt(r,u-9*e,_pb);m.visible=true;m.position.addVectors(_pa,_pb).multiplyScalar(.5);m.lookAt(_pa)});
  if(t.d-3*20.6-10>r.L){r.busy=false;t.r=null;for(const m of t.cars)m.visible=false}}}
function placesTick(dt){conesTick(dt);trainsTick(dt);raceTick(dt);ambAudio(dt);onlTick(dt)}
// Focos: material del panel, resplandor de noche y su textura (compartidos por el campo de béisbol y la zona de derrape)
let PLL=null;
function plLamp(){if(PLL)return PLL;const lt=canvasTex(256,160,(g,w,h)=>{g.fillStyle="#2a2d33";g.fillRect(0,0,w,h);for(let j=0;j<4;j++)for(let i=0;i<6;i++){const x=22+i*42.4,y=22+j*38.6,gr=g.createRadialGradient(x,y,2,x,y,16);gr.addColorStop(0,"#ffffff");gr.addColorStop(.6,"#d8d8d0");gr.addColorStop(1,"#8a8c90");g.fillStyle=gr;g.beginPath();g.arc(x,y,16,0,PI*2);g.fill()}});
 const lm=new THREE.MeshLambertMaterial({map:lt,emissiveMap:lt,emissive:0xfff3d8,emissiveIntensity:0,side:THREE.DoubleSide});NM.plN.push([lm,0,2.4]);
 const gt=canvasTex(128,128,(g,w)=>{const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,"rgba(255,255,255,1)");gr.addColorStop(.25,"rgba(255,245,220,.5)");gr.addColorStop(1,"rgba(255,240,210,0)");g.fillStyle=gr;g.fillRect(0,0,w,w)});
 const gm=new THREE.SpriteMaterial({map:gt,color:0xfff2d0,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});NM.plO.push([gm,.75]);PLL={lm,gm,gt};return PLL}

// --- Campo de béisbol ---
// Disposición del campo (la usan decorate, para plantar los árboles de alrededor, y buildBaseball): el campo, el camino de entrada
// desde la calle más cercana, los focos, el marcador y los sitios de los árboles. Los focos y el marcador ocupan su sitio ya aquí
let BBL;
function bbLayout(){if(BBL!==undefined)return BBL;BBL=null;const area=R=>{let A=0;for(let i=0,j=R.length-2;i<R.length;j=i,i+=2)A+=R[j]*R[i+1]-R[i]*R[j+1];return Math.abs(A)/2};
 // El campo de deporte rectangular de unos 100 × 57 m (el rectángulo verde de la captura)
 let F=null;for(const g of MAP.green){if(g.k!==2||g.p.length!==8)continue;const a=area(g.p);if(a<4000||a>9000)continue;if(!F||Math.hypot(g.p[0]-1139,g.p[1]-945)<Math.hypot(F.p[0]-1139,F.p[1]-945))F=g}if(!F)return null;
 const p=F.p;let ul=Math.hypot(p[2]-p[0],p[3]-p[1]),vl=Math.hypot(p[6]-p[0],p[7]-p[1]);
 // Esquina de la base de meta: la primera; u = lado largo, v = lado corto
 let O=[p[0],p[1]],U=[(p[2]-p[0])/ul,(p[3]-p[1])/ul],V=[(p[6]-p[0])/vl,(p[7]-p[1])/vl];if(vl>ul){const t=U;U=V;V=t;const q=ul;ul=vl;vl=q}
 const L=(u,v)=>[O[0]+U[0]*u+V[0]*v,O[1]+U[1]*u+V[1]*v],inF=(x,z)=>inPoly(F.p,x,z);
 const okG=(x,z,m)=>roadAt(x,z)<0&&groundD(x,z)>m&&!inBuilding(x,z)&&!inWater(x,z)&&!blockedAt(x,z,m);
 // Camino de entrada: de la calle más cercana a un borde del campo (recto y perpendicular al borde), sin pasar por edificios,
 // sin acabar en los banquillos ni en las gradas; entre los cortos, el más cercano a la meta
 let path=null,ps=1e9;const H0=L(6,6),cands=[];
 for(let u=4;u<=ul-4;u+=3){if(!(u>9&&u<25)&&!(u>32&&u<52))cands.push([u,-.6,-V[0],-V[1]]);cands.push([u,vl+.6,V[0],V[1]])}
 for(let v=4;v<=vl-4;v+=3){if(!(v>9&&v<25)&&!(v>32&&v<52))cands.push([-.6,v,-U[0],-U[1]]);cands.push([ul+.6,v,U[0],U[1]])}
 for(const[u,v,dx,dz]of cands){const E=L(u,v),lx=-dz*1.7,lz=dx*1.7,base=Math.hypot(E[0]-H0[0],E[1]-H0[1])*.15;
  for(let t=1;t<70;t++){const x=E[0]+dx*t,z=E[1]+dz*t;if(t+base>=ps)break;
   if(roadAt(x,z)>=0||roadAt(x+lx,z+lz)>=0||roadAt(x-lx,z-lz)>=0){path={a:E,b:[x,z],l:t,d:[dx,dz]};ps=t+base;break}
   if(inBuilding(x,z)||inBuilding(x+lx,z+lz)||inBuilding(x-lx,z-lz)||inWater(x,z)||inF(x,z))break}}
 const offPath=(x,z,m)=>!path||segD2(x,z,path.a[0],path.a[1],path.b[0],path.b[1])>m*m;
 // Focos: seis torres alrededor (fuera del campo si hay sitio; si no, justo dentro del borde), sin tocar banquillos ni gradas
 const tw=[];for(const[u,v,du,dv]of[[-4,29,0,1],[29,-4,1,0],[68,-4,1,0],[-4,vl-4,0,-1],[ul+4,vl*.45,0,1],[ul*.62,vl+4,1,0]]){
  const iu=u<0?5.5:u>ul?-5.5:0,iv=v<0?5.5:v>vl?-5.5:0;let done=false;
  for(const s of[0,4,-4,8,-8])for(const o of[0,1]){if(done)break;const[x,z]=L(u+du*s+iu*o,v+dv*s+iv*o);if(okG(x,z,1.2)&&offPath(x,z,3)){tw.push([x,z]);addCirc(x,z,.6);done=true}}}
 // Marcador: detrás del centro del campo (fuera si cabe, si no delante de la valla), mirando a la meta
 let board=null;{const H=L(6,6);for(const s of[0,6,-6,12,-12])for(const v of[vl+5,vl-2.6]){if(board)break;const[x,z]=L(57+s,v),dx=H[0]-x,dz=H[1]-z,ry=Math.atan2(dx,dz);
   const a=lw(x,z,ry,-7.2,0),b=lw(x,z,ry,7.2,0);if(okG(x,z,1)&&okG(a[0],a[1],.6)&&okG(b[0],b[1],.6)&&(v<vl||!inF(x,z))&&offPath(x,z,8)){board=[x,z,ry];for(const u of[-5,5]){const q=lw(x,z,ry,u,0);addCirc(q[0],q[1],.5)}}}}
 // Árboles: alrededor del campo, a 5 m de los bordes de fuera, cada 9 m
 const trees=[],okT=(x,z)=>offPath(x,z,4.5)&&tw.every(t=>Math.hypot(t[0]-x,t[1]-z)>6)&&(!board||Math.hypot(board[0]-x,board[1]-z)>10)&&!inF(x,z);
 for(let u=-5;u<=ul+5;u+=9)for(const v of[-5,vl+5]){const[x,z]=L(u,v);if(okT(x,z))trees.push([x,z])}
 for(let v=4;v<=vl;v+=9)for(const u of[-5,ul+5]){const[x,z]=L(u,v);if(okT(x,z))trees.push([x,z])}
 BBL={F,O,U,V,ul,vl,L,path,tw,board,trees};return BBL}
function buildBaseball(){const BB=bbLayout();if(!BB)return;const{O,U,V,ul,vl,L,path,tw,board}=BB;PLC.baseball=BB;
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
 // (y0: altura a la que empieza la malla; los postes bajan siempre hasta el suelo)
 const fence=(a,b,h,y0)=>{y0=y0||0;const[x0,z0]=a,[x1,z1]=b,l=Math.hypot(x1-x0,z1-z0);const pl=new THREE.Mesh(new THREE.PlaneGeometry(l,h),nm);pl.geometry.attributes.uv.array.forEach((v,i,arr)=>{arr[i]=i%2?v*h/1.2:v*l/1.2});
  pl.position.set((x0+x1)/2,CURB+y0+h/2,(z0+z1)/2);pl.rotation.y=-Math.atan2(z1-z0,x1-x0);sc.add(pl);
  for(let t=0;t<=l;t+=Math.max(3,l/Math.ceil(l/4))){const c=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,h+y0,6),post);c.position.set(x0+(x1-x0)*t/l,CURB+(h+y0)/2,z0+(z1-z0)*t/l);sc.add(c)}
  for(let t=0;t<l;t+=.5){const f=t/l,g=Math.min(1,(t+.5)/l);addEdge(x0+(x1-x0)*f,z0+(z1-z0)*f,x0+(x1-x0)*g,z0+(z1-z0)*g)}};
 fence(L(0,9),L(2.2,2.2),5.5);fence(L(2.2,2.2),L(9,0),5.5);
 // Fondo: muro acolchado de 2,4 m con anuncios (marcas inventadas), raya amarilla de jonrón arriba y malla encima hasta 6,4 m
 const ADS=[["#c8302a","#fff","サクラマート 24H"],["#1d5fb8","#fff","TOKYO DRIVE"],["#f2c230","#2a2420","星空ラーメン"],["#2f8a4a","#fff","KAZE SODA"],["#22252a","#ff8a1e","TAKUMI TIRES"],["#f4f2ec","#1d5fb8","みなと電器"]];
 const adT=canvasTex(2048,128,(g,w,h)=>{const pw=w/ADS.length;ADS.forEach(([bg,fg,t],i)=>{g.fillStyle=bg;g.fillRect(i*pw,0,pw,h);g.fillStyle="rgba(0,0,0,.25)";g.fillRect(i*pw+pw-3,0,3,h);
   g.fillStyle=fg;g.font="bold 58px 'Yu Gothic','Meiryo',sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(t,i*pw+pw/2,h/2+3,pw-30)})},true);
 const adM=new THREE.MeshLambertMaterial({map:adT,emissiveMap:adT,emissive:0xffffff,emissiveIntensity:.05});NM.plN.push([adM,.05,.55]);
 const backM=new THREE.MeshLambertMaterial({color:0x2f5a3a}),padM=new THREE.MeshLambertMaterial({color:0xe8c547});
 const adWall=(a,b,f)=>{const l=Math.hypot(b[0]-a[0],b[1]-a[1]),mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2,ry=Math.atan2(f[0],f[1]);
  const fr=new THREE.PlaneGeometry(l,2.4);fr.attributes.uv.array.forEach((v,i,arr)=>{if(!(i%2))arr[i]=v*l/36});
  const m=new THREE.Mesh(fr,adM);m.position.set(mx+f[0]*.16,CURB+1.2,mz+f[1]*.16);m.rotation.y=ry;sc.add(m);
  const bk=new THREE.Mesh(new THREE.BoxGeometry(l,2.4,.3),backM);bk.position.set(mx,CURB+1.2,mz);bk.rotation.y=ry;bk.castShadow=bk.receiveShadow=true;sc.add(bk);
  const pd=new THREE.Mesh(new THREE.BoxGeometry(l,.14,.36),padM);pd.position.set(mx,CURB+2.47,mz);pd.rotation.y=ry;sc.add(pd)};
 adWall(L(ul-.4,.4),L(ul-.4,vl-.4),[-U[0],-U[1]]);adWall(L(.4,vl-.4),L(ul-.4,vl-.4),[-V[0],-V[1]]);
 fence(L(ul-.4,.4),L(ul-.4,vl-.4),4,2.4);fence(L(.4,vl-.4),L(ul-.4,vl-.4),4,2.4);
 // Gradas pequeñas de hormigón en las dos bandas (fuera de las líneas de foul)
 const st=new THREE.MeshLambertMaterial({color:0xa9abaf});const stand=(u0,v0,alongU)=>{const len=16;for(let k=0;k<3;k++){const w=alongU?len:1,d=alongU?1:len,u=alongU?u0+len/2:u0+k,v=alongU?v0+k:v0+len/2;
   const[x,z]=L(alongU?u:u0+k+.5,alongU?v0+k+.5:v);const o=new THREE.Mesh(new THREE.BoxGeometry(alongU?len:1,.45*(3-k),alongU?1:len),st);o.position.set(x,CURB+.225*(3-k),z);o.rotation.y=-Math.atan2(U[1],U[0]);o.castShadow=o.receiveShadow=true;sc.add(o)}
  const a=L(u0,v0),b=alongU?L(u0+len,v0+3):L(u0+3,v0+len);const c0=alongU?L(u0,v0+1.5):L(u0+1.5,v0),c1=alongU?L(u0+len,v0+1.5):L(u0+1.5,v0+len);addCaps(c0[0],c0[1],c1[0],c1[1],1.6)};
 stand(34,1.2,true);stand(1.2,34,false);
 const B=vcBuild();
 // Banquillos: uno en cada banda, entre la meta y las gradas, abiertos hacia el campo (azules, con banco de madera)
 const dugout=(x,z,ry)=>{const W=M4(x,CURB,z,ry),BL="#2e5f9e",WD="#c9a676";
  B.at(W,PBOX,"#3a3d42",0,.05,0,12,.1,3);B.at(W,PBOX,BL,0,1.3,-1.4,12,2.6,.25);for(const s of[-1,1])B.at(W,PBOX,BL,s*6,1.3,0,.25,2.6,3);
  B.at(W,PBOX,BL,0,2.7,.15,12.6,.2,3.6);B.at(W,PBOX,"#f2f2ee",0,2.7,1.97,12.6,.22,.06);B.at(W,PBOX,BL,0,.5,1.4,12,1,.2);B.at(W,PBOX,"#c8c8c8",0,1.25,1.4,12,.05,.05);
  for(let u=-5;u<=5;u+=2.5)B.at(W,PBOX,"#c8c8c8",u,1.1,1.4,.05,.3,.05);
  B.at(W,PBOX,WD,0,.45,-.95,11,.08,.5);B.at(W,PBOX,WD,0,.85,-1.22,11,.4,.06);for(let u=-5;u<=5;u+=2.5)B.at(W,PBOX,"#6d7178",u,.21,-.95,.08,.42,.4);
  rectPoly(x,z,ry,6.1,1.6,2.8)};
 {const[x,z]=L(17,1.9);dugout(x,z,Math.atan2(V[0],V[1]))}{const[x,z]=L(1.9,17);dugout(x,z,Math.atan2(U[0],U[1]))}
 // Torres de focos: poste, plataforma y panel de focos inclinado hacia el campo; de noche se encienden y el césped se ilumina
 if(tw.length){const C=L(ul*.42,vl*.5);
  const{lm,gm}=plLamp();
  const fm=new THREE.MeshLambertMaterial({color:0x6d7178});
  for(const[x,z]of tw){const ry=Math.atan2(C[0]-x,C[1]-z),W=M4(x,CURB,z,ry);
   B.at(W,cylG(.22,.42,8),"#8d9298",0,13,0,1,26,1);B.at(W,PBOX,"#6d7178",0,24.7,.4,5.4,.15,1.8);for(const s of[-1,1])B.at(W,PBOX,"#6d7178",s*2.6,25.3,1.25,.05,1.2,.05);
   const G=new THREE.Group(),H=new THREE.Group();G.position.set(x,CURB+26.6,z);G.rotation.y=ry;H.rotation.x=.35;G.add(H);
   const fr=new THREE.Mesh(new THREE.BoxGeometry(5,3.4,.4),fm);fr.castShadow=true;H.add(fr);const pn=new THREE.Mesh(new THREE.PlaneGeometry(4.6,3),lm);pn.position.z=.21;H.add(pn);sc.add(G);
   const s=new THREE.Sprite(gm),q=lw(x,z,ry,0,1.4);s.position.set(q[0],CURB+26.2,q[1]);s.scale.set(18,18,1);sc.add(s)}
  const P=[L(0,0),L(ul,0),L(ul,vl),L(0,vl)],pos=[];for(const k of[0,2,1,0,3,2])pos.push(P[k][0],CURB+.06,P[k][1]);
  const gg=new THREE.BufferGeometry();gg.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));
  const glm=new THREE.MeshBasicMaterial({color:0xfff6e0,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-4});
  NM.plO.push([glm,.3]);sc.add(new THREE.Mesh(gg,glm))}
 // Marcador: tablero con las entradas, carreras, bolas, strikes y outs, sobre dos patas; se ilumina de noche
 if(board){const[x,z,ry]=board,W=M4(x,CURB,z,ry);
  for(const u of[-5,5])B.at(W,PBOX,"#5c6068",u,1.6,0,.5,3.2,.5);B.at(W,PBOX,"#2a2d33",0,6.6,-.05,14.6,7,.5);B.at(W,PBOX,"#1d5fb8",0,10.3,0,14.8,.5,.7);
  const bt=canvasTex(1024,480,(g,w,h)=>{const r=rng(9);g.fillStyle="#17352a";g.fillRect(0,0,w,h);g.strokeStyle="#e8e8e0";g.lineWidth=6;g.strokeRect(8,8,w-16,h-16);
   g.textAlign="center";g.textBaseline="middle";g.fillStyle="#fff";g.font="bold 44px 'Yu Gothic','Meiryo',sans-serif";g.fillText("港区グラウンド",w/2,52);
   g.font="bold 34px sans-serif";g.fillStyle="#f2c230";for(let i=0;i<9;i++)g.fillText(String(i+1),240+i*56,118);g.fillStyle="#fff";["R","H","E"].forEach((t,i)=>g.fillText(t,770+i*74,118));
   g.font="bold 38px 'Yu Gothic','Meiryo',sans-serif";[["東京",190],["みなと",262]].forEach(([t,y])=>{g.fillStyle="#fff";g.textAlign="left";g.fillText(t,36,y);g.textAlign="center";let R=0,Hh=0;
    for(let i=0;i<6;i++){const n=r()<.6?0:1+(r()*3|0);R+=n;Hh+=n+(r()<.5?1:0);g.fillStyle="#fff";g.fillText(String(n),240+i*56,y)}g.fillStyle="#f2c230";g.fillText(String(R),770,y);g.fillText(String(Hh),844,y);g.fillText(String(r()<.7?0:1),918,y)});
   g.fillStyle="#fff";g.font="bold 32px sans-serif";g.textAlign="left";[["B","#3ccf5a",3,1],["S","#f2c230",2,2],["O","#e04030",2,1]].forEach(([t,c,n,on],j)=>{const y=340+j*44;g.fillStyle="#fff";g.fillText(t,40,y);
    for(let i=0;i<n;i++){g.fillStyle=i<on?c:"#29453a";g.beginPath();g.arc(100+i*44,y,15,0,PI*2);g.fill()}});
   g.textAlign="right";g.fillStyle="#fff";g.font="bold 64px sans-serif";g.fillText("7",w-60,400);g.font="bold 28px 'Yu Gothic','Meiryo',sans-serif";g.fillText("回 裏",w-110,404)});
  const bm=new THREE.MeshLambertMaterial({map:bt,emissiveMap:bt,emissive:0xffffff,emissiveIntensity:.15});NM.plN.push([bm,.15,1.1]);
  const fp=new THREE.Mesh(new THREE.PlaneGeometry(14,6.6),bm),q=lw(x,z,ry,0,.22);fp.position.set(q[0],CURB+6.6,q[1]);fp.rotation.y=ry;sc.add(fp)}
 // Camino de entrada de baldosas desde la calle
 if(path){const[ax,az]=path.a,[bx,bz]=path.b,[dx,dz]=path.d,hw=1.7,lx=-dz*hw,lz=dx*hw,y=CURB+.025,P=[[ax+lx,az+lz],[bx+lx,bz+lz],[bx-lx,bz-lz],[ax-lx,az-lz]],pos=[],uv=[];
  for(const k of[0,2,1,0,3,2]){pos.push(P[k][0],y,P[k][1]);uv.push(P[k][0]/3,P[k][1]/3)}
  const pt=canvasTex(256,256,(g,w)=>{g.fillStyle="#8f8d88";g.fillRect(0,0,w,w);const r=rng(12);for(let j=0;j<4;j++)for(let i=0;i<4;i++){const v=165+r()*25|0;g.fillStyle=`rgb(${v},${v-2},${v-6})`;g.fillRect(i*64+2,j*64+2,60,60)}},true);
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();
  const n=g.attributes.normal.array;for(let i=1;i<n.length;i+=3)n[i]=1;const m=new THREE.Mesh(g,plMat(pt,{side:THREE.DoubleSide,polygonOffsetFactor:-2}));m.receiveShadow=true;sc.add(m)}
 B.mesh()}
