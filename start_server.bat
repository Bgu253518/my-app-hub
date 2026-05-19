@echo off
chcp 65001 >nul 2>&1
echo ============================================
echo   信用评级查询工具 - Starting
echo ============================================
echo.
echo  Open browser: http://localhost:5000
echo  Press Ctrl+C to stop
echo.
python "%~dp0rating_server.py"
pause
