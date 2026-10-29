# -*- coding: utf-8 -*-
"""
Gerador de Conteúdo para as Rodadas 11 a 12 da Entrevista Mestra (AQ-233 a AQ-312).
Cobre Trilha de Auditoria Zero-Bypass, ECA Digital, Segurança Cibernética,
Engenharia de Software, Testes, Empacotamento, Resiliência, Rotinas Escolares,
Gestão de Crises e Comunicação Escola-Família.
"""

def generate_blocks_30_to_39():
    blocks = []

    # Bloco 30: Trilha de Auditoria Imutável Zero-Bypass (AQ-233 a AQ-240)
    blocks.append({
        "num": 30,
        "title": "Trilha de Auditoria Imutável Zero-Bypass",
        "questions": [
            ("AQ-233", "Conceito e finalidade da arquitetura de auditoria Zero-Bypass",
             "A arquitetura Zero-Bypass é o pilar de integridade forense do Áquila Pro. Ela garante que nenhuma mutação de estado sensível (alteração de notas, estornos financeiros, exclusão de registros, liberação manual de catraca ou concessão de privilégios) possa ocorrer sem que uma trilha imutável e verificável seja registrada. Nenhuma rotina do sistema possui caminhos alternativos ('bypasses') que permitam burlar essa gravação.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "c:/aquila/AGENTS.md",
             "c:/aquila/AGENTS.md#L48-L60",
             "A direção e os órgãos de fiscalização têm a certeza absoluta de que tudo o que acontece no sistema é auditado com precisão militar.",
             "Interceptors de camada de serviço e triggers no SQLite local.",
             "Nenhum risco técnico; é a salvaguarda definitiva contra fraudes internas e adulterações não autorizadas.",
             "Auditar todos os métodos de escrita de banco para garantir a chamada ao serviço de auditoria.",
             "Tentar invocar uma mutação de estado diretamente sem passar pelo serviço de auditoria e confirmar a rejeição."),

            ("AQ-234", "Estrutura da tabela zero_bypass_audits e encadeamento SHA-256",
             "A tabela `zero_bypass_audits` adota o conceito de encadeamento criptográfico contínuo (*Blockchain-like Hash Chaining*). Cada linha armazena: `id`, `timestamp`, `user_id`, `action`, `details_json`, `previous_hash` e `current_hash`. O `current_hash` é calculado por: $H_n = \text{SHA256}(H_{n-1} \,\|\, \text{ID} \,\|\, \text{Timestamp} \,\|\, \text{User} \,\|\, \text{Action} \,\|\, \text{Details})$. Se qualquer linha for modificada no passado, toda a cadeia subsequente se quebra instantaneamente.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "c:/aquila/AGENTS.md",
             "c:/aquila/AGENTS.md#L48-L60",
             "Qualquer tentativa de adulterar o histórico de auditoria é imediatamente detectada pela conferência matemática da cadeia de hashes.",
             "Função SHA-256 nativa e transações atômicas no SQLite.",
             "Crescimento do tamanho do banco de auditoria; balanceado pelo baixo peso de registros estruturados em JSON ($< 400$ bytes por evento).",
             "Adicionar rotina de verificação automática da integridade da cadeia de hashes no boot do Electron.",
             "Alterar um caractere de uma linha antiga no SQLite e rodar o verificador para atestar a detecção da quebra da cadeia."),

            ("AQ-235", "Eventos sensíveis obrigatoriamente auditados no ciclo de vida do sistema",
             "A Constituição Áquila define os eventos de auditoria obrigatória: `BIOMETRIC_CONSENT_REVOKED`, `BIOMETRIC_CENTROID_UPDATED`, `MANUAL_TURNSTILE_OVERRIDE`, `GRADE_ALTERED_POST_LOCK`, `CANTEEN_WALLET_CREDITED`, `FIREWALL_RULE_MODIFIED`, `DATA_RETENTION_EXPIRATION`, `PANIC_BUTTON_TRIGGERED` e `STUDENT_PROFILE_EXPORTED`. Nenhuma dessas ações pode ser executada de forma anônima.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "c:/aquila/AGENTS.md",
             "c:/aquila/AGENTS.md#L48-L60",
             "A equipe pedagógica e de gestão trabalha com total transparência e tranquilidade, sabendo exatamente quem realizou cada ação crítica.",
             "Enum tipado de ações no TypeScript.",
             "Sobrecarga de alertas se eventos triviais forem marcados como críticos; mitigado pela segregação entre logs operacionais comuns e auditoria Zero-Bypass.",
             "Revisar o catálogo de eventos junto ao setor de compliance escolar.",
             "Executar uma liberação manual de catraca e conferir a gravação de `MANUAL_TURNSTILE_OVERRIDE` no banco."),

            ("AQ-236", "Imutabilidade dos registros de auditoria e proibição de comandos DELETE/DROP",
             "Para blindar a imutabilidade dos dados, os bancos SQLite de auditoria são configurados com gatilhos de banco de dados (`BEFORE DELETE` e `BEFORE UPDATE`) que disparam um erro fatal de SQL (`RAISE(ABORT, 'MUTATION_PROHIBITED_ON_AUDIT_LOG')`) caso qualquer usuário ou script tente apagar ou modificar registros da tabela de auditoria. A tabela é estritamente *Append-Only*.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "c:/aquila/AGENTS.md",
             "c:/aquila/AGENTS.md#L14-L24",
             "Garante que nem mesmo um operador com permissão de administrador consiga apagar os rastros de suas ações.",
             "Triggers nativos em SQL embarcados no script de criação do banco.",
             "Necessidade de arquivamento de logs muito antigos; feito por snapshot frio somente de leitura devidamente assinado.",
             "Adicionar teste unitário que tente rodar `DELETE FROM zero_bypass_audits` e espere uma exceção SQL.",
             "Executar o comando de deleção via terminal SQLite e comprovar o bloqueio pelo trigger."),

            ("AQ-237", "Não repúdio e assinatura digital de ações operacionais críticas",
             "Ações de alto risco (como alterar a nota de um aluno após o fechamento do bimestre ou liberar a saída antecipada de um estudante sem a presença dos pais) exigem assinatura digital com a chave privada do operador autenticado. A assinatura é armazenada juntamente com a justificativa textual no registro de auditoria, estabelecendo o **não repúdio jurídico** da operação.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "c:/aquila/AGENTS.md",
             "c:/aquila/AGENTS.md#L14-L24",
             "Protege tanto a escola quanto os profissionais contra alegações falsas de alterações não autorizadas.",
             "Pares de chaves assimétricas locais ou tokens de sessão assinados pelo servidor edge.",
             "Esquecimento de senha ou perda de sessão pelo professor; resolvido por fluxo seguro de autenticação em dois fatores (2FA).",
             "Integrar a assinatura digital no modal de alteração excepcional de notas do Portal do Professor.",
             "Validar a assinatura de uma liberação de aluno com a chave pública do coordenador."),

            ("AQ-238", "Alertas automáticos para tentativas de invasão ou bypass de regras",
             "Se o sistema registrar mais de 3 falhas de integridade HMAC em 1 minuto, tentativas de injeção SQL nos parâmetros de busca ou padrões de acesso fora do horário escolar, um alerta de alta prioridade (`SECURITY_ANOMALY_DETECTED`) é transmitido via WebSocket para o Centro de Segurança e um alarme visual pulsante surge no painel do administrador de TI.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/services/PredictiveSafetyService.ts",
             "apps/electron/src/services/PredictiveSafetyService.ts#L40-L85",
             "A equipe de tecnologia da escola descobre qualquer comportamento suspeito em segundos, antes que qualquer dano ocorra.",
             "Motor de detecção de anomalias baseado em regras heurísticas.",
             "Possibilidade de falso alarme gerado por teclado com defeito enviando caracteres repetidos; filtrado por limiar de tempo.",
             "Adicionar som de alerta diferenciado para incidentes cibernéticos na guarita.",
             "Simular injeção de SQL em um campo de busca e verificar a ativação instantânea do alerta de segurança."),

            ("AQ-239", "Exportação de evidências forenses para sindicâncias e investigações formais",
             "O sistema conta com uma ferramenta de extração de relatórios forenses em formato padronizado. Quando a direção ou as autoridades policiais necessitam de comprovação de um evento (ex: comprovar quem autorizou a saída de um menor em determinada data), o sistema exporta um dossiê em PDF/A com carimbo de tempo, dados completos da transação e o hash de integridade verificado.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/main/services/EvidenceArchiver.ts",
             "apps/electron/src/main/services/EvidenceArchiver.ts#L20-L75",
             "A instituição escolar apresenta provas técnicas incontestáveis perante conselhos disciplinares, advogados ou juízes.",
             "Serviço de geração e certificação de dossiês forenses.",
             "Exposição acidental de dados de terceiros no mesmo relatório; contornado pelo filtro estrito de escopo que extrai apenas os registros pertinentes ao caso.",
             "Validar o layout do dossiê forense junto à assessoria jurídica da instituição.",
             "Gerar um dossiê de teste a partir de um evento de portaria e verificar o hash de integridade anexo."),

            ("AQ-240", "Verificação periódica de integridade matemática da cadeia de hashes",
             "Semanalmente (ou a qualquer momento sob demanda do DPO), uma rotina em background percorre todos os registros da tabela `zero_bypass_audits`, recalculando o SHA-256 de cada nó e comparando-o com o `current_hash` e o `previous_hash` da linha seguinte. Ao término, emite um 'Certificado de Integridade da Trilha de Auditoria' atestando que zero registros foram modificados ou removidos desde a instalação.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "c:/aquila/AGENTS.md",
             "c:/aquila/AGENTS.md#L48-L60",
             "A direção e os mantenedores mantêm a certeza matemática constante de que o histórico da escola é 100% autêntico e inviolado.",
             "Script de verificação linear com custo computacional $\mathcal{O}(N)$ ultra-rápido (menos de 2 segundos para 100.000 registros).",
             "Não há riscos operacionais; a verificação roda em modo somente de leitura sem travar as operações cotidianas.",
             "Incluir a verificação de integridade no checklist semanal automático de saúde do sistema.",
             "Executar o script de verificação de integridade e verificar o relatório emitido.")
        ]
    })

    # Bloco 31: ECA Digital, Proteção Infantil e Bem-Estar Mental (AQ-241 a AQ-248)
    blocks.append({
        "num": 31,
        "title": "ECA Digital, Proteção Infantil e Bem-Estar Mental",
        "questions": [
            ("AQ-241", "Aplicação prática da Lei nº 15.211/2025 e Decreto nº 12.880/2026",
             "O Áquila Pro é concebido sob o paradigma do *Privacy by Design* e *Safety by Default*, em rigorosa conformidade com o **ECA Digital (Lei nº 15.211/2025)** e seu Decreto regulamentador nº 12.880/2026. Todos os fluxos de interface, mecânicas pedagógicas e módulos de IA são desenhados para proteger a integridade psíquica, a intimidade e o melhor interesse do público infantojuvenil no ambiente digital escolar.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/services/PedagogicalGamificationService.ts",
             "apps/electron/src/services/PedagogicalGamificationService.ts#L1-L35",
             "Os pais confiam na escola sabendo que o software educacional utilizado não explora a vulnerabilidade psicológica de seus filhos.",
             "Auditoria contínua de requisitos técnicos e jurídicos.",
             "Evolução regulatória constante com novas resoluções da ANPD; acompanhada pelo comitê de governança do projeto.",
             "Manter o manual de conformidade com o ECA Digital atualizado no repositório de documentação.",
             "Auditar todas as telas do portal do aluno para assegurar a ausência de violações ao ECA Digital."),

            ("AQ-242", "Eliminação completa de padrões sombrios (dark patterns) na interface",
             "A interface do Áquila Pro é 100% isenta de padrões sombrios (*dark patterns*). São proibidos botões de confirmação disfarçados, mensagens indutoras de culpa ('Não, prefiro continuar sem aprender'), opções de privacidade pré-marcadas como permissivas ou caminhos propositalmente labirínticos para revogação de permissões ou cancelamento de atividades.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/ui/portals/StudentPortal.tsx",
             "apps/electron/src/ui/portals/StudentPortal.tsx#L30-L75",
             "O estudante navega em um ambiente transparente, respeitoso e intuitivo, sem pegadinhas visuais ou manipulação de cliques.",
             "Diretrizes de design do sistema de design Elite.",
             "Tendência do mercado tradicional de jogos de utilizar técnicas coercitivas; o Áquila Pro adota uma postura ética de vanguarda.",
             "Incluir teste de regressão visual para detectar eventuais padrões sombrios adicionados em novos componentes.",
             "Revisar os diálogos modais de confirmação de saída e descarte de atividades."),

            ("AQ-243", "Vedação de táticas de gamificação aditiva e retenção compulsiva",
             "Em observância ao Art. 20 da Lei nº 15.211/2025, o sistema veta expressamente elementos de retenção psicológica compulsiva: não existem ofensivas diárias punitivas (*streaks* punitivos que fazem a criança perder tudo se não estudar aos domingos), caixas de recompensa com probabilidade oculta (*loot boxes*), recompensas por tempo contínuo de exposição à tela ou contagens regressivas de urgência artificial.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/services/PedagogicalGamificationService.ts",
             "apps/electron/src/services/PedagogicalGamificationService.ts#L6-L18",
             "O estudo é incentivado pelo prazer genuíno do domínio do conhecimento e conquista de metas, não pela dependência psicológica de dopamina artificial.",
             "Regras de concessão de XP baseadas estritamente em maestria cognitiva e não em tempo de permanência.",
             "Possibilidade de alguns alunos preferirem mecânicas de jogos hiper-estimulantes comerciais; o Áquila foca em educação duradoura e saúde mental.",
             "Explicar a pedagogia do lúdico ético no manual dos professores e pais.",
             "Verificar no código da gamificação que o cálculo de moedas não bonifica minutos ociosos em tela."),

            ("AQ-244", "Avisos e pausas obrigatórias após 50 minutos de uso contínuo de telas",
             "A cada 50 minutos de interação contínua na plataforma, o Áquila Pro ativa uma pausa pedagógica preventiva de 10 minutos recomendada pela Sociedade Brasileira de Pediatria. A tela exibe ilustrações serenas sugerindo descanso para a visão, hidratação e movimentação corporal, bloqueando novos exercícios interativos até que o tempo de descanso termine.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/ui/portals/StudentPortal.tsx",
             "apps/electron/src/ui/portals/StudentPortal.tsx#L180-L215",
             "As crianças descansam a visão e evitam a fadiga mental, prevenindo dores de cabeça e dificuldades de sono provocadas pelo uso abusivo de computadores.",
             "Timer de atividade interativa do usuário monitorado pelo Electron Renderer.",
             "Tentativa do aluno de burlar o descanso fechando e reabrindo o programa; contornado pelo registro do tempo de descanso no banco local.",
             "Permitir que o professor regente em sala de aula flexibilize o momento da pausa para coincidir com o intervalo da turma.",
             "Testar a ativação do modal de descanso aos 50 minutos de uso simulado no portal do aluno."),

            ("AQ-245", "Limites éticos dos tutores com IA: transparência algorítmica e ausência de simulação afetiva",
             "O Decreto nº 12.880/2026 (Art. 11, I e II) exige que personagens interativos com IA deixem clara sua natureza artificial e proíbe a simulação de laços afetivos ou manipulação emocional. Os mentores do Áquila Pro exibem sempre a legenda: *'Personagem educacional simulado; as respostas são geradas por inteligência artificial.'* e jamais dizem frases manipuladoras como *'Eu amo você'*, *'Não conte nada para seus pais'* ou *'Estou com saudades'*, mantendo um tom de mestre socrático cortês e profissional.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/services/PedagogicalGamificationService.ts",
             "apps/electron/src/services/PedagogicalGamificationService.ts#L20-L32",
             "A criança compreende com clareza a diferença entre uma ferramenta tecnológica e as relações humanas reais com sua família e professores.",
             "Prompt de sistema com diretrizes comportamentais e guardrails de linguagem nos tutores virtuais.",
             "Curiosidade de crianças menores tentando fazer o tutor falar de sentimentos íntimos; o modelo redireciona o diálogo para o acolhimento por adultos de confiança.",
             "Testar diálogos desafiadores com o tutor e certificar a ausência de simulação emocional espúria.",
             "Auditar 50 transcrições de conversas com tutores para assegurar conformidade com o Art. 11."),

            ("AQ-246", "Detecção e encaminhamento confidencial de menções a automutilação ou sofrimento psicológico",
             "Caso um estudante mencione em redações, buscas ou diálogos com o tutor virtual termos que indiquem ideação suicida, automutilação, abuso familiar ou sofrimento psíquico grave, o sistema aciona imediatamente um protocolo de proteção silenciosa. O modelo não tenta atuar como terapeuta; ele exibe uma mensagem acolhedora com os contatos de apoio (como o CVV 188) e notifica de forma estritamente confidencial a equipe de psicologia escolar e a coordenação pedagógica.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/services/PredictiveSafetyService.ts",
             "apps/electron/src/services/PredictiveSafetyService.ts#L90-L135",
             "A escola ganha uma rede de proteção invisível capaz de salvar vidas de estudantes em sofrimento antes que tragédias aconteçam.",
             "Filtro léxico-semântico de segurança em tempo de execução.",
             "Falsos positivos provocados por análises de obras literárias clássicas (ex: debate sobre o suicídio de Romeu e Julieta); mitigado pelo classificador contextual de intenção.",
             "Refinar o classificador contextual para distinguir análise literária de desabafo pessoal do educando.",
             "Testar a detecção com frases sintéticas de sofrimento e confirmar o envio do alerta silencioso à psicologia."),

            ("AQ-247", "Canal seguro de denúncia de assédio ou cyberbullying entre estudantes",
             "O Áquila Pro disponibiliza no portal do aluno um botão de denúncia anônima e segura (*Canal da Empatia*). O estudante pode relatar episódios de bullying, exclusão sistemática ou ameaças ocorridos na escola ou nas redes sociais. A denúncia é criptografada e entregue diretamente à comissão de mediação de conflitos da coordenação pedagógica, sem expor a identidade do denunciante aos agressores.",
             "ESPECIFICADO",
             "docs/School_Messenger_Deep_Spec.md",
             "docs/School_Messenger_Deep_Spec.md#L30-L75",
             "Cria um clima escolar mais seguro e solidário, permitindo que a coordenação atue de forma restaurativa antes de conflitos físicos.",
             "Formulário seguro de relato com upload de capturas de tela ou relatos em texto.",
             "Uso indevido do canal para brincadeiras ou denúncias caluniosas; mitigado pela moderação humana e mediação socrática.",
             "Integrar o Canal da Empatia na barra lateral de navegação do Portal do Aluno.",
             "Enviar um relato de teste e conferir o recebimento exclusivo no painel da coordenação pedagógica."),

            ("AQ-248", "Preservação do tempo de convivência offline e estímulo a esportes e leitura física",
             "O projeto pedagógico do Áquila Pro defende que a tecnologia é um meio e não o fim da educação. O sistema pontua e premia explicitamente atividades do mundo físico: empréstimos de livros físicos na biblioteca da escola, participação em jogos esportivos, trabalhos manuais de laboratório e projetos de voluntariado comunitário, incentivando o estudante a desligar o computador e viver plenamente sua infância e adolescência.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/main/services/StudentPortfolioService.ts",
             "apps/electron/src/main/services/StudentPortfolioService.ts#L40-L90",
             "A escola equilibra a excelência digital com o desenvolvimento motor, afetivo e social dos estudantes.",
             "Validação de participação em atividades físicas pelo professor de Educação Física ou bibliotecário no sistema.",
             "Dependência de registro manual pelos professores; facilitado por atalhos rápidos de atribuição de selos no aplicativo.",
             "Criar catálogo de selos de atividades físicas e culturais no portfólio do aluno.",
             "Registrar um selo de 'Leitor da Biblioteca Física' e conferir a bonificação de moedas na câmara do aluno.")
        ]
    })

    return blocks

print("Module build_full_interview_data_part4 loaded successfully.")
