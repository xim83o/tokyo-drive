# Tokyo Drive: notas del proyecto

## Cómo jugar
- PC: doble clic en `jugar.bat` (servidor local sin caché en http://localhost:8765). Abrir index.html directamente NO carga el mapa.
- Móvil/otro PC: enlace privado https://claude.ai/artifact/LnykPvsjA66oDMNeo9y586 (se actualiza con cada versión publicada).
- `?movil` al final de la dirección fuerza el modo móvil en el PC.
- Repositorio privado: https://github.com/xim83o/tokyo-drive (Git = MinGit portable y GitHub CLI en %LOCALAPPDATA%\Programs; el instalador normal de Git falla en este PC con runtime error 217).

## Estructura
- `index.html`, `css/style.css`, `data/tokyo-tower.json` (mapa), `sounds/engine/loop0-5.wav` (motor, CC0 de domasx2 en OpenGameArt).
- `js/`: core (escena, estado) · world (consultas de colisión/superficie, suelo, calzada, bordillos, agua, vías) · env (hora, cielo, sol/sombras, luces nocturnas, menú de calidad) · buildings (fachadas, tiendas, letreros, LED, tejados, templos) · tower (Torre de Tokio) · props (árboles, farolas, máquinas expendedoras, postes eléctricos, señales) · cars · ui (menús) · input · touch · physics (coche, colisión, suspensión) · effects · audio · traffic (grafo, NPC, semáforos, marcas viales) · hud · main (bucle, cámaras).
- `tools/`: fetch_osm.py y osm2game.py (descargar/convertir mapas), serve.py (servidor sin caché).
- Añadir otra zona: `python -I tools/fetch_osm.py <nombre> <lat> <lon> <medio_lado_m>` + `python -I tools/osm2game.py <nombre>` y cambiar MAPNAME en js/world.js. (overpass-api.de tiene el certificado caducado; el script usa espejos.)

## Hecho
- Ciudad: mapa real de 2,4 × 2,4 km centrado en la Torre de Tokio. Calles principales, secundarias y pequeñas (residential/unclassified con poco tráfico). Aceras a +15 cm con bordillo (también en curvas y finales de calle) y suspensión. Colisión exacta con edificios, agua, vías y postes.
- Edificios: 4 tipos de fachada (oficinas, pisos con balcones, antiguos, cristal), tiendas en planta baja junto a las calles, pretiles, aire acondicionado/depósitos/antenas en tejados, letreros verticales en japonés, pantallas LED animadas con anuncios inventados. Templos con tejado a cuatro aguas (Daiden de Zojoji) y puerta Sangedatsumon de dos pisos. FootTown bajo la torre.
- Torre de Tokio propia, girada como en la realidad (alineada con FootTown), patas fuera de la calzada, iluminada en naranja de noche.
- Ambiente: menú de coches → Hora (Tokio real / Día y noche / Siempre de día / Siempre de noche), duración del día (5-60 min, por defecto 15), Calidad (Auto, Baja, Media, Alta, Ultra: resolución, sombras, distancia de visión, detalles). Se recuerda en el navegador.
- Noche: ventanas encendidas al azar (no todas), farolas con charco de luz, letreros y LED brillantes, faros del jugador (foco) y de los NPC, estrellas.
- Marcas viales: línea central (amarilla en las grandes, blanca o discontinua en las medianas), carriles, bordes, líneas de detención y pasos de cebra en los cruces con semáforo.
- Sonido del motor con 6 grabaciones reales mezcladas según las rpm (tono distinto por coche); si no cargan, se genera por código.
- Tráfico: grafo real con carriles por la izquierda, semáforos de OSM agrupados por cruce, ceder el paso, choques según velocidad/masa con agarre, reincorporación suave al carril tras un choque medio, siniestros que desaparecen tras 20 s sin verlos, claxon moderado. Corregido: NPC que desaparecían (se quitaban al estar a más de 45 m del cruce).
- Cámara: ya no atraviesa paredes (cinemáticas y cámaras traseras). Minimapa con calles claras dibujadas encima y tráfico.
- Velocidades: Kei 160 km/h (0-100 6,9 s) · Drift 240 (4,8) · GT 270 (4,0) · Hypercar 350 (2,6).
- Móvil: joystick, pedales, botones, aviso de girar, calidad automática Baja.

## Trabajo nocturno en curso (2026-11-03) — marcar [x] al terminar cada punto
Pedido por el usuario (todo con permiso ya dado; descargas permitidas: partes de edificio de OSM y un sonido de lluvia CC0 < 3 MB):
- [x] 1. Carreteras: no deben verse a través de aceras/edificios (quitar el truco depthFunc Always: suelo con huecos en la calzada por marching squares), bordillos alineados con el borde real, calles que no entren en edificios (estrechar el tramo). Quitar el edificio de OSM que atraviesa la Torre de Tokio.
- [x] 2. Iluminación: quitar los círculos de las farolas; luz real (PointLights de las farolas más cercanas + mapa de luz suave en el suelo), faros del coche que iluminen la carretera sin manchas en árboles/coches, cristales que no reflejen el cielo de día por la noche, bloom + FXAA + corrección de color (postproceso de three r128 desde jsdelivr).
- [x] 3. Ventanas: interior mapping (habitaciones con profundidad), cristal con reflejo, marcos, cortinas; de noche solo algunas encendidas.
- [x] 4. Tiendas: escaparates en 3D, toldos salientes, interiores iluminados, konbinis inventados y más letreros (el usuario no vio ninguna tienda).
- [x] 5. Árboles: varias especies con copas de varios volúmenes (que no parezcan "un png pegado").
- [x] 6. Edificios con volumen: podio + torre retranqueada, cornisas, balcones en 3D (solo a <260 m), casetas en tejados. PENDIENTE: partes de edificio reales de OSM (building:part) — los servidores Overpass daban error 502 esa noche; reintentar con `python -I tools/fetch_osm.py tokyo-tower 35.65858 139.74543 1200 --parts` y luego usarlas en osm2game.py.
- [x] 7. Lluvia: aleatoria (~1 de cada 5 días de juego), tormentas con relámpagos y truenos, asfalto mojado (más oscuro y brillante, charcos con mapa especular), agua de las ruedas, -25 % de agarre, gotas en el cristal solo en la cámara interior, opción Clima en el menú. Sonido de lluvia y truenos GENERADO POR CÓDIGO: las grabaciones CC0 encontradas pesaban 3,03 MB (Ylmir, "Rain (loopable)") y 3,36 MB (rubberduck, "30 CC0 SFX loops"), por encima del límite de 3 MB del usuario; preguntarle si las quiere.
- [x] 8. Cinemáticas y cámaras: no atraviesan edificios, árboles, postes, coches ni la torre (0/300 posiciones de prueba dentro de algo).
- [x] 8b. Marcas viales solo sobre la calzada de su calle; cielo con nubes, sol, atardeceres y luna.
- [x] 9. Optimizado (árboles más ligeros, mobiliario y suelo por zonas): Baja 0,77 M triángulos / ~8 ms; Alta 2,5 M / ~13 ms en el PC del usuario (panel pequeño). Publicado y subido.

## Tanda 2026-11-03 (mañana) — orden acordado con el usuario
- [x] Errores: FootTown encajado entre las patas (56×56 m, 13 m), sombra de contacto bajo los coches, huecos de acera tapados (capa de asfalto + groundD), objetos solo sobre acera, haz de faros en el suelo (beamMat), NPC que siguen recto y salen por el borde, sin cámara satélite. Torre comprobada con capturas.
- [x] Ajustes (js/settings.js, Esc/⚙️; también en móvil salvo Teclas): gráficos (calidad, sombras, distancia, resplandor), hora y clima, volumen por canal (BUS en audio.js), tráfico, teclas (solo PC), km/h-mph, HUD. Zoom en minimapa (+/− y rueda) y mapa grande (rueda, pellizco, arrastrar); torre, Zojoji, FootTown y parques con nombre.
- [x] Gráficos: parabrisas con gotas y limpiaparabrisas, LED con halo nocturno, ventanas hundidas (shader), interiores de tiendas (estanterías, mostrador) y konbinis (pasillos, neveras) — arreglado que Lambert no recibía cameraPosition (uCamP), 3 juegos de tiendas con letrero/noren, toldos bajo el letrero, hasta 70 konbinis, pilares/franjas/aires/escaleras/terrazas (DET, solo de cerca), tejados a dos aguas en casas bajas, 32 yatai con farolillos, árboles con ramas y racimos de hojas en Alta/Ultra (treeGeoHi).
- [x] Coches: Car Kit 3.1 de Kenney (CC0, kenney.nl, zip 4,8 MB) elegido por el usuario. En models/cars: 12 modelos glb + Textures/colormap.png + License-Kenney.txt. Kei = hatchback-sports, GT y Drift = sedan-sports, Hypercar = race-future; tráfico con sedán, SUV, taxi, furgoneta, reparto, camión, policía y ambulancia. Pintura cambiando la casilla de la paleta (paintTex), ruedas que giran y giran al volante.
- [x] Calcomanías (js/livery.js, botón 🎨 en el menú de coches): 7 packs, color, llantas, tintado, franjas (central, doble, lateral, diagonal), dorsal con número, 12 pegatinas propias dibujadas por código (estilo anime incluido) colocables por lado, posición, altura, tamaño y giro. Proyectadas con DecalGeometry. Guardado en localStorage td-liv.
- [ ] Pendiente de preguntar: imágenes anime de licencia libre descargadas (permiso por cada una); modelos de coche más realistas si el usuario los baja de Sketchfab.
- [x] Móvil: joystick delante = acelerar, atrás = frenar y marcha atrás, lados = girar; botones FRENO y FRENO MANO; velocímetro como barra fina arriba (#spd).

## Tanda 2026-11-03 (tarde)
- [x] Calcomanías: × en cada pegatina, chica morada oculta (hide), sin pack Anime, dorsal del capó legible desde delante, llantas y neumáticos por separado (wheelMat), rayas cortadas en los cristales, focos de estudio, subir imágenes propias (td-stk).
- [x] Marcas de derrape continuas (effects.js), hitbox de NPC por caja (boxHit), toldos sin meterse en edificios, bordillos sin atascos (CRB), atardecer gradual 15:30-19:00, árboles detallados solo cerca (treeLod con una malla por especie), ventanas lejanas baratas (>300 m).
- [x] Canal Furukawa (buildCanal): cauce hundido, agua animada con reflejos (de noche brillos de la ciudad), muros, barandillas, puentes cruzables (colisión solo en los bordes), autopista elevada de adorno encima.
- [x] Concesionario Tokyo Drive Motors: edificio de cristal junto a una avenida con cartel y anillo en la calle (parar encima abre el editor); fondo del editor Ciudad/Concesionario (sala 300 m bajo el mapa).
- [x] Estaciones (seasons.js): fecha real de Japón o Ajustes; sakura/pétalos, verano con calima y farolillos, otoño con hojas en el suelo, invierno con nieve acumulada (snowMat), menos agarre y luces de Navidad.
- [x] Idiomas (i18n.js): español, inglés, japonés, catalán. Textos nuevos: añadir a I18N.
- [x] Radio (radio.js): radio-browser.info, solo https, botón 📻 / ⏭ / tecla R, país, estilo y volumen en Ajustes → Sonido. Sin comprobar si el enlace del móvil permite conectarse a las emisoras.
- Guardado para más adelante: contrarrelojes y radares, modo foto, autopista Shuto conducible.

## Tanda 2026-11-04 — HECHA (commit 8c240ef y siguientes; publicada en el enlace del móvil)
- [x] 1. Calcomanías sobre el cristal: el Hypercar tomaba la casilla gris de los alerones como cristal; ahora bodyCells prefiere la casilla clara azulada (0,3) de los cristales.
- [x] 2. Cielo en Media/Baja: la esfera del cielo (900 m) quedaba más lejos que cam.far (800 m) y se cortaba; ahora se escala para caber.
- [x] 3. Calles un 20 % más anchas (r.w×1,2 al cargar, después de elegir el concesionario); se siguen estrechando si tocan un edificio.
- [x] 4. Cámara: con los coches solo choca si el punto cae dentro de su caja real (antes círculo de 2,5 m).
- [x] 5. Árboles "sin textura": eran los sencillos (colores lisos), que salen en Baja/Media y a más de 260 m. Ahora llevan moteado de hojas en el shader y en Media los de menos de 140 m son detallados.
- [x] 6. Torre: las piezas de las caras por debajo de los arcos se quitan (se pasa entre las patas, junto a FootTown); choque con cápsulas en las patas; la cámara solo choca con las patas por debajo de 14 m.
- [x] 7. Primera persona: interior sencillo (salpicadero, cuadro, volante con radios, puertas, montantes, techo y capó del color del coche) y la carrocería de fuera oculta en esa cámara.
- [x] 8. Dorsal: botones Izquierda/Derecha/Capó/Techo/Detrás (varios a la vez, LIV.np) y tamaño (LIV.ns).
- [x] 9. Estanques sin asfalto (la capa de asfalto de debajo se salta MAP.water en trozos de 4 m). El "Parque" del borde derecho tiene un estanque que en OSM sigue fuera del mapa: dentro del mapa ya se ve el agua.
- [x] 10. Se quitan los edificios que pisan los carriles (eje y franja de cada sentido con el ancho de un coche): ~580 casas. Quedan 2 casas pequeñas y 2 piezas de templo junto a callejones (casos raros en curvas).
- [x] 11. Tejado a dos aguas solo si la planta es un rectángulo de verdad (todos los vértices en el borde de su caja).
- [x] 12. Mapa grande: cuadradito azul con la T en cada final sin salida (aparcamiento o redondel) y punto azul en cada señal de entrada; nombre al pasar el ratón.
- [x] 13. Canal: muros curvos en los recodos y uniones (ahí estaba el hueco), bordes del canal en trozos de 0,5 m, pretil en cualquier borde de calzada sobre el agua y apertura de puentes en diagonal. Prueba: 0 huecos y los 13 puentes se cruzan sin chocar.
- [x] 14. Simulador, vista de la ciudad y prueba automática: solapes en % (de las parejas de coches a menos de 8 m, cuántas se meten una en otra).

## Arreglos 2026-11-04 (tarde) — HECHOS
- [x] Capturas para Claude (solo con jugar.bat en este PC): tecla P → foto + nota + posición y ajustes; el servidor (tools/serve.py) las guarda en `capturas/` (fuera de git). Claude las lee de ahí.
- [x] Torre: arcos al derecho (TARCH: 30 m en el centro, 6 m junto a las patas); la cámara pasa por debajo de cada arco.
- [x] Dorsal: al escribir el número aparecen ya los botones de sitio (antes había que cerrar y abrir). Se ajusta solo a la chapa: proyección perpendicular a la superficie (no se estira) y el círculo más grande que cabe sin cristales, bajos ni ruedas (no sale a trozos). Sin barra de tamaño.
- [x] Puentecillo de la izquierda (494, 1558): una avenida de 17 m acababa en un puente de 9,6 m y su redondel salía sobre el agua con un pretil curvo pegado a la mitad del puente. Ahora junto al agua el redondel de cada calle no es más ancho que la calle con la que se une (roadAtW) y el final de cada tramo sobre el agua lleva pretil. Prueba: 0 huecos al agua y los puentes se cruzan sin chocar.
- Radio: en el enlace de Claude no funciona (bloquea conexiones externas); usar Netlify o jugar.bat.
- Netlify en otro PC: protección de equipo; iniciar sesión en app.netlify.com o quitar Visitor access.


## Pendiente / ideas
- Autopista Shuto elevada.
- Más coches para elegir (apuntado el 2026-11-04): ampliar la lista de coches del juego más adelante.
- Modelos 3D de coches libres (hypercar = hypercar, drift = estilo japonés…), pedir permiso por cada descarga.
- Calcomanías: packs sencillos + editor tipo Motorfest (franjas, dorsales, colores, llantas, cristales), estilo anime de licencia libre.
- Daños visibles y hitbox de caja cuando estén los coches definitivos.
- Cambio manual: de momento no.
- El usuario quiere más realismo gráfico en el futuro.

## Pendiente de revisar por el usuario
- Fluidez en PC y móvil con los gráficos nuevos (1,7 M triángulos en Alta con sombras).
- Sonido del motor real, faros, noche, letreros, LED, templo, torre, marcas viales.

## Preferencias del usuario
- Hablar en español. Primero cuenta ideas, yo pregunto TODAS las dudas de una vez (formulario tipo test con opción "Otro"), no empezar hasta su aviso ("empieza").
- Pedir permiso antes de cada descarga (nombre, web, tamaño).
- Avisar si una tarea merece más esfuerzo (recomendado "alto"; plan Pro).
- Al probar, cerrar la pestaña del navegador integrado y parar el servidor; no abrir jugar.bat sin avisar.
- Lo que no pueda probar yo, lo prueba él y manda lista de errores.
