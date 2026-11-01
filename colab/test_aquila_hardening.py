import csv
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile
import types
import unittest
from unittest.mock import patch

from aquila_hardening import (
    AuthenticationError,
    AuthorizationError,
    DatasetValidationError,
    FeatureDisabledError,
    authorize_benchmark,
    authorize_inference,
    build_answer_key_messages,
    build_training_manifest,
    load_security_config,
    sha256_file,
    validate_benchmark_size,
    validate_training_records,
)


INFERENCE_TOKEN = "i" * 40
BENCHMARK_TOKEN = "b" * 40


def valid_record(question_id="q-1"):
    return {
        "question_id": question_id,
        "question_statement": "Quanto é 2 + 2?",
        "correct_answer": "a",
        "alternative_a": "4",
        "alternative_b": "3",
        "alternative_c": "5",
        "alternative_d": "6",
        "alternative_e": "7",
    }


class SecurityTests(unittest.TestCase):
    def test_missing_and_invalid_authentication_are_rejected(self):
        config = load_security_config({"AQUILA_INFERENCE_TOKEN": INFERENCE_TOKEN})
        for header in (None, "Basic abc", "Bearer wrong"):
            with self.subTest(header=header), self.assertRaises(AuthenticationError):
                authorize_inference(header, config)

    def test_inference_authentication_and_role_separation(self):
        config = load_security_config(
            {
                "AQUILA_INFERENCE_TOKEN": INFERENCE_TOKEN,
                "AQUILA_BENCHMARK_TOKEN": BENCHMARK_TOKEN,
                "AQUILA_ENABLE_BENCHMARK": "1",
                "AQUILA_PUBLIC_MODE": "false",
            }
        )
        self.assertIsNone(authorize_inference(f"Bearer {INFERENCE_TOKEN}", config))
        with self.assertRaises(AuthorizationError):
            authorize_benchmark(f"Bearer {INFERENCE_TOKEN}", config)
        self.assertIsNone(authorize_benchmark(f"Bearer {BENCHMARK_TOKEN}", config))

    def test_missing_secret_fails_closed(self):
        with self.assertRaisesRegex(ValueError, "AQUILA_INFERENCE_TOKEN"):
            load_security_config({})

    def test_public_mode_disables_benchmark(self):
        config = load_security_config({"AQUILA_INFERENCE_TOKEN": INFERENCE_TOKEN})
        self.assertTrue(config.public_mode)
        self.assertFalse(config.benchmark_enabled)
        with self.assertRaises(FeatureDisabledError):
            authorize_benchmark(f"Bearer {INFERENCE_TOKEN}", config)
        with self.assertRaisesRegex(ValueError, "public mode"):
            load_security_config(
                {
                    "AQUILA_INFERENCE_TOKEN": INFERENCE_TOKEN,
                    "AQUILA_ENABLE_BENCHMARK": "1",
                    "AQUILA_BENCHMARK_TOKEN": BENCHMARK_TOKEN,
                }
            )

    def test_benchmark_size_is_bounded_before_allocation(self):
        self.assertEqual(validate_benchmark_size(2048), 2048)
        for invalid in (127, 4097, True, 128.0, "1024"):
            with self.subTest(invalid=invalid), self.assertRaises(ValueError):
                validate_benchmark_size(invalid)


