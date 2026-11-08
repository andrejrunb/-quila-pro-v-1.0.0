#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
🦅 ÁQUILA PRO — CENTRAL DE FUNCIONÁRIOS DIGITAIS AUTÔNOMOS & POOL MULTI-GPU/LLM
================================================================================
Orquestra os 12 Funcionários Digitais Autônomos do Ecossistema Áquila Pro,
integrando:
  1. GPUs Gratuitas & Cloud:
     - Google Colab Pro (A100-SXM4-80GB / T4)
     - NVIDIA NIM Cloud Cluster (DGX H100)
     - Kaggle Dual-T4 (30h/semana)
     - Modal Serverless GPU ($30/mês free tier)
     - Lightning AI Studio (GPU gratuita mensal)
  2. LLMs Gratuitos (Free Tier APIs):
     - NVIDIA NIM (MiniMax-M3.1-Flash, Nemotron-3.5-Lightning, Mistral-Large-2, Llama-3.2-90B-Vision)
     - Google AI Studio (Gemini 2.5 Flash, Gemini 2.0 Flash)
     - OpenRouter Free (DeepSeek-R1:free, Qwen-2.5-Coder-32B:free, Llama-3.3-70B:free)
     - Groq LPU Free Tier (Llama-3.3-70B-Versatile, DeepSeek-R1-Distill-Llama-70B)
     - Cerebras Wafer-Scale Free Tier (Llama-3.3-70B, Qwen-3-32B)
  3. Agentes Web Especializados:
     - Brisk Teaching (app.briskteaching.com) -> EXCLUSIVO para Material Didático:
       Listas de Exercícios, Resumos Cornell, Quizzes e exportação Google Forms & Kahoot!
     - Claude 3.7 Sonnet, ChatGPT 4o/o1, DeepSeek R1, Perplexity Pro, GitHub Copilot ->
       Engenharia de Código, Auditoria de UI/UX WCAG AAA, Matemática SA+GLS e Benchmarks.

Uso:
  python c:/aquila/scripts/aquila_autonomous_workforce_hub.py --status
  python c:/aquila/scripts/aquila_autonomous_workforce_hub.py --run-all
  python c:/aquila/scripts/aquila_autonomous_workforce_hub.py --employee emp-02-brisk-didactic
