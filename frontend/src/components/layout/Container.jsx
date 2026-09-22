/** Max-width layout wrapper with fluid padding */
export default function Container({ children }) {
  return (
    <div style={{
      maxWidth: 1200,
      margin: '0 auto',
      padding: '0 24px',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {children}
    </div>
  );
}