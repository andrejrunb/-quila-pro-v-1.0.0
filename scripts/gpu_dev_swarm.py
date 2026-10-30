#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
🦅 ÁQUILA PRO — GPU DEVELOPER SWARM (ENGINEERING & CODE GENERATION ENGINE)
================================================================================
Motor de Desenvolvimento Acelerado por GPU para Construção do Ecossistema Áquila.
Utiliza os Supercomputadores da NVIDIA Cloud (DGX H100) e Google Colab Pro (A100)
para gerar código, auditar segurança, criar testes e arquitetar módulos sem
desperdiçar créditos ou quotas da LLM orquestradora.

Roles Especialistas:
  - coder: Implementação TypeScript, Node.js, SQLite WAL e componentes React.
  - architect: Design de arquitetura, contratos de interfaces e otimizações.
  - qa: Geração de baterias de testes unitários Jest e fluxos Playwright E2E.
  - security: Auditoria de vulnerabilidades, LGPD Art. 14, criptografia e bypasses.
  - vision: Visão computacional, OCR neural, modelos de embeddings e processamento gráfico.

Uso via CLI:
  python scripts/gpu_dev_swarm.py --role coder --prompt "Implemente o serviço..." --out-file path/to/file.ts
  python scripts/gpu_dev_swarm.py --role security --file apps/electron/src/main/services/AuthService.ts
  python scripts/gpu_dev_swarm.py --role qa --file apps/electron/src/main/services/TurnstileShadowService.ts
  python scripts/gpu_dev_swarm.py --status
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

# Modelos validados e operacionais na infraestrutura NVIDIA NIM (HTTP 200)
NVIDIA_ACTIVE_MODELS = {
    "coder": [
        "minimaxai/minimax-m3.1-flash",
        "nvidia/nemotron-3.5-lightning-30b-a3b",
        "meta/llama-3.2-90b-vision-instruct",
    ],
    "architect": [
        "minimaxai/minimax-m3.1-flash",
        "nvidia/nemotron-3.5-lightning-30b-a3b",
        "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    ],
    "qa": [
        "minimaxai/minimax-m3.1-flash",
        "nvidia/nemotron-3.5-lightning-30b-a3b",
    ],
    "security": [
        "minimaxai/minimax-m3.1-flash",
        "nvidia/nemotron-3.5-lightning-30b-a3b",
    ],
    "vision": [
        "meta/llama-3.2-90b-vision-instruct",
        "minimaxai/minimax-m3.1-flash",
    ],
}

SYSTEM_PROMPTS = {
    "coder": """Você é o Engenheiro Especialista em Código do Áquila Pro (GPU DGX H100).
Diretrizes Invioláveis:
1. Escreva código TypeScript/Node.js/React de nível de produção, limpo, tipado e sem 'any'.
2. Para SQLite use transações 'db.transaction(() => { ... })()' e queries preparadas.
3. Não use bibliotecas externas desnecessárias; priorize 'node:crypto', 'events' e 'fs'.
4. Retorne apenas o código solicitado ou diffs claros com explicações mínimas e objetivas.""",

    "architect": """Você é o Arquiteto de Sistemas Soberanos do Áquila Pro (GPU DGX H100).
Diretrizes Invioláveis:
1. Respeite os contratos de dados, isolamento de camadas (Main, Preload, Renderer) e arquitetura offline-first.
2. Siga as regras constitucionais: soberania local, criptografia AES-256-GCM / DPAPI e BSL 1.1.
3. Proponha soluções atômicas, de baixo acoplamento e altíssima resiliência.""",

    "qa": """Você é o Engenheiro de Qualidade & Testes Automatizados do Áquila Pro (GPU DGX H100).
Diretrizes Invioláveis:
1. Gere testes completos para Jest (unitários) ou Playwright (E2E no Electron nativo).
2. Cubra casos normais, casos de borda (edge cases), falhas de rede, dados corrompidos e concorrência.
3. Respeite os mocks existentes de SQLite, IPC e subprocessos Python.""",

    "security": """Você é o Guardião de Segurança da Informação & LGPD do Áquila Pro (GPU DGX H100).
Diretrizes Invioláveis:
1. Audite o código contra injeção SQL, memory leaks, bypass de autenticação, vazamento de PII e violações do Art. 14 da LGPD.
2. Certifique-se de que nenhum dado biométrico cru deixe o edge e que relés físicos respeitem o Modo Sombra.
3. Emita recomendações com severidade (CRITICAL, HIGH, MEDIUM) e código corrigido pronto para uso.""",

    "vision": """Você é o Engenheiro de Visão Computacional & Tensores do Áquila Pro (GPU A100).
Diretrizes Invioláveis:
1. Otimize pipelines de InsightFace (ArcFace 512-dim), YOLOv8, OCR neural e transformações matriciais.
2. Priorize inferência em lote (batching), DirectML local ou offload remoto via Colab A100.
3. Garanta tempo de resposta inferior a 50ms por quadro/face."""
}


def load_env() -> dict:
    env_vars = dict(os.environ)
    for env_file in [ROOT / ".env", ROOT / "apps" / "electron" / ".env"]:
        if env_file.exists():
            for line in env_file.read_text(encoding="utf-8", errors="ignore").splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip('"').strip("'")
                    if v and k not in env_vars:
                        env_vars[k] = v
    return env_vars


def query_nvidia_gpu_cluster(api_key: str, role: str, prompt: str, max_tokens: int = 2048) -> dict:
    if not api_key:
        raise ValueError("Chave NVIDIA_API_KEY ausente no ambiente ou .env")

    models = NVIDIA_ACTIVE_MODELS.get(role, NVIDIA_ACTIVE_MODELS["coder"])
    sys_prompt = SYSTEM_PROMPTS.get(role, SYSTEM_PROMPTS["coder"])
    url = "https://integrate.api.nvidia.com/v1/chat/completions"

    last_error = None
    for model in models:
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": max_tokens,
            "temperature": 0.2
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
        )

        t0 = time.time()
        try:
            with urllib.request.urlopen(req, timeout=35) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                dt_ms = int((time.time() - t0) * 1000)
                msg = data["choices"][0]["message"]
                
                # Suporte a reasoning_content de modelos com pensamento embutido
                content = msg.get("content") or ""
                reasoning = msg.get("reasoning_content") or ""
                final_text = content.strip() if content.strip() else reasoning.strip()

                return {
                    "success": True,
                    "model": model,
                    "latency_ms": dt_ms,
                    "response": final_text,
                    "reasoning": reasoning if content else "",
                    "tokens": data.get("usage", {}).get("total_tokens", 0)
                }
        except Exception as e:
            last_error = f"Modelo {model} falhou: {e}"
            continue

    raise RuntimeError(f"Todos os modelos da cadeia GPU NVIDIA falharam: {last_error}")


