#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
🦅 ÁQUILA PRO — COLAB TUNNEL MANAGER & GPU SYNCHRONIZER
================================================================================
Gerenciador dinâmico de conexões com o Google Colab Pro GPU (A100 / T4).
Permite atualizar a URL temporária do túnel Cloudflare com 1 comando, testar a
saúde da GPU (VRAM, InsightFace, YOLO) e persistir nos arquivos .env do ecossistema.

Uso:
  python scripts/colab_tunnel_manager.py --url https://xxx.trycloudflare.com
  python scripts/colab_tunnel_manager.py --test
  python scripts/colab_tunnel_manager.py --benchmark
================================================================================
"""

import os
import sys
import json
import time
import argparse
import urllib.request
import urllib.error
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
ENV_FILES = [ROOT / ".env", ROOT / "apps" / "electron" / ".env"]


def update_env_files(new_url: str):
    clean_url = new_url.strip().rstrip("/")
    for env_path in ENV_FILES:
        if not env_path.exists():
            env_path.write_text(f"COLAB_GPU_URL={clean_url}\n", encoding="utf-8")
            print(f"📄 Criado: {env_path.relative_to(ROOT)}")
            continue

        lines = env_path.read_text(encoding="utf-8", errors="ignore").splitlines()
        found = False
        new_lines = []
        for line in lines:
            if line.startswith("COLAB_GPU_URL="):
                new_lines.append(f"COLAB_GPU_URL={clean_url}")
                found = True
            else:
                new_lines.append(line)

        if not found:
            new_lines.append(f"COLAB_GPU_URL={clean_url}")

        env_path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
        print(f"✅ Atualizado: {env_path.relative_to(ROOT)} ➔ {clean_url}")


def test_colab_health(url: str) -> bool:
    clean_url = url.strip().rstrip("/") + "/health"
    print(f"📡 Testando conexão com Colab GPU em: {clean_url}...")
    t0 = time.time()
    try:
        req = urllib.request.Request(
            clean_url,
            headers={"ngrok-skip-browser-warning": "true", "User-Agent": "AquilaProDev/1.0"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            dt = int((time.time() - t0) * 1000)
            data = json.loads(resp.read().decode("utf-8"))
            print(f"🟢 [ONLINE] Resposta em {dt} ms!")
            gpu = data.get("gpu", {})
            print(f"   • Dispositivo: {gpu.get('device', 'NVIDIA GPU')}")
            print(f"   • VRAM Alocada: {gpu.get('allocated_gb', 0)} / {gpu.get('total_gb', 0)} GB ({gpu.get('utilization_pct', 0)}%)")
            caps = data.get("capabilities", {})
            print(f"   • InsightFace ArcFace: {'✅ Sim' if caps.get('face_recognition') else '❌ Não'}")
            print(f"   • YOLOv8 Detecção:   {'✅ Sim' if caps.get('object_detection') else '❌ Não'}")
            return True
    except Exception as e:
        print(f"🔴 [FALHA] Não foi possível conectar ao túnel: {e}")
        return False


def run_gpu_benchmark(url: str, matrix_size: int = 8192):
    clean_url = url.strip().rstrip("/") + f"/benchmark?size={matrix_size}"
    print(f"🚀 Disparando benchmark de multiplicação de matrizes ({matrix_size}x{matrix_size}) na GPU...")
    t0 = time.time()
    try:
        req = urllib.request.Request(
            clean_url,
            headers={"ngrok-skip-browser-warning": "true"}
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            dt = int((time.time() - t0) * 1000)
            data = json.loads(resp.read().decode("utf-8"))
            print(f"🟢 Benchmark concluído com sucesso!")
            print(f"   • GPU: {data.get('gpu')}")
            print(f"   • Potência Calculada: {data.get('tflops', 0):.2f} TFLOPs")
            print(f"   • Tempo de Execução: {data.get('time_ms', dt)} ms")
    except Exception as e:
        print(f"❌ Erro ao rodar benchmark: {e}")


def main():
    parser = argparse.ArgumentParser(description="Áquila Pro Colab Tunnel Manager")
    parser.add_argument("--url", type=str, help="Nova URL do túnel Cloudflare do Colab")
    parser.add_argument("--test", action="store_true", help="Testa a saúde da URL configurada atualmente")
    parser.add_argument("--benchmark", action="store_true", help="Roda teste de TFLOPs na GPU remota")

    args = parser.parse_args()

    current_url = os.environ.get("COLAB_GPU_URL", "")
    if not current_url:
        env_p = ROOT / ".env"
        if env_p.exists():
            for line in env_p.read_text(encoding="utf-8").splitlines():
                if line.startswith("COLAB_GPU_URL="):
                    current_url = line.split("=", 1)[1].strip()

    if args.url:
        print(f"🔧 Configurando nova URL do Google Colab: {args.url}")
        test_colab_health(args.url)
        update_env_files(args.url)
        return

    if args.benchmark:
        if not current_url:
            print("❌ Nenhuma COLAB_GPU_URL configurada.")
            sys.exit(1)
        run_gpu_benchmark(current_url)
        return

    if args.test or not len(sys.argv) > 1:
        if not current_url:
            print("❌ Nenhuma COLAB_GPU_URL configurada no .env.")
            sys.exit(1)
        test_colab_health(current_url)


if __name__ == "__main__":
    main()
