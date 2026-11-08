Auditoria UI/UX — Áquila Pro Desktop
1. Veredito e alcance da análise

O Áquila já tem identidade visual consistente, bons agrupamentos em cartões e um avanço importante no aluno: “Continue de onde parou”, “Para entregar” e “Feedback do professor”. O próximo salto é de hierarquia, não de efeitos visuais: mostrar a próxima tarefa com clareza, reduzir comandos simultâneos e retirar telemetria técnica das jornadas escolares.

Há também problemas verificáveis no código: zoom limitado e inconsistente, textos de 9–11 px no cabeçalho, animações contínuas, controles de navegação sem estado acessível completo e mensagens demonstrativas que podem parecer registros reais.
raw.githubusercontent
+2

O que foi efetivamente examinado

Inspeção visual direta das quatro imagens anexadas: professor, aluno, secretaria e câmara de maestria.

Inspeção estática, no endereço do commit 7f6cc622, de PortalLayout.tsx, PortalLayout.css, TeacherPortal.tsx, StudentRPGPortal.tsx, StudentCosmeticsChamber.tsx e WordwallInteractivePlayer.tsx.
raw.githubusercontent
+5

As outras seis telas não foram recuperadas como imagens visualmente interpretáveis. As recomendações específicas para elas são propostas baseadas na descrição fornecida, não constatações visuais.

Não executei o Electron, testes de teclado, leitores de tela ou medições do DOM. Não atribuo conformidade WCAG nem razões de contraste às screenshots.

2. Top 5 gargalos
2.1. A navegação administrativa invade os portais escolares

Nas capturas, aluno e professor aparecem dentro de um shell com “Segurança”, “Câmeras ao Vivo”, “Night Sentry”, “Auditoria de Performance” e “Social Nexus”.

Como as imagens mostram uma sessão administrativa em prévia, isso não comprova que um estudante autenticado veja esses recursos. Contudo, dificulta avaliar a experiência real e enfraquece a separação visual entre gestão, ensino e segurança.

Proposta:

Professor: Hoje, Turmas, Atividades, Notas, Diário.

Aluno: Meu início, Atividades, Materiais, Progresso, Perfil.

Família: Meu estudante, Comunicados, Frequência, Documentos.

Alternância entre portais somente para equipe autorizada, dentro de “Visualizar outro portal”.

Faixa persistente de “Prévia — sem alterações” no modo administrativo.

Não use ocultação visual como autorização. O código atual já possui regras de prévia, mas elas não constituem auditoria dos serviços de backend.
raw.githubusercontent

2.2. Muitas ações têm a mesma importância visual

O aluno recebe nove botões antes do bloco de rotina. No professor, há ações globais e quatro botões repetidos em cada uma das seis aulas. Na secretaria, onze abas disputam uma linha com os comandos principais.

No TeacherPortal.tsx, a categoria “Aulas & Provas (6)” contém sete ações; “Todas (17)” corresponde a dezoito ações no conjunto examinado. Os contadores estão separados manualmente do conteúdo.
raw.githubusercontent

Correção:

Uma ação primária por região de trabalho.

Até duas ações secundárias imediatamente visíveis como meta inicial de design, não regra universal.

Demais ferramentas em catálogo pesquisável ou menu contextual.

Contadores derivados da mesma lista que renderiza as ações.

Não esconder ações essenciais exclusivamente em menus de reticências.

2.3. Densidade tipográfica excessiva e alvos pequenos

O CSS examinado define:

Identificação da sessão: 9 px.

Badge do portal: 10 px.

Alternador: 10 px, altura de 22 px.

Botões de ajuda: altura de 24 px.

Botões de zoom: largura de 22 px.
raw.githubusercontent

Não é possível concluir toda a conformidade só por essas dimensões, pois existem exceções e condições de espaçamento. Entretanto, são fortes candidatos a revisão.

Referências corretas:

Critério	Parâmetro WCAG
Contraste AA, texto comum	4,5:1
Contraste AAA, texto comum	7:1
Contraste AAA, texto grande	4,5:1
Alvo mínimo AA	24 × 24 CSS px, com exceções
Alvo ampliado AAA	44 × 44 CSS px, com exceções
Ampliação de texto	Até 200% sem perda de conteúdo ou funcionalidade
Reflow	Avaliar largura equivalente a 320 CSS px, com exceções para conteúdo bidimensional essencial

