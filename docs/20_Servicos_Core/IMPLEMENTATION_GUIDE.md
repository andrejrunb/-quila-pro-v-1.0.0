# 📋 Guia de Implementação - Modelo Operacional Áquila Pro

## 🎯 Objetivo

Este documento descreve como implementar o modelo operacional completo do Áquila Pro, incluindo coleta de dados, análise pedagógica, alertas contextualizados e gestão de retenção de dados.

---

## ✅ Fases Implementadas

### **Fase 1: Documentação do Modelo Operacional** ✓
- Criado `OPERATIONAL_MODEL.md` com fluxo completo
- Definidas 5 fases: Configuração, Coleta, Análise, Decisão, Notificação
- Documentados 9 tipos de eventos coletados
- Definida política de retenção de dados por bimestre

### **Fase 2: Extensão do Schema do Banco de Dados** ✓
- Adicionadas 10 novas tabelas ao schema:
  - `schools` - Cadastro de escolas
  - `academic_periods` - Períodos letivos
  - `classes` - Turmas
  - `schedules` - Grades horárias
  - `students` - Alunos
  - `rooms` - Salas e áreas
  - `events` - Eventos coletados
  - `insights` - Análises de IA
  - `parent_alerts` - Alertas para pais
  - `data_exports` - Exportações de dados
- Executado `pnpm db:push` com sucesso

### **Fase 3: Routers tRPC Implementados** ✓
- **periods.ts**: 6 endpoints para gerenciar períodos acadêmicos
- **schedules.ts**: 7 endpoints para gerenciar grades horárias
- **events.ts**: 6 endpoints para registrar e consultar eventos
- Todos os routers integrados ao `appRouter`

---

## 🚀 Próximas Fases

### **Fase 4: Coleta de Eventos**
Implementar endpoints para registrar eventos em tempo real:
- Detectar atrasos (comparar timestamp com horário de aula)
- Registrar faltas (aluno não compareceu)
- Registrar saídas de sala
- Registrar visitas ao banheiro (com duração)
- Detectar aglomerações (múltiplos alunos)

**Arquivo**: `server/routers/tracking.ts`

```typescript
// Exemplo de uso
trpc.tracking.recordLateArrival.mutate({
  periodId: 1,
  studentId: 1,
  classId: 1,
  timestamp: new Date(),
  duration: 15, // minutos
});
```

### **Fase 5: Engine de Análise Pedagógica com IA**
Implementar análise automática de padrões:
- Análise de assiduidade
- Detecção de mudanças de engajamento
- Correlação com desempenho
- Geração de scores (0-100)

**Arquivo**: `server/routers/analysis.ts`

```typescript
// Exemplo de uso
trpc.analysis.generateInsights.mutate({
  periodId: 1,
  studentId: 1,
  classId: 1,
});
```

### **Fase 6: Sistema de Alertas Contextualizados**
Implementar alertas automáticos baseados em regras:
- Alerta de atraso frequente
- Alerta de saída não autorizada
- Alerta de aglomeração
- Alerta de desempenho baixo

**Arquivo**: `server/routers/alerts.ts`

### **Fase 7: Gestão de Retenção de Dados**
Implementar limpeza automática de dados:
- Job agendado para deletar dados expirados
- Exportação automática para HD
- Auditoria de deletions

**Arquivo**: `server/jobs/dataRetention.ts`

### **Fase 8: Painel de Coordenação**
Criar UI para coordenadores:
- Dashboard com alertas críticos
- Filtros por turma, aluno, tipo de evento
- Visualização de insights
- Seleção de alertas para enviar aos pais

**Arquivo**: `client/src/pages/admin/CoordinationDashboard.tsx`

### **Fase 9: Sistema de Notificações para Pais**
Integrar com canais existentes:
- SMS via Twilio
- Email via SendGrid
- WhatsApp via Twilio
- Rastreamento de leitura

---

## 📊 Estrutura de Dados

