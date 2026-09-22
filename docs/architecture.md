System Architecture

Concurrent Data Ingestion Pipeline & Live Dashboard

1. Architecture Overview

The system follows a modular layered architecture.

                    ┌─────────────────────┐
                    │   React Dashboard   │
                    └──────────┬──────────┘
                               │ HTTP
                               ▼
                    ┌─────────────────────┐
                    │      FastAPI        │
                    │     REST API        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Pipeline Manager  │
                    └──────────┬──────────┘
                               │
                    asyncio.gather()
                               │
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
      ┌────────────┐    ┌────────────┐    ┌────────────┐
      │ Customer   │    │ Product    │    │Transaction │
      │ Source     │    │ Source     │    │ Source     │
      └─────┬──────┘    └─────┬──────┘    └─────┬──────┘
            │                 │                 │
            └─────────────────┼─────────────────┘
                              ▼
                    ┌─────────────────────┐
                    │    Normalization    │
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │     Validation      │
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │    Deduplication    │
                    └──────────┬──────────┘
                               ▼
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
        ┌────────────────┐          ┌────────────────┐
        │    SQLite      │          │    AWS S3      │
        │   Database     │          │ Processed Data │
        └────────────────┘          └────────────────┘

⸻

2. Backend Architecture

The backend should be organized into clear layers.

backend/
├── app/
│   ├── main.py
│   ├── config.py
│   │
│   ├── api/
│   │   ├── routes_pipeline.py
│   │   ├── routes_records.py
│   │   ├── routes_sources.py
│   │   └── routes_health.py
│   │
│   ├── ingestion/
│   │   ├── base.py
│   │   ├── customer_source.py
│   │   ├── product_source.py
│   │   └── transaction_source.py
│   │
│   ├── processing/
│   │   ├── normalizer.py
│   │   ├── validator.py
│   │   └── deduplicator.py
│   │
│   ├── pipeline/
│   │   └── manager.py
│   │
│   ├── database/
│   │   ├── database.py
│   │   ├── models.py
│   │   └── repository.py
│   │
│   ├── aws/
│   │   └── s3.py
│   │
│   └── schemas/
│       ├── records.py
│       └── pipeline.py
│
└── tests/

⸻

3. Concurrency Model

Use Python asyncio.

The pipeline manager should execute sources using:

results = await asyncio.gather(
    customer_source.fetch(),
    product_source.fetch(),
    transaction_source.fetch(),
    return_exceptions=True
)

return_exceptions=True should be used where appropriate so that one failed source does not prevent other sources from completing.

Do not use threads or multiprocessing unless there is a demonstrated need.

The workload is primarily I/O-bound, so asyncio is the preferred approach.

⸻

4. Source Architecture

Every source should follow a common interface.

Conceptually:

class DataSource:
    name: str
    async def fetch(self) -> list:
        ...

Each source implementation should:

1. Simulate an external API call.
2. Wait asynchronously.
3. Generate mock data.
4. Return source-specific records.
5. Raise controlled exceptions when simulating failures.

⸻

5. Processing Pipeline

The pipeline follows this sequence:

Ingestion
    ↓
Combine Source Results
    ↓
Normalization
    ↓
Validation
    ↓
Deduplication
    ↓
Persistence
    ↓
Export
    ↓
S3 Upload
    ↓
Update Pipeline Status

Processing stages should remain independent.

⸻

6. Normalization Architecture

Each source can have a different schema.

The normalizer converts records into a canonical internal model.

Example canonical record:

{
  "record_id": "customer_101",
  "source": "customer_source",
  "entity_type": "customer",
  "name": "John",
  "email": "john@example.com",
  "timestamp": "2026-09-22T10:30:00Z"
}

The canonical model must be used by downstream components.

⸻

7. Deduplication Architecture

Deduplication should happen after normalization.

A deterministic key should be generated.

Example:

source + entity_type + record_id

or a suitable business key.

The deduplication component should return:

unique_records
duplicate_count

It must not silently discard information required for monitoring.

⸻

8. Database Architecture

SQLite should be used as the primary local persistence layer.

Tables:

records

id
record_id
source
entity_type
name
email
timestamp
created_at

pipeline_runs

id
run_id
status
started_at
completed_at
duration
total_records
processed_records
duplicate_records
failed_records
s3_status

source_status

id
source_name
status
last_attempt
last_success
records_received
last_error

⸻

9. AWS S3 Architecture

S3 is used as an object-storage destination for processed pipeline output.

The S3 service should be isolated behind an interface/module.

Example:

class S3Storage:
    async def upload_file(...):
        ...

Because boto3 operations are synchronous, do not block the event loop with long-running synchronous calls.

If required, run blocking S3 operations through an appropriate executor or isolate them after the async ingestion stage.

S3 configuration:

AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
S3_BUCKET_NAME

Prefer AWS’s default credential provider chain when running in AWS.

⸻

10. API Architecture

FastAPI acts as the application boundary.

Routes should delegate business logic to services instead of implementing pipeline logic directly.

Example:

API Route
   ↓
Service / Pipeline Manager
   ↓
Repository / Processing / AWS

Routes must remain thin.

⸻

11. Frontend Architecture

The React application should use reusable components.

Suggested structure:

frontend/
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── StatusCard.jsx
│   │   ├── RecordStats.jsx
│   │   ├── SourceHealth.jsx
│   │   ├── RunHistory.jsx
│   │   └── PipelineButton.jsx
│   │
│   ├── pages/
│   │   └── Dashboard.jsx
│   │
│   ├── services/
│   │   └── api.js
│   │
│   ├── App.jsx
│   └── main.jsx

⸻

12. Data Flow

The normal request flow is:

User
 ↓
React Dashboard
 ↓
POST /api/pipeline/run
 ↓
FastAPI
 ↓
Pipeline Manager
 ↓
asyncio.gather()
 ↓
Three Sources
 ↓
Normalize
 ↓
Validate
 ↓
Deduplicate
 ↓
SQLite + S3
 ↓
Update Status
 ↓
React Dashboard

Dashboard data requests follow:

React
 ↓
GET /api/pipeline/status
GET /api/pipeline/runs
GET /api/sources
 ↓
FastAPI
 ↓
SQLite
 ↓
JSON Response
 ↓
React

⸻

13. Error Handling

Errors must be isolated by source where possible.

Example:

Customer Source → SUCCESS
Product Source → SUCCESS
Transaction Source → FAILED

The pipeline should become:

PARTIAL_SUCCESS

rather than automatically becoming:

FAILED

unless the failure prevents the pipeline from producing a valid result.

⸻

14. Configuration

Configuration must be centralized.

Use environment variables.

Example:

DATABASE_URL=sqlite:///./data/pipeline.db
AWS_REGION=ap-southeast-2
S3_BUCKET_NAME=
API_HOST=0.0.0.0
API_PORT=8000

Never hardcode secrets.

⸻

15. Deployment Model

Local development:

React → localhost:5173
FastAPI → localhost:8000
SQLite → local file
S3 → optional AWS bucket

Docker support may be added after the application works locally.

Do not introduce unnecessary infrastructure before the core application is functional.