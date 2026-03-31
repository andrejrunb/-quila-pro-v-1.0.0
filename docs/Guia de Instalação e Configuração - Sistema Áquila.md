# Guia de Instalação e Configuração - Sistema Áquila

Este guia fornece instruções detalhadas para instalar e configurar o Sistema Áquila em um ambiente de produção.

## Requisitos de Sistema

### Hardware Recomendado

- **Servidor**:
  - CPU: Quad-core 3.0GHz ou superior
  - RAM: 16GB mínimo (32GB recomendado)
  - Armazenamento: 1TB SSD
  - Rede: Placa de rede Gigabit Ethernet

- **Câmeras**:
  - Resolução mínima: 720p (1080p recomendado)
  - Cobertura: Entrada da escola, salas de aula, corredores, pátio e outros ambientes relevantes
  - Conectividade: IP com suporte a RTSP

- **Rede**:
  - Conexão Ethernet Gigabit para o servidor
  - Rede Wi-Fi para áreas sem cabeamento estruturado
  - Largura de banda suficiente para transmissão de vídeo das câmeras

### Software Necessário

- **Sistema Operacional**: Ubuntu Server 20.04 LTS ou superior
- **Python**: Versão 3.10 ou superior
- **Banco de Dados**: PostgreSQL 13 ou superior
- **Servidor Web**: Nginx
- **Gerenciador de Processos**: Supervisor
- **Outras Dependências**: OpenCV, Face Recognition, Flask, SQLAlchemy

## Instalação do Sistema

### 1. Preparação do Servidor

Atualize o sistema e instale as dependências básicas:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y build-essential cmake pkg-config python3-dev python3-pip
sudo apt install -y libopencv-dev python3-opencv
sudo apt install -y postgresql postgresql-contrib nginx supervisor
```

### 2. Configuração do Banco de Dados

Configure o PostgreSQL para o Sistema Áquila:

```bash
# Criar usuário e banco de dados
sudo -u postgres psql -c "CREATE USER aquila WITH PASSWORD 'senha_segura';"
sudo -u postgres psql -c "CREATE DATABASE aquila_db OWNER aquila;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE aquila_db TO aquila;"
```

### 3. Instalação do Sistema Áquila

Clone o repositório e instale as dependências:

```bash
# Clonar o repositório
git clone https://github.com/aquila-sistema/aquila.git /opt/aquila
cd /opt/aquila

# Criar e ativar ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt
```

### 4. Configuração do Sistema

Crie o arquivo de configuração:

```bash
cp config.example.py config.py
```

Edite o arquivo `config.py` com as configurações apropriadas:

```python
# Configurações do banco de dados
DATABASE_URI = 'postgresql://aquila:senha_segura@localhost/aquila_db'

# Configurações de segurança
SECRET_KEY = 'gere_uma_chave_secreta_forte'
SECURITY_PASSWORD_SALT = 'gere_um_salt_forte'

# Configurações de diretórios
UPLOAD_FOLDER = '/opt/aquila/uploads'
REPORTS_FOLDER = '/opt/aquila/reports'

# Configurações de reconhecimento facial
FACE_RECOGNITION_CONFIDENCE_THRESHOLD = 0.6
FACE_DETECTION_SCALE_FACTOR = 1.1
FACE_DETECTION_MIN_NEIGHBORS = 5

# Configurações de análise de desempenho
ATTENDANCE_THRESHOLD = 75
MAX_BATHROOM_VISITS = 3
MAX_CLASS_EXITS = 2
```

### 5. Inicialização do Banco de Dados

Inicialize o banco de dados com as tabelas e dados iniciais:

```bash
# Ativar o ambiente virtual
source venv/bin/activate

# Inicializar o banco de dados
python init_db.py
```

### 6. Configuração do Nginx

Crie um arquivo de configuração para o Nginx:

```bash
sudo nano /etc/nginx/sites-available/aquila
```

Adicione a seguinte configuração:

```nginx
server {
    listen 80;
    server_name seu_dominio.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /static {
        alias /opt/aquila/src/web_interface/static;
    }

    location /uploads {
        alias /opt/aquila/uploads;
    }

    location /reports {
        alias /opt/aquila/reports;
    }
}
```

Ative a configuração e reinicie o Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/aquila /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Configuração do Supervisor

Crie um arquivo de configuração para o Supervisor:

```bash
sudo nano /etc/supervisor/conf.d/aquila.conf
```

Adicione a seguinte configuração:

```ini
[program:aquila_web]
command=/opt/aquila/venv/bin/python /opt/aquila/run.py
directory=/opt/aquila
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/aquila/web.err.log
stdout_logfile=/var/log/aquila/web.out.log

