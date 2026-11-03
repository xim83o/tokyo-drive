// Coches: datos y construcción del modelo
// vm: velocidad máxima (m/s) · ac: empuje a 0 km/h (m/s²) · gr: agarre lateral · dr: tendencia a derrapar · m: masa (kg)
// Curva de aceleración ac·(1-(v/vm)²) → 0-100 km/h: Kei 7,0 s · Drift 4,8 s · GT 4,0 s · Hypercar 2,6 s
// rl: régimen máximo del motor (rpm), cambia el tono del sonido · f: modelo 3D (Car Kit de Kenney, CC0, en models/cars; glTF con
// los datos incrustados y extensión .json porque el enlace del móvil no sirve archivos .glb)
const CARS=[{n:"Kei Sport",c:0xf5b800,vm:44.4,ac:4.7,gr:8.5,dr:.6,w:1.7,l:3.6,m:850,rl:8500,f:"hatchback-sports"},{n:"Coupé GT",c:0xe5173f,vm:75,ac:7.3,gr:7.5,dr:1,w:1.9,l:4.4,m:1450,rl:7000,f:"sedan-sports"},
 {n:"Hypercar",c:0x2a6cff,vm:97.2,ac:11,gr:6.5,dr:1.2,w:2,l:4.6,m:1400,rl:8500,f:"race-future"},{n:"Drift Spec",c:0xf2f2f2,vm:66.7,ac:6.2,gr:7.5,dr:1.5,w:1.85,l:4.4,m:1300,rl:7800,f:"sedan-sports"}];
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
const PTEX=new Map();
// tint: tintado de los cristales (0-1); los cristales usan la primera casilla de la paleta
function paintTex(cell,col,tint){const key=cell+"|"+col+"|"+(tint||0);if(PTEX.has(key))return PTEX.get(key);const cv=document.createElement("canvas");cv.width=cv.height=512;const g=cv.getContext("2d");g.drawImage(CMAP,0,0);
 if(tint>0){g.fillStyle=`rgba(8,12,18,${tint*.85})`;g.fillRect(0,0,64,128)}
 if(cell>=0&&col!==undefined){const d=g.getImageData(cell*64,128,64,128),q=d.data,c=new THREE.Color(col);let m=0;for(let i=0;i<q.length;i+=4)m+=q[i]*.3+q[i+1]*.59+q[i+2]*.11;m/=q.length/4;
  for(let i=0;i<q.length;i+=4){const l=(q[i]*.3+q[i+1]*.59+q[i+2]*.11)/m;q[i]=Math.min(255,c.r*255*l);q[i+1]=Math.min(255,c.g*255*l);q[i+2]=Math.min(255,c.b*255*l)}g.putImageData(d,cell*64,128)}
 const t=new THREE.CanvasTexture(cv);t.flipY=false;t.anisotropy=4;PTEX.set(key,t);return t}
const PMAT=new Map();
function paintMat(cell,col,tint){const key=cell+"|"+col+"|"+(tint||0);if(!PMAT.has(key))PMAT.set(key,new THREE.MeshPhongMaterial({map:paintTex(cell,col,tint),shininess:60,specular:0x2a2a2a}));return PMAT.get(key)}
function loadCars(){if(!THREE.GLTFLoader)return Promise.resolve();const L=new THREE.GLTFLoader(),names=[...new Set([...CARS.map(c=>c.f),...NPCK.map(k=>k.f)])];
 return new Promise(ok=>{const im=new Image();im.onload=()=>{CMAP=im;ok()};im.onerror=()=>ok();im.src="models/cars/Textures/colormap.png"})
  .then(()=>Promise.all(names.map(n=>L.loadAsync(`models/cars/${n}.json`).then(g=>{const s=g.scene,bb=new THREE.Box3().setFromObject(s);MODELS[n]={s,bb,cell:paintCell(s)}}).catch(e=>console.warn("Modelo",n,e)))))
  .then(()=>{if(CMAP&&MODELS[cur.f])buildCar(carK)})}
