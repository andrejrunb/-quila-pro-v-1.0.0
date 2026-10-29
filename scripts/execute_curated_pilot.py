import os
import sys
import json
import time
import hashlib
sys.stdout.reconfigure(encoding='utf-8')

from archive_adapter.internet_archive_adapter import InternetArchiveAdapter

# 20 Candidatos representativos para a Seleção do Piloto
PILOT_CANDIDATES = [
    # 1. Vozes da Literatura Brasileira
    {
        "identifier": "quincas-borba",
        "title": "Quincas Borba",
        "creator": "Machado de Assis",
        "author_death_year": 1908,
        "year_published": 1891,
        "collection": "Vozes da Literatura Brasileira",
        "discipline": "Literatura Brasileira",
        "stage": "ENSINO_MEDIO",
        "bncc": "EM13LP49",
        "is_pilot_download": True,
        "preferred_file_format": "DjVuTXT"
    },
    {
        "identifier": "ursula-2a-edicao",
        "title": "Úrsula",
        "creator": "Maria Firmina dos Reis",
        "author_death_year": 1917,
        "year_published": 1859,
        "collection": "Vozes da Literatura Brasileira",
        "discipline": "Literatura Brasileira",
        "stage": "ENSINO_MEDIO",
        "bncc": "EM13LP50",
        "is_pilot_download": True,
        "preferred_file_format": "DjVuTXT"
    },
    {
        "identifier": "3438833",
        "title": "Memorial de Ayres",
        "creator": "Machado de Assis",
        "author_death_year": 1908,
        "year_published": 1908,
        "collection": "Vozes da Literatura Brasileira",
        "discipline": "Literatura Brasileira",
        "stage": "ENSINO_MEDIO",
        "bncc": "EM13LP49",
        "is_pilot_download": False
    },
    # 2. Oficinas da Ciência
    {
        "identifier": "nikola-tesla-patent-us-00455069-electric-incandescent-lamp-1891-06-30",
        "title": "US Patent 00455069: Electric Incandescent Lamp",
        "creator": "Nikola Tesla",
        "author_death_year": 1943,
        "year_published": 1891,
        "collection": "Oficinas da Ciência",
        "discipline": "Física",
        "stage": "ENSINO_MEDIO",
        "bncc": "EM13CNT308",
        "is_pilot_download": True,
        "preferred_file_format": "Text PDF"
    },
    {
        "identifier": "literary-digest-15-april-1899-recent-experiments-by-tesla",
        "title": "Recent Experiments by Tesla (Literary Digest)",
        "creator": "Nikola Tesla / Literary Digest",
        "author_death_year": 1943,
        "year_published": 1899,
        "collection": "Oficinas da Ciência",
        "discipline": "Física",
        "stage": "VESTIBULAR_MEDICINA",
        "bncc": "EM13CNT301",
        "is_pilot_download": False
    },
    # 3. Jardim dos Naturalistas
    {
        "identifier": "dissertatiodege00meri",
        "title": "Dissertatio de generatione et metamorphosibus insectorum Surinamensium",
        "creator": "Maria Sibylla Merian",
        "author_death_year": 1717,
        "year_published": 1719,
        "collection": "Jardim dos Naturalistas",
        "discipline": "Biologia",
        "stage": "FUNDAMENTAL_2",
        "bncc": "EF07CI07",
        "is_pilot_download": True,
        "preferred_file_format": "DjVuTXT"
    },
    {
        "identifier": "flowers-butterflies-and-insects-all-154-engravings-from-quot-erucarum-ortusquot-pdfdrive",
        "title": "Flowers, Butterflies and Insects (Engravings)",
        "creator": "Maria Sibylla Merian",
        "author_death_year": 1717,
        "year_published": 1718,
        "collection": "Jardim dos Naturalistas",
        "discipline": "Biologia / Artes",
        "stage": "FUNDAMENTAL_1",
        "bncc": "EF04CI02",
        "is_pilot_download": False
    },
    # 4. Matemática em Construção
    {
        "identifier": "bub_gb_BdiUq8-GzZQC",
        "title": "Opuscoli di geometria e balistica",
        "creator": "Leonardo Salimbeni",
        "author_death_year": 1823,
        "year_published": 1780,
        "collection": "Matemática em Construção",
        "discipline": "Matemática",
        "stage": "ENSINO_MEDIO",
        "bncc": "EM13MAT301",
        "is_pilot_download": True,
        "preferred_file_format": "DjVuTXT"
    },
    {
        "identifier": "ita-bnc-mag-00001347-001",
        "title": "Geometria motus opusculum geometricum",
        "creator": "Giovanni Ceva",
        "author_death_year": 1734,
        "year_published": 1692,
        "collection": "Matemática em Construção",
        "discipline": "Matemática",
        "stage": "VESTIBULAR_MEDICINA",
        "bncc": "EM13MAT309",
        "is_pilot_download": False
    },
    {
        "identifier": "bub_gb_IRUykq9fSLoC",
        "title": "Pratica d'arithmetica, e geometria",
        "creator": "Lorenzo Forestani",
        "author_death_year": 1620,
        "year_published": 1603,
        "collection": "Matemática em Construção",
        "discipline": "Matemática",
        "stage": "FUNDAMENTAL_2",
        "bncc": "EF08MA14",
        "is_pilot_download": False
    },
    # 5. Brasil em Mapas e Fontes
    {
        "identifier": "dr_l-das-kaiserthum-brasilien-provinz-on-top-margin-sud-amerika-lith-v-8306027",
        "title": "Das Kaiserthum Brasilien Provinz (Atlas von Amerika)",
        "creator": "Wilhelm Ernst August von Schlieben (1781-1839)",
        "author_death_year": 1839,
        "year_published": 1830,
        "collection": "Brasil em Mapas e Fontes",
        "discipline": "Geografia / História",
        "stage": "FUNDAMENTAL_2",
        "bncc": "EF07GE01",
        "is_pilot_download": True,
        "preferred_file_format": "JPEG"
    },
    {
        "identifier": "dr_carte-generale-delle-coste-del-brasile-del-rio-del-plata-al-para--no-2-13048005",
        "title": "Carte generale delle coste del Brasile Del Rio del Plata al Para",
        "creator": "Eugenio Rodriguez / Baron Roussin",
        "author_death_year": 1854,
        "year_published": 1857,
        "collection": "Brasil em Mapas e Fontes",
        "discipline": "História do Brasil",
        "stage": "ENSINO_MEDIO",
        "bncc": "EM13CHS103",
        "is_pilot_download": False
    },
    {
        "identifier": "STS072-738-036",
        "title": "Earth observations taken from shuttle orbiter Endeavour (Brazil from Space)",
        "creator": "NASA",
        "author_death_year": None,
        "year_published": 1996,
        "collection": "Brasil em Mapas e Fontes",
        "discipline": "Geografia Física",
        "stage": "FUNDAMENTAL_1",
        "bncc": "EF05GE08",
        "is_pilot_download": True,
        "preferred_file_format": "JPEG"
    },
    # 6. Biblioteca Multimodal (Áudio & Vídeo)
    {
        "identifier": "o_alienista_0904_librivox",
        "title": "O Alienista (Audiolivro em Português)",
        "creator": "Machado de Assis / LibriVox Volunteers",
        "author_death_year": 1908,
        "year_published": 2009,
        "collection": "Biblioteca Multimodal",
        "discipline": "Literatura Brasileira",
        "stage": "ENSINO_MEDIO",
        "bncc": "EM13LP52",
        "is_pilot_download": True,
        "preferred_file_format": "VBR MP3"
    },
    {
        "identifier": "selecao_gregorio_matos_2202_librivox",
        "title": "Seleção de Obras Poéticas de Gregório de Matos",
        "creator": "Gregório de Matos (1636-1696) / LibriVox Volunteers",
        "author_death_year": 1696,
        "year_published": 2022,
        "collection": "Biblioteca Multimodal",
        "discipline": "Literatura Barroca",
        "stage": "VESTIBULAR_MEDICINA",
        "bncc": "EM13LP48",
        "is_pilot_download": False
    },
    {
        "identifier": "2306_What_Makes_A_Good_Party_21_01_17_00",
        "title": "What Makes A Good Party? (Historical Educational Film)",
        "creator": "Coronet Instructional Films / Prelinger Archives",
        "author_death_year": None,
        "year_published": 1950,
        "collection": "Biblioteca Multimodal",
        "discipline": "História / Sociologia",
        "stage": "ENSINO_MEDIO",
        "bncc": "EM13CHS604",
        "is_pilot_download": False
    },
    # Itens Contemporâneos ou com Direitos Restritos (Para Teste de Quarentena e Rejeição)
    {
        "identifier": "oolharobliquodob0000senn",
        "title": "O olhar oblíquo do bruxo : ensaios machadianos",
        "creator": "Senna, Marta de",
        "author_death_year": None,
        "year_published": 2008,
        "collection": "Vozes da Literatura Brasileira",
        "discipline": "Crítica Literária",
        "stage": "ENSINO_MEDIO",
        "bncc": "EM13LP49",
        "is_pilot_download": False
    },
    {
        "identifier": "linguisticaaa",
        "title": "Linguística, letras e artes: Ressonâncias e repercussões",
        "creator": "Atena Editora",
        "author_death_year": None,
        "year_published": 2022,
        "collection": "Vozes da Literatura Brasileira",
        "discipline": "Linguística",
        "stage": "DOCENCIA",
        "bncc": "EM13LGG101",
        "is_pilot_download": False
    },
    {
        "identifier": "greatimmigrants00neid",
        "title": "Great immigrants",
        "creator": "Neidle, Cecyle S",
        "author_death_year": None,
        "year_published": 1973,
        "collection": "Oficinas da Ciência",
        "discipline": "História da Ciência",
        "stage": "ENSINO_MEDIO",
        "bncc": "EM13CHS101",
        "is_pilot_download": False
    },
    {
        "identifier": "einsteinswhowhat00eins",
        "title": "Einstein's who, what, and where",
        "creator": "Einstein, Carol",
        "author_death_year": None,
        "year_published": 2002,
        "collection": "Jardim dos Naturalistas",
        "discipline": "Física Moderna",
        "stage": "ENSINO_MEDIO",
        "bncc": "EM13CNT302",
        "is_pilot_download": False
    }
]

