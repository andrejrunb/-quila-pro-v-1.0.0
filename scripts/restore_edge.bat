@echo off
REM ============================================================================
REM Áquila Pro — Script Autônomo e Transacional de Restauração SQLite (Edge DR)
REM Compatível com Windows 10/11 Pro LIMPO (Zero dependências de Node, Git ou Python)
REM Implementa exclusão mútua, integridade via winsqlite3.dll, staging atômico e restore_journal.json
REM ============================================================================

setlocal
set "SCRIPT_DIR=%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%restore_edge.ps1" %*
set "EXIT_CODE=%ERRORLEVEL%"

exit /b %EXIT_CODE%
