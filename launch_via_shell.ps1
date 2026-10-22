$shell = New-Object -ComObject Shell.Application
$exe = "C:\aquila\node_modules\electron\dist\electron.exe"
$args = "C:\aquila\apps\electron"
$dir = "C:\aquila\apps\electron"
$shell.ShellExecute($exe, $args, $dir, "open", 1)
Write-Host "ShellExecute invocado com sucesso via Explorer."
