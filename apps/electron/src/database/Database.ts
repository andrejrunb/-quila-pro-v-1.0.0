import DatabaseSQLite = require('better-sqlite3');

import { supabase } from '../lib/supabase';



/**

 * Helper to sync a record to Supabase (if enabled).

 * It attempts an upsert (insert or update) on the remote table.

 */

async function syncToSupabase<T extends Record<string, any>>(table: string, record: T) {

  try {

    const { data, error } = await supabase.from(table).upsert(record, { onConflict: Object.keys(record)[0] });

    if (error) {

      console.error(`[Supabase Sync] Error syncing to ${table}:`, error.message);

    } else {

      console.log(`[Supabase Sync] Synced record to ${table}:`, data);

    }

  } catch (e) {

    console.error(`[Supabase Sync] Exception syncing to ${table}:`, e);

  }

}

import * as path from 'path';

import * as fs from 'fs';

import { logger } from '../main/logger';

import { securityService } from '../main/services/SecurityService';



export class Database {

    private db: any = null;

    private dbPath: string;

    private initialized: boolean = false;

    private static instance: Database;

    private writeBehindQueue: Array<{ sql: string, params: any[] }> = [];

    private writeBehindInterval: NodeJS.Timeout | null = null;



    public static getInstance(): Database {

        if (!Database.instance) {

            Database.instance = new Database();

        }

        return Database.instance;

    }



    public static setInstance(instance: Database): void {

        Database.instance = instance;

    }



    constructor(customPath?: string) {

        if (customPath) {

            this.dbPath = customPath;

        } else {

            const appDataPath = process.env.AQUILA_USER_DATA_OVERRIDE || process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config');

            const aquilaPath = path.join(appDataPath, 'AquilaPro');

            if (!fs.existsSync(aquilaPath)) {

                fs.mkdirSync(aquilaPath, { recursive: true });

            }

            this.dbPath = path.join(aquilaPath, 'aquila.db');

        }

    }



    /**

     * Inicializa o banco de dados SQA-1000

     */

    async initialize() {

        try {

            console.log(`[Database] Abrindo conexão SQA-1000 em: ${this.dbPath}`);

            const DBConstructor = (DatabaseSQLite as any).default || DatabaseSQLite;

            console.log(`[Database] Constructor type: ${typeof DBConstructor}`);

            

            this.db = new DBConstructor(this.dbPath, {

                verbose: console.log,

                fileMustExist: false

            });



            console.log(`[Database] DB Instance created: ${this.db ? 'YES' : 'NO'}`);



            // Ativar Modo WAL para alta concorrência

            this.db.pragma('journal_mode = WAL');

            this.db.pragma('synchronous = NORMAL');

            this.db.pragma('temp_store = MEMORY');

            this.db.pragma('busy_timeout = 5000');



            await this.createTables();

            await this.performMigrations();

            await this.seedInitialSuccessGoals();

            await this.createIndices();

            await this.checkIntegrity();

            await this.setupInfiniteRetention();



            if (!this.writeBehindInterval) {

                this.writeBehindInterval = setInterval(() => {

                    this.flushQueue().catch(err => {

                        console.error('[Database] Erro periódico no flushQueue:', err);

                    });

                }, 5000);

                if (this.writeBehindInterval && typeof this.writeBehindInterval.unref === 'function') {

                    this.writeBehindInterval.unref();

                }

            }



            this.initialized = true;

            console.log('[Database] Núcleo de persistência SQA-1000 operacional.');

        } catch (err: any) {

            console.error(`[Database] Erro fatal ao inicializar: ${err.message}`);

            throw err;

        }

    }



    /**

     * Prepara uma instrução SQL (Proxy para better-sqlite3)

     */

    public prepare(sql: string) {

        if (!this.db) throw new Error("Database not initialized");

        return this.db.prepare(sql);

    }



