# 📊 Modelo Operacional Completo - Sistema Áquila Pro

## 🎯 Visão Geral

O Sistema Áquila Pro é uma plataforma de **coleta e análise de dados comportamentais** em ambiente escolar, utilizando visão computacional e inteligência artificial para gerar insights pedagógicos e de segurança.

---

## 📋 Fluxo Operacional Principal

### **Fase 1: Configuração Inicial (Admin)**

1. **Cadastro de Períodos**
   - Admin define períodos letivos (bimestres, trimestres, semestres)
   - Exemplo: 1º Bimestre (01/02 - 30/04)

2. **Cadastro de Grades Horárias**
   - Admin define horários de aula por turma
   - Exemplo: Turma A - 7h às 12h (período matutino)
   - Exemplo: Turma B - 13h às 18h (período vespertino)
   - Período inverso: fora dos horários definidos

3. **Cadastro de Salas**
   - Admin mapeia salas físicas
   - Associa câmeras a cada sala
   - Define áreas críticas (entrada, saída, banheiro, pátio)

4. **Cadastro de Alunos**
   - Admin importa lista de alunos
   - Associa alunos a turmas e salas
   - Registra dados de contato dos pais

---

### **Fase 2: Coleta de Dados (Sistema Automático)**

#### **Durante Período de Aula (Grade Horária)**

O sistema registra automaticamente:

| Evento | Descrição | Dados Coletados |
|--------|-----------|-----------------|
| **Atraso** | Aluno chega após horário de início | Horário, duração, aluno, turma |
| **Falta** | Aluno não comparece durante período | Data, turma, aluno |
| **Saída de Sala** | Aluno sai da sala durante aula | Horário, duração, sala, aluno |
| **Ida ao Banheiro** | Aluno vai ao banheiro | Horário, duração, frequência |
| **Aglomeração** | Múltiplos alunos em dupla/grupo | Quantidade, local, duração |
| **Permanência em Sala** | Tempo total em sala | Duração, aluno, sala |

#### **Durante Período Inverso (Fora da Grade Horária)**

O sistema continua registrando:

| Evento | Descrição | Dados Coletados |
|--------|-----------|-----------------|
| **Entrada** | Aluno entra na escola | Horário, portaria, aluno |
| **Permanência** | Tempo total na escola | Duração, áreas visitadas |
| **Aglomeração** | Grupos de alunos | Quantidade, local, duração |
| **Saída** | Aluno sai da escola | Horário, portaria, aluno |
| **Localização** | Posição em tempo real | Coordenadas, sala/área, timestamp |

---

### **Fase 3: Análise com IA (Coordenação)**

O sistema utiliza **Machine Learning** para analisar os dados coletados:

#### **Análise Pedagógica**

```
Entrada: Dados brutos (atrasos, faltas, saídas, aglomerações)
         ↓
Processamento IA:
  - Identificar padrões de comportamento
  - Detectar mudanças de engajamento
  - Correlacionar eventos com desempenho
  - Gerar scores de engajamento
         ↓
Saída: Insights estruturados
  - "João teve 3 atrasos em 2 semanas (↑ risco)"
  - "Maria saiu de sala 12x em 1 semana (↑ desatenção)"
  - "Turma C tem 40% de aglomeração no intervalo (↓ disciplina)"
```

#### **Análise de Segurança**

```
Entrada: Dados de movimentação e localização
         ↓
Processamento IA:
  - Detectar saídas não autorizadas
  - Identificar aglomerações anormais
  - Monitorar áreas de risco
  - Rastrear desaparecimentos
         ↓
Saída: Alertas de segurança
  - "Aluno saiu da escola sem autorização"
  - "Aglomeração detectada na entrada"
  - "Aluno não localizado em sala"
```

---

### **Fase 4: Decisão da Coordenação**

A **Coordenação da Escola** analisa os insights da IA e decide:

1. **Quais informações enviar para pais**
2. **Qual é a urgência** (imediato, semanal, bimestral)
3. **Qual é o tom** (alerta, informativo, positivo)
4. **Quais ações tomar** (reunião, intervenção, elogio)

**Exemplo de Fluxo:**

```
IA detecta: "João teve 5 atrasos em 2 semanas"
           ↓
Coordenação analisa: "João está com problemas de transporte"
                     ↓
Coordenação decide: "Enviar alerta aos pais + oferecer suporte"
                    ↓
Sistema envia: SMS/Email para responsáveis
```

