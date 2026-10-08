# -*- coding: utf-8 -*-
"""
信用评级查询工具 · 服务端
启动后浏览器打开 http://localhost:5000 即可使用
"""

import json, os, sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from urllib.parse import unquote

PORT = 5000
HTML_DIR = os.path.dirname(os.path.abspath(__file__))

class 代理处理器(BaseHTTPRequestHandler):
    
    def do_GET(self):
        请求路径 = unquote(self.path)
        print(f"  GET {请求路径}")
        
        if 请求路径 == "/":
            请求路径 = "/信用评级查询.html"
        elif 请求路径 == "/list":
            files = [f for f in os.listdir(HTML_DIR) if f.endswith(".html")]
            文件列表 = "\n".join(files) if files else "（无 HTML 文件）"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write(f"当前目录下的 HTML 文件:\n{文件列表}".encode("utf-8"))
            return
        
        相对路径 = 请求路径.lstrip("/")
        file_path = os.path.join(HTML_DIR, 相对路径)
        print(f"  搜索文件: {file_path}")
        
        if not os.path.exists(file_path):
            self.send_response(404)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write(f"404 - 文件不存在\n\n尝试访问: {file_path}\n\n查看可用文件: http://localhost:{PORT}/list".encode("utf-8"))
            return
        
        if not file_path.endswith(".html"):
            self.send_response(403)
            self.end_headers()
            self.wfile.write(b"403 Forbidden")
            return
        
        with open(file_path, "rb") as f:
            content = f.read()
        
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(content)
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
    
    def do_POST(self):
        if self.path != "/api/chat":
            self.send_response(404)
            self.end_headers()
            return
        
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8")
        data = json.loads(body)
        
        api_url = data.get("api_url", "https://nova.deloitte.com.cn/del/v1/chat/completions")
        api_key = data.get("api_key", "")
        model = data.get("model", "Qwen3-235B-A22B")
        messages = data.get("messages", [])
        
        req_data = json.dumps({
            "model": model,
            "messages": messages,
            "max_tokens": data.get("max_tokens", 1000),
            "temperature": 0.3
        }).encode()
        
        try:
            req = Request(api_url, data=req_data, method="POST")
            req.add_header("Content-Type", "application/json")
            req.add_header("Authorization", f"Bearer {api_key}")
            
            resp = urlopen(req, timeout=60)
            resp_body = resp.read().decode("utf-8")
            result = json.loads(resp_body)
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode("utf-8"))
            
        except HTTPError as e:
            err_body = e.read().decode("utf-8")
            self.send_response(e.code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"error": err_body}).encode("utf-8"))
        
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
    
    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {args[0]} {args[1]} {args[2]}")

if __name__ == "__main__":
    print("=" * 50)
    print("  信用评级查询工具")
    print(f"  启动地址: http://localhost:{PORT}")
    print(f"  当前目录: {HTML_DIR}")
    print("  按 Ctrl+C 停止服务")
    print("=" * 50)
    
    server = HTTPServer(("0.0.0.0", PORT), 代理处理器)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止")
        server.server_close()
