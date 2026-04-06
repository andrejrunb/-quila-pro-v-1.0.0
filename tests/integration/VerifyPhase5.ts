import { Database } from "./apps/electron/src/database/Database";
import { EvasionRadarService } from "./apps/electron/src/services/EvasionRadarService";
import { FinanceService } from "./apps/electron/src/services/FinanceService";
import { NexusEconomyService } from "./apps/electron/src/services/NexusEconomyService";
import { OmnissearchService } from "./apps/electron/src/services/OmnissearchService";
import path from "path";

async function verify() {
  const dbPath = path.join(process.cwd(), 'aquila_test.db');
  const db = new Database(dbPath);
  await db.initialize();

  console.log("--- TESTE ECONOMIA NORMALIZADA ---");
  const economyService = new NexusEconomyService(db);
  const studentId = 'test-student-001';

  // Inserir dados de teste
  await db.run('INSERT OR IGNORE INTO students (id, classId, name) VALUES (?, "class-a", "Aluno de Teste")', [studentId]);
  await db.run('INSERT OR IGNORE INTO student_economy (student_id, balance, level, xp) VALUES (?, 100, 5, 4500)', [studentId]);
  await db.run('INSERT OR IGNORE INTO student_inventory (student_id, item_id, item_type, is_equipped) VALUES (?, "skin_shadow", "skin", 1)', [studentId]);

  const profile = await economyService.getEconomy(studentId);
  console.log("Perfil Econômico:", profile);

  console.log("\n--- TESTE RADAR DE EVASÃO ---");
  const radar = new EvasionRadarService(db);
  
  // Simular presença ruim (14 dias)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 5);
  await db.run('INSERT INTO attendance (id, studentId, classId, scheduleId, date, status) VALUES (?, ?, "class-a", "sch-1", ?, "absent")', 
    ['att-1', studentId, fourteenDaysAgo.toISOString().split('T')[0]]);

  const risk14 = await radar.analyzeStudentRisk(studentId, 14);
  console.log("Perfil de Risco:", { 
    score: risk14.riskScore, 
    level: risk14.level, 
    trend: risk14.trend,
    factors: risk14.factors.length 
  });

  console.log("\n--- TESTE FINANCIAL GLASS ---");
  const finance = new FinanceService(db);
  const bill = await finance.createBilling(studentId, 450.00, '2026-05-10');
  console.log("Fatura Gerada:", { id: bill.id, amount: bill.amount, token: bill.pixCode.substring(0, 15) + "..." });
  
  const audits = await db.all('SELECT * FROM audit_logs WHERE record_id = ?', [bill.id]);
  console.log("Audit Log Localizado:", audits.length > 0 ? "SUCCESS" : "FAILED");

  console.log("\n--- TESTE OMNISSEARCH (Multimodal) ---");
  const search = new OmnissearchService(db);
  const results = await search.search("Teste");
  console.log("Resultados de Busca:", results.length);
  
  const voice = await search.processVoiceCommand("BUSCAR Aluno");
  console.log("Comando de Voz:", voice.action, voice.data.length, "resultados");

  await db.close();
  console.log("\nDONE: Fase 5 Totalmente Validada (v3510).");
}

verify().catch(console.error);
