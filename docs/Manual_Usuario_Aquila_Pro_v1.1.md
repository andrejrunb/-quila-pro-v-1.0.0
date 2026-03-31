# Manual do Usuário - Sistema Áquila Pro (v1.1)

Bem-vindo ao **Sistema Áquila Pro**, a plataforma definitiva para monitoramento, segurança escolar e gestão de presença via reconhecimento facial. Este manual abrange a inicialização, configuração, operação diária e os novos módulos financeiros e pedagógicos da V3.

***

## 1. Primeiros Passos e Instalação

### Requisitos Iniciais

Antes de iniciar o Áquila Pro, recomenda-se consultar a **Calculadora de Hardware** embutida (Acessível na tela de ferramentas) para garantir que seu servidor/computador atenda aos requisitos para a quantidade de Câmeras e Alunos da sua instituição.

1. **Instalação:** Execute o instalador `AquilaPro-Setup.exe`.
2. **Primeiro Acesso:** O sistema criará automaticamente seu banco de dados local seguro (criptografado com chave de hardware AES-256-GCM).
3. **Login:** Utilize as credenciais de administrador fornecidas pela equipe de implantação.

***

## 2. Instalação de Câmeras Compatíveis (Tapo e similares)

> **💡 Por que câmeras Tapo?**
> Câmeras ip de baixo custo como as da linha **TP-Link Tapo** (C100, C110, C120, C210, C310…) são a opção mais viável para escolas com orçamento limitado. Custam entre **R$ 120 e R$ 300**, têm suporte nativo a RTSP (protocolo usado pelo Áquila Pro) e não dependem de DVR ou NVR — basta Wi-Fi e energia.

---

### Modelos Recomendados

| Modelo | Resolução | Visão Noturna | Preço médio | Observação |
|---|---|---|---|---|
| Tapo C100 | 1080p HD | Sim (IR) | ~R$ 130 | Ideal para internas |
| Tapo C110 | 3MP | Sim (IR) | ~R$ 150 | Boa relação custo/benefício |
| Tapo C210 | 2K (3MP) Pan/Tilt | Sim | ~R$ 180 | Cobre áreas amplas (pátios) |
| Tapo C310 | 1080p | Sim | ~R$ 170 | Para uso externo/tempo real |
| Intelbras VIP 1020 | 1080p | Sim | ~R$ 200 | Alternativa nacional compatível |

---

### Passo a Passo: Configurar a Tapo para o Áquila Pro

#### 1. Instale e conecte a câmera ao Wi-Fi
- Baixe o app **Tapo** (iOS ou Android)
- Siga o assistente de configuração dentro do app até a câmera aparecer no mapa da casa

#### 2. Ative o protocolo RTSP
1. No app Tapo, toque na câmera → ícone ⚙️ **Configurações**
2. Acesse **Configurações Avançadas → Informações da câmera**
3. Ative a opção **Stream de Vídeo RTSP**
4. Crie um **usuário local** (ex: `admin`) e uma **senha local** (diferente da senha da conta Tapo)
   - ⚠️ Anote essas credenciais — são necessárias para a URL RTSP

#### 3. Descubra o IP da câmera
- No app Tapo → Configurações → **Informações do Dispositivo** → copie o **Endereço IP** (ex: `192.168.18.7`)
- Ou acesse o painel do seu roteador para verificar os dispositivos conectados

#### 4. Monte a URL RTSP
Use o seguinte formato para cadastrar a câmera no Áquila Pro:

```
rtsp://USUARIO:SENHA@IP_DA_CAMERA:554/stream1
```

**Exemplos práticos:**
```
# Stream principal (Full HD)
rtsp://admin:minhasenha@192.168.18.7:554/stream1

# Stream secundário (menor resolução, mais ágil)
rtsp://admin:minhasenha@192.168.18.7:554/stream2
```

#### 5. Cadastre no Áquila Pro
1. Acesse **Configuração de Câmeras** no menu lateral
2. Clique em **Adicionar Câmera**
3. Preencha: nome, a URL RTSP acima, e a sala onde está instalada
4. Clique em **Testar** para confirmar a conexão antes de salvar

---

### Solução de Problemas Comuns

| Problema | Solução |
|---|---|
| "Câmera offline" | Verifique se o IP mudou (use IP fixo no roteador/DHCP estático) |
| Ping não responde (192.168.x.x inacessível) | A câmera pode estar em outra sub-rede. Conecte-a ao mesmo Wi-Fi do computador |
| Stream não abre | Confirme usuário/senha locais (não é a senha da conta Tapo) |
| RTSP desativado | Repita o passo 2: o app às vezes desativa após atualizações de firmware |
| Câmera reiniciando sozinha | Excesso de dispositivos no Wi-Fi — considere um ponto de acesso dedicado para câmeras |

---

### Dica de Rede para Escolas

Para evitar conflito de IPs e quedas, configure um **IP fixo** para cada câmera no roteador (reserva DHCP por MAC Address). Isso garante que o Áquila Pro sempre encontrará a câmera no mesmo endereço, mesmo após quedas de energia ou reinicializações.

```
Exemplo de organização de IPs:
192.168.1.100 → Câmera Portaria
192.168.1.101 → Câmera Corredor A
192.168.1.102 → Câmera Pátio
192.168.1.103 → Câmera Sala 101
```

***

## 3. Gestão de Salas e Câmeras (Rooms Management)

O gerenciamento de espaços físicos é a base do monitoramento ativo.

