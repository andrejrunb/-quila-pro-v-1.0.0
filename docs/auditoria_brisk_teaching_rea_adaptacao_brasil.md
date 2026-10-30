# Auditoria Profunda REA & Agent Reach — Brisk Teaching (`app.briskteaching.com`)
## Absorção Completa de Funcionalidades & Adaptação Soberana à Realidade Brasileira

**Data da Auditoria:** 28 de Outubro de 2026  
**Engenharia Reversa (REA):** Análise de Superfície de API, Contratos de Dados, Sessão e Features  
**Alvo:** `https://app.briskteaching.com/` e Extensão Chrome (1.000.000+ usuários)  
**Ambiente:** Áquila Pro School OS v2.1 (Soberania de Borda, Edge-First & LGPD)

---

## 🔬 1. Raio-X da Arquitetura & Endpoints Descobertos (REA)

### A. Endpoints do Backend Brisk
- `GET https://api.briskteaching.com/user_initial_data`: Payload nuclear contendo o objeto `viewer`, plano, cotas freemium por ferramenta, feature flags do Statsig e flags de governança de IA.
- `GET https://api.briskteaching.com/list_sections`: Integração de turmas e sincronização de alunos com Google Classroom e Microsoft OneDrive.
- `POST https://api.briskteaching.com/log_to_segment`: Rastreamento de telemetria analítica docente.
- `https://boost.show/`: Portal web público/responsivo onde os estudantes entram para executar as atividades interativas criadas pelo professor (código de turma ou link compartilhado).

### B. Catálogo Completo de Cotas & Ferramentas (`freemium_credits_per_feature`)
1. `doc`: Criação automatizada de documentos e textos didáticos.
2. `slides`: Geração de apresentações pedagógicas completas.
3. `quiz`: Criação de avaliações, questionários e testes de múltipla escolha.
4. `worksheet`: Criação de folhas de exercícios e materiais imprimíveis.
5. `podcast`: Geração de áudio educacional e debates narrados por IA.
6. `change_level`: Reescrita de textos para alteração do nível de leitura/proficiência.
7. `citations`: Geração automática de citações e referências bibliográficas.
8. `feedback`: Motor de correção e sugestões pedagógicas individuais.
9. `bulk_feedback`: Correção em lote de turmas inteiras com revisão humana (HITL).
10. `boost`: Suíte de atividades interativas e tutoria socrática para estudantes.

---

## 🎯 2. Anatomia dos 17 Tipos de Atividades Interativas ("Brisk Boost")

Descobertos através da chave `disabled_boost_activity_types` no backend:

### Categoria A: Engajamento & Investigação
1. **`tutor`**: Tutor socrático personalizado que não dá respostas diretas, guiando o aluno por perguntas.
2. **`whiteboard`**: Lousa interativa multimodal com IA para apoio a exercícios visuais.
3. **`debate_me`**: Arena de debate onde a IA desafia o estudante a fundamentar seus argumentos com evidências.
4. **`hook`**: Cenários provocadores para iniciar a aula e prender a atenção (gancho motivacional).
5. **`brainstorming_partner`**: Parceiro criativo para geração de ideias e estruturação de projetos.
6. **`character_chat`**: Chat em primeira pessoa com personagens históricos, cientistas e autores literários.
7. **`science_inquiry`**: Simulação de laboratório e investigação de hipóteses pelo método científico.
8. **`math_word_problems`**: Resolução de problemas matemáticos contextualizados do mundo real.

### Categoria B: Avaliação Formativa
9. **`pulse_check`**: Checagem rápida de retenção conceitual durante o andamento da aula.
10. **`exit_ticket`**: "Bilhete de saída" para verificação rápida do que foi assimilado antes do sinal tocar.
11. **`quiz_me`**: Simulado adaptativo interativo direto com a IA.