def query_colab_gpu_worker(colab_url: str, endpoint: str, payload: dict) -> dict:
    if not colab_url:
        raise ValueError("COLAB_GPU_URL não configurada no .env")

    clean_url = colab_url.rstrip("/") + endpoint
    req = urllib.request.Request(
        clean_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true"
        }
    )
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=45) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        dt_ms = int((time.time() - t0) * 1000)
        return {
            "success": True,
            "latency_ms": dt_ms,
            "data": data
        }


def check_swarm_status(env: dict):
    print("🦅 =========================================================================")
    print("   ÁQUILA PRO — STATUS DO CLUSTER DE DESENVOLVIMENTO ACELERADO POR GPU")
    print("=========================================================================\n")

    # 1. NVIDIA NIM Cloud (DGX H100)
    nvidia_key = env.get("NVIDIA_API_KEY", "")
    if nvidia_key:
        t0 = time.time()
        try:
            req = urllib.request.Request(
                "https://integrate.api.nvidia.com/v1/models",
                headers={"Authorization": f"Bearer {nvidia_key}"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                models_cnt = len(data.get("data", []))
                dt = int((time.time() - t0) * 1000)
                print(f"🟢 [NVIDIA Cloud DGX H100]: ONLINE ({dt} ms) — {models_cnt} supermodelos disponíveis")
                print("   Modelos de Engenharia Ativos:")
                for r, m_list in NVIDIA_ACTIVE_MODELS.items():
                    print(f"   • Role {r:9s} ➔ {m_list[0]}")
        except Exception as e:
            print(f"🔴 [NVIDIA Cloud DGX H100]: ERRO ({e})")
    else:
        print("🟡 [NVIDIA Cloud DGX H100]: CHAVE NÃO CONFIGURADA")

    # 2. Google Colab Pro (A100 / T4)
    colab_url = env.get("COLAB_GPU_URL", "")
    if colab_url:
        t0 = time.time()
        try:
            req = urllib.request.Request(
                colab_url.rstrip("/") + "/health",
                headers={"ngrok-skip-browser-warning": "true"}
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                dt = int((time.time() - t0) * 1000)
                h_data = json.loads(resp.read().decode("utf-8"))
                gpu_name = h_data.get("gpu", {}).get("device", "NVIDIA GPU")
                vram = h_data.get("gpu", {}).get("total_gb", 0)
                print(f"\n🟢 [Google Colab Pro GPU]: ONLINE ({dt} ms) ➔ {gpu_name} ({vram} GB VRAM)")
                print(f"   Endpoint: {colab_url}")
        except Exception as e:
            print(f"\n🟡 [Google Colab Pro GPU]: STANDBY / TÚNEL EXPIRADO ➔ {colab_url}")
            print(f"   Detalhe: {e}")
            print("   Dica: Inicie uma nova sessão no notebook colab/aquila_sovereign_engine.py")
    else:
        print("\n⚪ [Google Colab Pro GPU]: NÃO CONFIGURADO (Adicione COLAB_GPU_URL no .env)")

    # 3. Hardware Local Edge (DirectML / WMI)
    print("\n💻 [Hardware Edge Local]:")
    try:
        import subprocess
        wmi = subprocess.check_output(
            ["powershell", "-NoProfile", "-Command", "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name"],
            text=True, stderr=subprocess.DEVNULL
        ).strip()
        print(f"   Chip Gráfico Detectado: {wmi}")
        print("   Aceleração Suportada: DirectML (ONNX DmlExecutionProvider) / OpenCL")
    except Exception:
        print("   Chip Gráfico: Integrado")

    print("\n=========================================================================\n")


def main():
    parser = argparse.ArgumentParser(description="Áquila Pro GPU Developer Swarm")
    parser.add_argument("--role", choices=["coder", "architect", "qa", "security", "vision"], default="coder",
                        help="Papel do agente especialista")
    parser.add_argument("--prompt", type=str, help="Instrução direta para a GPU processar")
    parser.add_argument("--file", type=str, help="Arquivo a ser auditado, refatorado ou testado")
    parser.add_argument("--out-file", type=str, help="Caminho onde salvar a resposta gerada")
    parser.add_argument("--status", action="store_true", help="Diagnóstico detalhado dos clusters de GPU")
    parser.add_argument("--max-tokens", type=int, default=2048, help="Limite máximo de tokens")

    args = parser.parse_args()
    env = load_env()

    if args.status:
        check_swarm_status(env)
        return

    if not args.prompt and not args.file:
        parser.print_help()
        sys.exit(1)

    user_prompt = ""
    if args.file:
        file_path = Path(args.file)
        if not file_path.is_absolute():
            file_path = ROOT / file_path
        if not file_path.exists():
            print(f"❌ Arquivo não encontrado: {file_path}", file=sys.stderr)
            sys.exit(1)

        file_content = file_path.read_text(encoding="utf-8", errors="ignore")
        header = f"ARQUIVO: {file_path.name}\nCAMINHO: {file_path}\nCONTEÚDO:\n```\n{file_content}\n```\n\n"
        user_prompt = header + (args.prompt or "Analise minuciosamente este arquivo segundo sua especialidade, identificando melhorias e gerando o código otimizado.")
    else:
        user_prompt = args.prompt

    print(f"⚡ [GPU Swarm] Despachando tarefa para Role '{args.role}' no cluster NVIDIA DGX H100...")
    try:
        res = query_nvidia_gpu_cluster(
            api_key=env.get("NVIDIA_API_KEY", ""),
            role=args.role,
            prompt=user_prompt,
            max_tokens=args.max_tokens
        )

        print(f"✅ Concluído em {res['latency_ms']} ms via {res['model']} ({res['tokens']} tokens)")

        if args.out_file:
            out_p = Path(args.out_file)
            if not out_p.is_absolute():
                out_p = ROOT / out_p
            out_p.parent.mkdir(parents=True, exist_ok=True)
            out_p.write_text(res["response"], encoding="utf-8")
            print(f"💾 Resposta salva com sucesso em: {out_p}")
        else:
            print("\n" + "=" * 60)
            print(res["response"])
            print("=" * 60 + "\n")

    except Exception as e:
        print(f"❌ Erro ao despachar para a GPU: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
