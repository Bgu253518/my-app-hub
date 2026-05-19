# -*- coding: utf-8 -*-
"""
五虾流水线 - 自媒体创作系统  🦞🦞🦞🦞🦞
完全中文版 · 可视化提取过程
"""

import os, re, json, time, urllib.parse, sys, requests
from datetime import datetime
from pathlib import Path
import streamlit as 流

# ============================================================
# 环境修复
# ============================================================
os.environ["PYTHONIOENCODING"] = "utf-8"

# ============================================================
# 工作目录
# ============================================================
工作目录 = r"C:\Users\86152\Desktop\PYTHON"

def 确保目录存在(路径):
    Path(路径).mkdir(parents=True, exist_ok=True)

def 写入文件(文件路径, 内容):
    with open(文件路径, "w", encoding="utf-8") as f:
        f.write(内容)

def 读取文件(文件路径):
    if not os.path.exists(文件路径):
        return ""
    with open(文件路径, "r", encoding="utf-8") as f:
        return f.read()

def 日志(消息):
    时间 = datetime.now().strftime("%H:%M:%S")
    print(f"[{时间}] {消息}")

def 抓取网页(链接):
    """抓取网页内容并提取标题和正文"""
    try:
        请求头 = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        响应 = requests.get(链接, timeout=15, headers=请求头)
        if 响应.status_code != 200:
            return None, f"HTTP {响应.status_code}"
        
        html = 响应.text
        # 提取标题
        标题 = ""
        标题匹配 = re.search(r'<title[^>]*>(.*?)</title>', html, re.I | re.S)
        if 标题匹配:
            标题 = 标题匹配.group(1).strip()
        
        # 去除脚本和样式
        正文 = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.I | re.S)
        正文 = re.sub(r'<style[^>]*>.*?</style>', '', 正文, flags=re.I | re.S)
        # 提取纯文本
        正文 = re.sub(r'<[^>]+>', '', 正文)
        正文 = re.sub(r'\s+', ' ', 正文).strip()
        # 只取前2000字作为有效内容
        if len(正文) > 2000:
            正文 = 正文[:2000] + "……"
        
        return 标题, 正文
    except Exception as e:
        return None, f"抓取失败：{e}"

def 今天():
    return datetime.now().strftime("%Y-%m-%d")

def 每日目录():
    路径 = os.path.join(工作目录, "每日工作")
    确保目录存在(路径)
    return 路径

def 日志目录():
    路径 = os.path.join(工作目录, "生产日志")
    确保目录存在(路径)
    return 路径

# ============================================================
# AI 调用
# ============================================================
def 调用AI(提示词, 系统提示="", 最大令牌数=2000, 密钥="", ai引擎="演示"):
    if not 密钥 or ai引擎 == "演示":
        return f"【演示模式占位】\n配置密钥并选择引擎后，这里会由AI生成真实内容。\n请求：{提示词[:60]}…"
    if ai引擎 == "克劳德":
        try:
            import anthropic
            客户端 = anthropic.Anthropic(api_key=密钥)
            响应 = 客户端.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=最大令牌数,
                system=系统提示,
                messages=[{"role": "user", "content": 提示词}]
            )
            return 响应.content[0].text
        except ImportError:
            return "【错误】请运行：pip install anthropic"
        except Exception as e:
            return f"【克劳德调用失败】{e}"
    if ai引擎 == "深度求索":
        try:
            import requests
            请求头 = {"Authorization": f"Bearer {密钥}", "Content-Type": "application/json"}
            消息列表 = []
            if 系统提示:
                消息列表.append({"role": "system", "content": 系统提示})
            消息列表.append({"role": "user", "content": 提示词})
            请求体 = {"model": "deepseek-chat", "messages": 消息列表, "max_tokens": 最大令牌数}
            响应 = requests.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers=请求头, json=请求体, timeout=60
            )
            if 响应.status_code != 200:
                return f"【深度求索错误】HTTP {响应.status_code}: {响应.text[:200]}"
            return 响应.json()["choices"][0]["message"]["content"]
        except Exception as e:
            return f"【深度求索调用失败】{e}"
    return f"【错误】未知AI引擎：{ai引擎}"