    async createTables() {

        const tables = [

            `CREATE TABLE IF NOT EXISTS institution_profile (

                id TEXT PRIMARY KEY,

                name TEXT NOT NULL,

                type TEXT DEFAULT 'PRIVATE',

                tier TEXT DEFAULT 'STARTER',

                region TEXT DEFAULT 'capital',

                inep_code TEXT,

                metadata TEXT DEFAULT '{}',

                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP

            )`,

            `CREATE TABLE IF NOT EXISTS schools (

                id TEXT PRIMARY KEY,

                name TEXT NOT NULL,

                address TEXT,

                phone TEXT,

                email TEXT,

                type TEXT DEFAULT 'private',

                region TEXT DEFAULT 'capital',

                plan TEXT DEFAULT 'starter',

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP

            )`,

            `CREATE TABLE IF NOT EXISTS classes (

                id TEXT PRIMARY KEY,

                schoolId TEXT NOT NULL,

                name TEXT NOT NULL,

                grade TEXT,

                type TEXT DEFAULT 'REGULAR',

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (schoolId) REFERENCES schools(id)

            )`,

            `CREATE TABLE IF NOT EXISTS students (

                id TEXT PRIMARY KEY,

                classId TEXT NOT NULL,

                name TEXT NOT NULL,

                registrationNumber TEXT UNIQUE,

                parentPhone TEXT,

                status TEXT DEFAULT 'active',

                observationLevel INTEGER DEFAULT 0,

                frustrationScore INTEGER DEFAULT 0,

                sovereignCoins INTEGER DEFAULT 0,

                photoPath TEXT,

                photoHash TEXT,

                metadata TEXT DEFAULT '{}',

                row INTEGER,

                col INTEGER,

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (classId) REFERENCES classes(id)

            )`,

            `CREATE TABLE IF NOT EXISTS student_badges (

                id TEXT PRIMARY KEY,

                studentId TEXT NOT NULL,

                badgeId TEXT NOT NULL,

                badgeName TEXT NOT NULL,

                awardedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (studentId) REFERENCES students(id)

            )`,

            `CREATE TABLE IF NOT EXISTS zero_bypass_audits (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                userId TEXT NOT NULL,

                action TEXT NOT NULL,

                details TEXT,

                metadata TEXT,

                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

                previous_hash TEXT DEFAULT '0000000000000000000000000000000000000000000000000000000000000000',

                hash TEXT,

                legal_basis TEXT DEFAULT 'LGPD_ART_14',

                consent_verified INTEGER DEFAULT 0

            )`,

            `CREATE TABLE IF NOT EXISTS face_embeddings (

                face_id TEXT PRIMARY KEY,

                student_id TEXT NOT NULL,

                embedding TEXT NOT NULL,

                timestamp DATETIME NOT NULL,

                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (student_id) REFERENCES students(id)

            )`,

            `CREATE TABLE IF NOT EXISTS users (

                id TEXT PRIMARY KEY,

                username TEXT UNIQUE NOT NULL,

                name TEXT,

                email TEXT UNIQUE,

                password_hash TEXT NOT NULL,

                role TEXT DEFAULT 'staff',

                last_login DATETIME,

                last_app_interaction DATETIME,

                notification_pref TEXT DEFAULT 'APP',

                coordinationId TEXT,

                parentId TEXT,

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (parentId) REFERENCES users(id)

            )`,

            `CREATE TABLE IF NOT EXISTS events (

                id TEXT PRIMARY KEY,

                studentId TEXT NOT NULL,

                classId TEXT NOT NULL,

                roomId TEXT NOT NULL,

                eventType TEXT,

                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (studentId) REFERENCES students(id),

                FOREIGN KEY (classId) REFERENCES classes(id)

            )`,

            `CREATE TABLE IF NOT EXISTS attendance (

                id TEXT PRIMARY KEY,

                studentId TEXT NOT NULL,

                classId TEXT NOT NULL,

                scheduleId TEXT NOT NULL,

                date DATE NOT NULL,

                status TEXT,

                percentage REAL,

                timeInClass INTEGER,

                totalDuration INTEGER,

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (studentId) REFERENCES students(id),

                FOREIGN KEY (classId) REFERENCES classes(id)

            )`,

            `CREATE TABLE IF NOT EXISTS attendance_logs (

                id TEXT PRIMARY KEY,

                studentId TEXT NOT NULL,

                type TEXT,

                logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,

                deviceId TEXT,

                confidence REAL,

                FOREIGN KEY (studentId) REFERENCES students(id)

            )`,

            `CREATE TABLE IF NOT EXISTS notifications (

                id TEXT PRIMARY KEY,

                type TEXT NOT NULL,

                title TEXT NOT NULL,

                message TEXT NOT NULL,

                priority TEXT,

                studentId TEXT,

                targetUserId TEXT,

                read INTEGER DEFAULT 0,

                treatedAt DATETIME,

                treatedBy TEXT,

                treatmentNotes TEXT,

                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (studentId) REFERENCES students(id),

                FOREIGN KEY (targetUserId) REFERENCES users(id)

            )`,

            `CREATE TABLE IF NOT EXISTS seating_layouts (

                classId TEXT PRIMARY KEY,

                rows INTEGER DEFAULT 6,

                cols INTEGER DEFAULT 8,

                deskPos TEXT, -- JSON string {x, y}

                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP

            )`,

            `CREATE TABLE IF NOT EXISTS predictive_student_risk (

                id TEXT PRIMARY KEY,

                studentId TEXT NOT NULL,

                riskScore REAL NOT NULL,

                riskFactors TEXT NOT NULL,

                date DATE NOT NULL,

                status TEXT DEFAULT 'PENDING',

                actionProtocol TEXT,

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (studentId) REFERENCES students(id)

            )`,

            `CREATE TABLE IF NOT EXISTS settings (

                id TEXT PRIMARY KEY,

                value TEXT,

                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP

            )`,

            `CREATE TABLE IF NOT EXISTS colab_task_queue (

                id TEXT PRIMARY KEY,

                taskType TEXT NOT NULL,

                payload TEXT NOT NULL,

                status TEXT DEFAULT 'pending',

                attempts INTEGER DEFAULT 0,

                result TEXT,

                error TEXT,

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP

            )`,

            `CREATE TABLE IF NOT EXISTS student_face_embeddings_512 (

                id TEXT PRIMARY KEY,

                studentId TEXT NOT NULL,

                vector TEXT NOT NULL,

                model TEXT DEFAULT 'ArcFace-512',

                qualityScore REAL DEFAULT 1.0,

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE

            )`,

            `CREATE TABLE IF NOT EXISTS cameras (

                id TEXT PRIMARY KEY,

                name TEXT NOT NULL,

                rtspUrl TEXT NOT NULL,

                location TEXT,

                ip TEXT,

                username TEXT,

                password TEXT,

                status TEXT,

                type TEXT DEFAULT 'RTSP',

                enabled INTEGER DEFAULT 1,

                last_seen DATETIME,

                config TEXT DEFAULT '{}',

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP

            )`,

            `CREATE TABLE IF NOT EXISTS student_tasks (

                id TEXT PRIMARY KEY,

                studentId TEXT NOT NULL,

                title TEXT NOT NULL,

                description TEXT,

                dueDate DATETIME NOT NULL,

                status TEXT DEFAULT 'pending',

                priority TEXT DEFAULT 'normal',

                sourceMaterialId TEXT,

                youtubeLinks TEXT,

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (studentId) REFERENCES students(id)

            )`,

            `CREATE TABLE IF NOT EXISTS twin_entities (

                id TEXT PRIMARY KEY,

                type TEXT NOT NULL,

                x REAL,

                y REAL,

                z REAL,

                status TEXT,

                lastUpdate INTEGER

            )`,

            `CREATE TABLE IF NOT EXISTS density_alerts (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                zoneId TEXT NOT NULL,

                currentDensity INTEGER,

                predictedDensity INTEGER,

                severity TEXT,

                timestamp INTEGER

            )`,

            `CREATE TABLE IF NOT EXISTS behavioral_logs (

                id TEXT PRIMARY KEY,

                studentId TEXT NOT NULL,

                type TEXT,

                description TEXT,

                stress REAL DEFAULT 0,

                anxiety REAL DEFAULT 0,

                aggression REAL DEFAULT 0,

                fatigue REAL DEFAULT 0,

                engagement REAL DEFAULT 1,

                riskScore INTEGER DEFAULT 0,

                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (studentId) REFERENCES students(id)

            )`,

            `CREATE TABLE IF NOT EXISTS billing (

                id TEXT PRIMARY KEY,

                studentHash TEXT NOT NULL,

                amount REAL NOT NULL,

                dueDate DATE NOT NULL,

                status TEXT DEFAULT 'pending',

                pixCode TEXT,

                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP

            )`,

            `CREATE TABLE IF NOT EXISTS nexus_peers (

                id TEXT PRIMARY KEY,

                name TEXT,

                multiaddr TEXT NOT NULL,

                trustLevel INTEGER DEFAULT 1,

                lastHandshake INTEGER,

                status TEXT DEFAULT 'unknown',

                roomId TEXT,

                roomName TEXT,

                cpu TEXT,

                ram INTEGER,

                gpu TEXT,

                tops INTEGER,

                ssd INTEGER

            )`,

            `CREATE TABLE IF NOT EXISTS rooms (

                id TEXT PRIMARY KEY,

                schoolId TEXT NOT NULL,

                name TEXT NOT NULL,

                location TEXT,

                floor TEXT,

                capacity INTEGER DEFAULT 30,

                status TEXT DEFAULT 'active',

                FOREIGN KEY (schoolId) REFERENCES schools(id)

            )`,

            `CREATE TABLE IF NOT EXISTS staff (

                id TEXT PRIMARY KEY,

                name TEXT NOT NULL,

                role TEXT,

                email TEXT UNIQUE,

                status TEXT DEFAULT 'active',

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP

            )`,

            `CREATE TABLE IF NOT EXISTS staff_details (

                staffId TEXT PRIMARY KEY,

                baseSalary REAL,

                contractType TEXT,

                admissionDate DATE,

                performanceScore INTEGER,

                FOREIGN KEY (staffId) REFERENCES staff(id)

            )`,

            `CREATE TABLE IF NOT EXISTS schedules (

                id TEXT PRIMARY KEY,

                classId TEXT NOT NULL,

                roomId TEXT NOT NULL,

                teacherId TEXT NOT NULL,

                subject TEXT NOT NULL,

                teacher TEXT,

                dayOfWeek INTEGER,

                startTime TEXT,

                endTime TEXT,

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                parentPhone TEXT,

                parentUserId TEXT,

                enrollmentDate DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (classId) REFERENCES classes(id),

                FOREIGN KEY (roomId) REFERENCES rooms(id),

                FOREIGN KEY (parentUserId) REFERENCES users(id)

            )`,

            `CREATE TABLE IF NOT EXISTS student_economy (

                student_id TEXT PRIMARY KEY,

                balance INTEGER DEFAULT 0,

                level INTEGER DEFAULT 1,

                xp INTEGER DEFAULT 0,

                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (student_id) REFERENCES students(id)

            )`,

            `CREATE TABLE IF NOT EXISTS active_sessions (

                token TEXT PRIMARY KEY,

                userId TEXT NOT NULL,

                expiresAt INTEGER NOT NULL,

                data TEXT,

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (userId) REFERENCES users(id)

            )`,

            `CREATE TABLE IF NOT EXISTS coordinations (

                id TEXT PRIMARY KEY,

                name TEXT NOT NULL,

                schoolId TEXT NOT NULL,

                FOREIGN KEY (schoolId) REFERENCES schools(id)

            )`,

            `CREATE TABLE IF NOT EXISTS academic_periods (

                id TEXT PRIMARY KEY,

                name TEXT NOT NULL,

                startDate DATE,

                endDate DATE,

                schoolId TEXT NOT NULL,

                FOREIGN KEY (schoolId) REFERENCES schools(id)

            )`,

            `CREATE TABLE IF NOT EXISTS legal_vault (

                id TEXT PRIMARY KEY,

                source TEXT,

                article_number TEXT,

                title TEXT,

                content TEXT,

                tags TEXT,

                legal_level TEXT

            )`,

            `CREATE TABLE IF NOT EXISTS global_intelligence_ledger (

                id TEXT PRIMARY KEY,

                hubId TEXT,

                type TEXT NOT NULL,

                sourcePeerId TEXT,

                payload TEXT,

                appliedAt DATETIME DEFAULT CURRENT_TIMESTAMP

            )`,

            `CREATE TABLE IF NOT EXISTS assessments (

                id TEXT PRIMARY KEY,

                classId TEXT NOT NULL,

                title TEXT NOT NULL,

                date DATE,

                maxGrade REAL DEFAULT 10.0,

                FOREIGN KEY (classId) REFERENCES classes(id)

            )`,

            `CREATE TABLE IF NOT EXISTS security_events (

                id TEXT PRIMARY KEY,

                device_id TEXT,

                type TEXT,

                details TEXT,

                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP

            )`,

            `CREATE TABLE IF NOT EXISTS evasion_profiles (

                studentId TEXT PRIMARY KEY,

                riskProbability REAL DEFAULT 0,

                factors TEXT,

                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (studentId) REFERENCES students(id)

            )`,

            `CREATE TABLE IF NOT EXISTS lesson_reports (

                id TEXT PRIMARY KEY,

                scheduleId TEXT NOT NULL,

                date TEXT NOT NULL,

                teacherNotes TEXT,

                aiSummary TEXT,

                generatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (scheduleId) REFERENCES schedules(id)

            )`,

            `CREATE TABLE IF NOT EXISTS student_documents (

                id TEXT PRIMARY KEY,

                studentId TEXT NOT NULL,

                type TEXT NOT NULL,

                status TEXT DEFAULT 'PENDING',

                ocr_data TEXT,

                file_path TEXT,

                hash TEXT,

                validatedBy TEXT,

                validatedAt DATETIME,

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (studentId) REFERENCES students(id)

            )`,

            `CREATE TABLE IF NOT EXISTS enrollments (

                id TEXT PRIMARY KEY,

                studentId TEXT NOT NULL,

                classId TEXT NOT NULL,

                academicYear TEXT NOT NULL,

                status TEXT DEFAULT 'ACTIVE',

                enrollmentDate DATETIME DEFAULT CURRENT_TIMESTAMP,

                withdrawalDate DATETIME,

                metadata TEXT DEFAULT '{}',

                FOREIGN KEY (studentId) REFERENCES students(id),

                FOREIGN KEY (classId) REFERENCES classes(id)

            )`,

            `CREATE TABLE IF NOT EXISTS ai_insights_review (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                content TEXT,

                category TEXT,

                status TEXT DEFAULT 'PENDING',

                reviewed INTEGER DEFAULT 0,

                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP

            )`,

            `CREATE TABLE IF NOT EXISTS executive_telemetry (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                metric_type TEXT,

                value REAL,

                metadata TEXT,

                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP

            )`,

            `CREATE TABLE IF NOT EXISTS outcome_results (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                metric_name TEXT NOT NULL,

                value REAL NOT NULL,

                change_percentage REAL,

                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP

            )`,

            `CREATE TABLE IF NOT EXISTS predictive_success_goals (

                id TEXT PRIMARY KEY,

                category TEXT NOT NULL,

                target_value REAL NOT NULL,

                current_value REAL DEFAULT 0,

                deadline DATE,

                status TEXT DEFAULT 'ACTIVE',

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP

            )`,

            `CREATE TABLE IF NOT EXISTS student_grades (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                studentId TEXT NOT NULL,

                classId TEXT NOT NULL,

                type TEXT,

                value REAL,

                weight REAL DEFAULT 1.0,

                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (studentId) REFERENCES students(id),

                FOREIGN KEY (classId) REFERENCES classes(id)

            )`,

            `CREATE TABLE IF NOT EXISTS security_resilience_audit (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                event TEXT,

                severity TEXT,

                details TEXT,

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP

            )`,

            `CREATE TABLE IF NOT EXISTS pedagogical_resources (

                id TEXT PRIMARY KEY,

                classId TEXT,

                studentId TEXT,

                type TEXT,

                title TEXT,

                content TEXT,

                aiSummary TEXT,

                youtubeLinks TEXT,

                sourceFile TEXT,

                privacyTag TEXT DEFAULT 'LOCAL_ONLY',

                isFavorite INTEGER DEFAULT 0,

                collectionId TEXT,

                status TEXT DEFAULT 'PENDING',

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP

            )`,

            `CREATE TABLE IF NOT EXISTS pedagogical_collections (

                id TEXT PRIMARY KEY,

                name TEXT NOT NULL,

                description TEXT,

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP

            )`,

            `CREATE TABLE IF NOT EXISTS governance_impact_links (

                id TEXT PRIMARY KEY,

                proposal_id TEXT NOT NULL,

                final_impact_score REAL,

                processed_at DATETIME DEFAULT CURRENT_TIMESTAMP

            )`,

            `CREATE TABLE IF NOT EXISTS proposals_votecasting (

                id TEXT PRIMARY KEY,

                author_type TEXT,

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP

            )`,

            `CREATE TABLE IF NOT EXISTS sovereign_evolution_log (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                avg_impact REAL,

                confidence_multiplier REAL,

                data_samples INTEGER,

                optimized_at DATETIME DEFAULT CURRENT_TIMESTAMP

            )`,

            `CREATE TABLE IF NOT EXISTS swarm_resources_cache (

                id TEXT PRIMARY KEY,

                title TEXT,

                type TEXT,

                excerpt TEXT,

                nodeId TEXT,

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP

            )`,

            `CREATE TABLE IF NOT EXISTS nexus_knowledge_cache (

                id TEXT PRIMARY KEY,

                topic TEXT,

                content TEXT,

                tags TEXT,

                sourceNode TEXT,

                timestamp INTEGER

            )`,

            `CREATE TABLE IF NOT EXISTS swarm_reputation (

                resourceId TEXT,

                voterPeerId TEXT,

                signature TEXT,

                comment TEXT,

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                PRIMARY KEY (resourceId, voterPeerId)

            )`,

            `CREATE TABLE IF NOT EXISTS student_risk_history (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                student_id TEXT NOT NULL,

                risk_score REAL NOT NULL,

                factors TEXT,

                recommendation TEXT,

                analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP

            )`,

            `CREATE TABLE IF NOT EXISTS ai_metrics (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                service_type TEXT NOT NULL,

                tokens_input INTEGER DEFAULT 0,

                tokens_output INTEGER DEFAULT 0,

                compute_time_ms INTEGER DEFAULT 0,

                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP

            )`,

            `CREATE TABLE IF NOT EXISTS student_relationships (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                student_id TEXT NOT NULL,

                related_student_id TEXT NOT NULL,

                relationship_type TEXT NOT NULL DEFAULT 'PEER',

                strength REAL DEFAULT 1.0,

                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

                UNIQUE(student_id, related_student_id, relationship_type)

            )`,

            `CREATE TABLE IF NOT EXISTS coordination_insights (

                id TEXT PRIMARY KEY,

                type TEXT NOT NULL,

                target_id TEXT,

                title TEXT NOT NULL,

                content TEXT,

                priority TEXT DEFAULT 'MEDIUM',

                status TEXT DEFAULT 'PENDING',

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP

            )`,

            `CREATE TABLE IF NOT EXISTS presence_logs (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                studentId TEXT NOT NULL,

                locationId TEXT,

                entryTime DATETIME,

                exitTime DATETIME,

                status TEXT,

                duration INTEGER,

                FOREIGN KEY (studentId) REFERENCES students(id)

            )`,

            `CREATE TABLE IF NOT EXISTS augmentations (

                id TEXT PRIMARY KEY,

                studentId TEXT NOT NULL,

                imagePath TEXT,

                fullBodyImagePath TEXT,

                perspective TEXT,

                confidence REAL,

                height REAL,

                socialContext TEXT,

                displacementPattern TEXT,

                predictedNextCamera TEXT,

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (studentId) REFERENCES students(id)

            )`,

            `CREATE TABLE IF NOT EXISTS verification_queue (

                id TEXT PRIMARY KEY,

                studentId TEXT NOT NULL,

                cameraId TEXT,

                imagePath TEXT,

                status TEXT DEFAULT 'pending',

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (studentId) REFERENCES students(id)

            )`,

            `CREATE TABLE IF NOT EXISTS class_reports (

                id TEXT PRIMARY KEY,

                teacherId TEXT NOT NULL,

                classId TEXT NOT NULL,

                roomId TEXT,

                transcription TEXT,

                summary TEXT,

                insights TEXT,

                routingStatus TEXT DEFAULT 'PENDING',

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (teacherId) REFERENCES staff(id),

                FOREIGN KEY (classId) REFERENCES classes(id)

            )`,

            `CREATE TABLE IF NOT EXISTS esocial_events (

                id TEXT PRIMARY KEY,

                staffId TEXT NOT NULL,

                type TEXT NOT NULL,

                payload TEXT NOT NULL,

                status TEXT DEFAULT 'PENDING',

                receiptNumber TEXT,

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (staffId) REFERENCES staff(id)

            )`,

            `CREATE TABLE IF NOT EXISTS debt_negotiations (

                id TEXT PRIMARY KEY,

                studentId TEXT NOT NULL,

                billingIds TEXT NOT NULL,

                totalOriginal REAL NOT NULL,

                totalNegotiated REAL NOT NULL,

                installments INTEGER DEFAULT 1,

                status TEXT DEFAULT 'PROPOSED',

                proposedBy TEXT,

                acceptedAt DATETIME,

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (studentId) REFERENCES students(id)

            )`,

            `CREATE TABLE IF NOT EXISTS user_consent (

                userId TEXT PRIMARY KEY,

                consentedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                termVersion TEXT,

                clientIp TEXT

            )`,

            `CREATE TABLE IF NOT EXISTS data_retention_settings (

                id TEXT PRIMARY KEY,

                daysCount INTEGER NOT NULL,

                dataType TEXT NOT NULL UNIQUE,

                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP

            )`,

            `CREATE TABLE IF NOT EXISTS unified_calendar (

                id TEXT PRIMARY KEY,

                title TEXT NOT NULL,

                description TEXT,

                date TEXT NOT NULL,

                type TEXT NOT NULL,

                classId TEXT,

                subject TEXT,

                teacherId TEXT,

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (classId) REFERENCES classes(id)

            )`,

            `CREATE TABLE IF NOT EXISTS subjects (

                id TEXT PRIMARY KEY,

                name TEXT NOT NULL

            )`,

            `CREATE TABLE IF NOT EXISTS teacher_classes (

                id TEXT PRIMARY KEY,

                teacherId TEXT NOT NULL,

                classId TEXT NOT NULL,

                subjectId TEXT NOT NULL,

                FOREIGN KEY (teacherId) REFERENCES users(id),

                FOREIGN KEY (classId) REFERENCES classes(id)

            )`,

            `CREATE TABLE IF NOT EXISTS omr_exam_templates (

                id TEXT PRIMARY KEY,

                title TEXT NOT NULL,

                classId TEXT,

                totalQuestions INTEGER NOT NULL,

                optionsCount INTEGER DEFAULT 5,

                answerKey TEXT NOT NULL,

                weights TEXT,

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (classId) REFERENCES classes(id)

            )`,

            `CREATE TABLE IF NOT EXISTS omr_exam_corrections (

                id TEXT PRIMARY KEY,

                templateId TEXT NOT NULL,

                studentId TEXT,

                studentName TEXT,

                detectedAnswers TEXT NOT NULL,

                score REAL NOT NULL,

                totalPoints REAL NOT NULL,

                accuracyPct REAL NOT NULL,

                confidence REAL DEFAULT 1.0,

                scanImagePath TEXT,

                processedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (templateId) REFERENCES omr_exam_templates(id),

                FOREIGN KEY (studentId) REFERENCES students(id)

            )`,

            `CREATE TABLE IF NOT EXISTS pedagogical_playlists (

                id TEXT PRIMARY KEY,

                teacherId TEXT,

                classId TEXT NOT NULL,

                subject TEXT NOT NULL,

                title TEXT NOT NULL,

                description TEXT,

                bnccCodes TEXT DEFAULT '[]',

                stages TEXT NOT NULL,

                coinReward INTEGER DEFAULT 25,

                badgeId TEXT,

                badgeName TEXT,

                status TEXT DEFAULT 'active',

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (classId) REFERENCES classes(id)

            )`,

            `CREATE TABLE IF NOT EXISTS game_maker_templates (

                id TEXT PRIMARY KEY,

                teacherId TEXT,

                title TEXT NOT NULL,

                gameType TEXT NOT NULL,

                subject TEXT NOT NULL,

                bnccCodes TEXT DEFAULT '[]',

                config TEXT NOT NULL,

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP

            )`,

            `CREATE TABLE IF NOT EXISTS student_essays (

                id TEXT PRIMARY KEY,

                studentId TEXT NOT NULL,

                themeId TEXT NOT NULL,

                themeTitle TEXT NOT NULL,

                text TEXT NOT NULL,

                photoPath TEXT,

                submissionType TEXT DEFAULT 'typed',

                ocrConfidence REAL DEFAULT 1.0,

                c1Score INTEGER NOT NULL,

                c2Score INTEGER NOT NULL,

                c3Score INTEGER NOT NULL,

                c4Score INTEGER NOT NULL,

                c5Score INTEGER NOT NULL,

                totalScore INTEGER NOT NULL,

                feedbackText TEXT,

                c5ElementsJson TEXT DEFAULT '{}',

                repertoireHitsJson TEXT DEFAULT '[]',

                status TEXT DEFAULT 'audited',

                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                auditedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (studentId) REFERENCES students(id)

            )`,

            `CREATE TABLE IF NOT EXISTS student_applet_progress (

                id TEXT PRIMARY KEY,

                studentId TEXT NOT NULL,

                appletId TEXT NOT NULL,

                appletType TEXT NOT NULL,

                category TEXT DEFAULT 'STEM',

                score INTEGER NOT NULL,

                maxScore INTEGER NOT NULL,

                hintsUsed INTEGER DEFAULT 0,

                timeSpentSeconds INTEGER DEFAULT 0,

                coinsAwarded INTEGER DEFAULT 0,

                completedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

                metadata TEXT DEFAULT '{}',

                FOREIGN KEY (studentId) REFERENCES students(id)

            )`

        ];





        for (const sql of tables) {

            await this.run(sql);

        }

    }



