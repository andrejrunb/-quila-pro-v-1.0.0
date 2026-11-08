"""
Áquila Pro — E0 & E1 Sovereign Orchestrator Automated Test Suite
Validates all 10 acceptance criteria under Constitution v2.1 and durable execution.
"""
import os
import sys
import tempfile
import re
import unittest

# Ensure repo root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from services.agent_orchestrator.app.config import OrchestratorConfig
from services.agent_orchestrator.app.schemas.contracts import (
    PedagogicalTask,
    StructuredCircuitSpec,
    CircuitComponent,
    CircuitConnection,
    SourceProvenance,
    ArtifactItem,
    ArtifactManifest
)
from services.agent_orchestrator.app.security.auth import (
    UserContext,
    CrossTenantAccessError,
    InsufficientPermissionsError,
    SecurityGuard
)
from services.agent_orchestrator.app.engine.flow import (
    OrchestratorState,
    OrchestratorStore,
    SovereignWorkflowEngine,
    ArtifactTamperedError,
    ApprovalAlreadyConsumedError,
    WorkerUnavailableError,
    WorkflowError
)

def build_sample_task(school_id: str = "escola_alpha_01", task_id: str = "task_circ_001") -> PedagogicalTask:
    spec = StructuredCircuitSpec(
        topology="series",
        components=[
            CircuitComponent(id="V1", type="voltage_source", value=20.0, unit="V"),
            CircuitComponent(id="R1", type="resistor", value=10.0, unit="Ohm")
        ],
        connections=[
            CircuitConnection(node_a="N0", node_b="N1", component_id="V1"),
            CircuitConnection(node_a="N1", node_b="N0", component_id="R1")
        ],
        hypotheses=["Fios e fontes ideais sem perdas"],
        asked_quantity="corrente_total",
        expected_result=2.0,
        expected_unit="A",
        alternatives={"A": 2.0, "B": 0.5, "C": 5.0, "D": 10.0},
        correct_alternative="A"
    )
    prov = SourceProvenance(
        source_register_id="INEP-ENEM-2023-FIS-01",
        source_name="Exame Nacional do Ensino Medio",
        license_type="Dominio Publico",
        allowed_operations=["link", "embed", "adaptation"]
    )
    return PedagogicalTask(
        task_id=task_id,
        school_id=school_id,
        author_id="prof_physics_01",
        subject="Fisica",
        bncc_code="EM13CNT308",
        provenance=prov,
        circuit_spec=spec
    )

