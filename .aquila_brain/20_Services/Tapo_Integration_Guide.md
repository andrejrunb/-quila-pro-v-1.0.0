# 📷 Integração: Câmeras TP-Link Tapo (Phase 401+)

As câmeras Tapo são fundamentais para o MVP de baixo custo. Elas geralmente exigem uma configuração específica de "Conta de Câmera" para habilitar o protocolo RTSP/ONVIF.

## ⚙️ Passo a Passo para Configuração
1. **App Tapo**: Vá em Configurações da Câmera > Configurações Avançadas > Conta da Câmera.
2. **Credenciais**: Crie um usuário e senha (ex: `admin` / `aquila2026`).
3. **Endereço RTSP**: O formato padrão é `rtsp://usuario:senha@IP_DA_CAMERA:554/stream1`.

## 🛠️ Auto-Discovery (Áquila Logic)
O `TapoDiscoveryService.ts` tentará identificar dispositivos TP-Link na rede local (IAN) para facilitar a adição em massa.

---
Vincular a: [[20_Services/Camera_Engine|Camera Engine]]
