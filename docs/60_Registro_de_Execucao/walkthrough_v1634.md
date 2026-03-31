# Walkthrough: Totens Especializados e Triagem de Segurança v1634

Materializamos a inteligência do Áquila em interfaces físicas estratégicas, otimizando a logística e a segurança em todo o campus escolar.

## 1. Centro de Comando da Coordenação (v1634)
Implementamos o [CoordinationTV.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/CoordinationTV.tsx) para monitores em salas de professores:
- **Visão em Tempo Real**: Status de alunos em sala vs. fora de sala.
- **Destaque em Vermelho**: Alerta imediato para alunos com atrasos recorrentes ou saídas não autorizadas detectadas por rádio.
- **Marquee de Eventos**: Notificações sobre trocas de professores e horários de recreio.

## 2. Mural de Saída Estilo Aeroporto (v1634)
No [ArrivalBoard.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/ArrivalBoard.tsx), criamos um monitor para portarias:
- **Geofencing de Pais**: Utiliza o [GeofenceMonitorService.ts](file:///c:/aquila/aquilapro_electron/src/services/GeofenceMonitorService.ts) para detectar a proximidade dos veículos.
- **Chamada Inteligente**: Os alunos visualizam o nome do responsável ranqueado por proximidade ("Chegando" ➔ "Na Porta"), eliminando a espera desnecessária no sol ou chuva.

## 3. Triagem de Visitantes na Recepção (v1634)
O [ReceptionPortal.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/ReceptionPortal.tsx) transforma tablets em totens de segurança:
- **Cadastro Ágil**: Nome, CPF e captura de foto do rosto.
- **Check de Segurança**: O [VisitorRegistrationService.ts](file:///c:/aquila/aquilapro_electron/src/services/VisitorRegistrationService.ts) cruza dados com watchlists silenciosas, alertando a coordenação instantaneamente se um CPF suspeito for detectado.

---
**Resultado**: O Áquila Pro agora comunica segurança e eficiência visualmente, reduzindo a carga cognitiva da equipe e aumentando a percepção de valor pelas famílias.
