@echo off
chcp 65001 >nul
echo ========================================
echo  Credit Rating Tool - Starting...
echo ========================================
echo.
echo Open browser: http://localhost:5000
echo Press Ctrl+C to stop
echo.
python "%~dp0rating_server.py"
pause
