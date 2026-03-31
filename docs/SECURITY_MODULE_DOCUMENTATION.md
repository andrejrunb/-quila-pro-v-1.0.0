# 🛡️ Módulo de Detecção de Segurança - Áquila Pro

**Versão**: 1.0  
**Data**: 02 de Março de 2026  
**Status**: Em Desenvolvimento

---

## 1. Visão Geral

O módulo de detecção de segurança é um sistema avançado de inteligência artificial que monitora em tempo real ameaças potenciais dentro da instituição de ensino. Utiliza visão computacional e análise comportamental para identificar e alertar sobre situações críticas de segurança.

---

## 2. Componentes Principais

### 2.1 Detecção de Violência e Armas

**Objetivo**: Identificar objetos perigosos e comportamentos violentos em tempo real.

**Objetos Detectáveis**:
- Armas de fogo (revólveres, pistolas, espingardas)
- Armas brancas (facas, machados, tesouras grandes)
- Objetos contundentes (bastões, barras de ferro)
- Explosivos (detectáveis por padrão visual)

**Comportamentos Detectáveis**:
- Agressão física entre pessoas
- Ameaça com arma
- Tentativa de ferimento
- Comportamento extremamente agressivo

**Confiança Mínima**: 85% para ativar alerta crítico

**Tempo de Resposta**: < 2 segundos

---

### 2.2 Detecção de Pessoas Não-Autorizadas

**Objetivo**: Identificar e alertar sobre presença de pessoas de fora da escola em áreas restritas.

**Funcionamento**:
- Comparação facial com banco de dados de alunos e funcionários
- Detecção de pessoas desconhecidas em corredores
- Rastreamento de movimento de desconhecidos
- Análise de padrão de permanência

**Áreas Monitoradas**:
- Corredores principais
- Salas de aula
- Áreas administrativas
- Entradas e saídas

**Confiança Mínima**: 80% para classificar como "desconhecido"

**Tempo de Resposta**: < 3 segundos

---

### 2.3 Detecção de Aglomeração Suspeita

**Objetivo**: Alertar sobre aglomerações anormais de pessoas desconhecidas.

**Critérios de Ativação**:
- Mais de 3 pessoas desconhecidas juntas
- Permanência > 2 minutos na mesma área
- Comportamento coordenado suspeito
- Proximidade física anormal

**Áreas Críticas**:
- Corredores
- Pátios
- Entradas/saídas
- Áreas comuns

**Confiança Mínima**: 75% para ativar alerta

**Tempo de Resposta**: < 5 segundos

---

## 3. Tipos de Alertas

### 3.1 Níveis de Severidade

| Nível | Descrição | Ação | Tempo de Resposta |
|-------|-----------|------|------------------|
| **CRÍTICO** | Arma detectada, violência ativa | Notificação imediata + SMS | < 1 segundo |
| **ALTO** | Pessoa desconhecida com comportamento suspeito | Notificação + Email | < 5 segundos |
| **MÉDIO** | Aglomeração de desconhecidos | Notificação no painel | < 10 segundos |
| **BAIXO** | Pessoa desconhecida identificada | Registro de log | < 30 segundos |

### 3.2 Exemplos de Alertas

**Alerta CRÍTICO**: "⚠️ ARMA DETECTADA - Sala 12 - Confiança 92% - Ação imediata necessária"

**Alerta ALTO**: "🚨 PESSOA DESCONHECIDA - Corredor B - Comportamento agressivo detectado"

**Alerta MÉDIO**: "⚡ AGLOMERAÇÃO SUSPEITA - Pátio - 4 pessoas desconhecidas juntas"

**Alerta BAIXO**: "📋 PESSOA DESCONHECIDA - Entrada Principal - Registrado para análise"

---

## 4. Arquitetura Técnica

### 4.1 Pipeline de Processamento

```
Câmera → Captura de Frame → Detecção de Objetos → Análise de Comportamento
                                    ↓
                          Comparação com Base de Dados
                                    ↓
                          Cálculo de Confiança
                                    ↓
                          Geração de Alerta (se > threshold)
                                    ↓
                          Notificação Imediata
```

