import cameraDiscoveryService from '../main/services/CameraDiscoveryService';

async function runDiagnostic(ip: string) {
    console.log(`[Diagnostic] Iniciando teste para: ${ip}`);
    const ports = [554, 80, 8000, 8080, 8899, 37777];
    
    console.log('--- Verificando Portas ---');
    for (const port of ports) {
        const isOpen = await cameraDiscoveryService.checkPort(ip, port, 2000);
        console.log(`Porta ${port} (${getPortName(port)}): ${isOpen ? 'ABERTA' : 'FECHADA'}`);
    }
    
    console.log('--- Resumo ---');
    const result = await (cameraDiscoveryService as any).foundDevices?.[ip];
    if (result) {
        console.log(`Vendedor detectado: ${result.vendor}`);
    } else {
        console.log('Nenhum serviço de câmera detectado no IP informado.');
    }
}

function getPortName(port: number): string {
    switch(port) {
        case 554: return 'RTSP';
        case 80: return 'HTTP';
        case 8000: return 'Hikvision / Discovery';
        case 8080: return 'Web Server / Alternative';
        case 8899: return 'ONVIF';
        case 37777: return 'Dahua / Intelbras';
        default: return 'Desconhecido';
    }
}

const targetIP = process.argv[2] || '192.168.18.7';
runDiagnostic(targetIP).catch(err => console.error('Falha no diagnóstico:', err));
