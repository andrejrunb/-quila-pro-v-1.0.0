import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { v4 as uuidv4 } from 'uuid';

export interface HaloSpan {
  id: string;
  traceId: string;
  parentId?: string;
  agentId: string;
  name: string;
  stepType: 'intent' | 'subtask' | 'tool_call' | 'reflection' | 'perception';
  input: any;
  output?: any;
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'error';
  error?: string;
  metadata?: Record<string, any>;
  contextMetadata?: {
    modelId?: string;
    temperature?: number;
    tokens?: number;
  };
}

export class HaloTraceRegistry {
  private static instance: HaloTraceRegistry;
  private traceDir: string;
  private activeSpans: Map<string, HaloSpan> = new Map();

  private constructor() {
    // Determine the trace directory (sovereign local storage)
    const userData = app.getPath('userData');
    this.traceDir = path.join(userData, 'traces');
    
    if (!fs.existsSync(this.traceDir)) {
      fs.mkdirSync(this.traceDir, { recursive: true });
    }
  }

  public static getInstance(): HaloTraceRegistry {
    if (!HaloTraceRegistry.instance) {
      HaloTraceRegistry.instance = new HaloTraceRegistry();
    }
    return HaloTraceRegistry.instance;
  }

  /**
   * Starts a new span for an agent action
   */
  public startSpan(params: {
    agentId: string;
    name: string;
    stepType: 'intent' | 'subtask' | 'tool_call' | 'reflection' | 'perception';
    input: any;
    parentId?: string;
    traceId?: string;
    contextMetadata?: HaloSpan['contextMetadata'];
  }): string {
    const id = uuidv4();
    const span: HaloSpan = {
      id,
      traceId: params.traceId || uuidv4(),
      parentId: params.parentId,
      agentId: params.agentId,
      name: params.name,
      stepType: params.stepType,
      input: params.input,
      startTime: Date.now(),
      status: 'running',
      contextMetadata: params.contextMetadata
    };

    this.activeSpans.set(id, span);
    return id;
  }

  /**
   * Ends an active span and flushes it to local storage
   */
  public endSpan(id: string, output?: any, error?: string) {
    const span = this.activeSpans.get(id);
    if (!span) return;

    span.endTime = Date.now();
    span.output = output;
    span.status = error ? 'error' : 'completed';
    span.error = error;

    this.flushSpan(span);
    this.activeSpans.delete(id);
  }

  /**
   * Flushes a single span to a JSONL file
   */
  private flushSpan(span: HaloSpan) {
    const logFile = path.join(this.traceDir, `traces_${new Date().toISOString().split('T')[0]}.jsonl`);
    const line = JSON.stringify(span) + '\n';
    
    try {
      fs.appendFileSync(logFile, line);
    } catch (err) {
      console.error('[HALO] Failed to flush span:', err);
    }
  }

  /**
   * Retrieves traces for a specific agent for analysis
   */
  public async getRecentTraces(agentId: string, limit: number = 50): Promise<HaloSpan[]> {
    const files = fs.readdirSync(this.traceDir)
      .filter(f => f.endsWith('.jsonl'))
      .sort()
      .reverse();

    const spans: HaloSpan[] = [];
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(this.traceDir, file), 'utf8');
      const lines = content.trim().split('\n');
      
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const span = JSON.parse(lines[i]) as HaloSpan;
          if (span.agentId === agentId) {
            spans.push(span);
          }
          if (spans.length >= limit) break;
        } catch (e) {
          // Skip malformed lines
        }
      }
      if (spans.length >= limit) break;
    }

    return spans;
  }
}

export const haloTraceRegistry = HaloTraceRegistry.getInstance();
