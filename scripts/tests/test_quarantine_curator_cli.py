#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Suíte de Testes Unitários: CLI de Curadoria e Governança da Quarentena (HITL)
Valida:
  1. Leitura de status e inventário consolidado da fila de quarentena.
  2. Listagem com filtros por exame e status de direitos.
  3. Inspeção aprofundada de metadados, hashes e prévia de texto.
  4. Fluxo de aprovação humana (HITL) com fundamentação jurídica e registro imutável em zero_bypass_audits.
  5. Fluxo de rejeição com bloqueio de operações e trilha de auditoria.
  6. Validações de obrigatoriedade de operador e base legal.
"""

import sys
import os
import sqlite3
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "scripts"))

from quarantine_curator_cli import (
    get_db_connection,
    ensure_audit_schema,
    cmd_status,
    cmd_list,
    cmd_inspect,
    cmd_approve,
    cmd_reject
)
from swarm_continuous_finetune_daemon import ensure_quarantine_schema


class TestQuarantineCuratorCLI(unittest.TestCase):

    def setUp(self):
        self.tmp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        self.tmp_db.close()
        self.conn = sqlite3.connect(self.tmp_db.name)
        ensure_quarantine_schema(self.conn)
        ensure_audit_schema(self.conn)

        # Inserir sementes sintéticas para os testes
        cur = self.conn.cursor()
        cur.execute("""
            INSERT INTO harvest_quarantine_queue (
                job_id, url, source_category, fonte, exame, instituicao, ano, disciplina,
                titulo, state, attempt_count, next_attempt_at, binary_hash, normalized_content_hash,
                created_at, updated_at
            ) VALUES (
                'job_enem_2024_01', 'https://download.inep.gov.br/enem_2024_caderno_azul.pdf',
                'OFICIAL_GOV', 'Portal INEP Oficial', 'ENEM', 'INEP / MEC', 2024, 'Ciências da Natureza',
                'ENEM 2024 — Caderno 1 Azul Regular', 'EXTRAIDO', 1, '2026-10-31T00:00:00Z',
                'abcdef1234567890binaryhash', 'fedcba0987654321normhash',
                '2026-10-31T00:00:00Z', '2026-10-31T00:00:00Z'
            )
        """)

        cur.execute("""
            INSERT INTO harvest_quarantine_queue (
                job_id, url, source_category, fonte, exame, instituicao, ano, disciplina,
                titulo, state, attempt_count, next_attempt_at,
                created_at, updated_at
            ) VALUES (
                'job_fuvest_2025_01', 'https://fuvest.br/vestibular_2025_prova_fase1.pdf',
                'OFICIAL_UNIVERSIDADE', 'FUVEST', 'FUVEST', 'Universidade de São Paulo (USP)', 2025, 'Multidisciplinar',
                'FUVEST 2025 — 1ª Fase Conhecimentos Gerais', 'BAIXADO', 1, '2026-10-31T00:00:00Z',
                '2026-10-31T00:00:00Z', '2026-10-31T00:00:00Z'
            )
        """)

        cur.execute("""
            INSERT INTO downloaded_pdf_corpus (
                doc_id, title, institution, exam, subject, doc_type, license, source_url,
                local_path, size_bytes, sha256_hash, extracted_text, harvested_at
            ) VALUES (
                'doc_enem_01', 'ENEM 2024 — Caderno 1 Azul Regular', 'INEP / MEC', 'ENEM',
                'Ciências da Natureza', 'prova_pdf', 'DIREITOS_PENDENTES',
                'https://download.inep.gov.br/enem_2024_caderno_azul.pdf',
                '/tmp/enem_2024.pdf', 1048576, 'abcdef1234567890binaryhash',
                'QUESTÃO 91: Um circuito elétrico residencial opera sob tensão constante de 127 V...',
                '2026-10-31T00:00:00Z'
            )
        """)
        self.conn.commit()

    def tearDown(self):
        self.conn.close()
        if os.path.exists(self.tmp_db.name):
            os.unlink(self.tmp_db.name)

    def test_01_status_inventory_report(self):
        """Verifica a consolidação correta do inventário da fila de quarentena."""
        status = cmd_status(self.conn)
        self.assertEqual(status["total_quarantine_jobs"], 2)
        self.assertEqual(status["operational_states"].get("EXTRAIDO"), 1)
        self.assertEqual(status["operational_states"].get("BAIXADO"), 1)
        self.assertEqual(status["rights_review_states"].get("DIREITOS_PENDENTES"), 2)
        self.assertEqual(status["downloaded_pdf_corpus_count"], 1)

    def test_02_list_and_filters(self):
        """Testa a listagem e filtragem por exame e estado."""
        # Todos
        all_items = cmd_list(self.conn, limit=10)
        self.assertEqual(len(all_items), 2)

        # Filtro por exame ENEM
        enem_items = cmd_list(self.conn, exam_filter="ENEM")
        self.assertEqual(len(enem_items), 1)
        self.assertEqual(enem_items[0]["job_id"], "job_enem_2024_01")

        # Filtro por estado BAIXADO
        downloaded = cmd_list(self.conn, status_filter="BAIXADO")
        self.assertEqual(len(downloaded), 1)
        self.assertEqual(downloaded[0]["job_id"], "job_fuvest_2025_01")

    def test_03_inspect_job_dossier(self):
        """Testa inspeção completa de um candidato da quarentena."""
        dossier = cmd_inspect(self.conn, "job_enem_2024_01")
        self.assertIsNotNone(dossier)
        self.assertEqual(dossier["exame"], "ENEM")
        self.assertEqual(dossier["ano"], 2024)
        self.assertEqual(dossier["binary_hash"], "abcdef1234567890binaryhash")
        self.assertIn("QUESTÃO 91", dossier["text_snippet_preview"])

    def test_04_approve_item_with_audit_trail(self):
        """Testa o fluxo de aprovação jurídica HITL e integridade SHA-256 do log."""
        success = cmd_approve(
            conn=self.conn,
            job_id="job_enem_2024_01",
            operator="dpo_dra_mariana",
            legal_basis="LEI_9610_ART_46_VIII (Uso pedagógico de provas públicas)",
            operations=["DATASET_SFT", "RESEARCH_CORPUS"]
        )
        self.assertTrue(success)

        # Verificar atualização na fila
        row = self.conn.execute(
            "SELECT rights_review_status, reviewed_by, approved_operations FROM harvest_quarantine_queue WHERE job_id = 'job_enem_2024_01'"
        ).fetchone()
        self.assertEqual(row[0], "APROVADO_PARA_DATASET")
        self.assertEqual(row[1], "dpo_dra_mariana")
        self.assertIn("DATASET_SFT", row[2])

        # Verificar gravação em zero_bypass_audits com hash
        audit = self.conn.execute(
            "SELECT userId, action, previous_hash, hash, legal_basis FROM zero_bypass_audits ORDER BY id DESC LIMIT 1"
        ).fetchone()
        self.assertEqual(audit[0], "dpo_dra_mariana")
        self.assertEqual(audit[1], "EXAM_RIGHTS_APPROVED")
        self.assertEqual(len(audit[3]), 64) # SHA-256
        self.assertIn("LEI_9610_ART_46_VIII", audit[4])

    def test_05_reject_item_blocks_usage(self):
        """Testa o fluxo de rejeição jurídica com impedimento de inclusão no treino."""
        success = cmd_reject(
            conn=self.conn,
            job_id="job_fuvest_2025_01",
            operator="auditor_juridico_pedro",
            reason="Material protegido por direitos autorais estritos sem licença OER explícita."
        )
        self.assertTrue(success)

        row = self.conn.execute(
            "SELECT rights_review_status, approved_operations FROM harvest_quarantine_queue WHERE job_id = 'job_fuvest_2025_01'"
        ).fetchone()
        self.assertEqual(row[0], "REJEITADO")
        self.assertEqual(row[1], "[]")

    def test_06_validation_checks_mandatory_operator(self):
        """Garante que não seja possível aprovar ou rejeitar sem operador ou base legal."""
        with self.assertRaises(ValueError):
            cmd_approve(self.conn, "job_enem_2024_01", operator="", legal_basis="LEI_9610")

        with self.assertRaises(ValueError):
            cmd_approve(self.conn, "job_enem_2024_01", operator="admin", legal_basis="")

        with self.assertRaises(ValueError):
            cmd_reject(self.conn, "job_enem_2024_01", operator="", reason="motivo")


if __name__ == "__main__":
    unittest.main()
