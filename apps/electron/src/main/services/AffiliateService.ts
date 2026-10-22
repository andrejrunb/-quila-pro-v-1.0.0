import { EventEmitter } from 'events';

export interface AffiliateProduct {
  id: string;
  name: string;
  description: string;
  category: 'WIFI_REPEATER' | 'IOT_SENSOR' | 'CAMERA' | 'LOCK' | 'COMPUTER' | 'TABLET' | 'DISPLAY';
  tier: 'economy' | 'standard' | 'enterprise';
  affiliateUrl: string;
  priceEstimate: number;
  verified: boolean;
}

/**
 * AffiliateService (v1617-18)
 * Registro de produtos e hardware certificado para o ecossistema Áquila.
 */
class AffiliateService extends EventEmitter {
  private products: AffiliateProduct[] = [];

  constructor() {
    super();
    this.seedVerifiedHardware();
  }

  private seedVerifiedHardware() {
    this.products = [
      // WIFI REPEATERS
      {
        id: 'rep_eco',
        name: 'Repetidor WiFi 300Mbps Basic',
        description: 'Solução de baixo custo para salas pequenas.',
        category: 'WIFI_REPEATER',
        tier: 'economy',
        affiliateUrl: 'https://www.amazon.com.br/dp/B0_ECO_REP?tag=aquilapro-20',
        priceEstimate: 59.90,
        verified: true
      },
      {
        id: 'rep_ent',
        name: 'Access Point WiFi 6 Mesh Pro',
        description: 'Máxima densidade de rastreio CSI e estabilidade.',
        category: 'WIFI_REPEATER',
        tier: 'enterprise',
        affiliateUrl: 'https://www.amazon.com.br/dp/B0_ENT_REP?tag=aquilapro-20',
        priceEstimate: 450.00,
        verified: true
      },
      // COMPUTERS (TOTEMS/SERVER)
      {
        id: 'pc_eco',
        name: 'Mini PC Celeron 8GB/128GB',
        description: 'Para totens de sinalização e chamadas simples.',
        category: 'COMPUTER',
        tier: 'economy',
        affiliateUrl: 'https://www.amazon.com.br/dp/B0_ECO_PC?tag=aquilapro-20',
        priceEstimate: 850.00,
        verified: true
      },
      {
        id: 'pc_ent',
        name: 'Estação de IA Intel i7 32GB/RTX',
        description: 'Processamento local pesado de visão computacional e ReID.',
        category: 'COMPUTER',
        tier: 'enterprise',
        affiliateUrl: 'https://www.amazon.com.br/dp/B0_ENT_PC?tag=aquilapro-20',
        priceEstimate: 4200.00,
        verified: true
      },
      // DISPLAYS
      {
        id: 'tv_eco',
        name: 'Monitor LED 32" HD',
        description: 'Display informativo econômico.',
        category: 'DISPLAY',
        tier: 'economy',
        affiliateUrl: 'https://www.amazon.com.br/dp/B0_ECO_TV?tag=aquilapro-20',
        priceEstimate: 890.00,
        verified: true
      },
      {
        id: 'tv_ent',
        name: 'Vídeo Wall 55" Profissional 24/7',
        description: 'Display de alta durabilidade para SOC central.',
        category: 'DISPLAY',
        tier: 'enterprise',
        affiliateUrl: 'https://www.amazon.com.br/dp/B0_ENT_TV?tag=aquilapro-20',
        priceEstimate: 3500.00,
        verified: true
      }
    ];
  }

  public getProductsByCategory(category: AffiliateProduct['category']): AffiliateProduct[] {
    return this.products.filter(p => p.category === category);
  }

  public getAllVerified(): AffiliateProduct[] {
    return this.products.filter(p => p.verified);
  }

  /**
   * Registra um novo produto afiliado (Admin Only)
   */
  public registerProduct(product: AffiliateProduct) {
    this.products.push(product);
    this.emit('product-registered', product);
  }
}

export const affiliateService = new AffiliateService();

