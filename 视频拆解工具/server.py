"""
虾人动画 · 视频拆解工具 — FastAPI 后端
启动方式：python server.py 或双击 start.bat
浏览器打开 http://localhost:8765
"""
import os, sys, json, time, uuid, shutil, subprocess, threading
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).parent
INPUT_DIR = BASE_DIR / "input"
OUTPUT_DIR = BASE_DIR / "output"
FRAMES_DIR = OUTPUT_DIR / "frames"
TEMP_DIR = OUTPUT_DIR / "temp"

for d in [INPUT_DIR, OUTPUT_DIR, FRAMES_DIR, TEMP_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# ─── 进度管理（内存字典） ───
jobs: dict = {}  # job_id -> {status, progress, steps, results}

# ─── 依赖检查 ───

def check_ffmpeg():
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, timeout=5)
        return True
    except:
        return False

def check_whisper():
    try:
        subprocess.run([sys.executable, "-c", "import whisper"], capture_output=True, timeout=10)
        return True
    except:
        return False

# ─── 简易 HTTP 服务器（不用 FastAPI，零额外依赖） ───

from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass  # 静默

    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())

    def _send_html(self, path):
        try:
            with open(BASE_DIR / path, "rb") as f:
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                self.wfile.write(f.read())
        except:
            self.send_error(404)

    def _send_file(self, filepath, content_type):
        if not os.path.isfile(filepath):
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        with open(filepath, "rb") as f:
            self.wfile.write(f.read())

    def _stream_sse(self, job_id):
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        last_state = None
        timeout = time.time() + 300
        while time.time() < timeout:
            job = jobs.get(job_id, {})
            current = json.dumps(job, ensure_ascii=False)
            if current != last_state:
                self.wfile.write(f"data: {current}\n\n".encode())
                self.wfile.flush()
                last_state = current
                if job.get("status") in ("done", "error"):
                    break
            time.sleep(0.3)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        p = urlparse(self.path)
        path = p.path

        if path == "/" or path == "/index.html":
            return self._send_html("index.html")

        if path == "/api/status":
            return self._send_json({
                "ffmpeg": check_ffmpeg(),
                "whisper": check_whisper(),
                "message": "就绪"
            })

        if path == "/api/progress":
            q = parse_qs(p.query)
            job_id = q.get("job_id", [None])[0]
            if job_id and job_id in jobs:
                return self._stream_sse(job_id)
            return self._send_json({"error": "job not found"}, 404)

        if path.startswith("/api/frames/"):
            parts = path.replace("/api/frames/", "").split("/", 1)
            if len(parts) == 2:
                filepath = FRAMES_DIR / parts[0] / parts[1]
                return self._send_file(str(filepath), "image/png")

        if path.startswith("/api/output/"):
            rel = path.replace("/api/output/", "")
            filepath = OUTPUT_DIR / rel
            if os.path.isfile(str(filepath)):
                ct = "audio/mpeg" if rel.endswith(".mp3") else "text/plain; charset=utf-8"
                return self._send_file(str(filepath), ct)

        if path == "/api/open-folder":
            folder = str(OUTPUT_DIR)
            try:
                os.startfile(folder)
                return self._send_json({"ok": True, "path": folder})
            except Exception as e:
                return self._send_json({"ok": False, "error": str(e)}, 500)

        if path == "/api/output-path":
            return self._send_json({
                "report_dir": str(OUTPUT_DIR),
                "frames_dir": str(FRAMES_DIR),
                "input_dir": str(INPUT_DIR)
            })

        return self.send_error(404)

    def do_POST(self):
        p = urlparse(self.path)
        path = p.path

        if path == "/api/upload":
            return self._handle_upload()

        if path == "/api/analyze":
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            return self._handle_analyze(body)

        return self.send_error(404)

    def _handle_upload(self):
        """接收视频文件，保存到 input/"""
        content_type = self.headers.get("Content-Type", "")
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)

        # 解析 multipart
        boundary = content_type.split("boundary=")[-1].encode()
        parts = body.split(b"--" + boundary)
        for part in parts:
            if b"filename=" in part:
                header_end = part.find(b"\r\n\r\n")
                header = part[:header_end].decode(errors="ignore")
                file_data = part[header_end+4:]
                if file_data.endswith(b"\r\n"):
                    file_data = file_data[:-2]

                filename = "unknown.mp4"
                for h in header.split(";"):
                    h = h.strip()
                    if h.startswith("filename="):
                        filename = h.split("=")[1].strip('" ')

                ext = os.path.splitext(filename)[1] or ".mp4"
                safe_name = f"{uuid.uuid4().hex[:8]}{ext}"
                save_path = INPUT_DIR / safe_name
                with open(save_path, "wb") as f:
                    f.write(file_data)

                return self._send_json({
                    "ok": True,
                    "video_id": safe_name,
                    "original_name": filename,
                    "size": len(file_data)
                })

        return self._send_json({"ok": False, "error": "未找到文件"}, 400)

    def _handle_analyze(self, body):
        video_id = body.get("video_id")
        frame_interval = body.get("frame_interval", 3)
        extract_subtitles = body.get("extract_subtitles", True)

        video_path = INPUT_DIR / video_id
        if not video_path.exists():
            return self._send_json({"ok": False, "error": "视频文件不存在"}, 404)

        # 每个视频一个 job 目录
        job_frames = FRAMES_DIR / video_id
        job_frames.mkdir(exist_ok=True)

        jobs[video_id] = {
            "status": "running",
            "progress": 0,
            "steps": [
                {"name": "抽帧", "status": "pending", "icon": "🖼️"},
                {"name": "语音识别", "status": "pending", "icon": "🎤"},
                {"name": "生成报告", "status": "pending", "icon": "📄"},
            ],
            "results": {},
            "started_at": datetime.now().isoformat()
        }

        def run():
            try:
                # ── 步骤 1: FFmpeg 抽帧 ──
                jobs[video_id]["steps"][0]["status"] = "running"
                jobs[video_id]["progress"] = 10

                probe = subprocess.run([
                    "ffprobe", "-v", "quiet", "-print_format", "json",
                    "-show_format", "-show_streams", str(video_path)
                ], capture_output=True, text=True)
                meta = {}
                if probe.returncode == 0 and probe.stdout and probe.stdout.strip():
                    meta = json.loads(probe.stdout)
                if not meta:
                    meta = {}
                fmt = meta.get("format", {})
                duration = float(fmt.get("duration", 0))
                vs = next((s for s in meta.get("streams", []) if s.get("codec_type") == "video"), {})
                width = vs.get("width", 0)
                height = vs.get("height", 0)
                fps_str = vs.get("r_frame_rate", "0/1")
                fps = 0
                if fps_str and "/" in str(fps_str):
                    parts = str(fps_str).split("/")
                    a, b = parts[0], parts[1]
                    fps = round(int(a)/int(b), 2) if int(b) else 0
                elif fps_str:
                    try:
                        fps = float(fps_str)
                    except:
                        fps = 0

                # 清空旧帧
                for old in job_frames.glob("*.jpg"):
                    old.unlink()

                subprocess.run([
                    "ffmpeg", "-y", "-i", str(video_path),
                    "-vf", f"fps=1/{frame_interval}",
                    "-q:v", "2",
                    str(job_frames / "frame_%03d.jpg")
                ], capture_output=True, check=True)

                frame_files = sorted(job_frames.glob("*.jpg"))
                frame_urls = [f"/api/frames/{video_id}/{f.name}" for f in frame_files]

                jobs[video_id]["steps"][0]["status"] = "done"
                jobs[video_id]["progress"] = 40
                jobs[video_id]["results"]["frames"] = {
                    "count": len(frame_files),
                    "urls": frame_urls,
                    "interval": frame_interval
                }
                jobs[video_id]["results"]["metadata"] = {
                    "duration": round(duration, 1),
                    "resolution": f"{width}x{height}",
                    "fps": fps
                }

                # ── 步骤 2: Whisper 语音转文字 ──
                if extract_subtitles and check_whisper():
                    jobs[video_id]["steps"][1]["status"] = "running"
                    jobs[video_id]["progress"] = 50

                    import whisper
                    audio_path = TEMP_DIR / f"{video_id}.wav"
                    subprocess.run([
                        "ffmpeg", "-y", "-i", str(video_path),
                        "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
                        str(audio_path)
                    ], capture_output=True, check=True)

                    model = whisper.load_model("base")
                    result = model.transcribe(str(audio_path), language="zh", verbose=False)

                    subtitles = []
                    for seg in result["segments"]:
                        subtitles.append({
                            "start": round(seg["start"], 1),
                            "end": round(seg["end"], 1),
                            "text": seg["text"].strip()
                        })

                    # 保存字幕文件
                    sub_path = OUTPUT_DIR / f"{video_id}_subtitles.json"
                    with open(sub_path, "w", encoding="utf-8") as f:
                        json.dump(subtitles, f, ensure_ascii=False, indent=2)

                    # 纯文本版
                    txt_path = OUTPUT_DIR / f"{video_id}_subtitles.txt"
                    with open(txt_path, "w", encoding="utf-8") as f:
                        for s in subtitles:
                            f.write(f"[{s['start']:.1f}s-{s['end']:.1f}s] {s['text']}\n")

                    # 清理 temp
                    if audio_path.exists():
                        audio_path.unlink()

                    jobs[video_id]["results"]["subtitles"] = {
                        "count": len(subtitles),
                        "segments": subtitles,
                        "full_text": "".join(s["text"] for s in subtitles)
                    }
                    jobs[video_id]["steps"][1]["status"] = "done"
                    jobs[video_id]["progress"] = 80

                elif extract_subtitles and not check_whisper():
                    jobs[video_id]["steps"][1]["status"] = "error"
                    jobs[video_id]["steps"][1]["error"] = "Whisper 未安装，请运行: pip install openai-whisper"
                else:
                    jobs[video_id]["steps"][1]["status"] = "skipped"

                # ── 步骤 3: 生成报告 ──
                jobs[video_id]["steps"][2]["status"] = "running"
                jobs[video_id]["progress"] = 90

                report = {
                    "video_id": video_id,
                    "original_name": jobs[video_id].get("original_name", video_id),
                    "analyzed_at": datetime.now().isoformat(),
                    "frame_interval": frame_interval,
                    "metadata": jobs[video_id]["results"].get("metadata", {}),
                    "frames_count": jobs[video_id]["results"].get("frames", {}).get("count", 0),
                    "subtitles_count": jobs[video_id]["results"].get("subtitles", {}).get("count", 0),
                }
                report_path = OUTPUT_DIR / f"{video_id}_report.json"
                with open(report_path, "w", encoding="utf-8") as f:
                    json.dump(report, f, ensure_ascii=False, indent=2)

                jobs[video_id]["steps"][2]["status"] = "done"
                jobs[video_id]["progress"] = 100
                jobs[video_id]["status"] = "done"
                jobs[video_id]["results"]["report"] = report

            except Exception as e:
                jobs[video_id]["status"] = "error"
                jobs[video_id]["error"] = str(e)
                for step in jobs[video_id]["steps"]:
                    if step["status"] == "running":
                        step["status"] = "error"
                        step["error"] = str(e)

        threading.Thread(target=run, daemon=True).start()
        return self._send_json({"ok": True, "video_id": video_id})

def main():
    port = 8765
    server = HTTPServer(("0.0.0.0", port), Handler)
    try:
        print(f"\n  [Video Analyzer] Server started -> http://localhost:{port}\n")
    except:
        pass
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Server stopped")
        server.server_close()

if __name__ == "__main__":
    main()
