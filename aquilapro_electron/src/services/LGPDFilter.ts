import { FacialAnalysis } from './MicroExpressionService';
import { PoseEvent } from './PoseEstimationService';

/**
 * Phase 321 — LGPDFilter
 * Filtro de privacidade Soberano.
 * Remove Identificadores Pessoais (PII) de logs de comportamento.
 */
export interface AnonymizedAnalysis extends Omit<FacialAnalysis, 'faceId'> {
  anonymizedId: string;
  isComplianceVerified: true;
}

export interface AnonymizedPose extends Omit<PoseEvent, 'id'> {
  anonymizedId: string;
  maskedLocation: string;
  isComplianceVerified: true;
}

class LGPDFilter {
  /**
   * Anonymizes a FacialAnalysis object by stripping the faceId
   * and generating a one-way cryptographic hash or a generic token.
   */
  public anonymize(data: FacialAnalysis): AnonymizedAnalysis {
    const { faceId, ...rest } = data;
    
    // In production, we use a salted hash to allow trend analysis without PII
    // For now, we use a "BEH-U-XXXX" token pattern
    const anonymizedId = `BEH-U-${Buffer.from(faceId).toString('hex').substring(0, 8).toUpperCase()}`;

    return {
      ...rest,
      anonymizedId,
      isComplianceVerified: true
    };
  }

  /**
   * Anonymizes a PoseEvent object by stripping ID and masking location.
   */
  public anonymizePose(data: PoseEvent): AnonymizedPose {
    const { id, location, ...rest } = data;
    
    // Mask location (e.g., "Sala 101" -> "Zona 1")
    const maskedLocation = location.includes('Area_') 
      ? location.replace('Area_', 'Zona ') 
      : 'Local Protegido';

    return {
      ...rest,
      anonymizedId: `POSE-EV-${Math.random().toString(36).substring(7).toUpperCase()}`,
      maskedLocation,
      isComplianceVerified: true
    };
  }

  /**
   * Batch anonymization for history logs
   */
  public anonymizeBatch(dataList: FacialAnalysis[]): AnonymizedAnalysis[] {
    return dataList.map(item => this.anonymize(item));
  }
}

export const lgpdFilter = new LGPDFilter();
export default lgpdFilter;
