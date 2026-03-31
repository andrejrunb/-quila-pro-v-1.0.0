import { performance } from 'perf_hooks';

/**
 * Suite de Testes de Carga - Áquila Pro
 * Simula cenários reais de processamento para validar performance
 */

export interface LoadTestScenario {
  name: string;
  students: number;
  cameras: number;
  durationSeconds: number;
  fps: number;
}

export interface LoadTestResult {
  scenario: LoadTestScenario;
  totalFrames: number;
  totalDetections: number;
  totalFaceRecognitions: number;
  averageLatency: number;
  maxLatency: number;
  minLatency: number;
  cpuUsage: number;
  ramUsage: number;
  throughput: number; // FPS
  successRate: number; // %
  errors: string[];
  timestamp: Date;
}

export class LoadTester {
  private results: LoadTestResult[] = [];

  /**
   * Cenários de teste pré-definidos
   */
  static readonly SCENARIOS: LoadTestScenario[] = [
    {
      name: 'Escola Pequena (50 alunos)',
      students: 50,
      cameras: 2,
      durationSeconds: 60,
      fps: 30,
    },
    {
      name: 'Escola Pequena Pico (50 alunos)',
      students: 50,
      cameras: 2,
      durationSeconds: 60,
      fps: 60,
    },
    {
      name: 'Escola Média (250 alunos)',
      students: 250,
      cameras: 8,
      durationSeconds: 120,
      fps: 30,
    },
    {
      name: 'Escola Média Pico (250 alunos)',
      students: 250,
      cameras: 8,
      durationSeconds: 120,
      fps: 60,
    },
    {
      name: 'Escola Grande (500 alunos)',
      students: 500,
      cameras: 15,
      durationSeconds: 180,
      fps: 30,
    },
    {
      name: 'Escola Grande Pico (500 alunos)',
      students: 500,
      cameras: 15,
      durationSeconds: 180,
      fps: 60,
    },
    {
      name: 'Escola Muito Grande (1000 alunos)',
      students: 1000,
      cameras: 30,
      durationSeconds: 300,
      fps: 30,
    },
  ];

  /**
   * Executar teste de carga completo
   */
  async runFullTest(): Promise<LoadTestResult[]> {
    console.log('🚀 Iniciando suite de testes de carga...');
    this.results = [];

    for (const scenario of LoadTester.SCENARIOS) {
      console.log(`\
📊 Testando: ${scenario.name}`);
      const result = await this.runScenario(scenario);
      this.results.push(result);
      this.printResult(result);
    }

    console.log('\
✅ Suite de testes concluída!');
    return this.results;
  }

  /**
   * Executar teste de carga individual
   */
  async runScenario(scenario: LoadTestScenario): Promise<LoadTestResult> {
    const startTime = performance.now();
    const latencies: number[] = [];
    const errors: string[] = [];

    let totalFrames = 0;
    let totalDetections = 0;
    let totalFaceRecognitions = 0;
    let successCount = 0;

    // Calcular número de frames a processar
    const totalFramesToProcess = scenario.fps * scenario.durationSeconds;
    const framesPerCamera = totalFramesToProcess / scenario.cameras;

    // Simular processamento de frames
    for (let frame = 0; frame < totalFramesToProcess; frame++) {
      try {
        const frameStartTime = performance.now();

        // Simular detecção de pessoas (YOLO)
        const detections = this.simulateDetection(
          scenario.students,
          scenario.cameras
        );
        totalDetections += detections.length;

        // Simular reconhecimento facial
        for (const detection of detections) {
          const recognized = await this.simulateFaceRecognition(detection);
          if (recognized) {
            totalFaceRecognitions++;
          }
        }

        // Simular rastreamento
        await this.simulateTracking(detections);

        // Simular análise de presença
        await this.simulatePresenceAnalysis(detections, scenario.students);

        const frameLatency = performance.now() - frameStartTime;
        latencies.push(frameLatency);
        totalFrames++;
        successCount++;
      } catch (error) {
        errors.push(`Frame ${frame}: ${(error as Error).message}`);
      }
    }

    const endTime = performance.now();
    const totalDuration = (endTime - startTime) / 1000; // segundos

    // Calcular métricas
    const averageLatency =
      latencies.length > 0
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length
        : 0;
    const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;
    const minLatency = latencies.length > 0 ? Math.min(...latencies) : 0;
    const throughput = totalFrames / totalDuration;
    const successRate = (successCount / totalFramesToProcess) * 100;

    // Simular uso de recursos
    const cpuUsage = this.calculateCpuUsage(
      scenario.students,
      scenario.cameras,
      throughput
    );
    const ramUsage = this.calculateRamUsage(
      scenario.students,
      scenario.cameras,
      totalDetections
    );

    return {
      scenario,
      totalFrames,
      totalDetections,
      totalFaceRecognitions,
      averageLatency,
      maxLatency,
      minLatency,
      cpuUsage,
      ramUsage,
      throughput,
      successRate,
      errors,
      timestamp: new Date(),
    };
  }

