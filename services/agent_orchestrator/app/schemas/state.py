"""
Áquila Pro — Sovereign LangGraph Schemas
Pydantic v2 data models for agent state, claim-check artifacts, and Zero-Bypass HITL challenges.
"""
from __future__ import annotations
from typing import Annotated, Literal
from pydantic import BaseModel, Field
import operator

class ArtifactClaimCheck(BaseModel):
    """Claim-check reference for large binary files (video, audio, meshes, pdfs)."""
    artifact_id: str = Field(description="Unique identifier for the artifact")
    sha256_hash: str = Field(description="Cryptographic SHA-256 hash of the content")
    mime_type: str = Field(description="MIME type e.g. video/mp4, audio/wav")
    storage_path: str = Field(description="Relative local storage path under storage/blobs/")
    byte_size: int = Field(description="Size in bytes")

class PedagogicalObjective(BaseModel):
    """Sovereign educational goal aligned with BNCC and official Brazilian exams."""
    subject: str = Field(description="Subject: Fisica, Matematica, Biologia, etc.")
    topic: str = Field(description="Specific topic e.g. Eletrodinamica - Leis de Ohm")
    bncc_code: str = Field(default="EM13CNT308", description="BNCC skill code")
    target_tri_score: int = Field(default=650, description="Target TRI psychometric score (0-1000)")

class HITLChallenge(BaseModel):
    """Cryptographic challenge generated during interrupt() for human-in-the-loop approval."""
    run_id: str
    challenge_token: str = Field(description="sha256(run_id + artifact_hash + timestamp)")
    created_at_utc: str
    status: Literal["PENDING", "APPROVED", "REJECTED"] = "PENDING"
    approved_by_session_key: str | None = None
    audit_signature: str | None = None

class AgentOrchestrationState(BaseModel):
    """
    Sovereign state schema for LangGraph.
    Only lightweight telemetry and claim-check references are stored in checkpoints.
    """
    session_id: str
    objective: PedagogicalObjective
    current_step: str = "init"
    # Merges list of messages/logs via operator.add
    execution_logs: Annotated[list[str], operator.add] = Field(default_factory=list)
    # Claim-check references for generated artifacts
    artifacts: Annotated[list[ArtifactClaimCheck], operator.add] = Field(default_factory=list)
    # Active cryptographic HITL challenge
    active_challenge: HITLChallenge | None = None
    is_completed: bool = False
    validation_status: Literal["UNCHECKED", "VALIDATED", "FAILED"] = "UNCHECKED"
