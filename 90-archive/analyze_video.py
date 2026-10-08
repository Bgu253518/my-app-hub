"""视频风格分析工具 — 一键拆解视频的脚本/配色/排版/节奏"""
import sys, os, json, subprocess, math

def analyze(video_path: str) -> dict:
    print(f"\n{'='*60}\n  视频风格分析: {os.path.basename(video_path)}\n{'='*60}")

    result = {"file": video_path, "scenes": [], "colors": [], "layout": [], "transitions": []}

    # ── 1. 提取关键帧 ──────────────────────────────────────
    print("\n[1/4] 提取关键帧（每3秒1张）...")
    frames_dir = "out/_frames"
    os.makedirs(frames_dir, exist_ok=True)

    try:
        import cv2
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps > 0 else 0

        for sec in range(0, int(duration), 3):
            cap.set(cv2.CAP_PROP_POS_FRAMES, sec * fps)
            ret, frame = cap.read()
            if ret:
                cv2.imwrite(f"{frames_dir}/frame_{sec:03d}.jpg", frame)
        cap.release()

        print(f"  ✓ {duration:.0f}s @ {fps:.0f}fps, 提取了{int(duration)//3+1}帧")
        result["duration"] = duration
        result["fps"] = fps
    except ImportError:
        print("  ⚠ opencv 未安装，跳过帧提取")
        duration = 0

    # ── 2. 提取音频并转录 ──────────────────────────────────
    print("\n[2/4] 提取音频并转录...")
    transcript = ""
    try:
        from pydub import AudioSegment
        audio = AudioSegment.from_file(video_path)
        audio_path = "out/_temp_audio.wav"
        audio.export(audio_path, format="wav")
        print(f"  ✓ 音频提取完成: {len(audio)/1000:.0f}s")

        try:
            from faster_whisper import WhisperModel
            print("  ⏳ faster-whisper 转录中（small 模型）...")
            model = WhisperModel("small", device="cpu", compute_type="int8")
            segments_raw, info = model.transcribe(audio_path, language="zh", beam_size=5)
            segments = []
            transcript = ""
            for seg in segments_raw:
                segments.append({"start": seg.start, "end": seg.end, "text": seg.text.strip()})
                transcript += seg.text
            print(f"  ✓ 转录完成: {len(transcript)} 字, {len(segments)} 个句子")
            result["transcript"] = transcript
            result["segments"] = segments
        except ImportError:
            print("  ⚠ faster-whisper 未安装，跳过转录")

        os.remove(audio_path)
    except ImportError:
        print("  ⚠ pydub 未安装，跳过音频提取")

    # ── 3. 分析配色 ─────────────────────────────────────────
    print("\n[3/4] 分析配色方案...")
    frames_list = sorted([f for f in os.listdir(frames_dir) if f.endswith('.jpg')])
    if frames_list:
        try:
            import cv2
            import numpy as np
            from collections import Counter

            all_colors = []
            for fn in frames_list[:10]:  # 前10帧采样
                img = cv2.imread(os.path.join(frames_dir, fn))
                img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                # 采样像素，每10个像素取1个
                pixels = img_rgb.reshape(-1, 3)[::10]
                all_colors.extend(pixels.tolist())

            # K-means 提取主色
            from sklearn.cluster import KMeans
            kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
            kmeans.fit(all_colors[:5000])

            colors_hex = []
            for c in kmeans.cluster_centers_:
                hex_color = "#{:02x}{:02x}{:02x}".format(int(c[0]), int(c[1]), int(c[2]))
                count = np.sum(kmeans.labels_ == list(kmeans.cluster_centers_).index(c))
                ratio = int(count / len(kmeans.labels_) * 100) if len(kmeans.labels_) > 0 else 0
                colors_hex.append({"hex": hex_color, "ratio": ratio})

            colors_hex.sort(key=lambda x: x["ratio"], reverse=True)
            result["colors"] = colors_hex

            print("  ✓ 主配色:")
            for c in colors_hex:
                print(f"    {c['hex']} ({c['ratio']}%)")
        except ImportError:
            print("  ⚠ sklearn/cv2 未安装，跳过配色分析")

    # ── 4. 综合报告 ─────────────────────────────────────────
    print(f"\n[4/4] 生成分析报告...")

    report = f"""
## 视频风格分析报告
**文件**: {os.path.basename(video_path)}
**时长**: {result.get('duration', '?')}s
**帧率**: {result.get('fps', '?')}fps

### 脚本结构（按句分段）
"""
    for i, seg in enumerate(result.get("segments", [])):
        report += f"{i+1}. [{seg['start']:.1f}s-{seg['end']:.1f}s] {seg['text']}\n"

    report += f"\n### 配色方案\n"
    for c in result.get("colors", []):
        report += f"- {c['hex']} ({c['ratio']}%)\n"

    report += f"\n### 建议分镜参考\n"
    if result.get("segments"):
        segs = result["segments"]
        for i, seg in enumerate(segs):
            bg = ["B1","B2","B3","B4","B5","B6","B7"][i % 7]
            layout = ["L1","L2","L3","L4","L5","L2","L3"][i % 7]
            report += f"| {i+1} | {seg['start']:.0f}-{seg['end']:.0f}s | {bg} | {layout} | {seg['text'][:30]}... |\n"

    print(report)
    result["report"] = report
    return result


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python analyze_video.py <视频文件路径>")
        sys.exit(1)
    analyze(sys.argv[1])