# ============================================================
# 五虾核心函数
# ============================================================
def 解析信源():
    """解析信源文件，返回 [(链接, 来源名称, 分类, 描述), ...]"""
    原文 = 读取文件(os.path.join(工作目录, "我的信源.txt"))
    行列表 = 原文.splitlines()
    结果 = []
    当前来源名 = ""
    当前描述 = ""
    当前分类 = "未分类"
    
    for 行 in 行列表:
        行 = 行.strip()
        if not 行:
            continue
        # 注释行：提取来源信息
        if 行.startswith("#"):
            # 匹配【名称】格式
            名称匹配 = re.search(r'【(.+?)】', 行)
            if 名称匹配:
                当前来源名 = 名称匹配.group(1)
            # 匹配分类
            if '官方媒体' in 行:
                当前分类 = '官方媒体'
            elif '社交平台' in 行 or '社区' in 行:
                当前分类 = '社交平台'
            # 取 # 后的描述文字（去掉【】部分）
            描述文本 = 行.lstrip("# ").strip()
            描述文本 = re.sub(r'【.+?】', '', 描述文本).strip()
            if 描述文本 and not 描述文本.startswith("http"):
                当前描述 = 描述文本
            continue
        
        # URL行
        if 行.startswith("http"):
            结果.append((行, 当前来源名, 当前分类, 当前描述))
            # 重置（同一个URL后面的注释会覆盖）
            当前描述 = ""
    
    return 结果

def 虾1_侦察热点(密钥, ai引擎):
    日志("🦞1 侦察热点")
    开始 = time.time()
    信源列表 = 解析信源()
    if not 信源列表:
        信源列表.append(("https://example.com/article/women-relationship-tips", "示例信源", "未分类", "示例文章"))
        日志("⚠️ 信源为空，已添加示例信源")

    话题列表 = []
    for i, (链接, 来源名, 分类, 描述) in enumerate(信源列表, 1):
        域名 = urllib.parse.urlparse(链接).netloc
        日志(f"  📡 抓取：{来源名 or 域名}")
        
        # 抓取网页内容
        标题, 正文 = 抓取网页(链接)
        
        if 标题:
            内容片段 = f"标题：{标题}\n正文摘要：{正文[:800]}……"
            日志(f"  ✅ 成功：{标题[:40]}…")
        else:
            内容片段 = f"无法抓取内容（{正文}），使用链接作为参考"
            日志(f"  ⚠️ {正文}")
        
        # 标注来源
        来源标注 = f"{来源名}（{域名}）" if 来源名 else 域名
        if 分类 != "未分类":
            来源标注 += f" · {分类}"
        
        # 调用AI分析
        结果 = 调用AI(
            f"""请分析以下文章，生成一句话话题摘要并打标签。

文章来源：{来源标注}
{内容片段}

输出格式：[标签] 话题摘要
可选标签：[隔代][婚恋][社交][代际][亲子][婆媳][职场][自我成长][金钱观][价值观]""",
            "资深情感编辑", 500, 密钥, ai引擎
        ).strip()
        if not 结果.startswith("["):
            结果 = f"[情感] {结果}"
        话题列表.append(f"{结果} — 来源：{来源标注}")

    话题池 = f"# 今日情感话题简报 - {今天()}\n\n"
    for idx, 话题 in enumerate(话题列表, 1):
        话题池 += f"{idx}. {话题}\n"
    话题池 += f"\n---\n共 {len(话题列表)} 个话题 | {datetime.now():%Y-%m-%d %H:%M:%S}"
    写入文件(os.path.join(每日目录(), "1_话题池.md"), 话题池)
    日志("✅ 话题池已生成")
    return 话题池, time.time() - 开始

def 虾2_创作内容(序号, 密钥, ai引擎):
    日志("🦞2 创作内容")
    开始 = time.time()
    话题池 = 读取文件(os.path.join(每日目录(), "1_话题池.md"))
    话题 = ""
    来源信息 = ""
    for 行 in 话题池.splitlines():
        if 行.strip().startswith(f"{序号}."):
            话题 = re.sub(r'^\d+\.\s*', '', 行.strip())
            # 提取来源信息
            来源匹配 = re.search(r'— 来源：(.*?)$', 话题)
            if 来源匹配:
                来源信息 = 来源匹配.group(1).strip()
                话题 = re.sub(r'\s*—\s*来源：.*$', '', 话题)
            break
    if not 话题:
        话题 = "[情感] 当代人的社交困境"
        来源信息 = "示例来源"
    
    初稿 = 调用AI(
        f"""以第一人称，写一篇600-800字公众号情感文章。
话题：{话题}
素材来源：{来源信息}

要求：
1. 亲切温暖，像朋友聊天
2. 在文章开头注明"本文素材来源于{来源信息}"
3. 用【】标记至少2处需手动修改
4. 结尾设置互动提问""",
        "公众号情感写手", 2500, 密钥, ai引擎
    )
    写入文件(os.path.join(每日目录(), "2_初稿.md"), 初稿)
    日志("✅ 初稿已生成")
    return 初稿, time.time() - 开始