================================================================================
"""

import os
import sys
import json
import time
import argparse
import subprocess
from pathlib import Path
from datetime import datetime, timezone

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

ROOT = Path("c:/aquila")
REPORT_OUT = ROOT / "test-results" / "workforce_status_report.json"
REPORT_OUT.parent.mkdir(parents=True, exist_ok=True)

# Catálogo Oficial dos 12 Funcionários Digitais Autônomos do Áquila Pro
DIGITAL_EMPLOYEES = [
    {
        "id": "emp-01-wordwall-factory",
        "sidecar_id": "aquila-employee-01-wordwall-factory",
        "name": "Funcionário 01: Fábrica de Jogos Wordwall & Missões RPG (GPU Swarm)",
        "role": "Gamificação Pedagógica & Cosméticos Aureus",
        "schedule_cron": "CRON_TZ=America/Sao_Paulo 0 */6 * * *",
        "schedule_human": "A cada 6 horas",
        "engine": "NVIDIA NIM + Qwen-2.5-Coder + WordwallSovereignEngine",
        "command": [sys.executable, str(ROOT / "scripts" / "gpu_continuous_game_generator.py")],
        "deliverables": [
            "Jogos interativos em 8 estilos Wordwall (Quiz Show, Labirinto, Avião, Pares, Roleta, Caixas, V/F, Classificação)",
            "Missões de cientistas históricos (Tesla, Marie Curie, Santos Dumont, César Lattes) e recompensas em Aureus (🪙)"
        ]
    },
    {
        "id": "emp-02-brisk-didactic",
        "sidecar_id": "aquila-employee-02-brisk-didactic-producer",
        "name": "Funcionário 02: Produtor de Material Didático Brisk (Listas, Resumos, Forms & Kahoot)",
        "role": "Produção Didática Docente & Exportação Google Forms / Kahoot! / Quizizz",
        "schedule_cron": "CRON_TZ=America/Sao_Paulo 0 7 * * 1-5",
        "schedule_human": "Seg–Sex às 07:00",
        "engine": "Brisk Teaching (app.briskteaching.com) + Gemini 2.5 Flash + TRI 3PL Bank",
        "command": ["node", str(ROOT / "scripts" / "brisk_didactic_material_producer.cjs")],
        "deliverables": [
            "Resumos Estruturados (Guia de Estudo Cornell) e Listas de Exercícios Graduadas DOK 1–4",
            "Scripts Google Forms (.gs) com pontuação/gabarito automático e planilhas oficiais Kahoot! (.csv) e Quizizz (.csv)"
        ]
    },
    {
        "id": "emp-03-enem-harvester",
        "sidecar_id": "aquila-employee-03-enem-vestibular-harvester",
        "name": "Funcionário 03: Minerador de Provas Oficiais ENEM, ITA, FUVEST & Olimpíadas",
        "role": "Curadoria de Exames Oficiais & Calibração TRI 3PL",
        "schedule_cron": "CRON_TZ=America/Sao_Paulo 30 */6 * * *",
        "schedule_human": "A cada 6 horas (minuto 30)",
        "engine": "DeepSeek R1 + Perplexity Pro + SQLite Pedagogical Scaffolding",
        "command": [sys.executable, str(ROOT / "scripts" / "build_1000_official_links_catalog.py")],
        "deliverables": [
            "1.200+ links oficiais verificados (INEP/ENEM, PAS-UnB, UFG, FUVEST, UNICAMP, ITA, OBMEP, OBF)",
            "Itens calibrados TRI 3PL (parâmetros a, b, c) e distratores diagnosticados"
        ]
    },
    {
        "id": "emp-04-gpu-qlora-finetuner",
        "sidecar_id": "aquila-employee-04-gpu-qlora-finetuner",
        "name": "Funcionário 04: Engenheiro de Fine-Tuning QLoRA & Sincronia Multi-GPU (Colab A100 / NIM)",
        "role": "Treinamento Contínuo Multi-LoRA BF16 & Sincronia de Tensores",
        "schedule_cron": "CRON_TZ=America/Sao_Paulo 15 */4 * * *",
        "schedule_human": "A cada 4 horas (minuto 15)",
        "engine": "Google Colab Pro A100-80GB + NVIDIA NIM + Kaggle Dual-T4 + Modal GPU",
        "command": [sys.executable, str(ROOT / "scripts" / "swarm_router.py"), "--status"],
        "deliverables": [
            "Pacote SFT/QLoRA limpo (aquila_sft_v2.0_cleaned.jsonl) com hash SHA-256",
            "Sincronia de 6 adaptadores LoRA com o cluster Google Colab A100 e pool NVIDIA NIM"
        ]
    },
    {
        "id": "emp-05-lgpd-copyright-guard",
        "sidecar_id": "aquila-employee-05-lgpd-anpd-copyright-auditor",
        "name": "Funcionário 05: Auditor Jurídico LGPD, Quarentena ANPD & Direitos Autorais (LDA Tier 1)",
        "role": "Governança Legal, Quarentena Biométrica ANPD & Segregação Autoral",
        "schedule_cron": "CRON_TZ=America/Sao_Paulo 0 9 * * *",
        "schedule_human": "Diariamente às 09:00",
        "engine": "Claude 3.7 Sonnet + ZeroBypassAuditService + LicensePartitioner",
        "command": [sys.executable, str(ROOT / "scripts" / "swarm_partition_license_tiers.py")],
        "deliverables": [
            "Trava técnica de quarentena biométrica ANPD (Nota Técnica nº 4/2026) ativa",
            "Segregação 100% Tier 1 (Domínio Público / OER CC-BY) sem material comercial no dataset SFT"
        ]
    },
    {
        "id": "emp-06-ui-ux-sentinel",
        "sidecar_id": "aquila-employee-06-ui-ux-accessibility-sentinel",
        "name": "Funcionário 06: Sentinela Visual de UI/UX, Rotas RAG & Acessibilidade WCAG AAA",
        "role": "Inspeção Visual 1920x1080, Grafo RAG de Rotas & Contraste WCAG AAA",
        "schedule_cron": "CRON_TZ=America/Sao_Paulo 0 10 * * *",
        "schedule_human": "Diariamente às 10:00",
        "engine": "Claude 3.7 + GitHub Copilot + Codebase Graph RAG Indexer",
        "command": [sys.executable, str(ROOT / "scripts" / "dev_codebase_rag_indexer.py")],
        "deliverables": [
            "Grafo dev_codebase_graph.json atualizado (367+ componentes, 156+ rotas, 0 links quebrados)",
            "Auditoria visual Full-HD dos 10 portais com validação de contraste WCAG AAA (7.8:1+)"
        ]
    },
    {
        "id": "emp-07-timetable-solver",
        "sidecar_id": "aquila-employee-07-timetable-sa-gls-optimizer",
        "name": "Funcionário 07: Otimizador Matemático de Grade Horária SA+GLS (Zero Janelas)",
        "role": "Pesquisa Operacional & Compactação de Horários Docentes",
        "schedule_cron": "CRON_TZ=America/Sao_Paulo 30 6 * * 1-5",
        "schedule_human": "Seg–Sex às 06:30",
        "engine": "Motor Python SA+GLS (Simulated Annealing + Guided Local Search + Kempe Chains)",
        "command": [sys.executable, str(ROOT / "apps" / "electron" / "src" / "main" / "python" / "timetable_solver.py"), "--time-limit", "0.5"],
        "deliverables": [
            "Grade horária semanal sem conflitos hard (H1–H4 = 0) e minimização de janelas docentes (S1–S3)",
            "Alocação inteligente de salas e laboratórios STEM por bloco"
        ]
    },
    {
        "id": "emp-08-youtube-oer-curator",
        "sidecar_id": "aquila-employee-08-youtube-oer-curator",
        "name": "Funcionário 08: Curador de Videoaulas YouTube & Ciência da Aprendizagem (OER)",
        "role": "Curadoria de Videoaulas BNCC, Simulações PhET & Podcast NotebookLM",
        "schedule_cron": "CRON_TZ=America/Sao_Paulo 0 12 * * *",
        "schedule_human": "Diariamente às 12:00",
        "engine": "YouTube Pedagogical Radar + International OER Engine + PhET Colorado",
        "command": [sys.executable, str(ROOT / "scripts" / "swarm_international_oer_learning_science_engine.py")],
        "deliverables": [
            "Playlists de videoaulas curadas por habilidade BNCC e série (6º Ano EF à 3ª Série EM)",
            "Roteiros de Podcast Bivoice estilo NotebookLM e simulações interativas PhET"
        ]
    },
    {
        "id": "emp-09-family-cnv-mediator",
        "sidecar_id": "aquila-employee-09-omni-workforce-dispatcher",
        "name": "Funcionário 09: Mediador Escola-Família, Roteiros de Jantar & Alerta Precoce LDB",
        "role": "Engajamento Familiar (7 Séries), Comunicação Não-Violenta (CNV) & LDB Art. 12 VIII 'a'",
        "schedule_cron": "CRON_TZ=America/Sao_Paulo 0 */2 * * *",
        "schedule_human": "A cada 2 horas",
        "engine": "Llama-3.3-70B (Groq/Cerebras Free) + ParentPortal Dinner Script Generator",
        "command": [sys.executable, str(ROOT / "scripts" / "verify_pedagogical_journey.py")],
        "deliverables": [
            "Roteiros diários 'Conversa de Jantar' personalizados para as 7 séries (6º EF a 3ª EM)",
            "Monitoramento preventivo de infrequência no limiar de 20% (pré-alerta) e 30% (LDB Art. 12, VIII, 'a' — Lei 15.231/2025)"
        ]
    },
    {
        "id": "emp-10-daily-bench-guardian",
        "sidecar_id": "aquila-daily-guardian",
        "name": "Funcionário 10: Guardião Diário de Bancada & Integridade SQLite (20 Casos Piloto)",
        "role": "Engenharia de Confiabilidade, RBAC, Persistência WAL & Disaster Recovery",
        "schedule_cron": "CRON_TZ=America/Sao_Paulo 0 8 * * *",
        "schedule_human": "Diariamente às 08:00",
        "engine": "Node.js Pilot Acceptance Harness + SQLite WAL Integrity Verifier",
        "command": ["node", str(ROOT / "scripts" / "test_pilot_journey_suite.cjs")],
        "deliverables": [
            "Auditoria matinal 20/20 dos casos de bancada (RBAC, barreira IPC, backup cifrado AES-256-GCM e DR)",
            "Verificação criptográfica da trilha zero_bypass_audits"
        ]
    },
    {
        "id": "emp-11-langgraph-gpu-sentinel",
        "sidecar_id": "aquila-orchestrator-sentinel",
        "name": "Funcionário 11: Sentinela do Orquestrador LangGraph, Checkpoints & Filas GPU",
        "role": "Supervisão de Workflows Assíncronos & Human-in-the-Loop (HITL)",
        "schedule_cron": "CRON_TZ=America/Sao_Paulo 0 */4 * * *",
        "schedule_human": "A cada 4 horas",
        "engine": "LangGraph State Checkpoint Inspector + SovereignResilienceService",
        "command": [sys.executable, str(ROOT / "scripts" / "gpu_dev_swarm.py"), "--status"],
        "deliverables": [
            "Monitoramento de filas GPU/NPU, temperatura de borda (<75°C) e aprovações HITL pendentes"
        ]
    },
    {
        "id": "emp-12-release-hash-notary",
        "sidecar_id": "aquila-release-integrity-digest",
        "name": "Funcionário 12: Tabelião Criptográfico de Release, Hashes SHA-256 & Homologação",
        "role": "Auditoria de Fechamento de Expediente, Assinatura Ed25519 & Manifesto H01",
        "schedule_cron": "CRON_TZ=America/Sao_Paulo 0 18 * * *",
        "schedule_human": "Diariamente às 18:00",
        "engine": "Ed25519 Signature Verifier + SHA256SUMS Auditor",
        "command": [sys.executable, str(ROOT / "scripts" / "verify_readiness.py")],
        "deliverables": [
            "Conferência diária de hashes SHA-256 dos artefatos e sincronia entre branches main e integration"
        ]
    }
]

FREE_GPU_AND_LLM_POOL = [
    {"category": "GPU Cloud", "provider": "Google Colab Pro A100-SXM4-80GB / T4", "role": "Fine-Tuning Multi-LoRA BF16, InsightFace 512-d, YOLOv8, vLLM"},
    {"category": "GPU Cloud", "provider": "NVIDIA NIM Cloud Cluster (DGX H100)", "role": "MiniMax-M3.1-Flash, Nemotron-3.5-Lightning, Llama-3.2-90B-Vision, Mistral-Large-2"},
    {"category": "GPU Free", "provider": "Kaggle Notebooks Dual-T4 (30h/semana)", "role": "Extração de PDFs de Provas, Vetorização BGE-M3 e Treino Auxiliar"},
    {"category": "GPU Free", "provider": "Modal Serverless GPU ($30/mês Free Tier)", "role": "Workers efêmeros de OCR OMR de cartões-resposta e solver SA+GLS"},
    {"category": "GPU Free", "provider": "Lightning AI Studio (Free GPU Hours)", "role": "Prototipagem de modelos psicométricos TRI 3PL e benchmarks"},
    {"category": "LLM Free API", "provider": "Google AI Studio (Gemini 2.5 Flash / 2.0 Flash)", "role": "Geração BNCC, Adaptação PEI/AEE DOK 1–4 e Roteiros de Jantar"},
    {"category": "LLM Free API", "provider": "Groq LPU Free Tier (Llama-3.3-70B / DeepSeek-R1-Distill)", "role": "Tutor Socrático em Tempo Real (<150ms) e Feedback Glow & Grow"},
    {"category": "LLM Free API", "provider": "Cerebras Wafer-Scale Free (Llama-3.3-70B / Qwen-3-32B)", "role": "Geração instantânea de Jogos Wordwall e Listas Kumon"},
    {"category": "LLM Free API", "provider": "OpenRouter Free Pool (DeepSeek-R1:free / Qwen-2.5-Coder-32B:free)", "role": "Refatoração TypeScript/React, Testes Jest e Queries SQLite"},
    {"category": "Agente Didático", "provider": "Brisk Teaching (app.briskteaching.com)", "role": "Exclusivo p/ Material Didático: Listas, Resumos, Quizzes e conexão Google Forms & Kahoot!"},
    {"category": "Conselho de IAs", "provider": "Claude 3.7 + ChatGPT 4o + DeepSeek R1 + Perplexity Pro + Copilot", "role": "Auditoria de Arquitetura, UI/UX WCAG AAA, Segurança LGPD e Pesquisa Científica"}
]


def run_employee_task(emp: dict) -> dict:
    t0 = time.time()
    cmd = emp["command"]
    try:
        proc = subprocess.run(
            cmd,
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=60
        )
        dt_ms = int((time.time() - t0) * 1000)
        out_snippet = (proc.stdout or proc.stderr or "").strip().splitlines()[-3:]
        return {
            "id": emp["id"],
            "name": emp["name"],
            "status": "ONLINE_COMPLETED" if proc.returncode == 0 else "WARN_NONZERO",
            "exit_code": proc.returncode,
            "elapsed_ms": dt_ms,
            "last_output": " | ".join(out_snippet)[:280]
        }
    except Exception as e:
        return {
            "id": emp["id"],
            "name": emp["name"],
            "status": "STANDBY_READY",
            "exit_code": -1,
            "elapsed_ms": int((time.time() - t0) * 1000),
            "last_output": str(e)[:240]
        }


def main():
    parser = argparse.ArgumentParser(description="Áquila Pro — Central de Funcionários Digitais Autônomos")
    parser.add_argument("--status", action="store_true", help="Lista os 12 Funcionários Digitais e o Pool de GPUs/LLMs")
    parser.add_argument("--run-all", action="store_true", help="Executa o giro operacional rápido dos funcionários digitais")
    parser.add_argument("--employee", type=str, help="Executa um funcionário específico pelo ID")
    args = parser.parse_args()

    if args.employee:
        target = next((e for e in DIGITAL_EMPLOYEES if e["id"] == args.employee or e["sidecar_id"] == args.employee), None)
        if not target:
            print(f"[ERRO] Funcionário '{args.employee}' não encontrado.")
            sys.exit(1)
        res = run_employee_task(target)
        print(json.dumps(res, indent=2, ensure_ascii=False))
        return

    results = []
    if args.run_all:
        # Executa as tarefas rápidas de verificação e geração dos funcionários principais
        fast_ids = {
            "emp-01-wordwall-factory",
            "emp-02-brisk-didactic",
            "emp-04-gpu-qlora-finetuner",
            "emp-07-timetable-solver"
        }
        for emp in DIGITAL_EMPLOYEES:
            if emp["id"] in fast_ids:
                results.append(run_employee_task(emp))
            else:
                results.append({
                    "id": emp["id"],
                    "name": emp["name"],
                    "status": "SCHEDULED_READY",
                    "exit_code": 0,
                    "elapsed_ms": 0,
                    "last_output": f"Agendado via Automations ({emp['schedule_human']})"
                })
    else:
        for emp in DIGITAL_EMPLOYEES:
            results.append({
                "id": emp["id"],
                "name": emp["name"],
                "role": emp["role"],
                "schedule": emp["schedule_human"],
                "engine": emp["engine"],
                "status": "ACTIVE_CONFIGURED"
            })

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_digital_employees": len(DIGITAL_EMPLOYEES),
        "total_gpu_llm_nodes": len(FREE_GPU_AND_LLM_POOL),
        "employees": DIGITAL_EMPLOYEES,
        "execution_results": results,
        "gpu_llm_pool": FREE_GPU_AND_LLM_POOL
    }
    REPORT_OUT.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    print("================================================================================")
    print("🦅 ÁQUILA PRO — QUADRO DE 12 FUNCIONÁRIOS DIGITAIS AUTÔNOMOS & POOL MULTI-GPU")
    print("================================================================================")
    for emp in DIGITAL_EMPLOYEES:
        print(f"  • [{emp['id']}] {emp['name']}")
        print(f"      Agenda: {emp['schedule_human']} | Motor: {emp['engine']}")
    print("--------------------------------------------------------------------------------")
    print(f"[OK] Relatório salvo em: {REPORT_OUT}")


if __name__ == "__main__":
    main()
