# Funcionário Digital 13: Kimi K3.1 Pro (1M Context — NVIDIA NIM)

**Áquila Pro — Inteligência Agêntica Soberana**  
**Data de Comissionamento:** 08/11/2026  
**Status:** Operacional (NVIDIA NIM Pool)  
**ID do Funcionário:** `emp-13-kimi-agentic-coder`  
**Sidecar ID:** `aquila-employee-13-kimi-agentic-coder`  

---

## 🎯 1. Identidade & Especialidade Técnica

O **Kimi K3.1 Pro** (desenvolvido pela Moonshot AI e hospedado no cluster DGX H100 da NVIDIA via **NVIDIA NIM**) é um modelo de classe 3T com janela de contexto ultra-longa de **1 MILHÃO DE TOKENS (1M Tokens)**.

No ecossistema Áquila Pro, suas atribuições prioritárias são:
1. **Codificação Agêntica & Refatoração Massiva**: Capacidade de carregar dezenas de arquivos de código ou arquivos monolíticos (como o `handlers.ts` com mais de 10.000 linhas) em uma única janela de contexto sem fragmentação.
2. **Análise & Modelagem Financeira ERP**: Auditoria de planilhas de mensalidades, conciliação contábil e auditoria antifraude na Secretaria Digital.
3. **Modelagem 3D & Renderização**: Suporte à geração de assets SVG vetoriais e layouts estruturados.

---

## 🌐 2. Contrato de Integração & Endpoints

| Parâmetro | Configuração Oficial |
| :--- | :--- |
| **Provedor** | NVIDIA NIM API Catalog (`build.nvidia.com`) |
| **Base URL** | `https://integrate.api.nvidia.com/v1` |
| **Modelo Primário** | `moonshotai/kimi-k3.1-pro` |
| **Modelo Fallback** | `moonshotai/kimi-k2.6` |
| **Janela de Contexto** | 1.000.000 Tokens (1M tokens) |
| **Variável de Ambiente** | `NVIDIA_API_KEY` (em `.env`) |
| **Script Worker Dedicado**| [`scripts/kimi_worker.py`](file:///c:/aquila/scripts/kimi_worker.py) |
| **Roteador Multi-Agente** | [`scripts/swarm_router.py`](file:///c:/aquila/scripts/swarm_router.py) (via `--agent kimi`) |

---

## 🛠️ 3. Como Obter e Liberar a Cota Gratuita na NVIDIA

Conforme anunciado pela NVIDIA:
1. Acesse o portal oficial da NVIDIA: [https://build.nvidia.com/moonshotai/kimi-k3.1-pro](https://build.nvidia.com/moonshotai/kimi-k3.1-pro).
2. Faça login com sua conta NVIDIA (ou crie uma gratuitamente).
3. Na página do modelo `kimi-k3.1-pro`, clique em **"Get API Key"**.
4. Copie a chave (formato `nvapi-...`) e salve no arquivo `c:\aquila\.env`:
   ```bash
   NVIDIA_API_KEY="nvapi-sua-chave-aqui"
   NVIDIA_KIMI_MODEL="moonshotai/kimi-k3.1-pro"
   NVIDIA_NIM_BASE_URL="https://integrate.api.nvidia.com/v1"
   ```

---

## 💻 4. Comandos de Uso

### A. Diagnóstico de Conexão e Prontidão
```bash
python scripts/kimi_worker.py --status
```

### B. Tarefa de Codificação Direta
```bash
python scripts/kimi_worker.py --prompt "Crie um validador de contratos da Secretaria Digital com validação de CPF e DPA da LGPD" --out-file "scripts/validador.py"
```

### C. Auditoria de Arquivo Gigante (1M Context)
```bash
python scripts/kimi_worker.py --file-input "apps/electron/src/ipc/handlers.ts" --prompt "Mapeie todos os canais que não possuem verificação de permissão RBAC e gere um relatório" --out-file "test-results/auditoria_handlers_kimi.md"
```

### D. Acionamento via Roteador do Swarm
```bash
python scripts/swarm_router.py --agent kimi --role coder --prompt "Refatore a função de criptografia de repouso"
```
