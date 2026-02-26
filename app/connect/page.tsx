'use client';

import { useState } from 'react';

export default function ConnectPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/instagram/url');
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Failed to get auth url');
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error');
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <div className="card" style={{ maxWidth: 720 }}>
        <h1 style={{ marginTop: 0 }}>Instagram連携</h1>
        <p className="muted">
          Business / Creator アカウントを接続して、フォロワー獲得向けのインサイトを日次保存します。
        </p>
        {error && <div className="notice error">{error}</div>}
        <button className="button" onClick={connect} disabled={loading}>
          {loading ? '認証URLを生成中...' : 'Instagramで連携する'}
        </button>
      </div>
    </main>
  );
}
