# 🎓 Áquila Pro — Manual Operacional do Piloto Pedagógico (Sala de Aula Real)

**Versão:** 1.0.0-PROD  
**Data:** 29 de Outubro de 2026  
**Público-Alvo:** Coordenadores Pedagógicos, Professores Parceiros e Equipe de Secretaria  
**Premissa Operacional:** **Zero Biometria • Zero Catracas • Zero Mocks • Sem Dependência de GPU Externa**

---

## 🏛️ 1. Objetivo & Visão Geral do Piloto Pedagógico

O **Piloto Pedagógico** foi concebido para validar a utilidade prática do Áquila Pro no coração da escola: a sala de aula. Ele isola completamente as complexidades de hardware da portaria e concentra-se exclusivamente em:

1. Reduzir a sobrecarga de trabalho manual do professor.
2. Fornecer diagnósticos formativos reais aos estudantes baseados em competências da BNCC.
3. Detectar equívocos conceituais frequentes (*misconceptions*) com intervenções sugeridas automaticamente.
4. Garantir que a secretaria importe dados escolares com auditoria, sem duplicidades e em conformidade estrita com a LGPD.

---

## 📋 2. Roteiro Operacional em 4 Fases

```
[ Fase 1: Secretaria ] Importação Segura da Turma Piloto (5 Fases)
      │
      ▼
[ Fase 2: Planejamento ] Professor Seleciona Habilidade BNCC & Lista de Itens
      │
      ▼
[ Fase 3: Realização ] Estudantes Respondem pelo Computador/Tablet
      │
      ▼
[ Fase 4: Intervenção ] Correção Determinística & Mapa de Lacunas da Turma
```

### Fase 1: Secretaria — Importação Auditável da Turma (5 Fases)
1. Acesse o **Portal da Coordenação / Secretaria** (`http://192.168.18.91:3000/portal/coordenacao`) na aba **"Importação Segura de Matrículas"**.
2. Faça o upload do arquivo CSV com as colunas: `Matrícula`, `Nome Completo`, `Turma`, `Nome do Responsável Legal` e `Contato do Responsável`.
3. O sistema executa automaticamente:
   * **Prévia & Validação:** Bloqueia confirmação se houver matrículas duplicadas ou ausência de dados do responsável (Art. 14 da LGPD).
   * **Relatório de Inconsistências:** Aponta a linha exata e o campo com erro.
   * **Confirmação Idempotente:** O operador assina a importação. Registros repetidos são atualizados sem duplicação de cadastros.

### Fase 2: Planejamento do Professor
1. Acesse o **Portal do Professor** (`http://192.168.18.91:3000/portal/professor`) na aba **"Diário de Classe & Registro BNCC"**.
2. Selecione a turma piloto (ex: `1º Ano EM A`) e a habilidade correspondente (ex: `EM13MAT301`).
3. O professor define a lista de exercícios e cadastra o **gabarito oficial** no sistema.

### Fase 3: Realização pelo Estudante
1. Os estudantes acessam o **Portal do Aluno** (`http://192.168.18.91:3000/portal/aluno`).
2. Cada estudante responde às questões objetivas no seu próprio ritmo.
3. O envio gera um registro imutável com data, hora e alternativas escolhidas.

### Fase 4: Avaliação Determinística & Intervenção Socrática
1. O `GradingService` compara imediatamente as respostas do aluno com o gabarito oficial:
   $$\text{Nota} = \left(\frac{\text{Acertos}}{\text{Total de Questões}}\right) \times 10.0$$
   *Nenhuma nota é gerada por simulação ou randomização.*
2. Para cada questão incorreta, o `PedagogicalScaffoldingEngine` identifica o padrão do equívoco:
   * Exemplo: Confusão entre base de potência e raiz quadrada.
   * Ação: Agenda revisão espaçada (24h, 72h e 168h) e disponibiliza um exemplo trabalhado (*worked example*) ao estudante.
3. O professor recebe no **Radar de Atenção** o mapa consolidado da turma, sabendo exatamente quais alunos necessitam de acolhimento presencial na aula seguinte.

---

## 🔒 3. Critérios de Sucesso do Piloto Pedagógico

O piloto de 1 turma será considerado **Aprovado com Louvor** quando:
- [ ] A secretaria importar o lote de alunos sem nenhuma inconsistência ou falha de banco.
- [ ] O professor concluir o ciclo completo de planejamento e correção sem precisar de suporte de TI.
- [ ] 100% das notas e feedbacks baterem rigorosamente com os gabaritos cadastrados.
- [ ] O professor relatar ganho mensurável de tempo na preparação de intervenções pedagógicas.
