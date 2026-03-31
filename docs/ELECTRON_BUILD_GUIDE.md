# Guia de Build - Áquila Pro Desktop

## 📋 Pré-requisitos

- **Node.js** 16+ e npm/yarn
- **Python** 3.8+ (para opencv4nodejs)
- **Visual Studio Build Tools** (Windows)
- **NSIS** (Nullsoft Installer System) para criar .exe

### Instalação de Dependências (Windows)

```bash
# 1. Instalar Node.js
# Baixar de: https://nodejs.org/

# 2. Instalar Python
# Baixar de: https://www.python.org/

# 3. Instalar Visual Studio Build Tools
# Baixar de: https://visualstudio.microsoft.com/downloads/
# Selecionar: "Desktop development with C++"

# 4. Instalar NSIS
# Baixar de: https://nsis.sourceforge.io/
# Executar instalador
```

---

## 🔨 Build do Aplicativo

### Passo 1: Instalar Dependências

```bash
cd electron
npm install
```

### Passo 2: Compilar TypeScript

```bash
npm run build:electron
```

### Passo 3: Compilar React

```bash
npm run build:react
```

### Passo 4: Criar Instalador .exe

```bash
npm run dist:win
```

O instalador será criado em: `electron/dist/AquilaPro-Setup-1.0.0.exe`

---

## 🚀 Desenvolvimento Local

Para testar o aplicativo durante desenvolvimento:

```bash
npm run dev
```

Isso iniciará:
- React dev server (port 3000)
- Electron com hot reload

---

## 📦 Estrutura de Build

```
electron/
├── src/
│   ├── main.ts              # Processo principal
│   ├── preload.ts           # Preload script
│   ├── database/
│   │   └── Database.ts      # Camada de dados
│   └── services/
│       ├── AttendanceCalculator.ts
│       ├── BackupManager.ts
│       ├── NotificationManager.ts
│       └── ReportGenerator.ts
├── dist/                    # Saída compilada
├── package.json
├── tsconfig.json
└── aquila-pro.nsi          # Configuração NSIS
```

---

## 🔐 Variáveis de Ambiente

Criar arquivo `.env` na raiz do projeto:

```env
# AWS S3 (para backup)
AWS_ACCESS_KEY_ID=seu_access_key
AWS_SECRET_ACCESS_KEY=sua_secret_key
AWS_REGION=us-east-1
AWS_BACKUP_BUCKET=aquila-pro-backups

# Criptografia
BACKUP_ENCRYPTION_KEY=sua_chave_secreta_aqui

# Escola
SCHOOL_ID=escola-001
```

---

## 🐛 Troubleshooting

### Erro: "opencv4nodejs not found"

```bash
npm install --build-from-source
```

### Erro: "NSIS not found"

Adicionar NSIS ao PATH:
```bash
set PATH=%PATH%;C:\Program Files (x86)\NSIS
```

### Erro: "Python not found"

```bash
npm config set python C:\Python39\python.exe
```

---

## 📊 Tamanho do Instalador

- **Sem dependências**: ~50 MB
- **Com Node.js bundled**: ~150 MB
- **Com Python + OpenCV**: ~300 MB

---

## ✅ Checklist de Build

- [ ] Todas as dependências instaladas
- [ ] TypeScript compilando sem erros
- [ ] React build completo
- [ ] Variáveis de ambiente configuradas
- [ ] NSIS instalado
- [ ] Teste local funcionando (`npm run dev`)
- [ ] Instalador gerado com sucesso
- [ ] Instalador testado em máquina limpa

---

## 📝 Notas

- O instalador cria diretórios em `%APPDATA%\AquilaPro`
- Banco de dados SQLite fica em `%APPDATA%\AquilaPro\aquila.db`
- Backups são salvos em `%APPDATA%\AquilaPro\backups`
- Relatórios são salvos em `%APPDATA%\AquilaPro\reports`

---

## 🚢 Distribuição

Para distribuir o instalador:

1. Assinar digitalmente (opcional mas recomendado)
2. Fazer upload para servidor
3. Criar página de download
4. Fornecer link para clientes

---

## 🔄 Atualizações

Para criar atualizações futuras:

1. Incrementar versão em `package.json`
2. Atualizar `CHANGELOG.md`
3. Fazer build: `npm run dist:win`
4. Distribuir novo instalador

---

**Última atualização**: 2026-03-04
