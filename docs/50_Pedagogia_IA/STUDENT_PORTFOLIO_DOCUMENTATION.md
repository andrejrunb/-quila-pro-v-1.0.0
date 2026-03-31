# 📊 Portfólio Completo do Aluno - Áquila Pro

**Versão**: 1.0  
**Data**: 02 de Março de 2026  
**Status**: Em Desenvolvimento

---

## 1. Visão Geral

O Portfólio Completo do Aluno é um sistema abrangente que rastreia o comportamento, assiduidade e comprometimento do aluno ao longo do ano letivo. Fornece análises detalhadas, alertas automáticos e comparativos que facilitam a comunicação com pais e a tomada de decisões pedagógicas.

---

## 2. Componentes Principais

### 2.1 Portfólio Individual do Aluno

**Informações Básicas**:
- Nome, matrícula, turma, série
- Foto do aluno
- Data de nascimento
- Responsáveis/Pais

**Seções do Portfólio**:

#### 2.1.1 Resumo Executivo (Dashboard)
- **Presença Geral**: X% de presença no ano
- **Tempo em Sala**: X horas acumuladas
- **Tempo Fora de Sala**: X horas acumuladas
- **Tempo no Banheiro**: X horas acumuladas
- **Atrasos Acumulados**: X minutos
- **Faltas Acumuladas**: X dias
- **Status Geral**: Verde (Bom) / Amarelo (Atenção) / Vermelho (Crítico)

#### 2.1.2 Histórico de Atrasos
Tabela com:
- Data e hora do atraso
- Duração (minutos)
- Motivo (se registrado)
- Acumulado do mês/bimestre/ano

Exemplo:
```
Data        | Hora    | Duração | Motivo          | Acumulado
03/02/2026  | 08:20   | 5 min   | Trânsito        | 15 min (mês)
01/02/2026  | 08:15   | 10 min  | Não informado   | 10 min
28/01/2026  | 08:25   | 5 min   | Dentista        | 5 min
```

#### 2.1.3 Histórico de Faltas
Tabela com:
- Data da falta
- Período (manhã/tarde/integral)
- Justificada/Injustificada
- Motivo (se informado)
- Acumulado do mês/bimestre/ano

Exemplo:
```
Data        | Período | Justificada | Motivo              | Acumulado
28/02/2026  | Integral| Sim         | Médico              | 2 dias (mês)
15/02/2026  | Manhã   | Não         | -                   | 1.5 dias
```

#### 2.1.4 Histórico de Saídas de Sala
Tabela com:
- Data e hora da saída
- Duração (minutos)
- Motivo (banheiro, enfermaria, coordenação, etc.)
- Acumulado do dia/semana/mês/ano

Exemplo:
```
Data        | Hora    | Duração | Motivo          | Acumulado (Dia)
02/03/2026  | 10:15   | 8 min   | Banheiro        | 18 min
02/03/2026  | 09:30   | 10 min  | Banheiro        | 10 min
01/03/2026  | 14:45   | 5 min   | Enfermaria      | 5 min
```

#### 2.1.5 Histórico de Visitas ao Banheiro
Tabela com:
- Data e hora
- Duração (minutos)
- Frequência (quantas vezes por dia/semana)
- Padrões detectados

Exemplo:
```
Data        | Hora    | Duração | Frequência (Dia) | Padrão
02/03/2026  | 10:15   | 8 min   | 2ª vez           | Normal
02/03/2026  | 09:30   | 10 min  | 1ª vez           | Normal
01/03/2026  | 14:45   | 5 min   | 1ª vez           | Normal
```

---

## 3. Métricas Cumulativas

### 3.1 Cálculos Principais

**Presença (%)**
```
Presença = (Dias Presentes / Dias Letivos) × 100
```

**Tempo em Sala (horas)**
```
Tempo em Sala = Soma de (Horário Saída - Horário Entrada) para cada dia
```

**Tempo Fora de Sala (horas)**
```
Tempo Fora = Soma de todas as durações de saídas de sala
```

**Tempo no Banheiro (horas)**
```
Tempo Banheiro = Soma de todas as durações de visitas ao banheiro
```

**Atraso Acumulado (minutos)**
```
Atraso Acumulado = Soma de todos os atrasos do período
```

**Faltas Acumuladas (dias)**
```
Faltas = Contagem de dias com falta integral ou parcial
```

### 3.2 Períodos de Cálculo

- **Diário**: Dados do dia atual
- **Semanal**: Últimos 7 dias
- **Mensal**: Mês corrente
- **Bimestral**: Bimestre corrente
- **Anual**: Ano letivo completo

---

## 4. Alertas Automáticos

### 4.1 Condições de Alerta

