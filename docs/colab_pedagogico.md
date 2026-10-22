# 🧠 Treinamento da IA Pedagógica (NVIDIA A100)

Copie e cole os blocos de código abaixo nas próximas células do seu Google Colab para carregar a base de dados de vestibulares e iniciar a estruturação do Motor Pedagógico do Áquila Pro.

### Célula 2: Download do Banco Público do MEC/Vestibulares
Crie uma nova célula de Código (+ Código) e cole isto:

```python
# 2. Download do Dataset Oficial (HuggingFace)
!pip install datasets pandas transformers -q

from datasets import load_dataset
import pandas as pd

print("[ÁQUILA] Estabelecendo ponte segura com HuggingFace...")
# Baixando 32 anos de vestibulares e ENEM
dataset = load_dataset("HenriqueGodoy/Alvorada-bench", "questions", split="train")

df = dataset.to_pandas()
print(f"[ÁQUILA] Extração Autorizada Concluída. {len(df)} questões prontas para treinamento.")

# Exibindo as primeiras questões para inspeção visual
display(df[['question', 'subject', 'exam']].head())
```

### Célula 3: Treinamento e Ingestão de Contexto
Crie mais uma célula de Código (+ Código) para formatar essas questões e ensinar a inteligência artificial a respondê-las:

```python
# 3. Pipeline de Estruturação Pedagógica
import torch

print("[ÁQUILA] Formatando Tensores para a GPU A100...")

# Aqui você pode carregar um modelo open-source leve para ser o cérebro
# ex: LLaMA 3 ou Mistral
# from transformers import AutoModelForCausalLM, AutoTokenizer
# model_name = "meta-llama/Meta-Llama-3-8B-Instruct" 

def format_prompt(row):
    materia = row['subject'] if pd.notna(row['subject']) else 'Geral'
    prova = row['exam'] if pd.notna(row['exam']) else 'Simulado'
    
    prompt = f"Você é o Áquila Pro, um tutor avançado. Resolva a questão de {materia} do {prova}:\n\n"
    prompt += row['question']
    return prompt

df['prompt_treinamento'] = df.apply(format_prompt, axis=1)

print("[ÁQUILA] Dados processados. O dataset está em memória pronto para iniciar a compilação do Fine-Tuning.")
# O dataframe `df` agora possui os textos estruturados para Fine-Tuning.
```
