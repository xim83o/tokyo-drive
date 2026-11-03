// Marchas, velocímetro y minimapa
function gearCalc(dt){const vf=vx*Math.sin(h)+vz*Math.cos(h),r=Math.min(1,Math.abs(vf)/cur.vm),T=[0,.14,.28,.45,.62,.8,1.01];let g=0;for(let k=1;k<6;k++)if(r>=T[k])g=k;
 const lo=T[g],hi=Math.min(1,T[g+1]),tr=.25+.7*(r-lo)/(hi-lo)+thrL*.05;
 rpmD+=(Math.min(1,tr)-rpmD)*Math.min(1,dt*12);gearL=vf<-.5?"R":(Math.abs(vf)<.5&&!thrL?"N":String(g+1))}
const hc=$("hud").getContext("2d");
const SPDH={n:$("spdN"),u:$("spdU"),g:$("spdG"),b:$("spdB").firstChild,last:""};
function hud(kmh,gl,rpm){const U=ENV.units==="mph"?.6214:1;kmh=Math.round(kmh*U);
 // Móvil: barra fina arriba (solo se toca el DOM cuando cambia algo)
 if(MOBILE){const k=kmh+gl+(rpm*20|0)+U;if(k!==SPDH.last){SPDH.last=k;SPDH.n.textContent=kmh;SPDH.u.textContent=U<1?"mph":"km/h";SPDH.g.textContent=gl;SPDH.b.style.width=Math.min(100,kmh/(cur.vm*3.6*U)*100)+"%";SPDH.b.style.background=rpm>.88?"#ff2d2d":"#3ab0ff"}return}
 const mx=Math.ceil(cur.vm*3.6*U*1.05/20)*20,a0=.75*PI,sw=1.5*PI,cx=120,cy=120;
 hc.clearRect(0,0,240,240);hc.fillStyle="rgba(10,11,16,.8)";hc.beginPath();hc.arc(cx,cy,114,0,7);hc.fill();
 hc.strokeStyle="rgba(255,255,255,.3)";hc.lineWidth=2;hc.beginPath();hc.arc(cx,cy,112,0,7);hc.stroke();
 hc.lineWidth=6;hc.strokeStyle=rpm>.88?"#ff2d2d":"#3ab0ff";hc.beginPath();hc.arc(cx,cy,58,a0,a0+sw*rpm);hc.stroke();
 hc.fillStyle="#fff";hc.strokeStyle="#fff";hc.textAlign="center";hc.textBaseline="middle";hc.font="11px system-ui";
 for(let v=0;v<=mx;v+=10){const a=a0+sw*v/mx,big=v%20==0,r1=big?92:98;hc.lineWidth=big?2.5:1.2;hc.beginPath();hc.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);hc.lineTo(cx+Math.cos(a)*105,cy+Math.sin(a)*105);hc.stroke();
  if(v%40==0)hc.fillText(v,cx+Math.cos(a)*77,cy+Math.sin(a)*77)}
 const a=a0+sw*Math.min(1,kmh/mx);hc.strokeStyle="#ff2d2d";hc.lineWidth=3;hc.beginPath();hc.moveTo(cx-Math.cos(a)*14,cy-Math.sin(a)*14);hc.lineTo(cx+Math.cos(a)*100,cy+Math.sin(a)*100);hc.stroke();
 hc.fillStyle="#222";hc.beginPath();hc.arc(cx,cy,8,0,7);hc.fill();
 hc.fillStyle="#fff";hc.font="italic 800 30px system-ui";hc.fillText(kmh,cx,cy+42);hc.font="10px system-ui";hc.fillText(U<1?"mph":"km/h",cx,cy+62);
 hc.fillStyle="#ff2d2d";hc.font="800 22px system-ui";hc.fillText(gl,cx,cy+84)}
