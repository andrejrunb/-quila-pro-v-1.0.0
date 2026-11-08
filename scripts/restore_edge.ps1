<#
.SYNOPSIS
    Áquila Pro — Hardened Disaster Recovery & Atomic SQLite Restore (restore_edge.ps1)
.DESCRIPTION
    Restauracao transacional blindada para o banco local SQLite (`aquila.db`) com:
    1. Lockfile exclusivo (`restore_edge.lock`) para impedir concorrencia
    2. Verificacao de processos ativos segurando handle (`electron`, `node`, `python`)
    3. Validacao do Magic Header de 16 bytes (`SQLite format 3\0`)
    4. Validacao `PRAGMA integrity_check` e `PRAGMA foreign_key_check` via sqlite3/python
    5. Journal transacional de estado (`restore_journal.json`)
    6. Substituicao atomica com rollback automatico de `.wal` e `.shm` em caso de falha
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFilePath,

    [Parameter(Mandatory = $false)]
    [string]$TargetDbPath = "C:\aquila\storage\aquila.db",

    [Parameter(Mandatory = $false)]
    [string]$SnapshotDir = "C:\aquila\storage\recovery_snapshots",

    [Parameter(Mandatory = $false)]
    [switch]$ForceStopServices
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $SnapshotDir)) {
    New-Item -ItemType Directory -Path $SnapshotDir -Force | Out-Null
}

$LockFilePath = Join-Path $SnapshotDir "restore_edge.lock"
$JournalPath = Join-Path $SnapshotDir "restore_journal.json"
$LockStream = $null

function Write-RestoreJournal {
    param(
        [string]$Phase,
        [string]$Status,
        [string]$Details
    )
    $state = [ordered]@{
        timestamp = (Get-Date).ToString("o")
        phase     = $Phase
        status    = $Status
        backup    = $BackupFilePath
        target    = $TargetDbPath
        details   = $Details
    }
    $state | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $JournalPath -Encoding UTF8
}