def 虾3_格式化排版():
    日志("🦞3 格式化排版")
    开始 = time.time()
    文本 = 读取文件(os.path.join(每日目录(), "2_初稿.md"))
    if not 文本:
        文本 = "（初稿为空）"
    段落列表 = 文本.split("\n\n")
    输出列表 = []
    for i, 段落 in enumerate(段落列表):
        段落 = 段落.strip()
        if not 段落:
            输出列表.append("")
            continue
        if i == 0 and len(段落) < 50 and not 段落.startswith("#"):
            输出列表.append(f"## {段落}")
        else:
            输出列表.append(段落)
        if i in (1, 3) and i < len(段落列表) - 1:
            关键词 = 段落[:20]
            if any(w in 关键词 for w in ["爱情","恋爱","婚姻","夫妻","伴侣"]):
                输出列表.append("（此处建议配一张温馨的夫妻或情侣背影的图片）")
            elif any(w in 关键词 for w in ["孩子","父母","老人","家庭","亲子"]):
                输出列表.append("（此处建议配一张家庭聚会的温馨图片）")
            elif any(w in 关键词 for w in ["工作","职场","同事","奋斗"]):
                输出列表.append("（此处建议配一张咖啡厅或办公室的图片）")
            else:
                输出列表.append("（此处建议配一张温暖的生活场景图片）")
    排版结果 = "\n\n".join(输出列表)
    写入文件(os.path.join(每日目录(), "3_排版版.md"), 排版结果)
    日志("✅ 排版版已生成")
    return 排版结果, time.time() - 开始

def 虾4_审核(密钥, ai引擎):
    日志("🦞4 审核")
    开始 = time.time()
    文本 = 读取文件(os.path.join(每日目录(), "3_排版版.md"))[:3000]
    报告 = 调用AI(
        f"""审核以下公众号文章：
{文本}
输出格式：
## 审核报告
### 错别字与语法
### 敏感词检查
### 情感浓度评估
### 可读性评估
### 修改建议
### 综合评分：X/10""",
        "内容审核编辑", 2000, 密钥, ai引擎
    )
    写入文件(os.path.join(每日目录(), "4_审核报告.md"), 报告)
    日志("✅ 审核报告已生成")
    return 报告, time.time() - 开始

def 虾5_保存日志(序号, 耗时记录):
    日志("🦞5 保存日志")
    开始 = time.time()
    今日 = 今天()
    条目 = f"""
========================================
  五虾流水线 - 生产日志
  日期：{今日}  {datetime.now():%Y-%m-%d %H:%M:%S}
========================================
  选定话题编号：{序号}
⏱ 耗时：
{chr(10).join(f'  {k}: {v:.1f}秒' for k,v in 耗时记录.items())}
📁 输出：
  1_话题池.md | 2_初稿.md | 3_排版版.md
  4_审核报告.md | 6_公众号发布包.txt
✅ 状态：完成
"""
    写入文件(os.path.join(日志目录(), f"日志_{今日}.txt"), 条目)
    写入文件(os.path.join(工作目录, "5_生产日志.txt"), 条目)

def 生成发布包():
    排版结果 = 读取文件(os.path.join(每日目录(), "3_排版版.md"))
    审核报告 = 读取文件(os.path.join(每日目录(), "4_审核报告.md"))
    标题 = "（未提取到标题）"
    for 行 in 排版结果.splitlines():
        if 行.startswith("## "):
            标题 = 行.replace("## ", "").strip()
            break
    发布包 = f"""
========================================
  公众号发布包  {今天()}
========================================
📰 标题：{标题}
📝 正文：
{排版结果}
🔍 审核意见：
{审核报告}
✅ 建议修改：
1. 替换文中【】标记内容
2. 处理审核报告中的问题
3. 确认图片占位符
"""
    写入文件(os.path.join(每日目录(), "6_公众号发布包.txt"), 发布包)
    return 发布包

# ============================================================
# Streamlit 界面
# ============================================================
流.set_page_config(page_title="五虾流水线", page_icon="🦞", layout="wide")