Esses são requisitos distintos; uma paleta com bom contraste não torna todo o produto “AAA”.
w3
+3

Minha proposta é corpo de 16 px, apoio de 14 px e controles principais com pelo menos 44 px de altura. As legendas não essenciais podem ser menores, desde que legíveis e verificadas.

2.4. A interface anuncia mais certeza do que demonstra

Na tela de maestria, “Host Native”, CPU, “16GB VRAM”, loss, questões calibradas e “NVIDIA / Colab Assist” aparecem junto da atividade do estudante. O enunciado não está visível no recorte, enquanto há várias alternativas genéricas e um painel lateral de domínio.

Essa distribuição privilegia a arquitetura do sistema, não a compreensão da questão.

O problema também aparece no código:

KPIs e conquistas fixos em StudentRPGPortal.tsx.

Feedback docente escrito diretamente no JSX.

Tarefas demonstrativas reaparecendo como fallback.

“Continue atividade” levando à rota geral de maestria, sem identificar a tarefa ou tentativa.
raw.githubusercontent

Cronograma e radar docente fixos no componente de dashboard.
raw.githubusercontent

Correção: estados explícitos de “Demonstração”, “Sem dados”, “Carregando”, “Indisponível” e “Última atualização”. Falha de serviço não deve produzir feedback fictício de professor.

2.5. Estímulos e mudanças automáticas competem com a leitura

O cabeçalho contém pulsações infinitas. O player avança respostas após aproximadamente 1,2–1,5 segundo e começa com som habilitado. No gameshow, há bônus por velocidade.
raw.githubusercontent
+1

Isso merece revisão para pessoas que precisam de mais tempo de leitura e processamento. A orientação cognitiva do W3C recomenda clareza, redução de distrações, controle das mudanças e personalização; não existe um único “modo TDAH/dislexia” que resolva todas as necessidades.
w3

Recomendo:

Feedback permanece até “Próxima”.

Som opcional e preferência persistida por usuário.

Movimento reduzido respeitado.

Tempo ajustável ou sem cronômetro na prática formativa.

Ranking e moedas fora da área de leitura.

Modo de foco sem remover ajuda, saída ou informações essenciais.

3. Benchmark: o que aproveitar, sem copiar a aparência
Referência	Padrão confirmado	Aplicação proposta no Áquila
Linear	Ações contextuais, seleção e command menu; favoritos pessoais	Trabalhar sobre a turma/atividade selecionada, não mostrar todas as ferramentas sempre. 
linear
+1

Raycast	Ação primária, painel de ações por contexto, pesquisa e atalhos descobertos progressivamente	“Abrir turma” como principal; chamada, notas e diário como ações relacionadas. 
manual.raycast

Duolingo Max	Prática contextual de conversação e revisão de interações	Missões com objetivo claro, feedback e retomada; não apenas XP e decoração. 
duolingo
+1

Kahoot	Accuracy experience com pontuação por acerto e opção de tempo ilimitado	Separar compreensão de rapidez, principalmente em práticas inclusivas. 
kahoot
+1

Wordwall	Nesta rodada não confirmei a documentação pública de recursos	Trato troca de mecânicas como capacidade do componente local examinado, não como integração oficial. 
raw.githubusercontent

O benchmark útil é comportamental. Adicionar blur, neon e microanimações não reproduz a eficiência de Linear ou Raycast.

4. Redesign por portal
4.1. Direção — decisões antes de gráficos

Proposta baseada na descrição da tela:

Título: “Visão da escola”.

Contexto: unidade e período.

Bloco “Decisões pendentes”.

Indicadores com definição, período e fonte.

Relatórios e gráficos.

Auditoria sob demanda.

Reduzir nove comandos para “Revisar pendências”, “Abrir relatórios” e acesso ao catálogo.

Receita e NPS devem mostrar contexto: competência, recebimento versus previsão, número de respostas e data. Não preencher ausência de dados com números demonstrativos.

4.2. Professor — organizar pela aula atual

Layout proposto:

text
Hoje                           Turma: 2º B

Aula atual — Física, sala 08
[Realizar chamada]  [Abrir diário]  [Mais ações]

Pendências de hoje
Próximas aulas
Ferramentas de preparação

Mudanças:

“Gestão de Sala & Telemetria Pedagógica” → “Meu dia”.

