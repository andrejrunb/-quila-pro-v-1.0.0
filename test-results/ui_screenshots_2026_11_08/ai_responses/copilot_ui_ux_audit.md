Auditório visual das capturas anexas

O visual é bom, mas há problemas de densidade, prioridade das ações e aproveitamento do espaço . Nas imagens visíveis, os pontos mais críticos são a tabela da nota cortada, as navegações extensas e a concentração de elementos de destaque.

Os 5 melhores gargalos
Ações demais disputando atenção: a barra da Direção encontra nove botões. Na Secretaria, ações rápidas e abas repetem caminhos — por exemplo, importar matrículas aparece nas duas áreas.
Grade cortada: as colunas da semana ficam apertadas e parte do conteúdo à direita não aparece. As aulas também quebram em várias linhas, dificultando a comparação por dia.
Secretaria com navegação excessiva: as onze abas ocupam uma faixa extensa e uma delas quebra para outra linha. Isso prejudica a leitura e a localização das funções.
Hierarquia e legibilidade: títulos e núcleos de destaque são fortes, mas metadados pequenos e cinza sobre escuro podem ser difíceis de ler. A captura não permite comprovar conformidade WCAG: contraste deve ser calculado para cada combinação de cor e estado.
Espaço e efeitos mal distribuídos: a Direção concentra conteúdo na parte superior e deixa grande área vazia; a Câmara de Cosméticos, por outro lado, empilha banner, filtros e cartões carregados de detalhes. Há oportunidade de equilibrar melhor a densidade.
Recomendações por portal
Direção: deixar duas ou três ações primárias visíveis e agrupar as outras em “Mais ações”. Aumentar a área útil para gráficos ou atividades recentes, sem elevar o feed de auditorias ao mesmo peso dos indicadores.
Professor e Grau SA+GLS: priorizador aula atual e próxima aula; permitir instalar uma agenda para dar mais espaço à grade. Mantenha uma tabela rolável dentro de seu próprio painel, com cabeçalho fixo e células de altura consistente.
Secretaria: agrupar abas por domínio — Acadêmico , Pessoas e Administração — e evitar ações duplicadas entre command bar e abas. Adicione busca e paginação/virtualização ao cofre de prontuários.
Família: embora essa tela não esteja entre as capturas visíveis desta mensagem, a descrição sugere prioridade prioritária, próximos compromissos e alertas acionáveis. Explicar alertas legais em linguagem simples, com dados, contexto e próximo passo.
Aluno, Wordwall e Cosméticos: deixe “Continuar aprendizagem” como ação principal. Separar itens incluídos, desbloqueados e por conquistar; apresentar a ligação entre recompensa e atividade pedagógica. Manter animações breves, sem impulso o estudante a permanecer no sistema.
Tokens e estados visuais

Uma paleta mais consistente pode manter o tema escuro, mas estimular o texto secundário e reduzir o brilho permanente. AAA não deve ser presumido: as classificações para texto normal é 7:1 , e para texto grande, 4,5:1 .

ui-tokens.css
v 2
:root {
  color-scheme: dark;

  --ui-bg: #080d16;
  --ui-surface: #101827;
  --ui-surface-raised: #172235;

Correção imediata para a nota e a barra de abas

Envolva ScheduleGridcom uma região rolável. Assim, a tabela não amplia a página inteira nem corta silenciosamente as colunas.

TeacherSchedule-grid-wrapper.tsx
v 2
<div
  className="schedule-grid-scroll"
  role="region"
  aria-label="Grade horária semanal"
  tabIndex={0}
>

portal-polonês.css
v 2
.schedule-grid-scroll {
  min-width: 0;
  max-width: 100%;
  overflow: auto;
  overscroll-behavior: contain;
  border: 1px solid var(--ui-border-subtle);

Teclado para abas da Secretaria

O trecho torna a navegação entre as abas possíveis com as setas esquerda/direita e expõe o estado selecionado à tecnologia assistiva. O painel correspondente também deve receber role="tabpanel", ide aria-labelledby.

SecretariaPortal-tabs.tsx
v 2
<div className="sec-tab-strip" role="tablist" aria-label="Seções da Secretaria">
  {tabs.map((tab, index) => {
    const active = activeTab === tab.id;

    return (
      <button


Observação de implementação: não TeacherSchedule.tsx, o substituto local do solucionador é preenchido hard_violations: 0quando não há resposta válida. Não apresenta esse valor como resultado real da otimização: exiba um estado de erro ou identifique-o claramente como demonstração. O componente de cosméticos também mantém um substituto local de saldo/inventário; para produção, o serviço deve ser uma fonte de verdade.