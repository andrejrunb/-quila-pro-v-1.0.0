# 📚 Runbook: Bee Training & Activation

Este guia define o processo para criar uma nova identidade de agente especialista (Bee) no ecossistema Áquila Pro.

---

## 🛠️ Requisitos de Criação

Cada Bee deve possuir:
1. **Nome**: Formato `Dominio-Bee` ou `Funcao-Especialista`.
2. **Identidade Visual**: Definida no Elite Design (ex: cor de destaque, ícone de representação).
3. **Escopo de Dados**: Quais bancos ou arquivos o agente tem permissão de ler sob o princípio de Soberania.

---

## 📋 Passo a Passo de Implementação

### 1. Criar Arquivo de Instruções
Crie um arquivo em `aquila-wiki/agents/{nome}_bee.md` seguindo o template:
- **Missão**: O que o agente quer alcançar?
- **Conhecimento**: Em quais tecnologias/arquivos ele é mestre?
- **Guardrails**: O que ele NUNCA deve fazer (ex: enviar dados para nuvem).

### 2. Registrar no Manifesto estático
Adicione o novo agente à tabela em `aquila-wiki/agents/manifest.md`.

### 3. Integrar ao Agent Hub
Atualize `aquila-wiki/pages/agent_hub.md` com o status e a "Ação Rápida" do novo especialista.

### 4. Teste de Identidade
Solicite ao Antigravity:
> *"Aja como o novo **{Nome} Bee** e analise [Arquivo Exemplo]."*
Verifique se a resposta respeita os guardrails definidos.

---

## 🛡️ Guardrails de Treinamento
- **Zero Hallucination**: Se o agente não tiver acesso ao arquivo de esquema, ele deve solicitar ao `Wiki-Scribe`.
- **Privacy First**: Instruções devem reforçar a LGPD em todos os níveis.

---
*Manutenção: Wiki-Scribe v1.0*
