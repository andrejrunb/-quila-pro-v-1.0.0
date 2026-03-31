# Walkthrough: Sentinela de Trajetória e Guardas Comportamentais v1629

Implementamos o monitoramento trans-setorial para garantir que o tempo do aluno fora da sala de aula seja utilizado de forma responsável.

## 1. Zoneamento Escolar (v1629)
Lançamos o [LocationZoneService.ts](file:///c:/aquila/aquilapro_electron/src/services/LocationZoneService.ts), que mapeia a escola em zonas funcionais:
- **Banheiros**: Destinos autorizados comuns.
- **Cantina/Pátio**: Áreas de lazer que exigem atenção se visitadas durante o horário de aula.
- **Corredores**: Zonas de transição monitoradas pelo Watchdog.

## 2. Path Watchdog (Sentinela de Rota)
No [SafetyMonitorService.ts](file:///c:/aquila/aquilapro_electron/src/services/SafetyMonitorService.ts), implementamos a lógica de rastreamento de saída:
- **Janela de Observação**: Quando um aluno sai da sala, o sistema inicia um rastro de rádio contínuo.
- **Detecção de Desvio**: Se o aluno entrar na zona "Cantina" em vez do "Banheiro", um alerta de `STRANGE_PATTERN` é gerado instantaneamente no painel do professor.
- **Controle de Tempo**: Se o aluno permanecer mais de 10 minutos fora da sala, um alerta de ociosidade (`INACTIVITY`) é disparado.

## 3. Monitoramento no Painel do Professor
Atualizamos o [TeacherDashboard.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/TeacherDashboard.tsx) com a seção **"Alunos Fora da Sala"**.
- **Status em Tempo Real**: O professor vê exatamente onde o aluno está (ex: "No Banheiro" ou "DESVIO: Cantina").
- **Histórico de Desvios**: No [StudentPortfolioService.ts](file:///c:/aquila/aquilapro_electron/src/services/StudentPortfolioService.ts), criamos o evento `zone_deviation`, que penaliza o score de engajamento do aluno.

---
**Resultado**: O sistema inibe o comportamento inadequado através de monitoramento preciso e fornece aos professores uma ferramenta de controle que antes era impossível sem acompanhamento físico.
