#!/usr/bin/env bash
# ------------------------------------------------------------
# Script de arranque do Notebook Colab com GPU A100
# ------------------------------------------------------------
# 1) Cria túnel Cloudflare (caso ainda não exista)
#    Requer que o binário `cloudflared` esteja instalado.
#    Se já houver um túnel ativo, este comando simplesmente o reutiliza.
cloudflared tunnel run aquila-notebook &
# Aguarda alguns segundos para o túnel ficar disponível
sleep 5
# 2) Captura a URL pública do túnel (ex.: https://xxxxx.trycloudflare.com)
ENDPOINT=$(cloudflared tunnel info aquila-notebook --url)
# 3) Registra o endpoint no bridge Electron (via IPC)
#    O bridge está exposto ao renderer como `window.electron.ipcRenderer`.
node - <<'NODE'
const { execSync } = require('child_process');
const endpoint = process.env.ENDPOINT || '';
if (!endpoint) {
  console.error('Endpoint não encontrado. Verifique o túnel Cloudflare.');
  process.exit(1);
}
// Usa o bridge interno para definir o endpoint
execSync(`node -e "require('./src/ipc/bridge').setEndpoint('${endpoint}')"`, { stdio: 'inherit' });
NODE
# 4) Notifica que tudo está pronto
echo "Colab endpoint registrado: $ENDPOINT"
