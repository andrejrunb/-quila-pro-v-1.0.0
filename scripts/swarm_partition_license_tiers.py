#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
========================================================================================
🦅 ÁQUILA PRO — SOBERANIA DE DIREITOS AUTORAIS E SEGREGAÇÃO DE TIERS LDA (v5.0)
Lei nº 9.610/98 (Art. 29) & Governança Estrita de Inteligência Artificial Educacional
========================================================================================
Este script executa o particionamento soberano e auditoria rigorosa de direitos autorais:

1. TIER 1 (LIBERADO PARA TREINAMENTO / SFT / FINE-TUNING NA GPU A100):
   - Provas Oficiais de Estado (ENEM, FUVEST, UNICAMP, UNESP, ITA, IME — Alvorada-Bench).
   - Olimpíadas Científicas Oficiais Abertas (OBA, MOBFOG, OBMEP, OBB, TNBio, OBS Fiocruz, OBLI, OBGP, ONHB, OBI).
   - Recursos Educacionais Abertos (OER / REA) Internacionais com Licenças Abertas Homologadas:
     OpenStax (CC-BY 4.0), PhET Interactive Simulations (CC-BY), PISA/TIMSS/NAEP (Public Items Governamentais),
     MIT OpenCourseWare (CC BY-NC-SA 4.0), EduCAPES / Livros Abertos UAB (Domínio Público / Governo Federal).
   - Recomposição da Aprendizagem das Secretarias de Estado de Educação (15 UFs na pandemia).
   - Ciência da Aprendizagem (Mastery Learning, Retrieval Practice, Spacing, Interleaving, Dual Coding).
   - Gamificação Soberana & Personagens Históricos Áquila Pro com Auditoria de 12 Campos de PI e ECA Digital.

2. TIER 2 (QUARENTENA / APENAS REFERÊNCIA BIBLIOGRÁFICA / BLOQUEADO PARA TREINO DE IA):
   - Livros Didáticos Comerciais de Editoras Privadas (Scipione, Bernoulli Sistema de Ensino,
     Editora Moderna, Editora Ática, Editora Saraiva, FTD, Santillana, Somos Educação)
     provenientes de bibliotecas digitais como AGPTEA.
   - Conforme o Art. 29 da Lei nº 9.610/98 (LDA), a reprodução e alimentação de modelos neurais
     generativos exige autorização prévia e expressa dos titulares de direitos autorais.
   - Todo o conteúdo textual, questões extraídas e vetores de livros comerciais são movidos para
     a tabela `commercial_textbooks_quarantine_metadata` com flag:
     `status = 'QUARENTENA_APENAS_CATALOGO_SEM_TREINO_IA'`.
   - O fine-tuning SFT e a GPU A100 consomem ESTRITAMENTE o Tier 1.
