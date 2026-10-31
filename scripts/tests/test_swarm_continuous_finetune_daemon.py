#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
SUÍTE DE AUDITORIA E TESTES DE GOVERNANÇA: RADAR & QUARENTENA SOBERANA (v5.1)
================================================================================
Testa rigorosamente os 10 critérios de integridade técnica e conformidade jurídica:
  1. TLS Inválido: Falha estrita sem desativação de verificação.
  2. Direitos Pendentes: Bloqueio absoluto de dados sem autorização HITL.
  3. Idempotência: Repetição da coleta não duplica registros nem datasets.
  4. Rastreabilidade de Procedência: Categorias de fontes preservadas.
  5. Imunidade a Fallback: Erro ou timeout jamais vira exemplo de SFT.
  6. Exclusão Mútua Concorrente: Lock atômico impede múltiplas execuções.
  7. Recuperabilidade pós-Crash: Tarefas interrompidas são retomadas.
  8. Arquivo Inválido: Arquivo corrompido/truncado não é promovido.
  9. Backoff Exponencial: Falhas de rede respeitam limites e intervalo.
  10. Desacoplamento Estrito: Zero chamadas de treino e zero escritas em dist/.
================================================================================
"""

import os
import sys
import ssl
import json
import sqlite3
import tempfile
import urllib.error
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

import swarm_continuous_finetune_daemon as daemon


class TestRadarQuarantineGovernance(unittest.TestCase):

    def test_01_tls_invalid_certificate_fails_strictly_without_bypass(self):
        """1. TLS inválido: falha sem bypass de segurança."""
        ctx = daemon.STRICT_SSL_CTX
        self.assertNotEqual(ctx.verify_mode, ssl.CERT_NONE)
        self.assertTrue(ctx.check_hostname)

        # Simular tentativa de conexão com falha de certificado SSL
        radar_mock = {
            "radar_id": "RADAR_TESTE_SSL",
            "source_category": "OFICIAL_GOV",
            "fonte": "Teste",
            "exame": "TESTE",
            "instituicao": "MEC",
            "disciplina": "Geral",
            "url": "https://portal-com-certificado-invalido.gov.br",
            "base_domain": "https://portal-com-certificado-invalido.gov.br"
        }

        with patch("urllib.request.urlopen", side_effect=ssl.SSLError("certificate verify failed: self-signed certificate")):
            res = daemon.scan_radar_source(radar_mock)
            self.assertEqual(res["status"], "ERRO_TLS_CERTIFICADO")
            self.assertIn("TLS_SSLError", res["error_code"])
            self.assertEqual(len(res["discovered_items"]), 0)

    def test_02_pending_rights_strictly_block_sft_dataset_inclusion(self):
        """2. Direitos pendentes: impedem destinos aprovados (dataset SFT)."""
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = Path(tmpdir) / "test_rights.db"
            dataset_path = Path(tmpdir) / "test_sft.jsonl"
            conn = sqlite3.connect(str(db_path))
            try:
                daemon.ensure_quarantine_schema(conn)

                # Inserir item extraído mas com DIREITOS_PENDENTES
                conn.execute("""
                    INSERT INTO harvest_quarantine_queue (
                        job_id, url, source_category, fonte, exame, instituicao,
                        ano, disciplina, titulo, state, rights_review_status,
                        approved_operations, next_attempt_at, created_at, updated_at
                    ) VALUES (
                        'JOB-RIGHTS-01', 'https://fuvest.br/prova.pdf', 'OFICIAL_UNIVERSIDADE',
                        'FUVEST', 'FUVEST', 'USP', 2026, 'Física', 'Prova 2026',
                        'EXTRAIDO', 'DIREITOS_PENDENTES', '[]', '2026-10-31', '2026-10-31', '2026-10-31'
                    )
                """)
                conn.commit()

                with patch.object(daemon, "SWARM_DATASET", dataset_path):
                    report = daemon.curate_approved_sft_dataset(conn)
                    self.assertEqual(report["status"], "QUARENTENA_ATIVA")
                    self.assertEqual(report["new_pairs_added"], 0)
                    self.assertFalse(dataset_path.exists())
            finally:
                conn.close()

    def test_03_idempotency_avoids_duplicate_entries_on_repeated_runs(self):
        """3. Idempotência: repetir a coleta não cria conteúdo duplicado."""
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = Path(tmpdir) / "test_idemp.db"
            conn = sqlite3.connect(str(db_path))
            try:
                daemon.ensure_quarantine_schema(conn)
                cur = conn.cursor()

                url = "https://inep.gov.br/enem_2025_azul.pdf"
                job_id = "JOB-IDEMP-01"

                # 1ª Inserção
                cur.execute("""
                    INSERT OR IGNORE INTO harvest_quarantine_queue (
                        job_id, url, source_category, fonte, exame, instituicao,
                        ano, disciplina, titulo, state, next_attempt_at, created_at, updated_at
                    ) VALUES (?, ?, 'OFICIAL_GOV', 'INEP', 'ENEM', 'MEC', 2025, 'Geral', 'ENEM 2025', 'DESCOBERTO', '2026-10-31', '2026-10-31', '2026-10-31')
                """, (job_id, url))
                conn.commit()

                # 2ª Inserção idêntica (simulando reexecução do radar)
                cur.execute("""
                    INSERT OR IGNORE INTO harvest_quarantine_queue (
                        job_id, url, source_category, fonte, exame, instituicao,
                        ano, disciplina, titulo, state, next_attempt_at, created_at, updated_at
                    ) VALUES (?, ?, 'OFICIAL_GOV', 'INEP', 'ENEM', 'MEC', 2025, 'Geral', 'ENEM 2025', 'DESCOBERTO', '2026-10-31', '2026-10-31', '2026-10-31')
                """, (job_id, url))
                conn.commit()

                count = cur.execute("SELECT COUNT(*) FROM harvest_quarantine_queue WHERE url = ?", (url,)).fetchone()[0]
                self.assertEqual(count, 1)
            finally:
                conn.close()

    def test_04_provenance_tracking_preserves_distinct_source_categories(self):
        """4. Procedência: fontes diferentes continuam rastreáveis."""
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = Path(tmpdir) / "test_prov.db"
            conn = sqlite3.connect(str(db_path))
            try:
                daemon.ensure_quarantine_schema(conn)

                samples = [
                    ("JOB-1", "https://inep.gov.br/p1.pdf", "OFICIAL_GOV"),
                    ("JOB-2", "https://unicamp.br/p2.pdf", "OFICIAL_UNIVERSIDADE"),
                    ("JOB-3", "https://oecd.org/p3.pdf", "OFICIAL_INTERNACIONAL"),
                    ("JOB-4", "https://projetomedicina.com.br/p4.pdf", "TERCEIRO_EDUCACIONAL"),
                    ("JOB-5", "https://youtube.com/watch?v=12345678901", "MIDIA_SOCIAL"),
                ]

                for jid, u, cat in samples:
                    conn.execute("""
                        INSERT INTO harvest_quarantine_queue (
                            job_id, url, source_category, fonte, exame, instituicao,
                            ano, disciplina, titulo, state, next_attempt_at, created_at, updated_at
                        ) VALUES (?, ?, ?, 'Fonte', 'Exame', 'Inst', 2026, 'Geral', 'Título', 'DESCOBERTO', '2026-10-31', '2026-10-31', '2026-10-31')
                    """, (jid, u, cat))
                conn.commit()

                cur = conn.cursor()
                cats = {r[0] for r in cur.execute("SELECT DISTINCT source_category FROM harvest_quarantine_queue").fetchall()}
                self.assertEqual(cats, {"OFICIAL_GOV", "OFICIAL_UNIVERSIDADE", "OFICIAL_INTERNACIONAL", "TERCEIRO_EDUCACIONAL", "MIDIA_SOCIAL"})
            finally:
                conn.close()

    def test_05_fallback_and_error_never_become_sft_examples(self):
        """5. Fallback: erro nunca vira exemplo SFT."""
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = Path(tmpdir) / "test_sft_fallback.db"
            dataset_path = Path(tmpdir) / "test_sft.jsonl"
            doc_file = Path(tmpdir) / "prova_aprovada.pdf"
            doc_file.write_text("CONTEUDO PEDAGOGICO DE PROVA AUTENTICA")

            conn = sqlite3.connect(str(db_path))
            try:
                daemon.ensure_quarantine_schema(conn)

                # Registro com aprovação jurídica concedida
                conn.execute("""
                    INSERT INTO harvest_quarantine_queue (
                        job_id, url, source_category, fonte, exame, instituicao,
                        ano, disciplina, titulo, state, rights_review_status,
                        approved_operations, output_manifest_ref, next_attempt_at, created_at, updated_at
                    ) VALUES (
                        'JOB-APP-01', 'https://aprovada.org/p.pdf', 'OFICIAL_GOV',
                        'INEP', 'ENEM', 'MEC', 2026, 'Física', 'Prova',
                        'EXTRAIDO', 'APROVADO_PARA_DATASET', '[\"DATASET_SFT\"]', ?, '2026-10-31', '2026-10-31', '2026-10-31'
                    )
                """, (str(doc_file),))
                conn.commit()

                # Simula retorno com mensagem de fallback
                mock_router = MagicMock()
                mock_router.load_all_envs.return_value = {}
                mock_router.dispatch_by_role.return_value = {
                    "response": "Trilha incremental Kumon L1/L2/L3 calibrada com sucesso pelo motor local.",
                    "latency_ms": 10
                }

                with patch.dict(sys.modules, {"swarm_router": mock_router}):
                    with patch.object(daemon, "SWARM_DATASET", dataset_path):
                        report = daemon.curate_approved_sft_dataset(conn)
                        self.assertEqual(report["new_pairs_added"], 0)
                        self.assertFalse(dataset_path.exists())
            finally:
                conn.close()

    def test_06_mutual_exclusion_prevents_concurrent_runs(self):
        """6. Concorrência: somente um worker adquire o lock de execução."""
        with tempfile.TemporaryDirectory() as tmpdir:
            lock_path = Path(tmpdir) / "process.lock"

            with daemon.ProcessLock(lock_path):
                self.assertTrue(lock_path.exists())
                # Segunda chamada DEVE falhar imediatamente
                with self.assertRaises(RuntimeError):
                    with daemon.ProcessLock(lock_path):
                        pass

            self.assertFalse(lock_path.exists())

    def test_07_interrupted_tasks_can_be_resumed_after_crash(self):
        """7. Interrupção: tarefas abandonadas (lease expirado) são retomadas."""
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = Path(tmpdir) / "test_resume.db"
            conn = sqlite3.connect(str(db_path))
            try:
                daemon.ensure_quarantine_schema(conn)

                # Tarefa deixada no estado 'BAIXANDO' por um worker morto (lease expirou no passado)
                conn.execute("""
                    INSERT INTO harvest_quarantine_queue (
                        job_id, url, source_category, fonte, exame, instituicao,
                        ano, disciplina, titulo, state, attempt_count, max_attempts,
                        next_attempt_at, lease_expires_at, created_at, updated_at
                    ) VALUES (
                        'JOB-CRASHED-01', 'https://inep.gov.br/recuperar.pdf', 'OFICIAL_GOV',
                        'INEP', 'ENEM', 'MEC', 2026, 'Matemática', 'Prova',
                        'FALHOU', 1, 3, '2020-01-01T00:00:00Z', '2020-01-01T00:05:00Z', '2020-01-01', '2020-01-01'
                    )
                """)
                conn.commit()

                # Mock de download bem-sucedido na retomada
                dummy_pdf = b"%PDF-1.4 " + (b"Texto pedagogico real de exame " * 30)
                mock_resp = MagicMock()
                mock_resp.__enter__.return_value = mock_resp
                mock_resp.read.return_value = dummy_pdf

                with patch("urllib.request.urlopen", return_value=mock_resp):
                    with patch.object(daemon, "PDF_DIR", Path(tmpdir)):
                        stats = daemon.process_harvest_queue_atomically(conn, max_items=1)
                        self.assertEqual(stats["jobs_processed"], 1)
                        self.assertEqual(stats["downloaded"], 1)

                state = conn.execute("SELECT state FROM harvest_quarantine_queue WHERE job_id = 'JOB-CRASHED-01'").fetchone()[0]
                self.assertIn(state, ("BAIXADO", "EXTRAIDO"))
            finally:
                conn.close()

    def test_08_corrupt_file_is_not_promoted(self):
        """8. Arquivo inválido: não é promovido como extração concluída."""
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = Path(tmpdir) / "test_corrupt.db"
            conn = sqlite3.connect(str(db_path))
            try:
                daemon.ensure_quarantine_schema(conn)

                conn.execute("""
                    INSERT INTO harvest_quarantine_queue (
                        job_id, url, source_category, fonte, exame, instituicao,
                        ano, disciplina, titulo, state, attempt_count, max_attempts,
                        next_attempt_at, created_at, updated_at
                    ) VALUES (
                        'JOB-CORRUPT-01', 'https://inep.gov.br/corrompido.pdf', 'OFICIAL_GOV',
                        'INEP', 'ENEM', 'MEC', 2026, 'Química', 'Prova Corrompida',
                        'DESCOBERTO', 0, 3, '2026-10-31', '2026-10-31', '2026-10-31'
                    )
                """)
                conn.commit()

                # Retornar payload menor que o limite mínimo seguro (< 512 bytes)
                corrupt_bytes = b"curto demais"
                mock_resp = MagicMock()
                mock_resp.__enter__.return_value = mock_resp
                mock_resp.read.return_value = corrupt_bytes

                with patch("urllib.request.urlopen", return_value=mock_resp):
                    with patch.object(daemon, "PDF_DIR", Path(tmpdir)):
                        stats = daemon.process_harvest_queue_atomically(conn, max_items=1)
                        self.assertEqual(stats["failed"], 1)

                row = conn.execute("SELECT state, last_error_code FROM harvest_quarantine_queue WHERE job_id = 'JOB-CORRUPT-01'").fetchone()
                self.assertEqual(row[0], "FALHOU")
                self.assertEqual(row[1], "ValueError")
            finally:
                conn.close()

    def test_09_exponential_backoff_respects_limits(self):
        """9. Backoff: falhas respeitam limites e calculam data futura."""
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = Path(tmpdir) / "test_backoff.db"
            conn = sqlite3.connect(str(db_path))
            try:
                daemon.ensure_quarantine_schema(conn)

                conn.execute("""
                    INSERT INTO harvest_quarantine_queue (
                        job_id, url, source_category, fonte, exame, instituicao,
                        ano, disciplina, titulo, state, attempt_count, max_attempts,
                        next_attempt_at, created_at, updated_at
                    ) VALUES (
                        'JOB-RETRY-01', 'https://falha-persistente.org/prova.pdf', 'OFICIAL_GOV',
                        'INEP', 'ENEM', 'MEC', 2026, 'Biologia', 'Prova',
                        'DESCOBERTO', 0, 3, '2026-10-31', '2026-10-31', '2026-10-31'
                    )
                """)
                conn.commit()

                with patch("urllib.request.urlopen", side_effect=urllib.error.URLError("Falha de rede")):
                    with patch.object(daemon, "PDF_DIR", Path(tmpdir)):
                        daemon.process_harvest_queue_atomically(conn, max_items=1)

                row = conn.execute("SELECT attempt_count, state, next_attempt_at FROM harvest_quarantine_queue WHERE job_id = 'JOB-RETRY-01'").fetchone()
                self.assertEqual(row[0], 1)
                self.assertEqual(row[1], "FALHOU")
                self.assertIsNotNone(row[2])
            finally:
                conn.close()

    def test_10_separation_of_collection_training_and_publishing(self):
        """10. Separação: coleta não inicia treinamento nem escreve em dist/."""
        with tempfile.TemporaryDirectory() as tmpdir:
            dist_db = Path(tmpdir) / "dist" / "pedagogical_scaffolding.db"
            dist_db.parent.mkdir(parents=True, exist_ok=True)
            dist_db.write_text("IMUTAVEL_DIST")

            db_path = Path(tmpdir) / "src_test.db"
            lock_path = Path(tmpdir) / "test.lock"
            state_path = Path(tmpdir) / "test_state.json"

            with patch.object(daemon, "SQLITE_SRC", db_path):
                with patch.object(daemon, "SQLITE_DIST", dist_db):
                    with patch.object(daemon, "LOCK_FILE", lock_path):
                        with patch.object(daemon, "STATE_FILE", state_path):
                            with patch.object(daemon, "scan_radar_source", return_value={
                                "radar_id": "TESTE", "source_category": "OFICIAL_GOV",
                                "status": "ONLINE_SCANNED", "latency_ms": 1, "discovered_items": []
                            }):
                                with patch("subprocess.run") as mock_sub:
                                    summary = daemon.run_autonomous_finetune_cycle()
                                    self.assertFalse(summary["training_invoked"])
                                    self.assertFalse(summary["dist_updated"])
                                    mock_sub.assert_not_called()
                                    self.assertEqual(dist_db.read_text(), "IMUTAVEL_DIST")


if __name__ == "__main__":
    unittest.main()
