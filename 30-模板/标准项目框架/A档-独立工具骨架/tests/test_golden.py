"""黄金样例测试 — 小输入 + 已知正确输出（A 档必配，验收清单第 10 项）
作用：以后你改 core_engine.py 的任何逻辑，跑一遍这个文件就知道有没有改坏。
运行：python -m pytest tests/   或   python tests/test_golden.py（无 pytest 时直跑）
"""
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd  # noqa: E402

import core_engine  # noqa: E402


def _make_sample_folder(tmpdir):
    """造 3 个同结构小表：其中 a 含一行"合计"应被剔除；c 是 GBK 编码 CSV（编码链实战）"""
    df_a = pd.DataFrame({"日期": ["2026-01-01", "2026-01-02", "合计"], "金额": ["100", "200", "300"]})
    df_b = pd.DataFrame({"日期": ["2026-01-03"], "金额": ["50"]})
    df_a.to_excel(os.path.join(tmpdir, "a_银行.xlsx"), index=False)
    df_b.to_excel(os.path.join(tmpdir, "b_序时账.xlsx"), index=False)
    with open(os.path.join(tmpdir, "c_补充.csv"), "w", encoding="gbk") as f:
        f.write("日期,金额\n2026-01-04,80\n")
    return tmpdir


def test_merge_golden():
    with tempfile.TemporaryDirectory() as tmp:
        _make_sample_folder(tmp)
        out = os.path.join(tmp, "out", "汇总.xlsx")
        r = core_engine.process(tmp, out)

        # ── 已知正确输出（黄金答案）──
        assert r["success"], f"应成功：{r}"
        assert r["files"] == 3, "应读到 3 个文件"
        # 行数：a 的合计行被剔除 → 2 + 1 + 1 = 4 行
        assert r["rows"] == 4, f"应为 4 行（剔除合计后），实际 {r['rows']}"
        assert os.path.exists(out), "输出文件应存在"

        df = pd.read_excel(out)
        # 来源标记列必须存在（可追溯，出处：项目16）
        assert "来源文件" in df.columns, "汇总表必须有「来源文件」列"
        # 原子写保护：不应残留 .tmp / .tmp.xlsx 半成品
        assert not os.path.exists(out + ".tmp") and not os.path.exists(out + ".tmp.xlsx"), "不应残留 .tmp 半成品"


def test_empty_folder_error_has_suggestion():
    """错误必须带 suggestion（错误消息三要素，规范 3.4）"""
    with tempfile.TemporaryDirectory() as tmp:
        r = core_engine.process(tmp)
        assert not r["success"]
        assert r.get("suggestion"), "错误必须附建议"


if __name__ == "__main__":
    test_merge_golden()
    test_empty_folder_error_has_suggestion()
    print("✅ 黄金样例全部通过")
