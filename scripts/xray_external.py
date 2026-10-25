import os, json, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

EXT_DIR = r'c:\aquila\external'

report = {}

for item in sorted(os.listdir(EXT_DIR)):
    ipath = os.path.join(EXT_DIR, item)
    if not os.path.isdir(ipath):
        continue
    
    info = {
        'files_count': 0,
        'package_json': None,
        'cargo_toml': None,
        'readme': '',
        'top_level_entries': [],
        'src_entries': []
    }
    
    # Top level files
    for f in os.listdir(ipath):
        info['top_level_entries'].append(f)
        if f == 'package.json':
            try:
                pj = json.load(open(os.path.join(ipath, f), encoding='utf-8', errors='ignore'))
                info['package_json'] = {
                    'name': pj.get('name'),
                    'version': pj.get('version'),
                    'main': pj.get('main'),
                    'bin': pj.get('bin'),
                    'scripts': list(pj.get('scripts', {}).keys()),
                    'dependencies': list(pj.get('dependencies', {}).keys())[:15]
                }
            except Exception:
                pass
        elif f == 'Cargo.toml':
            try:
                ct = open(os.path.join(ipath, f), encoding='utf-8', errors='ignore').read()
                info['cargo_toml'] = ct[:400]
            except Exception:
                pass
        elif f.lower().startswith('readme'):
            try:
                rm = open(os.path.join(ipath, f), encoding='utf-8', errors='ignore').read()
                info['readme'] = rm[:800]
            except Exception:
                pass
    
    src_dir = os.path.join(ipath, 'src')
    if os.path.exists(src_dir):
        for root, dirs, files in os.walk(src_dir):
            rel = os.path.relpath(root, ipath)
            for file in files[:10]:
                info['src_entries'].append(os.path.join(rel, file))
            if len(info['src_entries']) > 25:
                break
                
    report[item] = info

out_path = r'C:\Users\Thaysa\.gemini\antigravity\brain\5fca40fa-e48d-4bc6-bc7a-084bf4a62fe4\scratch\sweep\external_deep_xray.json'
json.dump(report, open(out_path, 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

for k, v in report.items():
    print(f"\n==================== {k} ====================")
    if v['package_json']:
        print(f"Name: {v['package_json']['name']} v{v['package_json']['version']}")
        print(f"Main/Bin: {v['package_json']['main']} | {v['package_json']['bin']}")
        print(f"Dependencies: {', '.join(v['package_json']['dependencies'][:8])}")
    if v['cargo_toml']:
        print("Cargo.toml:")
        print(v['cargo_toml'][:200])
    print(f"Top-level: {', '.join(v['top_level_entries'][:10])}")
    print(f"Src samples: {', '.join(v['src_entries'][:6])}")
