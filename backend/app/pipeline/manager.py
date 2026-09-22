import asyncio
import time
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.ingestion.customer_source import CustomerSource
from app.ingestion.product_source import ProductSource
from app.ingestion.transaction_source import TransactionSource
from app.processing.normalizer import Normalizer
from app.processing.validator import Validator
from app.processing.deduplicator import Deduplicator
from app.database.repository import Repository
from app.aws.s3 import S3StorageService
from app.schemas.records import CanonicalRecord, PipelineRunSummary

logger = logging.getLogger(__name__)

class PipelineManager:
    """Orchestrates concurrent ingestion, processing pipeline, and persistence."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = Repository(session)
        self.customer_source = CustomerSource()
        self.product_source = ProductSource()
        self.transaction_source = TransactionSource()

    async def execute_pipeline(self, simulated_failure_source: Optional[str] = None) -> PipelineRunSummary:
        run_id = f"run_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
        start_time = time.time()
        start_iso = datetime.now(timezone.utc).isoformat()

        logger.info(f"Starting pipeline run {run_id} (simulated_failure: {simulated_failure_source})")

        # 1. Concurrent Ingestion via asyncio.gather(..., return_exceptions=True)
        tasks = [
            self.customer_source.fetch(simulate_failure=(simulated_failure_source == "customer")),
            self.product_source.fetch(simulate_failure=(simulated_failure_source == "product")),
            self.transaction_source.fetch(simulate_failure=(simulated_failure_source == "transaction")),
        ]

        raw_results = await asyncio.gather(*tasks, return_exceptions=True)

        sources_info = [
            ("customer_source", "customer", raw_results[0]),
            ("product_source", "product", raw_results[1]),
            ("transaction_source", "transaction", raw_results[2]),
        ]

        source_results: Dict[str, Any] = {}
        healthy_sources = 0
        failed_sources = 0
        combined_raw_records: List[tuple] = []  # (dict, source_name, entity_type)

        now_iso = datetime.now(timezone.utc).isoformat()

        for source_name, entity_type, res in sources_info:
            if isinstance(res, Exception):
                failed_sources += 1
                err_msg = str(res)
                logger.warning(f"Source {source_name} failed: {err_msg}")
                source_results[source_name] = {
                    "status": "FAILED",
                    "error": err_msg,
                    "records_count": 0
                }
                await self.repo.update_source_status(
                    source_name=source_name,
                    status="OFFLINE",
                    timestamp=now_iso,
                    success=False,
                    error_msg=err_msg
                )
            else:
                healthy_sources += 1
                records_list = res if isinstance(res, list) else []
                source_results[source_name] = {
                    "status": "SUCCESS",
                    "records_count": len(records_list)
                }
                await self.repo.update_source_status(
                    source_name=source_name,
                    status="HEALTHY",
                    timestamp=now_iso,
                    success=True,
                    records_count=len(records_list)
                )
                for rec in records_list:
                    combined_raw_records.append((rec, source_name, entity_type))

        total_raw = len(combined_raw_records)

        # 2. Normalization
        normalized_records: List[CanonicalRecord] = []
        normalization_errors = 0
        for rec, sname, etype in combined_raw_records:
            canonical = Normalizer.normalize(rec, sname, etype)
            if canonical:
                normalized_records.append(canonical)
            else:
                normalization_errors += 1

        # 3. Validation
        valid_records: List[CanonicalRecord] = []
        validation_errors = 0
        for can_rec in normalized_records:
            is_valid, _ = Validator.validate(can_rec)
            if is_valid:
                valid_records.append(can_rec)
            else:
                validation_errors += 1

        # 4. Deduplication
        dedup = Deduplicator()
        unique_records = dedup.deduplicate(valid_records)
        _, duplicate_count = dedup.merge_metrics(len(valid_records))

        # 5. Persistence into SQLite
        persisted_count = 0
        if unique_records:
            persisted_count = await self.repo.save_records(unique_records)

        # 6. S3 Batch Export
        s3_status = await S3StorageService.upload_records_batch(run_id, unique_records)

        duration = round(time.time() - start_time, 3)
        completed_iso = datetime.now(timezone.utc).isoformat()

        # Compute Pipeline Status
        if healthy_sources == 3 and normalization_errors == 0:
            pipeline_status = "SUCCESS"
        elif healthy_sources > 0:
            pipeline_status = "PARTIAL_SUCCESS"
        else:
            pipeline_status = "FAILED"

        total_failed_records = normalization_errors + validation_errors

        run_summary_data = {
            "run_id": run_id,
            "status": pipeline_status,
            "started_at": start_iso,
            "completed_at": completed_iso,
            "duration": duration,
            "total_records": total_raw,
            "processed_records": persisted_count,
            "duplicate_records": duplicate_count,
            "failed_records": total_failed_records,
            "s3_status": s3_status,
            "source_results": source_results
        }

        await self.repo.save_pipeline_run(run_summary_data)
        logger.info(f"Pipeline run {run_id} finished with status {pipeline_status} in {duration}s")

        return PipelineRunSummary(**run_summary_data)
