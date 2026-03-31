# Walkthrough — Phase 1602: Field Testing Setup

Preparamos o ecossistema Áquila Pro para sair do modo de simulação e realizar testes reais de **Mapeamento de Ambiente** e **Detecção IA**.

## Mudanças Realizadas

### 1. Mapeamento de Ambiente (WiFi Real)
- **Implementado**: `NetworkDiscoveryService.ts` que executa o comando `arp -a` no Windows.
- **Integrado**: `IoTMainService.ts` agora consome dados reais da rede a cada 10 segundos, tornando a lista de dispositivos dinâmica e baseada no ambiente do usuário.
- **Resultado**: Ao abrir o **Gerenciador IoT**, você verá dispositivos reais conectados à sua rede local (identificados como `Device (IP)`).

### 2. Detecção de Pessoas (IA)
- **Verificado**: `camera_worker.py` está configurado para aceitar o índice `0` (Webcam Local).
- **Hardening**: O `RecognitionLoop` foi validado para gerenciar processos Python isolados para a webcam.

## Pendência para Teste de Campo

O script de verificação `verify_readiness.py` identificou que o módulo `face_recognition` está presente, mas os modelos pré-treinados não estão instalados no ambiente Python.

### ⚠️ Ação Requerida (Manual)
Abra o seu terminal (Powershell/CMD) e execute o seguinte comando:
```bash
pip install git+https://github.com/ageitgey/face_recognition_models
```

## Como Iniciar o Teste

1.  **Mapeamento WiFi**:
    - Abra o Áquila Pro.
    - Navegue até o módulo **Gerenciador IoT**.
    - Os dispositivos da sua rede local começarão a aparecer na lista em até 10 segundos.

2.  **Detecção de Pessoas**:
    - Vá em **Configurações > Câmeras**.
    - Clique em **Adicionar Câmera**.
    - No campo **URL/RTSP**, digite apenas `0`.
    - Dê um nome (ex: "Webcam Local") e salve.
    - O Áquila Pro iniciará o worker Python e sua webcam deverá ligar para iniciar a detecção em tempo real.

---
*Status do Sistema: Pronto para Teste de Campo (Aguardando Instalação de Modelos).*
