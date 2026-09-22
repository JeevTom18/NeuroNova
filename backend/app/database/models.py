from datetime import datetime, timezone
import json
from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from app.database.database import Base

def utc_now_iso():
    return datetime.now(timezone.utc).isoformat()

class RecordModel(Base):
    __tablename__ = "records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    record_id = Column(String(100), index=True, nullable=False)
    source = Column(String(50), index=True, nullable=False)
    entity_type = Column(String(50), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    timestamp = Column(String(50), nullable=False)
    payload_json = Column(Text, nullable=True)
    created_at = Column(String(50), default=utc_now_iso)

    def to_dict(self):
        return {
            "id": self.id,
            "record_id": self.record_id,
            "source": self.source,
            "entity_type": self.entity_type,
            "name": self.name,
            "email": self.email,
            "timestamp": self.timestamp,
            "payload": json.loads(self.payload_json) if self.payload_json else {},
            "created_at": self.created_at
        }

class PipelineRunModel(Base):
    __tablename__ = "pipeline_runs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    run_id = Column(String(50), unique=True, index=True, nullable=False)
    status = Column(String(30), nullable=False)  # SUCCESS, PARTIAL_SUCCESS, FAILED, RUNNING
    started_at = Column(String(50), nullable=False)
    completed_at = Column(String(50), nullable=True)
    duration = Column(Float, default=0.0)
    total_records = Column(Integer, default=0)
    processed_records = Column(Integer, default=0)
    duplicate_records = Column(Integer, default=0)
    failed_records = Column(Integer, default=0)
    s3_status = Column(String(30), default="SKIPPED")  # UPLOADED, SKIPPED, FAILED
    source_results_json = Column(Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "run_id": self.run_id,
            "status": self.status,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "duration": self.duration,
            "total_records": self.total_records,
            "processed_records": self.processed_records,
            "duplicate_records": self.duplicate_records,
            "failed_records": self.failed_records,
            "s3_status": self.s3_status,
            "source_results": json.loads(self.source_results_json) if self.source_results_json else {}
        }

class SourceStatusModel(Base):
    __tablename__ = "source_status"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source_name = Column(String(50), unique=True, index=True, nullable=False)
    status = Column(String(30), default="UNKNOWN")  # HEALTHY, DEGRADED, OFFLINE
    last_attempt = Column(String(50), nullable=True)
    last_success = Column(String(50), nullable=True)
    records_received = Column(Integer, default=0)
    last_error = Column(Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "source_name": self.source_name,
            "status": self.status,
            "last_attempt": self.last_attempt,
            "last_success": self.last_success,
            "records_received": self.records_received,
            "last_error": self.last_error
        }
