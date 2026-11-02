"""Small, dependency-free guards used by the Áquila notebook and tests."""

from dataclasses import dataclass
import hashlib
import hmac
import math
import os
from pathlib import Path
import re
from typing import Iterable, Mapping, Optional, Sequence


MIN_SECRET_LENGTH = 32
MIN_BENCHMARK_SIZE = 128
MAX_BENCHMARK_SIZE = 4096
VALIDATION_RULES_VERSION = "1.0.0"
REQUIRED_TRAINING_COLUMNS = (
    "question_statement",
    "correct_answer",
    "alternative_a",
    "alternative_b",
    "alternative_c",
    "alternative_d",
    "alternative_e",
)


class DatasetValidationError(ValueError):
    """Raised when a source dataset is missing its required schema."""


class AuthenticationError(Exception):
    """Raised when a request has no valid bearer credential."""


class AuthorizationError(Exception):
    """Raised when a valid credential lacks the requested role."""


class FeatureDisabledError(Exception):
    """Raised when a feature is disabled by security configuration."""


@dataclass(frozen=True)
class SecurityConfig:
    inference_token: str
    benchmark_token: Optional[str]
    benchmark_enabled: bool
    public_mode: bool
    cors_origins: tuple[str, ...]


def _env_flag(env: Mapping[str, str], name: str, default: bool) -> bool:
    value = env.get(name)
    if value is None:
        return default
    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    raise ValueError(f"{name} must be a boolean value")


def load_security_config(env: Optional[Mapping[str, str]] = None) -> SecurityConfig:
    """Load fail-closed API security settings from runtime environment only."""
    settings = os.environ if env is None else env
    inference_token = settings.get("AQUILA_INFERENCE_TOKEN", "").strip()
    if len(inference_token) < MIN_SECRET_LENGTH:
        raise ValueError(
            f"AQUILA_INFERENCE_TOKEN must be supplied at runtime and contain at least "
            f"{MIN_SECRET_LENGTH} characters"
        )

    public_mode = _env_flag(settings, "AQUILA_PUBLIC_MODE", True)
    benchmark_requested = _env_flag(settings, "AQUILA_ENABLE_BENCHMARK", False)
    benchmark_token = settings.get("AQUILA_BENCHMARK_TOKEN", "").strip() or None
    if benchmark_requested and public_mode:
        raise ValueError("AQUILA_ENABLE_BENCHMARK cannot be enabled in public mode")
    if benchmark_requested and (
        benchmark_token is None or len(benchmark_token) < MIN_SECRET_LENGTH
    ):
        raise ValueError(
            f"AQUILA_BENCHMARK_TOKEN must be supplied at runtime and contain at least "
            f"{MIN_SECRET_LENGTH} characters when the private benchmark is enabled"
        )

    origins = tuple(
        origin.strip()
        for origin in settings.get("AQUILA_ALLOWED_ORIGINS", "").split(",")
        if origin.strip()
    )
    if "*" in origins:
        raise ValueError("AQUILA_ALLOWED_ORIGINS must not contain a wildcard")

    return SecurityConfig(
        inference_token=inference_token,
        benchmark_token=benchmark_token,
        benchmark_enabled=benchmark_requested,
        public_mode=public_mode,
        cors_origins=origins,
    )


def _bearer_token(authorization: Optional[str]) -> str:
    if not authorization:
        raise AuthenticationError("Bearer authentication required")
    scheme, separator, token = authorization.partition(" ")
    if not separator or scheme.lower() != "bearer" or not token.strip():
        raise AuthenticationError("Bearer authentication required")
    return token.strip()


def _secure_equal(supplied: str, expected: str) -> bool:
    return hmac.compare_digest(supplied.encode("utf-8"), expected.encode("utf-8"))


def authorize_inference(authorization: Optional[str], config: SecurityConfig) -> None:
    supplied = _bearer_token(authorization)
    if not _secure_equal(supplied, config.inference_token):
        raise AuthenticationError("Invalid bearer credential")


def authorize_benchmark(authorization: Optional[str], config: SecurityConfig) -> None:
    if not config.benchmark_enabled:
        raise FeatureDisabledError("Benchmark is disabled")
    supplied = _bearer_token(authorization)
    benchmark_token = config.benchmark_token
    if benchmark_token and _secure_equal(supplied, benchmark_token):
        return
    if _secure_equal(supplied, config.inference_token):
        raise AuthorizationError("Inference credentials cannot access the benchmark")
    raise AuthenticationError("Invalid bearer credential")


