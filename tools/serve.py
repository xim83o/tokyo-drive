"""Servidor local del juego sin caché (así el navegador siempre carga la última versión de los archivos).
Uso: python -I tools/serve.py [puerto]   (desde la carpeta del juego)
También guarda las capturas del modo desarrollador (tecla P) en la carpeta "capturas", solo si vienen de este mismo PC.
"""
import http.server, sys, functools, os, json, base64, time

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_POST(self):
        # Solo /captura y solo desde este PC (el móvil por wifi no puede escribir archivos)
        if self.path != "/captura" or self.client_address[0] not in ("127.0.0.1", "::1", "::ffff:127.0.0.1"):
            self.send_error(403)
            return
        n = int(self.headers.get("Content-Length") or 0)
        if n <= 0 or n > 40_000_000:
            self.send_error(413)
            return
        try:
            d = json.loads(self.rfile.read(n))
            img = base64.b64decode(d["png"].split(",", 1)[1])
            if not img.startswith(b"\x89PNG"):
                raise ValueError("no es png")
            out = os.path.join(root, "capturas")
            os.makedirs(out, exist_ok=True)
            name = time.strftime("%Y%m%d-%H%M%S")
            with open(os.path.join(out, name + ".png"), "wb") as f:
                f.write(img)
            with open(os.path.join(out, name + ".txt"), "w", encoding="utf-8") as f:
                f.write(str(d.get("nota", ""))[:4000] + "\n\n" + json.dumps(d.get("info", {}), ensure_ascii=False, indent=1))
        except Exception as e:
            self.send_error(400, str(e)[:100])
            return
        body = json.dumps({"ok": True, "nombre": name}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
http.server.ThreadingHTTPServer(("", port), functools.partial(NoCache, directory=root)).serve_forever()
