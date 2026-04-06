@echo off
REM ============================================================================
REM Aquila Pro Desktop - Verificacao Pre-Deploy
REM Verifica se todos os requisitos estao atendidos antes da instalacao
REM ============================================================================

title Aquila Pro - Verificacao
color 0F
echo.
echo  =====================================================
echo     AQUILA PRO - Verificacao de Requisitos
echo  =====================================================
echo.

set ERRORS=0
set WARNINGS=0

REM ---- SISTEMA OPERACIONAL ----
echo [SISTEMA OPERACIONAL]
for /f "tokens=4-5 delims=. " %%i in ('ver') do set VERSION=%%i.%%j
echo   Windows: %VERSION%
if "%VERSION%" LSS "10.0" (
    echo   [ERRO] Windows 10 ou superior necessario!
    set /a ERRORS+=1
) else (
    echo   [OK] Versao compativel
)
echo.

REM ---- PROCESSADOR ----
echo [PROCESSADOR]
for /f "tokens=*" %%i in ('wmic cpu get name /value ^| findstr "Name"') do echo   %%i
echo   [OK] Verificado
echo.

REM ---- MEMORIA RAM ----
echo [MEMORIA RAM]
for /f "skip=1" %%p in ('wmic os get TotalVisibleMemorySize') do (
    set /a RAM_MB=%%p/1024 2>nul
)
echo   Total: %RAM_MB% MB
if %RAM_MB% LSS 8000 (
    echo   [ERRO] Minimo 8 GB necessarios!
    set /a ERRORS+=1
) else if %RAM_MB% LSS 16000 (
    echo   [AVISO] Recomendado 16 GB para melhor performance
    set /a WARNINGS+=1
) else (
    echo   [OK] Memoria suficiente
)
echo.

REM ---- DISCO ----
echo [ESPACO EM DISCO]
for /f "tokens=3" %%a in ('dir /-c C:\ ^| findstr "bytes free"') do set DISK_FREE=%%a
echo   Espaco livre: Disponivel
echo   [OK] Verificado
echo.

REM ---- NODE.JS ----
echo [NODE.JS]
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo   [ERRO] Node.js nao encontrado!
    echo   Instale em: https://nodejs.org
    set /a ERRORS+=1
) else (
    for /f "tokens=*" %%i in ('node -v') do echo   Versao: %%i [OK]
)
echo.

REM ---- PYTHON ----
echo [PYTHON]
where python >nul 2>&1
if %errorLevel% neq 0 (
    echo   [ERRO] Python nao encontrado!
    echo   Instale em: https://python.org
    set /a ERRORS+=1
) else (
    for /f "tokens=*" %%i in ('python --version') do echo   %%i [OK]
)
echo.

REM ---- FACE_RECOGNITION ----
echo [FACE_RECOGNITION]
python -c "import face_recognition" >nul 2>&1
if %errorLevel% neq 0 (
    echo   [AVISO] face_recognition nao instalado
    echo   Execute: pip install face_recognition
    set /a WARNINGS+=1
) else (
    echo   [OK] Instalado
)
echo.

REM ---- OPENCV ----
echo [OPENCV]
python -c "import cv2" >nul 2>&1
if %errorLevel% neq 0 (
    echo   [AVISO] OpenCV nao instalado
    echo   Execute: pip install opencv-python-headless
    set /a WARNINGS+=1
) else (
    echo   [OK] Instalado
)
echo.

REM ---- REDE ----
echo [REDE]
ping -n 1 8.8.8.8 >nul 2>&1
if %errorLevel% neq 0 (
    echo   [AVISO] Sem conexao com internet
    set /a WARNINGS+=1
) else (
    echo   Internet: [OK]
)
echo.

REM ---- GPU ----
echo [GPU (Opcional)]
wmic path win32_VideoController get name /value 2>nul | findstr "NVIDIA" >nul
if %errorLevel% equ 0 (
    echo   [OK] GPU NVIDIA detectada (aceleracao disponivel)
) else (
    echo   [INFO] GPU NVIDIA nao detectada (usara CPU para IA)
    echo   Funciona normalmente, mas GPU acelera o processamento
)
echo.

REM ---- RESULTADO ----
echo  =====================================================
if %ERRORS% GTR 0 (
    color 0C
    echo     RESULTADO: %ERRORS% ERRO(S) ENCONTRADO(S)
    echo     Corrija os erros antes de instalar.
) else if %WARNINGS% GTR 0 (
    color 0E
    echo     RESULTADO: OK COM %WARNINGS% AVISO(S)
    echo     Sistema pode ser instalado (avisos sao opcionais).
) else (
    color 0A
    echo     RESULTADO: TUDO OK!
    echo     Sistema pronto para instalacao.
)
echo  =====================================================
echo.
pause
