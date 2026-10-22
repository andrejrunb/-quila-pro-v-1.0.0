# 📽️ Estúdio Docente de Slides & Aulas Interativas — Áquila Pro

## 🌟 Visão Geral

O **Estúdio de Slides Áquila Pro** é uma ferramenta nativa de autoria e projeção pedagógica projetada para lousas digitais, projetores de sala de aula e computadores docentes, operando **100% no perímetro local e sem dependência de serviços externos**.

Elimina a necessidade de ferramentas proprietárias de terceiros (PowerPoint, Canva, Prezi), integrando o planejamento de aula diretamente às matrizes de competência da BNCC, itens TRI do ENEM e pensadores históricos em domínio público.

---

## 🚀 Principais Recursos do Estúdio

### 1. Modelos de Aulas Pré-Estruturados (Decks Prontos BNCC):
- ⚛️ **Física (EM13CNT101 / EM13CNT301)**: *Dinâmica Clássica: As 3 Leis de Newton, Atrito e o Paradoxo do Ônibus em Curva* (Mentor: Isaac Newton).
- 🔬 **Química (EM13CNT104 / EM13CNT205)**: *Química Nuclear: Emissões Alfa, Beta, Gama e Cinética de Meia-Vida* (Mentora: Marie Curie).
- 📐 **Matemática (EM13MAT301 / EM13MAT501)**: *Funções Quadráticas: Vértice, Otimização de Lucro e Parábolas* (Mentora: Ada Lovelace).

### 2. Estrutura Pedagógica de Cada Deck (Taxonomia DOK):
Cada apresentação é estruturada em 6 momentos pedagógicos essenciais:
1. **Slide de Abertura (Cover)**: Título, disciplina, código da habilidade BNCC e citação autoral do cientista histórico em domínio público.
2. **Gancho Socrático (Hook)**: Pergunta instigante baseada em um dilema da vida real para mobilizar a turma.
3. **Núcleo Teórico (Theory)**: Conceituação rigorosa com tópicos essenciais e ausência de ruído visual.
4. **Modelagem Matemática (Formula)**: Equações em destaque com análise dimensional das variáveis.
5. **Item Prático TRI / ENEM (Question)**: Questão oficial calibrada com recurso interativo de **"Revelar Gabarito / Ocultar Resposta"** para criar engajamento em sala.
6. **Bilhete de Saída (Exit Ticket)**: 3 perguntas reflexivas de 1 minuto para diagnóstico formativo antes do término da aula.

### 3. Modos de Projeção & Ferramentas de Lousa:
- **Modo Tela Cheia (F11 / Lousa Digital)**: Formato de cinema 16:9 de alto contraste (Dark Mode Cyberpunk).
- **Apontador Laser Virtual**: Permite ao docente usar o mouse como um laser pontual vermelho fluorescente em telas touch ou projeções.
- **Cronômetro da Aula**: Temporizador digital no HUD para gestão dos 50 minutos de aula.
- **Notas Pedagógicas Privadas**: Dicas metodológicas e alertas sobre pegadinhas comuns da banca que ficam visíveis apenas para o professor na tela secundária ou de preparação.
- **Impressão de Handout / Apostila em PDF**: Formatação automática em `@media print` para distribuir a aula impressa aos alunos com espaço para anotações.

---

## 🔗 Integração no Ecossistema
- **Cockpit Docente ([`TeacherPortal.tsx`](file:///c:/aquila/apps/electron/src/ui/portals/TeacherPortal.tsx))**: Acesso direto pelo botão `Estúdio de Slides`.
- **Fábrica de Atividades ([`ActivityFactory.tsx`](file:///c:/aquila/apps/electron/src/ui/pages/ActivityFactory.tsx))**: Exportação cruzada para gerar simulados e listas de exercícios a partir dos mesmos tópicos de slide.
