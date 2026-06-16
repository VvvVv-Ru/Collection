#!/usr/bin/env python3
"""本地开发用：在 http.server 基础上强制 no-cache，避免手机 WebView 吃旧缓存。"""
import http.server
import socketserver

PORT = 8000


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    with ReusableTCPServer(("", PORT), NoCacheHandler) as httpd:
        print(f"Serving HTTP on 0.0.0.0 port {PORT} (no-cache) ...")
        httpd.serve_forever()
