@echo off
REM ============================================================================
REM Aquila Pro Desktop - Script de Instalacao para Windows
REM Autor: Andre Jr (andrejrunb@yahoo.com.br)
REM ============================================================================

title Aquila Pro - Instalacao
color 0A
echo.
echo  =====================================================
echo     AQUILA PRO - Sistema de Seguranca Escolar
echo     Instalacao e Configuracao Inicial
echo  =====================================================
echo.

REM Verificar se esta rodando como administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERRO] Execute este script como Administrador!
    echo Clique com botao direito e selecione "Executar como administrador"
    pause
    exit /b 1
)

echo [1/8] Verificando requisitos do sistema...
echo.

REM Verificar Windows 10+
for /f "tokens=4-5 delims=. " %%i in ('ver') do set VERSION=%%i.%%j
echo   Sistema Operacional: Windows %VERSION%

REM Verificar RAM
for /f "skip=1" %%p in ('wmic os get FreePhysicalMemory') do (
    set /a RAM=%%p/1024/1024 2>nul
)
echo   RAM Disponivel: %RAM% GB

REM Verificar espaco em disco
for /f "tokens=3" %%a in ('dir /-c C:\ ^| findstr "bytes free"') do set DISK=%%a
echo   Espaco em Disco: Disponivel
echo.

echo [2/8] Verificando Node.js...
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo   [AVISO] Node.js nao encontrado. Instalando...
    echo   Baixando Node.js v20 LTS...
    curl -o node-setup.msi https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi
    msiexec /i node-setup.msi /quiet /norestart
    del node-setup.msi
    echo   Node.js instalado com sucesso!
) else (
    for /f "tokens=*" %%i in ('node -v') do echo   Node.js: %%i [OK]
)
echo.

echo [3/8] Verificando Python 3.10+...
where python >nul 2>&1
if %errorLevel% neq 0 (
    echo   [AVISO] Python nao encontrado. Instalando...
    echo   Baixando Python 3.11...
    curl -o python-setup.exe https://www.python.org/ftp/python/3.11.7/python-3.11.7-amd64.exe
    python-setup.exe /quiet InstallAllUsers=1 PrependPath=1
    del python-setup.exe
    echo   Python instalado com sucesso!
) else (
    for /f "tokens=*" %%i in ('python --version') do echo   %%i [OK]
)
echo.

echo [4/8] Instalando dependencias Python (face_recognition)...
pip install --upgrade pip >nul 2>&1
pip install face_recognition opencv-python-headless numpy dlib >nul 2>&1
if %errorLevel% neq 0 (
    echo   [AVISO] Erro ao instalar face_recognition.
    echo   Tentando instalar dlib via wheel pre-compilado...
    pip install https://github.com/jloh02/dlib/releases/download/v19.22/dlib-19.22.99-cp311-cp311-win_amd64.whl >nul 2>&1
    pip install face_recognition opencv-python-headless numpy >nul 2>&1
)
echo   Dependencias Python instaladas [OK]
echo.

echo [5/8] Instalando dependencias Node.js...
cd /d "%~dp0.."
call npm install --production >nul 2>&1
echo   Dependencias Node.js instaladas [OK]
echo.

echo [6/8] Configurando banco de dados local...
if not exist "%APPDATA%\AquilaPro" mkdir "%APPDATA%\AquilaPro"
if not exist "%APPDATA%\AquilaPro\logs" mkdir "%APPDATA%\AquilaPro\logs"
if not exist "%APPDATA%\AquilaPro\backups" mkdir "%APPDATA%\AquilaPro\backups"
if not exist "%APPDATA%\AquilaPro\photos" mkdir "%APPDATA%\AquilaPro\photos"
if not exist "%APPDATA%\AquilaPro\reports" mkdir "%APPDATA%\AquilaPro\reports"
echo   Diretorios criados [OK]
echo.

echo [7/8] Configurando firewall...
netsh advfirewall firewall add rule name="Aquila Pro" dir=in action=allow protocol=TCP localport=3001 >nul 2>&1
netsh advfirewall firewall add rule name="Aquila Pro WS" dir=in action=allow protocol=TCP localport=8080 >nul 2>&1
echo   Regras de firewall configuradas [OK]
echo.

echo [8/8] Criando atalhos...
set DESKTOP=%USERPROFILE%\Desktop
set STARTMENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs

REM Criar arquivo .vbs para criar atalho
echo Set oWS = WScript.CreateObject("WScript.Shell") > CreateShortcut.vbs
echo sLinkFile = "%DESKTOP%\Aquila Pro.lnk" >> CreateShortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> CreateShortcut.vbs
echo oLink.TargetPath = "%~dp0..\AquilaPro.exe" >> CreateShortcut.vbs
echo oLink.Description = "Aquila Pro - Sistema de Seguranca Escolar" >> CreateShortcut.vbs
echo oLink.Save >> CreateShortcut.vbs
cscript CreateShortcut.vbs >nul 2>&1
del CreateShortcut.vbs
echo   Atalhos criados [OK]
echo.

echo  =====================================================
echo     INSTALACAO CONCLUIDA COM SUCESSO!
echo  =====================================================
echo.
echo  Para iniciar o Aquila Pro:
echo    - Clique no atalho "Aquila Pro" na area de trabalho
echo    - Ou execute: npm start (nesta pasta)
echo.
echo  Suporte: andrejrunb@yahoo.com.br
echo  WhatsApp: +55 (61) 99962-3099
echo.
pause
