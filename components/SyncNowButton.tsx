'use client';

import { useState } from 'react';

type SyncResponse = {
  count: number;
  date: string;
};

export default function SyncNowButton() {
  const [loading, setLoading] = useState(false);

  async function onSync() {
    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch('/api/instagram/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const raw = await response.text();
      const parsed = raw ? (JSON.parse(raw) as SyncResponse & { error?: string }) : null;

      if (!response.ok) {
        throw new Error(parsed?.error ?? `Sync failed (${response.status})`);
      }

      window.location.href = `/?synced=1&count=${parsed?.count ?? 0}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'sync_error';
      window.location.href = `/?error=${encodeURIComponent(message)}`;
    }
  }

  return (
    <button className="button" type="button" onClick={onSync} disabled={loading}>
      {loading ? '同期中...' : '今すぐ同期'}
    </button>
  );
}
