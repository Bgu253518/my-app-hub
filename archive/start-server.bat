@echo off
chcp 65001 >nul 2>&1
title GDC 审计工时系统 - 本地服务器
echo.
echo   ==========================================
echo     GDC 审计任务工时管理系统 - 本地服务器
echo   ==========================================
echo.
echo   正在启动后端服务...
echo.

cd /d "%~dp0"

:: 检查 Flask 是否已安装
python -c "import flask" 2>nul
if %errorlevel% neq 0 (
    echo   [1/2] 首次运行，正在安装依赖 (Flask)...
    pip install flask flask-cors -q
    if %errorlevel% neq 0 (
        echo   ❌ 安装失败，请手动运行: pip install flask flask-cors
        pause
        exit /b 1
    )
    echo   ✅ 依赖安装完成
) else (
    echo   ✅ 依赖已就绪
)

echo   [2/2] 启动服务器...
echo.
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do set LOCAL_IP=%%i
set LOCAL_IP=%LOCAL_IP: =%
echo   本机访问:  http://127.0.0.1:5000
echo   团队访问:  http://%LOCAL_IP%:5000
echo.
echo   数据文件:  %~dp0gdc_data.db
echo   按 Ctrl+C 停止服务器
echo   ==========================================
echo.

python server.py
pause
