---
title: Camera Engine (Motor de Processamento)
tags: [service, camera, rtsp]
---

# Camera Engine (Motor de Processamento)

O motor de câmeras é responsável pelo stream, captura e análise de vídeo em tempo real.

## ⚙️ Especificações Técnicas
- **Protocolo:** RTSP (Real Time Streaming Protocol).
- **Consumo:** Otimizado para baixa latência.
- **Cache Local:** Armazena os últimos 60 segundos de cada câmera para análise forense imediata.

## 🤖 Fluxo de Análise
1. **Frame Capture:** O motor extrai frames em intervalos de 200ms.
2. **Motion Detection:** Filtra ruídos antes de enviar para o motor de IA.
3. **Face Analysis:** Frames contendo faces são encaminhados para o [[20_Services/Face_Recognition|Face Recognition]].

## 🛠️ Marcas Suportadas
- Tapo (TP-Link)
- Hikvision
- Intelbras
- Dahua
- Câmeras compatíveis com o padrão ONVIF.

---
Vincular a: [[10_Architecture/Architecture_Overview|Architecture Overview]]
