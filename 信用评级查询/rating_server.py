# -*- coding: utf-8 -*-
"""
信用评级查询工具 · 服务端 v2
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

    def _设置CORS头(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_GET(self):
        请求路径 = unquote(self.path)
        print(f"  GET {请求路径}")

        if 请求路径 == "/":
            # 按优先级查找可用的HTML文件
            候选文件 = ["rating_tool.html", "信用评级查询.html", "五虾流水线.html"]
            for f in 候选文件:
                if os.path.exists(os.path.join(HTML_DIR, f)):
                    请求路径 = "/" + f
                    break
            else:
                self.send_response(404)
                self.send_header("Content-Type", "text/plain; charset=utf-8")
                self._设置CORS头()
                self.end_headers()
                self.wfile.write("404 - 当前目录没有找到可用的 HTML 文件".encode("utf-8"))
                return

        elif 请求路径 == "/list":
            files = [f for f in os.listdir(HTML_DIR) if f.endswith(".html")]
            文件列表 = "\n".join(files) if files else "（无 HTML 文件）"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self._设置CORS头()
            self.end_headers()
            self.wfile.write(f"当前目录下的 HTML 文件:\n{文件列表}".encode("utf-8"))
            return

        相对路径 = 请求路径.lstrip("/")
        file_path = os.path.join(HTML_DIR, 相对路径)
        print(f"  搜索文件: {file_path}")

        if not os.path.exists(file_path):
            self.send_response(404)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self._设置CORS头()
            self.end_headers()
            self.wfile.write(
                f"404 - 文件不存在\n\n"
                f"尝试访问: {file_path}\n\n"
                f"查看可用文件: http://localhost:{PORT}/list".encode("utf-8")
            )
            return

        if not file_path.endswith(".html"):
            self.send_response(403)
            self._设置CORS头()
            self.end_headers()
            self.wfile.write(b"403 Forbidden")
            return

        with open(file_path, "rb") as f:
            content = f.read()

        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self._设置CORS头()
        self.end_headers()
        self.wfile.write(content)

    def do_OPTIONS(self):
        self.send_response(200)
        self._设置CORS头()
        self.end_headers()

    def do_POST(self):
        if self.path != "/api/chat":
            self.send_response(404)
            self._设置CORS头()
            self.end_headers()
            return

        # 读取 Content-Length，兼容缺失的情况
        content_length = self.headers.get("Content-Length")
        if not content_length:
            self.send_response(400)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self._设置CORS头()
            self.end_headers()
            self.wfile.write(json.dumps({"error": "缺少 Content-Length 头"}).encode("utf-8"))
            return

        try:
            length = int(content_length)
            body = self.rfile.read(length).decode("utf-8")
            data = json.loads(body)
        except (ValueError, json.JSONDecodeError) as e:
            self.send_response(400)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self._设置CORS头()
            self.end_headers()
            self.wfile.write(json.dumps({"error": f"请求体解析失败: {str(e)}"}).encode("utf-8"))
            return

        api_url = data.get("api_url", "https://nova.deloitte.com.cn/del/v1/chat/completions")
        api_key = data.get("api_key", "")
        model = data.get("model", "Qwen3-235B-A22B")
        messages = data.get("messages", [])

        if not api_key:
            self.send_response(400)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self._设置CORS头()
            self.end_headers()
            self.wfile.write(json.dumps({"error": "API 密钥不能为空"}).encode("utf-8"))
            return

        # 构建请求体（不使用streaming，方便处理完整响应）
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
            self._设置CORS头()
            self.end_headers()
            self.wfile.write(json.dumps(result, ensure_ascii=False).encode("utf-8"))

        except HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            self.send_response(e.code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self._设置CORS头()
            self.end_headers()
            self.wfile.write(json.dumps({"error": err_body}, ensure_ascii=False).encode("utf-8"))

        except URLError as e:
            self.send_response(502)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self._设置CORS头()
            self.end_headers()
            self.wfile.write(json.dumps({"error": f"无法连接到API服务器: {e.reason}"}, ensure_ascii=False).encode("utf-8"))

        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self._设置CORS头()
            self.end_headers()
            self.wfile.write(json.dumps({"error": f"服务器内部错误: {str(e)}"}, ensure_ascii=False).encode("utf-8"))

    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {args[0]} {args[1]} {args[2]}")


if __name__ == "__main__":
    print("=" * 50)
    print("  信用评级查询工具 v2")
    print(f"  启动地址: http://localhost:{PORT}")
    print(f"  当前目录: {HTML_DIR}")
    print(f"  按 Ctrl+C 停止服务")
    print("=" * 50)

    server = HTTPServer(("0.0.0.0", PORT), 代理处理器)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止")
        server.server_close()
