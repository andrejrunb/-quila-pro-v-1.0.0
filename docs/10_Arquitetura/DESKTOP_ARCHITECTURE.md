# Arquitetura Áquila Pro Desktop - Aplicativo Windows Instalável

## 📋 Visão Geral

O Áquila Pro Desktop é um aplicativo Windows instalável (.exe) que funciona **100% localmente** com sincronização automática de backup na nuvem. Inclui processamento de câmeras em tempo real, cálculo inteligente de presença (75% threshold), relatórios por bimestre e app de notificações desktop para coordenadores.

---

## 🏗️ Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────┐
│                    ÁQUILA PRO DESKTOP (Windows)              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  Electron App    │  │  Notifications   │                 │
│  │  (Main UI)       │  │  App (Floating)  │                 │
│  └────────┬─────────┘  └────────┬─────────┘                 │
│           │                     │                            │
│  ┌────────▼──────────────────────▼────────┐                 │
│  │     Node.js Backend (Local)             │                 │
│  │  ├─ tRPC Routers                        │                 │
│  │  ├─ Camera Processing (OpenCV)          │                 │
│  │  ├─ Facial Recognition (face_recognition)│               │
│  │  ├─ Attendance Calculation (75% logic)  │                 │
│  │  └─ Report Generation (PDF/Excel)       │                 │
│  └────────┬─────────────────────────────────┘                 │
│           │                                                   │
│  ┌────────▼──────────────────────────────┐                   │
│  │  SQLite Database (Local)               │                   │
│  │  ├─ Students                           │                   │
│  │  ├─ Classes                            │                   │
│  │  ├─ Schedules (Subject + Teacher)      │                   │
│  │  ├─ Attendance Records                 │                   │
│  │  ├─ Camera Feeds                       │                   │
│  │  └─ Reports                            │                   │
│  └────────┬──────────────────────────────┘                   │
│           │                                                   │
│  ┌────────▼──────────────────────────────┐                   │
│  │  Daily Cloud Backup                    │                   │
│  │  ├─ S3 / Google Drive / OneDrive       │                   │
│  │  ├─ Encrypted                          │                   │
│  │  └─ Automatic (00:00 - 02:00)          │                   │
│  └────────────────────────────────────────┘                   │
│                                                               │
│  ┌──────────────────────────────────────┐                    │
│  │  Camera Inputs                        │                   │
│  │  ├─ USB Webcams                       │                   │
│  │  ├─ IP Cameras (RTSP/HTTP)            │                   │
│  │  └─ Multiple Streams (Corredores)     │                   │
│  └──────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Fluxo de Presença (75% Threshold)

### **Cálculo Automático**

```
Aula: 08:00 - 08:50 (50 minutos)

Cenário 1: Aluno presente 100%
├─ Entrada: 08:00
├─ Saída: 08:50
├─ Tempo em sala: 50 min
├─ Percentual: 100%
└─ Resultado: ✅ PRESENÇA

Cenário 2: Aluno presente 80%
├─ Entrada: 08:00
├─ Saída da sala: 08:30 (saiu para banheiro)
├─ Retorno: 08:40
├─ Tempo em sala: 40 min
├─ Percentual: 80% (40/50)
└─ Resultado: ✅ PRESENÇA (>= 75%)

Cenário 3: Aluno presente 70%
├─ Entrada: 08:00
├─ Saída da sala: 08:25
├─ Retorno: 08:50
├─ Tempo em sala: 35 min
├─ Percentual: 70% (35/50)
└─ Resultado: ❌ FALTA (< 75%)

Cenário 4: Aluno não compareceu
├─ Entrada: NÃO DETECTADO
├─ Tempo em sala: 0 min
├─ Percentual: 0%
└─ Resultado: ❌ FALTA
```

### **Algoritmo de Cálculo**

```python
def calculate_attendance(student_id, class_id, date):
    """
    Calcula presença baseado em 75% threshold
    """
    # Obter horário da aula
    schedule = get_class_schedule(class_id, date)
    total_duration = schedule.end_time - schedule.start_time
    
    # Obter eventos do aluno
    events = get_student_events(student_id, class_id, date)
    
    # Calcular tempo em sala
    time_in_class = calculate_time_in_class(events, schedule)
    
    # Calcular percentual
    percentage = (time_in_class / total_duration) * 100
    
    # Determinar presença
    if percentage >= 75:
        return "PRESENÇA"
    elif percentage > 0:
        return "FALTA"  # Esteve lá mas menos de 75%
    else:
        return "FALTA"  # Não compareceu
```

---

## 📱 App de Notificações Desktop

### **Características**

