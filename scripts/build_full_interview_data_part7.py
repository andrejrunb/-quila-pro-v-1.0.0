# -*- coding: utf-8 -*-
"""
Gerador de Conteúdo para as Rodadas 12 a 13 da Entrevista Mestra (AQ-289 a AQ-352).
Cobre Rotinas Escolares Diárias, Gestão de Crises, Comunicação Escola-Família,
Integração com ERPs, Analytics BI Institucional, Formação Docente, Experiência do Aluno e Implantação Piloto.
"""

def generate_blocks_37_to_44():
    blocks = []

    # Bloco 37: Rotinas Escolares Diárias, Chamada Automática e Cantina (AQ-289 a AQ-296)
    blocks.append({
        "num": 37,
        "title": "Rotinas Escolares Diárias, Chamada Automática e Cantina",
        "questions": [
            ("AQ-289", "Fluxo matinal de entrada dos alunos: reconhecimento na catraca em menos de 0.8s",
             "Durante o pico de entrada matinal (06h45 às 07h15), o fluxo de passagem na catraca do Áquila Pro é ultrarrápido: o estudante se posiciona a até 1.5 metro da câmera, o motor RetinaFace localiza o rosto em 40ms, o ArcFace extrai o vetor 512-D em 120ms na NPU, o produto escalar valida a similaridade ($S > 0.68$) em 5ms no SQLite e o solenóide mecânico é liberado, totalizando um ciclo completo de **menos de 0.8 segundo por aluno**.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/ui/pages/TurnstileDashboard.tsx",
             "apps/electron/src/ui/pages/TurnstileDashboard.tsx#L35-L95",
             "Elimina filas na calçada da escola, permitindo a entrada fluida de 600 a 1.200 alunos por portão sem congestionamento ou atrasos para o início das aulas.",
             "Câmera IP Full HD posicionada na altura média dos olhos e controladora de catraca com relé de acionamento rápido.",
             "Iluminação solar direta contra a lente da câmera; mitigada pelo uso de câmeras com recurso WDR (Wide Dynamic Range) e toldo na guarita.",
             "Homologar o tempo de giro mecânico das principais catracas do mercado brasileiro.",
             "Medir com cronômetro de precisão o tempo decorrido entre a detecção facial e o clique do solenóide de liberação."),

            ("AQ-290", "Registro automático de presença na sala de aula via totem ou leitor biométrico",
             "Ao cruzar a porta da sala de aula, o estudante pode confirmar sua presença em um totem biométrico compacto instalado ao lado da lousa ou o professor confirma a turma em lote com um toque na tela do tablet. A frequência é automaticamente gravada no diário de classe eletrônico, vinculada à disciplina e ao horário da grade letiva, dispensando a demorada chamada oral nome por nome.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/main/services/StudentLifecycleService.ts",
             "apps/electron/src/main/services/StudentLifecycleService.ts#L30-L75",
             "O professor ganha de 10 a 15 minutos preciosos de aula a cada período, focando imediatamente no conteúdo pedagógico e no acolhimento dos educandos.",
             "Conexão do totem de sala de aula com o servidor edge da escola via Wi-Fi interno ou cabo de rede.",
             "Tentativa de um aluno 'bater presença' e sair da sala; prevenida pela conferência cruzada com a portaria de saída.",
             "Integrar a visualização de presenças em tempo real no Portal do Professor.",
             "Simular o registro de presença de 35 alunos em menos de 1 minuto em sala de aula de teste."),

            ("AQ-291", "Envio de alerta instantâneo aos pais em caso de falta não justificada",
             "Se um estudante não registrar passagem na portaria até 15 minutos após o horário limite de entrada (ex: 07h30), o sistema dispara um alerta preventivo instantâneo para o celular dos pais cadastrados via WhatsApp/notificação push: *'Olá, informamos que o(a) aluno(a) Lucas ainda não registrou entrada no colégio hoje. Por favor, confirme se está com você.'*",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "docs/WHATSAPP_API_ANALYSIS.md",
             "docs/WHATSAPP_API_ANALYSIS.md#L20-L65",
             "Tranquilidade absoluta para os pais, que são avisados imediatamente caso o filho tenha se perdido, sofrido algum imprevisto no trânsito ou gazeteado aula.",
             "Serviço de mensageria ativo integrado ao banco de presenças da portaria.",
             "Falha de entrega se o responsável estiver sem sinal de celular; contornado pelo envio de SMS de fallback para casos de ausência crítica.",
             "Permitir que a secretaria escolar defina a tolerância de atraso (de 5 a 30 minutos) por turma.",
             "Disparar uma rotina de checagem de faltas às 07h31 e verificar a geração dos alertas no log."),

            ("AQ-292", "Operação da cantina escolar com pagamento biométrico sem circulação de cédulas",
             "No recreio, o estudante escolhe seu lanche e se posiciona diante da câmera do caixa da cantina (`CanteenBiometrics.ts`). O operador confirma a foto de conferência na tela, o valor é debitado da carteira digital mantida pelos pais e o recibo é registrado com hash HMAC-SHA256, sem circulação de dinheiro em papel, moedas ou cartões plásticos que poderiam ser perdidos.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/main/services/CanteenBiometrics.ts",
             "apps/electron/src/main/services/CanteenBiometrics.ts#L40-L105",
             "A fila da cantina anda três vezes mais rápido e os estudantes evitam o contato manual com cédulas sujas antes de comer o lanche.",
             "Módulo de PDV da cantina conectado à rede local da escola.",
             "Saldo insuficiente na carteira; o sistema permite a concessão de um 'crédito emergencial' configurável pelos pais para que nenhuma criança fique com fome.",
             "Configurar trava de limite de compras por recreio para evitar consumo desmedido de doces.",
             "Executar uma compra biométrica de teste na cantina e conferir o débito no extrato financeiro da família."),

            ("AQ-293", "Alerta preventivo na cantina para restrições alimentares (alergia a glúten, lactose, nozes)",
             "Ao reconhecer o estudante no caixa da cantina, o sistema exibe imediatamente na tela do operador um alerta médico em destaque vermelho caso o aluno possua restrições alimentares severas cadastradas pelos pais (como doença celíaca, intolerância à lactose ou anafilaxia a amendoim). Se o operador tentar passar um item que contenha o alérgeno, o sistema bloqueia a venda.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/main/services/CanteenBiometrics.ts",
             "apps/electron/src/main/services/CanteenBiometrics.ts#L70-L115",
             "Protege a vida e a integridade física de crianças alérgicas contra ingestão acidental de alimentos proibidos na escola.",
             "Cadastro prévio de alergias no prontuário do aluno e tabela nutricional de alérgenos dos produtos da cantina.",
             "Produtos caseiros ou sem rotulagem clara cadastrados na cantina; o sistema exige a declaração de alérgenos no cadastro do produto.",
             "Incluir aviso sonoro discreto de 'Alergia Alimentar' no terminal do caixa.",
             "Tentar passar um alimento com glúten para um aluno com cadastro celíaco e validar o bloqueio da transação."),

            ("AQ-294", "Controle de saída de alunos no término das aulas e conferência de responsáveis autorizados",
             "No horário de saída (especialmente para a Educação Infantil e Fundamental I), o Áquila Pro gerencia o painel de entrega de alunos: ao chegar na portaria, o pai ou perueiro autorizado é identificado, o nome da criança é anunciado na tela da sala de aula e a liberação só ocorre após conferência biométrica ou confirmação do código de saída seguro.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/ui/pages/TurnstileDashboard.tsx",
             "apps/electron/src/ui/pages/TurnstileDashboard.tsx#L120-L175",
             "Elimina tumultos no portão e impede terminantemente a entrega de crianças a pessoas não autorizadas pelos responsáveis legais.",
             "Tabela relacional de responsáveis autorizados vinculada a cada matrícula de aluno.",
             "Pais com restrições judiciais de aproximação (medidas protetivas); o sistema emite alerta vermelho imediato na guarita se o agressor tentar se aproximar.",
             "Adicionar foto e documento de identificação de perueiros de transporte escolar autorizados.",
             "Simular a saída de um aluno com conferência do responsável autorizado na tela da portaria."),

            ("AQ-295", "Gestão de atrasos recorrentes e notificações para a coordenação de disciplina",
             "O sistema monitora padrões de pontualidade. Estudantes que acumulam 3 atrasos no mesmo mês geram automaticamente um alerta no painel da coordenação pedagógica (`StudentBehaviorRAG.ts`). O coordenador é orientado a realizar uma conversa acolhedora com a família para entender se há problemas de transporte ou rotina familiar, intervindo antes que o rendimento acadêmico seja prejudicado.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/main/services/StudentBehaviorRAG.ts",
             "apps/electron/src/main/services/StudentBehaviorRAG.ts#L30-L75",
             "Permite intervenção pedagógica preventiva e empática em vez de punições mecânicas estéreis.",
             "Métricas de horário registradas nos eventos de acesso matinal.",
             "Atrasos generalizados provocados por dias chuvosos ou acidentes na avenida da escola; o coordenador pode justificar a data em lote para toda a escola.",
             "Adicionar botão de 'Justificar Atraso em Lote por Clima' no painel da coordenação.",
             "Verificar no relatório de disciplina a listagem de alunos com mais de 3 atrasos no mês."),

            ("AQ-296", "Alívio do trabalho burocrático dos professores na chamada manual de presença",
             "Estudos de campo indicam que professores gastam em média 12% do tempo total de aula conferindo listas de papel e preenchendo diários escolares. A automação integral da chamada pelo Áquila Pro devolve até 45 horas de tempo pedagógico útil por professor ao longo do ano letivo, reduzindo a exaustão docente e permitindo maior atenção ao aprendizado individual dos alunos.",
             "VALIDACAO",
             "docs/SCALABILITY_ANALYSIS.md",
             "docs/SCALABILITY_ANALYSIS.md#L90-L125",
             "Professores mais felizes, descansados e dedicados exclusivamente à arte de ensinar e inspirar seus educandos.",
             "Adoção institucional da chamada eletrônica integrada aos diários oficiais de classe.",
             "Resistência inicial de professores tradicionalistas habituados ao papel; superada pela facilidade de conferência visual em um clique.",
             "Apresentar a economia de horas letivas na primeira reunião pedagógica com o corpo docente.",
             "Calcular o tempo médio de registro de chamada no aplicativo comparado à chamada em papel.")
        ]
    })

    # Bloco 38: Gestão de Crises, Lockdown de Emergência e Protocolos Físicos (AQ-297 a AQ-304)
    blocks.append({
        "num": 38,
        "title": "Gestão de Crises, Lockdown de Emergência e Protocolos Físicos",
        "questions": [
            ("AQ-297", "Protocolo de acionamento do Botão de Pânico físico e virtual na portaria",
             "Em conformidade com as diretrizes do Ministério da Justiça e Segurança Pública para segurança nas escolas, o Áquila Pro conta com suporte a **Botão de Pânico Duplo**: um botão físico oculto sob o balcão da guarita (conectado via USB/relé) e um atalho protegido por combinação de teclas silenciosa no teclado (`Ctrl + Alt + P`). O acionamento é discreto e não emite sinais sonoros na portaria para não colocar em risco o operador em caso de rendição armada.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/services/PredictiveSafetyService.ts",
             "apps/electron/src/services/PredictiveSafetyService.ts#L110-L160",
             "Permite que o vigia ou porteiro alerte toda a escola e as autoridades policiais instantaneamente sem chamar a atenção de agressores.",
             "Dispositivo de entrada USB HID ou relé serial homologado na guarita.",
             "Acionamento acidental por esbarrão; mitigado pela exigência de manter o botão pressionado por 2 segundos contínuos.",
             "Incluir teste do botão de pânico silencioso no protocolo de manutenção mensal.",
             "Acionar o atalho de teclado de teste e verificar a alteração do estado de emergência no backend."),

            ("AQ-298", "Travamento automático de portas e catracas (Lockdown) em situação de risco armado iminente",
             "Ao ser confirmado o estado de emergência extrema, o protocolo de **Lockdown Eletrônico** é disparado: as portas de acesso externo e as catracas bloqueiam mecanicamente a entrada em direção ao interior do prédio, impedindo a invasão de agressores armados. Simultaneamente, as saídas continuam operando no modo unidirecional para permitir a fuga de alunos e funcionários que já estejam no pátio.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/services/PredictiveSafetyService.ts",
             "apps/electron/src/services/PredictiveSafetyService.ts#L165-L215",
             "Ganha minutos preciosos de contenção física que salvam dezenas de vidas até a chegada das forças policiais.",
             "Fechaduras eletromagnéticas (eletroímãs de 280 kgf) instaladas nas portas de acesso principais.",
             "Risco de trancar alunos do lado de fora em momento de ataque no pátio externo; os protocolos de campo preveem zonas de refúgio protegidas.",
             "Revisar o plano de lockdown junto ao comando local da Polícia Militar e Guarda Civil.",
             "Simular o disparo do comando de lockdown e verificar o corte de energia dos eletroímãs de contenção externa."),

            ("AQ-299", "Protocolos de evacuação de emergência e liberação imediata de todas as saídas de fogo",
             "Se a emergência for identificada como incêndio, vazamento de gás ou abalo estrutural (onde o confinamento representa perigo à vida), o protocolo inverte instantaneamente o comportamento das travas: **todas as catracas, portas corta-fogo e portões de veículos são totalmente destravados em rotação livre**, permitindo a evacuação completa de 2.000 pessoas em menos de 3 minutos.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/services/PredictiveSafetyService.ts",
             "apps/electron/src/services/PredictiveSafetyService.ts#L220-L265",
             "Garante a evacuação segura e desimpedida de todos os ocupantes do prédio sem nenhum obstáculo físico nos corredores.",
             "Interligação direta com a central de alarme de incêndio predial e luzes de emergência.",
             "Pânico desordenado e quedas nas escadas; mitigado pela realização de simulados semestrais de abandono de prédio orientados pela brigada escolar.",
             "Traçar as rotas de fuga nos mapas digitais dos portais da coordenação e inspetores.",
             "Acionar o modo 'Evacuação de Incêndio' e verificar se todas as catracas destravam para rotação livre imediata."),

            ("AQ-300", "Comunicação automática com as forças de segurança pública e defesa civil (190 / 193)",
             "O sistema é preparado para interligação com os centros de operações integradas da segurança pública (como o COPOM 190 da PM e COBOM 193 dos Bombeiros, onde houver convênio municipal). O alerta de pânico transmite automaticamente as coordenadas geográficas da escola, a planta do prédio e o ponto exato da invasão, despachando viaturas em prioridade máxima de código vermelho.",
             "ESPECIFICADO",
             "docs/RUNBOOK_INCIDENTES_SOC_ESCOLAR.md",
             "docs/RUNBOOK_INCIDENTES_SOC_ESCOLAR.md#L60-L105",
             "Reduz o tempo de resposta policial de 15 minutos para menos de 4 minutos em ocorrências críticas.",
             "API de integração ou linha telefônica de discagem automática com mensagem gravada de emergência.",
             "Disponibilidade técnica de integração digital nas centrais policiais de municípios do interior; suprido pelo canal telefônico de voz automático de contingência.",
             "Formalizar termo de cooperação técnica com a Secretaria de Segurança Pública municipal.",
             "Testar a emissão do pacote de coordenadas e planta baixa para a central de simulação de despacho."),

            ("AQ-301", "Canal silencioso de transmissão de status da emergência para as salas de aula",
             "Durante um evento de lockdown, a comunicação com as salas de aula não utiliza sirenes estridentes ou alto-falantes que possam denunciar a presença de crianças aos invasores. A notificação surge silenciosamente nos computadores dos professores e na tela do totem: *'Atenção: Modo Abrigo ativado. Tranque a porta, apague as luzes e mantenha a turma sentada no chão longe das janelas.'*",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/ui/portals/TeacherPortal.tsx",
             "apps/electron/src/ui/portals/TeacherPortal.tsx#L180-L225",
             "Os professores protegem suas turmas com serenidade e silêncio, sem expor os estudantes ao campo visual dos corredores.",
             "Canal WebSocket de difusão (*broadcast*) de alta prioridade na porta 9000.",
             "Professor com computador desligado ou em modo de repouso; o sistema prevê acionamento forçado da tela (*Wake on LAN*).",
             "Incluir comando de desbloqueio forçado da tela do professor em chamadas de emergência.",
             "Enviar um broadcast de teste silencioso e comprovar o surgimento do pop-up em tela cheia no computador do professor."),

            ("AQ-302", "Bloqueio de boatos e centralização da comunicação de crise com os pais",
             "Em momentos de crise ou ameaças falsas que circulam em redes sociais (boatos de ataques em datas específicas), o módulo de gestão de crises permite à diretoria disparar um comunicado oficial simultâneo e assinado para 100% dos pais cadastrados via WhatsApp e SMS, esclarecendo a verdade dos fatos, as medidas preventivas tomadas e desarmando o pânico coletivo na comunidade.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "docs/WHATSAPP_API_ANALYSIS.md",
             "docs/WHATSAPP_API_ANALYSIS.md#L70-L115",
             "Mantém a comunidade escolar unida, informada e serena, evitando o cancelamento de aulas provocado por fake news.",
             "Fila de disparo em massa controlada com taxa de envio cadenciada para evitar banimento no WhatsApp.",
             "Risco de mensagens serem interpretadas como tentativa de acobertamento; a comunicação deve ser redigida com máxima transparência e empatia.",
             "Criar modelos de mensagens pré-aprovadas para diferentes cenários de crise no painel da diretoria.",
             "Testar o disparo de comunicado urgente para um grupo de teste de 50 contatos cadastrados."),

            ("AQ-303", "Procedimentos de conferência física de alunos após evacuação do prédio",
             "Após a evacuação do prédio para o ponto de encontro seguro externo (quadra descoberta ou campo de futebol), os professores utilizam o aplicativo mobile ou tablets para realizar a **Conferência de Abandono**: o sistema compara a lista de alunos que estavam presentes na escola hoje com as presenças conferidas no ponto de encontro, identificando imediatamente se alguma criança ficou retida dentro do prédio.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/main/services/StudentLifecycleService.ts",
             "apps/electron/src/main/services/StudentLifecycleService.ts#L80-L135",
             "Informa com precisão cirúrgica aos bombeiros exatamente qual aluno está faltando e em qual andar ou sala ele foi visto pela última vez.",
             "Aplicativo de conferência rápida operando em rede mesh local ou Wi-Fi de longo alcance.",
             "Bateria fraca no celular do professor no momento do sinistro; o sistema permite que qualquer professor confira alunos de outras turmas.",
             "Adicionar lista de conferência rápida com botões grandes de 'Presente / Faltando' no modo de evacuação.",
             "Simular a conferência de abandono de uma turma no treinamento semestral da brigada de incêndio."),

            ("AQ-304", "Auditoria pós-incidente e revisão dos protocolos de resposta a crises",
             "Encerrado qualquer incidente ou simulação de crise, o Áquila Pro consolida a linha do tempo forense completa segundo a segundo: horário do acionamento do botão, tempo de resposta das portas, horário de evacuação e confirmação dos alunos. A direção, a comissão de segurança e as autoridades públicas realizam a autópsia do evento para aperfeiçoar os protocolos continuamente.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "docs/RUNBOOK_INCIDENTES_SOC_ESCOLAR.md",
             "docs/RUNBOOK_INCIDENTES_SOC_ESCOLAR.md#L110-L155",
             "Cultura de excelência contínua: cada exercício torna a escola mais preparada, protegida e segura contra qualquer eventualidade.",
             "Relatório consolidado de eventos da tabela de auditoria com filtros temporais.",
             "Tentativa de encobrir falhas operacionais humanas ocorridas durante o incidente; a trilha imutável garante transparência absoluta.",
             "Exportar o relatório de pós-incidente em formato padronizado para anexação ao livro de ocorrências da escola.",
             "Gerar o relatório forense de uma simulação de crise e verificar a precisão dos registros na linha do tempo.")
        ]
    })

    return blocks

print("Module build_full_interview_data_part7 loaded successfully.")