---

### **Fase 5: Notificação para Pais**

Baseado nas decisões da coordenação, o sistema envia:

| Canal | Tipo | Exemplo |
|-------|------|---------|
| **SMS** | Urgente | "João saiu da escola sem autorização" |
| **Email** | Informativo | "Relatório semanal de frequência" |
| **WhatsApp** | Contextualizado | "Maria teve 3 atrasos esta semana" |
| **Portal** | Histórico | Acesso a todos os dados do bimestre |

---

## 💾 Gestão de Retenção de Dados

### **Timeline de Armazenamento**

```
Bimestre 1 (01/02 - 30/04)
├─ Coleta de dados → Armazenado no sistema
├─ Análise contínua → Disponível para coordenação
├─ Reunião de pais (30/04) → Relatório gerado
├─ Após reunião → Dados ainda no sistema
└─ Prazo: Até 30/05 → DOWNLOAD para HD da escola
   └─ Após download → DELETADO do sistema

Bimestre 2 (01/05 - 31/07)
├─ Coleta de dados → Novo ciclo
├─ Dados do Bimestre 1 → Ainda usados para análise comparativa
└─ Até 31/08 → DOWNLOAD para HD da escola
```

### **Política de Retenção**

| Período | Armazenamento | Uso |
|---------|---------------|-----|
| **Bimestre Ativo** | Sistema (Cloud + Local) | Análise em tempo real |
| **Até Reunião de Pais** | Sistema | Geração de relatórios |
| **Até Prazo de Download** | Sistema | Acesso para coordenação |
| **Após Download** | HD da Escola | Arquivo histórico |
| **Fim do Ano Letivo** | HD da Escola | Análise comparativa anual |

### **Rastreamento Anual**

```
Dados coletados no 1º Bimestre:
├─ Usados durante 1º Bimestre
├─ Comparados com 2º Bimestre
├─ Comparados com 3º Bimestre
├─ Comparados com 4º Bimestre
└─ Análise anual de evolução do aluno
   └─ Relatório final enviado aos pais (Dezembro)
```

---

## 🔐 Segurança e Conformidade LGPD

### **Princípios**

1. **Minimização de Dados**: Coletar apenas o necessário
2. **Criptografia**: Todos os dados em trânsito e em repouso
3. **Auditoria**: Log de quem acessou quais dados
4. **Consentimento**: Pais assinam termo de consentimento
5. **Direito ao Esquecimento**: Dados deletados após prazo

### **Implementação**

- ✅ Criptografia AES-256 para dados em repouso
- ✅ TLS 1.3 para dados em trânsito
- ✅ Logs de auditoria com timestamp e usuário
- ✅ Acesso baseado em roles (Admin, Coordenação, Pais)
- ✅ Deleção automática após prazo configurável

---

## 📊 Estrutura de Dados

### **Tabelas Principais**

```sql
-- Períodos letivos
periods (id, name, start_date, end_date, school_id)

-- Grades horárias
schedules (id, class_id, start_time, end_time, days)

-- Eventos coletados
events (id, student_id, event_type, timestamp, room_id, duration)

-- Análises de IA
insights (id, student_id, period_id, category, score, description)

-- Alertas para pais
parent_alerts (id, student_id, parent_id, message, sent_at, read_at)

-- Dados baixados
data_exports (id, period_id, school_id, file_path, downloaded_at)
```

---

## 🎯 Casos de Uso

### **Caso 1: Aluno com Atrasos Frequentes**

```
Dia 1: João chega 15 min atrasado
Dia 3: João chega 10 min atrasado
Dia 5: João chega 20 min atrasado

IA detecta: Padrão de atrasos (3x em 1 semana)
Coordenação analisa: Possível problema de transporte
Coordenação decide: Enviar alerta aos pais
Sistema envia: "João teve 3 atrasos esta semana. Podemos ajudar?"
```

### **Caso 2: Aluno Saindo Frequentemente de Sala**

```
Semana 1: Maria sai 8x de sala
Semana 2: Maria sai 12x de sala

IA detecta: Aumento de 50% em saídas (↑ desatenção)
Coordenação analisa: Possível problema de concentração
Coordenação decide: Reunião com pais + professor
Sistema envia: "Maria está saindo muito de sala. Vamos conversar?"
```

