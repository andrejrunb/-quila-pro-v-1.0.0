/**
 * GamificationCatalogService.ts
 * ============================================================================
 * Catálogo Soberano de Gamificação & Cosméticos Pedagógicos
 * ============================================================================
 * Princípios de Design Educacional:
 * 1. INSPIRAÇÃO EM LOOPS DE JOGOS: Baseado no modelo de engajamento de Clash Royale,
 *    substituindo o aspecto comercial por incentivos pedagógicos de maestria.
 * 2. ZERO PAY-TO-WIN & ZERO MICROTANSAÇÕES: Todos os itens são desbloqueados por
 *    esforço de estudo, constância e resolução de desafios diagnósticos.
 * 3. IDENTIDADE E NÃO-CONSTRANGIMENTO (ECA Digital): Nenhum cosmético humilha o aluno
 *    com dificuldades; os prêmios celebram a evolução relativa individual (TRI).
 * 4. 100% ORIGINAL & AUTORIZADO: Artefatos gerados pelo Media Gateway sob licença
 *    educacional aberta, sem violar a propriedade intelectual de terceiros.
 * ============================================================================
 */

import { PedagogicalCosmeticItem, IntellectualWarriorCharacter, KnowledgeArea } from '../types/mediaContracts';

export class GamificationCatalogService {
  private static characters: IntellectualWarriorCharacter[] = [
    // ────────────── 1. FÍSICA (Mecânica, Eletromagnetismo & Cosmos) — PILOTO ──────────────
    {
      id: 'char_isaac_newton',
      name: 'Isaac Newton',
      historical_title: 'Mestre da Gravitação & Óptica Clássica',
      knowledge_area: 'FISICA',
      archetype: 'MAGO_DA_ENERGIA',
      relic_item: 'Prisma de Dispersão e Maçã Gravitacional',
      bncc_skill_code: 'EM13CNT301',
      pedagogical_unlock_condition: 'Progresso comprovado em Dinâmica Newtoniana e Leis de Kepler (mínimo 5 acertos diagnósticos).',
      rarity: 'LENDARIO',
      historical_quote: 'Se vi mais longe, foi por estar sobre os ombros de gigantes.',
      pedagogical_role: 'Explica forças fundamentais, gravitação e decomposição da luz.',
      image_ref: 'science_royale_lote_2.jpg',
      publication_status: 'DRAFT',
      visual: {
        status: 'GENERATED_DRAFT',
        license: 'AQUILA_ORIGINAL',
        asset_ref: 'science_royale_lote_2.jpg'
      },
      quotes: [
        {
          text: 'Se vi mais longe, foi por estar sobre os ombros de gigantes.',
          source: 'Carta a Robert Hooke (5 de fevereiro de 1675/6 Old Style / 1676 New Style, Historical Society of Pennsylvania; The Newton Project, Oxford, ref. OTHE00101)',
          original_language: 'en',
          original_text: 'If I have seen further it is by standing on the sholders of Giants.',
          translator: 'Domínio Público / Tradução Consagrada',
          verification_status: 'VERIFIED_PRIMARY_SOURCE',
          historiographical_note: 'Transcrição confrontada com o texto original da correspondência acadêmica catalogada no Newton Project (Oxford).'
        }
      ],
      unlock_criteria: {
        type: 'PROGRESS',
        min_correct: 5,
        activity_ids: ['diag_newton_leis_1_3', 'diag_kepler_orbitas'],
        bncc_progress_description: 'Reconhece o progresso na compreensão das leis de movimento e conservação (EM13CNT301), sem atestar domínio terminal isolado.'
      },
      cosmetic_tiers: ['APRENDIZ', 'ESPECIALISTA', 'MESTRE']
    },
    {
      id: 'char_albert_einstein',
      name: 'Albert Einstein',
      historical_title: 'Arquiteto do Espaço-Tempo & Relatividade',
      knowledge_area: 'FISICA',
      archetype: 'MAGO_DA_ENERGIA',
      relic_item: 'Prancheta com Equação E=mc² & Fóton de Luz',
      bncc_skill_code: 'EM13CNT308',
      pedagogical_unlock_condition: 'Progresso na trilha de Física Moderna (Efeito Fotoelétrico e equivalência massa-energia).',
      rarity: 'LENDARIO',
      historical_quote: 'A imaginação é mais importante que o conhecimento.',
      pedagogical_role: 'Ensina física moderna, energia de massa e gravitação como curvatura.',
      image_ref: 'science_royale_lote_2.jpg',
      publication_status: 'DRAFT',
      visual: {
        status: 'GENERATED_DRAFT',
        license: 'AQUILA_ORIGINAL',
        asset_ref: 'science_royale_lote_2.jpg'
      },
      quotes: [
        {
          text: 'A imaginação é mais importante que o conhecimento. Pois o conhecimento é limitado, enquanto a imaginação abraça o mundo inteiro.',
          source: 'Entrevista concedida a George Sylvester Viereck, The Saturday Evening Post, vol. 202, nº 17 (26 de outubro de 1929), p. 117',
          original_language: 'en',
          original_text: 'Imagination is more important than knowledge. For knowledge is limited, whereas imagination embraces the entire world.',
          translator: 'Domínio Público / Tradução Consagrada',
          verification_status: 'VERIFIED_PRIMARY_SOURCE',
          historiographical_note: 'Texto em inglês localizado na edição impressa original. A verificação da fala não substitui a necessidade de autorização da tradução/imagem antes de publicação.'
        }
      ],
      unlock_criteria: {
        type: 'PROGRESS',
        min_correct: 5,
        activity_ids: ['diag_fotoeletrico_quanta', 'diag_relatividade_restrita'],
        bncc_progress_description: 'Demonstra evolução conceitual em quantização de energia e relação massa-energia (EM13CNT308).'
      },
      cosmetic_tiers: ['APRENDIZ', 'ESPECIALISTA', 'MESTRE']
    },
    {
      id: 'char_galileo_galilei',
      name: 'Galileu Galilei',
      historical_title: 'Pioneiro do Método Científico & Luneta Cósmica',
      knowledge_area: 'FISICA',
      archetype: 'MAGO_DA_ENERGIA',
      relic_item: 'Super Luneta Astronômica e Esferas de Queda Livre',
      bncc_skill_code: 'EM13CNT204',
      pedagogical_unlock_condition: 'Progresso na análise experimental de Cinemática e Queda Livre de corpos.',
      rarity: 'EPICO',
      historical_quote: 'E contudo, ela se move (Atribuição histórica tradicional).',
      pedagogical_role: 'Fundamenta o método empírico e as luas de Júpiter.',
      image_ref: 'science_royale_lote_2.jpg',
      publication_status: 'DRAFT',
      visual: {
        status: 'GENERATED_DRAFT',
        license: 'AQUILA_ORIGINAL',
        asset_ref: 'science_royale_lote_2.jpg'
      },
      quotes: [
        {
          text: 'E contudo, ela se move.',
          source: 'Giuseppe Baretti, The Italian Library (Londres, 1757); testemunho historiográfico tardio sobre a abjuração de 1633',
          original_language: 'it',
          original_text: 'E pur si muove.',
          translator: 'Tradição Historiográfica Tradicional',
          verification_status: 'HISTORICAL_ATTRIBUTION_UNCERTAIN',
          historiographical_note: 'Baretti escreveu mais de um século depois. Trata-se de testemunho de atribuição e não de fonte primária contemporânea comprovada.'
        }
      ],
      unlock_criteria: {
        type: 'PROGRESS',
        min_correct: 5,
        activity_ids: ['diag_queda_livre_galileu', 'diag_cinematica_mruv'],
        bncc_progress_description: 'Valida a compreensão da independência da aceleração gravitacional em relação à massa (EM13CNT204).'
      },
      cosmetic_tiers: ['APRENDIZ', 'ESPECIALISTA', 'MESTRE']
    },
    {
      id: 'char_nikola_tesla',
      name: 'Nikola Tesla',
      historical_title: 'Feiticeiro da Corrente Alternada & Magnetismo',
      knowledge_area: 'FISICA',
      archetype: 'MAGO_DA_ENERGIA',
      relic_item: 'Bobina de Tesla Ressonante e Luvas de Indução',
      bncc_skill_code: 'EM13CNT106',
      pedagogical_unlock_condition: 'Progresso em circuitos elétricos de corrente alternada e indução eletromagnética.',
      rarity: 'EPICO',
      historical_quote: 'O presente é deles; o futuro, pelo qual realmente trabalhei, é meu.',
      pedagogical_role: 'Desvenda eletromagnetismo, transformadores e transmissão sem fio.',
      image_ref: 'science_royale_lote_1.jpg',
      publication_status: 'DRAFT',
      visual: {
        status: 'GENERATED_DRAFT',
        license: 'AQUILA_ORIGINAL',
        asset_ref: 'science_royale_lote_1.jpg'
      },
      quotes: [
        {
          text: 'O presente é deles; o futuro, pelo qual realmente trabalhei, é meu.',
          source: 'Electrical Experimenter (1919) — Localização exata de página pendente',
          original_language: 'en',
          original_text: 'The present is theirs; the future, for which I really worked, is mine.',
          translator: 'Tradução Editorial Áquila',
          verification_status: 'PENDING_DOCUMENT_LOCATION',
          historiographical_note: 'Citação consagrada na literatura; localização exata do fascículo e página original sob verificação antes de publicação.'
        }
      ],
      unlock_criteria: {
        type: 'PROGRESS',
        min_correct: 5,
        activity_ids: ['diag_inducao_faraday', 'diag_corrente_alternada'],
        bncc_progress_description: 'Avalia a apropriação dos princípios de indução magnética e geração de energia (EM13CNT106).'
      },
      cosmetic_tiers: ['APRENDIZ', 'ESPECIALISTA', 'MESTRE']
    },
    {
      id: 'char_cesar_lattes',
      name: 'César Lattes',
      historical_title: 'Desbravador do Méson Pi & Física de Altas Energias',
      knowledge_area: 'FISICA',
      archetype: 'MAGO_DA_ENERGIA',
      relic_item: 'Emulsão Nuclear em Chacaltaya e Câmara de Raios Cósmicos',
      bncc_skill_code: 'EM13CNT303',
      pedagogical_unlock_condition: 'Concluir atividades diagnósticas de física subatômica e desenvolvimento científico nacional.',
      rarity: 'LENDARIO',
      historical_quote: 'A física de partículas brasileira produz fronteira do conhecimento humano.',
      pedagogical_role: 'Inspira a física brasileira e a detecção de partículas fundamentais.',
      image_ref: 'science_royale_lote_2.jpg',
      publication_status: 'DRAFT',
      visual: {
        status: 'GENERATED_DRAFT',
        license: 'AQUILA_ORIGINAL',
        asset_ref: 'science_royale_lote_2.jpg'
      },
      quotes: [
        {
          text: 'A ciência não se faz isolada; ela é fruto de perseverança, método e paixão pela verdade da matéria.',
          source: 'Tradição memorial oral do CBPF — Citação literal sem documento contemporâneo localizado',
          original_language: 'pt-BR',
          original_text: 'A ciência não se faz isolada; ela é fruto de perseverança, método e paixão pela verdade da matéria.',
          translator: 'Original em Português',
          verification_status: 'REMOVED_PENDING_PRIMARY_SOURCE',
          historiographical_note: 'Aspas retiradas da visualização do aluno por falta de documento assinado ou gravação identificada. Mantido o registro factual da descoberta do méson pi em 1947.'
        }
      ],
      unlock_criteria: {
        type: 'PROGRESS',
        min_correct: 4,
        activity_ids: ['diag_lattes_particulas', 'diag_raios_cosmicos'],
        bncc_progress_description: 'Reconhece o entendimento de interações nucleares fortes e radiação cósmica (EM13CNT303).'
      },
      cosmetic_tiers: ['APRENDIZ', 'ESPECIALISTA', 'MESTRE']
    },

    // ────────────── 2. QUÍMICA (Estrutura Atômica, Tabela & Reações) ──────────────
    {
      id: 'char_dmitri_mendeleev',
      name: 'Dmitri Mendeleev',
      historical_title: 'Arquiteto da Lei Periódica dos Elementos',
      knowledge_area: 'QUIMICA',
      archetype: 'ALQUIMISTA_DA_MATERIA',
      relic_item: 'Papiro da Tabela Periódica Preditiva e Frascos de Reação',
      bncc_skill_code: 'EM13CNT101',
      pedagogical_unlock_condition: 'Classificar corretamente 10 elementos por família, período e raio atômico.',
      rarity: 'LENDARIO',
      historical_quote: 'Previ propriedades de elementos ainda não descobertos porque a natureza segue leis periódicas.',
      pedagogical_role: 'Ensina periodicidade química, afinidade eletrônica e grupos funcionais.',
      image_ref: 'science_royale_lote_3.jpg'
    },
    {
      id: 'char_marie_curie',
      name: 'Marie Curie',
      historical_title: 'Pioneira da Radioatividade & Dupla Laureada Nobel',
      knowledge_area: 'FISICA', // Dupla atuação Física/Química, integrando o Piloto de Física
      archetype: 'ALQUIMISTA_DA_MATERIA',
      relic_item: 'Frasco Luminescente de Rádio e Eletrômetro de Quartzo Piezoelétrico',
      bncc_skill_code: 'EM13CNT104',
      pedagogical_unlock_condition: 'Progresso na análise de emissões nucleares (alfa, beta, gama) e decaimento radioativo.',
      rarity: 'LENDARIO',
      historical_quote: 'Na vida, nada deve ser temido, somente compreendido.',
      pedagogical_role: 'Desmistifica a radioatividade, elementos transurânicos e radioterapia médica.',
      image_ref: 'science_royale_lote_2.jpg',
      publication_status: 'DRAFT',
      visual: {
        status: 'GENERATED_DRAFT',
        license: 'AQUILA_ORIGINAL',
        asset_ref: 'science_royale_lote_2.jpg'
      },
      quotes: [
        {
          text: 'Na vida, nada deve ser temido, somente compreendido. Agora é hora de compreender mais, para temer menos.',
          source: 'Ève Curie, Madame Curie: A Biography (1937) — Localização exata de manuscrito primário pendente',
          original_language: 'fr',
          original_text: 'Rien dans la vie n\'est à craindre, tout est à comprendre. C\'est le moment de comprendre davantage, afin d\'avoir moins peur.',
          translator: 'Domínio Público / Tradução Consagrada',
          verification_status: 'PENDING_DOCUMENT_LOCATION',
          historiographical_note: 'A biografia de Ève Curie é obra biográfica posterior. Identificação do trecho exato e separação de direitos da frase, da edição e da tradução pendentes de revisão jurídica antes de publicação.'
        }
      ],
      unlock_criteria: {
        type: 'PROGRESS',
        min_correct: 5,
        activity_ids: ['diag_radioatividade_decaimento', 'diag_meia_vida_curie'],
        bncc_progress_description: 'Reconhece o progresso em decaimento radioativo e aplicações nucleares benéficas (EM13CNT104).'
      },
      cosmetic_tiers: ['APRENDIZ', 'ESPECIALISTA', 'MESTRE']
    },
    {
      id: 'char_antoine_lavoisier',
      name: 'Antoine Lavoisier',
      historical_title: 'Pai da Química Moderna & Conservação das Massas',
      knowledge_area: 'QUIMICA',
      archetype: 'ALQUIMISTA_DA_MATERIA',
      relic_item: 'Balança Analítica de Alta Precisão e Retorta Hermética',
      bncc_skill_code: 'EM13CNT205',
      pedagogical_unlock_condition: 'Equacionar e balancear 5 reações estequiométricas com cálculo de rendimento.',
      rarity: 'EPICO',
      historical_quote: 'Na natureza nada se cria, nada se perde, tudo se transforma.',
      pedagogical_role: 'Ensina estequiometria, conservação de matéria e papel do oxigênio na combustão.'
    },

    // ────────────── 3. BIOLOGIA (Evolução, Genética & Microbiologia) ──────────────
    {
      id: 'char_charles_darwin',
      name: 'Charles Darwin',
      historical_title: 'Naturalista da Seleção Natural & Árvore da Vida',
      knowledge_area: 'BIOLOGIA',
      archetype: 'SENTINELA_DA_VIDA',
      relic_item: 'Caderno do HMS Beagle e Tentilhão das Galápagos',
      bncc_skill_code: 'EM13CNT208',
      pedagogical_unlock_condition: 'Resolver a trilha de Adaptação, Seleção Natural e Especiação.',
      rarity: 'LENDARIO',
      historical_quote: 'A partir de um início tão simples, formas infinitas, mais belas e mais maravilhosas, foram e continuam sendo evoluídas.',
      pedagogical_role: 'Ilumina a evolução biológica, ancestralidade comum e biodiversidade.',
      image_ref: 'science_royale_lote_3.jpg',
      publication_status: 'DRAFT',
      quotes: [
        {
          text: 'Há grandeza nesta visão da vida [...] a partir de um início tão simples, formas infinitas, mais belas e mais maravilhosas, foram e continuam sendo evoluídas.',
          source: 'A Origem das Espécies (1859), Capítulo XIV — Conclusão',
          original_language: 'en',
          original_text: 'There is grandeur in this view of life [...] from so simple a beginning endless forms most beautiful and most wonderful have been, and are being, evolved.',
          translator: 'Domínio Público / Tradução Consagrada',
          verification_status: 'VERIFIED'
        }
      ]
    },
    {
      id: 'char_rosalind_franklin',
      name: 'Rosalind Franklin',
      historical_title: 'Decifradora da Dupla Hélice & Cristalografia de Raios X',
      knowledge_area: 'BIOLOGIA',
      archetype: 'SENTINELA_DA_VIDA',
      relic_item: 'Fotografia 51 Projetada como Escudo de Hélice de DNA',
      bncc_skill_code: 'EM13CNT202',
      pedagogical_unlock_condition: 'Identificar a estrutura de pares de bases nitrogenadas (A-T, C-G) e replicação do DNA.',
      rarity: 'LENDARIO',
      historical_quote: 'A ciência e a vida cotidiana não podem e não devem ser separadas.',
      pedagogical_role: 'Ensina biologia molecular, código genético e difração de raios X.',
      image_ref: 'science_royale_lote_1.jpg'
    },
    {
      id: 'char_alexander_fleming',
      name: 'Alexander Fleming',
      historical_title: 'Descobridor da Penicilina & Escudo Antibiótico',
      knowledge_area: 'BIOLOGIA',
      archetype: 'SENTINELA_DA_VIDA',
      relic_item: 'Placa de Petri Gigante com Halo de Inibição de Penicillium',
      bncc_skill_code: 'EM13CNT304',
      pedagogical_unlock_condition: 'Compreender o mecanismo de antibióticos e a seleção de bactérias resistentes.',
      rarity: 'EPICO',
      historical_quote: 'A natureza criou a penicilina, eu apenas a encontrei.',
      pedagogical_role: 'Ensina imunologia, microbiologia e uso consciente de medicamentos.',
      image_ref: 'science_royale_lote_1.jpg'
    },
    {
      id: 'char_carlos_chagas',
      name: 'Carlos Chagas',
      historical_title: 'Mestre da Medicina Tropical & Epidemiologia Brasileira',
      knowledge_area: 'BIOLOGIA',
      archetype: 'SENTINELA_DA_VIDA',
      relic_item: 'Microscópio de Campo e Trypanosoma cruzi em Amostra',
      bncc_skill_code: 'EM13CNT306',
      pedagogical_unlock_condition: 'Mapear o ciclo biológico de zoonoses e endemias tropicais brasileiras.',
      rarity: 'LENDARIO',
      historical_quote: 'A ciência só é completa quando chega à cabana dos mais humildes.',
      pedagogical_role: 'Ensina saúde pública, ciclos de vetores e protozoologia.'
    },

    // ────────────── 4. MATEMÁTICA & COMPUTAÇÃO (Formas, Números & Código) ──────────────
    {
      id: 'char_pythagoras',
      name: 'Pitágoras de Samos',
      historical_title: 'Guardião dos Triângulos Retângulos & Harmonia Numérica',
      knowledge_area: 'MATEMATICA',
      archetype: 'ARQUITETO_DOS_NUMEROS',
      relic_item: 'Esquadro Sagrado com Teorema a² + b² = c² e Monocórdio Musical',
      bncc_skill_code: 'EM13MAT301',
      pedagogical_unlock_condition: 'Resolver 5 problemas de Geometria Plana aplicando relações métricas no triângulo.',
      rarity: 'EPICO',
      historical_quote: 'Tudo no universo é número e proporção.',
      pedagogical_role: 'Fundamenta trigonometria básica, teoremas geométricos e razão áurea.',
      image_ref: 'science_royale_lote_3.jpg'
    },
    {
      id: 'char_ada_lovelace',
      name: 'Ada Lovelace',
      historical_title: 'Primeira Programadora da História & Poetisa dos Algoritmos',
      knowledge_area: 'MATEMATICA',
      archetype: 'ARQUITETO_DOS_NUMEROS',
      relic_item: 'Engrenagem Dourada da Máquina Analítica e Cartões Perfurados',
      bncc_skill_code: 'EM13MAT103',
      pedagogical_unlock_condition: 'Construir ou interpretar um fluxograma algorítmico de decisão lógica.',
      rarity: 'LENDARIO',
      historical_quote: 'A máquina analítica tece padrões algébricos assim como o tear de Jacquard tece flores e folhas.',
      pedagogical_role: 'Ensina lógica computacional, variáveis, loops e pensamento analítico.',
      image_ref: 'science_royale_lote_3.jpg'
    },
    {
      id: 'char_alan_turing',
      name: 'Alan Turing',
      historical_title: 'Decifrador de Enigmas & Pai da Computação Moderna',
      knowledge_area: 'MATEMATICA',
      archetype: 'ARQUITETO_DOS_NUMEROS',
      relic_item: 'Rotores Criptográficos e Fita da Máquina Universal de Turing',
      bncc_skill_code: 'EM13MAT401',
      pedagogical_unlock_condition: 'Compreender funções recursivas, sistemas binários e matrizes de criptografia.',
      rarity: 'LENDARIO',
      historical_quote: 'Às vezes, são as pessoas de quem ninguém imagina nada que fazem as coisas que ninguém pode imaginar.',
      pedagogical_role: 'Ensina criptografia, teoria da computação e inteligência artificial ética.'
    },

    // ────────────── 5. HUMANIDADES (Filosofia, Sociologia, História & Geografia) ──────────────
    {
      id: 'char_socrates',
      name: 'Sócrates',
      historical_title: 'O Mestre da Maiêutica & Parto das Ideias',
      knowledge_area: 'FILOSOFIA_SOCIOLOGIA',
      archetype: 'GUARDAO_DO_TEMPO',
      relic_item: 'Lanterna da Verdade e Manto com Pergaminho Filosófico',
      bncc_skill_code: 'EM13CHS101',
      pedagogical_unlock_condition: 'Elaborar um argumento dialético identificando tese, antítese e refutação.',
      rarity: 'EPICO',
      historical_quote: 'Conhece-te a ti mesmo e só sei que nada sei.',
      pedagogical_role: 'Provoca o questionamento crítico, ética e distinção entre opinião (doxa) e saber (episteme).',
      image_ref: 'science_royale_lote_1.jpg'
    },
    {
      id: 'char_milton_santos',
      name: 'Milton Santos',
      historical_title: 'Cidadão do Mundo & Mestre da Geografia Crítica',
      knowledge_area: 'GEOGRAFIA',
      archetype: 'GUARDAO_DO_TEMPO',
      relic_item: 'Globo do Meio Técnico-Científico-Informacional e Livro Por Uma Outra Globalização',
      bncc_skill_code: 'EM13CHS202',
      pedagogical_unlock_condition: 'Analisar a distribuição territorial de recursos e urbanização desigual no Brasil.',
      rarity: 'LENDARIO',
      historical_quote: 'O espaço geográfico é formado por um conjunto indissociável de sistemas de objetos e sistemas de ações.',
      pedagogical_role: 'Ensina análise socioespacial, globalização e cidadania territorial.'
    },

    // ────────────── 6. LINGUAGENS, LITERATURA & ARTES (Expressão & Cultura) ──────────────
    {
      id: 'char_tarsila_amaral',
      name: 'Tarsila do Amaral',
      historical_title: 'Pioneira do Modernismo Brasileiro & Antropofagia',
      knowledge_area: 'LITERATURA_ARTES',
      archetype: 'MESTRE_DAS_LINGUAGENS',
      relic_item: 'Paleta com Cores Caipiras e Pincel Gigante Antropofágico (Abaporu)',
      bncc_skill_code: 'EM13LGG104',
      pedagogical_unlock_condition: 'Interpretar a Semana de Arte Moderna de 1922 e a ressignificação da cultura nacional.',
      rarity: 'LENDARIO',
      historical_quote: 'Quero ser a pintora do meu país, com as cores que aprendi na minha infância.',
      pedagogical_role: 'Ensina vanguardas modernas, identidade cultural brasileira e artes plásticas.',
      image_ref: 'science_royale_lote_1.jpg'
    },
    {
      id: 'char_machado_assis',
      name: 'Machado de Assis',
      historical_title: 'O Bruxo do Cosme Velho & Mestre do Realismo',
      knowledge_area: 'LITERATURA_ARTES',
      archetype: 'MESTRE_DAS_LINGUAGENS',
      relic_item: 'Pena de Prata, Cartola Vitoriana e Manuscrito das Memórias Póstumas',
      bncc_skill_code: 'EM13LGG301',
      pedagogical_unlock_condition: 'Identificar foco narrativo de primeira pessoa, ironia machadiana e crítica social.',
      rarity: 'LENDARIO',
      historical_quote: 'Ao vencedor, as batatas!',
      pedagogical_role: 'Aprofunda a interpretação de texto, ironia, ambiguidade e psicologia humana.'
    },
    {
      id: 'char_leonardo_davinci',
      name: 'Leonardo da Vinci',
      historical_title: 'O Polímata do Renascimento & Mestre das Invenções',
      knowledge_area: 'LITERATURA_ARTES',
      archetype: 'MESTRE_DAS_LINGUAGENS',
      relic_item: 'Ornitóptero Voador, Pincel do Afresco e Caderno de Anatomia Espelhada',
      bncc_skill_code: 'EM13LGG602',
      pedagogical_unlock_condition: 'Integrar conhecimentos de arte e proporção matemática (Homem Vitruviano).',
      rarity: 'LENDARIO',
      historical_quote: 'Aprender é a única coisa de que a mente nunca se cansa, nunca tem medo e nunca se arrepende.',
      pedagogical_role: 'Representa a transdisciplinaridade perfeita entre ciência, arte e engenharia.',
      image_ref: 'science_royale_lote_3.jpg'
    }
  ];

