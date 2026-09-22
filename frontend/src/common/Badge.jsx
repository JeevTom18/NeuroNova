/** Status badge with dot indicator */
export default function Badge({ children, type = 'info', dot = false }) {
  return (
    <span className={`badge badge-${type}`} data-testid={`badge-${type}`}>
      {dot && (
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: 'currentColor', flexShrink: 0,
        }} />
      )}
      {children}
    </span>
  );
}
