# 🔍 Multi-Camera Re-Identification (Re-ID)

O Re-ID permite o rastreamento contínuo de indivíduos em grandes campi, mesmo quando a face não está visível ou o indivíduo está de costas.

## ⚙️ Funcionamento
- **Algoritmo**: `ReIDService.ts`
- **Extração de Características (Clothing-based)**:
  - Cor e textura das vestimentas.
  - Altura e padrões de movimentação.
  - Acessórios detectados (mochilas, bonés).

## 📊 Vantagens
- **Persistência**: Mantém o mesmo ID de rastreamento ao passar de um corredor para outro.
- **Privacidade**: Operacional sem necessidade de banco de dados biométrico (Face ID) permanente.

---
Vincular a: [[10_Architecture/Unified_Command_SOC|Unified Command SOC]]
