// Coches: datos y construcción del modelo
// vm: velocidad máxima (m/s) · ac: empuje a 0 km/h (m/s²) · gr: agarre lateral · dr: tendencia a derrapar · m: masa (kg)
// Curva de aceleración ac·(1-(v/vm)²) → 0-100 km/h: Kei 7,0 s · Drift 4,8 s · GT 4,0 s · Hypercar 2,6 s
// rl: régimen máximo del motor (rpm), cambia el tono del sonido · f: modelo 3D (Car Kit de Kenney, CC0, en models/cars; glTF con
// los datos incrustados y extensión .json porque el enlace del móvil no sirve archivos .glb)
const CARS=[{n:"Kei Sport",c:0xf5b800,vm:44.4,ac:4.7,gr:8.5,dr:.6,w:1.7,l:3.6,m:850,rl:8500,f:"hatchback-sports"},{n:"Coupé GT",c:0xe5173f,vm:75,ac:7.3,gr:7.5,dr:1,w:1.9,l:4.4,m:1450,rl:7000,f:"sedan-sports"},
 {n:"Hypercar",c:0x2a6cff,vm:97.2,ac:11,gr:6.5,dr:1.2,w:2,l:4.6,m:1400,rl:8500,f:"race-future"},{n:"Drift Spec",c:0xf2f2f2,vm:66.7,ac:6.2,gr:7.5,dr:1.5,w:1.85,l:4.4,m:1300,rl:7800,f:"sedan-sports"},
 // Furgoneta kei: pequeña, lenta y alta, con motor de poca cilindrada
 {n:"Kei Van",c:0xe8e4d6,vm:38.9,ac:3.7,gr:7,dr:.7,w:1.5,l:3.4,m:900,rl:6800,f:"van"}];
const t100=c=>c.vm/c.ac*Math.atanh(27.78/c.vm);
let cur=CARS[0],car=null,carK=0,intG=null,whl=null,WSH=null,carBody=null;const WHEELS=[];
// Lienzo de las gotas del parabrisas (lo dibuja weather.js)
const DCV=document.createElement("canvas");DCV.width=512;DCV.height=320;const DTEX=new THREE.CanvasTexture(DCV);
const WSM=new THREE.MeshBasicMaterial({map:DTEX,transparent:true,depthWrite:false,fog:false,side:THREE.DoubleSide});

// --- Modelos 3D ---
// Tráfico: tipo de modelo, largo real (m), masa (kg), probabilidad y si se repinta (taxi, policía y ambulancia no)
const NPCK=[{f:"sedan",l:4.5,m:1300,p:5,paint:1},{f:"suv",l:4.7,m:1700,p:3,paint:1},{f:"suv-luxury",l:4.9,m:1900,p:1.5,paint:1},{f:"hatchback-sports",l:4,m:1100,p:2,paint:1},{f:"taxi",l:4.6,m:1300,p:2.5},
 {f:"van",l:4.8,m:1800,p:2,paint:1},{f:"delivery",l:5.4,m:2600,p:1.2,paint:1},{f:"truck",l:5.6,m:2400,p:1,paint:1},{f:"police",l:4.7,m:1500,p:.4},{f:"ambulance",l:5.6,m:2800,p:.25}];
const MODELS={};let CMAP=null;
// La textura de los modelos es una paleta de colores (8×4 casillas de 64×128 px). La carrocería usa una casilla de la segunda fila:
// para pintar el coche se copia la paleta y se cambia esa casilla conservando el sombreado
function paintCell(scene){const A={};scene.traverse(o=>{if(!o.isMesh||!o.name.startsWith("body"))return;const uv=o.geometry.attributes.uv,p=o.geometry.attributes.position,ix=o.geometry.index,n=ix?ix.count:p.count,a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
 for(let i=0;i<n;i+=3){const i0=ix?ix.getX(i):i,i1=ix?ix.getX(i+1):i+1,i2=ix?ix.getX(i+2):i+2;a.fromBufferAttribute(p,i0);b.fromBufferAttribute(p,i1).sub(a);c.fromBufferAttribute(p,i2).sub(a);
  const u=(uv.getX(i0)+uv.getX(i1)+uv.getX(i2))/3,v=(uv.getY(i0)+uv.getY(i1)+uv.getY(i2))/3,row=Math.floor(v*4);if(row!==1)continue;const k=Math.floor(u*8);A[k]=(A[k]||0)+b.cross(c).length()}});
 let best=-1,bv=0;for(const k in A)if(A[k]>bv){bv=A[k];best=+k}return best}
