@echo off
chcp 65001 >nul
echo ======================================
echo   首次运行 - 环境安装
echo ======================================
echo.

echo [1/3] 安装 Node.js 依赖...
call npm install
if %errorlevel% neq 0 (
    echo 安装失败，请检查 Node.js 是否已安装
    pause
    exit /b 1
)

echo.
echo [2/3] 安装 Python TTS 依赖...
pip install edge-tts -q
if %errorlevel% neq 0 (
    echo 安装失败，请检查 Python 是否已安装
    pause
    exit /b 1
)

echo.
echo [3/3] 下载 Chrome Headless Shell (约113MB)...
set CHROME_DIR=%USERPROFILE%\.remotion\chrome-headless-shell\chrome-headless-shell-win64
if exist "%CHROME_DIR%\chrome-headless-shell.exe" (
    echo Chrome 已存在，跳过下载
) else (
    echo 正在从 npmmirror 镜像下载...
    mkdir "%USERPROFILE%\.remotion\chrome-headless-shell" 2>nul
    curl -L -o "%TEMP%\chrome-headless-shell-win64.zip" "https://registry.npmmirror.com/-/binary/chrome-for-testing/149.0.7790.0/win64/chrome-headless-shell-win64.zip"
    if %errorlevel% neq 0 (
        echo 下载失败，请手动下载并解压到 %CHROME_DIR%
        pause
        exit /b 1
    )
    echo 正在解压...
    powershell -Command "Expand-Archive -Path '%TEMP%\chrome-headless-shell-win64.zip' -DestinationPath '%USERPROFILE%\.remotion\chrome-headless-shell\' -Force"
    del "%TEMP%\chrome-headless-shell-win64.zip" 2>nul
    echo Chrome 安装完成
)

echo.
echo ======================================
echo   环境就绪！运行 render.bat 渲染视频
echo ======================================
pause
