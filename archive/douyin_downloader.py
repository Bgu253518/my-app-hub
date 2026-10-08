"""
抖音视频下载器
步骤1（一次性）: 在已登录抖音的 Edge 中按 F12 → Console → 粘贴下方代码 → 回车
步骤2: python douyin_downloader.py "抖音链接"
"""
import sys, os, json, subprocess, re

COOKIE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".douyin_cookies.json")

# ── 步骤1: 浏览器 Console 粘贴这段 ──────────────────────────
MANUAL_SCRIPT = """
// 在 Edge 中打开 https://www.douyin.com → 确认已登录
// 按 F12 → Console → 粘贴以下全部 → 回车
// 复制输出的内容，保存到 .douyin_cookies.json 文件

copy(JSON.stringify(document.cookie.split('; ').map(c => {
    const [k,v] = c.split('=');
    return {name:k, value:v||'', domain:'.douyin.com', path:'/'};
}), null, 2));
console.log('Cookie 已复制到剪贴板！去保存到文件');
"""

def download(video_url_or_id: str, output_dir: str = ".") -> str:
    if not os.path.exists(COOKIE_FILE):
        print(f"未找到 {COOKIE_FILE}")
        print("请先在浏览器中执行以下操作：")
        print(MANUAL_SCRIPT)
        return ""

    # 提取视频 ID
    vid = re.search(r'(\d{15,20})', video_url_or_id)
    vid = vid.group(1) if vid else video_url_or_id

    # 转换 Cookie 为 Netscape 格式
    with open(COOKIE_FILE) as f:
        cookies = json.load(f)

    jar = os.path.join(os.path.dirname(__file__), ".cookies.txt")
    with open(jar, "w") as f:
        f.write("# Netscape HTTP Cookie File\n")
        for c in cookies:
            f.write(f".douyin.com\tTRUE\t{c.get('path','/')}\tFALSE\t0\t{c['name']}\t{c.get('value','')}\n")

    output = os.path.join(os.path.abspath(output_dir), f"douyin_{vid}.mp4")
    os.makedirs(output_dir, exist_ok=True)

    cmd = ["python", "-m", "yt_dlp",
           f"https://www.douyin.com/video/{vid}",
           "-o", output, "--cookies", jar,
           "--no-playlist", "-f", "best[ext=mp4]"]

    print(f"下载: {vid} ...")
    r = subprocess.run(cmd, capture_output=True, text=True)
    print(r.stderr[-300:] if not os.path.exists(output) else f"完成: {output}")
    return output if os.path.exists(output) else ""


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法:")
        print("  1. 在 Edge 登录 douyin.com → F12 → Console")
        print("  2. 粘贴 MANUAL_SCRIPT 内容，复制输出")
        print("  3. 保存为 .douyin_cookies.json")
        print("  4. python douyin_downloader.py <链接>")
        sys.exit(1)

    print(download(sys.argv[1], os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")))