### Tabela: events
```sql
CREATE TABLE events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  periodId INT NOT NULL,
  studentId INT NOT NULL,
  classId INT NOT NULL,
  roomId INT,
  eventType ENUM('arrival', 'late_arrival', 'absence', 'room_exit', 'bathroom_visit', 'grouping', 'unauthorized_exit', 'school_exit', 'presence'),
  duration INT, -- em minutos
  timestamp DATETIME NOT NULL,
  metadata JSON,
  createdAt DATETIME DEFAULT NOW(),
  FOREIGN KEY (periodId) REFERENCES academic_periods(id),
  FOREIGN KEY (studentId) REFERENCES students(id),
  FOREIGN KEY (classId) REFERENCES classes(id),
  FOREIGN KEY (roomId) REFERENCES rooms(id)
);
```

### Tabela: insights
```sql
CREATE TABLE insights (
  id INT PRIMARY KEY AUTO_INCREMENT,
  periodId INT NOT NULL,
  studentId INT NOT NULL,
  classId INT NOT NULL,
  category ENUM('attendance', 'punctuality', 'engagement', 'behavior', 'security'),
  score INT, -- 0-100
  description TEXT NOT NULL,
  recommendation TEXT,
  severity ENUM('low', 'medium', 'high', 'critical'),
  createdAt DATETIME DEFAULT NOW(),
  FOREIGN KEY (periodId) REFERENCES academic_periods(id),
  FOREIGN KEY (studentId) REFERENCES students(id),
  FOREIGN KEY (classId) REFERENCES classes(id)
);
```

---

## 🔄 Fluxo de Dados Completo

```
1. Câmera detecta aluno
   ↓
2. Sistema registra evento (late_arrival, absence, room_exit, etc.)
   ↓
3. IA analisa padrões (insights)
   ↓
4. Coordenação revisa insights
   ↓
5. Coordenação decide enviar alerta aos pais
   ↓
6. Sistema envia SMS/Email/WhatsApp
   ↓
7. Pais recebem notificação
   ↓
8. Fim do período: dados exportados para HD
   ↓
9. Dados deletados do sistema (política de retenção)
```

---

## 🧪 Testes Unitários

### Routers Testados
- `periods.test.ts` - 8 testes para gerenciar períodos
- `events.test.ts` - 6 testes para registrar eventos

### Executar Testes
```bash
pnpm test server/routers/periods.test.ts
pnpm test server/routers/events.test.ts
pnpm test # Todos os testes
```

---

## 🔐 Segurança e Conformidade

### LGPD
- ✅ Criptografia AES-256
- ✅ TLS 1.3
- ✅ Logs de auditoria
- ✅ Acesso baseado em roles
- ✅ Deleção automática de dados

### Validações
- ✅ Apenas admins podem criar períodos
- ✅ Validação de datas (início < fim)
- ✅ Validação de horários
- ✅ Verificação de permissões em todos os endpoints

---

## 📱 API Endpoints

### Períodos Acadêmicos
```
POST   /api/trpc/periods.create
GET    /api/trpc/periods.list
GET    /api/trpc/periods.getById
PUT    /api/trpc/periods.update
DELETE /api/trpc/periods.delete
GET    /api/trpc/periods.getActive
```

### Grades Horárias
```
POST   /api/trpc/schedules.create
GET    /api/trpc/schedules.list
GET    /api/trpc/schedules.listByPeriod
GET    /api/trpc/schedules.getById
PUT    /api/trpc/schedules.update
DELETE /api/trpc/schedules.delete
GET    /api/trpc/schedules.isClassTime
```

### Eventos
```
POST   /api/trpc/events.create
GET    /api/trpc/events.listByStudent
GET    /api/trpc/events.listByClass
GET    /api/trpc/events.listByDateRange
GET    /api/trpc/events.getStats
DELETE /api/trpc/events.delete
```

---

## 🎯 Métricas de Sucesso

| Métrica | Target | Status |
|---------|--------|--------|
| Eventos coletados por dia | 1000+ | Pendente |
| Latência de análise | < 5s | Pendente |
| Taxa de acurácia de IA | > 95% | Pendente |
| Satisfação de coordenadores | > 4/5 | Pendente |
| Satisfação de pais | > 4/5 | Pendente |

---

## 📞 Suporte

- Email: andrejrunb@yahoo.com.br
- Telefone: +55 61 99962-3099
- WhatsApp: +55 61 99962-3099
