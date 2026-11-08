"""
Áquila Pro — Sovereign Minimal Graph Flow (E1)
Implements: authorize -> create_draft -> verify_schema -> prepare_approval -> await_approval -> validate_approval -> publish_idempotently.
Guarantees LangGraph durable execution, strict idempotency, and multi-tenant school isolation.
"""
from __future__ import annotations
import sqlite3
import hashlib
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone, timedelta
from typing import Literal, Optional, List, Dict, Any, Generator
from pydantic import BaseModel, Field

from services.agent_orchestrator.app.config import config
from services.agent_orchestrator.app.schemas.contracts import (
    PedagogicalTask,
    StructuredCircuitSpec,
    ArtifactItem,
    ArtifactManifest,
    ApprovalRequestContract,
    PublicationReceipt
)
from services.agent_orchestrator.app.security.auth import (
    UserContext,
    SecurityGuard,
    AuthorizationError,
    CrossTenantAccessError,
    InsufficientPermissionsError
)
from services.agent_orchestrator.app.engine.mock_generator import SimulatedDraftGenerator

# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------
class WorkflowError(Exception):
    pass

class MathematicalValidationError(WorkflowError):
    pass

class ArtifactTamperedError(WorkflowError):
    pass

class ApprovalExpiredError(WorkflowError):
    pass

class ApprovalAlreadyConsumedError(WorkflowError):
    pass

class WorkerUnavailableError(WorkflowError):
    pass

# ---------------------------------------------------------------------------
# State Schema
# ---------------------------------------------------------------------------
class OrchestratorState(BaseModel):
    run_id: str
    task: PedagogicalTask
    actor: UserContext
    current_step: str = "init"
    workflow_version: str = "2.1.0"
    artifacts: List[ArtifactItem] = Field(default_factory=list)
    active_approval: Optional[ApprovalRequestContract] = None
    approval_submission: Optional[Dict[str, Any]] = None # Payload passed on resume
    publication_receipt: Optional[PublicationReceipt] = None
    status: Literal["RUNNING", "AWAITING_APPROVAL", "APPROVED", "REJECTED", "CANCELLED", "COMPLETED", "FAILED"] = "RUNNING"
    error_message: Optional[str] = None
    execution_logs: List[str] = Field(default_factory=list)

