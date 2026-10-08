@echo off
chcp 65001 >nul
echo ========================================
echo   信用评级查询工具 - 启动中...
echo ========================================
echo.
echo 浏览器打开: http://localhost:5000
echo 按 Ctrl+C 停止服务
echo.
python "%~dp0信用评级查询.py"
pause
