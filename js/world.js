// Ciudad generada (provisional hasta tener el mapa real)
function plane(w,col,y){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w),new THREE.MeshLambertMaterial({color:col}));m.rotation.x=-PI/2;m.position.set(W/2,y,W/2);sc.add(m)}
plane(6000,0x4d7a45,-.1);plane(W,0x2b2d34,0);
function inst(l){const m=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial(),l.length),o=new THREE.Object3D(),c=new THREE.Color();
 l.forEach((e,n)=>{o.position.set(e[0],e[1],e[2]);o.scale.set(e[3],e[4],e[5]);o.updateMatrix();m.setMatrixAt(n,o.matrix);m.setColorAt(n,c.set(e[6]))});sc.add(m)}
const park=[],L=[],col=new THREE.Color();
for(let i=0;i<=N;i++){L.push([i*C,.04,W/2,.5,.05,W,0xe8c33a],[W/2,.04,i*C,W,.05,.5,0xe8c33a])}
for(let i=0;i<N;i++)for(let j=0;j<N;j++){
 const p=(i==8&&j==8)||R()<.08;park[i*N+j]=p;
 L.push([i*C+50,.2,j*C+50,80,.4,80,p?0x3d8b4a:0x8d909a]);if(p)continue;
 const k=R()<.35?1:2,l=80/k;
 for(let a=0;a<k;a++)for(let b=0;b<k;b++){
  const w=l*(.7+R()*.25),d=l*(.7+R()*.25),x=i*C+10+l*(a+.5),z=j*C+10+l*(b+.5),
  h=10+R()*25+Math.max(0,1-Math.hypot(x-TX,z-TZ)/800)*R()*90;
  L.push([x,h/2+.4,z,w,h,d,col.setHSL(.55+R()*.1,.1+R()*.15,.35+R()*.35).getHex()])}}
inst(L);
const tw=new THREE.Mesh(new THREE.ConeGeometry(12,130,4),new THREE.MeshLambertMaterial({color:0xd9261c}));tw.position.set(TX,65,TZ);sc.add(tw);
