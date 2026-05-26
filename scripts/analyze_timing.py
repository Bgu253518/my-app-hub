"""
用千问VL分析视频操作时间线 → 生成带时间标记的配音文案
"""
import io, os, sys, json, base64, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

FRAMES_DIR = r"C:\Users\bgu\Desktop\claude code 项目管理\项目13-AI代码工作流\视频\frames2"
API_KEY = os.environ.get("QWEN_API_KEY", "ak-FDST94LCXZKfFPl7L5gG9N1a9zgF24LD0GuLSjxTVCfz1BHw")
BASE_URL = os.environ.get("QWEN_BASE_URL", "https://nova.deloitte.com.cn/del/v1")
MODEL = os.environ.get("QWEN_MODEL", "Qwen3.5-VL")

import httpx


def encode_image(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def qwen_vl(text, images_b64, **kwargs):
    content = [{"type": "text", "text": text}]
    for b64 in images_b64:
        content.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}})
    resp = httpx.post(
        f"{BASE_URL.rstrip('/')}/chat/completions",
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}"},
        json={
            "model": kwargs.get("model", MODEL),
            "messages": [{"role": "user", "content": content}],
            "temperature": kwargs.get("temperature", 0.3),
            "max_tokens": kwargs.get("max_tokens", 2048),
        },
        verify=False,
        timeout=120,
    )
    return resp.json()["choices"][0]["message"]["content"]


def qwen_text(prompt, **kwargs):
    resp = httpx.post(
        f"{BASE_URL.rstrip('/')}/chat/completions",
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}"},
        json={
            "model": kwargs.get("model", MODEL),
            "messages": [{"role": "user", "content": prompt}],
            "temperature": kwargs.get("temperature", 0.3),
            "max_tokens": kwargs.get("max_tokens", 4096),
        },
        verify=False,
        timeout=120,
    )
    return resp.json()["choices"][0]["message"]["content"]


def analyze_batch(frame_paths, batch_index, total_batches):
    """分析一批帧的时间点"""
    b64s = [encode_image(fp) for fp in frame_paths]
    # 提取帧的时间信息
    times = []
    for fp in frame_paths:
        m = re.search(r'frame_(\d+)s\.jpg', fp)
        if m:
            times.append(int(m.group(1)))
    time_str = "、".join([f"{t}秒" for t in times])

    text = f"""这是操作录屏的第{batch_index}/{total_batches}批，画面时间点为：{time_str}。
请分析这批帧中：1) 用户在操作什么 2) 操作顺序 3) 每个步骤的起止时间（基于画面时间点判断）

输出格式：
[开始秒-结束秒] 操作描述
每个步骤一行。用中文。"""

    return qwen_vl(text, b64s)


def main():
    frames = sorted([f for f in os.listdir(FRAMES_DIR) if f.endswith('.jpg')])
    print(f"Total frames: {len(frames)}", file=sys.stderr)

    batch_size = 5
    batches = [frames[i:i+batch_size] for i in range(0, len(frames), batch_size)]
    total = len(batches)

    all_analysis = []
    for i, batch in enumerate(batches, 1):
        print(f"\n--- Batch {i}/{total} ---", file=sys.stderr)
        paths = [os.path.join(FRAMES_DIR, f) for f in batch]
        desc = analyze_batch(paths, i, total)
        print(desc[:300], file=sys.stderr)
        all_analysis.append(desc)

    combined = "\n\n".join(all_analysis)

    # 保存原始分析
    out_path = os.path.join(os.path.dirname(FRAMES_DIR), "timeline_analysis.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_analysis, f, ensure_ascii=False, indent=2)
    print(f"\nAnalysis saved", file=sys.stderr)

    # 第二步：生成带时间标记的配音文案（保持用户原意，但适配实际时间线）
    user_script = """大家好，我是云小顾。接下来我给大家讲解子Request创建。
第一步，获取Master ID并获取相应信息。在Portal端搜索对应的项目，找到Request name带字符串-1或-2的Request即为Master ID，点击即可跳转获取ID详情。或者已知晓Master ID，可使用快捷查询，点击浏览器上Portal Helper，标识为绿色的P。
第二步，开始创建子Request。搜索对应的项目，点击进入提Request界面。在Request name处按照Master ID井号Request name的规则添加Master ID，并按照Master ID勾选对应的信息，如PIC、MIC、Charge code等，最后点击提交。"""

    timeline_prompt = f"""你是一位专业的视频配音导演。下面是对操作录屏的画面时间线分析，以及用户希望讲解的文案内容。

请将用户的文案内容，分配到画面时间线分析的各个时间段中。要求：
1. 严格遵守画面时间线的时间范围，不要超
2. 文案内容可以用更口语化、自然的语言重新组织，确保和时间点上的操作匹配
3. 每个时间段标注 [开始秒-结束秒]
4. 时间轴的结束不要超过最后一个有效操作的结束时间（约60秒左右）
5. 开头加上礼貌用语（已经包含在用户文案中）
6. 用中文，自然口语风格

画面时间线分析：
{combined}

用户文案：
{user_script}

输出格式要求：
[0-5] 大家好，我是云小顾……
[5-15] 第一步……
直接输出，每行一个时间段。总时长不要超过分析中最后一个操作的时间。"""

    result = qwen_text(timeline_prompt)
    print(f"\n=== 时间线文案 ===", file=sys.stderr)
    print(result)

    script_out = os.path.join(os.path.dirname(FRAMES_DIR), "timeline_script.txt")
    with open(script_out, "w", encoding="utf-8") as f:
        f.write(result)
    print(f"\nTimeline script saved", file=sys.stderr)


if __name__ == "__main__":
    main()
