# Arquitetura de Fotos e Reconhecimento Dinâmico - Áquila Pro

## 📋 Visão Geral

O sistema Áquila Pro implementa um fluxo completo de gerenciamento de fotos de alunos com reconhecimento facial dinâmico que aprende continuamente com imagens capturadas nos corredores. A arquitetura suporta upload em lote (Excel) e individual, validação automática de qualidade, armazenamento híbrido (local + nuvem) e alertas de identificação manual para casos não identificados.

---

## 🎯 Fluxos Principais

### Fluxo 1: Upload de Fotos em Lote (Excel)

**Processo:**
1. Escola baixa modelo de planilha Excel gerado pelo sistema
2. Preenche com dados dos alunos (nome, matrícula, turma)
3. Adiciona pasta compactada (ZIP) com fotos organizadas por aluno
4. Faz upload da planilha + ZIP no sistema
5. Sistema valida qualidade de cada foto
6. Fotos ruins são listadas com recomendação de recaptura
7. Fotos válidas são armazenadas (local + nuvem)
8. Modelo de reconhecimento é treinado

**Estrutura do ZIP:**
```
alunos_fotos.zip
├── joao_silva_001/
│   ├── foto_1.jpg
│   ├── foto_2.jpg
│   └── foto_3.jpg
├── maria_santos_002/
│   ├── foto_1.jpg
│   ├── foto_2.jpg
│   └── foto_3.jpg
```

**Validação de Qualidade:**
- ✅ Resolução mínima: 640x480px
- ✅ Rosto ocupa 30-70% da imagem
- ✅ Iluminação adequada (não muito escuro/claro)
- ✅ Rosto frontal ou ângulo < 30°
- ✅ Olhos abertos e visíveis
- ✅ Sem óculos de sol ou chapéu
- ✅ Sem desfoque ou movimento

---

### Fluxo 2: Upload Individual de Fotos

**Processo:**
1. Coordenador seleciona aluno no painel
2. Clica "Adicionar Foto"
3. Captura foto via webcam ou faz upload de arquivo
4. Sistema valida qualidade em tempo real
5. Se válida: armazena e treina modelo
6. Se inválida: mostra motivo e pede recaptura imediata

**Validação em Tempo Real:**
- Feedback visual (verde/vermelho)
- Mensagem clara do problema
- Sugestões de correção

---

### Fluxo 3: Captura Automática nos Corredores

**Processo:**
1. Câmera detecta aluno no corredor
2. Sistema identifica usando modelo atual
3. Se identificado com confiança > 95%:
   - Registra evento de presença
   - Armazena foto capturada localmente
4. Se confiança < 95%:
   - Envia alerta para coordenação
   - Pede identificação manual
   - Armazena foto para análise

**Benefício:** Modelo aprende continuamente com novos ângulos/iluminação

---

### Fluxo 4: Identificação Manual pela Coordenação

**Processo:**
1. Sistema detecta aluno não identificado
2. Envia alerta para coordenador
3. Mostra foto capturada + 5 candidatos mais prováveis
4. Coordenador clica no aluno correto
5. Sistema registra evento e treina modelo
6. Próximas detecções desse aluno serão mais precisas

---

## 🗄️ Armazenamento de Fotos

### Opção 1: Local (Mais Seguro)

**Localização:** `/home/ubuntu/aquila-pro-website/storage/student_photos/`

**Estrutura:**
```
storage/student_photos/
├── school_001/
│   ├── period_001/
│   │   ├── class_001/
│   │   │   ├── student_001/
│   │   │   │   ├── original/
│   │   │   │   │   ├── 2026-03-01_10-30-45.jpg
│   │   │   │   │   └── 2026-03-02_14-15-20.jpg
│   │   │   │   └── processed/
│   │   │   │       ├── face_aligned_001.jpg
│   │   │   │       └── face_aligned_002.jpg
```

**Vantagens:**
- ✅ Máxima privacidade
- ✅ Sem dependência de internet
- ✅ Conformidade LGPD simplificada
- ✅ Sem custos de nuvem

**Desvantagens:**
- ❌ Requer backup manual
- ❌ Limitado ao espaço em disco

---

### Opção 2: Nuvem Segura (Escalável)

**Provedores Recomendados:**
- AWS S3 com criptografia KMS
- Google Cloud Storage com criptografia
- Azure Blob Storage com criptografia

**Estrutura no S3:**
```
s3://aquila-pro-photos/
├── school_001/
│   ├── period_001/
│   │   ├── class_001/
│   │   │   ├── student_001/
│   │   │   │   ├── original/
│   │   │   │   └── processed/
```

**Vantagens:**
- ✅ Escalável ilimitado
- ✅ Backup automático
- ✅ Acesso remoto seguro
- ✅ Conformidade LGPD com criptografia

**Desvantagens:**
- ❌ Custo mensal
- ❌ Dependência de internet

---

### Opção 3: Híbrida (Recomendada)

**Estratégia:**
1. Fotos originais armazenadas localmente
2. Fotos processadas (face aligned) em nuvem
3. Modelo de reconhecimento em nuvem
4. Backup automático local → nuvem

