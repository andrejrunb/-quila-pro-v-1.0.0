/**
 * HardwareAccelerationService.ts — Áquila Pro Sovereign Hardware Acceleration
 * 
 * Centraliza a orquestração e telemetria de 3 camadas de processamento:
 *  1. NVIDIA Cloud DGX H100 (Engenharia de Código, Raciocínio Profundo & Tutoria)
 *  2. Google Colab Pro A100 (Visão Computacional, ArcFace 512-dim & QLoRA SFT)
 *  3. Hardware Edge Local (AMD Vega / Intel / NPU via DirectML ONNX)
 */

import * as https from 'https';
import * as http from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';
import { colabGpuBridge } from './ColabGpuBridge';
import { nvidiaInferenceService } from './NvidiaInferenceService';
import { logger } from '../logger';

const execAsync = promisify(exec);

export interface HardwareTelemetry {
  timestamp: string;
  nvidiaCloud: {
    status: 'ONLINE' | 'OFFLINE';
    latencyMs: number;
    activeModel: string;
    availableModelsCount: number;
  };
  colabGpu: {
    status: 'ONLINE' | 'STANDBY';
    url: string;
    device?: string;
    vramTotalGb?: number;
    vramUsedGb?: number;
    capabilities?: {
      insightface: boolean;
      yolo: boolean;
    };
  };
  localEdge: {
    device: string;
    acceleration: string;
    directMlSupported: boolean;
  };
}

export class HardwareAccelerationService {
  private static instance: HardwareAccelerationService;
  private cachedLocalGpu: string = 'Detectando...';

  public static getInstance(): HardwareAccelerationService {
    if (!HardwareAccelerationService.instance) {
      HardwareAccelerationService.instance = new HardwareAccelerationService();
    }
    return HardwareAccelerationService.instance;
  }

  private constructor() {
    this.detectLocalGpu().catch(() => {});
  }

  private async detectLocalGpu(): Promise<string> {
    try {
      const { stdout } = await execAsync('powershell -NoProfile -Command "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name"');
      this.cachedLocalGpu = stdout.trim() || 'Chip Gráfico Integrado';
      return this.cachedLocalGpu;
    } catch {
      this.cachedLocalGpu = 'Acelerador Gráfico Windows';
      return this.cachedLocalGpu;
    }
  }

  public async getTelemetry(): Promise<HardwareTelemetry> {
    // 1. Testa NVIDIA NIM Cloud
    let nvidiaOnline = false;
    let nvidiaLatency = 0;
    let availableModelsCount = 33;
    const nvidiaKey = nvidiaInferenceService.getPrimaryNimKey();
    const externalDisabled =
      process.env.AQUILA_DISABLE_EXTERNAL_APIS === 'true' ||
      process.env.AQUILA_AIRGAP_ACTIVE === 'true';

    if (nvidiaKey && !externalDisabled) {
      const t0 = Date.now();
      try {
        const resp = await new Promise<{ ok: boolean; count?: number }>((resolve) => {
          const req = https.request({
            hostname: 'integrate.api.nvidia.com',
            path: '/v1/models',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${nvidiaKey}` },
            timeout: 5000
          }, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
              if (res.statusCode === 200) {
                try {
                  const parsed = JSON.parse(body);
                  const count = Array.isArray(parsed?.data) ? parsed.data.length : undefined;
                  resolve({ ok: true, count });
                } catch {
                  resolve({ ok: true });
                }
              } else {
                resolve({ ok: false });
              }
            });
          });
          req.on('error', () => resolve({ ok: false }));
          req.on('timeout', () => { req.destroy(); resolve({ ok: false }); });
          req.end();
        });
        nvidiaOnline = resp.ok;
        if (resp.count) availableModelsCount = resp.count;
        nvidiaLatency = Date.now() - t0;
      } catch {
        nvidiaOnline = false;
      }
    }

    // 2. Testa Google Colab
    const colabStatus = colabGpuBridge.getStatus();
    const colabHealth = await colabGpuBridge.checkHealth().catch(() => null);

    return {
      timestamp: new Date().toLocaleTimeString(),
      nvidiaCloud: {
        status: nvidiaOnline ? 'ONLINE' : 'OFFLINE',
        latencyMs: nvidiaLatency,
        activeModel: 'nvidia/nemotron-3.5-lightning-30b-a3b',
        availableModelsCount
      },
      colabGpu: {
        status: (colabHealth?.status === 'HEALTHY' || colabHealth?.status === 'DEGRADED') ? 'ONLINE' : 'STANDBY',
        url: colabStatus.url || 'https://xxx.trycloudflare.com',
        device: colabHealth?.gpu ? `${colabHealth.gpu.total_gb}GB VRAM` : 'NVIDIA A100 / T4',
        vramTotalGb: colabHealth?.gpu?.total_gb || 0,
        vramUsedGb: colabHealth?.gpu?.allocated_gb || 0,
        capabilities: {
          insightface: colabHealth?.capabilities?.face_recognition || false,
          yolo: colabHealth?.capabilities?.object_detection || false
        }
      },
      localEdge: {
        device: this.cachedLocalGpu,
        acceleration: 'DirectML / ONNX Runtime DmlExecutionProvider',
        directMlSupported: true
      }
    };
  }

  public async setColabUrl(url: string): Promise<{ success: boolean; message: string; health: any }> {
    try {
      colabGpuBridge.configure(url);
      const health = await colabGpuBridge.checkHealth();
      return {
        success: health.status === 'HEALTHY' || health.status === 'DEGRADED',
        message: 'Endpoint atualizado e validado com sucesso.',
        health
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Falha ao conectar: ${err.message}`,
        health: null
      };
    }
  }

  public async executeGpuDevTask(role: 'coder' | 'architect' | 'qa' | 'security' | 'vision', prompt: string): Promise<{
    success: boolean;
    response: string;
    model: string;
    latencyMs: number;
    tokens?: number;
  }> {
    const t0 = Date.now();
    try {
      const targetModel =
        role === 'vision'
          ? 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning'
          : 'nvidia/nemotron-3.5-lightning-30b-a3b';
      const res = await nvidiaInferenceService.generateCompletion(
        `Você é o Agente Especialista '${role}' do Áquila Pro operando no cluster DGX H100. Gere soluções de alta fidelidade e código limpo.`,
        prompt,
        targetModel
      );
      return {
        success: true,
        response: res.content,
        model: res.model,
        latencyMs: Date.now() - t0,
        tokens: res.totalTokens
      };
    } catch (err: any) {
      return {
        success: false,
        response: `Erro ao executar na GPU: ${err.message}`,
        model: 'cluster-dgx',
        latencyMs: Date.now() - t0
      };
    }
  }
}

export const hardwareAccelerationService = HardwareAccelerationService.getInstance();