| Métrica | Limite | Severidade | Ação |
|---------|--------|-----------|------|
| Atraso Acumulado (mês) | > 60 min | Médio | Notificar coordenador |
| Atraso Acumulado (bimestre) | > 180 min | Alto | Notificar pai + coordenador |
| Faltas (mês) | > 3 dias | Médio | Notificar coordenador |
| Faltas (bimestre) | > 10 dias | Alto | Notificar pai + coordenador |
| Tempo Banheiro (dia) | > 30 min | Médio | Notificar coordenador |
| Tempo Banheiro (semana) | > 120 min | Alto | Notificar pai + coordenador |
| Saídas de Sala (dia) | > 5 vezes | Médio | Notificar coordenador |
| Presença (ano) | < 75% | Crítico | Notificar pai + diretor |

### 4.2 Exemplos de Alertas

**Alerta Médio**: "João Silva acumulou 65 minutos de atraso em fevereiro. Limite: 60 minutos."

**Alerta Alto**: "João Silva acumulou 12 faltas no 1º bimestre. Limite: 10 dias. Contatar responsável."

**Alerta Crítico**: "João Silva está com 72% de presença no ano. Limite mínimo: 75%. Ação imediata necessária."

---

## 5. Comparativos

### 5.1 Comparação com Turma

Mostrar o aluno em relação à média da turma:

```
Métrica                 | Aluno    | Média Turma | Posição
Presença                | 95%      | 92%         | Acima da média (+3%)
Tempo em Sala           | 185h     | 180h        | Acima da média (+5h)
Tempo Fora de Sala      | 8h       | 12h         | Abaixo da média (-4h)
Atraso Acumulado        | 45 min   | 60 min      | Abaixo da média (-15 min)
Faltas Acumuladas       | 2 dias   | 3 dias      | Abaixo da média (-1 dia)
Tempo Banheiro          | 4h       | 6h          | Abaixo da média (-2h)
```

### 5.2 Comparação com Escola

Mostrar o aluno em relação à média da escola:

```
Métrica                 | Aluno    | Média Escola | Percentil
Presença                | 95%      | 90%          | Top 25%
Tempo em Sala           | 185h     | 175h         | Top 30%
Tempo Fora de Sala      | 8h       | 15h          | Top 10%
```

### 5.3 Gráficos Comparativos

- **Gráfico de Presença**: Aluno vs. Turma vs. Escola (linha)
- **Gráfico de Atrasos**: Aluno vs. Turma (barras)
- **Gráfico de Tempo Fora**: Aluno vs. Turma (área)
- **Ranking**: Posição do aluno na turma (1º, 2º, 3º, etc.)

---

## 6. Relatório para Pais

### 6.1 Visualização Amigável

**Formato**: Simples, colorido, fácil de entender

**Seções**:

1. **Resumo Geral**
   - "João está indo bem na escola! Presença: 95% ✅"
   - "João chegou atrasado 3 vezes em fevereiro (45 minutos no total)"
   - "João faltou 2 dias no mês"

2. **Gráficos Visuais**
   - Gráfico de pizza: Tempo em sala vs. Tempo fora
   - Gráfico de linha: Presença ao longo do mês
   - Gráfico de barras: Atrasos por semana

3. **Recomendações**
   - "Ótimo desempenho! Continue assim!"
   - "Atenção: João está faltando mais que o normal. Recomendamos conversar com ele."
   - "Alerta: João está passando muito tempo fora da sala. Pode ser sinal de dificuldade de concentração."

4. **Comparativo**
   - "João está acima da média da turma em presença"
   - "João está abaixo da média em tempo fora de sala (bom sinal!)"

---

## 7. Banco de Dados

### 7.1 Novas Tabelas

```sql
-- Métricas Cumulativas do Aluno
student_metrics (
  id, studentId, academicPeriodId, 
  totalDaysPresent, totalDaysAbsent, totalDaysJustified,
  totalMinutesLate, totalMinutesOutOfClass, totalMinutesBathroom,
  totalHoursInClass, totalHoursOutOfClass,
  presencePercentage, lastUpdated, createdAt
)

-- Alertas Comportamentais
behavioral_alerts (
  id, studentId, academicPeriodId, alertType, severity,
  metric, currentValue, threshold, message,
  sentTo, sentAt, acknowledged, acknowledgedAt, createdAt
)

-- Histórico de Atrasos
late_arrivals (
  id, studentId, date, time, durationMinutes, reason, createdAt
)

-- Histórico de Faltas
absences (
  id, studentId, date, period (morning/afternoon/full), 
  justified, reason, createdAt
)

-- Histórico de Saídas de Sala
room_exits (
  id, studentId, date, exitTime, returnTime, durationMinutes,
  reason (bathroom/nurse/coordination/other), createdAt
)
```

