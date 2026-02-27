'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';

const checklist = [
  'META_REDIRECT_URI が本番URL + /api/auth/instagram/callback と完全一致している',
  'INSTAGRAM_OAUTH_AUTHORIZE_URL は https://www.instagram.com/oauth/authorize',
  'INSTAGRAM_OAUTH_TOKEN_URL は https://api.instagram.com/oauth/access_token',
  'Meta Developer の Instagram Login 設定に Redirect URI を登録済み'
];

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
    <main className="page connect-center">
      <Card style={{ maxWidth: 760 }}>
        <h1 style={{ marginTop: 0 }}>思考の取説ノート｜つき 🌙</h1>
        <p className="muted">Instagramのインサイトを自動で取得・分析します</p>

        {error && (
          <div className="notice error">
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Meta Developer設定を確認してください</div>
            <div>{error}</div>
            <ul style={{ marginTop: 8, paddingLeft: 18 }}>
              {checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <button className="button-primary" onClick={connect} disabled={loading}>
          {loading ? '認証URLを生成中...' : 'Instagramで連携する'}
        </button>
      </Card>
    </main>
  );
}