// Casillas de la paleta que usan las ruedas, con su brillo medio (las oscuras son el neumático y las claras la llanta)
function wheelCells(scene){const A={};scene.traverse(o=>{if(!o.isMesh||!o.name.startsWith("wheel"))return;const uv=o.geometry.attributes.uv;for(let i=0;i<uv.count;i++){const k=Math.floor(uv.getX(i)*8)+","+Math.floor(uv.getY(i)*4);A[k]=(A[k]||0)+1}});
 const g=document.createElement("canvas").getContext("2d");g.canvas.width=g.canvas.height=512;g.drawImage(CMAP,0,0);
 return Object.keys(A).map(k=>{const[c,r]=k.split(",").map(Number),d=g.getImageData(c*64,r*128,64,128).data;let m=0;for(let i=0;i<d.length;i+=4)m+=d[i]*.3+d[i+1]*.59+d[i+2]*.11;return{c,r,l:m/(d.length/4)/255}})}
// Cambia el color de una casilla de la paleta conservando su sombreado
function recolor(g,c,r,col){const d=g.getImageData(c*64,r*128,64,128),q=d.data,k=new THREE.Color(col);let m=0;for(let i=0;i<q.length;i+=4)m+=q[i]*.3+q[i+1]*.59+q[i+2]*.11;m=Math.max(1,m/(q.length/4));
 const dark=m<60;for(let i=0;i<q.length;i+=4){const l=dark?.55+.45*(q[i]*.3+q[i+1]*.59+q[i+2]*.11)/m:(q[i]*.3+q[i+1]*.59+q[i+2]*.11)/m;q[i]=Math.min(255,k.r*255*l);q[i+1]=Math.min(255,k.g*255*l);q[i+2]=Math.min(255,k.b*255*l)}g.putImageData(d,c*64,r*128)}
const WMAT=new Map();
function wheelMat(f,rim,tire){const key=f+"|"+rim+"|"+tire;if(WMAT.has(key))return WMAT.get(key);const cv=document.createElement("canvas");cv.width=cv.height=512;const g=cv.getContext("2d");g.drawImage(CMAP,0,0);
 for(const q of MODELS[f].wc){if(q.l<.35){if(tire!==undefined)recolor(g,q.c,q.r,tire)}else if(rim!==undefined)recolor(g,q.c,q.r,rim)}
 const t=new THREE.CanvasTexture(cv);t.flipY=false;const m=new THREE.MeshPhongMaterial({map:t,shininess:70,specular:0x333333});WMAT.set(key,m);return m}