### 4.2 Modelos de IA

**Detecção de Objetos**: YOLO v8 com weights customizados para armas e objetos perigosos

**Reconhecimento Facial**: Face Recognition com banco de dados de alunos/funcionários

**Análise de Comportamento**: LSTM (Long Short-Term Memory) para sequências de movimento

**Detecção de Aglomeração**: Análise de densidade e proximidade em tempo real

---

## 5. Banco de Dados

### 5.1 Novas Tabelas

```sql
-- Eventos de Segurança
security_events (
  id, school_id, camera_id, event_type, severity, 
  confidence, description, frame_url, timestamp, 
  processed_at, alert_sent_at, resolved_at
)

-- Objetos Detectados
detected_objects (
  id, security_event_id, object_type, confidence, 
  location_x, location_y, size_width, size_height
)

-- Pessoas Desconhecidas
unknown_persons (
  id, school_id, face_encoding, first_seen, 
  last_seen, total_occurrences, threat_level, 
  status (identified/unknown/banned)
)

-- Alertas de Segurança
security_alerts (
  id, security_event_id, alert_type, severity, 
  sent_to, sent_via (sms/email/push), 
  status (pending/sent/acknowledged), 
  acknowledged_by, acknowledged_at
)

-- Histórico de Respostas
security_responses (
  id, security_alert_id, responder_id, action_taken, 
  notes, resolved, resolved_at, timestamp
)
```

---

## 6. Routers tRPC

### 6.1 Endpoints de Detecção

**`security.recordViolence`** - Registrar evento de violência
- Input: `{ cameraId, eventType, confidence, description, frameUrl }`
- Output: `{ eventId, alertId, severity }`

**`security.recordUnknownPerson`** - Registrar pessoa desconhecida
- Input: `{ cameraId, faceEncoding, location, confidence }`
- Output: `{ personId, isAglomerationAlert }`

**`security.recordAglomeration`** - Registrar aglomeração suspeita
- Input: `{ cameraId, personCount, duration, confidence }`
- Output: `{ aglomerationId, alertId }`

### 6.2 Endpoints de Consulta

**`security.getActiveAlerts`** - Listar alertas ativos
- Output: `{ alerts: Alert[], totalCount, criticalCount }`

**`security.getSecurityEvents`** - Listar eventos de segurança
- Input: `{ schoolId, dateRange, severity, limit }`
- Output: `{ events: SecurityEvent[], total }`

**`security.getUnknownPersons`** - Listar pessoas desconhecidas
- Output: `{ persons: UnknownPerson[], totalCount }`

### 6.3 Endpoints de Ação

**`security.acknowledgeAlert`** - Confirmar recebimento de alerta
- Input: `{ alertId, userId }`
- Output: `{ success, timestamp }`

**`security.resolveEvent`** - Marcar evento como resolvido
- Input: `{ eventId, action, notes }`
- Output: `{ success, resolvedAt }`

**`security.identifyUnknownPerson`** - Identificar pessoa desconhecida
- Input: `{ personId, name, relationship }`
- Output: `{ success, personId }`

---

## 7. Notificações de Emergência

### 7.1 Canais

**SMS (Crítico)**
- Destinatários: Coordenador, Diretor, Segurança
- Mensagem: "ALERTA CRÍTICO: Arma detectada na Sala 12. Ação imediata necessária."
- Tempo: < 1 segundo

**Email (Alto)**
- Destinatários: Coordenação, Direção
- Assunto: "[ALERTA] Pessoa desconhecida com comportamento suspeito"
- Tempo: < 5 segundos

**Push (Médio)**
- Destinatários: Coordenadores com app
- Notificação: "Aglomeração suspeita no pátio - 4 pessoas desconhecidas"
- Tempo: < 10 segundos

**Painel Web (Todos)**
- Destinatários: Todos os coordenadores logados
- Exibição: Alerta em tempo real com vídeo
- Tempo: < 2 segundos

---

## 8. Painel de Alertas Críticos

### 8.1 Funcionalidades

**Visualização em Tempo Real**:
- Lista de alertas ativos com cores por severidade
- Vídeo ao vivo da câmera onde alerta ocorreu
- Mapa de calor de eventos por localização
- Histórico de eventos do dia

