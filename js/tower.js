// Torre de Tokio (333 m): cuatro patas en celosía con arcos, franjas naranja internacional y blanco, mirador principal (150 m),
// mirador superior (250 m) y antena. Base girada como FootTown, el edificio que tiene entre las patas. De noche se ilumina en naranja
let towerMat=null,towerDeck=null;
// Altura del hueco de cada arco según la posición u en la cara (0 y 1 en las patas, 0,5 en el centro): 30 m en el centro y 6 m junto a las patas
const TARCH=u=>6+Math.pow(Math.sin(Math.max(0,Math.min(1,u))*PI),.7)*24;
function buildTower(){const pos=[],col=[],OR=new THREE.Color(0xe8521e),WH=new THREE.Color(0xf3f1ec),c=Math.cos(TA),s=Math.sin(TA);
 const hw=y=>y<250?37*Math.exp(-y/86)+2.8:Math.max(.7,2.8*(1-(y-250)/90));
 const P=(u,y,v)=>new THREE.Vector3(TX+u*c-v*s,y,TZ+u*s+v*c);   // coordenadas locales de la torre (u,v) → mundo
 const beam=(A,B,t,cl)=>{const d=B.clone().sub(A),L=d.length();if(L<.01)return;const g=new THREE.BoxGeometry(t,L,t);g.translate(0,L/2,0);
  g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize())));g.translate(A.x,A.y,A.z);
  const q=g.toNonIndexed().attributes.position.array;for(let i=0;i<q.length;i++)pos.push(q[i]);for(let i=0;i<q.length/3;i++)col.push(cl.r,cl.g,cl.b)};
 const band=y=>Math.floor(y/333*11)%2?WH:OR,C4=[[1,1],[-1,1],[-1,-1],[1,-1]],lv=[];for(let y=0;y<=250;y+=y<60?6:y<150?8:10)lv.push(y);
 // Altura del arco de cada cara según la posición u (0 y 1 en las patas): por debajo de él la cara queda abierta para pasar entre las patas
 const arch=u=>TARCH(u);
 for(let k=1;k<lv.length;k++){const y0=lv[k-1],y1=lv[k],a=hw(y0),b=hw(y1),cl=band((y0+y1)/2),t=y0<150?1:.7;
  for(let q=0;q<4;q++){const[p1,q1]=C4[q],[p2,q2]=C4[(q+1)%4];
   // Pata (doble perfil), travesaño, cruz de San Andrés en cada cara y montante central
   beam(P(p1*a,y0,q1*a),P(p1*b,y1,q1*b),t*2.4,cl);beam(P(p1*a*.93,y0,q1*a*.93),P(p1*b*.93,y1,q1*b*.93),t*1.2,cl);
   // Piezas de la cara: por encima de los arcos enteras; por debajo de 31 m se parten en trozos y solo quedan los que están sobre el arco
   const FP=(u,y)=>P((p1+(p2-p1)*u)*hw(y),y,(q1+(q2-q1)*u)*hw(y)),face=(ua,ya,ub,yb,w)=>{if(Math.min(ya,yb)>=31){beam(FP(ua,ya),FP(ub,yb),w,cl);return}
    for(let j=0;j<12;j++){const u0=ua+(ub-ua)*j/12,u1=ua+(ub-ua)*(j+1)/12,h0=ya+(yb-ya)*j/12,h1=ya+(yb-ya)*(j+1)/12;if((h0+h1)/2>arch((u0+u1)/2)+.8)beam(FP(u0,h0),FP(u1,h1),w,cl)}};
   face(0,y1,1,y1,t*.8);face(0,y0,1,y1,t*.5);face(1,y0,0,y1,t*.5);face(.5,y0,.5,y1,t*.45)}}
 // Arcos entre las patas (30 m en el centro, bajando hasta 6 m junto a cada pata) y la primera planta técnica
 for(let q=0;q<4;q++){const[p1,q1]=C4[q],[p2,q2]=C4[(q+1)%4];for(let k=0;k<12;k++){const u0=k/12,u1=(k+1)/12,f=arch,A=u=>hw(f(u))*.98;
  beam(P((p1+(p2-p1)*u0)*A(u0),f(u0),(q1+(q2-q1)*u0)*A(u0)),P((p1+(p2-p1)*u1)*A(u1),f(u1),(q1+(q2-q1)*u1)*A(u1)),1.5,OR)}}
 const deck=(y,r,hh,n)=>{const g=new THREE.CylinderGeometry(r,r*.94,hh,n).toNonIndexed();g.rotateY(TA+PI/n);g.translate(TX,y+hh/2,TZ);const q=g.attributes.position.array;
  for(let i=0;i<q.length;i++)pos.push(q[i]);for(let i=0;i<q.length/3;i++){const yy=q[i*3+1],gl=yy>y+hh*.12&&yy<y+hh*.82;const cl=gl?new THREE.Color(0x2e3946):WH;col.push(cl.r,cl.g,cl.b)}};
 deck(140,15.5,6,8);deck(146,14.5,7,8);deck(247,7,6,8);deck(90,9.5,3,8);
 // Antena con franjas
 for(let y=253;y<333;y+=8){const cl=Math.floor((y-253)/8)%2?WH:OR,r=hw(y);beam(P(0,y,0),P(0,y+8,0),Math.max(.8,r*.9),cl)}
 towerMat=new THREE.MeshLambertMaterial({vertexColors:true,emissive:0x000000});
 const m=mkMesh(pos,towerMat,0,{color:col});m.castShadow=true;
 // Choque: cada pata es una cápsula desde su esquina exterior hasta el perfil interior (a la altura del coche las patas casi no se
 // inclinan); entre las patas, bajo los arcos, se puede pasar
 for(const[p,q]of C4){const v=P(p*hw(0),0,q*hw(0)),w=P(p*hw(0)*.92,0,q*hw(0)*.92);addCaps(v.x,v.z,w.x,w.z,1.7)}}
