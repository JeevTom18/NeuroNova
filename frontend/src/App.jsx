/** Dashboard orchestrator — layout, state, polling, toasts, failure banner (Design.md §3–5) */
import { useCallback, useEffect, useRef, useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import MetricCard from './components/dashboard/MetricCard';
import SourceHealthGrid from './components/dashboard/SourceHealthGrid';
import RunHistoryTable from './components/dashboard/RunHistoryTable';
import RecordExplorer from './components/dashboard/RecordExplorer';
import ToastStack from './common/Toast';
import useSources from './hooks/useSources';
import { api } from './api';

const POLL_INTERVAL = 6000;

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const push = useCallback((type, message) => {
    const id = ++idRef.current;
    setToasts(t => [...t, { id, type, message }]);
  }, []);
  const dismiss = useCallback(id => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);
  return { toasts, push, dismiss };
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState({ is_running: false, stage: 'IDLE', run_id: null });
  const [runs, setRuns] = useState([]);
  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [simFailure, setSimFailure] = useState(null);
  const { toasts, push, dismiss } = useToasts();
  const { sources, refetch: refetchSources } = useSources(POLL_INTERVAL);

  // ── Dashboard data refresh ────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    try {
      const [runsRes, recordsRes, countRes] = await Promise.all([
        api.pipelineRuns({ limit: 25, offset: 0 }),
        api.records({ limit: 60, offset: 0 }),
        api.recordCount(),
      ]);
      setRuns(runsRes || []);
      setRecords(recordsRes || []);
      setTotalRecords(countRes?.total ?? 0);
    } catch (err) {
      console.error('Dashboard refresh failed:', err);
      push('error', 'Failed to refresh dashboard data');
    }
  }, [push]);

  // Initial load + periodic refresh
  useEffect(() => {
    refresh().finally(() => setLoading(false));
    const interval = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  // ── Trigger pipeline run ─────────────────────────────────────────────────
  const handleRun = useCallback(async (failureSource) => {
    setIsRunning(true);
    setStatus({ is_running: true, stage: 'INGESTING', run_id: null });
    try {
      const result = await api.pipelineRun(failureSource);
      const failedSources = (result.sources || []).filter(s => s.status === 'FAILED');
      if (result.status === 'PARTIAL_SUCCESS') {
        push('warning', `Partial success: ${failedSources.map(s => s.source).join(', ')} failed; remaining ${result.processed_records} records were persisted.`);
      } else if (result.status === 'FAILED') {
        push('error', 'Pipeline run failed: all sources encountered errors.');
      } else {
        push('success', `Run ${result.run_id} completed — ${result.processed_records} canonical records persisted.`);
      }
    } catch (err) {
      push('error', `Pipeline run error: ${err.message}`);
    } finally {
      setIsRunning(false);
      setStatus({ is_running: false, stage: 'IDLE', run_id: null });
      await Promise.all([refresh(), refetchSources()]);
    }
  }, [push, refresh, refetchSources]);

  // ── Metrics Calculation (Design.md §3.2) ──────────────────────────────────
  const latestRun = runs[0];
  const dupCount = latestRun?.duplicate_records ?? 0;
  const dedupRate = latestRun && latestRun.total_records
    ? Math.round((dupCount / latestRun.total_records) * 100)
    : 0;
  const healthRate = runs.length
    ? Math.round((runs.filter(r => r.status === 'SUCCESS' || r.status === 'PARTIAL_SUCCESS').length / runs.length) * 100)
    : 100;

  const activeStage = isRunning ? (status?.stage || 'INGESTING') : 'IDLE';
  const stageLabel = {
    IDLE: 'Idle',
    INGESTING: 'Ingesting',
    NORMALIZING: 'Normalizing',
    VALIDATING: 'Validating',
    DEDUPLICATING: 'Deduplicating',
    ARCHIVING: 'Archiving (S3)',
    COMPLETE: 'Complete',
    FAILED: 'Failed',
  }[activeStage] || activeStage;

  return (
    <div className="layout">
      {/* Fixed Left Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <div className="main-content">
        <Topbar
          activeTab={activeTab}
          isRunning={isRunning}
          status={status}
          onRun={handleRun}
          simFailure={simFailure}
          setSimFailure={setSimFailure}
        />

        <main className="page">
          {/* Partial-failure amber banner (Design.md §5) */}
          {latestRun?.status === 'PARTIAL_SUCCESS' && !isRunning && (
            <div
              role="alert"
              className="card"
              data-testid="partial-failure-banner"
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                borderColor: 'rgba(245, 158, 11, 0.3)',
                padding: '14px 20px',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                color: 'var(--warning)',
              }}
            >
              <span style={{ fontSize: 20 }}>⚠</span>
              <div style={{ flex: 1 }}>
                <strong style={{ color: '#fbbf24', fontSize: 14 }}>Partial Ingestion Failure: </strong>
                <span style={{ fontSize: 13.5, color: '#fde68a' }}>
                  Run {latestRun.run_id} completed with ({latestRun.sources_completed || '2/3'}) sources.
                  Graceful degradation allowed {latestRun.processed_records} records to be safely persisted.
                </span>
              </div>
            </div>
          )}

          {/* Key KPI Metrics Row */}
          {(activeTab === 'dashboard' || activeTab === 'pipeline') && (
            <section className="metric-grid" data-testid="metrics-row">
              <MetricCard
                label="Total Records"
                value={totalRecords.toLocaleString()}
                icon="📊"
                subtext={latestRun ? `+${latestRun.processed_records} in last run` : 'No runs executed'}
                color="var(--accent)"
              />
              <MetricCard
                label="Deduplication"
                value={`${dedupRate}%`}
                icon="🔍"
                subtext={`${dupCount} duplicates eliminated`}
                color="var(--warning)"
              />
              <MetricCard
                label="Pipeline Health"
                value={`${healthRate}%`}
                icon="🛡"
                subtext={`${runs.length} total run${runs.length === 1 ? '' : 's'} recorded`}
                color="var(--success)"
              />
              <MetricCard
                label="Active State"
                value={stageLabel}
                icon={isRunning ? '⚡' : '💤'}
                subtext={isRunning ? 'Processing concurrent streams' : 'Ready for execution'}
                color={isRunning ? 'var(--accent-hover)' : 'var(--text-secondary)'}
              />
            </section>
          )}

          {/* Views based on active tab */}
          {activeTab === 'dashboard' && (
            <>
              <div style={{ marginBottom: 24 }}>
                <h2 className="section-title">
                  Source Health Matrix <span>(3 Ingestion Streams)</span>
                </h2>
                <SourceHealthGrid sources={sources} />
              </div>
              <RunHistoryTable runs={runs} loading={loading} />
              <RecordExplorer records={records} loading={loading} />
            </>
          )}

          {activeTab === 'pipeline' && (
            <RunHistoryTable runs={runs} loading={loading} />
          )}

          {activeTab === 'sources' && (
            <div style={{ marginBottom: 24 }}>
              <h2 className="section-title">
                Active Ingestion Sources Matrix
              </h2>
              <SourceHealthGrid sources={sources} />
            </div>
          )}

          {activeTab === 'records' && (
            <RecordExplorer records={records} loading={loading} />
          )}
        </main>
      </div>

      {/* Floating Notifications */}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}