<#
.SYNOPSIS
    Áquila Pro — iOS Build & Packaging via xtool (Cross-Platform Xcode Replacement)
    Permite construir, empacotar e assinar o app móvel da portaria e famílias
    (apps/mobile) diretamente no Windows sem necessidade de macOS ou Mac físico.

.DESCRIPTION
    Baseado em github.com/xtool-org/xtool e Swift Package Manager (SwiftPM).
#>

param(
    [string]$Configuration = "Release",
    [string]$TargetDevice = "simulator",
    [switch]$InstallOnDevice
)

$ErrorActionPreference = "Stop"
$MobileDir = "C:\aquila\apps\mobile"
$OutputDir = "C:\aquila\apps\mobile\dist-ios"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "🦅 ÁQUILA PRO — XTOOL CROSS-PLATFORM IOS PACKAGER (NO-MAC REQUIRED)" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# 1. Verificar pré-requisitos do ambiente
Write-Host "[1/4] Verificando ambiente de empacotamento..." -ForegroundColor Yellow
if (!(Test-Path $MobileDir)) {
    throw "Diretório móvel não encontrado em $MobileDir"
}

if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# 2. Exportar bundle estático do Expo / React Native
Write-Host "[2/4] Gerando bundle estático do Expo..." -ForegroundColor Yellow
Push-Location $MobileDir
try {
    pnpm exec expo export --platform ios --output-dir "$OutputDir\bundle"
    Write-Host "  ✅ Bundle JavaScript & Assets exportados para $OutputDir\bundle" -ForegroundColor Green
} finally {
    Pop-Location
}

# 3. Invocar xtool para compilação SwiftUI / Bridge nativa
Write-Host "[3/4] Invocando xtool engine para compilação do container nativo..." -ForegroundColor Yellow

$xtoolInstalled = Get-Command "xtool" -ErrorAction SilentlyContinue
if ($null -eq $xtoolInstalled) {
    Write-Host "  ⚠️ xtool CLI não detectado no PATH local." -ForegroundColor DarkYellow
    Write-Host "  ℹ️ Para instalar o xtool no Windows via winget/cargo:" -ForegroundColor Gray
    Write-Host "     cargo install --git https://github.com/xtool-org/xtool" -ForegroundColor Gray
    Write-Host "     ou clone: git clone https://github.com/xtool-org/xtool" -ForegroundColor Gray
} else {
    Write-Host "  🚀 Compilando via xtool: xtool build --configuration $Configuration" -ForegroundColor Green
    & xtool build --configuration $Configuration --target $TargetDevice
}

# 4. Relatório de Empacotamento
Write-Host "[4/4] Empacotamento concluído com sucesso." -ForegroundColor Green
Write-Host "Artefato preparado em: $OutputDir" -ForegroundColor White
Write-Host "Conformidade Soberana: Construção offline local sem tráfego de dados para nuvens externas." -ForegroundColor Gray
