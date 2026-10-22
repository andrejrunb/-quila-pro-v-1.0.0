// n8n Local Workflow Integration Client for Áquila Pro
export interface N8nConfig {
  baseUrl: string; // e.g. 'http://localhost:5678'
  apiKey?: string;
}

export interface WorkflowTriggerOptions {
  workflowIdOrWebhook: string;
  data: Record<string, any>;
}

export interface N8nExecutionStatus {
  id: string;
  finished: boolean;
  mode: string;
  retryOf?: string;
  startedAt: string;
  stoppedAt?: string;
  status: 'running' | 'success' | 'failed' | 'waiting';
}

export class N8nClient {
  private config: N8nConfig;

  constructor(config: N8nConfig = { baseUrl: 'http://localhost:5678' }) {
    this.config = config;
  }

  /**
   * Triggers a webhook-based n8n workflow.
   */
  async triggerWebhook(path: string, payload: Record<string, any>): Promise<any> {
    const url = path.startsWith('http') ? path : `${this.config.baseUrl}/webhook/${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['X-N8N-API-KEY'] = this.config.apiKey;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`n8n Webhook Error [${response.status}]: ${errText}`);
    }

    return response.json().catch(() => ({ status: 'triggered', statusCode: response.status }));
  }

  /**
   * Triggers student attendance alert workflow via n8n.
   */
  async triggerAttendanceAlert(absentStudents: Array<{ id: string; name: string; parentPhone: string; class: string }>) {
    return this.triggerWebhook('attendance-alert', {
      timestamp: new Date().toISOString(),
      students: absentStudents,
    });
  }

  /**
   * Triggers tuition billing reminder workflow via n8n.
   */
  async triggerTuitionReminder(invoices: Array<{ studentName: string; parentPhone: string; parentEmail: string; amount: number; dueDate: string }>) {
    return this.triggerWebhook('tuition-reminder', {
      timestamp: new Date().toISOString(),
      invoices,
    });
  }

  /**
   * Triggers weekly progress digest email generation via n8n.
   */
  async triggerWeeklyDigest(studentId: string) {
    return this.triggerWebhook('weekly-digest', {
      timestamp: new Date().toISOString(),
      studentId,
    });
  }
}

export const defaultN8nClient = new N8nClient();
