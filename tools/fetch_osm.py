"""Descarga de OpenStreetMap (Overpass API) la zona del mapa y la guarda en data/raw/.
Uso: python -I tools/fetch_osm.py <nombre> <lat> <lon> <medio_lado_m>
Ejemplo: python -I tools/fetch_osm.py tokyo-tower 35.65858 139.74543 1200
"""
import json, math, sys, urllib.parse, urllib.request, pathlib

name, lat, lon, half = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4])
dlat = half / 110540
dlon = half / (111320 * math.cos(math.radians(lat)))
bb = f"{lat-dlat:.6f},{lon-dlon:.6f},{lat+dlat:.6f},{lon+dlon:.6f}"
q = f"""[out:json][timeout:240];
(
 way["highway"~"^(trunk|primary|secondary|tertiary|unclassified|residential)(_link)?$"]({bb});
 way["building"]({bb}); relation["building"]({bb});
 way["leisure"~"^(park|garden|pitch)$"]({bb}); relation["leisure"~"^(park|garden)$"]({bb});
 way["landuse"~"^(grass|forest|cemetery)$"]({bb}); way["natural"~"^(wood|scrub|water)$"]({bb}); relation["natural"="water"]({bb});
 way["waterway"~"^(river|canal)$"]({bb});
 way["railway"~"^(rail|light_rail|subway)$"]({bb});
 node["natural"="tree"]({bb}); node["highway"="traffic_signals"]({bb});
);
out geom;"""
out = pathlib.Path("data/raw"); out.mkdir(parents=True, exist_ok=True)
# Servidores públicos de Overpass; si uno falla se prueba el siguiente
for url in ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter",
            "https://maps.mail.ru/osm/tools/overpass/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]:
    try:
        req = urllib.request.Request(url, data=urllib.parse.urlencode({"data": q}).encode(), headers={"User-Agent": "tokyo-drive-game/1.0"})
        raw = urllib.request.urlopen(req, timeout=300).read()
        print("servidor:", url)
        break
    except Exception as e:
        print("falla", url, "->", str(e)[:120])
else:
    sys.exit("Ningún servidor de Overpass respondió")
d = json.loads(raw)
d["meta"] = {"name": name, "lat": lat, "lon": lon, "half": half}
(out / f"{name}.json").write_text(json.dumps(d), encoding="utf-8")
kinds = {}
for e in d["elements"]:
    kinds[e["type"]] = kinds.get(e["type"], 0) + 1
print(f"{len(raw)/1e6:.1f} MB", kinds)
