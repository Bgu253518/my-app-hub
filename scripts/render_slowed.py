"""
渲染流程：视频放慢 + 配音 + 精确字幕匹配
"""
import io, os, sys, re, subprocess
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ORIG_VIDEO = r"C:\Users\bgu\Desktop\claude code 项目管理\项目13-AI代码工作流\视频\子Request创建1.mp4"
SCRIPT_PATH = r"C:\Users\bgu\Desktop\claude code 项目管理\项目13-AI代码工作流\视频\timeline_script.txt"
OUTPUT_DIR = r"C:\Users\bgu\Desktop\claude code 项目管理\项目13-AI代码工作流\视频"
AUDIO_PATH = os.path.join(OUTPUT_DIR, "narration_slow.mp3")
SLOWED_PATH = os.path.join(OUTPUT_DIR, "_slowed_temp.mp4")
FINAL_PATH = os.path.join(OUTPUT_DIR, "子Request创建_成品.mp4")

FFMPEG = r"C:\Users\bgu\AppData\Local\Programs\Python\Python313\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
VOICE = "zh-CN-XiaoxiaoNeural"
SLOWDOWN = 1.25  # 视频放慢倍数（1.25 = 慢25%，操作更清晰）

SRT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "temp_subtitles_slowed.srt")
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
        c = edge_tts.Communicate(full_text, VOICE, rate="+0%", pitch="+0Hz")
        data = b""
        async for chunk in c.stream():
            if chunk["type"] == "audio":
                data += chunk["data"]
        with open(AUDIO_PATH, "wb") as f:
            f.write(data)
        print(f"Audio: {len(data)} bytes", file=sys.stderr)
    asyncio.run(_run())


def get_audio_duration(path):
    from moviepy import AudioFileClip
    clip = AudioFileClip(path)
    d = clip.duration
    clip.close()
    return d


def get_video_duration(path):
    from moviepy import VideoFileClip
    clip = VideoFileClip(path)
    d = clip.duration
    clip.close()
    return d


def write_srt(entries):
    """写SRT，时间按放慢倍数缩放"""
    with open(SRT_PATH, "w", encoding="utf-8") as f:
        for i, e in enumerate(entries, 1):
            start = e["start"] * SLOWDOWN
            end = e["end"] * SLOWDOWN
            f.write(f"{i}\n")
            f.write(f"{fmt_time(start)} --> {fmt_time(end)}\n")
            f.write(f"{e['text']}\n\n")
    last = entries[-1]["end"] * SLOWDOWN
    print(f"SRT: {len(entries)} entries, last at {last:.1f}s", file=sys.stderr)


def fmt_time(sec):
    sec = float(sec)
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = sec % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}".replace(".", ",")


def slow_down_video():
    """用FFmpeg setpts放慢视频"""
    print(f"Slowing video {SLOWDOWN}x...", file=sys.stderr)
    cmd = [
        FFMPEG,
        "-i", ORIG_VIDEO,
        "-filter:v", f"setpts={SLOWDOWN}*PTS",
        # 去掉原音频（放慢后无声）
        "-an",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-y", SLOWED_PATH,
    ]
    subprocess.run(cmd, capture_output=True, timeout=180, check=True)
    dur = get_video_duration(SLOWED_PATH)
    print(f"Slowed video: {dur:.2f}s (was {get_video_duration(ORIG_VIDEO):.2f}s)", file=sys.stderr)
    return SLOWED_PATH


def compose(full_text, entries):
    # 1) 纯文本
    clean = re.sub(TIME_RE, lambda m: m.group(3), full_text)
    clean = clean.replace('\n', '').strip()

    # 2) 生成配音
    print(f"Generating audio ({len(clean)} chars)...", file=sys.stderr)
    generate_audio(clean)
    raw_dur = get_audio_duration(AUDIO_PATH)
    SPEED = 1.2
    audio_dur = raw_dur / SPEED
    print(f"Audio: {raw_dur:.2f}s raw -> {audio_dur:.2f}s at {SPEED}x", file=sys.stderr)

    # 3) 写SRT（时间已按放慢倍数缩放）
    write_srt(entries)

    # 4) 放慢视频
    video_path = slow_down_video()
    video_dur = get_video_duration(video_path)
    print(f"Silent after: {max(0, video_dur - audio_dur):.1f}s", file=sys.stderr)

    # 5) 合成最终视频
    cmd = [
        FFMPEG,
        "-i", video_path,
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

    # 清理
    for p in [SLOWED_PATH]:
        if os.path.exists(p):
            os.remove(p)
    print(f"Done: {FINAL_PATH}", file=sys.stderr)
    return True


def main():
    entries = parse_script()
    print(f"Entries: {len(entries)}", file=sys.stderr)
    for e in entries:
        scaled_s = e["start"] * SLOWDOWN
        scaled_e = e["end"] * SLOWDOWN
        print(f"  [{e['start']}-{e['end']}s] -> [{scaled_s:.0f}-{scaled_e:.0f}s] {e['text'][:40]}...", file=sys.stderr)

    with open(SCRIPT_PATH, "r", encoding="utf-8") as f:
        full = f.read()

    compose(full, entries)


if __name__ == "__main__":
    main()