  private static catalog: PedagogicalCosmeticItem[] = [
    // 1. Avatares Soberanos (Expressão de Identidade Estudantil)
    {
      id: 'avatar_alquimista_conhecimento',
      name: 'O Alquimista do Saber',
      category: 'AVATAR_SOBERANO',
      description: 'Avatar lendário desbloqueado ao manter 15 dias de constância em atividades diagnósticas.',
      rarity: 'LENDARIO',
      unlock_condition: 'Completar 15 jornadas diárias seguidas.',
      is_purely_cosmetic: true
    },
    {
      id: 'avatar_guardiao_geometria',
      name: 'Guardião dos Polígonos',
      category: 'AVATAR_SOBERANO',
      description: 'Avatar temático de Ciências Exatas para estudantes dedicados à Geometria Espacial.',
      bncc_skill_code: 'EM13MAT308',
      rarity: 'RARO',
      unlock_condition: 'Resolver com sucesso 10 desafios de Geometria Espacial.',
      is_purely_cosmetic: true
    },

    // 2. Molduras de Perfil BNCC (Celebrando Habilidades Conquistadas)
    {
      id: 'frame_parabola_ouro',
      name: 'Vértice Dourado (Funções Quadráticas)',
      category: 'MOLDURA_BNCC',
      description: 'Moldura animada que envolve o perfil do aluno ao dominar o cálculo de vértices e raízes.',
      bncc_skill_code: 'EM13MAT302',
      rarity: 'EPICO',
      unlock_condition: 'Atingir proficiência TRI intermediária em Funções Quadráticas.',
      is_purely_cosmetic: true
    },
    {
      id: 'frame_literatura_barroca',
      name: 'Moldura Barroca — Constraste & Luz',
      category: 'MOLDURA_BNCC',
      description: 'Moldura estilizada com pergaminhos e tintas para quem explora a literatura clássica.',
      bncc_skill_code: 'EM13LP01',
      rarity: 'RARO',
      unlock_condition: 'Concluir a trilha de leitura interpretativa do Barroco brasileiro.',
      is_purely_cosmetic: true
    },

    // 3. Insígnias de Maestria (Mestria de Cartas / Questões)
    {
      id: 'badge_mestre_redacao_argumentativa',
      name: 'Insígnia de Mestre Argumentativo',
      category: 'INSIGNIA_MESTRIA',
      description: 'Insígnia exibida no boletim indicando excelente estrutura de proposta de intervenção (Competência 5).',
      bncc_skill_code: 'EM13LP05',
      rarity: 'LENDARIO',
      unlock_condition: 'Revisão docente nota 200 na Competência 5 do ENEM.',
      is_purely_cosmetic: true
    },
    {
      id: 'badge_persistencia_tri',
      name: 'Insígnia de Resiliência Epistêmica',
      category: 'INSIGNIA_MESTRIA',
      description: 'Premia a persistência: o estudante tentou novamente uma questão difícil até compreender o raciocínio.',
      rarity: 'EPICO',
      unlock_condition: 'Revisitar e acertar 5 itens previamente errados após intervenção pedagógica.',
      is_purely_cosmetic: true
    },

    // 4. Temas do Caderno Digital (Customização Visual)
    {
      id: 'theme_caderno_cyberpunk_neon',
      name: 'Caderno Tech Neon',
      category: 'TEMA_CADERNO',
      description: 'Esquema de cores de alto contraste com estética futurista para o portal do aluno.',
      rarity: 'COMUM',
      unlock_condition: 'Primeiro login completo no Portal do Aluno.',
      is_purely_cosmetic: true
    }
  ];

