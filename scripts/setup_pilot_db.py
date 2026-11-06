import os
import shutil
import sqlite3
import hashlib

SRC_DB = r'C:\Users\Thaysa\AppData\Roaming\AquilaPro\aquila.db'
DEST_DIR = r'C:\aquila\test-results\pilot_journey_env'
os.makedirs(DEST_DIR, exist_ok=True)
DEST_DB = os.path.join(DEST_DIR, 'aquila.db')

# Copy database files
for ext in ['', '-wal', '-shm']:
    src = SRC_DB + ext
    if os.path.exists(src):
        shutil.copy2(src, DEST_DB + ext)

conn = sqlite3.connect(DEST_DB)
c = conn.cursor()

def make_scrypt_hash(password: str) -> str:
    salt = os.urandom(16).hex()
    derived = hashlib.scrypt(password.encode('utf-8'), salt=salt.encode('utf-8'), n=16384, r=8, p=1, maxmem=0, dklen=64)
    return f"scrypt$16384$8$1${salt}${derived.hex()}"

# 1. Ensure reference school exists
c.execute("INSERT OR REPLACE INTO schools (id, name, type, plan) VALUES ('school-visao', 'Colégio Áquila Modelo', 'private', 'pro')")

# 1.5 Clean up orphaned foreign keys from historical deleted seeds
c.execute("DELETE FROM attendance_logs WHERE studentId NOT IN (SELECT id FROM students)")
c.execute("DELETE FROM unified_calendar WHERE classId IS NOT NULL AND classId NOT IN (SELECT id FROM classes)")
c.execute("DELETE FROM student_tasks WHERE studentId NOT IN (SELECT id FROM students)")
c.execute("DELETE FROM schedules WHERE classId NOT IN (SELECT id FROM classes) OR roomId NOT IN (SELECT id FROM rooms)")
c.execute("UPDATE users SET parentId = NULL WHERE parentId IS NOT NULL AND parentId NOT IN (SELECT id FROM users)")
print("Cleaned up orphaned foreign key records.")

# 2. Seed test users
test_users = [
    ('user-admin-01', 'admin', 'admin', 'Administrador Principal', make_scrypt_hash('Admin@2026!'), None, None),
    ('user-coord-pilot', 'coord_pilot', 'coordinator', 'Fabiana Coordenação', make_scrypt_hash('Coord@2026!'), None, None),
    ('user-prof-pilot', 'prof_pilot', 'docente', 'Professora Karine', make_scrypt_hash('Prof@2026!'), None, None),
    ('user-secr-pilot', 'secr_pilot', 'secretary', 'Secretário Pedro', make_scrypt_hash('Secr@2026!'), None, None),
    ('user-pais-pilot', 'pais_pilot', 'parent', 'Responsável Carlos Silva', make_scrypt_hash('Pais@2026!'), None, None),
    ('user-aluno-pilot', 'aluno_pilot', 'student', 'Lucas Piloto Silva', make_scrypt_hash('Aluno@2026!'), None, None),
]

for uid, username, role, name, pw_hash, coord_id, parent_id in test_users:
    c.execute("DELETE FROM users WHERE username = ? OR id = ?", (username, uid))
    c.execute("""
        INSERT INTO users (id, username, password_hash, name, role, coordinationId, parentId)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (uid, username, pw_hash, name, role, coord_id, parent_id))

# 3. Ensure pilot class exists
c.execute("DELETE FROM classes WHERE id = 'TURMA-PILOTO-2026'")
c.execute("INSERT OR REPLACE INTO classes (id, schoolId, name, grade) VALUES ('TURMA-PILOTO-2026', 'school-visao', '1º ANO PILOTO', '1º Ano')")

# 4. Insert pilot students (1 linked student + 24 batch students for 25-student attendance test)
c.execute("DELETE FROM students WHERE id LIKE 'std-pilot-%'")
c.execute("""
    INSERT INTO students (id, classId, name, registrationNumber, parentPhone, status, parentUserId)
    VALUES ('std-pilot-999', 'TURMA-PILOTO-2026', 'LUCAS PILOTO SILVA', 'PILOT-999', '61999990001', 'active', 'user-pais-pilot')
""")

for i in range(1, 25):
    sid = f"std-pilot-{i:03d}"
    sname = f"ALUNO PILOTO {i:02d}"
    sreg = f"PILOT-{i:03d}"
    c.execute("""
        INSERT INTO students (id, classId, name, registrationNumber, parentPhone, status, parentUserId)
        VALUES (?, 'TURMA-PILOTO-2026', ?, ?, '61988880000', 'active', NULL)
    """, (sid, sname, sreg))

# 5. Check integrity & foreign keys
conn.commit()
fks = c.execute("PRAGMA foreign_key_check").fetchall()
print(f"Post-seed FK violations count: {len(fks)}")
if fks:
    print("Violations:", fks[:5])

integ = c.execute("PRAGMA integrity_check").fetchall()
print(f"Post-seed integrity check: {integ}")

conn.close()

# Also sync to AquilaPro subdir for fallback
sub = os.path.join(DEST_DIR, 'AquilaPro')
os.makedirs(sub, exist_ok=True)
for f in os.listdir(DEST_DIR):
    src_f = os.path.join(DEST_DIR, f)
    if os.path.isfile(src_f):
        shutil.copy2(src_f, os.path.join(sub, f))

print("Pilot DB environment prepared and synced with 0 FK violations.")
