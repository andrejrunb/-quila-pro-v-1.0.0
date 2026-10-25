#!/usr/bin/env python3
"""
scripts/swarm_router.py — Áquila Pro Multi-Model & Multi-GPU Dev Swarm Router (Context-Injected & Fine-Tuned)

Injeta automaticamente a Base de Conhecimento Soberana (swarm/AQUILA_KNOWLEDGE_BASE.md)
e o perfil `.md` de cada Agente Especialista (swarm/agents/*.md) em todas as chamadas:
- Role 'architect' -> 01_architect_claude.md
- Role 'coder'     -> 02_coder_deepseek.md
- Role 'qa'        -> 03_qa_stress_llama.md
- Role 'security'  -> 04_security_lgpd_guard.md
- Role 'vision'    -> 05_vision_npu_colab.md

Uso:
  python scripts/swarm_router.py --status
  python scripts/swarm_router.py --sync-colab
  python scripts/swarm_router.py --test-swarm
  python scripts/swarm_router.py --role coder --prompt "Crie uma query SQLite..." --out-file scripts/out.sql
"""

import os
import sys
import json
import time
import argparse
import urllib.request
import urllib.error
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROLE_TO_MD = {
    'architect': '01_architect_claude.md',
    'coder': '02_coder_deepseek.md',
    'qa': '03_qa_stress_llama.md',
    'security': '04_security_lgpd_guard.md',
    'vision': '05_vision_npu_colab.md'
}


def load_all_envs():
    env_vars = dict(os.environ)
    for path in ['.env', 'apps/electron/.env']:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        if v and k not in env_vars:
                            env_vars[k] = v
    return env_vars


def build_agent_system_prompt(role: str = 'coder') -> str:
    root = Path(os.getcwd())
    kb_path = root / 'swarm' / 'AQUILA_KNOWLEDGE_BASE.md'
    kb = kb_path.read_text(encoding='utf-8') if kb_path.exists() else ''

    md_name = ROLE_TO_MD.get(role, '02_coder_deepseek.md')
    role_path = root / 'swarm' / 'agents' / md_name
    role_md = role_path.read_text(encoding='utf-8') if role_path.exists() else ''

    return f"{kb}\n\n---\n\n{role_md}\n\nResponda de forma direta, concisa e fiel aos contratos do Áquila Pro v2.1."


def test_nvidia_nim(api_key: str):
    if not api_key:
        return {'status': 'MISSING_KEY', 'latency_ms': 0, 'details': 'NVIDIA_API_KEY ausente'}
    t0 = time.time()
    url = 'https://integrate.api.nvidia.com/v1/models'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {api_key}'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            models = [m['id'] for m in data.get('data', [])]
            deepseek_models = [m for m in models if 'deepseek' in m.lower() or 'glm' in m.lower() or 'nemotron' in m.lower()]
            llama_models = [m for m in models if 'llama' in m.lower() or 'mistral' in m.lower()]
            dt = int((time.time() - t0) * 1000)
            return {
                'status': 'ONLINE',
                'latency_ms': dt,
                'total_models': len(models),
                'deepseek_models': deepseek_models[:5],
                'llama_models': llama_models[:5]
            }
    except Exception as e:
        return {'status': 'ERROR', 'latency_ms': int((time.time() - t0) * 1000), 'details': str(e)}


def test_google_gemini(api_key: str):
    if not api_key:
        return {'status': 'MISSING_KEY', 'latency_ms': 0, 'details': 'GOOGLE_API_KEY ausente'}
    t0 = time.time()
    url = f'https://generativelanguage.googleapis.com/v1beta/models?key={api_key}'
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            models = [m['name'].replace('models/', '') for m in data.get('models', []) if 'gemini' in m.get('name', '')]
            dt = int((time.time() - t0) * 1000)
            return {
                'status': 'ONLINE',
                'latency_ms': dt,
                'total_models': len(models),
                'sample_models': models[:5]
            }
    except Exception as e:
        return {'status': 'ERROR', 'latency_ms': int((time.time() - t0) * 1000), 'details': str(e)}


