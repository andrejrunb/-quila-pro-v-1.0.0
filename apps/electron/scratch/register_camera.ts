import { Database } from '../src/database/Database';
import { CameraService } from '../src/main/services/CameraService';

async function main() {
    console.log('[Script] Inicializando Banco de Dados...');
    const db = Database.getInstance();
    await db.initialize();

    console.log('[Script] Inicializando CameraService...');
    const cameraService = new CameraService();

    const targetCamera = {
        name: 'Camera Pedagógica - Principal',
        location: 'Entrada Principal',
        ip: '192.168.1.105',
        url: 'rtsp://admin:EagleSovereign2026#Admin@192.168.1.105:554/stream1',
        username: 'admin',
        password: process.env.INITIAL_ADMIN_PASSWORD || 'EagleSovereign2026#Admin',
        type: 'RTSP'
    };

    console.log('[Script] Registrando câmera...');
    try {
        const result = await cameraService.addCamera(targetCamera);
        console.log('[Script] Resultado:', result);
        
        const cameras = cameraService.getCameras();
        console.log(`[Script] Total de câmeras no serviço: ${cameras.length}`);
        
        // Verificação direta no DB
        const dbCameras = await db.all('SELECT * FROM cameras WHERE id = ?', [result.cameraId]);
        console.log('[Script] Verificação no Banco de Dados:', dbCameras);
        
        if (dbCameras.length > 0) {
            console.log('[Script] SUCESSO: Câmera persistida corretamente.');
        } else {
            console.error('[Script] ERRO: Câmera não encontrada no banco após inserção.');
        }
    } catch (error) {
        console.error('[Script] Falha crítica:', error);
    } finally {
        await db.close();
    }
}

main().catch(err => {
    console.error('[Script] Erro fatal:', err);
    process.exit(1);
});
