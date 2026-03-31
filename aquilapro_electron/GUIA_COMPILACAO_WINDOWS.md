# Guia de Compilação e Instalação — Áquila Pro Desktop (Windows)

> **Versão:** 1.0.0 | **Atualizado em:** Março 2026  
> **Autor:** André Jr — andrejrunb@yahoo.com.br

---

## Visão Geral

Este guia descreve dois métodos para gerar o instalador `.exe` do Áquila Pro Desktop:

1. **Método A — GitHub Actions (Recomendado):** O build é feito automaticamente na nuvem ao criar uma tag de versão no GitHub. Não requer nenhuma ferramenta instalada localmente além do Git.
2. **Método B — Compilação Local (Windows):** O build é feito diretamente na sua máquina Windows.

---

## Requisitos do Sistema para Compilação

| Ferramenta | Versão Mínima | Download |
|---|---|---|
| Node.js | 20 LTS | https://nodejs.org |
| Python | 3.11+ | https://python.org |
| Git | 2.40+ | https://git-scm.com |
| Visual Studio Build Tools | 2022 | https://visualstudio.microsoft.com/downloads/ |

> **Importante:** O Visual Studio Build Tools é necessário para compilar módulos nativos como `better-sqlite3` e `sharp`. Instale os componentes "C++ build tools" e "Windows SDK".

---

## Método A — GitHub Actions (Automático)

### Pré-requisitos

