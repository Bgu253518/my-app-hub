﻿﻿#Requires -Version 5.0
# Claude Code 模块安装工具 v1.0
# 一键检测 + 模块化安装，所有组件独立安装互不影响

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# ============================
# 全局配置
# ============================
$config = @{
    NodeVersion  = "v22.14.0"
    NodeUrl      = "https://npmmirror.com/mirrors/node/v22.14.0/node-v22.14.0-x64.msi"
    GitVersion   = "v2.48.1"
    GitUrl       = "https://npmmirror.com/mirrors/git-for-windows/v2.48.1.windows.1/Git-2.48.1-64-bit.exe"
    NpmRegistry  = "https://registry.npmmirror.com"
}

# ============================
# 检测函数
# ============================
function Test-NodeJsInstall {
    $p = Get-Command node -ErrorAction SilentlyContinue
    if ($p) { $v = & node -v 2>$null; if ($v) { return @{ok=$true; d=$v} } }
    return @{ok=$false; d=""}
}
function Test-NpmRegistry {
    $r = & npm config get registry 2>$null
    if ($r -and $r -like "*npmmirror*") { return @{ok=$true; d=$r} }
    return @{ok=$false; d=$r}
}
function Test-GitInstall {
    $p = Get-Command git -ErrorAction SilentlyContinue
    if ($p) { $v = & git --version 2>$null; if ($v) { return @{ok=$true; d=$v} } }
    return @{ok=$false; d=""}
}
function Test-ClaudeCodeInstall {
    $p = Get-Command claude -ErrorAction SilentlyContinue
    if ($p) { $v = & claude --version 2>$null; if ($v) { return @{ok=$true; d=$v} } }
    # fallback via npx
    $v = & npx @anthropic-ai/claude-code --version 2>$null
    if ($v) { return @{ok=$true; d=$v} }
    return @{ok=$false; d=""}
}
function Test-McpConfig {
    $fp = "$env:USERPROFILE\.claude\settings.json"
    if (Test-Path $fp) {
        try {
            $j = Get-Content $fp -Raw -Encoding UTF8 | ConvertFrom-Json
            $c = ($j.mcpServers.PSObject.Properties | Measure-Object).Count
            if ($c -gt 0) { return @{ok=$true; d="$c 个已配置"} }
        } catch { return @{ok=$false; d="配置文件无效"} }
    }
    return @{ok=$false; d=""}
}
function Test-ApiKey {
    $k = [Environment]::GetEnvironmentVariable("ANTHROPIC_API_KEY","User")
    if ($k) { $m = $k.Substring(0,[Math]::Min(8,$k.Length))+"****"; return @{ok=$true; d=$m} }
    return @{ok=$false; d=""}
}