流.markdown("""
<style>
    .stApp { background:#FFF8F0; }
    h1 { font-size:34px !important; color:#D2691E !important; }
    h2 { font-size:26px !important; color:#D2691E !important; }
    h3 { font-size:22px !important; }
    p,li,label,.stText,.stMarkdown { font-size:18px !important; }
    .stButton button {
        font-size:18px !important; padding:10px 28px !important;
        background:#D2691E !important; color:white !important;
        border:none !important; border-radius:10px !important;
    }
    .stButton button:hover { background:#B86114 !important; }
</style>
""", unsafe_allow_html=True)

# 会话状态
for 键 in ["步骤","虾1结果","虾2结果","虾3结果","虾4结果","虾5结果","发布包","已运行"]:
    if 键 not in 流.session_state:
        流.session_state[键] = 0 if 键 == "步骤" else ""
流.session_state.setdefault("已运行", False)

# ============================================================
# 页头
# ============================================================
流.markdown("<h1>🦞 五虾流水线 · 自媒体创作系统</h1>", unsafe_allow_html=True)
流.markdown(f"📅 {datetime.now():%Y年%m月%d日 %A}")

# ---- 侧边栏 ----
with 流.sidebar:
    流.markdown("## ⚙️ 设置")
    with 流.container():
        流.markdown(f'<div style="background:#FFF5E6;padding:15px;border-radius:10px;margin-bottom:12px;">', unsafe_allow_html=True)
        密钥 = 流.text_input("🔑 API 密钥", type="password", help="留空则使用演示模式")
        AI模型选择 = 流.selectbox("🤖 AI 模型", ["演示", "深度求索", "克劳德"],
                               help="选择AI引擎，演示模式无需密钥也能跑通全流程")
        流.markdown('</div>', unsafe_allow_html=True)

    with 流.container():
        流.markdown(f'<div style="background:#FFF5E6;padding:15px;border-radius:10px;margin-bottom:12px;text-align:center;">', unsafe_allow_html=True)
        步骤数 = 流.session_state.步骤
        流.markdown("### 📊 流水线进度")
        流.markdown(f'<span style="font-size:36px;font-weight:bold;color:#D2691E;">{步骤数} / 6</span>', unsafe_allow_html=True)
        流.progress(步骤数 / 6 if 步骤数 > 0 else 0.0)
        流.markdown('</div>', unsafe_allow_html=True)

    with 流.container():
        流.markdown(f'<div style="background:#FFF5E6;padding:15px;border-radius:10px;margin-bottom:12px;">', unsafe_allow_html=True)
        if 流.session_state.get("运行中", False):
            流.warning("⏳ 流水线运行中，请查看下方实时状态…")
        else:
            if 流.button("🚀 一键生成全部文件", use_container_width=True):
                流.session_state.运行中 = True
                流.session_state.步骤 = 0
                流.session_state.虾1结果 = ""
                流.session_state.虾2结果 = ""
                流.session_state.虾3结果 = ""
                流.session_state.虾4结果 = ""
                流.session_state.虾5结果 = ""
                流.session_state.发布包 = ""
                with 流.spinner("🦞 五虾正在工作中，请稍候…"):
                    try:
                        耗时记录 = {}
                        # ---- 虾1 ----
                        流.session_state.步骤 = 1
                        虾1输出, t = 虾1_侦察热点(密钥, AI模型选择)
                        耗时记录["虾1"] = t
                        流.session_state.虾1结果 = 虾1输出

                        # ---- 虾2 ----
                        流.session_state.步骤 = 2
                        虾2输出, t = 虾2_创作内容(1, 密钥, AI模型选择)
                        耗时记录["虾2"] = t
                        流.session_state.虾2结果 = 虾2输出

                        # ---- 虾3 ----
                        流.session_state.步骤 = 3
                        虾3输出, t = 虾3_格式化排版()
                        耗时记录["虾3"] = t
                        流.session_state.虾3结果 = 虾3输出

                        # ---- 虾4 ----
                        流.session_state.步骤 = 4
                        虾4输出, t = 虾4_审核(密钥, AI模型选择)
                        耗时记录["虾4"] = t
                        流.session_state.虾4结果 = 虾4输出

                        # ---- 发布包 ----
                        流.session_state.步骤 = 5
                        发布包 = 生成发布包()
                        流.session_state.发布包 = 发布包

                        # ---- 虾5 ----
                        虾5_保存日志(1, 耗时记录)
                        流.session_state.步骤 = 6
                        流.session_state.虾5结果 = f"✅ 生产日志已保存至：{日志目录()}\\日志_{今天()}.txt"

                        流.session_state.已运行 = True
                    finally:
                        流.session_state.运行中 = False
                流.rerun()
        流.markdown('</div>', unsafe_allow_html=True)

    with 流.container():
        流.markdown(f'<div style="background:#FFF5E6;padding:15px;border-radius:10px;margin-bottom:12px;">', unsafe_allow_html=True)
        if 流.button("📂 打开每日工作文件夹", use_container_width=True):
            try:
                os.startfile(每日目录())
            except:
                流.error("打开失败")
        流.markdown('</div>', unsafe_allow_html=True)
    流.markdown("💡 留空密钥=演示模式，一键跑通全流程")

