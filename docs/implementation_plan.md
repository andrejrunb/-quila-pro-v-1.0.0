# Compactação e Aumento de Densidade da UI (Zero-Scroll Priority) + Correções

Este plano detalha as alterações estruturais na interface do **Áquila Pro** para reduzir letras e espaços excessivos, e também implementa as correções solicitadas (IA, Quadro IA e Relatório Diário).

## User Review Required
> [!IMPORTANT]
> A IA estava falhando porque o serviço (`genAIService`) estava sendo registrado apenas no final da "Fase 2" de inicialização do sistema. Se algum módulo secundário demorasse ou falhasse, a IA ficava indisponível. Vou mover o registro da IA para a Fase 1 (imediata) para garantir que ela sempre funcione.
>
> Além disso, vou alterar globalmente a densidade do sistema (reduzindo fontes e espaços) e remodelar o Relatório Diário para um formato de lista expansível.
> Por favor, aprove este plano para eu executar as alterações.

## Proposed Changes

---

### 1. Correção do Motor de IA (`ai:chat`)
O `GenerativeAIService` não estava sendo injetado corretamente nos IPC handlers se o boot demorasse ou abortasse no meio da Fase 2.
#### [MODIFY] `orchestrator.ts`
- Mover a inicialização e o registro do `genAIService` (`sovereignRegistry.registerInstance`) para a Fase 1 (garantindo disponibilidade no boot crítico) ou logo no início da Fase 2, antes de módulos propensos a falhas.

---

### 2. Global Design System (Alta Densidade)
Redução cirúrgica das variáveis de tipografia e espaçamento para comprimir a interface inteira.
#### [MODIFY] `index.css`
- Reduzir `--container-padding` de `32px` para `16px`.
- Reduzir a escala tipográfica (ex: `--fs-h1` de `2rem` para `1.5rem`, `--fs-body` de `0.9375rem` para `0.85rem`).
- Reduzir as escalas de gap (`--gap-md`, `--gap-lg`, `--gap-xl`).

---

### 3. Módulo de Tarefas & Agendamentos
Reorganização severa do layout para eliminar o enorme espaço vazio horizontal.
#### [MODIFY] `TaskScheduler.css` & `TaskScheduler.tsx`
- Reduzir os paddings do painel do formulário (`form-panel`).
- Usar **Grid Layout no Formulário:** Colocar a Descrição ao lado dos metadados (Título/Data) para otimizar o espaço horizontal e cortar a altura do formulário pela metade.

---

### 4. Remoção da aba "Quadro IA" do PC
#### [MODIFY] `Sidebar.tsx`
- A funcionalidade "Quadro IA (Scanner)" foi feita apenas para o app celular.
- Vou condicionar a exibição do menu `board-scanner` no Sidebar verificando se não estamos no desktop, ou simplesmente removendo o atalho da versão de computador.

---

### 5. Relatório Diário IA (TeacherDailyReport)
O relatório de acompanhamento socioemocional usa um dropdown enorme.
#### [MODIFY] `TeacherDailyReport.tsx` & `TeacherDailyReport.css`
- **Lista Expansível:** Converter a seleção do aluno (dropdown) em uma lista de alunos (estilo chamada).
- **Densidade:** Espaçamento curto, priorizando que todos os alunos apareçam sem scroll.
- **Accordion:** Ao clicar no aluno, o painel de avaliação (textarea e IA) se expande de forma compacta (inline).
- **Ditado:** O botão de "Ditar" (Ditado por voz) será ocultado via CSS/condicional na versão de PC (Desktop), mantendo-se exclusivo do celular (WebMobile).

## Verification Plan
1. Alterarei `orchestrator.ts` para reparar o backend da IA.
2. Editarei o CSS global (`index.css`).
3. Refatorarei `TaskScheduler.tsx`, `Sidebar.tsx` e `TeacherDailyReport.tsx`.
4. Sem necessidade de recompilar para verificar o front-end, podemos usar `npm run dev` para testes rápidos.
