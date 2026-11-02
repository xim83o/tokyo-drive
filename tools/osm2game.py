"""Convierte data/raw/<nombre>.json (Overpass) en data/<nombre>.json compacto para el juego.
Uso: python -I tools/osm2game.py <nombre>
Coordenadas en decímetros (enteros). x = este, z = sur; el centro de la zona queda en (H, H).
"""
import json, math, sys, re, zlib, pathlib

name = sys.argv[1]
d = json.loads(pathlib.Path(f"data/raw/{name}.json").read_text(encoding="utf-8"))
m = d["meta"]; LAT, LON, H = m["lat"], m["lon"], m["half"]; W = 2 * H
KX, KY = 111320 * math.cos(math.radians(LAT)), 110540
TOWER_ID = 4247312  # relación "Tokyo Tower" de OSM: en realidad es la planta de FootTown, el edificio bajo la torre (k=2)

def xy(g): return ((g["lon"] - LON) * KX + H, -(g["lat"] - LAT) * KY + H)
def inside(p, mg=0): return -mg <= p[0] <= W + mg and -mg <= p[1] <= W + mg
def dm(pts): return [int(round(v * 10)) for p in pts for v in p]
def num(s):
    if s is None: return None
    r = re.match(r"\s*([\d.]+)", str(s)); return float(r.group(1)) if r else None
def seed(i): return (zlib.crc32(str(i).encode()) % 10000) / 10000

def simplify(pts, tol):
    """Douglas-Peucker para quitar vértices casi alineados."""
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]; dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy) or 1e-9
    i, dmax = 0, 0
    for k in range(1, len(pts) - 1):
        p = pts[k]; dd = abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / L
        if dd > dmax: i, dmax = k, dd
    if dmax <= tol: return [a, b]
    return simplify(pts[:i + 1], tol)[:-1] + simplify(pts[i:], tol)

def area(r): return abs(sum(r[i][0] * r[i - 1][1] - r[i - 1][0] * r[i][1] for i in range(len(r)))) / 2

def ring_clean(r, tol=.25):
    if len(r) > 1 and r[0] == r[-1]: r = r[:-1]
    if len(r) < 3: return None
    # Anillo cerrado: se parte por el vértice más lejano al primero y se simplifica cada mitad
    k = max(range(len(r)), key=lambda i: math.dist(r[0], r[i]))
    s = simplify(r[:k + 1], tol)[:-1] + simplify(r[k:] + [r[0]], tol)[:-1]
    return s if len(s) >= 3 and area(s) > 1 else None

def stitch(ways):
    """Une los tramos 'outer' de una relación en anillos cerrados."""
    segs = [w[:] for w in ways if len(w) > 1]; rings = []
    while segs:
        cur = segs.pop(0)
        while cur[0] != cur[-1]:
            for k, s in enumerate(segs):
                if s[0] == cur[-1]: cur += s[1:]
                elif s[-1] == cur[-1]: cur += s[::-1][1:]
                elif s[-1] == cur[0]: cur = s + cur[1:]
                elif s[0] == cur[0]: cur = s[::-1] + cur[1:]
                else: continue
                segs.pop(k); break
            else: break
        if cur[0] == cur[-1]: rings.append(cur)
    return rings

def polys(e):
    """Anillos exteriores de un way cerrado o de una relación multipolígono, en metros."""
    if e["type"] == "way":
        g = [xy(p) for p in e.get("geometry", [])]
        return [g] if len(g) > 3 and g[0] == g[-1] else []
    outs = [[xy(p) for p in mb.get("geometry", [])] for mb in e.get("members", []) if mb.get("role") == "outer" and mb.get("geometry")]
    return stitch(outs)

def runs(pts, ids):
    """Trocea una polilínea quedándose con los tramos dentro del mapa."""
    out, cp, ci = [], [], []
    for p, i in zip(pts, ids):
        if inside(p, 2): cp.append(p); ci.append(i)
        else:
            if len(cp) > 1: out.append((cp, ci))
            cp, ci = [], []
    if len(cp) > 1: out.append((cp, ci))
    return out

def length(pts): return sum(math.dist(pts[i], pts[i - 1]) for i in range(1, len(pts)))

RT = {"trunk": 0, "primary": 1, "secondary": 2, "tertiary": 3, "unclassified": 4, "residential": 4}
RW = [20, 14, 11, 8, 6]  # ancho por defecto (m) de cada tipo (4 = calles pequeñas)
COLS = {"red": 0xb5463a, "white": 0xe8e6e0, "grey": 0x8a8d93, "gray": 0x8a8d93, "brown": 0x7a5a44, "black": 0x2a2a2e, "beige": 0xd8c9a8, "yellow": 0xd9c26a, "blue": 0x5a7aa8, "green": 0x5d8a5a}
def col(s):
    if not s: return None
    s = s.strip().lower()
    if s.startswith("#") and len(s) in (4, 7):
        s = s[1:]; s = "".join(c * 2 for c in s) if len(s) == 3 else s
        try: return int(s, 16)
        except ValueError: return None
    return COLS.get(s)

