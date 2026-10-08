@echo off
chcp 65001 >nul
echo ======================================
echo   AI 视频讲解 - 一键渲染
echo ======================================
echo.

echo [1/3] 检查环境...
if not exist "node_modules" (
    echo 检测到缺少依赖，请先运行 setup.bat
    pause
    exit /b 1
)

set CHROME_DIR=%USERPROFILE%\.remotion\chrome-headless-shell\chrome-headless-shell-win64
if not exist "%CHROME_DIR%\chrome-headless-shell.exe" (
    echo 检测到缺少 Chrome，请先运行 setup.bat
    pause
    exit /b 1
)

echo [2/3] 生成 AI 语音旁白...
python generate_audio.py
if %errorlevel% neq 0 (
    echo TTS 生成失败
    pause
    exit /b 1
)

echo [3/3] 渲染视频 (1920x1080, 10秒)...
call npx remotion render src/index.ts AiVideo out/video.mp4

if %errorlevel% equ 0 (
    echo.
    echo ======================================
    echo   完成! 视频位于 out\video.mp4
    echo ======================================
) else (
    echo.
    echo 渲染失败，请检查错误信息
)
pause
