/**
 * RendererLogger.ts — Browser-safe version of the Logger
 * Only used in the Renderer process bundle to avoid Node.js leaks.
 */
export const logger = {
  debug: (msg: string, data?: any) => console.debug(`[UI][DEBUG] ${msg}`, data || ''),
  info: (msg: string, data?: any) => console.info(`[UI][INFO] ${msg}`, data || ''),
  warn: (msg: string, data?: any) => console.warn(`[UI][WARN] ${msg}`, data || ''),
  error: (msg: string, data?: any) => console.error(`[UI][ERROR] ${msg}`, data || ''),
};

export default logger;
