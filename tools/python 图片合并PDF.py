import os
import PySimpleGUI as sg
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import red

# ==================== PDF 生成核心函数 ====================
def generate_pdf(source_folder, output_pdf, log_func):
    try:
        os.makedirs(os.path.dirname(output_pdf), exist_ok=True)
        log_func("正在创建输出目录...")

        # 注册中文字体
        try:
            font_path = "C:/Windows/Fonts/simhei.ttf"
            pdfmetrics.registerFont(TTFont("SimHei", font_path))
            FONT_NAME = "SimHei"
            log_func("✅ 中文字体加载成功")
        except:
            log_func("⚠️ 警告：无法加载黑体，中文可能显示异常")
            FONT_NAME = "Helvetica"

        # 获取图片文件 → 已支持所有常见格式
        image_files = [os.path.join(source_folder, f) for f in os.listdir(source_folder)
                       if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff'))]
        image_files.sort()

        if not image_files:
            log_func("❌ 错误：没有找到支持的图片")
            return

        log_func(f"✅ 找到 {len(image_files)} 张图片，开始生成PDF...")

        c = canvas.Canvas(output_pdf, pagesize=A4)
        page_width, page_height = A4
        TITLE_FONT_SIZE = 14
        TITLE_MARGIN_TOP = 40
        TITLE_MARGIN_RIGHT = 40
        IMAGE_MARGIN_BOTTOM = 40
        IMAGE_MARGIN_TOP = 70

        for i, img_path in enumerate(image_files, 1):
            title = os.path.splitext(os.path.basename(img_path))[0]
            log_func(f"正在生成第 {i}/{len(image_files)} 页：{title}")
            
            c.setFont(FONT_NAME, TITLE_FONT_SIZE)
            c.setFillColor(red)
            text_width = c.stringWidth(title, FONT_NAME, TITLE_FONT_SIZE)
            x = page_width - TITLE_MARGIN_RIGHT - text_width
            y = page_height - TITLE_MARGIN_TOP
            c.drawString(x, y, title)

            img = Image.open(img_path)
            img_width, img_height = img.size
            max_img_width = page_width - 80
            max_img_height = page_height - IMAGE_MARGIN_TOP - IMAGE_MARGIN_BOTTOM
            ratio = min(max_img_width / img_width, max_img_height / img_height)
            draw_width = img_width * ratio
            draw_height = img_height * ratio
            img_x = (page_width - draw_width) / 2
            img_y = IMAGE_MARGIN_BOTTOM
            img_reader = ImageReader(img)
            c.drawImage(img_reader, img_x, img_y, width=draw_width, height=draw_height)

            if img_path != image_files[-1]:
                c.showPage()

        c.save()
        log_func(f"\n🎉 PDF 生成成功！共 {len(image_files)} 页")
        log_func(f"📁 保存位置：{output_pdf}")

    except Exception as e:
        log_func(f"\n❌ 生成失败：{str(e)}")

# ==================== 图形界面 ====================
def main():
    sg.theme('SystemDefault')

    layout = [
        [sg.Text('图片源文件夹')],
        [sg.Input(key='src'), sg.FolderBrowse()],
        [sg.Text('PDF保存路径')],
        [sg.Input(key='dst'), sg.FileSaveAs('选择保存位置', default_extension='.pdf', file_types=(('PDF 文件', '*.pdf'),))],
        [sg.Button('开始生成PDF'), sg.Button('退出')],
        [sg.Multiline(size=(75, 18), key='log', autoscroll=True, disabled=True)],
    ]

    window = sg.Window('图片转PDF工具（全格式支持）', layout)

    while True:
        event, values = window.read()
        if event in (sg.WIN_CLOSED, '退出'):
            break
        if event == '开始生成PDF':
            try:
                src = values['src'].strip()
                dst = values['dst'].strip()

                if not src or not dst:
                    sg.popup_error('请选择图片文件夹和PDF保存路径！')
                    continue

                if not os.path.isdir(src):
                    sg.popup_error('图片源文件夹不存在！')
                    continue

                window['log'].update('')
                log_func = lambda msg: window['log'].print(msg)

                log_func('🚀 开始启动图片转PDF程序...')
                generate_pdf(src, dst, log_func)

            except Exception as e:
                window['log'].print(f'发生错误：{e}')

    window.close()

if __name__ == '__main__':
    main()