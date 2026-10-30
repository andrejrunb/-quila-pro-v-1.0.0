import sqlite3
import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect("acervo/acervo_multimodal_archive.db")
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

def semantic_rag_query(keyword: str, discipline: str = None, stage: str = None):
    sql = """
        SELECT 
            i.identifier,
            i.title,
            i.creator,
            i.year_published,
            i.editorial_collection,
            p.page_index,
            p.printed_page_label,
            s.content,
            s.is_historical_source,
            cm.discipline,
            cm.educational_stage,
            cm.bncc_code
        FROM text_segments s
        JOIN document_pages p ON s.page_id = p.id
        JOIN archive_items i ON s.item_identifier = i.identifier
        LEFT JOIN curriculum_mappings cm ON cm.segment_or_asset_id = s.id
        WHERE i.review_status = 'APPROVED'
          AND s.content LIKE ?
    """
    params = [f"%{keyword}%"]
    if discipline:
        sql += " AND cm.discipline = ?"
        params.append(discipline)
    if stage:
        sql += " AND cm.educational_stage = ?"
        params.append(stage)
        
    sql += " LIMIT 3"
    cursor.execute(sql, params)
    return cursor.fetchall()

test_queries = [
    ("Rubião", "Literatura Brasileira", "ENSINO_MEDIO"),
    ("Úrsula", "Literatura Brasileira", "ENSINO_MEDIO"),
    ("Surinam", "Biologia", "FUNDAMENTAL_2"),
    ("geometria", "Matemática", "ENSINO_MEDIO")
]

print("=" * 70)
print("DEMONSTRAÇÃO DE RAG PEDAGÓGICO COM CITAÇÃO REVERSA E RASTREABILIDADE")
print("=" * 70)

for kw, disc, stg in test_queries:
    print(f"\n[Consulta Pedagógica]: Palavra-chave: '{kw}' | Disciplina: {disc} | Etapa: {stg}")
    matches = semantic_rag_query(kw, disc, stg)
    if not matches:
        print("  -> Nenhuma evidência aprovada encontrada.")
        continue
    for m in matches:
        hist_notice = "[FONTE HISTÓRICA DOCUMENTAL - CONTEXTUALIZADA]" if m["is_historical_source"] else "[CONTEÚDO CONTEMPORÂNEO]"
        print(f"  * Citação: {m['title']} ({m['year_published']}), por {m['creator']}")
        print(f"    Item ID: {m['identifier']} | Localização: {m['printed_page_label']} (Pág {m['page_index']})")
        print(f"    Classificação: {hist_notice} | BNCC: {m['bncc_code']}")
        snippet = m['content'].replace('\n', ' ')[:200]
        print(f"    Trecho Evidenciado: \"{snippet}...\"\n")

conn.close()
