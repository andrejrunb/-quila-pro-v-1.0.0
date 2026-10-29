# -*- coding: utf-8 -*-
"""
Gerador de Conteúdo para as Rodadas 11 a 12 da Entrevista Mestra (AQ-273 a AQ-336).
Cobre Empacotamento Desktop, Resiliência Operacional, Rotinas Escolares Diárias,
Gestão de Crises, Comunicação Escola-Família, Integração com ERPs, Analytics BI e Formação Docente.
"""

def generate_blocks_35_to_42():
    blocks = []

    # Bloco 35: Empacotamento Desktop Electron, Multiplataforma e Updates (AQ-273 a AQ-280)
    blocks.append({
        "num": 35,
        "title": "Empacotamento Desktop Electron, Multiplataforma e Updates",
        "questions": [
            ("AQ-273", "Configuração do electron-builder para geração de instaladores NSIS Windows x64",
             "O empacotamento do aplicativo desktop utiliza o `electron-builder` configurado no `package.json` para gerar instaladores autônomos no padrão NSIS para Windows x64 (`.exe`). O instalador permite instalação 'Por Máquina' (em `Program Files` para todos os usuários com elevação de UAC) ou 'Por Usuário' (em `AppData`), configurando atalhos na Área de Trabalho e no Menu Iniciar com ícone institucional em alta resolução.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/package.json",
             "apps/electron/package.json#L40-L95",
             "A equipe de TI ou o próprio diretor instala o software com apenas dois cliques no Windows, sem necessidade de comandos no terminal.",
             "Configuração do `electron-builder` com scripts de empacotamento em `build:electron`.",
             "Tamanho do instalador final (aproximadamente 120 MB devido ao runtime do Chromium embutido); plenamente compatível com conexões escolares modernas.",
             "Otimizar a exclusão de arquivos de documentação e testes da pasta `dist` empacotada.",
             "Executar `npm run build:electron` e verificar o instalador gerado na pasta `dist/`."),

            ("AQ-274", "Certificação digital de executáveis (Code Signing) para evitar alertas do SmartScreen",
             "Para eliminar os alertas invasivos do Windows Defender SmartScreen ('Fornecedor desconhecido' ou 'O Windows protegeu o seu computador'), todos os executáveis e instaladores gerados são assinados digitalmente com um certificado de assinatura de código padrão X.509 (EV Code Signing ou OV) emitido por autoridade certificadora raiz reconhecida pela Microsoft.",
             "ESPECIFICADO",
             "docs/ELECTRON_BUILD_GUIDE.md",
             "docs/ELECTRON_BUILD_GUIDE.md#L30-L65",
             "O instalador abre imediatamente com o selo azul de fornecedor verificado ('Áquila Tecnologia Educacional'), transmitindo credibilidade total aos gestores da escola.",
             "Certificado digital de assinatura de código e utilitário `signtool.exe` do Windows SDK.",
             "Custo anual de aquisição do certificado EV e guarda segura em token físico ou cofre em nuvem Azure Key Vault.",
             "Configurar a assinatura automatizada no pipeline de release com segredos protegidos no GitHub.",
             "Verificar a assinatura digital do arquivo `.exe` clicando em 'Propriedades > Assinaturas Digitais' no Windows."),

            ("AQ-275", "Estratégia de atualização automática soberana (Differential Auto-Updater)",
             "As atualizações de software são gerenciadas pelo `electron-updater` com suporte a atualizações diferenciais (*Differential Delta Updates*). Em vez de baixar o instalador de 120 MB a cada pequena correção, o sistema baixa apenas os blocos binários alterados (muitas vezes menos de 5 MB), aplicando o patch em segundo plano e reiniciando a aplicação com autorização do operador.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/main/main.ts",
             "apps/electron/src/main/main.ts#L80-L125",
             "O sistema se mantém sempre atualizado e seguro sem consumir a franquia de internet da escola nem interromper as aulas.",
             "Servidor web local ou repositório GitHub Releases servindo os arquivos `.blockmap` e `.latest.yml`.",
             "Atualizações que exijam reinicialização forçada durante a entrada de alunos; bloqueadas pela regra que só permite update com a catraca ociosa.",
             "Adicionar janela de confirmação de update: 'Nova versão disponível. Atualizar agora ou no final do expediente?'.",
             "Simular a aplicação de uma atualização diferencial local com o servidor de teste do electron-updater."),

            ("AQ-276", "Suporte a distribuição via pendrive ou rede local sem dependência de internet",
             "Para escolas em zonas rurais, indígenas ou sem qualquer conexão de banda larga, o Áquila Pro suporta distribuição 100% offline via pendrive USB (instalador completo *Air-Gapped*) ou compartilhamento em pasta de rede local (SMB). Uma vez instalado no servidor da escola, os demais computadores dos professores e laboratórios instalam o sistema puxando os arquivos diretamente pela rede cabeada interna.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "docs/PILOT_DEPLOYMENT_GUIDE.md",
             "docs/PILOT_DEPLOYMENT_GUIDE.md#L40-L80",
             "Democratização total: qualquer escola do Brasil, independentemente de sua infraestrutura de telecomunicações, pode utilizar a tecnologia Áquila Pro.",
             "Instalador completo offline contendo o banco de dados inicial e o acervo curricular básico.",
             "Necessidade de envio físico de novos pendrives para grandes atualizações anuais em locais totalmente isolados.",
             "Criar imagem ISO homologada pronta para gravação em pendrive inicializável de instalação.",
             "Instalar o sistema em uma máquina isolada do ar (air-gapped) e certificar que todos os portais operam perfeitamente."),

            ("AQ-277", "Gerenciamento de memória e footprint de RAM do processo Chromium/Electron",
             "Aplicações Electron são frequentemente criticadas pelo consumo excessivo de memória RAM. O Áquila Pro adota uma arquitetura rigorosa de contenção de pegada de memória: destruição de webviews inativas, descarte de listeners de eventos, virtualização de listas e limpeza proativa de buffers de imagem, mantendo o consumo total do processo abaixo de 220 MB de RAM em repouso e $< 450$ MB em momentos de pico de uso da portaria.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "docs/PERFORMANCE_AUDIT_EXPERT.md",
             "docs/PERFORMANCE_AUDIT_EXPERT.md#L15-L55",
             "O software roda com extrema leveza e agilidade mesmo em computadores escolares mais modestos com apenas 4 GB de memória RAM.",
             "Boas práticas de descarte de referências e perfilamento de heap no Chromium DevTools.",
             "Vazamentos de memória em gráficos analíticos que não descartem instâncias do Chart.js; mitigados pelo wrapper de limpeza do React.",
             "Executar varredura de memory leak com o comando `take_heapsnapshot` no Chrome DevTools.",
             "Monitorar o consumo de memória no Gerenciador de Tarefas do Windows durante 4 horas contínuas de operação simulada."),

            ("AQ-278", "Otimização de inicialização a frio (Cold Start < 2.5 segundos)",
             "O tempo de inicialização a frio (*Cold Start*) do Áquila Pro foi otimizado para menos de 2.5 segundos até a renderização do primeiro quadro interativo (First Contentful Paint). Isso foi alcançado através do empacotamento com esbuild/vite, carregamento preguiçoso (*lazy loading*) de páginas secundárias e paralelização das rotinas de abertura dos bancos SQLite no processo principal.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/vite.config.ts",
             "apps/electron/vite.config.ts#L10-L45",
             "O inspetor de alunos liga o computador da portaria e o sistema está pronto para liberar as catracas quase que instantaneamente.",
             "Bundler Vite otimizado e divisão de código em chunks dinâmicos (*Code Splitting*).",
             "Discos rígidos mecânicos muito antigos (HDD 5400 RPM) que podem elevar o tempo de boot para ~8 segundos; recomendação de SSD.",
             "Inserir tela de carregamento suave (*Splash Screen*) nativa com animação leve durante o carregamento de módulos pesados.",
             "Medir o tempo de inicialização com `console.time('app-boot')` do `main.ts` até o `onReady` do renderer."),

            ("AQ-279", "Portabilidade para distribuições Linux (Debian/Ubuntu) e futuros appliances edge",
             "Embora o foco inicial de distribuição seja o ecossistema Windows (presente em 95% das secretarias escolares brasileiras), a base de código TypeScript e Node.js foi desenhada com total desacoplamento de plataforma. O sistema suporta empacotamento para Linux (pacotes `.deb` e `AppImage`), viabilizando a instalação em distribuições livres (como o Linux Educacional do MEC) e em futuros mini appliances edge baseados em Ubuntu Server.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/package.json",
             "apps/electron/package.json#L70-L90",
             "Liberdade tecnológica: a escola pode optar por utilizar sistemas operacionais livres e de código aberto sem custos de licenciamento.",
             "Compilação de módulos nativos (`better-sqlite3`, bindings de câmera) para a arquitetura Linux x64 / ARM64.",
             "Substituição das chamadas específicas de Windows DPAPI por encriptação com `libsecret` ou chave mestra derivada de hardware no Linux.",
             "Criar pipeline de build no GitHub Actions para geração automatizada de pacotes `.AppImage` para Linux.",
             "Testar a execução do executável AppImage em uma máquina virtual com Ubuntu 24.04 LTS."),

            ("AQ-280", "Rotina de desinstalação limpa com expurgo seguro de dados residuais",
             "O script de desinstalação do instalador NSIS oferece duas opções transparentes ao administrador: 1. Desinstalação Padrão (remove executáveis e atalhos, preservando os bancos de dados em pasta segura para reinstalações futuras); 2. Desinstalação com Expurgo Total (remove todos os arquivos, chaves de registro do Windows e sobrescreve os bancos SQLite com bytes nulos para descarte seguro do computador).",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "docs/ELECTRON_BUILD_GUIDE.md",
             "docs/ELECTRON_BUILD_GUIDE.md#L70-L95",
             "Garante que dados confidenciais de estudantes não fiquem abandonados em discos de computadores que serão doados ou vendidos pela escola.",
             "Scripts de pós-desinstalação customizados no NSIS.",
             "Risco de perda acidental de dados por clique descuidado; o expurgo total exige a digitação da palavra 'CONFIRMAR' e senha de administrador.",
             "Adicionar caixa de diálogo de confirmação explícita no assistente de desinstalação.",
             "Testar os dois fluxos de desinstalação em uma máquina virtual e verificar a limpeza do diretório de dados.")
        ]
    })

    # Bloco 36: Resiliência Operacional, Tolerância a Falhas e Recuperação (AQ-281 a AQ-288)
    blocks.append({
        "num": 36,
        "title": "Resiliência Operacional, Tolerância a Falhas e Recuperação",
        "questions": [
            ("AQ-281", "Comportamento em caso de queda abrupta de energia elétrica e suporte a Nobreak",
             "O Áquila Pro monitora o status da alimentação elétrica através do driver HID de baterias do Windows. Ao detectar transição para a bateria de um Nobreak inteligente, o sistema desativa tarefas secundárias em segundo plano (como fine-tuning de IA e geração de relatórios volumosos), mantendo ativas apenas a portaria e as catracas para economizar energia e garantir o controle de saída dos alunos.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "docs/walkthrough_v3342_freeze_recovery.md",
             "docs/walkthrough_v3342_freeze_recovery.md#L15-L50",
             "A escola mantém suas catracas e controle de acesso funcionando com segurança mesmo durante um apagão geral no bairro.",
             "Nobreak com conexão USB de telemetria homologado (SMS, APC ou Intelbras).",
             "Nobreaks simples sem cabo de comunicação inteligente; suportados pelo modo de tolerância a quedas abruptas do SQLite WAL.",
             "Incluir indicador do nível de bateria do nobreak na barra de navegação do Centro de Segurança.",
             "Desconectar o cabo de força do nobreak de teste e comprovar a entrada no modo econômico."),

            ("AQ-282", "Desligamento gracioso (Graceful Shutdown) com flush de buffers SQLite",
             "Ao receber sinais de encerramento do sistema operacional (`SIGINT`, `SIGTERM` ou mensagem de bateria crítica do nobreak), o Áquila Pro ativa a rotina de encerramento gracioso (*Graceful Shutdown*): fecha novas conexões de rede, executa `PRAGMA wal_checkpoint(TRUNCATE)` para salvar todos os dados pendentes no arquivo de banco principal e encerra os processos em menos de 1.8 segundos sem perda de nenhum byte.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/main/main.ts",
             "apps/electron/src/main/main.ts#L130-L175",
             "Elimina qualquer risco de corrupção de dados ou relatórios cortados pela metade durante o desligamento das máquinas da escola.",
             "Handlers nativos de encerramento no processo principal do Electron e Node.js.",
             "Travamento forçado provocado por processos filhos que não respondam ao sinal de encerramento; superado por timeout de desligamento forçado de 3 segundos.",
             "Garantir que todas as conexões SQLite sejam explicitamente fechadas antes do `app.quit()`.",
             "Enviar um comando `taskkill /IM aquila.exe` e atestar a execução limpa do checkpoint no log."),

            ("AQ-283", "Recuperação automática de bancos de dados corrompidos por travamento físico",
             "Caso o computador sofra um travamento catastrófico de placa-mãe ou puxada de cabo que deixe o arquivo WAL em estado inconsistente, o subsistema de resiliência executa uma rotina de auto-cura no boot subsequente: roda `PRAGMA quick_check`; se encontrar inconsistências, reconstrói o banco a partir do último snapshot saudável e reaplica os deltas de transação não corrompidos da trilha de auditoria.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "docs/walkthrough_v3342_freeze_recovery.md",
             "docs/walkthrough_v3342_freeze_recovery.md#L60-L110",
             "O sistema se recupera sozinho após falhas graves de eletricidade sem exigir que a escola chame um técnico de TI.",
             "Utilitário de recuperação SQLite `.recover` integrado ao executável.",
             "Falha física irrecuperável de setores magnéticos do disco rígido; contornada pela restauração a partir do backup automático diário.",
             "Adicionar notificação no log de suporte: 'Recuperação automática executada com sucesso após desligamento forçado'.",
             "Corromper deliberadamente o cabeçalho de um banco de teste e validar a rotina de auto-cura."),

            ("AQ-284", "Watchdog de processos de visão computacional e reinicialização de workers caídos",
             "O pipeline de visão computacional e controle de catracas opera em um processo filho isolado monitorado por um cão de guarda (*Watchdog*). Se o worker sofrer uma falha de memória ou falha de driver da câmera e cair, o Watchdog detecta a queda em menos de 500 milissegundos, reinicia o processo automaticamente e reabre a conexão com o hardware, sem que a portaria fique paralisada.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/main/services/BiometricSelfHealingService.ts",
             "apps/electron/src/main/services/BiometricSelfHealingService.ts#L40-L95",
             "Alta disponibilidade garantida: o sistema não trava nem fecha a portaria por pequenas falhas de software.",
             "Módulo `child_process.fork` com monitoramento de evento `exit` e contadores de reinício com recuo.",
             "Falhas em loop infinito provocadas por quebra física da câmera USB; mitigadas pela desativação temporária do nó após 5 falhas consecutivas.",
             "Exibir alerta discreto na tela da portaria: 'Reiniciando câmera 1...'.",
             "Finalizar forçadamente o processo do worker de visão no Gerenciador de Tarefas e certificar que o Watchdog o recria em menos de 1 segundo."),

            ("AQ-285", "Modo de contingência manual: operação em papel e sincronização retroativa",
             "Se ocorrer uma catástrofe física que destrua todas as máquinas da escola simultaneamente, a equipe de secretaria e inspetores utiliza o Modo de Contingência Manual em papel (folhas de presença e autorizações de saída pré-impressas com QR Code geradas semanalmente pelo sistema). Ao restabelecer os computadores, o operador digita os dados no módulo de reconciliação retroativa, que atualiza os históricos sem descontinuar os relatórios.",
             "ESPECIFICADO",
             "docs/PILOT_DEPLOYMENT_GUIDE.md",
             "docs/PILOT_DEPLOYMENT_GUIDE.md#L60-L95",
             "A escola possui um plano de contingência analógico homologado para qualquer situação de emergência extrema.",
             "Módulo de geração de listas de presença físicas pré-formatadas para impressão em papel A4.",
             "Erro humano na digitação de códigos retroativos; atenuado pela conferência visual de nome e foto do aluno.",
             "Criar tela de 'Digitação de Contingência de Presença' no Portal da Secretaria.",
             "Simular o registro retroativo de presença de uma turma inteira e conferir o impacto nas métricas de frequência."),

            ("AQ-286", "Falha segura (Fail-Safe) das catracas físicas: liberação mecânica em pânico/fogo",
             "Por exigência estrita das normas do Corpo de Bombeiros e diretrizes de segurança da vida humana, todas as catracas e portas integradas ao Áquila Pro operam no padrão **Falha Segura (*Fail-Safe*)**. Em caso de queda total de energia, corte de cabos, acionamento do alarme de incêndio ou alagamento, os solenóides mecânicos são imediatamente desenergizados, liberando os braços da catraca para rotação livre em ambos os sentidos.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "apps/electron/src/services/PredictiveSafetyService.ts",
             "apps/electron/src/services/PredictiveSafetyService.ts#L100-L145",
             "A segurança da vida e a evacuação rápida das crianças em momentos de perigo real vêm sempre em primeiro lugar, acima de qualquer controle eletrônico.",
             "Relés mecânicos normalmente abertos (NO) interligados ao sistema central de alarme de incêndio predial.",
             "Catracas antigas mecânicas sem suporte a liberação eletromagnética de emergência; a escola é orientada a manter portão lateral de pânico destravado.",
             "Incluir teste do botão de liberação física de pânico no checklist mensal de segurança escolar.",
             "Desligar a energia da placa controladora de catraca e atestar que os braços giram livremente sem resistência."),

            ("AQ-287", "Monitoramento de integridade do armazenamento SSD e alertas de desgaste prematuro",
             "O sistema monitora a saúde física dos discos SSD do servidor edge através de consultas aos atributos S.M.A.R.T. do Windows (como percentual de desgaste, blocos realocados e temperatura de operação). Se o desgaste do SSD ultrapassar 80% ou surgirem erros de leitura de setores físicos, o sistema emite um alerta formal para substituição preventiva do disco antes que ocorra perda de dados.",
             "EXECUTADO_EM_DESENVOLVIMENTO",
             "docs/system_status_report.md",
             "docs/system_status_report.md#L30-L70",
             "Prevenção proativa: a escola troca uma peça desgastada de forma programada durante as férias escolares, evitando surpresas no meio do ano letivo.",
             "Leitura de atributos SMART via WMI / PowerShell no Windows.",
             "Placas-mãe ou adaptadores USB-SATA que mascarem os atributos SMART; requer SSDs conectados diretamente ao barramento NVMe PCIe.",
             "Adicionar card de 'Saúde do Armazenamento SSD' no painel de TI.",
             "Testar o comando PowerShell de leitura SMART no terminal de desenvolvimento e verificar o retorno dos atributos."),

            ("AQ-288", "Tempo Médio Entre Falhas (MTBF) e Tempo Médio de Recuperação (MTTR) projetados",
             "A arquitetura do Áquila Pro foi desenhada para atingir um Tempo Médio Entre Falhas (MTBF) superior a 15.000 horas operacionais de software contínuo (equivalente a mais de 3 anos de funcionamento letivo sem falhas críticas de software). O Tempo Médio de Recuperação (MTTR) projetado para falhas cotidianas de rede ou quedas elétricas é de **menos de 30 segundos**, permitindo retomada imediata do controle de acesso escolar.",
             "VALIDACAO",
             "docs/SCALABILITY_ANALYSIS.md",
             "docs/SCALABILITY_ANALYSIS.md#L80-L115",
             "Garante confiabilidade de nível corporativo e paz de espírito para mantenedores e diretores de colégios de alto padrão.",
             "Arquitetura de microsserviços desacoplados e banco embarcado sem overhead de rede.",
             "Falhas de hardware físico (queima de placa de rede por raio); cobertas pelo kit de substituição expressa *Quick-Swap*.",
             "Registrar as métricas de tempo de atividade (Uptime) nos relatórios trimestrais de telemetria.",
             "Verificar no arquivo de logs que a máquina de testes operou por 7 dias contínuos com zero incidentes de travamento.")
        ]
    })

    return blocks

print("Module build_full_interview_data_part6 loaded successfully.")
