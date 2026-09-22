"""Tests for Normalizer, Validator, and Deduplicator — the three processing stages."""

from datetime import datetime, timezone

import pytest

from app.processing.deduplicator import Deduplicator, _dedup_key
from app.processing.normalizer import normalize_batch
from app.processing.validator import validate_batch


# ── Helper: build valid CanonicalRecords directly ────────────────────────────

def make_record(record_id="REC-001", source="customer_source", entity_type="customer"):
    """Create a valid CanonicalRecord directly for testing validator/deduplicator."""
    from app.schemas.records import CanonicalRecord
    return CanonicalRecord(
        record_id=record_id,
        source=source,
        entity_type=entity_type,
        timestamp=datetime.now(timezone.utc),
    )


# ── Normalization ─────────────────────────────────────────────────────────────

class TestNormalizer:
    def test_normalize_customer(self):
        records = normalize_batch([{"id": "CUST-0001", "full_name": "Alice Smith", "email_address": "alice@example.com", "created_at": datetime.now(timezone.utc).isoformat()}], "customer_source")
        assert len(records) == 1
        rec = records[0]
        assert rec.source == "customer_source"
        assert rec.entity_type == "customer"
        assert rec.record_id == "CUST-0001"

    def test_normalize_product(self):
        records = normalize_batch([{"sku": "PROD-0001", "product_name": "Widget", "category": "Electronics", "price": 29.99, "updated_at": datetime.now(timezone.utc).isoformat()}], "product_source")
        assert len(records) == 1
        rec = records[0]
        assert rec.source == "product_source"
        assert rec.entity_type == "product"

    def test_normalize_transaction(self):
        records = normalize_batch([{"order_id": "TXN-0001", "amount": 99.50, "currency": "USD", "customer_email": "buyer@example.com", "order_date": datetime.now(timezone.utc).isoformat()}], "transaction_source")
        assert len(records) == 1
        rec = records[0]
        assert rec.entity_type == "transaction"
        assert rec.email == "buyer@example.com"

    def test_empty_batch(self):
        assert normalize_batch([], "customer_source") == []

    def test_unknown_source_returns_empty(self):
        assert normalize_batch([{"foo": "bar"}], "unknown_source") == []


# ── Validation ────────────────────────────────────────────────────────────────

class TestValidator:
    def test_valid_record_passes(self):
        valid, invalid = validate_batch([make_record()])
        assert len(valid) == 1
        assert len(invalid) == 0

    def test_invalid_record_rejected(self):
        from app.schemas.records import CanonicalRecord
        # Use model_construct to bypass Pydantic validation — simulates a
        # record that somehow arrived with invalid fields after normalization.
        bad = CanonicalRecord.model_construct(
            record_id="", source="", entity_type="invalid-type",
            timestamp=datetime.now(timezone.utc),
        )
        valid, invalid = validate_batch([bad])
        assert len(valid) == 0
        assert len(invalid) == 1
        assert invalid[0][0].record_id == ""

    def test_mixed_batch(self):
        good = make_record("OK-001")
        from app.schemas.records import CanonicalRecord
        bad = CanonicalRecord.model_construct(
            record_id="BAD", source="X", entity_type="bad-type", timestamp=datetime.now(timezone.utc)
        )
        valid, invalid = validate_batch([good, bad])
        assert len(valid) == 1
        assert len(invalid) == 1
        assert valid[0].record_id == "OK-001"


# ── Deduplication ─────────────────────────────────────────────────────────────

class TestDeduplicator:
    def test_no_duplicates(self):
        d = Deduplicator()
        records = [make_record("A", source="cust", entity_type="customer"), make_record("B", source="prod", entity_type="product")]
        unique = d.deduplicate(records)
        assert len(unique) == 2
        _, dup_c = d.merge_metrics(2)
        assert dup_c == 0

    def test_with_duplicates(self):
        d = Deduplicator()
        r = make_record("SAME", "customer_source", "customer")
        records = [r, r, make_record("DIFF"), r]
        unique = d.deduplicate(records)
        assert len(unique) == 2
        _, dup_c = d.merge_metrics(4)
        assert dup_c == 2

    def test_deterministic_key(self):
        rec = make_record("K1", source="customer_source", entity_type="customer")
        key = _dedup_key(rec)
        assert key == "customer_source:customer:K1"

    def test_different_sources_same_id_not_duplicate(self):
        d = Deduplicator()
        cust = make_record("SAME-ID", source="customer_source", entity_type="customer")
        prod = make_record("SAME-ID", source="product_source", entity_type="product")
        unique = d.deduplicate([cust, prod])
        assert len(unique) == 2