Manter a aula atual expandida; demais aulas compactas.

Permitir escolher uma aula e abrir ações contextuais.

Encaminhar classId, data e aula às páginas de chamada/diário.

Trocar “Resolver” por ações específicas: “Revisar diário”, “Lançar notas”.

Radar → “Acompanhamentos pedagógicos”, com origem, data e revisão docente.

O código atual navega para páginas gerais pelos botões da aula; no trecho examinado, não transmite o contexto do horário selecionado.
raw.githubusercontent

“Foco oscilante”, “conversa lateral” e “neuro-IA” não deveriam parecer diagnósticos objetivos. Na demonstração, os rótulos são dados fixos; em produção, qualquer observação precisa ter procedência e tratamento apropriado.
raw.githubusercontent

4.3. Grade SA+GLS — comparar antes de aplicar

Proposta baseada na descrição:

Exibir “Gerar proposta de grade”, não prometer “Zero janelas” antes do resultado.

Separar restrições obrigatórias de preferências.

Mostrar antes/depois: conflitos, janelas e alterações por professor.

Fluxo: Gerar → Comparar → Aprovar → Aplicar.

Preservar a grade anterior.

Alternativa em lista por professor para telas estreitas.

A grade semanal pode precisar de rolagem bidimensional; isso não justifica que o restante da página também exija rolagem horizontal. A WCAG prevê exceções para conteúdo cujo significado requer duas dimensões.
w3

4.4. Estúdio pedagógico — transformar jargão em etapas

Proposta baseada na descrição:

text
1. Objetivo
2. Público e adaptações
3. Conteúdo
4. Revisão
5. Publicação

ITEM-BNCC-2026-001 aparece como identificação secundária.

Exibir assunto, habilidade e exemplo antes dos parâmetros.

TRI 3PL, DOK e PEI/AEE em detalhes explicados.

“Calibrado” deve depender de evidência identificável, não do nome do seletor.

Diferenciar sugestão automática, revisão docente e publicação.

4.5. Coordenação — filas de acompanhamento

Proposta:

Priorizar casos que exigem ação.

Mostrar “motivo, evidência, responsável, próxima revisão”.

Separar frequência observada de previsão.

Evitar ranking de “alunos problemáticos”.

Habilitar comparação entre períodos e turmas com escopo explícito.

4.6. Secretaria — abandonar o catálogo de prontuários como tela principal

Na captura, o grid de 26 cartões ocupa espaço com nomes e RM, mas permite pouca comparação operacional.

Proponho:

Navegação em cinco grupos: Estudantes, Documentos, Equipe, Financeiro, Relatórios.

Uma seção separada de encaminhamentos e conformidade.

Lista/tabela com busca, filtros e colunas úteis.

Abrir prontuário em página ou painel de detalhes.

Importação: arquivo → prévia → validação → confirmação → recibo.

“Sincronizado” deve indicar o que foi sincronizado e quando.

“Operacional” deve ser acompanhado de estados reais, não só cor.

Em telas menores, trocar tabela por lista resumida. Não encolher onze abas até virarem legendas.

4.7. Família — compreensão e acolhimento

Proposta baseada na descrição:

Identificação do estudante.

Comunicados que pedem resposta.

Frequência explicada.

Próximas atividades.

Sugestão de conversa em casa.

Não mostrar apenas “30% faltas”: isso pode ser entendido como 30% das aulas. A comunicação precisa explicar o cálculo e distinguir alerta interno de encaminhamento formal.

“Conversa de jantar” pode ser “Uma conversa sobre o que aprendeu”, sem presumir rotina familiar, disponibilidade ou obrigação de adesão.

4.8. Aluno — manter “Meu início” e retirar o excesso à sua volta

Nova arquitetura:

text
Meu início | Atividades | Materiais | Progresso | Perfil

Continue sua atividade
[Continuar]

Para entregar
Feedback do professor

Explorar outras práticas

A loja fica em Perfil; não precisa disputar prioridade com entregas escolares.

Outras mudanças:

“Câmara de Maestria” → “Praticar questões”.

“Mestre do RAG” → conquista descrita em linguagem escolar.

“Precisão TRI” → indicador explicado e sustentado por dados.

Progresso pessoal antes de ranking.

Recompensar revisão e correção, não só velocidade e sequência sem pausas.

