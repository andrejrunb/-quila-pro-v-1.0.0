# ⚙️ Áquila Pro v2.0 - Arquitetura e Especificações Técnicas (Whitepaper)

## 1. Visão Geral (Sovereign Architecture)
O **Áquila Pro** não é apenas um software de gestão; é um ecossistema operacional militarizado focado em **Educação Baseada em Dados (Data-Driven)** e **Soberania LGPD**. 
A arquitetura *Offline-First (Air-Gapped by Design)* garante que o sistema pode operar em infraestruturas brasileiras de baixa conectividade, sem depender da nuvem para processos core.

## 2. Stack Tecnológico Fundamental
- **Motor de Interface (Front-End):** Electron.js acoplado com React 18 e Vite. Interface renderizada em 60 FPS utilizando *Glassmorphism* (Elite Design System).
- **Gêmeo Digital 3D:** Renderização de matrizes escolares isotrópicas via `react-three/fiber` (WebGL) para controle espacial de pátios e salas.
- **Banco de Dados (Cofre Local):** SQLite criptografado (AES-256) nativo.
- **Processamento de Visão Computacional (Motores Python):**
  - *FaceRecognition Engine:* Utiliza **ArcFace (InsightFace)** gerando embeddings matemáticos de 512 dimensões (alta precisão para catracas e chamadas automáticas).
  - *Spatial Engine:* **YOLOv8** para detecção de aglomerações e incidentes de segurança escolar.
  - *OMR Scanner:* Correção óptica de gabaritos em massa baseada em **OpenCV**.
- **Infraestrutura Híbrida (ColabGpuBridge):** O sistema detecta a ausência de placas de vídeo (NPU/GPU) no computador da secretaria e *transfere* a carga massiva de tensores para instâncias gratuitas no Google Colab, retornando apenas os bytes vitais (Zero-Lag Architecture).

## 3. Segurança e Governança Forense (LGPD Mastery)
O Áquila Pro foi desenhado para ser invulnerável juridicamente:
- **MerkleAuditChain:** Toda alteração de nota, acesso a dossiês ou disparo biométrico gera um *hash* irreversível. Uma árvore de Merkle prova matematicamente que o histórico não foi adulterado.
- **Expurgo Irreversível (Right to be Forgotten):** Quando um aluno conclui o curso, suas fotos brutas são carbonizadas instantaneamente pelo motor, mantendo apenas vetores numéricos anônimos para fins estatísticos (Anonimização Absoluta).
- **Google Drive Vault (Encrypted Sync):** Backup em nuvem com criptografia na origem. O pacote sobe selado (AES-GCM), impossibilitando leitura pelos servidores da Big Tech.

## 4. Ecossistema Neural
- **Motor Preditivo de Evasão (`DropoutRiskEngine`):** Redes heurísticas que correlacionam faltas, queda de notas e humor detectado para calcular a probabilidade (0-100%) de abandono escolar.
- **Sociometria Computacional (`SociometryEngine`):** Mapeamento de grafos de convivência. Identifica alunos isolados socialmente (vítimas silenciosas de bullying) baseando-se em afinidade espacial e colaboração em grupos.
- **WhatsApp Neural (`EagleMessenger`):** Bot automatizado integrado via bridge local para comunicação passiva com responsáveis, envio de boletos automáticos (n8n hooks) e CSAT (Pesquisas de Satisfação).

## 5. Deployment
Compilado em executáveis auto-contidos (`.exe` NSIS) sem dependências externas. Inicialização de *Cold Boot* em menos de 2.5 segundos. 
