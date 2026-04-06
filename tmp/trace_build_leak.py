import os
import re

def find_imports(filepath):
    imports = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
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
        # Handle @/ aliases if any, but Vite uses it
        if import_path.startswith('@/'):
            base = r'C:\aquila\apps\electron\src'
            target = os.path.normpath(os.path.join(base, import_path[2:]))
        else:
            return None
    else:
        base_dir = os.path.dirname(current_file)
        target = os.path.normpath(os.path.join(base_dir, import_path))
    
    extensions = ['.ts', '.tsx', '.js', '.jsx']
    for ext in extensions:
        if os.path.isfile(target + ext):
            return target + ext
        if os.path.isdir(target) and os.path.isfile(os.path.join(target, 'index' + ext)):
            return os.path.join(target, 'index' + ext)
    return None

memo = {}
def find_path_to_target(current_file, target_file, path=[]):
    if current_file in memo: return memo[current_file]
    if current_file == target_file:
        return path + [current_file]
    
    if current_file in path: return None # Cycle
    
    imports = find_imports(current_file)
    for imp in imports:
        resolved = resolve_path(current_file, imp)
        if resolved:
            res = find_path_to_target(resolved, target_file, path + [current_file])
            if res:
                memo[current_file] = res
                return res
    
    memo[current_file] = None
    return None

target = r'C:\aquila\apps\electron\src\services\FaceWorkerBridge.ts'
ui_dir = r'C:\aquila\apps\electron\src\ui'

print(f"Searching for paths from {ui_dir} to {target}...")

leaks_found = 0
for root, _, files in os.walk(ui_dir):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            filepath = os.path.join(root, file)
            path = find_path_to_target(filepath, target)
            if path:
                print("\nFOUND LEAK CHAIN:")
                for p in path:
                    print(f"  -> {p}")
                leaks_found += 1

if leaks_found == 0:
    print("No paths found. Check index.tsx / App.tsx directly.")
    path = find_path_to_target(r'C:\aquila\apps\electron\src\index.tsx', target)
    if path:
        print("\nFOUND LEAK CHAIN FROM index.tsx:")
        for p in path:
            print(f"  -> {p}")
    else:
        print("No path from index.tsx either.")
