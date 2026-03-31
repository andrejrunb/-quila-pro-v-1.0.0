---
title: Visão Geral da Arquitetura
tags: [architecture, core, electron]
---

# Visão Geral da Arquitetura - Áquila Pro

O Áquila Pro utiliza uma arquitetura híbrida de Desktop (Electron) e Web (React) com processamento de IA local para máxima privacidade.

## 🧱 Componentes Principais

### Frontend (UI Layer)
- **Framework:** React + Vite
- **Styling:** Vanilla CSS (Elite UI Design System)
- **Icons:** Lucide React

### Backend (Process Layer)
- **Runtime:** Node.js (Electron Main Process)
- **IA:** Python + TensorFlow (Docker/Local) para processamento biométrico.
- **Database:** SQLite local para persistência offline e cache.

### Integrações (External Layer)
- **WhatsApp:** Evolution API para disparos em massa.
- **Pagamentos:** Integração direta com PIX (Gateway).

## 📊 Fluxo de Dados
1. Câmera captura frame → [[20_Services/Camera_Engine|Camera Engine]].
2. Processamento local via IA → [[20_Services/Face_Recognition|Face Recognition]].
3. Identificação positiva → Evento IPC disparado para Main Process.
4. Gravação no banco local → Sincronização via [[10_Architecture/Sync_Logic|Sync Service]].
5. Alerta enviado via [[20_Services/WhatsApp_Evolution|WhatsApp]].

---
Vincular a: [[00_Index|Intelligence Center]]
