@echo off
chcp 65001 >nul 2>&1
title 顾力菡 · 应用工坊 - 本地服务器
echo ============================================
echo   顾力菡 · 应用工坊
echo   正在启动本地服务器...
echo ============================================
echo.
echo  ▸ 自动打开浏览器
echo  ▸ 按 Ctrl+C 关闭服务器
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
