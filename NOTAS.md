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

## Capturas del 2026-11-04 (11) — HECHAS
- [x] Casas en la calle: al estrechar una calle se miraba el borde solo en 5 puntos por tramo; ahora cada 2 m, y se quitan los edificios que pisan el ancho mínimo (2,6 m a cada lado del eje).
- [x] Pasos de cebra: en las avenidas de doble calzada (dos calles de sentido único que se solapan) salían cortados; ahora pueden pisar la otra mitad paralela y se pintan también a la salida del cruce.
- [x] Pilares de las vías elevadas (no son la autopista): las ~10 vías paralelas comparten pilares, ninguno en la calzada ni a menos de 10 m de otro.
- [x] Calles sueltas (no unidas a la red): se quitan (4 trozos, entre ellos el de 70 m con aparcamiento junto al canal).
- [x] Vía elevada que acababa en el aire junto al borde: baja en rampa hasta el suelo en sus últimos 60 m.
- [x] Autopista sobre el canal: bordes a inglete en las curvas (antes salían picos en las uniones; capturas 9 y 11).
- [x] Patio del templo (Zōjō-ji, el templo grande más cercano a la torre): grava, camino de losas con farolillos de piedra y puerta roja de dos pisos en la entrada (js/places.js).
- [x] Zona de derrape disimulada en la gran explanada del este (1553, 1155): asfalto con marcas suaves de neumático, conos y neumáticos apilados, sin carteles.
- [x] Campo de béisbol en el campo de deporte rectangular (1139, 945): diamante, césped a franjas, líneas, red detrás de la meta, vallas al fondo y gradas.
- [x] Capturas: ahora guardan también hacia dónde mira la cámara (y la posición del espectador).
- Radio: en el enlace de Claude no funciona (bloquea conexiones externas); usar Netlify o jugar.bat.
- Netlify en otro PC: protección de equipo; iniciar sesión en app.netlify.com o quitar Visitor access.

## Templo y béisbol más llenos + puente de la bahía (2026-11-04, noche) — HECHO
- [x] Templo: grava gris (con tinte azulado que compensa la luz cálida), muro bajo de tejas (ocre con cinco rayas blancas) por el lado de la calle con huecos en los caminos y la puerta, pagoda de 5 pisos y campanario (cada uno con valla baja de piedra), fuente para lavarse las manos junto al camino principal, puesto de amuletos y tablillas de deseos junto al templo.
- [x] La puerta roja del templo estaba girada 90° (lo largo iba a lo largo del camino); ahora cruza el camino.
- [x] Béisbol: banquillos azules, marcador (港区グラウンド) detrás del centro, 6 torres de focos que de noche se encienden e iluminan el césped, muro con anuncios inventados y malla encima, árboles alrededor y camino de baldosas desde la calle más cercana.
- [x] Puente de la esquina de abajo a la derecha (la bahía): el agua de la bahía chocaba como un edificio también debajo del puente y la calle se estrechaba. Ahora el agua no cuenta bajo las calles, su orilla deja hueco donde entra una calle y los puentes llevan pretil a los lados.
- [x] Primera persona: quitado el limpiaparabrisas (a petición del usuario). Las gotas de lluvia siguen en el cristal y se van solas.
- [x] Megatorre Kurogane (黒鉄, empresa inventada y diseño propio, no copia de ningún juego) en la explanada del sur (1364, 1608): monolito negro escalonado de 300 m, neón rojo, ventanas encendidas de noche, 6 pantallas LED gigantes, logo y letrero vertical (js/places.js, buildMegaTower). Marcada en rojo en el mapa, con su nombre.

## Capturas del 2026-11-04 (noche, 4) — HECHAS
- [x] Rascacielos de 105 m que tapaba la torre Kurogane: trasladado al parque, a unos 125 m (world.js, al cargar).
- [x] Autopista cortada cerca de (465, 2310): el canal viene partido en los datos (hueco de 14 m); el tablero ahora sigue seguido por encima.
- [x] Autopista y vías elevadas: la autopista sube de 12 a 16 m en todo su recorrido (no solo en el cruce) y las vías llevan grava, traviesas y raíles.
- [x] Trenes decorativos en las vías elevadas: rutas de borde a borde del mapa, sale uno cada 45 s en una línea libre (4 coches) y desaparece al llegar al borde (places.js, buildTrains).
- [x] Zona de derrape: sin árboles, con circuito de neumáticos, contenedores, camión, luces portátiles, grada, coches viejos y más marcas. Sin carteles.
- [x] Conos de la zona: el coche los tira y vuelven a su sitio a los 12 s si no estás encima (conesTick).
- [x] Pilares de la autopista: ninguno atraviesa una vía elevada; se mueve un poco o ese tramo va sin pilar (onElv).
- [x] Rampas de las vías: la regla general bajaba 18 extremos; ahora solo baja el ramal del monorraíl junto al borde derecho (2383, 1185).
- [x] Menos pilares bajo las vías elevadas: uno cada 42 m por vía (antes 28) y al menos 24 m entre pilares (antes 10).
- [x] Aparcamientos sin salida: ya no se ponen encima de otra calle (había 4, con coches en mitad de la calzada).
- [x] Vías que atravesaban edificios: se quitan los edificios de más de 6 m que cruza una vía elevada (eran 4).


