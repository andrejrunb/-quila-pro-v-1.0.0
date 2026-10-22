# ⚔️ Arena de Batalhas Pedagógicas Soberana (PvP & Co-op Local) — Áquila Pro

## 🏆 Visão Geral

A **Áquila Arena** é o motor de gamificação pedagógica de alta intensidade da escola, projetado para operar **100% em rede local (sem dependência de internet)**. Ele transforma a resolução de itens curriculares (BNCC/ENEM) em uma disputa socrática eletrizante com timer, combos de acerto, dano argumentativo e apostas de XP.

---

## 🎮 Modos de Combate Implementados

### 1. ⚔️ Duelo Socrático 1v1 (PvP Local)
- **Oponentes da Sala**: Integração direta com a base de estudantes reais do colégio (ex: Alexandre Paz, Ana Júlia Cabral, Arthur Borges, Caio Hamu, Sofia Costa, etc.).
- **Dificuldade Calibrada pela TRI**:
  - *Fácil*: Nível introdutório, tempo de resposta entre 7 e 12s, 65% precisão.
  - *Médio*: Nível ENEM padrão, tempo de resposta entre 6 e 10s, 75% precisão.
  - *Mestre*: Nível Fuvest/ITA/Medicina, tempo de resposta entre 4 e 7s, 85% precisão.
- **Mecânicas de Combate**:
  - 5 Rodadas cronometradas com **20 segundos** por questão.
  - Barra de Vida (1000 HP). Acertos causam dano proporcional à velocidade ($1000 + \text{tempo} \times 25$).
  - **Streak Multiplier**: Acertos consecutivos ativam bônus de combo ($\times 1, \times 2, \times 3$).
  - **Aposta Soberana**: Jogadores apostam 50, 100 ou 250 XP. O vencedor dobra a aposta.

### 2. 👑 Boss Raid Co-op: Desafio do Mentor Histórico
Os alunos enfrentam os maiores gênios da história da ciência em domínio público:
1. **Albert Einstein — Guardião do Espaço-Tempo (2500 HP)**: Questões de Relatividade, Efeito Fotoelétrico e Física Moderna.
2. **Marie Curie — Soberana do Núcleo Atômico (2200 HP)**: Questões de Radioatividade, Química Nuclear e Decaimento.
3. **Isaac Newton — Mestre das Três Leis (2400 HP)**: Questões de Mecânica Clássica, Gravitação e Óptica.
4. **Gregor Mendel — Decifrador da Hereditariedade (2000 HP)**: Questões de Genética, Cruzamentos e Heredogramas.
5. **Machado de Assis — Bruxo do Cosme Velho (2100 HP)**: Questões de Literatura, Figuras de Linguagem e Ironia Realista.

- **Recompensa Lendária**: Derrotar o Boss concede insígnias históricas exclusivas (ex: *Insígnia de Ouro de Einstein*, *Láurea Real dos Principia de Newton*) e +500 XP.

### 3. 📡 Torneio ao Vivo da Turma (Classroom LAN)
- O professor abre a sala de torneio local através do Cockpit Docente ou da Fábrica de Atividades.
- Código de Sala local de 4 caracteres (ex: `AQUI-3A`).
- Leaderboard em tempo real sincronizado entre todos os alunos conectados ao Wi-Fi escolar.

---

## 🎙️ Síntese de Voz (TTS) e Acessibilidade
- Locutor socrático dinâmico via Web Speech API (`pt-BR`).
- Narração em tempo real: *"Duelo Iniciado!"*, *"Acerto Crítico!"*, *"Tempo Esgotado!"*.
- Falas provocativas e socráticas dos Mentores Boss em primeira pessoa.

---

## 💾 Persistência e Integração Curricular
- As notas e pontuações da Arena são salvas no SQLite (`student_grades`, `attendance_logs`) e sincronizadas com a Planilha de Notas do Professor (`TeacherGradebook.tsx`).
