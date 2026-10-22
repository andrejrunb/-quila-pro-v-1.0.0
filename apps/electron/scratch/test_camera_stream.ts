import { Database } from '../src/database/Database';
import { CameraService } from '../src/main/services/CameraService';

async function main() {
    console.log('[Script] Inicializando Banco de Dados...');
    const db = Database.getInstance();
    await db.initialize();

    console.log('[Script] Inicializando CameraService...');
    const cameraService = new CameraService();

    // Aguarda carregar câmeras (o construtor chama loadCamerasFromDB mas é async)
    // Para garantir, vamos forçar uma carga ou esperar um pouco
    await new Promise(resolve => setTimeout(resolve, 1000));

    const cameras = cameraService.getCameras();
    console.log(`[Script] Câmeras detectadas: ${cameras.length}`);

    const target = cameras.find(c => c.ip === '192.168.1.105');
    if (!target) {
        console.error('[Script] Câmera 192.168.1.105 não encontrada!');
        await db.close();
        return;
    }

    console.log(`[Script] Testando conectividade para ${target.name} (${target.rtspUrl})...`);
    const isOnline = await cameraService.testConnection(target.rtspUrl);
    
    console.log(`[Script] Status da Conexão: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);

    if (isOnline) {
        console.log('[Script] SUCESSO: Integração validada.');
    } else {
        console.warn('[Script] AVISO: A câmera foi registrada mas não respondeu ao teste de stream (pode ser esperado em ambiente simulado).');
    }

    await db.close();
}

main().catch(err => {
    console.error('[Script] Erro fatal:', err);
    process.exit(1);
});