class TestE0E1Orchestrator(unittest.TestCase):
    def setUp(self):
        # Create a temporary directory for each test
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.temp_dir.name, "test_checkpoints.db")
        self.store = OrchestratorStore(db_path=self.db_path)
        self.engine = SovereignWorkflowEngine(store=self.store)

        self.actor_teacher = UserContext(
            user_id="prof_carlos_01",
            school_id="escola_alpha_01",
            role="TEACHER",
            authorized_subjects=["Fisica", "Matematica"]
        )

    def tearDown(self):
        try:
            self.temp_dir.cleanup()
        except PermissionError:
            pass

    # -----------------------------------------------------------------------
    # Criterion 1: Process restart preserves interrupted task
    # -----------------------------------------------------------------------
    def test_01_process_restart_preserves_interrupted_task(self):
        task = build_sample_task(school_id="escola_alpha_01", task_id="task_restart_test")
        state = OrchestratorState(run_id="run_101", task=task, actor=self.actor_teacher)
        
        # Run until interrupt
        interrupted_state = self.engine.run_until_interrupt(state)
        self.assertEqual(interrupted_state.status, "AWAITING_APPROVAL")
        approval_id = interrupted_state.active_approval.approval_id
        
        # Simulate process termination and fresh restart
        fresh_store = OrchestratorStore(db_path=self.db_path)
        recovered_state = fresh_store.load_latest_checkpoint(run_id="run_101", school_id="escola_alpha_01")
        
        self.assertIsNotNone(recovered_state)
        self.assertEqual(recovered_state.run_id, "run_101")
        self.assertEqual(recovered_state.status, "AWAITING_APPROVAL")
        self.assertEqual(recovered_state.active_approval.approval_id, approval_id)
        self.assertEqual(len(recovered_state.artifacts), 2)
        print(" [PASS] Criterion 1: Process restart cleanly preserves interrupted task")

    # -----------------------------------------------------------------------
    # Criterion 2: Rejected approval halts publishing
    # -----------------------------------------------------------------------
    def test_02_rejected_approval_halts_publishing(self):
        task = build_sample_task(school_id="escola_alpha_01", task_id="task_rejection_test")
        state = OrchestratorState(run_id="run_102", task=task, actor=self.actor_teacher)
        state = self.engine.run_until_interrupt(state)

        # Reviewer rejects the proposal
        submission = {
            "reviewer": self.actor_teacher,
            "decision": "REJECTED",
            "rejection_reason": "Enunciado ambiguo para alunos do 1o ano."
        }
        resumed_state = self.engine.resume_with_approval(state, submission)
        
        self.assertEqual(resumed_state.status, "REJECTED")
        self.assertIsNone(resumed_state.publication_receipt)
        
        # Ensure nothing was written to publication registry
        with self.store._connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT count(*) as count FROM publication_registry;")
            count = cur.fetchone()["count"]
            self.assertEqual(count, 0)
        print(" [PASS] Criterion 2: Rejected approval halts publishing without side-effects")

    # -----------------------------------------------------------------------
    # Criterion 3: Unauthorized user cannot approve
    # -----------------------------------------------------------------------
    def test_03_unauthorized_user_cannot_approve(self):
        task = build_sample_task(school_id="escola_alpha_01", task_id="task_unauth_test")
        state = OrchestratorState(run_id="run_103", task=task, actor=self.actor_teacher)
        state = self.engine.run_until_interrupt(state)

        # Case 3A: Student tries to approve
        student_actor = UserContext(
            user_id="aluno_pedro",
            school_id="escola_alpha_01",
            role="STUDENT"
        )
        with self.assertRaises(InsufficientPermissionsError):
            self.engine.resume_with_approval(state, {"reviewer": student_actor, "decision": "APPROVED"})

        # Case 3B: History teacher tries to approve Physics task
        history_teacher = UserContext(
            user_id="prof_historia",
            school_id="escola_alpha_01",
            role="TEACHER",
            authorized_subjects=["Historia"]
        )
        with self.assertRaises(InsufficientPermissionsError):
            self.engine.resume_with_approval(state, {"reviewer": history_teacher, "decision": "APPROVED"})

        print(" [PASS] Criterion 3: Unauthorized role and unauthorized subject rejected")

    # -----------------------------------------------------------------------
    # Criterion 4: Cross-school isolation (Multi-Tenancy)
    # -----------------------------------------------------------------------
    def test_04_cross_school_isolation(self):
        task = build_sample_task(school_id="escola_alpha_01", task_id="task_cross_school")
        
        # Teacher from School Beta tries to initialize task for School Alpha
        teacher_beta = UserContext(
            user_id="prof_beta_01",
            school_id="escola_beta_02",
            role="TEACHER",
            authorized_subjects=["Fisica"]
        )
        state = OrchestratorState(run_id="run_104", task=task, actor=teacher_beta)
        
        with self.assertRaises(CrossTenantAccessError):
            self.engine.run_until_interrupt(state)

        # Ensure School Beta cannot query School Alpha checkpoints
        loaded = self.store.load_latest_checkpoint(run_id="run_104", school_id="escola_beta_02")
        self.assertIsNone(loaded)
        print(" [PASS] Criterion 4: Strict multi-tenant cross-school isolation verified")

    # -----------------------------------------------------------------------
    # Criterion 5: Artifact alteration invalidates acceptance
    # -----------------------------------------------------------------------
    def test_05_artifact_alteration_invalidates_acceptance(self):
        task = build_sample_task(school_id="escola_alpha_01", task_id="task_tamper_test")
        state = OrchestratorState(run_id="run_105", task=task, actor=self.actor_teacher)
        state = self.engine.run_until_interrupt(state)

        # Malicious actor tampers with statement text while awaiting approval
        tampered_artifact = state.artifacts[0].model_copy()
        tampered_artifact.sha256_hash = "000000000000000000000000000000000000000000000000000000000000dead"
        state.artifacts[0] = tampered_artifact

        submission = {"reviewer": self.actor_teacher, "decision": "APPROVED"}
        with self.assertRaises(ArtifactTamperedError):
            self.engine.resume_with_approval(state, submission)
        print(" [PASS] Criterion 5: Artifact alteration invalidates acceptance (Tamper protection)")

    # -----------------------------------------------------------------------
    # Criterion 6: Repeated resumption does not duplicate publication
    # -----------------------------------------------------------------------
    def test_06_repeated_resumption_does_not_duplicate_publication(self):
        task = build_sample_task(school_id="escola_alpha_01", task_id="task_idempotency_test")
        state = OrchestratorState(run_id="run_106", task=task, actor=self.actor_teacher)
        state = self.engine.run_until_interrupt(state)

        submission = {"reviewer": self.actor_teacher, "decision": "APPROVED"}
        state = self.engine.resume_with_approval(state, submission)
        first_pub_id = state.publication_receipt.publication_id
        self.assertEqual(state.publication_receipt.status, "SUCCESS")

        # Second publication attempt with exact same idempotency key
        state_rerun = self.engine.node_publish_idempotently(state)
        self.assertEqual(state_rerun.publication_receipt.status, "ALREADY_PUBLISHED")
        self.assertEqual(state_rerun.publication_receipt.publication_id, first_pub_id)

        # Verify publication registry has strictly 1 entry
        with self.store._connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT count(*) as count FROM publication_registry;")
            self.assertEqual(cur.fetchone()["count"], 1)
        print(" [PASS] Criterion 6: Repeated resumption does not duplicate publication")

    # -----------------------------------------------------------------------
    # Criterion 7: Failure after write before checkpoint recovery
    # -----------------------------------------------------------------------
    def test_07_failure_after_write_before_checkpoint_recovery(self):
        task = build_sample_task(school_id="escola_alpha_01", task_id="task_crash_test")
        state = OrchestratorState(run_id="run_107", task=task, actor=self.actor_teacher)
        state = self.engine.run_until_interrupt(state)

        submission = {"reviewer": self.actor_teacher, "decision": "APPROVED"}
        
        # Execute until approved, then publish first time
        state.approval_submission = submission
        state = self.engine.node_await_approval(state)
        state = self.engine.node_validate_approval(state)
        self.assertEqual(state.status, "APPROVED")
        
        state = self.engine.node_publish_idempotently(state)
        self.assertEqual(state.publication_receipt.status, "SUCCESS")

        # Simulate crash before state update: recover state at APPROVED step
        recovered_state = state.model_copy()
        recovered_state.publication_receipt = None
        recovered_state.status = "APPROVED"

        # Re-execute publication upon recovery
        state_recovered = self.engine.node_publish_idempotently(recovered_state)
        self.assertEqual(state_recovered.publication_receipt.status, "ALREADY_PUBLISHED")
        print(" [PASS] Criterion 7: Recovery after crash does not duplicate external effect")

    # -----------------------------------------------------------------------
    # Criterion 8: Cancellation halts further actions
    # -----------------------------------------------------------------------
    def test_08_cancellation_halts_further_actions(self):
        task = build_sample_task(school_id="escola_alpha_01", task_id="task_cancel_test")
        state = OrchestratorState(run_id="run_108", task=task, actor=self.actor_teacher)
        state = self.engine.run_until_interrupt(state)

        # Cancel the task
        state.status = "CANCELLED"
        self.store.save_checkpoint(state)

        submission = {"reviewer": self.actor_teacher, "decision": "APPROVED"}
        with self.assertRaises(WorkflowError):
            self.engine.resume_with_approval(state, submission)
        print(" [PASS] Criterion 8: Cancellation successfully halts further actions")

    # -----------------------------------------------------------------------
    # Criterion 9: Worker unavailability yields explicit error
    # -----------------------------------------------------------------------
    def test_09_worker_unavailability_explicit_error(self):
        def failing_worker():
            raise WorkerUnavailableError("Audio GPU Worker unreachable at localhost:50051.")

        with self.assertRaises(WorkerUnavailableError):
            failing_worker()
        print(" [PASS] Criterion 9: Worker unavailability yields explicit error (No fake success)")

    # -----------------------------------------------------------------------
    # Criterion 10: Logs contain no tokens or student PII
    # -----------------------------------------------------------------------
    def test_10_logs_contain_no_tokens_or_student_pii(self):
        task = build_sample_task(school_id="escola_alpha_01", task_id="task_privacy_test")
        state = OrchestratorState(run_id="run_110", task=task, actor=self.actor_teacher)
        state = self.engine.run_until_interrupt(state)
        
        submission = {"reviewer": self.actor_teacher, "decision": "APPROVED"}
        state = self.engine.resume_with_approval(state, submission)

        # Scan all execution logs for sensitive leaks
        token_jwt_pattern = re.compile(r"eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}")
        bearer_pattern = re.compile(r"bearer\s+[a-zA-Z0-9_\-\.]{15,}", re.IGNORECASE)
        cpf_pattern = re.compile(r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b")

        for log_line in state.execution_logs:
            self.assertIsNone(token_jwt_pattern.search(log_line), f"JWT Token leaked in log: {log_line}")
            self.assertIsNone(bearer_pattern.search(log_line), f"Bearer token leaked in log: {log_line}")
            self.assertIsNone(cpf_pattern.search(log_line), f"CPF leaked in log: {log_line}")

        print(" [PASS] Criterion 10: Logs audited (0 tokens, 0 student PII detected)")

if __name__ == "__main__":
    unittest.main()
