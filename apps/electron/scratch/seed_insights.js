const sqlite3 = require('better-sqlite3');
const db = new sqlite3('c:/aquila/apps/electron/database.sqlite');

try {
    // Check if table exists
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ai_insights_review'").get();
    if (!table) {
        console.log("Creating table ai_insights_review...");
        db.exec(`
            CREATE TABLE IF NOT EXISTS ai_insights_review (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                description TEXT,
                category TEXT,
                impact_score INTEGER,
                status TEXT DEFAULT 'PENDING',
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    // Insert mock insights
    const insights = [
        {
            title: 'Otimização de Escala (Sexta-feira)',
            description: 'O algoritmo detectou uma queda de 15% na ocupação das salas nas sextas à tarde. Sugerimos agrupar atividades eletivas para reduzir consumo de energia em 22%.',
            category: 'INFRAESTRUTURA',
            impact_score: 8
        },
        {
            title: 'Refinamento de Grade Horária',
            description: 'Conflito latente detectado entre laboratório de IA e aula de robótica. Ajuste de 15 minutos na troca de turno evitaria 90% das colisões de recursos.',
            category: 'PEDAGÓGICO',
            impact_score: 9
        },
        {
            title: 'Prevenção de Evasão (Early Alert)',
            description: 'Padrões de micro-absenteísmo detectados em 3 alunos do 9º ano. Sugerimos intervenção proativa da coordenação.',
            category: 'RETENÇÃO',
            impact_score: 10
        }
    ];

    const insert = db.prepare('INSERT INTO ai_insights_review (title, description, category, impact_score) VALUES (?, ?, ?, ?)');
    
    for (const insight of insights) {
        insert.run(insight.title, insight.description, insight.category, insight.impact_score);
    }

    console.log("Seeding complete. 3 insights added.");

} catch (err) {
    console.error("Error seeding data:", err);
} finally {
    db.close();
}