    async createIndices() {

        const indices = [

            'CREATE INDEX IF NOT EXISTS idx_students_classId ON students(classId)',

            'CREATE INDEX IF NOT EXISTS idx_student_essays_studentId ON student_essays(studentId)',
            'CREATE INDEX IF NOT EXISTS idx_student_applet_progress_studentId ON student_applet_progress(studentId)',

            'CREATE INDEX IF NOT EXISTS idx_events_studentId ON events(studentId)',

            'CREATE INDEX IF NOT EXISTS idx_attendance_studentId ON attendance(studentId)',

            'CREATE INDEX IF NOT EXISTS idx_attendance_logs_studentId ON attendance_logs(studentId)',

            'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)',

            'CREATE INDEX IF NOT EXISTS idx_notifications_targetUser ON notifications(targetUserId)',

            'CREATE INDEX IF NOT EXISTS idx_users_interaction ON users(last_app_interaction)',

            'CREATE INDEX IF NOT EXISTS idx_student_positions ON students(classId, row, col)',

            'CREATE INDEX IF NOT EXISTS idx_student_grades_studentId ON student_grades(studentId)',

            'CREATE INDEX IF NOT EXISTS idx_outcome_results_metric ON outcome_results(metric_name)',

            'CREATE INDEX IF NOT EXISTS idx_schedules_teacher_room ON schedules(teacherId, roomId, dayOfWeek, startTime)',

            'CREATE INDEX IF NOT EXISTS idx_omr_corrections_templateId ON omr_exam_corrections(templateId)',

            'CREATE INDEX IF NOT EXISTS idx_omr_corrections_studentId ON omr_exam_corrections(studentId)',

            'CREATE INDEX IF NOT EXISTS idx_embeddings_512_studentId ON student_face_embeddings_512(studentId)'

        ];

        for (const sql of indices) {

            await this.run(sql);

        }

    }





    async performMigrations() {

        // Safe check for 'settings' table: if 'key' exists instead of 'id', rename it.

        try {

            const tableInfo = await this.all("PRAGMA table_info(settings)");

            const hasKey = tableInfo.some(col => col.name === 'key');

            const hasId = tableInfo.some(col => col.name === 'id');

            if (hasKey && !hasId) {

                console.log("[Migration] Renomeando coluna 'key' para 'id' em settings");

                await this.run("ALTER TABLE settings RENAME COLUMN 'key' TO 'id'");

            }

            

            // Migration for users interaction tracking

            const userCols = await this.all("PRAGMA table_info(users)");

            if (!userCols.some(c => c.name === 'last_app_interaction')) {

                console.log("[Migration] Adicionando last_app_interaction e notification_pref em users");

                await this.run("ALTER TABLE users ADD COLUMN last_app_interaction DATETIME");

                await this.run("ALTER TABLE users ADD COLUMN notification_pref TEXT DEFAULT 'APP'");

            }



            // Migration for targeted notifications

            const notifCols = await this.all("PRAGMA table_info(notifications)");

            if (!notifCols.some(c => c.name === 'targetUserId')) {

                console.log("[Migration] Adicionando targetUserId em notifications");

                await this.run("ALTER TABLE notifications ADD COLUMN targetUserId TEXT");

            }



            // Migration for student-parent link

            const studentCols = await this.all("PRAGMA table_info(students)");

            if (!studentCols.some(c => c.name === 'parentUserId')) {

                console.log("[Migration] Adicionando parentUserId em students");

                await this.run("ALTER TABLE students ADD COLUMN parentUserId TEXT");

            }

        } catch (e) {

            console.warn("[Migration] Erro ao verificar coluna id/key em settings:", e);

        }



        // Safe check for 'attendance_logs' table: ensure 'studentId' exists instead of 'student_id'

        try {

            const tableInfo = await this.all("PRAGMA table_info(attendance_logs)");

            const hasStudentId = tableInfo.some(col => col.name === 'studentId');

            const hasStudentIdUnderscore = tableInfo.some(col => col.name === 'student_id');

            

            if (hasStudentIdUnderscore && !hasStudentId) {

                console.log("[Migration] Renomeando 'student_id' para 'studentId' em attendance_logs");

                await this.run("ALTER TABLE attendance_logs RENAME COLUMN student_id TO studentId");

            }



            // Ensure deviceId and confidence exist

            const hasDeviceId = tableInfo.some(col => col.name === 'deviceId');

            if (!hasDeviceId && tableInfo.length > 0) {

                console.log("[Migration] Adicionando coluna 'deviceId' em attendance_logs");

                await this.run("ALTER TABLE attendance_logs ADD COLUMN deviceId TEXT");

            }



            const hasConfidence = tableInfo.some(col => col.name === 'confidence');

            if (!hasConfidence && tableInfo.length > 0) {

                console.log("[Migration] Adicionando coluna 'confidence' em attendance_logs");

                await this.run("ALTER TABLE attendance_logs ADD COLUMN confidence REAL");

            }

        } catch (e) {

            console.warn("[Migration] Erro ao migrar attendance_logs:", e);

        }



        // Migração para Schools & Institution Profile (Phase 401: Pricing Strategy)

        try {

            const schoolInfo = await this.all("PRAGMA table_info(schools)");

            const hasType = schoolInfo.some(col => col.name === 'type');

            if (!hasType && schoolInfo.length > 0) {

                console.log("[Migration] Adicionando 'type' em schools");

                await this.run("ALTER TABLE schools ADD COLUMN type TEXT DEFAULT 'private'");

            }



            const hasRegion = schoolInfo.some(col => col.name === 'region');

            if (!hasRegion && schoolInfo.length > 0) {

                console.log("[Migration] Adicionando 'region' em schools");

                await this.run("ALTER TABLE schools ADD COLUMN region TEXT DEFAULT 'capital'");

            }



            const hasPlan = schoolInfo.some(col => col.name === 'plan');

            if (!hasPlan && schoolInfo.length > 0) {

                console.log("[Migration] Adicionando 'plan' em schools");

                await this.run("ALTER TABLE schools ADD COLUMN plan TEXT DEFAULT 'starter'");

            }



            // Migração para institution_profile: garantir que 'region' exista

            const profileInfo = await this.all("PRAGMA table_info(institution_profile)");

            const hasProfileRegion = profileInfo.some(col => col.name === 'region');

            if (!hasProfileRegion && profileInfo.length > 0) {

                console.log("[Migration] Adicionando 'region' em institution_profile");

                await this.run("ALTER TABLE institution_profile ADD COLUMN region TEXT DEFAULT 'capital'");

            }

        } catch (e) {

            console.warn("[Migration] Erro ao migrar tabelas de precificação:", e);

        }



        // Migração para Pedagogical Resources (Phase 500+)

        try {

            const resourceInfo = await this.all("PRAGMA table_info(pedagogical_resources)");

            if (resourceInfo.length > 0) {

                const existingColumns = resourceInfo.map(col => col.name);

                const columnsToAdd = [

                    { name: 'classId', type: 'TEXT' },

                    { name: 'studentId', type: 'TEXT' },

                    { name: 'aiSummary', type: 'TEXT' },

                    { name: 'youtubeLinks', type: 'TEXT' },

                    { name: 'sourceFile', type: 'TEXT' },

                    { name: 'privacyTag', type: 'TEXT DEFAULT \'LOCAL_ONLY\'' },

                    { name: 'isFavorite', type: 'INTEGER DEFAULT 0' },

                    { name: 'collectionId', type: 'TEXT' },

                    { name: 'status', type: 'TEXT DEFAULT \'PENDING\'' },

                    { name: 'updatedAt', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }

                ];



                for (const col of columnsToAdd) {

                    if (!existingColumns.includes(col.name)) {

                        console.log(`[Migration] Adicionando '${col.name}' em pedagogical_resources`);

                        await this.run(`ALTER TABLE pedagogical_resources ADD COLUMN ${col.name} ${col.type}`);

                    }

                }

            }

        } catch (e) {

            console.warn("[Migration] Erro ao migrar pedagogical_resources:", e);

        }



        // Safe check for 'zero_bypass_audits' table: ensure 'userId', 'action', 'details', and 'metadata' exist

        try {

            const tableInfo = await this.all("PRAGMA table_info(zero_bypass_audits)");

            

            if (tableInfo.length > 0) {

                const existingColumns = tableInfo.map(col => col.name);

                

                if (!existingColumns.includes('userId')) {

                    console.log("[Migration] Adicionando coluna 'userId' em zero_bypass_audits");

                    await this.run("ALTER TABLE zero_bypass_audits ADD COLUMN userId TEXT DEFAULT 'SYSTEM'");

                }



                if (!existingColumns.includes('action')) {

                    console.log("[Migration] Adicionando coluna 'action' em zero_bypass_audits");

                    await this.run("ALTER TABLE zero_bypass_audits ADD COLUMN action TEXT DEFAULT 'UNKNOWN'");

                }



                if (!existingColumns.includes('details')) {

                    console.log("[Migration] Adicionando coluna 'details' em zero_bypass_audits");

                    await this.run("ALTER TABLE zero_bypass_audits ADD COLUMN details TEXT");

                }



                if (!existingColumns.includes('metadata')) {

                    console.log("[Migration] Adicionando coluna 'metadata' em zero_bypass_audits");

                    await this.run("ALTER TABLE zero_bypass_audits ADD COLUMN metadata TEXT");

                }



                if (!existingColumns.includes('previous_hash')) {

                    console.log("[Migration] Adicionando coluna 'previous_hash' em zero_bypass_audits");

                    await this.run("ALTER TABLE zero_bypass_audits ADD COLUMN previous_hash TEXT DEFAULT '0000000000000000000000000000000000000000000000000000000000000000'");

                }



                if (!existingColumns.includes('hash')) {

                    console.log("[Migration] Adicionando coluna 'hash' em zero_bypass_audits");

                    await this.run("ALTER TABLE zero_bypass_audits ADD COLUMN hash TEXT");

                }



                if (!existingColumns.includes('legal_basis')) {

                    console.log("[Migration] Adicionando coluna 'legal_basis' em zero_bypass_audits");

                    await this.run("ALTER TABLE zero_bypass_audits ADD COLUMN legal_basis TEXT DEFAULT 'LGPD_ART_14'");

                }



                if (!existingColumns.includes('consent_verified')) {

                    console.log("[Migration] Adicionando coluna 'consent_verified' em zero_bypass_audits");

                    await this.run("ALTER TABLE zero_bypass_audits ADD COLUMN consent_verified INTEGER DEFAULT 0");

                }

            }

        } catch (e) {

            console.warn("[Migration] Erro ao migrar zero_bypass_audits:", e);

        }



        // Migração para Seating Intelligence (Hardening)

        try {

            const studentInfo = await this.all("PRAGMA table_info(students)");

            if (studentInfo.length > 0) {

                const existingColumns = studentInfo.map(col => col.name);

                

                if (!existingColumns.includes('row')) {

                    console.log("[Migration] Adicionando 'row' em students");

                    await this.run("ALTER TABLE students ADD COLUMN row INTEGER");

                }

                if (!existingColumns.includes('col')) {

                    console.log("[Migration] Adicionando 'col' em students");

                    await this.run("ALTER TABLE students ADD COLUMN col INTEGER");

                }

                if (!existingColumns.includes('observationLevel')) {

                    console.log("[Migration] Adicionando 'observationLevel' em students");

                    await this.run("ALTER TABLE students ADD COLUMN observationLevel INTEGER DEFAULT 0");

                }

                if (!existingColumns.includes('frustrationScore')) {

                    console.log("[Migration] Adicionando 'frustrationScore' em students");

                    await this.run("ALTER TABLE students ADD COLUMN frustrationScore INTEGER DEFAULT 0");

                }

                if (!existingColumns.includes('metadata')) {

                    console.log("[Migration] Adicionando 'metadata' em students");

                    await this.run("ALTER TABLE students ADD COLUMN metadata TEXT DEFAULT '{}'");

                }

            }

        } catch (e) {

            console.warn("[Migration] Erro ao migrar students:", e);

        }



        // Migração para Rooms (Capacity & Status)

        try {

            const roomInfo = await this.all("PRAGMA table_info(rooms)");

            const hasCapacity = roomInfo.some(col => col.name === 'capacity');

            if (!hasCapacity && roomInfo.length > 0) {

                console.log("[Migration] Adicionando 'capacity' em rooms");

                await this.run("ALTER TABLE rooms ADD COLUMN capacity INTEGER DEFAULT 30");

            }

            const hasStatus = roomInfo.some(col => col.name === 'status');

            if (!hasStatus && roomInfo.length > 0) {

                console.log("[Migration] Adicionando 'status' em rooms");

                await this.run("ALTER TABLE rooms ADD COLUMN status TEXT DEFAULT 'active'");

            }

        } catch (e) {

            console.warn("[Migration] Erro ao migrar rooms:", e);

        }



        // Migração de Turmas (preservando turmas homologadas e reais)

        try {

            // Purga restrita apenas a turmas temporárias órfãs explícitas, sem tocar em turmas válidas

        } catch (e) {

            console.warn("[Migration] Erro ao verificar turmas:", e);

        }



        // Migração para Schedules (teacherId)

        try {

            const scheduleInfo = await this.all("PRAGMA table_info(schedules)");

            const hasTeacherId = scheduleInfo.some(col => col.name === 'teacherId');

            if (!hasTeacherId && scheduleInfo.length > 0) {

                console.log("[Migration] Adicionando 'teacherId' em schedules");

                await this.run("ALTER TABLE schedules ADD COLUMN teacherId TEXT");

            }

        } catch (e) {

            console.warn("[Migration] Erro ao migrar schedules:", e);

        }

        // Migração para Cameras (Phase 401: Hardware Integration)

        try {

            const cameraInfo = await this.all("PRAGMA table_info(cameras)");

            if (cameraInfo.length > 0) {

                const existingColumns = cameraInfo.map(col => col.name);

                const columnsToAdd = [

                    { name: 'ip', type: 'TEXT' },

                    { name: 'username', type: 'TEXT' },

                    { name: 'password', type: 'TEXT' },

                    { name: 'status', type: 'TEXT' },

                    { name: 'type', type: 'TEXT DEFAULT \'RTSP\'' },

                    { name: 'enabled', type: 'INTEGER DEFAULT 1' }

                ];



                for (const col of columnsToAdd) {

                    if (!existingColumns.includes(col.name)) {

                        console.log(`[Migration] Adicionando '${col.name}' em cameras`);

                        await this.run(`ALTER TABLE cameras ADD COLUMN ${col.name} ${col.type}`);

                    }

                }



                // Se is_active existir mas enabled não, podemos migrar dados (opcional)

                if (existingColumns.includes('is_active') && !existingColumns.includes('enabled')) {

                    // Já adicionamos 'enabled' acima se não existisse

                    await this.run("UPDATE cameras SET enabled = is_active");

                }

            }

        } catch (e) {

            console.warn("[Migration] Erro ao migrar tabela cameras:", e);

        }



        // Migração para Student Tasks (teacherId, subject)

        try {

            const taskInfo = await this.all("PRAGMA table_info(student_tasks)");

            if (taskInfo.length > 0) {

                const existingCols = taskInfo.map(col => col.name);

                if (!existingCols.includes('teacherId')) {

                    console.log("[Migration] Adicionando 'teacherId' em student_tasks");

                    await this.run("ALTER TABLE student_tasks ADD COLUMN teacherId TEXT");

                }

                if (!existingCols.includes('subject')) {

                    console.log("[Migration] Adicionando 'subject' em student_tasks");

                    await this.run("ALTER TABLE student_tasks ADD COLUMN subject TEXT");

                }

            }

        } catch (e) {

            console.warn("[Migration] Erro ao migrar student_tasks:", e);

        }



        // [Migration v1.1] Recriar seating_layouts sem FOREIGN KEY constraint

        try {

            const info = await this.all("PRAGMA table_info(seating_layouts)");

            if (info && info.length > 0) {

                // Verifica se a tabela foi criada com FK (detecta via sql na sqlite_master)

                const tblMeta = await this.get<any>(

                    "SELECT sql FROM sqlite_master WHERE type='table' AND name='seating_layouts'"

                );

                if (tblMeta?.sql && tblMeta.sql.includes('FOREIGN KEY')) {

                    console.log("[Migration] Removendo FK constraint de seating_layouts...");

                    await this.run("ALTER TABLE seating_layouts RENAME TO seating_layouts_old");

                    await this.run(`CREATE TABLE seating_layouts (

                        classId TEXT PRIMARY KEY,

                        rows INTEGER DEFAULT 6,

                        cols INTEGER DEFAULT 8,

                        deskPos TEXT,

                        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP

                    )`);

                    await this.run("INSERT OR IGNORE INTO seating_layouts SELECT * FROM seating_layouts_old");

                    await this.run("DROP TABLE seating_layouts_old");

                    console.log("[Migration] seating_layouts recriada sem FK constraint.");

                }

            }

        } catch (e) {

            console.warn("[Migration] Erro ao migrar seating_layouts:", e);

        }



        // Migração para nexus_peers (adicionar roomId, roomName, cpu, ram, gpu, tops, ssd para mapeamento de hardware)

        try {

            const peerInfo = await this.all("PRAGMA table_info(nexus_peers)");

            if (peerInfo.length > 0) {

                const existingColumns = peerInfo.map(col => col.name);

                const colsToAdd = [

                    { name: 'roomId', type: 'TEXT' },

                    { name: 'roomName', type: 'TEXT' },

                    { name: 'cpu', type: 'TEXT' },

                    { name: 'ram', type: 'INTEGER' },

                    { name: 'gpu', type: 'TEXT' },

                    { name: 'tops', type: 'INTEGER' },

                    { name: 'ssd', type: 'INTEGER' }

                ];

                for (const col of colsToAdd) {

                    if (!existingColumns.includes(col.name)) {

                        console.log(`[Migration] Adicionando '${col.name}' em nexus_peers`);

                        await this.run(`ALTER TABLE nexus_peers ADD COLUMN ${col.name} ${col.type}`);

                    }

                }

            }

        } catch (e) {

            console.warn("[Migration] Erro ao migrar nexus_peers:", e);

        }



        // Migração para behavioral_logs (adicionar type, description, createdAt)

        try {

            const blogInfo = await this.all("PRAGMA table_info(behavioral_logs)");

            if (blogInfo && blogInfo.length > 0) {

                const existingColumns = blogInfo.map(col => col.name);

                if (!existingColumns.includes('type')) {

                    console.log("[Migration] Adicionando 'type' em behavioral_logs");

                    await this.run("ALTER TABLE behavioral_logs ADD COLUMN type TEXT");

                }

                if (!existingColumns.includes('description')) {

                    console.log("[Migration] Adicionando 'description' em behavioral_logs");

                    await this.run("ALTER TABLE behavioral_logs ADD COLUMN description TEXT");

                }

                if (!existingColumns.includes('createdAt')) {

                    console.log("[Migration] Adicionando 'createdAt' em behavioral_logs");

                    await this.run("ALTER TABLE behavioral_logs ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP");

                }

            }

        } catch (e) {

            console.warn("[Migration] Erro ao migrar behavioral_logs:", e);

        }

    }





