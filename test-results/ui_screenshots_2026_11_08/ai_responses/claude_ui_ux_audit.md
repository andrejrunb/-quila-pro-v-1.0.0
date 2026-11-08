Claude respondeu: Só chegaram 4 das 10 telas: Direção, Professor, Aluno (RPG) e Câmara de Cosméticos.
Compartilhou um arquivo, executou 4 comandos

Compartilhou um arquivo, executou 4 comandos

Só chegaram 4 das 10 telas: Direção, Professor, Aluno (RPG) e Câmara de Cosméticos. Não vi Grade SA+GLS, Estúdio IA, Coordenação, Secretaria, Família nem Maestria/Wordwall, então não opino sobre elas. O link raw do GitHub pode trazer as outras seis, se você quiser.

Medi o contraste dos rótulos por amostragem de pixels nos PNGs da Direção. Os demais itens são leitura visual.

1. Top 5 gargalos
Texto secundário abaixo do mínimo de contraste. Os rótulos usam 
#64748b sobre 
#0c121e.
“HÁ 04 MIN” tem 3,4:1, o eixo SEG/TER 3,3:1, “FREQUÊNCIA MÉDIA” 4,0:1 e “AMBIENTE” 4,1:1.
O mínimo AA é 4,5:1 e o AAA é 7:1. A descrição dos cards de portal tem 6,3:1.
Esses textos também têm cerca de 9 a 10 px em fonte mono, o que piora a leitura.
Barras de comando sem hierarquia.
A Direção tem 9 botões do mesmo peso, com três estilos de cor (verde cheio, roxo, contorno), e nenhum é claramente o principal.
No Professor, cada uma das 6 aulas repete 4 botões iguais, 24 no total.
A barra global tem badge, tag de sessão, 6 pílulas, relógio, zoom, ajuda e recolher. Na tela do Aluno ela quebra em duas linhas.
Gráficos que parecem placeholder. As 6 barras de presença têm a mesma altura, sem valor nem eixo, e a curva de receita não tem eixos. KPIs como “R$ 450K / 98,2% / NPS 89” aparecem sem nenhum selo de exemplo.
Metade da tela vazia e a outra sobrecarregada.
A Direção e o Professor deixam cerca de 40% da área útil em branco. O feed lateral da Direção estica até o rodapé, vazio.
O Aluno tem mais de 25 elementos clicáveis na primeira dobra.
Na Câmara de Cosméticos, o título e o preview ocupam a tela inteira e o catálogo começa cortado.
Foco de teclado quase invisível. Não vejo estado de focus-visible claro, e “Buscar ⌘K” é o único atalho. Os badges coloridos de 10 px (PROF, COORD, “MOTOR NVIDIA 90B VISION”) são decorativos e poluem.

Dois pontos de conteúdo que aparecem nos prints:

Fotos de pessoas. O feed usa fotos que parecem de pessoas reais (e um cachorro) ao lado de “ALUNO SINTETICO”. Se forem fotos de banco de imagens, confirme a licença. Se forem de alunos, é problema de LGPD.
Afirmações no cartão. “MOTOR NVIDIA 90B VISION” e “Sessão: … (Fixture)” aparecem no cartão de produto. Isso contradiz a Matriz de Veracidade se a tela for usada em material comercial.
2. Por portal
Direção: uma ação primária (“Prontidão dos Pilotos”) e duas secundárias, com o resto em “Mais ações”. Dê altura útil ao feed, ou limite-o a 5 itens com “Ver tudo”, e mostre valor e eixo nos gráficos. Marque os KPIs fixos como “exemplo”.
Professor: uma linha de aula com “Chamada” sempre visível e Notas, Diário e Mapa só no hover ou foco. Melhor ainda: clicar na aula abre um espaço com abas. Os filtros “Gestão de Sala (5)…” duplicam a barra de comandos, então mantenha só um dos dois.
Secretaria e Grade SA+GLS (sem prints): as 11 abas pedem agrupamento em 3 ou 4 seções, e o “Otimizar Grade” deve ser o único botão primário da grade. Atalhos de sequência (g n nova matrícula, g f financeiro) cobrem os fluxos mais usados.
Aluno: a hierarquia já tem a ação certa, “Continuar atividade”. Para deixá-la mais magnética sem perder o foco pedagógico:
Reduza os 9 chips a 4 mais “Mais”.
Mostre só a missão do dia e esconda o arcade atrás de “Explorar”.
Anime só no ganho de XP (0,45 s, reward-pop).
Mantenha prefers-reduced-motion.
Na Câmara de Cosméticos, comece pelo catálogo e deixe o preview fixo ao lado.
3. Tokens e código

O zip aquila-ui-kit-2026-11-08.zip traz:

aquila-tokens.css: superfícies, tipografia e foco.
CommandBar.tsx: barra com menu “Mais”, navegável por teclado.
KpiTile.tsx: KPI com selo “exemplo”.
LessonRow.tsx: linha de aula com uma ação principal.
Um hook de atalhos de sequência.
USO.md: onde aplicar cada peça.

Escolhi três textos que sobem de 3,4:1 para 7,6 a 8,9:1:

--text-1 #f1f5f9: 15 a 17:1.
--text-2 #cbd5e1: 11 a 13:1.
--text-3 #a3b2c7: 7,6 a 8,9:1.

O piso de fonte passa a 12 px, os números usam tabular-nums, e o foco é um anel amarelo 
#fde047.

Não rodei nada disso no repo, e o TSX não passou por typecheck (faltam as dependências). O CSS cria classes novas (.btn, .card, .kpi, .cmdbar, .lesson) que podem colidir com as existentes, então confira antes de importar.

Para cumprir AAA nos rótulos, os tokens servem. Para o restante da interface, o ideal é medir as 10 telas com uma ferramenta de contraste automatizada.


Aquila ui kit 2026 11 08
ZIP






há 43 minutos