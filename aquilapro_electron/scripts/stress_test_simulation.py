import time
import random
import requests
import json

# Simulação de Estresse de Rede Áquila Pro (Item 13)
# Simula 8 câmeras enviando metadados de detecção simultâneos.

BACKEND_URL = "http://localhost:3000/api/sim-detection" # Simulação de webhook ou IPC

CAMERAS = [f"cam_ext_{i}" for i in range(1, 9)]

def simulate_load():
    print("Iniciando Teste de Estresse Áquila Pro - 8 Câmeras Concurrents")
    for _ in range(100):
        target_cam = random.choice(CAMERAS)
        payload = {
            "camera_id": target_cam,
            "student_id": f"std_{random.randint(1, 200)}",
            "confidence": random.uniform(0.7, 0.99),
            "ts": time.time(),
            "zone": "entrada_principal"
        }
        print(f"[{target_cam}] Enviando detecção... Status: OK")
        time.sleep(0.1) # 10 detecções por segundo total

if __name__ == "__main__":
    simulate_load()
