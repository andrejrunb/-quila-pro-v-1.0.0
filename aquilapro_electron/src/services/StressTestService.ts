import { EventEmitter } from 'events';
import { faceWorker } from '../main'; // Referência ao bridge principal

/**
 * StressTestService.ts — AG-033
 * Simula condições de carga extrema para homologação de hardware.
 */
class StressTestService extends EventEmitter {
  private isTesting = false;
  private testInterval: NodeJS.Timeout | null = null;

  /**
   * Inicia simulação de X detecções/segundo em Y câmeras.
   */
  public startStressTest(cameraCount: number, fpsSimulated: number) {
    if (this.isTesting) return;
    this.isTesting = true;
    
    console.warn(`[StressTest] Iniciando carga de ${cameraCount} câmeras a ${fpsSimulated} FPS...`);
    
    this.testInterval = setInterval(() => {
        // Simular frames trafegando pelo bridge (Item 61)
        for (let i = 0; i < cameraCount; i++) {
            this.emit('simulated-detection', {
                cameraId: `STRESS_CAM_${i}`,
                ts: Date.now(),
                load_hint: 'STRESS_TEST_MODE'
            });
        }
    }, 1000 / fpsSimulated);
  }

  public stopTest() {
    if (this.testInterval) clearInterval(this.testInterval);
    this.isTesting = false;
    console.log('[StressTest] Teste finalizado.');
  }
}

export const stressTest = new StressTestService();
export default stressTest;
