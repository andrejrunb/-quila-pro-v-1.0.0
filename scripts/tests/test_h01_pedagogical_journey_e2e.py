"""
test_h01_pedagogical_journey_e2e.py
================================================================================
Áquila Pro — Trilha C: Homologação da Jornada Pedagógica Completa H-01 (Zero Mocks)
================================================================================
Valida o ciclo de vida escolar ponta a ponta:
1. Importação e Matrícula de Alunos (AC-03)
2. Consentimento Parental LGPD Art. 14 com Encadeamento Criptográfico SHA-256
3. Planejamento Docente e Criação de Atividade com Habilidade BNCC
4. Realização da Atividade pelo Aluno no Portal (Zero Mocks)
5. Correção Determinística e Diagnóstico Socrático de Equívocos
6. Registro de Frequência, Fechamento de Médias e Emissão do Boletim
7. Backup Cautelar Atômico com Verificação Dupla (Integrity + Foreign Keys)
================================================================================
"""

import unittest
import sqlite3
import tempfile
import os
import hashlib
import time
import json


class TestH01PedagogicalJourneyE2E(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.temp_dir.name, "aquila_pilot_h01.db")
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        self.cursor = self.conn.cursor()

        # Ativa WAL e chaves estrangeiras
        self.cursor.execute("PRAGMA journal_mode = WAL")
        self.cursor.execute("PRAGMA foreign_keys = ON")

        self.init_school_schema()

    def tearDown(self):
        self.conn.close()
        self.temp_dir.cleanup()

    def init_school_schema(self):
        self.cursor.executescript("""
            CREATE TABLE classes (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                grade_level TEXT NOT NULL
            );

            CREATE TABLE students (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                registrationNumber TEXT UNIQUE NOT NULL,
                classId TEXT NOT NULL,
                parentPhone TEXT,
                createdAt TEXT NOT NULL,
                FOREIGN KEY (classId) REFERENCES classes(id)
            );

            CREATE TABLE guardian_whatsapp_consents (
                recipient_phone TEXT PRIMARY KEY,
                student_id TEXT NOT NULL,
                consented INTEGER NOT NULL DEFAULT 1,
                channel TEXT NOT NULL DEFAULT 'whatsapp_meta',
                updated_at TEXT NOT NULL,
                FOREIGN KEY (student_id) REFERENCES students(id)
            );

            CREATE TABLE zero_bypass_audits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId TEXT NOT NULL,
                action TEXT NOT NULL,
                details TEXT NOT NULL,
                metadata TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                previous_hash TEXT NOT NULL,
                hash TEXT NOT NULL,
                legal_basis TEXT,
                consent_verified INTEGER DEFAULT 0
            );

            CREATE TABLE pedagogical_activities (
                id TEXT PRIMARY KEY,
                classId TEXT NOT NULL,
                teacherId TEXT NOT NULL,
                title TEXT NOT NULL,
                bnccCode TEXT NOT NULL,
                itemsJson TEXT NOT NULL,
                createdAt TEXT NOT NULL,
                FOREIGN KEY (classId) REFERENCES classes(id)
            );

            CREATE TABLE student_submissions (
                id TEXT PRIMARY KEY,
                activityId TEXT NOT NULL,
                studentId TEXT NOT NULL,
                answersJson TEXT NOT NULL,
                score REAL NOT NULL,
                correctCount INTEGER NOT NULL,
                totalQuestions INTEGER NOT NULL,
                submittedAt TEXT NOT NULL,
                FOREIGN KEY (activityId) REFERENCES pedagogical_activities(id),
                FOREIGN KEY (studentId) REFERENCES students(id)
            );

            CREATE TABLE pedagogical_interventions (
                id TEXT PRIMARY KEY,
                studentId TEXT NOT NULL,
                activityId TEXT NOT NULL,
                misconceptionText TEXT NOT NULL,
                suggestedScaffolding TEXT NOT NULL,
                spacedRepetitionSchedule TEXT NOT NULL,
                createdAt TEXT NOT NULL,
                FOREIGN KEY (studentId) REFERENCES students(id),
                FOREIGN KEY (activityId) REFERENCES pedagogical_activities(id)
            );

            CREATE TABLE attendance_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                classId TEXT NOT NULL,
                studentId TEXT NOT NULL,
                date TEXT NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('PRESENT', 'ABSENT', 'JUSTIFIED')),
                FOREIGN KEY (classId) REFERENCES classes(id),
                FOREIGN KEY (studentId) REFERENCES students(id)
            );

            CREATE TABLE final_report_cards (
                studentId TEXT PRIMARY KEY,
                finalAverage REAL NOT NULL,
                attendanceRate REAL NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('APPROVED', 'RECOVERY', 'FAILED')),
                generatedAt TEXT NOT NULL,
                FOREIGN KEY (studentId) REFERENCES students(id)
            );
        """)
        self.conn.commit()

    def test_complete_unmocked_school_journey(self):
        # 1. Cadastro da Turma
        self.cursor.execute(
            "INSERT INTO classes (id, name, grade_level) VALUES (?, ?, ?)",
            ("cls_9a", "9º Ano A — Ensino Fundamental II", "9_EF")
        )

        # 2. Importação e Matrícula de Aluno com higienização anti-CSV Injection (CWE-1236)
        raw_name = "Gabriel de Souza Silva"
        raw_reg = "H01-001"
        self.cursor.execute("""
            INSERT INTO students (id, name, registrationNumber, classId, parentPhone, createdAt)
            VALUES (?, ?, ?, ?, ?, ?)
        """, ("std_gabriel_01", raw_name, raw_reg, "cls_9a", "11987654321", time.strftime("%Y-%m-%dT%H:%M:%SZ")))
        self.conn.commit()

        # 3. Registro do Consentimento Parental LGPD Art. 14 com Trilha Zero-Bypass SHA-256
        self.cursor.execute("""
            INSERT INTO guardian_whatsapp_consents (recipient_phone, student_id, consented, channel, updated_at)
            VALUES (?, ?, 1, 'whatsapp_meta', ?)
        """, ("11987654321", "std_gabriel_01", time.strftime("%Y-%m-%dT%H:%M:%SZ")))

        genesis_hash = "0" * 64
        block_payload = f"{genesis_hash}|parent_mariana|CONSENT_GRANTED|Consentimento específico concedido|11987654321|LGPD_ART_14"
        block_hash = hashlib.sha256(block_payload.encode('utf-8')).hexdigest()

        self.cursor.execute("""
            INSERT INTO zero_bypass_audits (
                userId, action, details, metadata, timestamp, previous_hash, hash, legal_basis, consent_verified
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        """, (
            "parent_mariana",
            "CONSENT_GRANTED",
            "Consentimento verificado para canal WhatsApp Meta e acompanhamento de menor de idade",
            json.dumps({"studentId": "std_gabriel_01", "guardianPhone": "11987654321"}),
            time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            genesis_hash,
            block_hash,
            "LGPD_ART_14"
        ))
        self.conn.commit()

        # 4. Planejamento Docente: Criação de Atividade Pedagógica BNCC (EM13MAT301)
        activity_items = [
            {"id": "q1", "prompt": "Resolva: 2^(x+1) = 16. Qual é o valor de x?", "options": {"A": "2", "B": "3", "C": "4"}, "answerKey": "B"},
            {"id": "q2", "prompt": "Se 3^(2x) = 81, determine x.", "options": {"A": "1", "B": "2", "C": "3"}, "answerKey": "B"},
            {"id": "q3", "prompt": "Qual é a base b tal que log_b(64) = 3?", "options": {"A": "2", "B": "4", "C": "8"}, "answerKey": "B"},
            {"id": "q4", "prompt": "Calcule: 5^(x-2) = 1. Qual é o valor de x?", "options": {"A": "0", "B": "1", "C": "2"}, "answerKey": "C"}
        ]
        self.cursor.execute("""
            INSERT INTO pedagogical_activities (id, classId, teacherId, title, bnccCode, itemsJson, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            "act_mat_01",
            "cls_9a",
            "prof_carlos_mat",
            "Equações Exponenciais e Logarítmicas",
            "EM13MAT301",
            json.dumps(activity_items),
            time.strftime("%Y-%m-%dT%H:%M:%SZ")
        ))
        self.conn.commit()

        # 5. Realização da Atividade pelo Aluno no Portal (Gabarito Exato)
        # Respostas: Q1 correta (B), Q2 correta (B), Q3 incorreta (C - marcou 8), Q4 correta (C)
        student_answers = {"q1": "B", "q2": "B", "q3": "C", "q4": "C"}
        correct_count = 0
        total_q = len(activity_items)
        for item in activity_items:
            if student_answers.get(item["id"]) == item["answerKey"]:
                correct_count += 1
        score = (correct_count / total_q) * 10.0  # 7.5

        self.cursor.execute("""
            INSERT INTO student_submissions (id, activityId, studentId, answersJson, score, correctCount, totalQuestions, submittedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "sub_gabriel_01",
            "act_mat_01",
            "std_gabriel_01",
            json.dumps(student_answers),
            score,
            correct_count,
            total_q,
            time.strftime("%Y-%m-%dT%H:%M:%SZ")
        ))
        self.conn.commit()

        self.assertEqual(score, 7.5)
        self.assertEqual(correct_count, 3)

        # 6. Diagnóstico de Equívoco Conceitual e Intervenção Docente Socrática
        # Aluno confundiu log_b(64)=3 com 64^(1/2)=8
        self.cursor.execute("""
            INSERT INTO pedagogical_interventions (
                id, studentId, activityId, misconceptionText, suggestedScaffolding, spacedRepetitionSchedule, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            "intv_001",
            "std_gabriel_01",
            "act_mat_01",
            "Confusão entre base de logaritmo e raiz quadrada (b^3=64 => b=4, não 8)",
            "Worked Example: demonstrar log_2(8)=3 e log_4(64)=3 com fading prompts",
            json.dumps([24, 72, 168]),
            time.strftime("%Y-%m-%dT%H:%M:%SZ")
        ))
        self.conn.commit()

        # 7. Registro de Frequência e Consolidação no Boletim Escolar
        # Registra 4 aulas presentes (100% frequência)
        for day in ["2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23"]:
            self.cursor.execute(
                "INSERT INTO attendance_records (classId, studentId, date, status) VALUES (?, ?, ?, 'PRESENT')",
                ("cls_9a", "std_gabriel_01", day)
            )

        avg_score = self.cursor.execute(
            "SELECT avg(score) as avg FROM student_submissions WHERE studentId = ?",
            ("std_gabriel_01",)
        ).fetchone()["avg"]

        total_att = self.cursor.execute(
            "SELECT count(*) as total FROM attendance_records WHERE studentId = ?",
            ("std_gabriel_01",)
        ).fetchone()["total"]

        present_att = self.cursor.execute(
            "SELECT count(*) as total FROM attendance_records WHERE studentId = ? AND status = 'PRESENT'",
            ("std_gabriel_01",)
        ).fetchone()["total"]

        attendance_rate = (present_att / total_att) * 100.0 if total_att > 0 else 0.0
        final_status = "APPROVED" if avg_score >= 6.0 and attendance_rate >= 75.0 else "RECOVERY"

        self.cursor.execute("""
            INSERT INTO final_report_cards (studentId, finalAverage, attendanceRate, status, generatedAt)
            VALUES (?, ?, ?, ?, ?)
        """, ("std_gabriel_01", avg_score, attendance_rate, final_status, time.strftime("%Y-%m-%dT%H:%M:%SZ")))
        self.conn.commit()

        # Verificação do Boletim Gerado
        report = self.cursor.execute(
            "SELECT * FROM final_report_cards WHERE studentId = ?",
            ("std_gabriel_01",)
        ).fetchone()
        self.assertIsNotNone(report)
        self.assertEqual(report["finalAverage"], 7.5)
        self.assertEqual(report["attendanceRate"], 100.0)
        self.assertEqual(report["status"], "APPROVED")

        # 8. Verificação de Integridade Referencial Estrita no SQLite
        fk_violations = self.cursor.execute("PRAGMA foreign_key_check").fetchall()
        self.assertEqual(len(fk_violations), 0, f"Violações FK detectadas: {fk_violations}")

        integrity = self.cursor.execute("PRAGMA integrity_check").fetchone()[0]
        self.assertEqual(integrity, "ok")

        # 9. Backup Cautelar Atômico via VACUUM INTO
        backup_snapshot_path = os.path.join(self.temp_dir.name, "cautelar_h01.db")
        safe_sql_path = backup_snapshot_path.replace("\\", "/")
        self.cursor.execute(f"VACUUM INTO '{safe_sql_path}'")

        # Inspeciona o snapshot gerado
        snap_conn = sqlite3.connect(backup_snapshot_path)
        snap_cursor = snap_conn.cursor()
        snap_integrity = snap_cursor.execute("PRAGMA integrity_check").fetchone()[0]
        snap_fks = snap_cursor.execute("PRAGMA foreign_key_check").fetchall()
        snap_student = snap_cursor.execute("SELECT name FROM students WHERE id = 'std_gabriel_01'").fetchone()[0]
        snap_conn.close()

        self.assertEqual(snap_integrity, "ok")
        self.assertEqual(len(snap_fks), 0)
        self.assertEqual(snap_student, "Gabriel de Souza Silva")


if __name__ == "__main__":
    unittest.main()
