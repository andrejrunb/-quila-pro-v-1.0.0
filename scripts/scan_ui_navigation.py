import re
import os
from pathlib import Path

ui_dir = Path("apps/electron/src/ui")
nav_map = {}
for p in ui_dir.rglob("*.tsx"):
    try:
        txt = p.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        continue
    matches = re.findall(r"onNavigate\s*\(\s*['\"]([^'\"]+)['\"]\s*\)", txt)
    matches += re.findall(r"onNavigate\?\.\s*\(\s*['\"]([^'\"]+)['\"]\s*\)", txt)
    for m in set(matches):
        nav_map.setdefault(m, []).append(p.name)

print(f"Total onNavigate targets found: {len(nav_map)}")
for k in sorted(nav_map.keys()):
    print(f"{k:25} -> {nav_map[k]}")
