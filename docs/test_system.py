from presence_tracker import PresenceTracker, LocationType, EventType
import time

tracker = PresenceTracker()

# Registrar locais
sala1 = tracker.register_location("Sala 1", LocationType.CLASSROOM)
portao = tracker.register_location("Portão", LocationType.OUTSIDE)

student_id = "ALUNO_001"

print("\n=== SIMULAÇÃO DE PRESENÇA ===")

# Aluno entra na sala
tracker.record_presence_event(student_id, sala1, EventType.ENTRY)
print("Aluno entrou na sala")
time.sleep(2)

# Aluno sai da sala (intervalo)
tracker.record_presence_event(student_id, sala1, EventType.EXIT)
print("Aluno saiu da sala")
time.sleep(2)

# Aluno volta para sala
tracker.record_presence_event(student_id, sala1, EventType.ENTRY)
print("Aluno voltou para sala")
time.sleep(2)

# Aluno sai da escola
tracker.record_presence_event(student_id, portao, EventType.SCHOOL_EXIT)
print("Aluno saiu da escola")

# Gerar relatório
print("\n=== RELATÓRIO ===")
print(tracker.generate_attendance_report(student_id))

print("\nSaiu cedo?", tracker.detect_left_school_early(student_id, expected_end_hour=12))