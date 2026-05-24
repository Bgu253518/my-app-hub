import asyncio
import edge_tts
import os
import sys

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

TEXT = "1950年，图灵问了一个问题。1956年，达特茅斯给了它一个名字：人工智能。1997年，深蓝让世界沉默。2012年，深度学习睁开双眼。2017年，Transformer重塑一切。2022年，ChatGPT点燃全球。今天，AI Agent正在重新定义人类。"

VOICE = "zh-CN-YunjianNeural"
OUTPUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "audio", "narration.mp3")

async def generate():
    print(f"[TTS] Voice: {VOICE}")
    print(f"[TTS] Script length: {len(TEXT)} chars")
    communicate = edge_tts.Communicate(TEXT, VOICE, rate="-15%")
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    await communicate.save(OUTPUT)
    print(f"[TTS] Saved: {OUTPUT}")

    try:
        from mutagen.mp3 import MP3
        duration = MP3(OUTPUT).info.length
        print(f"[TTS] Duration: {duration:.1f}s (~{int(duration * 30)} frames @30fps)")
    except Exception:
        print("[TTS] Could not determine duration")

if __name__ == "__main__":
    asyncio.run(generate())
