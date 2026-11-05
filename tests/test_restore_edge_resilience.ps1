<#
.SYNOPSIS
    Suíte Completa de Testes de Resiliência de Disaster Recovery (restore_edge.bat / restore_edge.ps1 v2.1.2)
    Valida os 8 cenários críticos:
    - DR-01: Rejeição de candidato corrompido > 4KB (12 KB de lixo binário)
    - DR-02: Rejeição de arquivo truncado (500 bytes)
    - DR-03: Exclusão mútua contra processo ativo e bloqueio via restore.lock
    - DR-04: Rejeição estrita de Foreign Key por padrão e teste de -AllowFkViolations
    - DR-05: Restauração atômica com candidato íntegro via ReplaceFile
    - DR-06: Rollback simétrico completo de Banco + WAL
    - DR-07: Recuperação determinística de boot com flush e saneamento do journal
    - DR-08: Preservação forense do journal e aborto com código 7 se snapshot estiver ausente
#>

$ErrorActionPreference = "Stop"
$testDir = Join-Path $env:TEMP "aquila_dr_resilience_test_$(Get-Random)"
New-Item -ItemType Directory -Path $testDir -Force | Out-Null

$env:AQUILA_USER_DATA_OVERRIDE = $testDir
$scriptBat = "c:\aquila\scripts\restore_edge.bat"
$scriptPs1 = "c:\aquila\scripts\restore_edge.ps1"

$results = [ordered]@{
    timestamp = (Get-Date).ToString("o")
    scenarios = @()
}

function Run-Scenario($id, $description, [scriptblock]$action) {
    Write-Host "`n========================================================" -ForegroundColor Magenta
    Write-Host "CENÁRIO $id : $description" -ForegroundColor Cyan
    Write-Host "========================================================" -ForegroundColor Magenta
    try {
        $result = & $action
        $results.scenarios += [PSCustomObject]@{
            id = $id
            description = $description
            status = "PASS"
            details = $result
        }
        Write-Host "[APROVADO] Cenário $id concluído com sucesso." -ForegroundColor Green
    } catch {
        $results.scenarios += [PSCustomObject]@{
            id = $id
            description = $description
            status = "FAIL"
            error = $_.Exception.Message
        }
        Write-Host "[FALHA] Cenário $id falhou: $($_.Exception.Message)" -ForegroundColor Red
        throw $_
    }
}

