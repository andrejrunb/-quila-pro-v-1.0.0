# Hardware Hub & Protocolos IoT

O Hardware Hub centraliza a comunicação do Áquila Pro com dispositivos físicos (catracas, fechaduras e sensores).

## 🏢 Fluxo de Acesso IoT

```mermaid
sequenceDiagram
    participant U as Usuário (App Mobile)
    participant Q as DynamicQrCode
    participant T as Totem/Catraca
    participant S as IoTService
    
    U->>Q: Gera Token TOTP
    Q-->>U: Exibe QR Code Rotativo
    U->>T: Apresenta QR Code
    T->>S: Valida Token via IPC
    S->>T: Comando 'OPEN' (Relé)
    S->>U: Notificação Push (Acesso Confirmado)
```


## 🛡️ Segurança de Acesso
- **TOTP:** Os tokens expiram a cada 30 segundos para evitar clonagem de QR Codes.
- **Offline First:** O `IoTService` mantém um cache local de tokens autorizados para falhas de rede.


## 📟 Dispositivos Suportados
- **Catracas:** Protocolo TCP/IP (SDK Proprietário).
- **Fechaduras:** Relés acionados via barramento serial/USB.

---
Vincular a: [[00_Index|Início]] | [[20_Services/Camera_Engine|Serviços]]