// Casillas de la carrocería: cristales (la que más ocupa entre las caras inclinadas o verticales de la parte alta) y bajos (la que
// más ocupa en la parte baja: parachoques y faldones grises), sin contar la de la pintura. Devuelve "columna,fila"
function bodyCells(scene,paint){const A={},B={};let H=0;scene.updateMatrixWorld(true);scene.traverse(o=>{if(o.isMesh&&o.name.startsWith("body")){o.geometry.computeBoundingBox();H=Math.max(H,o.geometry.boundingBox.max.y+o.position.y)}});
 scene.traverse(o=>{if(!o.isMesh||!o.name.startsWith("body"))return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry,p=g.attributes.position,uv=g.attributes.uv,a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),n=new THREE.Vector3();
  for(let i=0;i<p.count;i+=3){a.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);b.fromBufferAttribute(p,i+1).applyMatrix4(o.matrixWorld);c.fromBufferAttribute(p,i+2).applyMatrix4(o.matrixWorld);n.subVectors(b,a).cross(c.clone().sub(a));const ar=n.length();n.normalize();
   const k=Math.floor((uv.getX(i)+uv.getX(i+1)+uv.getX(i+2))/3*8)+","+Math.floor((uv.getY(i)+uv.getY(i+1)+uv.getY(i+2))/3*4);if(k===paint+",1")continue;const y=(a.y+b.y+c.y)/3;
   if(y>H*.55&&Math.abs(n.y)<.8)A[k]=(A[k]||0)+ar;if(y<H*.4)B[k]=(B[k]||0)+ar}});
 const top=O=>{let best=null,bv=0;for(const k in O)if(O[k]>bv){bv=O[k];best=k}return best};
 // Los cristales del Car Kit son de color claro azulado (casilla 0,3 en casi todos): se prefiere una casilla así; si no hay, la de más área.
 // (Antes el Hypercar tomaba la gris de los alerones como cristal y las calcomanías se pegaban en la cúpula)
 let glass=null;if(CMAP){const g=document.createElement("canvas").getContext("2d");g.canvas.width=g.canvas.height=512;g.drawImage(CMAP,0,0);const L={};
  for(const k in A){const[c,r]=k.split(",").map(Number),d=g.getImageData(c*64+32,r*128+64,1,1).data;if(d[0]*.3+d[1]*.59+d[2]*.11>200&&d[2]>=d[0])L[k]=A[k]}glass=top(L)}
 if(!glass)glass=top(A);if(glass)delete B[glass];return{glass,trim:top(B)}}
const PTEX=new Map();
// Textura de la paleta con la pintura (col), y opcionalmente el color del cristal (gc), su tintado (tint 0-1) y el de los bajos (bc)
function paintTex(n,col,o){o=o||{};const M=MODELS[n],key=n+"|"+col+"|"+(o.tint||0)+"|"+o.gc+"|"+o.bc;if(PTEX.has(key))return PTEX.get(key);const cv=document.createElement("canvas");cv.width=cv.height=512;const g=cv.getContext("2d");g.drawImage(CMAP,0,0);
 const cell=s=>s.split(",").map(Number);
 if(col!==undefined&&M.cell>=0)recolor(g,M.cell,1,col);
 if(M.trim&&o.bc!==undefined){const[c,r]=cell(M.trim);recolor(g,c,r,o.bc)}
 if(M.glass){const[c,r]=cell(M.glass);if(o.gc!==undefined)recolor(g,c,r,o.gc);if(o.tint>0){g.fillStyle=`rgba(6,9,14,${o.tint*.85})`;g.fillRect(c*64,r*128,64,128)}}
 const t=new THREE.CanvasTexture(cv);t.flipY=false;t.anisotropy=4;PTEX.set(key,t);return t}
const PMAT=new Map();
function paintMat(n,col,o){o=o||{};const key=n+"|"+col+"|"+(o.tint||0)+"|"+o.gc+"|"+o.bc;if(!PMAT.has(key))PMAT.set(key,new THREE.MeshPhongMaterial({map:paintTex(n,col,o),shininess:60,specular:0x2a2a2a}));return PMAT.get(key)}
function loadCars(){if(!THREE.GLTFLoader)return Promise.resolve();const L=new THREE.GLTFLoader(),names=[...new Set([...CARS.map(c=>c.f),...NPCK.map(k=>k.f)])];
 return new Promise(ok=>{const im=new Image();im.onload=()=>{CMAP=im;ok()};im.onerror=()=>ok();im.src="models/cars/Textures/colormap.png"})
  .then(()=>Promise.all(names.map(n=>L.loadAsync(`models/cars/${n}.json`).then(g=>{const s=g.scene,bb=new THREE.Box3().setFromObject(s);const cell=paintCell(s);MODELS[n]=Object.assign({s,bb,cell,wc:CMAP?wheelCells(s):[]},bodyCells(s,cell))}).catch(e=>console.warn("Modelo",n,e)))))
  .then(()=>{if(CMAP&&MODELS[cur.f])buildCar(carK)})}
