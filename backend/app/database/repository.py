import json
from typing import List, Optional, Dict, Any
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models import RecordModel, PipelineRunModel, SourceStatusModel
from app.schemas.records import CanonicalRecord

class Repository:
    """Async repository layer for database access."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def save_records(self, records: List[CanonicalRecord]) -> int:
        count = 0
        for rec in records:
            model = RecordModel(
                record_id=rec.record_id,
                source=rec.source,
                entity_type=rec.entity_type,
                name=rec.name,
                email=rec.email,
                timestamp=rec.timestamp,
                payload_json=json.dumps(rec.payload)
            )
            self.session.add(model)
            count += 1
        await self.session.commit()
        return count

    async def save_pipeline_run(self, run_data: Dict[str, Any]) -> PipelineRunModel:
        run = PipelineRunModel(
            run_id=run_data["run_id"],
            status=run_data["status"],
            started_at=run_data["started_at"],
            completed_at=run_data.get("completed_at"),
            duration=run_data.get("duration", 0.0),
            total_records=run_data.get("total_records", 0),
            processed_records=run_data.get("processed_records", 0),
            duplicate_records=run_data.get("duplicate_records", 0),
            failed_records=run_data.get("failed_records", 0),
            s3_status=run_data.get("s3_status", "SKIPPED"),
            source_results_json=json.dumps(run_data.get("source_results", {}))
        )
        self.session.add(run)
        await self.session.commit()
        await self.session.refresh(run)
        return run

    async def get_recent_runs(self, limit: int = 15) -> List[Dict[str, Any]]:
        stmt = select(PipelineRunModel).order_by(desc(PipelineRunModel.id)).limit(limit)
        res = await self.session.execute(stmt)
        runs = res.scalars().all()
        return [r.to_dict() for r in runs]

    async def update_source_status(
        self,
        source_name: str,
        status: str,
        timestamp: str,
        success: bool,
        records_count: int = 0,
        error_msg: Optional[str] = None
    ) -> SourceStatusModel:
        stmt = select(SourceStatusModel).where(SourceStatusModel.source_name == source_name)
        res = await self.session.execute(stmt)
        record = res.scalar_one_or_none()

        if not record:
            record = SourceStatusModel(source_name=source_name)
            self.session.add(record)

        record.status = status
        record.last_attempt = timestamp
        if success:
            record.last_success = timestamp
            record.records_received = (record.records_received or 0) + records_count
            record.last_error = None
        else:
            record.last_error = error_msg

        await self.session.commit()
        await self.session.refresh(record)
        return record

    async def get_all_source_statuses(self) -> List[Dict[str, Any]]:
        stmt = select(SourceStatusModel)
        res = await self.session.execute(stmt)
        rows = res.scalars().all()
        return [r.to_dict() for r in rows]

    async def get_records(
        self,
        source: Optional[str] = None,
        entity_type: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        stmt = select(RecordModel).order_by(desc(RecordModel.id))
        if source:
            stmt = stmt.where(RecordModel.source == source)
        if entity_type:
            stmt = stmt.where(RecordModel.entity_type == entity_type)
        stmt = stmt.limit(limit)
        res = await self.session.execute(stmt)
        records = res.scalars().all()
        return [r.to_dict() for r in records]
