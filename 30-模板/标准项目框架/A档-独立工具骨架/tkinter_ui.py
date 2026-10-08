"""tkinter 第二界面 — 同事电脑没有现代浏览器/Edge WebView 损坏时的兜底
与 web 界面共用同一份 core_engine.py（A/B 档共用引擎的铁证，出处：项目27 双界面实践）。
颜色常量表与 web 端语义色一一对应（出处：项目27 gui_tkinter.py）。
引擎 import 失败优雅降级（HAS_ENGINE=False），界面照样能开、能报错带建议。
"""
import os
import sys
import threading
import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext, ttk

_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

try:
    import core_engine
    HAS_ENGINE = True
except ImportError as e:
    HAS_ENGINE = False
    _IMPORT_ERR = str(e)

APP_TITLE = "多Excel合并汇总 · 菡"   # 品牌签名格式统一（规范第六章）

# ── 颜色常量（与 web/style.css 令牌对应）──
C_HEADER_BG = "#1a3a5c"
C_BLUE = "#4472C4"; C_GREEN = "#70AD47"; C_ORANGE = "#C55A11"
C_BG = "#f0f2f5"; C_CARD = "#FFFFFF"; C_TEXT = "#212121"
C_MUTED = "#6b7280"; C_LOG_BG = "#0f1720"; C_LOG_TEXT = "#d3e0ef"
C_MATCH = "#C6EFCE"; C_DIFF = "#FFC7CE"


class TkApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title(APP_TITLE)
        self.root.geometry("760x600")
        self.root.minsize(640, 520)
        self.root.configure(bg=C_BG)

        # ── 顶栏 ──
        header = tk.Frame(root, bg=C_HEADER_BG)
        header.pack(fill="x")
        tk.Label(header, text="多Excel合并汇总", bg=C_HEADER_BG, fg="#fff",
                 font=("Microsoft YaHei", 13, "bold")).pack(side="left", padx=14, pady=8)
        tk.Label(header, text="同结构表格一键合并 · 每行带来源标记",
                 bg=C_HEADER_BG, fg="#cfd8e3", font=("Microsoft YaHei", 9)).pack(side="left", pady=8)

        # ── 参数区（卡片式区块）──
        body = tk.Frame(root, bg=C_BG)
        body.pack(fill="both", expand=True, padx=12, pady=10)

        card1 = tk.Frame(body, bg=C_CARD, highlightbackground="#d9dde3", highlightthickness=1)
        card1.pack(fill="x", pady=(0, 8))
        tk.Label(card1, text="📂 数据源", bg=C_CARD, fg=C_HEADER_BG,
                 font=("Microsoft YaHei", 10, "bold")).pack(anchor="w", padx=10, pady=(8, 4))
        row = tk.Frame(card1, bg=C_CARD)
        row.pack(fill="x", padx=10, pady=(0, 8))
        tk.Label(row, text="源文件夹", bg=C_CARD, fg=C_MUTED, width=10, anchor="e").pack(side="left")
        self.folder_var = tk.StringVar()
        tk.Entry(row, textvariable=self.folder_var, font=("Microsoft YaHei", 10)).pack(
            side="left", fill="x", expand=True, padx=6)
        # 蓝 = 选择职能
        tk.Button(row, text="浏览…", bg=C_BLUE, fg="#fff", relief="flat",
                  command=self._pick_folder).pack(side="left")

        # ── 操作行 ──
        row2 = tk.Frame(card1, bg=C_CARD)
        row2.pack(fill="x", padx=10, pady=(0, 10))
        # 绿 = 执行职能；运行期间禁用防连点
        self.btn_run = tk.Button(row2, text="▶ 开始合并", bg=C_GREEN, fg="#fff",
                                 relief="flat", font=("Microsoft YaHei", 10, "bold"),
                                 command=self._run, state=("normal" if HAS_ENGINE else "disabled"))
        self.btn_run.pack(side="left")
        if not HAS_ENGINE:
            tk.Label(row2, text=f"引擎导入失败：{_IMPORT_ERR}", bg=C_CARD, fg=C_DIFF).pack(side="left", padx=8)

        # ── 日志盒（深色 Console 风，与 web 端一致）──
        card2 = tk.Frame(body, bg=C_CARD, highlightbackground="#d9dde3", highlightthickness=1)
        card2.pack(fill="both", expand=True)
        tk.Label(card2, text="日志", bg=C_CARD, fg=C_HEADER_BG,
                 font=("Microsoft YaHei", 10, "bold")).pack(anchor="w", padx=10, pady=(8, 4))
        self.log = scrolledtext.ScrolledText(card2, bg=C_LOG_BG, fg=C_LOG_TEXT,
                                             font=("Consolas", 9), height=14)
        self.log.pack(fill="both", expand=True, padx=10, pady=(0, 10))
        self._log("工具已启动（tkinter 兜底界面）", C_LOG_TEXT)

        # ── 底部品牌 ──
        tk.Label(root, text="菡 工具箱", bg=C_BG, fg=C_MUTED,
                 font=("Microsoft YaHei", 8)).pack(anchor="se", padx=6, pady=2)

    def _pick_folder(self):
        d = filedialog.askdirectory()
        if d:
            self.folder_var.set(d)

    def _log(self, msg, color=None):
        self.log.insert("end", msg + "\n")
        self.log.see("end")

    def _run(self):
        folder = self.folder_var.get().strip()
        if not folder:
            messagebox.showwarning("提示", "请先选择源文件夹")
            return
        self.btn_run.config(state="disabled")
        # 后台线程跑引擎，界面不卡；daemon=True 随窗口退出（出处：全库 17 工具实践）
        threading.Thread(target=self._work, args=(folder,), daemon=True).start()

    def _work(self, folder):
        def ui(fn):
            self.root.after(0, fn)
        def on_progress(done, total, msg):
            ui(lambda: self._log(f"[{done}/{total}] {msg}"))
        try:
            r = core_engine.process(folder, progress_callback=on_progress, log_callback=lambda m: ui(lambda: self._log(m)))
            if r.get("success"):
                ui(lambda: (self._log(f"✅ 完成 → {r['output']}"), self.btn_run.config(state="normal")))
                ui(lambda: messagebox.showinfo("完成", f"已合并 {r['files']} 个文件 → {r['rows']} 行\n\n{r['output']}"))
            else:
                ui(lambda: (self._log(f"❌ {r['error']}"), self.btn_run.config(state="normal")))
                ui(lambda: messagebox.showerror("失败", f"{r['error']}\n\n建议：{r.get('suggestion','')}"))
        except Exception as e:
            ui(lambda: (self._log(f"❌ 异常：{e}"), self.btn_run.config(state="normal")))


def main():
    root = tk.Tk()
    TkApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
