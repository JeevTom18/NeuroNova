/** Filterable canonical records explorer with JSON inspector modal (Design.md §3.4, §5.5) */
import { memo, useState } from 'react';
import Modal from '../../common/Modal';
import SkeletonLoader from '../../common/SkeletonLoader';
import { highlightJson } from '../../common/jsonHighlight';

const TYPE_COLORS = {
  customer:    { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  product:     { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  transaction: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
};

function RecordJsonModal({ record, onClose }) {
  if (!record) return null;
  const pretty = JSON.stringify(record, null, 2);
  const typeStyle = TYPE_COLORS[record.entity_type] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' };

  return (
    <Modal isOpen={Boolean(record)} onClose={onClose} title={`Record: ${record.record_id}`} size="lg">
      <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span
          style={{
            padding: '3px 10px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: typeStyle.color,
            background: typeStyle.bg,
            border: `1px solid ${typeStyle.color}33`,
          }}
        >
          {record.entity_type}
        </span>
        <span className="chip">Source: {record.source}</span>
        {record.name && <span className="chip">Name: {record.name}</span>}
      </div>
      <pre
        className="mono code-block"
        data-testid="record-json"
        style={{ maxHeight: '55vh' }}
        dangerouslySetInnerHTML={{ __html: highlightJson(pretty) }}
      />
    </Modal>
  );
}

const RecordExplorer = memo(function RecordExplorer({ records, loading }) {
  const [filterSource, setFilterSource] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const visible = (records || []).filter(r => {
    const matchSource = !filterSource || r.source === filterSource;
    const matchType = !filterType || r.entity_type === filterType;
    const matchSearch =
      !searchTerm ||
      (r.record_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchSource && matchType && matchSearch;
  });

  const sources = [...new Set((records || []).map(r => r.source))];
  const types = [...new Set((records || []).map(r => r.entity_type))];

  return (
    <section className="card" style={{ padding: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="section-title" style={{ margin: 0 }}>
            Canonical Record Explorer
            <span>({visible.length} displayed)</span>
          </h2>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Unified view of normalized entities across all ingested streams
          </p>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 220 }}>
            <input
              type="text"
              placeholder="Search ID, name, email…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input"
              data-testid="record-search"
              style={{ paddingLeft: 30 }}
            />
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, fontSize: 13 }}>
              🔍
            </span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                ×
              </button>
            )}
          </div>

          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            className="input"
            style={{ width: 140 }}
            data-testid="source-filter"
          >
            <option value="">All Sources</option>
            {sources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="input"
            style={{ width: 130 }}
            data-testid="type-filter"
          >
            <option value="">All Types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <SkeletonLoader lines={6} />
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <p>
            {records?.length
              ? 'No records matching your current filter criteria.'
              : 'No records ingested yet. Click "Run Pipeline" to start ingesting streams.'}
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table data-testid="record-explorer-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Entity Type</th>
                <th>Source</th>
                <th>Name</th>
                <th>Email</th>
                <th>Timestamp</th>
                <th>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {visible.slice(0, 50).map(rec => {
                const typeStyle = TYPE_COLORS[rec.entity_type] || { color: 'var(--text-secondary)', bg: 'rgba(255,255,255,0.05)' };
                return (
                  <tr key={rec.id} data-testid={`record-${rec.id}`}>
                    <td className="mono" style={{ color: 'var(--accent-hover)', fontWeight: 600 }}>
                      {rec.record_id}
                    </td>
                    <td>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: typeStyle.color,
                        background: typeStyle.bg,
                        display: 'inline-block',
                      }}>
                        {rec.entity_type}
                      </span>
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{rec.source}</td>
                    <td style={{ fontWeight: rec.name ? 500 : 400, color: rec.name ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {rec.name || '—'}
                    </td>
                    <td className="mono" style={{ fontSize: 12, color: rec.email ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                      {rec.email || '—'}
                    </td>
                    <td className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {rec.timestamp ? new Date(rec.timestamp).toLocaleString() : '—'}
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedRecord(rec)}
                        className="btn btn-ghost btn-sm"
                        style={{
                          padding: '3px 8px',
                          fontFamily: 'monospace',
                          fontSize: 12,
                          color: 'var(--accent-hover)',
                        }}
                        title="View Raw JSON"
                      >
                        {'{ }'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedRecord && (
        <RecordJsonModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}
    </section>
  );
});

export default RecordExplorer;