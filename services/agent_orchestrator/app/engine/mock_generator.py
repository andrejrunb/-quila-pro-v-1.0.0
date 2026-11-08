"""
Áquila Pro — Simulated Draft Generator (Simulation Mode)
Deterministic pedagogical generator for E0/E1 testing.
Zero external cloud or GPU dependency. Strictly segregates Statement Text from Answer Key.
"""
from __future__ import annotations
import hashlib
import json
from services.agent_orchestrator.app.schemas.contracts import (
    StructuredCircuitSpec,
    SourceProvenance,
    ArtifactItem
)

class SimulatedDraftGenerator:
    """
    SIMULATION ONLY — Used for E0/E1 pipeline validation without external LLMs or GPUs.
    Outputs structured pedagogical texts based on deterministic circuit specs.
    """
    
    @staticmethod
    def generate_statement_and_key(
        task_id: str,
        circuit_spec: StructuredCircuitSpec,
        provenance: SourceProvenance
    ) -> tuple[ArtifactItem, ArtifactItem]:
        """
        Generates two distinct artifacts:
        1. Statement Text: student-facing, NO answer key or correct alternative.
        2. Answer Key: teacher-facing only, contains step-by-step resolution and correct letter.
        """
        # 1. Statement Text
        statement_content = (
            f"[SIMULATED-DRAFT] Atividade de Fixação — Circuitos Elétricos\n"
            f"Origem: {provenance.source_name} (Registro: {provenance.source_register_id})\n"
            f"Configuração: Circuito em {circuit_spec.topology.upper()}.\n\n"
            f"Considere um circuito contendo os seguintes componentes:\n"
        )
        for comp in circuit_spec.components:
            statement_content += f"- {comp.id}: {comp.value} {comp.unit} ({comp.type})\n"
            
        statement_content += (
            f"\nHipóteses adotadas: {', '.join(circuit_spec.hypotheses) if circuit_spec.hypotheses else 'Fios e fontes ideais'}.\n"
            f"Determine o valor de: {circuit_spec.asked_quantity}.\n\n"
            f"Alternativas:\n"
        )
        for letter, val in sorted(circuit_spec.alternatives.items()):
            statement_content += f"({letter}) {val} {circuit_spec.expected_unit}\n"

        statement_bytes = statement_content.encode("utf-8")
        statement_hash = hashlib.sha256(statement_bytes).hexdigest()
        
        statement_artifact = ArtifactItem(
            artifact_id=f"{task_id}_statement",
            artifact_type="statement_text",
            sha256_hash=statement_hash,
            storage_path=f"storage/blobs/{statement_hash}.txt",
            byte_size=len(statement_bytes),
            is_student_facing=True,
            contains_answer_key=False
        )

        # 2. Answer Key (Teacher Facing ONLY)
        answer_key_content = (
            f"[SIMULATED-GABARITO] Resolução Comentada — Tarefa {task_id}\n"
            f"Alternativa Correta: ({circuit_spec.correct_alternative})\n"
            f"Valor Calculado: {circuit_spec.expected_result} {circuit_spec.expected_unit}\n"
            f"Justificativa Física: Aplicação da Primeira Lei de Ohm (V = R * I).\n"
        )
        answer_bytes = answer_key_content.encode("utf-8")
        answer_hash = hashlib.sha256(answer_bytes).hexdigest()

        answer_key_artifact = ArtifactItem(
            artifact_id=f"{task_id}_answer_key",
            artifact_type="answer_key",
            sha256_hash=answer_hash,
            storage_path=f"storage/blobs/{answer_hash}.txt",
            byte_size=len(answer_bytes),
            is_student_facing=False,
            contains_answer_key=True
        )

        return statement_artifact, answer_key_artifact
