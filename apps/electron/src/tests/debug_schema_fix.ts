import { Database } from '../database/Database';

async function syncSchema() {
  const db = Database.getInstance();
  await db.initialize();
  
  const tableInfo: any[] = await db.all("PRAGMA table_info(students)");
  const colNames = tableInfo.map(c => c.name);
  console.log('--- COLUNAS ATUAIS ---', colNames);

  const missingCols = [
    { name: 'registrationNumber', type: 'TEXT' },
    { name: 'status', type: 'TEXT DEFAULT "active"' }
  ];

  for (const col of missingCols) {
    if (!colNames.includes(col.name)) {
      console.log(`[Fix] Adicionando ${col.name}...`);
      try {
        await db.run(`ALTER TABLE students ADD COLUMN ${col.name} ${col.type}`);
      } catch (e: any) {
        console.error(`[Fix] Falha ao adicionar ${col.name}:`, e.message);
      }
    }
  }
}

syncSchema();
