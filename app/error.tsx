'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="page">
      <div className="notice error" style={{ maxWidth: 760 }}>
        <h2 style={{ marginTop: 0 }}>データの取得に失敗しました</h2>
        <p style={{ marginBottom: 12 }}>しばらくしてから再試行してください。</p>
        <p className="muted tiny" style={{ marginBottom: 12 }}>{error.message}</p>
        <button className="button-primary" onClick={reset}>再試行</button>
      </div>
    </main>
  );
}
