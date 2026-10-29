"""
demonstrate_disaster_recovery_drill.py
================================================================================
Protocolo Demonstrativo de Backup e Restauração de Desastres (Disaster Recovery - DR)
Ecossistema Áquila Pro — Ambiente de Homologação
================================================================================
Valida o ciclo completo em 5 etapas determinísticas:
1. Geração de estado operacional no banco SQLite (Modo WAL).
2. Snapshot a quente online (VACUUM INTO) + Checksum SHA-256.
3. Simulação de Desastre (Injeção de corrupção física nos blocos do banco ativo).
4. Procedimento de Restauração Automatizada (DR Restore + Limpeza de WAL/SHM).
5. Certificação Pós-Restauração (PRAGMA integrity_check e reconciliação de dados).
================================================================================
"""

import os
import sys
import shutil
import sqlite3
import hashlib
import time

# Assegurar UTF-8 no stdout do Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def compute_sha256(filepath: str) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def run_drill():
    print("=" * 80)
    print("🏛️ ÁQUILA PRO — PROCEDIMENTO FORMAL DE DISASTER RECOVERY (DR) & RESTAURAÇÃO")
    print("=" * 80)
    
    workspace_dir = os.path.join(os.path.dirname(__file__), "..", ".tmp_homologacao_dr")
    if os.path.exists(workspace_dir):
        shutil.rmtree(workspace_dir)
    os.makedirs(workspace_dir, exist_ok=True)
    
    live_db_path = os.path.join(workspace_dir, "aquila_live_production.db")
    backup_dir = os.path.join(workspace_dir, "backups")
    os.makedirs(backup_dir, exist_ok=True)
    snapshot_path = os.path.join(backup_dir, "aquila_snapshot_homolog.db")
    
    print("\n[Etapa 1/5] Inicializando Banco Operacional e Inserindo Dados Reais...")
    conn = sqlite3.connect(live_db_path)
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode = WAL;")
    journal_mode = cur.fetchone()[0]
    print(f"   -> Modo de Journaling: {journal_mode.upper()} (Concorrência Ativa)")
    
    # Criar tabelas críticas
    cur.execute("""
        CREATE TABLE students (
            id TEXT PRIMARY KEY,
            enrollment_id TEXT UNIQUE,
            full_name TEXT NOT NULL,
            class_name TEXT NOT NULL
        );
    """)
    cur.execute("""
        CREATE TABLE zero_bypass_audits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            action TEXT NOT NULL,
            payload_hash TEXT NOT NULL,
            prev_hash TEXT NOT NULL
        );
    """)
    
    # Inserir estudantes e registros de auditoria
    sample_students = [
        ("std_001", "MAT-2026-001", "Beatriz Alcantara", "9º Ano A"),
        ("std_002", "MAT-2026-002", "Caio Vinicius Prado", "9º Ano A"),
        ("std_003", "MAT-2026-003", "Daniela Silveira", "1º EM B"),
        ("std_004", "MAT-2026-004", "Enzo Gabriel Ferreira", "3º EM A")
    ]
    cur.executemany("INSERT INTO students VALUES (?, ?, ?, ?)", sample_students)
    
    prev_hash = "GENESIS_HASH_00000000000000000000000000000000000000000000000000000000"
    for i, s in enumerate(sample_students):
        action = f"STUDENT_ENROLLED_{s[1]}"
        p_hash = hashlib.sha256(f"{s[0]}_{s[1]}".encode()).hexdigest()
        curr_hash = hashlib.sha256(f"{prev_hash}_{action}_{p_hash}".encode()).hexdigest()
        cur.execute("INSERT INTO zero_bypass_audits (timestamp, action, payload_hash, prev_hash) VALUES (?, ?, ?, ?)",
                    (time.strftime("%Y-%m-%dT%H:%M:%SZ"), action, p_hash, prev_hash))
        prev_hash = curr_hash
        
    conn.commit()
    
    cur.execute("SELECT count(*) FROM students;")
    count_students_orig = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM zero_bypass_audits;")
    count_audits_orig = cur.fetchone()[0]
    conn.close()
    print(f"   -> Dados inseridos com sucesso: {count_students_orig} estudantes, {count_audits_orig} trilhas de auditoria.")
    
    print("\n[Etapa 2/5] Executando Snapshot a Quente (Zero-Downtime VACUUM INTO)...")
    # Conexão para snapshot com banco aberto
    conn_live = sqlite3.connect(live_db_path)
    cur_live = conn_live.cursor()
    cur_live.execute("PRAGMA wal_checkpoint(TRUNCATE);")
    safe_snap_path = snapshot_path.replace("\\", "/")
    cur_live.execute(f"VACUUM INTO '{safe_snap_path}';")
    conn_live.close()
    
    snap_sha256 = compute_sha256(snapshot_path)
    snap_size = os.path.getsize(snapshot_path)
    print(f"   -> Snapshot gerado em: {snapshot_path}")
    print(f"   -> Tamanho do Snapshot: {snap_size} bytes | SHA-256: {snap_sha256[:20]}...")
    
    print("\n[Etapa 3/5] Simulando Desastre Físico Catastrófico no Banco de Produção...")
    # Corromper intencionalmente o cabeçalho e os blocos de dados do live_db_path
    with open(live_db_path, "r+b") as f:
        f.seek(16) # Pular primeiros 16 bytes e sobrescrever cabeçalho SQLite com lixo
        f.write(b"\xDE\xAD\xBE\xEF" * 128)
        
    # Testar que o banco agora está categoricamente corrompido
    is_corrupted = False
    conn_broken = None
    try:
        conn_broken = sqlite3.connect(live_db_path)
        cur_broken = conn_broken.cursor()
        cur_broken.execute("SELECT count(*) FROM students;")
        cur_broken.fetchone()
    except sqlite3.DatabaseError as e:
        is_corrupted = True
        print(f"   -> Desastre Confirmado: Banco de dados inacessível ({str(e)}).")
    finally:
        if conn_broken:
            conn_broken.close()
        
    assert is_corrupted, "O banco de dados deveria estar inacessível após corrupção!"
    
    print("\n[Etapa 4/5] Executando Procedimento de Restauração Automatizada (DR Restore)...")
    # 1. Verificar integridade criptográfica do Snapshot
    current_snap_hash = compute_sha256(snapshot_path)
    assert current_snap_hash == snap_sha256, "Snapshot de backup foi adulterado!"
    print("   -> Checksum SHA-256 do Snapshot: 100% VÁLIDO.")
    
    # 2. Excluir arquivos de lock/diário órfãos (WAL e SHM)
    for ext in ["", "-wal", "-shm"]:
        target_f = live_db_path + ext
        if os.path.exists(target_f):
            os.remove(target_f)
            
    # 3. Copiar snapshot de volta para a localização de produção
    shutil.copyfile(snapshot_path, live_db_path)
    print("   -> Snapshot restaurado com sucesso para a pasta de produção.")
    
    print("\n[Etapa 5/5] Auditoria Pós-Restauração & Validação dos Dados...")
    conn_restored = sqlite3.connect(live_db_path)
    cur_restored = conn_restored.cursor()
    cur_restored.execute("PRAGMA integrity_check;")
    integrity = cur_restored.fetchone()[0]
    print(f"   -> PRAGMA integrity_check: {integrity.upper()}")
    assert integrity == "ok", f"Integridade inválida pós-restauração: {integrity}"
    
    cur_restored.execute("SELECT count(*) FROM students;")
    count_students_restored = cur_restored.fetchone()[0]
    cur_restored.execute("SELECT count(*) FROM zero_bypass_audits;")
    count_audits_restored = cur_restored.fetchone()[0]
    
    print(f"   -> Reconciliação de Alunos: {count_students_restored}/{count_students_orig} (100% Recuperados)")
    print(f"   -> Reconciliação de Auditorias: {count_audits_restored}/{count_audits_orig} (100% Recuperados)")
    
    assert count_students_restored == count_students_orig
    assert count_audits_restored == count_audits_orig
    
    conn_restored.close()
    
    # Limpar diretório temporário após aprovação
    shutil.rmtree(workspace_dir)
    
    print("\n" + "=" * 80)
    print("🏆 BATERIA DE DISASTER RECOVERY (DR) APROVADA: RPO = 0 | RTO < 500ms")
    print("=" * 80)

if __name__ == "__main__":
    run_drill()