    async setupInfiniteRetention() {

        // Configurações de retenção conforme o binário

    }



    public queueWrite(sql: string, params: any[] = []): void {

        this.writeBehindQueue.push({ sql, params });

    }



    public async flushQueue(): Promise<void> {

        if (this.writeBehindQueue.length === 0) return;

        const batch = [...this.writeBehindQueue];

        this.writeBehindQueue = [];

        try {

            await this.transaction(async () => {

                for (const item of batch) {

                    if (this.db) {

                        this.db.prepare(item.sql).run(...item.params);

                    }

                }

            });

            console.log(`[Database] Batch flush de ${batch.length} operações efetuado com sucesso.`);

        } catch (err: any) {

            console.error(`[Database] Erro crítico ao processar batch write-behind: ${err.message}`, err);

        }

    }



    /**

     * Métodos Genéricos de Execução

     */

    async run(sql: string, params: any[] = []): Promise<any> {

        if (!this.db) throw new Error('[Database] DB não inicializado');

        const stmt = this.db.prepare(sql);

        const info = stmt.run(...params);

        return { changes: info.changes, lastID: info.lastInsertRowid };

    }



    async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {

        if (!this.db) throw new Error('[Database] DB não inicializado');

        return this.db.prepare(sql).get(...params) as T | undefined;

    }



    async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {

        if (!this.db) throw new Error('[Database] DB não inicializado');

        try {

            return this.db.prepare(sql).all(...params) as T[];

        } catch (err) {

            console.error(`[Database] Erro em all(${sql}):`, err);

            return [];

        }

    }



    /**

     * Executa operações em uma transação atômica (SQA-1102)

     * Refatorado para suportar callbacks async com controle manual de transação.

     */

    async transaction<T>(fn: () => Promise<T>): Promise<T> {

        if (!this.db) throw new Error('[Database] DB não inicializado');

        

        const hasActiveTransaction = this.db.inTransaction;

        const savepointName = `sp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;



        if (hasActiveTransaction) {

            this.db.prepare(`SAVEPOINT ${savepointName}`).run();

        } else {

            this.db.prepare('BEGIN').run();

        }



        try {

            const result = await fn();

            

            if (hasActiveTransaction) {

                this.db.prepare(`RELEASE SAVEPOINT ${savepointName}`).run();

            } else {

                this.db.prepare('COMMIT').run();

            }

            

            return result;

        } catch (err) {

            if (hasActiveTransaction) {

                this.db.prepare(`ROLLBACK TO SAVEPOINT ${savepointName}`).run();

            } else {

                this.db.prepare('ROLLBACK').run();

            }

            throw err;

        }

    }



    async query(sql: string, params: any[] = []): Promise<any[]> {

        return this.all(sql, params);

    }



    // Alerta e Notificações (v1608)

    async updateAlert(id: string, updates: any) {

        const keys = Object.keys(updates);

        const values = Object.values(updates);

        const setClause = keys.map(k => `${k} = ?`).join(', ');

        return await this.run(`UPDATE notifications SET ${setClause} WHERE id = ?`, [...values, id]);

    }



    async deleteAlert(id: string) {

        return await this.run('DELETE FROM notifications WHERE id = ?', [id]);

    }



    // ===== MÉTODOS DE NEGÓCIO RESTAURADOS =====

    

    async getStudents(classId?: string) {

        try {

            const sql = classId ? 'SELECT * FROM students WHERE classId = ?' : 'SELECT * FROM students';

            const rows = await this.all(sql, classId ? [classId] : []);

            if (!Array.isArray(rows)) return [];

            return rows.map(s => {

                let decryptedName = s.name || '';

                try {

                    if (s.name && s.name.includes(':') && securityService) {

                        decryptedName = securityService.decrypt(s.name) || s.name;

                    }

                } catch (e) {

                    decryptedName = s.name || '';

                }



                let parsedMeta = {};

                try {

                    if (s.metadata && typeof s.metadata === 'string') {

                        parsedMeta = JSON.parse(s.metadata);

                    } else if (typeof s.metadata === 'object') {

                        parsedMeta = s.metadata || {};

                    }

                } catch (e) {

                    parsedMeta = {};

                }



                return {

                    ...s,

                    studentId: s.id,

                    name: decryptedName,

                    metadata: parsedMeta

                };

            });

        } catch (err) {

            console.error('[Database] getStudents error:', err);

            return [];

        }

    }



    /**

     * Semeia metas iniciais de sucesso preditivo se o banco estiver vazio.

     * [Level 9] Success Maturity

     */

    async seedInitialSuccessGoals() {

        try {

            const count = await this.get<{ total: number }>('SELECT COUNT(*) as total FROM predictive_success_goals');

            if (count && count.total === 0) {

                console.log('[Database] Semeando metas iniciais de sucesso preditivo...');

                const goals = [

                    { id: 'goal_1', category: 'Frequência Média', target: 95, current: 88, deadline: '2026-12-31' },

                    { id: 'goal_2', category: 'Engajamento AI', target: 90, current: 72, deadline: '2026-12-31' },

                    { id: 'goal_3', category: 'Redução de Evasão', target: 15, current: 5, deadline: '2026-12-31' }

                ];

                for (const g of goals) {

                    await this.run(

                        'INSERT INTO predictive_success_goals (id, category, target_value, current_value, deadline) VALUES (?, ?, ?, ?, ?)',

                        [g.id, g.category, g.target, g.current, g.deadline]

                    );

                }



                // Semente de Resultados de Yield (Aureus Convergence)

                await this.run(

                    'INSERT INTO outcome_results (metric_name, value, change_percentage) VALUES (?, ?, ?)',

                    ['ACADEMIC_PERFORMANCE', 8.5, 4.2]

                );

            }

        } catch (err: any) {

            console.error(`[Database] Erro ao semear metas: ${err.message}`);

        }

    }



    /**

     * Obtém todos os embeddings do banco (Sovereign Biometric Mesh)

     */

    async getFaceEmbeddings(): Promise<any[]> {

        const query = `

          SELECT face_id, student_id, embedding, timestamp

          FROM face_embeddings

          ORDER BY timestamp DESC

        `;



        try {

            const rows = await this.all(query, []);

            return rows.map((row: any) => {

                let embedding = [];

                try {

                    // Tenta decifrar se for um buffer/hex, senão faz parse JSON

                    if (row.embedding.startsWith('[') || row.embedding.includes(',')) {

                        embedding = JSON.parse(row.embedding);

                    } else {

                        const decrypted = securityService.decryptBuffer(Buffer.from(row.embedding, 'hex'));

                        embedding = JSON.parse(decrypted.toString());

                    }

                } catch (e) {

                    // Fallback para JSON direto se falhar decifração

                    try { embedding = JSON.parse(row.embedding); } catch(e2) {

                        console.error('[Database] Falha crítica ao processar embedding:', row.face_id);

                    }

                }

                return {

                    faceId: row.face_id,

                    studentId: row.student_id,

                    embedding: embedding,

                    timestamp: new Date(row.timestamp),

                };

            });

        } catch (error) {

            console.error('[Database] Erro ao obter embeddings:', error);

            return [];

        }

    }



    async saveFaceEmbedding(studentId: string, embedding: number[], customFaceId?: string): Promise<void> {

        const faceId = customFaceId || `face-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        const query = `

          INSERT OR REPLACE INTO face_embeddings (face_id, student_id, embedding, timestamp)

          VALUES (?, ?, ?, ?)

        `;



        const embeddingJson = JSON.stringify(embedding);

        const encrypted = securityService.encryptBuffer(Buffer.from(embeddingJson));



        await this.run(query, [

            faceId,

            studentId,

            encrypted.toString('hex'),

            new Date().toISOString(),

        ]);

    }



