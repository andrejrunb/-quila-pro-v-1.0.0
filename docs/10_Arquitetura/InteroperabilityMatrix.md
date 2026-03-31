# Matriz de Interoperabilidade Áquila Pro (v1635)

Esta matriz define o mapeamento de campos entre o Áquila Pro e o ecossistema de sistemas escolares brasileiros (SIS, ERP, Agendas e Grades).

## 1. Mapeamento de Secretaria (SIS/ERP)
Sistemas suportados: **Setti, SIESCOLA, Lápis 360, Education One**.

| Campo Áquila | Campo Externo (Padrão) | Descrição |
| :--- | :--- | :--- |
| `id` | `aluno_id` / `external_id` | Identificador único persistente entre sistemas. |
| `name` | `nome_completo` | Nome do aluno para exibição em murais e portais. |
| `enrollmentId` | `matrícula` / `ra` | Registro acadêmico oficial da instituição. |
| `classId` | `turma_cod` | Código da turma para alocação de grade horária. |
| `parentContact` | `fone_responsavel` | Canal para avisos críticos de segurança/chegada. |

## 2. Mapeamento de Grade Horária (Scheduling)
Sistemas suportados: **PowerCubus, Urânia, Horário Fácil**.

| Campo Áquila | Campo Externo (CSV) | Função no Áquila |
| :--- | :--- | :--- |
| `teacher` | `Nome Professor` | Vincula o perfil pedagógico à aula via rádio. |
| `room` | `Sala / Local` | Define a geolocalização esperada para a turma. |
| `slot` | `Início / Fim` | Calibragem do motor de aglomeração e trocas. |
| `group` | `Turma / Série` | Agrupar alunos para o Mural de Saída (ArrivalBoard). |

## 3. Fluxo de Sincronização
1. **Trigger**: Manual via Interface Admin ou Agendado (Webhook/Cron).
2. **Parser**: O `ExternalIntegrationService` decodifica formatos específicos (T5, JSON, CSV).
3. **Commit**: O `AquilaConnectorService` atualiza os registros em `AcademicRecordsService`.

---
> [!NOTE]
> Para sistemas sem API aberta, recomendamos a exportação em CSV com o cabeçalho "Padrão Aquila-InterOp-v1" disponível no GitHub do projeto.
