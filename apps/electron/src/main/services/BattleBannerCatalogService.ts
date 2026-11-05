import { CosmeticGrantService, CosmeticItemRecord } from './CosmeticGrantService';

export { CosmeticGrantService as BattleBannerCatalogService, CosmeticItemRecord };

export interface EditorialQuoteMetadata {
  quote?: string;
  sourceWork?: string;
  sourceLocator?: string;
  verified?: boolean;
}

export function validateEditorialQuoteGate(entry: EditorialQuoteMetadata): {
  allowed: boolean;
  displayQuote: string;
  reason?: string;
} {
  if (!entry.quote || entry.quote.trim().length === 0) {
    return { allowed: true, displayQuote: '' };
  }
  if (
    entry.verified === true &&
    typeof entry.sourceWork === 'string' &&
    entry.sourceWork.trim().length > 0 &&
    typeof entry.sourceLocator === 'string' &&
    entry.sourceLocator.trim().length > 0
  ) {
    return { allowed: true, displayQuote: entry.quote.trim() };
  }
  return {
    allowed: false,
    displayQuote: '',
    reason: 'UNVERIFIED_PRIMARY_SOURCE_OMITTED'
  };
}
