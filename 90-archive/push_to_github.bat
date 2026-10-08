@echo off
chcp 65001 >nul
echo ======================================
echo   推送到 GitHub: Bgu253518/my-app-hub
echo ======================================
echo.

cd /d "%~dp0.."

if not exist "_repo_temp" (
    echo [1/3] 克隆仓库...
    git clone https://github.com/Bgu253518/my-app-hub.git _repo_temp
    if %errorlevel% neq 0 (
        echo 克隆失败，请检查网络。
        echo 可尝试使用代理或 SSH: git clone git@github.com:Bgu253518/my-app-hub.git _repo_temp
        pause
        exit /b 1
    )
)

echo [2/3] 复制文件...
rmdir /s /q "_repo_temp\ai-video-template" 2>nul
mkdir "_repo_temp\ai-video-template"
xcopy "AI-视频制作\*" "_repo_temp\ai-video-template\" /E /I /Q /EXCLUDE:.gitignore_push
echo node_modules\ > .gitignore_push
echo out\ >> .gitignore_push
echo .playwright_profile\ >> .gitignore_push
echo .douyin_cookies.json >> .gitignore_push
echo .cookies.txt >> .gitignore_push

echo [3/3] 提交并推送...
cd _repo_temp
git add ai-video-template/
git commit -m "feat: AI视频生成工作流 v2.1 — 6组24节点，10类视觉特效，7种背景交替"
git push origin main

if %errorlevel% equ 0 (
    echo.
    echo ======================================
    echo   推送成功！
    echo ======================================
) else (
    echo 推送失败，请检查网络或尝试手动 git push
)
cd ..
del .gitignore_push 2>nul
pause
