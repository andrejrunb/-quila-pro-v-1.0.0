# Manual do Coordenador: Central de Inteligência Áquila

Este guia detalha as operações críticas para a gestão diária da escola através do Áquila Pro.

## 🦅 1. O Gestor de Unidade (Management Hub)
O Dashboard principal do Áquila é sua "Torre de Controle". 
- **Indicador de Status**: Mostra em tempo real quantas salas estão ativas e se há alertas pendentes.
- **Relatório de Evasão**: Identifica automaticamente alunos que não foram detectados na primeira aula sem justificativa.

## 📍 2. Mapeamento de Sala (Intelligent Seating)
O Áquila Pro utiliza visão computacional e relatórios pedagógicos para otimizar o ambiente de aprendizado.

### 2.1 Adicionando Regras (Pins de Restrição)
Você pode definir regras fixas que a IA deve respeitar ao sugerir mudanças:
1. Acesse **Gestão de Salas** > **Mapeamento**.
2. Clique no estudante e selecione **"Adicionar Regora"**.
3. Escolha entre:
   - **Proximidade ao Quadro**: Obrigatório para alunos com baixa visão ou TDAH.
   - **Isolamento**: Impede que o Aluno A sente próximo ao Aluno B (evita conflitos/conversas).
   - **Ponto Cego**: Evita que o aluno sente em áreas de baixa visibilidade para o professor.

### 2.2 Recomendações da IA (Córtex Evolution)
Semanalmente, o sistema emite um relatório de "Sinergia de Classe":
- **Detecção de Indisciplina**: Cruza dados de movimentação excessiva com registros de conversas de professores no SOC.
- **Sugestão de Troca**: A IA sugere "O Aluno X deve trocar de lugar com o Aluno Y para equilibrar o nível de atenção da fila central".
- **Aplicação**: Clique em `Aplicar Tudo` para imprimir o novo mapa ou enviar para o tablet do professor.

## ⚖️ 4. Gestão de Privacidade (LGPD Sovereign)
Como o Áquila Pro garante a segurança jurídica da escola:
- **Consentimento de Boot**: O sistema bloqueia o uso administrativo até que os termos de privacidade v1.5.0 sejam aceitos.
- **Purga de Dados**: Imagens brutas são deletadas após 48h, restando apenas os vetores matemáticos (embeddings) no Edge Hub.
- **Relatório DPO**: Gere em um clique o log de todos os acessos a dados sensíveis para auditoria externa.

---
*Assinado: Agente CSM v1.2 — Preparado para Lançamento Comercial*
