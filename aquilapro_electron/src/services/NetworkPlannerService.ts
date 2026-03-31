import { EventEmitter } from 'events';

export interface PlacementSuggestion {
  x: number;
  y: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * NetworkPlannerService (v1616)
 * Inteligência de Expansão de Infraestrutura.
 * Identifica "zonas mortas" de sinal baseadas no mapeamento de campo.
 */
class NetworkPlannerService extends EventEmitter {
  private suggestions: PlacementSuggestion[] = [];

  constructor() {
    super();
  }

  /**
   * Analisa um conjunto de pontos de varredura (Site Survey) para descobrir falhas de cobertura.
   * Heurística: Áreas com poucos pontos registrados em relação ao tamanho total do mapa.
   */
  public generatePlacements(surveyPoints: any[], mapBounds: { width: number, height: number }): PlacementSuggestion[] {
    const newSuggestions: PlacementSuggestion[] = [];
    
    // Simulação de lógica de densidade:
    // Dividimos o mapa em áreas de 20x20. Se uma área tiver 0 pontos, sugerimos reforço.
    const gridSize = 20;
    for (let x = 0; x < mapBounds.width; x += gridSize) {
      for (let y = 0; y < mapBounds.height; y += gridSize) {
        const pointsInCell = surveyPoints.filter(p => 
          p.x >= x && p.x < x + gridSize && 
          p.y >= y && p.y < y + gridSize
        );

        if (pointsInCell.length === 0) {
          newSuggestions.push({
            x: x + gridSize / 2,
            y: y + gridSize / 2,
            reason: 'Zona Morta de Sinal (Nenhum RuView Detectado)',
            priority: 'medium'
          });
        }
      }
    }

    this.suggestions = newSuggestions;
    this.emit('plans-updated', this.suggestions);
    return this.suggestions;
  }

  public getSuggestions() {
    return this.suggestions;
  }

  public calculateBudget(unitPrice: number = 89.90): { total: number, count: number } {
    const count = this.suggestions.length;
    return {
      count,
      total: count * unitPrice
    };
  }
}

export const networkPlannerService = new NetworkPlannerService();
