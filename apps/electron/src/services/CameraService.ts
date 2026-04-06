import * as fs from 'fs';
import * as path from 'path';

/**
 * CameraService — Orquestrador de dispositivos de captura e processamento.
 * Gerencia streams RTSP e ciclos de vida de câmeras IP.
 */
export class CameraService {
    private cameras: any[] = [];
    private db: any;
    private recognitionLoop: any;
    private licenseService: any;

    constructor(db?: any, recognitionLoop?: any, licenseService?: any) {
        this.db = db;
        this.recognitionLoop = recognitionLoop;
        this.licenseService = licenseService;
        console.log('[CameraService] Inicializando motor de visão com injeção de dependências...');
    }

    public async registerCamera(config: any) {
        console.log(`[CameraService] Registrando câmera: ${config.name}`);
        this.cameras.push(config);
        return config;
    }

    public async getCameras() {
        return this.cameras;
    }

    public async addCamera(camera: any) {
        console.log(`[CameraService] Adicionando nova câmera: ${camera.name}`);
        this.cameras.push(camera);
        return { success: true, cameraId: Date.now().toString() };
    }

    public async updateCameraStatus(id: string, status: string) {
        console.log(`[CameraService] Atualizando status da câmera ${id} para ${status}`);
        const cam = this.cameras.find(c => c.id === id);
        if (cam) cam.status = status;
        return { success: true };
    }

    public getActiveCameras() {
        return this.cameras;
    }
}

// Para manter compatibilidade com importações diretas
export const cameraService = new CameraService();
export default CameraService;