class DatasetTests(unittest.TestCase):
    def test_missing_schema_has_clear_diagnostic(self):
        with self.assertRaisesRegex(
            DatasetValidationError, "alternative_e"
        ):
            validate_training_records([], ["question_statement", "correct_answer"])

    def test_empty_and_malformed_datasets_are_reported(self):
        columns = list(valid_record().keys())
        accepted, empty_report = validate_training_records([], columns)
        self.assertEqual(accepted, [])
        self.assertEqual(empty_report["total_rows"], 0)
        self.assertEqual(empty_report["valid_rows"], 0)

        malformed = valid_record("bad")
        malformed["question_statement"] = None
        malformed["correct_answer"] = "A or B"
        malformed["alternative_c"] = ""
        accepted, report = validate_training_records([malformed], columns)
        self.assertEqual(accepted, [])
        self.assertEqual(report["excluded_rows"], 1)
        self.assertEqual(
            set(report["excluded"][0]["reasons"]),
            {
                "missing_or_empty_question_statement",
                "invalid_correct_answer",
                "missing_or_empty_alternative_c",
            },
        )

    def test_only_selected_answer_labels_receive_synthetic_rationale_disposition(self):
        rows = [valid_record("q-1"), valid_record("q-2")]
        accepted, report = validate_training_records(rows, list(rows[0].keys()))
        selected = [accepted[0]]
        manifest = build_training_manifest(rows, accepted, selected, report)
        self.assertEqual(manifest["legacy_template_eligible_rows"], 2)
        self.assertTrue(manifest["examples"][0]["legacy_template_eligible"])
        self.assertTrue(manifest["examples"][0]["selected_for_training"])
        self.assertEqual(
            manifest["examples"][0]["disposition"],
            "answer_key_prediction_only; synthetic_rationale_removed",
        )
        self.assertTrue(manifest["examples"][1]["legacy_template_eligible"])
        self.assertFalse(manifest["examples"][1]["selected_for_training"])

    def test_manifest_classifies_legacy_eligible_rows_excluded_for_bad_choices(self):
        incomplete = valid_record("q-incomplete")
        incomplete["alternative_e"] = None
        accepted, report = validate_training_records(
            [incomplete], list(incomplete.keys())
        )
        manifest = build_training_manifest([incomplete], accepted, [], report)
        row = manifest["examples"][0]
        self.assertTrue(row["legacy_template_eligible"])
        self.assertEqual(
            row["disposition"], "excluded_from_training; legacy_template_eligible"
        )

    def test_answer_key_example_has_no_fabricated_rationale(self):
        accepted, _ = validate_training_records(
            [valid_record()], list(valid_record().keys())
        )
        messages = build_answer_key_messages(accepted[0])
        self.assertEqual(messages[-1]["content"], "A")
        self.assertNotIn("Resolução Analítica", messages[-1]["content"])
        self.assertIn("somente", messages[0]["content"])

    def test_local_fixture_manifest_tracks_provenance_and_unknown_history(self):
        fixture_path = Path(__file__).with_name("fixtures") / "aquila_manifest_fixture.csv"
        with fixture_path.open(encoding="utf-8", newline="") as fixture_file:
            reader = csv.DictReader(fixture_file)
            rows = list(reader)
            columns = reader.fieldnames
        input_hash = sha256_file(fixture_path)
        self.assertEqual(input_hash, hashlib.sha256(fixture_path.read_bytes()).hexdigest())

        accepted, report = validate_training_records(rows, columns)
        manifest = build_training_manifest(
            rows,
            accepted,
            accepted,
            report,
            input_file_sha256=input_hash,
        )

        self.assertEqual(
            {
                "raw_rows": manifest["raw_rows"],
                "valid_rows": manifest["valid_rows"],
                "selected_rows": manifest["selected_rows"],
                "excluded_rows": manifest["excluded_rows"],
                "legacy_template_eligible_rows": manifest[
                    "legacy_template_eligible_rows"
                ],
                "unknown_legacy_template_eligibility_rows": manifest[
                    "unknown_legacy_template_eligibility_rows"
                ],
            },
            {
                "raw_rows": 3,
                "valid_rows": 1,
                "selected_rows": 1,
                "excluded_rows": 2,
                "legacy_template_eligible_rows": 1,
                "unknown_legacy_template_eligibility_rows": 1,
            },
        )
        self.assertEqual(manifest["objective"], "answer_key_prediction_only")
        self.assertEqual(manifest["validation_rules_version"], "1.0.0")
        self.assertEqual(manifest["input_file_sha256"], input_hash)
        self.assertEqual(manifest["input_file_hash_status"], "available")
        self.assertEqual(manifest["historical_training_status"], "unknown")
        self.assertIsNone(manifest["historical_training_count"])

        accepted_row, invalid_row, unknown_row = manifest["examples"]
        self.assertEqual(accepted_row["source_row_id"], "fixture-valid")
        self.assertEqual(accepted_row["validation_status"], "accepted")
        self.assertEqual(accepted_row["validation_reasons"], [])
        self.assertEqual(accepted_row["legacy_template_eligibility"], "eligible")
        self.assertEqual(accepted_row["input_file_sha256"], input_hash)
        self.assertEqual(accepted_row["historical_training_status"], "unknown")
        self.assertTrue(accepted_row["selected_for_training"])
        self.assertEqual(invalid_row["validation_status"], "rejected")
        self.assertIn("invalid_correct_answer", invalid_row["validation_reasons"])
        self.assertEqual(invalid_row["legacy_template_eligibility"], "ineligible")
        self.assertIsNone(unknown_row["source_row_id"])
        self.assertEqual(unknown_row["legacy_template_eligibility"], "unknown")
        self.assertIsNone(unknown_row["legacy_template_eligible"])

        messages = build_answer_key_messages(accepted[0])
        self.assertEqual(messages[-1]["content"], "A")
        self.assertIn("somente", messages[0]["content"])

    def test_missing_manifest_hash_is_explicitly_unknown(self):
        row = valid_record()
        accepted, report = validate_training_records([row], list(row))
        manifest = build_training_manifest([row], accepted, [], report)
        self.assertIsNone(manifest["input_file_sha256"])
        self.assertEqual(manifest["input_file_hash_status"], "unknown")
        self.assertEqual(manifest["historical_training_status"], "unknown")
        self.assertIsNone(manifest["historical_training_count"])


