---
name: GPU Developer Swarm (NVIDIA DGX & Colab A100 Code Generation)
description: |
  Habilidade autônoma para acelerar a criação, refatoração, auditoria e testes do Áquila Pro 
  utilizando os supercomputadores da NVIDIA Cloud (DGX H100) e instâncias Google Colab Pro (A100-SXM4-80GB).
  Evita o esgotamento de cotas de chat e tokens locais despachando tarefas mecânicas pesadas para as GPUs.
---

# 🚀 GPU Developer Swarm — Aceleração de Engenharia por Hardware

Esta skill conecta o desenvolvedor e o agente Antigravity diretamente aos clusters de GPU da NVIDIA e Google Colab para **construir, codificar, auditar e testar o ecossistema Áquila Pro**.

---

## 🛠️ Quando Usar Esta Skill

Use esta skill sempre que:
1. Precisar gerar arquivos de código extensos (novos serviços, componentes React, schemas SQLite).
2. Precisar auditar segurança, vulnerabilidades ou conformidade com a LGPD em arquivos inteiros.
3. Precisar gerar baterias massivas de testes unitários (Jest) ou testes ponta-a-ponta (Playwright).
4. Precisar sintetizar centenas de pares de treinamento SFT/QLoRA para o motor pedagógico.
5. Precisar inspecionar e verificar a telemetria das GPUs (NVIDIA NIM H100, Colab A100 e DirectML local).

---

## ⚡ Comandos Operacionais

### 1. Verificar Status de Todo o Hardware
```bash
python scripts/gpu_dev_swarm.py --status
```
Ou via npm:
```bash
pnpm run gpu:status
```

### 2. Gerar Código via NVIDIA DGX H100
```bash
python scripts/gpu_dev_swarm.py --role coder --prompt "Implemente um serviço de cache LRU em memória..." --out-file apps/electron/src/main/services/LruCacheService.ts
```

### 3. Auditar Segurança de um Arquivo
```bash
python scripts/gpu_dev_swarm.py --role security --file apps/electron/src/main/services/AuthService.ts
```

### 4. Gerar Testes Unitários para um Módulo
```bash
python scripts/gpu_dev_swarm.py --role qa --file apps/electron/src/main/services/TurnstileShadowService.ts --out-file apps/electron/src/main/services/__tests__/TurnstileShadowService.generated.test.ts
```

### 5. Reconectar ou Atualizar URL do Google Colab A100
```bash
python scripts/colab_tunnel_manager.py --url https://nova-url.trycloudflare.com
```

---

## 🧠 Matriz de Modelos GPU por Especialidade

| Role | Modelo Ativo no Cluster NVIDIA DGX | Tipo de Tarefa |
| :--- | :--- | :--- |
| **coder** | `minimaxai/minimax-m3.1-flash` / `nemotron-3.5-lightning` | Código TypeScript, Node.js, SQLite e React |
| **architect** | `minimaxai/minimax-m3.1-flash` / `nemotron-3-nano-omni-reasoning` | Arquitetura, contratos e padrões offline-first |
| **qa** | `minimaxai/minimax-m3.1-flash` | Suítes de teste Jest e fluxos Playwright |
| **security** | `minimaxai/minimax-m3.1-flash` | Varredura LGPD, injeção SQL e blindagem |
| **vision** | `meta/llama-3.2-90b-vision-instruct` | Visão computacional, OCR de provas e tensores |
