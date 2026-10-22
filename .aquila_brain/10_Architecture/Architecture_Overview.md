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
- **IA Seating:** [[20_Services/Seating_Intelligence|Seating Intelligence Engine]] (Optimization pedagogics).
- **IA Grading:** [[20_Services/Automated_Grading|Automated Grading V1.5.0]] (Vision-based OCR).
- **IA Core:** Python + TensorFlow (Docker/Local) para processamento biométrico.
- **Database:** SQLite local para persistência offline e cache operacional.
- **Persistence:** [[20_Services/Auth_Service|SessionService]] (electron-store) para manter estado entre reinicializações do app.
- **Boot Sequence:** Hidratação Assíncrona (Fase 1) para serviços críticos (LGPD, Auditoria, Sessão) garantindo estabilidade do IPC.

### Integrações (External Layer)
- **WhatsApp:** Evolution API para disparos em massa.
- **Pagamentos:** Integração direta com PIX (Gateway).

## 📊 Fluxo de Inicialização & Dados
1. **Boot:** Hidratação de serviços críticos (Fase 1) e validação de IPC.
2. **Restore:** `App.tsx` solicita `get-current-user` → [[20_Services/Auth_Service|AuthService]] restaura sessão do `SessionService`.
3. **Capture:** Câmera captura frame → [[20_Services/Camera_Engine|Camera Engine]].
4. **AI Process:** Processamento local via IA → [[20_Services/Face_Recognition|Face Recognition]] / [[20_Services/Automated_Grading|Grading OCR]].
5. **Event:** Identificação positiva / Sugestão → Evento IPC disparado para Main Process.
6. **Action:** Análise Pedagógica Preditiva → [[20_Services/Seating_Intelligence|Seating Suggestion]].
7. **Persist:** Gravação no banco local → Sincronização via [[10_Architecture/Sync_Logic|Sync Service]].
8. **Alert:** Notificação via [[20_Services/WhatsApp_Evolution|WhatsApp]].

---
Vincular a: [[00_Index|Intelligence Center]]
