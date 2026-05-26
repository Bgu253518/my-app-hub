"""
生成配音 + SRT字幕 → 合成最终视频
"""
import io, os, sys, json, re, subprocess
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

VIDEO_PATH = r"C:\Users\bgu\Desktop\claude code 项目管理\项目13-AI代码工作流\视频\MP4视频.mp4"
SCRIPT_PATH = r"C:\Users\bgu\Desktop\claude code 项目管理\项目13-AI代码工作流\视频\script.txt"
OUTPUT_DIR = r"C:\Users\bgu\Desktop\claude code 项目管理\项目13-AI代码工作流\视频"
AUDIO_PATH = os.path.join(OUTPUT_DIR, "narration.mp3")
SRT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "temp_subtitles.srt")
# 简短无特殊字符的路径，给 FFmpeg subtitles filter 用
SRT_SHORT = os.path.join(os.path.dirname(os.path.dirname(__file__)), "temp_subtitles.srt")
SRT_SHORT_NAME = os.path.basename(SRT_SHORT)
SRT_SHORT_DIR = os.path.dirname(SRT_SHORT)
FINAL_PATH = os.path.join(OUTPUT_DIR, "final_output.mp4")

FFMPEG = r"C:\Users\bgu\AppData\Local\Programs\Python\Python313\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
VOICE = "zh-CN-XiaoxiaoNeural"  # 晓晓

# ---- 停顿标记格式 ---- #0.5# 表示停0.5秒
PAUSE_PATTERN = re.compile(r'#([\d.]+)#')


def read_script():
    with open(SCRIPT_PATH, "r", encoding="utf-8") as f:
        return f.read().strip()


def parse_sentences(script):
    """解析文案为句子列表，每句附估计时长（秒）"""
    # 先标准化：按句号/感叹号/问号拆分
    script = script.replace('\n', '')
    raw = re.split(r'(?<=[。！？])', script)
    raw = [r.strip() for r in raw if r.strip()]

    sentences = []
    for part in raw:
        # 提取停顿标记
        pauses = PAUSE_PATTERN.findall(part)
        pause_total = sum(float(p) for p in pauses)
        # 移除标记计算纯文本
        text = PAUSE_PATTERN.sub('', part).strip()
        if text:
            # 中文字数≈时长(秒) 按4字/秒估算
            char_count = len(text)
            est_duration = max(1.0, char_count / 4.0) + pause_total
            sentences.append({"text": text, "est_dur": est_duration, "chars": char_count})
    return sentences


def generate_audio(script_text):
    """生成配音音频文件"""
    import asyncio
    import edge_tts

    async def _run():
        communicate = edge_tts.Communicate(script_text, VOICE, rate="+15%", pitch="+0Hz")
        audio_data = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
        with open(AUDIO_PATH, "wb") as f:
            f.write(audio_data)
        print(f"Audio: {AUDIO_PATH} ({len(audio_data)} bytes)", file=sys.stderr)

    asyncio.run(_run())


def get_audio_duration():
    """用 moviepy 直接获取音频时长"""
    from moviepy import AudioFileClip
    clip = AudioFileClip(AUDIO_PATH)
    dur = clip.duration
    clip.close()
    return dur


def generate_srt(sentences, total_duration):
    """基于比例分配生成SRT字幕"""
    total_chars = sum(s["chars"] for s in sentences)
    current_time = 0.0

    with open(SRT_PATH, "w", encoding="utf-8") as f:
        for i, s in enumerate(sentences, 1):
            ratio = s["chars"] / total_chars
            dur = total_duration * ratio
            end_time = min(current_time + dur, total_duration)

            start_str = fmt_time(current_time)
            end_str = fmt_time(end_time)
            f.write(f"{i}\n{start_str} --> {end_str}\n{s['text']}\n\n")

            current_time = end_time

    print(f"SRT: {SRT_PATH} ({len(sentences)} entries, total {total_duration:.2f}s)", file=sys.stderr)


def fmt_time(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}".replace(".", ",")


def get_video_duration():
    from moviepy import VideoFileClip
    clip = VideoFileClip(VIDEO_PATH)
    dur = clip.duration
    clip.close()
    return dur


def compose_video(audio_dur, video_dur):
    """FFmpeg 合成最终视频（自动加速音频匹配视频时长）"""
    speed = audio_dur / video_dur if audio_dur > video_dur else 1.0
    # atempo 支持 0.5~2.0，超过范围需要串联
    if speed > 2.0:
        speed = 2.0
    print(f"Video: {video_dur:.2f}s, Audio: {audio_dur:.2f}s, Speed factor: {speed:.3f}", file=sys.stderr)

    cmd = [
        FFMPEG,
        "-i", VIDEO_PATH,
        "-i", AUDIO_PATH,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-map", "0:v:0",
        "-map", "1:a:0",
    ]
    # 如果需要加速音频
    if speed > 1.01:
        cmd += ["-af", f"atempo={speed}"]
    cmd += [
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        "-vf", f"subtitles={SRT_SHORT_NAME}:force_style='FontName=Microsoft YaHei,FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H80000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=50'",
        "-y", FINAL_PATH,
    ]
    print(f"Composing video...", file=sys.stderr)
    # 设置 cwd 为 SRT 所在目录，让 subtitles 用相对路径
    result = subprocess.run(cmd, capture_output=True, timeout=600, cwd=SRT_SHORT_DIR)
    if result.returncode != 0:
        err = result.stderr.decode('utf-8', errors='replace')[-1000:]
        print(f"FFmpeg error: {err}", file=sys.stderr)
        return False
    print(f"Done: {FINAL_PATH}", file=sys.stderr)
    return True


def main():
    script = read_script()
    # 移除【停顿】标记（文案里自带的），保留纯文本
    clean = re.sub(r'【停顿.*?】', '', script)
    # 预处理多余空白
    clean = re.sub(r'\s+', '', clean)
    print(f"Script: {len(clean)} chars", file=sys.stderr)

    # 解析句子
    sentences = parse_sentences(clean)
    print(f"Sentences: {len(sentences)}", file=sys.stderr)

    # 1) 生成音频
    print("Generating audio...", file=sys.stderr)
    generate_audio(clean)

    # 2) 获取音频真实时长
    audio_dur = get_audio_duration()
    if not audio_dur:
        print("Failed to get audio duration", file=sys.stderr)
        return
    print(f"Audio duration: {audio_dur:.2f}s", file=sys.stderr)

    # 3) 生成SRT（根据真实时长等比分配）
    generate_srt(sentences, audio_dur)

    # 4) 合成视频
    video_dur = get_video_duration()
    if compose_video(audio_dur, video_dur):
        print(f"\n完成！最终视频：{FINAL_PATH}")


if __name__ == "__main__":
    main()
