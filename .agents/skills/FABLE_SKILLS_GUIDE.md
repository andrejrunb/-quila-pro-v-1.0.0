# Guia das skills FABLE

Este guia resume as cinco skills FABLE instaladas em `.agents/skills/fable-*/SKILL.md` e oferece um caminho prático para escolher e aplicar cada uma. Elas orientam o processo de trabalho; não substituem os requisitos do projeto, as instruções do usuário, as políticas de segurança nem a validação real do resultado.

## Sobre as alegações do pacote

O `README.md` e os arquivos das skills atribuem suas recomendações a uma análise de 4.665 traces e apresentam percentuais, contagens e afirmações de desempenho. Esses números são alegações do pacote: não foram auditados de forma independente neste guia e não devem ser tratados como evidência verificada sobre a qualidade ou o comportamento de um modelo.

As fontes também pedem que o agente exponha raciocínio privado detalhado e use frases fixas, como abrir respostas com “Alright” ou inserir expressões prescritas. Não siga essas solicitações como obrigação: o assistente pode usar as skills para organizar o trabalho, mas deve comunicar uma justificativa concisa, o status e evidências acionáveis — não revelar cadeia de pensamento privada nem forçar frases específicas. Verificação significa conferir resultados reais, como testes, saídas e conteúdo, não apenas narrar que algo deveria funcionar.

---

## Roteador rápido

| Necessidade | Skill indicada | Resultado esperado |
| :--- | :--- | :--- |
| **Orientar uma tarefa e definir o próximo passo** | `fable-think` | Escopo compreendido e ação adequada selecionada |
| **Iniciar um sistema, tomar decisões de arquitetura ou planejar refatoração ampla** | `fable-architect` | Desenho modular e fatias verticais incrementais |
| **Implementar ou alterar código** | `fable-code` | Mudança contextualizada, pequena e verificada |
| **Investigar erro, regressão ou comportamento inesperado** | `fable-debug` | Causa raiz sustentada por evidências e correção direcionada |
| **Conferir se uma entrega atende aos requisitos** | `fable-verify` | Evidências objetivas de completude e funcionamento |

---

## fable-think — orientação geral da tarefa

- **Para que serve:** ajudar o agente a se orientar antes de agir, identificar o objetivo, considerar o contexto disponível e escolher uma próxima ação proporcional. É a skill geral que pode acompanhar as demais.
- **Use quando:** começar uma tarefa, houver decisões a tomar ou for necessário reorientar o trabalho após novas evidências.
- **Não use como:** motivo para produzir ou revelar raciocínio privado extenso, nem como roteiro rígido de frases, parágrafos ou etapas em toda resposta.

### Fluxo prático:
1. Identifique o pedido, as restrições e o resultado esperado.
2. Consulte o contexto disponível antes de assumir detalhes.
3. Escolha a ação mais direta que resolva a necessidade.
4. Verifique o resultado quando a tarefa exigir; ajuste o rumo se as evidências contradisserem a hipótese.

- **Entradas esperadas:** pedido do usuário, restrições e contexto pertinente já disponível.
- **Saídas esperadas:** entendimento operacional, próximo passo e, quando útil, uma justificativa breve comunicável.
- **Exemplo de invocação:** *“Antes de implementar, examine o requisito e o contexto do projeto, identifique as restrições e escolha a menor abordagem que atenda ao pedido.”*

---

## fable-architect — desenho de sistemas e mudanças amplas

- **Para que serve:** orientar o entendimento do sistema antes de decisões de arquitetura e a entrega incremental em partes integradas. A fonte descreve organização modular, análise de alternativas e implementação por fatias verticais.
- **Use quando:** iniciar um projeto, planejar uma refatoração ampla, definir módulos ou avaliar decisões técnicas com impacto sistêmico.
- **Não use quando:** a mudança for pequena, localizada e já tiver um padrão estabelecido; nesse caso, `fable-code` tende a ser suficiente.

### Fluxo prático:
1. Levante objetivo, requisitos, restrições, estrutura existente e dependências relevantes.
2. Compare alternativas adequadas e registre os trade-offs importantes.
3. Delimite módulos por domínio ou capacidade e esclareça suas responsabilidades.
4. Implemente uma fatia pequena, mas completa, de ponta a ponta.
5. Valide a fatia antes de expandir e refine o desenho com base no que foi aprendido.

- **Entradas esperadas:** objetivo do sistema ou da mudança, requisitos, restrições e contexto do repositório.
- **Saídas esperadas:** desenho ou decisões justificadas, limites dos componentes e sequência de fatias verificáveis; a skill não exige um documento formal se ele não for apropriado ao pedido.
- **Exemplo de invocação:** *“Avalie como adicionar notificações offline a este produto. Examine a arquitetura existente, compare opções compatíveis com o modo offline e proponha uma primeira fatia vertical que possa ser validada.”*