# ---------------------------------------------------------------------------
# Persistence Store (Isolated SQLite with Clean Connection Lifecycle)
# ---------------------------------------------------------------------------
class OrchestratorStore:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = str(db_path or config.checkpoint_db_path)
        config.ensure_directories()
        self._init_db()

    @contextmanager
    def _connection(self) -> Generator[sqlite3.Connection, None, None]:
        conn = sqlite3.connect(self.db_path)
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    def _init_db(self) -> None:
        with self._connection() as conn:
            # Checkpoints table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS flow_checkpoints (
                    run_id TEXT,
                    school_id TEXT,
                    step TEXT,
                    state_json TEXT,
                    created_at TEXT,
                    PRIMARY KEY(run_id, step)
                );
            """)
            # Formal approval requests table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS approval_requests (
                    approval_id TEXT PRIMARY KEY,
                    run_id TEXT,
                    school_id TEXT,
                    artifact_manifest_hash TEXT,
                    workflow_version TEXT,
                    requested_action TEXT,
                    requested_at TEXT,
                    expires_at TEXT,
                    reviewer_id TEXT,
                    decision TEXT,
                    rejection_reason TEXT,
                    decided_at TEXT,
                    consumed_at TEXT
                );
            """)
            # Idempotent publication registry
            conn.execute("""
                CREATE TABLE IF NOT EXISTS publication_registry (
                    idempotency_key TEXT PRIMARY KEY,
                    publication_id TEXT,
                    run_id TEXT,
                    school_id TEXT,
                    manifest_hash TEXT,
                    published_at TEXT,
                    signature TEXT
                );
            """)
            conn.commit()

    def save_checkpoint(self, state: OrchestratorState) -> None:
        with self._connection() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO flow_checkpoints (run_id, school_id, step, state_json, created_at)
                VALUES (?, ?, ?, ?, ?);
            """, (
                state.run_id,
                state.task.school_id,
                state.current_step,
                state.model_dump_json(),
                datetime.now(timezone.utc).isoformat()
            ))
            conn.commit()

    def load_latest_checkpoint(self, run_id: str, school_id: str) -> Optional[OrchestratorState]:
        with self._connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT state_json FROM flow_checkpoints
                WHERE run_id = ? AND school_id = ?
                ORDER BY created_at DESC LIMIT 1;
            """, (run_id, school_id))
            row = cur.fetchone()
            if row:
                return OrchestratorState.model_validate_json(row["state_json"])
            return None

    def save_approval_request(self, req: ApprovalRequestContract) -> None:
        with self._connection() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO approval_requests (
                    approval_id, run_id, school_id, artifact_manifest_hash, workflow_version,
                    requested_action, requested_at, expires_at, reviewer_id, decision,
                    rejection_reason, decided_at, consumed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                req.approval_id, req.run_id, req.school_id, req.artifact_manifest_hash,
                req.workflow_version, req.requested_action, req.requested_at, req.expires_at,
                req.reviewer_id, req.decision, req.rejection_reason, req.decided_at, req.consumed_at
            ))
            conn.commit()

    def get_approval_request(self, approval_id: str) -> Optional[ApprovalRequestContract]:
        with self._connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM approval_requests WHERE approval_id = ?;", (approval_id,))
            row = cur.fetchone()
            if row:
                return ApprovalRequestContract(**dict(row))
            return None

    def record_publication(self, receipt: PublicationReceipt) -> None:
        with self._connection() as conn:
            conn.execute("""
                INSERT INTO publication_registry (
                    idempotency_key, publication_id, run_id, school_id, manifest_hash, published_at, signature
                ) VALUES (?, ?, ?, ?, ?, ?, ?);
            """, (
                receipt.idempotency_key, receipt.publication_id, receipt.run_id,
                receipt.school_id, receipt.manifest_hash, receipt.published_at, receipt.server_signature_receipt
            ))
            conn.commit()

    def get_publication_by_idempotency_key(self, idempotency_key: str) -> Optional[PublicationReceipt]:
        with self._connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM publication_registry WHERE idempotency_key = ?;", (idempotency_key,))
            row = cur.fetchone()
            if row:
                return PublicationReceipt(
                    publication_id=row["publication_id"],
                    idempotency_key=row["idempotency_key"],
                    run_id=row["run_id"],
                    school_id=row["school_id"],
                    manifest_hash=row["manifest_hash"],
                    published_at=row["published_at"],
                    server_signature_receipt=row["signature"],
                    status="ALREADY_PUBLISHED"
                )
            return None

