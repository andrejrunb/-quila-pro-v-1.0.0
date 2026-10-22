/**
 * VisitorRegistrationService (v1634)
 * Gerencia o cadastro de visitantes e triagem de segurança.
 */
class VisitorRegistrationService {
  private visitors: any[] = [];
  
  // Mock de Base de Dados Sensível (Simulação de Segurança Pública)
  private watchlist: string[] = [
    '000.000.000-01', // CPF Mock para alerta
    '999.999.999-99'
  ];

  /**
   * Registra novo visitante com triagem automática
   */
  public async registerVisitor(data: { name: string; cpf: string; phone: string; photo: string }) {
    const isFlagged = this.watchlist.includes(data.cpf);
    
    const visitor = {
      ...data,
      id: `vis-${Date.now()}`,
      checkIn: new Date().toISOString(),
      securityStatus: isFlagged ? 'CRITICAL' : 'CLEARED'
    };

    this.visitors.push(visitor);
    console.log(`[VisitorService] Visitor ${data.name} registered. Status: ${visitor.securityStatus}`);

    if (isFlagged) {
       // Notifica coordenação imediatamente (Mock)
       this.notifySecurityTeam(visitor);
    }

    return visitor;
  }

  private notifySecurityTeam(visitor: any) {
    console.warn(`[SECURITY ALERT] Watchlist Match: ${visitor.name} (${visitor.cpf}) is at RECEPTION.`);
  }

  public getRecentVisitors() {
    return this.visitors.slice(-10).reverse();
  }
}

export const visitorRegistrationService = new VisitorRegistrationService();

