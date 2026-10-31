#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Suíte de Testes Unitários: Áquila Agent Harness & Soberania de Dados
Valida:
  1. Detecção Factual de Hardware (Zero-Virtual-GPU)
  2. Classificação de Dados & Bloqueio Prévio de Biometria / PII Escolar (LGPD Art. 14)
  3. Sondas Estruturadas de Provedores com Contrato Transparente (Sem vazamento de chaves)
  4. Avaliador Específico de Tarefas: Aceitação de respostas curtas legítimas (ex: '{"valid": false}')
  5. Avaliador Específico de Tarefas: Rejeição estrita de fallbacks sintéticos forjados
  6. Composição Contrastiva com Abstenção: 'NO_VALID_CANDIDATE' e 'REQUIRES_HUMAN_REVIEW'
  7. Garantia Semântica no Treinador: Ausência de treino nunca gera status 'TRAINED' nem loss 0.0
"""

import sys
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "scripts"))

from aquila_agent_harness import (
    HardwareTelemetry,
    FreeAIProviderPool,
    SovereignAgentHarness,
    DataPrivacyClassifier,
    DataSovereigntyViolationError,
    TaskEvaluator
)
from colab.aquila_vestibular_gpu_trainer import run_gpu_vestibular_training


class TestSovereignAgentHarness(unittest.TestCase):

    def test_01_hardware_telemetry_detects_real_values(self):
        """Verifica se a telemetria de hardware não reporta VRAM fictícia."""
        hw = HardwareTelemetry.inspect()
        self.assertIn("execution_tier", hw)
        self.assertIn("gpu_device_name", hw)
        self.assertIsInstance(hw["vram_gb"], float)

        if not hw["has_cuda"]:
            self.assertEqual(hw["vram_gb"], 0.0)
            self.assertEqual(hw["execution_tier"], "LOCAL_CPU")

    def test_02_data_sovereignty_blocks_biometrics_and_pii(self):
        """Bloqueia categoricamente envio de biometria facial, chaves ou PII escolar para IAs externas."""
        # 1. Biometria (One-Way Embedding 512-D) -> BLOQUEIO IMEDIATO
        biometric_payload = {
            "task_type": "face_verification",
            "prompt": "Verifique a similaridade do embedding facial [0.12, -0.45, 0.88...]"
        }
        with self.assertRaises(DataSovereigntyViolationError) as ctx:
            DataPrivacyClassifier.classify_and_enforce(biometric_payload)
        self.assertIn("BIOMETRICS_BLOCKED", ctx.exception.reason)

        # 2. Dados pessoais de estudantes sem autorização -> BLOQUEIO
        student_payload = {
            "task_type": "pedagogical",
            "student_name": "Estudante Menor de Idade",
            "cpf": "111.222.333-44",
            "prompt": "Elabore plano de estudos individual."
        }
        with self.assertRaises(DataSovereigntyViolationError) as ctx:
            DataPrivacyClassifier.classify_and_enforce(student_payload)
        self.assertIn("STUDENT_PII_BLOCKED", ctx.exception.reason)

        # 3. Fixture sintética autorizada para desenvolvimento -> PERMITIDO
        synthetic_payload = {
            "task_type": "code",
            "prompt": "Gere função de validação de CPF sintético.",
            "is_synthetic_fixture": True
        }
        classification = DataPrivacyClassifier.classify_and_enforce(synthetic_payload)
        self.assertEqual(classification, "DEV_SYNTHETIC_FIXTURE")

    def test_03_structured_probe_record_contract(self):
        """Testa o contrato transparente de sondas sem vazar chaves de API nos logs."""
        env_mock = {
            "GOOGLE_API_KEY": "AIzaSyFakeKeyForTest",
            "NVIDIA_API_KEY": "nvapi-fake-key",
            "COLAB_GPU_URL": ""
        }

        with patch("swarm_router.test_google_gemini", return_value={"status": "ONLINE", "latency_ms": 115}):
            record = FreeAIProviderPool.probe_provider_health("google_gemini", env_mock)
            self.assertEqual(record["provider"], "google_gemini")
            self.assertEqual(record["requested_model"], "gemini-2.5-flash")
            self.assertEqual(record["reported_model"], "gemini-2.5-flash")
            self.assertEqual(record["probe_type"], "AUTHENTICATION_AND_PING")
            self.assertEqual(record["duration_ms"], 115)
            self.assertEqual(record["http_status"], 200)
            self.assertTrue(record["task_success"])
            self.assertIsNone(record["error_code"])
            # NUNCA deve conter a chave de API no registro estruturado
            self.assertNotIn("AIzaSyFakeKeyForTest", str(record))

    def test_04_evaluator_accepts_short_valid_answers(self):
        """Garante que respostas concisas legítimas (ex: '{\"valid\": false}') não sofram falso-positivo por tamanho."""
        short_json = '{"valid": false}'
        is_valid, reason = TaskEvaluator.evaluate("json_validation", short_json)
        self.assertTrue(is_valid)
        self.assertEqual(reason, "VALID_JSON_STRUCTURE")

        short_code = "def check(x): return x > 0"
        is_code_valid, code_reason = TaskEvaluator.evaluate("code", short_code)
        self.assertTrue(is_code_valid)
        self.assertEqual(code_reason, "VALID_CODE_CONTRACT")

    def test_05_evaluator_rejects_spurious_fallbacks(self):
        """Garante que mensagens forjadas de fallback (ex: 'Trilha incremental Kumon...') sejam sumariamente rejeitadas."""
        fallback_msg = "Trilha incremental Kumon L1/L2/L3 calibrada com sucesso pelo motor local."
        is_valid, reason = TaskEvaluator.evaluate("pedagogical", fallback_msg)
        self.assertFalse(is_valid)
        self.assertIn("REJECTED_SPURIOUS_FALLBACK", reason)

    def test_06_compose_supports_abstention_no_valid_candidate(self):
        """Garante que o Compose possa se abster e retornar NO_VALID_CANDIDATE sem forçar um vencedor."""
        harness = SovereignAgentHarness()

        # Cenário onde todas as sondas falharam ou retornaram saídas inválidas
        failed_probes = [
            {
                "candidate_id": "cand_1",
                "provider": "google_gemini",
                "requested_model": "gemini-2.5-flash",
                "duration_ms": 350,
                "is_valid": False,
                "task_success": False,
                "error_code": "INVALID_JSON_SCHEMA_OUTPUT"
            },
            {
                "candidate_id": "cand_2",
                "provider": "nvidia_nim",
                "requested_model": "deepseek-r1",
                "duration_ms": 1200,
                "is_valid": False,
                "task_success": False,
                "error_code": "PROBE_TIMEOUT"
            }
        ]

        composed = harness.compose_optimal_trajectory(failed_probes)
        self.assertEqual(composed["composed_status"], "NO_VALID_CANDIDATE")
        self.assertIsNone(composed["selected_candidate"])
        self.assertIsNone(composed["response"])
        self.assertIn("Nenhum provedor gerou uma resposta válida", composed["justification"])

    def test_07_compose_triggers_human_review_on_critical_divergence(self):
        """Garante que divergência em decisão crítica de governança acione REQUIRES_HUMAN_REVIEW."""
        harness = SovereignAgentHarness()

        divergent_probes = [
            {
                "candidate_id": "cand_1",
                "provider": "google_gemini",
                "requested_model": "gemini-2.5-flash",
                "duration_ms": 200,
                "output": "Decisão: SIM, aprovar alteração de firewall.",
                "is_valid": True,
                "task_success": True
            },
            {
                "candidate_id": "cand_2",
                "provider": "nvidia_nim",
                "requested_model": "deepseek-r1",
                "duration_ms": 400,
                "output": "Decisão: NÃO, rejeitar alteração por risco de segurança.",
                "is_valid": True,
                "task_success": True
            }
        ]

        critical_task = {
            "task_type": "security_audit",
            "prompt": "Analisar liberação de porta 8080 externa",
            "critical_governance_decision": True,
            "is_synthetic_fixture": True
        }

        composed = harness.compose_optimal_trajectory(divergent_probes, critical_task)
        self.assertEqual(composed["composed_status"], "REQUIRES_HUMAN_REVIEW")
        self.assertIsNone(composed["selected_candidate"])

    def test_08_trainer_never_reports_trained_without_actual_training(self):
        """Garante que execução sem treino neural registre CONTENT_SEEDING_COMPLETED com final_loss e epochs nulos."""
        tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        tmp.close()
        try:
            summary = run_gpu_vestibular_training(tmp.name)
            # Em CPU local sem GPU de treinamento:
            self.assertEqual(summary["status"], "CONTENT_SEEDING_COMPLETED")
            self.assertFalse(summary["training_performed"])
            self.assertIsNone(summary["final_loss"])
            self.assertIsNone(summary["epochs"])
            self.assertIn("questions_metadata_updated", summary)
            self.assertNotIn("recalibrated_historical_questions", summary)
        finally:
            if os.path.exists(tmp.name):
                os.unlink(tmp.name)


if __name__ == "__main__":
    unittest.main()
