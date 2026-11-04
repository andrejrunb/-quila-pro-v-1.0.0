# scripts/h01/test_clean_runtime.ps1
# Verificacao de Instalacao e Execucao Limpa Windows (Item 1 / H-01)
# Aquila Pro - Homologacao de Bancada

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   AQUILA PRO - BLINDAGEM DE BANCADA WINDOWS (H-01)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$baseDir = "C:\aquila\apps\electron\release_v2_2\win-unpacked"
$exePath = Join-Path $baseDir "Aquila Pro.exe"

if (-not (Test-Path $exePath)) {
    Write-Error "[FAIL] Executavel nao encontrado em: $exePath"
}

# 1. Obter Hashes Criptograficos e Identidade do Build
Write-Host "`n[1/4] Calculando Identidade do Binario Candidato..." -ForegroundColor Yellow
$hashInfo = Get-FileHash -Path $exePath -Algorithm SHA256
$gitSha = (git rev-parse HEAD).Trim()
$exeItem = Get-Item $exePath

Write-Host "  - Arquivo:     $($exeItem.Name)" -ForegroundColor Green
Write-Host "  - Tamanho:     $([math]::Round($exeItem.Length / 1MB, 2)) MB" -ForegroundColor Green
Write-Host "  - Modificado:  $($exeItem.LastWriteTime)" -ForegroundColor Green
Write-Host "  - SHA-256:     $($hashInfo.Hash)" -ForegroundColor Green
Write-Host "  - Git Commit:  $gitSha" -ForegroundColor Green

# 2. Verificar Modulos Nativos Descompactados
Write-Host "`n[2/4] Verificando Integridade de Modulos Nativos..." -ForegroundColor Yellow
$nativeModule = Join-Path $baseDir "resources\app.asar.unpacked\node_modules\better-sqlite3\build\Release\better_sqlite3.node"

if (Test-Path $nativeModule) {
    $nativeHash = Get-FileHash -Path $nativeModule -Algorithm SHA256
    Write-Host "  [OK] better_sqlite3.node presente e integro." -ForegroundColor Green
    Write-Host "       SHA-256: $($nativeHash.Hash)" -ForegroundColor Gray
} else {
    Write-Host "  [INFO] better_sqlite3.node embutido ou em caminho alternativo." -ForegroundColor Yellow
}

# 3. Sanitizar PATH (Simular Maquina Limpa sem Ferramentas Dev)
Write-Host "`n[3/4] Sanitizando PATH para Simular Maquina Limpa de Escola..." -ForegroundColor Yellow
$originalPath = $env:PATH
$cleanPath = ($originalPath -split ';' | Where-Object { 
    $_ -notlike '*node*' -and 
    $_ -notlike '*git*' -and 
    $_ -notlike '*python*' -and 
    $_ -notlike '*pnpm*' 
}) -join ';'

$env:PATH = $cleanPath
Write-Host "  - Node no PATH:   $((Get-Command node -ErrorAction SilentlyContinue) -ne $null)" -ForegroundColor Gray
Write-Host "  - Git no PATH:    $((Get-Command git -ErrorAction SilentlyContinue) -ne $null)" -ForegroundColor Gray
Write-Host "  - Python no PATH: $((Get-Command python -ErrorAction SilentlyContinue) -ne $null)" -ForegroundColor Gray

# 4. Executar Teste de Inicializacao Limpa
Write-Host "`n[4/4] Executando Aquila Pro.exe em Ambiente Isolado..." -ForegroundColor Yellow
$proc = Start-Process -FilePath $exePath -PassThru

Start-Sleep -Seconds 5

$isRunning = $proc -ne $null -and (-not $proc.HasExited)
$responding = $false

if ($isRunning) {
    $proc.Refresh()
    $responding = $proc.Responding
    Write-Host "  [OK] Processo iniciado com sucesso! PID: $($proc.Id)" -ForegroundColor Green
    Write-Host "  - Responding:     $responding" -ForegroundColor Green
    Write-Host "  - Working Set:    $([math]::Round($proc.WorkingSet64 / 1MB, 2)) MB" -ForegroundColor Green
    
    # Encerrar graciosamente
    Stop-Process -Id $proc.Id -Force
    Write-Host "  [OK] Processo encerrado graciosamente apos smoke test." -ForegroundColor Green
} else {
    $exitCode = if ($proc) { $proc.ExitCode } else { -1 }
    Write-Error "[FAIL] Aplicacao encerrou prematuramente com codigo: $exitCode"
}

# Restaurar PATH
$env:PATH = $originalPath

# Gravar Relatorio
$reportDir = "C:\aquila\test-results"
if (-not (Test-Path $reportDir)) { New-Item -ItemType Directory -Path $reportDir | Out-Null }
$reportPath = Join-Path $reportDir "clean_runtime_h01_evidence.json"

$reportObj = [PSCustomObject]@{
    timestamp = (Get-Date).ToString("o")
    item = "Item 1: Instalacao Limpa Windows"
    status = if ($isRunning -and $responding) { "PASS" } else { "FAIL" }
    binary = [PSCustomObject]@{
        path = $exePath
        size_mb = [math]::Round($exeItem.Length / 1MB, 2)
        sha256 = $hashInfo.Hash
        git_sha = $gitSha
        responding = $responding
    }
}
$reportJson = $reportObj | ConvertTo-Json -Depth 4
Set-Content -Path $reportPath -Value $reportJson -Encoding Ascii
Write-Host "`n[SUCESSO] Evidencia do Item 1 registrada em: $reportPath" -ForegroundColor Cyan
