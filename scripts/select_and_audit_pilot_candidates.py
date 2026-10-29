import sys
sys.stdout.reconfigure(encoding='utf-8')
import sqlite3
import json

conn = sqlite3.connect("acervo/acervo_multimodal_archive.db")
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

collections = [
    "Vozes da Literatura Brasileira",
    "Oficinas da Ciência",
    "Jardim dos Naturalistas",
    "Matemática em Construção",
    "Brasil em Mapas e Fontes",
    "Biblioteca Multimodal"
]

print("=== CANDIDATOS DESCOBERTOS POR COLEÇÃO ===")
for col in collections:
    cursor.execute("SELECT identifier, title, creator, year_published, mediatype FROM archive_items WHERE editorial_collection = ? LIMIT 6", (col,))
    rows = cursor.fetchall()
    print(f"\n--- Coleção: {col} ({len(rows)} amostras) ---")
    for r in rows:
        print(f"  [{r['identifier']}] {r['title']} | Criador: {r['creator']} | Ano: {r['year_published']} | Tipo: {r['mediatype']}")

conn.close()
