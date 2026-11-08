"""
Áquila Pro — Orchestrator Configuration
Environment-aware settings supporting local dev, school edge servers, and CI testing.
"""
from __future__ import annotations
import os
from pathlib import Path
from typing import Literal
from pydantic import BaseModel, Field

class OrchestratorConfig(BaseModel):
    env: Literal["development", "production", "test"] = Field(default="development")
    
    # Base paths
    base_dir: Path = Field(default_factory=lambda: Path(os.environ.get("AQUILA_HOME", "c:/aquila")).resolve())
    storage_blobs_dir: Path = Field(default_factory=lambda: Path(os.environ.get("AQUILA_STORAGE_BLOBS", "c:/aquila/storage/blobs")).resolve())
    
    # Isolated checkpoint database (never inside production aquila.db)
    checkpoint_db_path: Path = Field(
        default_factory=lambda: Path(
            os.environ.get(
                "AQUILA_ORCHESTRATOR_DB",
                os.path.join(
                    os.environ.get("LOCALAPPDATA", "c:/aquila/userData"),
                    "AquilaPro",
                    "orchestrator",
                    "orchestrator_checkpoints.db"
                )
            )
        ).resolve()
    )
    
    # Publication & Security
    server_hmac_secret: str = Field(default_factory=lambda: os.environ.get("AQUILA_SERVER_HMAC_SECRET", "sovereign_edge_master_key_2026_dev_only"))
    service_account_user: str = Field(default_factory=lambda: os.environ.get("AQUILA_SERVICE_ACCOUNT", "aquila_edge_daemon"))
    approval_ttl_hours: int = Field(default=24)
    strict_circuit_tolerance_percent: float = Field(default=0.01) # 1% numeric tolerance

    def ensure_directories(self) -> None:
        """Creates storage and database directories with proper permissions."""
        self.storage_blobs_dir.mkdir(parents=True, exist_ok=True)
        self.checkpoint_db_path.parent.mkdir(parents=True, exist_ok=True)

# Global default config singleton
config = OrchestratorConfig()