[program:aquila_facial_recognition]
command=/opt/aquila/venv/bin/python /opt/aquila/run_facial_recognition.py
directory=/opt/aquila
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/aquila/facial_recognition.err.log
stdout_logfile=/var/log/aquila/facial_recognition.out.log
```

Crie o diretório de logs e inicie os serviços:

```bash
sudo mkdir -p /var/log/aquila
sudo chown -R www-data:www-data /var/log/aquila
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all
```

## Configuração das Câmeras

### 1. Posicionamento das Câmeras

Para um funcionamento eficiente do sistema, as câmeras devem ser posicionadas estrategicamente:

- **Entradas e Saídas**: Para registrar a entrada e saída dos alunos da escola
- **Salas de Aula**: Posicionadas de forma a capturar os rostos dos alunos
- **Corredores**: Para monitorar a movimentação entre ambientes
- **Áreas Comuns**: Pátio, biblioteca, cantina, etc.

### 2. Configuração das Câmeras no Sistema

Para cada câmera instalada, é necessário configurá-la no sistema:

1. Acesse o sistema como administrador
2. Vá para "Configurações" > "Sistema" > "Câmeras"
3. Clique em "Adicionar Câmera"
4. Preencha as informações:
   - Nome da câmera (ex: "Sala 101", "Corredor Principal")
   - URL do stream RTSP (ex: "rtsp://usuario:senha@ip-da-camera:554/stream1")
   - Localização (selecione o ambiente onde a câmera está instalada)
   - Resolução (selecione a resolução adequada)
   - FPS (quadros por segundo, recomendado: 15-30)
5. Clique em "Salvar"

## Cadastro Inicial

### 1. Criação de Usuários Administrativos

Após a instalação, é necessário criar usuários administrativos adicionais:

1. Acesse o sistema com o usuário admin padrão (usuário: admin, senha: admin123)
2. Vá para "Configurações" > "Usuários"
3. Clique em "Novo Usuário"
4. Preencha as informações do usuário administrativo
5. Defina o papel como "admin"
6. Clique em "Salvar"

### 2. Cadastro de Turmas

Antes de cadastrar os alunos, é necessário cadastrar as turmas:

1. Acesse o sistema como administrador
2. Vá para "Turmas"
3. Clique em "Nova Turma"
4. Preencha as informações da turma
5. Clique em "Salvar"
6. Repita o processo para todas as turmas da escola

### 3. Cadastro de Alunos

Para o cadastro inicial de alunos, você pode:

#### Cadastro Individual

1. Acesse o sistema como administrador
2. Vá para "Alunos"
3. Clique em "Novo Aluno"
4. Preencha as informações do aluno
5. Faça o upload da foto do aluno (importante para o reconhecimento facial)
6. Clique em "Salvar"

#### Importação em Massa

Para importar vários alunos de uma vez:

1. Prepare um arquivo CSV com as informações dos alunos (modelo disponível no sistema)
2. Acesse o sistema como administrador
3. Vá para "Alunos" > "Importar"
4. Faça o upload do arquivo CSV
5. Mapeie os campos se necessário
6. Clique em "Importar"

**Importante**: Após a importação em massa, é necessário adicionar as fotos dos alunos individualmente para o funcionamento do reconhecimento facial.

## Treinamento do Reconhecimento Facial

Após cadastrar os alunos com suas fotos, é necessário treinar o sistema de reconhecimento facial:

1. Acesse o sistema como administrador
2. Vá para "Configurações" > "Sistema" > "Reconhecimento Facial"
3. Clique em "Treinar Sistema"
4. Aguarde a conclusão do treinamento (pode levar alguns minutos dependendo do número de alunos)

## Configurações Adicionais

### 1. Configurações de Notificação

Configure as notificações do sistema:

1. Acesse o sistema como administrador
2. Vá para "Configurações" > "Notificações"
3. Configure o servidor de e-mail para envio de notificações:
   - Servidor SMTP
   - Porta
   - Usuário
   - Senha
   - E-mail de origem
4. Clique em "Salvar"

### 2. Configurações de Backup

Configure backups automáticos do sistema:

1. Acesse o sistema como administrador
2. Vá para "Configurações" > "Backup"
3. Configure a frequência dos backups:
   - Diário
   - Semanal
   - Mensal
4. Configure o local de armazenamento dos backups
5. Clique em "Salvar"

### 3. Configurações de Análise de Desempenho

Configure os parâmetros para análise de desempenho:

1. Acesse o sistema como administrador
2. Vá para "Configurações" > "Sistema" > "Análise de Desempenho"
3. Configure os parâmetros:
   - Limiar de frequência para alertas (%)
   - Número máximo de visitas ao banheiro por dia
   - Número máximo de saídas de sala por dia
   - Outros parâmetros relevantes
4. Clique em "Salvar"

## Verificação do Sistema

Após a instalação e configuração, verifique se o sistema está funcionando corretamente:

1. Acesse o sistema através do navegador
2. Verifique se o Dashboard está exibindo informações
3. Verifique se as câmeras estão capturando imagens corretamente
4. Teste o reconhecimento facial com alguns alunos
5. Verifique se os registros de presença estão sendo gerados
6. Teste a geração de relatórios

## Solução de Problemas

### Problemas de Conexão com as Câmeras

Se o sistema não conseguir se conectar às câmeras:

1. Verifique se as câmeras estão ligadas e conectadas à rede
2. Verifique se as URLs RTSP estão corretas
3. Verifique se as credenciais de acesso às câmeras estão corretas
4. Verifique se não há bloqueios de firewall impedindo a conexão

### Problemas de Reconhecimento Facial

Se o reconhecimento facial não estiver funcionando corretamente:

1. Verifique se as fotos dos alunos são de boa qualidade
2. Verifique se o sistema foi treinado após o cadastro de todos os alunos
3. Ajuste os parâmetros de reconhecimento facial nas configurações do sistema
4. Verifique a iluminação dos ambientes onde as câmeras estão instaladas

### Problemas de Desempenho

Se o sistema estiver lento:

1. Verifique os recursos do servidor (CPU, memória, disco)
2. Considere reduzir a resolução ou o FPS das câmeras
3. Verifique se há outros processos consumindo recursos do servidor
4. Considere distribuir o processamento em múltiplos servidores

## Manutenção do Sistema

### Atualizações

Para atualizar o sistema para uma nova versão:

1. Faça backup do banco de dados e arquivos de configuração
2. Pare os serviços do sistema:
   ```bash
   sudo supervisorctl stop all
   ```
3. Atualize o código-fonte:
   ```bash
   cd /opt/aquila
   git pull
   ```
4. Atualize as dependências:
   ```bash
   source venv/bin/activate
   pip install -r requirements.txt
   ```
5. Aplique as migrações do banco de dados:
   ```bash
   python migrate.py
   ```
6. Reinicie os serviços:
   ```bash
   sudo supervisorctl start all
   ```

### Backups Manuais

Para realizar um backup manual do sistema:

1. Acesse o sistema como administrador
2. Vá para "Configurações" > "Backup"
3. Clique em "Criar Backup"
4. Aguarde a conclusão do backup
5. Faça o download do arquivo de backup para armazenamento externo

### Monitoramento

Monitore regularmente o sistema para garantir seu funcionamento adequado:

1. Verifique os logs do sistema:
   ```bash
   sudo tail -f /var/log/aquila/*.log
   ```
2. Monitore o uso de recursos do servidor:
   ```bash
   top
   df -h
   free -m
   ```
3. Verifique o status dos serviços:
   ```bash
   sudo supervisorctl status
   ```

## Suporte Técnico

Para obter suporte técnico ou reportar problemas:

- E-mail: suporte@aquila-sistema.com.br
- Telefone: (XX) XXXX-XXXX
- Horário de atendimento: Segunda a sexta, das 8h às 18h

Ao entrar em contato com o suporte, tenha em mãos:
- Versão do sistema
- Logs relevantes
- Descrição detalhada do problema
- Capturas de tela, se aplicável