### Categoria C: Escrita & Metacognição
12. **`writing_coach`**: Treinador individualizado de redação e estrutura de parágrafos.
13. **`glows_and_grows`**: Matriz de feedback cognitivo estruturada em "O que brilhou" (pontos fortes) e "Onde crescer" (pontos de melhoria).
14. **`next_steps`**: Planilha prática de recomendações para o próximo ciclo de estudo.
15. **`goal_setting`**: Definição de metas SMART e autorregulação da rotina escolar.
16. **`research_assistant`**: Assistente de busca de fontes confiáveis e combate a fake news.
17. **`free_form_chat`**: Espaço aberto guiado por diretrizes seguras do docente.

---

## 🇧🇷 3. Adaptação Soberana à Realidade Brasileira (Áquila Pro v2.1)

O Brisk foi projetado para os padrões educacionais dos Estados Unidos (Common Core, TEKS e Google Docs corporativo). No **Áquila Pro**, adaptamos cada funcionalidade para as escolas, redes públicas e colégios privados do Brasil:

| Pilar Brisk | Padrão Norte-Americano | Adaptação Áquila Pro (Brasil) |
| :--- | :--- | :--- |
| **Alinhamento Curricular** | Common Core / TEKS / NGSS | **Matriz BNCC (EF e EM) + Descritores SAEB + Matriz de Competências do ENEM** |
| **Correção de Redação** | Rubricas genéricas em inglês | **Correção Oficial das 5 Competências do ENEM (Nota 0 a 1000)** com detecção de desvio da norma culta, proposta de intervenção e repertório sociocultural |
| **Feedback em Lote (Batch)** | Google Docs / Drive | **Integração com Activesoft, TOTVS, Sophia, Plurall Maestro e Positivo On**, com opção de impressão direta e boletins de notas |
| **Integridade Acadêmica** | Replay de digitação & IA Detector | **Trilha de Auditoria com Replay de Resolução + Análise Estilométrica Anticolagem + Modo Offline (Zero Vazamento)** |
| **Personagens do Chat** | Figuras dos EUA (Lincoln, Washington) | **Panteão Histórico e Científico Brasileiro:** Machado de Assis, Santos Dumont, Oswaldo Cruz, Carlos Chagas, Bertha Lutz, Dandara dos Palmares, Darcy Ribeiro e Clarice Lispector |
| **Materiais Imprimíveis** | Formato Carta (US Letter) | **Formato A4 Padrão Brasileiro** com cabeçalho escolar oficial, código BNCC e **Cartão-Resposta OMR de Borda Integrado** (escaneável por webcam/celular em 40ms) |
| **Ajuste de Leitura** | Lexile Reading Level | **Escala de Letramento e Proficiência SAEB (Níveis 1 a 9)**, simplificando termos técnicos para o Ensino Fundamental I ou aprofundando para 3ª Série/Pré-Vestibular |
| **Soberania & Custo** | Nuvem proprietária americana (\$10/mês) | **Servidor Edge Local Offline-First (Electron + SQLite WAL + GPUs NVIDIA/Colab)** com custo zero de licença mensal por professor |

---

## 🛠️ 4. Mapeamento de Implementação no Áquila Pro

1. **Adição das Atividades no Portal do Professor (`TeacherPortal.tsx`):**
   - Criação da aba **"Gerador Pedagógico BNCC"** com os modos Documento, Apresentação, Quiz OMR, Folha A4 e Atividade Boost.
2. **Integração do "Glows & Grows" na Correção OMR & Redação (`PedagogicalTriEngine.ts`):**
   - Cada simulado ou redação devolve automaticamente o feedback pedagógico dividido em:
     - 🌟 **Pontos Fortes (Glows):** Habilidades BNCC consolidadas com proficiência $\theta > 1.0$.
     - 🌱 **Oportunidades de Crescimento (Grows):** Descritores SAEB em que o aluno cometeu erros conceituais ou chute.
     - 🚀 **Próximos Passos (Next Steps):** Recomendações de videoaulas do YouTube e itens de reforço na Câmara de Maestria.
3. **Panteão Histórico Brasileiro no `StudentMasteryChamber.tsx`:**
   - Modo de diálogo socrático histórico com figuras nacionais como tutor virtual.
4. **Alimentação Contínua do Swarm de GPUs:**
   - Ingestão das regras de feedback pedagógico no dataset de fine-tuning para que as GPUs locais e remotas respondam como tutores no padrão Brisk/BNCC.
