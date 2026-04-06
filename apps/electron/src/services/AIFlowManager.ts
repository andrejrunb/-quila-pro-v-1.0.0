import Logger from './Logger';
import { NexusNode } from './AiTypes';
import { nexusSyncService } from './NexusSyncService';
import { resourceMonitor } from './ResourceMonitorService';

interface AITask {
  id: string;
  query: string;
  specialization: string;
  priority: 'high' | 'normal' | 'low';
  userHasCloudCredits: boolean;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timestamp: number;
}

/**
 * AIFlowManager (v3444 Hardened)
 * Orchestrates AI task distribution with priority-based queuing and throttling awareness.
 */
export class AIFlowManager {
  private logger: Logger;
  private queue: AITask[] = [];
  private isProcessing = false;
  private isThrottled = false;

  constructor() {
    this.logger = new Logger('AIFlowManager');
    
    // Subscribe to hardware stress events
    resourceMonitor.on('throttle', (status) => {
      this.isThrottled = status.active;
      if (this.isThrottled) {
        this.logger.warn(`Throttling detected: Queuing non-critical AI tasks. Reason: ${status.reason}`);
      } else {
        this.logger.info('System back to nominal. Resuming worker queue.');
        this.processQueue();
      }
    });

    // Step 158 - Predictive awareness
    resourceMonitor.on('proactive-throttle', (data) => {
      this.logger.error(`[Predictive Resilience] System heading to OOM in ${data.projectedOOM.toFixed(1)}s. Shifting to defensive mode.`);
      // Clear low priority tasks immediately to save memory
      const initialCount = this.queue.length;
      this.queue = this.queue.filter(t => t.priority === 'high');
      const cleared = initialCount - this.queue.length;
      if (cleared > 0) {
        this.logger.warn(`[Defensive] Purged ${cleared} low-priority tasks from queue to prevent crash.`);
      }
    });
  }

  /**
   * Dispatches an AI request. If system is stressed, queues it based on priority.
   */
  public async dispatch(
    query: string, 
    specialization: string = 'general',
    userHasCloudCredits: boolean = false,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<{ nodeId: string; type: 'LOCAL' | 'CLOUD'; nodeName: string }> {
    
    // Especialização de Visão (v3465) exige hardware robusto
    const isVisionTask = specialization.toUpperCase() === 'VISION' || query.toLowerCase().includes('foto');
    if (isVisionTask) priority = 'high';
    return new Promise((resolve, reject) => {
      const task: AITask = {
        id: Math.random().toString(36).substring(7),
        query,
        specialization,
        priority,
        userHasCloudCredits,
        resolve,
        reject,
        timestamp: Date.now()
      };

      if (this.isThrottled && priority !== 'high') {
        this.logger.info(`System Throttled. Queuing task ${task.id} (Priority: ${priority})`);
        this.queue.push(task);
        // Sort by priority (high first) and then timestamp
        this.queue.sort((a, b) => {
          const pMap = { high: 0, normal: 1, low: 2 };
          return pMap[a.priority] - pMap[b.priority] || a.timestamp - b.timestamp;
        });
      } else {
        this.executeDispatch(task);
      }
    });
  }

  private async executeDispatch(task: AITask) {
    try {
      this.logger.info(`Executing task: ${task.id} | Query: "${task.query.substring(0, 30)}..."`);

      // 1. Phase 1: Cloud Credit Offloading
      if (task.userHasCloudCredits) {
        return task.resolve({ 
          nodeId: 'user_cloud_bridge', 
          type: 'CLOUD', 
          nodeName: 'User Personal Cloud (Gemini/Claude)' 
        });
      }

      // 2. Phase 2: Specialized Local Node Search
      const nodes = nexusSyncService.getNodes();
      const candidateNodes = nodes.filter(n => 
        n.aiEnabled && 
        n.syncStatus === 'synced'
      );
      
      this.logger.info(`Swarm context: ${candidateNodes.length} nodes active.`);

      if (candidateNodes.length > 0) {
        // Se for uma tarefa de Visão, priorizar nós com hardware 'HIGH'
        if (task.specialization.toUpperCase() === 'VISION') {
          const visionNode = nodes.find(n => n.hardwareProfile === 'high') || nodes[0];
          return task.resolve({ 
            nodeId: visionNode.id, 
            type: 'LOCAL', 
            nodeName: visionNode.name 
          });
        }

        const bestNode = nodes.sort((a, b) => (a.load || 0) - (b.load || 0))[0];
        return task.resolve({ 
          nodeId: bestNode.id, 
          type: 'LOCAL', 
          nodeName: bestNode.name 
        });
      }

    } catch (err) {
      this.logger.error(`Dispatch failed for task ${task.id}:`, err);
      task.reject(err);
    }
  }

  private processQueue() {
    if (this.isProcessing || this.queue.length === 0 || this.isThrottled) return;
    
    this.isProcessing = true;
    const task = this.queue.shift();
    if (task) {
      this.executeDispatch(task).finally(() => {
        this.isProcessing = false;
        setTimeout(() => this.processQueue(), 100); // 100ms break to avoid loop saturation
      });
    } else {
      this.isProcessing = false;
    }
  }

  public getQueueStatus() {
    return {
      length: this.queue.length,
      isThrottled: this.isThrottled,
      isProcessing: this.isProcessing
    };
  }
}

export const aiFlowManager = new AIFlowManager();
export default aiFlowManager;
