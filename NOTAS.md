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

## Pendiente / ideas
- Autopista Shuto elevada.
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
