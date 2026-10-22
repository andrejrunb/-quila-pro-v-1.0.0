
import { db } from '../apps/electron/src/database/Database';
import { churnMonitorService } from '../apps/electron/src/main/services/ChurnMonitorService';
import { dropoutPredictor } from '../apps/electron/src/main/services/DropoutPredictor';
import { sovereignGraphService } from '../apps/electron/src/main/services/SovereignGraphService';
import { logger } from '../apps/electron/src/main/logger';

async function verifyIntelligence() {
    console.log('--- STARTING INTELLIGENCE VERIFICATION V2 ---');

    try {
        // 1. Setup DB e Tabelas
        console.log('Initializing Database...');
        await db.run("DELETE FROM students");
        await db.run("DELETE FROM attendance");
        await db.run("DELETE FROM student_risk_history");
        await db.run("DELETE FROM classes");
        await db.run("DELETE FROM schools");

        await db.run("INSERT INTO schools (id, name) VALUES ('school_1', 'Aquila Academy')");
        await db.run("INSERT INTO classes (id, schoolId, name) VALUES ('class_1', 'school_1', 'Alpha Class')");

        // 2. Criar Estudantes
        const studentA = { id: 'std_A', name: 'Student High Risk', classId: 'class_1' };
        const studentB = { id: 'std_B', name: 'Student Relational Risk', classId: 'class_1' };

        await db.run("INSERT INTO students (id, classId, name, status, metadata) VALUES (?, ?, ?, 'active', '{}')", 
            [studentA.id, studentA.classId, studentA.name]);
        await db.run("INSERT INTO students (id, classId, name, status, metadata) VALUES (?, ?, ?, 'active', '{}')", 
            [studentB.id, studentB.classId, studentB.name]);

        // 3. Adicionar Presença para Student A (Faltas excessivas)
        console.log('Seeding attendance data...');
        for (let i = 1; i <= 10; i++) {
            const date = `2026-05-${i < 10 ? '0' + i : i}`;
            await db.run("INSERT INTO attendance (id, studentId, classId, scheduleId, date, status) VALUES (?, ?, 'class_1', 'sch_1', ?, 'absent')",
                [`att_A_${i}`, studentA.id, date]);
            
            // Student B está presente
            await db.run("INSERT INTO attendance (id, studentId, classId, scheduleId, date, status) VALUES (?, ?, 'class_1', 'sch_1', ?, 'present')",
                [`att_B_${i}`, studentB.id, date]);
        }

        // 4. Rodar Hydration e Scan Global
        console.log('Running Global Scan (Hydration + Analysis)...');
        // Precisamos garantir que o ChurnMonitorService use a instância correta do DB (ele já usa a importada)
        await churnMonitorService.runGlobalRiskScan();

        // 5. Verificar Resultados do Student A
        console.log('\n--- VERIFYING STUDENT A (Direct Risk) ---');
        const historyA = await db.all("SELECT * FROM student_risk_history WHERE student_id = ? ORDER BY analyzed_at DESC", [studentA.id]);
        console.log(`History records found: ${historyA.length}`);
        if (historyA.length > 0) {
            const latest = historyA[0];
            console.log(`Risk Score: ${latest.risk_score}`);
            console.log(`Factors: ${latest.factors}`);
            console.log(`Recommendation: ${latest.recommendation}`);
            
            if (latest.risk_score > 70 && latest.recommendation) {
                console.log('✅ Student A: High risk and recommendation persisted.');
            } else {
                console.log('❌ Student A: Risk score or recommendation missing/low.');
            }
        }

        // 6. Verificar Resultados do Student B (Relational Risk)
        console.log('\n--- VERIFYING STUDENT B (Relational Risk) ---');
        const historyB = await db.all("SELECT * FROM student_risk_history WHERE student_id = ? ORDER BY analyzed_at DESC", [studentB.id]);
        if (historyB.length > 0) {
            const latest = historyB[0];
            console.log(`Risk Score: ${latest.risk_score}`);
            console.log(`Factors: ${latest.factors}`);
            
            // Student B tem 100% de presença, mas seu vizinho A é crítico.
            // O score base deve ser baixo, mas aumentado pelo risco relacional.
            if (latest.factors.includes('Risco de influência social')) {
                console.log('✅ Student B: Relational risk factor detected.');
            } else {
                console.log('❌ Student B: Relational risk factor NOT detected.');
            }
        }

        // 7. Verificar Grafo
        console.log('\n--- VERIFYING GRAPH CONTEXT ---');
        const neighborsB = sovereignGraphService.getNeighbors(studentB.id);
        console.log(`Student B Neighbors: ${neighborsB.length}`);
        neighborsB.forEach(n => console.log(` - Neighbor: ${n.id} (Relation: ${n.relation})`));

        console.log('\n--- VERIFICATION COMPLETE ---');
    } catch (err) {
        console.error('FATAL ERROR DURING VERIFICATION:', err);
    } finally {
        process.exit(0);
    }
}

verifyIntelligence();
