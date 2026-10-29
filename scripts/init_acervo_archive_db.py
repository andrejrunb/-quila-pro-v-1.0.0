import os
import sqlite3

BASE_ACERVO_DIR = "acervo"
SUBDIRS = [
    os.path.join(BASE_ACERVO_DIR, "discovery"),
    os.path.join(BASE_ACERVO_DIR, "quarantine"),
    os.path.join(BASE_ACERVO_DIR, "approved", "originals"),
    os.path.join(BASE_ACERVO_DIR, "approved", "text"),
    os.path.join(BASE_ACERVO_DIR, "approved", "images"),
    os.path.join(BASE_ACERVO_DIR, "approved", "audio"),
    os.path.join(BASE_ACERVO_DIR, "approved", "video"),
    os.path.join(BASE_ACERVO_DIR, "manifests"),
]

for d in SUBDIRS:
    os.makedirs(d, exist_ok=True)
print("Acervo directory tree initialized successfully.")

DB_PATHS = [
    os.path.join(BASE_ACERVO_DIR, "acervo_multimodal_archive.db"),
    os.path.join("apps", "electron", "src", "database", "acervo_multimodal_archive.db")
]

SCHEMA_SQL = """
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- 1. Itens Descobertos e Catalogados no Internet Archive
CREATE TABLE IF NOT EXISTS archive_items (
    identifier TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    creator TEXT,
    year_published INTEGER,
    date_original TEXT,
    mediatype TEXT NOT NULL,
    language TEXT,
    editorial_collection TEXT NOT NULL,
    description TEXT,
    item_url TEXT NOT NULL,
    review_status TEXT DEFAULT 'DISCOVERED' CHECK(review_status IN ('DISCOVERED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'QUARANTINED')),
    discovered_at TEXT NOT NULL,
    metadata_json TEXT,
    sha256_metadata TEXT
);

-- 2. Arquivos Individuais dos Itens
CREATE TABLE IF NOT EXISTS archive_files (
    id TEXT PRIMARY KEY,
    item_identifier TEXT NOT NULL,
    filename TEXT NOT NULL,
    format TEXT,
    size_bytes INTEGER,
    sha256 TEXT,
    download_url TEXT,
    is_selected BOOLEAN DEFAULT 0,
    file_purpose TEXT DEFAULT 'ORIGINAL_DOCUMENT' CHECK(file_purpose IN ('ORIGINAL_DOCUMENT', 'DERIVED_TEXT', 'THUMBNAIL_IMAGE', 'MEDIA_STREAM', 'METADATA_MANIFEST')),
    FOREIGN KEY(item_identifier) REFERENCES archive_items(identifier) ON DELETE CASCADE
);

-- 3. Evidências de Direitos Autorais
CREATE TABLE IF NOT EXISTS rights_evidence (
    id TEXT PRIMARY KEY,
    item_identifier TEXT NOT NULL,
    declaration_found TEXT,
    evidence_url TEXT,
    identified_holder TEXT,
    license_and_version TEXT,
    territory_examined TEXT DEFAULT 'BR',
    author_death_year INTEGER,
    legal_basis TEXT NOT NULL,
    exceptions_or_components TEXT,
    restrictions_and_pendencies TEXT,
    review_officer TEXT NOT NULL,
    examined_at TEXT NOT NULL,
    FOREIGN KEY(item_identifier) REFERENCES archive_items(identifier) ON DELETE CASCADE
);

-- 4. Matriz de Decisão de Direitos por Operação
CREATE TABLE IF NOT EXISTS rights_decisions (
    id TEXT PRIMARY KEY,
    item_identifier TEXT NOT NULL,
    rights_evidence_id TEXT NOT NULL,
    operation TEXT NOT NULL CHECK(operation IN (
        'CATALOG_METADATA',
        'DISPLAY_READ',
        'EXTRACT_IMAGE',
        'TRANSLATE_ADAPT',
        'OFFLINE_PACKAGE',
        'RAG_INDEX',
        'SFT_DPO_TRAINING',
        'REDISTRIBUTE_DATASET'
    )),
    decision TEXT NOT NULL CHECK(decision IN ('PERMITTED', 'RESTRICTED', 'PROHIBITED')),
    justification TEXT NOT NULL,
    restrictions_notice TEXT,
    decided_at TEXT NOT NULL,
    FOREIGN KEY(item_identifier) REFERENCES archive_items(identifier) ON DELETE CASCADE,
    FOREIGN KEY(rights_evidence_id) REFERENCES rights_evidence(id) ON DELETE CASCADE
);

-- 5. Páginas Estruturadas de Documentos (Livros, Artigos, Cadernos)
CREATE TABLE IF NOT EXISTS document_pages (
    id TEXT PRIMARY KEY,
    item_identifier TEXT NOT NULL,
    file_id TEXT NOT NULL,
    page_index INTEGER NOT NULL,
    printed_page_label TEXT,
    raw_text TEXT,
    ocr_engine TEXT,
    text_quality_score REAL,
    is_missing_or_damaged BOOLEAN DEFAULT 0,
    FOREIGN KEY(item_identifier) REFERENCES archive_items(identifier) ON DELETE CASCADE,
    FOREIGN KEY(file_id) REFERENCES archive_files(id) ON DELETE CASCADE
);

-- 6. Segmentos Textuais Rastreáveis (Parágrafos, Capítulos, Fórmulas)
CREATE TABLE IF NOT EXISTS text_segments (
    id TEXT PRIMARY KEY,
    page_id TEXT NOT NULL,
    item_identifier TEXT NOT NULL,
    segment_index INTEGER NOT NULL,
    segment_type TEXT DEFAULT 'PARAGRAPH' CHECK(segment_type IN ('CHAPTER_TITLE', 'SECTION_HEADER', 'PARAGRAPH', 'FORMULA', 'LIST_ITEM', 'FOOTNOTE', 'EXERCISE')),
    content TEXT NOT NULL,
    token_count INTEGER,
    is_historical_source BOOLEAN DEFAULT 1,
    FOREIGN KEY(page_id) REFERENCES document_pages(id) ON DELETE CASCADE,
    FOREIGN KEY(item_identifier) REFERENCES archive_items(identifier) ON DELETE CASCADE
);

-- 7. Ativos Multimodais (Imagens, Mapas, Diagramas)
CREATE TABLE IF NOT EXISTS media_assets (
    asset_id TEXT PRIMARY KEY,
    source_item_id TEXT NOT NULL,
    source_file TEXT NOT NULL,
    page_index INTEGER,
    printed_page_label TEXT,
    bounding_box TEXT,
    original_caption TEXT,
    generated_description TEXT,
    width INTEGER,
    height INTEGER,
    rights_decision_id TEXT,
    transformations TEXT,
    review_status TEXT DEFAULT 'DOCUMENTARY_REPRODUCTION' CHECK(review_status IN ('DOCUMENTARY_REPRODUCTION', 'PEDAGOGICAL_DERIVATIVE')),
    local_file_path TEXT,
    FOREIGN KEY(source_item_id) REFERENCES archive_items(identifier) ON DELETE CASCADE,
    FOREIGN KEY(rights_decision_id) REFERENCES rights_decisions(id)
);

-- 8. Segmentos Multimodais de Mídia Contínua (Áudio e Vídeo)
CREATE TABLE IF NOT EXISTS media_segments (
    id TEXT PRIMARY KEY,
    asset_id TEXT,
    source_item_id TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK(media_type IN ('AUDIO', 'VIDEO')),
    start_time_ms INTEGER NOT NULL,
    end_time_ms INTEGER NOT NULL,
    transcription TEXT,
    speaker_identified TEXT,
    uncertain_segments_flag BOOLEAN DEFAULT 0,
    historical_warning TEXT,
    local_file_path TEXT,
    FOREIGN KEY(source_item_id) REFERENCES archive_items(identifier) ON DELETE CASCADE
);

-- 9. Mapeamento Curricular BNCC / SAEB / Vestibulares
CREATE TABLE IF NOT EXISTS curriculum_mappings (
    id TEXT PRIMARY KEY,
    item_identifier TEXT NOT NULL,
    segment_or_asset_id TEXT,
    educational_stage TEXT NOT NULL CHECK(educational_stage IN ('FUNDAMENTAL_1', 'FUNDAMENTAL_2', 'ENSINO_MEDIO', 'VESTIBULAR_MEDICINA', 'DOCENCIA')),
    discipline TEXT NOT NULL,
    bncc_code TEXT,
    saeb_descriptor TEXT,
    pedagogical_objective TEXT NOT NULL,
    relevance_score REAL DEFAULT 1.0,
    FOREIGN KEY(item_identifier) REFERENCES archive_items(identifier) ON DELETE CASCADE
);

-- 10. Fila e Registro de Jobs de Processamento
CREATE TABLE IF NOT EXISTS processing_jobs (
    id TEXT PRIMARY KEY,
    item_identifier TEXT NOT NULL,
    job_type TEXT NOT NULL CHECK(job_type IN ('METADATA_EXTRACTION', 'FILE_DOWNLOAD', 'TEXT_EXTRACTION', 'IMAGE_CROPPING', 'AUDIO_TRANSCRIPTION', 'RAG_EMBEDDING')),
    status TEXT NOT NULL CHECK(status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'QUARANTINED')),
    extractor_version TEXT NOT NULL,
    input_file TEXT,
    output_artifacts TEXT,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    error_log TEXT,
    FOREIGN KEY(item_identifier) REFERENCES archive_items(identifier) ON DELETE CASCADE
);

-- 11. Decisões Humanas / Agentes de Revisão Pedagógica
CREATE TABLE IF NOT EXISTS review_decisions (
    id TEXT PRIMARY KEY,
    item_identifier TEXT NOT NULL,
    reviewer_agent TEXT NOT NULL,
    pedagogic_rating INTEGER CHECK(pedagogic_rating BETWEEN 1 AND 5),
    suitability_notes TEXT NOT NULL,
    approved_for_rag BOOLEAN DEFAULT 0,
    decided_at TEXT NOT NULL,
    FOREIGN KEY(item_identifier) REFERENCES archive_items(identifier) ON DELETE CASCADE
);

-- 12. Trilha de Auditoria Imutável (Zero-Bypass Certified)
CREATE TABLE IF NOT EXISTS ingestion_events (
    id TEXT PRIMARY KEY,
    item_identifier TEXT NOT NULL,
    event_type TEXT NOT NULL,
    details TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    sha256_audit_hash TEXT NOT NULL
);

-- Índices de Performance e Consulta RAG
CREATE INDEX IF NOT EXISTS idx_items_collection ON archive_items(editorial_collection);
CREATE INDEX IF NOT EXISTS idx_items_review ON archive_items(review_status);
CREATE INDEX IF NOT EXISTS idx_files_item ON archive_files(item_identifier);
CREATE INDEX IF NOT EXISTS idx_segments_item ON text_segments(item_identifier);
CREATE INDEX IF NOT EXISTS idx_curriculum_discipline ON curriculum_mappings(discipline, educational_stage);
CREATE INDEX IF NOT EXISTS idx_rights_operation ON rights_decisions(operation, decision);
"""

for db_path in DB_PATHS:
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.executescript(SCHEMA_SQL)
    conn.commit()
    conn.close()
    print(f"Database schema initialized at {db_path}")