## Tanda 1 — HECHA (js/race.js)
- [x] Carreras (2 circuitos a 2 vueltas) y contrarreloj (3 rutas) con puntos de control, tiempos y récord guardados en el navegador. Tecla B o botón 🏁.
- [x] Coche fantasma: se elige entre tus 5 mejores tiempos de cada ruta; la tecla G lo enciende o apaga. Repetición de los últimos 20 s al acabar una carrera. Modo foto: tecla F o botón 📷.

## Tanda 2 — HECHA
- [x] Pantalla antes de la carrera: tráfico y fantasma; recuerda la última elección, se puede desactivar y el tráfico vuelve al de antes al acabar.
- [x] Coche nuevo: Kei Van (usa el modelo van del Car Kit, CC0). Garaje (js/garage.js): guarda hasta 20 combinaciones de coche, pintura y calcomanías.

- [x] Diseños completos en el editor de calcomanías (10 nuevos en PACKS): policía, taxis, carreras y anime/drift, con marcas y mascota inventadas.

## Tanda 3 — HECHA (js/highway.js)
- [x] Autopista conducible con 3 rampas de doble sentido. Para el mapa ampliado basta cambiar la lista HWY_RAMPS (punto de calle y punto del tablero, a 170 m o más). Va sin tráfico.

## Tanda 4 — HECHA
- [x] Calidad Realista (env.js, pasada REALS): sombras de contacto, reflejos en el suelo y color de cine. RTX real no existe en el navegador.
- [x] Reflejos en el asfalto mojado en calidad Alta o más. Sonidos de ambiente por código (ambAudio): viento, ciudad y trenes, con su volumen en Ajustes.

## Tanda 5 — HECHA (js/online.js, botón 🌐)
- [x] Salas con código de 5 letras, hasta 6 jugadores, con Supabase Realtime (sin cuenta, sin choques entre coches). Cada uno ve su tráfico, hora y clima.
- [x] Cuenta y partidas en la nube (calcomanías, garaje, tiempos e imágenes), con guardado automático cada minuto. Tabla en tools/supabase.sql; hay que pegarla una vez en Supabase.
- En el enlace de Claude no funciona lo en línea (bloquea conexiones externas): usar GitHub Pages o jugar.bat.

## Capturas y arreglos del 2026-11-06 — HECHOS
- [x] Rampas: entran por su lado del tablero, sin cruzarlo. Rampa sur nueva: la autopista acaba ahí (hwyCut); se quitan 5 edificios (HWY_CLEAR). Al ampliar el mapa, quitar hwyCut.
- [x] Vías: las que acaban en el borde siguen 200 m fuera del mapa. Tren a 130 km/h con modelo propio (morro, techo redondeado, bogies, ventanas).
- [x] Tráfico: en el final de calle del borde ya no sigue recto fuera de la calzada.
- [x] Nieve sin brillo (Ultra y Realista) y más contraste en Realista. Sonidos de ambiente en frecuencias que se oyen en portátil.
- [x] Desarrollador → Incidencias: teletransporte a lo que hay que revisar (devInc en dev.js).
- Registro de cuentas: en Supabase, Authentication → Users.

## Próximas tandas elegidas por el usuario (2026-11-05) — sin empezar
- Sistema de puntos, y al final repasar la interfaz: el usuario la explicará cuando acabe todo.
- Cuentas, nube y salas de multijugador: un solo servicio con plan gratuito (tipo Supabase); la cuenta la crea el usuario.
- Orden: 1) carreras, contrarreloj, fantasma, repetición y modo foto; 2) coche y garaje; 3) autopista; 4) gráficos y sonido; 5) nube y multijugador.
- Guardar partidas en la nube.
- Apuntado para más adelante: dinero o puntos para comprar coches y mejoras.

## Pendiente / ideas
- Modos de juego (apuntado el 2026-11-05): modo conducción libre (el actual) y modo carreras, para correr por las calles de Tokio.
- Autopista Shuto elevada.
- Más coches para elegir (apuntado el 2026-11-04): ampliar la lista de coches del juego más adelante.
- Mapa más grande (futuro): el ramal que ahora baja en rampa hasta el suelo junto al borde derecho (captura 6 del 2026-11-04) es en realidad una vía de tren elevada (seguramente el monorraíl hacia Haneda), no la autopista. Habrá que alargarla para que siga por el mapa nuevo. Lo mismo con la autopista conducible.
- Modelos 3D de coches libres (hypercar = hypercar, drift = estilo japonés…), pedir permiso por cada descarga.
- Calcomanías: packs sencillos + editor tipo Motorfest (franjas, dorsales, colores, llantas, cristales), estilo anime de licencia libre.
- Hitbox de caja cuando estén los coches definitivos. Daños visibles: el usuario NO los quiere.
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
