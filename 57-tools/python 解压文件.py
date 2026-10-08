import os
import time
import pythoncom
import win32com.client
import zipfile
import tarfile
import PySimpleGUI as sg

# ---------- 支持的扩展名 ----------
VALID_EXTENSIONS = {'.zip', '.7z', '.rar', '.tar', '.gz', '.tgz', '.bz2', '.tbz2'}

# ---------- Python 原生解压 ----------
def extract_python(src, dst):
    """返回 True 表示成功，False 表示需要其他方式"""
    base = os.path.basename(src).lower()
    try:
        if base.endswith('.zip'):
            with zipfile.ZipFile(src, 'r') as zf:
                zf.extractall(dst)
            return True
        if base.endswith('.tar'):
            with tarfile.open(src, 'r') as tf:
                tf.extractall(dst)
            return True
        if base.endswith(('.gz', '.tgz', '.tar.gz')):
            with tarfile.open(src, 'r:gz') as tf:
                tf.extractall(dst)
            return True
        if base.endswith(('.bz2', '.tbz2', '.tar.bz2')):
            with tarfile.open(src, 'r:bz2') as tf:
                tf.extractall(dst)
            return True
    except:
        pass
    return False

# ---------- Shell 解压（利用右键解压的能力） ----------
def extract_shell(src, dst):
    """使用 Shell.Application 解压，返回 True/False"""
    try:
        shell = win32com.client.Dispatch("Shell.Application")
        # 打开压缩包
        src_ns = shell.NameSpace(src)
        if src_ns is None:
            return False
        # 创建目标文件夹（如果不存在）
        if not os.path.isdir(dst):
            os.makedirs(dst, exist_ok=True)
        dst_ns = shell.NameSpace(dst)
        if dst_ns is None:
            return False
        items = src_ns.Items()
        if items.Count == 0:
            return True   # 空压缩包也算成功
        dst_ns.CopyHere(items, 4 | 16)  # 4: 不显示进度, 16: 自动覆盖

        # 等待解压完成：简单循环检查目标文件夹内文件数量不再变化
        timeout = 120  # 最多等 120 秒
        start = time.time()
        prev_count = -1
        while time.time() - start < timeout:
            try:
                current_count = len(os.listdir(dst))
                if current_count > 0 and current_count == prev_count:
                    break  # 数量稳定，解压完成
                prev_count = current_count
            except:
                pass
            time.sleep(0.5)
        return True
    except Exception:
        return False

# ---------- 扫描并解压 ----------
def extract_archives(src_folder, dst_folder, log_func=None):
    src_folder = os.path.abspath(src_folder)
    dst_folder = os.path.abspath(dst_folder)
    total = 0

    for root, dirs, files in os.walk(src_folder):
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext not in VALID_EXTENSIONS:
                continue

            src_path = os.path.join(root, file)
            archive_name = os.path.splitext(file)[0]
            dest_dir = os.path.join(dst_folder, f"{archive_name}_解压")

            # 重名保护
            counter = 1
            temp_dir = dest_dir
            while os.path.exists(temp_dir):
                temp_dir = os.path.join(dst_folder, f"{archive_name}_解压_{counter}")
                counter += 1
            dest_dir = temp_dir

            # 1. 尝试 Python 原生
            success = extract_python(src_path, dest_dir)
            # 2. 若失败，尝试 Shell
            if not success:
                if log_func:
                    log_func(f"  尝试使用系统右键功能解压：{file}")
                success = extract_shell(src_path, dest_dir)

            if success:
                total += 1
                if log_func:
                    log_func(f"  ✅ {file}")
            else:
                if log_func:
                    log_func(f"  ❌ 无法解压 {file}，请确保系统已安装 7-Zip 或 WinRAR")
    return total

# ---------- 图形界面 ----------
def main():
    sg.theme('SystemDefault')

    layout = [
        [sg.Text('源文件夹')],
        [sg.Input(key='src'), sg.FolderBrowse()],
        [sg.Text('目标文件夹')],
        [sg.Input(key='dst'), sg.FolderBrowse()],
        [sg.Button('开始解压'), sg.Button('返回')],
        [sg.Multiline(size=(70, 15), key='log', autoscroll=True, disabled=True)],
    ]

    window = sg.Window('万能压缩包解压（免配置）', layout)

    while True:
        event, values = window.read()
        if event in (sg.WIN_CLOSED, '返回'):
            break
        if event == '开始解压':
            try:
                src = values['src'].strip()
                dst = values['dst'].strip()
                if not src or not dst:
                    sg.popup_error('请选择源文件夹和目标文件夹')
                    continue
                if not os.path.isdir(src):
                    sg.popup_error('源文件夹不存在')
                    continue
                os.makedirs(dst, exist_ok=True)

                window['log'].update('')
                log_func = lambda msg: window['log'].print(msg)
                log_func('正在扫描（利用系统右键解压功能）...')
                total = extract_archives(src, dst, log_func)
                log_func(f'\n✅ 完成！共解压 {total} 个压缩包')
            except Exception as e:
                window['log'].print(f'发生错误：{e}')
    window.close()

if __name__ == '__main__':
    main()