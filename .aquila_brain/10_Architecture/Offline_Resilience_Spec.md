# 📶 Operação Offline & Resiliência (Fase 401+)

Conforme diretriz estratégica, o Áquila Pro garante a continuidade de serviços críticos mesmo sem conectividade com a Internet (Internet Failover).

## 🛡️ Serviços Mantidos (LAN Nativa)
- **Câmeras IP**: Streaming via RTSP/TCP direto na rede local (IAN).
- **Tracking & Re-ID**: O processamento em borda (Edge) permite rastrear alvos sem dependência de nuvem.
- **Chamada Inteligente**: Armazenada no Local DB (SQLite/LokiJS) e sincronizada assim que a rede retornar.
- **Alertas de Campo**: Comunicação via Gateway local para o SOC.

## ⚠️ Limitações Temporárias
- **App dos Pais**: Notificações em tempo real (Push) pausadas (Geofencing continua processado localmente).
- **Backup Cloud**: Enfileirado para sincronização posterior.

---
Vincular a: [[10_Architecture/Unified_Command_SOC|Unified Command SOC]]
