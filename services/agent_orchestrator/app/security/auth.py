"""
Áquila Pro — Multi-Tenant Security & Zero-Bypass Authorization
Enforces strict school tenant boundaries, role verification, and server-side receipt signatures.
"""
from __future__ import annotations
import hmac
import hashlib
from typing import Literal
from pydantic import BaseModel
from services.agent_orchestrator.app.config import config

class UserContext(BaseModel):
    user_id: str
    school_id: str
    role: Literal["TEACHER", "COORDINATOR", "ADMIN", "SECRETARY", "STUDENT", "PARENT"]
    authorized_subjects: list[str] = []

class AuthorizationError(Exception):
    """Raised when an operation violates multi-tenancy, RBAC, or subject competence."""
    pass

class CrossTenantAccessError(AuthorizationError):
    """Raised when an actor from one school attempts to access another school's data."""
    pass

class InsufficientPermissionsError(AuthorizationError):
    """Raised when an actor lacks the necessary role or subject competence."""
    pass

class SecurityGuard:
    @staticmethod
    def verify_tenant_access(actor: UserContext, target_school_id: str) -> None:
        """Enforces that an actor cannot view, query, or mutate workflows of another school."""
        if actor.school_id != target_school_id:
            raise CrossTenantAccessError(
                f"Multi-tenant violation: User '{actor.user_id}' belonging to school '{actor.school_id}' "
                f"attempted to access resources of school '{target_school_id}'."
            )

    @staticmethod
    def verify_approval_competence(actor: UserContext, target_school_id: str, required_subject: str) -> None:
        """
        Validates that:
        1. Actor belongs to the target school.
        2. Actor has approval role (TEACHER, COORDINATOR, or ADMIN).
        3. If TEACHER, has registered pedagogical competence for the specific subject.
        """
        SecurityGuard.verify_tenant_access(actor, target_school_id)
        
        if actor.role not in ["TEACHER", "COORDINATOR", "ADMIN"]:
            raise InsufficientPermissionsError(
                f"Role violation: User role '{actor.role}' is not authorized to approve pedagogical materials."
            )
            
        if actor.role == "TEACHER" and required_subject not in actor.authorized_subjects:
            raise InsufficientPermissionsError(
                f"Subject competence violation: Teacher '{actor.user_id}' is not authorized for subject '{required_subject}'. "
                f"Authorized subjects: {actor.authorized_subjects}"
            )

    @staticmethod
    def sign_server_receipt(receipt_data: str) -> str:
        """
        Generates server-side HMAC-SHA256 signature for publication receipts.
        Key is held exclusively on the server, never exposed to Electron renderer.
        """
        key = config.server_hmac_secret.encode("utf-8")
        msg = receipt_data.encode("utf-8")
        return hmac.new(key, msg, hashlib.sha256).hexdigest()

    @staticmethod
    def verify_server_receipt(receipt_data: str, signature: str) -> bool:
        """Verifies integrity of a server-issued publication receipt."""
        expected = SecurityGuard.sign_server_receipt(receipt_data)
        return hmac.compare_digest(expected, signature)
