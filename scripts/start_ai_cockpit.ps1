<#
.SYNOPSIS
    start_ai_cockpit.ps1 - Inicializador do Cockpit do Navegador Dedicado para o Swarm Multi-IA
.DESCRIPTION
    Inicia o Google Chrome com a porta de depuracao remota 9222 aberta e com um perfil
    dedicado e persistente em C:\Users\Thaysa\.gemini\antigravity-browser-profile.
    Abre as 5 IAs do ecossistema para manter cookies e sessoes ativas permanentemente:
    - Claude (Anthropic)
    - ChatGPT (OpenAI)
    - DeepSeek Chat
    - Perplexity Pro
    - Microsoft Copilot
#>

$chromePaths = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

$chromeExe = $null
foreach ($p in $chromePaths) {
    if (Test-Path $p) {
        $chromeExe = $p
        break
    }
}

if (-not $chromeExe) {
    Write-Error "[ERRO] Google Chrome nao encontrado nos caminhos padrao."
    exit 1
}

$profileDir = "C:\Users\Thaysa\.gemini\antigravity-browser-profile"
if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
    Write-Host "[INFO] Perfil de navegador criado em $profileDir" -ForegroundColor Cyan
}

# Verifica se a porta 9222 ja esta escutando
$portListening = $false
try {
    $conn = New-Object System.Net.Sockets.TcpClient("127.0.0.1", 9222)
    if ($conn.Connected) {
        $portListening = $true
        $conn.Close()
    }
} catch {
    $portListening = $false
}

if ($portListening) {
    Write-Host "[OK] O Chrome Cockpit ja esta em execucao na porta 9222!" -ForegroundColor Green
    exit 0
}

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "  AQUILA PRO - INICIANDO COCKPIT DO NAVEGADOR DEDICADO MULTI-IA           " -ForegroundColor Yellow
Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "[1/2] Abrindo Chrome na porta 9222..." -ForegroundColor Gray

$urls = @(
    "https://claude.ai",
    "https://chatgpt.com",
    "https://chat.deepseek.com",
    "https://www.perplexity.ai",
    "https://copilot.microsoft.com",
    "https://app.briskteaching.com"
)

$arguments = @(
    "--remote-debugging-port=9222",
    "--remote-allow-origins=*",
    "--user-data-dir=`"$profileDir`"",
    "--no-first-run",
    "--no-default-browser-check"
) + $urls

Start-Process -FilePath $chromeExe -ArgumentList ($arguments -join " ")

# Aguarda ate 10 segundos para confirmar que a porta 9222 abriu
$ready = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 500
    try {
        $check = New-Object System.Net.Sockets.TcpClient("127.0.0.1", 9222)
        if ($check.Connected) {
            $ready = $true
            $check.Close()
            break
        }
    } catch {}
}

if ($ready) {
    Write-Host "[2/2] Cockpit Ativo com Sucesso! (CDP escutando em 127.0.0.1:9222)" -ForegroundColor Green
} else {
    Write-Host "[2/2] Processo Chrome iniciado. Aguardando inicializacao da interface..." -ForegroundColor Yellow
}
Write-Host "Porta de depuracao: http://127.0.0.1:9222/json/list" -ForegroundColor Cyan
Write-Host "Perfil Persistente: $profileDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "[AVISO] Faca login uma unica vez em cada aba aberta. As sessoes ficarao gravadas permanentemente." -ForegroundColor Yellow
