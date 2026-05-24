@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
cls
echo.
echo   ========================================
echo     My App Hub - Claude Code 对话
echo     项目上下文已加载 (CLAUDE.md)
echo   ========================================
echo.
claude
