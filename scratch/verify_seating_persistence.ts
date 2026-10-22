import { Database } from '../apps/electron/src/database/Database';
import { SeatingIntelligenceService } from '../apps/electron/src/main/services/SeatingIntelligenceService';

async function verifyAtomicity() {
    console.log("--- Starting Seating Persistence Atomicity Audit ---");
    
    const db = Database.getInstance();
    await db.initialize();
    
    const service = new SeatingIntelligenceService();
    
    // 1. Create a dummy class and students if needed
    // Assuming we have some data for classId 'audit-test'
    const classId = 'audit-test';
    const students = [
        { id: 'student-1', name: 'Test Student 1' },
        { id: 'student-2', name: 'Test Student 2' }
    ];
    
    // Prepare DB
    await db.run("INSERT OR IGNORE INTO classes (id, name) VALUES (?, ?)", [classId, 'Audit Class']);
    for (const s of students) {
        await db.run("INSERT OR IGNORE INTO students (id, name, classId) VALUES (?, ?, ?)", [s.id, s.name, classId]);
    }
    
    console.log("[Test] Injecting error into saveStudentSeat to test rollback...");
    
    // Monkey-patch saveStudentSeat to fail on second student
    const originalSave = db.saveStudentSeat.bind(db);
    let count = 0;
    db.saveStudentSeat = async (studentId: string, row: number, col: number) => {
        count++;
        if (count === 2) {
            throw new Error("Simulated Database Failure during multi-update");
        }
        return originalSave(studentId, row, col);
    };
    
    const layout = [
        { studentId: 'student-1', row: 1, col: 1 },
        { studentId: 'student-2', row: 1, col: 2 }
    ];
    
    try {
        await service.applyLayout(classId, layout);
        console.error("FAIL: applyLayout should have thrown an error.");
    } catch (e: any) {
        console.log(`[OK] applyLayout failed as expected: ${e.message}`);
    }
    
    // Verify rollback: student-1 should NOT have row 1, col 1 if it was null before
    const student1 = await db.get("SELECT row, col FROM students WHERE id = ?", ['student-1']);
    const auditLog = await db.get("SELECT * FROM notifications WHERE type = 'AUDIT' AND details LIKE ?", [`%${classId}%`]);
    
    if (student1.row === 1 && student1.col === 1) {
        console.error("FAIL: Rollback did not work. Student 1 position was persisted.");
    } else {
        console.log("[SUCCESS] Rollback verified. Student 1 position was not persisted.");
    }
    
    if (auditLog) {
        console.error("FAIL: Audit log was persisted despite transaction failure.");
    } else {
        console.log("[SUCCESS] Audit log rollback verified.");
    }
    
    await db.close();
    console.log("--- Audit Complete ---");
}

verifyAtomicity().catch(console.error);
