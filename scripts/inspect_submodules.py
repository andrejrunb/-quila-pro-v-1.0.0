import os
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = r"c:\aquila\external"
subs = ["api-anything", "ruflo", "RuView", "serena"]

data = {}

EXCLUDE = {'.git', 'node_modules', 'target', '.venv', 'venv', '__pycache__', 'dist', 'build', '.idea', '.vscode'}

for sub in subs:
    p = os.path.join(BASE, sub)
    if not os.path.exists(p):
        data[sub] = {"exists": False}
        continue
    
    file_list = []
    configs = {}
    for root, dirs, files in os.walk(p):
        dirs[:] = [d for d in dirs if d not in EXCLUDE]
        rel = os.path.relpath(root, p)
        for f in files:
            full_f = os.path.join(root, f)
            rel_f = os.path.normpath(os.path.join(rel, f))
            file_list.append(rel_f)
            if f in ['package.json', 'Cargo.toml', 'pyproject.toml', 'README.md', 'skill.json', 'mcp.json']:
                try:
                    with open(full_f, 'r', encoding='utf-8', errors='ignore') as fp:
                        configs[rel_f] = fp.read()[:3000]
                except Exception as e:
                    configs[rel_f] = str(e)
                    
    data[sub] = {
        "exists": True,
        "total_files": len(file_list),
        "files_sample": file_list[:50],
        "configs": configs
    }

out_path = r"c:\aquila\scratch\sweep\submodules_deep.json"
os.makedirs(os.path.dirname(out_path), exist_ok=True)
with open(out_path, 'w', encoding='utf-8') as fp:
    json.dump(data, fp, indent=2)

print("Inspection completed. Summary:")
for sub in subs:
    if data[sub].get("exists"):
        print(f"- {sub}: {data[sub]['total_files']} files, configs: {list(data[sub]['configs'].keys())}")
    else:
        print(f"- {sub}: NOT FOUND")