  /**
   * Simular detecção de pessoas com YOLO
   */
  private simulateDetection(students: number, cameras: number): any[] {
    // Simular ~30% dos alunos visíveis em cada câmera
    const visiblePerCamera = Math.floor((students / cameras) * 0.3);
    const detections: any[] = [];

    for (let i = 0; i < visiblePerCamera; i++) {
      detections.push({
        id: `det-${i}`,
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        width: 100 + Math.random() * 200,
        height: 200 + Math.random() * 300,
        confidence: 0.8 + Math.random() * 0.2,
        timestamp: Date.now(),
      });
    }

    // Simular latência de detecção (20-100ms)
    const detectionLatency = 20 + Math.random() * 80;
    this.sleep(detectionLatency);

    return detections;
  }

  /**
   * Simular reconhecimento facial
   */
  private async simulateFaceRecognition(detection: any): Promise<boolean> {
    // Simular latência de reconhecimento (100-500ms)
    const recognitionLatency = 100 + Math.random() * 400;
    await this.sleep(recognitionLatency);

    // 80% de sucesso na identificação
    return Math.random() < 0.8;
  }

  /**
   * Simular rastreamento de pessoas
   */
  private async simulateTracking(detections: any[]): Promise<void> {
    // Simular latência de rastreamento (10-50ms)
    const trackingLatency = 10 + Math.random() * 40;
    await this.sleep(trackingLatency);
  }

  /**
   * Simular análise de presença
   */
  private async simulatePresenceAnalysis(
    detections: any[],
    students: number
  ): Promise<void> {
    // Simular latência de análise (50-200ms)
    const analysisLatency = 50 + Math.random() * 150;
    await this.sleep(analysisLatency);
  }

  /**
   * Calcular uso estimado de CPU
   */
  private calculateCpuUsage(
    students: number,
    cameras: number,
    throughput: number
  ): number {
    // Fórmula: base (20%) + students (10% por 100 alunos) + cameras (15% por 5 câmeras)
    const baseUsage = 20;
    const studentUsage = (students / 100) * 10;
    const cameraUsage = (cameras / 5) * 15;
    const throughputUsage = (throughput / 30) * 10; // Normalizar para 30 FPS

    return Math.min(95, baseUsage + studentUsage + cameraUsage + throughputUsage);
  }

  /**
   * Calcular uso estimado de RAM
   */
  private calculateRamUsage(
    students: number,
    cameras: number,
    totalDetections: number
  ): number {
    // Base: 4GB
    // + 2GB por 100 alunos
    // + 3GB por 5 câmeras
    // + 0.1GB por 1000 detecções
    const baseRam = 4;
    const studentRam = (students / 100) * 2;
    const cameraRam = (cameras / 5) * 3;
    const detectionRam = (totalDetections / 1000) * 0.1;

    return baseRam + studentRam + cameraRam + detectionRam;
  }