class NotebookSafetyTests(unittest.TestCase):
    def test_single_training_path_is_opt_in_and_guarded(self):
        notebook_path = Path(__file__).with_name("aquila_a100_neural_engine.ipynb")
        notebook = json.loads(notebook_path.read_text(encoding="utf-8"))
        cell_sources = ["".join(cell.get("source", [])) for cell in notebook["cells"]]
        training_source = cell_sources[10]
        self.assertIn("AQUILA_ENABLE_TRAINING", training_source)
        self.assertIn("_AQUILA_TRAINING_STARTED", training_source)
        self.assertIn("build_answer_key_messages", training_source)
        self.assertIn("build_training_manifest", training_source)
        self.assertNotIn("Resolução Analítica e Fundamentação Pedagógica", training_source)
        self.assertIn("if training_requested and accepted_records", training_source)
        self.assertIn("input_file_sha256=input_file_sha256", training_source)
        self.assertLess(
            training_source.index("manifest_path.write_text"),
            training_source.index("import torch"),
        )
        self.assertIn("pip install", cell_sources[4].lower())
        for index in (2, 5, 6, 7, 8, 9, 14):
            source = cell_sources[index].lower()
            self.assertTrue(
                "fluxo historico desativado" in source
                if index == 2
                else "legacy training path disabled" in source
            )
            self.assertNotIn("trainer.train", source)
            self.assertNotIn("cloudflared", source)
            self.assertNotIn("subprocess", source)
            self.assertNotIn("uvicorn", source)
            self.assertNotIn("restart", source)
        api_source = cell_sources[27]
        self.assertIn("MODEL_OBJECTIVE_CONTRACT", api_source)
        self.assertIn("Nunca fabrique", api_source)
        for endpoint in ("/tutor/chat", "/tutor/resolve", "/tutor/decompose", "/tutor/questions"):
            self.assertIn(
                f'@app.post("{endpoint}", dependencies=[Depends(require_inference)])',
                api_source,
            )
        benchmark_source = api_source[api_source.index('@app.post("/benchmark",'):]
        self.assertLess(
            benchmark_source.index("validate_benchmark_size(req.size)"),
            benchmark_source.index("torch.randn"),
        )
        self.assertIn("SECURITY_CONFIG = load_security_config()", api_source)
        self.assertIn("AQUILA_ALLOW_PUBLIC_TUNNEL", cell_sources[28])

    def test_api_dependencies_reject_unauthorized_requests_without_gpu(self):
        try:
            from fastapi import HTTPException
            from pydantic import ValidationError
        except ImportError:
            self.skipTest("FastAPI is not installed")

        notebook_path = Path(__file__).with_name("aquila_a100_neural_engine.ipynb")
        notebook = json.loads(notebook_path.read_text(encoding="utf-8"))
        api_source = "".join(notebook["cells"][27]["source"])
        fake_torch = types.ModuleType("torch")
        fake_torch.cuda = types.SimpleNamespace(is_available=lambda: True)
        fake_torch.allocations = 0

        def fake_randn(*args, **kwargs):
            fake_torch.allocations += 1
            raise AssertionError("GPU allocation must not occur in this test")

        fake_torch.randn = fake_randn
        namespace = {"__name__": "aquila_api_test"}
        with patch.dict(
            os.environ,
            {
                "AQUILA_INFERENCE_TOKEN": INFERENCE_TOKEN,
                "AQUILA_PUBLIC_MODE": "true",
            },
        ), patch.dict(sys.modules, {"torch": fake_torch}):
            exec(compile(api_source, "aquila-api-cell", "exec"), namespace)

        for header in (None, "Bearer invalid"):
            with self.subTest(header=header), self.assertRaises(HTTPException) as raised:
                namespace["require_inference"](authorization=header)
            self.assertEqual(raised.exception.status_code, 401)

        with self.assertRaises(HTTPException) as raised:
            namespace["require_benchmark"](authorization=f"Bearer {INFERENCE_TOKEN}")
        self.assertEqual(raised.exception.status_code, 404)

        private_config = load_security_config(
            {
                "AQUILA_INFERENCE_TOKEN": INFERENCE_TOKEN,
                "AQUILA_BENCHMARK_TOKEN": BENCHMARK_TOKEN,
                "AQUILA_ENABLE_BENCHMARK": "1",
                "AQUILA_PUBLIC_MODE": "false",
            }
        )
        namespace["SECURITY_CONFIG"] = private_config
        with self.assertRaises(HTTPException) as raised:
            namespace["require_benchmark"](authorization=f"Bearer {INFERENCE_TOKEN}")
        self.assertEqual(raised.exception.status_code, 403)
        self.assertIsNone(
            namespace["require_benchmark"](authorization=f"Bearer {BENCHMARK_TOKEN}")
        )
        with self.assertRaises(ValueError):
            namespace["benchmark_a100"](types.SimpleNamespace(size=4097))
        with self.assertRaises(ValidationError):
            namespace["BenchmarkRequest"](size=128.0)
        self.assertEqual(fake_torch.allocations, 0)


class ApiRouteIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        notebook_path = Path(__file__).with_name("aquila_a100_neural_engine.ipynb")
        notebook = json.loads(notebook_path.read_text(encoding="utf-8"))
        cls.cell_sources = ["".join(cell.get("source", [])) for cell in notebook["cells"]]
        cls.code_sources = [
            "".join(cell.get("source", []))
            for cell in notebook["cells"]
            if cell.get("cell_type") == "code"
        ]
        cls.api_source = next(
            source for source in cls.code_sources
            if "SECURITY_CONFIG = load_security_config()" in source
        )

    def build_app(self, environment):
        try:
            from fastapi.testclient import TestClient
        except ImportError:
            self.skipTest("FastAPI/httpx are not installed")

        fake_torch = types.ModuleType("torch")
        fake_torch.allocations = []
        fake_torch.cuda = types.SimpleNamespace(
            is_available=lambda: True,
            is_bf16_supported=lambda: True,
            synchronize=lambda: None,
            get_device_name=lambda _index: "controlled-test-gpu",
        )
        fake_torch.bfloat16 = "bfloat16"
        fake_torch.float16 = "float16"
        fake_torch.randn = lambda *args, **kwargs: (
            fake_torch.allocations.append((args, kwargs)) or object()
        )
        fake_torch.matmul = lambda _left, _right: None
        namespace = {"__name__": "aquila_api_integration_test"}
        with patch.dict(os.environ, environment, clear=True), patch.dict(
            sys.modules, {"torch": fake_torch}
        ):
            exec(compile(self.api_source, "aquila-api-cell", "exec"), namespace)
        return TestClient, namespace, fake_torch

    def test_api_auth_validation_and_benchmark_guards_through_routes(self):
        TestClient, namespace, fake_torch = self.build_app(
            {
                "AQUILA_INFERENCE_TOKEN": INFERENCE_TOKEN,
                "AQUILA_PUBLIC_MODE": "true",
            }
        )
        model_calls = []
        namespace["generate_reply"] = (
            lambda *args: (model_calls.append(args) or ("A", 1, 1.0))
        )
        client = TestClient(namespace["app"])

        for header in (None, "Basic invalid", "Bearer invalid"):
            headers = {"Authorization": header} if header else {}
            response = client.post(
                "/tutor/chat", headers=headers, json={"prompt": "prever resposta"}
            )
            self.assertEqual(response.status_code, 401)
        self.assertEqual(model_calls, [])

        response = client.post(
            "/tutor/chat",
            headers={"Authorization": f"Bearer {INFERENCE_TOKEN}"},
            json={"prompt": ""},
        )
        self.assertEqual(response.status_code, 422)
        self.assertEqual(model_calls, [])

        response = client.post(
            "/tutor/chat",
            headers={"Authorization": f"Bearer {INFERENCE_TOKEN}"},
            json={"prompt": "prever resposta"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(model_calls), 1)

        response = client.post(
            "/benchmark",
            headers={"Authorization": f"Bearer {INFERENCE_TOKEN}"},
            json={"size": 128},
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(fake_torch.allocations, [])

        TestClient, private_namespace, private_torch = self.build_app(
            {
                "AQUILA_INFERENCE_TOKEN": INFERENCE_TOKEN,
                "AQUILA_BENCHMARK_TOKEN": BENCHMARK_TOKEN,
                "AQUILA_ENABLE_BENCHMARK": "1",
                "AQUILA_PUBLIC_MODE": "false",
            }
        )
        private_client = TestClient(private_namespace["app"])
        response = private_client.post(
            "/benchmark",
            headers={"Authorization": f"Bearer {INFERENCE_TOKEN}"},
            json={"size": 128},
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(private_torch.allocations, [])

        response = private_client.post(
            "/benchmark",
            headers={"Authorization": f"Bearer {BENCHMARK_TOKEN}"},
            json={"size": 4097},
        )
        self.assertEqual(response.status_code, 422)
        self.assertEqual(private_torch.allocations, [])
        with self.assertRaises(ValueError):
            private_namespace["benchmark_a100"](types.SimpleNamespace(size=4097))
        self.assertEqual(private_torch.allocations, [])

    def test_tunnel_requires_opt_in_before_starting_any_process(self):
        tunnel_source = next(
            source for source in self.code_sources
            if "AQUILA_ALLOW_PUBLIC_TUNNEL" in source
        )
        config = load_security_config(
            {
                "AQUILA_INFERENCE_TOKEN": INFERENCE_TOKEN,
                "AQUILA_PUBLIC_MODE": "true",
            }
        )
        scenarios = (
            ({}, {}, "configuracao segura da API"),
            (
                {"SECURITY_CONFIG": config},
                {
                    "AQUILA_INFERENCE_TOKEN": INFERENCE_TOKEN,
                    "AQUILA_PUBLIC_MODE": "true",
                },
                "opt-in",
            ),
            (
                {"SECURITY_CONFIG": config},
                {"AQUILA_PUBLIC_MODE": "true"},
                "AQUILA_INFERENCE_TOKEN",
            ),
        )
        for namespace, environment, expected_error in scenarios:
            namespace["__name__"] = "aquila_tunnel_test"
            with self.subTest(expected_error=expected_error), patch.dict(
                os.environ, environment, clear=True
            ), patch("threading.Thread") as thread, patch(
                "subprocess.Popen"
            ) as popen:
                with self.assertRaisesRegex(RuntimeError, expected_error):
                    exec(
                        compile(tunnel_source, "aquila-tunnel-cell", "exec"),
                        namespace,
                    )
                thread.assert_not_called()
                popen.assert_not_called()

    def test_colab_import_uses_uploaded_helper_in_runtime_directory(self):
        training_source = next(
            source for source in self.code_sources if "AQUILA_ENABLE_TRAINING" in source
        )
        api_source = self.api_source
        for source in (training_source, api_source):
            self.assertIn('Path.cwd() / "aquila_hardening.py"', source)
        intro = self.cell_sources[0]
        self.assertIn("`/content`", intro)
        self.assertIn("historico", intro.lower())
        self.assertIn("nao as interprete como resultado", intro.lower())
        self.assertLess(
            intro.index("python -m unittest -v test_aquila_hardening"),
            intro.index("celula 10 para validar o dataset remoto"),
        )

    def test_default_notebook_audit_uses_local_fixture_without_model_or_gpu(self):
        training_source = next(
            source for source in self.code_sources if "AQUILA_ENABLE_TRAINING" in source
        )
        fixture_path = Path(__file__).with_name("fixtures") / "aquila_manifest_fixture.csv"
        with fixture_path.open(encoding="utf-8", newline="") as fixture_file:
            reader = csv.DictReader(fixture_file)
            records = list(reader)
            columns = reader.fieldnames

        dataset = types.SimpleNamespace(
            cache_files=[{"filename": str(fixture_path)}],
            to_pandas=lambda: types.SimpleNamespace(
                columns=columns,
                to_dict=lambda orient: records,
            ),
        )
        load_calls = []
        fake_datasets = types.ModuleType("datasets")
        fake_datasets.load_dataset = lambda *args, **kwargs: (
            load_calls.append((args, kwargs)) or dataset
        )
        fake_pandas = types.ModuleType("pandas")
        original_cwd = Path.cwd()
        original_sys_path = sys.path[:]
        original_hardening = sys.modules.pop("aquila_hardening", None)

        try:
            with tempfile.TemporaryDirectory() as runtime_directory:
                shutil.copy2(
                    Path(__file__).with_name("aquila_hardening.py"),
                    Path(runtime_directory) / "aquila_hardening.py",
                )
                os.chdir(runtime_directory)
                sys.path.insert(0, runtime_directory)
                namespace = {"__name__": "aquila_audit_fixture_test"}
                with patch.dict(os.environ, {}, clear=True), patch.dict(
                    sys.modules,
                    {
                        "datasets": fake_datasets,
                        "pandas": fake_pandas,
                        "torch": None,
                    },
                ):
                    exec(
                        compile(training_source, "aquila-training-cell", "exec"),
                        namespace,
                    )
                manifest = json.loads(
                    (Path(runtime_directory) / "aquila_training_manifest.json").read_text(
                        encoding="utf-8"
                    )
                )
                self.assertEqual(len(load_calls), 1)
                self.assertEqual(load_calls[0][0][0], "HenriqueGodoy/Alvorada-bench")
                self.assertEqual(manifest["raw_rows"], 3)
                self.assertEqual(manifest["valid_rows"], 1)
                self.assertEqual(manifest["selected_rows"], 0)
                self.assertEqual(manifest["excluded_rows"], 2)
                self.assertEqual(
                    manifest["input_file_sha256"], sha256_file(fixture_path)
                )
                self.assertEqual(manifest["historical_training_status"], "unknown")
                self.assertIsNone(manifest["historical_training_count"])
                self.assertNotIn("_AQUILA_TRAINING_STARTED", namespace)
                self.assertIsNone(sys.modules.get("torch"))
                os.chdir(original_cwd)
        finally:
            os.chdir(original_cwd)
            sys.path[:] = original_sys_path
            sys.modules.pop("aquila_hardening", None)
            if original_hardening is not None:
                sys.modules["aquila_hardening"] = original_hardening


if __name__ == "__main__":
    unittest.main()
