# Áquila Pro - Build Orchestrator (v1.3.0-RC1)
$ErrorActionPreference = "Stop"

Write-Host "--- AQUILA PRO BUILD ORCHESTRATOR ---" -ForegroundColor Cyan

$baseDir = Get-Location
Write-Host "Base: $baseDir"

# 1. Clean
Write-Host "[1/5] Cleaning old artifacts..." -ForegroundColor Yellow
$folders = @("dist", "build", "release")
foreach ($f in $folders) {
    if (Test-Path $f) {
        Remove-Item -Path $f -Recurse -Force
        Write-Host "  Removed: $f"
    }
}

# 2. Build Renderer (Vite)
Write-Host "[2/5] Building Renderer (Vite)..." -ForegroundColor Yellow
& npm run build:renderer
if ($LASTEXITCODE -ne 0) { throw "Vite build failed!" }

# 3. Build Main (TSC)
Write-Host "[3/5] Building Main Process (TSC)..." -ForegroundColor Yellow
& node scripts/build-electron.js
if ($LASTEXITCODE -ne 0) { throw "Electron build failed!" }

# 4. Verification
Write-Host "[4/5] Verifying output integrity..." -ForegroundColor Yellow
if (-not (Test-Path "dist/main.js")) { throw "Missing dist/main.js!" }
if (-not (Test-Path "dist/index.html")) { throw "Missing dist/index.html!" }
Write-Host "  Integrity [OK]" -ForegroundColor Green

# 5. Pack Unpacked (Verification)
Write-Host "[5/5] Generating Unpacked Application (Verification)..." -ForegroundColor Yellow
& npx electron-builder --dir
if ($LASTEXITCODE -ne 0) { throw "Electron Builder Pack failed!" }

Write-Host "--- BUILD COMPLETED SUCCESSFULLY (v1.3.0-RC1) ---" -ForegroundColor Green
Write-Host "Run release/win-unpacked/Áquila Pro.exe to test."
