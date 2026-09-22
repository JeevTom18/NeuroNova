/** Centralized API client — maps to FastAPI backend endpoints (Design.md §4.1) */
const BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const url = `${BASE}${path}`;
  const headers = { 'Accept': 'application/json', ...options.headers };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw Object.assign(new Error(`HTTP ${res.status}: ${text}`), { status: res.status });
  }
  return res.json();
}

export const api = {
  health:        ()       => request('/api/health'),
  pipelineRun:   (source) => request('/api/pipeline/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ simulate_failure: source ?? null }),
  }),
  pipelineStatus: ()      => request('/api/pipeline/status'),
  pipelineRuns:  (p = {}) => request(`/api/pipeline/runs?${new URLSearchParams(p)}`),
  sources:       ()       => request('/api/sources'),
  records:       (p = {}) => request(`/api/records?${new URLSearchParams(p)}`),
  recordCount:   ()       => request('/api/records/count'),
};