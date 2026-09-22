# Project Memory & Operational Context

## Context & Architecture Decisions
- **Project**: Concurrent Data Ingestion Pipeline & Live Dashboard — fully implemented
- **Backend Stack**: Python 3.11+, FastAPI, Asyncio, SQLAlchemy 2.0 (aiosqlite), SQLite, Boto3 (AWS S3)
- **Frontend Stack**: React 18, Vite 6, Vanilla CSS with Dark Glassmorphism aesthetics per Design.md
- **Core Strategy**:
  - Maximize concurrent ingestion via `asyncio.gather(..., return_exceptions=True)` — proven: wall-clock ~0.7s vs sequential >2s.
  - Enforce resilient partial success: 1 broken source → `PARTIAL_SUCCESS` (not `FAILED`). All sources fail → `FAILED`.
  - Zero unvalidated data in DB/S3: Strict Normalization → Validation → Deduplication chain.
  - S3 cloud integration is isolated & optional: runs gracefully locally if AWS credentials/bucket are omitted (`SKIPPED`).

## Key Decisions & Conventions
- SQLite local database: `data/pipeline.db` (auto-created; uses `sqlite+aiosqlite` driver for async support).
- Canonical model defines common attributes: `record_id`, `source`, `entity_type`, `name`, `email`, `timestamp`, `payload`.
- Deduplication deterministic key: `f"{source}:{entity_type}:{record_id}"` — different entity types with same ID are NOT duplicates.
- Fault injection: configurable set of source keys passed to `PipelineManager`; each source raises distinct exception messages.
- Database sessions: created per-request or per-pipeline-run; no persistent connections leaked between tests.
- Frontend polling: 8-second interval for normal refresh, 2-second during active pipeline runs.
- No unnecessary infrastructure: pure asyncio, no Redis/Celery/Kafka/Spark/K8s.

## Implementation Artifacts
- 41 automated tests pass (sources: 9, processing: 10, pipeline: 5, API: 10, S3: 4)
- Backend: 14 Python modules across 8 packages
- Frontend: 10 JSX components + CSS design system
- README.md covers installation, configuration, API examples, troubleshooting
