Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$port = 8080
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$serverProcess = $null

# Create visual form
$form = New-Object System.Windows.Forms.Form
$form.Text = "顾力菡 · 应用工坊 - 本地服务器"
$form.Size = New-Object System.Drawing.Size(480, 320)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.BackColor = "#0a0a14"
$form.Font = New-Object System.Drawing.Font("Microsoft YaHei", 10)

# Title
$title = New-Object System.Windows.Forms.Label
$title.Text = "🧩 顾力菡 · 应用工坊"
$title.ForeColor = "#e8e8f0"
$title.Font = New-Object System.Drawing.Font("Microsoft YaHei", 16, [System.Drawing.FontStyle]::Bold)
$title.Size = New-Object System.Drawing.Size(440, 40)
$title.Location = New-Object System.Drawing.Point(20, 20)
$title.TextAlign = "MiddleCenter"
$form.Controls.Add($title)

# Status
$status = New-Object System.Windows.Forms.Label
$status.Text = "正在启动服务器..."
$status.ForeColor = "#9999b0"
$status.Size = New-Object System.Drawing.Size(440, 24)
$status.Location = New-Object System.Drawing.Point(20, 70)
$status.TextAlign = "MiddleCenter"
$form.Controls.Add($status)

# URL display
$urlLabel = New-Object System.Windows.Forms.Label
$urlLabel.Text = ""
$urlLabel.ForeColor = "#7c5cfc"
$urlLabel.Font = New-Object System.Drawing.Font("Microsoft YaHei", 12, [System.Drawing.FontStyle]::Bold)
$urlLabel.Size = New-Object System.Drawing.Size(440, 30)
$urlLabel.Location = New-Object System.Drawing.Point(20, 100)
$urlLabel.TextAlign = "MiddleCenter"
$form.Controls.Add($urlLabel)

# Info
$info = New-Object System.Windows.Forms.Label
$info.Text = "所有文件在本地运行，数据不上传任何服务器"
$info.ForeColor = "#5cfca0"
$info.Size = New-Object System.Drawing.Size(440, 20)
$info.Location = New-Object System.Drawing.Point(20, 140)
$info.TextAlign = "MiddleCenter"
$form.Controls.Add($info)

# Open browser button
$openBtn = New-Object System.Windows.Forms.Button
$openBtn.Text = "🌐 打开浏览器"
$openBtn.Size = New-Object System.Drawing.Size(180, 40)
$openBtn.Location = New-Object System.Drawing.Point(60, 180)
$openBtn.BackColor = "#7c5cfc"
$openBtn.ForeColor = "White"
$openBtn.FlatStyle = "Flat"
$openBtn.Add_Click({ Start-Process "http://localhost:$port" })
$form.Controls.Add($openBtn)

# Stop button
$stopBtn = New-Object System.Windows.Forms.Button
$stopBtn.Text = "⏹ 关闭服务器"
$stopBtn.Size = New-Object System.Drawing.Size(180, 40)
$stopBtn.Location = New-Object System.Drawing.Point(250, 180)
$stopBtn.BackColor = "#fc5c9c"
$stopBtn.ForeColor = "White"
$stopBtn.FlatStyle = "Flat"
$stopBtn.Add_Click({
    $status.Text = "正在关闭..."
    $status.ForeColor = "#fc5c9c"
    $form.Close()
})
$form.Controls.Add($stopBtn)

# Footer
$footer = New-Object System.Windows.Forms.Label
$footer.Text = "关闭此窗口即停止本地服务器"
$footer.ForeColor = "#666680"
$footer.Font = New-Object System.Drawing.Font("Microsoft YaHei", 9)
$footer.Size = New-Object System.Drawing.Size(440, 20)
$footer.Location = New-Object System.Drawing.Point(20, 245)
$footer.TextAlign = "MiddleCenter"
$form.Controls.Add($footer)

# Start local server
function Start-LocalServer {
    param([string]$dir, [int]$port)

    # Try Python first
    $python = $null
    foreach ($cmd in @("python", "python3", "py")) {
        if (Get-Command $cmd -ErrorAction SilentlyContinue) {
            $python = $cmd; break
        }
    }

    if ($python) {
        $script = @"
import http.server
import socketserver
import os

os.chdir(r'$dir')
Handler = http.server.SimpleHTTPRequestHandler

class CustomHandler(Handler):
    def guess_type(self, path):
        mime = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.css': 'text/css',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml',
        }
        ext = os.path.splitext(path)[1].lower()
        return mime.get(ext, 'application/octet-stream')

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        Handler.end_headers(self)

with socketserver.TCPServer(('', $port), CustomHandler) as httpd:
    httpd.serve_forever()
"@
        $scriptPath = Join-Path $dir "_server_script.py"
        Set-Content -Path $scriptPath -Value $script -Encoding utf8
        $script:serverProcess = Start-Process -FilePath $python -ArgumentList $scriptPath -NoNewWindow -PassThru
        return $true
    }

    # Fallback: PowerShell HttpListener
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Start()

    $listenerJob = Start-Job -ScriptBlock {
        param($lst, $dir)
        while ($lst.IsListening) {
            $ctx = $lst.GetContext()
            $req = $ctx.Request; $res = $ctx.Response
            $res.Headers.Add("Access-Control-Allow-Origin", "*")
            $path = $req.Url.LocalPath.TrimStart("/")
            if (!$path) { $path = "index.html" }

            $file = Join-Path $dir $path
            if (!(Test-Path $file)) {
                $res.StatusCode = 404
                $bytes = [Text.Encoding]::UTF8.GetBytes("404: $path not found")
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $bytes = [IO.File]::ReadAllBytes($file)
                $ext = [IO.Path]::GetExtension($file).ToLower()
                $mime = @{
                    '.html' = 'text/html; charset=utf-8'
                    '.js' = 'application/javascript'
                    '.json' = 'application/json'
                    '.css' = 'text/css'
                    '.png' = 'image/png'
                    '.jpg' = 'image/jpeg'
                    '.svg' = 'image/svg+xml'
                }
                if ($mime.ContainsKey($ext)) { $res.ContentType = $mime[$ext] }
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            $res.Close()
        }
        $lst.Close()
    } -ArgumentList $listener, $dir

    $script:listenerJob = $listenerJob
    return $true
}

# Start server
$started = Start-LocalServer -dir $scriptDir -port $port

if ($started) {
    $status.Text = "✅ 服务器运行中"
    $status.ForeColor = "#5cfca0"
    $urlLabel.Text = "http://localhost:$port"
    Start-Process "http://localhost:$port"
}

# Cleanup on form close
$form.Add_FormClosed({
    if ($script:serverProcess -and !$script:serverProcess.HasExited) {
        $script:serverProcess.Kill()
    }
    if ($script:listenerJob) {
        $script:listenerJob | Stop-Job
        $script:listenerJob | Remove-Job
    }
    $cleanupScript = Join-Path $scriptDir "_server_script.py"
    if (Test-Path $cleanupScript) { Remove-Item $cleanupScript }
})

$form.ShowDialog()

# Final cleanup
if ($script:serverProcess -and !$script:serverProcess.HasExited) {
    $script:serverProcess.Kill()
}
if ($script:listenerJob) {
    $script:listenerJob | Stop-Job
    $script:listenerJob | Remove-Job
}
$cleanupScript = Join-Path $scriptDir "_server_script.py"
if (Test-Path $cleanupScript) { Remove-Item $cleanupScript }
