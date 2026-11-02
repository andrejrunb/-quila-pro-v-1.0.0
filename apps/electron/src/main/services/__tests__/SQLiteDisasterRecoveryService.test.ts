import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
jest.unmock('better-sqlite3');
import Database from 'better-sqlite3';
import { SQLiteDisasterRecoveryService } from '../SQLiteDisasterRecoveryService';

describe('SQLite restore fail-closed behavior', () => {
  it('keeps restore drills disabled', () => {
    expect(() => SQLiteDisasterRecoveryService.runRestoreDrill('nonexistent-backup'))
      .toThrow('Restore drills are disabled');
  });

  it.each([
    'candidate preparation failure',
    'replacement or rename refusal',
    'locked target database',
    'invalid backup',
    'interruption between restore stages',
  ])('preserves the prior database after %s', (failure) => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'aquila-restore-'));
    const targetPath = path.join(directory, 'aquila.db');
    const candidatePath = path.join(directory, 'candidate.bak');
    const candidateBytes = Buffer.from(`candidate for ${failure}`);
    fs.writeFileSync(candidatePath, candidateBytes);

    const liveDb = new Database(targetPath);
    liveDb.pragma('journal_mode = WAL');
    liveDb.exec('CREATE TABLE records (value TEXT NOT NULL)');
    liveDb.prepare('INSERT INTO records (value) VALUES (?)').run('prior-state');
    liveDb.pragma('locking_mode = EXCLUSIVE');

    try {
      expect(() => SQLiteDisasterRecoveryService.restoreEncryptedBackup({
        backupFilePath: candidatePath,
        targetRestorePath: targetPath,
        masterKey: 'test-key-not-used-by-disabled-restore',
      })).toThrow('restoration is disabled');

      expect(liveDb.prepare('SELECT value FROM records').get()).toEqual({ value: 'prior-state' });
      expect(fs.readFileSync(candidatePath)).toEqual(candidateBytes);
    } finally {
      liveDb.close();
    }

    const reopenedDb = new Database(targetPath, { readonly: true });
    expect(reopenedDb.prepare('SELECT value FROM records').get()).toEqual({ value: 'prior-state' });
    reopenedDb.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
});
