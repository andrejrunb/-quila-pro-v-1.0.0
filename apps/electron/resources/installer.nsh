; ============================================================================
; Áquila Pro Desktop v1.2.0 — Script NSIS Customizado
; Diretórios, firewall, registro e desinstalação inteligente
; ============================================================================

!macro customHeader
  !system "echo 'Aquila Pro Installer v1.2.0'"
!macroend

!macro customInit
  ; Nada aqui por enquanto
!macroend

!macro customGUIInit
  ; Remover ícone da barra de título (visual premium/limpo)
  System::Call "user32::SendMessage(i $HWNDPARENT, i 0x0080, i 0, i 0)"
  System::Call "user32::SendMessage(i $HWNDPARENT, i 0x0080, i 1, i 0)"
!macroend

!macro preInit
  ; ── Verificar instalação anterior ────────────────────────────────────
  ReadRegStr $0 HKLM "Software\AquilaPro" "InstallPath"
  ${If} $0 != ""
    ReadRegStr $1 HKLM "Software\AquilaPro" "Version"
    MessageBox MB_YESNO "Áquila Pro $1 já está instalado em:$\n$0$\n$\nDeseja atualizar para a nova versão?" IDYES continueInstall IDNO cancelInstall
    cancelInstall:
      Abort
    continueInstall:
  ${EndIf}
!macroend

!macro customInstall
  ; ── Estrutura de diretórios de dados ──────────────────────────────────
  CreateDirectory "$APPDATA\AquilaPro"
  CreateDirectory "$APPDATA\AquilaPro\logs"
  CreateDirectory "$APPDATA\AquilaPro\backups"
  CreateDirectory "$APPDATA\AquilaPro\photos"
  CreateDirectory "$APPDATA\AquilaPro\reports"
  CreateDirectory "$APPDATA\AquilaPro\database"
  CreateDirectory "$APPDATA\AquilaPro\cameras"
  CreateDirectory "$APPDATA\AquilaPro\models"
  CreateDirectory "$APPDATA\AquilaPro\lgpd-logs"
  CreateDirectory "$APPDATA\AquilaPro\exports"
  CreateDirectory "$APPDATA\AquilaPro\temp"

  ; ── Copiar modelos de IA (ONNX) para diretório acessível ──────────────
  IfFileExists "$INSTDIR\resources\models\*.onnx" 0 skipModels
    CopyFiles "$INSTDIR\resources\models\*.onnx" "$APPDATA\AquilaPro\models\"
  skipModels:

  ; ── Salvar metadados no registro ──────────────────────────────────────
  WriteRegStr HKLM "Software\AquilaPro" "InstallPath"  "$INSTDIR"
  WriteRegStr HKLM "Software\AquilaPro" "Version"      "${VERSION}"
  WriteRegStr HKLM "Software\AquilaPro" "DataPath"     "$APPDATA\AquilaPro"
  WriteRegDWORD HKLM "Software\AquilaPro" "FirstRun"   1

  ; ── Regras de firewall ────────────────────────────────────────────────
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="Aquila Pro App" dir=in action=allow program="$INSTDIR\${APP_EXECUTABLE_FILENAME}" enable=yes'
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="Aquila Pro API" dir=in action=allow protocol=TCP localport=3001'
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="Aquila Pro WebSocket" dir=in action=allow protocol=TCP localport=8080'
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="Aquila Pro RTSP" dir=out action=allow protocol=TCP remoteport=554'

  ; ── Autostart com Windows ─────────────────────────────────────────────
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "AquilaPro" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" --autostart'

  ; ── Adicionar/Remover Programas — metadados extras ────────────────────
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\AquilaPro" "DisplayIcon"   "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\AquilaPro" "HelpLink"      "https://aquilapro.manus.space/suporte"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\AquilaPro" "URLInfoAbout"  "https://aquilapro.manus.space"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\AquilaPro" "Publisher"     "Andre Jr - Aquila Pro LTDA"
!macroend

!macro customUnInstall
  ; ── Perguntar se deseja manter dados dos alunos ───────────────────────
  MessageBox MB_YESNO|MB_ICONQUESTION "Deseja manter os dados dos alunos e backups?$\n$\nRecomendado: Sim (os dados ficam em $APPDATA\AquilaPro)" IDYES keepData IDNO removeData

  removeData:
    RMDir /r "$APPDATA\AquilaPro"
    Goto cleanupDone

  keepData:
    ; Remover só logs temporários — preservar banco e fotos
    RMDir /r "$APPDATA\AquilaPro\logs"
    RMDir /r "$APPDATA\AquilaPro\temp"
    DetailPrint "Dados preservados em $APPDATA\AquilaPro"

  cleanupDone:
  ; ── Remover regras de firewall ────────────────────────────────────────
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="Aquila Pro App"'
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="Aquila Pro API"'
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="Aquila Pro WebSocket"'
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="Aquila Pro RTSP"'

  ; ── Remover registro ──────────────────────────────────────────────────
  DeleteRegKey HKLM "Software\AquilaPro"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "AquilaPro"
!macroend
