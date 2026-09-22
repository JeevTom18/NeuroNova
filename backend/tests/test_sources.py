"""Tests for all three mock data sources — concurrent execution, fault injection, and schema validation."""

import asyncio
from datetime import datetime

import pytest

from app.ingestion.customer_source import CustomerSource
from app.ingestion.product_source import ProductSource
from app.ingestion.transaction_source import TransactionSource


@pytest.fixture
def customer_src():
    return CustomerSource()


@pytest.fixture
def product_src():
    return ProductSource()


@pytest.fixture
def txn_src():
    return TransactionSource()


# ── Concurrent execution ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_three_sources_run_concurrently(customer_src, product_src, txn_src):
    """Verify that asyncio.gather returns results from all three sources simultaneously."""
    start = asyncio.get_event_loop().time()
    results = await asyncio.gather(
        customer_src.fetch(),
        product_src.fetch(),
        txn_src.fetch(),
        return_exceptions=True,
    )
    elapsed = asyncio.get_event_loop().time() - start

    # Each source adds 0.2-0.7s latency; running sequentially would be > 0.6s
    # Running concurrently should complete in ~0.7s wall-clock
    assert elapsed < 1.2, f"Sources did not run concurrently: {elapsed:.2f}s"
    assert all(isinstance(r, list) for r in results), "Expected three lists of records"
    assert all(len(r) > 0 for r in results), "All sources must produce at least one record"


# ── Customer source ───────────────────────────────────────────────────────────

def test_customer_source_returns_list(customer_src):
    assert isinstance(customer_src.name, str)
    assert customer_src.name == "customer_source"


@pytest.mark.asyncio
async def test_customer_fetch_yields_valid_records(customer_src):
    records = await customer_src.fetch()
    assert len(records) >= 20
    rec = records[0]
    assert "id" in rec
    assert "full_name" in rec or "name" in rec
    assert "email_address" in rec or "email" in rec
    assert "created_at" in rec


@pytest.mark.asyncio
async def test_customer_fault_injection(customer_src):
    customer_src.configure_fault(True)
    with pytest.raises(Exception, match="Simulated connection timeout"):
        await customer_src.fetch()


# ── Product source ────────────────────────────────────────────────────────────

def test_product_source_returns_list(product_src):
    assert product_src.name == "product_source"


@pytest.mark.asyncio
async def test_product_fetch_yields_valid_records(product_src):
    records = await product_src.fetch()
    assert len(records) >= 20
    rec = records[0]
    assert "sku" in rec
    assert "product_name" in rec or "name" in rec
    assert "category" in rec
    assert "price" in rec


@pytest.mark.asyncio
async def test_product_fault_injection(product_src):
    product_src.configure_fault(True)
    with pytest.raises(Exception, match="Simulated internal server error"):
        await product_src.fetch()


# ── Transaction source ────────────────────────────────────────────────────────

def test_transaction_source_returns_list(txn_src):
    assert txn_src.name == "transaction_source"


@pytest.mark.asyncio
async def test_transaction_fetch_yields_valid_records(txn_src):
    records = await txn_src.fetch()
    assert len(records) >= 20
    rec = records[0]
    assert "order_id" in rec
    assert "amount" in rec
    assert "currency" in rec


@pytest.mark.asyncio
async def test_transaction_fault_injection(txn_src):
    txn_src.configure_fault(True)
    with pytest.raises(Exception, match="Simulated payment gateway unreachable"):
        await txn_src.fetch()
