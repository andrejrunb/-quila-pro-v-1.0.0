import { logger } from '../logger';

export interface InstallationGuide {
  vendor: string;
  recommendedPort: number;
  rtspTemplate: string;
  onvifPath: string;
  setupSteps: string[];
}

/**
 * CameraInstallationAdvisor (Nível 35)
 * Fornece inteligência técnica para auxiliar na instalação e configuração de câmeras.
 * Converte IPs e Portas em configurações funcionais do Áquila Pro.
 */
export class CameraInstallationAdvisor {
  private static instance: CameraInstallationAdvisor;

  private constructor() {}

  public static getInstance(): CameraInstallationAdvisor {
    if (!CameraInstallationAdvisor.instance) {
      CameraInstallationAdvisor.instance = new CameraInstallationAdvisor();
    }
    return CameraInstallationAdvisor.instance;
  }

  /**
   * Gera um guia de instalação baseado nos dados descobertos.
   */
  public getGuide(vendor: string, ip: string): InstallationGuide {
    logger.info(`[Advisor] Gerando guia para ${vendor} no IP ${ip}`);

    const baseGuides: Record<string, InstallationGuide> = {
      'Hikvision': {
        vendor: 'Hikvision',
        recommendedPort: 8000,
        rtspTemplate: `rtsp://admin:SENHA@${ip}:554/Streaming/Channels/101`,
        onvifPath: `http://${ip}:80/onvif/device_service`,
        setupSteps: [
          'Ative o protocolo ONVIF na interface web da câmera.',
          'Crie um usuário dedicado para o Áquila nas configurações de segurança.',
          'Certifique-se que o serviço RTSP está habilitado na porta 554.'
        ]
      },
      'Intelbras': {
        vendor: 'Intelbras',
        recommendedPort: 37777,
        rtspTemplate: `rtsp://admin:SENHA@${ip}:554/cam/realmonitor?channel=1&subtype=0`,
        onvifPath: `http://${ip}:80/onvif/device_service`,
        setupSteps: [
          'Verifique se a câmera está no modo de compatibilidade ONVIF Perfil S.',
          'Use a conta admin padrão ou uma conta de instalador.',
          'Ajuste o bitrate para H.264 para melhor compatibilidade.'
        ]
      },
      'Tapo': {
        vendor: 'Tapo/TP-Link',
        recommendedPort: 554,
        rtspTemplate: `rtsp://admin:SENHA@${ip}:554/stream1`,
        onvifPath: `http://${ip}:2020/onvif/device_service`,
        setupSteps: [
          'Ative a conta de Câmera no App Tapo (Configurações > Conta da Câmera).',
          'A porta ONVIF padrão para Tapo é 2020.',
          'O stream1 é o de alta resolução (HD).'
        ]
      }
    };

    return baseGuides[vendor] || {
      vendor: 'Generic',
      recommendedPort: 80,
      rtspTemplate: `rtsp://admin:SENHA@${ip}:554/live/ch1`,
      onvifPath: `http://${ip}:80/onvif/device_service`,
      setupSteps: ['Tente usar o scanner ONVIF automático.', 'Consulte o manual do fabricante para a URL RTSP.']
    };
  }
}

export const cameraInstallationAdvisor = CameraInstallationAdvisor.getInstance();
