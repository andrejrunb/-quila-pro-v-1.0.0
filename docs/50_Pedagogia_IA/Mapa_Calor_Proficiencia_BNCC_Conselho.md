---
title: Mapa de Calor de Proficiência Curricular BNCC (Diagnóstico Coletivo para Conselho Pedagógico)
date: 2026-10-20
tags:
  - pedagogia
  - bncc
  - heatmap
  - proficiencia
  - tri
  - enem
  - conselho-classe
  - coordenacao
---

# 📊 Mapa de Calor de Proficiência Curricular BNCC — Áquila Pro

O **Mapa de Calor de Proficiência Curricular BNCC** é a ferramenta soberana de diagnóstico coletivo do corpo docente e da coordenação pedagógica do Colégio Visão. 

Ele cruza as **24 competências e habilidades estruturantes da BNCC** com o desempenho individual de cada estudante da turma, gerando uma matriz visual analítica e identificando preventivamente gargalos de aprendizagem antes que se transformem em retenção ou notas baixas no ENEM/SAEB.

---

## 🧭 Indicadores & Semântica Visual

A matriz 2D utiliza a régua cromática oficial do Design System Soberano:

* 🟢 **Domínio Consolidado ($\ge 75\%$)**: O estudante demonstra autonomia e capacidade de aplicação prática da habilidade em problemas interdisciplinares complexos.
* 🟡 **Em Desenvolvimento ($55\% - 74\%$)**: Domínio parcial dos fundamentos; necessita de consolidação em itens de discriminação moderada ($a \approx 1.0$, $b \approx 0.0$).
* 🔴 **Alerta de Nivelamento ($< 55\%$)**: Déficit crítico identificado; acionamento automático de micro-passos na **Câmara de Maestria** com mentoria histórica socrática.

---

## 🎛️ Funcionalidades Centrais

1. **Filtro por Turma & Macroárea**:
   - Transição instantânea entre turmas do 6º Ano do Ensino Fundamental ao 3º Ano do Ensino Médio.
   - Segmentação por macroáreas: Matemática, Ciências da Natureza, Linguagens & Redação e Ciências Humanas.
2. **KPIs Executivos da Turma**:
   - **Média Global de Proficiência**: Medida agregada de domínio da classe.
   - **Habilidade em Destaque**: Competência com maior taxa de consolidação na turma.
   - **Ponto Crítico de Atenção**: Competência com maior índice de erros, sinalizando necessidade de aula de revisão.
   - **Alunos em Nivelamento**: Total de alunos com média $< 60\%$.
3. **Dossiê Interativo da Competência**:
   - Ao clicar em qualquer coluna de habilidade (ex: `EM13MAT101`, `EM13CNT201`, `EM13LP01`), abre-se a gaveta com a descrição oficial BNCC, o mentor patrono (Newton, Gauss, Lovelace, Machado, Curie), o parâmetro de dificuldade TRI ($\theta$) e a nuvem de alunos em déficit.
   - **Disparo de Nivelamento com 1 Clique**: Gera e agenda exercícios formativos socráticos diretamente no perfil do estudante na Câmara de Maestria.
4. **Emissão de Relatório Oficial de Conselho de Classe (PDF)**:
   - Layout preparado com `@media print` para impressão física ou arquivamento em PDF para atas pedagógicas.

---

## 🏗️ Arquitetura Técnica

* **Componente**: `apps/electron/src/ui/components/BNCCProficiencyHeatmap.tsx`
* **Estilos**: `apps/electron/src/ui/components/BNCCProficiencyHeatmap.css`
* **Fontes de Dados**:
  * Matriz Curricular: `BNCC_SKILLS_DATA` em `apps/electron/src/ui/components/BNCCSkillTree.tsx`
  * Cadastro de Alunos: `STUDENTS` em `apps/electron/src/database/studentsData.ts`
* **Rotas de Integração**:
  * No Cockpit de Coordenação (`CoordinationPortal.tsx`): Atalho no toolbar e rota `case 'bncc-heatmap'`
  * No Cockpit Docente (`TeacherPortal.tsx`): Botão "Mapa de Calor BNCC" e rota `case 'bncc-heatmap'`
  * Roteador Global (`App.tsx`): Mapeado em `isTeacherPage` e `isCoordinationPage`
