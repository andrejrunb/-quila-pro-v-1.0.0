#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Áquila Pro — REA & Agent Reach Analysis of top-mcps.com
Analyzes, classifies, and extracts high-utility MCP servers for the Áquila Pro Autonomous Coding Swarm.
"""

import requests
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

API_URL = 'https://top-mcps.com/api/mcps.json'
LLMS_URL = 'https://top-mcps.com/llms.txt'

def analyze():
    print("=" * 70)
    print("ÁQUILA PRO — REA & AGENT REACH: TOP-MCPS.COM")
    print("=" * 70)

    print("[1] Baixando API Surface de https://top-mcps.com/api/mcps.json...")
    resp = requests.get(API_URL, timeout=25)
    if resp.status_code != 200:
        print(f"[ERRO] Falha ao baixar catálogo: {resp.status_code}")
        return

    data = resp.json()
    counts = data.get('counts', {})
    mcps = data.get('mcps', [])
    categories = data.get('primaryCategories', [])
    collections = data.get('collections', [])
    clients = data.get('clients', [])

    print(f"[OK] Total de MCPs no catálogo: {len(mcps)}")
    print(f"[OK] Metadados: {counts}")
    print(f"[OK] Categorias Primárias: {len(categories)}")
    print(f"[OK] Coleções: {len(collections)}")
    print(f"[OK] Clientes Suportados: {[c.get('name') for c in clients]}")

    # Salva snapshot bruto para auditoria local
    os.makedirs('docs/mcp', exist_ok=True)
    with open('docs/mcp/top_mcps_full_catalog.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("[OK] Snapshot gravado em docs/mcp/top_mcps_full_catalog.json")

    # Mapeamento e Curadoria Estratégica para o Áquila Pro
    # Categorias de Alto Impacto para nossa programação:
    target_slugs = {
        'developer_tools': ['context7', 'github', 'gitlab', 'docker', 'kubernetes', 'sentry'],
        'databases': ['postgres-mcp-pro', 'supabase', 'sqlite', 'redis', 'chroma', 'qdrant'],
        'agent_orchestration': ['sequential-thinking', 'memory', 'agent-orchestration', 'eval-harness'],
        'browser_web': ['playwright', 'puppeteer', 'chrome-devtools', 'brave-search', 'tavily', 'crawl4ai', 'firecrawl'],
        'ai_gpu_ml': ['huggingface', 'ollama', 'colab', 'vllm'],
        'project_and_workflow': ['linear', 'slack-mcp-server', 'discord', 'notion']
    }

    curated = []
    category_summary = {}

    for m in mcps:
        cat = m.get('category') or 'Uncategorized'
        category_summary[cat] = category_summary.get(cat, 0) + 1

        slug = m.get('slug', '').lower()
        name = m.get('name', '')
        tagline = m.get('tagline', '')
        repo = m.get('githubUrl') or m.get('repoUrl') or ''
        install = m.get('install') or {}
        score = m.get('score') or m.get('rating') or {}
        tags = m.get('tags') or []

        # Identifica se é prioritário para Áquila
        is_priority = False
        priority_domain = "General"
        for domain, slugs in target_slugs.items():
            if any(s in slug or s in name.lower() for s in slugs):
                is_priority = True
                priority_domain = domain
                break

        curated.append({
            'name': name,
            'slug': slug,
            'domain': priority_domain,
            'category': cat,
            'is_priority': is_priority,
            'is_official': m.get('isOfficial', False),
            'tagline': tagline,
            'github_url': repo,
            'install': install,
            'tags': tags,
            'rank': m.get('rank') or m.get('popularityRank')
        })

    # Ordena prioritários primeiro
    priority_mcps = [m for m in curated if m['is_priority']]
    print(f"\n[SWARM] Selecionados {len(priority_mcps)} MCPs de altíssima utilidade para desenvolvimento Áquila Pro:")

    for idx, p in enumerate(priority_mcps[:25], 1):
        print(f"  {idx:02d}. [{p['domain'].upper()}] {p['name']} ({p['slug']}) — {p['tagline']}")

    # Gera manifesto consolidado para o Ecossistema Áquila Pro
    manifest = {
        'catalog_source': 'top-mcps.com (Hand-verified 2026)',
        'scanned_at': data.get('generatedAt'),
        'total_analyzed': len(mcps),
        'priority_count': len(priority_mcps),
        'aquila_installed_mcps': [
            'colab-mcp', 'filesystem', 'github', 'chrome-devtools-mcp',
            'postgres', 'puppeteer', 'sequential-thinking', 'StitchMCP', 'artemis'
        ],
        'priority_mcps': priority_mcps,
        'category_breakdown': category_summary
    }

    with open('docs/mcp/aquila_curated_mcps.json', 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print("\n[OK] Manifesto gravado com sucesso em docs/mcp/aquila_curated_mcps.json!")

if __name__ == '__main__':
    analyze()
