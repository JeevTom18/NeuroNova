from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.database.database import get_db
from app.pipeline.manager import PipelineManager
from app.database.repository import Repository
from app.schemas.records import PipelineRunSummary

router = APIRouter(prefix="/api/pipeline", tags=["Pipeline"])

class RunRequest(BaseModel):
    simulate_failure: Optional[str] = None  # None, "customer", "product", "transaction"

@router.post("/run", response_model=PipelineRunSummary)
async def trigger_pipeline_run(
    request: RunRequest = RunRequest(),
    db: AsyncSession = Depends(get_db)
):
    """Triggers an end-to-end concurrent pipeline run."""
    try:
        manager = PipelineManager(db)
        summary = await manager.execute_pipeline(simulated_failure_source=request.simulate_failure)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline execution error: {str(e)}")

@router.get("/status")
async def get_pipeline_status(db: AsyncSession = Depends(get_db)):
    """Returns the latest execution state and operational health."""
    repo = Repository(db)
    runs = await repo.get_recent_runs(limit=1)
    latest_run = runs[0] if runs else None
    return {
        "is_running": False,
        "stage": "idle",
        "latest_run": latest_run,
        "system_status": "ONLINE"
    }

@router.get("/runs", response_model=List[Dict[str, Any]])
async def list_pipeline_runs(
    limit: int = Query(default=15, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """Lists historical pipeline executions."""
    repo = Repository(db)
    runs = await repo.get_recent_runs(limit=limit)
    for r in runs:
        if "duration_seconds" not in r:
            r["duration_seconds"] = r.get("duration", 0.0)
    return runs[offset:]
