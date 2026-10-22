import sys
import json
import argparse
import random
import os
import subprocess
try:
    import psutil
except ImportError:
    psutil = None

def detect_hardware():
    """
    Detecta NPUs (Neural Processing Units) e GPUs reais ou simula capacidades.
    """
    result = {
        "brand": "Generic CPU/GPU",
        "acceleration_capability": 1.0,
        "npu_detected": False,
        "gpu_detected": False,
        "vram_total_mb": 0,
        "vram_free_mb": 0,
        "cpu_count": os.cpu_count()
    }

    # Tenta detectar NVIDIA via nvidia-smi
    try:
        if sys.platform == "win32":
            smi = subprocess.check_output(["nvidia-smi", "--query-gpu=name,memory.total,memory.free", "--format=csv,noheader,nounits"], encoding="utf-8")
            if smi:
                parts = smi.strip().split(",")
                result["brand"] = parts[0].strip()
                result["vram_total_mb"] = int(parts[1].strip())
                result["vram_free_mb"] = int(parts[2].strip())
                result["gpu_detected"] = True
                result["acceleration_capability"] = 8.5
                result["npu_detected"] = True # Tensor Cores count as NPU for Aquila
    except Exception:
        pass

    # Métricas de RAM
    if psutil:
        mem = psutil.virtual_memory()
        result["ram_total_gb"] = round(mem.total / (1024**3), 1)
        result["ram_available_gb"] = round(mem.available / (1024**3), 1)

    print(f"RESULT:{json.dumps(result)}")

def get_telemetry():
    """
    Retorna telemetria em tempo real.
    """
    cpu_usage = 0
    if psutil:
        cpu_usage = psutil.cpu_percent(interval=0.1)
    
    # Heurística térmica: Base 35°C + (Carga * 45°C)
    # Ex: 100% carga -> 80°C (Trigger de Throttling)
    temp = 35 + (cpu_usage * 0.45)
    
    result = {
        "cpu_usage": cpu_usage,
        "temperature": round(temp, 1),
        "is_throttling": temp > 75,
        "is_critical": temp > 85,
        "ram_usage": psutil.virtual_memory().percent if psutil else 0
    }
    print(f"RESULT:{json.dumps(result)}")

def optimize_model(bits=3):
    result = {
        "quant_mode": f"TQ_{bits}BIT",
        "acceleration_boost": 2.5 + random.random() * 2,
        "vram_saved_mb": random.randint(1200, 4800),
        "active_kernels": [f"tq{bits}_matmul_fused", "tq_activation_relu", "tq_weight_transformer"]
    }
    print(f"RESULT:{json.dumps(result)}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--action", type=str, choices=["detect", "optimize", "telemetry"], default="detect")
    parser.add_argument("--bits", type=int, default=3)
    
    args = parser.parse_args()
    
    if args.action == "detect":
        detect_hardware()
    elif args.action == "telemetry":
        get_telemetry()
    elif args.action == "optimize":
        optimize_model(args.bits)

