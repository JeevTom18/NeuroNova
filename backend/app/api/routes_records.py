from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional
from app.database.database import get_db
from app.database.repository import Repository

router = APIRouter(prefix="/api/records", tags=["Records"])

@router.get("", response_model=List[Dict[str, Any]])
async def list_records(
    source: Optional[str] = Query(default=None),
    entity_type: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves normalized canonical records with filtering."""
    repo = Repository(db)
    return await repo.get_records(source=source, entity_type=entity_type, limit=limit)

@router.get("/count")
async def get_record_count(db: AsyncSession = Depends(get_db)):
    """Returns total record count in SQLite."""
    repo = Repository(db)
    records = await repo.get_records(limit=10000)
    return {"total": len(records)}
