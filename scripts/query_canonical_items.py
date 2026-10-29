import sys
sys.stdout.reconfigure(encoding='utf-8')
from archive_adapter.internet_archive_adapter import InternetArchiveAdapter

adapter = InternetArchiveAdapter()

canonical_queries = [
    ('title:"Dom Casmurro" OR title:"Memorias Posthumas" OR title:"Quincas Borba"', 'texts', 'Vozes da Literatura Brasileira'),
    ('title:"Ursula" AND "Firmina"', 'texts', 'Vozes da Literatura Brasileira'),
    ('creator:"Nikola Tesla" OR (title:"Tesla" AND year:[1890 TO 1923])', 'texts', 'Oficinas da Ciência'),
    ('"Maria Sibylla Merian" AND mediatype:texts', 'texts', 'Jardim dos Naturalistas'),
    ('(title:"Euclid" OR title:"Geometria") AND year:[1500 TO 1900]', 'texts', 'Matemática em Construção'),
    ('title:"Atlas do Imperio do Brazil" OR title:"Carta Geral do Imperio" OR ("map" AND "Brazil" AND year:[1700 TO 1900])', 'image', 'Brasil em Mapas e Fontes'),
    ('collection:audio_bookspoetry AND language:por', 'audio', 'Biblioteca Multimodal'),
    ('collection:classic_tv_commercials OR collection:prelinger AND "education"', 'movies', 'Biblioteca Multimodal')
]

for q, media, col in canonical_queries:
    try:
        res = adapter.archive_search(query=q, mediatype=media, editorial_collection=col, rows=8)
        print(f"[{col}] Query '{q}': {len(res)} itens")
        for r in res[:3]:
            print(f"   -> [{r['identifier']}] {r['title']} ({r['year']}) por {r['creator']}")
    except Exception as e:
        print(f"Error {q}: {e}")
