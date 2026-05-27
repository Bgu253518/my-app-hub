@echo off
cd /d "%~dp0"
echo.
echo   🎬 虾人动画 · 视频拆解工具
echo   ============================
echo.

REM 检查 FFmpeg
where ffmpeg >nul 2>&1
if %errorlevel% neq 0 (
    echo   [⚠] FFmpeg 未安装，请先安装 FFmpeg 并添加到 PATH
    echo       下载地址: https://ffmpeg.org/download.html
    echo.
    pause
    exit /b 1
)

echo   [✓] FFmpeg 已就绪

REM 检查 Whisper
python -c "import whisper" >nul 2>&1
if %errorlevel% neq 0 (
    echo   [!] Whisper 未安装，字幕提取功能不可用
    echo       安装命令: pip install openai-whisper
)

REM 启动服务
echo   [✓] 启动服务器...
echo   [✓] 浏览器打开 http://localhost:8765
echo.
start "" http://localhost:8765
python server.py
pause
