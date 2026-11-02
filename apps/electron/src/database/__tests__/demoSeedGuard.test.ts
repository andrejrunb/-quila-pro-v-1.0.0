import * as os from 'os';
import * as path from 'path';
import { isIsolatedDemoDatabaseTarget } from '../demoSeedGuard';

describe('isolated demo database guard', () => {
  const originalEnvironment = { ...process.env };

  afterEach(() => {
    for (const key of ['NODE_ENV', 'AQUILA_ENABLE_DEMO_SEED', 'AQUILA_DEMO_SEED_DB_PATH', 'AQUILA_USER_DATA_OVERRIDE']) {
      if (originalEnvironment[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnvironment[key];
    }
  });

  it('rejects the installation database even when demo seeding is explicitly enabled', () => {
    const appData = path.join(os.tmpdir(), 'aquila-seed-guard-test');
    const installationDb = path.join(appData, 'AquilaPro', 'aquila.db');
    process.env.NODE_ENV = 'development';
    process.env.AQUILA_ENABLE_DEMO_SEED = 'true';
    process.env.AQUILA_USER_DATA_OVERRIDE = appData;
    process.env.AQUILA_DEMO_SEED_DB_PATH = installationDb;

    expect(isIsolatedDemoDatabaseTarget(installationDb)).toBe(false);
  });

  it('accepts only the explicitly configured dedicated development database', () => {
    const appData = path.join(os.tmpdir(), 'aquila-seed-guard-test');
    const dedicatedDb = path.join(os.tmpdir(), 'aquila-demo-only.db');
    process.env.NODE_ENV = 'development';
    process.env.AQUILA_ENABLE_DEMO_SEED = 'true';
    process.env.AQUILA_USER_DATA_OVERRIDE = appData;
    process.env.AQUILA_DEMO_SEED_DB_PATH = dedicatedDb;

    expect(isIsolatedDemoDatabaseTarget(dedicatedDb)).toBe(true);
    expect(isIsolatedDemoDatabaseTarget(path.join(appData, 'AquilaPro', 'aquila.db'))).toBe(false);
  });
});
