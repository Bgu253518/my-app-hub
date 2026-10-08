"""
渲染：配音精确匹配字幕时间轴（空格处静音）
"""
import io, os, sys, re, subprocess, asyncio, edge_tts, shutil
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ORIG_VIDEO = r"C:\Users\bgu\Desktop\claude code 项目管理\项目13-AI代码工作流\视频\视频2\子Request创建2-1.mp4"
SCRIPT_PATH = r"C:\Users\bgu\Desktop\claude code 项目管理\项目13-AI代码工作流\视频\timeline_script3.txt"
OUTPUT_DIR = r"C:\Users\bgu\Desktop\claude code 项目管理\项目13-AI代码工作流\视频"
AUDIO_WAV = os.path.join(OUTPUT_DIR, "narration_video2.wav")
FINAL_PATH = os.path.join(OUTPUT_DIR, "子Request创建2-1_成品.mp4")
SEG_DIR = os.path.join(OUTPUT_DIR, "_segments")
os.makedirs(SEG_DIR, exist_ok=True)

FFMPEG = r"C:\Users\bgu\AppData\Local\Programs\Python\Python313\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
VOICE = "zh-CN-XiaoxiaoNeural"

SRT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "temp_subtitles_video2.srt")
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


async def gen_segment(text, out_path, rate="+50%"):
    c = edge_tts.Communicate(text, VOICE, rate=rate, pitch="+0Hz")
    data = b""
    async for chunk in c.stream():
        if chunk["type"] == "audio":
            data += chunk["data"]
    with open(out_path, "wb") as f:
        f.write(data)


def get_duration(path):
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


def ffmpeg_silence(path, duration):
    subprocess.run([
        FFMPEG, "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo",
        "-t", str(duration),
        "-y", path
    ], capture_output=True, check=True)


def ffmpeg_pad_to(path, out_path, target_dur):
    """Pad or speed-up audio to exactly target_dur seconds"""
    dur = get_duration(path)
    if abs(dur - target_dur) < 0.05:
        shutil.copy(path, out_path)
        return
    if dur > target_dur:
        speed = dur / target_dur
        subprocess.run([
            FFMPEG, "-i", path,
            "-af", f"atempo={speed}",
            "-y", out_path
        ], capture_output=True, check=True)
    else:
        pad = target_dur - dur
        subprocess.run([
            FFMPEG, "-i", path,
            "-af", f"apad=pad_dur={pad}",
            "-y", out_path
        ], capture_output=True, check=True)


def build_aligned_audio(entries):
    """纯ffmpeg方式构建对齐音频"""
    concat_parts = []

    # 开头静音
    if entries[0]["start"] > 0:
        p = os.path.join(SEG_DIR, "sil_start.wav")
        ffmpeg_silence(p, entries[0]["start"])
        concat_parts.append(p)

    for i, entry in enumerate(entries):
        # 生成TTS
        seg_path = os.path.join(SEG_DIR, f"seg_{i}.mp3")
        asyncio.run(gen_segment(entry["text"], seg_path))

        # 对齐到时间窗口（加速或填充）
        window = entry["end"] - entry["start"]
        aligned = os.path.join(SEG_DIR, f"aligned_{i}.wav")
        ffmpeg_pad_to(seg_path, aligned, window)

        raw_dur = get_duration(seg_path)
        print(f"  Seg {i}: [{entry['start']}-{entry['end']}s] TTS={raw_dur:.1f}s window={window}s", file=sys.stderr)
        if raw_dur > window:
            print(f"    -> sped {raw_dur/window:.2f}x", file=sys.stderr)

        concat_parts.append(aligned)

        # 间隙静音
        if i < len(entries) - 1:
            gap = entries[i+1]["start"] - entry["end"]
            if gap > 0:
                gp = os.path.join(SEG_DIR, f"gap_{i}.wav")
                ffmpeg_silence(gp, gap)
                concat_parts.append(gp)

    # 用concat filter拼接所有音频
    n = len(concat_parts)
    inputs = []
    filter_inputs = "".join(f"[{i}:a]" for i in range(n))
    cmd = [FFMPEG]
    for p in concat_parts:
        cmd += ["-i", p]
    cmd += [
        "-filter_complex", f"{filter_inputs}concat=n={n}:v=0:a=1[out]",
        "-map", "[out]",
        "-y", AUDIO_WAV,
    ]
    subprocess.run(cmd, capture_output=True, check=True, timeout=120)

    total = get_duration(AUDIO_WAV)
    print(f"Aligned audio: {total:.2f}s", file=sys.stderr)
    return AUDIO_WAV


def write_srt(entries):
    with open(SRT_PATH, "w", encoding="utf-8") as f:
        for i, e in enumerate(entries, 1):
            f.write(f"{i}\n")
            f.write(f"{fmt_time(e['start'])} --> {fmt_time(e['end'])}\n")
            f.write(f"{e['text']}\n\n")


def fmt_time(sec):
    sec = float(sec)
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = sec % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}".replace(".", ",")


def compose(full_text, entries):
    print(f"Total text: {len(full_text)} chars", file=sys.stderr)
    aligned_audio = build_aligned_audio(entries)
    write_srt(entries)

    video_dur = get_video_duration(ORIG_VIDEO)
    audio_dur = get_duration(aligned_audio)
    print(f"Video: {video_dur:.2f}s, Audio: {audio_dur:.2f}s", file=sys.stderr)
    print(f"Silent after: {max(0, video_dur - audio_dur):.1f}s", file=sys.stderr)

    cmd = [
        FFMPEG,
        "-i", ORIG_VIDEO,
        "-i", aligned_audio,
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-map", "0:v:0", "-map", "1:a:0",
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

    shutil.rmtree(SEG_DIR, ignore_errors=True)
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