* **Adicionar uma Nova Sala:** Navegue até "Salas" no menu lateral. Clique em "Nova Sala". Insira o nome, localização, capacidade e associe as câmeras instaladas no espaço.
* **Associação de Câmeras:** O Áquila Pro permite associar múltiplas câmeras (via protocolo RTSP) a um mesmo ambiente para cobertura total.
* **Edição e Exclusão:** As salas podem ser inativadas ou excluídas, porém o histórico de auditoria e presenças passadas da sala será mantido no banco de dados.

***

## 3. Reconhecimento Facial e Controle de Acesso

O coração do sistema é o motor de IA híbrido que executa inferências de vídeo localmente.

* **Matrícula Facial (Enrollment):** Na aba de estudantes, acesse o perfil de um aluno e capture ou envie uma foto. A face é transformada em um *vetor numnumeric irreversível de 128 dimensões* (embedding) para proteger a privacidade. **A imagem original não é armazenada** após o processamento.
* **Alertas de Presença:** O sistema reconhece a entrada e saída e notifica automaticamente a chegada através do painel de controle.
* **Pessoas Desconhecidas:** A detecção de rostos ausentes no banco de dados dispara alertas do tipo "Pessoa Desconhecida", garantindo respostas rápidas da equipe de segurança.

***

## 4. Integração com WhatsApp (WhatsApp Queue)

A comunicação com os responsáveis é vital para o ecossistema Áquila.

* **Limites de Envio:** Dependendo do plano (Essencial vs. Pro), o despachante de mensagens aplicará *Rate Limiting* rigoroso para evitar bloqueios no WhatsApp.
* **Motor LGPD Automático:** Antes do envio da notificação pelo WhatsApp, os dados são interceptados por um filtro da LGPD residente no sistema que garante o envio apenas de texto puro, *nunca* biometrias ou fotos, aos pais ou responsáveis.
* **Relatórios e Filas:** Mensagens que não puderam ser entregues por erro de rede serão enfileiradas novamente com limite de até 3 tentativas.

***

## 5. Hub de Alertas de Segurança

Painel onde incidentes do dia a dia são logados de forma contínua.

* Através desse motor, alertas como abandono de salas ou lotação excessiva aparecem na interface.
* Os alertas são divididos por grau de criticidade (Baixo, Médio, Crítico). É dever da inspetoria ou da direção analisar e dar como "Lido" e "Solucionado" cada incidente no terminal de gestão.

* Em conformidade com auditoria, administradores podem requerer exportação dos logs na área de segurança do software.

***

## 7. Diário de Classe Digital (Teacher UX)

Módulo exclusivo para professores e coordenadores pedagógicos.

* **Chamada Inteligente:** O sistema pré-preenche a presença baseada no reconhecimento facial das câmeras. O professor apenas confirma ou ajusta casos excepcionais.
* **Registros Pedagógicos:** Permite anotar ocorrências, observações de comportamento e desempenho acadêmico diretamente no tablet ou desktop.
* **Sincronização:** Dados salvos localmente são sincronizados com a nuvem Áquila de forma segura.

***

## 8. Gestão Financeira e Pagamentos Pix

Integração direta entre presença e sustentabilidade financeira.

* **Dashboard Financeiro:** Visualize inadimplência, receitas pendentes e faturamento em tempo real.
* **Mensalidades & Pix:** Emissão de cobranças com QR Code Pix para pagamento instantâneo pelos pais via app.
* **Bloqueio Inteligente:** Configuração de restrição de acesso em catracas para alunos com pendências financeiras críticas (opcional por unidade).

***

## 9. Central de Relatórios V3 (PDF/Excel)

Motor de exportação enterprise para auditorias e reuniões de pais.

* **Relatórios Multimídia:** Gere arquivos PDF com fotos de presença ou planilhas Excel detalhadas com métricas de assiduidade bimestral.
* **Filtros Avançados:** Exporte por Turma, Aluno, Período ou Nível de Acesso.

***

## 10. Gestão Multi-Unidade (Network/Tenant)

Para redes de ensino e franquias.

* **Visão Consolidada:** Administradores de rede podem alternar entre unidades escolares (Matriz/Filiais) em um único clique.
* **Políticas Globais:** Defina regras de segurança e horários que se aplicam a todas as escolas da rede simultaneamente.

***

## 11. Aplicativo de Pais (Áquila Mobile)

Acompanhamento na palma da mão.

* **Timeline:** Feed em tempo real com notificações push "Seu filho(a) entrou na escola".
* **Drive-Thru Automático:** O app avisa a portaria quando o pai está a 500m da escola para agilizar a saída.

### 5. Portaria & Visitantes (V3 Enterprise)

Controle total de quem entra e sai da instituição.

* **Modo Totem:** Autoatendimento para visitantes com captura de foto e emissão de crachá térmico.
* **Gestão de Crachás:** Impressão automática de etiquetas para identificação visual imediata.
* **Histórico de Visitas:** Registro completo de CPF, motivo e tempo de permanência.

### 6. Inteligência Áquila (IA & ML)

O Áquila Pro V3 utiliza inteligência artificial para antecipar problemas.

* **Evasão Preditiva (ML):** O sistema analisa padrões de faltas e atrasos para calcular o risco de abandono escolar.
* **AI Oraculum:** Gera resumos semanais humanizados para os pais, facilitando a comunicação escola-família.
* **Relatórios Táticos:** Briefings automáticos para diretores com métricas de saúde financeira e operacional.