# ============================
# 安装函数 (在后台作业中运行)
# ============================
function Install-NodeJsTask {
    $msi = "$env:TEMP\node_setup.msi"
    Write-Output "STATUS:正在下载 Node.js $($config.NodeVersion)..."
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $config.NodeUrl -OutFile $msi -UseBasicParsing -ErrorAction Stop
    if (-not (Test-Path $msi)) { throw "下载失败: Node.js MSI 未找到" }
    Write-Output "STATUS:正在安装 Node.js (静默安装)..."
    $p = Start-Process msiexec -ArgumentList "/i `"$msi`" /quiet /norestart" -Wait -PassThru
    Remove-Item $msi -Force -ErrorAction SilentlyContinue
    if ($p.ExitCode -ne 0 -and $p.ExitCode -ne 3010) { throw "Node.js 安装失败 ($($p.ExitCode))" }
    $env:Path = [Environment]::GetEnvironmentVariable("Path","Machine")+";"+[Environment]::GetEnvironmentVariable("Path","User")
    $v = & node -v 2>$null
    Write-Output "RESULT:$v"
}
function Set-NpmRegistryTask {
    & npm config set registry $config.NpmRegistry 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "npm 镜像设置失败" }
    Write-Output "RESULT:已设置为 $($config.NpmRegistry)"
}
function Install-GitTask {
    $exe = "$env:TEMP\git_setup.exe"
    Write-Output "STATUS:正在下载 Git $($config.GitVersion)..."
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    try {
        Invoke-WebRequest -Uri $config.GitUrl -OutFile $exe -UseBasicParsing -ErrorAction Stop
    } catch {
        Write-Output "STATUS:镜像下载失败，尝试 winget..."
        $p = Start-Process winget -ArgumentList "install --id Git.Git -e --source winget --accept-source-agreements --accept-package-agreements" -Wait -PassThru -NoNewWindow
        if ($p.ExitCode -eq 0) { $v=& git --version 2>$null; Write-Output "RESULT:$v"; return }
        throw "Git 安装失败: 镜像和 winget 均不可用"
    }
    Write-Output "STATUS:正在安装 Git (静默安装)..."
    $p = Start-Process $exe -ArgumentList "/VERYSILENT /NORESTART /COMPONENTS=`"gitpath,gitlfs`"" -Wait -PassThru
    Remove-Item $exe -Force -ErrorAction SilentlyContinue
    if ($p.ExitCode -ne 0) { throw "Git 安装失败 ($($p.ExitCode))" }
    $env:Path = [Environment]::GetEnvironmentVariable("Path","Machine")+";"+[Environment]::GetEnvironmentVariable("Path","User")
    $v = & git --version 2>$null
    Write-Output "RESULT:$v"
}
function Install-ClaudeCodeTask {
    Write-Output "STATUS:正在安装 Claude Code CLI..."
    & npm install -g @anthropic-ai/claude-code 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Claude Code 安装失败" }
    $v = & claude --version 2>$null
    if (-not $v) { $v = "已安装 (npx)" }
    Write-Output "RESULT:$v"
}
function Install-McpPluginsTask {
    Write-Output "STATUS:正在安装 MCP 插件 (4个)..."
    & npm install -g @modelcontextprotocol/server-filesystem @modelcontextprotocol/server-github @modelcontextprotocol/server-sqlite @modelcontextprotocol/server-puppeteer 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "MCP 包安装失败" }
    Write-Output "STATUS:正在生成 MCP 配置..."
    $d = "$env:USERPROFILE\.claude"
    if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
    $cf = "$d\settings.json"
    if (Test-Path $cf) { Copy-Item $cf "$cf.bak" -Force }
    $cfg = @{mcpServers=@{filesystem=@{command="npx";args=@("-y","@modelcontextprotocol/server-filesystem","$env:USERPROFILE\Desktop","$env:USERPROFILE\Documents")};github=@{command="npx";args=@("-y","@modelcontextprotocol/server-github")};sqlite=@{command="npx";args=@("-y","@modelcontextprotocol/server-sqlite","$env:USERPROFILE\.claude\claude.db")};puppeteer=@{command="npx";args=@("-y","@modelcontextprotocol/server-puppeteer")}}}
    $cfg | ConvertTo-Json -Depth 10 | Set-Content -Path $cf -Encoding UTF8
    Write-Output "RESULT:已配置 4 个 MCP 插件"
}
function Set-ApiKeyTask {
    param($key)
    if ([string]::IsNullOrWhiteSpace($key)) { throw "API Key 不能为空" }
    [Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY",$key,"User")
    $env:ANTHROPIC_API_KEY = $key
    $m = if ($key.Length -gt 8) { $key.Substring(0,8)+"****" } else { $key+"****" }
    Write-Output "RESULT:$m"
}

# ============================
# UI 构建
# ============================

# 颜色定义
$colorGreen  = [System.Drawing.Color]::FromArgb(0x43,0xA0,0x47)
$colorRed    = [System.Drawing.Color]::FromArgb(0xE5,0x39,0x35)
$colorBlue   = [System.Drawing.Color]::FromArgb(0x1E,0x88,0xE5)
$colorGray   = [System.Drawing.Color]::FromArgb(0x75,0x75,0x75)
$colorOrange = [System.Drawing.Color]::FromArgb(0xFB,0x8C,0x00)
$colorBg1    = [System.Drawing.Color]::White
$colorBg2    = [System.Drawing.Color]::FromArgb(0xF5,0xF5,0xF5)
$colorBorder = [System.Drawing.Color]::FromArgb(0xE0,0xE0,0xE0)

$fontBold   = New-Object System.Drawing.Font("Segoe UI",10,[System.Drawing.FontStyle]::Bold)
$fontNormal = New-Object System.Drawing.Font("Segoe UI",9)
$fontSmall  = New-Object System.Drawing.Font("Segoe UI",8)
$fontTitle  = New-Object System.Drawing.Font("Segoe UI",14,[System.Drawing.FontStyle]::Bold)
$fontButton = New-Object System.Drawing.Font("Segoe UI",9,[System.Drawing.FontStyle]::Bold)

# 模块数据
$modules = @(
    [PSCustomObject]@{id="nodejs";  name="Node.js";         desc="JavaScript 运行时环境";      ver=$config.NodeVersion; status="pending"; stext="检测中..."; det=""; btnt="—";   bten=$false; row=$null; cb=$null; sb=$null; ll=$null; btn=$null}
    [PSCustomObject]@{id="npm";     name="npm 镜像源";       desc="npm 国内镜像加速";           ver="npmmirror.com";     status="pending"; stext="检测中..."; det=""; btnt="—";   bten=$false; row=$null; cb=$null; sb=$null; ll=$null; btn=$null}
    [PSCustomObject]@{id="git";     name="Git";              desc="版本控制工具";                ver=$config.GitVersion;  status="pending"; stext="检测中..."; det=""; btnt="—";   bten=$false; row=$null; cb=$null; sb=$null; ll=$null; btn=$null}
    [PSCustomObject]@{id="claude";  name="Claude Code CLI";  desc="AI 编程助手命令行工具";      ver="latest";            status="pending"; stext="检测中..."; det=""; btnt="—";   bten=$false; row=$null; cb=$null; sb=$null; ll=$null; btn=$null}
    [PSCustomObject]@{id="mcp";     name="MCP 插件全家桶";   desc="Filesystem/GitHub/SQLite/Puppeteer"; ver="4个插件"; status="pending"; stext="检测中..."; det=""; btnt="—";   bten=$false; row=$null; cb=$null; sb=$null; ll=$null; btn=$null}
    [PSCustomObject]@{id="apikey";  name="API Key";          desc="Anthropic 密钥环境变量";     ver="—";                 status="pending"; stext="检测中..."; det=""; btnt="—";   bten=$false; row=$null; cb=$null; sb=$null; ll=$null; btn=$null}
)

# 当前安装作业跟踪
$currentJob = $null
$currentJobModuleId = $null
$installQueue = @()
$isInstalling = $false

function Update-ModuleUI {
    param($m)
    $fontSmallC = New-Object System.Drawing.Font("Segoe UI",8)

    switch ($m.status) {
        "installed" {
            $m.sb.Text = "✔"
            $m.sb.ForeColor = $colorGreen
            $m.ll.Text = "已安装"
            $m.ll.ForeColor = $colorGreen
            $m.btn.Text = "重装"
            $m.btn.ForeColor = $colorGreen
            $m.btn.Enabled = $true
        }
        "notinstalled" {
            $m.sb.Text = "✘"
            $m.sb.ForeColor = $colorRed
            $m.ll.Text = "未安装"
            $m.ll.ForeColor = $colorRed
            $m.btn.Text = "安装"
            $m.btn.ForeColor = $colorBlue
            $m.btn.Enabled = $true
        }
        "installing" {
            $m.sb.Text = "⟳"
            $m.sb.ForeColor = $colorBlue
            $m.ll.Text = "安装中..."
            $m.ll.ForeColor = $colorBlue
            $m.btn.Text = "安装中"
            $m.btn.Enabled = $false
        }
        "failed" {
            $m.sb.Text = "✘"
            $m.sb.ForeColor = $colorRed
            $m.ll.Text = "失败"
            $m.ll.ForeColor = $colorRed
            $m.btn.Text = "重试"
            $m.btn.ForeColor = $colorOrange
            $m.btn.Enabled = $true
        }
    }
    # 详情
    if ($m.det) {
        $m.row.Controls | Where-Object { $_ -is [System.Windows.Forms.Label] -and $_ -ne $m.ll -and $_ -ne $m.sb -and $_.Font.Size -eq 8 } | ForEach-Object {
            $_.Text = $m.det
        }
    }
}

function New-ModuleRow {
    param($m, $index)

    $row = New-Object System.Windows.Forms.Panel
    $row.Height = 52
    $row.Width = 620
    $row.BackColor = if ($index % 2 -eq 0) { $colorBg1 } else { $colorBg2 }
    $row.BorderStyle = [System.Windows.Forms.BorderStyle]::None
    # bottom line
    $row.Paint = {
        param($sender, $e)
        $e.Graphics.DrawLine([System.Drawing.Pen]::new($colorBorder,1), 0, $sender.Height-1, $sender.Width, $sender.Height-1)
    }

    # CheckBox
    $cb = New-Object System.Windows.Forms.CheckBox
    $cb.Location = New-Object System.Drawing.Point(12, 16)
    $cb.Size = New-Object System.Drawing.Size(18, 18)
    $cb.Checked = $false
    $row.Controls.Add($cb)

    # Status icon (圆形符号)
    $sb = New-Object System.Windows.Forms.Label
    $sb.Location = New-Object System.Drawing.Point(38, 8)
    $sb.Size = New-Object System.Drawing.Size(20, 20)
    $sb.Font = New-Object System.Drawing.Font("Segoe UI",12,[System.Drawing.FontStyle]::Bold)
    $sb.TextAlign = [System.Drawing.ContentAlignment]::MiddleCenter
    $sb.Text = "○"
    $sb.ForeColor = $colorGray
    $row.Controls.Add($sb)

    # 名称
    $nl = New-Object System.Windows.Forms.Label
    $nl.Location = New-Object System.Drawing.Point(62, 6)
    $nl.Size = New-Object System.Drawing.Size(160, 18)
    $nl.Font = $fontBold
    $nl.Text = $m.name
    $row.Controls.Add($nl)

    # 描述
    $dl = New-Object System.Windows.Forms.Label
    $dl.Location = New-Object System.Drawing.Point(62, 26)
    $dl.Size = New-Object System.Drawing.Size(160, 16)
    $dl.Font = $fontSmall
    $dl.ForeColor = $colorGray
    $dl.Text = $m.desc
    $row.Controls.Add($dl)

    # 版本
    $vl = New-Object System.Windows.Forms.Label
    $vl.Location = New-Object System.Drawing.Point(230, 10)
    $vl.Size = New-Object System.Drawing.Size(120, 30)
    $vl.Font = $fontNormal
    $vl.ForeColor = $colorGray
    $vl.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
    $vl.Text = $m.ver
    $row.Controls.Add($vl)

    # 详情（检测结果）
    $detl = New-Object System.Windows.Forms.Label
    $detl.Location = New-Object System.Drawing.Point(230, 28)
    $detl.Size = New-Object System.Drawing.Size(120, 16)
    $detl.Font = $fontSmall
    $detl.ForeColor = $colorGray
    $detl.Text = ""
    $row.Controls.Add($detl)

    # 状态标签
    $ll = New-Object System.Windows.Forms.Label
    $ll.Location = New-Object System.Drawing.Point(370, 8)
    $ll.Size = New-Object System.Drawing.Size(70, 34)
    $ll.Font = $fontBold
    $ll.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
    $ll.Text = "检测中..."
    $ll.ForeColor = $colorGray
    $row.Controls.Add($ll)

    # 操作按钮
    $btn = New-Object System.Windows.Forms.Button
    $btn.Location = New-Object System.Drawing.Point(460, 10)
    $btn.Size = New-Object System.Drawing.Size(88, 30)
    $btn.Font = $fontButton
    $btn.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
    $btn.FlatAppearance.BorderColor = $colorBorder
    $btn.FlatAppearance.BorderSize = 1
    $btn.BackColor = [System.Drawing.Color]::White
    $btn.TextAlign = [System.Drawing.ContentAlignment]::MiddleCenter
    $btn.Cursor = [System.Windows.Forms.Cursors]::Hand
    $btn.Text = $m.btnt
    $btn.Enabled = $m.bten
    $btn.ForeColor = $colorBlue
    $btn.Add_Click({
        $mid = $m.id
        if ($mid -eq "apikey") {
            Show-ApiKeyDialog
        } else {
            Start-ModuleInstall $mid
        }
    })
    $row.Controls.Add($btn)

    # 保存控件引用
    $m.row = $row
    $m.cb = $cb
    $m.sb = $sb
    $m.ll = $ll
    $m.btn = $btn

    return $row
}

# ============================
# 检测所有模块
# ============================
function Invoke-AllDetection {
    $tests = @(
        @{id="nodejs";  f="Test-NodeJsInstall"}
        @{id="npm";     f="Test-NpmRegistry"}
        @{id="git";     f="Test-GitInstall"}
        @{id="claude";  f="Test-ClaudeCodeInstall"}
        @{id="mcp";     f="Test-McpConfig"}
        @{id="apikey";  f="Test-ApiKey"}
    )

    foreach ($t in $tests) {
        $m = $modules | Where-Object { $_.id -eq $t.id }
        if (-not $m) { continue }

        $m.status = "detecting"
        Update-ModuleUI $m

        $result = & $t.f
        if ($result.ok) {
            $m.status = "installed"
            $m.det = $result.d
        } else {
            $m.status = "notinstalled"
            $m.det = $result.d
        }
        Update-ModuleUI $m
        [System.Windows.Forms.Application]::DoEvents()
    }
}

# ============================
# 安装逻辑
# ============================
function Start-ModuleInstall {
    param($moduleId)

    if ($isInstalling) {
        [System.Windows.Forms.MessageBox]::Show("正在安装中，请等待当前安装完成后再操作。","提示")
        return
    }

    $m = $modules | Where-Object { $_.id -eq $moduleId }
    if (-not $m) { return }

    $m.status = "installing"
    $m.btn.Enabled = $false
    Update-ModuleUI $m
    $statusLabel.Text = "正在安装 $($m.name)..."

    $global:currentJobModuleId = $moduleId

    if ($moduleId -eq "apikey") {
        Show-ApiKeyDialog
        return
    }

    $global:isInstalling = $true
    $global:currentJob = Start-Job -Name "Install-$moduleId" -ScriptBlock {
        param($mid, $cfg)

        $config = $cfg

        function Install-NodeJsTask {
            $msi = "$env:TEMP\node_setup.msi"
            Write-Output "STATUS:正在下载 Node.js $($config.NodeVersion)..."
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            Invoke-WebRequest -Uri $config.NodeUrl -OutFile $msi -UseBasicParsing -ErrorAction Stop
            if (-not (Test-Path $msi)) { throw "下载失败: Node.js MSI 未找到" }
            Write-Output "STATUS:正在安装 Node.js (静默安装)..."
            $p = Start-Process msiexec -ArgumentList "/i `"$msi`" /quiet /norestart" -Wait -PassThru
            Remove-Item $msi -Force -ErrorAction SilentlyContinue
            if ($p.ExitCode -ne 0 -and $p.ExitCode -ne 3010) { throw "Node.js 安装失败 ($($p.ExitCode))" }
            $env:Path = [Environment]::GetEnvironmentVariable("Path","Machine")+";"+[Environment]::GetEnvironmentVariable("Path","User")
            $v = & node -v 2>$null
            Write-Output "RESULT:$v"
        }
        function Set-NpmRegistryTask {
            & npm config set registry $config.NpmRegistry 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "npm 镜像设置失败" }
            Write-Output "RESULT:已设置为 $($config.NpmRegistry)"
        }
        function Install-GitTask {
            $exe = "$env:TEMP\git_setup.exe"
            Write-Output "STATUS:正在下载 Git $($config.GitVersion)..."
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            try {
                Invoke-WebRequest -Uri $config.GitUrl -OutFile $exe -UseBasicParsing -ErrorAction Stop
            } catch {
                Write-Output "STATUS:镜像下载失败，尝试 winget..."
                $p = Start-Process winget -ArgumentList "install --id Git.Git -e --source winget --accept-source-agreements --accept-package-agreements" -Wait -PassThru -NoNewWindow
                if ($p.ExitCode -eq 0) { $v = git --version 2>$null; Write-Output "RESULT:$v"; return }
                throw "Git 安装失败: 镜像和 winget 均不可用"
            }
            Write-Output "STATUS:正在安装 Git (静默安装)..."
            $p = Start-Process $exe -ArgumentList "/VERYSILENT /NORESTART /COMPONENTS=`"gitpath,gitlfs`"" -Wait -PassThru
            Remove-Item $exe -Force -ErrorAction SilentlyContinue
            if ($p.ExitCode -ne 0) { throw "Git 安装失败 ($($p.ExitCode))" }
            $env:Path = [Environment]::GetEnvironmentVariable("Path","Machine")+";"+[Environment]::GetEnvironmentVariable("Path","User")
            $v = git --version 2>$null
            Write-Output "RESULT:$v"
        }
        function Install-ClaudeCodeTask {
            Write-Output "STATUS:正在安装 Claude Code CLI..."
            npm install -g @anthropic-ai/claude-code 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "Claude Code 安装失败" }
            $v = claude --version 2>$null
            if (-not $v) { $v = "已安装 (npx)" }
            Write-Output "RESULT:$v"
        }
        function Install-McpPluginsTask {
            Write-Output "STATUS:正在安装 MCP 插件 (4个)..."
            npm install -g @modelcontextprotocol/server-filesystem @modelcontextprotocol/server-github @modelcontextprotocol/server-sqlite @modelcontextprotocol/server-puppeteer 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "MCP 包安装失败" }
            Write-Output "STATUS:正在生成 MCP 配置..."
            $d = "$env:USERPROFILE\.claude"
            if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
            $cf = "$d\settings.json"
            if (Test-Path $cf) { Copy-Item $cf "$cf.bak" -Force }
            $cfgObj = @{mcpServers=@{filesystem=@{command="npx";args=@("-y","@modelcontextprotocol/server-filesystem","$env:USERPROFILE\Desktop","$env:USERPROFILE\Documents")};github=@{command="npx";args=@("-y","@modelcontextprotocol/server-github")};sqlite=@{command="npx";args=@("-y","@modelcontextprotocol/server-sqlite","$env:USERPROFILE\.claude\claude.db")};puppeteer=@{command="npx";args=@("-y","@modelcontextprotocol/server-puppeteer")}}}
            $cfgObj | ConvertTo-Json -Depth 10 | Set-Content -Path $cf -Encoding UTF8
            Write-Output "RESULT:已配置 4 个 MCP 插件"
        }

        switch ($mid) {
            "nodejs" { Install-NodeJsTask }
            "npm"    { Set-NpmRegistryTask }
            "git"    { Install-GitTask }
            "claude" { Install-ClaudeCodeTask }
            "mcp"    { Install-McpPluginsTask }
        }
    } -ArgumentList $moduleId, $config

    $installTimer.Enabled = $true
}

