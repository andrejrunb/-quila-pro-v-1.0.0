import sys
sys.stdout.reconfigure(encoding='utf-8')
import json

with open('colab/aquila_a100_neural_engine.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

print(f"Total cells: {len(nb.get('cells', []))}")
for i, cell in enumerate(nb.get('cells', [])):
    src = "".join(cell.get('source', []))[:140].replace("\n", " ")
    print(f"Cell {i} [{cell.get('cell_type')}]: {src}")
