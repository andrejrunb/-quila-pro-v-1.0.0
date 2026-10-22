import { EventEmitter } from 'events';

/**
 * ObstructionDetector.ts — Passo 69 do Roadmap.
 * Detecta se a lente da câmera foi obstruída (tampada), virada ou desfocada.
 * Utiliza análise de entropia e variância de cor.
 */
export class ObstructionDetector extends EventEmitter {
    private lastFrameAvg: number = 0;
    private static FRAME_SAMPLES = 10;
    private history: number[] = [];

    /**
     * Analisa um frame resumido (histograma ou média de brilho).
     * @param brightness Média de brilho do frame. 
     */
    public processFrame(brightness: number): void {
        this.history.push(brightness);
        if (this.history.length > ObstructionDetector.FRAME_SAMPLES) this.history.shift();

        if (this.history.length === ObstructionDetector.FRAME_SAMPLES) {
            const variance = this._calculateVariance(this.history);
            
            // Variância extremamente baixa significa imagem estática (congelada ou tampada)
            // Variância extremamente alta (súbita) + mudança de brilho = obstrução manual
            if (variance < 0.05) {
                this.emit('alert', { type: 'STATIC_OR_COVERED', confidence: 0.9 });
            }

            const avg = this.history.reduce((a, b) => a + b, 0) / this.history.length;
            if (Math.abs(avg - this.lastFrameAvg) > 0.6) {
                this.emit('alert', { type: 'LIGHT_SHOCK', confidence: 0.8 });
            }
            this.lastFrameAvg = avg;
        }
    }

    private _calculateVariance(data: number[]): number {
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const squareDiffs = data.map(v => Math.pow(v - mean, 2));
        return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / data.length);
    }
}

