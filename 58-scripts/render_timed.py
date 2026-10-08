"""
基于时间线标记的渲染：精确匹配操作画面 + 自我介绍黑底开头
"""
import io, os, sys, re, subprocess
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ORIG_VIDEO = r"C:\Users\bgu\Desktop\claude code 项目管理\项目13-AI代码工作流\视频\子Request创建1.mp4"
SCRIPT_PATH = r"C:\Users\bgu\Desktop\claude code 项目管理\项目13-AI代码工作流\视频\timeline_script.txt"
OUTPUT_DIR = r"C:\Users\bgu\Desktop\claude code 项目管理\项目13-AI代码工作流\视频"
AUDIO_PATH = os.path.join(OUTPUT_DIR, "narration_timed.mp3")
INTRO_PATH = os.path.join(OUTPUT_DIR, "_intro_temp.mp4")
COMBINED_PATH = os.path.join(OUTPUT_DIR, "_combined_temp.mp4")
FINAL_PATH = os.path.join(OUTPUT_DIR, "子Request创建_成品.mp4")

FFMPEG = r"C:\Users\bgu\AppData\Local\Programs\Python\Python313\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
VOICE = "zh-CN-XiaoxiaoNeural"
INTRO_DURATION = 5

SRT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "temp_subtitles_timed.srt")
SRT_NAME = os.path.basename(SRT_PATH)
SRT_DIR = os.path.dirname(SRT_PATH)

TIME_RE = re.compile(r'\[(\d+)-(\d+)\]\s*(.+)')


def parse_script():
    entries = []
    with open(SCRIPT_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            m = TIME_RE.match(line)
            if m:
                entries.append({
                    "start": int(m.group(1)),
                    "end": int(m.group(2)),
                    "text": m.group(3).strip(),
                })
    return entries


def generate_audio(full_text):
    import asyncio, edge_tts
    async def _run():
        c = edge_tts.Communicate(full_text, VOICE, rate="+12%", pitch="+0Hz")
        data = b""
        async for chunk in c.stream():
            if chunk["type"] == "audio":
                data += chunk["data"]
        with open(AUDIO_PATH, "wb") as f:
            f.write(data)
        print(f"Audio: {len(data)} bytes", file=sys.stderr)
    asyncio.run(_run())


def get_duration(path):
    from moviepy import AudioFileClip
    clip = AudioFileClip(path)
    d = clip.duration
    clip.close()
    return d


def write_srt(entries):
    with open(SRT_PATH, "w", encoding="utf-8") as f:
        for i, e in enumerate(entries, 1):
            f.write(f"{i}\n")
            f.write(f"{fmt_time(e['start'])} --> {fmt_time(e['end'])}\n")
            f.write(f"{e['text']}\n\n")
    print(f"SRT: {len(entries)} entries, last at {entries[-1]['end']}s", file=sys.stderr)


def fmt_time(sec):
    h, m = sec // 3600, (sec % 3600) // 60
    s = sec % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}".replace(".", ",")


def get_video_duration(path):
    from moviepy import VideoFileClip
    clip = VideoFileClip(path)
    d = clip.duration
    clip.close()
    return d


def prepend_intro():
    """moviepy创建5秒黑底+自我介绍画面，拼接到原视频前"""
    from moviepy import VideoClip, VideoFileClip, concatenate_videoclips
    import numpy as np

    def make_frame(t):
        # 纯黑画面，文字由SRT字幕显示（避免PIL渲染中文乱码）
        return np.zeros((1020, 1920, 3), dtype=np.uint8)

    print(f"Creating intro ({INTRO_DURATION}s)...", file=sys.stderr)
    intro = VideoClip(make_frame, duration=INTRO_DURATION).with_fps(30)
    orig = VideoFileClip(ORIG_VIDEO)
    combined = concatenate_videoclips([intro, orig])
    combined.write_videofile(COMBINED_PATH, codec="libx264", preset="fast",
                             fps=30, audio=False, logger=None)
    orig.close()
    intro.close()
    combined.close()

    dur = get_video_duration(COMBINED_PATH)
    print(f"Combined: {dur:.2f}s", file=sys.stderr)
    return COMBINED_PATH


def compose(full_text, entries):
    # 1) 纯文本
    clean = re.sub(TIME_RE, lambda m: m.group(3), full_text)
    clean = clean.replace('\n', '').strip()

    # 2) 生成音频
    print(f"Generating audio ({len(clean)} chars)...", file=sys.stderr)
    generate_audio(clean)
    raw_dur = get_duration(AUDIO_PATH)
    SPEED = 1.2
    slow_dur = raw_dur / SPEED
    print(f"Audio: {raw_dur:.2f}s raw -> {slow_dur:.2f}s at {SPEED}x", file=sys.stderr)

    # 3) SRT
    write_srt(entries)

    # 4) 直接使用原视频（无黑底开头）
    video_dur = get_video_duration(ORIG_VIDEO)
    print(f"Video: {video_dur:.2f}s", file=sys.stderr)
    print(f"Silent after: {max(0, video_dur - slow_dur):.1f}s", file=sys.stderr)

    # 5) 合成
    cmd = [
        FFMPEG,
        "-i", ORIG_VIDEO,
        "-i", AUDIO_PATH,
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-map", "0:v:0", "-map", "1:a:0",
        "-af", f"atempo={SPEED}",
        "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart",
        "-vf", f"subtitles={SRT_NAME}:force_style='FontName=Microsoft YaHei,FontSize=18,Alignment=2,MarginV=15,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H80000000,BorderStyle=3,Outline=1,Shadow=0'",
        "-y", FINAL_PATH,
    ]
    print(f"Composing...", file=sys.stderr)
    result = subprocess.run(cmd, capture_output=True, timeout=600, cwd=SRT_DIR)
    if result.returncode != 0:
        err = result.stderr.decode('utf-8', errors='replace')[-1000:]
        print(f"Error: {err}", file=sys.stderr)
        return False

    if os.path.exists(COMBINED_PATH):
        os.remove(COMBINED_PATH)
    print(f"Done: {FINAL_PATH}", file=sys.stderr)
    return True


def main():
    entries = parse_script()
    print(f"Entries: {len(entries)}", file=sys.stderr)
    for e in entries:
        print(f"  [{e['start']}-{e['end']}s] {e['text'][:40]}...", file=sys.stderr)

    with open(SCRIPT_PATH, "r", encoding="utf-8") as f:
        full = f.read()

    compose(full, entries)


if __name__ == "__main__":
    main()