    async deleteFaceEmbedding(faceId: string): Promise<void> {

        await this.run('DELETE FROM face_embeddings WHERE face_id = ?', [faceId]);

    }



    async getStudentCount(): Promise<number> {

        const res = await this.get('SELECT COUNT(*) as count FROM students');

        return res ? res.count : 0;

    }





    async getTeachers() {

        return this.all('SELECT u.id, u.username, u.name, u.email, u.role, s.status FROM users u LEFT JOIN staff s ON u.id = s.id WHERE u.role IN (?, ?)', ['teacher', 'docente']);

    }



    async createTeacher(teacher: any) {

        return await this.transaction(async () => {

            const id = teacher.id || `teacher-${Date.now()}`;

            const username = teacher.username;

            const name = teacher.name;

            const email = teacher.email || null;

            const password_hash = teacher.password_hash;

            const role = teacher.role || 'docente';

            const status = teacher.status || 'active';



            await this.run(

                'INSERT INTO users (id, username, password_hash, name, email, role) VALUES (?, ?, ?, ?, ?, ?)',

                [id, username, password_hash, name, email, role]

            );



            await this.run(

                'INSERT OR IGNORE INTO staff (id, name, role, email, status) VALUES (?, ?, ?, ?, ?)',

                [id, name, role, email, status]

            );



            return { success: true, id };

        });

    }



    async updateTeacher(id: string, updates: any) {

        return await this.transaction(async () => {

            const userKeys: string[] = [];

            const userValues: any[] = [];

            const staffKeys: string[] = [];

            const staffValues: any[] = [];



            if (updates.name !== undefined) {

                userKeys.push('name = ?'); userValues.push(updates.name);

                staffKeys.push('name = ?'); staffValues.push(updates.name);

            }

            if (updates.email !== undefined) {

                userKeys.push('email = ?'); userValues.push(updates.email);

                staffKeys.push('email = ?'); staffValues.push(updates.email);

            }

            if (updates.role !== undefined) {

                userKeys.push('role = ?'); userValues.push(updates.role);

                staffKeys.push('role = ?'); staffValues.push(updates.role);

            }

            if (updates.status !== undefined) {

                staffKeys.push('status = ?'); staffValues.push(updates.status);

            }

            if (updates.password_hash !== undefined) {

                userKeys.push('password_hash = ?'); userValues.push(updates.password_hash);

            }



            if (userKeys.length > 0) {

                await this.run(`UPDATE users SET ${userKeys.join(', ')} WHERE id = ?`, [...userValues, id]);

            }

            if (staffKeys.length > 0) {

                await this.run(`UPDATE staff SET ${staffKeys.join(', ')} WHERE id = ?`, [...staffValues, id]);

            }



            return { success: true };

        });

    }



    async deleteTeacher(id: string) {

        return await this.transaction(async () => {

            await this.run('DELETE FROM users WHERE id = ?', [id]);

            await this.run('DELETE FROM staff WHERE id = ?', [id]);

            return { success: true };

        });

    }



    public async getResilienceStats() {

        const lastAudit = await this.get(`SELECT * FROM security_resilience_audit ORDER BY createdAt DESC LIMIT 1`);

        return lastAudit;

    }



    async getStudent(id: string) {

        const s = await this.get('SELECT * FROM students WHERE id = ?', [id]);

        if (s) {

            s.name = s.name && s.name.includes(':') ? securityService.decrypt(s.name) : s.name;

            s.metadata = s.metadata ? JSON.parse(s.metadata) : {};

        }

        return s;

    }



    async getStudentByUsername(username: string) {

        const u = await this.get('SELECT * FROM users WHERE username = ?', [username]);

        if (u && u.role === 'student') {

            return await this.getStudent(u.id);

        }

        return null;

    }







    async saveAlert(alert: any) {

        await this.run(

            'INSERT INTO notifications (id, type, title, message, priority, studentId, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',

            [alert.id, alert.type, alert.title, alert.message, alert.priority, alert.studentId, alert.timestamp || new Date().toISOString()]

        );

    }



    async getSettings() {

        const rows = await this.all('SELECT * FROM settings');

        const settings: Record<string, any> = {};

        rows.forEach(r => {

            try {

                settings[r.id] = JSON.parse(r.value);

            } catch {

                settings[r.id] = r.value;

            }

        });

        

        // [SOVEREIGN FALLBACK] Read from environment or leave empty for user configuration

        if (!settings.google_api_key) {

            settings.google_api_key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '';

        }

        if (!settings.openai_api_key) {

            settings.openai_api_key = process.env.OPENAI_API_KEY || '';

        }

        if (!settings.ai_provider) {

            settings.ai_provider = 'google';

        }

        if (!settings.ai_model_id) {

            settings.ai_model_id = 'gemini-1.5-flash';

        }



        return settings;

    }



    // Presença

    async recordPresenceEntry(data: { studentId: string, classId: string, entryTime: Date, cameraId: string }) {

        await this.run(

            'INSERT INTO presence_logs (studentId, locationId, entryTime, status) VALUES (?, ?, ?, ?)',

            [data.studentId, data.classId, data.entryTime.toISOString(), 'PRESENT']

        );

    }



    async recordPresenceExit(data: { studentId: string, classId: string, exitTime: Date, duration: number }) {

        await this.run(

            'UPDATE presence_logs SET exitTime = ?, status = ?, duration = ? WHERE studentId = ? AND exitTime IS NULL',

            [data.exitTime.toISOString(), 'COMPLETED', data.duration, data.studentId]

        );

    }



    async getPresenceRecord(studentId: string, classId: string, date: Date) {

        const dateStr = date.toISOString().split('T')[0];

        return this.get(

            'SELECT * FROM presence_logs WHERE studentId = ? AND locationId = ? AND entryTime LIKE ?',

            [studentId, classId, `${dateStr}%`]

        );

    }



    async saveSettings(settings: any) {

        for (const [k, v] of Object.entries(settings)) {

            await this.run('INSERT OR REPLACE INTO settings (id, value) VALUES (?, ?)', [k, typeof v === 'string' ? v : JSON.stringify(v)]);

        }

    }



    // Presence & Schedule (v1609)

    async recordAttendance(data: any) {

        await this.run(

            'INSERT OR REPLACE INTO attendance (id, studentId, classId, scheduleId, date, status, percentage, timeInClass, totalDuration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',

            [data.id, data.studentId, data.classId, data.scheduleId, data.date, data.status, data.percentage, data.timeInClass, data.totalDuration]

        );

    }



    async getRoomByCameraId(cameraId: string) {

        const camera = await this.get('SELECT location FROM cameras WHERE id = ?', [cameraId]);

        if (!camera || !camera.location) return null;

        return await this.get('SELECT * FROM rooms WHERE name = ?', [camera.location]);

    }



    async getCurrentScheduleForRoom(roomId: string, dayOfWeek: number, time: string) {

        return await this.get(

            'SELECT * FROM schedules WHERE roomId = ? AND dayOfWeek = ? AND ? BETWEEN startTime AND endTime',

            [roomId, dayOfWeek, time]

        );

    }



    async calculateAttendanceAnomalies(studentId: string) {

        const logs = await this.all('SELECT status FROM attendance WHERE studentId = ? ORDER BY date DESC LIMIT 10', [studentId]);

        const total = logs.length || 1;

        const absences = logs.filter(l => l.status === 'absent').length;

        const percAbsence = (absences / total) * 100;

        

        return {

            percAbsence,

            isAtRisk: percAbsence >= 20,

            recurringPattern: absences > 3 ? 'Ausências recorrentes detectadas' : null

        };

    }



    async getScheduleForClass(classId: string, date: Date) {

        const dayOfWeek = date.getDay();

        return await this.get('SELECT * FROM schedules WHERE classId = ? AND dayOfWeek = ?', [classId, dayOfWeek]);

    }



    async getStudentEvents(studentId: string, classId: string, date: Date) {

        const dateStr = date.toISOString().split('T')[0];

        return await this.all('SELECT * FROM events WHERE studentId = ? AND classId = ? AND date(timestamp) = ?', [studentId, classId, dateStr]);

    }



    async getDashboardStats() {

        const students = await this.get('SELECT COUNT(*) as total FROM students');

        const present = await this.get('SELECT COUNT(DISTINCT studentId) as total FROM events WHERE date(timestamp) = date(\'now\')');

        const cameras = await this.get('SELECT COUNT(*) as total FROM cameras WHERE enabled = 1');

        const alerts = await this.get('SELECT COUNT(*) as total FROM notifications WHERE read = 0 AND priority = \'high\'');

        

        // RH Performance (Average)

        const staffPerf = await this.get('SELECT AVG(performanceScore) as avgPerf FROM staff_details');

        

        // LGPD Status (Percentage of students with consent)

        const totalUsers = students?.total || 1;

        const consented = await this.get('SELECT COUNT(DISTINCT userId) as total FROM user_consent');

        const lgpdPerc = Math.min(Math.round((consented?.total / totalUsers) * 100), 100);



        // Frustration

        const frustration = await this.get('SELECT AVG(frustrationScore) as avgFrust FROM students');



        // Confidence (Average of last 100 recognitions)

        const confidence = await this.get('SELECT AVG(confidence) as avgConf FROM (SELECT confidence FROM attendance_logs WHERE confidence > 0 ORDER BY logged_at DESC LIMIT 100)');



        return {

            totalStudents: students?.total || 0,

            presentToday: present?.total || 0,

            camerasOnline: cameras?.total || 0,

            activeAlerts: alerts?.total || 0,

            rhPerformance: Math.round(staffPerf?.avgPerf || 95),

            lgpdStatus: lgpdPerc,

            avgFrustration: frustration?.avgFrust || 0,

            avgConfidence: confidence?.avgConf || 0.98

        };

    }









    async getCameraCount() {

        const res = await this.get('SELECT COUNT(*) as count FROM cameras');

        return res?.count || 0;

    }



    async getDailyAttendanceSummary(date: string) {

        const total = await this.get('SELECT COUNT(*) as total FROM students');

        const present = await this.get('SELECT COUNT(DISTINCT studentId) as total FROM events WHERE date(timestamp) = ?', [date]);

        return { total: total?.total || 0, present: present?.total || 0 };

    }



    async getWeeklyAttendanceSummary(dates: string[]) {

        const promises = dates.map(date => this.getDailyAttendanceSummary(date));

        const results = await Promise.all(promises);

        return results.map((summary, i) => ({

            date: dates[i],

            summary

        }));

    }



    async getUsers() {

        return await this.all('SELECT id, username, role, name FROM users');

    }



    async addStudent(student: any) {

        return await this.run(

            `INSERT INTO students (id, name, classId, status, metadata) VALUES (?, ?, ?, ?, ?)`,

            [student.id, student.name, student.classId, student.status || 'active', student.metadata || '{}']

        );

    }



    async addTeacher(teacher: any) {

        return await this.run(

            `INSERT OR IGNORE INTO staff (id, name, role, email, status) VALUES (?, ?, ?, ?, ?)`,

            [teacher.id, teacher.name, teacher.role || 'docente', teacher.email || null, teacher.status || 'active']

        );

    }



    async addClass(classObj: any) {

        return await this.run(

            `INSERT INTO classes (id, name, grade, period) VALUES (?, ?, ?, ?)`,

            [classObj.id, classObj.name, classObj.grade, classObj.period]

        );

    }



    async getAssessments(classId?: string) {

        if (classId) {

            return await this.all('SELECT * FROM assessments WHERE classId = ?', [classId]);

        }

        return await this.all('SELECT * FROM assessments');

    }



    async getClasses() {

        return await this.all('SELECT * FROM classes');

    }



    async upsertClass(data: any) {

        return await this.run('INSERT OR REPLACE INTO classes (id, schoolId, name, grade) VALUES (?, ?, ?, ?)', 

            [data.id, data.schoolId, data.name, data.grade]);

    }



    async deleteClass(id: string) {

        return await this.run('DELETE FROM classes WHERE id = ?', [id]);

    }



    async getClassTarget(classId: string) {

        return await this.get('SELECT * FROM classes WHERE id = ?', [classId]);

    }



    async getRooms() {

        return await this.all('SELECT * FROM rooms');

    }



    async getCoordinations() {

        return await this.all('SELECT * FROM coordinations');

    }



    async getCameras() {

        return await this.all('SELECT * FROM cameras');

    }



    async getAlerts(filter?: any) {

        let sql = 'SELECT * FROM notifications';

        const params: any[] = [];

        if (filter?.priority) {

            sql += ' WHERE priority = ?';

            params.push(filter.priority);

        }

        sql += ' ORDER BY timestamp DESC LIMIT 50';

        return await this.all(sql, params);

    }



    async getUnreadAlerts() {

        return await this.all('SELECT * FROM notifications WHERE read = 0 ORDER BY timestamp DESC');

    }



    async getUnreadNotifications() {

        return this.getUnreadAlerts();

    }



    async getActiveCameraIds(): Promise<string[]> {

        const rows = await this.all('SELECT id FROM cameras WHERE enabled = 1');

        return rows.map((r: any) => r.id);

    }



    async getAttendanceReport(classId: string, startDate: string, endDate: string) {

        return await this.all(`

            SELECT a.*, s.name as studentName 

            FROM attendance a 

            JOIN students s ON a.studentId = s.id 

            WHERE a.classId = ? AND a.date BETWEEN ? AND ?

        `, [classId, startDate, endDate]);

    }



    // Notificações

    async createNotification(notification: any) {

        const timestamp = notification.timestamp instanceof Date ? notification.timestamp.toISOString() : (notification.timestamp || new Date().toISOString());

        await this.run(

            'INSERT INTO notifications (id, type, title, message, priority, studentId, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',

            [notification.id || `not_${Date.now()}`, notification.type, notification.title, notification.message, notification.priority, notification.studentId, timestamp]

        );

    }



    async markNotificationRead(id: string) {

        return await this.markAlertRead(id);

    }



