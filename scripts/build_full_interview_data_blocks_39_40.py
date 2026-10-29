# -*- coding: utf-8 -*-
"""
Gerador de Conteúdo para os Blocos 39 e 40 da Entrevista Mestra (AQ-305 a AQ-320).
Cobre Comunicação Escola-Família / WhatsApp e Integrações com Sistemas Acadêmicos Legados e ERPs.
"""

def generate_blocks_39_to_40():
    blocks = []

    # Bloco 39: Comunicação Escola-Família, Notificações e WhatsApp (AQ-305 a AQ-312)
    blocks.append({
        "num": 39,
        "title": "Comunicação Escola-Família, Notificações e WhatsApp",
        "questions": [
            ("AQ-305", "Integração com WhatsApp Business API (Evolution Go / Baileys) para envio transacional",
             "A comunicação com as famílias utiliza a API do WhatsApp Business através do gateway leve Evolution Go / Baileys hospedado localmente no próprio servidor Áquila Edge ou em container Docker. O gateway gerencia a sessão via QR Code e realiza envios transacionais puros (avisos de entrada/saída, ocorrências disciplinares, alertas médicos e boletins), sem passar por plataformas intermediárias pagas de terceiros.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "docs/WHATSAPP_API_ANALYSIS.md",
             "docs/WHATSAPP_API_ANALYSIS.md#L10-L50",
             "Os pais recebem mensagens oficiais da escola diretamente no aplicativo de mensagens que já usam todos os dias, sem necessidade de baixar um novo app se não quiserem.",
             "Instância do Evolution Go / Baileys com chip SIM corporativo da escola.",
             "Risco de banimento do número caso o WhatsApp identifique disparos em massa como spam; mitigado pela cadência controlada de envio (intervalo de 1 a 3 segundos entre mensagens) e natureza exclusivamente transacional dos avisos.",
             "Configurar número exclusivo oficial da instituição no WhatsApp Business com foto de perfil e dados institucionais.",
             "Enviar uma mensagem de teste via endpoint local do Evolution Go e verificar a recepção no celular."),

            ("AQ-306", "Notificações de entrada e saída do estudante em tempo real no celular dos responsáveis",
             "A cada passagem válida pela catraca na portaria, o sistema despacha uma notificação transacional instantânea para os pais cadastrados: *'Áquila Alerta: Gabriel entrou no colégio às 07h04 (Portão Principal). Tenha um excelente dia!'*. No horário de saída, o aviso correspondente é emitido com o horário exato da liberação física.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "docs/WHATSAPP_API_ANALYSIS.md",
             "docs/WHATSAPP_API_ANALYSIS.md#L55-L85",
             "Tranquilidade imensurável para mães e pais no trabalho, que sabem exatamente o minuto em que o filho chegou à escola e a hora em que saiu.",
             "Vínculo telefônico dos responsáveis na tabela `students` do banco SQLite.",
             "Pais com múltiplos filhos na mesma escola recebendo notificações separadas; o sistema agrupa mensagens caso os irmãos entrem juntos no mesmo minuto.",
             "Permitir que os pais configurem suas preferências de notificação (apenas atrasos ou todas as passagens) no Portal da Família.",
             "Executar uma passagem simulada na catraca e atestar o disparo do webhook de notificação."),

            ("AQ-307", "Compartilhamento semanal de resumos pedagógicos e conquistas na TRI",
             "Toda sexta-feira à tarde, o sistema compila um resumo pedagógico formativo semanal para os pais: *'Resumo Semanal do Gabriel: Fez 15 exercícios da TRI em Matemática, alcançando o nível Proficiente em Geometria Espacial (SAEB 295). Conquistou a insígnia Mestre de Pitágoras!'*, acompanhado de dicas de incentivo aos estudos no final de semana.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/services/PedagogicalTriEngine.ts",
             "apps/electron/src/services/PedagogicalTriEngine.ts#L600-L650",
             "Aproxima a família da vida escolar dos filhos, valorizando o esforço e as pequenas conquistas acadêmicas semanais.",
             "Motor de agregação semanal de proficiências e conquistas pedagógicas.",
             "Uso de jargões técnicos psicométricos incompreensíveis para famílias leigas; contornado pela tradução da linguagem da TRI para termos acolhedores e intuitivos.",
             "Incluir sugestões de leituras complementares do acervo histórico da escola no resumo semanal.",
             "Gerar um resumo semanal sintético de um estudante e conferir o tom da mensagem pedagógica."),

            ("AQ-308", "Agendamento de reuniões de pais e confirmação de presença sem papel",
             "A convocação para plantões pedagógicos e reuniões de pais e mestres é enviada digitalmente com opções interativas de confirmação ('Confirmar presença às 18h', 'Solicitar horário alternativo'). O coordenador visualiza o mapa de confirmações em tempo real na tela, eliminando bilhetes em papel grampeados na agenda que frequentemente não chegavam aos responsáveis.",
             "ESPECIFICADO",
             "apps/electron/src/ui/portals/ParentPortal.tsx",
             "apps/electron/src/ui/portals/ParentPortal.tsx#L40-L95",
             "Economia de milhares de folhas de papel e aumento comprovado de até 70% na presença de pais nas reuniões escolares.",
             "Módulo de agendamento de eventos no Portal da Família.",
             "Famílias com rotinas de trabalho complexas que não conseguem comparecer nos horários convencionais; o sistema oferece agendamento de atendimentos virtuais por vídeo.",
             "Integrar a confirmação de presença com a exportação de convites para o Google Calendar dos pais.",
             "Disparar uma convocação de reunião no Portal da Família e confirmar a atualização do status na lista da coordenação."),

            ("AQ-309", "Comunicação bidirecional segura entre família e coordenação com histórico auditado",
             "Diferente de grupos de WhatsApp caóticos onde ocorrem discussões desnecessárias entre pais, o Áquila Pro oferece um canal de atendimento bidirecional estritamente privado e institucional entre a família e a coordenação/professores. Cada mensagem trocada é registrada no prontuário do aluno com hash de auditoria, estabelecendo um histórico formal de todas as orientações pedagógicas prestadas.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "docs/School_Messenger_Deep_Spec.md",
             "docs/School_Messenger_Deep_Spec.md#L1-L60",
             "Comunicação civilizada, profissional e juridicamente protegida entre a escola e os responsáveis.",
             "Chat interno seguro no Portal da Família com autenticação por senha e biometria digital no celular.",
             "Exposição do número pessoal de celular dos professores para os pais; terminantemente vedada, pois todo o contato passa pela plataforma institucional.",
             "Inserir horário comercial de atendimento nos canais de mensagem com mensagem automática de ausência à noite.",
             "Enviar uma mensagem da família para a coordenação e atestar a gravação da conversa no banco SQLite."),

            ("AQ-310", "Políticas contra disparo de mensagens em massa promocionais ou spam institucional",
             "A Constituição Áquila v2.1 veta expressamente a utilização dos canais de notificação para envio de anúncios comerciais, cobranças vexatórias ou mensagens promocionais em massa. O canal é de uso estritamente sagrado para a segurança física e desenvolvimento educacional das crianças.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "c:/aquila/AGENTS.md",
             "c:/aquila/AGENTS.md#L14-L24",
             "Os pais nunca bloqueiam o número da escola, pois sabem que qualquer mensagem recebida é de alta relevância sobre o bem-estar de seu filho.",
             "Diretrizes editoriais configuradas nos templates de mensagem do sistema.",
             "Pressão de equipes comerciais de escolas privadas para vender passeios ou materiais extras pelo canal; bloqueada pelas permissões do perfil no sistema.",
             "Adicionar filtro de palavras-chave proibidas em templates de disparos institucionais.",
             "Verificar no catálogo de templates que inexistem mensagens com teor publicitário."),

            ("AQ-311", "Fallback para SMS e e-mail quando o responsável não utiliza WhatsApp",
             "Reconhecendo a diversidade sociocultural brasileira, onde alguns responsáveis utilizam celulares simples (feature phones) ou não possuem conta no WhatsApp, o sistema monitora o status de entrega das mensagens. Caso a mensagem do WhatsApp não seja entregue em 5 minutos, o sistema aciona automaticamente o fallback para SMS transacional tradicional ou e-mail registrado.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "docs/WHATSAPP_API_ANALYSIS.md",
             "docs/WHATSAPP_API_ANALYSIS.md#L90-L125",
             "Inclusão total: nenhuma família fica sem saber da chegada segura de seu filho na escola, independentemente do modelo de seu telefone celular.",
             "Gateway de SMS institucional homologado com rotas diretas de alta velocidade.",
             "Custo unitário por SMS enviado; amortizado pela priorização inicial do canal gratuito do WhatsApp.",
             "Configurar a chave de API do provedor de SMS de fallback no arquivo de configurações de TI.",
             "Simular a falha de envio no WhatsApp e comprovar o disparo alternativo da mensagem por SMS."),

            ("AQ-312", "Respeito ao descanso docente: bloqueio de mensagens para professores fora do horário escolar",
             "Para combater o esgotamento profissional (Síndrome de Burnout) provocado pela invasão da vida pessoal dos educadores, o Áquila Pro bloqueia o envio e a notificação de mensagens de pais para os professores após as 18h00, em finais de semana e em períodos de férias letivas. Mensagens enviadas nesses períodos entram em fila de espera e são entregues ao docente apenas no início do expediente seguinte.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "docs/School_Messenger_Deep_Spec.md",
             "docs/School_Messenger_Deep_Spec.md#L65-L100",
             "Respeito inegociável à dignidade, à saúde mental e ao tempo de convívio familiar do professor.",
             "Agendamento de filas com regras de horário comercial baseadas no calendário letivo da escola.",
             "Situações de emergência médica extrema com alunos; direcionadas para o plantão 24h da diretoria e não para o professor regente.",
             "Exibir aviso aos pais: 'O professor responderá a esta mensagem no início do expediente escolar amanhã às 07h30'.",
             "Tentar enviar uma mensagem para um professor às 21h00 e verificar a retenção na fila matinal.")
        ]
    })

    # Bloco 40: Integrações com Sistemas Acadêmicos Legados e ERPs (AQ-313 a AQ-320)
    blocks.append({
        "num": 40,
        "title": "Integrações com Sistemas Acadêmicos Legados e ERPs",
        "questions": [
            ("AQ-313", "Conectores de importação e exportação para ERPs escolares líderes (TOTVS, Sophia, Gennera)",
             "O Áquila Pro não exige que a escola abandone seu software acadêmico e financeiro legado. O sistema disponibiliza conectores prontos para os ERPs escolares mais populares do mercado brasileiro (TOTVS Educacional, Sophia Escola, Gennera, Activesoft e Perseus), permitindo a sincronização bidirecional de matrículas, turmas, diários e notas através de conectores ODBC/REST e arquivos padronizados.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "docs/GUIA_INTEGRACAO_API.md",
             "docs/GUIA_INTEGRACAO_API.md#L10-L65",
             "A escola moderniza sua portaria e pedagogia com IA sem o trauma de trocar o sistema de faturamento e matrículas já consolidado.",
             "Módulo de integração de dados em `docs/GUIA_INTEGRACAO_API.md`.",
             "Diversidade de versões de bancos de dados dos ERPs legados (SQL Server, Oracle, Firebird); superada pela padronização via arquivos de intercâmbio CSV/JSON.",
             "Manter os templates de mapeamento de colunas atualizados para cada ERP homologado.",
             "Executar uma importação de teste a partir de um arquivo de exemplo do Sophia Escola e conferir o preenchimento das turmas."),

            ("AQ-314", "Sincronização de matrículas, turmas e enturmações via arquivos CSV / JSON",
             "No início do ano letivo ou a cada entrada de novos estudantes, a secretaria escolar simplesmente exporta a lista de alunos do ERP legado em formato CSV/JSON e a importa no Áquila Pro com um clique. O assistente inteligente mapeia automaticamente as colunas (Nome, Matrícula, Turma, Data de Nascimento, Telefone dos Pais), cria os perfis de estudantes e gera as credenciais em menos de 1 minuto para 1.000 alunos.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/ui/pages/StudentManagement.tsx",
             "apps/electron/src/ui/pages/StudentManagement.tsx#L40-L110",
             "Elimina dias inteiros de trabalho manual de digitação de cadastros por parte dos funcionários da secretaria.",
             "Parser de CSV com suporte a codificações de texto variadas (UTF-8, ISO-8859-1 / Windows-1252).",
             "Arquivos com dados incompletos ou formatos de data inconsistentes; o assistente aponta as linhas com divergência antes da importação definitiva.",
             "Adicionar validação automática de CPF e formato de telefone com DDD.",
             "Importar um arquivo CSV com 50 alunos fictícios e verificar a criação correta de todos os registros no SQLite."),

            ("AQ-315", "Exportação de notas bimestrais e médias finais formatadas para os diários oficiais",
             "Ao final do bimestre letivo, o Áquila Pro calcula as médias e proficiências consolidadas da TRI e as converte para o formato oficial da escola (escala numérica de 0 a 10 com uma casa decimal ou conceitos A/B/C/D). O coordenador clica em 'Exportar para o ERP' e o sistema gera o arquivo perfeitamente formatado para preenchimento automático dos diários oficiais de classe e boletins.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/services/PedagogicalTriEngine.ts",
             "apps/electron/src/services/PedagogicalTriEngine.ts#L650-L710",
             "Professores e secretários nunca mais precisam digitar notas manualmente duas vezes em sistemas diferentes.",
             "Tabela de conversão linear entre a escala psicométrica e a escala decimal da instituição.",
             "Critérios de arredondamento divergentes entre escolas; configuráveis nas preferências acadêmicas do sistema.",
             "Implementar exportação de notas diretamente em planilhas Excel (.xlsx) com fórmulas oficiais.",
             "Exportar as notas de uma turma de teste e conferir a compatibilidade de colunas com o modelo do diário oficial."),

            ("AQ-316", "Integração com catracas legadas via protocolos TCP/IP padronizados (Topdata, Henry, Telemática)",
             "O Áquila Pro não obriga a escola a comprar catracas novas se ela já possuir equipamentos físicos em bom estado. O motor de comunicação serial e TCP/IP suporta os protocolos proprietários das catracas consagradas do mercado nacional (Topdata Inner Plus, Henry Lumen/Prisma, Telemática e Dimep), enviando comandos nativos de liberação de giro e leitura de cartões RFID legados.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "docs/camera_manager.py",
             "docs/presence_integrator.py#L20-L75",
             "Economia expressiva de dezenas de milhares de reais para a escola, que reaproveita suas catracas de ferro existentes adicionando apenas o cérebro de IA do Áquila.",
             "Placas de rede ou conversores Serial-Ethernet nas catracas físicas.",
             "Protocolos binários legados sem documentação aberta; mapeados e testados por engenharia reversa de pacotes.",
             "Manter os drivers de catraca compilados na pasta de serviços de hardware do Electron.",
             "Testar o envio de um comando de acionamento de giro para uma controladora Topdata via socket TCP na bancada de testes."),

            ("AQ-317", "Tratamento de dados inconsistentes de matrículas importadas de bancos legados",
             "É comum que bancos de dados legados contenham inconsistências graves: nomes sem sobrenome, números de telefone sem DDD, datas de nascimento com ano invertido ou matrículas duplicadas. O módulo de importação do Áquila Pro conta com rotinas de saneamento e normalização que corrigem automaticamente erros comuns e solicitam confirmação humana apenas para casos insanáveis.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/ui/pages/StudentManagement.tsx",
             "apps/electron/src/ui/pages/StudentManagement.tsx#L120-L165",
             "Limpeza e higienização contínua da base de dados da escola, elevando o padrão de qualidade cadastral da instituição.",
             "Expressões regulares (Regex) de validação de dados brasileiros.",
             "Falta de telefone de um responsável; o sistema aceita o cadastro com alerta para que a secretaria solicite o dado na próxima visita.",
             "Adicionar assistente visual de 'Saneamento de Dados Cadastrais' na secretaria.",
             "Passar uma lista propositalmente desformatada pelo validador e verificar as correções sugeridas."),

            ("AQ-318", "Webhooks e APIs REST locais para extensão por desenvolvedores da própria escola",
             "Escolas técnicas, faculdades e colégios de grande porte que possuam equipe própria de desenvolvimento de software podem estender as funcionalidades do Áquila Pro. O servidor edge disponibiliza uma API REST local documentada em OpenAPI/Swagger e webhooks configuráveis para eventos de entrada, saída, notas e alertas, permitindo integração com carteirinhas digitais próprias ou sistemas de monitoria.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "docs/api_docs.json",
             "docs/api_docs.json#L1-L100",
             "Soberania e autonomia para a equipe de tecnologia da própria escola criar soluções customizadas sem depender de consultorias caras.",
             "Servidor de API REST local rodando em HTTPS na porta 443.",
             "Uso inadequado de webhooks por scripts de terceiros que causem lentidão no servidor; protegido por filas assíncronas isoladas.",
             "Publicar a documentação interativa do Swagger na rota `/api/docs` do servidor local.",
             "Fazer uma requisição GET autenticada na rota `/api/v1/students` e conferir a resposta JSON formatada."),

            ("AQ-319", "Procedimento de migração de dados de sistemas antigos para o Áquila Pro",
             "O processo de migração de dados de sistemas antigos é orientado por um protocolo passo a passo de 4 etapas: 1. Extração de tabelas legadas em formato texto limpo; 2. Validação e enriquecimento da matriz de dados; 3. Carga assistida no SQLite com verificação de integridade referencial; 4. Conferência em paralelo durante 5 dias úteis com o sistema legado antes do corte (*Cutover*) definitivo.",
             "ESPECIFICADO",
             "docs/PILOT_DEPLOYMENT_GUIDE.md",
             "docs/PILOT_DEPLOYMENT_GUIDE.md#L85-L130",
             "Transição suave, segura e sem nenhum dia de instabilidade ou interrupção do funcionamento da escola.",
             "Roteiro detalhado documentado no guia de implantação para técnicos de campo.",
             "Resistência de fornecedores legados em fornecer exportação completa de dados; superada pelo uso de relatórios padrão em PDF ou banco desprotegido.",
             "Disponibilizar script de conversão automática de dumps de bancos Firebird/SQL Server para SQLite.",
             "Executar uma migração completa simulada de uma escola de 500 alunos no laboratório de testes."),

            ("AQ-320", "Garantia de não dependência de vendor lock-in e exportação total de dados em formatos abertos",
             "O Áquila Pro defende o princípio inegociável da **Soberania do Cliente contra o Aprisionamento Tecnológico (*Vendor Lock-in*)**. A qualquer momento, sem taxas rescisórias abusivas ou burocracia, a direção da escola pode exportar integralmente todos os seus dados históricos (matrículas, notas, presenças, relatórios psicométricos) em formatos abertos, padronizados e legíveis por qualquer sistema (JSON, CSV, SQLite e PDF/A).",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "c:/aquila/AGENTS.md",
             "c:/aquila/AGENTS.md#L6-L12",
             "A escola permanece com o Áquila Pro pela qualidade e excelência incomparável do serviço, jamais por se sentir refém de dados aprisionados.",
             "Botão de 'Exportação Master de Dados' no painel de administração da diretoria.",
             "Arquivo de exportação final de múltiplos Gigabytes; empacotado em arquivo `.zip` criptografado com senha escolhida pelo diretor.",
             "Garantir que a documentação de esquemas de dados esteja sempre disponível para facilitar importações futuras por qualquer terceiro.",
             "Clicar em 'Exportar Acervo Completo' e certificar que o arquivo ZIP gerado abre perfeitamente em planilhas e bancos abertos.")
        ]
    })

    return blocks

print("Module build_full_interview_data_blocks_39_40 loaded successfully.")
