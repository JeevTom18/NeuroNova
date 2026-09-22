/** Mini SVG sparkline chart for run history visualization */
import { memo } from 'react';

const MiniChart = memo(function MiniChart({ runs, width = 160, height = 36 }) {
  if (!runs || runs.length < 2) return null;

  const values = runs.slice(0, 15).reverse().map(r => r.processed_records ?? 0);
  const max = Math.max(...values, 1);
  const step = width / (values.length - 1);

  const pts = values.map((v, i) => {
    const x = i * step;
    const y = height - (v / max) * (height - 6) - 3;
    return [x, y];
  });

  const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const fill = [...pts, [width, height], [0, height]].map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fill} fill="url(#sg)" />
      <path d={d} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill="#3b82f6" />
    </svg>
  );
});

export default MiniChart;
