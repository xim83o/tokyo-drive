// Núcleo: utilidades, renderizador, escena, cámara, luces y estado del jugador
const $=id=>document.getElementById(id);
const PI=Math.PI;let W=2400,TX=1200,TZ=1200;   // tamaño del mapa y posición de la Torre de Tokio (se ajustan al cargar el mapa)
// ?movil en la dirección fuerza el modo móvil para probarlo en el PC
const MOBILE=matchMedia("(pointer:coarse)").matches&&("ontouchstart" in window||navigator.maxTouchPoints>0)||/[?&]movil/.test(location.search);
if(MOBILE)document.documentElement.classList.add("mobile");
const ad=(a,b)=>((a-b+PI)%(2*PI)+2*PI)%(2*PI)-PI;
// Resolución, sombras y distancia de visión las ajusta la calidad elegida (env.js)
const rd=new THREE.WebGLRenderer({canvas:$('c'),antialias:!MOBILE,powerPreference:"high-performance"});rd.setPixelRatio(Math.min(devicePixelRatio,MOBILE?1.5:2));
const sc=new THREE.Scene();sc.background=new THREE.Color(0x9ec7ee);sc.fog=new THREE.Fog(0x9ec7ee,150,900);
const cam=new THREE.PerspectiveCamera(65,1,.3,1100);
const hemi=new THREE.HemisphereLight(0xffffff,0x556677,.9);sc.add(hemi);
const sun=new THREE.DirectionalLight(0xffffff,.7);sun.position.set(200,400,100);sc.add(sun,sun.target);

let px=0,pz=0,h=0,vx=0,vz=0,camH=0,mode=0,yr=0,rg=6,rpmD=.25,thrL=0,gearL="N",stV=0,idle=0,keyAct=0,ca=0,state="cars",spawned=false,pend=null;
