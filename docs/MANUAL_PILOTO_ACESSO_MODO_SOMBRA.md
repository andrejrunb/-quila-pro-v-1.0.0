# 🛡️ Áquila Pro — Manual de Operação da Portaria em Modo Sombra (Shadow Mode)

**Versão:** 1.0.0-PROD  
**Data:** 29 de Outubro de 2026  
**Público-Alvo:** Gestores de TI, Inspetores de Alunos, Porteiros e Encarregado de Dados (DPO)  
**Premissa Operacional:** **Câmera Observa e Audita • Catraca Aberta Manualmente pelo Porteiro • Zero Constrangimento**

---

## 🏛️ 1. O que é o Modo Sombra (Shadow Mode)?

O **Modo Sombra** é o padrão-ouro de engenharia para implantação de visão computacional em ambientes de alta criticidade humana.

Na portaria escolar:
* **A câmera IP RTSP:** Captura os frames, envia ao Edge Box e testa o alinhamento facial, iluminação, contraluz e latência.
* **O software:** Simula o reconhecimento, calcula a similaridade de cosseno e grava logs de auditoria técnica.
* **O relé mecânico da catraca:** **PERMANECE DESATIVADO / DESCONECTADO DO CONTROLE AUTOMÁTICO.**
* **A passagem dos estudantes:** Continua sendo liberada 100% pelo método tradicional existente (crachá manual, liberação visual pelo porteiro ou catraca em giro livre monitorado).

> **Objetivo:** Descobrir todos os problemas de iluminação, postura dos alunos e latência de rede **sem jamais travar a entrada de um aluno ou expor uma criança a atrasos.**

---

## 🔬 2. O que o Sistema Mede Durante o Modo Sombra

Durante os 15 a 30 dias de operação em Modo Sombra, o Áquila Pro registra silenciosamente no log técnico:

1. **Impacto do Sol da Manhã (07h00 às 07h30):**
   * Mede se a incidência direta de luz nas lentes da câmera ofusca rostos de alunos que entram correndo.
   * *Ação corretiva se necessário:* Ajuste de ângulo em 5°, instalação de toldo ou ativação de compensação WDR na câmera.
2. **Latência de Processamento Real de Borda:**
   * Tempo entre a passagem do rosto no campo de visão e a geração do resultado pelo Edge Box.
   * *Meta de aprovação:* Inferior a 200 ms por rosto detectado.
3. **Distribuição de Alturas & Geometria de Passagem:**
   * Alunos do Fundamental I (menores de 1,40m) vs Ensino Médio (maiores de 1,80m).
   * Verificação de que o cone de visão da câmera cobre ambas as faixas sem exigir que a criança estique o pescoço ou abaixe a cabeça.
4. **Comportamento Fail-Secure:**
   * Verificação de que em momentos de chuva torrencial, oscilação de luz ou câmera desconectada, o sistema **retorna estritamente `null` e não tenta forjar identificações fictícias**.

---

## 🛑 3. Protocolo de Contingência Humana (Sem Constrangimento)

Caso a escola venha a avançar para o acionamento mecânico após o Modo Sombra, o procedimento humano deve seguir o protocolo rígido:

* **Falha de Leitura Facial:** Se em 1 segundo a catraca não abrir, o porteiro imediatamente aciona o botão de liberação manual em sua bancada ou passa o crachá mestre de operador.
* **Proibição de Bloqueio em Horário de Chuva:** Em dias de tempestade ou aglomeração de pico (chuva torrencial às 07h15), as catracas devem ser destravadas mecanicamente no modo "Livre Passagem" (*Free Flow*) para garantir a segurança física das crianças.
* **Respeito Absoluto ao Estudante:** Nenhuma criança é questionada ou parada na catraca por falha de máquina. O acolhimento é prioritário sobre qualquer telemetria.

---

## ✅ 4. Critérios Obrigatórios para Transição do Modo Sombra para Acionamento Real

A transição mecânica **SOMENTE** poderá ocorrer quando todos os 5 critérios abaixo forem satisfeitos:

1. [ ] **Termo de Consentimento LGPD (Art. 14):** 100% dos pais da turma piloto assinaram a autorização expressa.
2. [ ] **RIPD Aprovado:** Relatório de Impacto à Proteção de Dados assinado pelo DPO escolar.
3. [ ] **Acurácia em Modo Sombra:** Taxa de leitura facial válida superior a 95% nos horários de pico durante 5 dias consecutivos.
4. [ ] **Contrato FSM de Catraca Ativo:** Driver com feedback de rotação (`TurnstileAccessContract`) homologado na placa física.
5. [ ] **Treinamento da Guarita Concluído:** Porteiros capacitados e confortáveis com o acionamento de contingência.
