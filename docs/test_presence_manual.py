import sys
import os
from datetime import datetime, timedelta

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from src.presence_tracker.presence_tracker import PresenceTracker, EventType

tracker = PresenceTracker()

student_id = "ALUNO_001"

print("Registrando ENTRADA...")
result1 = tracker.record_presence_event(
    student_id,
    "Sala 101",
    EventType.ENTRY
)
print(result1)

print("\nRegistrando SAÍDA...")
result2 = tracker.record_presence_event(
    student_id,
    "Banheiro",
    EventType.EXIT
)
print(result2)

print("\nLocalização atual do aluno:")
print(tracker.get_student_location(student_id))

print(tracker.generate_attendance_report(student_id))
print("Saiu cedo?", tracker.detect_left_school_early(student_id, expected_end_hour=12))