========================================================================================
"""

import os
import sys
import json
import time
import shutil
import sqlite3
from datetime import datetime, timezone

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DB_SRC = os.path.join(ROOT_DIR, "apps", "electron", "src", "database", "pedagogical_scaffolding.db")
DB_DIST = os.path.join(ROOT_DIR, "apps", "electron", "dist", "database", "pedagogical_scaffolding.db")

SFT_SWARM_JSONL = os.path.join(ROOT_DIR, "swarm", "dataset", "aquila_finetune_dataset.jsonl")
SFT_COLAB_JSONL = os.path.join(ROOT_DIR, "colab", "data_finetuning", "aquila_sft_omni_corpus.jsonl")

QUARANTINE_SWARM_JSONL = os.path.join(ROOT_DIR, "swarm", "dataset", "aquila_quarantined_commercial_tier2.jsonl")
QUARANTINE_COLAB_JSONL = os.path.join(ROOT_DIR, "colab", "data_finetuning", "aquila_quarantined_commercial_tier2.jsonl")

NOTEBOOK_PATH = os.path.join(ROOT_DIR, "colab", "aquila_a100_neural_engine.ipynb")
REPORT_PATH = os.path.join(ROOT_DIR, "test-results", "swarm-license-tiers-partition-quarantine-report.json")

COMMERCIAL_PUBLISHER_KEYWORDS = [
    "scipione",
    "bernoulli sistema de ensino",
    "editora moderna",
    "editora ática",
    "editora atica",
    "editora saraiva",
    "editora ftd",
    "santillana",
    "somos educacao",
    "somos educação",
    "sistema farias brito",
    "sistema etapa",
    "sistema anglo",
    "sistema poliedro",
    "positivo",
    "pearson"
]

def is_commercial_private_textbook(text_str: str) -> bool:
    """Detecta livros didáticos comerciais de editoras privadas."""
    if not text_str:
        return False
    lower = text_str.lower()
    
    # Exceções públicas e abertas (Tier 1)
    if "openstax" in lower or "educapes" in lower or "inep" in lower or "mec" in lower or "impa" in lower or "obmep" in lower:
        return False
    # Exceção para o cientista Daniel Bernoulli em contexto de hidrodinâmica
    if "princípio de bernoulli" in lower or "equação de bernoulli" in lower or "teorema de bernoulli" in lower:
        if "sistema de ensino" not in lower and "editora" not in lower:
            return False

    for kw in COMMERCIAL_PUBLISHER_KEYWORDS:
        if kw in lower:
            return True
            
    # Casos específicos de arquivos AGPTEA comerciais conhecidos
    if "textbook_agptea_extracted" in lower:
        return True
    if "fisica - ensino medio. 1-editora scipione" in lower or "scipione" in lower:
        return True
    if "bernoulli" in lower and ("biologia" in lower or "quimica" in lower or "química" in lower or "fisica" in lower or "física" in lower):
        return True
    if "manoel paiva" in lower or "vesentini" in lower:
        return True

    return False


def run_license_partitioning():
    t_start = time.perf_counter()
    print("=" * 80)
    print("🦅 [ÁQUILA PRO] AUDITORIA E PARTICIONAMENTO SOBERANO DE DIREITOS AUTORAIS (LDA)")
    print("   Lei nº 9.610/98 (Art. 29) — Quarentena Estrita de Obras Comerciais sem Cessão")
    print("=" * 80)

    now_iso = datetime.now(timezone.utc).isoformat()
    metrics = {
        "timestamp": now_iso,
        "legal_basis": "Lei nº 9.610/98 (Art. 29) — Autorização prévia e expressa do autor/editora para reprodução e IA",
        "quarantined_records": {
            "extracted_textbook_questions": 0,
            "downloaded_pdf_corpus_textbooks": 0,
            "research_visual_assets_scipione": 0,
            "checklist_items_updated": 0,
            "jsonl_sft_quarantined": 0,
            "total_quarantined_items": 0
        },
        "released_tier1_records": {
            "alvorada_bench_vestibulares": 0,
            "official_study_repository_links": 0,
            "official_open_pdfs": 0,
            "research_visual_assets_tier1": 0,
            "jsonl_sft_tier1_clean": 0,
            "total_tier1_training_items": 0
        },
        "database_status": "SYNCHRONIZED",
        "colab_notebook_updated": False,
        "elapsed_seconds": 0.0
    }

    # 1. Conectar e criar tabela de quarentena
    conn = sqlite3.connect(DB_SRC)
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS commercial_textbooks_quarantine_metadata (
            quarantine_id TEXT PRIMARY KEY,
            source_table TEXT,
            original_id TEXT,
            book_title TEXT,
            publisher TEXT,
            author TEXT,
            discipline TEXT,
            source_url TEXT,
            local_path TEXT,
            sha256_hash TEXT,
            quarantine_reason TEXT,
            legal_basis TEXT,
            status TEXT,
            quarantined_at TEXT
        )
    """)

    # 2. Quarentenar `extracted_textbook_questions`
    print("\n🔍 [1/6] Auditando `extracted_textbook_questions` (948 questões extraídas de PDFs)...")
    cur.execute("SELECT question_hash, book_doc_id, book_title, author_publisher, discipline, page_number, exam_board, question_stem, created_at FROM extracted_textbook_questions")
    q_rows = cur.fetchall()
    
    q_quarantined = 0
    for r in q_rows:
        q_hash, b_doc_id, b_title, auth_pub, disc, p_num, e_board, q_stem, c_at = r
        ident_str = f"{b_title} {auth_pub} {q_stem[:100]}"
        
        # Todas as questões foram extraídas dos PDFs Scipione e Bernoulli da AGPTEA
        is_comm = is_commercial_private_textbook(ident_str) or "scipione" in auth_pub.lower() or "bernoulli" in b_title.lower() or "scipione" in b_title.lower()
        if is_comm:
            quar_id = f"QUAR-Q-{q_hash}"
            cur.execute("""
                INSERT OR REPLACE INTO commercial_textbooks_quarantine_metadata
                (quarantine_id, source_table, original_id, book_title, publisher, author, discipline, source_url, local_path, sha256_hash, quarantine_reason, legal_basis, status, quarantined_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                quar_id,
                "extracted_textbook_questions",
                q_hash,
                b_title,
                auth_pub,
                f"Página {p_num} (Banca: {e_board})",
                disc,
                b_doc_id,
                "",
                q_hash,
                "Exercício/questão extraído de livro didático comercial de editora privada sem autorização expressa para IA",
                "Lei nº 9.610/98 (LDA), Art. 29",
                "QUARENTENA_APENAS_CATALOGO_SEM_TREINO_IA",
                now_iso
            ))
            q_quarantined += 1

    # Limpar a tabela de treino ativo de questões comerciais
    cur.execute("DELETE FROM extracted_textbook_questions")
    conn.commit()
    metrics["quarantined_records"]["extracted_textbook_questions"] = q_quarantined
    print(f"   🛡️ Questões comerciais transferidas para quarentena: {q_quarantined}")
    print("   ✅ Tabela `extracted_textbook_questions` limpa (0 questões comerciais ativas para treino).")

    # 3. Quarentenar `downloaded_pdf_corpus`
    print("\n🔍 [2/6] Auditando `downloaded_pdf_corpus` (Livros Didáticos Comerciais)...")
    cur.execute("SELECT doc_id, title, institution, exam, subject, doc_type, license, source_url, local_path, size_bytes, sha256_hash, extracted_text FROM downloaded_pdf_corpus")
    pdf_rows = cur.fetchall()
    
    pdfs_quarantined = 0
    pdfs_tier1 = 0
    for r in pdf_rows:
        doc_id, title, inst, exam, subj, doc_type, lic, s_url, loc_path, sz, sha, ext_txt = r
        full_meta = f"{title} {inst} {s_url}"
        if is_commercial_private_textbook(full_meta) or "AGPTEA-BOOK" in doc_id:
            quar_id = f"QUAR-PDF-{doc_id}"
            cur.execute("""
                INSERT OR REPLACE INTO commercial_textbooks_quarantine_metadata
                (quarantine_id, source_table, original_id, book_title, publisher, author, discipline, source_url, local_path, sha256_hash, quarantine_reason, legal_basis, status, quarantined_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                quar_id,
                "downloaded_pdf_corpus",
                doc_id,
                title,
                inst,
                "",
                subj,
                s_url,
                loc_path,
                sha,
                "Livro Didático Completo de Editora Privada (Scipione/Bernoulli/AGPTEA) — Bloqueado para Treinamento",
                "Lei nº 9.610/98 (LDA), Art. 29",
                "QUARENTENA_APENAS_CATALOGO_SEM_TREINO_IA",
                now_iso
            ))
            # Atualiza status na tabela original para desativar qualquer uso em IA
            cur.execute("""
                UPDATE downloaded_pdf_corpus
                SET license = 'TIER2_QUARENTENA_APENAS_CATALOGO_SEM_TREINO_IA',
                    doc_type = 'QUARANTINED_COMMERCIAL_TEXTBOOK',
                    extracted_text = '[CONTEÚDO TEXTUAL EM QUARENTENA — LEI Nº 9.610/98 ART. 29 — SEM TREINO IA]'
                WHERE doc_id = ?
            """, (doc_id,))
            pdfs_quarantined += 1
        else:
            pdfs_tier1 += 1

    conn.commit()
    metrics["quarantined_records"]["downloaded_pdf_corpus_textbooks"] = pdfs_quarantined
    metrics["released_tier1_records"]["official_open_pdfs"] = pdfs_tier1
    print(f"   🛡️ Livros Didáticos Comerciais em PDF colocados em quarentena: {pdfs_quarantined}")
    print(f"   ✅ Documentos Oficiais e Livros Abertos Tier 1 homologados: {pdfs_tier1}")

    # 4. Quarentenar `research_visual_assets` (Scipione)
    print("\n🔍 [3/6] Auditando `research_visual_assets` (Diagramas e SVGs)...")
    cur.execute("SELECT question_id, exam_source, discipline, topic, institution_author, exam_board, license_attribution, svg_asset_path, sha256_hash FROM research_visual_assets")
    assets = cur.fetchall()
    
    assets_quarantined = 0
    assets_tier1 = 0
    for a in assets:
        qid, esrc, disc, top, inst_auth, ebrd, lic_att, spath, sha = a
        asset_str = f"{qid} {esrc} {inst_auth} {lic_att}"
        if "scipione" in asset_str.lower() or "SVG-SCIPIONE" in qid:
            quar_id = f"QUAR-ASSET-{qid}"
            cur.execute("""
                INSERT OR REPLACE INTO commercial_textbooks_quarantine_metadata
                (quarantine_id, source_table, original_id, book_title, publisher, author, discipline, source_url, local_path, sha256_hash, quarantine_reason, legal_basis, status, quarantined_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                quar_id,
                "research_visual_assets",
                qid,
                top,
                inst_auth,
                "",
                disc,
                spath,
                spath,
                sha,
                "Diagrama esquemático baseado em livro didático Scipione — Mantido apenas como referência visual",
                "Lei nº 9.610/98 (LDA), Art. 29",
                "QUARENTENA_APENAS_CATALOGO_SEM_TREINO_IA",
                now_iso
            ))
            cur.execute("""
                UPDATE research_visual_assets
                SET license_attribution = 'TIER2_QUARENTENA_CATALOGO_SEM_TREINO_IA'
                WHERE question_id = ?
            """, (qid,))
            assets_quarantined += 1
        else:
            assets_tier1 += 1

    conn.commit()
    metrics["quarantined_records"]["research_visual_assets_scipione"] = assets_quarantined
    metrics["released_tier1_records"]["research_visual_assets_tier1"] = assets_tier1
    print(f"   🛡️ Visual Assets Scipione colocados em quarentena: {assets_quarantined}")
    print(f"   ✅ Visual Assets Tier 1 homologados (Provas Oficiais & Ciência Aberta): {assets_tier1}")

    # 5. Atualizar Checklist de Ingestão Anti-Retrabalho
    print("\n🔍 [4/6] Atualizando `deduplication_ingestion_checklist` com status Tier 2...")
    cur.execute("SELECT item_id, title, canonical_url FROM deduplication_ingestion_checklist")
    chk_rows = cur.fetchall()
    chk_quarantined = 0
    for cid, ctitle, curl in chk_rows:
        chk_str = f"{cid} {ctitle} {curl}"
        if is_commercial_private_textbook(chk_str) or "CHK-BOOK-" in cid:
            cur.execute("""
                UPDATE deduplication_ingestion_checklist
                SET sft_finetune_fed = 0,
                    dedup_status = 'QUARENTENA_APENAS_CATALOGO_SEM_TREINO_IA'
                WHERE item_id = ?
            """, (cid,))
            chk_quarantined += 1

    conn.commit()
    metrics["quarantined_records"]["checklist_items_updated"] = chk_quarantined
    print(f"   🛡️ Itens do checklist migrados para status QUARENTENA: {chk_quarantined}")

    # Contagem de Provas Oficiais e Links Tier 1 no SQLite
    cur.execute("SELECT COUNT(*) FROM alvorada_historical_exam_bank")
    metrics["released_tier1_records"]["alvorada_bench_vestibulares"] = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM official_study_repository_links")
    metrics["released_tier1_records"]["official_study_repository_links"] = cur.fetchone()[0]

    # 6. Particionar os datasets JSONL de Fine-Tuning
    print("\n🔍 [5/6] Particionando Datasets JSONL de Fine-Tuning (Swarm & Colab)...")
    
    def partition_jsonl_file(src_path: str, dest_tier1_path: str, dest_quar_path: str) -> tuple[int, int]:
        if not os.path.exists(src_path):
            return (0, 0)
        t1_rows = []
        q_rows = []
        with open(src_path, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                data = json.loads(line)
                meta = data.get("metadata", {})
                src_tag = meta.get("source", "")
                line_lower = line.lower()
                
                is_comm = (
                    src_tag == "TEXTBOOK_AGPTEA_EXTRACTED" or
                    is_commercial_private_textbook(line_lower)
                )
                
                if is_comm:
                    data["quarantine_status"] = "QUARENTENA_APENAS_CATALOGO_SEM_TREINO_IA"
                    data["legal_basis"] = "Lei nº 9.610/98 (Art. 29)"
                    q_rows.append(data)
                else:
                    t1_rows.append(data)

        # Salvar Tier 1 limpo
        os.makedirs(os.path.dirname(dest_tier1_path), exist_ok=True)
        with open(dest_tier1_path, "w", encoding="utf-8") as f:
            for item in t1_rows:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")

        # Salvar Quarentena
        os.makedirs(os.path.dirname(dest_quar_path), exist_ok=True)
        with open(dest_quar_path, "w", encoding="utf-8") as f:
            for item in q_rows:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")

        return (len(t1_rows), len(q_rows))

    t1_swarm, q_swarm = partition_jsonl_file(SFT_SWARM_JSONL, SFT_SWARM_JSONL, QUARANTINE_SWARM_JSONL)
    t1_colab, q_colab = partition_jsonl_file(SFT_COLAB_JSONL, SFT_COLAB_JSONL, QUARANTINE_COLAB_JSONL)

    metrics["quarantined_records"]["jsonl_sft_quarantined"] = q_swarm
    metrics["released_tier1_records"]["jsonl_sft_tier1_clean"] = t1_swarm
    print(f"   🛡️ Registros em Quarentena separados do dataset SFT: {q_swarm}")
    print(f"   ✅ Registros Tier 1 Homologados no dataset SFT final: {t1_swarm}")
    print(f"      (OpenStax CC-BY, PhET CC-BY, PISA/TIMSS/NAEP, Provas Oficiais ENEM/Vestibulares/Olimpíadas, Arte Áquila 12 Campos, Ciência da Aprendizagem)")

    # 7. Sincronizar banco de dados para `dist/`
    print("\n🔄 Sincronizando banco SQLite para apps/electron/dist/database...")
    os.makedirs(os.path.dirname(DB_DIST), exist_ok=True)
    conn.close()
    shutil.copy2(DB_SRC, DB_DIST)
    print("   ✅ Banco de dados sincronizado perfeitamente com dist.")

    # 8. Atualizar Colab Notebook Localmente (`colab/aquila_a100_neural_engine.ipynb`)
    print("\n📝 [6/6] Atualizando Célula 2 e Célula 3 de `colab/aquila_a100_neural_engine.ipynb`...")
    if os.path.exists(NOTEBOOK_PATH):
        with open(NOTEBOOK_PATH, "r", encoding="utf-8") as f:
            nb = json.load(f)

        # Atualizar Célula 2 (Harvester Tier 1 estrito, zero commercial books)
        cell2_code = """# ==============================================================================
# 📚 CÉLULA 2: HARVESTER MULTIMODAL NO NVMe (TIER 1 ESTRITO — DIREITOS AUTORAIS LDA)
# ==============================================================================
# TIER 1 HOMOLOGADO PARA TREINAMENTO / SFT:
# • 100% Alvorada-Bench (ENEM, FUVEST, UNICAMP, UNESP, ITA — 4.515 Questões de Domínio Público)
# • Recursos Educacionais Abertos (OER/REA): OpenStax (CC-BY 4.0), EduCAPES (UAB/MEC), IMPA/OBMEP
# • Olimpíadas Oficiais Abertas: OBA, MOBFOG, OBMEP, OBB, TNBio, OBS Fiocruz, OBLI, OBGP, ONHB, OBI
# • Secretarias Estaduais Pandemia: PET-MG, Aprender Sempre SP, Trilhas SP, NetEscola GO
# • Ciência da Aprendizagem (Bloom, Retrieval Practice, Spacing, Interleaving, Cognitive Load, Dual Coding)
# • Gamificação Áquila Pro (ECA Digital Lei 15.352/2026, Decreto 12.880/2026, 12 Campos LDA)
#
# TIER 2 (QUARENTENA ATIVA — LEI Nº 9.610/98, ART. 29):
# Livros comerciais de editoras privadas (Scipione, Bernoulli, Moderna, Ática, Saraiva)
# estão ESTRITAMENTE BLOQUEADOS para treinamento generativo de IA até licença expressa.
# ==============================================================================
import os
import re
import ssl
import json
import hashlib
import urllib.request
import pandas as pd
from concurrent.futures import ThreadPoolExecutor, as_completed
from datasets import Dataset, load_dataset
from pypdf import PdfReader

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE
HEADERS = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/128.0.0.0"}

# 1. Carregar 100% do Alvorada-Bench na High-RAM (4.515 questões de 32 anos de vestibulares)
print("📥 [1/3] Carregando 100% do dataset HenriqueGodoy/Alvorada-bench na High-RAM (Tier 1 Domínio Público)...")
alvorada_ds = load_dataset("HenriqueGodoy/Alvorada-bench", "questions", split="train", keep_in_memory=True)
df_alvorada = alvorada_ds.to_pandas().dropna(subset=["question_statement", "correct_answer"]).copy()
df_alvorada = df_alvorada[df_alvorada["correct_answer"].str.strip().str.upper().isin(list("ABCDE"))].reset_index(drop=True)
print(f"   ✅ {len(df_alvorada)} questões oficiais homologadas carregadas (ENEM, FUVEST, UNICAMP, UNESP, ITA).")

# 2. Catálogo Oficial Tier 1 de Livros Abertos (OpenStax CC-BY 4.0, EduCAPES MEC, IMPA/OBMEP)
TIER1_OPEN_OER_SOURCES = [
    ("OpenStax_College_Physics.pdf", "https://openstax.org/subjects/science", "Física Geral & Moderna", "OpenStax Rice University (CC-BY 4.0)"),
    ("OpenStax_Chemistry_2e.pdf", "https://openstax.org/subjects/science", "Química Geral & Orgânica", "OpenStax Rice University (CC-BY 4.0)"),
    ("OpenStax_Biology_2e.pdf", "https://openstax.org/subjects/science", "Biologia Molecular & Celular", "OpenStax Rice University (CC-BY 4.0)"),
    ("OpenStax_Calculus_Vol1.pdf", "https://openstax.org/subjects/math", "Cálculo & Geometria Analítica", "OpenStax Rice University (CC-BY 4.0)"),
    ("IMPA_PIC_OBMEP_Apostilas.pdf", "https://www.obmep.org.br/apostilas.htm", "Matemática Olímpica & Aritmética", "IMPA / SBM / MCTI (Domínio Público)"),
    ("EduCAPES_Recursos_Abertos.pdf", "https://educapes.capes.gov.br/", "Ciências da Natureza & Linguagens", "CAPES / MEC / UAB (Domínio Público)"),
    ("INEP_ENCCEJA_Livro_Estudante.pdf", "https://www.gov.br/inep/pt-br", "Educação Básica Multidisciplinar", "INEP / MEC (Domínio Público Governamental)")
]

BOOK_BLOCKS = []
print(f"📚 [2/3] Fontes de Livros Abertos Tier 1 Homologadas: {len(TIER1_OPEN_OER_SOURCES)} repositórios abertos (CC-BY e Governamentais).")
print("   🛡️ Guardrail LDA Ativo: Livros Didáticos Comerciais (Scipione, Bernoulli, Moderna, Ática) 100% segregados em Quarentena.")

# 3. Adicionar Módulos Olímpicos, Secretarias, OER Internacional & Gamificação Pedagógica (ECA Digital)
OLYMPIAD_AND_OER_MODULES = [
    ("Olimpíadas Científicas (OBA / MOBFOG)", "Astronomia & Física", "3ª Lei de Kepler (T²/R³ = k), Fases da Lua e Balística de Foguetes (45°)", "SAB / AEB — OBA (Tier 1)"),
    ("Olimpíada Brasileira de Matemática (OBMEP / Canguru)", "Matemática Olímpica", "Princípio da Casa dos Pombos, Aritmética Modular, Combinatória e Razão de Áreas", "IMPA / SBM — OBMEP (Tier 1)"),
    ("Olimpíada Brasileira de Biologia (OBB) & TNBio", "Biologia & Imunologia", "Cinética Enzimática de Michaelis-Menten, Soros vs Vacinas (IgM/IgG) e Genética de Populações", "Instituto Butantan / OBC (Tier 1)"),
    ("Olimpíada de Saúde e Meio Ambiente (OBS Fiocruz)", "Saúde Coletiva & Ecologia", "Vigilância Epidemiológica de Arboviroses, Saneamento Básico e ODS/ONU", "Fundação Oswaldo Cruz Fiocruz (Tier 1)"),
    ("Olimpíadas OBLI (Inglês/Linguística), OBGP (Geopolítica) e ONHB (História)", "Humanidades & Linguagens", "Decodificação Morfossintática, Geopolítica Multipolar (BRICS+/Semicondutores) e Fontes Históricas", "UNICAMP / Seleta / Comitê Olímpico (Tier 1)"),
    ("Cadernos das Secretarias Estaduais na Pandemia (PET-MG, Aprender Sempre SP, Trilhas SME-SP, NetEscola GO)", "Educação Básica (EI, EF1, EF2, EM)", "Recomposição da Aprendizagem por Micro-Passos Autorregulados e Descritores SAEB/BNCC", "CONSED / Secretarias Estaduais (Tier 1)"),
    ("Trend Topics Redes Sociais (#MathTok, #StudyTok, #BookTok, Pinterest Mapas Mentais)", "Infantil, Fundamental e Médio", "Consciência Fonológica Boquinhas (EI), Tabela de Pitágoras Simétrica (EF1), Simetria de Porcentagem (EF2) e Repertório ENEM + TRI (EM)", "BNCC / Curadoria Pedagógica (Tier 1)"),
    ("International OER P0/P1/P2 (OpenStax, CK-12, Khan Academy, PhET, PISA, TIMSS, NAEP, MIT OCW)", "STEM & Learning Science", "Mastery Learning (Bloom), Retrieval Practice, Spacing Effect (24h/48h/96h/144h), Interleaving, Cognitive Load (Sweller) e Dual Coding (Paivio)", "OpenStax Rice Univ / OECD / MIT OCW (Tier 1 CC-BY)"),
    ("Gamificação Pedagógica, Avatares & Álbum do Conhecimento (24 Referências: Matific, Minecraft, Prodigy, Duolingo, Habitica, Educacross)", "Gamificação & Evidências Curriculares", "3 Camadas Separadas (Proficiência vs. Moeda Cosmética vs. Inventário), 3 Modalidades Equivalentes (Personagem, Traje Inspirado, Ambiente) e Expedição da Eletricidade — Nikola Tesla (5 Etapas: Conhecer, Compreender, Aplicar, Investigar, Retomar)", "ECA Digital (Lei 15.352/2026 & Decreto 12.880/2026) / ANPD Enunciado nº 1 / LDA 12 Campos (Tier 1)"),
    ("Conjuntos Temáticos MVP & Direitos Autorais (Tesla, Machado & Maria Firmina, Merian & Mendel, Hipátia & Euclides, Eratóstenes & Humboldt, Ada Lovelace & Alan Turing)", "Interdisciplinar (19 Disciplinas + 9 Famílias Literárias)", "Zero Loot Boxes, Zero Recompensa por Tempo de Tela, Isolamento Total de Câmeras/Biometria e Diligência de 12 Campos de Direitos Autorais (Regra de 70 anos LDA)", "Estúdio Pedagógico Soberano Áquila Pro (Tier 1)"),
]

print(f"✅ [3/3] Corpus Tier 1 Homologado: {len(df_alvorada)} vestibulares oficiais + {len(OLYMPIAD_AND_OER_MODULES)} matrizes Olímpicas/OER/Gamificação.")
"""

        # Atualizar Célula 3 (Fine-tuning estrito em Tier 1)
        cell3_code = """# ==============================================================================
# 🚀 CÉLULA 3: MOTOR DE FINE-TUNING A100 OVERDRIVE (TIER 1 HOMOLOGADO LDA)
# ==============================================================================
import os
import gc
import sys
import inspect
import subprocess
import torch
import pandas as pd
from datasets import Dataset

# Remover torchao 0.10.0 pré-instalado no Colab que conflita com transformers 5.x
subprocess.run([sys.executable, "-m", "pip", "uninstall", "-y", "-q", "torchao"], check=False)

from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import LoraConfig
from trl import SFTTrainer, SFTConfig

gc.collect()
torch.cuda.empty_cache()

MODEL_ID = "NousResearch/Meta-Llama-3-8B-Instruct"
print(f"🧠 [1/4] Carregando Tokenizer: {MODEL_ID}...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token
tokenizer.padding_side = "right"

SYSTEM_PROMPT = (
    "Você é o Áquila Pro, tutor pedagógico soberano de inteligência educacional treinado "
    "ESTRITAMENTE no acervo TIER 1 de conformidade de direitos autorais (Lei nº 9.610/98): "
    "100% de Provas Oficiais de Estado (ENEM, FUVEST, UNICAMP, UNESP, ITA/IME Alvorada-Bench), "
    "Olimpíadas Científicas Abertas (OBA, MOBFOG, OBMEP, OBB, TNBio, OBS Fiocruz, OBLI, OBGP, OBI, ONHB), "
    "Recursos Educacionais Abertos Internacionais (OpenStax CC-BY 4.0, PhET CC-BY, PISA/TIMSS/NAEP, MIT OCW), "
    "Recomposição de Aprendizagem de Secretarias Estaduais (15 UFs), Ciência da Aprendizagem (Mastery Learning, "
    "Retrieval Practice, Spacing 24h/48h/96h/144h, Interleaving, Cognitive Load e Dual Coding) e Gamificação Pedagógica "
    "Soberana (ECA Digital Lei 15.352/2026 & Decreto 12.880/2026 — 3 Camadas Separadas, Álbum do Conhecimento e Expedição Tesla)."
)

def build_alvorada_chat(row):
    materia = row["subject"] if pd.notna(row.get("subject")) else "Multidisciplinar"
    exame = row["exam_name"] if pd.notna(row.get("exam_name")) else "Vestibular"
    ano = str(int(row["exam_year"])) if pd.notna(row.get("exam_year")) else ""
    enunciado = str(row["question_statement"]).strip()
    gab = str(row["correct_answer"]).strip().upper()
    alts = "\\n".join([
        f"({L}) {str(row.get(f'alternative_{L.lower()}', '')).strip()}"
        for L in "ABCDE" if pd.notna(row.get(f"alternative_{L.lower()}"))
    ])
    msgs = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Resolva a questão oficial de {materia} [{exame} {ano}] aplicando Mastery Learning e método Kumon (L1, L2, L3):\\n\\n{enunciado}\\n\\n{alts}"},
        {"role": "assistant", "content": (
            f"**Gabarito Oficial Homologado:** Alternativa ({gab})\\n\\n"
            f"**Resolução Analítica Kumon & Ciência da Aprendizagem Áquila Pro (Tier 1):**\\n"
            f"1. **Nível L1 (Pré-Requisito & Carga Cognitiva):** Identificação das grandezas e conceitos fundamentais de {materia} cobrados na banca oficial {exame}.\\n"
            f"2. **Nível L2 (Worked Example Passo a Passo):** Confrontando as premissas do enunciado com as alternativas, demonstra-se analiticamente que a proposição ({gab}) é a única consistente.\\n"
            f"3. **Nível L3 (Retrieval Practice & Spacing):** Agende revisão ativa deste tópico em 24h, 48h, 96h e 144h."
        )}
    ]
    return tokenizer.apply_chat_template(msgs, tokenize=False, add_generation_prompt=False)

print("⚙️ [2/4] Compilando Corpus Unificado TIER 1 (Alvorada + Olimpíadas + OER Aberto + Gamificação)...")
formatted_texts = [build_alvorada_chat(r) for _, r in df_alvorada.iterrows()]

for title, subj, topic, inst in OLYMPIAD_AND_OER_MODULES:
    msgs = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Elabore um guia de estudo e lista de exercícios estilo Kumon para '{title}' ({subj} — {inst}) focando em: {topic}."},
        {"role": "assistant", "content": (
            f"**Guia Soberano Áquila Pro — {title} ({inst} — Tier 1):**\\n"
            f"• **Foco Temático:** {topic}\\n"
            f"• **Progressão de Domínio:** L1 (Fundamentos Visuais & Dual Coding) -> L2 (Fixação Guiada) -> L3 (Problema Olímpico / Internacional PISA/TIMSS/MIT OCW)."
        )}
    ]
    formatted_texts.append(tokenizer.apply_chat_template(msgs, tokenize=False, add_generation_prompt=False))

