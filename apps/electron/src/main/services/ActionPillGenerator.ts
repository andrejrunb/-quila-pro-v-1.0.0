import { Database } from '../../database/Database';
import { v4 as uuidv4 } from 'uuid';
import { swarmComparativeService } from './SwarmComparativeService';
import { legalEvidenceService } from './LegalEvidenceService';

export interface ActionPill {
  id: string;
  type: 'PEDAGOGICAL' | 'LEGAL' | 'ADMINISTRATIVE';
  source: string;
  content: string;
  priority: 'URGENT' | 'RECOMMENDED' | 'INFO';
  suggestedAction: string;
  legalAnchor?: string;
  status: 'pending' | 'approved' | 'discarded';
}

class ActionPillGenerator {
  private get db() {
    return Database.getInstance();
  }

  /**
   * Identifica pílulas de ação baseadas em anomalias do Swarm ou dados locais específicos
   */
  async generatePills(): Promise<ActionPill[]> {
    const analysis = await swarmComparativeService.getComparativeAnalysis();
    const pills: ActionPill[] = [];

    for (const unit of analysis) {
      if (unit.anomalies.length > 0) {
        // 1. Criar pílula administrativa de alerta de enxame
        pills.push({
          id: uuidv4(),
          type: 'ADMINISTRATIVE',
          source: 'Swarm-Aggregator',
          content: unit.anomalies[0],
          priority: 'URGENT',
          suggestedAction: 'Auditar padrões de entrada e saída na portaria.',
          status: 'pending'
        });

        // 2. Criar pílula legal de amparo (buscando artigos do ECA)
        const relevantLegal = await legalEvidenceService.findRelevantLaws('frequência', 'ECA');
        if (relevantLegal.length > 0) {
          pills.push({
            id: uuidv4(),
            type: 'LEGAL',
            source: 'Legal-Vault',
            content: `Amparo para intervenção de frequência: ${relevantLegal[0].content}`,
            priority: 'RECOMMENDED',
            suggestedAction: `Emitir notificação formal baseada no ECA Art. ${relevantLegal[0].article_number}.`,
            legalAnchor: relevantLegal[0].id,
            status: 'pending'
          });
        }
      }
    }

    // Persistir no banco de revisão de insights (ai_insights_review)
    for (const pill of pills) {
      await this.db.run(
        `INSERT INTO ai_insights_review (id, source_service, insight_type, content, suggested_action, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [pill.id, pill.source, pill.type, pill.content, pill.suggestedAction, pill.status]
      );
    }

    return pills;
  }
}

export const actionPillGenerator = new ActionPillGenerator();

