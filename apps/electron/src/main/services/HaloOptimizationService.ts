import { spawn } from 'child_process';
import * as path from 'path';
import { app } from 'electron';
import { haloTraceRegistry } from './HaloTraceRegistry';

export class HaloOptimizationService {
  private static instance: HaloOptimizationService;
  private isAnalyzing = false;
  private lastResults: any[] = [];

  private constructor() {}

  public static getInstance(): HaloOptimizationService {
    if (!HaloOptimizationService.instance) {
      HaloOptimizationService.instance = new HaloOptimizationService();
    }
    return HaloOptimizationService.instance;
  }

  /**
   * Triggers a HALO optimization cycle using the Python worker
   */
  public async runOptimizationCycle(): Promise<any[]> {
    if (this.isAnalyzing) return this.lastResults;
    this.isAnalyzing = true;

    return new Promise((resolve) => {
      const pythonBin = process.env.PYTHON_BIN || 'python';
      const scriptPath = path.join(app.getAppPath(), 'python', 'halo_optimizer.py');
      const traceDir = path.join(app.getPath('userData'), 'traces');

      const worker = spawn(pythonBin, [scriptPath], {
        env: { ...process.env, HALO_TRACE_DIR: traceDir }
      });

      let output = '';
      worker.stdout.on('data', (data) => {
        output += data.toString();
      });

      worker.on('close', (code) => {
        this.isAnalyzing = false;
        if (code === 0) {
          try {
            const startMarker = '---HALO_RESULTS_START---';
            const endMarker = '---HALO_RESULTS_END---';
            
            const startIndex = output.indexOf(startMarker);
            const endIndex = output.indexOf(endMarker);
            
            if (startIndex !== -1 && endIndex !== -1) {
              const jsonStr = output.substring(startIndex + startMarker.length, endIndex).trim();
              const results = JSON.parse(jsonStr);
              this.lastResults = results;
              console.log(`[HALO_SERVICE] Parsed ${results.length} real optimizations from worker.`);
            } else {
              console.warn('[HALO_SERVICE] Could not find markers in worker output. Using fallback/last results.');
            }
          } catch (e) {
            console.error('[HALO_SERVICE] Failed to parse optimizer output', e);
          }
        }
        resolve(this.lastResults);
      });
    });
  }

  public getLastResults(): any[] {
    return this.lastResults;
  }
}

export const haloOptimizationService = HaloOptimizationService.getInstance();