function Show-ApiKeyDialog {
    $inputForm = New-Object System.Windows.Forms.Form
    $inputForm.Text = "设置 API Key"
    $inputForm.Size = New-Object System.Drawing.Size(480, 200)
    $inputForm.StartPosition = "CenterParent"
    $inputForm.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedDialog
    $inputForm.MaximizeBox = $false
    $inputForm.MinimizeBox = $false
    $inputForm.Font = $fontNormal
    $inputForm.BackColor = [System.Drawing.Color]::White

    $tip = New-Object System.Windows.Forms.Label
    $tip.Location = New-Object System.Drawing.Point(20, 20)
    $tip.Size = New-Object System.Drawing.Size(440, 40)
    $tip.Text = "输入你的 Anthropic API Key（以 sk-ant- 开头）`nKey 仅保存在当前电脑的环境变量中，不会上传到任何服务器。"
    $tip.Font = $fontNormal

    $tb = New-Object System.Windows.Forms.TextBox
    $tb.Location = New-Object System.Drawing.Point(20, 70)
    $tb.Size = New-Object System.Drawing.Size(440, 24)
    $tb.Font = New-Object System.Drawing.Font("Consolas",11)
    $tb.UseSystemPasswordChar = $true

    $showCb = New-Object System.Windows.Forms.CheckBox
    $showCb.Location = New-Object System.Drawing.Point(20, 100)
    $showCb.Size = New-Object System.Drawing.Size(120, 20)
    $showCb.Text = "显示密钥"
    $showCb.Add_CheckedChanged({
        $tb.UseSystemPasswordChar = -not $showCb.Checked
    })

    $okBtn = New-Object System.Windows.Forms.Button
    $okBtn.Location = New-Object System.Drawing.Point(280, 125)
    $okBtn.Size = New-Object System.Drawing.Size(85, 30)
    $okBtn.Text = "保存"
    $okBtn.Font = $fontButton
    $okBtn.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
    $okBtn.BackColor = $colorBlue
    $okBtn.ForeColor = [System.Drawing.Color]::White
    $okBtn.FlatAppearance.BorderSize = 0
    $okBtn.DialogResult = [System.Windows.Forms.DialogResult]::OK

    $cancelBtn = New-Object System.Windows.Forms.Button
    $cancelBtn.Location = New-Object System.Drawing.Point(375, 125)
    $cancelBtn.Size = New-Object System.Drawing.Size(85, 30)
    $cancelBtn.Text = "取消"
    $cancelBtn.Font = $fontNormal
    $cancelBtn.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
    $cancelBtn.DialogResult = [System.Windows.Forms.DialogResult]::Cancel

    $inputForm.Controls.AddRange(@($tip, $tb, $showCb, $okBtn, $cancelBtn))
    $inputForm.AcceptButton = $okBtn
    $inputForm.CancelButton = $cancelBtn
    $inputForm.Topmost = $true

    $result = $inputForm.ShowDialog()
    if ($result -eq [System.Windows.Forms.DialogResult]::OK -and $tb.Text.Trim() -ne "") {
        $key = $tb.Text.Trim()
        try {
            Set-ApiKeyTask $key
            $m = $modules | Where-Object { $_.id -eq "apikey" }
            if ($m) {
                $m.status = "installed"
                $m.det = "$($key.Substring(0,8))****"
                Update-ModuleUI $m
            }
            $statusLabel.Text = "API Key 已保存"
            $statusLabel.ForeColor = $colorGreen
        } catch {
            $m = $modules | Where-Object { $_.id -eq "apikey" }
            if ($m) {
                $m.status = "failed"
                $m.det = $_.Exception.Message
                Update-ModuleUI $m
            }
            $statusLabel.Text = "API Key 保存失败"
            $statusLabel.ForeColor = $colorRed
        }
    }
}

