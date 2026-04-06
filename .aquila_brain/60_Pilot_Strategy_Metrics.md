# 🚀 Estratégia de Piloto (Escola Alpha)

O foco deste piloto é a **estabilidade absoluta** dos fluxos que impactam a rotina diária da escola. Features experimentais ficam ocultas (`feature-flag: hidden`).

## 🛠️ Fluxos Críticos "Ponta a Ponta"

1. **Presença & Segurança (The Sentinel Flow)**:
   - Registro de presença confiável (via App ou Interface de Chamada Rápida).
   - Estabilização do monitoramento de câmeras (sem quedas de stream).
   - Alertas críticos de segurança chegando no dashboard da coordenação.

2. **Comunicação Familiar (Córtex Docente)**:
   - Fluxo: Professor redige -> Coordenação revisa/aprova -> Pais recebem Push/Mensagem.
   - Garantia de que nenhuma mensagem "vaze" sem aprovação.

3. **Fundação de Dados (Cadastros Básicos)**:
   - Importação assistida de Alunos/Turmas/Horários (sem erros de duplicidade).
   - Gestão de Usuários (Permissões claras: Quem pode ver o quê).

## 📊 Métricas de Sucesso (KPIs do Piloto)

| Métrica | Descrição | Meta |
| :--- | :--- | :--- |
| **Tempo de Ocorrência** | Tempo médio para um professor registrar uma ocorrência pedagógica. | < 45 segundos |
| **Fidelidade de Presença** | % de aulas com presença registrada digitalmente (vs. papel). | > 95% |
| **Engajamento de Pais** | Taxa de abertura de comunicados oficiais no portal/app. | > 70% |
| **MTTR (Segurança)** | Tempo médio para a coordenação reconhecer um alerta de segurança. | < 2 minutos |

## 🏗️ Evolução Backstage (Desenvolvimento Paralelo)

Enquanto a escola opera o núcleo estável, o desenvolvimento avança em:
- **Modularização do Kernel**: Refatoração do `main.ts` para serviços independentes.
- **LGPD Deep-Dive**: Automatização de exportação de dados e logs de auditoria.
- **T3 Foundation**: Consolidação do tRPC e Drizzle para o escalonamento Multi-Tenant.
- **Roadmap & Narrativa**: Documentação da "História do Áquila" para o Deck de Investimento.

---
*Prioridade: Se não está pronto para a rotina do diretor, está escondido.*
