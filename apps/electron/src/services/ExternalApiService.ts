import http from 'http';
import { Database } from '../database/Database';
import { Logger } from '../utils/Logger';

const logger = new Logger('ExternalAPI');

export class ExternalApiService {
  private server: http.Server;
  private port: number = 3004;

  constructor(private db: Database) {
    this.server = http.createServer((req, res) => this.handleRequest(req, res));
  }

  public start() {
    this.server.listen(this.port, () => {
      logger.info(`Sovereign School API ativa em http://localhost:${this.port}`);
    });
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    // CORS básico para integrações locais
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-API-Key, Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const apiKey = req.headers['x-api-key'];
    // Simulação de validação de API Key (No V2, virá da tabela system_configs)
    if (!apiKey || apiKey !== 'AQUILA_MASTER_2026') {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized: Invalid or missing API Key' }));
      return;
    }

    const url = new URL(req.url || '', `http://${req.headers.host}`);
    
    try {
      if (url.pathname === '/api/v1/students/economy') {
        const data = await this.db.all('SELECT student_id, balance, level, xp FROM student_economy');
        this.sendJSON(res, 200, data);
      } 
      else if (url.pathname === '/api/v1/attendance/summary') {
        const data = await this.db.all('SELECT classId, status, COUNT(*) as count FROM attendance GROUP BY classId, status');
        this.sendJSON(res, 200, data);
      }
      else {
        this.sendJSON(res, 404, { error: 'Endpoint not found' });
      }
    } catch (err: any) {
      logger.error(`API Error: ${err.message}`);
      this.sendJSON(res, 500, { error: 'Internal Server Error', message: err.message });
    }
  }

  private sendJSON(res: http.ServerResponse, status: number, data: any) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  public stop() {
    this.server.close();
  }
}