**Ações Disponíveis**:
- Confirmar recebimento de alerta
- Marcar como resolvido
- Adicionar notas
- Chamar segurança
- Enviar para polícia (em caso crítico)

**Filtros**:
- Por severidade (Crítico, Alto, Médio, Baixo)
- Por tipo de evento (Violência, Desconhecido, Aglomeração)
- Por câmera/localização
- Por período de tempo

---

## 9. Casos de Uso

### 9.1 Cenário 1: Detecção de Arma

1. Câmera detecta objeto que corresponde a "revólver"
2. Confiança: 92%
3. Alerta CRÍTICO gerado
4. SMS enviado em < 1 segundo
5. Coordenador recebe notificação
6. Painel mostra vídeo ao vivo
7. Coordenador confirma e chama segurança
8. Evento registrado no histórico

### 9.2 Cenário 2: Pessoa Desconhecida Suspeita

1. Câmera detecta pessoa desconhecida
2. Comparação com banco de dados: não encontrada
3. Comportamento: próximo a janelas, olhando para dentro
4. Confiança: 85%
5. Alerta ALTO gerado
6. Email enviado para coordenação
7. Painel mostra localização e movimento
8. Coordenador identifica como pai de aluno
9. Pessoa marcada como "identificada"

### 9.3 Cenário 3: Aglomeração no Corredor

1. Câmera detecta 5 pessoas desconhecidas juntas
2. Permanência: 3 minutos no mesmo corredor
3. Comportamento: coordenado, bloqueando passagem
4. Confiança: 78%
5. Alerta MÉDIO gerado
6. Notificação no painel
7. Coordenador observa situação
8. Pessoas se dispersam após 2 minutos
9. Evento marcado como "resolvido"

---

## 10. Conformidade e Privacidade

### 10.1 Requisitos Legais

- ✅ Conformidade com LGPD (Lei Geral de Proteção de Dados)
- ✅ Consentimento de pais/responsáveis obrigatório
- ✅ Transparência sobre monitoramento
- ✅ Direito de acesso aos dados
- ✅ Direito de exclusão de dados

### 10.2 Proteção de Dados

- ✅ Criptografia de vídeos armazenados
- ✅ Acesso restrito a coordenadores autorizados
- ✅ Auditoria completa de acessos
- ✅ Retenção de dados conforme política
- ✅ Anonimização de dados não-críticos

---

## 11. Benefícios Competitivos

### 11.1 Para Escolas

- Segurança aumentada contra ameaças externas
- Resposta rápida a situações críticas
- Tranquilidade para pais e comunidade
- Conformidade com legislação de proteção
- Redução de incidentes de segurança

### 11.2 Para Venda

- Diferencial único no mercado educacional
- Atende demanda crescente por segurança escolar
- Justifica aumento de preço do Áquila Pro
- Abre mercado de escolas premium
- Potencial para venda a órgãos públicos

---

## 12. Roadmap de Implementação

| Fase | Tarefa | Prazo |
|------|--------|-------|
| 1 | Documentação e planejamento | 1 dia |
| 2 | Extensão do schema do BD | 1 dia |
| 3 | Routers tRPC | 2 dias |
| 4 | Engine de IA (armas) | 3 dias |
| 5 | Detecção de desconhecidos | 2 dias |
| 6 | Sistema de alertas | 2 dias |
| 7 | Painel de alertas | 2 dias |
| 8 | Notificações de emergência | 1 dia |
| 9 | Página de marketing | 1 dia |
| 10 | Testes e validação | 2 dias |
| **Total** | | **17 dias** |

---

## 13. Métricas de Sucesso

- ✅ Tempo de detecção: < 2 segundos
- ✅ Taxa de falsos positivos: < 5%
- ✅ Taxa de falsos negativos: < 2%
- ✅ Confiabilidade de alertas: > 95%
- ✅ Tempo de notificação: < 1 segundo (crítico)
- ✅ Disponibilidade: 99.9% uptime

---

**Documento Confidencial - Propriedade Intelectual Protegida**
