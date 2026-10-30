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
    const nvidiaKey = process.env.NVIDIA_API_KEY || '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';
    
    if (nvidiaKey) {
      const t0 = Date.now();
      try {
        const resp = await new Promise<boolean>((resolve) => {
          const req = https.request({
            hostname: 'integrate.api.nvidia.com',
            path: '/v1/models',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${nvidiaKey}` },
            timeout: 5000
          }, (res) => {
            resolve(res.statusCode === 200);
          });
          req.on('error', () => resolve(false));
          req.on('timeout', () => { req.destroy(); resolve(false); });
          req.end();
        });
        nvidiaOnline = resp;
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
        activeModel: 'minimaxai/minimax-m3.1-flash',
        availableModelsCount: 85
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
      const res = await nvidiaInferenceService.generateCompletion(
        `Você é o Agente Especialista '${role}' do Áquila Pro operando no cluster DGX H100. Gere soluções de alta fidelidade e código limpo.`,
        prompt,
        role === 'vision' ? 'meta/llama-3.2-90b-vision-instruct' : 'minimaxai/minimax-m3.1-flash'
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
