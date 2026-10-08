"""核心处理引擎 — 纯业务逻辑，零界面依赖（规范红线：禁止 import webview/tkinter/PySimpleGUI）
对外通信只通过两个 callback：
  progress_callback(done, total, msg)   进度：界面拿它画进度条
  log_callback(msg)                     日志：界面拿它写日志盒
好处（出处：项目3 数据清洗）：引擎可单独运行、单独测试、单独检查——
这就是「分块方便检查」的落点。界面换 tkinter/web/exe 都动不了这里。
"""
import os
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

import config
import excel_io


def process(folder, output_path=None,
            progress_callback=None, log_callback=None):
    """合并文件夹内所有表格为一个汇总表。

    参数:
        folder:            源文件夹路径
        output_path:       输出 xlsx 路径；None 则默认 源文件夹\合并汇总_时间戳.xlsx
        progress_callback: (已完成数, 总数, 阶段文字) -> None，可为 None
        log_callback:      (文字) -> None，可为 None
    返回:
        dict(success, output, rows, files, error, suggestion)
        —— 错误一定带 suggestion（建议怎么办），出处：项目27「错误消息带建议」实践
    """
    def log(m):
        if log_callback:
            log_callback(m)

    def prog(done, total, msg):
        if progress_callback:
            progress_callback(done, total, msg)

    # ── 1. 校验输入（任何"用户的输入"都要先验，报错带建议）──
    if not folder or not os.path.isdir(excel_io._lp(folder)):
        return {"success": False, "error": f"文件夹不存在：{folder}",
                "suggestion": "点「浏览…」重新选择；注意 OneDrive 文件夹要已同步到本地"}

    files = excel_io.list_excel_files(folder)
    if not files:
        return {"success": False,
                "error": f"文件夹内没有可合并的表格（{sorted(config.SUPPORTED_EXTS)}）",
                "suffix": "", "suggestion": "确认文件放在所选文件夹的第一层（不递归子文件夹）"}
    if len(files) > config.MAX_FILES:
        return {"success": False, "error": f"文件数量 {len(files)} 超过护栏 {config.MAX_FILES}",
                "suggestion": "分批次合并，或确认没有误选大目录"}

    # ── 2. 逐文件读取合并（O(n) 单次遍历，出处：项目5 的 dict 索引思想同族）──
    import pandas as pd
    frames = []
    total = len(files)
    for i, fp in enumerate(files, 1):
        name = os.path.basename(fp)
        prog(i - 1, total, f"正在读取 {i}/{total}：{name}")
        log(f"读取 {name}")
        df = excel_io.read_table(fp)
        if df is None or df.empty:
            log(f"⚠️ 跳过 {name}（读不到数据或为空表）")
            continue
        # 跳过合计/小计行，避免重复计数（关键词表在 config.py，不许写在这里）
        first_col = df.columns[0]
        mask = df[first_col].astype(str).str.strip().str.lower().isin(
            {k.lower() for k in config.SKIP_ROW_KEYWORDS})
        dropped = int(mask.sum())
        if dropped:
            log(f"   剔除 {dropped} 行合计/小计")
            df = df[~mask]
        df[config.COL_SOURCE] = name            # 来源标记：可追溯，出处：项目16
        df[config.COL_SHEET] = ""
        frames.append(df)
        prog(i, total, f"已读取 {i}/{total}")

    if not frames:
        return {"success": False, "error": "所有文件都没读到有效数据",
                "suggestion": "把 tools/_logs 里今天的日志发给作者，帮你定位格式问题"}

    # ── 3. 汇总输出（列取并集，缺失补空——不同文件的列不完全一样也兜得住）──
    prog(total, total, "正在合并写出…")
    merged = pd.concat(frames, ignore_index=True, sort=False)
    if not output_path:
        stamp = __import__("datetime").datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = os.path.join(folder, f"合并汇总_{stamp}.xlsx")
    try:
        excel_io.atomic_save(merged, output_path, log_func=log)
    except PermissionError:
        return {"success": False, "error": f"输出文件被占用：{output_path}",
                "suggestion": "关闭已打开的输出文件（Excel 占用时无法覆盖），再试一次"}
    except Exception as e:
        return {"success": False, "error": f"写出失败：{e}",
                "suggestion": "把 tools/_logs 里今天的日志发给作者"}

    log(f"✅ 完成：{len(files)} 个文件 → {len(merged)} 行 → {output_path}")
    return {"success": True, "output": output_path,
            "rows": len(merged), "files": len(files)}


if __name__ == "__main__":
    # 引擎自检（验收清单第 4 项）：不启动界面直接跑，证明引擎零 UI 依赖
    if len(sys.argv) < 2:
        print("用法: python core_engine.py <文件夹路径>")
        sys.exit(1)
    r = process(sys.argv[1], progress_callback=lambda d, t, m: print(f"[{d}/{t}] {m}"))
    print(r)
