@echo off
REM ============================================================================
REM Aquila Pro Desktop - Configuracao Inicial da Escola
REM Execute apos a instalacao para configurar o sistema
REM ============================================================================

title Aquila Pro - Configuracao Inicial
color 0E
echo.
echo  =====================================================
echo     AQUILA PRO - Configuracao Inicial
echo     Assistente de Primeira Configuracao
echo  =====================================================
echo.

echo  Este assistente vai configurar o Aquila Pro para
echo  sua escola. Tenha em maos:
echo.
echo    - Nome da escola
echo    - Numero de salas a monitorar
echo    - IPs das cameras (Hikvision/Intelbras)
echo    - Lista de turmas e alunos
echo.
pause
echo.

REM ---- DADOS DA ESCOLA ----
echo  === DADOS DA ESCOLA ===
echo.
set /p SCHOOL_NAME="  Nome da escola: "
set /p SCHOOL_CITY="  Cidade: "
set /p SCHOOL_STATE="  Estado (UF): "
set /p SCHOOL_ROOMS="  Numero de salas: "
set /p SCHOOL_STUDENTS="  Numero estimado de alunos: "
echo.

REM ---- DADOS DO ADMINISTRADOR ----
echo  === ADMINISTRADOR DO SISTEMA ===
echo.
set /p ADMIN_NAME="  Nome do administrador: "
set /p ADMIN_EMAIL="  Email: "
set /p ADMIN_PHONE="  Telefone: "
set /p ADMIN_USER="  Usuario de login: "
set /p ADMIN_PASS="  Senha inicial: "
echo.

REM ---- CAMERAS ----
echo  === CONFIGURACAO DE CAMERAS ===
echo.
set /p NUM_CAMERAS="  Quantas cameras deseja configurar agora? "
echo.

setlocal enabledelayedexpansion
set CAM_CONFIG=[]
for /l %%i in (1,1,%NUM_CAMERAS%) do (
    echo  --- Camera %%i ---
    set /p "CAM_NAME=  Nome da camera %%i: "
    set /p "CAM_IP=  IP da camera %%i: "
    set /p "CAM_USER=  Usuario RTSP: "
    set /p "CAM_PASS=  Senha RTSP: "
    set /p "CAM_ROOM=  Sala vinculada: "
    echo.
)
endlocal

REM ---- SALVAR CONFIGURACAO ----
echo [INFO] Salvando configuracao...

set CONFIG_DIR=%APPDATA%\AquilaPro
if not exist "%CONFIG_DIR%" mkdir "%CONFIG_DIR%"

(
echo {
echo   "school": {
echo     "name": "%SCHOOL_NAME%",
echo     "city": "%SCHOOL_CITY%",
echo     "state": "%SCHOOL_STATE%",
echo     "rooms": %SCHOOL_ROOMS%,
echo     "students": %SCHOOL_STUDENTS%
echo   },
echo   "admin": {
echo     "name": "%ADMIN_NAME%",
echo     "email": "%ADMIN_EMAIL%",
echo     "phone": "%ADMIN_PHONE%",
echo     "username": "%ADMIN_USER%"
echo   },
echo   "cameras": %NUM_CAMERAS%,
echo   "setupDate": "%date% %time%",
echo   "version": "1.0.0"
echo }
) > "%CONFIG_DIR%\school-config.json"

echo.
echo  =====================================================
echo     CONFIGURACAO SALVA COM SUCESSO!
echo  =====================================================
echo.
echo  Escola: %SCHOOL_NAME%
echo  Salas: %SCHOOL_ROOMS%
echo  Cameras: %NUM_CAMERAS%
echo  Admin: %ADMIN_NAME% (%ADMIN_USER%)
echo.
echo  Proximos passos:
echo    1. Inicie o Aquila Pro
echo    2. Faca login com: %ADMIN_USER%
echo    3. Configure as cameras no menu Cameras
echo    4. Importe a grade horaria (Excel)
echo    5. Cadastre os alunos com fotos
echo.
echo  Suporte: andrejrunb@yahoo.com.br
echo  WhatsApp: +55 (61) 99962-3099
echo.
pause