  public static getCharacters(): IntellectualWarriorCharacter[] {
    return [...this.characters];
  }

  public static getCharactersByArea(area: KnowledgeArea): IntellectualWarriorCharacter[] {
    return this.characters.filter(char => char.knowledge_area === area);
  }

  public static getCharacterById(id: string): IntellectualWarriorCharacter | undefined {
    return this.characters.find(char => char.id === id);
  }

  public static updateCharacterStatus(
    id: string,
    status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED'
  ): boolean {
    const char = this.characters.find(c => c.id === id);
    if (char) {
      char.publication_status = status;
      return true;
    }
    return false;
  }

  public static getCatalog(): PedagogicalCosmeticItem[] {
    return [...this.catalog];
  }

  public static getByCategory(category: PedagogicalCosmeticItem['category']): PedagogicalCosmeticItem[] {
    return this.catalog.filter(item => item.category === category);
  }

  public static getByBnccSkill(skillCode: string): PedagogicalCosmeticItem[] {
    return this.catalog.filter(item => item.bncc_skill_code === skillCode);
  }

  /**
   * SALVAGUARDA DE BORDA: Retorna apenas personagens homologados para entrega ao estudante.
   * Filtra rigorosamente itens em DRAFT ou PENDING_REVIEW para impedir vazamento no catálogo do aluno.
   */
  public static getStudentFacingCharacters(): IntellectualWarriorCharacter[] {
    return this.characters.filter(
      char => char.publication_status === 'APPROVED' || char.publication_status === 'PUBLISHED'
    );
  }

