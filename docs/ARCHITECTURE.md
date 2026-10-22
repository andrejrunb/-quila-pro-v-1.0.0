# Áquila Pro — Arquitetura Técnica (v1.5.0)

O Áquila Pro é um Sistema Operacional Soberano projetado para rodar inteiramente no *Edge* (borda), garantindo que dados sensíveis de menores e logs de segurança nunca saiam do perímetro da escola.

## 🏗️ Estrutura Híbrida

O sistema utiliza uma arquitetura multicamada para balancear performance e resiliência:

### 1. Camada de Interface (Frontend)
- **Framework**: React + Next.js (SSG/ISR).
- **Estilo**: Elite UI System (Vanilla CSS + Glassmorphism).
- **Interação**: Electron BrowserView para isolamento de portais administrativos.

### 2. Núcleo de Processamento (Main Process)
- **Runtime**: Node.js (Electron Main).
- **Segurança**: Rate Limiting de IPC, Scrypt Hashing e IPC Shielding.
- **Banco de Dados**: SQLite (Better-SQLite3) para persistência SQL de alta velocidade local.

### 3. Engine de Inteligência (Córtex)
- **Cognitivo**: Córtex Evolution Service para análise multidimensional de risco.
- **Hardware**: Otimização NPU (26 TOPS) para detecção biométrica e comportamental via Python Worker.

## 📊 Fluxo de Soberania

1. **Captura**: Câmeras IP via protocolo RTSP/ONVIF.
2. **Inferência**: Processamento de vídeo local (sem envio para nuvem).
3. **Persistência**: Gravação em banco SQLite criptografado (AES-256).
4. **Resiliência**: Replicação Geo-local em clusters Áquila Edge Hub.

---
*Documento gerado automaticamente pelo Auditor de Sistemas Áquila Pro.*
