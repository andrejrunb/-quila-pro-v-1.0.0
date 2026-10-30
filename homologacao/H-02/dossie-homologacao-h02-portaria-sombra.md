# 🛡️ Áquila Pro — Dossiê de Homologação H-02 (Acesso Físico & Portaria em Modo Sombra)

**Documento:** Dossiê Técnico de Comissionamento de Bancada & Validação Operacional  
**Versão:** 2.1.0-RC  
**Data da Homologação:** 30 de Outubro de 2026  
**Ambiente Examinado:** Áquila Edge Gateway / Windows x64 / Câmera 1080p Guarita  
**Branch de Release:** `clean-release-v1`  
**Status Geral:** ✅ **APROVADO PARA OPERAÇÃO EM MODO SOMBRA (SHADOW MODE)**  
**Destinatários:** Diretoria Escolar, Encarregado de Proteção de Dados (DPO), Gestor de TI e Chefe de Segurança da Portaria.

---

## 🏛️ 1. Princípio Fundamental de Segurança & Soberania

Conforme pactuado na **Constituição Áquila Pro v2.1** e no **Plano de Alinhamento de Prontidão dos Dois Pilotos**:

> [!IMPORTANT]
> **Definição Estrita do Modo Sombra (Shadow Mode):**  
> Durante todo o Piloto 2, **o relé físico da catraca permanece 100% desativado no código**. As câmeras da portaria registram a aproximação dos estudantes, o motor de visão NPU calcula as métricas de iluminação e biometria, mas **o porteiro ou o crachá legado continua sendo o único atuador mecânico de abertura**. O destravamento físico por IA só será desbloqueado no código após assinatura formal deste RIPD pelo DPO e aceite da diretoria.

---

## ⚙️ 2. Resultados dos Testes de Bancada de Hardware (FSM 4/4)

A máquina de estados finitos determinística ([`TurnstileAccessContract.ts`](file:///c:/aquila/apps/electron/src/main/services/TurnstileAccessContract.ts)) foi submetida ao autoteste exaustivo de 4 estágios via [`TurnstileShadowService.ts`](file:///c:/aquila/apps/electron/src/main/services/TurnstileShadowService.ts):

| Etapa | Teste de Bancada | Condição de Entrada | Resultado Observado | Status |
| :--- | :--- | :--- | :--- | :---: |
| **BENCH 1/4** | Inicialização Segura | Boot do hardware local | FSM travada em `IDLE_LOCKED` | ✅ PASS |
| **BENCH 2/4** | Ciclo FSM Completo | `REQUEST -> ACK -> RELAY -> ROTATION -> COMPLETED` | Sensores ópticos confirmam passagem e retornam a `IDLE_LOCKED` | ✅ PASS |
| **BENCH 3/4** | Anti-Duplicação | Nonce duplicado com mesmo `transactionId` | Rejeição imediata (`DUPLICATE_COMMAND_REJECTED`) | ✅ PASS |
| **BENCH 4/4** | Alarme de Invasão | Rotação mecânica sem autorização prévia | Disparo imediato de `ALARM_FORCED_ENTRY` | ✅ PASS |

*Evidência Automatizada:* Suíte Jest [`TurnstileAccessContract.test.ts`](file:///c:/aquila/apps/electron/src/main/services/__tests__/TurnstileAccessContract.test.ts) (4/4 testes) e [`TurnstileShadowService.test.ts`](file:///c:/aquila/apps/electron/src/main/services/__tests__/TurnstileShadowService.test.ts) (7/7 testes aprovados).

---

## 🚨 3. Procedimento Operacional Padrão (POP) de Contingência de Portaria

### Regra de Ouro (Anti-Constrangimento do Menor — ECA & LGPD Art. 14):
> **Nenhuma criança ou adolescente poderá ser retida, exposta ou constrangida na portaria da escola.**  
> Caso a biometria falhe, a iluminação esteja adversa, o crachá tenha sido esquecido ou haja fila superior a 3 estudantes:
> 1. O operador da guarita clica imediatamente no botão vermelho **`🔓 Liberação Assistida`** no [`TurnstileShadowConsole.tsx`](file:///c:/aquila/apps/electron/src/ui/components/TurnstileShadowConsole.tsx).
> 2. O aluno entra na escola normalmente em menos de 3 segundos.
> 3. O sistema grava o evento no SQLite WAL sob a ação auditada `MANUAL_OPERATOR_BYPASS` com hash SHA-256 e justificativa do porteiro.

### Contingências Críticas:
* **Queda de Energia:** No-break Senoidal local mantém o Áquila Edge e a guarita operacionais por 4 horas. Na exaustão, as catracas possuem destravamento mecânico bidirecional por chave de segurança física entregue ao Chefe da Portaria.
* **Queda de Internet:** A portaria opera **100% Offline-First**. O banco local SQLite WAL valida os vetores biométricos (One-Way Embedding 512-D) localmente, sem envio de imagens para servidores em nuvem.

---

## 📋 4. Matriz de Riscos & Salvaguardas do RIPD (LGPD Art. 14 / Art. 11)

1. **Minimização Estrita:** Nenhum dado biométrico cru (fotos faciais originais) deixa o perímetro da guarita escolar. Apenas vetores matemáticos unidirecionais não-reversíveis (512 números decimais) são mantidos cifrados em repouso com AES-256-GCM.
2. **Matriz de Consentimento:** O processamento biométrico só é ativado para estudantes cujos pais assinaram o Termo de Consentimento Específico e em Destaque. Estudantes sem consentimento são sinalizados com `DENY_NO_CONSENT` e utilizam acesso manual assistido sem discriminação.
3. **Trilha Imutável Zero-Bypass:** Cada telemetria em sombra ou liberação física é registrada com hash criptográfico na tabela `zero_bypass_audits`.

---

## 🎯 5. Conclusão Técnica

O sistema preenche com excelência todos os requisitos de bancada e operacionais para início imediato do **Piloto 2 em Modo Sombra na Portaria**.
