$wsh = New-Object -ComObject WScript.Shell
$desktopPath = [System.Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktopPath "Aquila Pro.lnk"
$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "C:\aquila\node_modules\electron\dist\electron.exe"
$shortcut.Arguments = "C:\aquila\apps\electron"
$shortcut.WorkingDirectory = "C:\aquila\apps\electron"
$shortcut.IconLocation = "C:\aquila\apps\electron\resources\icon.ico,0"
$shortcut.Description = "Aquila Pro - Sistema Soberano Escolar"
$shortcut.Save()
Write-Host "Atalho criado com sucesso em: $shortcutPath"
