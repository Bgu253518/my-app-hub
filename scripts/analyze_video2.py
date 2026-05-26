"""
分析子Request创建2-1视频 → 生成配音文案+时间线
"""
import io, os, sys, json, base64, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

FRAMES_DIR = r"C:\Users\bgu\Desktop\claude code 项目管理\项目13-AI代码工作流\视频\frames3"
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
            "temperature": 0.3, "max_tokens": 2048,
        },
        verify=False, timeout=120,
    )
    return resp.json()["choices"][0]["message"]["content"]

def qwen_text(prompt, **kwargs):
    resp = httpx.post(
        f"{BASE_URL.rstrip('/')}/chat/completions",
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}"},
        json={
            "model": kwargs.get("model", MODEL),
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3, "max_tokens": 4096,
        },
        verify=False, timeout=120,
    )
    return resp.json()["choices"][0]["message"]["content"]

def analyze_batch(frame_paths):
    b64s = [encode_image(fp) for fp in frame_paths]
    times = []
    for fp in frame_paths:
        m = re.search(r'frame_(\d+)s\.jpg', fp)
        if m:
            times.append(int(m.group(1)))
    time_str = "、".join([f"{t}秒" for t in times])
    text = f"这批画面时间点为：{time_str}。请描述每个时间点用户在操作什么，格式：[秒数]操作描述"
    return qwen_vl(text, b64s)

def main():
    frames = sorted([f for f in os.listdir(FRAMES_DIR) if f.endswith('.jpg')])
    batch_size = 5
    batches = [frames[i:i+batch_size] for i in range(0, len(frames), batch_size)]

    all_desc = []
    for i, batch in enumerate(batches, 1):
        print(f"Batch {i}/{len(batches)}...", file=sys.stderr)
        paths = [os.path.join(FRAMES_DIR, f) for f in batch]
        desc = analyze_batch(paths)
        print(desc[:200], file=sys.stderr)
        all_desc.append(desc)

    combined = "\n\n".join(all_desc)
    out = os.path.join(os.path.dirname(FRAMES_DIR), "analysis_video2.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(all_desc, f, ensure_ascii=False, indent=2)

    # 生成配音文案+时间线
    prompt = f"""你是一位软件培训讲师。基于以下画面分析，生成一段口播配音文案并分配时间点。

要求：
1. 用自然口语风格，面向审计人员
2. 每行标注 [开始秒-结束秒]
3. 时间线覆盖0~{104}秒，每段5~12秒
4. 直接描述操作，不需要自我介绍
5. 用中文

画面分析：
{combined}

输出格式：
[0-8] 文案内容
[8-16] 文案内容
..."""
    result = qwen_text(prompt)
    print(f"\n=== 时间线文案 ===", file=sys.stderr)
    print(result)

    script_out = os.path.join(os.path.dirname(FRAMES_DIR), "timeline_script3.txt")
    with open(script_out, "w", encoding="utf-8") as f:
        f.write(result)
    print(f"\nSaved to timeline_script3.txt", file=sys.stderr)

if __name__ == "__main__":
    main()
