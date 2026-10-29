"""
measure_true_rto.py
================================================================================
Medição Factual e Instrumentada do RTO Operacional Real com 4 Marcações de Tempo:
  T0 — Falha detectada (leitura no banco de produção falha por corrupção)
  T1 — Restauração iniciada (remoção de arquivos danificados e início da cópia física)
  T2 — Banco restaurado e verificado (cálculo de checksum SHA-256 e PRAGMA integrity_check)
  T3 — Interface/Serviço disponibilizado (conexão estabelecida e query de validação bem-sucedida)

Cálculo rigoroso:
  Tempo de Detecção & Preparação: T1 - T0
  Tempo de Cópia em Disco:        T_copia_end - T1
  Tempo de Verificação:           T2 - T_copia_end
  Tempo de Disponibilização:      T3 - T2
  RTO Operacional Total:          T3 - T0
================================================================================
"""

import os
import sys
import shutil
import sqlite3
import hashlib
import time
import json

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def compute_sha256(filepath: str) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def measure_rto():
    workspace = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".tmp_measure_rto"))
    if os.path.exists(workspace):
        shutil.rmtree(workspace)
    os.makedirs(workspace, exist_ok=True)
    
    live_db = os.path.join(workspace, "aquila_production_live.db")
    snapshot_db = os.path.join(workspace, "aquila_snapshot.db")
    
    # 1. Preparar banco de produção com 25 alunos
    conn = sqlite3.connect(live_db)
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode = WAL;")
    cur.execute("""
        CREATE TABLE students (
            id TEXT PRIMARY KEY,
            registrationNumber TEXT UNIQUE,
            name TEXT NOT NULL,
            classId TEXT NOT NULL
        );
    """)
    students_data = [(f"std_{i:03d}", f"H01-{i:03d}", f"Aluno Sintetico H01 {i:03d}", "1EM-A-H01") for i in range(1, 26)]
    cur.executemany("INSERT INTO students VALUES (?, ?, ?, ?)", students_data)
    conn.commit()
    
    # Gerar snapshot via VACUUM INTO a quente
    cur.execute(f"VACUUM INTO '{snapshot_db.replace('\\', '/')}';")
    conn.close()
    
    snap_hash = compute_sha256(snapshot_db)
    
    # Simular falha catastrófica: corromper arquivo ativo
    with open(live_db, "r+b") as f:
        f.seek(16)
        f.write(b"\x00" * 512)
        
    print("\n" + "=" * 80)
    print("⏱️ INICIANDO EXERCÍCIO INSTRUMENTADO DE MEDIÇÃO DO RTO OPERACIONAL")
    print("=" * 80)
    
    # T0 — Detecção da Falha
    t0 = time.time()
    failure_detected = False
    conn_test = None
    try:
        conn_test = sqlite3.connect(live_db)
        cur_test = conn_test.cursor()
        cur_test.execute("SELECT count(*) FROM students;")
        cur_test.fetchone()
    except sqlite3.DatabaseError as e:
        failure_detected = True
        t0_detected = time.time()
        print(f"[{time.strftime('%H:%M:%S')}] T0 — Falha detectada com sucesso no banco: {str(e)[:50]}...")
    finally:
        if conn_test:
            conn_test.close()
        
    assert failure_detected, "Falha deveria ter sido detectada em T0!"
    
    # T1 — Início da Restauração
    t1 = time.time()
    print(f"[{time.strftime('%H:%M:%S')}] T1 — Restauração iniciada. Removendo arquivos de lock e iniciando cópia...")
    for ext in ["", "-wal", "-shm"]:
        f_del = live_db + ext
        if os.path.exists(f_del):
            os.remove(f_del)
    shutil.copyfile(snapshot_db, live_db)
    t_copia_end = time.time()
    
    # Verificação de integridade e checksum
    current_hash = compute_sha256(live_db)
    assert current_hash == snap_hash, "Checksum do banco restaurado diverge do snapshot!"
    
    conn_chk = sqlite3.connect(live_db)
    cur_chk = conn_chk.cursor()
    cur_chk.execute("PRAGMA integrity_check;")
    integrity = cur_chk.fetchone()[0]
    conn_chk.close()
    assert integrity == "ok", f"Integridade inválida: {integrity}"
    
    # T2 — Banco Restaurado e Íntegro
    t2 = time.time()
    print(f"[{time.strftime('%H:%M:%S')}] T2 — Banco restaurado e verificado: SHA-256 e PRAGMA integrity_check = OK.")
    
    # T3 — Disponibilização e Consulta Operacional Real Bem-Sucedida
    # Abrir nova conexão em modo operacional simulando a interface da escola
    conn_live = sqlite3.connect(live_db)
    cur_live = conn_live.cursor()
    cur_live.execute("SELECT count(*) FROM students WHERE classId = '1EM-A-H01';")
    total_active_students = cur_live.fetchone()[0]
    cur_live.execute("SELECT name FROM students ORDER BY id LIMIT 1;")
    first_student_name = cur_live.fetchone()[0]
    conn_live.close()
    
    t3 = time.time()
    print(f"[{time.strftime('%H:%M:%S')}] T3 — Serviço disponibilizado. Consulta operacional bem-sucedida ({total_active_students} alunos recuperados).")
    
    # Cálculos exatos em milissegundos
    duracao_copia_ms = round((t_copia_end - t1) * 1000, 2)
    duracao_verificacao_ms = round((t2 - t_copia_end) * 1000, 2)
    duracao_disponibilizacao_ms = round((t3 - t2) * 1000, 2)
    duracao_deteccao_ms = round((t1 - t0) * 1000, 2)
    rto_total_ms = round((t3 - t0) * 1000, 2)
    
    print("\n" + "-" * 80)
    print("📊 RESULTADOS DETALHADOS DA INSTRUMENTAÇÃO TEMPORAL (4 MARCAÇÕES)")
    print("-" * 80)
    print(f"   • T0 (Detecção da Falha)          : {t0:.6f} s")
    print(f"   • T1 (Início da Restauração)       : {t1:.6f} s (Delta T1-T0: {duracao_deteccao_ms} ms)")
    print(f"   • Cópia Física em Disco (SSD)      : {duracao_copia_ms} ms")
    print(f"   • Verificação (Hash + Integridade) : {duracao_verificacao_ms} ms")
    print(f"   • T2 (Banco Restaurado & Íntegro)  : {t2:.6f} s")
    print(f"   • Disponibilização & Consulta Real : {duracao_disponibilizacao_ms} ms")
    print(f"   • T3 (Interface/Serviço Disponível): {t3:.6f} s")
    print("-" * 80)
    print(f"🎯 RTO OPERACIONAL REAL MEDIDO (T3 - T0): {rto_total_ms} ms")
    print("=" * 80 + "\n")
    
    # Salvar métricas no pacote de evidências
    metrics_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "homologacao", "H-01", "evidencias-backup-restauracao", "metricas-dr.json"))
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump({
            "metodologia": "Protocolo de 4 Marcações Temporais (T0, T1, T2, T3)",
            "T0_deteccao_falha_ts": t0,
            "T1_inicio_restauracao_ts": t1,
            "T2_banco_integro_ts": t2,
            "T3_servico_disponivel_ts": t3,
            "tempo_deteccao_ms": duracao_deteccao_ms,
            "tempo_copia_disco_ms": duracao_copia_ms,
            "tempo_verificacao_integridade_ms": duracao_verificacao_ms,
            "tempo_disponibilizacao_servico_ms": duracao_disponibilizacao_ms,
            "rto_operacional_total_ms": rto_total_ms,
            "rpo_delimitado": "Estado contido no snapshot de backup em T0; transações posteriores dependem de conciliação de log",
            "alunos_recuperados": total_active_students,
            "primeiro_aluno": first_student_name,
            "integridade_pos_restauracao": integrity
        }, f, indent=2, ensure_ascii=False)
        
    shutil.rmtree(workspace)
    return rto_total_ms, duracao_copia_ms, duracao_verificacao_ms, duracao_disponibilizacao_ms

if __name__ == "__main__":
    measure_rto()
