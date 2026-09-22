# Engineering Standards & Project Rules

## Project: Concurrent Data Ingestion Pipeline & Live Dashboard

### 1. Architectural Principles
1. **Separation of Concerns (SoC)**:
   - **API Layer (`backend/app/api/`)**: Handle HTTP serialization, parameter validation, and status codes. Absolutely no pipeline business logic inside endpoints.
   - **Pipeline Layer (`backend/app/pipeline/`)**: Coordinate source execution, stage transitions, and execution metadata.
   - **Processing Layer (`backend/app/processing/`)**: Pure functions or stateless classes for Normalization, Validation, and Deduplication.
   - **Storage Layer (`backend/app/database/` & `backend/app/aws/`)**: Manage I/O boundaries (SQLite ORM/SQLAlchemy & S3 Boto3).

2. **Single Responsibility Principle (SRP)**:
   - Every file must have one clear reason to change. Data sources do not persist data; normalizers do not query databases.

---

### 2. Concurrency & Async Rules
- **No Blocking Calls in Event Loop**:
  - All external or simulated calls must use `await asyncio.sleep()` rather than `time.sleep()`.
  - Blocking libraries (like synchronous `boto3` or synchronous file I/O) must be run via `asyncio.to_thread` or executed outside critical async ingestion tasks.
- **Fail-Safe Aggregation**:
  - Concurrent source execution MUST use:
    ```python
    results = await asyncio.gather(*tasks, return_exceptions=True)
    ```
  - Unhandled exceptions from individual sources must be inspected, logged, and categorized into source failure states rather than bubbling up to crash the pipeline.
- **No Uncontrolled Concurrency**:
  - Do not spawn unbounded background tasks without state tracking.

---

### 3. Data Integrity & Normalization Rules
1. **Canonical Model Primacy**:
   - Downstream components (deduplication, DB storage, S3 export) must NEVER consume raw source dicts. They must strictly accept `CanonicalRecord` Pydantic models.
2. **Deterministic Deduplication**:
   - The primary deduplication key must be deterministic:
     `hash_key = f"{source}:{entity_type}:{record_id}"`
   - Every dropped duplicate must increment `duplicate_records` counter in `pipeline_runs`.
3. **No Silent Discards**:
   - If a record fails validation, it must be recorded in the run summary error log with the cause of rejection.

---

### 4. Code Quality & Typing
- **Python**:
  - Python 3.11+ syntax.
  - Strict type annotations on all function signatures (`pydantic` schemas, `typing.Optional`, `typing.List`, `typing.Dict`).
  - Follow PEP 8 guidelines.
- **JavaScript / React**:
  - Clean component decomposition.
  - No bloated monolith components (> 200 lines should be refactored into smaller subcomponents).
  - Use modern semantic HTML with descriptive, unique `id` and `data-testid` attributes.
  - Proper error boundaries and fallback states (loading skeletons, empty states).

---

### 5. Error Handling & Partial Success
- A run with 3 sources where 1 fails is **NOT** a failure; it is marked `PARTIAL_SUCCESS`.
- A run is only `FAILED` if:
  - All sources fail, or
  - A fatal unrecoverable error occurs in normalization/persistence engine.
- Every API endpoint must return standardized error JSON schemas with human-readable error messages.

---

### 6. Secrets & Environment Configuration
- Never commit `.env` files containing secrets or real AWS credentials.
- Provide `.env.example` documenting all configuration keys:
  - `DATABASE_URL=sqlite:///./data/pipeline.db`
  - `AWS_REGION=us-east-1`
  - `AWS_ACCESS_KEY_ID=`
  - `AWS_SECRET_ACCESS_KEY=`
  - `S3_BUCKET_NAME=`
  - `API_PORT=8000`
  - `VITE_API_URL=http://localhost:8000`
- The system must function completely in local mode when AWS keys/buckets are absent (S3 export will be marked `SKIPPED`).
