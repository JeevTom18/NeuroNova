"""Tests for S3Service — mocked boto3 uploads and graceful fallback."""

from unittest.mock import MagicMock, patch

import pytest

from app.aws.s3 import S3Service


class TestS3Configured:
    """Test configuration detection without hitting real AWS."""

    @pytest.mark.asyncio
    async def test_is_configured_returns_true(self):
        with patch("app.aws.s3.settings") as mock_settings:
            mock_settings.s3_bucket_name = "my-bucket"
            mock_settings.aws_access_key_id = "AKIA1234567890"
            mock_settings.aws_secret_access_key = "secret"
            assert S3Service.is_configured() is True

    @pytest.mark.asyncio
    async def test_is_not_configured_without_bucket(self):
        with patch("app.aws.s3.settings") as mock_settings:
            mock_settings.s3_bucket_name = ""
            mock_settings.aws_access_key_id = "AKIA1234567890"
            mock_settings.aws_secret_access_key = "secret"
            assert S3Service.is_configured() is False

    @pytest.mark.asyncio
    async def test_is_not_configured_without_credentials(self):
        with patch("app.aws.s3.settings") as mock_settings:
            mock_settings.s3_bucket_name = "my-bucket"
            mock_settings.aws_access_key_id = ""
            mock_settings.aws_secret_access_key = ""
            assert S3Service.is_configured() is False


class TestS3UploadMocked:
    """Test upload using a fake boto3 client via patching."""

    @pytest.fixture
    def fake_client(self):
        return MagicMock()

    @pytest.mark.asyncio
    async def test_upload_batch_success(self, fake_client):
        from app.schemas.records import CanonicalRecord
        from datetime import datetime, timezone

        with patch("app.aws.s3.boto3.client", return_value=fake_client), \
             patch("app.aws.s3.settings") as mock_settings:
            mock_settings.s3_bucket_name = "test-bucket"
            mock_settings.aws_region = "us-east-1"
            mock_settings.aws_access_key_id = "AKIAEXAMPLE"
            mock_settings.aws_secret_access_key = "SECRET"

            records = [CanonicalRecord(
                record_id="TEST-001",
                source="customer_source",
                entity_type="customer",
                name="Test User",
                email="test@example.com",
                timestamp=datetime.now(timezone.utc),
                payload={"plan": "pro"},
            )]

            s3 = S3Service()
            key = await s3.upload_batch(records, "run-abc")

            assert key.startswith("pipeline/run-abc/")
            assert key.endswith(".json")

            fake_client.put_object.assert_called_once()
            call_kwargs = fake_client.put_object.call_args[1]
            assert call_kwargs["Bucket"] == "test-bucket"
            assert call_kwargs["ContentType"] == "application/json"
            body = call_kwargs["Body"]
            assert '"record_count": 1' in body.decode()
