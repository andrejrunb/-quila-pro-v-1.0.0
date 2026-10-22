# Correção Automática de Provas (Automated Grading)

O sistema de Automated Grading (v1.5.0) utiliza Visão Computacional de borda para digitalizar cartões-resposta e processar resultados sem intervenção manual.

## 👁️ Workflow de Captura

O sistema opera através de um pipeline de visão dedicado:
1. **Captura:** O professor utiliza a câmera (ou upload de imagem) para capturar o cartão-resposta.
2. **Normalização:** A imagem é processada para correção de perspectiva e brilho.
3. **Análise de OCR/Orelhas:** O módulo de visão identifica as marcações nos campos de alternativas.
4. **Validação:** Cruzamento dos dados lidos com o gabarito cadastrado no sistema.
5. **Persistência:** As notas são gravadas automaticamente no perfil do aluno e sincronizadas com o diário de classe.

## ⚙️ Especificações Técnicas

- **Canais IPC:**
    - `grading:get-assessments`: Lista provas agendadas.
    - `grading:create-assessment`: Cadastro de nova avaliação e gabarito.
    - `grading:scan-sheet`: Endpoint principal para processamento de imagem Base64.
    - `grading:save-auto-grade`: Persiste o resultado final após revisão opcional.

## 🛡️ Soberania e LGPD
Todo o processamento de imagem ocorre localmente no **Áquila Edge Hub**. Nenhuma imagem de prova de aluno é enviada para nuvens de terceiros para processamento OCR, garantindo a soberania dos dados educacionais.

---
Vincular a: [[00_Index|Início]] | [[20_Services/Advanced_Vision|Visão Avançada]]
