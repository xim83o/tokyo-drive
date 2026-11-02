"""Servidor local del juego sin caché (así el navegador siempre carga la última versión de los archivos).
Uso: python -I tools/serve.py [puerto]   (desde la carpeta del juego)
"""
import http.server, sys, functools, os

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
http.server.ThreadingHTTPServer(("", port), functools.partial(NoCache, directory=root)).serve_forever()