function Install-All {
    if ($global:isInstalling) {
        [System.Windows.Forms.MessageBox]::Show("正在安装中，请等待当前安装完成。","提示")
        return
    }
    $pending = $modules | Where-Object { $_.status -eq "notinstalled" -and $_.cb.Checked }
    if ($pending.Count -eq 0) {
        # If none checked, use all uninstalled
        $pending = $modules | Where-Object { $_.status -eq "notinstalled" }
    }
    if ($pending.Count -eq 0) {
        [System.Windows.Forms.MessageBox]::Show("所有组件已安装完成，无需操作。","提示")
        return
    }

    $global:installQueue = @($pending | ForEach-Object { $_.id })
    Process-NextInQueue
}

function Process-NextInQueue {
    if ($global:installQueue.Count -eq 0) {
        $statusLabel.Text = "全部安装完成"
        $statusLabel.ForeColor = $colorGreen
        return
    }

    $nextId = $global:installQueue[0]
    if ($global:installQueue.Count -le 1) {
        $global:installQueue = @()
    } else {
        $global:installQueue = $global:installQueue[1..($global:installQueue.Count-1)]
    }

    Start-ModuleInstall $nextId
}

# ============================
# 构建主窗体
# ============================
$form = New-Object System.Windows.Forms.Form
$form.Text = "Claude Code 模块安装工具 v1.0"
$form.Size = New-Object System.Drawing.Size(660, 520)
$form.MinimumSize = New-Object System.Drawing.Size(660, 520)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedSingle
$form.MaximizeBox = $false
$form.BackColor = [System.Drawing.Color]::White
$form.Icon = [System.Drawing.Icon]::ExtractAssociatedIcon((Get-Command powershell).Source)

