#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Áquila Pro — PC Harness & Colab Inference Client (Mission Item 10)
==================================================================
Arquitetura:
  - O PC local detém o repositório, git, testes, persistência de estado e política de segurança.
  - O Google Colab (ou servidor compatível com OpenAI /v1/chat/completions) atua exclusivamente
    como motor temporário de inferência stateless.
  - Nenhum segredo é hardcoded; toda configuração vem de variáveis de ambiente:
      * COLAB_LLM_BASE_URL
      * COLAB_LLM_TOKEN
      * COLAB_MODEL
      * AQUILA_WORKSPACE
"""

import os
import re
import json
import time
import fnmatch
import subprocess
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple


DEFAULT_MAX_STEPS = 8

# Padrões de arquivos estritamente proibidos (leitura e escrita)
SENSITIVE_PATH_PATTERNS = (
    ".env",
    ".env.*",
    "*.pem",
    "*.key",
    "*.pfx",
    "*.p12",
    "credentials*",
    "*secret*",
    ".git/config",
    ".git/credentials",
    "aquila.db",
    "aquila.db-*",
    "pedagogical_scaffolding.db",
    "*.sqlite",
    "*.sqlite3",
)

# Comandos permitidos sem shell=True (allowlist estrita por prefixo de argv)
ALLOWED_COMMANDS: Tuple[Tuple[str, ...], ...] = (
    ("git", "status"),
    ("git", "diff"),
    ("pytest",),
    ("python", "-m", "pytest"),
    ("python", "-m", "unittest"),
    ("npm", "test"),
    ("npx", "vitest", "run"),
)

# Comandos / subcomandos terminantemente bloqueados sem aprovação humana explícita (HITL)
FORBIDDEN_COMMAND_TOKENS = frozenset({
    "push",
    "merge",
    "rebase",
    "release",
    "publish",
    "deploy",
    "rm",
    "del",
    "rmdir",
    "format",
    "netsh",
    "iptables",
    "ufw",
    "reg",
    "sc",
    "powershell",
    "cmd",
    "bash",
    "sh",
})


class SecurityPolicyViolation(PermissionError):
    """Exceção levantada quando o harness bloqueia uma operação por política de segurança."""


class EndpointUnavailableError(ConnectionError):
    """Exceção levantada quando o endpoint remoto Colab cai ou fica indisponível."""


class ColabInferenceClient:
    """Cliente HTTP stateless para o servidor de inferência no Colab (/v1/chat/completions)."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        token: Optional[str] = None,
        model: Optional[str] = None,
        timeout_seconds: int = 30,
    ):
        self.base_url = (base_url or os.environ.get("COLAB_LLM_BASE_URL") or "").rstrip("/")
        self.token = token if token is not None else os.environ.get("COLAB_LLM_TOKEN", "")
        self.model = model or os.environ.get("COLAB_MODEL") or "Qwen/Qwen2.5-Coder-14B-Instruct"
        self.timeout_seconds = timeout_seconds

    def complete(self, messages: List[Dict[str, str]], temperature: float = 0.0) -> Dict[str, Any]:
        if not self.base_url:
            raise EndpointUnavailableError("COLAB_LLM_BASE_URL não configurado.")
        url = f"{self.base_url}/v1/chat/completions"
        payload = json.dumps({
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": 1024,
        }).encode("utf-8")

        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"

        req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=self.timeout_seconds) as resp:
                body = resp.read().decode("utf-8")
                return json.loads(body)
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ConnectionError) as exc:
            raise EndpointUnavailableError(f"Endpoint Colab indisponível ({url}): {exc}") from exc


