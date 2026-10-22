import os
import subprocess
import sys

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package, "-q"])

try:
    from datasets import load_dataset
    import pandas as pd
except ImportError:
    print("Instalando dependências de Data Science (datasets, pandas)...")
    install("datasets")
    install("pandas")
    from datasets import load_dataset
    import pandas as pd

def main():
    print("Iniciando conexão com HuggingFace...")
    print("Baixando base de dados: HenriqueGodoy/Alvorada-bench (1981-2025)...")
    
    try:
        # Baixando o dataset
        dataset = load_dataset("HenriqueGodoy/Alvorada-bench", "questions", split="train")
        print(f"Download concluído! Foram absorvidas {len(dataset)} questões estruturadas.")
        
        # Convertendo para Pandas DataFrame
        df = dataset.to_pandas()
        
        # Salvando em disco
        output_path = r"C:\aquila\questoes_alvorada_bench.csv"
        df.to_csv(output_path, index=False, encoding='utf-8')
        
        print(f"\n[SUCESSO] O arquivo bruto foi salvo em: {output_path}")
        print("Você pode importar este CSV para o Colab ou Excel a qualquer momento.")
    except Exception as e:
        print(f"Erro ao extrair dados: {e}")

if __name__ == "__main__":
    main()
