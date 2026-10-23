import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Retorna o IP do host da máquina de desenvolvimento automaticamente.
 * Quando o Expo Go abre o app no celular, Constants.expoConfig?.hostUri contém "192.168.x.x:8081".
 */
function getDevServerIp(): string {
  try {
    const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return ip;
      }
    }
  } catch (e) {
    // Fallback silencioso
  }
  // IP da máquina local na rede Wi-Fi (detectado no ipconfig)
  return '192.168.18.91';
}

const SERVER_HOST = Platform.OS === 'web' ? 'localhost' : getDevServerIp();

export const API_CONFIG = {
  DEV_HOST: SERVER_HOST,
  GATEWAY_PORT: 9000,
  GATEWAY_WS_URL: `ws://${SERVER_HOST}:9000`,
  GATEWAY_HTTP_URL: `http://${SERVER_HOST}:9000`,
  COLAB_GPU_URL: 'https://agriculture-lime-rendering-budapest.trycloudflare.com',
  DEFAULT_STUDENT_ID: 'stu-9a-02',
};

/**
 * Cria uma conexão WebSocket resiliente com auto-reconnect para os módulos mobile.
 */
export function createGatewayWebSocket(onOpen?: () => void, onError?: (err: any) => void): WebSocket {
  const url = API_CONFIG.GATEWAY_WS_URL;
  console.log(`[MobileAPI] Conectando ao Gateway Soberano em: ${url}`);
  const ws = new WebSocket(url);
  if (onOpen) ws.onopen = onOpen;
  if (onError) ws.onerror = onError;
  return ws;
}
