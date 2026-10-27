#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/build_eval_harness.py — Benchmark Fechado de Avaliação (Eval Harness 100 Tarefas)
Constrói o benchmark rigoroso de avaliação comparativa (Base vs LoRA vs RAG):
- 40 tarefas de Matemática/Física (raciocínio passo a passo, equações LaTeX).
- 30 tarefas de Linguagens/Redação/BNCC (análise textual, competências).
- 30 tarefas de Código Electron/TypeScript (contratos, IPC, resiliência).
"""

import os
import json
import argparse
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
OUTPUT_EVAL = ROOT_DIR / "swarm" / "dataset" / "eval_harness_100.json"

TASKS = [
    # ═══ BLOCO 1: MATEMÁTICA / FÍSICA (40 TAREFAS) ═══
    {
        "task_id": f"EVAL-STEM-{i:03d}",
        "category": "STEM",
        "bncc": "EM13MAT101" if i % 2 == 0 else "EM13CNT301",
        "difficulty": "medium" if i < 25 else "hard",
        "prompt": f"Problema STEM {i}: Demonstre passo a passo a resolução física e matemática com equações completas para equilíbrio estático com torque resultante nulo sob ação de força F={10*i} N.",
        "expected_answer": f"A condição fundamental de equilíbrio exige tanto a força resultante nula quanto o torque resultante nulo: $\\sum \\vec{{F}} = 0$ e $\\sum \\vec{{\\tau}} = 0$.",
        "rubric": ["correctness", "reasoning_steps", "latex_validity", "no_hallucinated_constants"]
    }
    for i in range(1, 41)
] + [
    # ═══ BLOCO 2: LINGUAGENS / REDAÇÃO / BNCC (30 TAREFAS) ═══
    {
        "task_id": f"EVAL-HUMANITIES-{i:03d}",
        "category": "Humanities",
        "bncc": f"EM13LGG{100+i}",
        "difficulty": "medium",
        "prompt": f"Análise BNCC {i}: Avalie a coerência argumentativa, o repertório sociocultural legítimo e a proposta de intervenção social com os 5 elementos formais.",
        "expected_answer": "A proposta de intervenção deve apresentar os 5 elementos: agente, ação, meio/modo, efeito e detalhamento, respeitando integralmente os direitos humanos.",
        "rubric": ["bncc_alignment", "rubric_adherence", "absence_of_anachronism", "clarity"]
    }
    for i in range(1, 31)
] + [
    # ═══ BLOCO 3: CÓDIGO ELECTRON / TYPESCRIPT (30 TAREFAS) ═══
    {
        "task_id": f"EVAL-CODE-{i:03d}",
        "category": "Code",
        "bncc": "DEV-ARCH-001",
        "difficulty": "hard",
        "prompt": f"Engenharia de Código {i}: Implemente a validação estrita de tipos para canal IPC Electron evitando memory leak com canal de retorno tipado e tratamento no ErrorBoundary.",
        "expected_answer": "ipcMain.handle com tipagem forte e remoção de listeners em componentWillUnmount ou useEffect cleanup.",
        "rubric": ["typescript_strictness", "error_boundary_safety", "no_memory_leak", "ipc_contract"]
    }
    for i in range(1, 31)
]

def generate_eval_harness(dry_run: bool = False, samples: int = None):
    print(f"[*] Gerando Eval Harness com {len(TASKS)} tarefas heldout...")
    selected = TASKS[:samples] if samples else TASKS

    manifest = {
        "benchmark_name": "aquila_eval_harness_100",
        "version": "1.0.0",
        "total_tasks": len(selected),
        "split": "heldout_test",
        "categories": {
            "STEM": len([t for t in selected if t["category"] == "STEM"]),
            "Humanities": len([t for t in selected if t["category"] == "Humanities"]),
            "Code": len([t for t in selected if t["category"] == "Code"])
        },
        "models_evaluated": ["base_llama_3_8b", "lora_aquila_v2", "base_rag_sqlite_vec"],
        "tasks": selected
    }

    if dry_run:
        print(f"[*] Modo Dry-Run ativo. {len(selected)} tarefas simuladas com sucesso.")
        return True

    OUTPUT_EVAL.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_EVAL, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"[OK] Eval Harness gerado em: {OUTPUT_EVAL}")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Gerador do Eval Harness 100 Tarefas Áquila Pro")
    parser.add_argument("--dry-run", action="store_true", help="Executa sem salvar arquivo")
    parser.add_argument("--samples", type=int, default=None, help="Limite de amostras para teste rápido")
    args = parser.parse_args()

    generate_eval_harness(dry_run=args.dry_run, samples=args.samples)
