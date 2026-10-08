import os
import shutil
import PySimpleGUI as sg

# 支持的文件扩展名（与 VBA 完全相同）
VALID_EXTENSIONS = {
    'doc', 'docx', 'xls', 'xlsx', 'xlsm', 'xlsb', 'csv', 'ppt', 'pptx', 'pps', 'ppsx',
    'pdf', 'odt', 'ods', 'txt', 'rtf',
    'eml', 'msg', 'pst', 'ost', 'emlx', 'mbox', 'dbx', 'tbb', 'mbx',
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'svg', 'ico', 'psd', 'ai', 'raw',
    'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'iso', 'dmg',
    'mp3', 'wav', 'm4a', 'flac', 'aac', 'ogg', 'wma',
    'mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v',
    'log', 'ini', 'cfg', 'json', 'xml', 'yaml', 'yml', 'md', 'properties',
    'py', 'js', 'html', 'htm', 'css', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'sh',
    'bat', 'ps1', 'vbs', 'swift', 'go',
    'dwg', 'dxf', 'skp', 'eps', 'indd'
}

def copy_files_with_rename(src_folder, dst_folder, log_func=None):
    """递归复制文件并按照 父路径-原文件名 重命名"""
    src_folder = os.path.abspath(src_folder)
    dst_folder = os.path.abspath(dst_folder)
    total_copied = 0
    total_skipped = 0

    for root, dirs, files in os.walk(src_folder):
        # 计算当前文件夹相对于源文件夹的路径
        rel_path = os.path.relpath(root, src_folder)
        if rel_path == '.':
            folder_chain = os.path.basename(src_folder)
        else:
            folder_chain = rel_path.replace(os.sep, '-')

        for file in files:
            ext = file.split('.')[-1].lower()
            if ext not in VALID_EXTENSIONS:
                continue

            old_path = os.path.join(root, file)
            new_name = f"{folder_chain}-{file}"
            new_path = os.path.join(dst_folder, new_name)

            # 处理重名：添加编号
            counter = 1
            base, ext_real = os.path.splitext(new_name)
            while os.path.exists(new_path):
                new_name_temp = f"{base}-{counter}{ext_real}"
                new_path = os.path.join(dst_folder, new_name_temp)
                counter += 1

            try:
                shutil.copy2(old_path, new_path)
                if log_func:
                    log_func(f"已复制：{new_name}")
                total_copied += 1
            except Exception as e:
                if log_func:
                    log_func(f"跳过 {old_path}：{e}")
                total_skipped += 1

    return total_copied, total_skipped

def main():
    sg.theme('SystemDefault')

    layout = [
        [sg.Text('源文件夹')],
        [sg.Input(key='src'), sg.FolderBrowse()],
        [sg.Text('目标文件夹')],
        [sg.Input(key='dst'), sg.FolderBrowse()],
        [sg.Button('开始收集'), sg.Button('返回')],
        [sg.Multiline(size=(70, 15), key='log', autoscroll=True, disabled=True)],
    ]

    window = sg.Window('文件提取', layout)

    while True:
        event, values = window.read()
        if event in (sg.WIN_CLOSED, '返回'):
            break
        if event == '开始收集':
            src = values['src'].strip()
            dst = values['dst'].strip()
            if not src or not dst:
                sg.popup_error('请选择源文件夹和目标文件夹')
                continue
            if not os.path.isdir(src):
                sg.popup_error('源文件夹不存在')
                continue
            if not os.path.isdir(dst):
                os.makedirs(dst, exist_ok=True)

            window['log'].update('')
            log_func = lambda msg: window['log'].print(msg)
            log_func('开始收集文件...')
            copied, skipped = copy_files_with_rename(src, dst, log_func)
            log_func(f'\n✅ 收集完成！共复制 {copied} 个文件，跳过 {skipped} 个文件')

    window.close()

if __name__ == '__main__':
    main()