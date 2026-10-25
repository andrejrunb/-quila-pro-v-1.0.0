/**
 * Áquila Pro — Configuração de Escopo e Feature Flags do Piloto Escolar
 * 
 * Define o congelamento do escopo operacional (Scope Freeze) para a fase piloto.
 * Módulos experimentais ou de alto impacto permanecem desativados por padrão,
 * garantindo estabilidade, foco na rotina escolar e segurança jurídica.
 */

export interface PilotFeatureConfig {
  // === NÚCLEO ESSENCIAL DO PILOTO (ATIVO POR PADRÃO) ===
  enableDigitalDiary: boolean;       // Diário de classe digital e chamadas
  enableAssistedAttendance: boolean;  // Frequência via RFID / lista / validação humana
  enableParentCommunications: boolean;// Mensagens via WhatsApp / Push para responsáveis
  enableGradeBook: boolean;           // Boletim escolar e fechamento de médias
  enableOmrGrading: boolean;          // Correção óptica de cartões-resposta (OMR controlado)
  enablePedagogicalReports: boolean;  // Relatórios de rendimento e radar de defasagem

  // === MÓDULOS EXPERIMENTAIS (DESATIVADOS POR PADRÃO NO PILOTO) ===
  enableLiveFaceRecognition: boolean; // Biometria facial autônoma ao vivo em portaria
  enableRfDensePose: boolean;         // Percepção passiva por sinais WiFi CSI (RuView)
  enableParentGeofencing: boolean;    // Geofencing de aproximação de pais na saída
  enableAutonomousMarketing: boolean; // Agentes autônomos de captação de leads e redes sociais
  enableCrossPlatformIosBuild: boolean;// Compilador iOS xtool sem hardware macOS
  enableExternalPortalScraping: boolean;// Conectores externos não homologados por convênio
}

export const PILOT_FEATURE_FLAGS: PilotFeatureConfig = {
  // Núcleo do Piloto — 100% Homologado e Ativo
  enableDigitalDiary: true,
  enableAssistedAttendance: true,
  enableParentCommunications: true,
  enableGradeBook: true,
  enableOmrGrading: true,
  enablePedagogicalReports: true,

  // Módulos Experimentais — Desativados por padrão para segurança e foco no MVP
  enableLiveFaceRecognition: process.env.ENABLE_EXPERIMENTAL_FACE_RECOGNITION === 'true',
  enableRfDensePose: process.env.ENABLE_EXPERIMENTAL_DENSE_POSE === 'true',
  enableParentGeofencing: process.env.ENABLE_EXPERIMENTAL_GEOFENCING === 'true',
  enableAutonomousMarketing: false,
  enableCrossPlatformIosBuild: false,
  enableExternalPortalScraping: false,
};

export function isFeatureActive(feature: keyof PilotFeatureConfig): boolean {
  return PILOT_FEATURE_FLAGS[feature] ?? false;
}