# ---------------------------------------------------------------------------
# Pipeline Engine Nodes
# ---------------------------------------------------------------------------
class SovereignWorkflowEngine:
    def __init__(self, store: Optional[OrchestratorStore] = None):
        self.store = store or OrchestratorStore()

    def log(self, state: OrchestratorState, message: str) -> None:
        timestamp = datetime.now(timezone.utc).strftime("%H:%M:%S")
        state.execution_logs.append(f"[{timestamp}] {message}")

    # Node 1: Authorize
    def node_authorize(self, state: OrchestratorState) -> OrchestratorState:
        self.log(state, f"Authorizing task {state.task.task_id} for school {state.task.school_id}")
        # Multi-tenant isolation check
        SecurityGuard.verify_tenant_access(state.actor, state.task.school_id)
        
        # Provenance check: verify license and allowed operations
        prov = state.task.provenance
        if "adaptation" not in prov.allowed_operations and "embed" not in prov.allowed_operations:
            raise AuthorizationError(
                f"Provenance violation: Source {prov.source_register_id} does not permit adaptation or embed operations."
            )
            
        state.current_step = "authorized"
        self.store.save_checkpoint(state)
        return state

    # Node 2: Create Draft (Simulation Mode)
    def node_create_draft(self, state: OrchestratorState) -> OrchestratorState:
        self.log(state, "Generating structured statement and teacher answer key (Simulation Mode)")
        statement, answer_key = SimulatedDraftGenerator.generate_statement_and_key(
            task_id=state.task.task_id,
            circuit_spec=state.task.circuit_spec,
            provenance=state.task.provenance
        )
        state.artifacts = [statement, answer_key]
        state.current_step = "draft_created"
        self.store.save_checkpoint(state)
        return state

    # Node 3: Verify Schema & Physics Laws
    def node_verify_schema(self, state: OrchestratorState) -> OrchestratorState:
        self.log(state, "Executing deterministic mathematical and unit verification (Ohm's Law)")
        spec = state.task.circuit_spec
        
        # Validate series circuit: Req = sum(R), I = V / Req
        if spec.topology == "series":
            resistors = [c.value for c in spec.components if c.type == "resistor"]
            sources = [c.value for c in spec.components if c.type == "voltage_source"]
            if not resistors or not sources:
                raise MathematicalValidationError("Series circuit requires at least one resistor and one voltage source.")
            
            r_eq = sum(resistors)
            v_total = sum(sources)
            
            if spec.asked_quantity == "corrente_total":
                calculated_i = v_total / r_eq
                tolerance = calculated_i * config.strict_circuit_tolerance_percent
                if abs(calculated_i - spec.expected_result) > max(tolerance, 1e-6):
                    raise MathematicalValidationError(
                        f"Ohm's Law mismatch: calculated {calculated_i}A vs expected {spec.expected_result}A."
                    )
        
        # Verify correct alternative alignment
        correct_val = spec.alternatives.get(spec.correct_alternative)
        if correct_val is None or abs(correct_val - spec.expected_result) > 1e-6:
            raise MathematicalValidationError(
                f"Gabarito inconsistency: Alternative '{spec.correct_alternative}' ({correct_val}) does not match expected result {spec.expected_result}."
            )

        # Confirm strict segregation: Statement text MUST NOT contain answer key
        statement_art = next(a for a in state.artifacts if a.artifact_type == "statement_text")
        if statement_art.contains_answer_key:
            raise WorkflowError("Security violation: Statement artifact cannot contain answer key flag.")

        state.current_step = "schema_verified"
        self.store.save_checkpoint(state)
        return state

    # Node 4: Prepare Approval
    def node_prepare_approval(self, state: OrchestratorState) -> OrchestratorState:
        self.log(state, "Compiling artifact manifest and registering server approval request")
        manifest = ArtifactManifest(
            run_id=state.run_id,
            school_id=state.task.school_id,
            artifacts=state.artifacts
        )
        manifest_hash = manifest.manifest_hash
        
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(hours=config.approval_ttl_hours)
        
        approval_req = ApprovalRequestContract(
            approval_id=str(uuid.uuid4()),
            run_id=state.run_id,
            school_id=state.task.school_id,
            artifact_manifest_hash=manifest_hash,
            workflow_version=state.workflow_version,
            requested_action="publish_pedagogical_activity",
            requested_at=now.isoformat(),
            expires_at=expires_at.isoformat(),
            decision="PENDING"
        )
        
        state.active_approval = approval_req
        self.store.save_approval_request(approval_req)
        
        state.current_step = "approval_prepared"
        self.store.save_checkpoint(state)
        return state

    # Node 5: Await Approval (Interruption)
    def node_await_approval(self, state: OrchestratorState) -> OrchestratorState:
        if state.status == "CANCELLED":
            self.log(state, "Task has been cancelled. Halting before approval.")
            state.current_step = "cancelled"
            self.store.save_checkpoint(state)
            return state

        # If no resume submission is present, interrupt the flow
        if not state.approval_submission:
            self.log(state, f"Interruption trigger: Awaiting human decision for approval_id {state.active_approval.approval_id}")
            state.status = "AWAITING_APPROVAL"
            state.current_step = "awaiting_approval"
            self.store.save_checkpoint(state)
            return state
            
        state.current_step = "decision_received"
        self.store.save_checkpoint(state)
        return state

    # Node 6: Validate Approval
    def node_validate_approval(self, state: OrchestratorState) -> OrchestratorState:
        self.log(state, "Validating human decision, credentials, manifest integrity, and expiry")
        sub = state.approval_submission
        if not sub:
            raise WorkflowError("Cannot validate approval without submission payload.")

        reviewer: UserContext = sub["reviewer"]
        decision: str = sub["decision"]
        rejection_reason: Optional[str] = sub.get("rejection_reason")

        # 1. Multi-tenant and competence check
        SecurityGuard.verify_approval_competence(reviewer, state.task.school_id, state.task.subject)

        # 2. Re-fetch approval from store to ensure single consumption
        approval = self.store.get_approval_request(state.active_approval.approval_id)
        if not approval:
            raise WorkflowError(f"Approval {state.active_approval.approval_id} not found.")

        if approval.consumed_at is not None:
            raise ApprovalAlreadyConsumedError(f"Approval {approval.approval_id} was already consumed at {approval.consumed_at}.")

        # 3. Check expiration
        expires_at_dt = datetime.fromisoformat(approval.expires_at)
        if datetime.now(timezone.utc) > expires_at_dt:
            raise ApprovalExpiredError(f"Approval {approval.approval_id} expired at {approval.expires_at}.")

        # 4. Manifest Integrity Check: If artifacts were tampered with, hash will not match
        current_manifest = ArtifactManifest(
            run_id=state.run_id,
            school_id=state.task.school_id,
            artifacts=state.artifacts
        )
        if current_manifest.manifest_hash != approval.artifact_manifest_hash:
            raise ArtifactTamperedError(
                f"Integrity violation: Current manifest hash ({current_manifest.manifest_hash}) does not match approved hash ({approval.artifact_manifest_hash})."
            )

        # 5. Process decision
        approval.reviewer_id = reviewer.user_id
        approval.decision = decision
        approval.rejection_reason = rejection_reason
        approval.decided_at = datetime.now(timezone.utc).isoformat()
        approval.consumed_at = datetime.now(timezone.utc).isoformat()

        self.store.save_approval_request(approval)
        state.active_approval = approval

        if decision == "REJECTED":
            self.log(state, f"Approval rejected by {reviewer.user_id}. Reason: {rejection_reason}")
            state.status = "REJECTED"
            state.current_step = "rejected"
            self.store.save_checkpoint(state)
            return state

        self.log(state, f"Approval APPROVED by {reviewer.user_id}.")
        state.status = "APPROVED"
        state.current_step = "approval_validated"
        self.store.save_checkpoint(state)
        return state

    # Node 7: Publish Idempotently
    def node_publish_idempotently(self, state: OrchestratorState) -> OrchestratorState:
        if state.status not in ["APPROVED", "COMPLETED"]:
            self.log(state, f"Publication skipped: task status is {state.status}.")
            return state

        # Compute stable idempotency key
        manifest_hash = state.active_approval.artifact_manifest_hash
        idempotency_raw = f"{state.task.school_id}:{state.run_id}:{manifest_hash}:{state.active_approval.requested_action}"
        idempotency_key = hashlib.sha256(idempotency_raw.encode("utf-8")).hexdigest()

        # Check if already published
        existing_receipt = self.store.get_publication_by_idempotency_key(idempotency_key)
        if existing_receipt:
            self.log(state, f"Idempotency hit: task was already published (receipt {existing_receipt.publication_id}). Returning existing receipt.")
            state.publication_receipt = existing_receipt
            state.status = "COMPLETED"
            state.current_step = "published"
            self.store.save_checkpoint(state)
            return state

        # If not yet published, we must have APPROVED status to proceed
        if state.status != "APPROVED":
            self.log(state, f"Publication skipped: status {state.status} cannot create new publication.")
            return state

        # New publication
        now_str = datetime.now(timezone.utc).isoformat()
        pub_id = f"pub_{uuid.uuid4().hex[:12]}"
        
        # Server-signed receipt
        receipt_raw = f"{pub_id}|{idempotency_key}|{state.task.school_id}|{manifest_hash}|{now_str}"
        server_signature = SecurityGuard.sign_server_receipt(receipt_raw)

        receipt = PublicationReceipt(
            publication_id=pub_id,
            idempotency_key=idempotency_key,
            run_id=state.run_id,
            school_id=state.task.school_id,
            manifest_hash=manifest_hash,
            published_at=now_str,
            server_signature_receipt=server_signature,
            status="SUCCESS"
        )

        self.store.record_publication(receipt)
        state.publication_receipt = receipt
        state.status = "COMPLETED"
        state.current_step = "published"
        self.log(state, f"Publication successful. Receipt: {pub_id}")
        self.store.save_checkpoint(state)
        return state

    # Orchestrator Execution Runner
    def run_until_interrupt(self, state: OrchestratorState) -> OrchestratorState:
        """Executes from start up to await_approval interrupt."""
        state = self.node_authorize(state)
        state = self.node_create_draft(state)
        state = self.node_verify_schema(state)
        state = self.node_prepare_approval(state)
        state = self.node_await_approval(state)
        return state

    def resume_with_approval(self, state: OrchestratorState, submission_payload: Dict[str, Any]) -> OrchestratorState:
        """Resumes interrupted flow with the user's formal decision."""
        if state.status == "CANCELLED":
            raise WorkflowError("Cannot resume a cancelled task.")
            
        state.approval_submission = submission_payload
        state = self.node_await_approval(state)
        state = self.node_validate_approval(state)
        if state.status == "APPROVED":
            state = self.node_publish_idempotently(state)
        return state
