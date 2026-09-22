import pytest
import asyncio
from app.ingestion.customer_source import CustomerSource
from app.ingestion.product_source import ProductSource
from app.ingestion.transaction_source import TransactionSource
from app.processing.deduplicator import Deduplicator
from app.processing.validator import Validator
from app.schemas.records import CanonicalRecord

@pytest.mark.asyncio
async def test_concurrent_sources_success():
    customer = CustomerSource()
    product = ProductSource()
    transaction = TransactionSource()

    results = await asyncio.gather(
        customer.fetch(),
        product.fetch(),
        transaction.fetch(),
        return_exceptions=True
    )

    assert len(results) == 3
    for res in results:
        assert isinstance(res, list)
        assert len(res) > 0

@pytest.mark.asyncio
async def test_source_isolated_failure():
    customer = CustomerSource()
    product = ProductSource()
    transaction = TransactionSource()

    results = await asyncio.gather(
        customer.fetch(),
        product.fetch(),
        transaction.fetch(simulate_failure=True),
        return_exceptions=True
    )

    assert isinstance(results[0], list)
    assert isinstance(results[1], list)
    assert isinstance(results[2], Exception)

def test_deduplicator():
    records = [
        CanonicalRecord(record_id="c1", source="crm", entity_type="customer", name="Alice", timestamp="2026-01-01"),
        CanonicalRecord(record_id="c1", source="crm", entity_type="customer", name="Alice Duplicate", timestamp="2026-01-01"),
        CanonicalRecord(record_id="c2", source="crm", entity_type="customer", name="Bob", timestamp="2026-01-01"),
    ]
    d = Deduplicator()
    uniques = d.deduplicate(records)
    _, dup_count = d.merge_metrics(len(records))
    assert len(uniques) == 2
    assert dup_count == 1

def test_validator():
    valid_record = CanonicalRecord(
        record_id="p100", source="catalog", entity_type="product", name="Widget", timestamp="2026-01-01"
    )
    is_valid, err = Validator.validate(valid_record)
    assert is_valid is True
    assert err is None

    invalid_record = CanonicalRecord(
        record_id="", source="catalog", entity_type="product", name="Widget", timestamp="2026-01-01"
    )
    is_valid, err = Validator.validate(invalid_record)
    assert is_valid is False