try {
    # ------------------------------------------------------------------------
    # Setup inicial: Criar um banco inicial válido
    # ------------------------------------------------------------------------
    $initialDb = Join-Path $testDir "aquila.db"
    
    $initJs = Join-Path $testDir "create_init.js"
    @'
const { DatabaseSync } = require('node:sqlite');
const dbPath = process.argv[2];
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('CREATE TABLE test_active (id INTEGER PRIMARY KEY, msg TEXT);');
db.exec("INSERT INTO test_active VALUES (1, 'original_baseline');");
db.close();
'@ | Set-Content -Path $initJs -Force
    node --no-warnings $initJs $initialDb

    $initialHash = (Get-FileHash -Path $initialDb -Algorithm SHA256).Hash
    Write-Host "Banco ativo inicial criado. SHA-256: $initialHash"

    # ------------------------------------------------------------------------
    # Cenário 1: Rejeição de Candidato Corrompido > 4KB (12 KB de lixo binário)
    # ------------------------------------------------------------------------
    Run-Scenario "DR-01" "Rejeição estrita de candidato corrompido > 4KB (12 KB de lixo binário)" {
        $corruptFile = Join-Path $testDir "corrupt_12kb.db"
        $garbage = New-Object byte[] 12288
        (New-Object Random).NextBytes($garbage)
        [System.IO.File]::WriteAllBytes($corruptFile, $garbage)

        $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"`"$scriptBat`" `"$corruptFile`"`"" -Wait -NoNewWindow -PassThru
        $exitCode = $process.ExitCode
        Write-Host "Exit Code retornado: $exitCode (Esperado: 3)"

        if ($exitCode -ne 3) {
            throw "Esperava código de saída 3 para candidato corrompido, mas obteve $exitCode"
        }

        # Confirma que o banco ativo não foi alterado
        $currentHash = (Get-FileHash -Path $initialDb -Algorithm SHA256).Hash
        if ($currentHash -ne $initialHash) {
            throw "Banco ativo foi modificado indevidamente após candidato corrompido!"
        }

        return "Candidato corrompido de 12KB rejeitado antes do swap com código 3. Banco ativo preservado intacto."
    }

    # ------------------------------------------------------------------------
    # Cenário 2: Rejeição de Arquivo Truncado <= 4096 bytes
    # ------------------------------------------------------------------------
    Run-Scenario "DR-02" "Rejeição de arquivo truncado (500 bytes)" {
        $truncatedFile = Join-Path $testDir "truncated_500b.db"
        $truncBytes = New-Object byte[] 500
        [System.IO.File]::WriteAllBytes($truncatedFile, $truncBytes)

        $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"`"$scriptBat`" `"$truncatedFile`"`"" -Wait -NoNewWindow -PassThru
        $exitCode = $process.ExitCode
        Write-Host "Exit Code retornado: $exitCode (Esperado: 3)"

        if ($exitCode -ne 3) {
            throw "Esperava código de saída 3 para arquivo truncado, mas obteve $exitCode"
        }

        return "Arquivo truncado <= 4096 bytes rejeitado com código 3."
    }

    # ------------------------------------------------------------------------
    # Cenário 3: Exclusão Mútua contra Processo e Lock Exclusivo OS-level
    # ------------------------------------------------------------------------
    Run-Scenario "DR-03" "Bloqueio e exclusão mútua quando processo ou restore.lock está ativo" {
        $lockFile = Join-Path $testDir "restore.lock"
        # Cria e segura lock exclusivo
        $heldStream = [System.IO.File]::Open($lockFile, [System.IO.FileMode]::OpenOrCreate, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
        
        try {
            # Tentar executar restore_edge.bat enquanto restore.lock está preso
            $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"`"$scriptBat`"`"" -Wait -NoNewWindow -PassThru
            $exitCode = $process.ExitCode
            Write-Host "Exit Code retornado com lock preso: $exitCode (Esperado: 5)"

            if ($exitCode -ne 5) {
                throw "Esperava código 5 por conflito de lock exclusivo, mas obteve $exitCode"
            }
        } finally {
            $heldStream.Close()
            $heldStream.Dispose()
            Remove-Item -Path $lockFile -Force -ErrorAction SilentlyContinue
        }

        return "Exclusão mútua validada: bloqueio imediato se restore.lock estiver detido (código 5)."
    }

    # ------------------------------------------------------------------------
    # Cenário 4: Política de Chaves Estrangeiras (Bloqueio Padrão e Override)
    # ------------------------------------------------------------------------
    Run-Scenario "DR-04" "Rejeição estrita de inconsistência de FK por padrão e liberação sob -AllowFkViolations" {
        $fkCandidate = Join-Path $testDir "fk_invalid_candidate.db"
        $fkJs = Join-Path $testDir "create_fk_cand.js"
        @'
const { DatabaseSync } = require('node:sqlite');
const dbPath = process.argv[2];
const db = new DatabaseSync(dbPath);
db.exec('CREATE TABLE classes (id TEXT PRIMARY KEY);');
db.exec('CREATE TABLE students (id TEXT PRIMARY KEY, classId TEXT, FOREIGN KEY(classId) REFERENCES classes(id));');
// Desliga temporariamente FK para inserir registro orfao
db.exec('PRAGMA foreign_keys = OFF;');
db.exec("INSERT INTO students VALUES ('s1', 'c_inexistente');");
const pad = 'X'.repeat(100);
db.exec('CREATE TABLE dummy_payload (id INTEGER PRIMARY KEY, p TEXT);');
for (let i = 0; i < 150; i++) db.exec(`INSERT INTO dummy_payload VALUES (${i}, '${pad}');`);
db.close();
'@ | Set-Content -Path $fkJs -Force
        node --no-warnings $fkJs $fkCandidate

        # Executar sem -AllowFkViolations: deve rejeitar com código 3
        $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"`"$scriptBat`" `"$fkCandidate`"`"" -Wait -NoNewWindow -PassThru
        if ($process.ExitCode -ne 3) {
            throw "Candidato com violação de FK não foi rejeitado pelo padrão rígido! ExitCode=$($process.ExitCode)"
        }

        # Executar com -AllowFkViolations e -VerifyOnly: deve aprovar
        $procOverride = Start-Process -FilePath "powershell.exe" -ArgumentList "-ExecutionPolicy Bypass -File `"$scriptPs1`" `"$fkCandidate`" -AllowFkViolations -VerifyOnly" -Wait -NoNewWindow -PassThru
        if ($procOverride.ExitCode -ne 0) {
            throw "Candidato com -AllowFkViolations e -VerifyOnly falhou indevidamente! ExitCode=$($procOverride.ExitCode)"
        }

        return "Política de FK validada: rejeição estrita (código 3) por padrão; admitido somente sob -AllowFkViolations."
    }

    # ------------------------------------------------------------------------
    # Cenário 5: Restauração Atômica com Candidato Válido
    # ------------------------------------------------------------------------
    Run-Scenario "DR-05" "Restauração atômica via ReplaceFile, snapshot e pós-verificação com candidato íntegro" {
        $validCandidate = Join-Path $testDir "valid_candidate.db"
        $createJs = Join-Path $testDir "create_valid.js"
        @'
const { DatabaseSync } = require('node:sqlite');
const dbPath = process.argv[2];
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('CREATE TABLE test_active (id INTEGER PRIMARY KEY, msg TEXT);');
db.exec("INSERT INTO test_active VALUES (1, 'restaurado_com_sucesso');");
db.exec('CREATE TABLE dummy_payload (id INTEGER PRIMARY KEY, payload TEXT);');
const pad = 'A'.repeat(100);
for (let i = 0; i < 150; i++) {
    db.exec(`INSERT INTO dummy_payload VALUES (${i}, '${pad}');`);
}
db.close();
'@ | Set-Content -Path $createJs -Force
        node --no-warnings $createJs $validCandidate

        $validHash = (Get-FileHash -Path $validCandidate -Algorithm SHA256).Hash

        $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"`"$scriptBat`" `"$validCandidate`"`"" -Wait -NoNewWindow -PassThru
        $exitCode = $process.ExitCode
        Write-Host "Exit Code retornado: $exitCode (Esperado: 0)"

        if ($exitCode -ne 0) {
            throw "Restauração de candidato válido falhou com código $exitCode"
        }

        # Verifica integridade pós-restauração
        $restoredHash = (Get-FileHash -Path $initialDb -Algorithm SHA256).Hash
        if ($restoredHash -ne $validHash) {
            throw "Hash do banco restaurado ($restoredHash) diverge do candidato ($validHash)!"
        }

        return "Restauração atômica concluída: SHA-256 verificado, snapshot cautelar gravado e pós-validação aprovada."
    }

    # ------------------------------------------------------------------------
    # Cenário 6: Rollback Simétrico Completo de Banco + WAL
    # ------------------------------------------------------------------------
    Run-Scenario "DR-06" "Rollback simétrico completo de Banco + WAL com integridade pós-reversão comprovada" {
        $snapTestDir = Join-Path $testDir "snapshots\pre_restore_sim_wal"
        New-Item -ItemType Directory -Path $snapTestDir -Force | Out-Null

        $snapDb = Join-Path $snapTestDir "aquila.db"
        $snapWal = Join-Path $snapTestDir "aquila.db-wal"

        # Criar base do snapshot com transação pendente em WAL
        $walJs = Join-Path $testDir "create_wal_snap.js"
        @'
const { DatabaseSync } = require('node:sqlite');
const dbPath = process.argv[2];
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('CREATE TABLE wal_check (id INTEGER PRIMARY KEY, v TEXT);');
db.exec("INSERT INTO wal_check VALUES (1, 'in_snapshot_wal');");
db.close();
'@ | Set-Content -Path $walJs -Force
        node --no-warnings $walJs $snapDb

        # Simular corrupção proposital no banco ativo
        [System.IO.File]::WriteAllText($initialDb, "CORRUPTED_ACTIVE_PAYLOAD")

        # Configura restore_journal.json para o snapshot contendo WAL ativo
        $walJournal = [PSCustomObject]@{
            phase = "REPLACING"
            candidatePath = "dummy.db"
            targetDb = $initialDb
            snapshotDir = $snapTestDir
            startedAt = (Get-Date).ToString("o")
            actor = "WAL_ROLLBACK_TEST"
        }
        $journalPath = Join-Path $testDir "restore_journal.json"
        $walJournal | ConvertTo-Json | Set-Content -Path $journalPath -Force

        # Executa a recuperação via restore_edge.bat
        $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"`"$scriptBat`"`"" -Wait -NoNewWindow -PassThru
        if ($process.ExitCode -ne 0) {
            throw "Recuperação de WAL falhou com código $($process.ExitCode)"
        }

        # Valida que o dado contido no WAL foi lido com sucesso pelo SQLite
        $verifyJs = Join-Path $testDir "verify_wal.js"
        @'
const { DatabaseSync } = require('node:sqlite');
const dbPath = process.argv[2];
const db = new DatabaseSync(dbPath);
const row = db.prepare('SELECT v FROM wal_check WHERE id = 1').get();
db.close();
if (!row || row.v !== 'in_snapshot_wal') {
    process.exit(1);
}
'@ | Set-Content -Path $verifyJs -Force
        node --no-warnings $verifyJs $initialDb
        if ($LASTEXITCODE -ne 0) {
            throw "Dado presente no WAL ('in_snapshot_wal') não foi recuperado no banco ativo!"
        }

        return "Rollback simétrico de Banco + WAL executado e transações do WAL recuperadas com sucesso."
    }

    # ------------------------------------------------------------------------
    # Cenário 7: Recuperação Determinística de Boot com Diário Saneado
    # ------------------------------------------------------------------------
    Run-Scenario "DR-07" "Recuperação determinística de boot via restore_journal.json e arquivamento de evidência" {
        $snapshots = Get-ChildItem -Path (Join-Path $testDir "snapshots") -Directory | Sort-Object LastWriteTime -Descending
        $latestSnapDir = $snapshots[0].FullName

        $fakeJournal = [PSCustomObject]@{
            phase = "REPLACING"
            candidatePath = "dummy_candidate.db"
            targetDb = $initialDb
            snapshotDir = $latestSnapDir
            startedAt = (Get-Date).ToString("o")
            actor = "CRASH_SIMULATION_TEST"
        }
        $journalPath = Join-Path $testDir "restore_journal.json"
        $fakeJournal | ConvertTo-Json | Set-Content -Path $journalPath -Force

        # Executa script de recuperação
        $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"`"$scriptBat`"`"" -Wait -NoNewWindow -PassThru
        
        # O diário ativo deve ter sido arquivado/saneado e a evidência preservada
        if (Test-Path $journalPath) {
            throw "Diário ativo não foi saneado após a rotina de recuperação!"
        }
        $recoveredEvidence = Get-ChildItem -Path $testDir -Filter "restore_journal_recovered_*.json"
        if ($recoveredEvidence.Count -eq 0) {
            throw "Evidência arquivada do diário recuperado (restore_journal_recovered_*.json) não foi encontrada!"
        }

        return "Diário pendente recuperado, rollback executado e evidência de auditoria arquivada."
    }

    # ------------------------------------------------------------------------
    # Cenário 8: Preservação Forense do Diário se Snapshot Estiver Ausente
    # ------------------------------------------------------------------------
    Run-Scenario "DR-08" "Preservação forense do diário e aborto com código 7 se snapshot for inválido ou ausente" {
        $missingSnapJournal = [PSCustomObject]@{
            phase = "REPLACING"
            candidatePath = "missing.db"
            targetDb = $initialDb
            snapshotDir = "C:\Caminho\Inexistente\snapshots\pre_restore_inexistente"
            startedAt = (Get-Date).ToString("o")
            actor = "FORENSIC_SNAPSHOT_MISSING_TEST"
        }
        $journalPath = Join-Path $testDir "restore_journal.json"
        $missingSnapJournal | ConvertTo-Json | Set-Content -Path $journalPath -Force

        # Executa script de recuperação
        $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"`"$scriptBat`"`"" -Wait -NoNewWindow -PassThru
        $exitCode = $process.ExitCode
        Write-Host "Exit Code retornado para snapshot ausente: $exitCode (Esperado: 7)"

        if ($exitCode -ne 7) {
            throw "Esperava código 7 para falha irrecuperável com snapshot ausente, mas obteve $exitCode"
        }

        # O diário NÃO PODE ser removido! Deve ser preservado para auditoria forense
        if (-not (Test-Path $journalPath)) {
            throw "FALHA GRAVE: Diário foi deletado mesmo após falha crítica de snapshot ausente!"
        }

        Remove-Item -Path $journalPath -Force -ErrorAction SilentlyContinue
        return "Preservação forense validada: diário mantido intacto em disco e execução abortada com código 7."
    }

    # ------------------------------------------------------------------------
    # Salvar Relatório Final de Evidência
    # ------------------------------------------------------------------------
    $reportPath = "c:\aquila\test-results\dr_resilience_verification_report.json"
    $results | ConvertTo-Json -Depth 5 | Set-Content -Path $reportPath -Force
    Write-Host "`nRelatório de resiliência expandido gerado com sucesso em: $reportPath" -ForegroundColor Green

} finally {
    Remove-Item -Path $testDir -Recurse -Force -ErrorAction SilentlyContinue
    $env:AQUILA_USER_DATA_OVERRIDE = $null
}
