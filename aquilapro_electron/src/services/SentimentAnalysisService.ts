import { EventEmitter } from 'events';

/**
 * SentimentAnalysisService.ts — AG-037
 * Monitora o "Sentiment" global da escola para gestão de clima organizacional.
 */
class SentimentAnalysisService extends EventEmitter {
  private dailySentimentPool: number[] = [];

  /**
   * Agrega uma leitura de expressão (0.0 a 1.0, onde 1.0 é positivo).
   */
  public registerExpression(score: number) {
    this.dailySentimentPool.push(score);
    if (this.dailySentimentPool.length > 100) {
        this.dailySentimentPool.shift(); // Manter janela deslizante
    }
  }

  public getGlobalSentiment() {
    if (this.dailySentimentPool.length === 0) return 0.5;
    const sum = this.dailySentimentPool.reduce((a, b) => a + b, 0);
    return sum / this.dailySentimentPool.length;
  }
}

export const sentimentAnalysis = new SentimentAnalysisService();
export default sentimentAnalysis;
