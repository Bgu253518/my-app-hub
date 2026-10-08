$port = 5000
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

# 找 Python
$python = $null
foreach ($cmd in @("python", "python3", "py")) {
    if (Get-Command $cmd -ErrorAction SilentlyContinue) {
        $python = $cmd; break
    }
}

if ($python) {
    Write-Host "Starting Python server..." -ForegroundColor Green
    Start-Process "http://localhost:$port"
    & $python (Join-Path $scriptDir "rating_server.py")
    exit
}

Write-Host "Starting built-in PowerShell server..." -ForegroundColor Yellow
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Server: http://localhost:$port" -ForegroundColor Green
Start-Process "http://localhost:$port"

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request; $res = $ctx.Response
    $res.Headers.Add("Access-Control-Allow-Origin", "*")
    $path = $req.Url.LocalPath.TrimStart("/")
    if (!$path) { $path = "rating_tool.html" }
    
    if ($path -eq "api/chat" -and $req.HttpMethod -eq "POST") {
        $reader = [IO.StreamReader]::new($req.InputStream)
        $body = $reader.ReadToEnd() | ConvertFrom-Json; $reader.Close()
        try {
            $result = Invoke-RestMethod -Uri $body.api_url -Method Post `
                -Body (@{model=$body.model;messages=@($body.messages);max_tokens=1000} | ConvertTo-Json -Depth 10) `
                -ContentType "application/json" `
                -Headers @{"Authorization"="Bearer $($body.api_key)"} `
                -TimeoutSec 60 -UseBasicParsing
            $bytes = [Text.Encoding]::UTF8.GetBytes(($result|ConvertTo-Json -Depth 10))
            $res.ContentType="application/json"; $res.OutputStream.Write($bytes,0,$bytes.Length)
        } catch {
            $res.StatusCode=500
            $bytes=[Text.Encoding]::UTF8.GetBytes(('{"error":"'+$_.Exception.Message+'"}'))
            $res.OutputStream.Write($bytes,0,$bytes.Length)
        }
        $res.Close(); continue
    }
    
    $file = Join-Path $scriptDir $path
    if (!(Test-Path $file)) {
        $res.StatusCode=404
        $bytes=[Text.Encoding]::UTF8.GetBytes("404: $path not found")
        $res.OutputStream.Write($bytes,0,$bytes.Length)
    } else {
        $bytes=[IO.File]::ReadAllBytes($file)
        if ($file -match "\.html$") { $res.ContentType="text/html; charset=utf-8" }
        $res.OutputStream.Write($bytes,0,$bytes.Length)
    }
    $res.Close()
}