// Copia del modelo escalada al largo pedido (un poco más bajo que el original, que es de estilo juguete), con la pintura elegida
function modelInst(n,len,col,flat,opt){const M=MODELS[n],s=M.s.clone(true),sz=M.bb.getSize(new THREE.Vector3()),k=len/sz.z,mat=paintMat(n,col,opt);
 s.scale.set(k,k*.88,k);const wh=[];let body=null;s.traverse(o=>{if(o.isMesh){o.material=mat;o.castShadow=!flat;o.receiveShadow=!flat;if(o.name.startsWith("body"))body=o}if(o.name.startsWith("wheel")){o.rotation.order="YXZ";wh.push({o,f:o.name.includes("front")})}});
 // Morro y cola reales a la altura de los faros (para pegar las luces a la carrocería, no al largo teórico)
 const H=sz.y*k*.88,W=sz.x*k;let fz=-1e9,rz=1e9;if(body){s.updateMatrixWorld(true);const p=body.geometry.attributes.position,v=new THREE.Vector3();
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(body.matrixWorld);if(v.y>H*.3&&v.y<H*.55&&Math.abs(v.x)>W*.2){fz=Math.max(fz,v.z);rz=Math.min(rz,v.z)}}}
 if(fz<-1e8){fz=len/2;rz=-len/2}
 return{s,w:W,h:H,wh,body,k,fz,rz}}
// Luces del coche: faros (blancos) y pilotos (rojos) que se encienden de noche (env.js usa NM.head y NM.tail)
function carLights(g,w,h,l,fz,rz){if(fz===undefined){fz=l/2;rz=-l/2}if(!NM.head){NM.head=new THREE.MeshLambertMaterial({color:0xfff4d0,emissive:0xfff0c8,emissiveIntensity:.2});NM.tail=new THREE.MeshLambertMaterial({color:0xaa1010,emissive:0xff1a1a,emissiveIntensity:.25})}
 for(const sx of[-1,1]){const hm=new THREE.Mesh(new THREE.BoxGeometry(w*.16,h*.07,.04),NM.head);hm.position.set(sx*w*.32,h*.42,fz+.01);g.add(hm);const tm=new THREE.Mesh(new THREE.BoxGeometry(w*.18,h*.07,.04),NM.tail);tm.position.set(sx*w*.33,h*.45,rz-.01);g.add(tm)}}

