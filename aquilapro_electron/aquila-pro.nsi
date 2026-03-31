; Instalador NSIS para Áquila Pro Desktop
; Este arquivo configura o instalador Windows (.exe)

!include "MUI2.nsh"
!include "x64.nsh"

; Configurações Gerais
Name "Áquila Pro"
OutFile "dist/AquilaPro-Setup-1.0.0.exe"
InstallDir "$PROGRAMFILES\AquilaPro"
InstallDirRegKey HKCU "Software\AquilaPro" "Install_Dir"

; Variáveis
Var StartMenuFolder

; ===== MUI Settings =====
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_STARTMENU Application $StartMenuFolder
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_LANGUAGE "PortugueseBR"

; ===== Installer Sections =====

Section "Instalar Áquila Pro"
  SetOutPath "$INSTDIR"

  ; Copiar arquivos
  File /r "dist\*.*"
  File /r "node_modules\*.*"

  ; Criar atalhos
  !insertmacro MUI_STARTMENU_WRITE_BEGIN Application
    CreateDirectory "$SMPROGRAMS\$StartMenuFolder"
    CreateShortcut "$SMPROGRAMS\$StartMenuFolder\Áquila Pro.lnk" "$INSTDIR\AquilaPro.exe"
    CreateShortcut "$SMPROGRAMS\$StartMenuFolder\Desinstalar.lnk" "$INSTDIR\Uninstall.exe"
  !insertmacro MUI_STARTMENU_WRITE_END

  ; Criar atalho na área de trabalho
  CreateShortcut "$DESKTOP\Áquila Pro.lnk" "$INSTDIR\AquilaPro.exe"

  ; Registrar no Registry
  WriteRegStr HKCU "Software\AquilaPro" "Install_Dir" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\AquilaPro" \
    "DisplayName" "Áquila Pro - Sistema de Segurança e Engajamento Escolar"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\AquilaPro" \
    "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\AquilaPro" \
    "DisplayIcon" "$INSTDIR\AquilaPro.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\AquilaPro" \
    "DisplayVersion" "1.0.0"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\AquilaPro" \
    "Publisher" "Áquila Pro"

  ; Criar arquivo de desinstalação
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  ; Criar diretórios de dados
  CreateDirectory "$APPDATA\AquilaPro"
  CreateDirectory "$APPDATA\AquilaPro\backups"
  CreateDirectory "$APPDATA\AquilaPro\reports"
  CreateDirectory "$APPDATA\AquilaPro\photos"

SectionEnd

; ===== Uninstaller Section =====

Section "Desinstalar"
  ; Remover atalhos
  !insertmacro MUI_STARTMENU_GETFOLDER Application $StartMenuFolder
  RMDir /r "$SMPROGRAMS\$StartMenuFolder"
  Delete "$DESKTOP\Áquila Pro.lnk"

  ; Remover arquivos
  RMDir /r "$INSTDIR"

  ; Remover do Registry
  DeleteRegKey HKCU "Software\AquilaPro"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\AquilaPro"

SectionEnd

; ===== Callbacks =====

Function .onInit
  ${If} ${RunningX64}
    SetRegView 64
  ${Else}
    SetRegView 32
  ${EndIf}
FunctionEnd

Function un.onInit
  ${If} ${RunningX64}
    SetRegView 64
  ${Else}
    SetRegView 32
  ${EndIf}
FunctionEnd
