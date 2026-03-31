import { useCallback } from 'react';

// Acessar a API segura exposta pelo preload
const aquila = (window as any).aquila;

/**
 * Hook para usar IPC handlers de forma segura e compatível
 * ATENÇÃO: os nomes de canal devem bater exatamente com os ipcMain.handle em main.ts
 */
export const useIPC = () => {
  /**
   * Método genérico de invoke para compatibilidade com componentes legados
   */
  const invoke = useCallback(async (channel: string, ...args: any[]) => {
    if (!aquila?.invoke) {
      console.error('API "aquila.invoke" não encontrada no window.');
      return { success: false, error: 'IPC_NOT_FOUND' };
    }
    return await aquila.invoke(channel, ...args);
  }, []);

  // ============ CÂMERAS ============

  const listCameras = useCallback(async () => {
    return await invoke('get-cameras');
  }, [invoke]);

  const addCamera = useCallback(async (config: any) => {
    return await invoke('add-camera', config);
  }, [invoke]);

  const removeCamera = useCallback(async (cameraId: string) => {
    return await invoke('remove-camera', cameraId);
  }, [invoke]);

  // ============ CONFIGURAÇÕES ============

  const getSettings = useCallback(async () => {
    return await invoke('get-settings');
  }, [invoke]);

  const saveSettings = useCallback(async (settings: any) => {
    return await invoke('save-settings', settings);
  }, [invoke]);

  // ============ ALUNOS ============

  const listStudents = useCallback(async (classId?: string) => {
    return await invoke('get-students', classId);
  }, [invoke]);

  const getStudent = useCallback(async (studentId: string) => {
    return await invoke('get-student', studentId);
  }, [invoke]);

  const deleteStudent = useCallback(async (studentId: string) => {
    return await invoke('delete-student', studentId);
  }, [invoke]);

  const updateStudent = useCallback(async (studentId: string, data: any) => {
    return await invoke('update-student', { id: studentId, ...data });
  }, [invoke]);

  const createStudent = useCallback(async (studentData: any) => {
    return await invoke('create-student', studentData);
  }, [invoke]);

  const uploadStudentPhoto = useCallback(async (studentId: string, filePath: string) => {
    return await invoke('upload-student-photo', studentId, filePath);
  }, [invoke]);

  const generateAttendanceReport = useCallback(async (periodId: string, classId: string, format: string) => {
    return await invoke('get-attendance-report', classId, periodId, format);
  }, [invoke]);

  return {
    invoke,
    listCameras,
    addCamera,
    removeCamera,
    getSettings,
    saveSettings,
    listStudents,
    getStudent,
    deleteStudent,
    updateStudent,
    createStudent,
    uploadStudentPhoto,
    generateAttendanceReport,
  };
};

export default useIPC;
