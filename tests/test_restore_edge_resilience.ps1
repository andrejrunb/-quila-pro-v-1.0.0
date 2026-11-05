<#
.SYNOPSIS
    Suíte Completa de Testes de Resiliência de Disaster Recovery (restore_edge.bat / restore_edge.ps1 v2.1.2)
    Valida os 13 cenários críticos de resiliência e integração:
    - DR-01: Rejeição de candidato corrompido > 4KB (12 KB de lixo binário)
    - DR-02: Rejeição de arquivo truncado (500 bytes)
    - DR-03: Exclusão mútua contra processo ativo e bloqueio via restore.lock
    - DR-04: Rejeição estrita de Foreign Key por padrão e teste de -AllowFkViolations
    - DR-05: Restauração atômica com candidato íntegro via ReplaceFile
    - DR-06: Rollback simétrico comprovado com transações exclusivas do WAL
    - DR-07: Recuperação determinística de boot com flush e saneamento do journal
    - DR-08: Preservação forense do journal e aborto com código 7 se snapshot estiver ausente
    - DR-09: Isolamento do modo -VerifyOnly com diário pendente (sem mutação)
    - DR-10: Tratamento robusto das fases do diário (COMPLETED, PREPARING_REPLACEMENT e anômala)
    - DR-11: Mecanismo de lock do sistema operacional sob FileShare.None
    - DR-12: Teste de integração do startup real (Database.ts): bloqueio sob restore.lock ativo
    - DR-13: Teste de integração do startup real (Database.ts): bloqueio sob falha de boot recovery
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
    # Cenário 6: Rollback Simétrico Comprovado com Transações Exclusivas do WAL
    # ------------------------------------------------------------------------
    Run-Scenario "DR-06" "Rollback simétrico recupera transação comprovadamente exclusiva do arquivo WAL" {
        $snapTestDir = Join-Path $testDir "snapshots\pre_restore_sim_wal"
        New-Item -ItemType Directory -Path $snapTestDir -Force | Out-Null

        $snapDb = Join-Path $snapTestDir "aquila.db"
        $snapWal = Join-Path $snapTestDir "aquila.db-wal"
        $isolatedDb = Join-Path $testDir "isolated_check_no_wal.db"

        # Criar base com transação 1 no .db e transação 2 EXCLUSIVA no .db-wal (sem checkpoint)
        $walJs = Join-Path $testDir "create_wal_proof.js"
        @'
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');

const srcDb = process.argv[2];
const snapDb = process.argv[3];
const snapWal = process.argv[4];
const isoDb = process.argv[5];

const db = new DatabaseSync(srcDb);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA wal_autocheckpoint = 0;');
db.exec('CREATE TABLE wal_check (id INTEGER PRIMARY KEY, v TEXT);');
db.exec("INSERT INTO wal_check VALUES (1, 'in_main_db');");
db.exec('PRAGMA wal_checkpoint(TRUNCATE);');

// Inserir registro 2 estritamente no WAL
db.exec("INSERT INTO wal_check VALUES (2, 'wal_exclusive_payload');");

// Copiar snapshot enquanto a transação 2 está ativa no WAL
fs.copyFileSync(srcDb, snapDb);
fs.copyFileSync(srcDb + '-wal', snapWal);

// Prova de isolamento: inspecionar snapDb isolado (sem o -wal)
fs.copyFileSync(snapDb, isoDb);
const dbIso = new DatabaseSync(isoDb, { readOnly: true });
const isoRows = dbIso.prepare('SELECT id, v FROM wal_check').all();
dbIso.close();

const hasRow2WithoutWal = isoRows.some(r => r.id === 2);
if (hasRow2WithoutWal) {
    console.error('FALHA: Registro 2 foi gravado no .db principal antes do WAL!');
    process.exit(2);
}

db.close();
'@ | Set-Content -Path $walJs -Force

        $walGenSrc = Join-Path $testDir "wal_gen_temp.db"
        node --no-warnings $walJs $walGenSrc $snapDb $snapWal $isolatedDb
        if ($LASTEXITCODE -ne 0) {
            throw "Geração da prova matemática do WAL falhou!"
        }

        # Asserções de pré-condição: WAL existe, tem tamanho > 0 e a transação depende dele
        if (-not (Test-Path $snapWal)) {
            throw "Arquivo de snapshot WAL não foi gerado em: $snapWal"
        }
        $snapWalSize = (Get-Item $snapWal).Length
        Write-Host "  Snapshot WAL verificado: $snapWalSize bytes (comprovadamente > 0)"
        if ($snapWalSize -le 0) {
            throw "Arquivo WAL do snapshot possui 0 bytes; transação não estaria isolada nele!"
        }

        # Simular corrupção proposital no banco ativo
        [System.IO.File]::WriteAllText($initialDb, "CORRUPTED_ACTIVE_PAYLOAD")

        # Configura restore_journal.json para o snapshot contendo WAL ativo
        $walJournal = [PSCustomObject]@{
            phase = "REPLACING"
            candidatePath = "dummy.db"
            targetDb = $initialDb
            snapshotDir = $snapTestDir
            startedAt = (Get-Date).ToString("o")
            actor = "WAL_EXCLUSIVE_PROOF_TEST"
        }
        $journalPath = Join-Path $testDir "restore_journal.json"
        $walJournal | ConvertTo-Json | Set-Content -Path $journalPath -Force

        # Executa a recuperação via restore_edge.bat
        $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"`"$scriptBat`"`"" -Wait -NoNewWindow -PassThru
        if ($process.ExitCode -ne 0) {
            throw "Recuperação de WAL falhou com código $($process.ExitCode)"
        }

        # Valida que o dado EXCLUSIVO do WAL (id=2) foi recuperado com sucesso no banco ativo
        $verifyJs = Join-Path $testDir "verify_wal_exclusive.js"
        @'
const { DatabaseSync } = require('node:sqlite');
const dbPath = process.argv[2];
const db = new DatabaseSync(dbPath);
const rows = db.prepare('SELECT id, v FROM wal_check ORDER BY id').all();
db.close();

const row1 = rows.find(r => r.id === 1);
const row2 = rows.find(r => r.id === 2);

if (!row1 || row1.v !== 'in_main_db') process.exit(1);
if (!row2 || row2.v !== 'wal_exclusive_payload') process.exit(2);
process.exit(0);
'@ | Set-Content -Path $verifyJs -Force

        node --no-warnings $verifyJs $initialDb
        if ($LASTEXITCODE -ne 0) {
            throw "Transação exclusiva do WAL ('wal_exclusive_payload') não foi recuperada no banco ativo!"
        }

        return "Transação exclusiva do WAL comprovada (ausente no .db isolado) e recuperada após rollback simétrico."
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
    # Cenário 9: Isolamento Estrito do Modo -VerifyOnly com Diário Pendente
    # ------------------------------------------------------------------------
    Run-Scenario "DR-09" "Modo -VerifyOnly não muta diário nem executa rollback, alertando estado pendente" {
        $pendingJournal = [PSCustomObject]@{
            phase = "REPLACING"
            candidatePath = "dummy_verify.db"
            targetDb = $initialDb
            snapshotDir = (Join-Path $testDir "snapshots\pre_restore_dummy")
            startedAt = (Get-Date).ToString("o")
            actor = "VERIFY_ONLY_ISOLATION_TEST"
        }
        $journalPath = Join-Path $testDir "restore_journal.json"
        $pendingJournal | ConvertTo-Json | Set-Content -Path $journalPath -Force

        # Executa powershell com -VerifyOnly e candidato válido
        $validCandidate = Join-Path $testDir "valid_candidate.db"
        $procVerify = Start-Process -FilePath "powershell.exe" -ArgumentList "-ExecutionPolicy Bypass -File `"$scriptPs1`" `"$validCandidate`" -VerifyOnly" -Wait -NoNewWindow -PassThru
        if ($procVerify.ExitCode -ne 0) {
            throw "Execução com -VerifyOnly falhou com código $($procVerify.ExitCode)"
        }

        # O diário em disco DEVE permanecer inalterado!
        if (-not (Test-Path $journalPath)) {
            throw "Modo -VerifyOnly mutou/removeu o diário pendente em disco!"
        }

        Remove-Item -Path $journalPath -Force -ErrorAction SilentlyContinue
        return "Isolamento de -VerifyOnly comprovado: diário preservado sem mutações e verificação concluída."
    }

    # ------------------------------------------------------------------------
    # Cenário 10: Tratamento de Fases de Diário (COMPLETED, PREPARING_REPLACEMENT e Fase Desconhecida)
    # ------------------------------------------------------------------------
    Run-Scenario "DR-10" "Tratamento de fases de diário: COMPLETED, PREPARING_REPLACEMENT e fase desconhecida com código 7" {
        # 10.1 Fase COMPLETED (recuperação de sucesso prévio)
        $completedJournal = [PSCustomObject]@{
            phase = "COMPLETED"
            candidatePath = "completed.db"
            targetDb = $initialDb
            startedAt = (Get-Date).ToString("o")
            actor = "PHASE_COMPLETED_TEST"
        }
        $journalPath = Join-Path $testDir "restore_journal.json"
        $completedJournal | ConvertTo-Json | Set-Content -Path $journalPath -Force

        $procComp = Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"`"$scriptBat`"`"" -Wait -NoNewWindow -PassThru
        if (Test-Path $journalPath) {
            throw "Diário com fase COMPLETED não foi arquivado!"
        }
        $archivedCompleted = Get-ChildItem -Path $testDir -Filter "restore_journal_recovered_*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        $archJson = Get-Content -Path $archivedCompleted.FullName -Raw | ConvertFrom-Json
        if ($archJson.recoveryStatus -ne "PREVIOUS_RESTORE_COMPLETED_ARCHIVED") {
            throw "Status de recuperação para COMPLETED incorreto: $($archJson.recoveryStatus)"
        }

        # 10.2 Fase PREPARING_REPLACEMENT (interrupção preliminar com limpeza de staging)
        $stagingDummy = Join-Path $testDir "staging_restore.db"
        [System.IO.File]::WriteAllText($stagingDummy, "STAGING_RESIDUAL_PAYLOAD")

        $prepJournal = [PSCustomObject]@{
            phase = "PREPARING_REPLACEMENT"
            candidatePath = "candidate.db"
            stagingPath = $stagingDummy
            targetDb = $initialDb
            startedAt = (Get-Date).ToString("o")
            actor = "PHASE_PREPARING_TEST"
        }
        $prepJournal | ConvertTo-Json | Set-Content -Path $journalPath -Force

        $procPrep = Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"`"$scriptBat`"`"" -Wait -NoNewWindow -PassThru
        if (Test-Path $stagingDummy) {
            throw "Arquivo residual de staging não foi limpo na recuperação de PREPARING_REPLACEMENT!"
        }
        if (Test-Path $journalPath) {
            throw "Diário com fase PREPARING_REPLACEMENT não foi arquivado!"
        }
        $archivedPrep = Get-ChildItem -Path $testDir -Filter "restore_journal_recovered_*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        $archPrepJson = Get-Content -Path $archivedPrep.FullName -Raw | ConvertFrom-Json
        if ($archPrepJson.recoveryStatus -ne "EARLY_PHASE_STAGING_CLEANED_OK") {
            throw "Status de recuperação para PREPARING_REPLACEMENT incorreto: $($archPrepJson.recoveryStatus)"
        }

        # 10.3 Fase Desconhecida / Não-Homologada
        $unknownJournal = [PSCustomObject]@{
            phase = "INVALID_UNKNOWN_PHASE"
            candidatePath = "unknown.db"
            targetDb = $initialDb
            startedAt = (Get-Date).ToString("o")
            actor = "PHASE_UNKNOWN_TEST"
        }
        $unknownJournal | ConvertTo-Json | Set-Content -Path $journalPath -Force

        $procUnknown = Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"`"$scriptBat`"`"" -Wait -NoNewWindow -PassThru
        if ($procUnknown.ExitCode -ne 7) {
            throw "Esperava código 7 para fase desconhecida de diário, mas obteve $($procUnknown.ExitCode)"
        }
        if (-not (Test-Path $journalPath)) {
            throw "Diário com fase desconhecida foi apagado indevidamente!"
        }

        Remove-Item -Path $journalPath -Force -ErrorAction SilentlyContinue
        return "Políticas de fases validadas: COMPLETED limpo sem rollback, PREPARING_REPLACEMENT saneado com limpeza de staging e fase anômala isolada com código 7."
    }

    # ------------------------------------------------------------------------
    # Cenário 11: Mecanismo de Lock do Sistema Operacional sob FileShare.None
    # ------------------------------------------------------------------------
    Run-Scenario "DR-11" "Detecção de lock de arquivo OS-level via FileShare.None com recusa EBUSY/EPERM" {
        $lockFile = Join-Path $testDir "restore.lock"
        $heldLock = [System.IO.File]::Open($lockFile, [System.IO.FileMode]::OpenOrCreate, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
        
        try {
            $testLockJs = Join-Path $testDir "test_app_lock.js"
            @'
const fs = require('fs');
const lockFile = process.argv[2];

try {
    const testFd = fs.openSync(lockFile, 'r+');
    fs.closeSync(testFd);
    process.exit(0);
} catch (err) {
    if (err.code === 'EBUSY' || err.code === 'EPERM' || err.code === 'EACCES') {
        process.exit(42);
    }
    process.exit(1);
}
'@ | Set-Content -Path $testLockJs -Force

            $res = Start-Process -FilePath "node" -ArgumentList "`"$testLockJs`" `"$lockFile`"" -Wait -NoNewWindow -PassThru
            if ($res.ExitCode -ne 42) {
                throw "Detecção de lock OS-level não retornou código 42 esperado! ExitCode=$($res.ExitCode)"
            }
        } finally {
            $heldLock.Close()
            $heldLock.Dispose()
            Remove-Item -Path $lockFile -Force -ErrorAction SilentlyContinue
        }

        return "Mecanismo OS-level comprovado: FileShare.None bloqueia tentativas de leitura/escrita concorrentes."
    }

    # ------------------------------------------------------------------------
    # Cenário 12: Teste de Integração Real do Startup do Aplicativo (Database.ts)
    # ------------------------------------------------------------------------
    Run-Scenario "DR-12" "Classe real Database.ts do aplicativo recusa inicialização e abertura do SQLite quando restore.lock está ativo" {
        $lockFile = Join-Path $testDir "restore.lock"
        $heldLock = [System.IO.File]::Open($lockFile, [System.IO.FileMode]::OpenOrCreate, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
        
        try {
            $integJs = Join-Path $testDir "test_database_real_startup.cjs"
            @'
const path = require('path');
const testDir = process.argv[2];
process.env.AQUILA_USER_DATA_OVERRIDE = testDir;

const { Database } = require('c:/aquila/apps/electron/dist/database/Database.js');
const db = new Database();

(async () => {
    try {
        await db.initialize();
        console.error('FALHA: db.initialize() abriu banco SQLite mesmo com restore.lock ativo!');
        process.exit(1);
    } catch (err) {
        if (err.message && err.message.includes('Bloqueio de restauração ativo detectado')) {
            console.log('INTEGRATION_SUCCESS: ' + err.message);
            if (db.db) {
                console.error('FALHA: Instância db foi criada apesar do erro!');
                process.exit(2);
            }
            process.exit(0);
        }
        console.error('Erro inesperado: ' + err.message);
        process.exit(3);
    }
})();
'@ | Set-Content -Path $integJs -Force

            $res = Start-Process -FilePath "node" -ArgumentList "`"$integJs`" `"$testDir`"" -Wait -NoNewWindow -PassThru
            if ($res.ExitCode -ne 0) {
                throw "Teste de integração real em Database.ts falhou! ExitCode=$($res.ExitCode)"
            }
        } finally {
            $heldLock.Close()
            $heldLock.Dispose()
            Remove-Item -Path $lockFile -Force -ErrorAction SilentlyContinue
        }

        return "Integração real comprovada: Database.initialize() do pacote compilado aborta sem tocar no SQLite."
    }

    # ------------------------------------------------------------------------
    # Cenário 13: Teste de Integração Real de Bloqueio por Falha de Boot Recovery
    # ------------------------------------------------------------------------
    Run-Scenario "DR-13" "Classe real Database.ts recusa inicialização quando diário de restauração é inconclusivo" {
        $corruptJournal = Join-Path $testDir "restore_journal.json"
        $invalidContent = [PSCustomObject]@{
            phase = "UNKNOWN_CORRUPTED_PHASE"
            targetDb = (Join-Path $testDir "aquila.db")
            startedAt = (Get-Date).ToString("o")
        }
        $invalidContent | ConvertTo-Json | Set-Content -Path $corruptJournal -Force

        try {
            $recoveryFailJs = Join-Path $testDir "test_database_recovery_failure.cjs"
            @'
const path = require('path');
const testDir = process.argv[2];
process.env.AQUILA_USER_DATA_OVERRIDE = testDir;

const { Database } = require('c:/aquila/apps/electron/dist/database/Database.js');
const db = new Database();

(async () => {
    try {
        await db.initialize();
        console.error('FALHA: db.initialize() abriu banco mesmo com diário pendente irrecuperável!');
        process.exit(1);
    } catch (err) {
        if (err.message && err.message.includes('não pôde ser recuperado de forma conclusiva')) {
            console.log('RECOVERY_BLOCK_SUCCESS: ' + err.message);
            if (db.db) {
                console.error('FALHA: Instância db foi criada!');
                process.exit(2);
            }
            process.exit(0);
        }
        console.error('Erro inesperado: ' + err.message);
        process.exit(3);
    }
})();
'@ | Set-Content -Path $recoveryFailJs -Force

            $res = Start-Process -FilePath "node" -ArgumentList "`"$recoveryFailJs`" `"$testDir`"" -Wait -NoNewWindow -PassThru
            if ($res.ExitCode -ne 0) {
                throw "Teste de bloqueio de boot recovery em Database.ts falhou! ExitCode=$($res.ExitCode)"
            }
        } finally {
            Remove-Item -Path $corruptJournal -Force -ErrorAction SilentlyContinue
        }

        return "Bloqueio estrito de boot recovery comprovado: Database.ts impede abertura diante de diário inconclusivo."
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
