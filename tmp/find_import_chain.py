import os
import re

def find_imports(filepath):
    imports = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            # Match: import ... from './path' or import './path'
            matches = re.findall(r"from\s+['\"](.*?)['\"]|import\s+['\"](.*?)['\"]", content)
            for m in matches:
                imports.append(m[0] or m[1])
    except:
        pass
    return imports

def resolve_path(current_file, import_path):
    if not import_path.startswith('.'):
        return None # Skip node_modules
    
    base_dir = os.path.dirname(current_file)
    target = os.path.normpath(os.path.join(base_dir, import_path))
    
    extensions = ['.ts', '.tsx', '.js', '.jsx']
    for ext in extensions:
        if os.path.isfile(target + ext):
            return target + ext
        if os.path.isdir(target) and os.path.isfile(os.path.join(target, 'index' + ext)):
            return os.path.join(target, 'index' + ext)
    return None

def trace_leak(start_node, target_path, visited=None):
    if visited is None:
        visited = set()
    
    if start_node in visited:
        return None
    visited.add(start_node)
    
    if os.path.abspath(start_node) == os.path.abspath(target_path):
        return [start_node]
    
    imports = find_imports(start_node)
    for imp in imports:
        resolved = resolve_path(start_node, imp)
        if resolved:
            chain = trace_leak(resolved, target_path, visited)
            if chain:
                return [start_node] + chain
    return None

root_src = r'C:\aquila\apps\electron\src\index.tsx'
target = r'C:\aquila\apps\electron\src\services\FaceWorkerBridge.ts'

print(f"Tracing leak from {root_src} to {target}...")
chain = trace_leak(root_src, target)

if chain:
    print("\nLEAK DETECTED:")
    for i, node in enumerate(chain):
        print(f"{'  ' * i} -> {node}")
else:
    print("\nNo direct leak path found from entry point to target.")
