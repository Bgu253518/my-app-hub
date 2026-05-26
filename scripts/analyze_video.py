"""
分析操作视频帧 → 生成配音文案
"""
import io, os, sys, json, base64
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

FRAMES_DIR = r"C:\Users\bgu\Desktop\claude code 项目管理\项目13-AI代码工作流\视频\frames"
API_KEY = os.environ.get("QWEN_API_KEY", "ak-FDST94LCXZKfFPl7L5gG9N1a9zgF24LD0GuLSjxTVCfz1BHw")
BASE_URL = os.environ.get("QWEN_BASE_URL", "https://nova.deloitte.com.cn/del/v1")
MODEL = os.environ.get("QWEN_MODEL", "Qwen3.5-VL")

import httpx


def encode_image(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def qwen_vl_chat(text, images_b64, **kwargs):
    """调用千问VL视觉API"""
    content = [{"type": "text", "text": text}]
    for b64 in images_b64:
        content.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}})

    resp = httpx.post(
        f"{BASE_URL.rstrip('/')}/chat/completions",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}",
        },
        json={
            "model": kwargs.get("model", MODEL),
            "messages": [{"role": "user", "content": content}],
            "temperature": kwargs.get("temperature", 0.3),
            "max_tokens": kwargs.get("max_tokens", 2048),
        },
        verify=False,
        timeout=kwargs.get("timeout", 120),
    )
    data = resp.json()
    return data["choices"][0]["message"]["content"]


def qwen_chat(prompt, **kwargs):
    """调用千问纯文本"""
    resp = httpx.post(
        f"{BASE_URL.rstrip('/')}/chat/completions",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}",
        },
        json={
            "model": kwargs.get("model", MODEL),
            "messages": [{"role": "user", "content": prompt}],
            "temperature": kwargs.get("temperature", 0.5),
            "max_tokens": kwargs.get("max_tokens", 4096),
        },
        verify=False,
        timeout=kwargs.get("timeout", 120),
    )
    data = resp.json()
    return data["choices"][0]["message"]["content"]


def analyze_batch(frame_paths, batch_index, total_batches):
    """分析一批帧，返回描述文本"""
    b64_images = [encode_image(fp) for fp in frame_paths]
    text = f"这是操作录屏的第{batch_index}/{total_batches}批。请详细描述这批帧中：1) 用户在操作什么软件/界面 2) 每一步操作了什么 3) 界面出现了什么变化。用中文回答，简洁清晰。"
    return qwen_vl_chat(text, b64_images)


def main():
    # 获取所有帧，按时间排序
    frames = sorted([f for f in os.listdir(FRAMES_DIR) if f.endswith('.jpg')])
    print(f"Total frames: {len(frames)}", file=sys.stderr)

    # 每批 5 帧
    batch_size = 5
    batches = [frames[i:i+batch_size] for i in range(0, len(frames), batch_size)]
    total = len(batches)
    print(f"Total batches: {total}", file=sys.stderr)

    all_descriptions = []

    for i, batch in enumerate(batches, 1):
        print(f"\n--- Batch {i}/{total} ---", file=sys.stderr)
        paths = [os.path.join(FRAMES_DIR, f) for f in batch]
        desc = analyze_batch(paths, i, total)
        print(f"Description: {desc[:200]}...", file=sys.stderr)
        all_descriptions.append({
            "batch": i,
            "frames": batch,
            "description": desc
        })

    # 保存原始分析
    with open(os.path.join(os.path.dirname(FRAMES_DIR), "analysis.json"), "w", encoding="utf-8") as f:
        json.dump(all_descriptions, f, ensure_ascii=False, indent=2)
    print(f"\nAnalysis saved to analysis.json", file=sys.stderr)

    # 第二步：基于分析生成配音文案
    combined = "\n\n".join([d["description"] for d in all_descriptions])
    script_prompt = f"""你是一位专业的软件操作培训讲师。基于以下对操作录屏的画面分析，写一段专业的口播配音文案。

要求：
1. 语言流畅自然，适合口播
2. 专业、清晰，让听众听懂每一步操作
3. 标注【停顿0.5秒】在需要停顿的地方
4. 不要出现"如图所示"、"从上图可见"等视觉词汇
5. 总时长约90-100秒（约450-550字）
6. 用中文

画面分析：
{combined}

直接输出配音文案，不要多余内容。"""

    script = qwen_chat(script_prompt)

    script_path = os.path.join(os.path.dirname(FRAMES_DIR), "script.txt")
    with open(script_path, "w", encoding="utf-8") as f:
        f.write(script)
    print(f"\nScript saved to script.txt", file=sys.stderr)
    print(script)


if __name__ == "__main__":
    main()
