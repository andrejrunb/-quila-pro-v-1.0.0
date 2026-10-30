import {
  YouTubePedagogicalRecommender,
  youtubeRecommender,
  CURATED_YOUTUBE_PEDAGOGICAL_BANK,
  PedagogicalVideoItem
} from '../services/YouTubePedagogicalRecommender';

describe('Homologação Técnica — YouTubePedagogicalRecommender (Validação Funcional e Pedagógica)', () => {
  describe('1. Integridade do Acervo Curado de Videoaulas', () => {
    test('O acervo pré-indexado deve conter videoaulas nas principais disciplinas curriculares', () => {
      expect(CURATED_YOUTUBE_PEDAGOGICAL_BANK.length).toBeGreaterThanOrEqual(10);

      const disciplines = new Set(CURATED_YOUTUBE_PEDAGOGICAL_BANK.map(v => v.discipline));
      expect(disciplines.has('Física')).toBe(true);
      expect(disciplines.has('Matemática')).toBe(true);
      expect(disciplines.has('Química')).toBe(true);
      expect(disciplines.has('Biologia')).toBe(true);
      expect(disciplines.has('História')).toBe(true);
      expect(disciplines.has('Língua Portuguesa')).toBe(true);
    });

    test('Todos os itens devem conter identificador YouTube válido, canais educacionais confiáveis e resumos pedagógicos', () => {
      CURATED_YOUTUBE_PEDAGOGICAL_BANK.forEach(video => {
        expect(video.id).toBeTruthy();
        expect(video.title).toBeTruthy();
        expect(video.channelName).toBeTruthy();
        expect(video.youtubeId).toMatch(/^[a-zA-Z0-9_-]{5,}$/);
        expect(video.durationMinutes).toBeGreaterThan(0);
        expect(video.pedagogicalSummary.length).toBeGreaterThan(20);
        expect(['Nivel_1_Fundamentos', 'Nivel_2_Aplicacao', 'Nivel_3_Aprofundamento']).toContain(video.difficultyStage);
        expect(video.tags.length).toBeGreaterThan(0);
      });
    });
  });

  describe('2. Motor de Ranqueamento Semântico e Filtros Pedagógicos', () => {
    test('Deve encontrar videoaulas de Eletrodinâmica / Leis de Ohm com score de relevância ponderado', () => {
      const outcome = youtubeRecommender.searchRecommendedVideos({
        queryText: 'leis de ohm corrente eletrica',
        discipline: 'Física',
      });

      expect(outcome.results.length).toBeGreaterThan(0);
      const topVideo = outcome.results[0];
      expect(topVideo.discipline).toBe('Física');
      expect(topVideo.title.toLowerCase()).toContain('eletrodinâmica');
      expect(outcome.searchTermsUsed).toContain('leis');
      expect(outcome.searchTermsUsed).toContain('ohm');
    });

    test('Deve suportar busca insensível a acentos ortográficos (normalização NFD)', () => {
      const outcomeWithAccents = youtubeRecommender.searchRecommendedVideos({
        queryText: 'Eletrodinâmica e Potência',
        discipline: 'Física',
      });

      const outcomeWithoutAccents = youtubeRecommender.searchRecommendedVideos({
        queryText: 'eletrodinamica e potencia',
        discipline: 'Física',
      });

      expect(outcomeWithAccents.results.length).toBe(outcomeWithoutAccents.results.length);
      expect(outcomeWithAccents.results[0].id).toBe(outcomeWithoutAccents.results[0].id);
    });

    test('Deve filtrar rigorosamente por Nível Didático Kumon/Áquila (Fundamentos vs Aprofundamento)', () => {
      const foundationOutcome = youtubeRecommender.searchRecommendedVideos({
        queryText: 'circuitos',
        discipline: 'Física',
        stage: 'Nivel_1_Fundamentos'
      });

      const advancedOutcome = youtubeRecommender.searchRecommendedVideos({
        queryText: 'circuitos',
        discipline: 'Física',
        stage: 'Nivel_3_Aprofundamento'
      });

      expect(foundationOutcome.results.length).toBeGreaterThan(0);
      expect(advancedOutcome.results.length).toBeGreaterThan(0);
      expect(foundationOutcome.results[0].difficultyStage).toBe('Nivel_1_Fundamentos');
      expect(advancedOutcome.results[0].difficultyStage).toBe('Nivel_3_Aprofundamento');
    });
  });

  describe('3. Conformidade com Termos de Uso do YouTube (YouTube API ToS)', () => {
    test('Gera URL oficial segura de consulta ao vivo sem raspagem de streams ou bypass de player', () => {
      const outcome = youtubeRecommender.searchRecommendedVideos({
        queryText: 'Nikola Tesla corrente alternada',
        discipline: 'Física'
      });

      expect(outcome.suggestedYoutubeLiveSearchUrl).toContain('https://www.youtube.com/results?search_query=');
      expect(outcome.suggestedYoutubeLiveSearchUrl).toContain('Nikola%20Tesla');
      expect(outcome.suggestedYoutubeLiveSearchUrl).toContain('videoaula%20enem');
    });

    test('Assegura que nenhum vídeo tente quebrar a sandbox ou realizar download não autorizado', () => {
      // O recommender preserva referências a canais originais para reprodução oficial
      CURATED_YOUTUBE_PEDAGOGICAL_BANK.forEach(video => {
        expect(video.youtubeId).not.toContain('http');
        expect(video.youtubeId).not.toContain('.mp4');
        expect(video.thumbnailUrl).toContain('img.youtube.com/vi/');
      });
    });
  });
});