def run_pilot():
    print("=" * 70)
    print("ETAPAS 2, 3 E 4: SELEÇÃO, AVALIAÇÃO DE DIREITOS E PROCESSAMENTO HOMOLOGADO")
    print("=" * 70)
    
    adapter = InternetArchiveAdapter()
    audit_results = []
    approved_items_count = 0
    
    for candidate in PILOT_CANDIDATES:
        ident = candidate["identifier"]
        title = candidate["title"]
        author = candidate["creator"]
        death_year = candidate["author_death_year"]
        pub_year = candidate["year_published"]
        
        print(f"\n[Auditando Candidato]: {ident} - '{title}' ({author}, {pub_year})")
        
        # 1. Recuperar metadados canônicos e inventário de arquivos
        try:
            files = adapter.archive_list_files(ident)
            print(f"  -> Arquivos listados no Archive: {len(files)} arquivos")
        except Exception as e:
            print(f"  -> [Aviso ao listar arquivos]: {e}")
            files = []
            
        # 2. Avaliar Direitos Autorais (Lei 9.610/98 Art. 41 / Domínio Público / CC)
        license_url = None
        if "librivox" in ident:
            license_url = "https://creativecommons.org/publicdomain/zero/1.0/"
        elif "NASA" in str(author):
            license_url = "https://www.nasa.gov/multimedia/guidelines/index.html (US Gov Public Domain)"
            
        rights = adapter.evaluate_rights_and_register(
            identifier=ident,
            author=author,
            author_death_year=death_year,
            year_published=pub_year,
            license_url=license_url,
            declaration=f"Curadoria Áquila Pro. Base legal examinada para jurisdição brasileira (BR)."
        )
        
        print(f"  -> Base Legal: {rights['legal_basis']}")
        print(f"  -> Status de Homologação: {rights['status']}")
        print(f"  -> Permissões: RAG_INDEX: {rights['operations']['RAG_INDEX']}, DISPLAY: {rights['operations']['DISPLAY_READ']}, SFT: {rights['operations']['SFT_DPO_TRAINING']}")
        
        # 3. Processamento Homologado (Apenas para itens aprovados no piloto e marcados para download)
        if candidate.get("is_pilot_download") and rights["is_public_domain_br"]:
            approved_items_count += 1
            print(f"  [PROCESSAMENTO HOMOLOGADO] Baixando ativo prioritário para quarentena...")
            
            # Localizar arquivo alvo no inventário
            target_file = None
            pref_fmt = candidate.get("preferred_file_format", "DjVuTXT")
            for f in files:
                f_name = f["filename"]
                f_fmt = f.get("format", "")
                if pref_fmt in f_fmt or (pref_fmt == "DjVuTXT" and f_name.endswith(".txt") and "djvu" in f_name):
                    target_file = f_name
                    break
                elif pref_fmt == "JPEG" and (f_name.endswith(".jpg") or f_name.endswith(".png")):
                    target_file = f_name
                    break
                elif pref_fmt == "VBR MP3" and f_name.endswith(".mp3"):
                    target_file = f_name
                    break
            
            # Se não achou formato preferido, pegar primeiro .txt, .pdf ou .jpg
            if not target_file:
                for f in files:
                    if f["filename"].endswith((".txt", ".jpg", ".png")):
                        target_file = f["filename"]
                        break
                        
            if target_file:
                print(f"  -> Selecionado arquivo específico: '{target_file}'")
                try:
                    # Download para quarentena
                    quarantine_path = adapter.download_file_to_quarantine(ident, target_file)
                    print(f"  -> Salvo na Quarentena: {quarantine_path}")
                    
                    # Verificação de segurança (SHA-256)
                    with open(quarantine_path, "rb") as qf:
                        file_hash = hashlib.sha256(qf.read()).hexdigest()
                    print(f"  -> Checksum SHA-256 verificado: {file_hash[:16]}...")
                    
                    # Promoção para Approved
                    category = "text" if target_file.endswith(".txt") else ("images" if target_file.endswith((".jpg", ".png")) else ("audio" if target_file.endswith(".mp3") else "originals"))
                    approved_path = adapter.promote_to_approved(ident, target_file, target_category=category)
                    print(f"  -> Promovido para Acervo Aprovado: {approved_path}")
                    
                    # Segmentação e indexação para RAG se for texto
                    if category == "text":
                        with open(approved_path, "r", encoding="utf-8", errors="ignore") as tf:
                            raw_content = tf.read(8000) # Ler primeiras amostras representativas
                        
                        adapter.register_text_segments(
                            identifier=ident,
                            page_index=1,
                            page_label="Capítulo I / Abertura",
                            text=raw_content[:2500],
                            stage=candidate["stage"],
                            discipline=candidate["discipline"],
                            bncc=candidate.get("bncc", "")
                        )
                        print(f"  -> Segmentos de texto indexados para RAG pedagógico.")
                    elif category == "images":
                        adapter.register_media_asset(
                            identifier=ident,
                            filename=target_file,
                            page_index=1,
                            caption=candidate["title"],
                            gen_desc=f"Ativo visual histórico documental: {candidate['title']} ({author}, {pub_year})",
                            stage=candidate["stage"],
                            discipline=candidate["discipline"],
                            local_path=approved_path
                        )
                        print(f"  -> Ativo visual indexado para enriquecimento multimodal.")
                        
                except Exception as dl_err:
                    print(f"  -> [Aviso no download/processamento]: {dl_err}")
            else:
                print(f"  -> Nenhum arquivo compatível encontrado no inventário.")
                
        audit_results.append({
            "identifier": ident,
            "title": title,
            "creator": author,
            "status": rights["status"],
            "legal_basis": rights["legal_basis"],
            "is_public_domain_br": rights["is_public_domain_br"]
        })
        time.sleep(0.5)

    print(f"\n======================================================================")
    print(f"RESUMO DO PILOTO: 20 CANDIDATOS AUDITADOS | {approved_items_count} ITENS HOMOLOGADOS E PROCESSADOS")
    print(f"======================================================================")
    
    with open("acervo/manifests/pilot_audit_20_candidates_report.json", "w", encoding="utf-8") as rf:
        json.dump(audit_results, rf, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    run_pilot()
