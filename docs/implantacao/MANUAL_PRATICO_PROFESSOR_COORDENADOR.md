# 📘 ÁQUILA PRO — MANUAL PRÁTICO DO DOCENTE & COORDENAÇÃO
### Guia Operacional Passo a Passo: Chamada com IA, Diário BNCC, SigaWeb e Radar de Evasão
#### Versão 2.4 — Operação Diária Escolar

---

## 👨‍🏫 PARTE 1: GUIA DO PROFESSOR (SALA DE AULA)

O Áquila Pro foi desenhado para eliminar 100% da digitação manual de faltas e notas, devolvendo até **15 minutos por aula** para o docente ensinar.

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ 1. Abrir Portal │  ───> │ 2. Conferir     │  ───> │ 3. 1 Clique     │
│   do Professor  │       │    Chamada IA   │       │    Exporta Siga │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

### 1º Passo: Abrir o Cockpit do Professor
1. No computador da sala de aula ou tablet, acesse o link:  
   👉 **`http://localhost:3000/portal/professor`** (ou abra o ícone **Áquila Pro** na Área de Trabalho);
2. Seu nome e a aula ativa aparecerão automaticamente no topo (ex: *2º Ano B • Física Aplicada • Sala 08*).

### 2º Passo: Chamada Inteligente (Zero-Typing)
1. Clique na aba **"Chamada Inteligente"**;
2. As câmeras de sala e portaria já pré-identificaram a presença dos estudantes:
   * 🟢 **P (Presente):** O aluno foi detectado na carteira ou catraca (com percentual de confiança, ex: 99.4%);
   * 🔴 **F (Falta):** O estudante não foi identificado no campus hoje;
   * 🟡 **FJ (Falta Justificada):** Aluno ausente com atestado médico anexado pela secretaria.
3. **Precisa alterar alguém manualmente?**  
   Basta clicar na letra correspondente no card do aluno (`P`, `F` ou `FJ`). A mudança é instantânea.

### 3º Passo: Registro do Conteúdo no Diário de Classe
1. Clique na aba **"Diário de Classe Digital"**;
2. O sistema sugere as habilidades da BNCC do plano pedagógico anual da semana;
3. Ajuste o texto do conteúdo ministrado ou aceite a sugestão com 1 toque;
4. Clique em **"Assinar Diário"** para registrar o carimbo digital com validade jurídica.

### 4º Passo: Exportação para o SigaWeb sem Digitação
1. No topo direito, clique no botão azul: **"Exportar SigaWeb"**;
2. O robô headless do Áquila conecta no barramento do SigaWeb e homologa o diário;
3. O status mudará imediatamente para:  
   `✅ SINCRONIZADO (Protocolo: SIGA-20261023-FEM2B-xxxx)`.  
   *Pronto! Você não precisa mais acessar o SigaWeb manualmente para lançar faltas.*

---

## 🏛️ PARTE 2: GUIA DA COORDENAÇÃO PEDAGÓGICA & DIREÇÃO

O Portal da Coordenação centraliza a saúde escolar, o cumprimento da legislação de ensino e as integrações financeiras.

### 1º Passo: Acessar a Coordenação
Acesse: 👉 **`http://localhost:3000/portal/coordenacao`**

### 2º Passo: Os 4 KPIs Mestres no Topo do Painel
* **Taxa de Presença Geral (Meta: $\ge 92\%$):** Média consolidada de todos os estudantes presentes hoje;
* **Risco de Evasão (Art. 12 da LDB):** Quantidade de alunos em radar crítico de ausências;
* **Turmas Ativas:** Status de acompanhamento de todas as salas simultaneamente;
* **Média Institucional:** Rendimento bimestral da escola.

### 3º Passo: Gestão do Radar de Evasão Escolar (Art. 12 da LDB)
> **Atenção Legal:** O Artigo 12, VII da LDB exige que a escola notifique o Conselho Tutelar e a família quando o aluno ultrapassar a tolerância legal de faltas.
1. Na aba **"Radar de Evasão"**, os estudantes são ordenados pelo número de ausências acumuladas;
2. Alunos com **10 a 14 faltas** recebem alerta amarelo preventivo;
3. Alunos com **15 faltas ou mais** recebem badge vermelho de intervenção imediata;
4. Clique em **"Disparar Intervenção"**: o sistema envia mensagem formal via WhatsApp ao responsável e gera minuta pronta para envio ao Conselho Tutelar.

### 4º Passo: Central Domínio Sistemas (Contabilidade e Financeiro)
1. Acesse a aba **"Domínio Sistemas"**;
2. O Áquila Pro agrupa todas as cobranças emitidas e mensalidades recebidas via PIX;
3. Clique em **"Exportar Lotes Domínio"**:
   * O sistema gera os arquivos no hot-folder `C:\aquila\storage\dominio_out`:
     * `|6000|` Lançamentos Contábeis de partidas dobradas;
     * `|5100|` Baixas bancárias de títulos quitados;
4. A equipe da contabilidade importa o lote diretamente no software Domínio, eliminando conciliação manual.

---

## ❓ PERGUNTAS FREQUENTES & RESOLUÇÃO DE DÚVIDAS

**Q: A internet do colégio caiu. A chamada e as catracas param de funcionar?**  
*R:* **Não!** O Áquila Pro foi construído com arquitetura de contingência local soberana. Toda a portaria e a sala de aula continuam funcionando normalmente no servidor local. Quando a internet voltar, os diários e baixas bancárias são sincronizados automaticamente.

**Q: Um aluno chegou atrasado, após o início da aula. Como proceder?**  
*R:* Ao passar pela portaria, o sistema atualiza o status de entrada no banco de dados. O professor verá o status mudar para verde ou poderá tocar no botão `P` a qualquer momento.

**Q: Como os pais acompanham as informações do filho?**  
*R:* Os pais acessam pelo celular ou computador o **Portal dos Pais** (`/portal/pais`), onde visualizam o horário de entrada em tempo real na portaria, recebem o código PIX dinâmico da mensalidade e assinam digitalmente comunicados da escola.