1. Conta no [GitHub](https://github.com) (gratuita)
2. Repositório criado para o projeto (pode ser privado)

### Passo 1 — Exportar o código para o GitHub

No painel do Manus, acesse **Settings → GitHub** e exporte o projeto para um novo repositório. Isso cria automaticamente o repositório com todo o código.

### Passo 2 — Criar uma tag de versão

Após o código estar no GitHub, crie uma tag para disparar o build:

```bash
# Clonar o repositório localmente
git clone https://github.com/SEU_USUARIO/aquila-pro-website.git
cd aquila-pro-website

# Criar e enviar a tag de versão
git tag v1.0.0
git push origin v1.0.0
```

### Passo 3 — Acompanhar o build

1. Acesse o repositório no GitHub
2. Clique na aba **Actions**
3. Aguarde o workflow **"Build Áquila Pro Desktop (.exe)"** concluir (aproximadamente 10-15 minutos)
4. Ao finalizar, acesse a aba **Releases** para baixar o instalador

### Passo 4 — Baixar o instalador

Na página de Releases do GitHub, você encontrará dois arquivos:

- `AquilaPro-Setup-v1.0.0.exe` — Instalador completo (recomendado)
- `AquilaPro-Portable-v1.0.0.exe` — Versão portátil (sem instalação)

---

## Método B — Compilação Local (Windows)

### Passo 1 — Clonar o repositório

```cmd
git clone https://github.com/SEU_USUARIO/aquila-pro-website.git
cd aquila-pro-website\electron
```

### Passo 2 — Instalar as dependências Node.js

```cmd
npm install
```

> Se houver erro em módulos nativos (better-sqlite3, sharp), execute:
> ```cmd
> npm install --build-from-source
> ```

### Passo 3 — Instalar dependências Python

```cmd
pip install numpy opencv-python Pillow
```

### Passo 4 — Compilar o TypeScript

```cmd
npm run build:electron
```

Este comando compila o processo principal (`main.ts`, `preload.ts`) para JavaScript em `dist/`.

### Passo 5 — Compilar o React (interface)

```cmd
npm run build:renderer
```

Este comando compila a interface React para `build/`.

### Passo 6 — Verificar a estrutura de build

Após os dois builds, você deve ter:

```
electron/
  dist/           ← Processo principal compilado (main.js, preload.js)
  build/          ← Interface React compilada (index.html, assets/)
  resources/      ← Ícones e recursos
  python/         ← Módulo Python de reconhecimento facial
```

### Passo 7 — Gerar o instalador .exe

```cmd
npm run dist:win
```

O instalador será gerado em `electron/release/`:

```
electron/release/
  AquilaPro-Setup-1.0.0.exe     ← Instalador NSIS (recomendado)
  AquilaPro-Portable-1.0.0.exe  ← Versão portátil
  win-unpacked/                  ← Versão descompactada (para testes)
```

---

## Instalação na Escola

### Requisitos da Máquina de Instalação

| Componente | Mínimo | Recomendado |
|---|---|---|
| Sistema Operacional | Windows 10 (64-bit) | Windows 11 (64-bit) |
| Processador | Intel Core i5 (4ª geração) | Intel Core i7 (8ª geração) ou superior |
| Memória RAM | 8 GB | 16 GB |
| Armazenamento | 4 GB livres | 50 GB livres (para banco de imagens) |
| Placa de Rede | 100 Mbps | 1 Gbps |
| GPU (opcional) | — | NVIDIA GTX 1060+ (para reconhecimento facial acelerado) |

### Passos de Instalação

1. **Copie** o arquivo `AquilaPro-Setup-1.0.0.exe` para a máquina da escola
2. **Clique com o botão direito** no arquivo e selecione **"Executar como Administrador"**
3. Se o Windows Defender exibir aviso de segurança, clique em **"Mais informações"** → **"Executar assim mesmo"**
4. Siga o **assistente de instalação**:
   - Aceite o contrato de licença
   - Escolha o diretório de instalação (padrão: `C:\Program Files\Aquila Pro\`)
   - Selecione se deseja criar atalho na área de trabalho e no menu Iniciar
5. Clique em **"Instalar"** e aguarde a conclusão
6. O sistema iniciará automaticamente após a instalação

### Primeira Configuração

Ao abrir pela primeira vez, o sistema solicitará:

1. **Licença de uso** — Insira a chave fornecida pela Áquila Pro
2. **Configuração do banco de dados** — O banco SQLite local será criado automaticamente
3. **Câmeras** — Adicione as câmeras IP pelo endereço RTSP (ex: `rtsp://192.168.1.100:554/stream`)
4. **Salas** — Cadastre as salas e associe cada câmera à sua respectiva sala
5. **Grade horária** — Importe a planilha Excel com os horários das aulas
6. **Alunos** — Importe a lista de alunos e faça o upload das fotos

---

## Configuração das Câmeras

### Formatos Suportados

| Protocolo | Exemplo de URL |
|---|---|
| RTSP | `rtsp://usuario:senha@192.168.1.100:554/stream1` |
| RTSP (sem autenticação) | `rtsp://192.168.1.100:554/live` |
| HTTP MJPEG | `http://192.168.1.100:8080/video` |
| Câmera USB local | `0` (índice da câmera) |

### Configuração de Rede

Para que o sistema acesse as câmeras IP, certifique-se de que:

1. A máquina do Áquila Pro e as câmeras estão na **mesma rede local**
2. O **firewall do Windows** permite conexões nas portas 554 (RTSP) e 80/8080 (HTTP)
3. As câmeras têm **IPs fixos** (configure no roteador via reserva DHCP)

---

## Solução de Problemas

### Erro: "A aplicação não pôde ser iniciada"

Execute o instalador como Administrador e verifique se o Visual C++ Redistributable está instalado:
- Baixe em: https://aka.ms/vs/17/release/vc_redist.x64.exe

### Erro: "Câmera não encontrada"

Verifique se a URL RTSP está correta testando no VLC Media Player:
```
Mídia → Abrir Fluxo de Rede → rtsp://IP_DA_CAMERA:554/stream
```

### Erro: "Banco de dados corrompido"

Restaure o backup mais recente em:
```
C:\Users\SEU_USUARIO\AppData\Roaming\Aquila Pro\backups\
```

### Erro no build: "node-gyp failed"

Instale o Visual Studio Build Tools com os componentes C++:
```cmd
npm install --global windows-build-tools
```

---

## Atualização do Sistema

O Áquila Pro verifica atualizações automaticamente ao iniciar. Quando uma nova versão estiver disponível:

1. Uma notificação aparecerá na bandeja do sistema
2. Clique em **"Atualizar agora"** para baixar e instalar
3. O sistema reiniciará automaticamente após a atualização

Para atualização manual, baixe o novo instalador e execute sobre a versão atual — os dados serão preservados.

---

## Suporte Técnico

- **Email:** andrejrunb@yahoo.com.br
- **WhatsApp:** +55 (61) 99962-3099
- **Site:** https://aquilapro.com.br

---

*Áquila Pro — Sistema de Segurança e Engajamento Escolar*  
*Copyright © 2026 André Jr. Todos os direitos reservados.*
