# Áquila Pro Desktop - Guia de Instalação

## Requisitos Mínimos

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| **Sistema** | Windows 10 64-bit | Windows 11 64-bit |
| **CPU** | Intel i5 8ª gen / Ryzen 5 3600 | Intel i7 10ª gen / Ryzen 7 5800 |
| **RAM** | 8 GB | 16 GB |
| **Disco** | 50 GB SSD | 256 GB NVMe SSD |
| **GPU** | Integrada (Intel UHD) | NVIDIA GTX 1650+ (para IA local) |
| **Rede** | 100 Mbps | Gigabit Ethernet |
| **Câmeras** | Hikvision / Intelbras com RTSP | Hikvision DS-2CD series |

## Instalação Rápida (5 minutos)

### Opção 1: Instalador .exe (Recomendado)

1. Baixe o arquivo `AquilaPro-Setup-1.0.0.exe`
2. Execute como **Administrador** (botão direito > "Executar como administrador")
3. Siga o assistente de instalação
4. Após instalar, execute `first-setup.bat` para configurar a escola

### Opção 2: Versão Portátil

1. Baixe o arquivo `AquilaPro-Portable-1.0.0.exe`
2. Execute diretamente (não requer instalação)
3. Os dados serão salvos na pasta do usuário

### Opção 3: Instalação Manual (Desenvolvedores)

```bash
# 1. Clonar repositório
git clone https://github.com/andrejrunb/aquila-pro-desktop.git
cd aquila-pro-desktop/electron

# 2. Instalar dependências Node.js
npm install

# 3. Instalar dependências Python
pip install face_recognition opencv-python-headless numpy dlib

# 4. Compilar TypeScript
npm run build

# 5. Executar em modo desenvolvimento
npm run dev

# 6. Gerar instalador
npm run dist:win
```

## Configuração Inicial

### 1. Primeiro Acesso

Após instalar, execute o assistente de configuração:
- **Windows**: Execute `scripts\first-setup.bat`
- **Ou**: Abra o Áquila Pro e siga o wizard de configuração

### 2. Configurar Câmeras

Para câmeras **Hikvision** conectadas em DVR **Intelbras**:

**Opção A - Acesso direto à câmera (Recomendado):**
```
rtsp://usuario:senha@IP_DA_CAMERA:554/Streaming/Channels/101
```

**Opção B - Acesso via DVR Intelbras:**
```
rtsp://usuario:senha@IP_DO_DVR:554/cam/realmonitor?channel=1&subtype=0
```

**Dicas:**
- Usuário padrão Hikvision: `admin`
- Porta RTSP padrão: `554`
- Use o canal principal (101) para melhor qualidade
- Use o canal secundário (102) para menor consumo de banda

### 3. Cadastrar Alunos

1. Acesse o menu **Alunos** > **Cadastrar**
2. Preencha nome, turma e matrícula
3. Tire 3-5 fotos do rosto (frontal, perfil esquerdo, perfil direito)
4. O sistema treinará automaticamente o reconhecimento facial

### 4. Importar Grade Horária

1. Acesse **Grade Horária** > **Exportar Template**
2. Preencha o arquivo Excel com os horários
3. Acesse **Grade Horária** > **Importar**
4. Selecione o arquivo preenchido

## Estrutura de Arquivos

```
C:\Program Files\Aquila Pro\          ← Aplicação
  ├── AquilaPro.exe                   ← Executável principal
  ├── resources\                      ← Recursos (ícones, licença)
  ├── python\                         ← Módulos Python (face_recognition)
  └── locales\                        ← Traduções

%APPDATA%\AquilaPro\                  ← Dados do usuário
  ├── database\                       ← Banco de dados SQLite
  │   └── aquila.db                   ← Banco principal
  ├── photos\                         ← Fotos dos alunos
  │   └── {student_id}\              ← Pasta por aluno
  ├── backups\                        ← Backups automáticos
  ├── reports\                        ← Relatórios gerados
  └── logs\                           ← Logs do sistema
```

## Backup e Restauração

### Backup Automático
- O sistema faz backup diário às 23:00
- Backups são salvos em `%APPDATA%\AquilaPro\backups\`
- Retenção: 30 dias (configurável)

### Backup Manual
- Menu **Arquivo** > **Fazer Backup** (Ctrl+B)
- Ou via tray: botão direito > **Fazer Backup Agora**

### Restaurar Backup
1. Acesse **Configurações** > **Backup**
2. Selecione o backup desejado
3. Clique em **Restaurar**

## Solução de Problemas

### Câmera não conecta
1. Verifique se o IP está correto: `ping IP_DA_CAMERA`
2. Teste a URL RTSP no VLC: **Mídia** > **Abrir Fluxo de Rede**
3. Verifique se a porta 554 está liberada no firewall
4. Confirme usuário e senha da câmera

### Reconhecimento facial impreciso
1. Cadastre mais fotos do aluno (mínimo 5)
2. Fotos devem ter boa iluminação
3. Evite fotos com óculos escuros ou máscaras
4. Re-treine o modelo: **Alunos** > **Re-treinar Todos**

### Sistema lento
1. Verifique uso de CPU/RAM no **Monitoramento**
2. Reduza resolução das câmeras (720p é suficiente)
3. Reduza FPS de processamento (5 FPS é adequado)
4. Feche outros programas pesados

### Erro ao iniciar
1. Execute como Administrador
2. Verifique se o antivírus não está bloqueando
3. Reinstale as dependências: `scripts\install.bat`
4. Verifique os logs em `%APPDATA%\AquilaPro\logs\`

## Suporte

- **Email**: andrejrunb@yahoo.com.br
- **WhatsApp**: +55 (61) 99962-3099
- **Horário**: Segunda a Sexta, 8h às 18h

## Atualizações

O sistema verifica atualizações automaticamente ao iniciar.
Para verificar manualmente: **Ajuda** > **Verificar Atualizações**

---

© 2026 André Jr - Áquila Pro - Todos os direitos reservados.
