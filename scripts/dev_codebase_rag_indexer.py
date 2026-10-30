#!/usr/bin/env python3
"""
scripts/dev_codebase_rag_indexer.py — Áquila Developer Swarm Tool
Generates a semantic graph index of the codebase (Routes, Components, onNavigate targets, IPC calls)
allowing instant Codebase-RAG queries without manual file crawling.
"""

import os
import json
import re
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
UI_DIR = ROOT_DIR / "apps" / "electron" / "src" / "ui"
OUTPUT_INDEX = ROOT_DIR / "apps" / "electron" / "src" / "database" / "dev_codebase_graph.json"

def scan_codebase():
    index = {
        "timestamp": os.path.getmtime(__file__),
        "components": {},
        "routes": {},
        "onNavigate_calls": {},
        "ipc_invocations": {},
        "summary": {}
    }

    print(f"[*] Scanning UI codebase at {UI_DIR}...")
    tsx_files = list(UI_DIR.rglob("*.tsx"))
    print(f"[*] Found {len(tsx_files)} TSX files to index.")

    for filepath in tsx_files:
        rel_path = filepath.relative_to(UI_DIR).as_posix()
        try:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
        except Exception:
            continue

        # 1. Component name
        comp_name = filepath.stem

        # 2. Extract onNavigate calls
        navs = re.findall(r"onNavigate\s*\(\s*['\"]([^'\"]+)['\"]\s*\)", content)
        navs += re.findall(r"onNavigate\?\.\s*\(\s*['\"]([^'\"]+)['\"]\s*\)", content)
        navs += re.findall(r"triggerNavigate\s*\(\s*['\"]([^'\"]+)['\"]\s*\)", content)

        # 3. Extract internal switch cases
        cases = re.findall(r"case\s+['\"]([^'\"]+)['\"]\s*:", content)

        # 4. Extract IPC calls
        ipc_calls = re.findall(r"aquila\.invoke\s*\(\s*['\"]([^'\"]+)['\"]", content)
        ipc_calls += re.findall(r"aquila\.[a-zA-Z0-9_]+\.([a-zA-Z0-9_]+)\(", content)

        index["components"][comp_name] = {
            "path": rel_path,
            "handled_routes": list(set(cases)),
            "outbound_navs": list(set(navs)),
            "ipc_calls": list(set(ipc_calls))[:15]
        }

        for n in set(navs):
            if n not in index["onNavigate_calls"]:
                index["onNavigate_calls"][n] = []
            index["onNavigate_calls"][n].append(comp_name)

        for c in set(cases):
            if c not in index["routes"]:
                index["routes"][c] = []
            index["routes"][c].append(comp_name)

    index["summary"] = {
        "total_components": len(index["components"]),
        "total_unique_routes": len(index["routes"]),
        "total_unique_nav_targets": len(index["onNavigate_calls"])
    }

    OUTPUT_INDEX.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_INDEX, "w", encoding="utf-8") as f:
        json.dump(index, f, indent=2, ensure_ascii=False)

    print(f"[OK] Codebase Graph RAG Index created successfully at {OUTPUT_INDEX}")
    print(f"[OK] Indexed {len(index['components'])} components, {len(index['routes'])} routes, {len(index['onNavigate_calls'])} navigation targets.")

if __name__ == "__main__":
    scan_codebase()
