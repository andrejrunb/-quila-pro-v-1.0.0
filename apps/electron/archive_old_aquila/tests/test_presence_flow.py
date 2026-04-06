import sys
import os
from datetime import datetime
import time

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from src.presence_tracker.presence_tracker import PresenceTracker, EventType

tracker = PresenceTracker()

student_id = "ALUNO_002"

print("ENTRADA na Sala 101")
tracker.record_presence_event(student_id, "Sala 101", EventType.ENTRY)
time.sleep(1)

print("TROCA para Sala 102")
tracker.record_presence_event(student_id, "Sala 102", EventType.ENTRY)
time.sleep(1)

print("SAÍDA da escola")
tracker.record_presence_event(student_id, "Portão", EventType.EXIT)

print("\nLocalização final:")
print(tracker.get_student_location(student_id))