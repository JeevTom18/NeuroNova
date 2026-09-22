from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.config import settings
from app.database.database import engine, Base
from app.api.routes_pipeline import router as pipeline_router
from app.api.routes_sources import router as sources_router
from app.api.routes_records import router as records_router
from app.api.routes_health import router as health_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("acentra.api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database tables are created
    logger.info("Initializing database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database schema initialized.")
    yield
    # Shutdown
    await engine.dispose()
    logger.info("Database connection closed.")

app = FastAPI(
    title="Acentra Concurrent Data Ingestion API",
    version="1.0.0",
    description="High-throughput asyncio data ingestion pipeline orchestrator and monitoring API",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev convenience
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health_router)
app.include_router(pipeline_router)
app.include_router(sources_router)
app.include_router(records_router)

@app.get("/")
async def root():
    return {
        "message": "Acentra Ingestion Pipeline API is running",
        "docs": "/docs",
        "health": "/api/health"
    }
