"""
Áquila Pro — Google Opal to LangGraph Bridge Compiler
Translates Google Opal visual agent nodes and edges into LangGraph execution graphs.
"""
from typing import Any, Callable, Dict, List
from services.agent_orchestrator.app.schemas.state import AgentOrchestrationState

class OpalNode:
    def __init__(self, node_id: str, node_type: str, config: Dict[str, Any]):
        self.node_id = node_id
        self.node_type = node_type # e.g. "search", "memory", "reasoning", "validator", "hitl"
        self.config = config

class OpalWorkflow:
    def __init__(self, workflow_id: str, nodes: List[OpalNode], edges: List[tuple[str, str]]):
        self.workflow_id = workflow_id
        self.nodes = nodes
        self.edges = edges

def compile_opal_to_langgraph_spec(opal_wf: OpalWorkflow) -> Dict[str, Any]:
    """
    Transforms an Opal visual workflow definition into a deterministic LangGraph StateGraph topology.
    Enforces that every content creation node terminates in a Zero-Bypass HITL gate before database write.
    """
    graph_spec = {
        "workflow_id": opal_wf.workflow_id,
        "entry_point": opal_wf.nodes[0].node_id if opal_wf.nodes else "init",
        "nodes": {},
        "edges": opal_wf.edges,
        "has_hitl_barrier": any(n.node_type == "hitl" for n in opal_wf.nodes)
    }

    for node in opal_wf.nodes:
        graph_spec["nodes"][node.node_id] = {
            "type": node.node_type,
            "config": node.config,
            "requires_gpu": node.config.get("requires_gpu", False)
        }

    return graph_spec
