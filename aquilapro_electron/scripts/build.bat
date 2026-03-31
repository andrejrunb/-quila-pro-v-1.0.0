@echo off
REM ============================================================================
REM Aquila Pro Desktop - Script de Build para Windows
REM Gera o instalador .exe para distribuicao
REM ============================================================================

title Aquila Pro - Build
color 0B
echo.
echo  =====================================================
echo     AQUILA PRO - Build do Instalador
echo  =====================================================
echo.

cd /d "%~dp0.."

echo [1/5] Limpando builds anteriores...
if exist dist rmdir /s /q dist
if exist build rmdir /s /q build
if exist release rmdir /s /q release
echo   Limpo [OK]
echo.

echo [2/5] Instalando dependencias...
call npm install
echo   Dependencias instaladas [OK]
echo.

echo [3/5] Compilando TypeScript...
call npx tsc --project tsconfig.json
if %errorLevel% neq 0 (
    echo   [ERRO] Falha na compilacao TypeScript!
    pause
    exit /b 1
)
echo   TypeScript compilado [OK]
echo.

echo [4/5] Compilando React (Vite)...
call npx vite build
if %errorLevel% neq 0 (
    echo   [ERRO] Falha no build do Vite!
    pause
    exit /b 1
)
echo   React compilado [OK]
echo.

echo [5/5] Gerando instalador...
call npx electron-builder --win --x64
if %errorLevel% neq 0 (
    echo   [ERRO] Falha ao gerar instalador!
    pause
    exit /b 1
)
echo   Instalador gerado [OK]
echo.

echo  =====================================================
echo     BUILD CONCLUIDO COM SUCESSO!
echo  =====================================================
echo.
echo  Arquivos gerados em: release\
echo.
dir release\*.exe /b 2>nul
dir release\*.msi /b 2>nul
echo.
echo  Para distribuir, envie o arquivo .exe da pasta release\
echo.
pause