out = {"name": name, "W": W, "lat": LAT, "lon": LON, "roads": [], "signals": [], "buildings": [], "green": [], "water": [], "rivers": [], "rails": [], "trees": []}
nid = {}
def node_ix(i): return nid.setdefault(i, len(nid))

for e in d["elements"]:
    t = e.get("tags", {})
    if e["type"] == "node":
        p = (e["lon"], e["lat"]); q = xy(e)
        if not inside(q): continue
        if t.get("natural") == "tree": out["trees"] += dm([q])
        elif t.get("highway") == "traffic_signals": out["signals"] += dm([q])
        continue
    hw = t.get("highway", "")
    if hw:
        base = hw.replace("_link", "")
        if base not in RT or t.get("area") == "yes": continue
        pts = [xy(g) for g in e.get("geometry", [])]
        if t.get("tunnel") in ("yes", "building_passage") and length(pts) > 120: continue
        ow = 1 if t.get("oneway") in ("yes", "1", "true") or t.get("junction") == "roundabout" else -1 if t.get("oneway") == "-1" else 0
        ids = e.get("nodes", [])
        if ow == -1: pts, ids, ow = pts[::-1], ids[::-1], 1
        lanes = num(t.get("lanes")); w = num(t.get("width"))
        if not w: w = lanes * 3.3 + (0 if ow else 1) if lanes else RW[RT[base]] * (.6 if ow else 1)
        if hw.endswith("_link"): w = min(w, 8)
        if RT[base] == 4: w = min(w, 7.5)
        for rp, ri in runs(pts, ids):
            out["roads"].append({"t": RT[base], "w": round(max(5.5, min(w, 30)), 1), "o": ow, "s": int(num(t.get("maxspeed")) or 0),
                                 "p": dm(rp), "n": [node_ix(i) for i in ri]})
        continue
    if "building" in t:
        if t["building"] in ("roof", "construction"): continue
        temple = t["building"] in ("temple", "shrine") or t.get("amenity") == "place_of_worship"
        gate = t.get("historic") == "city_gate" or t["building"] == "gate"
        for r in polys(e):
            r = ring_clean(r)
            if not r or area(r) < 12 or not any(inside(p) for p in r): continue
            a = area(r); s = seed(e["id"])
            h = num(t.get("height")) or (num(t.get("building:levels")) or 0) * 3.2
            if not h:  # sin datos: altura inventada según el tamaño, siempre igual para el mismo edificio
                h = (10 + 4 * s) if temple else (5 + s * 6) if a < 80 else (9 + s * 18) if a < 400 else (14 + s * 30) if a < 1500 else (20 + s * 45)
            b = {"h": round(max(3, h), 1), "p": dm(r)}
            if temple: b["k"] = 1
            if gate: b["k"] = 3
            if e["id"] == TOWER_ID: b["k"] = 2; b["h"] = 18
            c = col(t.get("building:colour")); rc = col(t.get("roof:colour"))
            if c is not None: b["c"] = c
            if rc is not None: b["r"] = rc
            out["buildings"].append(b)
        continue
    g = None
    if t.get("leisure") in ("park", "garden"): g = 0
    elif t.get("leisure") == "pitch": g = 2
    elif t.get("landuse") in ("grass", "cemetery"): g = 0
    elif t.get("landuse") == "forest" or t.get("natural") in ("wood", "scrub"): g = 1
    if g is not None:
        for r in polys(e):
            r = ring_clean(r, .5)
            if r and any(inside(p) for p in r): out["green"].append({"k": g, "p": dm(r)})
        continue
    if t.get("natural") == "water":
        for r in polys(e):
            r = ring_clean(r, .5)
            if r and any(inside(p) for p in r): out["water"].append(dm(r))
        continue
    if t.get("waterway") in ("river", "canal") and t.get("tunnel") not in ("yes", "culvert"):
        pts = [xy(g) for g in e.get("geometry", [])]
        w = num(t.get("width")) or (14 if t["waterway"] == "river" else 10)
        for rp, _ in runs(pts, range(len(pts))): out["rivers"].append({"w": w, "p": dm(simplify(rp, .5))})
        continue
    if t.get("railway") in ("rail", "light_rail") and t.get("tunnel") != "yes" and num(t.get("layer") or 0) >= 0:
        pts = [xy(g) for g in e.get("geometry", [])]
        el = 1 if t.get("bridge") in ("yes", "viaduct") or num(t.get("layer") or 0) > 0 else 0
        for rp, _ in runs(pts, range(len(pts))): out["rails"].append({"b": el, "p": dm(simplify(rp, .3))})

pathlib.Path("data").mkdir(exist_ok=True)
txt = json.dumps(out, separators=(",", ":"))
pathlib.Path(f"data/{name}.json").write_text(txt, encoding="utf-8")
print(f"{len(txt)/1e6:.2f} MB", {k: len(v) for k, v in out.items() if isinstance(v, list)}, "nodos", len(nid))