def validate_benchmark_size(size: object) -> int:
    """Validate benchmark allocation size before any tensor is created."""
    if isinstance(size, bool) or not isinstance(size, int):
        raise ValueError("benchmark size must be an integer")
    if not MIN_BENCHMARK_SIZE <= size <= MAX_BENCHMARK_SIZE:
        raise ValueError(
            f"benchmark size must be between {MIN_BENCHMARK_SIZE} and "
            f"{MAX_BENCHMARK_SIZE}"
        )
    return size


def sha256_file(path: Path | str) -> str:
    """Return the SHA-256 digest of the exact file used as validation input."""
    digest = hashlib.sha256()
    with Path(path).open("rb") as input_file:
        for chunk in iter(lambda: input_file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _is_unknown(value: object) -> bool:
    return (
        value is None
        or (isinstance(value, float) and math.isnan(value))
        or type(value).__name__ in {"NAType", "NaTType"}
    )


def validate_training_records(
    records: Iterable[Mapping[str, object]], columns: Sequence[str]
) -> tuple[list[dict[str, object]], dict[str, object]]:
    """Validate core question/answer fields and all five answer choices."""
    missing_columns = sorted(set(REQUIRED_TRAINING_COLUMNS) - set(columns))
    if missing_columns:
        raise DatasetValidationError(
            "Dataset schema missing required columns: " + ", ".join(missing_columns)
        )

    accepted: list[dict[str, object]] = []
    rejected: list[dict[str, object]] = []
    for row_number, record in enumerate(records):
        reasons: list[str] = []
        statement = record.get("question_statement")
        if not isinstance(statement, str) or not statement.strip():
            reasons.append("missing_or_empty_question_statement")

        answer = record.get("correct_answer")
        normalized_answer = answer.strip().upper() if isinstance(answer, str) else ""
        if normalized_answer not in "ABCDE" or len(normalized_answer) != 1:
            reasons.append("invalid_correct_answer")

        for letter in "abcde":
            option = record.get(f"alternative_{letter}")
            if not isinstance(option, str) or not option.strip():
                reasons.append(f"missing_or_empty_alternative_{letter}")

        source_id = record.get("question_id")
        if _is_unknown(source_id) or not str(source_id).strip():
            source_id = row_number
        normalized = dict(record)
        normalized["correct_answer"] = normalized_answer
        if reasons:
            rejected.append(
                {
                    "source_row": row_number,
                    "source_row_id": (
                        None
                        if _is_unknown(record.get("question_id"))
                        or not str(record.get("question_id")).strip()
                        else record.get("question_id")
                    ),
                    "question_id": source_id,
                    "reasons": reasons,
                }
            )
        else:
            normalized["_aquila_source_row"] = row_number
            normalized["_aquila_question_id"] = source_id
            accepted.append(normalized)

    report: dict[str, object] = {
        "total_rows": len(accepted) + len(rejected),
        "valid_rows": len(accepted),
        "excluded_rows": len(rejected),
        "excluded": rejected,
    }
    return accepted, report


def build_training_manifest(
    raw_records: Sequence[Mapping[str, object]],
    accepted_records: Sequence[Mapping[str, object]],
    selected_records: Sequence[Mapping[str, object]],
    report: Mapping[str, object],
    input_file_sha256: Optional[str] = None,
) -> dict[str, object]:
    """Record current validation and selection without inferring training history."""
    if input_file_sha256 is not None and not re.fullmatch(
        r"[0-9a-fA-F]{64}", input_file_sha256
    ):
        raise ValueError("input_file_sha256 must be a 64-character hexadecimal digest")

    selected_rows = {
        record["_aquila_source_row"]
        for record in selected_records
        if "_aquila_source_row" in record
    }
    accepted_rows = {
        record["_aquila_source_row"]
        for record in accepted_records
        if "_aquila_source_row" in record
    }
    rejected_by_row = {
        item["source_row"]: item["reasons"] for item in report.get("excluded", [])
    }

    entries = []
    for row_number, record in enumerate(raw_records):
        question_id = record.get("question_id")
        if _is_unknown(question_id) or not str(question_id).strip():
            question_id = row_number
        selected = row_number in selected_rows
        reasons = rejected_by_row.get(row_number, [])
        statement = record.get("question_statement")
        answer = record.get("correct_answer")
        missing_statement = _is_unknown(statement) or (
            isinstance(statement, str) and not statement.strip()
        )
        missing_answer = _is_unknown(answer) or (
            isinstance(answer, str) and not answer.strip()
        )
        normalized_answer = answer.strip().upper() if isinstance(answer, str) else ""
        if missing_statement or missing_answer:
            legacy_eligible: Optional[bool] = None
        else:
            legacy_eligible = (
                isinstance(statement, str)
                and len(normalized_answer) == 1
                and normalized_answer in "ABCDE"
            )
        if selected:
            disposition = "answer_key_prediction_only; synthetic_rationale_removed"
        elif reasons and legacy_eligible:
            disposition = "excluded_from_training; legacy_template_eligible"
        elif reasons and legacy_eligible is None:
            disposition = "excluded_from_training; legacy_template_eligibility_unknown"
        elif reasons:
            disposition = "excluded_from_training"
        elif legacy_eligible:
            disposition = "valid_but_not_selected; legacy_template_eligible"
        elif legacy_eligible is None:
            disposition = "validity_unknown; legacy_template_eligibility_unknown"
        else:
            disposition = "valid_but_not_selected"
        entries.append(
            {
                "source_row": row_number,
                "source_row_id": (
                    record.get("question_id")
                    if not _is_unknown(record.get("question_id"))
                    and str(record.get("question_id")).strip()
                    else None
                ),
                "question_id": question_id,
                "validation_status": (
                    "accepted"
                    if row_number in accepted_rows
                    else "rejected"
                    if row_number in rejected_by_row
                    else "unknown"
                ),
                "validation_reasons": reasons,
                "legacy_template_eligible": legacy_eligible,
                "legacy_template_eligibility": (
                    "eligible"
                    if legacy_eligible is True
                    else "ineligible"
                    if legacy_eligible is False
                    else "unknown"
                ),
                "selected_for_training": selected,
                "historical_training_status": "unknown",
                "input_file_sha256": input_file_sha256,
                "disposition": disposition,
                "exclusion_reasons": reasons,
            }
        )
    return {
        "objective": "answer_key_prediction_only",
        "validation_rules_version": VALIDATION_RULES_VERSION,
        "input_file_sha256": input_file_sha256,
        "input_file_hash_status": (
            "available" if input_file_sha256 is not None else "unknown"
        ),
        "historical_training_status": "unknown",
        "historical_training_count": None,
        "raw_rows": len(raw_records),
        "valid_rows": len(accepted_records),
        "selected_rows": len(selected_records),
        "excluded_rows": len(report.get("excluded", [])),
        "legacy_template_eligible_rows": sum(
            item["legacy_template_eligible"] is True for item in entries
        ),
        "unknown_legacy_template_eligibility_rows": sum(
            item["legacy_template_eligible"] is None for item in entries
        ),
        "examples": entries,
    }


def build_answer_key_messages(record: Mapping[str, object]) -> list[dict[str, str]]:
    """Build an answer-key task example; never synthesize an explanation."""
    subject = record.get("subject")
    exam_name = record.get("exam_name")
    exam_year = record.get("exam_year")
    context = " ".join(
        str(value).strip()
        for value in (exam_name, exam_year)
        if value is not None and str(value).strip()
    )
    choices = "\n".join(
        f"({letter.upper()}) {record[f'alternative_{letter}'].strip()}"
        for letter in "abcde"
    )
    user_content = (
        f"Disciplina: {str(subject).strip() if subject else 'Conhecimentos Gerais'}\n"
        f"Exame: {context or 'Vestibular'}\n"
        "Selecione exclusivamente a letra do gabarito oficial. Não produza resolução "
        "ou justificativa, pois este conjunto contém apenas rótulos de resposta "
        "verificados.\n\n"
        f"{str(record['question_statement']).strip()}\n\n{choices}"
    )
    return [
        {
            "role": "system",
            "content": (
                "Tarefa: prever o rótulo do gabarito oficial. Responda somente com "
                "uma letra entre A e E; não invente explicações."
            ),
        },
        {"role": "user", "content": user_content},
        {"role": "assistant", "content": record["correct_answer"]},
    ]
