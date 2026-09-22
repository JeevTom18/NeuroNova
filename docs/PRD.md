# Product Requirements Document (PRD)

## Project: Concurrent Data Ingestion Pipeline & Live Dashboard

### 1. Executive Summary
The system is a high-throughput, concurrent data ingestion pipeline coupled with a real-time reactive web dashboard. It ingests data concurrently from multiple heterogeneous sources (Customer, Product, Transaction), normalizes them into a canonical model, validates and deduplicates records, persists them into SQLite, and optionally exports processed batches to AWS S3. A FastAPI REST interface powers the pipeline orchestration and serves metrics to a modern React dashboard.

---

### 2. Goals & Objectives
- **Concurrent Ingestion**: Maximize throughput using Python's `asyncio.gather(..., return_exceptions=True)` to fetch data simultaneously without blocking.
- **Resilience & Fault Tolerance**: Isolate failures. A failure in one data source must result in `PARTIAL_SUCCESS`, preserving healthy ingestions rather than failing the entire run.
- **Data Quality**: Ensure end-to-end normalization, schema validation, and deterministic deduplication before database insertion and S3 archival.
- **Real-Time Visibility**: Provide instant monitoring via a React dashboard showing pipeline execution status, per-source health, record statistics, and execution history.
- **Configurable Cloud Archival**: Seamlessly export normalized data batches to AWS S3 while providing graceful fallback when AWS credentials/buckets are unconfigured.

---

### 3. User Personas & Use Cases
- **Data Operations Engineer**:
  - Triggers pipeline runs manually or via scheduled calls.
  - Monitors throughput, duplicate ratios, and source health metrics.
  - Analyzes historical runs and inspects failure logs for degraded sources.
- **System Administrator / Developer**:
  - Configures environment variables (`DATABASE_URL`, AWS credentials, API host/port).
  - Verifies system health endpoints and verifies database persistence.

---

### 4. Functional Requirements

#### 4.1 Ingestion Engine
- **FR-1.1**: Concurrently query three distinct sources:
  - `customer_source`: Generates customer profile records.
  - `product_source`: Generates product inventory/catalog items.
  - `transaction_source`: Generates financial/order event records.
- **FR-1.2**: Implement simulated latency (I/O wait) and configurable fault injection to verify resilience.
- **FR-1.3**: Common abstract interface `DataSource` enforcing `fetch() -> list[dict]`.

#### 4.2 Data Processing Layer
- **FR-2.1 Normalization**: Convert varied source schemas into a unified Canonical Record:
  - `record_id`: string
  - `source`: string
  - `entity_type`: string (`customer` | `product` | `transaction`)
  - `name`: string
  - `email`: string (or primary contact/identifier)
  - `timestamp`: ISO-8601 UTC string
  - `payload`: dictionary of raw/additional attributes
- **FR-2.2 Validation**: Verify required fields, timestamp integrity, and email/identifier formats. Filter invalid records and record validation errors.
- **FR-2.3 Deduplication**: Compute deterministic business keys (`source + entity_type + record_id`). Deduplicate within the batch and track duplicate metrics without silent data loss.

#### 4.3 Persistence & Storage
- **FR-3.1 Database (SQLite)**:
  - Store normalized records in `records` table.
  - Maintain historical executions in `pipeline_runs` table (`run_id`, `status`, `duration`, `total_records`, `processed_records`, `duplicate_records`, `failed_records`, `s3_status`).
  - Maintain operational metrics per source in `source_status` table (`status`, `last_attempt`, `last_success`, `records_received`, `last_error`).
- **FR-3.2 Cloud Export (AWS S3)**:
  - Export processed batches as JSON/Parquet into designated S3 bucket.
  - Non-blocking execution (run boto3 calls asynchronously or via thread pool executor).
  - Gracefully flag `s3_status` as `SKIPPED` or `FAILED` if credentials/bucket are not provided, without failing database persistence.

#### 4.4 REST API (FastAPI)
- `POST /api/pipeline/run`: Triggers a new ingestion run asynchronously.
- `GET /api/pipeline/status`: Returns current pipeline status and active run progress.
- `GET /api/pipeline/runs`: Lists historical pipeline runs with filtering and pagination.
- `GET /api/sources`: Retrieves status, last health check, and metrics for all 3 data sources.
- `GET /api/records`: Queries persisted records with filtering by source/entity type.
- `GET /api/health`: Healthcheck endpoint for infrastructure monitoring.

#### 4.5 Web Dashboard (React + Vite)
- **FR-5.1 Control Center**: Manual trigger button with loading animations and run progress.
- **FR-5.2 Real-Time Status Cards**: Total records ingested, duplicates detected, success rate, and active pipeline state.
- **FR-5.3 Source Health Matrix**: Dedicated status cards for Customer, Product, and Transaction sources indicating online/degraded/offline state.
- **FR-5.4 Historical Runs Table**: Interactive table with sorting, status badges (`SUCCESS`, `PARTIAL_SUCCESS`, `FAILED`), and detail drill-down.
- **FR-5.5 Live Record Explorer**: Searchable and filterable table displaying processed canonical records.

---

### 5. Non-Functional Requirements
- **Performance**: P95 pipeline cycle under 2 seconds for mock batch sizes of 1,000 records.
- **Reliability**: Pipeline never crashes on malformed source payloads or unreachable sources.
- **Maintainability**: Strict separation between API routes, orchestration services, processing stages, and data access objects.
- **Security**: No hardcoded API keys or AWS credentials; 100% configuration via environment variables.

---

### 6. Success Metrics
- **Pipeline Availability**: 99.9% uptime of API server.
- **Zero Silent Failures**: 100% of rejected or duplicate records are accounted for in the metrics.
- **Partial Failure Handling**: If 1 source fails, remaining 2 sources persist 100% of valid records.
