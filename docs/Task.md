# Implementation Roadmap & Task Breakdown

## Project: Concurrent Data Ingestion Pipeline & Live Dashboard

Status Legend:
- [ ] Planned / Pending
- [x] Completed
- [-] In Progress

---

### Phase 1: Environment & Workspace Setup ✅ COMPLETE
- [x] **Task 1.1**: Initialize project folder structure (`backend/app/` and `frontend/`).
- [x] **Task 1.2**: Set up Python virtual environment, `backend/requirements.txt` (fastapi, uvicorn, pydantic, sqlalchemy, aiosqlite, boto3, pytest, pytest-asyncio, httpx).
- [x] **Task 1.3**: Create `.env.example`, `backend/app/config.py` using Pydantic Settings.
- [x] Create `.gitignore`, `frontend/package.json`, `frontend/vite.config.js`.

---

### Phase 2: Data Sources & Ingestion Layer ✅ COMPLETE
- [x] **Task 2.1**: Implemented base interface `backend/app/ingestion/base.py` (`DataSource` abstract class).
- [x] **Task 2.2**: Implemented `CustomerSource` in `backend/app/ingestion/customer_source.py` with simulated network jitter (~0.2-0.6s), mock customer data, and ~15% duplicate injection.
- [x] **Task 2.3**: Implemented `ProductSource` in `backend/app/ingestion/product_source.py` with mock catalog data and fault injection.
- [x] **Task 2.4**: Implemented `TransactionSource` in `backend/app/ingestion/transaction_source.py` with mock order events and fault injection.
- [x] **Task 2.5**: Simulated failure toggle via `configure_fault(True)` on each source — verified all three throw distinct exceptions.

---

### Phase 3: Processing Pipeline (Normalize, Validate, Deduplicate) ✅ COMPLETE
- [x] **Task 3.1**: Defined Canonical Schema in `backend/app/schemas/records.py` (`CanonicalRecord`, `RawRecord`, `ProcessingMetrics`, `SourceRunResult`).
- [x] **Task 3.2**: Implemented `Normalizer` in `backend/app/processing/normalizer.py` with three source-specific normalizers (Customer, Product, Transaction) mapping heterogeneous schemas to `CanonicalRecord`.
- [x] **Task 3.3**: Implemented `Validator` in `backend/app/processing/validator.py` enforcing mandatory attributes, field lengths, entity_type pattern, with rejection reason tracking.
- [x] **Task 3.4**: Implemented `Deduplicator` in `backend/app/processing/deduplicator.py` generating deterministic keys (`{source}:{entity_type}:{record_id}`) and pruning duplicates while tracking metrics.

---

### Phase 4: Persistence Layer (SQLite & AWS S3) ✅ COMPLETE
- [x] **Task 4.1**: Set up SQLAlchemy SQLite models in `backend/app/database/models.py` (`records`, `pipeline_runs`, `source_status`).
- [x] **Task 4.2**: Implemented database session manager (`backend/app/database/database.py`) and repositories (`backend/app/database/repository.py`) — `RecordRepository`, `PipelineRunRepository`, `SourceStatusRepository`.
- [x] **Task 4.3**: Implemented `backend/app/aws/s3.py` for async-isolated S3 upload (`asyncio.to_thread`), with graceful fallback (`SKIPPED`) when credentials/bucket are unconfigured.

---

### Phase 5: Pipeline Orchestrator & Concurrency ✅ COMPLETE
- [x] **Task 5.1**: Implemented `PipelineManager` in `backend/app/pipeline/manager.py`:
  - Runs sources via `asyncio.gather(*sources, return_exceptions=True)` — proven concurrent (wall-clock < sum of individual latencies).
  - Processes data through Normalizer → Validator → Deduplicator chain.
  - Persists records and run summaries to SQLite.
  - Computes status: `SUCCESS` (all pass), `PARTIAL_SUCCESS` (≥1 fails), `FAILED` (all fail).
  - Optional S3 upload after persistence.
- [x] **Task 5.2**: 5 pipeline tests covering full success, partial failure, all-fail, persistence verification, and run ID uniqueness. All 41 backend tests pass.

---

### Phase 6: REST API Layer (FastAPI) ✅ COMPLETE
- [x] **Task 6.1**: Implemented `backend/app/api/routes_pipeline.py` (`POST /api/pipeline/run`, `GET /api/pipeline/status`, `GET /api/pipeline/runs`).
- [x] **Task 6.2**: Implemented `backend/app/api/routes_sources.py` (`GET /api/sources`, `GET /api/sources/{source_name}`).
- [x] **Task 6.3**: Implemented `backend/app/api/routes_records.py` (`GET /api/records` with source/entity_type filtering, `GET /api/records/count`).
- [x] **Task 6.4**: Implemented `backend/app/api/routes_health.py` (`GET /api/health`).
- [x] **Task 6.5**: Wired up CORS middleware and routes in `backend/app/main.py`. OpenAPI docs available at `/docs`.

---

### Phase 7: Live Web Dashboard (React + Vite) ✅ COMPLETE
- [x] **Task 7.1**: Initialized React application using Vite in `frontend/`.
- [x] **Task 7.2**: Configured design system in `frontend/src/index.css` — dark glassmorphism aesthetic matching Design.md color tokens, typography, badges, skeletons, pulse animations.
- [x] **Task 7.3**: Created API communication client in `frontend/src/api.js`.
- [x] **Task 7.4**: Built Header, MetricCards, PipelineControls with live execution trigger.
- [x] **Task 7.5**: Built SourceHealthGrid with Customer, Product, Transaction source cards showing status dots, record counts, error messages.
- [x] **Task 7.6**: Built RunHistoryTable with status badges, duration, S3 indicators, empty states.
- [x] **Task 7.7**: Built RecordExplorer with search filter, source dropdown, paginated display.
- [x] Main App.jsx orchestrates state with auto-refresh polling (8s interval, faster during active runs).

---

### Phase 8: End-to-End Verification ✅ COMPLETE
- [x] **Task 8.1**: Backend starts and serves health endpoint. Frontend builds successfully (37 modules, 0 errors).
- [x] **Task 8.2**: Triggered healthy pipeline run via API — returned SUCCESS with 97+ unique records persisted. Verified SQLite insertion and deduplication.
- [x] **Task 8.3**: Simulated single source failure (transaction) — returned PARTIAL_SUCCESS; customer+product persisted normally.
- [x] **Task 8.4**: Validated S3 mock upload works; SKIPPED correctly when AWS unconfigured.
- [x] **Task 8.5**: All 41 automated tests pass across sources, processing, pipeline, API, and S3 layers.
- [x] Documentation complete: README.md, .env.example, .gitignore.

---

## Final Status: ALL TASKS COMPLETE ✅