  /**
   * SALVAGUARDA DE BORDA: Bloqueia acesso a ativos visuais (URL, CDN, cache) de rascunhos.
   */
  public static getStudentFacingAssetUrl(characterId: string): string {
    const character = this.getCharacterById(characterId);
    if (!character) {
      throw new Error(`CHARACTER_NOT_FOUND: Personagem ${characterId} não encontrado.`);
    }

    if (character.publication_status !== 'APPROVED' && character.publication_status !== 'PUBLISHED') {
      throw new Error(`ASSET_DELIVERY_BLOCKED_FOR_DRAFT: O ativo visual de ${character.name} está em ${character.publication_status} e bloqueado para entrega ao estudante.`);
    }

    if (!character.image_ref) {
      throw new Error(`ASSET_NOT_CONFIGURED: Personagem ${character.name} não possui ativo visual configurado.`);
    }

    return character.image_ref;
  }

  /**
   * SALVAGUARDA DE CITAÇÃO: Entrega citações aos estudantes com governança de verificação:
   * - VERIFIED_PRIMARY_SOURCE: entrega com fonte primária;
   * - HISTORICAL_ATTRIBUTION_UNCERTAIN: entrega com ressalva historiográfica obrigatória;
   * - REMOVED_PENDING_PRIMARY_SOURCE ou PENDING_DOCUMENT_LOCATION: omite a citação (retorna null).
   */
  public static getStudentFacingQuote(characterId: string): {
    text: string;
    source_attribution: string;
    historiographical_disclaimer?: string;
  } | null {
    const character = this.getCharacterById(characterId);
    if (!character || !character.quotes || character.quotes.length === 0) {
      return null;
    }

    const primaryQuote = character.quotes[0];

    // Se estiver pendente de localização ou removida, não exibe no portal do estudante
    if (
      primaryQuote.verification_status === 'REMOVED_PENDING_PRIMARY_SOURCE' ||
      primaryQuote.verification_status === 'PENDING_DOCUMENT_LOCATION'
    ) {
      return null;
    }

    if (primaryQuote.verification_status === 'HISTORICAL_ATTRIBUTION_UNCERTAIN') {
      return {
        text: primaryQuote.text,
        source_attribution: primaryQuote.source,
        historiographical_disclaimer: primaryQuote.historiographical_note || 'Atribuição histórica tradicional (não verificada em documento primário contemporâneo).'
      };
    }

    return {
      text: primaryQuote.text,
      source_attribution: primaryQuote.source,
      historiographical_disclaimer: primaryQuote.historiographical_note
    };
  }
}

