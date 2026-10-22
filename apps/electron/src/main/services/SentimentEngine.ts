/**
 * SentimentEngine.ts — Passo 78 do Roadmap.
 * Analisa padrões de movimento e densidade para estimar o "clima" coletivo.
 */
export class SentimentEngine {
    
    /**
     * Estima o sentimento de uma zona (ex: Pátio) baseado em parâmetros de multidão.
     * @param crowdDensity Densidade (0-1)
     * @param movementVelocity Velocidade média de deslocamento
     */
    public analyzeZone(crowdDensity: number, movementVelocity: number): { sentiment: string; score: number } {
        // Lógica Heurística:
        // Alta Densidade + Alta Velocidade = Possível Tensão ou Correria (Risco)
        // Alta Densidade + Baixa Velocidade = Socialização/Aglomeração Normal
        // Baixa Densidade + Baixa Velocidade = Calmaria
        
        if (crowdDensity > 0.7 && movementVelocity > 0.8) {
            return { sentiment: 'TENSÃO / CORRERIA', score: 0.1 };
        }
        
        if (crowdDensity > 0.5 && movementVelocity < 0.3) {
            return { sentiment: 'SOCIALIZAÇÃO', score: 0.8 };
        }
        
        if (crowdDensity < 0.2) {
            return { sentiment: 'CALMARIA', score: 0.95 };
        }

        return { sentiment: 'NORMAL', score: 0.7 };
    }
}

