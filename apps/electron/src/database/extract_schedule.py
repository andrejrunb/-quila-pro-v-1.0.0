#!/usr/bin/env python3
"""
Extrai a grade horária do PDF da escola para JSON.
"""
import pdfplumber
import json
import sys

PDF_PATH = r"C:\Users\Thaysa\Documents\HORARIO 04 DE MAIO GERAL.pdf"
OUTPUT_PATH = r"c:\aquila\apps\electron\src\database\schedule_data.json"

def extract_schedule():
    all_tables = []
    
    with pdfplumber.open(PDF_PATH) as pdf:
        print(f"Total de páginas: {len(pdf.pages)}")
        
        for i, page in enumerate(pdf.pages):
            print(f"\n=== PÁGINA {i+1} ===")
            print(f"Dimensões: {page.width} x {page.height}")
            
            # Extrair texto bruto primeiro
            text = page.extract_text()
            if text:
                print(f"Texto bruto (primeiros 500 chars):")
                print(text[:500])
                print("...")
            
            # Extrair tabelas
            tables = page.extract_tables()
            print(f"Tabelas encontradas: {len(tables)}")
            
            for j, table in enumerate(tables):
                print(f"\n--- Tabela {j+1} ({len(table)} linhas x {len(table[0]) if table else 0} colunas) ---")
                
                # Print header
                if table and len(table) > 0:
                    print(f"Header: {table[0]}")
                
                # Print first few rows
                for row_idx, row in enumerate(table[:3]):
                    print(f"Row {row_idx}: {row}")
                
                all_tables.append({
                    "page": i + 1,
                    "table_index": j,
                    "rows": table
                })
    
    # Salvar todos os dados extraídos
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(all_tables, f, ensure_ascii=False, indent=2)
    
    print(f"\n\nDados salvos em: {OUTPUT_PATH}")
    print(f"Total de tabelas: {len(all_tables)}")

if __name__ == '__main__':
    extract_schedule()