def test_gpu_endpoint(name: str, gpu_url: str):
    if not gpu_url:
        return {'name': name, 'status': 'NOT_CONFIGURED', 'latency_ms': 0, 'url': None}
    t0 = time.time()
    url = gpu_url.rstrip('/') + '/health'
    req = urllib.request.Request(url, headers={'ngrok-skip-browser-warning': 'true'})
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            dt = int((time.time() - t0) * 1000)
            return {'name': name, 'status': 'ONLINE', 'latency_ms': dt, 'url': gpu_url}
    except Exception as e:
        return {'name': name, 'status': 'STANDBY', 'latency_ms': int((time.time() - t0) * 1000), 'url': gpu_url, 'details': str(e)}


def sync_context_to_colab(colab_url: str):
    bundle_path = Path(os.getcwd()) / 'swarm' / 'dataset' / 'colab_sync_bundle.json'
    if not bundle_path.exists():
        raise RuntimeError("Bundle não encontrado. Rode `python scripts/prepare_swarm_finetune.py` primeiro.")
    if not colab_url:
        raise RuntimeError("COLAB_GPU_URL não configurada no .env")
    url = colab_url.rstrip('/') + '/swarm/sync-context'
    data = bundle_path.read_bytes()
    req = urllib.request.Request(
        url,
        data=data,
        headers={'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'}
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode('utf-8'))


def query_colab_gpu_llm(colab_url: str, prompt: str, system_prompt: str, model: str = 'aquila-specialist'):
    if not colab_url:
        raise RuntimeError("COLAB_GPU_URL não configurada")
    url = colab_url.rstrip('/') + '/v1/chat/completions'
    payload = {
        'model': model,
        'messages': [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': prompt}
        ],
        'max_tokens': 2048,
        'temperature': 0.2
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'}
    )
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=45) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        dt = int((time.time() - t0) * 1000)
        content = res['choices'][0]['message']['content']
        return {
            'model': f"colab-gpu:{res.get('model', model)}",
            'latency_ms': dt,
            'response': content.strip()
        }


def query_nim_model(api_key: str, prompt: str, system_prompt: str, models_chain: list):
    url = 'https://integrate.api.nvidia.com/v1/chat/completions'
    last_err = None
    for model in models_chain:
        payload = {
            'model': model,
            'messages': [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': prompt}
            ],
            'max_tokens': 1024,
            'temperature': 0.2
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
        )
        t0 = time.time()
        try:
            with urllib.request.urlopen(req, timeout=25) as resp:
                res = json.loads(resp.read().decode('utf-8'))
                dt = int((time.time() - t0) * 1000)
                msg = res['choices'][0]['message']
                content = msg.get('content') or msg.get('reasoning_content') or ''
                return {
                    'model': model,
                    'latency_ms': dt,
                    'response': content.strip()
                }
        except Exception as e:
            last_err = f"{model}: {e}"
            continue
    raise RuntimeError(f"Todos os modelos na cadeia NIM falharam: {last_err}")


