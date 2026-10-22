import { logger } from '../logger';
import { Database } from '../../database/Database';

export interface DensityAlert {
    zoneId: string;
    currentDensity: number;
    predictedDensity: number;
    timestamp: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class FlowPredictionEngine {
    private db: Database;
    private predictionInterval: NodeJS.Timeout | null = null;

    constructor(db: Database) {
        this.db = db;
    }

    public async start() {
        logger.info('[FlowPrediction] Iniciando motor de análise preditiva de fluxo...');
        this.predictionInterval = setInterval(() => this.runInference(), 60000); // A cada minuto
    }

    public stop() {
        if (this.predictionInterval) clearInterval(this.predictionInterval);
    }

    private async runInference() {
        try {
            logger.info('[FlowPrediction] Executando inferência de densidade por zona...');
            
            // Simulação de lógica preditiva baseada em histórico e sensores atuais
            // No futuro, isso usará o modelo de RNN treinado no Córtex
            const zones = ['ENTRADA', 'PATIO', 'REFEITORIO', 'CORREDOR_A'];
            
            for (const zone of zones) {
                const current = Math.floor(Math.random() * 50);
                const predicted = current + Math.floor(Math.random() * 20) - 10;
                
                if (predicted > 40) {
                    await this.createAlert({
                        zoneId: zone,
                        currentDensity: current,
                        predictedDensity: predicted,
                        timestamp: Date.now(),
                        severity: predicted > 60 ? 'HIGH' : 'MEDIUM'
                    });
                }
            }
        } catch (error) {
            logger.error('[FlowPrediction] Erro na inferência:', error);
        }
    }

    private async createAlert(alert: DensityAlert) {
        logger.warn(`[FlowPrediction] ALERTA DE DENSIDADE: Zona ${alert.zoneId} -> Previsto: ${alert.predictedDensity}`);
        // Persiste o alerta para o dashboard
        await this.db.run(
            'INSERT INTO density_alerts (zoneId, currentDensity, predictedDensity, severity, timestamp) VALUES (?, ?, ?, ?, ?)',
            [alert.zoneId, alert.currentDensity, alert.predictedDensity, alert.severity, alert.timestamp]
        );
    }

    public async getRecentAlerts(): Promise<DensityAlert[]> {
        return await this.db.all('SELECT * FROM density_alerts ORDER BY timestamp DESC LIMIT 10');
    }
}