    async getNotificationsSince(timestamp: string | Date) {

        const ts = timestamp instanceof Date ? timestamp.toISOString() : timestamp;

        return await this.all('SELECT * FROM notifications WHERE timestamp > ?', [ts]);

    }



    async deleteNotificationsBefore(timestamp: string | Date) {

        const ts = timestamp instanceof Date ? timestamp.toISOString() : timestamp;

        return await this.run('DELETE FROM notifications WHERE timestamp < ?', [ts]);

    }



    async getCrowdingAlerts(date?: Date) {

        return await this.all('SELECT * FROM notifications WHERE type = "CROWDING" AND read = 0');

    }



    // Segurança e Presença Adicional

    async getLateStudents(date: Date) {

        const dateStr = date.toISOString().split('T')[0];

        // Simulação: Alunos que chegaram após as 08:00 (ajustar conforme necessidade)

        return await this.all(`

            SELECT s.*, a.entryTime as arrivalTime 

            FROM students s 

            JOIN presence_logs a ON s.id = a.studentId 

            WHERE a.entryTime LIKE ? AND time(a.entryTime) > '08:15:00'

        `, [`${dateStr}%`]);

    }



    async getUnauthorizedExits(date: Date) {

        const dateStr = date.toISOString().split('T')[0];

        return await this.all(`

            SELECT a.*, s.name as studentName 

            FROM presence_logs a 

            JOIN students s ON a.studentId = s.id 

            WHERE a.entryTime LIKE ? AND a.status = 'UNAUTHORIZED_EXIT'

        `, [`${dateStr}%`]);

    }



    async getSchoolExits(date: Date) {

        const dateStr = date.toISOString().split('T')[0];

        return await this.all(`

            SELECT a.*, s.name as studentName 

            FROM presence_logs a 

            JOIN students s ON a.studentId = s.id 

            WHERE a.exitTime LIKE ? AND a.locationId = 'MAIN_GATE'

        `, [`${dateStr}%`]);

    }



    async getViolenceDetections(date: Date) {

        const dateStr = date.toISOString().split('T')[0];

        return await this.all('SELECT * FROM notifications WHERE type = "VIOLENCE" AND timestamp LIKE ?', [`${dateStr}%`]);

    }



    async getUnknownPersons(date: Date) {

        const dateStr = date.toISOString().split('T')[0];

        return await this.all('SELECT * FROM notifications WHERE type = ? AND timestamp LIKE ?', ['UNKNOWN_PERSON', `${dateStr}%`]);

    }



    async getRecentSecurityAlerts(limit: number = 10) {

        return await this.all('SELECT * FROM notifications WHERE type = ? ORDER BY timestamp DESC LIMIT ?', ['SECURITY', limit]);

    }





    async markAlertRead(id: string) {

        return await this.run('UPDATE notifications SET read = 1 WHERE id = ?', [id]);

    }



    async getStudentReport(studentId: string, periodId: string) {

        return await this.get('SELECT * FROM behavioral_logs WHERE studentId = ? AND timestamp LIKE ? LIMIT 1', [studentId, `%${periodId}%`]);

    }



    async upsertStudentReport(report: any) {

        return await this.run('INSERT OR REPLACE INTO behavioral_logs (id, studentId, riskScore, timestamp) VALUES (?, ?, ?, ?)',

            [report.id || `rep_${Date.now()}`, report.studentId, report.score || 0, report.timestamp || new Date().toISOString()]);

    }



    async getStudentPedagogicalSummary(studentId: string) {

        const student = await this.getStudent(studentId);

        

        // 1. Risco de Reprovação

        const reprobationRisk = await this.calculateReprobationRisk(studentId);

        

        // 2. Comportamento

        const behaviors = await this.all(

            'SELECT * FROM behavioral_logs WHERE studentId = ? ORDER BY timestamp DESC LIMIT 5',

            [studentId]

        );

        const totalRisk = behaviors.reduce((acc: number, b: any) => acc + (b.riskScore || 0), 0);

        const behavioral = {

            avgRisk: behaviors.length > 0 ? totalRisk / behaviors.length : 0,

            logCount: behaviors.length

        };



        // 3. Tarefas

        const tasksPending = await this.all(

            "SELECT COUNT(*) as count FROM student_tasks WHERE studentId = ? AND status = 'pending'",

            [studentId]

        );

        const tasks = {

            pendingCount: tasksPending[0]?.count || 0

        };



        // 4. Evasão

        const evasionProfile = await this.get(

            'SELECT * FROM evasion_profiles WHERE studentId = ?',

            [studentId]

        );

        const evasion = evasionProfile ? { probability: evasionProfile.riskProbability } : null;



        // 5. Relatos de professores (lesson_reports)

        let recentTeacherNotes: string[] = [];

        try {

            const reports = await this.all(`

                SELECT r.teacherNotes 

                FROM lesson_reports r

                JOIN schedules s ON r.scheduleId = s.id

                WHERE s.classId = ? AND r.teacherNotes IS NOT NULL AND r.teacherNotes != ''

                ORDER BY r.date DESC LIMIT 3

            `, [student?.classId]);

            recentTeacherNotes = reports.map((r: any) => r.teacherNotes);

        } catch (e) {

            recentTeacherNotes = [];

        }



        return {

            student,

            reprobationRisk,

            behavioral,

            tasks,

            evasion,

            recentTeacherNotes

        };

    }





    async validatePresence(studentId: string, classId: string, seatId: string) {

        // 1. Log to attendance_logs

        await this.run('INSERT INTO attendance_logs (id, studentId, type, logged_at) VALUES (?, ?, ?, ?)',

            [`pres_${Date.now()}`, studentId, 'BIO_VALIDATED', new Date().toISOString()]);

        

        // 2. Grant XP (Merit Badge)

        await this.updateStudentXP(studentId, 25);

        

        return { success: true };

    }



    async updateStudentXP(studentId: string, amount: number) {

        await this.run(`

            INSERT INTO student_economy (student_id, xp, updatedAt) 

            VALUES (?, ?, CURRENT_TIMESTAMP)

            ON CONFLICT(student_id) DO UPDATE SET xp = xp + ?, updatedAt = CURRENT_TIMESTAMP

        `, [studentId, amount, amount]);

    }




    async addStudentCoins(studentId: string, amount: number) {
        await this.run(`
            UPDATE students SET sovereignCoins = COALESCE(sovereignCoins, 0) + ? WHERE id = ?
        `, [amount, studentId]);
        await this.run(`
            INSERT INTO student_economy (student_id, balance, updatedAt)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(student_id) DO UPDATE SET balance = balance + ?, updatedAt = CURRENT_TIMESTAMP
        `, [studentId, amount, amount]);
    }