# Header
$header = New-Object System.Windows.Forms.Panel
$header.Dock = "Top"
$header.Height = 65
$header.BackColor = [System.Drawing.Color]::FromArgb(0x1a,0x1a,0x2e)

$titleLabel = New-Object System.Windows.Forms.Label
$titleLabel.Location = New-Object System.Drawing.Point(20, 14)
$titleLabel.Size = New-Object System.Drawing.Size(500, 28)
$titleLabel.Font = $fontTitle
$titleLabel.ForeColor = [System.Drawing.Color]::White
$titleLabel.Text = "⚡ Claude Code 模块安装工具"
$header.Controls.Add($titleLabel)

$subtitleLabel = New-Object System.Windows.Forms.Label
$subtitleLabel.Location = New-Object System.Drawing.Point(22, 42)
$subtitleLabel.Size = New-Object System.Drawing.Size(500, 18)
$subtitleLabel.Font = $fontSmall
$subtitleLabel.ForeColor = [System.Drawing.Color]::FromArgb(0xAA,0xAA,0xCC)
$subtitleLabel.Text = "自动检测本地环境 → 按需选择安装 → 一键补齐"
$header.Controls.Add($subtitleLabel)

$form.Controls.Add($header)

# Module list panel
$listPanel = New-Object System.Windows.Forms.Panel
$listPanel.Dock = "Fill"
$listPanel.Padding = New-Object System.Windows.Forms.Padding(10, 5, 10, 5)
$listPanel.AutoScroll = $true