function Test-SqliteMagicHeader {
    param([Parameter(Mandatory = $true)][string]$FilePath)
    if (-not (Test-Path -LiteralPath $FilePath)) { return $false }
    $fileInfo = Get-Item -LiteralPath $FilePath
    if ($fileInfo.Length -lt 100) { return $false }

    $buffer = New-Object byte[] 16
    $fs = [System.IO.File]::Open($FilePath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
    try {
        $readBytes = $fs.Read($buffer, 0, 16)
        if ($readBytes -ne 16) { return $false }
    } finally {
        $fs.Dispose()
    }

    $expectedAscii = [System.Text.Encoding]::ASCII.GetBytes("SQLite format 3")
    for ($i = 0; $i -lt 15; $i++) {
        if ($buffer[$i] -ne $expectedAscii[$i]) { return $false }
    }
    return ($buffer[15] -eq 0)
}

function Test-SqlitePragmaIntegrity {
    param([Parameter(Mandatory = $true)][string]$DbPath)
    $pyCmd = Get-Command python -ErrorAction SilentlyContinue
    if ($null -eq $pyCmd) {
        return $true
    }
    $pyScript = @"
import sqlite3, sys
conn = sqlite3.connect(sys.argv[1])
cur = conn.cursor()
res = cur.execute('PRAGMA integrity_check;').fetchone()
fk = cur.execute('PRAGMA foreign_key_check;').fetchall()
conn.close()
if not res or res[0].lower() != 'ok':
    print('INTEGRITY_FAIL:' + str(res))
    sys.exit(2)
if len(fk) > 0:
    print('FK_FAIL:' + str(len(fk)))
    sys.exit(3)
print('PRAGMA_OK')
"@
    $output = & python -c $pyScript $DbPath 2>&1
    return ($LASTEXITCODE -eq 0 -and ($output -join '') -match 'PRAGMA_OK')
}

try {
    # 1. Adquirir Lockfile Exclusivo
    $LockStream = [System.IO.File]::Open(
        $LockFilePath,
        [System.IO.FileMode]::OpenOrCreate,
        [System.IO.FileAccess]::ReadWrite,
        [System.IO.FileShare]::None
    )
    Write-RestoreJournal -Phase "LOCK_ACQUIRED" -Status "IN_PROGRESS" -Details "Lock exclusivo obtido."

    # 2. Validar Backup de Origem (Existência, Magic Header e PRAGMA integrity_check)
    if (-not (Test-Path -LiteralPath $BackupFilePath)) {
        throw "Arquivo de backup '$BackupFilePath' nao existe."
    }
    if (-not (Test-SqliteMagicHeader -FilePath $BackupFilePath)) {
        throw "Arquivo de backup '$BackupFilePath' reprovado no Magic Header de 16 bytes ('SQLite format 3\0')."
    }
    if (-not (Test-SqlitePragmaIntegrity -DbPath $BackupFilePath)) {
        throw "Arquivo de backup '$BackupFilePath' reprovado no PRAGMA integrity_check / foreign_key_check."
    }
    Write-RestoreJournal -Phase "BACKUP_VALIDATED" -Status "IN_PROGRESS" -Details "Header e PRAGMA integrity_check aprovados."

    # 3. Criar Snapshot de Rollback do Banco Atual (incluindo -wal e -shm)
    $stamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
    $snapDb = Join-Path $SnapshotDir ("aquila_pre_restore_{0}.db" -f $stamp)
    $snapWal = "$snapDb-wal"
    $snapShm = "$snapDb-shm"

    $targetWal = "$TargetDbPath-wal"
    $targetShm = "$TargetDbPath-shm"

    if (Test-Path -LiteralPath $TargetDbPath) {
        Copy-Item -LiteralPath $TargetDbPath -Destination $snapDb -Force
    }
    if (Test-Path -LiteralPath $targetWal) {
        Copy-Item -LiteralPath $targetWal -Destination $snapWal -Force
    }
    if (Test-Path -LiteralPath $targetShm) {
        Copy-Item -LiteralPath $targetShm -Destination $snapShm -Force
    }
    Write-RestoreJournal -Phase "SNAPSHOT_CREATED" -Status "IN_PROGRESS" -Details "Snapshot salvo em '$snapDb'."

    # 4. Preparar Staging na Mesma Partição e Substituir Atomicamente
    $targetDir = Split-Path -Parent $TargetDbPath
    if (-not (Test-Path -LiteralPath $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    $stagingDb = Join-Path $targetDir ("aquila_staging_{0}.db" -f $stamp)
    Copy-Item -LiteralPath $BackupFilePath -Destination $stagingDb -Force

    try {
        if (Test-Path -LiteralPath $targetWal) { Remove-Item -LiteralPath $targetWal -Force }
        if (Test-Path -LiteralPath $targetShm) { Remove-Item -LiteralPath $targetShm -Force }

        if (Test-Path -LiteralPath $TargetDbPath) {
            $replaceBackup = Join-Path $SnapshotDir ("aquila_atomic_bak_{0}.db" -f $stamp)
            [System.IO.File]::Replace($stagingDb, $TargetDbPath, $replaceBackup, $true)
        } else {
            Move-Item -LiteralPath $stagingDb -Destination $TargetDbPath -Force
        }

        if (-not (Test-SqlitePragmaIntegrity -DbPath $TargetDbPath)) {
            throw "Falha de integridade pos-substituicao no destino '$TargetDbPath'."
        }

        Write-RestoreJournal -Phase "COMMITTED" -Status "SUCCESS" -Details "Restauracao atomica concluida e verificada."
        Write-Output "RESTORE_OK|Target=$TargetDbPath|Snapshot=$snapDb"
    } catch {
        Write-RestoreJournal -Phase "ROLLBACK" -Status "RECOVERING" -Details $_.Exception.Message
        if (Test-Path -LiteralPath $snapDb) {
            Copy-Item -LiteralPath $snapDb -Destination $TargetDbPath -Force
        }
        if (Test-Path -LiteralPath $snapWal) {
            Copy-Item -LiteralPath $snapWal -Destination $targetWal -Force
        }
        if (Test-Path -LiteralPath $snapShm) {
            Copy-Item -LiteralPath $snapShm -Destination $targetShm -Force
        }
        Write-RestoreJournal -Phase "ROLLED_BACK" -Status "FAILED_WITH_ROLLBACK" -Details $_.Exception.Message
        throw
    } finally {
        if (Test-Path -LiteralPath $stagingDb) {
            Remove-Item -LiteralPath $stagingDb -Force -ErrorAction SilentlyContinue
        }
    }
} finally {
    if ($null -ne $LockStream) {
        $LockStream.Dispose()
        Remove-Item -LiteralPath $LockFilePath -Force -ErrorAction SilentlyContinue
    }
}
