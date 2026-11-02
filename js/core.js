// Núcleo: utilidades, renderizador, escena, cámara, luces y estado del jugador
const $=id=>document.getElementById(id);
const N=16,C=100,W=N*C,TX=850,TZ=850,PI=Math.PI;
// ?movil en la dirección fuerza el modo móvil para probarlo en el PC
const MOBILE=matchMedia("(pointer:coarse)").matches&&("ontouchstart" in window||navigator.maxTouchPoints>0)||/[?&]movil/.test(location.search);
if(MOBILE)document.documentElement.classList.add("mobile");
let sd=7;const R=()=>(sd=sd*16807%2147483647)/2147483647;
const ad=(a,b)=>((a-b+PI)%(2*PI)+2*PI)%(2*PI)-PI;
// Calidad automática: en móvil menos resolución y distancia de visión
const rd=new THREE.WebGLRenderer({canvas:$('c'),antialias:!MOBILE});rd.setPixelRatio(Math.min(devicePixelRatio,MOBILE?1.5:2));
const sc=new THREE.Scene();sc.background=new THREE.Color(0x9ec7ee);sc.fog=new THREE.Fog(0x9ec7ee,150,MOBILE?550:900);
const cam=new THREE.PerspectiveCamera(65,1,.3,MOBILE?900:1500);
sc.add(new THREE.HemisphereLight(0xffffff,0x556677,.95));
const sun=new THREE.DirectionalLight(0xffffff,.7);sun.position.set(200,400,100);sc.add(sun);

let px=0,pz=0,h=0,vx=0,vz=0,camH=0,mode=0,yr=0,rg=6,rpmD=.25,thrL=0,gearL="N",stV=0,idle=0,keyAct=0,ca=0,state="cars",spawned=false,pend=null;
