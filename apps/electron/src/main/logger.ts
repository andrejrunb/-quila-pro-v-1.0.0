import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import { Logger } from '../services/Logger';

// Helper for paths before app is ready
function getSafeUserDataPath() {
  try {
    return app.getPath('userData');
  } catch (e) {
    return path.join(process.cwd(), 'userData');
  }
}

const USER_DATA_PATH = getSafeUserDataPath();
const LOGS_PATH = path.join(USER_DATA_PATH, 'logs');

if (!fs.existsSync(LOGS_PATH)) {
  fs.mkdirSync(LOGS_PATH, { recursive: true });
}

export const logger = new Logger(LOGS_PATH);
console.log(`[Áquila Pro] Shared Logger initialized at: ${LOGS_PATH}`);