---

## 8. Routers tRPC

### 8.1 Endpoints de Portfólio

**`student.getPortfolio`** - Obter portfólio completo
- Input: `{ studentId, academicPeriodId }`
- Output: `{ student, metrics, alerts, history }`

**`student.getMetrics`** - Obter métricas cumulativas
- Input: `{ studentId, academicPeriodId, period (daily/weekly/monthly/yearly) }`
- Output: `{ presencePercentage, timeInClass, timeOutOfClass, timeBathroom, lateMinutes, absences }`

**`student.getHistory`** - Obter histórico detalhado
- Input: `{ studentId, historyType (late/absent/roomExit/bathroom), limit }`
- Output: `{ records: HistoryRecord[] }`

**`student.getComparison`** - Obter comparativos
- Input: `{ studentId, academicPeriodId, compareWith (class/school) }`
- Output: `{ studentMetrics, averageMetrics, percentile, ranking }`

**`student.getParentReport`** - Obter relatório para pais
- Input: `{ studentId, academicPeriodId }`
- Output: `{ summary, graphs, recommendations, alerts }`

### 8.2 Endpoints de Alertas

**`student.getBehavioralAlerts`** - Listar alertas comportamentais
- Output: `{ alerts: BehavioralAlert[] }`

**`student.acknowledgeAlert`** - Confirmar alerta
- Input: `{ alertId }`
- Output: `{ success }`

---

## 9. Casos de Uso

### 9.1 Cenário 1: Aluno com Atrasos Frequentes

1. Sistema detecta que João chegou atrasado 5 vezes em fevereiro (75 minutos)
2. Alerta ALTO é gerado: "Atraso acumulado > 60 minutos"
3. Coordenador recebe notificação
4. Coordenador clica no portfólio de João
5. Vê histórico detalhado de atrasos com datas e horários
6. Vê que João está abaixo da média da turma (bom sinal)
7. Coordenador entra em contato com os pais
8. Pais recebem relatório amigável mostrando o problema

### 9.2 Cenário 2: Aluno Faltando Muito

1. Sistema detecta que Maria faltou 5 dias em fevereiro
2. Alerta CRÍTICO é gerado: "Faltas > 3 dias"
3. Coordenador e diretor recebem notificação
4. Coordenador clica no portfólio de Maria
5. Vê que 3 faltas foram justificadas (médico) e 2 injustificadas
6. Vê que presença de Maria caiu para 88% (abaixo de 90%)
7. Coordenador entra em contato com pais para investigar
8. Sistema gera relatório para pais com recomendações

### 9.3 Cenário 3: Aluno Passando Muito Tempo Fora de Sala

1. Sistema detecta que Pedro saiu de sala 8 vezes em um dia
2. Alerta MÉDIO é gerado: "Saídas de sala > 5 vezes"
3. Coordenador recebe notificação
4. Coordenador clica no portfólio de Pedro
5. Vê que Pedro passou 45 minutos fora de sala naquele dia
6. Vê padrão: Pedro sempre sai no mesmo horário (pode ser banheiro)
7. Coordenador conversa com Pedro para investigar
8. Descobre que Pedro tem problema de concentração
9. Recomenda avaliação pedagógica

---

## 10. Benefícios

### 10.1 Para Coordenadores

- ✅ Visão completa do comportamento do aluno
- ✅ Alertas automáticos para ação rápida
- ✅ Dados para conversa com pais
- ✅ Identificação de padrões problemáticos
- ✅ Comparativos para contexto

### 10.2 Para Pais

- ✅ Relatórios claros e visuais
- ✅ Entendimento do desempenho do filho
- ✅ Alertas sobre problemas
- ✅ Recomendações de ação
- ✅ Comparação com pares

### 10.3 Para Alunos

- ✅ Feedback sobre seu comportamento
- ✅ Motivação para melhorar
- ✅ Reconhecimento de bom desempenho
- ✅ Identificação de áreas de melhoria

---

## 11. Roadmap de Implementação

| Fase | Tarefa | Prazo |
|------|--------|-------|
| 1 | Documentação | 1 dia |
| 2 | Estender schema | 1 dia |
| 3 | Routers tRPC | 2 dias |
| 4 | Cálculos de métricas | 2 dias |
| 5 | Sistema de alertas | 1 dia |
| 6 | UI do portfólio | 2 dias |
| 7 | Dashboard comparativo | 2 dias |
| 8 | Relatório para pais | 1 dia |
| 9 | Testes | 1 dia |
| **Total** | | **13 dias** |

---

**Documento Confidencial - Propriedade Intelectual Protegida**