# ============================================================
# 主面板：五虾处理过程可视化
# ============================================================
流.markdown("---")

五虾数据 = [
    ("🦞1", "侦察热点", "扫描信源 → 提取链接 → AI分析 → 生成话题池",
     "1_话题池.md", "虾1结果", "#FFF5E6", "#F4A460"),
    ("🦞2", "创作内容", "读取话题 → AI扩写 → 生成600-800字文章 → 保存初稿",
     "2_初稿.md", "虾2结果", "#FFF5E6", "#F4A460"),
    ("🦞3", "格式化排版", "读取初稿 → 标题加## → 插入图片占位符 → 保存排版版",
     "3_排版版.md", "虾3结果", "#FFF5E6", "#F4A460"),
    ("🦞4", "审核", "读取排版 → AI审核错别字/敏感词 → 评分 → 生成审核报告",
     "4_审核报告.md", "虾4结果", "#FFF5E6", "#F4A460"),
    ("🦞5", "保存日志", "汇总耗时 → 记录日期/步骤 → 保存生产日志 → 清理完成",
     "日志文件", "虾5结果", "#FFF5E6", "#F4A460"),
]

for idx, (虾号, 名称, 流程描述, 文件名, 结果键, 底色, 边框色) in enumerate(五虾数据):
    步骤序号 = idx + 1
    结果内容 = 流.session_state.get(结果键, "")

    # 判断状态
    if 结果内容:
        状态文字 = "✅ 已完成"
        标记底色 = "#C8E6C9"
        标记文字色 = "#2E7D32"
        卡片边框 = "3px solid #2E7D32"
        卡片底色 = "#F1F8E9"
    elif 流.session_state.运行中 and 流.session_state.步骤 >= 步骤序号:
        状态文字 = "⏳ 运行中"
        标记底色 = "#FFF3E0"
        标记文字色 = "#E65100"
        卡片边框 = "3px solid #F9A825"
        卡片底色 = "#FFF8E1"
    else:
        状态文字 = "⏸ 等待中"
        标记底色 = "#E0E0E0"
        标记文字色 = "#757575"
        卡片边框 = "3px solid #E0C090"
        卡片底色 = "#FFF5E6"

    流.markdown(f"""
    <div style="background:{卡片底色};border:{卡片边框};border-radius:15px;
                padding:20px;margin:12px 0;box-shadow:0 4px 8px rgba(0,0,0,.08);">
        <div style="display:flex;align-items:center;justify-content:space-between;">
            <div>
                <span style="font-size:28px;font-weight:bold;">{虾号} {名称}</span>
                <span style="display:inline-block;padding:4px 16px;border-radius:20px;
                            font-size:15px;font-weight:bold;background:{标记底色};
                            color:{标记文字色};margin-left:12px;">{状态文字}</span>
            </div>
        </div>
        <p style="font-size:16px;color:#8B7355;margin:8px 0 0 0;">📋 {流程描述}</p>
        <p style="font-size:15px;color:#A08060;margin:4px 0 0 0;">📁 → {文件名}</p>
    </div>
    """, unsafe_allow_html=True)

    # 如果该虾已完成，展开显示提取结果
    if 结果内容:
        with 流.expander(f"📖 查看 {虾号} {名称} 的提取结果", expanded=True):
            流.text_area("", 结果内容, height=250, label_visibility="collapsed")

# ---- 底部：公众号发布包 ----
流.markdown("---")
流.markdown("## 📦 公众号发布包（最终产物）")
发布包内容 = 流.session_state.发布包 or 读取文件(os.path.join(每日目录(), "6_公众号发布包.txt"))
if 发布包内容:
    流.text_area("发布包", 发布包内容, height=400, label_visibility="collapsed")
else:
    流.info("点击侧边栏「一键生成全部文件」，所有产物会自动生成并展示在这里 👆")

流.markdown("---")
流.markdown('<div style="text-align:center;color:#8B7355;font-size:14px;padding:15px;">🦞 五虾流水线 · 全自动自媒体创作系统 ❤️</div>', unsafe_allow_html=True)