class AquilaColabHarness:
    """
    Harness local no PC que valida chamadas de ferramentas, persiste estado a cada passo
    e limita a execução a max_steps=8.
    """

    def __init__(
        self,
        workspace_root: Optional[Path] = None,
        state_file: Optional[Path] = None,
        client: Optional[ColabInferenceClient] = None,
        max_steps: int = DEFAULT_MAX_STEPS,
    ):
        raw_ws = workspace_root or Path(os.environ.get("AQUILA_WORKSPACE", ".")).resolve()
        self.workspace_root = Path(raw_ws).resolve()
        self.state_file = (
            Path(state_file).resolve()
            if state_file
            else self.workspace_root / ".harness_state" / "colab_harness_state.json"
        )
        self.client = client or ColabInferenceClient()
        self.max_steps = min(int(max_steps), DEFAULT_MAX_STEPS)
        self.state: Dict[str, Any] = self._load_or_init_state()

    def _load_or_init_state(self) -> Dict[str, Any]:
        if self.state_file.exists():
            try:
                return json.loads(self.state_file.read_text(encoding="utf-8"))
            except Exception:
                pass
        return {
            "session_id": f"harness-{int(time.time())}",
            "workspace": str(self.workspace_root),
            "step_count": 0,
            "max_steps": self.max_steps,
            "status": "IDLE",
            "history": [],
            "audit_events": [],
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

    def save_state(self) -> None:
        self.state["updated_at"] = datetime.now(timezone.utc).isoformat()
        self.state_file.parent.mkdir(parents=True, exist_ok=True)
        tmp_path = self.state_file.with_suffix(".json.part")
        tmp_path.write_text(json.dumps(self.state, indent=2, ensure_ascii=False), encoding="utf-8")
        tmp_path.replace(self.state_file)

    def _record_audit(self, action: str, allowed: bool, detail: str) -> None:
        self.state["audit_events"].append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "step": self.state["step_count"],
            "action": action,
            "allowed": allowed,
            "detail": detail,
        })
        self.save_state()

    # ==========================================================================
    # VALIDAÇÃO DE CAMINHOS E ARQUIVOS SENSÍVEIS
    # ==========================================================================
    def resolve_safe_path(self, relative_path: str) -> Path:
        if not relative_path or not isinstance(relative_path, str):
            self._record_audit("resolve_path", False, "Caminho vazio ou inválido")
            raise SecurityPolicyViolation("PATH_INVALID: Caminho vazio ou inválido.")

        candidate = (self.workspace_root / relative_path).resolve()
        try:
            rel = candidate.relative_to(self.workspace_root)
        except ValueError as exc:
            self._record_audit("resolve_path", False, f"Tentativa de escape do workspace: {relative_path}")
            raise SecurityPolicyViolation(
                f"PATH_OUTSIDE_WORKSPACE: Caminho '{relative_path}' escapa do workspace '{self.workspace_root}'."
            ) from exc

        rel_posix = rel.as_posix().lower()
        name_lower = candidate.name.lower()

        for pattern in SENSITIVE_PATH_PATTERNS:
            pat_lower = pattern.lower()
            if fnmatch.fnmatch(name_lower, pat_lower) or fnmatch.fnmatch(rel_posix, pat_lower):
                self._record_audit("resolve_path", False, f"Arquivo sensível bloqueado ({pattern}): {rel_posix}")
                raise SecurityPolicyViolation(
                    f"SENSITIVE_PATH_BLOCKED: Acesso negado ao arquivo sensível '{rel_posix}' (regra '{pattern}')."
                )

        if rel_posix.startswith(".git/"):
            self._record_audit("resolve_path", False, f"Acesso a .git bloqueado: {rel_posix}")
            raise SecurityPolicyViolation(f"SENSITIVE_PATH_BLOCKED: Acesso direto a '{rel_posix}' proibido.")

        return candidate

    # ==========================================================================
    # OPERAÇÕES DE FERRAMENTAS DO HARNESS
    # ==========================================================================
    def read_allowed_file(self, relative_path: str) -> str:
        target = self.resolve_safe_path(relative_path)
        if not target.exists() or not target.is_file():
            raise FileNotFoundError(f"Arquivo não encontrado: {relative_path}")
        content = target.read_text(encoding="utf-8")
        self._record_audit("read_file", True, f"Leitura autorizada: {relative_path} ({len(content)} chars)")
        return content

    def apply_small_patch(self, relative_path: str, old_snippet: str, new_snippet: str) -> Dict[str, Any]:
        target = self.resolve_safe_path(relative_path)
        if not target.exists():
            raise FileNotFoundError(f"Arquivo alvo não existe: {relative_path}")
        if len(new_snippet) > 16384:
            self._record_audit("apply_patch", False, f"Patch excede limite de tamanho em {relative_path}")
            raise SecurityPolicyViolation("PATCH_TOO_LARGE: Patch excede 16 KB.")
        original = target.read_text(encoding="utf-8")
        if old_snippet not in original:
            raise ValueError(f"Trecho original não encontrado em {relative_path}")
        updated = original.replace(old_snippet, new_snippet, 1)
        target.write_text(updated, encoding="utf-8")
        self._record_audit("apply_patch", True, f"Patch aplicado em {relative_path}")
        return {"path": relative_path, "bytes_written": len(updated.encode("utf-8"))}

    def validate_command(self, argv: List[str]) -> List[str]:
        if not argv or not isinstance(argv, list) or not all(isinstance(x, str) for x in argv):
            self._record_audit("run_command", False, "Comando malformado")
            raise SecurityPolicyViolation("COMMAND_INVALID: argv deve ser uma lista não vazia de strings.")

        # Bloqueia caracteres de encadeamento de shell mesmo sem shell=True
        forbidden_chars = (";", "&&", "||", "|", "`", "$(", ">", "<")
        for token in argv:
            tok_lower = token.lower().strip()
            if any(fc in tok_lower for fc in forbidden_chars):
                self._record_audit("run_command", False, f"Metacaractere de shell bloqueado em '{token}'")
                raise SecurityPolicyViolation(f"SHELL_INJECTION_BLOCKED: Token '{token}' contém metacaractere proibido.")
            if tok_lower in FORBIDDEN_COMMAND_TOKENS:
                self._record_audit("run_command", False, f"Operação restrita HITL bloqueada: '{token}'")
                raise SecurityPolicyViolation(f"HITL_OPERATION_BLOCKED: Operação '{token}' exige aprovação humana explícita.")

        matched_prefix = False
        for allowed in ALLOWED_COMMANDS:
            if len(argv) >= len(allowed) and tuple(argv[: len(allowed)]) == allowed:
                matched_prefix = True
                break

        if not matched_prefix:
            self._record_audit("run_command", False, f"Comando fora da allowlist: {' '.join(argv)}")
            raise SecurityPolicyViolation(f"COMMAND_NOT_IN_ALLOWLIST: {' '.join(argv)}")

        return argv

    def run_allowed_command(self, argv: List[str], timeout: int = 30) -> Dict[str, Any]:
        safe_argv = self.validate_command(argv)
        proc = subprocess.run(
            safe_argv,
            cwd=str(self.workspace_root),
            shell=False,
            capture_output=True,
            text=True,
            timeout=timeout,
            encoding="utf-8",
            errors="replace",
        )
        self._record_audit("run_command", True, f"Executado: {' '.join(safe_argv)} (rc={proc.returncode})")
        return {
            "returncode": proc.returncode,
            "stdout": proc.stdout[:4000],
            "stderr": proc.stderr[:4000],
        }

    # ==========================================================================
    # LOOP CONTROLADO DE PASSOS (MAX_STEPS = 8) COM RETOMADA PERSISTENTE
    # ==========================================================================
    def execute_tool_call(self, tool_call: Dict[str, Any]) -> Dict[str, Any]:
        tool_name = tool_call.get("tool")
        args = tool_call.get("args") or {}

        if tool_name == "read_file":
            content = self.read_allowed_file(args.get("path", ""))
            return {"ok": True, "tool": tool_name, "content": content}
        if tool_name == "apply_patch":
            res = self.apply_small_patch(
                args.get("path", ""),
                args.get("old", ""),
                args.get("new", ""),
            )
            return {"ok": True, "tool": tool_name, "result": res}
        if tool_name == "run_command":
            res = self.run_allowed_command(args.get("argv", []))
            return {"ok": True, "tool": tool_name, "result": res}

        self._record_audit("unknown_tool", False, f"Ferramenta desconhecida: {tool_name}")
        raise SecurityPolicyViolation(f"UNKNOWN_TOOL: '{tool_name}' não é suportada pelo harness.")

    def step_once(self) -> Dict[str, Any]:
        if self.state["step_count"] >= self.max_steps:
            self.state["status"] = "STOPPED_MAX_STEPS"
            self.save_state()
            return {"status": "STOPPED_MAX_STEPS", "step_count": self.state["step_count"]}

        self.state["status"] = "RUNNING"
        self.save_state()

        messages = [
            {
                "role": "system",
                "content": "Retorne JSON estrito com {\"tool\": ..., \"args\": ...} ou {\"done\": true}.",
            },
            {
                "role": "user",
                "content": json.dumps({
                    "step": self.state["step_count"] + 1,
                    "history_len": len(self.state["history"]),
                }),
            },
        ]

        try:
            response = self.client.complete(messages)
        except EndpointUnavailableError as exc:
            self.state["status"] = "PAUSED_ENDPOINT_DISCONNECTED"
            self._record_audit("endpoint_disconnect", False, str(exc))
            self.save_state()
            raise

        self.state["step_count"] += 1
        choice_content = (
            response.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "{}")
        )
        parsed_action = json.loads(choice_content)

        if parsed_action.get("done") is True:
            self.state["status"] = "COMPLETED"
            self.state["history"].append({"step": self.state["step_count"], "action": parsed_action, "outcome": "DONE"})
            self.save_state()
            return {"status": "COMPLETED", "step_count": self.state["step_count"]}

        try:
            outcome = self.execute_tool_call(parsed_action)
        except (SecurityPolicyViolation, FileNotFoundError, ValueError) as policy_exc:
            outcome = {"ok": False, "error": type(policy_exc).__name__, "message": str(policy_exc)}

        self.state["history"].append({
            "step": self.state["step_count"],
            "action": parsed_action,
            "outcome": outcome,
        })
        if self.state["step_count"] >= self.max_steps:
            self.state["status"] = "STOPPED_MAX_STEPS"
        self.save_state()
        return {"status": self.state["status"], "step_count": self.state["step_count"], "outcome": outcome}

    def run_until_stop(self) -> Dict[str, Any]:
        while self.state["step_count"] < self.max_steps:
            res = self.step_once()
            if res["status"] in ("COMPLETED", "STOPPED_MAX_STEPS"):
                break
        if self.state["step_count"] >= self.max_steps and self.state["status"] != "COMPLETED":
            self.state["status"] = "STOPPED_MAX_STEPS"
            self.save_state()
        return self.state