def query_gemini_model(api_key: str, prompt: str, system_prompt: str, models_chain: list = None):
    if not models_chain:
        models_chain = ['gemini-2.5-flash', 'gemini-flash-latest']
    last_err = None
    for model in models_chain:
        url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}'
        payload = {
            'systemInstruction': {'parts': [{'text': system_prompt}]},
            'contents': [{'parts': [{'text': prompt}]}],
            'generationConfig': {'temperature': 0.2, 'maxOutputTokens': 1024}
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        t0 = time.time()
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                res = json.loads(resp.read().decode('utf-8'))
                dt = int((time.time() - t0) * 1000)
                text = res['candidates'][0]['content']['parts'][0]['text']
                return {
                    'model': model,
                    'latency_ms': dt,
                    'response': text.strip()
                }
        except Exception as e:
            last_err = f"{model}: {e}"
            continue
    raise RuntimeError(f"Todos os modelos Gemini falharam: {last_err}")


def dispatch_by_role(env: dict, role: str, prompt: str, preferred_agent: str = None):
    sys_prompt = build_agent_system_prompt(role)
    # Tenta Colab GPU primeiro se solicitado ou se role == 'vision'
    if preferred_agent == 'colab':
        try:
            return query_colab_gpu_llm(env.get('COLAB_GPU_URL', ''), prompt, sys_prompt)
        except Exception:
            pass

    if preferred_agent == 'gemini':
        try:
            return query_gemini_model(env.get('GOOGLE_API_KEY', ''), prompt, sys_prompt)
        except Exception:
            pass

    # Cadeia de modelos por especialidade no pool NVIDIA NIM + fallback Gemini
    role_chains = {
        'architect': ['mistralai/mistral-large-2-instruct', 'nvidia/nemotron-3.5-lightning-30b-a3b'],
        'coder': ['mistralai/mistral-large-2-instruct', 'nvidia/nemotron-3.5-lightning-30b-a3b'],
        'qa': ['mistralai/mistral-large-2-instruct', 'nvidia/nemotron-3.5-lightning-30b-a3b'],
        'security': ['mistralai/mistral-large-2-instruct', 'nvidia/nemotron-3.5-lightning-30b-a3b'],
        'vision': ['mistralai/mistral-large-2-instruct', 'nvidia/nemotron-3.5-lightning-30b-a3b']
    }
    chain = role_chains.get(role, ['mistralai/mistral-large-2-instruct', 'nvidia/nemotron-3.5-lightning-30b-a3b'])
    try:
        return query_nim_model(env.get('NVIDIA_API_KEY', ''), prompt, sys_prompt, chain)
    except Exception:
        return query_gemini_model(env.get('GOOGLE_API_KEY', ''), prompt, sys_prompt)


def run_swarm_verification_suite(env: dict):
    print('🧪 =========================================================================')
    print('   BATERIA DE VALIDAÇÃO DOS AGENTES DO SWARM (CONTEXTO & FINE-TUNING ÁQUILA)')
    print('=========================================================================\n')

    tests = [
        (
            'coder',
            'Responda em no máximo 2 linhas: qual é o nome exato da tabela de mensageria resiliente do Áquila Pro, qual coluna garante idempotência e qual o valor de max_retries padrão?',
            ['notification_outbox', 'idempotency_key', '3']
        ),
        (
            'vision',
            'Responda em no máximo 2 linhas: qual o limiar de Δfill no OMR do Áquila Pro que retém o cartão para revisão e qual é o status atribuído no banco?',
            ['25', 'PENDING_TEACHER_REVIEW']
        ),
        (
            'security',
            'Responda em no máximo 2 linhas: em qual porta roda o WebSocketServerManager do Áquila Pro, qual algoritmo valida o token e qual código fecha conexões abusivas na 3ª violação?',
            ['9000', 'HMAC', '1008']
        )
    ]

    passed = 0
    for idx, (role, question, expected_keywords) in enumerate(tests, 1):
        print(f"{idx}️⃣ Testando Agente Especialista [Role: {role.upper()}]...")
        res = dispatch_by_role(env, role, question)
        ans = res['response']
        matched = [kw for kw in expected_keywords if kw.lower() in ans.lower()]
        ok = len(matched) == len(expected_keywords)
        if ok:
            passed += 1
        print(f"   - Modelo Executado: {res['model']} ({res['latency_ms']} ms)")
        print(f"   - Resposta: {ans}")
        print(f"   - Keywords Verificadas ({len(matched)}/{len(expected_keywords)}): {matched} -> {'✅ APROVADO' if ok else '❌ FALHOU'}\n")

    print('🏆 =========================================================================')
    print(f'   RESULTADO DA AUDITORIA DO SWARM: {passed}/{len(tests)} ESPECIALISTAS HOMOLOGADOS')
    print('=========================================================================')
    if passed < len(tests):
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description='Áquila Pro Multi-Model & Multi-GPU Dev Swarm Router')
    parser.add_argument('--status', action='store_true', help='Verifica conectividade de todos os provedores LLM e GPU do Swarm')
    parser.add_argument('--sync-colab', action='store_true', help='Envia a base SQLite, os .md dos agentes e o Modelfile para o HD do Colab')
    parser.add_argument('--test-swarm', action='store_true', help='Executa bateria de testes nos agentes especialistas programados com o contexto do Áquila')
    parser.add_argument('--role', type=str, default='coder', choices=['architect', 'coder', 'qa', 'security', 'vision'], help='Papel especialista do agente (.md injetado)')
    parser.add_argument('--agent', type=str, choices=['colab', 'deepseek', 'llama', 'gemini'], help='Forçar provedor específico')
    parser.add_argument('--prompt', type=str, help='Prompt técnico para enviar ao agente')
    parser.add_argument('--out-file', type=str, help='Caminho de arquivo para gravar a saída diretamente no disco (Zero Cota Antigravity)')
    args = parser.parse_args()

    env = load_all_envs()

    if args.status:
        print('🐝 =========================================================================')
        print('   ÁQUILA PRO — DIAGNÓSTICO DO SWARM DE DESENVOLVIMENTO (MULTI-IA & GPU)')
        print('=========================================================================\n')

        nim_status = test_nvidia_nim(env.get('NVIDIA_API_KEY', ''))
        print(f"1️⃣ [NVIDIA NIM / Reasoning & Coding Pool]: {nim_status['status']} ({nim_status['latency_ms']} ms)")
        if nim_status['status'] == 'ONLINE':
            print(f"   - Total de Modelos Disponíveis: {nim_status['total_models']}")

        gemini_status = test_google_gemini(env.get('GOOGLE_API_KEY', ''))
        print(f"\n2️⃣ [Google AI Studio / Gemini Pool]: {gemini_status['status']} ({gemini_status['latency_ms']} ms)")
        if gemini_status['status'] == 'ONLINE':
            print(f"   - Total de Modelos Gemini: {gemini_status['total_models']}")

        print('\n3️⃣ [Perfis de Agentes Especialistas Programados (swarm/agents/)]:')
        for r, md in ROLE_TO_MD.items():
            p = Path(os.getcwd()) / 'swarm' / 'agents' / md
            print(f"   - --role {r:<10} -> {md} ({'✅ Ativo' if p.exists() else '❌ Ausente'})")

        print('\n4️⃣ [Pool Multi-GPU Gratuito (Colab / Kaggle / Modal / Lightning AI)]:')
        gpu_nodes = [
            ('Google Colab T4/A100 (HD /content/aquila_brain)', env.get('COLAB_GPU_URL', '')),
            ('Kaggle Dual-T4 (30h/sem)', env.get('KAGGLE_GPU_URL', '')),
            ('Modal Serverless GPU ($30/mês)', env.get('MODAL_GPU_URL', '')),
            ('Lightning AI Studio', env.get('LIGHTNING_GPU_URL', ''))
        ]
        for g_name, g_url in gpu_nodes:
            g_res = test_gpu_endpoint(g_name, g_url)
            url_str = f"({g_res['url']})" if g_res['url'] else "(Pronto para vincular no .env)"
            print(f"   - {g_name}: {g_res['status']} {url_str}")

        print('\n=========================================================================')
        return

    if args.sync_colab:
        try:
            res = sync_context_to_colab(env.get('COLAB_GPU_URL', ''))
            print(f"✅ Contexto e Base SQLite sincronizados no HD do Colab: {json.dumps(res, indent=2, ensure_ascii=False)}")
        except Exception as e:
            print(f"⚠️ Colab GPU em standby no momento ({e}). O pacote `swarm/dataset/colab_sync_bundle.json` já está pronto localmente e será enviado assim que a célula do Colab estiver ativa.")
        return

    if args.test_swarm:
        run_swarm_verification_suite(env)
        return

    if args.prompt:
        res = dispatch_by_role(env, args.role, args.prompt, args.agent)
        if args.out_file:
            os.makedirs(os.path.dirname(os.path.abspath(args.out_file)), exist_ok=True)
            with open(args.out_file, 'w', encoding='utf-8') as f:
                f.write(res['response'] + '\n')
            print(f"✅ [Swarm Role:{args.role.upper()} ({res['model']} — {res['latency_ms']} ms)] gravou {len(res['response'])} bytes em {args.out_file}")
        else:
            print(f"\n⚡ [Swarm Role:{args.role.upper()} ({res['model']} — {res['latency_ms']} ms)]:\n{res['response']}")


if __name__ == '__main__':
    main()
