import sqlite3
import os
import uuid
from datetime import datetime, timedelta

def populate_all_views():
    appdata = os.environ.get('APPDATA')
    db_paths = [
        os.path.join(appdata, 'AquilaPro', 'aquila.db'),
        'C:/aquila/packages/db/aquila.db'
    ]

    today_str = datetime.now().strftime('%Y-%m-%d')
    tomorrow_str = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    next_week_str = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')

    for db_path in db_paths:
        if not os.path.exists(os.path.dirname(db_path)):
            continue

        try:
            conn = sqlite3.connect(db_path, timeout=60)
            c = conn.cursor()
            c.execute("PRAGMA busy_timeout = 10000")
        except Exception as e:
            print(f"Skipping locked db {db_path}: {e}")
            continue

        # Check existing tables
        tables = [row[0] for row in c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]

        # 1. Popula unified_calendar (Eventos & Tarefas de Classe)
        if 'unified_calendar' in tables:
            c.execute("DELETE FROM unified_calendar")
            classes = c.execute("SELECT id, name FROM classes").fetchall()
            
            sample_events = [
                ("Entrega do Trabalho de Pesquisa de Biologia", "Apresentação de maquetes de células eucarióticas", today_str, "tarefa", "Biologia"),
                ("Prova Bimestral de Matemática", "Avaliação individual sem consulta de equações e geometria", tomorrow_str, "bimestral", "Matemática"),
                ("Campeonato Interclasses de Esportes", "Jogos da primeira fase na quadra poliesportiva", next_week_str, "esportes", "Ed. Física"),
                ("Reunião Geral de Pais e Mestres", "Apresentação dos relatórios pedagógicos e metas do semestre", tomorrow_str, "geral", "Pedagogia"),
                ("Feira de Ciências e Tecnologia Soberana", "Exposição de projetos de robótica e inteligência artificial", next_week_str, "anual", "Ciências")
            ]

            for cls_id, cls_name in classes:
                for idx, (title, desc, date, ev_type, subj) in enumerate(sample_events):
                    ev_id = f"evt_{uuid.uuid4().hex[:10]}"
                    c.execute("""
                        INSERT INTO unified_calendar (id, title, description, date, type, classId, subject)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (ev_id, f"[{cls_name}] {title}", desc, date, ev_type, cls_id, subj))

        # 2. Popula student_tasks (Tarefas Individuais com Autor/Professor)
        if 'student_tasks' in tables:
            c.execute("DELETE FROM student_tasks")
            students = c.execute("SELECT id FROM students LIMIT 50").fetchall()
            
            # Garante colunas teacherId e subject
            cols = [r[1] for r in c.execute("PRAGMA table_info(student_tasks)").fetchall()]
            if 'teacherId' not in cols:
                c.execute("ALTER TABLE student_tasks ADD COLUMN teacherId TEXT")
            if 'subject' not in cols:
                c.execute("ALTER TABLE student_tasks ADD COLUMN subject TEXT")

            tasks = [
                ("Resolução dos Exercícios de Álgebra pg 42", "Fazer os exercícios de 1 a 15 do livro didático", today_str, "pending", "high", "teacher-andre", "Matemática"),
                ("Leitura do Livro Dom Casmurro", "Resumo dos capítulos 1 a 10 para discussão em sala", tomorrow_str, "pending", "normal", "teacher-danielle", "Português"),
                ("Relatório do Laboratório de Química", "Elaborar relatório de titulação ácido-base", next_week_str, "pending", "normal", "teacher-marcondes", "Química")
            ]
            
            for s_tuple in students:
                s_id = s_tuple[0]
                for title, desc, due, status, priority, teacher_id, subj in tasks:
                    t_id = f"task_{uuid.uuid4().hex[:10]}"
                    c.execute("""
                        INSERT INTO student_tasks (id, studentId, title, description, dueDate, status, priority, teacherId, subject)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (t_id, s_id, title, desc, due, status, priority, teacher_id, subj))

        # 3. Popula lesson_reports (Relatórios de Aula do Diário)
        if 'lesson_reports' in tables:
            c.execute("DELETE FROM lesson_reports")
            scheds = c.execute("SELECT id, subject FROM schedules LIMIT 30").fetchall()
            
            for sched_id, subj in scheds:
                rep_id = f"rep_{uuid.uuid4().hex[:10]}"
                notes = f"Aula prática sobre conceitos avançados de {subj}. Excelente engajamento da turma."
                ai_sum = f"Resumo IA: A turma demonstrou 94% de retenção no conteúdo de {subj} com participação ativa."
                c.execute("""
                    INSERT INTO lesson_reports (id, scheduleId, date, teacherNotes, aiSummary)
                    VALUES (?, ?, ?, ?, ?)
                """, (rep_id, sched_id, today_str, notes, ai_sum))

        # 4. Popula coordination_insights (Insights da Coordenação)
        if 'coordination_insights' in tables:
            c.execute("DELETE FROM coordination_insights")
            insights = [
                ("Evasão Preventiva", "Alunos do 9º Ano B apresentaram oscilação na assiduidade nas terças-feiras.", "HIGH"),
                ("Desempenho Notável", "Turma do 3º Ano A atingiu 98% de conclusão nos simulados Bimestrais.", "MEDIUM"),
                ("Alocação de Recursos", "Laboratório de Ciências liberado para agendamento de aulas práticas no turno vespertino.", "LOW")
            ]
            for title, content, priority in insights:
                ins_id = f"ins_{uuid.uuid4().hex[:10]}"
                c.execute("""
                    INSERT INTO coordination_insights (id, type, title, content, priority, status)
                    VALUES (?, 'ACADEMIC', ?, ?, ?, 'PENDING')
                """, (ins_id, title, content, priority))

        conn.commit()
        conn.close()
        print(f"Dados de tarefas e relatorios criados com sucesso em {db_path}!")

if __name__ == "__main__":
    populate_all_views()