foreach ($m in $modules) {
    $row = New-ModuleRow $m $modules.IndexOf($m)
    $listPanel.Controls.Add($row)
    # Wrap in reverse order for Dock Top stacking
}

# Un-docktop: arrange from top
$y = 0
for ($i = $modules.Count - 1; $i -ge 0; $i--) {
    $modules[$i].row.Dock = "Top"
}
# Re-order: Since they dock from bottom-up, we need to set their Dock before adding to form
# Actually, let's use a FlowLayoutPanel instead for simplicity
$listPanel.Controls.Clear()

$flowPanel = New-Object System.Windows.Forms.FlowLayoutPanel
$flowPanel.Dock = "Fill"
$flowPanel.FlowDirection = [System.Windows.Forms.FlowDirection]::TopDown
$flowPanel.WrapContents = $false
$flowPanel.AutoScroll = $true
$flowPanel.Padding = New-Object System.Windows.Forms.Padding(5, 0, 0, 0)

foreach ($m in $modules) {
    $row = New-ModuleRow $m $modules.IndexOf($m)
    $flowPanel.Controls.Add($row)
}

$listPanel.Controls.Add($flowPanel)
$form.Controls.Add($listPanel)

# Bottom bar
$bottomBar = New-Object System.Windows.Forms.Panel
$bottomBar.Dock = "Bottom"
$bottomBar.Height = 55
$bottomBar.BackColor = [System.Drawing.Color]::White
$bottomBar.BorderStyle = [System.Windows.Forms.BorderStyle]::None

