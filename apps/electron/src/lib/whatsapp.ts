// Evolution API WhatsApp wrapper (REST API v2)
export interface EvolutionApiConfig {
  apiUrl: string; // e.g., 'http://localhost:8080'
  apiKey: string; // Global API Key configured in docker-compose
}

/**
 * Creates or initializes an instance in Evolution API.
 */
export async function createWhatsAppInstance(
  config: EvolutionApiConfig,
  instanceName: string = 'aquila'
): Promise<any> {
  const response = await fetch(`${config.apiUrl}/instance/create`, {
    method: 'POST',
    headers: {
      apikey: config.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Evolution API error ${response.status}: ${err}`);
  }
  return response.json();
}

/**
 * Gets connection state / QR Code for an instance.
 */
export async function getWhatsAppConnect(
  config: EvolutionApiConfig,
  instanceName: string = 'aquila'
): Promise<any> {
  const response = await fetch(`${config.apiUrl}/instance/connect/${instanceName}`, {
    method: 'GET',
    headers: {
      apikey: config.apiKey,
    },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Evolution API connect error ${response.status}: ${err}`);
  }
  return response.json();
}

/**
 * Sends a plain text message via Evolution API v2.
 */
export async function sendWhatsAppMessage(
  config: EvolutionApiConfig,
  to: string,
  text: string,
  instanceName: string = 'aquila'
): Promise<any> {
  const payload = {
    number: to,
    text,
  };

  const response = await fetch(`${config.apiUrl}/message/sendText/${instanceName}`, {
    method: 'POST',
    headers: {
      apikey: config.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Evolution API error ${response.status}: ${err}`);
  }
  return response.json();
}

