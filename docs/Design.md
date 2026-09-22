# UI/UX & Technical Design Specification

## Project: Concurrent Data Ingestion Pipeline & Live Dashboard

### 1. Visual Design Philosophy & Aesthetics
The frontend must deliver a sleek, modern, mission-control aesthetic suitable for high-reliability data operations.

- **Theme**: Refined Dark Mode (slate/zinc dark palette with luminous accent lights).
- **Typography**: Clean sans-serif (`Inter`, `Plus Jakarta Sans`, or `Outfit`) with monospaced accents (`JetBrains Mono` / `Fira Code`) for IDs, timestamps, and JSON payloads.
- **Visual Texture**: Glassmorphism (`backdrop-blur-md`), subtle borders (`1px solid rgba(255, 255, 255, 0.08)`), glowing indicator dots for live status, and crisp micro-interactions.
- **Color Tokens**:
  - `Background Base`: `#0a0d14` (Deep obsidian)
  - `Surface Elevated`: `#121722` (Card surface with subtle border)
  - `Surface Glass`: `rgba(18, 23, 34, 0.75)`
  - `Accent Primary`: `#3b82f6` / `#60a5fa` (Electric Blue)
  - `Success`: `#10b981` (Emerald Green)
  - `Warning / Partial`: `#f59e0b` (Amber Gold)
  - `Danger / Failure`: `#ef4444` (Coral Red)
  - `Text Primary`: `#f8fafc`
  - `Text Muted`: `#94a3b8`

---

### 2. Frontend Component Architecture

```
frontend/src/
├── components/
│   ├── layout/
│   │   ├── Header.jsx             # Brand logo, global system clock, health status indicator
│   │   └── Container.jsx          # Max-width layout wrapper with fluid padding
│   ├── dashboard/
│   │   ├── MetricCard.jsx         # Total Ingested, Deduplicated, Success Rate, Active State
│   │   ├── SourceHealthGrid.jsx   # Grid of 3 source cards (Customer, Product, Transaction)
│   │   ├── SourceCard.jsx         # Individual source latency, status pulse, record count
│   │   ├── PipelineControls.jsx   # Trigger button, simulated failure toggle, live status
│   │   ├── RunHistoryTable.jsx    # Table of runs with badges, duration, S3 upload status
│   │   └── RecordExplorer.jsx     # Filterable list/table of latest canonical records
│   └── common/
│       ├── Badge.jsx              # Status tag component (SUCCESS, PARTIAL, FAILED, RUNNING)
│       ├── Modal.jsx              # Record inspector / run detail drawer
│       └── SkeletonLoader.jsx     # Sleek skeleton states during fetch
├── services/
│   └── api.js                     # Centralized Axios/fetch client communicating with FastAPI
├── hooks/
│   ├── usePipeline.js             # Polling & trigger hook for pipeline runs
│   └── useSources.js              # Hook for source health states
├── App.jsx                        # Layout composition & state orchestration
├── index.css                      # Core design system tokens, typography, glassmorphism utilities
└── main.jsx                       # Entry point
```

---

### 3. Dashboard Layout & UX Flow

#### 3.1 Header
- Brand badge: **Acentra Ingestion Core**
- Real-time backend status badge (`CONNECTED` / `OFFLINE`)
- Trigger button with pulse animation when running (`Trigger Pipeline Run`)

#### 3.2 Key Metrics Row (4 Cards)
1. **Total Records Ingested**: Lifetime/session cumulative volume + delta.
2. **Deduplication Rate**: Percentage and absolute count of pruned duplicates.
3. **Pipeline Health**: Ratio of `SUCCESS` + `PARTIAL_SUCCESS` vs total runs.
4. **Active State**: Shows idle, fetching sources, normalizing, or uploading to S3.

#### 3.3 Source Health Matrix
3 equal-width interactive cards:
- **Customer Source**: Status indicator (Green pulse = Healthy, Orange = Degraded, Red = Failed), simulated latency badge (e.g. `240ms`), records yielded.
- **Product Source**: Similar metrics tailored to product entity.
- **Transaction Source**: Similar metrics tailored to transaction event stream.

#### 3.4 Live Ingestion History & Inspector
- **Run History Table**:
  - Columns: Run ID, Started At, Duration, Sources Completed (e.g., 3/3 or 2/3), Total Records, Duplicates, Status Badge, S3 Status, Actions (View JSON).
- **Recent Canonical Records Explorer**:
  - Interactive table showing ingested records with syntax-highlighted JSON viewer modal.

---

### 4. Technical Specifications & API Contract

#### 4.1 FastAPI Backend Endpoints
- **POST `/api/pipeline/run`**
  - Payload: `{ "simulate_failure": null | "customer" | "product" | "transaction" }`
  - Response: Pipeline run summary object.
- **GET `/api/pipeline/status`**
  - Response: `{ "is_running": boolean, "current_run_id": string | null, "stage": string }`
- **GET `/api/pipeline/runs`**
  - Query params: `limit=20`, `offset=0`
  - Response: List of historical run records.
- **GET `/api/sources`**
  - Response: Array of source health statistics.
- **GET `/api/records`**
  - Query params: `source`, `entity_type`, `limit=50`
  - Response: List of canonical records.

---

### 5. Interaction States & Transitions
- **Idle State**: Trigger button is ready with hover glow.
- **Running State**: Button displays rotating spinner and disabled state; progress pill flashes current stage (`Ingesting` -> `Normalizing` -> `Deduplicating` -> `Archiving`).
- **Partial Failure Notification**: Soft amber alert banner highlighting which source failed while confirming that remaining records were successfully persisted.
- **Toast Notifications**: Lightweight toast banners for success/error events.
