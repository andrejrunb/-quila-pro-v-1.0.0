# 🎨 Áquila Pro — Guia UX/UI (Extraído do JustinMind)

## Princípios Fundamentais

### Regra dos 5 Segundos
O usuário deve entender o estado principal, métricas-chave e ações imediatas em **5 segundos**.

### Pirâmide Invertida de Informação
1. **Topo**: KPIs e resumo executivo
2. **Meio**: Tendências e detalhes
3. **Base**: Dados granulares sob demanda (drill-down)

### Carga Cognitiva Zero
- Disclosure progressivo (mostrar detalhes sob demanda)
- Sidebars colapsáveis
- Espaçamento generoso (mínimo 16-24px de padding)

---

## Padrões de Navegação

| Padrão | Uso no Áquila |
|:-------|:-------------|
| **Sidebar Lateral Persistente** | Ícone + label para módulos core (Dashboard, Turmas, Notas, Financeiro, Config) |
| **Breadcrumb** | Escola > 3º Ano > Turma A > Matemática > Unidade 3 |
| **TopBar Utilitária** | Busca Global (Ctrl+K), Ano Letivo, Notificações, Perfil |
| **Tabs Contextuais** | Perfil Aluno > Visão Geral \| Frequência \| Notas \| Documentos \| Financeiro |

---

## Layout de Dashboards

### Padrão F/Z (Escaneamento Visual)
- **Topo**: 4 KPI Cards (Alunos, Frequência, Receita, Satisfação)
- **Meio-Esquerda (60%)**: Gráficos de tendência (receita, matrículas)
- **Meio-Direita (40%)**: Alertas e lista de inadimplentes
- **Base**: Feed de atividades recentes

### Filtro Dinâmico Sticky
Período Letivo, Série, Turno, Turma — sempre visíveis no topo.

---

## Design de Formulários

- **Coluna Única**: Alinhamento vertical para velocidade
- **Wizard Multi-Etapas**: Para matrícula e config (3-4 passos com progress bar)
- **Validação Inline**: onBlur com checkmark verde ou erro vermelho
- **Labels Flutuantes**: Visíveis acima do input durante foco
- **Ação Primária à Direita**: "Salvar" (sólido) | "Cancelar" (ghost) à esquerda

---

## Visualização de Dados

| Tipo de Gráfico | Uso |
|:----------------|:----|
| **Linha/Área** | Tendências (frequência mensal, receita trimestral) |
| **Barras** | Comparações (desempenho por turma, distribuição por série) |
| **Gauge/Anel** | Percentuais (progresso do currículo, meta de arrecadação) |
| **Donut** | Proporções (max 4-5 categorias: Ativo, Suspenso, Formado) |

- Tooltips com valores exatos no hover
- Cores com alto contraste para daltônicos
- Tabelas: máximo 10-20 linhas com paginação

---

## Acessibilidade (WCAG 2.1 AA)

- Contraste mínimo 4.5:1 para texto, 3:1 para bordas
- Navegação completa por teclado (Tab, Enter, Space, Arrows)
- HTML semântico (main, nav, header, table, button)
- ARIA labels para leitores de tela
- Estados NUNCA apenas por cor — sempre acompanhar com texto/ícone

---

## Mobile Responsivo

- Grid → coluna única em < 768px
- Bottom nav fixo (3-5 destinos primários) + drawer para secundários
- Touch targets: mínimo 44x44px
- Tabelas densas → card stacks ou scroll horizontal com coluna fixa

---

## Aplicação nos Portais Áquila

### 🏛️ Admin Portal
- KPIs: Alunos Matriculados, % Inadimplência, Frequência, Pendências
- Status badges: 🟢 Pago, 🟡 Pendente, 🔴 Atrasado
- Ações em lote com barra sticky

### 👨‍🏫 Teacher Portal
- Calendário semanal interativo com acesso rápido a chamada/diário
- Grade inline com auto-save ("Salvo 12:44")
- Botões rápidos: P (Presente), A (Ausente), L (Atrasado)
- "Marcar Todos Presentes" como atalho

### 🎓 Student/Parent Portal
- Anéis de progresso por disciplina
- Badges de conquista (frequência perfeita, streak de tarefas)
- Switcher de filhos para pais com múltiplos alunos
- Modal 1-click para pagamento PIX

### 🚀 Landing Page SaaS
- Hero: headline + dual CTA + screenshot interativo
- Contador animado: "500+ Escolas", "150k+ Alunos", "99.9% Uptime"
- Tabs segmentados: "Para Administradores" | "Para Professores" | "Para Pais"
- Pricing: 3 tiers (Starter, Professional, Sovereign)
