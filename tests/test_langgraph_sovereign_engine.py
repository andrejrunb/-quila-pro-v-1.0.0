"""
Unit test for Áquila Pro Sovereign LangGraph State & Pipeline
"""
import sys
import os

# Add root directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.agent_orchestrator.app.schemas.state import (
    AgentOrchestrationState,
    PedagogicalObjective
)
from services.agent_orchestrator.app.graph import (
    parse_curriculum_node,
    verify_physics_laws_node,
    generate_multimedia_claim_check
)
from services.agent_orchestrator.app.compiler.opal_bridge import (
    OpalNode,
    OpalWorkflow,
    compile_opal_to_langgraph_spec
)

def test_sovereign_state_pipeline():
    state = AgentOrchestrationState(
        session_id="session_test_001",
        objective=PedagogicalObjective(
            subject="Fisica",
            topic="Eletrodinamica - Primeira Lei de Ohm",
            bncc_code="EM13CNT308",
            target_tri_score=680
        )
    )

    # Step 1: Parse curriculum
    res1 = parse_curriculum_node(state)
    state.current_step = res1["current_step"]
    state.execution_logs.extend(res1["execution_logs"])
    assert state.current_step == "curriculum_parsed"

    # Step 2: Deterministic Physics Verification
    res2 = verify_physics_laws_node(state)
    state.current_step = res2["current_step"]
    state.validation_status = res2["validation_status"]
    state.execution_logs.extend(res2["execution_logs"])
    assert state.validation_status == "VALIDATED"

    # Step 3: Multimedia Claim Check Generation & HITL Barrier
    res3 = generate_multimedia_claim_check(state)
    state.current_step = res3["current_step"]
    state.artifacts.extend(res3["artifacts"])
    state.active_challenge = res3["active_challenge"]
    state.execution_logs.extend(res3["execution_logs"])

    assert state.current_step == "awaiting_hitl_approval"
    assert len(state.artifacts) == 1
    assert state.active_challenge is not None
    assert state.active_challenge.status == "PENDING"
    assert len(state.active_challenge.challenge_token) == 64
    print(" Sovereign LangGraph pipeline test: PASSED (3/3 steps)")

def test_opal_compiler_bridge():
    nodes = [
        OpalNode("node_input", "search", {"query": "Ohm laws"}),
        OpalNode("node_val", "validator", {"rule": "deterministic_physics"}),
        OpalNode("node_hitl", "hitl", {"role": "teacher"})
    ]
    edges = [("node_input", "node_val"), ("node_val", "node_hitl")]
    wf = OpalWorkflow("opal_wf_test", nodes, edges)
    spec = compile_opal_to_langgraph_spec(wf)

    assert spec["workflow_id"] == "opal_wf_test"
    assert spec["has_hitl_barrier"] is True
    assert len(spec["nodes"]) == 3
    print(" Opal to LangGraph compiler test: PASSED")

if __name__ == "__main__":
    test_sovereign_state_pipeline()
    test_opal_compiler_bridge()
    print("All unit tests passed successfully!")
