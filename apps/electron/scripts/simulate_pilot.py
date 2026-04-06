import json
import time
import random
from datetime import datetime

# simulate_pilot.py — Passo 16 do Roadmap.
# Simula a atividade do primeiro dia em uma escola piloto.

def simulate_day():
    print("--- [SIMULADOR ÁQUILA PRO] Iniciando Piloto #1 ---")
    
    students = [
        {"id": "std-001", "name": "Bernardo Silva", "zone": "entrada_principal"},
        {"id": "std-002", "name": "Valentina Oliveira", "zone": "entrada_principal"},
        {"id": "std-003", "name": "Enzo Gabriel", "zone": "sala_3a"},
        {"id": "std-004", "name": "Maria Eduarda", "zone": "saida_principal"}
    ]

    for i in range(10):
        student = random.choice(students)
        ts = datetime.now().strftime("%H:%M:%S")
        
        # Simula detecção facial
        detection = {
            "type": "face_detected",
            "student_id": student["id"],
            "name": student["name"],
            "zone": student["zone"],
            "confidence": round(random.uniform(0.85, 0.99), 2),
            "liveness_score": round(random.uniform(0.9, 1.0), 2),
            "ts": ts
        }
        
        print(f"[{ts}] Detecção: {student['name']} em {student['zone']} (IA: {detection['confidence']})")
        
        # Simula um ataque de spoofing ocasional
        if random.random() < 0.1:
            print(f"!!! [ALERTA] Tentativa de Fraude Detectada para Aluno ID {student['id']} !!!")
            
        time.sleep(1)

    print("--- Simulação de Piloto Concluída com Sucesso ---")

if __name__ == "__main__":
    simulate_day()
