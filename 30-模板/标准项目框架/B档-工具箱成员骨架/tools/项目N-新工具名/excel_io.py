"""Excel/CSV 读写适配层 — 本工具一切文件读写只允许经过这里
职责：
  1. 统一编码链（calamine 优先自动降级；CSV 编码探测 utf-8-sig→gbk→gb18030→latin-1）
  2. 长路径保护 _lp（>240 字符自动加 \\\\?\\ 前缀，出处：项目37，OneDrive 场景救命）
  3. 原子写 atomic_save（先写 .tmp 再 os.replace，崩了不毁同事文件；覆盖前留 .bak，出处：项目7/37/19）
引擎（core_engine.py）禁止直接 open()/pd.read_excel()，必须走这里。
"""
import os
import shutil
import sys

# _common_utils 在工具箱根（tools/），本文件在 tools/项目N-xxx/，向上找即可
# 注意：dirname('C:\\') == 'C:\\'（Windows 盘根的自引用陷阱），找不到时必须靠 break 退出，
# 否则死循环 —— 本模板第一次跑黄金测试就抓到了这个真 bug
_HERE = os.path.dirname(os.path.abspath(__file__))
_d = _HERE
while _d and not os.path.exists(os.path.join(_d, "_common_utils.py")):
    _parent = os.path.dirname(_d)
    if _parent == _d:        # 已爬到盘根仍没找到：独立运行场景，放弃公共层
        _d = ""
        break
    _d = _parent
if _d and _d not in sys.path:
    sys.path.insert(0, _d)


def _lp(path):
    """Windows 超长路径处理：绝对路径超过 240 字符时加 \\\\?\\ 前缀，
    规避 260 字符 MAX_PATH 限制（io/openpyxl/zipfile/shutil 均可正常读写）。
    短路径原样返回，不影响既有行为。出处：tools/项目37-指引执行助手/app/util.py"""
    if os.name == "nt" and isinstance(path, str) and len(path) > 240:
        p = path.replace("/", "\\")
        if p.startswith("\\\\?\\"):
            return p
        if len(p) >= 3 and p[1] == ":" and p[2] == "\\":
            return "\\\\?\\" + p
    return path


def read_table(path, sheet_name=None):
    """读一个 Excel/CSV 为 DataFrame。编码与格式问题全部在此消化，对引擎透明。
    读不到返回 None（调用方负责报错并带建议）。
    sheet_name=None 时读取全部工作表并纵向拼接（合并类工具的默认语义，出处：项目25 抓取全部tab）。"""
    try:
        from _common_utils import read_excel_auto, read_csv_auto  # 工具箱公共层：编码链+自动降级
        if str(path).lower().endswith(".csv"):
            return read_csv_auto(_lp(path))
        df = read_excel_auto(_lp(path), sheet_name=sheet_name)
        return _merge_sheets(df)
    except ImportError:
        pass
    except Exception:
        return None
    # 独立运行兜底（脱离工具箱时）：最小可用链
    try:
        import pandas as pd
        if str(path).lower().endswith(".csv"):
            for enc in ("utf-8-sig", "gbk", "gb18030", "latin-1"):
                try:
                    return pd.read_csv(_lp(path), encoding=enc, dtype=str)
                except (UnicodeDecodeError, UnicodeError):
                    continue
            return None
        df = pd.read_excel(_lp(path), sheet_name=sheet_name, dtype=str)
        return _merge_sheets(df)
    except Exception:
        return None


def _merge_sheets(df):
    """sheet_name=None 时 pandas 返回 {sheet名: DataFrame} 字典——
    合并类工具要的是全部行，在此拼接并返回单个 DataFrame（引擎永远拿到 DataFrame，契约稳定）。"""
    import pandas as pd
    if isinstance(df, dict):
        frames = [v for v in df.values() if v is not None and not v.empty]
        if not frames:
            return None
        return pd.concat(frames, ignore_index=True, sort=False)
    return df


def list_excel_files(folder):
    """列文件夹内全部支持的表格文件（config.SUPPORTED_EXTS），按文件名排序。"""
    import config
    folder = _lp(folder)
    try:
        names = sorted(os.listdir(folder))
    except OSError:
        return []
    return [os.path.join(folder, n) for n in names
            if os.path.splitext(n)[1].lower() in config.SUPPORTED_EXTS
            and not n.startswith("~$")]  # ~$ 是 Excel 临时锁文件，必须跳过


def atomic_save(df, out_path, log_func=print):
    """原子写：先写 .tmp 再 os.replace 替换。
    好处：中途断电/崩溃不会留下写了一半的 xlsx 毁掉同事数据（出处：项目7/37）。
    若目标已存在，先留 .bak 备份（出处：项目19/8 的覆盖前留底实践）。"""
    import pandas as pd
    out_path = _lp(out_path)
    # 输出目录可能不存在（如界面传入的新目录）：先建目录再写，别让同事因为这个报错
    try:
        os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    except OSError as e:
        log_func(f"警告：创建输出目录失败：{e}")
    # 注意：临时文件也必须带真实扩展名 .xlsx——openpyxl 按扩展名识别格式，裸 .tmp 会报
    # Invalid extension（黄金测试抓到的第二个真 bug）；原子性不受影响
    tmp = out_path + ".tmp.xlsx"
    if os.path.exists(out_path):
        try:
            shutil.copy2(out_path, out_path + ".bak")
        except OSError as e:
            log_func(f"警告：备份原文件失败（不影响继续写出）：{e}")
    try:
        df.to_excel(tmp, index=False, engine="openpyxl")
        os.replace(tmp, out_path)  # 同分区原子替换，失败时 tmp 残留可安全删除
    except Exception:
        try:
            if os.path.exists(tmp):
                os.remove(tmp)
        except OSError:
            pass
        raise
    return out_path