# separator line
$sep = New-Object System.Windows.Forms.Label
$sep.Dock = "Top"
$sep.Height = 1
$sep.BackColor = $colorBorder
$sep.Text = ""
$bottomBar.Controls.Add($sep)

$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Location = New-Object System.Drawing.Point(20, 18)
$statusLabel.Size = New-Object System.Drawing.Size(280, 22)
$statusLabel.Font = $fontNormal
$statusLabel.Text = "就绪，正在检测环境..."
$statusLabel.ForeColor = $colorGray
$bottomBar.Controls.Add($statusLabel)

# Select all checkbox
$selectAllCb = New-Object System.Windows.Forms.CheckBox
$selectAllCb.Location = New-Object System.Drawing.Point(300, 18)
$selectAllCb.Size = New-Object System.Drawing.Size(55, 22)
$selectAllCb.Text = "全选"
$selectAllCb.Font = $fontNormal
$selectAllCb.Add_CheckedChanged({
    foreach ($m in $modules) {
        if ($m.status -eq "notinstalled") { $m.cb.Checked = $selectAllCb.Checked }
    }
})
$bottomBar.Controls.Add($selectAllCb)

function New-ToolButton {
    param($text, $x, $bgColor, $fgColor, $clickHandler)
    $btn = New-Object System.Windows.Forms.Button
    $btn.Location = New-Object System.Drawing.Point($x, 14)
    $btn.Size = New-Object System.Drawing.Size(105, 28)
    $btn.Font = $fontButton
    $btn.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
    $btn.FlatAppearance.BorderSize = 0
    $btn.BackColor = $bgColor
    $btn.ForeColor = $fgColor
    $btn.Text = $text
    $btn.Cursor = [System.Windows.Forms.Cursors]::Hand
    $btn.Add_Click($clickHandler)
    return $btn
}

