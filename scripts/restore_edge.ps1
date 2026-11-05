<#
.SYNOPSIS
    Aquila Pro - Script Autonomo e Transacional de Recuperacao SQLite (Edge DR v2.1.2)
    Compativel com Windows 10/11 Pro Limpo (Zero dependencias de Node, Python ou Git).
    Implementa exclusao mutua com lock de processo, recuperacao deterministica de crash,
    rollback simetrico de banco+WAL+SHM, politicas estritas de FK e swap atomico.
#>

[CmdletBinding()]
param(
    [Parameter(Position=0)]
    [string]$CandidateFile = "",
    
    [Parameter()]
    [string]$TargetDb = "",
    
    [Parameter()]
    [switch]$AllowFkViolations = $false,

    [Parameter()]
    [switch]$VerifyOnly = $false
)

$ErrorActionPreference = "Stop"

# ============================================================================
# CODIGO NATIVO C# COM WINSQLITE3.DLL (NATIVO DO WINDOWS 10/11)
# ============================================================================
$nativeSource = @"
using System;
using System.IO;
using System.Runtime.InteropServices;

public class WinSqliteCore {
    [DllImport("winsqlite3.dll", EntryPoint = "sqlite3_open_v2", CallingConvention = CallingConvention.Cdecl)]
    public static extern int Open(string filename, out IntPtr db, int flags, string vfs);

    [DllImport("winsqlite3.dll", EntryPoint = "sqlite3_close_v2", CallingConvention = CallingConvention.Cdecl)]
    public static extern int Close(IntPtr db);

    [DllImport("winsqlite3.dll", EntryPoint = "sqlite3_prepare_v2", CallingConvention = CallingConvention.Cdecl)]
    public static extern int Prepare(IntPtr db, string sql, int numBytes, out IntPtr stmt, IntPtr tail);

    [DllImport("winsqlite3.dll", EntryPoint = "sqlite3_step", CallingConvention = CallingConvention.Cdecl)]
    public static extern int Step(IntPtr stmt);

    [DllImport("winsqlite3.dll", EntryPoint = "sqlite3_column_text", CallingConvention = CallingConvention.Cdecl)]
    public static extern IntPtr ColumnText(IntPtr stmt, int col);

    [DllImport("winsqlite3.dll", EntryPoint = "sqlite3_finalize", CallingConvention = CallingConvention.Cdecl)]
    public static extern int Finalize(IntPtr stmt);

    public static string CheckIntegrity(string dbPath) {
        if (!File.Exists(dbPath)) return "ERR_FILE_NOT_FOUND";
        IntPtr db = IntPtr.Zero;
        // SQLITE_OPEN_READONLY = 0x00000001
        int rc = Open(dbPath, out db, 1, null);
        if (rc != 0 || db == IntPtr.Zero) return "ERR_OPEN_" + rc;

        IntPtr stmt = IntPtr.Zero;
        try {
            rc = Prepare(db, "PRAGMA integrity_check;", -1, out stmt, IntPtr.Zero);
            if (rc != 0 || stmt == IntPtr.Zero) return "ERR_PREPARE_" + rc;

            int stepRc = Step(stmt);
            if (stepRc == 100) {
                IntPtr textPtr = ColumnText(stmt, 0);
                return Marshal.PtrToStringAnsi(textPtr);
            }
            return "ERR_NO_ROW_" + stepRc;
        } catch (Exception ex) {
            return "ERR_EXCEPTION_" + ex.Message;
        } finally {
            if (stmt != IntPtr.Zero) Finalize(stmt);
            if (db != IntPtr.Zero) Close(db);
        }
    }

