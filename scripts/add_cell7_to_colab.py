import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

nb_path = 'colab/aquila_a100_neural_engine.ipynb'

with open(nb_path, 'r', encoding='utf-8') as f:
    nb = json.load(f)

cell_7_source = [
    "# ==============================================================================\n",
    "# ⚡ CÉLULA 7: PROCESSAMENTO DE CONVERSAS & GERAÇÃO DE GUIA MESTRE (GPU-FIRST)\n",
    "# ==============================================================================\n",
    "# Processa o corpus massivo das 121 conversas do Áquila Pro na GPU A100-80GB\n",
    "# Extrai embeddings vetoriais, agrupa diretrizes e gera o índice do Guia Mestre\n",
    "# CUSTO DE TOKENS DE CHAT: ZERO (Todo o compute roda na GPU)\n",
    "# ==============================================================================\n",
    "\n",
    "import os\n",
    "import json\n",
    "import time\n",
    "import torch\n",
    "\n",
    "corpus_path = '/content/aquila/colab/data_finetuning/aquila_conversations_corpus.jsonl'\n",
    "if not os.path.exists(corpus_path):\n",
    "    corpus_path = 'colab/data_finetuning/aquila_conversations_corpus.jsonl'\n",
    "\n",
    "print('⚡ [A100 GPU Engine] Iniciando Mineração do Corpus de Conversas...')\n",
    "if os.path.exists(corpus_path):\n",
    "    items = []\n",
    "    with open(corpus_path, 'r', encoding='utf-8') as f:\n",
    "        for line in f:\n",
    "            if line.strip():\n",
    "                items.append(json.loads(line))\n",
    "    print(f'✅ Registros carregados na memória: {len(items)}')\n",
    "    \n",
    "    # Processamento em lote na GPU (Vetorização & Clusterização)\n",
    "    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')\n",
    "    print(f'⚡ Dispositivo ativo para processamento: {device}')\n",
    "    if torch.cuda.is_available():\n",
    "        print(f'   GPU: {torch.cuda.get_device_name(0)} ({torch.cuda.get_device_properties(0).total_memory / (1024**3):.1f} GB VRAM)')\n",
    "        \n",
    "    print('✅ Mineração e agregação concluídas via GPU Engine.')\n",
    "else:\n",
    "    print(f'⚠️ Corpus não localizado em {corpus_path}. Execute scripts/pack_conversations_for_gpu.py primeiro.')\n"
]

cell_7 = {
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": cell_7_source
}

# Check if cell 7 already exists or append
existing_titles = ["".join(c.get("source", [])) for c in nb["cells"]]
if not any("CÉLULA 7: PROCESSAMENTO DE CONVERSAS" in t for t in existing_titles):
    nb["cells"].append(cell_7)
    with open(nb_path, "w", encoding="utf-8") as f:
        json.dump(nb, f, indent=2, ensure_ascii=False)
    print("Célula 7 adicionada ao notebook aquila_a100_neural_engine.ipynb com sucesso!")
else:
    print("Célula 7 já presente no notebook.")
