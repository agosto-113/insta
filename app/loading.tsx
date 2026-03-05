export default function Loading() {
  return (
    <main className="page">
      <div className="header-row">
        <div style={{ width: 320, height: 26 }} className="skeleton" />
        <div style={{ width: 220, height: 38 }} className="skeleton" />
      </div>

      <section className="kpi-grid" style={{ marginTop: 12 }}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="card-base" style={{ padding: 24, border: '1px solid #E7DCCB', borderRadius: 12, background: '#FFFBF5' }}>
            <div style={{ width: '55%', height: 14, marginBottom: 12 }} className="skeleton" />
            <div style={{ width: '40%', height: 30 }} className="skeleton" />
          </div>
        ))}
      </section>

      <div className="grid-2" style={{ marginTop: 12 }}>
        <div className="card-base" style={{ padding: 24, border: '1px solid #E7DCCB', borderRadius: 12, background: '#FFFBF5', minHeight: 260 }}>
          <div style={{ width: '50%', height: 14, marginBottom: 14 }} className="skeleton" />
          <div style={{ width: '100%', height: 180 }} className="skeleton" />
        </div>
        <div className="card-base" style={{ padding: 24, border: '1px solid #E7DCCB', borderRadius: 12, background: '#FFFBF5', minHeight: 260 }}>
          <div style={{ width: '55%', height: 14, marginBottom: 14 }} className="skeleton" />
          <div style={{ width: '100%', height: 180 }} className="skeleton" />
        </div>
      </div>
    </main>
  );
}
