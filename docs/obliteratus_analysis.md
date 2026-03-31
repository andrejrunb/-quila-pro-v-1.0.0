# Análise Técnica: OBLITERATUS (Elder Plinius)

O repositório **OBLITERATUS** é uma ferramenta de pesquisa avançada em interpretabilidade e segurança de LLMs que foca na "abliterar" (remover cirurgicamente) comportamentos de recusa e filtros de segurança diretamente nos pesos do modelo.

## O que é Obliteratus?
Ao contrário de jailbreaks convencionais (que tentam enganar o modelo via prompt), o OBLITERATUS utiliza técnicas de álgebra linear para identificar e extrair o **subespaço de recusa** de um modelo. Uma vez identificada a "direção" que causa a recusa, a ferramenta projeta essa direção para fora dos pesos ou ativações do modelo, tornando-o incapaz de dizer "não".

### Principais Tecnologias
- **LEACE (Linear Erasure of Concept Embeddings)**: Remove conceitos lineares (como "segurança") das representações latentes.
- **SVD/PCA de Baixo Posto**: Identifica as principais direções de ativação associadas a conjuntos de dados de "recusa" vs "aceitação".
- **Steering de Ativação**: Direciona o modelo durante a inferência para evitar gatilhos de segurança.

## Implicações para o Áquila Pro

Como o Áquila Pro utiliza IA para monitoramento escolar e suporte pedagógico, o OBLITERATUS serve como um **alerta de segurança crítica** e uma oportunidade de **Red Teaming**.

### Riscos Identificados
1. **Neutralização de Filtros Locais**: Se um atacante tiver acesso aos pesos do modelo rodando localmente (Edge-AI), ele poderia usar o OBLITERATUS para remover travas de privacidade ou filtros de linguagem ofensiva.
2. **Fragilidade de Filtros Lineares**: Demonstra que proteções baseadas apenas em treinamento (RLHF) podem ser removidas matematicamente sem necessidade de retreino.

### Recomendações de Hardening (Blindagem)
- **Filtros de Saída Externos**: Nunca confiar apenas na "segurança intrínseca" do LLM. No Áquila Pro, devemos manter camadas de verificação externas (Classificadores de Conteúdo) que rodam fora do contexto do modelo principal.
- **Detecção de Anomalias em Ativações**: Implementar monitoramento para detectar se os padrões de ativação do modelo estão sendo "direcionados" ou se houve alteração nos pesos (checksums de modelos).
- **Abstração de Pesos**: Em ambientes sensíveis, os pesos do modelo devem ser protegidos contra acesso direto via criptografia em repouso (WASM/Hardening).

## Demonstração de Processo (Abliteration)
![Processo de Abliteratus](file:///C:/Users/Thaysa/.gemini/antigravity/brain/6221e7e8-5226-4be5-9c17-815652ce4ac1/analyze_obliteratus_repo_1774518012188.webp)
*A gravação mostra a exploração das estratégias de 'leace' e 'steering' no repositório.*

## Veredito
O OBLITERATUS deve ser integrado ao nosso pipeline de **Security Compliance** como uma ferramenta de teste de penetração para nossos modelos de IA. Ele nos permite testar quão robustos são nossos protocolos de segurança contra ataques de nível matemático.
