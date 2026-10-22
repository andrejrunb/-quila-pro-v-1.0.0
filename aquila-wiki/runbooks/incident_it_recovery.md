# 🚑 Runbook: Recuperação de Desastre (Edge Hub)

Protocolo de emergência para falhas críticas de hardware ou corrupção de dados no **Áquila Edge Hub**.

---

## 🚨 Sinais de Alerta
- Interface "Invisible Death" (Deadlock na inicialização).
- SQLite Corrupt error nos logs.
- Perda de biometria ao reiniciar o Kernel.

## 🛠️ Procedimento de Recuperação

### Passo 1: Isolamento e Backup Preventivo
Copie a pasta de dados (`userData`) antes de qualquer intervenção.
```bash
cp -r %APPDATA%/aquilapro-electron/userData c:/temp_recovery_backup
```

### Passo 2: Hard-Reset do Córtex
Se o deadlock persistir, limpe o cache de processos do Electron.
1. Finalize todos os processos `node.exe` e `AquilaPro.exe`.
2. Remova o diretório `Cache` e `Local Storage` dentro da pasta de dados.

### Passo 3: Reparação de Banco de Dados
Tente recuperar o SQLite local.
```bash
sqlite3 database.sqlite ".recover" | sqlite3 database_fixed.sqlite
```

### Passo 4: Reinstalação de Fallback
Se os passos acima falharem:
1. Desinstale a versão atual.
2. Instale a versão estável anterior (LTS) conforme o `deploy_kernel.md`.
3. Re-sincronize a telemetria com o Cloud (Next.js).

---
*Escrito por: Agente Antigravity (IA)*
