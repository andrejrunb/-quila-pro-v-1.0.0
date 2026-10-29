import os
import json
import hashlib
import time
import urllib.request
import urllib.parse
import sqlite3
from typing import Dict, List, Any, Optional

DEFAULT_USER_AGENT = "AquilaPro-Curator/2.1 (Educational Academic Non-Profit Curator; LGPD-Certified; mailto:dev@aquila.local)"

class InternetArchiveAdapter:
    def __init__(self, db_path: str = "acervo/acervo_multimodal_archive.db", base_dir: str = "acervo"):
        self.db_path = db_path
        self.base_dir = base_dir
        self.headers = {"User-Agent": DEFAULT_USER_AGENT}
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def archive_search(self, query: str, mediatype: Optional[str] = None, editorial_collection: str = "Geral", rows: int = 50) -> List[Dict[str, Any]]:
        """
        Executa pesquisa delimitada na Search API oficial do Internet Archive.
        """
        q_parts = [query]
        if mediatype:
            q_parts.append(f"mediatype:{mediatype}")
        full_q = " AND ".join(q_parts)
        
        params = {
            "q": full_q,
            "fl[]": ["identifier", "title", "creator", "year", "date", "mediatype", "language", "licenseurl", "rights", "description"],
            "rows": rows,
            "output": "json"
        }
        
        # Build query string manually to preserve repeated fl[]
        qs = urllib.parse.urlencode([("q", full_q), ("rows", rows), ("output", "json")])
        fl_params = "&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=year&fl[]=date&fl[]=mediatype&fl[]=language&fl[]=licenseurl&fl[]=rights&fl[]=description"
        search_url = f"https://archive.org/advancedsearch.php?{qs}{fl_params}"
        
        req = urllib.request.Request(search_url, headers=self.headers)
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        
        docs = data.get("response", {}).get("docs", [])
        results = []
        conn = self._get_conn()
        cursor = conn.cursor()
        
        for doc in docs:
            identifier = doc.get("identifier")
            if not identifier:
                continue
            
            title = doc.get("title", identifier)
            creator = doc.get("creator")
            if isinstance(creator, list):
                creator = "; ".join(creator)
            year = doc.get("year")
            try:
                year_int = int(year) if year else None
            except:
                year_int = None
            
            media = doc.get("mediatype", "texts")
            lang = doc.get("language")
            if isinstance(lang, list):
                lang = "; ".join(lang)
            desc = doc.get("description", "")
            if isinstance(desc, list):
                desc = " ".join(desc)
            
            item_url = f"https://archive.org/details/{identifier}"
            meta_json = json.dumps(doc, ensure_ascii=False)
            sha256_meta = hashlib.sha256(meta_json.encode("utf-8")).hexdigest()
            now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            
            date_val = doc.get("date")
            if isinstance(date_val, list):
                date_val = str(date_val[0])
            elif date_val is not None:
                date_val = str(date_val)
            
            cursor.execute("""
                INSERT OR IGNORE INTO archive_items 
                (identifier, title, creator, year_published, date_original, mediatype, language, editorial_collection, description, item_url, review_status, discovered_at, metadata_json, sha256_metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DISCOVERED', ?, ?, ?)
            """, (identifier, title, creator, year_int, date_val, media, lang, editorial_collection, desc, item_url, now_iso, meta_json, sha256_meta))
            
            results.append({
                "identifier": identifier,
                "title": title,
                "creator": creator,
                "year": year_int,
                "mediatype": media,
                "language": lang,
                "editorial_collection": editorial_collection,
                "item_url": item_url
            })
            
        conn.commit()
        conn.close()
        return results

    def archive_get_metadata(self, identifier: str) -> Dict[str, Any]:
        """
        Recupera os metadados canônicos completos do item via endpoint https://archive.org/metadata/{identifier}
        """
        meta_url = f"https://archive.org/metadata/{identifier}"
        req = urllib.request.Request(meta_url, headers=self.headers)
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        
        # Save raw JSON manifest in discovery folder
        manifest_path = os.path.join(self.base_dir, "discovery", f"{identifier}_metadata.json")
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        return data

    def archive_list_files(self, identifier: str) -> List[Dict[str, Any]]:
        """
        Lista e cadastra no SQLite todos os arquivos associados ao item.
        """
        data = self.archive_get_metadata(identifier)
        files = data.get("files", [])
        server = data.get("server")
        dir_path = data.get("dir")
        
        conn = self._get_conn()
        cursor = conn.cursor()
        registered_files = []
        
        for f in files:
            fname = f.get("name")
            if not fname:
                continue
            fmt = f.get("format", "")
            size = f.get("size")
            try:
                size_int = int(size) if size else 0
            except:
                size_int = 0
            sha256 = f.get("sha256") or f.get("sha1") or f.get("md5", "")
            
            # Formar URL direta oficial de download
            download_url = f"https://archive.org/download/{identifier}/{urllib.parse.quote(fname)}"
            
            # Identificar propósito do arquivo
            file_purpose = "ORIGINAL_DOCUMENT"
            fname_lower = fname.lower()
            if fname_lower.endswith(".txt") or "djvu.txt" in fname_lower:
                file_purpose = "DERIVED_TEXT"
            elif fname_lower.endswith((".jpg", ".png", ".webp")) or "thumb" in fname_lower:
                file_purpose = "THUMBNAIL_IMAGE"
            elif fname_lower.endswith((".mp3", ".ogg", ".flac", ".mp4", ".ogv")):
                file_purpose = "MEDIA_STREAM"
            elif fname_lower.endswith((".xml", ".json", ".sqlite")):
                file_purpose = "METADATA_MANIFEST"
                
            file_id = f"{identifier}::{fname}"
            cursor.execute("""
                INSERT OR REPLACE INTO archive_files 
                (id, item_identifier, filename, format, size_bytes, sha256, download_url, is_selected, file_purpose)
                VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
            """, (file_id, identifier, fname, fmt, size_int, sha256, download_url, file_purpose))
            
            registered_files.append({
                "id": file_id,
                "filename": fname,
                "format": fmt,
                "size_bytes": size_int,
                "purpose": file_purpose,
                "download_url": download_url
            })
            
        conn.commit()
        conn.close()
        return registered_files

    def evaluate_rights_and_register(self, identifier: str, author: Optional[str], author_death_year: Optional[int], 
                                     year_published: Optional[int], license_url: Optional[str], declaration: str = "") -> Dict[str, Any]:
        """
        Avalia os direitos autorais sob a ótica da Lei 9.610/98 (Art. 41 e Art. 8º) e Licenças CC.
        Registra a evidência e a matriz de decisão por operação.
        """
        now_year = 2026
        legal_basis = "UNKNOWN"
        is_public_domain_br = False
        
        # 1. Lei 9.610/98 Art. 41: 70 anos post-mortem (a partir de 1º de janeiro do ano subsequente)
        if author_death_year and (now_year - author_death_year) > 70:
            legal_basis = f"LDA_ART_41_DOMINIO_PUBLICO (Autor faleceu em {author_death_year}; > 70 anos)"
            is_public_domain_br = True
        elif year_published and year_published < 1850:
            legal_basis = f"DOMINIO_PUBLICO_HISTORICO (Publicado em {year_published}; anterior a 1850)"
            is_public_domain_br = True
        elif license_url and ("publicdomain" in license_url or "zero" in license_url):
            legal_basis = "CREATIVE_COMMONS_CC0_PUBLIC_DOMAIN"
            is_public_domain_br = True
        elif license_url and "by" in license_url:
            legal_basis = f"CREATIVE_COMMONS ({license_url})"
        else:
            legal_basis = "RESERVED_OR_UNCERTAIN_COPYRIGHT"

        conn = self._get_conn()
        cursor = conn.cursor()
        
        evidence_id = f"ev::{identifier}::{int(time.time())}"
        now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        
        cursor.execute("""
            INSERT INTO rights_evidence
            (id, item_identifier, declaration_found, evidence_url, identified_holder, license_and_version, territory_examined, author_death_year, legal_basis, review_officer, examined_at)
            VALUES (?, ?, ?, ?, ?, ?, 'BR', ?, ?, 'SovereignLicensePartitioner', ?)
        """, (evidence_id, identifier, declaration, license_url or f"https://archive.org/details/{identifier}", author, legal_basis, author_death_year, legal_basis, now_iso))
        
        # Matriz de decisões por operação
        operations_map = {
            "CATALOG_METADATA": ("PERMITTED", "Metadados públicos para fins de indexação e catalogação bibliográfica."),
            "DISPLAY_READ": ("PERMITTED" if is_public_domain_br else "RESTRICTED", "Acesso à leitura condicionado ao domínio público verificado."),
            "EXTRACT_IMAGE": ("PERMITTED" if is_public_domain_br else "RESTRICTED", "Extração de ilustrações históricas e diagramas documentais."),
            "TRANSLATE_ADAPT": ("PERMITTED" if is_public_domain_br else "PROHIBITED", "Obras derivadas permitidas apenas para domínio público comprovado."),
            "OFFLINE_PACKAGE": ("PERMITTED" if is_public_domain_br else "RESTRICTED", "Distribuição em pacote offline para ambiente escolar."),
            "RAG_INDEX": ("PERMITTED", "Indexação semântica estrita com citação precisa de fonte e página para apoio pedagógico."),
            "SFT_DPO_TRAINING": ("PERMITTED" if is_public_domain_br else "PROHIBITED", "Treinamento generativo restrito a obras com liberação autoral confirmada.")
        }
        
        for op, (dec, just) in operations_map.items():
            dec_id = f"dec::{identifier}::{op}"
            cursor.execute("""
                INSERT OR REPLACE INTO rights_decisions
                (id, item_identifier, rights_evidence_id, operation, decision, justification, decided_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (dec_id, identifier, evidence_id, op, dec, just, now_iso))
            
        new_status = "APPROVED" if is_public_domain_br else "UNDER_REVIEW"
        cursor.execute("UPDATE archive_items SET review_status = ? WHERE identifier = ?", (new_status, identifier))
        
        conn.commit()
        conn.close()
        
        return {
            "identifier": identifier,
            "legal_basis": legal_basis,
            "is_public_domain_br": is_public_domain_br,
            "status": new_status,
            "operations": {op: dec for op, (dec, _) in operations_map.items()}
        }

    def download_file_to_quarantine(self, identifier: str, filename: str) -> str:
        """
        Baixa o arquivo estritamente para o diretório de quarentena.
        Valida que o caminho não escape de 'acervo/quarantine'.
        """
        safe_fname = os.path.basename(filename)
        dest_dir = os.path.join(self.base_dir, "quarantine", identifier)
        os.makedirs(dest_dir, exist_ok=True)
        dest_path = os.path.join(dest_dir, safe_fname)
        
        download_url = f"https://archive.org/download/{identifier}/{urllib.parse.quote(filename)}"
        req = urllib.request.Request(download_url, headers=self.headers)
        
        with urllib.request.urlopen(req, timeout=45) as resp, open(dest_path, "wb") as out_f:
            chunk = resp.read(64 * 1024)
            while chunk:
                out_f.write(chunk)
                chunk = resp.read(64 * 1024)
                
        return dest_path

    def promote_to_approved(self, identifier: str, filename: str, target_category: str = "originals") -> str:
        """
        Move o arquivo revisado e aprovado da quarentena para o armazenamento aprovado.
        """
        src = os.path.join(self.base_dir, "quarantine", identifier, os.path.basename(filename))
        if not os.path.exists(src):
            raise FileNotFoundError(f"Arquivo de origem na quarentena não encontrado: {src}")
            
        dest_dir = os.path.join(self.base_dir, "approved", target_category, identifier)
        os.makedirs(dest_dir, exist_ok=True)
        dest_path = os.path.join(dest_dir, os.path.basename(filename))
        
        os.replace(src, dest_path)
        return dest_path

    def register_text_segments(self, identifier: str, page_index: int, page_label: str, text: str, stage: str, discipline: str, bncc: str = ""):
        """
        Registra páginas e trechos textuais rastreáveis no SQLite para o RAG.
        """
        conn = self._get_conn()
        cursor = conn.cursor()
        
        page_id = f"page::{identifier}::{page_index}"
        cursor.execute("""
            INSERT OR REPLACE INTO document_pages
            (id, item_identifier, file_id, page_index, printed_page_label, raw_text, ocr_engine, text_quality_score)
            VALUES (?, ?, ?, ?, ?, ?, 'ArchiveOriginalOrText', 1.0)
        """, (page_id, identifier, f"{identifier}::text", page_index, page_label, text))
        
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        for idx, para in enumerate(paragraphs):
            seg_id = f"seg::{identifier}::{page_index}::{idx}"
            tokens = len(para.split())
            cursor.execute("""
                INSERT OR REPLACE INTO text_segments
                (id, page_id, item_identifier, segment_index, segment_type, content, token_count, is_historical_source)
                VALUES (?, ?, ?, ?, 'PARAGRAPH', ?, ?, 1)
            """, (seg_id, page_id, identifier, idx, para, tokens))
            
            # Mapeamento Curricular
            map_id = f"map::{seg_id}"
            cursor.execute("""
                INSERT OR REPLACE INTO curriculum_mappings
                (id, item_identifier, segment_or_asset_id, educational_stage, discipline, bncc_code, pedagogical_objective)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (map_id, identifier, seg_id, stage, discipline, bncc, f"Apoio ao ensino e análise crítica de fontes em {discipline}"))
            
        conn.commit()
        conn.close()

    def register_media_asset(self, identifier: str, filename: str, page_index: Optional[int], 
                             caption: str, gen_desc: str, stage: str, discipline: str, local_path: str):
        """
        Registra ativo multimodal documental no acervo aprovado.
        """
        conn = self._get_conn()
        cursor = conn.cursor()
        asset_id = f"asset::{identifier}::{os.path.basename(filename)}"
        
        cursor.execute("""
            INSERT OR REPLACE INTO media_assets
            (asset_id, source_item_id, source_file, page_index, original_caption, generated_description, review_status, local_file_path)
            VALUES (?, ?, ?, ?, ?, ?, 'DOCUMENTARY_REPRODUCTION', ?)
        """, (asset_id, identifier, filename, page_index, caption, gen_desc, local_path))
        
        map_id = f"map::{asset_id}"
        cursor.execute("""
            INSERT OR REPLACE INTO curriculum_mappings
            (id, item_identifier, segment_or_asset_id, educational_stage, discipline, pedagogical_objective)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (map_id, identifier, asset_id, stage, discipline, f"Recurso visual documental para enriquecimento de aulas de {discipline}"))
        
        conn.commit()
        conn.close()
