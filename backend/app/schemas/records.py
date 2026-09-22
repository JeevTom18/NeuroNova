from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator

class CanonicalRecord(BaseModel):
    """Unified internal representation for all ingested records."""
    record_id: str
    source: str
    entity_type: str
    name: str = ""
    email: Optional[str] = None
    timestamp: Any = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    payload: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("timestamp", mode="before")
    @classmethod
    def serialize_timestamp(cls, v):
        if isinstance(v, datetime):
            return v.isoformat()
        return str(v)

class PipelineRunSummary(BaseModel):
    """Summary response for a completed or active pipeline run."""
    run_id: str
    status: str
    started_at: str
    completed_at: Optional[str] = None
    duration: float = 0.0
    duration_seconds: float = 0.0
    total_records: int = 0
    processed_records: int = 0
    duplicate_records: int = 0
    failed_records: int = 0
    s3_status: str = "SKIPPED"
    source_results: Dict[str, Any] = Field(default_factory=dict)

class SourceStatusSchema(BaseModel):
    """Operational health metrics for an ingestion source."""
    source_name: str
    status: str
    last_attempt: Optional[str] = None
    last_success: Optional[str] = None
    records_received: int = 0
    last_error: Optional[str] = None
