'use client';

import { useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import { CONTENT_ROLE_OPTIONS, SERIES_OPTIONS, SERIES_LABEL_MAP } from '@/lib/constants';

type PostRow = {
  id: string;
  title: string;
  caption: string | null;
  posted_at: string | null;
  media_type: string | null;
  series: string | null;
  content_role: string | null;
  slide_count: number | null;
  ai_confidence: number | null;
  ai_reason: string | null;
  save_rate: number | null;
  reach: number | null;
};

function pct(value: number | null) {
  if (value == null) return '-';
  return `${(value * 100).toFixed(1)}%`;
}

export default function PostsPage() {
  const [rows, setRows] = useState<PostRow[]>([]);
  const [seriesFilter, setSeriesFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [progress, setProgress] = useState<string>('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/posts');
    const data = (await res.json()) as { posts: PostRow[] };
    setRows(data.posts ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function updatePost(id: string, patch: Partial<PostRow>) {
    await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  async function classifyOne(row: PostRow) {
    await fetch('/api/posts/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: row.id, caption: row.caption, title: row.title })
    });
    await load();
  }

  async function classifyBulk() {
    const targets = rows.filter((row) => !row.series);
    if (targets.length === 0) return;

    setBulkBusy(true);
    for (let i = 0; i < targets.length; i += 1) {
      setProgress(`分類中... ${i + 1}/${targets.length}件`);
      await classifyOne(targets[i]);
    }
    setProgress('');
    setBulkBusy(false);
  }

  const filtered = useMemo(
    () => rows.filter((row) => (seriesFilter === 'all' ? true : row.series === seriesFilter)),
    [rows, seriesFilter]
  );

  return (
    <main className="page">
      <div className="header-row">
        <div>
          <div className="badge">Posts</div>
          <h1 className="title" style={{ fontSize: 32 }}>投稿一覧・シリーズ編集</h1>
        </div>
        <div className="actions">
          <button className="button-secondary" onClick={() => void load()} disabled={loading}>再読込</button>
          <button className="button-primary" onClick={() => void classifyBulk()} disabled={bulkBusy || rows.length === 0}>
            未分類を一括分類
          </button>
        </div>
      </div>

      {progress && <div className="notice">{progress}</div>}

      <Card>
        <div className="filter-row">
          <select className="select" value={seriesFilter} onChange={(e) => setSeriesFilter(e.target.value)}>
            <option value="all">全シリーズ</option>
            {SERIES_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>投稿日</th>
                <th>タイトル</th>
                <th>シリーズ</th>
                <th>コンテンツ種別</th>
                <th>保存率</th>
                <th>分類ステータス</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td>{row.posted_at?.slice(0, 10) ?? '-'}</td>
                  <td style={{ minWidth: 320 }}>{row.title}</td>
                  <td>
                    <select
                      className="select"
                      value={row.series ?? ''}
                      onChange={(e) => {
                        void updatePost(row.id, { series: e.target.value || null });
                      }}
                    >
                      <option value="">未設定</option>
                      {SERIES_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="select"
                      value={row.content_role ?? ''}
                      onChange={(e) => {
                        void updatePost(row.id, { content_role: e.target.value || null });
                      }}
                    >
                      <option value="">未設定</option>
                      {CONTENT_ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>{pct(row.save_rate)}</td>
                  <td>
                    {!row.series ? (
                      <span className="pill" style={{ background: '#CBD5E1', color: '#334155' }}>分類中...</span>
                    ) : row.ai_confidence != null && row.ai_confidence < 0.6 ? (
                      <span className="pill" title={row.ai_reason ?? ''}>
                        {SERIES_LABEL_MAP[row.series] ?? row.series} ?
                      </span>
                    ) : (
                      <span className="pill series">{SERIES_LABEL_MAP[row.series] ?? row.series}</span>
                    )}
                  </td>
                  <td>
                    <button className="button-secondary" onClick={() => void classifyOne(row)}>
                      AI分類に戻す
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted">投稿データがありません。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