  /**
   * Dormir por ms milissegundos
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Imprimir resultado do teste
   */
  private printResult(result: LoadTestResult): void {
    console.log(`\
  📈 Resultados:`);
    console.log(`    Total de Frames: ${result.totalFrames}`);
    console.log(`    Total de Detecções: ${result.totalDetections}`);
    console.log(`    Total de Reconhecimentos: ${result.totalFaceRecognitions}`);
    console.log(`    Latência Média: ${result.averageLatency.toFixed(2)}ms`);
    console.log(`    Latência Máxima: ${result.maxLatency.toFixed(2)}ms`);
    console.log(`    Latência Mínima: ${result.minLatency.toFixed(2)}ms`);
    console.log(`    Throughput: ${result.throughput.toFixed(2)} FPS`);
    console.log(`    Taxa de Sucesso: ${result.successRate.toFixed(2)}%`);
    console.log(`    Uso de CPU: ${result.cpuUsage.toFixed(2)}%`);
    console.log(`    Uso de RAM: ${result.ramUsage.toFixed(2)} GB`);

    if (result.errors.length > 0) {
      console.log(`    ⚠️  Erros: ${result.errors.length}`);
      result.errors.slice(0, 3).forEach(err => console.log(`       - ${err}`));
    }
  }

  /**
   * Exportar resultados em JSON
   */
  exportResults(): string {
    return JSON.stringify(this.results, null, 2);
  }

  /**
   * Exportar resultados em CSV
   */
  exportResultsCSV(): string {
    const headers = [
      'Cenário',
      'Alunos',
      'Câmeras',
      'Total de Frames',
      'Latência Média (ms)',
      'Latência Máxima (ms)',
      'Throughput (FPS)',
      'Taxa de Sucesso (%)',
      'Uso de CPU (%)',
      'Uso de RAM (GB)',
      'Erros',
    ];

    const rows = this.results.map(r => [
      r.scenario.name,
      r.scenario.students,
      r.scenario.cameras,
      r.totalFrames,
      r.averageLatency.toFixed(2),
      r.maxLatency.toFixed(2),
      r.throughput.toFixed(2),
      r.successRate.toFixed(2),
      r.cpuUsage.toFixed(2),
      r.ramUsage.toFixed(2),
      r.errors.length,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\
');

    return csv;
  }

  /**
   * Gerar relatório HTML
   */
  generateHTMLReport(): string {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Relatório de Testes de Carga - Áquila Pro</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        h1 { color: #333; }
        table { width: 100%; border-collapse: collapse; background: white; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #0066cc; color: white; }
        tr:hover { background: #f9f9f9; }
        .good { color: #4CAF50; font-weight: bold; }
        .warning { color: #FF9800; font-weight: bold; }
        .error { color: #F44336; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>📊 Relatório de Testes de Carga - Áquila Pro</h1>
      <p>Gerado em: ${new Date().toLocaleString()}</p>
      
      <table>
        <thead>
          <tr>
            <th>Cenário</th>
            <th>Alunos</th>
            <th>Câmeras</th>
            <th>Latência Média</th>
            <th>Throughput</th>
            <th>Taxa de Sucesso</th>
            <th>CPU</th>
            <th>RAM</th>
          </tr>
        </thead>
        <tbody>
          ${this.results
            .map(
              r => `
            <tr>
              <td>${r.scenario.name}</td>
              <td>${r.scenario.students}</td>
              <td>${r.scenario.cameras}</td>
              <td>${r.averageLatency.toFixed(2)}ms</td>
              <td class="${r.throughput >= 25 ? 'good' : 'warning'}">${r.throughput.toFixed(2)} FPS</td>
              <td class="${r.successRate >= 95 ? 'good' : r.successRate >= 85 ? 'warning' : 'error'}">${r.successRate.toFixed(2)}%</td>
              <td class="${r.cpuUsage <= 70 ? 'good' : r.cpuUsage <= 85 ? 'warning' : 'error'}">${r.cpuUsage.toFixed(2)}%</td>
              <td>${r.ramUsage.toFixed(2)} GB</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
    `;

    return html;
  }
}

// Executar testes se for chamado diretamente
if (require.main === module) {
  const tester = new LoadTester();
  tester.runFullTest().then(() => {
    console.log('\
📄 Exportando resultados...');
    console.log(tester.exportResultsCSV());
  });
}

export default LoadTester;

