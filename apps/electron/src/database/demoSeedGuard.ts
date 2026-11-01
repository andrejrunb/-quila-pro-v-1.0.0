import * as fs from 'fs';
import * as path from 'path';

export function isIsolatedDemoDatabaseTarget(
  databasePath: string | undefined,
  enableFlag = 'AQUILA_ENABLE_DEMO_SEED'
): boolean {
  const configuredPath = process.env.AQUILA_DEMO_SEED_DB_PATH;
  if (
    process.env.NODE_ENV !== 'development' ||
    process.env[enableFlag] !== 'true' ||
    !configuredPath ||
    !databasePath ||
    !path.isAbsolute(configuredPath)
  ) {
    return false;
  }

  const normalize = (value: string) => {
    const absolute = path.resolve(value);
    return fs.existsSync(absolute) ? fs.realpathSync(absolute) : absolute;
  };
  const canonicalConfiguredPath = normalize(configuredPath);
  const canonicalDatabasePath = normalize(databasePath);
  const appDataPath = process.env.AQUILA_USER_DATA_OVERRIDE || process.env.APPDATA ||
    (process.platform === 'darwin'
      ? path.join(process.env.HOME || '', 'Library', 'Application Support')
      : path.join(process.env.HOME || '', '.config'));
  const productionDatabasePath = path.resolve(appDataPath, 'AquilaPro', 'aquila.db');
  const canonicalProductionPath = normalize(productionDatabasePath);
  const equalPath = (left: string, right: string) =>
    process.platform === 'win32' ? left.toLowerCase() === right.toLowerCase() : left === right;

  return equalPath(canonicalConfiguredPath, canonicalDatabasePath) &&
    !equalPath(canonicalDatabasePath, canonicalProductionPath);
}

export function isDedicatedDemoDatabase(
  databasePath: string | undefined,
  enableFlag = 'AQUILA_ENABLE_DEMO_SEED'
): boolean {
  const configuredPath = process.env.AQUILA_DEMO_SEED_DB_PATH;
  return isIsolatedDemoDatabaseTarget(databasePath, enableFlag) &&
    !!configuredPath &&
    fs.existsSync(configuredPath) &&
    !!databasePath &&
    fs.existsSync(databasePath);
}
