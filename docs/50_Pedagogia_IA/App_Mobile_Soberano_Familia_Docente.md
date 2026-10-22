# Áquila Pro — Aplicativo Mobile Soberano (Família, Alunos e Docentes)

## 📱 Visão Arquitetural

O **Áquila Pro Mobile** (`apps/mobile`) e seu espelho desktop (`MobileParentApp.tsx`) foram concebidos sob o princípio fundamental de **Soberania Total de Dados**:
1. **100% Offline-First na Rede Local (LAN)**: Todo o tráfego de comunicação com o servidor escolar ocorre via WebSockets seguros na porta **9000** (`ws://<ip-escola>:9000`), sem necessidade de servidores em nuvem comercial externa.
2. **Conformidade Estrita com LDB Art. 12 VII**: Notificação imediata e preventiva de faltas, atrasos e eventos escolares para que pais e responsáveis tenham ciência ativa do paradeiro e frequência do educando.
3. **Assinatura Digital Criptográfica de Ocorrências**: Registros disciplinares e termos de ciência com carimbo de tempo ICP-Brasil e hash SHA-256 salvos na tabela `zero_bypass_audits` do banco SQLite SQA-1000.
4. **Financeiro com PIX Dinâmico Offline**: Geração de payload PIX Copia-e-Cola e QR Code para liquidação com conciliação automática.
5. **Tutor Socrático Albus IA**: Laboratório pedagógico que orienta o estudante através do método socrático (perguntas guiadas e decomposição de problemas), sem fornecer respostas mastigadas.

---

## 🏛️ Estrutura de Módulos (Tabs)

| Aba | Nome | Público | Protocolo WebSocket (Porta 9000) | Funcionalidade |
|---|---|---|---|---|
| **01** | `index.tsx` (Início) | Família | `GET_PARENT_DATA` / `PARENT_CHEGUEI` | Linha do tempo em tempo real, status de presença e botão "Estou Chegando" (Geofencing ETA). |
| **02** | `boletim.tsx` | Aluno / Família | `GET_STUDENT_GRADES` | Média consolidada, notas bimestrais, parecer pedagógico docente e escore TRI. |
| **03** | `financeiro.tsx` | Responsável | `GET_STUDENT_FINANCE` | Demonstrativo de mensalidades escolares, QR Code e chave PIX Copia-e-Cola. |
| **04** | `ocorrencias.tsx` | Responsável | `SIGN_DISCIPLINARY_ACTION` | Assinatura digital soberana de advertências e comunicações da coordenação. |
| **05** | `chamada.tsx` | Docente | `TEACHER_QUICK_ATTENDANCE` | Chamada rápida de 1-toque com auditoria de presença biométrica NPU. |
| **06** | `student.tsx` | Aluno | `STUDY_QUERY` | Laboratório Albus IA com diálogo socrático guiado para fixação de conteúdos. |
| **07** | `portaria.tsx` | Segurança / Portaria | `GET_GATE_QUEUE` / `CONFIRM_GATE_DISMISSAL` | Dispatcher tático de saída, fila de aproximação de veículos e liberação com 1 toque. |

---

## 🔐 Protocolo de Assinatura Digital de Ocorrências

Quando um responsável visualiza uma advertência ou ocorrência preventiva no aplicativo:
1. O aplicativo exibe o relatório gerado pela coordenação.
2. O responsável toca em **"Dar Ciência Digital (Assinatura Soberana)"**.
3. O payload é assinado e transmitido ao `MobileGateway`:
```json
{
  "type": "SIGN_DISCIPLINARY_ACTION",
  "deviceId": "parent-mobile-v2",
  "payload": {
    "incidentId": "INC-2026-08",
    "parentName": "Mariana Mendes (Mãe)",
    "signatureData": "Biometria Facial Mobile Verified"
  }
}
```
4. O servidor calcula o hash SHA-256:
```typescript
const signatureHash = crypto.createHash('sha256')
  .update(`${incidentId}-${parentName}-${Date.now()}`)
  .digest('hex');
```
5. O evento é registrado de forma indelével na tabela `zero_bypass_audits` com integridade garantida por chave estrangeira e modo WAL do SQLite.

---

## 🚗 Geofencing e Saída Inteligente ("Estou Chegando")

O botão **ESTOU CHEGANDO** permite que o responsável notifique a portaria escolar durante seu deslocamento:
- **1000m**: Notificação prévia à equipe do portão.
- **500m**: O nome do aluno é exibido no telão de saída ou painel de chamada da sala.
- **35m (AT_GATE)**: O aluno é liberado com confirmação biométrica ou identificação visual do veículo.

---

## 🎨 Padrão Stitch Elite Design

O aplicativo mobile e o simulador desktop seguem rigorosamente o padrão visual Elite:
- Fundo escuro profundo: `#050b18` com sobreposições translúcidas.
- Destaques de ação: Roxo Soberano (`#7c3aed`), Esmeralda (`#10b981`) e Ciano (`#00f0ff`).
- Tipografia: Inter com metadados em fonte monoespaçada.
- Altura ergonômica de toque: 36px-48px para botões operacionais rápidos.
