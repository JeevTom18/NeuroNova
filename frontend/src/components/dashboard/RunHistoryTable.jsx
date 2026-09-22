/** Run history table with badges, duration, S3 status, and View JSON drawer (Design.md §3.4) */
import { memo, useState } from 'react';
import Badge from '../../common/Badge';
import Modal from '../../common/Modal';
import SkeletonLoader from '../../common/SkeletonLoader';
import MiniChart from './MiniChart';
import { highlightJson } from '../../common/jsonHighlight';

const statusBadgeType = (status) => {
  if (status === 'SUCCESS') return 'success';
  if (status === 'PARTIAL_SUCCESS') return 'warning';
  if (status === 'FAILED') return 'danger';
  return 'info';
};

const s3Color = (s3) => {
  if (s3 === 'SUCCESS') return 'var(--success)';
  if (s3 === 'SKIPPED') return 'var(--text-muted)';
  if (s3 === 'FAILED') return 'var(--danger)';
  return 'var(--text-secondary)';
};

function RunJsonModal({ run, onClose }) {
  if (!run) return null;
  const pretty = JSON.stringify(run, (key, value) => (value === undefined ? null : value), 2);
  return (
    <Modal isOpen={Boolean(run)} onClose={onClose} title={`Run Details: ${run.run_id}`} size="lg">
      <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Badge type={statusBadgeType(run.status)}>{run.status}</Badge>
        <span className="chip mono">{run.duration_seconds != null ? `${run.duration_seconds.toFixed(2)}s` : '—'}</span>
        <span className="chip">Sources: {run.sources_completed || '—'}</span>
        <span className="chip">S3: {run.s3_status || '—'}</span>
      </div>
      <pre
        className="mono code-block"
        data-testid="run-json"
        style={{ maxHeight: '55vh' }}
        dangerouslySetInnerHTML={{ __html: highlightJson(pretty) }}
      />
    </Modal>
  );
}

const RunHistoryTable = memo(function RunHistoryTable({ runs, loading }) {
  const [selectedRun, setSelectedRun] = useState(null);

  return (
    <section className="card" style={{ padding: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="section-title" style={{ margin: 0 }}>
            Pipeline Run History
            {runs?.length > 0 && <span>({runs.length} runs)</span>}
          </h2>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Historical audit log of ingestion executions, source resolutions, and S3 archives
          </p>
        </div>
        {runs && runs.length >= 2 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Volume Trend</span>
            <MiniChart runs={runs} width={120} height={28} />
          </div>
        )}
      </div>

      {loading ? (
        <SkeletonLoader lines={5} />
      ) : !runs || runs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📜</div>
          <p>No pipeline runs yet. Trigger a run from the topbar to see execution history here.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table data-testid="run-history-table">
            <thead>
              <tr>
                <th>Run ID</th>
                <th>Started At</th>
                <th>Duration</th>
                <th>Sources</th>
                <th>Total</th>
                <th>Duplicates</th>
                <th>Failed</th>
                <th>Status</th>
                <th>S3 Archive</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {runs.map(run => (
                <tr key={run.run_id} data-testid={`run-${run.run_id}`}>
                  <td className="mono" style={{ color: 'var(--accent-hover)', fontWeight: 600 }}>
                    {run.run_id}
                  </td>
                  <td className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {run.started_at ? new Date(run.started_at).toLocaleString() : '—'}
                  </td>
                  <td className="mono" style={{ fontSize: 12.5 }}>
                    {run.duration_seconds != null ? `${run.duration_seconds.toFixed(2)}s` : '—'}
                  </td>
                  <td>
                    <span className="mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {run.sources_completed || '—'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{run.total_records ?? 0}</td>
                  <td style={{ color: run.duplicate_records ? 'var(--warning)' : 'var(--text-muted)' }}>
                    {run.duplicate_records ?? 0}
                  </td>
                  <td style={{ color: run.failed_records ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {run.failed_records ?? 0}
                  </td>
                  <td>
                    <Badge type={statusBadgeType(run.status)}>{run.status}</Badge>
                  </td>
                  <td>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: 'JetBrains Mono, monospace',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: s3Color(run.s3_status),
                    }}>
                      {run.s3_status || '—'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedRun(run)}
                      className="btn btn-ghost btn-sm"
                      style={{
                        padding: '4px 10px',
                        fontSize: 11.5,
                        borderColor: 'rgba(59,130,246,0.3)',
                        color: 'var(--accent-hover)',
                        background: 'var(--accent-soft)',
                      }}
                    >
                      View JSON
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedRun && <RunJsonModal run={selectedRun} onClose={() => setSelectedRun(null)} />}
    </section>
  );
});

export default RunHistoryTable;