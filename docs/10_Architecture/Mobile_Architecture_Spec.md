# Especificação de Arquitetura: Áquila Mobile

Esta nota define a base técnica para a expansão mobile do ecossistema Áquila Pro.

## 🛠️ Stack Tecnológica
- **Framework:** React Native + Expo (Managed Workflow)
- **Engine de UI:** Gluestack-UI (Design System compatível com Elite UI)
- **Estado Global:** TanStack Query + Zustand
- **Comunicação:** tRPC (Consumer do Backend Áquila) ou WebSocket para alertas críticos.

## 📱 Funcionalidades Core (MVP)
1. **Áquila Parent App**:
    - Dashboard de presença em tempo real.
    - Notificações de entrada/saída.
    - Autorização de saída via QR Code.
2. **Áquila Guard App**:
    - Stream de câmeras via RTSP -> WebRTC (Transcoded).
    - Alertas de pânico com geolocalização.
    - Chat interno seguro.

## 🔒 Segurança & Privacidade
- **Autenticação:** Biometria nativa (FaceID/Fingerprint).
- **Criptografia:** TLS 1.3 para trânsito; AES-256 para cache local sensível.
- **Soberania:** O app mobile consome dados diretamente do Edge Hub escolar (via VPN ou Túnel Seguro).

---
*Assinado: Agente Mobile v1.0*
