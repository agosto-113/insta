'use client';

import { useState } from 'react';

export default function CopyWeeklyReportButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function onCopy() {
    if (loading) return;
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch('/api/report/weekly');
      const data = (await response.json()) as { text?: string; error?: string };
      if (!response.ok || !data.text) {
        throw new Error(data.error ?? 'レポート生成に失敗しました');
      }
      await navigator.clipboard.writeText(data.text);
      setStatus('週次レポートをコピーしました');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'copy_failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button className="button-secondary" type="button" onClick={onCopy} disabled={loading}>
        {loading ? '生成中...' : '週次レポートをコピー'}
      </button>
      {status && <div className="muted tiny" style={{ marginTop: 6 }}>{status}</div>}
    </div>
  );
}