    public static int CheckForeignKeys(string dbPath) {
        if (!File.Exists(dbPath)) return -1;
        IntPtr db = IntPtr.Zero;
        int rc = Open(dbPath, out db, 1, null);
        if (rc != 0 || db == IntPtr.Zero) return -1;

        IntPtr stmt = IntPtr.Zero;
        int violations = 0;
        try {
            rc = Prepare(db, "PRAGMA foreign_key_check;", -1, out stmt, IntPtr.Zero);
            if (rc != 0 || stmt == IntPtr.Zero) return -2;

            while (Step(stmt) == 100) {
                violations++;
            }
            return violations;
        } catch {
            return -3;
        } finally {
            if (stmt != IntPtr.Zero) Finalize(stmt);
            if (db != IntPtr.Zero) Close(db);
        }
    }
}
"@

if (-not ([System.Management.Automation.PSTypeName]'WinSqliteCore').Type) {
    Add-Type -TypeDefinition $nativeSource
}

# ============================================================================
# FUNCOES NUCLEARES: PERSISTENCIA ATOMICA E ROLLBACK COMPLETO
# ============================================================================

function Save-JournalAtomic([string]$path, $obj) {
    $tmpPath = "$path.tmp.$([System.Guid]::NewGuid().ToString('N'))"
    $json = $obj | ConvertTo-Json -Depth 5
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)

    $stream = [System.IO.File]::Open($tmpPath, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
    try {
        $stream.Write($bytes, 0, $bytes.Length)
        $stream.Flush($true)
    } finally {
        $stream.Close()
        $stream.Dispose()
    }

    if (Test-Path $path) {
        $backupTmp = "$path.old.$([System.Guid]::NewGuid().ToString('N'))"
        [System.IO.File]::Replace($tmpPath, $path, $backupTmp)
        if (Test-Path $backupTmp) { Remove-Item -Path $backupTmp -Force -ErrorAction SilentlyContinue }
    } else {
        [System.IO.File]::Move($tmpPath, $path)
    }
}

function Invoke-RollbackFromSnapshot([string]$snapDir, [string]$targetDb) {
    Write-Host "  [ROLLBACK] Iniciando reversao simetrica completa para o snapshot: $snapDir" -ForegroundColor Yellow
    $snapDb = Join-Path $snapDir "aquila.db"
    $snapWal = Join-Path $snapDir "aquila.db-wal"
    $snapShm = Join-Path $snapDir "aquila.db-shm"

    if (-not (Test-Path $snapDb)) {
        throw "Snapshot principal ($snapDb) nao encontrado para rollback!"
    }

    # 1. Limpar arquivos ativos atuais (db, wal, shm) para evitar estados hibridos
    if (Test-Path $targetDb) { Remove-Item -Path $targetDb -Force }
    if (Test-Path "$targetDb-wal") { Remove-Item -Path "$targetDb-wal" -Force }
    if (Test-Path "$targetDb-shm") { Remove-Item -Path "$targetDb-shm" -Force }

    # 2. Restaurar arquivo principal aquila.db
    Copy-Item -Path $snapDb -Destination $targetDb -Force
    $restoredSize = (Get-Item $targetDb).Length
    $snapSize = (Get-Item $snapDb).Length
    if ($restoredSize -ne $snapSize) {
        throw "Rollback truncado: tamanho do arquivo principal diverge ($restoredSize != $snapSize)!"
    }

    # 3. Restaurar WAL do snapshot se presente; se ausente no snapshot, assegurar que nao exista no destino
    if (Test-Path $snapWal) {
        Copy-Item -Path $snapWal -Destination "$targetDb-wal" -Force
        $snapWalSize = (Get-Item $snapWal).Length
        $restoredWalSize = (Get-Item "$targetDb-wal").Length
        if ($snapWalSize -ne $restoredWalSize) {
            throw "Rollback truncado no arquivo WAL!"
        }
        Write-Host "  [ROLLBACK] Arquivo WAL sincronizado do snapshot ($restoredWalSize bytes)." -ForegroundColor DarkYellow
    }

    # 4. Restaurar SHM se presente no snapshot
    if (Test-Path $snapShm) {
        Copy-Item -Path $snapShm -Destination "$targetDb-shm" -Force
    }

    # 5. Validar integridade pos-rollback
    $check = [WinSqliteCore]::CheckIntegrity($targetDb)
    if ($check -ne "ok") {
        throw "Rollback falhou na verificacao de integridade SQLite: '$check'!"
    }
    Write-Host "  [ROLLBACK CONCLUIDO] Estado integro restaurado a partir do snapshot (PRAGMA integrity_check = ok)." -ForegroundColor Green
}

