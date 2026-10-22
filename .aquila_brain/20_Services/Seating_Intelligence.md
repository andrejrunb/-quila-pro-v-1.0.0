# Inteligência de Mapeamento (Seating Intelligence)

O sistema de Seating Intelligence (Fase 708) automatiza a organização da sala de aula utilizando telemetria pedagógica e comportamental em tempo real.

## ⚖️ Paradigma Human-in-the-Loop

Diferente de sistemas puramente automatizados, o Áquila Pro opera sob o princípio da **Soberania Docente**. A I.A. sugere melhorias, mas o professor tem a palavra final através de "Regras Rígidas" (Pins).

### Fluxo de Decisão
1. **Coleta de Dados:** O sistema analisa `frustrationScore` e `observationLevel` de cada aluno.
2. **Avaliação de Restrições:** O motor verifica a tabela `seating_rules` por restrições manuais.
3. **Geração de Sugestões:** Alunos sem 'Pins' são processados pela lógica de recomendação.
4. **Precedência:** Se um aluno está fixado (ex: `PIN_TO_FRONT`), o motor ignora qualquer sugestão de remanejamento para ele.

## 📍 Padronização Row/Col

Para alinhar o sistema com a realidade física das escolas, abandonamos o sistema de coordenadas `(x, y)` em favor de `(row, col)`:
- **Row (Fila):** Define a profundidade (Frente -> Fundo).
- **Col (Coluna):** Define a posição lateral.

### Lógica de Prioridade Pedagógica
- **Alta Frustração:** Sugerir `row: 0` (Frente) para suporte imediato.
- **Alta Observação:** Sugerir `row: 1` ou posições de alta visibilidade pelo SOC.
- **Conflitos de Proximidade:** Sugerir separação de alunos com altos níveis de indisciplina (`observationLevel >= 4`).

## 🛠️ Componentes Técnicos
- **Database:** Tabela `seating_rules` (SQLite).
- **Service:** `SeatingIntelligenceService.ts`.
- **IPC:** `seating:get-rules`, `seating:save-rule`, `seating:delete-rule`.

---
Vincular a: [[00_Index|Início]] | [[10_Architecture/Architecture_Overview|Arquitetura]]
