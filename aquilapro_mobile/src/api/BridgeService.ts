class BridgeService {
  private static instance: BridgeService;
  private serverUrl: string = 'http://sequila.local:3001'; // Default mDNS/Zeroconf address
  private isScanning: boolean = false;

  private constructor() {
    this.discoverHub();
  }

  public static getInstance(): BridgeService {
    if (!BridgeService.instance) {
      BridgeService.instance = new BridgeService();
    }
    return BridgeService.instance;
  }

  /**
   * Procura automaticamente pelo Áquila Edge Hub na rede local.
   * Implementação futura: Integração com Zeroconf/react-native-zeroconf.
   */
  public async discoverHub(): Promise<boolean> {
    if (this.isScanning) return false;
    this.isScanning = true;
    
    console.log('Sovereign Bridge: Iniciando descoberta de Hub...');
    
    // Simulação de Descoberta (Placeholder para mDNS)
    return new Promise((resolve) => {
      setTimeout(() => {
        // Se encontrarmos o hub via mDNS, atualizamos a URL
        // this.serverUrl = 'http://192.168.1.105:3001';
        this.isScanning = false;
        resolve(true);
      }, 2000);
    });
  }

  public setServerUrl(url: string) {
    console.log(`Bridge: Manual Override para ${url}`);
    this.serverUrl = url;
  }

  public async getStudentStatus(studentId: string) {
    try {
      const response = await fetch(`${this.serverUrl}/api/status/${studentId}`);
      if (!response.ok) throw new Error('Offline');
      return await response.json();
    } catch (error) {
      console.error('Bridge Error (Hub Offline?):', error);
      // Fallback: Tenta redescobrir o Hub se a conexão falhar
      this.discoverHub();
      return null;
    }
  }

  public async getSystemAlerts() {
    try {
      const response = await fetch(`${this.serverUrl}/api/alerts`);
      return await response.json();
    } catch (error) {
      console.error('Bridge Error:', error);
      return [];
    }
  }
}

export default BridgeService.getInstance();