Não retirar acesso ao estudo por perda de “vidas”.

No código, o comentário docente é fixo e a navegação de feedback leva ao laboratório de IA. A versão final deve abrir a entrega específica e seu comentário real.
raw.githubusercontent

4.9. Atividades interativas — uma questão por vez

O player local apresenta catálogo, oito modalidades, temas e HUD antes da atividade.
raw.githubusercontent

Proposta:

Antes de começar: escolher atividade e preferências.

Durante: questão, resposta, dica e progresso.

Depois: explicação, revisão e recompensa.

Troca de formato em “Opções da atividade”.

Confirmar troca que reinicia o trabalho.

Usar alternativa por teclado para cada mecânica.

Não depender de som, cor ou arraste como único canal.

Correções adicionais encontradas:

Timer e timeout de resposta podem disputar o avanço da questão.

Alguns handlers de labirinto/avião não bloqueiam nova resposta durante a transição.

Créditos de Aureus usam uma chave global de localStorage.
raw.githubusercontent

Recomendo uma máquina de estados answering → feedback → next, uma única transição válida por tentativa e economia vinculada ao estudante no serviço autoritativo.

4.10. Cosméticos — expressão pessoal sem competição com aprendizagem

Preservar avatares e cenários científicos, mas simplificar:

“Meu perfil”.

“Minha coleção”.

“Explorar itens”.

Separar “Experimentar”, “Desbloquear” e “Usar”. Exibir custo antes da confirmação e não confundir ornamentação comprável com conquista pedagógica comprovada.

No componente examinado:

Falha ao equipar é ignorada e a interface pode confirmar sucesso.

Exceção na compra pode cair em débito local de fallback.

O saldo usa a mesma chave global de armazenamento local.

Há catálogo e estados iniciais demonstrativos.
raw.githubusercontent

O redesign deve corrigir essas confirmações antes de acrescentar animações de vitória.

5. Tokens e microinterações
Direção proposta
Elemento	Valor inicial
Fundo	#0B1020
Superfície	#121A2B
Superfície elevada	#1A2538
Texto principal	#F8FAFC
Texto secundário	#CBD5E1
Texto auxiliar	#B4C1D4
Acento de ação	#A5B4FC com texto escuro
Foco	#FDE68A
Sucesso / aviso / erro	#6EE7B7 / #FDE68A / #FDA4AF
Escala espacial	4, 8, 12, 16, 24, 32 px
Raios	8, 12, 16 px
Movimento	120–180 ms; sem pulso contínuo

São tokens propostos, não cores atuais medidas nem certificado de contraste. Verifique cada combinação renderizada, incluindo transparência, hover, texto e gráficos.

“Obsidian Glass” deve ser uma opção estética discreta: superfícies opacas como base, vidro somente em sobreposições. Bordas luminosas reservadas a foco/seleção, não a todos os cartões.

Para leitura:

Fonte do sistema ou fonte local legível; não impor uma “fonte de dislexia”.

Alinhamento à esquerda e linhas moderadas.

Ajuste de tamanho e espaçamento.

Temas claro e escuro.

Preferências independentes de leitura, som e movimento.

A personalização e o teste com pessoas com diferentes necessidades são mais defensáveis do que um preset baseado em diagnóstico.
w3

6. CSS pronto para adicionar

Adicionar como folha nova, carregada depois dos estilos globais. Os componentes abaixo usam classes próprias para evitar reestilização indiscriminada.

css
/* aquila-accessible-ui.css */
.aq-ui {
  --aq-bg: #0b1020;
  --aq-surface: #121a2b;
  --aq-raised: #1a2538;
  --aq-text: #f8fafc;
  --aq-secondary: #cbd5e1;
  --aq-muted: #b4c1d4;
  --aq-border: #64748b;
  --aq-accent: #a5b4fc;
  --aq-on-accent: #111827;
  --aq-focus: #fde68a;
  --aq-error: #fda4af;
  --aq-radius: 12px;

  color: var(--aq-text);
  background: var(--aq-bg);
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 1rem;
  line-height: 1.5;
  min-width: 0;
  color-scheme: dark;
}

.aq-ui,
.aq-ui *,
.aq-ui *::before,
.aq-ui *::after {
  box-sizing: border-box;
}

.aq-ui :where(button, input, select, textarea) {
  font: inherit;
}

.aq-ui