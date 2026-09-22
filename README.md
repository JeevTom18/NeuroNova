# Acentra Pipeline — Concurrent Data Ingestion & Live Dashboard

A production-grade concurrent data ingestion pipeline with a real-time React monitoring dashboard. Ingests from three mock sources simultaneously, normalizes/validates/deduplicates records, persists to SQLite, and optionally exports to AWS S3.

## Architecture

```
React Dashboard (port 5173)
        ↓ HTTP
FastAPI REST API (port 8000)
        ↓
Pipeline Manager (asyncio.gather)
        ↓
Customer Source  ←→  Product Source  ←→  Transaction Source  (concurrent)
        ↓                ↓                  ↓
   Normalization → Validation → Deduplication
        ↓
   SQLite (local persistence)
        ↓
   AWS S3 (optional cloud export)
```

## Features

- **Concurrent Ingestion**: Three data sources fetch simultaneously via `asyncio.gather(return_exceptions=True)`
- **Fault Tolerance**: Partial failures produce `PARTIAL_SUCCESS` instead of full pipeline failure
- **Data Quality**: Deterministic normalization, schema validation, and deduplication before persistence
- **Persistent Storage**: SQLite database with SQLAlchemy ORM across `records`, `pipeline_runs`, `source_status` tables
- **S3 Export**: Real boto3 integration with graceful degradation when credentials are unavailable
- **Live Monitoring**: Dark glassmorphism React dashboard with auto-refresh, run history, and source health grid
- **Full API Coverage**: FastAPI endpoints for pipeline control, records query, source health, and health check

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Python 3.11+, FastAPI, Uvicorn |
| Database | SQLite (aiosqlite), SQLAlchemy 2.0 |
| Processing | Pydantic v2 schemas, custom normalizer/validator/deduplicator |
| Cloud | boto3 (AWS S3) |
| Frontend | React 18, Vite 6, Vanilla CSS (dark glassmorphism) |
| Testing | pytest, pytest-asyncio, httpx |
| Concurrency | asyncio (no threads/multiprocessing) |

## Directory Structure

```
├── backend/app/
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Pydantic Settings from environment variables
│   ├── api/                    # Thin route handlers
│   │   ├── routes_health.py    # GET /api/health
│   │   ├── routes_pipeline.py  # POST/Pipeline runs, status
│   │   ├── routes_records.py   # GET Records with filtering
│   │   └── routes_sources.py   # GET Source health info
│   ├── ingestion/              # Mock data sources
│   │   ├── base.py             # Abstract DataSource interface
│   │   ├── customer_source.py  # Customer profiles
│   │   ├── product_source.py   # Product catalog
│   │   └── transaction_source.py # Order events
│   ├── processing/            # Pure data transformation
│   │   ├── normalizer.py      # Schema mapping
│   │   ├── validator.py       # Field-level validation
│   │   └── deduplicator.py    # Deterministic dedup
│   ├── pipeline/              # Orchestration
│   │   └── manager.py         # Full pipeline lifecycle
│   ├── database/              # Persistence
│   │   ├── models.py          # SQLAlchemy ORM models
│   │   ├── database.py        # Engine & session management
│   │   └── repository.py      # Data access layer
│   ├── aws/                   # Cloud storage
│   │   └── s3.py              # S3 upload abstraction
│   └── schemas/               # Request/response models
│       └── records.py
├── backend/tests/             # 41 automated tests
│   ├── test_sources.py        # Source fetching + fault injection
│   ├── test_processing.py     # Normalize, validate, deduplicate
│   ├── test_pipeline.py       # End-to-end pipeline execution
│   ├── test_api.py            # HTTP endpoint integration tests
│   └── test_s3.py             # S3 mock upload tests
├── frontend/src/              # React + Vite dashboard
│   ├── App.jsx                # Dashboard orchestrator
│   ├── index.css              # Design system tokens
│   ├── api.js                 # API client layer
│   ├── components/dashboard/  # MetricCard, SourceHealthGrid, RunHistory, etc.
│   ├── components/layout/     # Header
│   └── common/                # Badge, SkeletonLoader
├── .env.example               # Configuration template
└── requirements.txt           # Python dependencies
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- `uv` or `pip` for Python dependency management
- An empty directory ready for project files

## Installation

### 1. Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env   # optional — local defaults work without it
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### Start the Backend

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Server is at `http://localhost:8000`  
OpenAPI docs at `http://localhost:8000/docs`

### Start the Frontend

```bash
cd frontend
npm run dev
```

Dashboard is at `http://localhost:5173`  
The dev server proxies `/api/*` requests to the backend automatically.

### Run Tests

```bash
cd backend
source .venv/bin/activate
pytest tests/ -v
```

**41 tests covering**: source concurrency, normalization, validation, deduplication, full pipeline, partial failure, all API endpoints, and S3 uploads.

## Environment Variables

See `.env.example` for the complete list. Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite+aiosqlite:///./data/pipeline.db` | SQLite connection URL |
| `AWS_REGION` | `us-east-1` | S3 region |
| `AWS_ACCESS_KEY_ID` | _(empty)_ | Required for S3; system works without it |
| `AWS_SECRET_ACCESS_KEY` | _(empty)_ | Required for S3; system works without it |
| `S3_BUCKET_NAME` | _(empty)_ | Required for S3; system works without it |
| `API_HOST` | `0.0.0.0` | FastAPI bind address |
| `API_PORT` | `8000` | FastAPI port |
| `VITE_API_URL` | `http://localhost:8000` | Frontend proxy target |

When AWS credentials/bucket are absent, S3 operations are marked `SKIPPED` gracefully — the pipeline completes fully.

## Example API Calls

```bash
# Health check
curl http://localhost:8000/api/health

# Trigger a pipeline run
curl -X POST http://localhost:8000/api/pipeline/run

# Check current status
curl http://localhost:8000/api/pipeline/status

# List historical runs
curl "http://localhost:8000/api/pipeline/runs?limit=10"

# Get all source health
curl http://localhost:8000/api/sources

# Query records with filter
curl "http://localhost:8000/api/records?source=customer_source&limit=20"

# Record count
curl http://localhost:8000/api/records/count
```

## Setting Up AWS S3

To enable real S3 archival:

1. Create an S3 bucket in your target region
2. Configure IAM credentials with `s3:PutObject` permission on that bucket
3. Set in `.env`:

```
AWS_ACCESS_KEY_ID=your-key-here
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET_NAME=my-bucket-name
```

After configuration, successful pipeline runs will show `s3_status: "SUCCESS"` and output files like `pipeline/{run_id}/{timestamp}.json`.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Import errors on startup | Ensure you're running from `backend/` with venv activated |
| Port already in use | Kill existing process: `lsof -ti :8000 | xargs kill -9` |
| SQLite write errors | Delete `data/pipeline.db` and restart (tables rebuild automatically) |
| S3 "credential error" | Expected — S3 requires explicit AWS credentials. Leave empty for local-only mode |
| Frontend can't reach API | Verify backend is running on port 8000; check CORS settings in `main.py` |
| Test failures | Ensure clean DB: remove `data/pipeline.db` before re-running tests |
