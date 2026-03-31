# 🧪 Guia de Instalação e Teste Local - Áquila Pro

## Objetivo

Testar o sistema Áquila Pro localmente com:

- ✅ Webcam do notebook

- ✅ IP Camera de suporte

- ✅ Cadastro de emails de pais e coordenação

- ✅ Cadastro de rostos e portas

- ✅ Detecção de reconhecimento facial

- ✅ Sistema de comunicação (SMS/Email)

---

## 📋 Pré-Requisitos

### Hardware

- **Notebook** com Windows/Mac/Linux

- **Webcam integrada** (ou USB)

- **IP Camera** (recomendado: Hikvision, Dahua, Intelbras, ou similar)

- **Conexão de rede** (WiFi ou Ethernet)

- **Mínimo 8GB RAM** (recomendado 16GB)

- **SSD com 50GB livres**

### Software

- **Node.js 22+** ([https://nodejs.org](https://nodejs.org) )

- **Python 3.11+** ([https://python.org](https://python.org) )

- **Git** ([https://git-scm.com](https://git-scm.com) )

- **Docker** (opcional, mas recomendado)

- **Visual Studio Code** (recomendado)

### Contas Necessárias

- **OpenAI API Key** (para análise de IA)

- **SendGrid API Key** (para envio de emails)

- **Twilio Account** (para SMS)

- **Gmail App Password** (alternativa para email)

---

## 🚀 Passo a Passo de Instalação

### Fase 1: Preparar o Ambiente

#### 1.1 Instalar Node.js e Python

```python
# Verificar versões
node --version    # Deve ser v22+
npm --version     # Deve ser 10+
python3 --version # Deve ser 3.11+
```

#### 1.2 Clonar o Repositório

```python
# Criar pasta para o projeto
mkdir ~/aquila-pro-local
cd ~/aquila-pro-local

# Clonar (você receberá o link do repositório)
git clone <seu-repositorio-aquila> .
```

#### 1.3 Instalar Dependências

```bash
# Instalar dependências do Node
npm install
# ou
pnpm install

# Instalar dependências do Python (para processamento de vídeo)
pip install opencv-python
pip install face-recognition
pip install numpy
pip install pillow
```

---

### Fase 2: Configurar Banco de Dados Local

#### 2.1 Instalar MySQL/MariaDB

```bash
# Windows: Baixar de https://dev.mysql.com/downloads/mysql/
# Mac: brew install mysql
# Linux: sudo apt-get install mysql-server

# Iniciar serviço
# Windows: Services > MySQL80
# Mac: brew services start mysql
# Linux: sudo service mysql start
```

#### 2.2 Criar Banco de Dados

```bash
# Conectar ao MySQL
mysql -u root -p

# Criar banco
CREATE DATABASE aquila_pro_local;
CREATE USER 'aquila'@'localhost' IDENTIFIED BY 'senha123';
GRANT ALL PRIVILEGES ON aquila_pro_local.* TO 'aquila'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 2.3 Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env.local na raiz do projeto
cat > .env.local << EOF
# Database
DATABASE_URL=mysql://aquila:senha123@localhost:3306/aquila_pro_local

# JWT
JWT_SECRET=sua-chave-secreta-super-segura-aqui

# OpenAI (para análise de IA )
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# SendGrid (para emails)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx

# Twilio (para SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxx

# Manus OAuth (deixar como está para testes locais)
VITE_APP_ID=local-test
OAUTH_SERVER_URL=http://localhost:3000
VITE_OAUTH_PORTAL_URL=http://localhost:3000

# Configurações Locais
NODE_ENV=development
PORT=3000
EOF
```

#### 2.4 Executar Migrações

```bash
# Sincronizar schema com banco
npm run db:push
```

---

### Fase 3: Configurar Câmeras

#### 3.1 Configurar Webcam do Notebook

```bash
# A webcam é detectada automaticamente como /dev/video0 (Linux )
# ou COM1 (Windows) ou /dev/video0 (Mac)

# Testar webcam com Python
python3 << 'EOF'
import cv2
cap = cv2.VideoCapture(0)
if cap.isOpened():
    print("✅ Webcam detectada!")
    ret, frame = cap.read()
    print(f"Resolução: {frame.shape}")
    cap.release()
else:
    print("❌ Webcam não detectada")
EOF
```

#### 3.2 Configurar IP Camera

```bash
# Descobrir IP da câmera na rede
# Opção 1: Verificar roteador WiFi
# Opção 2: Usar app do fabricante (Hikvision, Dahua, etc)
# Opção 3: Usar nmap
nmap -p 8000-8100 192.168.1.0/24

# Testar conexão com IP Camera
python3 << 'EOF'
import cv2

# Substituir com dados da sua câmera
ipcam_url = "rtsp://admin:12345@192.168.1.100:554/stream1"
# ou
# ipcam_url = "http://192.168.1.100:8080/video"

cap = cv2.VideoCapture(ipcam_url )
if cap.isOpened():
    print("✅ IP Camera conectada!")
    ret, frame = cap.read()
    print(f"Resolução: {frame.shape}")
    cap.release()
else:
    print("❌ IP Camera não conectada")
EOF
```

#### 3.3 Configurar URLs das Câmeras no Sistema

```bash
# Adicionar ao .env.local
cat >> .env.local << EOF

# Câmeras
WEBCAM_URL=0
IPCAM_URL=rtsp://admin:12345@192.168.1.100:554/stream1
IPCAM_NAME=Corredor Principal
EOF
```

---

### Fase 4: Iniciar o Sistema

#### 4.1 Iniciar Dev Server

```bash
# Terminal 1: Backend
npm run dev

# Aguardar até ver: "Server running on http://localhost:3000/"
```

#### 4.2 Acessar Interface Web

```bash
# Abrir no navegador
http://localhost:3000

# Você verá:
# - Home page do Áquila Pro
# - Painel de Administração
# - Dashboard de Coordenação
```

---

### Fase 5: Cadastrar Dados de Teste

#### 5.1 Cadastrar Escola

```
1. Acesse: http://localhost:3000/admin/schools
2. Clique em "Nova Escola"
3. Preencha:
   - Nome: "Escola Teste"
   - Endereço: "Seu Endereço"
   - Telefone: "+55 (11 ) 99999-9999"
4. Salve
```

#### 5.2 Cadastrar Período Letivo

```
1. Acesse: http://localhost:3000/admin/periods
2. Clique em "Novo Período"
3. Preencha:
   - Nome: "1º Bimestre 2026"
   - Data Início: 2026-02-01
   - Data Fim: 2026-04-30
   - Status: Ativo
4. Salve
```

#### 5.3 Cadastrar Turma

```
1. Acesse: http://localhost:3000/admin/classes
2. Clique em "Nova Turma"
3. Preencha:
   - Nome: "7º Ano A"
   - Período: "1º Bimestre 2026"
   - Quantidade de Alunos: 30
4. Salve
```

#### 5.4 Cadastrar Salas

```
1. Acesse: http://localhost:3000/admin/rooms
2. Clique em "Nova Sala"
3. Preencha para cada sala:
   - Nome: "Sala 101"
   - Câmera: "Corredor Principal"
   - Tipo: "Sala de Aula"
4. Salve
```

#### 5.5 Cadastrar Alunos

```
1. Acesse: http://localhost:3000/admin/students
2. Clique em "Novo Aluno"
3. Preencha:
   - Nome: "João Silva"
   - Matrícula: "2026001"
   - Turma: "7º Ano A"
   - Email Responsável: "joao.pai@email.com"
   - Telefone Responsável: "+55 (11 ) 98765-4321"
4. Salve
5. Repita para 3-5 alunos de teste
```

#### 5.6 Cadastrar Coordenadores

```
1. Acesse: http://localhost:3000/admin/coordinators
2. Clique em "Novo Coordenador"
3. Preencha:
   - Nome: "Maria Coordenadora"
   - Email: "maria@escola.com.br"
   - Telefone: "+55 (11 ) 97777-7777"
   - Escola: "Escola Teste"
4. Salve
```

#### 5.7 Cadastrar Grades Horárias

```
1. Acesse: http://localhost:3000/admin/schedules
2. Clique em "Nova Grade"
3. Preencha:
   - Turma: "7º Ano A"
   - Período: "1º Bimestre 2026"
   - Segunda: 07:30 - 12:00
   - Terça: 07:30 - 12:00
   - ... (repita para todos os dias )
4. Salve
```

---

### Fase 6: Testar Reconhecimento Facial

#### 6.1 Cadastrar Rostos dos Alunos

```
1. Acesse: http://localhost:3000/admin/students/2026001/photos
2. Clique em "Adicionar Foto"
3. Escolha a opção:
   - "Capturar da Webcam" (recomendado para teste )
   - ou "Upload de Arquivo"
4. Posicione o rosto na frente da webcam
5. Clique em "Capturar"
6. Salve
7. Repita para cada aluno
```

#### 6.2 Testar Detecção em Tempo Real

```
1. Acesse: http://localhost:3000/admin/detection-test
2. Selecione a câmera: "Webcam"
3. Clique em "Iniciar Detecção"
4. Posicione-se na frente da webcam
5. Você verá:
   - Caixa verde ao redor do seu rosto
   - Nome do aluno (se reconhecido )
   - Timestamp de detecção
6. Clique em "Parar Detecção"
```

---

### Fase 7: Testar Sistema de Eventos

#### 7.1 Simular Entrada de Aluno

```
1. Acesse: http://localhost:3000/admin/tracking-test
2. Clique em "Simular Entrada"
3. Selecione:
   - Aluno: "João Silva"
   - Horário: 07:45 (atrasado )
   - Sala: "Sala 101"
4. Clique em "Registrar"
5. Você verá:
   - Evento registrado no banco
   - Alerta de atraso gerado (se configurado)
```

#### 7.2 Simular Saída de Sala

```
1. Clique em "Simular Saída"
2. Selecione:
   - Aluno: "João Silva"
   - Horário: 10:30
   - Sala: "Sala 101"
   - Motivo: "Banheiro"
3. Clique em "Registrar"
4. Você verá:
   - Evento registrado
   - Tempo fora da sala calculado
```

#### 7.3 Simular Falta

```
1. Clique em "Simular Falta"
2. Selecione:
   - Aluno: "João Silva"
   - Data: 2026-03-02
   - Período: "Manhã"
3. Clique em "Registrar"
```

---

### Fase 8: Testar Sistema de Comunicação

#### 8.1 Testar Envio de Email

```
1. Acesse: http://localhost:3000/admin/notifications-test
2. Clique em "Enviar Email de Teste"
3. Preencha:
   - Destinatário: "joao.pai@email.com"
   - Assunto: "Teste Áquila Pro"
   - Mensagem: "Seu filho João teve 2 atrasos hoje"
4. Clique em "Enviar"
5. Verifique a caixa de entrada (pode levar 1-2 minutos )
```

#### 8.2 Testar Envio de SMS

```
1. Clique em "Enviar SMS de Teste"
2. Preencha:
   - Telefone: "+55 (11) 98765-4321"
   - Mensagem: "João chegou atrasado às 07:45"
3. Clique em "Enviar"
4. Você receberá o SMS no celular
```

#### 8.3 Testar Alertas Automáticos

```
1. Acesse: http://localhost:3000/admin/alerts-test
2. Clique em "Gerar Alertas"
3. Selecione:
   - Período: "1º Bimestre 2026"
   - Turma: "7º Ano A"
4. Clique em "Processar"
5. Você verá:
   - Alertas gerados para alunos com padrões anormais
   - Emails enviados automaticamente
   - SMS enviados (se configurado )
```

---

### Fase 9: Testar Portfólio do Aluno

#### 9.1 Visualizar Portfólio

```
1. Acesse: http://localhost:3000/admin/students/2026001/portfolio
2. Você verá:
   - Resumo: Total de atrasos, faltas, tempo fora
   - Gráficos: Distribuição de tempo
   - Histórico: Tabela com todos os eventos
   - Comparativos: Posição na turma
   - Alertas: Recomendações automáticas
```

#### 9.2 Gerar Relatório para Pais

```
1. Clique em "Gerar Relatório"
2. Selecione:
   - Formato: PDF
   - Período: "1º Bimestre 2026"
3. Clique em "Baixar"
4. Você receberá um PDF com:
   - Gráficos de desempenho
   - Comparativos com turma
   - Recomendações pedagógicas
```

---

### Fase 10: Testar Painel de Coordenação

#### 10.1 Acessar Dashboard

```
1. Acesse: http://localhost:3000/admin/coordination
2. Você verá:
   - Estatísticas: Total de alunos, presentes, atrasados, ausentes
   - Mapa da escola: Localização dos alunos
   - Alertas pendentes: Lista de alertas não lidos
   - Insights críticos: Padrões de comportamento
```

#### 10.2 Revisar e Enviar Alertas

```
1. Clique na aba "Alertas Pendentes"
2. Selecione um alerta
3. Revise as informações
4. Clique em "Enviar para Pais"
5. Você verá confirmação de envio
```

---

## 🔧 Troubleshooting

### Problema: Webcam não funciona

```bash
# Verificar permissões (Linux )
sudo usermod -a -G video $USER
# Reiniciar

# Verificar drivers (Windows)
# Abrir Device Manager > Câmeras > Atualizar driver
```

### Problema: IP Camera não conecta

```bash
# Verificar conectividade
ping 192.168.1.100

# Testar URL RTSP
ffmpeg -rtsp_transport tcp -i rtsp://admin:12345@192.168.1.100:554/stream1 -t 5 test.mp4

# Verificar credenciais (padrão geralmente é admin/admin)
```

### Problema: Banco de dados não conecta

```bash
# Verificar se MySQL está rodando
mysql -u aquila -p -h localhost

# Verificar DATABASE_URL no .env.local
# Formato correto: mysql://usuario:senha@host:porta/banco
```

### Problema: Emails não enviam

```bash
# Verificar SendGrid API Key
# Testar com curl
curl --request POST \
  --url https://api.sendgrid.com/v3/mail/send \
  --header "Authorization: Bearer $SENDGRID_API_KEY" \
  --header 'Content-Type: application/json'

# Verificar logs
npm run dev 2>&1 | grep -i email
```

### Problema: Reconhecimento facial não funciona

```bash
# Verificar se face_recognition está instalado
python3 -c "import face_recognition; print('OK' )"

# Verificar se OpenCV está instalado
python3 -c "import cv2; print(cv2.__version__)"

# Testar com imagem de teste
python3 << 'EOF'
import face_recognition
image = face_recognition.load_image_file("test.jpg")
face_locations = face_recognition.face_locations(image)
print(f"Rostos encontrados: {len(face_locations)}")
EOF
```

---

## 📊 Dados de Teste Recomendados

### Alunos

```
1. João Silva - 2026001 - joao.pai@email.com - +55 11 98765-4321
2. Maria Santos - 2026002 - maria.mae@email.com - +55 11 97654-3210
3. Pedro Oliveira - 2026003 - pedro.pai@email.com - +55 11 96543-2109
4. Ana Costa - 2026004 - ana.mae@email.com - +55 11 95432-1098
5. Lucas Ferreira - 2026005 - lucas.pai@email.com - +55 11 94321-0987
```

### Coordenadores

```
1. Maria Coordenadora - maria@escola.com.br - +55 11 97777-7777
2. João Diretor - joao@escola.com.br - +55 11 96666-6666
```

### Horários (Exemplo)

```
Segunda a Sexta:
- Entrada: 07:30
- Intervalo: 09:30 - 09:45
- Saída: 12:00
```

---

## ✅ Checklist de Teste

- [ ] Webcam detectada e funcionando

- [ ] IP Camera conectada e transmitindo

- [ ] Banco de dados criado e sincronizado

- [ ] Escola cadastrada

- [ ] Período letivo criado

- [ ] Turma criada

- [ ] Salas cadastradas

- [ ] 5 alunos cadastrados com emails e telefones

- [ ] Coordenadores cadastrados

- [ ] Grades horárias configuradas

- [ ] Rostos dos alunos capturados (mínimo 3)

- [ ] Detecção facial testada com sucesso

- [ ] Eventos simulados (entrada, saída, falta)

- [ ] Emails de teste enviados com sucesso

- [ ] SMS de teste enviados com sucesso

- [ ] Alertas automáticos gerados

- [ ] Portfólio do aluno visualizado

- [ ] Relatório em PDF gerado

- [ ] Painel de coordenação acessível

- [ ] Alertas enviados para pais com sucesso

---

## 🎯 Próximos Passos Após Testes

1. **Integração com Câmeras Reais** - Conectar com câmeras IP da escola

1. **Treinamento de Usuários** - Treinar coordenadores e diretores

1. **Customização de Regras** - Ajustar limites de atrasos, faltas, etc

1. **Integração com Sistema de Matrículas** - Importar alunos automaticamente

1. **Deployment em Produção** - Publicar no servidor da escola

---

**Tempo estimado de teste completo: 2-4 horas**

Boa sorte com o teste! 🚀

