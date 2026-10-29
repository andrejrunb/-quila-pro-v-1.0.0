import os
import json
import time
from archive_adapter.internet_archive_adapter import InternetArchiveAdapter

def main():
    print("=" * 70)
    print("INICIANDO PILOTO CONTROLADO: CURADORIA DE ACERVO INTERNET ARCHIVE")
    print("=" * 70)
    
    adapter = InternetArchiveAdapter()
    
    # 1. Definir as 8 consultas propostas pela especificação
    queries = [
        {
            "query": 'mediatype:texts AND language:por AND "Machado de Assis"',
            "collection": "Vozes da Literatura Brasileira",
            "limit": 15
        },
        {
            "query": 'mediatype:texts AND "Maria Firmina dos Reis"',
            "collection": "Vozes da Literatura Brasileira",
            "limit": 10
        },
        {
            "query": 'mediatype:texts AND "Nikola Tesla"',
            "collection": "Oficinas da Ciência",
            "limit": 15
        },
        {
            "query": 'mediatype:texts AND "Maria Sibylla Merian"',
            "collection": "Jardim dos Naturalistas",
            "limit": 15
        },
        {
            "query": 'mediatype:texts AND "geometria"',
            "collection": "Matemática em Construção",
            "limit": 15
        },
        {
            "query": 'mediatype:image AND "Brazil"',
            "collection": "Brasil em Mapas e Fontes",
            "limit": 15
        },
        {
            "query": 'mediatype:audio AND "portuguese"',
            "collection": "Biblioteca Multimodal",
            "limit": 15
        },
        {
            "query": 'mediatype:movies AND "educational"',
            "collection": "Biblioteca Multimodal",
            "limit": 10
        }
    ]
    
    total_discovered = 0
    discovery_summary = []
    
    print("\n[ETAPA 1: DESCOBERTA DELIMITADA VIA API OFICIAL]")
    for q_spec in queries:
        q_str = q_spec["query"]
        col = q_spec["collection"]
        lim = q_spec["limit"]
        print(f"\n--> Consultando: {q_str} (Coleção: {col})")
        try:
            results = adapter.archive_search(query=q_str, editorial_collection=col, rows=lim)
            count = len(results)
            total_discovered += count
            discovery_summary.append({
                "query": q_str,
                "collection": col,
                "found": count,
                "sample_identifiers": [r["identifier"] for r in results[:3]]
            })
            print(f"    Registrados {count} itens no SQLite.")
            time.sleep(1.0) # Respeito às taxas do Archive
        except Exception as e:
            print(f"    [ERRO ao consultar {q_str}]: {e}")

    print(f"\n>>> Total de registros descobertos na Etapa 1: {total_discovered} itens.")
    
    # Salvar manifesto de descoberta
    with open("acervo/manifests/discovery_stage1_manifest.json", "w", encoding="utf-8") as f:
        json.dump(discovery_summary, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()
