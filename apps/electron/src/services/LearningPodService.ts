/**
 * LEARNING POD SERVICE (v4001 - Safe Proxy)
 * ----------------------------------------
 */

export interface LearningPod {
  id: string;
  studentId: string;
  class_id: string;
  subject: string;
  summary: string;
  flashcards: string; // JSON { question, answer }[]
  audio_overview_url?: string;
  created_at: string;
}

export class LearningPodServiceProxy {
  private static instance: LearningPodServiceProxy;

  private constructor() {}

  public static getInstance(): LearningPodServiceProxy {
    if (!LearningPodServiceProxy.instance) {
      LearningPodServiceProxy.instance = new LearningPodServiceProxy();
    }
    return LearningPodServiceProxy.instance;
  }

  private async invoke(method: string, ...args: any[]): Promise<any> {
    if (typeof window !== 'undefined' && window.aquila) {
      return window.aquila.invoke(`pod:${method}`, ...args);
    }
    throw new Error(`[PodProxy] IPC não disponível para ${method}`);
  }

  public async generatePod(studentId: string, classId: string, transcript: string): Promise<string> {
    return this.invoke('generatePod', studentId, classId, transcript);
  }

  public async getAudioOverview(podId: string): Promise<string> {
    return this.invoke('getAudioOverview', podId);
  }

  public async listPodsForStudent(studentId: string): Promise<any[]> {
    return this.invoke('listPodsForStudent', studentId);
  }
}

export const learningPodService = LearningPodServiceProxy.getInstance();
export default learningPodService;