- ✅ Janela flutuante sempre visível
- ✅ Alertas em tempo real (atrasos, faltas, saídas não autorizadas)
- ✅ Som + notificação visual
- ✅ Clique para ver detalhes
- ✅ Histórico de alertas (últimas 24h)
- ✅ Configurações (volume, prioridades)

### **Tipos de Alertas**

| Alerta | Prioridade | Ação |
|--------|-----------|------|
| Aluno chegou atrasado | 🟡 Média | Notificar coordenador |
| Aluno saiu da sala (>5 min) | 🟡 Média | Registrar e notificar |
| Aluno saiu da escola | 🔴 Alta | Alerta imediato |
| Violência detectada | 🔴 CRÍTICA | Alarme + email |
| Pessoa desconhecida | 🔴 CRÍTICA | Alarme + email |
| Aglomeração suspeita | 🟡 Média | Notificar |

---

## 📋 Relatórios por Bimestre

### **Tipos de Relatórios**

**1. Relatório por Sala**
- Lista todos os alunos
- Presença/Falta por aula
- Percentual de presença
- Exportar em PDF/Excel

**2. Relatório por Aluno**
- Histórico de presença
- Detalhes de faltas
- Tempo fora de sala
- Comparativo com turma

**3. Relatório Executivo**
- Estatísticas gerais (presença média)
- Alunos com mais faltas
- Alunos com mais saídas
- Tendências

### **Geração**

- ✅ Sob demanda (a qualquer momento)
- ✅ Automático no final do bimestre
- ✅ Exportar PDF/Excel
- ✅ Enviar por email

---

## 💾 Backup Automático na Nuvem

### **Fluxo**

```
Diariamente às 00:00 - 02:00 (horário de baixo uso):
1. Compactar banco de dados local (SQLite)
2. Criptografar com AES-256
3. Enviar para nuvem (S3 / Google Drive / OneDrive)
4. Verificar integridade
5. Manter últimas 30 versões
6. Registrar no log
```

### **Configuração**

- ✅ Escolher provedor (S3, Google Drive, OneDrive)
- ✅ Credenciais criptografadas
- ✅ Agendamento customizável
- ✅ Notificação de sucesso/erro

---

## 🔐 Segurança Local

- ✅ Banco de dados criptografado (SQLite com encryption)
- ✅ Credenciais armazenadas com hash
- ✅ Acesso restrito por usuário (admin, coordenador)
- ✅ Logs de auditoria
- ✅ Sem conexão com internet obrigatória

---

## 📦 Instalação & Distribuição

### **Instalador .exe**

- ✅ NSIS (Nullsoft Installer System)
- ✅ Tamanho: ~200-300 MB
- ✅ Incluir: Node.js, Python, OpenCV, SQLite
- ✅ Auto-update (verificar atualizações mensalmente)
- ✅ Desinstalador limpo

### **Requisitos Mínimos**

- Windows 10 ou superior
- 4 GB RAM
- 500 MB espaço em disco
- Conexão internet (apenas para backup)

---

## 🔄 Sincronização com Nuvem

### **Dados Sincronizados**

- ✅ Configurações da escola
- ✅ Dados de alunos/turmas
- ✅ Relatórios gerados
- ✅ Logs de auditoria
- ✅ Backup completo do banco

### **Dados NÃO Sincronizados**

- ❌ Imagens/vídeos (muito grandes)
- ❌ Cache de reconhecimento facial
- ❌ Logs detalhados (apenas resumo)

---

## 📊 Estrutura de Dados (Banco Local)

```sql
-- Tabelas principais
students (id, name, photo_embedding, ...)
classes (id, name, room_id, ...)
schedules (id, class_id, subject, teacher, start_time, end_time, ...)
attendance (id, student_id, class_id, date, presence, time_in_class, ...)
camera_feeds (id, location, ip_address, status, ...)
notifications (id, type, message, timestamp, read, ...)
```

---

## 🎯 Roadmap de Implementação

| Semana | Tarefa |
|--------|--------|
| 1-2 | Estrutura Electron + Backend local |
| 3 | Cálculo de presença (75% logic) |
| 4 | Relatórios por bimestre |
| 5 | App de notificações |
| 6 | Backup automático na nuvem |
| 7 | Processamento local de câmeras |
| 8 | Criar instalador .exe |
| 9 | Testes e otimizações |
| 10 | Documentação final |

---

## ✅ Checklist de Conformidade

- ✅ LGPD (dados locais, backup criptografado)
- ✅ Segurança (criptografia, logs)
- ✅ Performance (processamento local)
- ✅ Usabilidade (UI intuitiva)
- ✅ Confiabilidade (backup automático)