### **Caso 3: Saída Não Autorizada**

```
14:30: João sai da sala
14:35: João detectado na portaria
14:40: João sai da escola (sem autorização)

IA detecta: Saída não autorizada (URGENTE)
Coordenação analisa: Aluno fugiu
Coordenação decide: Alerta imediato aos pais
Sistema envia: SMS urgente "João saiu da escola sem autorização"
```

---

## 📱 Interface da Coordenação

### **Dashboard Principal**

```
┌─────────────────────────────────────┐
│ Áquila Pro - Painel de Coordenação  │
├─────────────────────────────────────┤
│                                     │
│ 📊 Resumo do Dia                    │
│ ├─ 5 atrasos                        │
│ ├─ 2 faltas                         │
│ ├─ 1 saída não autorizada           │
│ └─ 12 aglomerações detectadas       │
│                                     │
│ 🚨 Alertas Críticos                 │
│ ├─ João saiu da escola              │
│ ├─ Aglomeração na entrada           │
│ └─ Maria não localizada             │
│                                     │
│ 📈 Insights de IA                   │
│ ├─ João: Padrão de atrasos          │
│ ├─ Maria: Saídas frequentes         │
│ └─ Turma C: Baixo engajamento       │
│                                     │
│ ✉️ Notificações para Pais           │
│ ├─ [ ] João - Atraso               │
│ ├─ [ ] Maria - Saída frequente      │
│ └─ [ ] Turma C - Engajamento        │
│                                     │
└─────────────────────────────────────┘
```

### **Fluxo de Decisão**

```
1. Coordenação clica em "João - Padrão de atrasos"
   ↓
2. Sistema mostra: "3 atrasos em 2 semanas"
   ↓
3. Coordenação clica "Enviar alerta aos pais"
   ↓
4. Sistema oferece templates:
   - "Alerta: João teve 3 atrasos"
   - "Informativo: Podemos ajudar?"
   - "Personalizado: [Escrever mensagem]"
   ↓
5. Coordenação escolhe template e clica "Enviar"
   ↓
6. Sistema envia SMS/Email/WhatsApp aos pais
   ↓
7. Sistema registra: Quem enviou, quando, para quem
```

---

## 🔄 Ciclo Completo de um Bimestre

```
Semana 1-2: Configuração
├─ Admin define períodos
├─ Admin define grades horárias
└─ Admin cadastra alunos

Semana 3-10: Coleta e Análise
├─ Sistema coleta dados 24/7
├─ IA analisa padrões
├─ Coordenação monitora alertas
└─ Coordenação envia notificações aos pais

Semana 11: Reunião de Pais
├─ Sistema gera relatórios
├─ Coordenação apresenta dados
└─ Pais recebem feedback

Semana 12: Download e Limpeza
├─ Coordenação baixa dados para HD
├─ Sistema deleta dados do período
└─ Novo bimestre começa

Fim do Ano: Análise Anual
├─ Todos os dados do ano são compilados
├─ Relatório anual é gerado
└─ Dados são arquivados
```

---

## 📈 Métricas e KPIs

### **Por Aluno**

- Taxa de assiduidade (%)
- Média de atrasos (min/semana)
- Frequência de saídas de sala
- Tempo médio fora de sala (min/dia)
- Score de engajamento (0-100)

### **Por Turma**

- Assiduidade média (%)
- Atrasos médios (min/semana)
- Taxa de aglomeração (%)
- Engajamento médio (0-100)

### **Por Escola**

- Total de alunos monitorados
- Taxa de cobertura de câmeras (%)
- Incidentes de segurança (count)
- Satisfação dos pais (%)

---

## 🚀 Próximas Implementações

1. **Integração com Calendário Escolar** - Sincronizar feriados e recesso
2. **Comparação com Turmas** - Benchmarking de engajamento
3. **Previsão de Evasão** - IA prediz risco de abandono
4. **Relatórios Automáticos** - Geração semanal/mensal
5. **API para Sistemas Externos** - Integração com ERP escolar

---

## 📞 Suporte

- Email: andrejrunb@yahoo.com.br
- Telefone: +55 61 99962-3099
- WhatsApp: +55 61 99962-3099
