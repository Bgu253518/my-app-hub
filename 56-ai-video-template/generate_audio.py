import asyncio
import edge_tts
import os
import sys

# 修复 Windows GBK 终端编码问题
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

TEXT = "AI时代已经来临，智能技术正在深刻改变我们的工作和生活方式。效率提升十倍，让我们一起拥抱未来。"
VOICE = "zh-CN-XiaoxiaoNeural"
OUTPUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "audio", "narration.mp3")

async def generate():
    print(f"[TTS] Generating voice: {TEXT[:40]}...")
    print(f"[TTS] Voice: {VOICE}")
    communicate = edge_tts.Communicate(TEXT, VOICE, rate="+5%")
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    await communicate.save(OUTPUT)
    print(f"[TTS] Audio saved: {OUTPUT}")

    import subprocess
    try:
        result = subprocess.run(
            ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", OUTPUT],
            capture_output=True, text=True
        )
        if result.returncode == 0:
            duration = float(result.stdout.strip())
            print(f"[TTS] Duration: {duration:.1f}s (~{int(duration * 30)} frames @30fps)")
    except Exception:
        pass

if __name__ == "__main__":
    asyncio.run(generate())
