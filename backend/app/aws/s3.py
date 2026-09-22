import asyncio
import json
import logging
from typing import List, Optional
from datetime import datetime, timezone
import boto3
from app.config import settings
from app.schemas.records import CanonicalRecord

logger = logging.getLogger(__name__)

class S3Service:
    """Handles object export to AWS S3. Boto3 calls run asynchronously in a thread executor."""

    @classmethod
    def is_configured(cls) -> bool:
        # Check against the settings instance
        b_name = getattr(settings, "s3_bucket_name", None)
        if b_name is None:
            b_name = getattr(settings, "S3_BUCKET_NAME", "")
        key_id = getattr(settings, "aws_access_key_id", None)
        if key_id is None:
            key_id = getattr(settings, "AWS_ACCESS_KEY_ID", "")
        secret = getattr(settings, "aws_secret_access_key", None)
        if secret is None:
            secret = getattr(settings, "AWS_SECRET_ACCESS_KEY", "")

        return bool(b_name and key_id and secret)

    @staticmethod
    def _sync_upload(data_json: str, bucket: str, key_name: str, region: str, key_id: str, secret: str) -> bool:
        s3_client = boto3.client(
            "s3",
            region_name=region or "us-east-1",
            aws_access_key_id=key_id or None,
            aws_secret_access_key=secret or None,
        )
        s3_client.put_object(
            Bucket=bucket,
            Key=key_name,
            Body=data_json.encode("utf-8"),
            ContentType="application/json"
        )
        return True

    async def upload_batch(self, records: List[CanonicalRecord], run_id: str) -> str:
        bucket = getattr(settings, "s3_bucket_name", None) or settings.S3_BUCKET_NAME
        region = getattr(settings, "aws_region", None) or settings.AWS_REGION
        key_id = getattr(settings, "aws_access_key_id", None) or settings.AWS_ACCESS_KEY_ID
        secret = getattr(settings, "aws_secret_access_key", None) or settings.AWS_SECRET_ACCESS_KEY

        timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        key_name = f"pipeline/{run_id}/{timestamp_str}.json"

        payload = {
            "run_id": run_id,
            "record_count": len(records),
            "records": [r.model_dump() if hasattr(r, "model_dump") else r.dict() for r in records]
        }
        json_data = json.dumps(payload, indent=2)

        await asyncio.to_thread(
            self._sync_upload,
            json_data,
            bucket,
            key_name,
            region,
            key_id,
            secret
        )
        return key_name

class S3StorageService(S3Service):
    @classmethod
    async def upload_records_batch(cls, run_id: str, records: List[CanonicalRecord]) -> str:
        if not cls.is_configured():
            logger.info("AWS S3 bucket or credentials not configured. Skipping S3 upload gracefully.")
            return "SKIPPED"
        try:
            service = S3Service()
            await service.upload_batch(records, run_id)
            return "UPLOADED"
        except Exception as e:
            logger.error(f"Failed to upload batch to S3: {str(e)}")
            return "FAILED"
