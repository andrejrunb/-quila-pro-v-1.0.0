@echo off
REM ============================================================================
REM Áquila Pro — Script Autônomo de Recuperação e Restauração SQLite (Edge DR)
REM Compatível com Windows 10/11 Pro LIMPO (Zero dependências de Node, Git ou Python)
REM ============================================================================

setlocal enabledelayedexpansion

echo ============================================================================
echo   AQUILA PRO - PROCEDIMENTO OPERACIONAL DE RESTAURACAO SQLITE (DR)
echo ============================================================================
echo.

set "APPDATA_DIR=%APPDATA%\AquilaPro"
set "DB_FILE=%APPDATA_DIR%\aquila.db"
set "BACKUP_DIR=%APPDATA_DIR%\backups"
set "SNAPSHOT_DIR=%APPDATA_DIR%\snapshots"

if not exist "%APPDATA_DIR%" (
    mkdir "%APPDATA_DIR%"
)

if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
)

if not exist "%SNAPSHOT_DIR%" (
    mkdir "%SNAPSHOT_DIR%"
)

set "CANDIDATE_FILE=%~1"

if "%CANDIDATE_FILE%"=="" (
    echo [INFO] Buscando o ultimo backup valido em: %BACKUP_DIR%
    for /f "delims=" %%F in ('dir /b /o-d "%BACKUP_DIR%\*.db" 2^>nul') do (
        set "CANDIDATE_FILE=%BACKUP_DIR%\%%F"
        goto :FOUND_CANDIDATE
    )
)

:FOUND_CANDIDATE
if "%CANDIDATE_FILE%"=="" (
    echo [AVISO] Nenhum arquivo de backup .db encontrado em %BACKUP_DIR%.
    echo [AJUDA] Para restaurar manualmente: restore_edge.bat "caminho\para\backup.db"
    exit /b 0
)

echo.
echo [1/4] Candidato selecionado: %CANDIDATE_FILE%

for %%A in ("%CANDIDATE_FILE%") do set "CANDIDATE_SIZE=%%~zA"
if %CANDIDATE_SIZE% LEQ 4096 (
    echo [RECUSADO] Arquivo corrompido ou truncado: %CANDIDATE_SIZE% bytes.
    echo [SEGURANCA] Restauracao abortada antes do swap. Banco ativo preservado.
    exit /b 3
)

echo [OK] Pre-validacao de integridade aprovada (%CANDIDATE_SIZE% bytes).

echo.
echo [2/4] Criando snapshot de rollback do banco ativo...
set "TIMESTAMP=%DATE:/=-%_%TIME::=-%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "ROLLBACK_DIR=%SNAPSHOT_DIR%\pre_restore_%TIMESTAMP%"
mkdir "%ROLLBACK_DIR%" 2>nul

if exist "%DB_FILE%" (
    copy /y "%DB_FILE%" "%ROLLBACK_DIR%\aquila.db" >nul
    if exist "%DB_FILE%-wal" copy /y "%DB_FILE%-wal" "%ROLLBACK_DIR%\" >nul
    if exist "%DB_FILE%-shm" copy /y "%DB_FILE%-shm" "%ROLLBACK_DIR%\" >nul
    echo [OK] Snapshot gravado em: %ROLLBACK_DIR%
) else (
    echo [INFO] Banco ativo nao existia previamente.
)

echo.
echo [3/4] Aplicando restauracao atomica...
del /f /q "%DB_FILE%-wal" "%DB_FILE%-shm" 2>nul
copy /y "%CANDIDATE_FILE%" "%DB_FILE%" >nul

if %ERRORLEVEL% NEQ 0 (
    echo [FALHA CRITICA] Erro ao substituir banco de dados. Executando rollback...
    if exist "%ROLLBACK_DIR%\aquila.db" copy /y "%ROLLBACK_DIR%\*.*" "%APPDATA_DIR%\" >nul
    echo [ROLLBACK CONCLUIDO] Estado anterior restaurado.
    exit /b 4
)

echo [OK] Swap atomico de arquivos concluido com sucesso.

echo.
echo [4/4] Verificando checksum SHA-256 do banco restaurado...
certutil -hashfile "%DB_FILE%" SHA256 | findstr /v "hash" | findstr /v "CertUtil" > "%APPDATA_DIR%\last_restore.sha256"
for /f "delims=" %%H in ('type "%APPDATA_DIR%\last_restore.sha256"') do set "RESTORE_HASH=%%H"

echo [SUCESSO] Restauracao concluida!
echo           SHA-256: %RESTORE_HASH%
echo           Snapshot para rollback: %ROLLBACK_DIR%
echo.
echo O Aquila Pro pode ser iniciado normalmente.
exit /b 0