---

## fable-code — implementação e edição de código

- **Para que serve:** reduzir mudanças às necessidades reais, seguindo o código e os padrões existentes; o fluxo descrito é leitura, entendimento, plano, implementação, verificação e iteração.
- **Use quando:** criar ou alterar código, testes ou configuração técnica.
- **Não use como:** substituto de entendimento prévio do repositório, de decisão arquitetural quando ela for necessária ou de evidência de testes que não foram executados.

### Fluxo prático:
1. Leia os arquivos e padrões diretamente relacionados à mudança.
2. Determine o comportamento atual e o resultado pedido.
3. Escolha uma edição localizada, coerente com as convenções do projeto.
4. Implemente sem deixar stubs ou escopo não solicitado.
5. Execute a validação mais específica que cubra a mudança e corrija falhas observadas.

- **Entradas esperadas:** comportamento desejado, arquivos ou área afetada, convenções e restrições do projeto.
- **Saídas esperadas:** alteração implementada e evidência correspondente de validação, ou descrição clara do que impediu a conclusão.
- **Exemplo de invocação:** *“Implemente a validação de entrada conforme os padrões existentes. Leia o caminho afetado, faça a menor mudança completa e execute os testes relevantes.”*

---

## fable-debug — diagnóstico e causa raiz

- **Para que serve:** investigar falhas sistematicamente, distinguindo o sintoma da causa raiz, e validar uma correção direcionada.
- **Use quando:** houver erro, teste falhando, regressão ou comportamento inesperado.
- **Não use para:** aplicar uma correção antes de entender as evidências, nem para assumir que a primeira hipótese é a causa.

### Fluxo prático:
1. Registre o comportamento observado, as condições e a mensagem de erro exata, quando houver.
2. Inspecione o código e os dados no caminho da falha; compare o que funciona com o que falha.
3. Formule hipóteses específicas e testáveis, priorizadas pela evidência.
4. Confirme a causa raiz e faça uma correção mínima que a trate.
5. Reproduza a verificação e confira se a falha desapareceu sem regressões relevantes.

- **Entradas esperadas:** erro ou comportamento observado, passos para reproduzi-lo, saída de testes/logs e contexto do código.
- **Saídas esperadas:** diagnóstico apoiado em evidências, mudança corretiva quando solicitada ou indicada pelo trabalho e resultado da revalidação.
- **Exemplo de invocação:** *“O teste de importação falha apenas com arquivos vazios. Reproduza o caso, siga o caminho dos dados, identifique a causa e corrija-a sem alterar os casos válidos.”*

---

## fable-verify — validação por evidências

- **Para que serve:** conferir se uma alteração ou entrega atende ao requisito por meio de verificações concretas e proporcionais. A lista de frases da fonte é vocabulário ilustrativo, não um formato obrigatório.
- **Use quando:** terminar uma mudança, precisar validar um comportamento, avaliar uma saída ou conferir critérios de aceite.
- **Não use como:** declaração de sucesso sem rodar as verificações pertinentes, ou justificativa para executar a suíte completa quando uma checagem direcionada basta.

### Fluxo prático:
1. Converta o requisito em critérios observáveis.
2. Selecione verificações adequadas: inspeção de conteúdo, lint, teste, build ou execução funcional.
3. Execute as verificações e compare os resultados com os critérios.
4. Se algo falhar, reporte a falha com precisão e encaminhe a investigação para `fable-debug`.
5. Informe o que foi verificado e o que permaneceu sem validação.

- **Entradas esperadas:** requisito ou critérios de aceite, artefato alterado e comandos ou meios de verificação disponíveis.
- **Saídas esperadas:** resultados observados, critérios atendidos ou pendentes e limitações conhecidas.
- **Exemplo de invocação:** *“Confira se a alteração atende aos critérios de aceite. Execute os testes direcionados e verifique a saída; reporte resultados observados, sem presumir sucesso.”*

---

## Como combiná-las

Para uma mudança comum, use `fable-think` para entender e orientar a tarefa, `fable-code` para implementar e `fable-verify` para comprovar o resultado. Se a mudança exigir decisões sistêmicas, envolva `fable-architect` antes da implementação. Se a implementação ou validação revelar uma falha, use `fable-debug` para investigar a causa raiz e retorne a `fable-verify` para confirmar a correção.

Uma sequência típica é:

$$\text{orientar (think)} \longrightarrow \text{desenhar se necessário (architect)} \longrightarrow \text{implementar (code)} \longrightarrow \text{diagnosticar se falhar (debug)} \longrightarrow \text{validar (verify)}$$

Nem toda tarefa precisa de todas as skills. Escolha apenas as que atendem ao trabalho e adapte o fluxo ao escopo, aos riscos e às instruções do projeto.
