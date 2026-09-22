from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter(prefix="/api/health", tags=["Health"])

@router.get("")
async def health_check():
    return {
        "status": "ok",
        "service": "acentra-pipeline",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