const mc=$("mini").getContext("2d");
// Minimapa: fondo con edificios y parques, calles dibujadas encima en claro con borde, tráfico y torre
// Zoom del minimapa: botones + y −, o la rueda del ratón encima
let MZ=1.15;function miniZoom(d){MZ=Math.max(.35,Math.min(3.2,MZ*(d>0?1.4:1/1.4)))}
$("mini").addEventListener("wheel",e=>{e.preventDefault();miniZoom(-Math.sign(e.deltaY))},{passive:false});
function mini(){const s=MZ,c=95;mc.setTransform(1,0,0,1,0,0);mc.clearRect(0,0,190,190);mc.save();mc.beginPath();mc.arc(c,c,c,0,7);mc.clip();mc.fillStyle="#1c1f26";mc.fillRect(0,0,190,190);
 const a=-s*Math.cos(h),b=-s*Math.sin(h),cc=s*Math.sin(h),d=a;
 mc.setTransform(a,b,cc,d,c-(a*px+cc*pz),c-(b*px+d*pz));
 if(mapImg){mc.globalAlpha=.85;mc.drawImage(mapImg,0,0);mc.globalAlpha=1}
 if(ready){const seen=new Set(),R=Math.min(14,Math.ceil(5*1.15/MZ));mc.lineCap="round";for(let i=-R;i<=R;i++)for(let j=-R;j<=R;j++)for(const k of gq(px+i*HC,pz+j*HC).r)seen.add(k);
  for(const pass of[0,1]){mc.strokeStyle=pass?"#e4e8ef":"#0b0c10";for(const k of seen){const o=k*6;mc.lineWidth=RSG[o+4]*2+(pass?0:2.5);mc.beginPath();mc.moveTo(RSG[o],RSG[o+1]);mc.lineTo(RSG[o+2],RSG[o+3]);mc.stroke()}}
  mc.fillStyle="#ffb000";const nr=110*1.15/MZ;for(const n of NPC)if(n.g.visible&&Math.abs(n.x-px)<nr&&Math.abs(n.z-pz)<nr){mc.beginPath();mc.arc(n.x,n.z,2.2,0,7);mc.fill()}}
 mc.restore();mc.setTransform(1,0,0,1,0,0);
 // Concesionario: icono en su sitio o, si está lejos, en el borde del minimapa señalando hacia dónde está
 if(DEALER){const dx=DEALER.bx-px,dz=DEALER.bz-pz;let x=a*dx+cc*dz,y=b*dx+d*dz;const r=Math.hypot(x,y);if(r>76){x*=76/r;y*=76/r}
  mc.fillStyle="#29d3ff";mc.strokeStyle="#fff";mc.lineWidth=3;mc.beginPath();mc.arc(c+x,c+y,13,0,7);mc.fill();mc.stroke();mc.font="15px system-ui";mc.textAlign="center";mc.textBaseline="middle";mc.fillText("🎨",c+x,c+y+1)}carIcon(mc,c,c,0,1)}
// Cochecito visto desde arriba (del color de tu coche, borde blanco y sombra) que marca dónde estás. ang 0 = mirando hacia arriba
function carIcon(g,x,y,ang,s){const col="#"+new THREE.Color(typeof carPaint==="function"?carPaint(carK):cur.c).getHexString();g.save();g.translate(x,y);g.rotate(ang);g.scale(s,s);
 g.shadowColor="rgba(0,0,0,.7)";g.shadowBlur=6;g.fillStyle="#fff";g.beginPath();g.roundRect?g.roundRect(-8,-14,16,28,5):g.rect(-8,-14,16,28);g.fill();g.shadowBlur=0;
 g.fillStyle="#111";for(const[wx,wy]of[[-8.5,-8],[5.5,-8],[-8.5,5],[5.5,5]])g.fillRect(wx,wy,3,5);
 g.fillStyle=col;g.beginPath();g.roundRect?g.roundRect(-6.5,-12.5,13,25,4):g.rect(-6.5,-12.5,13,25);g.fill();
 g.fillStyle="#1d2733";g.fillRect(-5,-6,10,4);g.fillRect(-4.5,5,9,3);g.fillStyle="#fff6c8";g.fillRect(-5.5,-12.5,3,2);g.fillRect(2.5,-12.5,3,2);g.restore()}