    async awardStudentBadge(studentId: string, badgeId: string, badgeName: string) {
        const id = `badge-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        await this.run(`
            INSERT OR IGNORE INTO student_badges (id, studentId, badgeId, badgeName, awardedAt)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [id, studentId, badgeId, badgeName]);
        return { success: true, id };
    }

    // --- MÉTODOS DE NOTIFICAÇÕES E AUDITORIA ---

    async getAuditLogs(limit: number = 100) {

        return await this.all('SELECT * FROM notifications WHERE type = "AUDIT" ORDER BY timestamp DESC LIMIT ?', [limit]);

    }



    async getRecentUsage(limit: number = 100) {

        return this.getAuditLogs(limit);

    }





    async getStudentAuditLogs(studentId: string, limit: number = 100) {

        return await this.all('SELECT * FROM notifications WHERE type = "AUDIT" AND studentId = ? ORDER BY timestamp DESC LIMIT ?', [studentId, limit]);

    }



    // --- MÉTODOS DE RISCO E EVASÃO ---

    async calculateReprobationRisk(studentId: string) {

        const absences = await this.all("SELECT COUNT(*) as count FROM attendance WHERE studentId = ? AND status = 'absent'", [studentId]);

        const totalAbsences = absences[0]?.count || 0;

        const riskLevel = Math.min((totalAbsences / 50) * 100, 100);

        return { riskLevel, absences: totalAbsences };

    }



    async getStudentOverdueCount(studentId: string) {

        const result = await this.all("SELECT COUNT(*) as count FROM billing WHERE studentHash = ? AND status = 'pending' AND dueDate < CURRENT_DATE", [studentId]);

        return result[0]?.count || 0;

    }



    async updateEvasionProfile(data: any) {

        const { studentId, riskProbability, factors, trend } = data;

        return await this.run(

            'INSERT OR REPLACE INTO evasion_profiles (studentId, riskProbability, factors, trend, updatedAt) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',

            [studentId, riskProbability, JSON.stringify(factors), trend]

        );

    }



    // --- MÉTODOS DE FACE RECOGNITION ---



    async updateStudent(id: string, updates: any) {

        const keys = Object.keys(updates);

        const values = Object.values(updates);

        const setClause = keys.map(k => `${k} = ?`).join(', ');

        return await this.run(`UPDATE students SET ${setClause} WHERE id = ?`, [...values, id]);

    }



    // --- MÉTODOS DE RH E STAFF ---

    async getStaff() {

        return await this.all('SELECT * FROM staff');

    }



    async upsertStaff(staff: any, details: any) {

        await this.run('INSERT OR REPLACE INTO staff (id, name, role, email, status, createdAt) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',

            [staff.id, staff.name, staff.role, staff.email, staff.status]);

        

        await this.run('INSERT OR REPLACE INTO staff_details (staffId, baseSalary, contractType, admissionDate, performanceScore) VALUES (?, ?, ?, CURRENT_DATE, ?)',

            [staff.id, details.baseSalary, details.contractType, details.performanceScore]);

    }



    async getStaffDetails(staffId: string) {

        return await this.get('SELECT * FROM staff_details WHERE staffId = ?', [staffId]);

    }



    async getStaffPontoHistory(staffId: string, limit: number = 10) {

        return await this.all('SELECT * FROM attendance_logs WHERE studentId = ? ORDER BY logged_at DESC LIMIT ?', [staffId, limit]);

    }



    // AI Augmentation (v1610)

    async upsertAugmentation(aug: any) {

        return await this.run(

            'INSERT OR REPLACE INTO augmentations (id, studentId, imagePath, fullBodyImagePath, perspective, confidence, height, socialContext, displacementPattern, predictedNextCamera) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',

            [aug.id, aug.studentId, aug.imagePath, aug.fullBodyImagePath, aug.perspective, aug.confidence, aug.height, aug.socialContext, aug.displacementPattern, aug.predictedNextCamera]

        );

    }



    async upsertVerificationQueue(item: any) {

        return await this.run(

            'INSERT OR REPLACE INTO verification_queue (id, studentId, cameraId, imagePath, status) VALUES (?, ?, ?, ?, ?)',

            [item.id, item.studentId, item.cameraId, item.imagePath, item.status]

        );

    }



    // --- MÉTODOS FINANCEIRO E OUTBOX ---

    async upsertBilling(item: any) {

        await this.run('INSERT OR REPLACE INTO billing (id, studentHash, amount, dueDate, status) VALUES (?, ?, ?, ?, ?)',

            [item.id, item.studentHash, item.amount, item.dueDate, item.status]);

    }



    async getOutboxItems() {

        return await this.all('SELECT * FROM global_intelligence_ledger');

    }



    async addOutboxItem(type: string, payload: any) {

        const id = `out_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

        await this.run('INSERT INTO global_intelligence_ledger (id, type, payload) VALUES (?, ?, ?)',

            [id, type, JSON.stringify(payload)]);

    }



    async markOutboxSynced(id: string, status: string) {

        await this.run('UPDATE global_intelligence_ledger SET appliedAt = CURRENT_TIMESTAMP WHERE id = ?', [id]);

    }



    // --- WHATSAPP ---

    async getPendingWhatsAppMessages() {

        return await this.all('SELECT * FROM notifications WHERE type = "whatsapp" AND treatedAt IS NULL');

    }



    async addWhatsAppMessage(message: any) {

        const id = message.id || `wa_${Date.now()}`;

        await this.saveAlert({ 

            id, 

            type: 'whatsapp', 

            title: 'WhatsApp Outbound', 

            message: message.body, 

            priority: 'normal', 

            studentId: message.studentId 

        });

    }



    async deleteWhatsAppMessage(id: string) {

        await this.run('DELETE FROM notifications WHERE id = ?', [id]);

    }



    async updateWhatsAppMessageStatus(id: string, status: string, attempts?: number) {

        await this.run('UPDATE notifications SET treatmentNotes = ? WHERE id = ?', [`status:${status}|attempts:${attempts || 0}`, id]);

    }



    // --- CICLO DE VIDA ---

    async getStudentLifeCycleHistory(studentId: string) {

        const behavioralLogs = await this.all('SELECT * FROM behavioral_logs WHERE studentId = ? ORDER BY timestamp DESC', [studentId]);

        const grades = await this.all('SELECT * FROM student_grades WHERE studentId = ? ORDER BY timestamp DESC', [studentId]);

        const resources = await this.all('SELECT * FROM pedagogical_resources WHERE studentId = ? ORDER BY createdAt DESC', [studentId]);



        return {

            grades: grades || [],

            behavioralTrends: behavioralLogs || [],

            snapshots: resources.map(r => ({

                id: r.id,

                title: r.title,

                aiSynthesis: r.aiSummary,

                timestamp: r.createdAt

            }))

        };

    }



    async createStudent(student: any) {

        await this.run('INSERT INTO students (id, classId, name, registrationNumber) VALUES (?, ?, ?, ?)',

            [student.id, student.classId, student.name, student.registrationNumber]);

    }



    async checkIntegrity() {

        console.log("[Database] Iniciando verificação de integridade estrutural...");

        try {

            const integrity = this.db?.prepare("PRAGMA integrity_check").get() as any;

            if (integrity?.integrity_check !== 'ok') {

                console.error("[Database] Erro de integridade estrutural:", integrity);

            }



            const foreignKeys = this.db?.prepare("PRAGMA foreign_key_check").all() as any[];

            if (foreignKeys && foreignKeys.length > 0) {

                console.warn("[Database] Inconsistências de chave estrangeira encontradas:", foreignKeys.length);

            }



            console.log("[Database] Verificação de integridade concluída.");

            return {

                healthy: integrity?.integrity_check === 'ok',

                foreignKeys: foreignKeys?.length === 0,

                details: foreignKeys,

                timestamp: new Date().toISOString()

            };

        } catch (e) {

            console.error("[Database] Falha ao executar check de integridade:", e);

            return { healthy: false, reason: (e as Error).message };

        }

    }



    async rebuildTable(tableName: string, columns: string[], rows: any[][]) {

        console.log(`[Database] Rebuilding table: ${tableName}`);

        await this.run(`DELETE FROM ${tableName}`);

        const placeholders = columns.map(() => '?').join(',');

        for (const row of rows) {

            await this.run(`INSERT INTO ${tableName} (${columns.join(',')}) VALUES (${placeholders})`, row);

        }

    }



    async close() {

        if (this.writeBehindInterval) {

            clearInterval(this.writeBehindInterval);

            this.writeBehindInterval = null;

        }

        await this.flushQueue();

        if (this.db) {

            this.db.close();

            this.db = null;

        }

    }

    /**

     * Obtém estudantes que deveriam estar em sala agora (AG-024)

     */

    async getStudentsScheduledNow(time: string, dayOfWeek: number): Promise<any[]> {

        const query = `

          SELECT 

            s.id as studentId, 

            s.name as studentName,

            sch.subject,

            sch.room_id as roomId,

            r.name as roomName,

            r.camera_id as cameraId

          FROM students s

          JOIN student_classes sc ON s.id = sc.student_id

          JOIN schedules sch ON sc.class_id = sch.class_id

          JOIN rooms r ON sch.room_id = r.id

          WHERE sch.day_of_week = ? 

            AND ? BETWEEN sch.start_time AND sch.end_time

            AND s.status = 'active'

        `;

        return await this.all(query, [dayOfWeek, time]);

    }



    /**

     * [SQA-SEAT-100] Obtém todos os alunos de uma turma.

     */

    async getStudentsByClass(classId: string): Promise<any[]> {

        const rows = await this.all('SELECT * FROM students WHERE classId = ? ORDER BY name ASC', [classId]);

        return rows.map(s => ({

            ...s,

            studentId: s.id,

            name: s.name && s.name.includes(':') ? securityService.decrypt(s.name) : s.name

        }));

    }



    /**

     * [SQA-SEAT-101] Obtém o layout de assentos de uma turma.

     */

    async getStudentSeats(classId: string): Promise<any[]> {

        return await this.all(`

            SELECT s.id as studentId, s.name as studentName, s.row, s.col, s.frustrationScore, s.observationLevel, s.metadata

            FROM students s

            WHERE s.classId = ?

            ORDER BY s.row, s.col

        `, [classId]);

    }



    /**

     * [SQA-SEAT-102] Salva a posição de um aluno.

     */

    async saveStudentSeat(studentId: string, classId: string, row: number, col: number, frustrationScore: number = 0) {

        return await this.run(

            'UPDATE students SET row = ?, col = ?, frustrationScore = ? WHERE id = ? AND classId = ?',

            [row, col, frustrationScore, studentId, classId]

        );

    }



    /**

     * [SQA-SEAT-103] Obtém regras de assento (PIN, BLOCK, etc).

     */

    async getSeatingRules(classId: string): Promise<any[]> {

        // Se a tabela seating_rules não existir, retornamos vazio (migração pendente)

        try {

            return await this.all('SELECT * FROM seating_rules WHERE classId = ?', [classId]);

        } catch (e) {

            return [];

        }

    }



    async saveSeatingRule(classId: string, rule: any) {

        // Criar tabela se não existir

        await this.run('CREATE TABLE IF NOT EXISTS seating_rules (id TEXT PRIMARY KEY, classId TEXT NOT NULL, studentId TEXT, ruleType TEXT, metadata TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)');

        

        return await this.run(

            'INSERT OR REPLACE INTO seating_rules (id, classId, studentId, ruleType, metadata) VALUES (?, ?, ?, ?, ?)',

            [rule.id || 'rule_' + Date.now(), classId, rule.studentId, rule.ruleType, JSON.stringify(rule.metadata || {})]

        );

    }



    async deleteSeatingRule(classId: string, ruleId: string) {

        return await this.run('DELETE FROM seating_rules WHERE id = ? AND classId = ?', [ruleId, classId]);

    }



    /**

     * Verifica se há conflito de horário para uma sala ou professor

     */

    async checkScheduleConflict(roomId: string, teacherId: string, dayOfWeek: number, startTime: string, endTime: string, excludeId?: string): Promise<any[]> {

        let sql = 'SELECT * FROM schedules WHERE dayOfWeek = ? AND (roomId = ? OR teacherId = ?) AND ((startTime < ? AND endTime > ?))';

        const params = [dayOfWeek, roomId, teacherId, endTime, startTime];

        

        if (excludeId) {

            sql += " AND id != ?";

            params.push(excludeId);

        }

        

        return await this.all(sql, params);

    }



    /**

     * Obtém a grade horária de um professor

     */

    async getTeacherSchedule(teacherId: string, dayOfWeek?: number): Promise<any[]> {

        let sql = 'SELECT * FROM schedules WHERE teacherId = ?';

        const params: any[] = [teacherId];

        

        if (dayOfWeek !== undefined) {

            sql += ' AND dayOfWeek = ?';

            params.push(dayOfWeek);

        }

        

        sql += ' ORDER BY startTime ASC';

        return await this.all(sql, params);

    }



    /**

     * Persiste um relatório de aula processado (Audio-to-Insight)

     */

    async saveClassReport(report: any) {

        return await this.run(

            'INSERT INTO class_reports (id, teacherId, classId, roomId, transcription, summary, insights, routingStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',

            [

                report.id || 'rep_' + Date.now(),

                report.teacherId,

                report.classId,

                report.roomId,

                report.transcription,

                report.summary,

                JSON.stringify(report.insights || {}),

                report.routingStatus || 'COMPLETED'

            ]

        );

    }



    async getClassReports(classId?: string): Promise<any[]> {

        if (classId && classId !== 'all' && classId !== '') {

            return await this.all('SELECT r.*, t.name as teacherName, c.name as className FROM class_reports r LEFT JOIN staff t ON r.teacherId = t.id LEFT JOIN classes c ON r.classId = c.id WHERE r.classId = ? ORDER BY r.createdAt DESC', [classId]);

        }

        return await this.all('SELECT r.*, t.name as teacherName, c.name as className FROM class_reports r LEFT JOIN staff t ON r.teacherId = t.id LEFT JOIN classes c ON r.classId = c.id ORDER BY r.createdAt DESC');

    }



    async updateReportStatus(reportId: string, status: string) {

        return await this.run('UPDATE class_reports SET routingStatus = ? WHERE id = ?', [status, reportId]);

    }



    /**

     * Obtém deltas de auditoria para replicação Lighthouse

     */

    async getAuditDeltas(lastSyncId: number): Promise<any[]> {

        return await this.all('SELECT * FROM zero_bypass_audits WHERE id > ? ORDER BY id ASC', [lastSyncId]);

    }



    async logAudit(userId: string, action: string, details: string, metadata: any = {}) {

        try {

            return await this.run(

                'INSERT INTO zero_bypass_audits (userId, action, details, metadata, timestamp) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',

                [userId, action, details, JSON.stringify(metadata)]

            );

        } catch (e) {

            console.error('[Database] Erro ao logar auditoria:', e);

        }

    }



    async getParentUserByStudent(studentId: string) {

        return await this.get('SELECT u.* FROM users u JOIN students s ON s.parentUserId = u.id WHERE s.id = ?', [studentId]);

    }



    async getCoordinationUsersByClass(classId: string) {

        return await this.all('SELECT u.* FROM users u JOIN coordinations c ON u.coordinationId = c.id JOIN classes cl ON cl.schoolId = c.schoolId WHERE cl.id = ? AND u.role = "coordination"', [classId]);

    }



    async updateUserInteraction(userId: string) {

        return await this.run(

            'UPDATE users SET last_app_interaction = CURRENT_TIMESTAMP WHERE id = ?',

            [userId]

        );

    }



    async getPendingBills(daysThreshold: number = 3) {

        return await this.all("SELECT b.*, s.parentUserId, s.name as studentName FROM billing b LEFT JOIN students s ON b.studentHash = s.id WHERE b.status = 'pending' AND date(b.dueDate) <= date('now', '+' || ? || ' days')", [daysThreshold]);

    }



    async getLifecycleStats() {

        const total = await this.get('SELECT COUNT(*) as count FROM students');

        const active = await this.get("SELECT COUNT(*) as count FROM students WHERE status = 'active'");

        const atRisk = await this.get('SELECT COUNT(*) as count FROM students WHERE observationLevel > 1');

        

        // Alunos que estavam em risco (>1) e agora estão estáveis (<=1) nos últimos 90 dias

        const recovered = await this.get(`

            SELECT COUNT(DISTINCT s.id) as count 

            FROM students s

            JOIN behavioral_logs b ON s.id = b.studentId

            WHERE s.observationLevel <= 1 

            AND b.riskScore > 60 

            AND b.timestamp < date('now', '-30 days')

            AND s.status = 'active'

        `);



        // Retention Rate = (Active / Total) * 100

        const retentionRate = total?.count > 0 ? (active?.count / total?.count) * 100 : 100;



        return {

            totalStudents: total?.count || 0,

            atRisk: atRisk?.count || 0,

            recovered: recovered?.count || 0,

            retentionRate: parseFloat(retentionRate.toFixed(1)),

            interventionEfficiency: total?.count > 0 ? parseFloat(((recovered?.count / (atRisk?.count + recovered?.count || 1)) * 100).toFixed(1)) : 100

        };

    }



    async getAverageAttendance(studentId: string) {

        const res = await this.get('SELECT AVG(percentage) as avg FROM attendance WHERE studentId = ?', [studentId]);

        return res?.avg || 0;

    }



    async getAverageTuition() {

        const res = await this.get('SELECT AVG(amount) as avg FROM billing');

        return res?.avg || 1200; // Fallback para valor padrão se tabela estiver vazia

    }



    async saveAttendanceCall(classId: string, scheduleId: string, date: string, records: Array<{ studentId: string; status: 'present' | 'absent' }>) {

        for (const record of records) {

            const id = `att_${record.studentId}_${scheduleId}_${date}`;

            await this.recordAttendance({

                id,

                studentId: record.studentId,

                classId,

                scheduleId,

                date,

                status: record.status,

                percentage: record.status === 'present' ? 1.0 : 0.0,

                timeInClass: record.status === 'present' ? 50 : 0,

                totalDuration: 50

            });

        }

        return { success: true };

    }



    async getTasks(filters?: { classId?: string; studentId?: string; teacherId?: string }) {

        let sql = 'SELECT t.*, s.name as studentName FROM student_tasks t JOIN students s ON t.studentId = s.id WHERE 1=1';

        const params: any[] = [];

        if (filters?.classId) {

            sql += ' AND s.classId = ?';

            params.push(filters.classId);

        }

        if (filters?.studentId) {

            sql += ' AND t.studentId = ?';

            params.push(filters.studentId);

        }

        if (filters?.teacherId) {

            const cleanId = filters.teacherId.replace(/^usr_|^teacher-/, '');

            sql += ' AND (t.teacherId = ? OR t.teacherId LIKE ? OR t.teacherId LIKE ?)';

            params.push(filters.teacherId, `%${filters.teacherId}%`, `%${cleanId}%`);

        }

        sql += ' ORDER BY t.dueDate ASC';

        return await this.all(sql, params);

    }



    async createTask(task: any) {

        return await this.run(

            `INSERT INTO student_tasks (id, studentId, title, description, dueDate, status, priority, sourceMaterialId, youtubeLinks, teacherId, subject) 

             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

            [

                task.id || 'tsk_' + Date.now() + Math.random().toString(36).substr(2, 5),

                task.studentId,

                task.title,

                task.description || '',

                task.dueDate,

                task.status || 'pending',

                task.priority || 'normal',

                task.sourceMaterialId || null,

                task.youtubeLinks || null,

                task.teacherId || null,

                task.subject || null

            ]

        );

    }



    async createClassTask(classId: string, taskTemplate: any) {

        const students = await this.all('SELECT id FROM students WHERE classId = ?', [classId]);

        for (const student of students) {

            await this.createTask({

                ...taskTemplate,

                studentId: student.id

            });

        }

        return { success: true, count: students.length };

    }



    async updateTask(id: string, task: any) {

        return await this.run(

            `UPDATE student_tasks SET 

                title = ?, description = ?, dueDate = ?, status = ?, priority = ?, 

                sourceMaterialId = ?, youtubeLinks = ?, updatedAt = CURRENT_TIMESTAMP

             WHERE id = ?`,

            [

                task.title,

                task.description || '',

                task.dueDate,

                task.status,

                task.priority,

                task.sourceMaterialId || null,

                task.youtubeLinks || null,

                id

            ]

        );

    }



    async deleteTask(id: string) {

        return await this.run('DELETE FROM student_tasks WHERE id = ?', [id]);

    }



    async getCalendarEvents(filters?: { classId?: string; type?: string; date?: string }) {

        let sql = 'SELECT * FROM unified_calendar WHERE 1=1';

        const params: any[] = [];

        if (filters?.classId) {

            sql += ' AND (classId = ? OR classId IS NULL)';

            params.push(filters.classId);

        }

        if (filters?.type) {

            sql += ' AND type = ?';

            params.push(filters.type);

        }

        if (filters?.date) {

            sql += ' AND date = ?';

            params.push(filters.date);

        }

        sql += ' ORDER BY date ASC, createdAt ASC';

        return await this.all(sql, params);

    }



    async saveCalendarEvent(event: any) {

        const id = event.id || 'evt_' + Date.now() + Math.random().toString(36).substr(2, 5);

        return await this.run(

            `INSERT OR REPLACE INTO unified_calendar (id, title, description, date, type, classId, subject, teacherId, updatedAt)

             VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,

            [

                id,

                event.title,

                event.description || '',

                event.date,

                event.type,

                event.classId || null,

                event.subject || null,

                event.teacherId || null

            ]

        );

    }



    async deleteCalendarEvent(id: string) {

        return await this.run('DELETE FROM unified_calendar WHERE id = ?', [id]);

    }



    // ─── Sovereign Face Embeddings 512-dim (InsightFace/ArcFace via Colab GPU) ───



    async saveFaceEmbedding512(studentId: string, vector: number[], model: string = 'ArcFace-512', qualityScore: number = 1.0): Promise<string> {

        const id = 'emb512_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

        const vectorJson = JSON.stringify(vector);

        await this.run(

            `INSERT INTO student_face_embeddings_512 (id, studentId, vector, model, qualityScore)

             VALUES (?, ?, ?, ?, ?)`,

            [id, studentId, vectorJson, model, qualityScore]

        );

        return id;

    }



    async getFaceEmbeddings512(studentId?: string): Promise<Array<{ id: string; studentId: string; vector: number[]; model: string; qualityScore: number; createdAt: string }>> {

        const sql = studentId

            ? `SELECT * FROM student_face_embeddings_512 WHERE studentId = ? ORDER BY createdAt DESC`

            : `SELECT * FROM student_face_embeddings_512 ORDER BY createdAt DESC`;

        const params = studentId ? [studentId] : [];

        const rows = await this.all(sql, params);

        return rows.map((r: any) => ({

            id: r.id,

            studentId: r.studentId,

            vector: typeof r.vector === 'string' ? JSON.parse(r.vector) : r.vector,

            model: r.model,

            qualityScore: r.qualityScore,

            createdAt: r.createdAt

        }));

    }



    async searchClosestFace512(queryVector: number[], threshold: number = 0.60, limit: number = 5): Promise<Array<{ studentId: string; similarity: number; model: string }>> {

        const embeddings = await this.getFaceEmbeddings512();

        if (!embeddings.length || !queryVector.length) return [];



        let queryNorm = 0;

        for (let i = 0; i < queryVector.length; i++) {

            queryNorm += queryVector[i] * queryVector[i];

        }

        queryNorm = Math.sqrt(queryNorm);

        if (queryNorm === 0) return [];



        const results: Array<{ studentId: string; similarity: number; model: string }> = [];



        for (const emb of embeddings) {

            const v = emb.vector;

            if (v.length !== queryVector.length) continue;



            let dot = 0;

            let targetNorm = 0;

            for (let i = 0; i < v.length; i++) {

                dot += queryVector[i] * v[i];

                targetNorm += v[i] * v[i];

            }

            targetNorm = Math.sqrt(targetNorm);

            if (targetNorm === 0) continue;



            const similarity = dot / (queryNorm * targetNorm);

            if (similarity >= threshold) {

                results.push({

                    studentId: emb.studentId,

                    similarity: Math.round(similarity * 10000) / 10000,

                    model: emb.model

                });

            }

        }



        results.sort((a, b) => b.similarity - a.similarity);

        return results.slice(0, limit);

    }



    // ─── Sovereign OMR Exam Scanner & Corrections ───



    async createOmrTemplate(data: {

        id?: string;

        title: string;

        classId?: string;

        totalQuestions: number;

        optionsCount?: number;

        answerKey: Record<string, string>;

        weights?: Record<string, number>;

    }): Promise<string> {

        const id = data.id || 'omr_tpl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

        await this.run(

            `INSERT INTO omr_exam_templates (id, title, classId, totalQuestions, optionsCount, answerKey, weights)

             VALUES (?, ?, ?, ?, ?, ?, ?)`,

            [

                id,

                data.title,

                data.classId || null,

                data.totalQuestions,

                data.optionsCount || 5,

                JSON.stringify(data.answerKey),

                data.weights ? JSON.stringify(data.weights) : null

            ]

        );

        return id;

    }



    async getOmrTemplate(id: string): Promise<any | null> {

        const row = await this.get(`SELECT * FROM omr_exam_templates WHERE id = ?`, [id]);

        if (!row) return null;

        return {

            ...row,

            answerKey: typeof row.answerKey === 'string' ? JSON.parse(row.answerKey) : row.answerKey,

            weights: row.weights ? (typeof row.weights === 'string' ? JSON.parse(row.weights) : row.weights) : null

        };

    }



    async saveOmrCorrection(data: {

        id?: string;

        templateId: string;

        studentId?: string;

        studentName?: string;

        detectedAnswers: Record<string, string>;

        score: number;

        totalPoints: number;

        accuracyPct: number;

        confidence?: number;

        scanImagePath?: string;

    }): Promise<string> {

        const id = data.id || 'omr_cor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

        await this.run(

            `INSERT INTO omr_exam_corrections (id, templateId, studentId, studentName, detectedAnswers, score, totalPoints, accuracyPct, confidence, scanImagePath)

             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

            [

                id,

                data.templateId,

                data.studentId || null,

                data.studentName || null,

                JSON.stringify(data.detectedAnswers),

                data.score,

                data.totalPoints,

                data.accuracyPct,

                data.confidence ?? 1.0,

                data.scanImagePath || null

            ]

        );

        return id;

    }



    async getOmrCorrections(templateId: string): Promise<any[]> {

        const rows = await this.all(

            `SELECT * FROM omr_exam_corrections WHERE templateId = ? ORDER BY processedAt DESC`,

            [templateId]

        );

        return rows.map((r: any) => ({

            ...r,

            detectedAnswers: typeof r.detectedAnswers === 'string' ? JSON.parse(r.detectedAnswers) : r.detectedAnswers

        }));

    }



    async listOmrTemplates(classId?: string): Promise<any[]> {

        const query = classId

            ? `SELECT * FROM omr_exam_templates WHERE classId = ? OR classId IS NULL ORDER BY createdAt DESC`

            : `SELECT * FROM omr_exam_templates ORDER BY createdAt DESC`;

        const params = classId ? [classId] : [];

        const rows = await this.all(query, params);

        return rows.map((r: any) => ({

            ...r,

            answerKey: typeof r.answerKey === 'string' ? JSON.parse(r.answerKey) : r.answerKey,

            weights: r.weights ? (typeof r.weights === 'string' ? JSON.parse(r.weights) : r.weights) : null

        }));

    }



    async addStudentGrade(data: {

        studentId: string;

        classId: string;

        type?: string;

        value: number;

        weight?: number;

    }): Promise<void> {

        await this.run(

            `INSERT INTO student_grades (studentId, classId, type, value, weight)

             VALUES (?, ?, ?, ?, ?)`,

            [data.studentId, data.classId, data.type || 'OMR_TRI', data.value, data.weight || 1.0]

        );

    }



    // ---- PEDAGOGICAL PLAYLISTS & GAME MAKER ----

    async savePedagogicalPlaylist(data: {

        id?: string;

        teacherId?: string;

        classId: string;

        subject: string;

        title: string;

        description?: string;

        bnccCodes?: string[];

        stages: any[];

        coinReward?: number;

        badgeId?: string;

        badgeName?: string;

        status?: string;

    }) {

        const id = data.id || `playlist-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        await this.run(

            `INSERT OR REPLACE INTO pedagogical_playlists (

                id, teacherId, classId, subject, title, description, bnccCodes, stages, coinReward, badgeId, badgeName, status, updatedAt

            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,

            [

                id,

                data.teacherId || null,

                data.classId,

                data.subject,

                data.title,

                data.description || '',

                JSON.stringify(data.bnccCodes || []),

                JSON.stringify(data.stages || []),

                data.coinReward !== undefined ? data.coinReward : 25,

                data.badgeId || null,

                data.badgeName || null,

                data.status || 'active'

            ]

        );

        return { success: true, id };

    }



    async getPedagogicalPlaylists(classId?: string) {

        const query = classId && classId !== 'all'

            ? `SELECT * FROM pedagogical_playlists WHERE classId = ? OR classId = 'all' ORDER BY createdAt DESC`

            : `SELECT * FROM pedagogical_playlists ORDER BY createdAt DESC`;

        const params = classId && classId !== 'all' ? [classId] : [];

        const rows = await this.all(query, params);

        return rows.map((r: any) => ({

            ...r,

            bnccCodes: typeof r.bnccCodes === 'string' ? JSON.parse(r.bnccCodes) : r.bnccCodes || [],

            stages: typeof r.stages === 'string' ? JSON.parse(r.stages) : r.stages || []

        }));

    }



    async deletePedagogicalPlaylist(id: string) {

        await this.run(`DELETE FROM pedagogical_playlists WHERE id = ?`, [id]);

        return { success: true };

    }



    async saveGameMakerTemplate(data: {

        id?: string;

        teacherId?: string;

        title: string;

        gameType: string;

        subject: string;

        bnccCodes?: string[];

        config: any;

    }) {

        const id = data.id || `game-tpl-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        await this.run(

            `INSERT OR REPLACE INTO game_maker_templates (

                id, teacherId, title, gameType, subject, bnccCodes, config, updatedAt

            ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,

            [

                id,

                data.teacherId || null,

                data.title,

                data.gameType,

                data.subject,

                JSON.stringify(data.bnccCodes || []),

                JSON.stringify(data.config || {})

            ]

        );

        return { success: true, id };

    }



    async getGameMakerTemplates(teacherId?: string) {

        const query = teacherId

            ? `SELECT * FROM game_maker_templates WHERE teacherId = ? OR teacherId IS NULL ORDER BY createdAt DESC`

            : `SELECT * FROM game_maker_templates ORDER BY createdAt DESC`;

        const params = teacherId ? [teacherId] : [];

        const rows = await this.all(query, params);

        return rows.map((r: any) => ({

            ...r,

            bnccCodes: typeof r.bnccCodes === 'string' ? JSON.parse(r.bnccCodes) : r.bnccCodes || [],

            config: typeof r.config === 'string' ? JSON.parse(r.config) : r.config || {}

        }));

    }



    async deleteGameMakerTemplate(id: string) {

        await this.run(`DELETE FROM game_maker_templates WHERE id = ?`, [id]);

        return { success: true };

    }



    async saveStudentEssay(data: {

        id?: string;

        studentId: string;

        themeId: string;

        themeTitle: string;

        text: string;

        photoPath?: string;

        submissionType?: string;

        ocrConfidence?: number;

        c1Score: number;

        c2Score: number;

        c3Score: number;

        c4Score: number;

        c5Score: number;

        totalScore: number;

        feedbackText?: string;

        c5ElementsJson?: any;

        repertoireHitsJson?: any;

        status?: string;

    }) {

        const id = data.id || `essay-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        await this.run(

            `INSERT OR REPLACE INTO student_essays (

                id, studentId, themeId, themeTitle, text, photoPath, submissionType,

                ocrConfidence, c1Score, c2Score, c3Score, c4Score, c5Score, totalScore,

                feedbackText, c5ElementsJson, repertoireHitsJson, status, auditedAt

            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,

            [

                id,

                data.studentId,

                data.themeId,

                data.themeTitle,

                data.text,

                data.photoPath || null,

                data.submissionType || 'typed',

                data.ocrConfidence ?? 1.0,

                data.c1Score,

                data.c2Score,

                data.c3Score,

                data.c4Score,

                data.c5Score,

                data.totalScore,

                data.feedbackText || null,

                typeof data.c5ElementsJson === 'string' ? data.c5ElementsJson : JSON.stringify(data.c5ElementsJson || {}),

                typeof data.repertoireHitsJson === 'string' ? data.repertoireHitsJson : JSON.stringify(data.repertoireHitsJson || []),

                data.status || 'audited'

            ]

        );

        return { success: true, id };

    }



    async getStudentEssays(studentId: string) {

        const rows = await this.all(

            `SELECT * FROM student_essays WHERE studentId = ? ORDER BY createdAt DESC`,

            [studentId]

        );

        return rows.map((r: any) => ({

            ...r,

            c5Elements: typeof r.c5ElementsJson === 'string' ? JSON.parse(r.c5ElementsJson) : r.c5ElementsJson || {},

            repertoireHits: typeof r.repertoireHitsJson === 'string' ? JSON.parse(r.repertoireHitsJson) : r.repertoireHitsJson || []

        }));

    }



    async getStudentEssayById(id: string) {

        const r = await this.get(`SELECT * FROM student_essays WHERE id = ?`, [id]);

        if (!r) return null;

        return {

            ...r,

            c5Elements: typeof r.c5ElementsJson === 'string' ? JSON.parse(r.c5ElementsJson) : r.c5ElementsJson || {},

            repertoireHits: typeof r.repertoireHitsJson === 'string' ? JSON.parse(r.repertoireHitsJson) : r.repertoireHitsJson || []

        };

    }



    async deleteStudentEssay(id: string) {

        await this.run(`DELETE FROM student_essays WHERE id = ?`, [id]);

        return { success: true };

    }

    async saveAppletProgress(data: {
        id?: string;
        studentId: string;
        appletId: string;
        appletType: string;
        category?: string;
        score: number;
        maxScore: number;
        hintsUsed?: number;
        timeSpentSeconds?: number;
        coinsAwarded?: number;
        metadata?: any;
    }) {
        const id = data.id || `applet-prog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const hintsUsed = data.hintsUsed || 0;
        const timeSpent = data.timeSpentSeconds || 0;
        const coins = data.coinsAwarded || 0;
        const category = data.category || 'STEM';
        const metaStr = typeof data.metadata === 'object' ? JSON.stringify(data.metadata) : (data.metadata || '{}');

        await this.run(`
            INSERT INTO student_applet_progress (
                id, studentId, appletId, appletType, category,
                score, maxScore, hintsUsed, timeSpentSeconds, coinsAwarded,
                completedAt, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
        `, [
            id, data.studentId, data.appletId, data.appletType, category,
            data.score, data.maxScore, hintsUsed, timeSpent, coins,
            metaStr
        ]);

        if (coins > 0) {
            await this.addStudentCoins(data.studentId, coins);
        }

        return { id, success: true, coinsAwarded: coins };
    }

    async getStudentAppletProgress(studentId: string) {
        return await this.all(`
            SELECT * FROM student_applet_progress 
            WHERE studentId = ? 
            ORDER BY completedAt DESC
        `, [studentId]);
    }

}



export const db = new Proxy({} as Database, {

    get(target, prop) {

        const instance = Database.getInstance();

        const value = (instance as any)[prop];

        if (typeof value === 'function') {

            return value.bind(instance);

        }

        return value;

    }

});



export default Database;

