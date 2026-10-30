import { SovereignEssayService, sovereignEssayService } from '../SovereignEssayService';
import { db, Database } from '../../../database/Database';

describe('SovereignEssayService Unit Tests', () => {
  let service: SovereignEssayService;

  beforeAll(async () => {
    await db.initialize();
  });

  beforeEach(() => {
    service = SovereignEssayService.getInstance();
    jest.clearAllMocks();
  });

  test('Deve ser um Singleton retornando a mesma instância', () => {
    const inst1 = SovereignEssayService.getInstance();
    const inst2 = SovereignEssayService.getInstance();
    expect(inst1).toBe(inst2);
    expect(inst1).toBe(sovereignEssayService);
  });

  test('Deve avaliar com precisão uma redação com estrutura Nota 1000', () => {
    const nota1000Text = `A Constituição Cidadã de 1988 assegura a dignidade da pessoa humana e o acesso universal aos direitos sociais como pilares inegociáveis do Estado Democrático. No entanto, a persistente invisibilidade do trabalho de cuidado realizado pela mulher no Brasil evidencia uma lacuna abissal entre a prerrogativa legal e a vivência cotidiana. Com efeito, essa conjuntura perversa perpetua tanto a sobrecarga física e emocional feminina quanto a desvalorização estrutural dessa labuta indispensável à manutenção da sociedade.

Em primeiro plano, cabe destacar a herança patriarcal e a divisão sexual do trabalho como catalisadores desse cenário opressor. Segundo a socióloga Silvia Federici, o trabalho reprodutivo não remunerado foi historicamente relegado às mulheres como um suposto atributo natural, desprovido de valor econômico formal. Sob essa ótica, milhares de brasileiras acumulam jornadas duplas ou triplas, privando-se de oportunidades educacionais e profissionais para cuidar de idosos, crianças e lares, o que reitera a tese de "cidadãos de papel" formulada pelo jurista Gilberto Dimenstein.

Ademais, constata-se a insuficiência de equipamentos públicos de suporte e a omissão estatal no custeio dessa rede assistencial. De acordo com o filósofo Thomas Hobbes, o Estado surge para garantir a integridade e o bem-estar da coletividade. Todavia, a escassez de creches em tempo integral, de centros-dia para convivência de idosos e de subsídios previdenciários perpetua a feminização da pobreza, deixando famílias desamparadas e a mercê da exaustão individual.

Portanto, medidas imperativas são necessárias para erradicar essa invisibilidade histórica. Cabe ao Ministério do Desenvolvimento e Assistência Social, em convergência com o Ministério das Mulheres, instituir a Política Nacional de Cuidados Compartilhados, mediante a expansão massiva de creches públicas e a concessão de auxílio-cuidador com contagem de tempo para aposentadoria. Tal ação deve ser detalhada por meio de consultas populares e mapeamento censitário regionalizado, a fim de assegurar o devido reconhecimento econômico às mulheres e consolidar, em sua plenitude, a justiça social preconizada pela Carta Magna.`;

    const report = service.evaluateEssayText(nota1000Text, 'Invisibilidade do Trabalho de Cuidado');

    expect(report.paragraphsCount).toBe(4);
    expect(report.wordCount).toBeGreaterThanOrEqual(280);
    expect(report.c1Score).toBe(200);
    expect(report.c2Score).toBe(200);
    expect(report.c3Score).toBe(200);
    expect(report.c4Score).toBe(200);
    expect(report.c5Score).toBe(200);
    expect(report.totalScore).toBe(1000);
    expect(report.c5Elements.agente).toBe(true);
    expect(report.c5Elements.acao).toBe(true);
    expect(report.c5Elements.meio).toBe(true);
    expect(report.c5Elements.efeito).toBe(true);
    expect(report.c5Elements.detalhamento).toBe(true);
    expect(report.repertoireHits.length).toBeGreaterThanOrEqual(2);
    expect(report.feedbackText).toContain('Sublime');
  });

  test('Deve penalizar Proposta de Intervenção (C5) quando faltarem elementos obrigatórios', () => {
    const textIncompleteC5 = `Na sociedade contemporânea, o acesso à leitura transforma a realidade das comunidades vulneráveis. A Carta Magna de 1988 assegura o direito à educação e à cultura como fundamentos universais para o exercício da plena cidadania.

Em primeira análise, a falta de bibliotecas públicas nas periferias das grandes cidades impede que milhares de jovens desenvolvam hábitos intelectuais críticos. Conforme pontua o sociólogo Zygmunt Bauman, a exclusão cultural aprofunda as fragilidades da vida social.

Ademais, os altos custos dos livros físicos representam uma barreira intransponível para as famílias de baixa renda. Sem políticas de subsídio editorial, a democratização do conhecimento torna-se uma utopia inalcançável.

Portanto, a sociedade precisa se conscientizar da importância de ler mais livros todos os dias.`;

    const report = service.evaluateEssayText(textIncompleteC5, 'Democratização do Acesso à Leitura');

    // Falta agente governamental específico, meio formal e detalhamento
    expect(report.c5Elements.meio).toBe(false);
    expect(report.c5Elements.detalhamento).toBe(false);
    expect(report.c5Score).toBeLessThan(200);
  });

  test('Deve executar submitAndAudit com persistência, concessão de XP e Sovereign Coins', async () => {
    const dbInstance = Database.getInstance();
    const saveEssaySpy = jest.spyOn(dbInstance, 'saveStudentEssay').mockResolvedValue({ success: true, id: 'essay-test-01' });
    const addXpSpy = jest.spyOn(dbInstance, 'updateStudentXP').mockResolvedValue(undefined as any);
    const addCoinsSpy = jest.spyOn(dbInstance, 'addStudentCoins').mockResolvedValue(undefined as any);
    const awardBadgeSpy = jest.spyOn(dbInstance, 'awardStudentBadge').mockResolvedValue({ success: true, id: 'b1' });

    const sampleEssay = `O Estatuto da Criança e do Adolescente preconiza o direito ao desenvolvimento integral, ao brincar e à convivência comunitária como prioridades absolutas garantidas pelo Estado. No entanto, o uso desenfreado de smartphones e redes sociais por crianças e adolescentes impõe desafios inéditos à saúde física e emocional dos estudantes. Torna-se indispensável, assim, refletir sobre a perda do convívio afetivo real e a necessidade de uma educação mediática consciente para restabelecer a harmonia nos ambientes educativos.

Em primeiro plano, o tempo excessivo diante de dispositivos eletrônicos compromete a capacidade de concentração e estimula o isolamento social. Segundo o filósofo Thomas Hobbes em sua reflexão contratualista, a coesão de uma comunidade exige o respeito a pactos de convivência mútua. Nas escolas brasileiras, contudo, a substituição do diálogo presencial e das brincadeiras coletivas por telas individuais enfraquece o sentimento de pertença e a empatia entre os colegas, gerando a anomia descrita pelo sociólogo Émile Durkheim.

Ademais, a ausência de mediação pedagógica no acesso a algoritmos predatórios expõe os jovens a conteúdos inadequados e ao cyberbullying. Conforme adverte o jurista Gilberto Dimenstein em "O Cidadão de Papel", a cidadania permanece incompleta enquanto os indivíduos não tiverem assegurada a proteção de sua dignidade no cotidiano. Dessa forma, sem orientação crítica, o ambiente digital deixa de ser um instrumento educativo para se transformar em espaço de ansiedade constante e segregação comportamental.

Portanto, medidas imperativas são urgentes para restabelecer o equilíbrio formativo. Cabe ao Ministério da Educação, em convergência com as secretarias estaduais e os conselhos tutelares, instituir a Política Nacional de Convivência Digital Saudável nas Escolas Públicas, mediante oficinas formativas e restrição pedagógica de aparelhos nos intervalos, a exemplo de projetos de mediação de conflitos e esportes comunitários, a fim de assegurar o bem-estar psicológico e consolidar, em sua plenitude, a convivência fraterna idealizada pela Carta Magna.`;

    const mirror = await service.submitAndAudit({
      studentId: 'stu-gabriel-01',
      studentName: 'Gabriel Rocha',
      themeId: 'enem-telas-escola',
      themeTitle: 'Impacto das Telas na Convivência Escolar',
      text: sampleEssay,
      submissionType: 'typed',
    });

    expect(mirror.studentId).toBe('stu-gabriel-01');
    expect(mirror.totalScore).toBeGreaterThanOrEqual(900);
    expect(mirror.coinsAwarded).toBe(80); // Recompensa máxima para nota alta
    expect(saveEssaySpy).toHaveBeenCalled();
    expect(addXpSpy).toHaveBeenCalledWith('stu-gabriel-01', mirror.xpAwarded);
    expect(addCoinsSpy).toHaveBeenCalledWith('stu-gabriel-01', mirror.coinsAwarded);
    expect(awardBadgeSpy).toHaveBeenCalled();
  });

  test('Deve listar o histórico de redações do aluno', async () => {
    const dbInstance = Database.getInstance();
    jest.spyOn(dbInstance, 'getStudentEssays').mockResolvedValue([
      {
        id: 'essay-1',
        studentId: 'stu-gabriel-01',
        themeId: 'enem-2023',
        themeTitle: 'Trabalho de Cuidado',
        totalScore: 960,
        c1Score: 200,
        c2Score: 200,
        c3Score: 200,
        c4Score: 160,
        c5Score: 200,
        createdAt: '2026-10-25T14:00:00Z',
      } as any,
    ]);

    const essays = await service.getStudentEssays('stu-gabriel-01');
    expect(essays.length).toBe(1);
    expect(essays[0].totalScore).toBe(960);
  });
});
