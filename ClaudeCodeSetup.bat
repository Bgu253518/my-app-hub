@echo off
setlocal enabledelayedexpansion
title Claude Code Portable Setup
color 0A

echo.
echo    ==============================================
echo      Claude Code - One-Click Portable Setup
echo      Private & Secure - All Data Local
echo    ==============================================
echo.
echo    This script will set up Claude Code on ANY PC:
echo      [1] Download portable Node.js
echo      [2] Download portable Git
echo      [3] Install Claude Code CLI
echo      [4] Open Secure API Key Vault
echo.
echo    All files stay in this folder. Nothing is
echo    installed system-wide. Just delete the folder
echo    to clean up everything.
echo.
echo    Press any key to continue...
pause >nul

set "BASE_DIR=%USERPROFILE%\ClaudeCode"
if not exist "%BASE_DIR%" mkdir "%BASE_DIR%"

:: ============================================================
:: Step 1: Node.js Portable
:: ============================================================
echo.
echo    [1/4] Setting up Node.js...

set "NODE_URL=https://nodejs.org/dist/v22.14.0/node-v22.14.0-win-x64.zip"
set "NODE_ZIP=%BASE_DIR%\node.zip"
set "NODE_DIR=%BASE_DIR%\node"

where node >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node -v 2^>nul') do echo     [OK] Node.js found: %%i
    set "NODE_PATH="
    goto :skip_node
)

if exist "%NODE_DIR%\node.exe" (
    echo     [OK] Node.js portable found locally
    set "PATH=%NODE_DIR%;%PATH%"
    goto :skip_node
)

echo     [..] Downloading Node.js portable (22.14.0)...
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; Invoke-WebRequest '%NODE_URL%' -OutFile '%NODE_ZIP%' -UseBasicParsing}" 2>nul

if not exist "%NODE_ZIP%" (
    echo     [FAIL] Download failed! Check network.
    echo     Manual: download from https://nodejs.org and extract to %NODE_DIR%
    pause
    exit /b 1
)

echo     [..] Extracting...
powershell -Command "Expand-Archive -Path '%NODE_ZIP%' -DestinationPath '%BASE_DIR%\node_tmp' -Force" 2>nul
for /d %%d in ("%BASE_DIR%\node_tmp\node-*") do move "%%d" "%NODE_DIR%" >nul 2>nul
if exist "%BASE_DIR%\node_tmp" rmdir /s /q "%BASE_DIR%\node_tmp" >nul 2>nul
if exist "%NODE_ZIP%" del "%NODE_ZIP%" >nul
set "PATH=%NODE_DIR%;%PATH%"
echo     [OK] Node.js portable installed

:skip_node

:: ============================================================
:: Step 2: Git Portable
:: ============================================================
echo.
echo    [2/4] Setting up Git...

where git >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('git --version 2^>nul') do echo     [OK] Git found: %%i
    goto :skip_git
)

if exist "%BASE_DIR%\git\bin\git.exe" (
    echo     [OK] Git portable found locally
    set "PATH=%BASE_DIR%\git\bin;%BASE_DIR%\git\cmd;%PATH%"
    goto :skip_git
)

echo     [..] Git portable not found.
echo     Please manually install Git from: https://git-scm.com/download/win
echo     Or if you have the installer, place it at:
echo     %BASE_DIR%\GitInstaller.exe
if exist "%BASE_DIR%\GitInstaller.exe" (
    echo     [..] Found local installer, running...
    start /wait "" "%BASE_DIR%\GitInstaller.exe" /VERYSILENT /NORESTART /DIR="%BASE_DIR%\git"
    if exist "%BASE_DIR%\git\bin\git.exe" (
        set "PATH=%BASE_DIR%\git\bin;%BASE_DIR%\git\cmd;%PATH%"
        echo     [OK] Git installed
    )
)

:skip_git

:: ============================================================
:: Step 3: Claude Code CLI
:: ============================================================
echo.
echo    [3/4] Setting up Claude Code CLI...

set "CLAUDE_DIR=%BASE_DIR%\claude-cli"
if not exist "%CLAUDE_DIR%" mkdir "%CLAUDE_DIR%"

:: Check if already installed
if exist "%CLAUDE_DIR%\node_modules\.bin\claude" (
    echo     [OK] Claude Code CLI found locally
    goto :skip_claude
)

echo     [..] Installing Claude Code via npm...
cd /d "%CLAUDE_DIR%"
call npm init -y >nul 2>nul
call npm install @anthropic-ai/claude-code --save 2>nul
if %errorlevel% equ 0 (
    echo     [OK] Claude Code CLI installed
) else (
    echo     [..] npm install failed. You can use npx instead.
    echo     Run: npx @anthropic-ai/claude-code
)

:skip_claude

:: ============================================================
:: Step 4: API Key Vault
:: ============================================================
echo.
echo    [4/4] Setting up Secure API Key Vault...

set "VAULT_DIR=%BASE_DIR%\vault"
if not exist "%VAULT_DIR%" mkdir "%VAULT_DIR%"

:: Copy the secure vault HTML to the local folder
copy /y "%~dp0claude-vault.html" "%VAULT_DIR%\claude-vault.html" >nul 2>nul

:: ============================================================
:: Launch
:: ============================================================
echo.
echo    ==============================================
echo      Setup Complete!
echo    ==============================================
echo.
echo    Folder: %BASE_DIR%
echo      \node\          - Node.js portable
echo      \git\           - Git portable
echo      \claude-cli\    - Claude Code CLI
echo      \vault\         - Secure API Key Vault
echo.
echo    Opening Secure API Key Vault...
echo    Set your master password, then enter your API key.
echo    Your key is AES-256-GCM encrypted in browser storage.
echo    NEVER transmitted to any server. 100%% local.
echo.

start "" "%VAULT_DIR%\claude-vault.html"

echo.
echo    To use Claude Code:
echo      cd %CLAUDE_DIR%
echo      set ANTHROPIC_API_KEY=your-key-here
echo      npx @anthropic-ai/claude-code
echo.
echo    Or set the key from the vault and run Claude.
echo.
pause
