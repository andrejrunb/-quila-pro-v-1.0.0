/**
 * Step 122 — Schema PostgreSQL: schools, heartbeats, aggregated_events
 * Executa com: ts-node src/db/migrate.ts
 */
import { pool } from './pool';

export async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ─── Tabela principal de escolas matriculadas ─────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS schools (
        id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        cloud_id      TEXT        UNIQUE NOT NULL,
        api_key_hash  TEXT        NOT NULL,
        hostname      TEXT,
        platform      TEXT,
        version       TEXT,
        enrolled_at   TIMESTAMPTZ DEFAULT NOW(),
        last_seen_at  TIMESTAMPTZ DEFAULT NOW(),
        is_active     BOOLEAN     DEFAULT TRUE
      )
    `);

    // ─── Heartbeats de saúde ──────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS heartbeats (
        id          SERIAL      PRIMARY KEY,
        school_id   UUID        NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        cpu_avg     FLOAT,
        mem_free_mb FLOAT,
        mem_total_mb FLOAT,
        uptime_sec  BIGINT,
        recorded_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Eventos agregados (sem PII — LGPD Art. 11) ───────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS aggregated_events (
        id           SERIAL      PRIMARY KEY,
        school_id    UUID        NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        event_type   TEXT        NOT NULL,
        event_date   DATE        NOT NULL,
        total_count  INTEGER     DEFAULT 1,
        payload      JSONB       DEFAULT '{}',
        received_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Audit log na nuvem ───────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS cloud_audit (
        id         SERIAL      PRIMARY KEY,
        school_id  UUID,
        action     TEXT        NOT NULL,
        ip_address TEXT,
        payload    JSONB       DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Sinais do App dos Pais (Mobile Drive-Thru) ───────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS parent_signals (
        id           SERIAL      PRIMARY KEY,
        school_id    UUID        NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        student_hash TEXT        NOT NULL,
        signal_type  TEXT        NOT NULL,
        status       TEXT        DEFAULT 'pending',
        created_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Módulo Financeiro (V3) ──────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS billing (
        id           SERIAL      PRIMARY KEY,
        school_id    UUID        NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        student_hash TEXT        NOT NULL,
        amount       DECIMAL(10,2) NOT NULL,
        due_date     DATE        NOT NULL,
        status       TEXT        DEFAULT 'pending', -- pending, paid, overdue
        pix_code     TEXT,       -- Mock PIX copy/paste
        created_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `);

     // ─── Notas do Administrador (WhatsApp / Sistema) ──────────────
     await client.query(`
       CREATE TABLE IF NOT EXISTS notes (
         id         SERIAL      PRIMARY KEY,
         school_id  UUID        REFERENCES schools(id) ON DELETE CASCADE,
         content    TEXT        NOT NULL,
         author     TEXT        DEFAULT 'admin',
         created_at TIMESTAMPTZ DEFAULT NOW(),
         metadata   JSONB       DEFAULT '{}'
       )
     `);

    // ─── Índices de performance ───────────────────────────────────
    await client.query(`CREATE INDEX IF NOT EXISTS idx_heartbeats_school ON heartbeats(school_id, recorded_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_events_school_date ON aggregated_events(school_id, event_date DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_school ON cloud_audit(school_id, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_billing_student ON billing(school_id, student_hash)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at DESC)`);

    await client.query('COMMIT');
    console.log('✅ Migration concluída: 5 tabelas, 4 índices criados.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration falhou:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  migrate().then(() => process.exit(0)).catch(() => process.exit(1));
}
