# Áquila Pro — Registrador de Agendamento Autônomo de Fine-Tuning & Radar de Provas
# Registra a tarefa agendada no Windows Task Scheduler (a cada 6 horas + ao iniciar sessão)

$TaskName = "AquilaPro_Swarm_Continuous_FineTune"
$PythonCmd = (Get-Command python).Source
$ScriptPath = "c:\aquila\scripts\swarm_continuous_finetune_daemon.py"

Write-Host "Registrando tarefa agendada: $TaskName" -ForegroundColor Cyan
Write-Host "Python: $PythonCmd"
Write-Host "Script: $ScriptPath"

schtasks /Create /TN $TaskName /TR "`"$PythonCmd`" `"$ScriptPath`" --once" /SC HOURLY /MO 6 /F

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Tarefa agendada '$TaskName' registrada com sucesso (execucao automatica a cada 6 horas)." -ForegroundColor Green
    schtasks /Query /TN $TaskName /FO LIST /V
} else {
    Write-Host "[AVISO] Falha ao registrar no schtasks (codigo $LASTEXITCODE)." -ForegroundColor Yellow
}
