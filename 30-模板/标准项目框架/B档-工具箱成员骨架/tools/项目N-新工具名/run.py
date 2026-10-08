"""多Excel合并汇总 — 把文件夹内所有 Excel 的同结构表合并成一个汇总表
输入:  文件夹路径（内含若干 .xlsx/.xls/.csv）
输出:  汇总表 xlsx（每行带「来源文件」标记列）+ 日志
依赖:  _common_utils（编码链）、excel_io（长路径+原子写保护）
修改:  v0.1 2026-10-08 模板初版（菡）
        用法：改工具名时全局替换「多Excel合并汇总」，并在 config.py 填你的关键词表
"""
import os
import sys

# ① 异常钩子：未捕获异常自动写 tools/_logs，同事截图即可定位
# ② stderr 兜底：pythonw/GBK 环境下一个 ✅ 字符就会触发 UnicodeEncodeError 中断全流程
#    —— 项目23 的教训，这两段是工具箱每工具 12 行样板的固化版，删掉即违规
try:
    import io as _io
    _s = sys.stderr or sys.stdout or _io.StringIO()
    if hasattr(_s, "reconfigure"):
        try: _s.reconfigure(errors="replace")
        except Exception: pass
except Exception:
    pass

try:
    # 同样注意盘根自引用陷阱（见 excel_io.py 注释）：找不到公共层就放弃，绝不死循环
    _d = os.path.dirname(os.path.abspath(__file__))
    while _d and not os.path.exists(os.path.join(_d, "_common_utils.py")):
        _parent = os.path.dirname(_d)
        if _parent == _d:
            _d = ""
            break
        _d = _parent
    if _d and _d not in sys.path:
        sys.path.insert(0, _d)
    from _common_utils import install_exception_hook
    install_exception_hook("项目N-多Excel合并汇总")
except Exception:
    pass


def main():
    """入口只做一件事：启动界面。业务逻辑在 core_engine.py，不许写在这里。"""
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "web"))
    import webui_main
    webui_main.main()


if __name__ == "__main__":
    main()