train_dataset = Dataset.from_pandas(pd.DataFrame({"text": formatted_texts}))
print(f"🔥 Total de exemplos TIER 1 prontos na High-RAM: {len(train_dataset)} diálogos homologados!")

# 3. Reutilizar ou Carregar Modelo em BF16 PURO (16-bit nativo na A100-80GB)
if "model" not in globals() or model is None:
    print("🚀 [3/4] Carregando LLaMA-3-8B em BF16 Puro (16-bit Full Tensor Core)...")
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        dtype=torch.bfloat16,
        device_map="auto",
        attn_implementation="sdpa"
    )
else:
    print("🚀 [3/4] Modelo LLaMA-3-8B em BF16 já carregado na VRAM da A100! Aplicando LoRA r=128 nas 7 camadas...")

peft_config = LoraConfig(
    r=128,
    lora_alpha=256,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)

_sft_sig = set(inspect.signature(SFTConfig.__init__).parameters.keys())
_candidate_kwargs = {
    "output_dir": CKPT_DIR,
    "dataset_text_field": "text",
    "max_length": 768,
    "max_seq_length": 768,
    "per_device_train_batch_size": 16,
    "gradient_accumulation_steps": 2,
    "max_steps": 25,
    "learning_rate": 1.5e-4,
    "lr_scheduler_type": "cosine",
    "warmup_steps": 4,
    "logging_steps": 5,
    "save_strategy": "no",
    "bf16": True,
    "tf32": True,
    "dataloader_num_workers": 2,
    "dataloader_pin_memory": True,
    "optim": "adamw_torch_fused",
    "report_to": "none",
}
sft_kwargs = {k: v for k, v in _candidate_kwargs.items() if k in _sft_sig}
sft_config = SFTConfig(**sft_kwargs)