# ============================================================================
# DIRETORIOS E CAMINHOS OPERACIONAIS
# ============================================================================
$appDataDir = if ($env:AQUILA_USER_DATA_OVERRIDE) { $env:AQUILA_USER_DATA_OVERRIDE } else { Join-Path $env:APPDATA "AquilaPro" }
$dbFile = if ($TargetDb -ne "") { $TargetDb } else { Join-Path $appDataDir "aquila.db" }
$backupDir = Join-Path $appDataDir "backups"
$snapshotDir = Join-Path $appDataDir "snapshots"
$journalFile = Join-Path $appDataDir "restore_journal.json"
$lockFile = Join-Path $appDataDir "restore.lock"

foreach ($dir in @($appDataDir, $backupDir, $snapshotDir)) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  AQUILA PRO - RESTAURACAO TRANSACIONAL DISASTER RECOVERY (EDGE DR v2.1.2)  " -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "Ambiente: Windows 10/11 Pro (Motor winsqlite3.dll)"
Write-Host "Diretorio Ativo: $appDataDir"
Write-Host "Banco Ativo:     $dbFile"
Write-Host ""

$lockStream = $null

try {
    # ============================================================================
    # ETAPA 1: EXCLUSAO MUTUA E ADQUISICAO DE LOCK EXCLUSIVO (ANTES DE QUALQUER OPERACAO)
    # ============================================================================
    Write-Host "[1/7] Adquirindo bloqueio exclusivo e verificando exclusao mutua..." -ForegroundColor Cyan

    # 1.1 Inspecao de processos ativos
    $runningProcesses = @(Get-Process | Where-Object { $_.ProcessName -like "*Aquila Pro*" -or $_.ProcessName -eq "electron" })
    if ($runningProcesses.Count -gt 0) {
        Write-Host "[RECUSADO] O processo Aquila Pro (ou Electron) esta em execucao:" -ForegroundColor Red
        foreach ($proc in $runningProcesses) {
            Write-Host "  - PID: $($proc.Id) | Nome: $($proc.ProcessName)" -ForegroundColor Red
        }
        Write-Host "[SEGURANCA] Encerre o aplicativo antes de realizar a restauracao para evitar corrupcao de lock SQLite." -ForegroundColor Yellow
        Write-Host "Abortando com codigo 5."
        exit 5
    }

    # 1.2 Lock de arquivo exclusivo OS-level (FileShare.None)
    try {
        $lockStream = [System.IO.File]::Open($lockFile, [System.IO.FileMode]::OpenOrCreate, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
    } catch {
        Write-Host "[RECUSADO] Nao foi possivel adquirir o lock exclusivo ($lockFile). Outra rotina DR ou aplicativo esta ativo." -ForegroundColor Red
        Write-Host "Abortando com codigo 5."
        exit 5
    }
    Write-Host "  [OK] Bloqueio exclusivo adquirido com sucesso. Nenhum processo ativo concorrendo." -ForegroundColor Green

    # ============================================================================
    # ETAPA 2: RECUPERACAO DETERMINISTICA DE CRASH / DIARIO PENDENTE
    # ============================================================================
    if (Test-Path $journalFile) {
        Write-Host "`n[2/7] Detectado diario transacional pendente: $journalFile" -ForegroundColor Yellow
        $journalContent = $null
        try {
            $rawJson = Get-Content -Path $journalFile -Raw
            $journalContent = ConvertFrom-Json -InputObject $rawJson
        } catch {
            $corruptArchive = Join-Path $appDataDir "restore_journal_corrupt_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
            Move-Item -Path $journalFile -Destination $corruptArchive -Force
            Write-Host "[FALHA CRITICA DE RECUPERACAO] O diario de restauracao em disco estava corrompido!" -ForegroundColor Red
            Write-Host "[EVIDENCIA PRESERVADA] Arquivado em: $corruptArchive" -ForegroundColor Red
            Write-Host "Abortando com codigo 7 para analise forense." -ForegroundColor Red
            exit 7
        }

        $phase = $journalContent.phase
        $snapDir = $journalContent.snapshotDir
        Write-Host "  Fase interrompida identificada: $phase" -ForegroundColor Yellow
        Write-Host "  Snapshot de seguranca indicado:  $snapDir" -ForegroundColor Yellow

        if ($phase -eq "REPLACING" -or $phase -eq "READY_FOR_REPLACE" -or $phase -eq "REPLACED_VERIFYING") {
            if ([string]::IsNullOrWhiteSpace($snapDir) -or -not (Test-Path $snapDir)) {
                Write-Host "[FALHA CRITICA DE RECUPERACAO] Diretorio de snapshot ($snapDir) ausente ou inacessivel!" -ForegroundColor Red
                Write-Host "[SEGURANCA] Diario mantido intacto em disco para auditoria forense. Nao foi possivel realizar rollback." -ForegroundColor Red
                exit 7
            }

            try {
                Invoke-RollbackFromSnapshot -snapDir $snapDir -targetDb $dbFile
            } catch {
                $errRollback = $_.Exception.Message
                Write-Host "[FALHA CRITICA NO ROLLBACK DO BOOT] $errRollback" -ForegroundColor Red
                Write-Host "[SEGURANCA] Diario mantido intacto em disco para analise forense." -ForegroundColor Red
                exit 7
            }
        }

        # Conclusao segura do diario recuperado
        $recoveredArchive = Join-Path $appDataDir "restore_journal_recovered_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
        $journalContent | Add-Member -MemberType NoteProperty -Name "recoveredAt" -Value (Get-Date).ToString("o") -Force
        $journalContent | Add-Member -MemberType NoteProperty -Name "recoveryStatus" -Value "ROLLBACK_VERIFIED_OK" -Force
        Save-JournalAtomic -path $recoveredArchive -obj $journalContent
        Remove-Item -Path $journalFile -Force -ErrorAction SilentlyContinue
        Write-Host "  [OK] Diario pendente recuperado e saneado com sucesso. Evidencia arquivada em: $recoveredArchive" -ForegroundColor Green
    } else {
        Write-Host "`n[2/7] Verificacao de diario pendente: Nenhum crash anterior detectado." -ForegroundColor Green
    }

    # ============================================================================
    # ETAPA 3: SELECAO E RESOLUCAO DO ARQUIVO CANDIDATO
    # ============================================================================
    Write-Host "`n[3/7] Localizando arquivo candidato para restauracao..." -ForegroundColor Cyan
    if ([string]::IsNullOrWhiteSpace($CandidateFile)) {
        $latestBackup = Get-ChildItem -Path $backupDir -Filter "*.db" -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if (-not $latestBackup) {
            $latestBackup = Get-ChildItem -Path $backupDir -Filter "*.bak" -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        }
        if ($latestBackup) {
            $CandidateFile = $latestBackup.FullName
        }
    }

    if ([string]::IsNullOrWhiteSpace($CandidateFile) -or -not (Test-Path $CandidateFile)) {
        Write-Host "[AVISO] Nenhum arquivo de backup valido encontrado em: $backupDir" -ForegroundColor Yellow
        Write-Host "Uso operacional: restore_edge.bat [caminho\para\backup.db]"
        exit 0
    }

    $candidateItem = Get-Item $CandidateFile
    $candidateSize = $candidateItem.Length
    $candidateFullName = $candidateItem.FullName
    Write-Host "  Candidato selecionado: $candidateFullName"
    Write-Host "  Tamanho: $candidateSize bytes"

    # ============================================================================
    # ETAPA 4: PRE-VALIDACAO RIGOROSA DE INTEGRIDADE (PRE-FLIGHT CHECK)
    # ============================================================================
    Write-Host "`n[4/7] Executando pre-validacao estrita de integridade (Pre-Flight)..." -ForegroundColor Cyan

    # 4.1 Verificacao de tamanho minimo
    if ($candidateSize -le 4096) {
        Write-Host "[RECUSADO] Arquivo candidato truncado ou menor que o tamanho minimo operacional (4096 bytes). Tamanho: $candidateSize bytes." -ForegroundColor Red
        Write-Host "[SEGURANCA] Banco ativo preservado intacto. Abortando com codigo 3." -ForegroundColor Red
        exit 3
    }

    # 4.2 Validacao do cabecalho binario SQLite (Magic Header 16 bytes)
    try {
        $fileStream = [System.IO.File]::Open($candidateFullName, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
        $magicBuffer = New-Object byte[] 16
        $bytesRead = $fileStream.Read($magicBuffer, 0, 16)
        $fileStream.Close()
        
        $headerString = [System.Text.Encoding]::ASCII.GetString($magicBuffer)
        if (-not $headerString.StartsWith("SQLite format 3")) {
            Write-Host "[RECUSADO] Cabecalho SQLite invalido ou corrompido! Assinatura encontrada: '$headerString'" -ForegroundColor Red
            Write-Host "[SEGURANCA] O arquivo nao e um banco SQLite valido. Banco ativo preservado intacto. Abortando com codigo 3." -ForegroundColor Red
            exit 3
        }
    } catch {
        $errHeader = $_.Exception.Message
        Write-Host "[ERRO] Falha ao ler cabecalho do arquivo candidato: $errHeader" -ForegroundColor Red
        exit 3
    }

    # 4.3 Verificacao com PRAGMA integrity_check via winsqlite3.dll
    Write-Host "  Executando PRAGMA integrity_check no candidato via winsqlite3.dll..." -ForegroundColor DarkGray
    $integrityStatus = [WinSqliteCore]::CheckIntegrity($candidateFullName)
    if ($integrityStatus -ne "ok") {
        Write-Host "[RECUSADO] Falha no PRAGMA integrity_check do candidato: '$integrityStatus'!" -ForegroundColor Red
        Write-Host "[SEGURANCA] Candidato corrompido rejeitado antes de qualquer modificacao no banco ativo. Abortando com codigo 3." -ForegroundColor Red
        exit 3
    }
    Write-Host "  [OK] PRAGMA integrity_check: ok" -ForegroundColor Green

    # 4.4 Verificacao com PRAGMA foreign_key_check via winsqlite3.dll
    $fkResult = [WinSqliteCore]::CheckForeignKeys($candidateFullName)
    if ($fkResult -lt 0) {
        Write-Host "[RECUSADO] Falha ao executar PRAGMA foreign_key_check no candidato (Codigo de erro: $fkResult)!" -ForegroundColor Red
        Write-Host "[SEGURANCA] Nao foi possivel atestar a integridade referencial do candidato. Abortando com codigo 3." -ForegroundColor Red
        exit 3
    }

    if ($fkResult -gt 0) {
        if (-not $AllowFkViolations) {
            Write-Host "[RECUSADO] PRAGMA foreign_key_check detectou $fkResult violacoes referenciais no candidato!" -ForegroundColor Red
            Write-Host "[SEGURANCA] Candidatos com inconsistencia de chave estrangeira sao rejeitados por padrao de governanca soberana." -ForegroundColor Red
            Write-Host "            (Para resgate emergencial de bancos legados, utilize o parametro explicito -AllowFkViolations)." -ForegroundColor Yellow
            Write-Host "Abortando com codigo 3." -ForegroundColor Red
            exit 3
        } else {
            Write-Host "  [ALERTA DE SEGURANCA] Admitindo $fkResult violacoes referenciais sob parametro explicito -AllowFkViolations." -ForegroundColor DarkYellow
        }
    } else {
        Write-Host "  [OK] PRAGMA foreign_key_check: 0 violacoes (Integridade referencial estrita aprovada)." -ForegroundColor Green
    }

    if ($VerifyOnly) {
        Write-Host "`n[VERIFY-ONLY] Pre-validacao concluida com exito. Nenhuma alteracao foi feita no banco ativo." -ForegroundColor Green
        exit 0
    }

    # ============================================================================
    # ETAPA 5: SNAPSHOT CAUTELAR DO BANCO ATIVO COM VALIDACAO DE BYTES
    # ============================================================================
    Write-Host "`n[5/7] Criando snapshot cautelar de rollback com validacao de bytes..." -ForegroundColor Cyan
    $timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
    $rollbackDir = Join-Path $snapshotDir "pre_restore_$timestamp"
    New-Item -ItemType Directory -Path $rollbackDir -Force | Out-Null

    $activeSnapFile = Join-Path $rollbackDir "aquila.db"
    if (Test-Path $dbFile) {
        $activeItem = Get-Item $dbFile
        $activeSize = $activeItem.Length
        Copy-Item -Path $dbFile -Destination $activeSnapFile -Force
        
        # Validacao rigorosa de bytes do snapshot copiado
        $snapItem = Get-Item $activeSnapFile
        $snapSize = $snapItem.Length
        if ($snapSize -ne $activeSize) {
            Write-Host "[FALHA CRITICA] Erro na criacao do snapshot: tamanho divergente (Original: $activeSize, Copiado: $snapSize)." -ForegroundColor Red
            Write-Host "[SEGURANCA] Disco cheio ou permissao negada. O banco ativo NAO foi modificado. Abortando com codigo 4." -ForegroundColor Red
            exit 4
        }
        
        # Copia WAL e SHM com validacao se existirem
        if (Test-Path "$dbFile-wal") {
            $snapWal = Join-Path $rollbackDir "aquila.db-wal"
            Copy-Item -Path "$dbFile-wal" -Destination $snapWal -Force
            if ((Get-Item "$dbFile-wal").Length -ne (Get-Item $snapWal).Length) {
                Write-Host "[FALHA CRITICA] Erro na copia do arquivo WAL para o snapshot!" -ForegroundColor Red
                exit 4
            }
        }
        if (Test-Path "$dbFile-shm") {
            Copy-Item -Path "$dbFile-shm" -Destination (Join-Path $rollbackDir "aquila.db-shm") -Force
        }
        Write-Host "  [OK] Snapshot verificado e gravado em: $rollbackDir ($snapSize bytes)" -ForegroundColor Green
    } else {
        Write-Host "  [INFO] Banco ativo nao existia previamente. Restauracao inicial limpa." -ForegroundColor Cyan
    }

    # ============================================================================
    # ETAPA 6: PERSISTENCIA DO DIARIO TRANSACIONAL, STAGING E SWAP ATOMICO
    # ============================================================================
    Write-Host "`n[6/7] Gravando diario transacional, staging e swap atomico..." -ForegroundColor Cyan
    $journalData = [PSCustomObject]@{
        phase = "PREPARING_REPLACEMENT"
        candidatePath = $candidateFullName
        candidateLength = $candidateSize
        targetDb = $dbFile
        snapshotDir = $rollbackDir
        startedAt = (Get-Date).ToString("o")
        actor = "OPERATIONAL_DR_AGENT"
    }
    Save-JournalAtomic -path $journalFile -obj $journalData
    Write-Host "  [OK] Diario transacional persistido em disco com flush garantido." -ForegroundColor Green

    # Staging em sandbox
    $stagingFile = Join-Path $appDataDir "staging_restore.db"
    if (Test-Path $stagingFile) { Remove-Item -Path $stagingFile -Force }

    Copy-Item -Path $candidateFullName -Destination $stagingFile -Force
    $stagingItem = Get-Item $stagingFile
    $stagingSize = $stagingItem.Length
    if ($stagingSize -ne $candidateSize) {
        Write-Host "[FALHA] Copia em staging truncada! Abortando." -ForegroundColor Red
        Remove-Item -Path $stagingFile -Force -ErrorAction SilentlyContinue
        Remove-Item -Path $journalFile -Force -ErrorAction SilentlyContinue
        exit 4
    }

    # Avanco de fases do diario
    $journalData.phase = "READY_FOR_REPLACE"
    Save-JournalAtomic -path $journalFile -obj $journalData

    $journalData.phase = "REPLACING"
    Save-JournalAtomic -path $journalFile -obj $journalData

    $oldDbBackup = Join-Path $appDataDir "aquila.db.old_$timestamp"
    try {
        # Limpar residuos WAL/SHM antes da substituicao
        if (Test-Path "$dbFile-wal") { Remove-Item -Path "$dbFile-wal" -Force -ErrorAction SilentlyContinue }
        if (Test-Path "$dbFile-shm") { Remove-Item -Path "$dbFile-shm" -Force -ErrorAction SilentlyContinue }

        # Swap atomico via File.Replace (kernel Win32 ReplaceFile) se existir destino, ou Move se for primeira criacao
        if (Test-Path $dbFile) {
            [System.IO.File]::Replace($stagingFile, $dbFile, $oldDbBackup)
            if (Test-Path $oldDbBackup) { Remove-Item -Path $oldDbBackup -Force -ErrorAction SilentlyContinue }
        } else {
            [System.IO.File]::Move($stagingFile, $dbFile)
        }
        Write-Host "  [OK] Swap atomico de arquivos concluido com sucesso via API ReplaceFile." -ForegroundColor Green
    } catch {
        $errSwap = $_.Exception.Message
        Write-Host "[FALHA CRITICA NO SWAP] Erro: $errSwap. Executando rollback imediato..." -ForegroundColor Red
        if (Test-Path $activeSnapFile) {
            Invoke-RollbackFromSnapshot -snapDir $rollbackDir -targetDb $dbFile
        }
        exit 6
    }

    # ============================================================================
    # ETAPA 7: POS-VALIDACAO, CHECKSUM SHA-256 E ENCERRAMENTO DO DIARIO
    # ============================================================================
    Write-Host "`n[7/7] Realizando pos-validacao de integridade no banco restaurado..." -ForegroundColor Cyan
    $journalData.phase = "REPLACED_VERIFYING"
    Save-JournalAtomic -path $journalFile -obj $journalData

    $postIntegrity = [WinSqliteCore]::CheckIntegrity($dbFile)
    if ($postIntegrity -ne "ok") {
        Write-Host "[FALHA CRITICA] Pos-validação falhou com status: '$postIntegrity'! Acionando rollback..." -ForegroundColor Red
        if (Test-Path $activeSnapFile) {
            Invoke-RollbackFromSnapshot -snapDir $rollbackDir -targetDb $dbFile
        }
        exit 6
    }
    Write-Host "  [OK] Pos-validacao PRAGMA integrity_check: ok" -ForegroundColor Green

    # Checksum SHA-256
    $sha256 = (Get-FileHash -Path $dbFile -Algorithm SHA256).Hash
    Set-Content -Path (Join-Path $appDataDir "last_restore.sha256") -Value $sha256 -Force

    # Conclusao do Diario Transacional
    $journalData.phase = "COMPLETED"
    Save-JournalAtomic -path $journalFile -obj $journalData
    Remove-Item -Path $journalFile -Force -ErrorAction SilentlyContinue

    Write-Host "`n============================================================================" -ForegroundColor Green
    Write-Host "  RESTAURACAO DISASTER RECOVERY CONCLUIDA COM SUCESSO ABSOLUTO (CRASH-SAFE)  " -ForegroundColor Green
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host "SHA-256 do Banco Ativo: $sha256"
    Write-Host "Snapshot de Rollback:   $rollbackDir"
    Write-Host "Status de Integridade:  Integro (PRAGMA integrity_check = ok)"
    Write-Host "`nO Aquila Pro pode ser iniciado normalmente."
    exit 0

} finally {
    if ($lockStream -ne $null) {
        $lockStream.Close()
        $lockStream.Dispose()
    }
    if (Test-Path $lockFile) {
        Remove-Item -Path $lockFile -Force -ErrorAction SilentlyContinue
    }
}
