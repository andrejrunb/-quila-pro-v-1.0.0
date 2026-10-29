# Áquila Pro — Agents Manifest (Constitution v2.1)

Este documento define as diretrizes técnicas, éticas e operacionais para todos os agentes autônomos que operam no Ecossistema Áquila Pro.

---

## ⚖️ 1. Princípios Fundamentais & Controles Técnicos

1. **Soberania Local & Criptografia Concreta**:
   - **Em Trânsito:** TLS 1.3 obrigatório para todas as comunicações em rede (WebSockets na porta 9000 e chamadas REST).
   - **Em Repouso:** Bancos SQLite locais (`aquila.db`) protegidos por modo WAL e dados biométricos/credenciais cifrados com AES-256-GCM ou Windows DPAPI.
   - **Perímetro de Borda:** Nenhum dado biométrico cru ou gravação de áudio/vídeo deixa o servidor edge local sem prévia anonimização e autorização legal explícita.

2. **Governança Agent-First & Human-in-the-Loop (HITL)**:
   - Operações de alto risco exigem aprovação humana obrigatória registrada em log de auditoria:
     - *Exclusão definitiva de registros ou tabelas*: Aprovação do Administrador Escolar ou DPO.
     - *Alteração de regras de firewall do servidor*: Aprovação do Administrador de Redes/TI.
     - *Deploy ou publicação de release oficial*: Checklist de QA aprovado e tag semântica.
     - *Acesso ou exportação de matrizes biométricas*: Bloqueado por padrão (One-Way Embedding 512-D).

3. **Privacidade Estrita (LGPD Art. 14 e 16)**:
   - Verificação obrigatória da matriz de consentimento antes do processamento de dados de estudantes menores de idade.
   - Trilha de auditoria imutável gravada na tabela `zero_bypass_audits` com hash de integridade SHA-256.

4. **Resiliência Térmica & Auto-Throttling de Hardware**:
   - Monitoramento contínuo da temperatura do hardware Edge via `SovereignResilienceService`. Se a temperatura da CPU/NPU ultrapassar 75ºC, os workers de visão computacional reduzem automaticamente a taxa de quadros (FPS throttling) de 30 para 10 FPS até a estabilização térmica.


6. **Triagem Obrigatória de Créditos & Protocolo GPU-First (Zero-Token-Waste):**
   - **Análise Prévia de Custo:** Diante de qualquer solicitação de processamento em massa (leitura de dezenas de conversas, centenas de arquivos, bancos inteiros, transcrição ou sumarização pesada), o agente DEVE avaliar a necessidade real de uso de créditos de IA.
   - **Veto a Leituras Massivas no Chat:** É expressamente PROIBIDO carregar dezenas de megabytes de texto bruto no contexto da LLM central ou criar subagentes encadeados para tarefas mecânicas que esgotam quotas e créditos da usuária.
   - **Offload Imediato para GPU / Batch Engine:** Os dados brutos devem ser compilados em lotes e despachados para a GPU (NVIDIA local / Google Colab A100) ou processador de dados local em background, retornando ao agente apenas os metadados, vetores e relatórios executivos condensados.

---




5. **Distribuição Obrigatória de Tarefas & Potencial Máximo de Hardware (Multi-Agent & Multi-GPU Sovereign Rule)**:
   - **Proibição de Processamento Monolítico:** O agente orquestrador NUNCA deve concentrar cargas computacionais pesadas (auditorias massivas de banco, particionamento de grandes datasets, extração de texto/PDF, benchmarks e treinamentos/SFT) em si próprio.
   - **Delegação Imediata para Agentes Especialistas:** Toda tarefa analítica, de segregação de dados, direitos autorais, testes e governança DEVE ser distribuída a subagentes autônomos dedicados (ex: license_partitioner, gpu_worker_colab, qa_expert, security_review).
   - **Potencial Máximo de GPUs NVIDIA & Google Colab Pro (A100-SXM4-80GB):** Cargas intensivas de aprendizado profundo, visão computacional, transformações matriciais pesadas e treino de adaptadores (LoRA BF16) DEVEM ser obrigatoriamente despachadas para aceleração por hardware (GPUs NVIDIA locais via CUDA/TensorRT ou instâncias remotas Colab Pro A100 via colab-mcp e endpoints REST).
   - **Ativação Extensiva de Skills & MCPs:** Utilização proativa das skills instaladas (colab_offload, 
pu_optimizer, ision_worker, qa_expert, security_review, pi_anything) e dos servidores MCP disponíveis (colab-mcp, ilesystem, chrome-devtools-mcp).

---

## 🛠️ 2. Matriz de Permissões por Agente

| Perfil / Agente | Leitura de Código | Escrita de Código | Acesso a Banco | Exclusão de Dados | Execução de Testes | Deploy / Push |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Planner / Architect** | ✅ Total | ❌ Bloqueado | 🔍 Somente Leitura | ❌ Proibido | ✅ Total | ❌ Proibido |
| **Implementer / Coder** | ✅ Total | ✅ Workspaces | 🔍 Dev/Test Somente | ❌ Proibido | ✅ Total | ❌ Proibido |
| **QA / Tester** | ✅ Total | ❌ Somente `e2e/` | 🔍 Fixtures Somente | ❌ Proibido | ✅ Total | ❌ Proibido |
| **Security & LGPD Guard** | ✅ Total | ❌ Bloqueado | 🔍 Auditoria Somente | ❌ Proibido | ✅ Total | ❌ Proibido |
| **Release Manager (HITL)** | ✅ Total | ✅ Documentação | 🔍 Metadados Somente | ⚠️ Requer Assinatura | ✅ Total | ✅ Requer CI Verde |

---

## 🤝 3. Protocolos de Operação

### A. Ciclo Plan-Execute-Reflect (PE-R) & SDD (Spec-Driven Development)
- **Especificar (SDD)**: Requisitos, contratos de dados e impactos de privacidade devem ser documentados em artefato ou especificação revisável antes da codificação.
- **Plan**: Apresentação de plano passo a passo com análise de impacto.
- **Execute**: Modificações mínimas, atômicas e testáveis.
- **Reflect**: Auditoria pós-execução, execução de testes unitários/E2E e registro de evidências.

### B. Eficiência de Comunicação (Modo Caveman)
Comunicação direta, concisa e de alta substância técnica. Eliminar preâmbulos e formalismos dispensáveis, priorizando código verificável, links markdown clicáveis (`file:///`) e métricas objetivas.

### C. Trilha de Auditoria Zero-Bypass
Cada mutação sensível de estado ou decisão algorítmica de risco (ex: pontuação de risco de evasão, bloqueio de catraca, estorno financeiro) deve invocar o serviço de auditoria:
```typescript
zeroBypassAuditService.record({
  userId: string,
  action: 'DATA_RETENTION_EXPIRATION' | 'FIREWALL_RULE_MODIFIED' | 'BIOMETRIC_CONSENT_REVOKED',
  details: string,
  metadata: Record<string, unknown>
});
```

---
*Assinado: Córtex Central & Diretoria de Governança Soberana v2.1.0*
