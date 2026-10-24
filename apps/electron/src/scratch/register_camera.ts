import { cameraService } from '../main/services/CameraService';
import { Database } from '../database/Database';

async function register() {
    console.log('Iniciando registro manual da câmera...');
    try {
        const db = Database.getInstance();
        await db.initialize();
        
        const result = await cameraService.addCamera({
            id: 'cam_principal_01',
            name: 'Câmera Principal - Entrada',
            url: 'rtsp://admin:EagleSovereign2026#Admin@192.168.1.105:554/stream1',
            location: 'Entrada Principal',
            type: 'RTSP',
            metadata: {
                model: 'Generic 4MP',
                vendor: 'Sovereign-Compatible'
            }
        });
        console.log('Câmera registrada com sucesso:', result);
    } catch (error) {
        console.error('Erro ao registrar câmera:', error);
    }
}

register();