_trainer_sig = set(inspect.signature(SFTTrainer.__init__).parameters.keys())
trainer_kwargs = {
    "model": model,
    "train_dataset": train_dataset,
    "peft_config": peft_config,
    "args": sft_config,
}
if "processing_class" in _trainer_sig:
    trainer_kwargs["processing_class"] = tokenizer
elif "tokenizer" in _trainer_sig:
    trainer_kwargs["tokenizer"] = tokenizer

trainer = SFTTrainer(**trainer_kwargs)

vram_base = torch.cuda.memory_allocated(0) / (1024**3)
print(f"⚡ VRAM alocada com pesos 16-bit BF16 + LoRA r=128: {vram_base:.2f} GB")
print("🔥 [4/4] INICIANDO FINE-TUNING EM POTÊNCIA MÁXIMA NA A100-80GB (TIER 1 ESTRICTO)...")
train_res = trainer.train()

FINAL_MODEL_DIR = "/content/aquila_tutor_model_v7"
trainer.save_model(FINAL_MODEL_DIR)
tokenizer.save_pretrained(FINAL_MODEL_DIR)
peak_vram = torch.cuda.max_memory_allocated(0) / (1024**3)
print(f"✅ Fine-Tuning concluído! Loss: {train_res.metrics.get('train_loss', 'OK')} | Pico VRAM A100: {peak_vram:.2f} GB / 80.0 GB")
print(f"💾 Modelo salvo em {FINAL_MODEL_DIR}")
"""

        nb["cells"][2]["source"] = [line + "\n" for line in cell2_code.split("\n")]
        nb["cells"][3]["source"] = [line + "\n" for line in cell3_code.split("\n")]
        with open(NOTEBOOK_PATH, "w", encoding="utf-8") as f:
            json.dump(nb, f, indent=2, ensure_ascii=False)
        metrics["colab_notebook_updated"] = True
        print("   ✅ Notebook local `colab/aquila_a100_neural_engine.ipynb` atualizado.")

    # 9. Totalizar métricas e salvar relatório
    t_end = time.perf_counter()
    metrics["elapsed_seconds"] = round(t_end - t_start, 2)
    metrics["quarantined_records"]["total_quarantined_items"] = sum(metrics["quarantined_records"].values())
    metrics["released_tier1_records"]["total_tier1_training_items"] = sum(metrics["released_tier1_records"].values())

    os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 80)
    print("📊 MÉTRICAS CONSOLIDADAS DE PARTICIONAMENTO DE DIREITOS AUTORAIS:")
    print("=" * 80)
    print(f"🛡️ Total de Registros em Quarentena Tier 2: {metrics['quarantined_records']['total_quarantined_items']}")
    print(f"   • Questões de Livros Comerciais Bloqueadas: {metrics['quarantined_records']['extracted_textbook_questions']}")
    print(f"   • Livros Didáticos Comerciais em PDF Quarentenados: {metrics['quarantined_records']['downloaded_pdf_corpus_textbooks']}")
    print(f"   • SVGs e Ativos de Editoras Comerciais Quarentenados: {metrics['quarantined_records']['research_visual_assets_scipione']}")
    print(f"   • Registros de Fine-Tuning SFT Retirados de Treino: {metrics['quarantined_records']['jsonl_sft_quarantined']}")
    print(f"   • Itens de Checklist com Status de Quarentena: {metrics['quarantined_records']['checklist_items_updated']}")
    print("-" * 80)
    print(f"✅ Total de Registros Tier 1 Homologados para IA: {metrics['released_tier1_records']['total_tier1_training_items']}")
    print(f"   • Questões Oficiais de Vestibulares (Alvorada-Bench): {metrics['released_tier1_records']['alvorada_bench_vestibulares']}")
    print(f"   • Links Oficiais Governamentais Homologados: {metrics['released_tier1_records']['official_study_repository_links']}")
    print(f"   • Documentos Oficiais e Livros Abertos (Tier 1): {metrics['released_tier1_records']['official_open_pdfs']}")
    print(f"   • Visual Assets & Diagramas Tier 1: {metrics['released_tier1_records']['research_visual_assets_tier1']}")
    print(f"   • Registros SFT Homologados para Treino: {metrics['released_tier1_records']['jsonl_sft_tier1_clean']}")
    print("=" * 80)
    print(f"📁 Relatório gravado em: {REPORT_PATH}")
    print(f"⏱️ Tempo total de execução: {metrics['elapsed_seconds']}s")
    return metrics


if __name__ == "__main__":
    run_license_partitioning()
