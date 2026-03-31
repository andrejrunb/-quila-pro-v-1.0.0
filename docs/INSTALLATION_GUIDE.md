# 🚀 Guia de Instalação - Áquila Pro

Instruções passo a passo para instalar e executar o Áquila Pro localmente.

## 📋 Pré-requisitos

- **Python 3.8+** (recomendado 3.10+)
- **Node.js 16+** (para o frontend React)
- **Git**
- **Webcam ou IP Camera** (para testes de reconhecimento facial)

## 🔧 Instalação

### 1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/aquila-pro.git
cd aquila-pro
```

### 2. Configurar Backend Python

#### 2.1 Criar Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### 2.2 Instalar Dependências

```bash
cd server/python
pip install -r requirements.txt
```

**Nota:** Se tiver problemas com `opencv-contrib-python` no Windows, use:
```bash
pip install opencv-contrib-python-headless
```

#### 2.3 Criar Estrutura de Diretórios

```bash
mkdir dataset
mkdir data
mkdir templates/auth
mkdir templates/dashboard
mkdir templates/classes
mkdir templates/students
mkdir templates/reports
mkdir templates/settings
```

### 3. Configurar Frontend Node.js

```bash
# Voltar para raiz
cd ../..

# Instalar dependências
pnpm install

# Ou com npm
npm install
```

### 4. Configurar Variáveis de Ambiente

Criar arquivo `.env` na raiz do projeto:

```env
# Flask
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=sua-chave-secreta-aqui
ADMIN_PASSWORD=senha-admin-123

# FastAPI
FASTAPI_HOST=127.0.0.1
FASTAPI_PORT=8000

# Database
DATABASE_URL=sqlite:///data/presence.db

# Reconhecimento Facial
FACE_RECOGNITION_MODEL=hog  # ou 'cnn' para maior precisão
CONFIDENCE_THRESHOLD=0.6

# Email (opcional)
SENDGRID_API_KEY=sua-chave-sendgrid
MAIL_FROM=noreply@aquila.local

# SMS (opcional)
TWILIO_ACCOUNT_SID=sua-account-sid
TWILIO_AUTH_TOKEN=seu-auth-token
```

## 🚀 Executar o Sistema

### Terminal 1 - Backend Python (FastAPI)

```bash
cd server/python
python api_server.py
```

Acesse: `http://127.0.0.1:8000`
Documentação: `http://127.0.0.1:8000/docs`

### Terminal 2 - Backend Python (Flask)

```bash
cd server/python
python run_web.py
```

Acesse: `http://127.0.0.1:5000`

### Terminal 3 - Frontend React

```bash
pnpm dev
# ou
npm run dev
```

Acesse: `http://localhost:3000` (ou porta indicada)

## 📸 Teste de Reconhecimento Facial

### 1. Capturar Rostos para Dataset

```bash
cd server/python
python -c "
from aquila.facial_recognition import FacialRecognitionSystem

fr = FacialRecognitionSystem()
fr.capture_face_from_camera('student_001', num_captures=5)
"
```

**Instruções:**
- Pressione ESPAÇO para capturar
- Pressione ESC para sair
- Capture 5-10 imagens em diferentes ângulos

### 2. Carregar Dataset

```bash
python -c "
from aquila.facial_recognition import FacialRecognitionSystem

fr = FacialRecognitionSystem()
num_faces = fr.load_known_faces()
print(f'Carregados {num_faces} rostos')
"
```

### 3. Testar Reconhecimento em Tempo Real

```bash
python -c "
import cv2
from aquila.facial_recognition import FacialRecognitionSystem

fr = FacialRecognitionSystem()
fr.load_known_faces()

cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    detections = fr.process_frame(frame)
    frame = fr.draw_detections(frame, detections)
    
    cv2.imshow('Reconhecimento Facial', frame)
    
    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()
"
```

## 🎥 Teste com IP Camera

### 1. Configurar IP Camera

Certifique-se que a IP camera está:
- Conectada à mesma rede
- Com acesso RTSP habilitado
- Com credenciais conhecidas

### 2. Testar Conexão

```bash
python -c "
import cv2

# Substitua pelos dados da sua câmera
camera_url = 'rtsp://usuario:senha@192.168.1.100:554/stream'

cap = cv2.VideoCapture(camera_url)

if cap.isOpened():
    print('✓ Câmera conectada com sucesso')
    cap.release()
else:
    print('✗ Erro ao conectar câmera')
"
```

### 3. Processar Stream da IP Camera

```bash
python -c "
import cv2
from aquila.tracking_engine import AquilaTrackingEngine

engine = AquilaTrackingEngine()
engine.fr_system.load_known_faces()

camera_url = 'rtsp://usuario:senha@192.168.1.100:554/stream'
engine.process_video_stream(
    camera_source=camera_url,
    location_id=1,
    display=True
)
"
```

## 📊 Usar a API

### Exemplo 1: Carregar Dataset

```bash
curl -X POST http://127.0.0.1:8000/api/facial-recognition/load-dataset
```

### Exemplo 2: Reconhecer Frame

```bash
# Converter imagem para base64
python -c "
import base64
import requests

with open('test_image.jpg', 'rb') as f:
    image_data = base64.b64encode(f.read()).decode()

response = requests.post(
    'http://127.0.0.1:8000/api/facial-recognition/recognize-frame',
    json={'image_data': image_data}
)

print(response.json())
"
```

### Exemplo 3: Registrar Localização

```bash
curl -X POST http://127.0.0.1:8000/api/presence/register-location \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sala 101",
    "location_type": "sala_de_aula",
    "description": "Sala de aula 7º Ano A"
  }'
```

## 🐛 Troubleshooting

### Erro: `ImportError: attempted relative import with no known parent package`

**Solução:** Certifique-se de estar usando imports diretos (sem `.` ou `..`):

```python
# ❌ Errado
from .facial_recognition import FacialRecognitionSystem

# ✅ Correto
from aquila.facial_recognition import FacialRecognitionSystem
```

### Erro: `AttributeError: module 'cv2' has no attribute 'face'`

**Solução:** Instale `opencv-contrib-python`:

```bash
pip uninstall opencv-python
pip install opencv-contrib-python
```

### Erro: `ModuleNotFoundError: No module named 'aquila'`

**Solução:** Certifique-se de estar no diretório correto:

```bash
cd server/python
python -c "from aquila import FacialRecognitionSystem"
```

### Webcam não funciona

**Solução:** Teste com índice diferente:

```python
# Tente diferentes índices
for i in range(5):
    cap = cv2.VideoCapture(i)
    if cap.isOpened():
        print(f'Câmera encontrada no índice {i}')
        cap.release()
        break
```

## 📚 Documentação Adicional

- [Documentação da API](./API_DOCUMENTATION.md)
- [Guia de Reconhecimento Facial](./FACIAL_RECOGNITION_GUIDE.md)
- [Guia de Rastreamento de Presença](./PRESENCE_TRACKING_GUIDE.md)

## 🤝 Suporte

Para problemas ou dúvidas, abra uma issue no GitHub ou entre em contato com o time de desenvolvimento.

## 📄 Licença

Proprietary - Áquila Pro © 2024
