# Zero-Typing Classroom AI (v2341)

Automating pedagogical documentation through Vision AI and proactive student support.

## User Review Required

> [!IMPORTANT]
> The system will use the existing `TeacherAgent` mobile interface to upload board photos. The AI extraction will happen in the background.

## Proposed Changes

### [Pedagogical Intelligence Layer]

#### [NEW] [ClassroomVisionService.ts](file:///c:/aquila/aquilapro_electron/src/services/ClassroomVisionService.ts)
- Receives board photos from `TeacherAgent`.
- Uses OCR + LLM to extract: `TOPIC`, `SUB_TOPICS`, `TASKS`, `DEADLINES`.
- Returns structured JSON for diary integration.

#### [NEW] [StudyCuratorService.ts](file:///c:/aquila/aquilapro_electron/src/services/StudyCuratorService.ts)
- Identifies absent students via `IdentityBridgeService`.
- Generates a 3-paragraph summary of the class content.
- Searches for and attaches 3 relevant YouTube study links based on the topic.

### [Agentic Deployment]

#### [MODIFY] [agents/TeacherAgent.ts](file:///c:/aquila/aquilapro_electron/src/services/agents/TeacherAgent.ts)
- Add `processBoardPhoto(imagePath)` logic.
- Auto-spawns `SecretaryBot` to update SIS `Diário de Classe` after vision extraction.

#### [MODIFY] [agents/StudentAgent.ts](file:///c:/aquila/aquilapro_electron/src/services/agents/StudentAgent.ts)
- Add `DeadWatcherBot`: Scans student calendar for tasks extracted from the board and triggers notifications 3 days and 1 day before deadlines.

## Verification Plan

### Automated Tests
- `npm test src/services/ClassroomVisionService`
- Verify that a mock board photo produces correct JSON deadlines.

### Manual Verification
- Upload a photo of a board writing "Prova de História - 30/03" and verify the student calendar is updated automatically.
