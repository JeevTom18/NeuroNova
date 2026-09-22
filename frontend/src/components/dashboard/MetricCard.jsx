/** Premium KPI MetricCard with gradient accent bar, glow, and countUp animation */
import { memo, useEffect, useRef, useState } from 'react';

const MetricCard = memo(function MetricCard({
  label, value, subtext, icon, color = 'var(--accent)', trend
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="card metric-card"
      data-testid={`metric-${label.toLowerCase().replace(/\s+/g, '-')}`}
      style={{ '--card-accent': color }}
    >
      {/* Icon */}
      <div className="metric-icon" style={{ background: `${color}18` }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
      </div>

      <div className="metric-label">{label}</div>

      <div
        className="metric-value"
        style={{
          color,
          animation: visible ? 'countUp 0.35s ease both' : 'none',
        }}
      >
        {value}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {subtext && <div className="metric-sub">{subtext}</div>}
        {trend != null && (
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: trend >= 0 ? 'var(--success)' : 'var(--danger)',
          }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
});

export default MetricCard;
