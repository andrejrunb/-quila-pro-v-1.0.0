# Áquila Elo Messenger Core (v2541)

Implementing the official, secure, and structured communication backbone of the School OS.

## Proposed Changes

### [Communication Layer]

#### [NEW] [SchoolMessengerService.ts](file:///c:/aquila/aquilapro_electron/src/services/SchoolMessengerService.ts)
- Manages real-time message routing between Parent, Teacher, and Admin hubs.
- Implements "Structured Templates" (Homework, Meeting, Financial Alert).
- Automated "Privacy Shield": Hides personal phone numbers/emails.
- Audit logging for every interaction (5-year retention logic).

### [Interface Layer]

#### [NEW] [MessengerPortal.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/MessengerPortal.tsx)
- Unified chat interface for all roles.
- Role-specific UI components (e.g., "Send Homework Card" for Teachers).
- "Focus Mode": Blocks non-emergency notifications outside working hours.

### [Agentic Integration]

#### [MODIFY] [agents/SecretaryAgent.ts](file:///c:/aquila/aquilapro_electron/src/services/agents/SecretaryAgent.ts)
- Integrate `SchoolMessengerService` for automated "Broadcasts".
- Handle "Meeting Request" routing between Parents and Coordinators.

## Verification Plan

### Automated Tests
- `npm test src/services/SchoolMessengerService`
- Verify that a `Teacher` cannot see a `Parent's` private phone number in the metadata.

### Manual Verification
- Send a "Homework Card" from `MessengerPortal` and verify it renders as a structured card for the Student.
