/** Source Health Matrix — wraps three SourceCards in responsive grid */
import { memo, useMemo } from 'react';
import SourceCard from './SourceCard';

const SOURCE_NAMES = ['customer_source', 'product_source', 'transaction_source'];

// Stable latency values per session (not re-randomized on re-render)
const LATENCY_BASE = { customer_source: 210, product_source: 285, transaction_source: 320 };
const LATENCY_JITTER = { customer_source: 80, product_source: 130, transaction_source: 170 };

const SourceHealthGrid = memo(function SourceHealthGrid({ sources }) {
  const sourceMap = useMemo(() => {
    const map = {};
    (sources || []).forEach(s => { map[s.source_name] = s; });
    return map;
  }, [sources]);

  const latencyMap = useMemo(() => {
    const m = {};
    SOURCE_NAMES.forEach(n => {
      m[n] = LATENCY_BASE[n] + Math.floor(Math.random() * LATENCY_JITTER[n]);
    });
    return m;
  }, []);

  return (
    <div className="source-grid" data-testid="source-health-grid">
      {SOURCE_NAMES.map(name => {
        const d = sourceMap[name];
        return (
          <SourceCard
            key={name}
            name={name}
            status={d?.status || null}
            records_received={d?.records_received || 0}
            last_error={d?.last_error || null}
            latency_ms={latencyMap[name]}
          />
        );
      })}
    </div>
  );
});

export default SourceHealthGrid;