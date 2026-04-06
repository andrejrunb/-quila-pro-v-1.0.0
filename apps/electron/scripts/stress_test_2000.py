import sqlite3
import time
import random
import uuid
from datetime import datetime

# stress_test_2000.py — Passo 60 do Roadmap.
# Simula a entrada de 2.000 alunos em um intervalo de 15 minutos (horário de pico).

DB_PATH = 'aquila.db' # Ajustar se necessário

def run_stress_test():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print(f"🚀 Iniciando Stress Test: 2.000 alunos...")
    start_time = time.time()
    
    # Criar alunos se não existirem (mock rápido)
    cursor.execute("SELECT COUNT(*) FROM students")
    count = cursor.fetchone()[0]
    if count < 2000:
        print(f"📦 Populando base com {2000 - count} novos alunos para o teste...")
        for i in range(2000 - count):
            cursor.execute("INSERT INTO students (id, name, classId) VALUES (?, ?, ?)", 
                           (str(uuid.uuid4()), f"Aluno Stress {i}", "TURMA-STRESS"))
    
    conn.commit()
    
    # Simular Deteções
    cursor.execute("SELECT id FROM students LIMIT 2000")
    student_ids = [row[0] for row in cursor.fetchall()]
    
    print("🔥 Processando 2.000 detecções de pico...")
    for i, sid in enumerate(student_ids):
        # Simular log de presença e notificação
        now = datetime.now()
        today = now.isoformat().split('T')[0]
        
        # Inserir Presença
        cursor.execute("INSERT OR REPLACE INTO attendance (id, studentId, date, status) VALUES (?, ?, ?, ?)",
                       (f"att-stress-{sid}", sid, today, 'present'))
        
        # Inserir Notificação
        cursor.execute("INSERT INTO notifications (id, type, title, message, studentId, priority, read) VALUES (?, ?, ?, ?, ?, ?, ?)",
                       (str(uuid.uuid4()), 'ENTRY_CONFIRMATION', 'Entrada Detectada', f'Stress Test: Aluno {i}', sid, 'low', 0))
        
        if i % 100 == 0:
            print(f"✅ {i} detecções processadas...")
            conn.commit()
            
    conn.commit()
    end_time = time.time()
    
    print(f"🏆 Stress Test Concluído!")
    print(f"⏱️ Tempo Total: {end_time - start_time:.2f} segundos")
    print(f"📊 Vazão: {2000 / (end_time - start_time):.2f} ops/sec")
    
    conn.close()

if __name__ == "__main__":
    run_stress_test()
