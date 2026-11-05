#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Missão PP — Item 10: Teste Controlado do Harness PC + Inferência Colab (/v1/chat/completions)
Verifica os 8 requisitos obrigatórios em workspace temporário descartável.
"""

import os
import sys
import json
import shutil
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / "scripts" / "colab_harness"))

from aquila_colab_harness import (
    AquilaColabHarness,
    ColabInferenceClient,
    EndpointUnavailableError,
    SecurityPolicyViolation,
)


class MockOpenAIChatServer:
    """Servidor HTTP local compatível com OpenAI /v1/chat/completions para validação de contrato."""

    def __init__(self, scripted_actions):
        self.scripted_actions = list(scripted_actions)
        self.call_index = 0
        self.simulate_down = False
        self.received_headers = []
        self.server = None
        self.thread = None

    def start(self) -> str:
        outer = self

        class Handler(BaseHTTPRequestHandler):
            def do_POST(self):
                content_len = int(self.headers.get('Content-Length', 0))
                if content_len > 0:
                    self.rfile.read(content_len)
                if self.path != "/v1/chat/completions":
                    self.send_response(404)
                    self.end_headers()
                    return

                if outer.simulate_down:
                    self.send_response(503)
                    self.end_headers()
                    self.wfile.write(b"Service Unavailable - Colab Runtime Disconnected")
                    return

                outer.received_headers.append(dict(self.headers))
                idx = min(outer.call_index, len(outer.scripted_actions) - 1)
                action = outer.scripted_actions[idx]
                outer.call_index += 1

                response_payload = {
                    "id": f"chatcmpl-mock-{outer.call_index}",
                    "object": "chat.completion",
                    "model": "Qwen/Qwen2.5-Coder-14B-Instruct-Mock",
                    "choices": [
                        {
                            "index": 0,
                            "message": {
                                "role": "assistant",
                                "content": json.dumps(action),
                            },
                            "finish_reason": "stop",
                        }
                    ],
                }
                raw = json.dumps(response_payload).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(raw)))
                self.end_headers()
                self.wfile.write(raw)

            def log_message(self, format, *args):
                pass

        self.server = HTTPServer(("127.0.0.1", 0), Handler)
        port = self.server.server_port
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        return f"http://127.0.0.1:{port}"

    def stop(self):
        if self.server:
            self.server.shutdown()
            self.server.server_close()


def run_harness_verification():
    tmp_dir = Path(tempfile.mkdtemp(prefix="aquila_harness_test_")).resolve()
    checks = []

    def record(step_name: str, passed: bool, details: str):
        checks.append({"check": step_name, "passed": passed, "details": details})
        if not passed:
            raise AssertionError(f"Harness check failed: {step_name} -> {details}")

    try:
        # Prepara arquivos sintéticos no workspace temporário
        (tmp_dir / "src").mkdir(parents=True, exist_ok=True)
        (tmp_dir / "tests").mkdir(parents=True, exist_ok=True)
        (tmp_dir / ".git").mkdir(parents=True, exist_ok=True)

        calc_file = tmp_dir / "src" / "math_helper.py"
        calc_file.write_text("def add_scores(a: int, b: int) -> int:\n    return a - b\n", encoding="utf-8")

        test_file = tmp_dir / "tests" / "test_math_helper.py"
        test_file.write_text(
            "import unittest\nfrom src.math_helper import add_scores\n\n"
            "class TestMathHelper(unittest.TestCase):\n"
            "    def test_add(self):\n"
            "        self.assertEqual(add_scores(4, 6), 10)\n\n"
            "if __name__ == '__main__':\n    unittest.main()\n",
            encoding="utf-8",
        )

        # Arquivos sensíveis que NUNCA podem ser lidos/modificados pelo harness
        (tmp_dir / ".env").write_text("SECRET_KEY=never_read_me\n", encoding="utf-8")
        (tmp_dir / "private.pem").write_text("-----BEGIN PRIVATE KEY-----\n", encoding="utf-8")
        (tmp_dir / ".git" / "config").write_text("[core]\n", encoding="utf-8")
        (tmp_dir / "aquila.db").write_bytes(b"SQLite format 3\x00")

        # Roteiro de 8 passos para o servidor mock /v1/chat/completions
        scripted_steps = [
            # Passo 1: Leitura de arquivo permitido
            {"tool": "read_file", "args": {"path": "src/math_helper.py"}},
            # Passo 2: Tentativa de escape do workspace (../)
            {"tool": "read_file", "args": {"path": "../outside_secret.txt"}},
            # Passo 3: Tentativa de leitura de .env
            {"tool": "read_file", "args": {"path": ".env"}},
            # Passo 4: Tentativa de comando fora da allowlist (git push)
            {"tool": "run_command", "args": {"argv": ["git", "push", "origin", "HEAD"]}},
            # Passo 5: Aplicação de patch pequeno no arquivo permitido
            {
                "tool": "apply_patch",
                "args": {
                    "path": "src/math_helper.py",
                    "old": "return a - b",
                    "new": "return a + b",
                },
            },
            # Passo 6: Execução de teste permitido (python -m unittest)
            {"tool": "run_command", "args": {"argv": ["python", "-m", "unittest", "discover", "-s", "tests"]}},
            # Passo 7: Leitura de verificação pós-patch
            {"tool": "read_file", "args": {"path": "src/math_helper.py"}},
            # Passo 8: Atinge limite max_steps=8 sem done=True para provar parada automática
            {"tool": "read_file", "args": {"path": "tests/test_math_helper.py"}},
        ]

        mock_server = MockOpenAIChatServer(scripted_steps)
        base_url = mock_server.start()

        os.environ["COLAB_LLM_BASE_URL"] = base_url
        os.environ["COLAB_LLM_TOKEN"] = "ephemeral-test-token-not-hardcoded"
        os.environ["COLAB_MODEL"] = "Qwen/Qwen2.5-Coder-14B-Instruct-Mock"
        os.environ["AQUILA_WORKSPACE"] = str(tmp_dir)

        state_file = tmp_dir / ".harness_state" / "colab_harness_state.json"
        client = ColabInferenceClient()
        harness = AquilaColabHarness(workspace_root=tmp_dir, state_file=state_file, client=client, max_steps=8)

        # Executa Passos 1 a 4
        r1 = harness.step_once()
        record(
            "1_read_allowed_file",
            r1["outcome"]["ok"] is True and "return a - b" in r1["outcome"]["content"],
            f"step={r1['step_count']}",
        )

        r2 = harness.step_once()
        record(
            "2_block_outside_workspace_path",
            r2["outcome"]["ok"] is False and "PATH_OUTSIDE_WORKSPACE" in r2["outcome"]["message"],
            r2["outcome"]["message"],
        )

        r3 = harness.step_once()
        # Também valida bloqueio direto de chave privada, .git/config e aquila.db
        extra_blocks = 0
        for forbidden_rel in ("private.pem", ".git/config", "aquila.db", "credentials.json"):
            try:
                harness.read_allowed_file(forbidden_rel)
            except SecurityPolicyViolation:
                extra_blocks += 1
        record(
            "3_block_env_and_sensitive_files",
            r3["outcome"]["ok"] is False
            and "SENSITIVE_PATH_BLOCKED" in r3["outcome"]["message"]
            and extra_blocks == 4,
            f"env_blocked=True, extra_sensitive_blocked={extra_blocks}/4",
        )

        r4 = harness.step_once()
        # Também valida bloqueio direto de comandos destrutivos / shell
        extra_cmd_blocks = 0
        for bad_cmd in (["rm", "-rf", "/"], ["powershell", "-Command", "dir"], ["git", " status; whoami"]):
            try:
                harness.run_allowed_command(bad_cmd)
            except SecurityPolicyViolation:
                extra_cmd_blocks += 1
        record(
            "4_block_disallowed_and_hitl_commands",
            r4["outcome"]["ok"] is False
            and "HITL_OPERATION_BLOCKED" in r4["outcome"]["message"]
            and extra_cmd_blocks == 3,
            f"git_push_blocked=True, extra_cmd_blocked={extra_cmd_blocks}/3",
        )

        # Passo 5: Aplica patch pequeno
        r5 = harness.step_once()
        record(
            "5_apply_small_patch_in_temp_workspace",
            r5["outcome"]["ok"] is True and "return a + b" in calc_file.read_text(encoding="utf-8"),
            str(r5["outcome"]["result"]),
        )

        # Passo 6: Executa teste permitido
        r6 = harness.step_once()
        record(
            "6_run_allowed_test_command",
            r6["outcome"]["ok"] is True and r6["outcome"]["result"]["returncode"] == 0,
            f"returncode={r6['outcome']['result']['returncode']}",
        )

        # Passo 7: Simula queda do endpoint Colab, verifica persistência e retomada em nova instância
        mock_server.simulate_down = True
        disconnected_caught = False
        try:
            harness.step_once()
        except EndpointUnavailableError:
            disconnected_caught = True

        persisted_state = json.loads(state_file.read_text(encoding="utf-8"))
        # Restaura o endpoint e instancia um NOVO objeto AquilaColabHarness lendo o state_file salvo
        mock_server.simulate_down = False
        resumed_harness = AquilaColabHarness(workspace_root=tmp_dir, state_file=state_file, client=client, max_steps=8)
        r7 = resumed_harness.step_once()
        record(
            "7_state_persistence_and_resume_after_disconnect",
            disconnected_caught is True
            and persisted_state["status"] == "PAUSED_ENDPOINT_DISCONNECTED"
            and persisted_state["step_count"] == 6
            and r7["step_count"] == 7
            and r7["outcome"]["ok"] is True,
            f"paused_at_step={persisted_state['step_count']}, resumed_to_step={r7['step_count']}",
        )

        # Passo 8: Atinge max_steps=8 e confirma parada automática
        r8 = resumed_harness.step_once()
        r9_extra = resumed_harness.step_once()
        record(
            "8_stop_at_max_steps_8",
            r8["step_count"] == 8
            and r8["status"] == "STOPPED_MAX_STEPS"
            and r9_extra["status"] == "STOPPED_MAX_STEPS"
            and r9_extra["step_count"] == 8,
            f"final_status={r9_extra['status']}, final_step_count={r9_extra['step_count']}",
        )

        mock_server.stop()

        report = {
            "validation_mode": "LOCAL_CONTRACT_SIMULATOR (/v1/chat/completions mock server)",
            "colab_remote_gpu_tested": False,
            "total_checks": len(checks),
            "passed_checks": len(checks),
            "checks": checks,
        }
        report_path = ROOT / "test-results" / "colab_harness_verification_report.json"
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"OK: {len(checks)}/8 Colab Harness checks passed -> {report_path}")

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


if __name__ == "__main__":
    run_harness_verification()
