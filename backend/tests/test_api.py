"""Integration tests for FastAPI routes using TestClient."""

import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.fixture
async def client():
    from app.database.database import engine, Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ── Health ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health_check(client):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["service"] == "acentra-pipeline"


# ── Pipeline Status ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_pipeline_status_idle(client):
    resp = await client.get("/api/pipeline/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "is_running" in data
    assert "stage" in data


# ── Pipeline Run ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_trigger_run_succeeds(client):
    resp = await client.post("/api/pipeline/run")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ("SUCCESS", "PARTIAL_SUCCESS")
    assert "run_id" in data
    assert "total_records" in data
    assert "processed_records" in data


# ── Pipeline Runs History ─────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_runs(client):
    # First trigger a run
    await client.post("/api/pipeline/run")
    resp = await client.get("/api/pipeline/runs?limit=10&offset=0")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    run = data[0]
    assert "run_id" in run
    assert "status" in run
    assert "started_at" in run
    assert "duration_seconds" in run


# ── Records ───────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_records(client):
    await client.post("/api/pipeline/run")
    resp = await client.get("/api/records?limit=5")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    if data:
        rec = data[0]
        assert "record_id" in rec
        assert "source" in rec
        assert "entity_type" in rec


@pytest.mark.asyncio
async def test_get_records_filtered_by_source(client):
    await client.post("/api/pipeline/run")
    resp = await client.get("/api/records?source=customer_source&limit=5")
    assert resp.status_code == 200
    for rec in resp.json():
        assert rec["source"] == "customer_source"


@pytest.mark.asyncio
async def test_record_count(client):
    resp = await client.get("/api/records/count")
    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data
    assert isinstance(data["total"], int)


# ── Sources ───────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_sources(client):
    resp = await client.get("/api/sources")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    names = {s["source_name"] for s in data}
    assert "customer_source" in names
    assert "product_source" in names
    assert "transaction_source" in names


@pytest.mark.asyncio
async def test_get_source_detail(client):
    resp = await client.get("/api/sources/customer_source")
    assert resp.status_code == 200
    data = resp.json()
    assert data["source_name"] == "customer_source"
    assert "status" in data


@pytest.mark.asyncio
async def test_get_unknown_source(client):
    resp = await client.get("/api/sources/nonexistent")
    assert resp.status_code == 200  # Returns error JSON, not 404
    data = resp.json()
    assert "error" in data