$installSelectedBtn = New-ToolButton "安装选中" 360 $colorBlue [System.Drawing.Color]::White {
    Install-All
}
$bottomBar.Controls.Add($installSelectedBtn)

$installAllBtn = New-ToolButton "一键安装全部" 470 $colorGreen [System.Drawing.Color]::White {
    # Check all uninstalled, then install all
    foreach ($m in $modules) { if ($m.status -eq "notinstalled") { $m.cb.Checked = $true } }
    Install-All
}
$bottomBar.Controls.Add($installAllBtn)

$form.Controls.Add($bottomBar)

# ============================
# 安装状态轮询定时器
# ============================
$installTimer = New-Object System.Windows.Forms.Timer
$installTimer.Interval = 300
$installTimer.Add_Tick({
    if (-not $global:currentJob) {
        $installTimer.Enabled = $false
        return
    }

    $job = $global:currentJob
    $moduleId = $global:currentJobModuleId

    if ($job.State -eq 'Completed' -or $job.State -eq 'Failed' -or $job.State -eq 'Stopped') {
        $installTimer.Enabled = $false

        $output = Receive-Job $job 2>&1
        Remove-Job $job -Force
        $resultLines = @($output | Out-String) -split "`n"

        $m = $modules | Where-Object { $_.id -eq $moduleId }
        if ($m) {
            $hasError = ($job.State -eq 'Failed' -or $job.State -eq 'Stopped')
            foreach ($line in $resultLines) {
                if ($line -match "^STATUS:(.+)") {
                    $statusLabel.Text = $matches[1]
                    [System.Windows.Forms.Application]::DoEvents()
                }
                if ($line -match "^RESULT:(.+)") {
                    $m.status = "installed"
                    $m.det = $matches[1].Trim()
                    $hasError = $false
                    Update-ModuleUI $m
                    $statusLabel.Text = "$($m.name) 安装成功"
                    $statusLabel.ForeColor = $colorGreen
                }
            }
            if ($hasError -or $m.status -ne "installed") {
                $m.status = "failed"
                $m.det = "安装出错，请检查网络后重试"
                Update-ModuleUI $m
                $statusLabel.Text = "$($m.name) 安装失败"
                $statusLabel.ForeColor = $colorRed
            }
        }
        $global:currentJob = $null
        $global:isInstalling = $false

        # Process next in queue
        Process-NextInQueue
    } else {
        # Still running - update status
        $m = $modules | Where-Object { $_.id -eq $moduleId }
        if ($m) {
            $statusLabel.Text = "正在安装 $($m.name)..."
        }
    }
})

# ============================
# 启动检测
# ============================

# 在 Form_Shown 中执行检测
$form.Add_Shown({
    $statusLabel.Text = "正在检测本地环境..."
    $statusLabel.ForeColor = $colorGray

    # 使用 Timer 延迟检测，让窗口先显示
    $detectTimer = New-Object System.Windows.Forms.Timer
    $detectTimer.Interval = 100
    $detectTimer.Add_Tick({
        $detectTimer.Enabled = $false
        $detectTimer.Dispose()
        Invoke-AllDetection
        $statusLabel.Text = "就绪 — 勾选要安装的组件，点击「安装选中」或「一键安装全部」"
        $statusLabel.ForeColor = $colorGray
    })
    $detectTimer.Start()
})

# ============================
# 启动
# ============================
[System.Windows.Forms.Application]::EnableVisualStyles()
[void]$form.ShowDialog()
