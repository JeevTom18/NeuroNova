/** Skeleton loader — animated shimmer placeholder */
export default function SkeletonLoader({ lines = 3, heights = [] }) {
  return (
    <div style={{ padding: '8px 0' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            height: heights[i] || 14,
            marginBottom: i < lines - 1 ? 12 : 0,
            width: `${60 + (i % 3) * 15}%`,
          }}
        />
      ))}
    </div>
  );
}
