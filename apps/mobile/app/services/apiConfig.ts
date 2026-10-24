import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Retorna o host da API do gateway escolar configurado por ambiente ou descoberto no Expo Go.
 */
function getGatewayHost(): string {
  // 1. Variável de ambiente configurada na compilação ou .env
  if (process.env.EXPO_PUBLIC_GATEWAY_HOST) {
    return process.env.EXPO_PUBLIC_GATEWAY_HOST;
  }

  // 2. Detecção automática de IP do Bundler Metro quando no Expo Go
  try {
    const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return ip;
      }
    }
  } catch (e) {
    // Fallback seguro
  }

  return Platform.OS === 'web' ? 'localhost' : '127.0.0.1';
}

const SERVER_HOST = getGatewayHost();
const USE_SSL = process.env.EXPO_PUBLIC_USE_SSL === 'true' || SERVER_HOST.includes('.');
const WS_PROTOCOL = USE_SSL ? 'wss' : 'ws';
const HTTP_PROTOCOL = USE_SSL ? 'https' : 'http';

export const API_CONFIG = {
  DEV_HOST: SERVER_HOST,
  GATEWAY_PORT: 9000,
  GATEWAY_WS_URL: `${WS_PROTOCOL}://${SERVER_HOST}:9000`,
  GATEWAY_HTTP_URL: `${HTTP_PROTOCOL}://${SERVER_HOST}:9000`,
  COLAB_GPU_URL: process.env.EXPO_PUBLIC_COLAB_GPU_URL || '',
  DEFAULT_STUDENT_ID: 'stu-9a-02',
};

/**
 * Cria uma conexão WebSocket resiliente com auto-reconnect para os módulos mobile.
 */
export function createGatewayWebSocket(onOpen?: () => void, onError?: (err: any) => void): WebSocket {
  const url = API_CONFIG.GATEWAY_WS_URL;
  console.log(`[MobileAPI] Conectando ao Gateway em: ${url}`);
  const ws = new WebSocket(url);
  if (onOpen) ws.onopen = onOpen;
  if (onError) ws.onerror = onError;
  return ws;
}
