#!/usr/bin/env python3
"""
Áquila Pro — Local AI Engine & Flint Integration
Permite carregar e executar modelos de código e raciocínio localmente no servidor
Áquila Edge (NPU 26 TOPS / GPU Local) sem vazamento de dados de estudantes (LGPD Art. 14).

Modelos Homologados:
1. RecursiveSI/flint (HuggingFace: RecursiveSI/flint) — Código e lógica ultra-rápida
2. LLaMA 3 8B Instruct / Alvorada-bench — Fine-tuning pedagógico
3. DeepSeek-Coder / Qwen2.5-Coder 7B — Refatoração e automações
"""

import os
import sys
import json
import argparse

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

MODELS_CATALOG = {
    "flint": {
        "repo_id": "RecursiveSI/flint",
        "description": "Recursive Flint: Modelo de codificação e raciocínio local ultra-rápido para borda",
        "type": "coding",
        "context_window": 8192,
        "npu_compatible": True,
        "recommended_quant": "Q4_K_M"
    },
    "alvorada": {
        "repo_id": "HenriqueGodoy/Alvorada-bench",
        "description": "Benchmark e pesos calibrados para matriz curricular brasileira e ENEM",
        "type": "pedagogical",
        "context_window": 8192,
        "npu_compatible": True,
        "recommended_quant": "Q5_K_M"
    },
    "locate_anything": {
        "repo_id": "nvidia/LocateAnything-3B",
        "description": "Detecção e localização visual em pátios e salas de aula",
        "type": "vision",
        "context_window": 4096,
        "npu_compatible": True,
        "recommended_quant": "FP16"
    }
}

def list_models():
    print("================================================================")
    print("🦅 ÁQUILA PRO — CATÁLOGO DE MODELOS LOCAIS SOBERANOS (EDGE IA)")
    print("================================================================")
    for key, info in MODELS_CATALOG.items():
        print(f"\nID: [{key}]")
        print(f"  Repositório: {info['repo_id']}")
        print(f"  Finalidade:  {info['description']}")
        print(f"  Tipo:        {info['type']} | NPU 26 TOPS: {info['npu_compatible']}")
        print(f"  Quantização: {info['recommended_quant']}")

def run_flint_check():
    print("\n[FLINT-ENGINE] Verificando ambiente de execução para RecursiveSI/flint...")
    has_torch = False
    try:
        import torch
        has_torch = True
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"  ✅ PyTorch detectado: v{torch.__version__} (Dispositivo: {device})")
    except ImportError:
        print("  ℹ️ PyTorch não instalado no ambiente global. Uso via GGUF/Ollama recomendado.")
    
    cache_dir = os.path.expanduser("~/.cache/huggingface/hub")
    print(f"  📁 Diretório de cache Hugging Face: {cache_dir}")
    print("  🚀 Para rodar via Ollama/GGUF:")
    print("     ollama run hf.co/RecursiveSI/flint")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Áquila Pro Local Model Runner")
    parser.add_argument("--list", action="store_true", help="Listar modelos homologados")
    parser.add_argument("--check-flint", action="store_true", help="Verificar ambiente para RecursiveSI/flint")
    args = parser.parse_args()

    if args.check_flint:
        run_flint_check()
    else:
        list_models()
