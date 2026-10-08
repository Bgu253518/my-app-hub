"""PyInstaller 打包脚本 — A 档独立分发用（出处：项目9 build_exe.py 最小范式）
打包前：pip install pyinstaller
产出：本目录下的 exe（--onefile 单文件，--windowed 无黑窗）
图标：把 品牌资产/icon_v2.ico 拷到本目录即可自动带上「菡」图标（规范第六章）
"""
import os

import PyInstaller.__main__

root = os.path.dirname(os.path.abspath(__file__))

args = [
    os.path.join(root, "run.py"),
    "--onefile",
    "--windowed",
    "--clean",
    "--noconfirm",
    "--name", "多Excel合并汇总",
    "--distpath", root,
    "--workpath", os.path.join(root, "__pycache__", "build"),
    "--specpath", root,
]
ico = os.path.join(root, "icon_v2.ico")
if os.path.exists(ico):
    args += ["--icon", ico]

PyInstaller.__main__.run(args)
