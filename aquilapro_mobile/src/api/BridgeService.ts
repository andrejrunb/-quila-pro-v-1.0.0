class BridgeService {
  private static instance: BridgeService;
  private serverUrl: string = 'http://192.168.1.100:3001'; // Fallback IP

  private constructor() {}

  public static getInstance(): BridgeService {
    if (!BridgeService.instance) {
      BridgeService.instance = new BridgeService();
    }
    return BridgeService.instance;
  }

  public setServerUrl(url: string) {
    this.serverUrl = url;
  }

  public async getStudentStatus(studentId: string) {
    try {
      const response = await fetch(`${this.serverUrl}/api/status/${studentId}`);
      return await response.json();
    } catch (error) {
      console.error('Bridge Error:', error);
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
