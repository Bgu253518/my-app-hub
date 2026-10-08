"""网页界面入口 — 只做"JS 可调用的 Api"和窗口创建，零业务逻辑（业务在 core_engine.py）
Api 标准五方法（出处：项目27 范式 + 工具箱母版 toolbox.js 契约）：
  choose_file / get_sheets / get_columns（按需）/ run_xxx / open_folder / suggest_out_dir / open_guide
每个方法 try/except 后返回 {"success": ...} 或 {"success": False, "error", "suggestion"}，
前端永远拿到结构化结果，不会白屏。
"""
import os
import sys
from pathlib import Path

_HERE = os.path.dirname(os.path.abspath(__file__))          # .../项目N-新工具名/web
_ROOT = os.path.dirname(_HERE)                                # .../项目N-新工具名
_TOOLS_ROOT = os.path.dirname(_ROOT)                          # tools/
for p in (_ROOT, _TOOLS_ROOT):
    if p not in sys.path:
        sys.path.insert(0, p)

# ① 异常钩子 ② stderr 兜底（规范 3.1，两段一起拷）
try:
    import io as _io
    _s = sys.stderr or sys.stdout or _io.StringIO()
    if hasattr(_s, "reconfigure"):
        try: _s.reconfigure(errors="replace")
        except Exception: pass
except Exception:
    pass
try:
    from _common_utils import install_exception_hook
    install_exception_hook("项目N-多Excel合并汇总")
except Exception:
    pass

import webview
import core_engine  # noqa: E402  引擎在本工具根目录

APP_TITLE = "多Excel合并汇总 · 菡"   # 品牌签名格式：工具名 · 菡（规范第六章）


class Api:
    """暴露给 JavaScript 的 API。每个方法都包 try/except + 结构化返回。"""

    def choose_folder(self) -> dict:
        """弹系统文件夹选择框（选文件夹用这个；选文件用 OPEN_DIALOG）"""
        try:
            r = webview.windows[0].create_file_dialog(webview.FOLDER_DIALOG)
            if r:
                return {"success": True, "path": r[0]}
            return {"success": False, "error": "未选择文件夹"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def run_merge(self, folder: str, output_dir: str = "") -> dict:
        """后台线程跑引擎——界面不卡（出处：项目18 手工线程 + daemon）"""
        try:
            import threading
            t = threading.Thread(
                target=self._run, args=(folder, output_dir), daemon=True)
            t.start()
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _run(self, folder, output_dir):
        """引擎调用统一出口：异常不外抛，错误经 progress 通道回给前端"""
        def on_progress(done, total, msg):
            try:
                win = webview.windows[0]
                win.evaluate_js(
                    f"window.__onProgress && window.__onProgress({done},{total},'{msg}')")
            except Exception:
                pass
        try:
            r = core_engine.process(folder, output_dir or None,
                                    progress_callback=on_progress,
                                    log_callback=lambda m: on_progress(0, 0, m))
            self._emit("window.__onDone && window.__onDone(" + __import__("json").dumps(r) + ")")
        except Exception as e:
            self._emit("window.__onDone && window.__onDone(" + __import__("json").dumps(
                {"success": False, "error": str(e), "suggestion": "把 tools/_logs 里今天的日志发给作者"}) + ")")

    def _emit(self, js: str):
        try:
            webview.windows[0].evaluate_js(js)
        except Exception:
            pass

    def open_folder(self, path: str) -> dict:
        try:
            folder = os.path.dirname(path) or os.path.expanduser("~")
            os.startfile(folder)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # —— 以下两个供母版调用（toolbox.js / guide.js 的契约，工具侧必须有）——
    def suggest_out_dir(self, src=None) -> dict:
        try:
            from _webui import suggest_output_dir
            return {"success": True, "result": suggest_output_dir(src)}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def open_guide(self):
        """📖 按钮入口：打开本工具的操作指引 PDF（guide.js 契约）"""
        try:
            from _webui import find_tool_guide
            pdf = find_tool_guide(_ROOT)
            if pdf:
                os.startfile(pdf)
                return "ok"
            return "未找到 操作指引.pdf（应放在工具目录下）"
        except Exception as e:
            return f"打开失败：{e}"


def main():
    api = Api()
    html_uri = Path(os.path.join(_HERE, "index.html")).as_uri()

    # 窗口双层降级（出处：项目27）：公共层优先（统一 0.55×0.8 居中），失败自建
    try:
        from _webui import create_webview_window, start as webui_start
        win = create_webview_window(APP_TITLE, html_uri, js_api=api)
        webui_start(win)
        return
    except ImportError:
        pass
    win = webview.create_window(APP_TITLE, html_uri, js_api=api, width=1100, height=760)
    webview.start(win, gui="edgechromium")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        import traceback
        traceback.print_exc()
        try:
            import tkinter.messagebox
            tkinter.messagebox.showerror("启动失败", traceback.format_exc())
        except Exception:
            pass
