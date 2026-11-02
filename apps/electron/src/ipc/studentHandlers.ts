import type { CreateStudentInput, CreatedStudent } from '../main/services/StudentService';

export const CREATE_STUDENT_CHANNEL = 'create-student';

export type StudentCreateResponse =
  | { success: true; studentId: string; data: CreatedStudent }
  | { success: false; error: string; code: 'UNAUTHORIZED' | 'INVALID_PAYLOAD' | 'SERVICE_UNAVAILABLE' | 'CREATE_FAILED' };

interface StudentIPCContext {
  authService?: { getCurrentUser: () => Promise<{ role?: string } | null> };
  studentService?: { createStudent: (student: CreateStudentInput) => Promise<CreatedStudent> };
}

type ProtectedHandle = (
  channel: string,
  handler: (_event: unknown, payload: unknown) => Promise<StudentCreateResponse>
) => void;

function isStudentPayload(payload: unknown): payload is CreateStudentInput {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  const value = payload as Record<string, unknown>;
  const allowedKeys = new Set(['name', 'classId', 'parentPhone', 'registrationNumber']);
  if (Object.keys(value).some(key => !allowedKeys.has(key))) return false;
  return (
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    value.name.trim().length <= 200 &&
    typeof value.classId === 'string' &&
    value.classId.trim().length > 0 &&
    value.classId.trim().length <= 100 &&
    (value.parentPhone === undefined || (typeof value.parentPhone === 'string' && value.parentPhone.length <= 50)) &&
    (value.registrationNumber === undefined || (typeof value.registrationNumber === 'string' && value.registrationNumber.length <= 100))
  );
}

export function registerStudentHandlers(context: StudentIPCContext, protectedHandle: ProtectedHandle): void {
  protectedHandle(CREATE_STUDENT_CHANNEL, async (_event, payload) => {
    if (!isStudentPayload(payload)) {
      return { success: false, error: 'Invalid student payload.', code: 'INVALID_PAYLOAD' };
    }

    const user = await context.authService?.getCurrentUser();
    if (!user || !['admin', 'director', 'secretary'].includes(user.role || '')) {
      return { success: false, error: 'Not authorized to create students.', code: 'UNAUTHORIZED' };
    }

    if (!context.studentService) {
      return { success: false, error: 'Student service is unavailable.', code: 'SERVICE_UNAVAILABLE' };
    }

    try {
      const student = await context.studentService.createStudent(payload);
      return { success: true, studentId: student.studentId, data: student };
    } catch {
      console.error('[Student IPC] Student creation failed.');
      return { success: false, error: 'Student could not be created.', code: 'CREATE_FAILED' };
    }
  });
}
