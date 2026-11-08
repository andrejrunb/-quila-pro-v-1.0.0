<#
.SYNOPSIS
    Aquila Pro - Forensic Git History Purge (LGPD Art. 14 & Copyright Hygiene)
.DESCRIPTION
    Rewrites local Git repository history (commits and tags prior to 453d1528) using
    git-filter-repo to permanently purge from Git objects:
    1. All 41 historical PDFs in downloaded_pdfs/ (~1.1 GB of historical blobs)
    2. Pre-anonymized historical blobs of apps/electron/src/database/studentsData.ts,
       restoring the 100% synthetic studentsData.ts (381 ALUNO SINTETICO records) at HEAD.
    3. Runs git reflog expire --expire=now --all and git gc --prune=now --aggressive.

    HITL GOVERNANCE (AGENTS.md Section 1.2):
    Rewriting commit hashes on remote requires the explicit -ConfirmForcePush flag.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$RepoRoot = "C:\aquila",

    [Parameter(Mandatory = $false)]
    [switch]$ExecuteLocalRewrite,

    [Parameter(Mandatory = $false)]
    [switch]$ConfirmForcePush
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Set-Location -LiteralPath $RepoRoot

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "  AQUILA PRO - FORENSIC GIT HISTORY PURGE (LGPD ART. 14)                " -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan

# 1. Verify or install git-filter-repo via Python pip
$hasFilterRepo = $false
try {
    $ver = & python -m git_filter_repo --version 2>$null
    if ($LASTEXITCODE -eq 0) { $hasFilterRepo = $true }
} catch {
    $hasFilterRepo = $false
}

if (-not $hasFilterRepo) {
    Write-Host "[1/4] Installing git-filter-repo via pip..." -ForegroundColor Yellow
    & python -m pip install --quiet git-filter-repo
    Write-Host "[1/4] git-filter-repo installed successfully." -ForegroundColor Green
} else {
    Write-Host "[1/4] git-filter-repo detected and ready." -ForegroundColor Green
}

# 2. Save safe snapshot of current 100% synthetic studentsData.ts
$syntheticStudentsPath = Join-Path $RepoRoot "apps\electron\src\database\studentsData.ts"
$backupSynthetic = Join-Path $env:TEMP "studentsData_synthetic_head.ts"
if (Test-Path -LiteralPath $syntheticStudentsPath) {
    Copy-Item -LiteralPath $syntheticStudentsPath -Destination $backupSynthetic -Force
    Write-Host "[2/4] Snapshot of synthetic studentsData.ts (381 records) saved to TEMP." -ForegroundColor Green
}

if (-not $ExecuteLocalRewrite) {
    Write-Host "[DRY-RUN] Audit ready. To rewrite local Git objects, run:" -ForegroundColor Yellow
    Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\purge_git_history_lgpd.ps1 -ExecuteLocalRewrite" -ForegroundColor White
    exit 0
}

# 3. Execute git-filter-repo to purge downloaded_pdfs and pre-synthetic blobs
Write-Host "[3/4] Rewriting Git history (purging downloaded_pdfs and pre-synthetic blobs)..." -ForegroundColor Cyan
& python -m git_filter_repo --force --invert-paths `
    --path-glob "*downloaded_pdfs*" `
    --path "apps/electron/src/database/studentsData.ts"

# Restore 100% synthetic studentsData.ts at current HEAD
if (Test-Path -LiteralPath $backupSynthetic) {
    Copy-Item -LiteralPath $backupSynthetic -Destination $syntheticStudentsPath -Force
    & git add "apps/electron/src/database/studentsData.ts"
    & git commit -m "chore(lgpd-art14): restore 100% synthetic studentsData.ts after history purge"
}

# 4. Expire reflog and run aggressive Garbage Collection
Write-Host "[4/4] Running git reflog expire and git gc --prune=now --aggressive..." -ForegroundColor Cyan
& git reflog expire --expire=now --all
& git gc --prune=now --aggressive

if ($ConfirmForcePush) {
    Write-Host "[HITL APPROVED] Updating origin with --force-with-lease..." -ForegroundColor Yellow
    & git push origin HEAD:main --force-with-lease
    & git push origin HEAD:integration/stabilization-and-quarantine --force-with-lease
} else {
    Write-Host "Local history rewrite complete. To push after HITL verification, pass -ConfirmForcePush." -ForegroundColor Green
}
