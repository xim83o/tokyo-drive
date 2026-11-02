// Coches: datos y construcción del modelo
// vm: velocidad máxima (m/s) · ac: empuje a 0 km/h (m/s²) · gr: agarre lateral · dr: tendencia a derrapar · m: masa (kg)
// Curva de aceleración ac·(1-(v/vm)²) → 0-100 km/h: Kei 7,0 s · Drift 4,8 s · GT 4,0 s · Hypercar 2,6 s
// rl: régimen máximo del motor (rpm), cambia el tono del sonido
const CARS=[{n:"Kei Sport",c:0xf5b800,vm:44.4,ac:4.7,gr:8.5,dr:.6,w:1.7,l:3.6,m:850,rl:8500},{n:"Coupé GT",c:0xe5173f,vm:75,ac:7.3,gr:7.5,dr:1,w:1.9,l:4.4,m:1450,rl:7000},{n:"Hypercar",c:0x2a6cff,vm:97.2,ac:11,gr:6.5,dr:1.2,w:2,l:4.6,m:1400,rl:8500},{n:"Drift Spec",c:0xf2f2f2,vm:66.7,ac:6.2,gr:7.5,dr:1.5,w:1.85,l:4.4,m:1300,rl:7800}];
const t100=c=>c.vm/c.ac*Math.atanh(27.78/c.vm);
let cur=CARS[0],car=null,intG=null,whl=null;
const LOOK=[
 {bh:.8,ch:.75,cl:.62,cz:-.04,cw:.92,wg:0,rc:0xcccccc,ey:1.5,rr:.32},
 {bh:.5,ch:.42,cl:.42,cz:-.08,cw:.86,wg:1,rc:0xd8d8d8,ey:1.2,rr:.36},
 {bh:.42,ch:.36,cl:.36,cz:-.02,cw:.78,wg:2,rc:0x222222,ey:1.05,rr:.37},
 {bh:.52,ch:.44,cl:.4,cz:-.1,cw:.84,wg:3,rc:0xe6b800,ey:1.15,rr:.36}];
function buildCar(k){cur=CARS[k];const o=LOOK[k];cur.ey=o.ey;if(car)sc.remove(car);car=new THREE.Group();
 const {w,l}=cur,y0=.26,bt=y0+o.bh,G=0x15222f,cc=cur.c,
 bx=(a,b,c,col,x,y,z,em)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(a,b,c),new THREE.MeshLambertMaterial({color:col,emissive:em||0}));m.position.set(x,y,z);car.add(m);return m};
 bx(w,o.bh,l,cc,0,y0+o.bh/2,0);
 const cw=w*o.cw,cl=l*o.cl,cz=o.cz*l;
 bx(cw,o.ch,cl,G,0,bt+o.ch/2,cz);bx(cw*.98,.05,cl*.85,cc,0,bt+o.ch+.02,cz);
 bx(cw,o.ch*1.1,.07,G,0,bt+o.ch/2,cz+cl/2).rotation.x=-.6;bx(cw,o.ch*1.1,.07,G,0,bt+o.ch/2,cz-cl/2).rotation.x=.6;
 for(const sx of[-1,1])bx(w*.2,.1,.06,0xfff4c0,sx*w*.32,y0+o.bh*.7,l/2,0xffeeaa);
 if(k)bx(w*.8,.1,.05,0xff2020,0,y0+o.bh*.7,-l/2,0xaa0000);else for(const sx of[-1,1])bx(.25,.15,.05,0xff2020,sx*w*.35,y0+o.bh*.7,-l/2,0xaa0000);
 if(o.wg==1)bx(w*.8,.04,.25,cc,0,bt+.03,-l*.44);
 if(o.wg>=2){const wy=bt+(o.wg==3?.75:.55),ww=w*(o.wg==3?1.05:.95);bx(ww,.06,o.wg==3?.5:.4,o.wg==3?0x111111:cc,0,wy,-l*.44);for(const sx of[-1,1])bx(.05,wy-bt,.1,0x111111,sx*ww*.35,(wy+bt)/2,-l*.44)}
 if(k==2){bx(w*1.02,.04,.35,0x111111,0,.2,l/2+.1);bx(w*.8,.12,.3,0x111111,0,.28,-l/2)}
 if(k==3){for(const sx of[-1,1])for(const sz of[-1,1])bx(.2,.3,1.1,cc,sx*(w/2+.06),y0+.3,sz*l*.32);bx(w*.55,.012,l*.26,0x111111,0,bt+.012,l*.28)}
 for(const sx of[-1,1])for(const sz of[-1,1]){const g=new THREE.CylinderGeometry(o.rr,o.rr,.32,14);g.rotateZ(PI/2);const t=new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:0x111111}));t.position.set(sx*w/2,o.rr,sz*l*.32);car.add(t);
  const g2=new THREE.CylinderGeometry(o.rr*.62,o.rr*.62,.34,10);g2.rotateZ(PI/2);const r=new THREE.Mesh(g2,new THREE.MeshLambertMaterial({color:o.rc}));r.position.copy(t.position);car.add(r)}
 const dm=new THREE.MeshLambertMaterial({color:0x15171d});intG=new THREE.Group();car.add(intG);
 const db=new THREE.Mesh(new THREE.BoxGeometry(w*.8,.2,.4),dm);db.position.set(0,o.ey-.25,.85);intG.add(db);
 const wgp=new THREE.Group();wgp.position.set(-w*.2,o.ey-.2,.6);wgp.rotation.x=-.9;whl=new THREE.Mesh(new THREE.TorusGeometry(.17,.02,6,16),dm);wgp.add(whl);intG.add(wgp);intG.visible=false;sc.add(car)}
buildCar(0);