// Copia del modelo escalada al largo pedido (un poco más bajo que el original, que es de estilo juguete), con la pintura elegida
function modelInst(n,len,col,flat,tint){const M=MODELS[n],s=M.s.clone(true),sz=M.bb.getSize(new THREE.Vector3()),k=len/sz.z,mat=paintMat(col===undefined?-1:M.cell,col,tint);
 s.scale.set(k,k*.88,k);const wh=[];let body=null;s.traverse(o=>{if(o.isMesh){o.material=mat;o.castShadow=!flat;o.receiveShadow=!flat;if(o.name.startsWith("body"))body=o}if(o.name.startsWith("wheel")){o.rotation.order="YXZ";wh.push({o,f:o.name.includes("front")})}});
 return{s,w:sz.x*k,h:sz.y*k*.88,wh,body,k}}
// Luces del coche: faros (blancos) y pilotos (rojos) que se encienden de noche (env.js usa NM.head y NM.tail)
function carLights(g,w,h,l){if(!NM.head){NM.head=new THREE.MeshLambertMaterial({color:0xfff4d0,emissive:0xfff0c8,emissiveIntensity:.2});NM.tail=new THREE.MeshLambertMaterial({color:0xaa1010,emissive:0xff1a1a,emissiveIntensity:.25})}
 for(const sx of[-1,1]){const hm=new THREE.Mesh(new THREE.BoxGeometry(w*.16,h*.07,.04),NM.head);hm.position.set(sx*w*.32,h*.42,l/2+.01);g.add(hm);const tm=new THREE.Mesh(new THREE.BoxGeometry(w*.18,h*.07,.04),NM.tail);tm.position.set(sx*w*.33,h*.45,-l/2-.01);g.add(tm)}}

function buildCar(k){carK=k;cur=CARS[k];if(car)sc.remove(car);car=new THREE.Group();car.rotation.order="YXZ";WHEELS.length=0;carBody=null;
 const {w,l}=cur;let h=1.3;
 if(MODELS[cur.f]&&CMAP){const m=modelInst(cur.f,l,carPaint(k),false,typeof LIV!=="undefined"&&LIV[k]?LIV[k].tint:0);car.add(m.s);h=m.h;carBody=m.body;for(const q of m.wh)WHEELS.push(q);cur.wr=.3*m.k;carLights(car,m.w,h,l)}
 else{// Mientras cargan los modelos: coche sencillo de cajas
  const bx=(a,b,c,col,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(a,b,c),new THREE.MeshLambertMaterial({color:col}));m.position.set(x,y,z);car.add(m);return m};
  bx(w,.55,l,cur.c,0,.5,0);bx(w*.85,.45,l*.45,0x15222f,0,1,-.1*l)}
 cur.ey=h*.82;
 const dm=new THREE.MeshLambertMaterial({color:0x15171d});intG=new THREE.Group();car.add(intG);
 const db=new THREE.Mesh(new THREE.BoxGeometry(w*.8,.2,.4),dm);db.position.set(0,cur.ey-.25,.85);intG.add(db);
 // Parabrisas visto desde dentro: montantes, borde del techo y cristal donde caen las gotas de lluvia (weather.js)
 {const ey=cur.ey,L=Math.hypot(.4,.47),ang=-Math.atan2(.4,.47),y=ey+.065,z=.42,pm=new THREE.MeshLambertMaterial({color:0x1b1d22});
  WSH=new THREE.Mesh(new THREE.PlaneGeometry(w*.9,L),WSM);WSH.position.set(0,y,z);WSH.rotation.x=ang;WSH.renderOrder=3;WSH.visible=false;intG.add(WSH);
  for(const s of[-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(.08,L+.04,.08),pm);p.position.set(s*w*.46,y,z);p.rotation.x=ang;intG.add(p)}
  const hd=new THREE.Mesh(new THREE.BoxGeometry(w*.96,.1,.14),pm);hd.position.set(0,ey+.31,.2);intG.add(hd)}
 const wgp=new THREE.Group();wgp.position.set(-w*.2,cur.ey-.2,.6);wgp.rotation.x=-.9;whl=new THREE.Mesh(new THREE.TorusGeometry(.17,.02,6,16),dm);wgp.add(whl);intG.add(wgp);intG.visible=false;
 car.add(blob(w,l));sc.add(car);if(typeof applyDecals==="function")applyDecals();car.position.set(px,bodyY,pz);car.rotation.set(pitch,h,roll)}
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
