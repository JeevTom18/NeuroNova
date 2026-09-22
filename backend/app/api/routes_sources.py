from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
from app.database.database import get_db
from app.database.repository import Repository

router = APIRouter(prefix="/api/sources", tags=["Sources"])

DEFAULT_SOURCES = [
    {"source_name": "customer_source", "status": "HEALTHY", "records_received": 0, "last_error": None},
    {"source_name": "product_source", "status": "HEALTHY", "records_received": 0, "last_error": None},
    {"source_name": "transaction_source", "status": "HEALTHY", "records_received": 0, "last_error": None}
]

@router.get("", response_model=List[Dict[str, Any]])
async def get_sources_status(db: AsyncSession = Depends(get_db)):
    """Returns the operational status and metrics of all 3 data sources."""
    repo = Repository(db)
    statuses = await repo.get_all_source_statuses()
    if not statuses:
        return DEFAULT_SOURCES
    
    found_names = {s["source_name"] for s in statuses}
    result = list(statuses)
    for default in DEFAULT_SOURCES:
        if default["source_name"] not in found_names:
            result.append(default)
    return result

@router.get("/{source_name}")
async def get_single_source(source_name: str, db: AsyncSession = Depends(get_db)):
    """Returns detail for a single data source."""
    valid_names = {"customer_source", "product_source", "transaction_source"}
    if source_name not in valid_names:
        return {"error": f"Unknown source: {source_name}"}

    repo = Repository(db)
    statuses = await repo.get_all_source_statuses()
    for s in statuses:
        if s["source_name"] == source_name:
            return s

    return {
        "source_name": source_name,
        "status": "HEALTHY",
        "records_received": 0,
        "last_error": None
    }