function buildCar(k){carK=k;cur=CARS[k];if(car)sc.remove(car);car=new THREE.Group();car.rotation.order="YXZ";WHEELS.length=0;carBody=null;
 const {w,l}=cur;let h=1.3;
 if(MODELS[cur.f]&&CMAP){const L=typeof LIV!=="undefined"&&LIV[k]?LIV[k]:{},m=modelInst(cur.f,l,carPaint(k),false,{tint:L.tint||0,gc:L.gc,bc:L.bc});car.add(m.s);h=m.h;carBody=m.body;for(const q of m.wh)WHEELS.push(q);cur.wr=.3*m.k;carLights(car,m.w,h,l,m.fz,m.rz)}
 else{// Mientras cargan los modelos: coche sencillo de cajas
  const bx=(a,b,c,col,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(a,b,c),new THREE.MeshLambertMaterial({color:col}));m.position.set(x,y,z);car.add(m);return m};
  bx(w,.55,l,cur.c,0,.5,0);bx(w*.85,.45,l*.45,0x15222f,0,1,-.1*l)}
 cur.ey=h*.82;
 // Interior sencillo para la cámara de primera persona (la carrocería de fuera se oculta en esa cámara, ver main.js): todo queda
 // detrás del parabrisas. La cámara va en x = -0,38 (volante a la derecha, como en Japón), a la altura ey y 0,1 m por delante del centro
 const dm=new THREE.MeshLambertMaterial({color:0x15171d}),pm=new THREE.MeshLambertMaterial({color:0x1b1d22}),sm=new THREE.MeshLambertMaterial({color:0x2a2c33}),
  bm=new THREE.MeshPhongMaterial({color:carPaint(k),shininess:60,specular:0x333333});intG=new THREE.Group();car.add(intG);
 const bx2=(a,b,c,m,x,y,z,rx)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(a,b,c),m);o.position.set(x,y,z);if(rx)o.rotation.x=rx;intG.add(o);return o};
 {const ey=cur.ey,cx=-.38,wz0=.92,wy0=ey-.26,wz1=.3,wy1=ey+.3,L=Math.hypot(wz0-wz1,wy1-wy0),ang=-Math.atan2(wz0-wz1,wy1-wy0),y=(wy0+wy1)/2,z=(wz0+wz1)/2;
  // Parabrisas (donde caen las gotas de lluvia, weather.js), montantes, borde del techo, techo y montantes de las puertas
  WSH=new THREE.Mesh(new THREE.PlaneGeometry(w*.9,L),WSM);WSH.position.set(0,y,z);WSH.rotation.x=ang;WSH.renderOrder=3;WSH.visible=false;intG.add(WSH);
  for(const s of[-1,1]){bx2(.09,L+.04,.09,pm,s*w*.45,y,z,ang);bx2(.08,.48,.12,pm,s*w*.45,ey+.06,-.45);
   // Puertas: panel por debajo de la ventanilla
   bx2(.06,.42,1.35,sm,s*(w/2-.08),ey-.36,.05)}
  bx2(w*.94,.1,.14,pm,0,wy1+.03,wz1-.02);bx2(w*.94,.04,.75,sm,0,wy1+.06,-.12);bx2(.22,.07,.03,dm,0,wy1-.06,wz1+.02);
  // Salpicadero bajo el parabrisas, con el cuadro de relojes delante del volante
  bx2(w*.92,.26,.42,dm,0,ey-.41,.72);bx2(.4,.09,.1,pm,cx,ey-.25,.6,-.4);
  // Capó (del color del coche), que se ve por el parabrisas
  const hl=Math.max(.6,cur.l/2-1.05);bx2(w*.92,.06,hl,bm,0,ey-.34,.93+hl/2,.06);
  // Volante: aro, centro y radios, casi vertical delante del conductor
  const wgp=new THREE.Group();wgp.position.set(cx,ey-.23,.47);wgp.rotation.x=-.35;whl=new THREE.Group();wgp.add(whl);
  whl.add(new THREE.Mesh(new THREE.TorusGeometry(.17,.022,8,24),dm));whl.add(new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.04,12).rotateX(PI/2),pm));
  for(const a of[0,PI*.5+.5,PI*1.5-.5]){const sp=new THREE.Mesh(new THREE.BoxGeometry(.15,.025,.015),pm);sp.position.set(Math.cos(a)*.085,Math.sin(a)*.085,0);sp.rotation.z=a;whl.add(sp)}
  bx2(.07,.07,.2,dm,cx,ey-.3,.58,-.35);intG.add(wgp)}
 intG.visible=false;
 car.add(blob(w,l));sc.add(car);if(typeof applyDecals==="function")applyDecals();if(spawned){car.position.set(px,bodyY,pz);car.rotation.set(pitch,h,roll)}}
// Ruedas: giran con la velocidad y las delanteras se orientan con el volante
function wheelSpin(dt){const vf=vx*Math.sin(h)+vz*Math.cos(h),r=cur.wr||.36;for(const q of WHEELS){q.o.rotation.x+=vf*dt/r;q.o.rotation.y=q.f?stV*.45:0}}
// Color de cada coche (lo cambia el editor de calcomanías)
function carPaint(k){return(typeof LIV!=="undefined"&&LIV[k]&&LIV[k].c!==undefined)?LIV[k].c:CARS[k].c}
// Sombra de contacto bajo el coche (oscurece el suelo justo debajo, así no parece que flote aunque no haya sombras del sol)
let BLOBM=null;
function blob(w,l){if(!BLOBM)BLOBM=new THREE.MeshBasicMaterial({map:canvasTex(128,128,(g,W2,H2)=>{const gr=g.createRadialGradient(64,64,10,64,64,64);gr.addColorStop(0,"rgba(0,0,0,.85)");gr.addColorStop(.55,"rgba(0,0,0,.6)");gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.fillRect(0,0,W2,H2)}),
  transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});
 const m=new THREE.Mesh(new THREE.PlaneGeometry(w*1.35,l*1.2).rotateX(-PI/2),BLOBM);m.position.y=.025;m.renderOrder=1;return m}
buildCar(0);