**Benefício:** Máxima segurança + escalabilidade

---

## 🧠 Modelo Dinâmico de Reconhecimento

### Arquitetura

**Componentes:**
1. **Base Model**: Face Recognition Library (99.38% precisão)
2. **Fine-tuning**: Treinamento com fotos da escola
3. **Continuous Learning**: Aprende com capturas nos corredores
4. **Threshold Adaptativo**: Ajusta confiança conforme aprende

---

### Ciclo de Aprendizado

**Fase 1: Treinamento Inicial**
- Usa fotos de cadastro (5-10 por aluno)
- Gera embeddings de referência
- Calcula threshold de confiança por aluno

**Fase 2: Aprendizado Contínuo**
- Cada captura nos corredores atualiza o modelo
- Se confiança > 95%: adiciona ao dataset
- Se confiança 70-95%: aguarda confirmação manual
- Se confiança < 70%: descarta

**Fase 3: Retrainamento Periódico**
- Semanal: retraina com novas capturas
- Mensal: valida precisão geral
- Trimestral: ajusta thresholds

---

### Métricas de Qualidade

| Métrica | Alvo | Ação se Não Atingido |
|---------|------|---------------------|
| Precisão Geral | > 95% | Recolher mais fotos |
| Recall por Aluno | > 90% | Treinar modelo específico |
| Falsos Positivos | < 2% | Aumentar threshold |
| Tempo de Inferência | < 100ms | Otimizar modelo |

---

## 📊 Grade Horária via Excel

### Gerador de Modelo

**Processo:**
1. Coordenador clica "Gerar Modelo de Grade Horária"
2. Sistema cria arquivo Excel com estrutura:
   - Abas por turma
   - Colunas: Dia, Horário Início, Horário Fim, Disciplina, Professor
   - Validações integradas (sem sobreposição de horários)

**Estrutura do Excel:**
```
Turma: 7A
Dia       | Início | Fim   | Disciplina | Professor
Segunda   | 07:30  | 08:20 | Português  | Maria Silva
Segunda   | 08:20  | 09:10 | Matemática | João Santos
...
```

---

### Importador de Grade Horária

**Processo:**
1. Escola preenche Excel e faz upload
2. Sistema valida:
   - ✅ Formato correto
   - ✅ Horários válidos (não sobrepostos)
   - ✅ Turmas existentes
   - ✅ Professores válidos
3. Mostra erros (se houver) com recomendações
4. Importa dados se válido
5. Vincula horários às portas das salas

**Vinculação Porta-Turma-Horário:**
```
Porta 101 (Sala 7A) → Turma 7A → Horários importados
```

---

## 🚨 Alertas de Identificação Manual

### Tipos de Alertas

| Tipo | Condição | Ação |
|------|----------|------|
| **Não Identificado** | Confiança < 70% | Mostra foto + 5 candidatos |
| **Ambíguo** | 2+ alunos com confiança similar | Pede confirmação |
| **Novo Aluno** | Rosto não no dataset | Pede cadastro manual |
| **Qualidade Baixa** | Foto muito desfocada/escura | Pede recaptura |

### Interface de Identificação

**Painel do Coordenador:**
1. Foto capturada (grande)
2. 5 candidatos com % de confiança
3. Botão "Confirmar" para cada candidato
4. Botão "Novo Aluno" se nenhum corresponde
5. Histórico de identificações manuais

---

## 🔐 Segurança e LGPD

### Criptografia

**Em Repouso:**
- Fotos locais: criptografia AES-256
- Fotos em nuvem: criptografia KMS

**Em Trânsito:**
- HTTPS/TLS 1.3
- Tokens JWT com expiração

### Conformidade LGPD

**Consentimento:**
- ✅ Termo específico para fotos
- ✅ Pais assinam na matrícula
- ✅ Direito de revogação

**Retenção:**
- Fotos de cadastro: até fim do ano letivo + 1 ano
- Fotos capturadas: até fim do bimestre + 30 dias
- Modelo de IA: até fim do ano letivo

**Direitos:**
- ✅ Acesso: Pais podem solicitar fotos do filho
- ✅ Exclusão: Pode solicitar deleção
- ✅ Portabilidade: Recebe cópia em ZIP

---

## 📈 Roadmap de Implementação

**Semana 1-2:**
- [ ] Estender schema (tabelas de fotos)
- [ ] Criar routers tRPC para upload
- [ ] Implementar validação de qualidade

**Semana 3-4:**
- [ ] Sistema de armazenamento local + nuvem
- [ ] Modelo dinâmico de reconhecimento
- [ ] Alertas de identificação manual

**Semana 5-6:**
- [ ] UI de upload de fotos
- [ ] Gerador de modelo Excel
- [ ] Importador de grade horária

**Semana 7-8:**
- [ ] Testes completos
- [ ] Documentação
- [ ] Deploy em produção

---

## 🎓 Conclusão

A arquitetura de fotos e reconhecimento dinâmico do Áquila Pro oferece um sistema robusto, escalável e conforme com LGPD. O modelo aprende continuamente, melhorando precisão ao longo do tempo, enquanto mantém máxima privacidade e segurança dos dados dos alunos.
