# Tokyo Drive: notas del proyecto

## Cómo jugar
- Doble clic en `jugar.bat` (abre un servidor local con Python en http://localhost:8000).
- `?movil` al final de la dirección fuerza el modo móvil en el PC para probarlo.

## Estructura
- `index.html`, `css/style.css`
- `js/`: core (escena, estado), world (ciudad provisional), cars, ui (menús), input, touch (móvil), physics, effects, audio, traffic, hud, main (bucle).

## Hecho
- Todo lo de la versión B (ver historial): coches, cámaras, cinemáticas, sonido, tráfico NPC, marcas y humo.
- Código separado en archivos y limpiado (eliminados el tráfico v1 duplicado y la función de coche vieja).
- Velocidades coherentes (curva de aceleración más realista):
  Kei 160 km/h, 0-100 en 6,9 s · Drift 240, 4,8 s · GT 270, 4,0 s · Hypercar 350, 2,6 s.
- Móvil: joystick a la izquierda, gas/freno/freno de mano a la derecha, botones de cámara/mapa/coches arriba, aviso "gira el móvil" en vertical, pantalla completa al elegir coche, calidad automática (menos resolución, niebla más cercana, tráfico "Poco").

- NPC: paran con el morro en la línea (12 m del centro del cruce) y frenan progresivamente.
- Choques con NPC por impulso y masas: <20 km/h empujón, 20-60 desvío y 3 s parado, >60 sale despedido, trompea y queda siniestrado (desaparece tras 20 s sin verlo). El jugador pierde algo de velocidad y se desvía un poco, sin trompo (estilo Motorfest). Un NPC golpeado puede empujar a otros. Los que quedan atascados detrás de un siniestro dan la vuelta.
- Claxon moderado: al golpearles, al cortarles el paso o al bloquearles más de 4 s (máx. uno cada 4 s en total y cada 10 s por coche).
- Tras el test 1: NPC con más agarre (golpes pequeños absorbidos), choques fuertes más cortos, trompo que se frena con el deslizamiento, el jugador pierde más velocidad (factor 0,65), NPC fuera de las calles del borde (antes se bugueaban), muro invisible en el borde para el jugador, sonido de motor nuevo (4 cilindros, régimen máximo por coche).
- Enlace privado para jugar desde cualquier sitio: https://claude.ai/artifact/LnykPvsjA66oDMNeo9y586 (se actualiza con cada cambio).

## Pendiente (en este orden)
1. HECHO: repositorio privado https://github.com/xim83o/tokyo-drive (Git = MinGit portable y GitHub CLI en %LOCALAPPDATA%\Programs, en el PATH del usuario; el instalador normal de Git falla en este PC con runtime error 217).
2. HECHO (v1): mapa real de 2,4 × 2,4 km centrado en la Torre de Tokio (`data/tokyo-tower.json`).
   - Regenerar o añadir zonas: `python -I tools/fetch_osm.py <nombre> <lat> <lon> <medio_lado_m>` y `python -I tools/osm2game.py <nombre>`; cambiar MAPNAME en js/world.js. (overpass-api.de tiene el certificado caducado; el script usa espejos.)
   - Calles trunk/primary/secondary/tertiary (sin residential ni unclassified), aceras a +15 cm con bordillo y suspensión, colisión exacta con bordes de edificios/agua/vías/postes, edificios con planta real y ventanas (alturas inventadas si OSM no las tiene, siempre iguales), parques, agua, vías (las elevadas sobre pilares), árboles, farolas, señales de velocidad, templos (Zojoji) con tejado a cuatro aguas, Torre de Tokio propia.
   - Tráfico por el grafo real con carriles por la izquierda, semáforos de OSM agrupados por cruce (horizontales, estilo japonés), ceder el paso en cruces sin semáforo.
   - Muro invisible y niebla en el borde. Autopista Shuto elevada: más adelante.
   - Pendiente de decidir: pasos de cebra, marcas viales, noche.
3. Sonido de motor con grabaciones reales de licencia libre (pedir permiso por cada descarga).
3. Modelos 3D libres sin marcas (hypercar = hypercar, drift = estilo japonés…). Pedir permiso antes de cada descarga.
4. Calcomanías: packs sencillos por coche (ej. raya negra central) + editor tipo Motorfest (franjas, dorsales, colores, llantas, cristales), estilo anime con licencia libre. Diseño por coche y guardado.

## Pendiente de revisar al probar (usuario)
- Sensación del derrape, NPC (giros, semáforos, cruces), humo, marcas, sonido.
- Controles táctiles en un móvil real.
- Cambio manual: de momento no.

## Preferencias del usuario
- Hablar en español. Primero cuenta ideas, yo pregunto dudas, no empezar hasta su aviso.
- Lo que no pueda probar yo, lo prueba él y manda lista de errores.
