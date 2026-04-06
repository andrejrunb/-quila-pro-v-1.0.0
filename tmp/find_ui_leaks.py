import os
import re

def find_imports(filepath):
    imports = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            # Match: from './path' or import './path'
            matches = re.finditer(r"from\s+['\"](.*?)['\"]|import\s+['\"](.*?)['\"]", content)
            for m in matches:
                path = m.group(1) or m.group(2)
                if path:
                    imports.append(path)
    except:
        pass
    return imports

def resolve_path(current_file, import_path):
    if not import_path.startswith('.'):
        return None
    
    base_dir = os.path.dirname(current_file)
    target = os.path.normpath(os.path.join(base_dir, import_path))
    
    extensions = ['.ts', '.tsx', '.js', '.jsx']
    for ext in extensions:
        if os.path.isfile(target + ext):
            return target + ext
        if os.path.isdir(target) and os.path.isfile(os.path.join(target, 'index' + ext)):
            return os.path.join(target, 'index' + ext)
    return None

def find_leaks(dir_to_scan):
    leaks = []
    for root, _, files in os.walk(dir_to_scan):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                filepath = os.path.join(root, file)
                imports = find_imports(filepath)
                for imp in imports:
                    if '/services/' in imp or '\\services\\' in imp or imp.startswith('../services/'):
                        # Ignore AiTypes.ts as it's allowed
                        if 'AiTypes' not in imp:
                            leaks.append(f"LEAK in {filepath}: imports {imp}")
    return leaks

ui_dir = r'C:\aquila\apps\electron\src\ui'
print(f"Scanning {ui_dir} for service leaks...")
leaks = find_leaks(ui_dir)

if leaks:
    for l in leaks:
        print(l)
else:
    print("No direct leaks found in src/ui.")
