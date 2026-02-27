'use client';

import { useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import { CONTENT_ROLE_OPTIONS, SERIES_OPTIONS, CONTENT_ROLE_LABEL_MAP, SERIES_LABEL_MAP } from '@/lib/constants';
import type { PostWithMetrics } from '@/lib/posts';

function int(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '-';
  return new Intl.NumberFormat('ja-JP').format(value);
}

function pct(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '-';
  return `${(value * 100).toFixed(1)}%`;
}

export default function PostRankingTable({ posts }: { posts: PostWithMetrics[] }) {
  const [seriesFilter, setSeriesFilter] = useState('all');
  const [selected, setSelected] = useState<PostWithMetrics | null>(null);
  const [hashtagDraft, setHashtagDraft] = useState('');

  const filtered = useMemo(
    () => posts.filter((post) => (seriesFilter === 'all' ? true : post.series === seriesFilter)),
    [posts, seriesFilter]
  );

  return (
    <>
      <Card>
        <h3 className="section-title">投稿ランキング（保存率重視 / フォロワー獲得向け）</h3>
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
                <th>投稿</th>
                <th>シリーズ</th>
                <th>コンテンツ種別</th>
                <th>形式</th>
                <th>リーチ</th>
                <th>保存</th>
                <th>いいね</th>
                <th>シェア</th>
                <th>保存率</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => {
                const rowClass =
                  post.save_rate != null && post.save_rate >= 0.02
                    ? 'save-rate-high'
                    : post.save_rate != null && post.save_rate <= 0.005
                      ? 'save-rate-low'
                      : '';

                return (
                  <tr
                    key={post.id}
                    className={`row-clickable ${rowClass}`}
                    onClick={() => {
                      setSelected(post);
                      setHashtagDraft(post.hashtag_set ?? '');
                    }}
                  >
                    <td>
                      <div>{post.title}</div>
                      <div className="muted tiny">{post.posted_at?.slice(0, 10) ?? '-'}</div>
                    </td>
                    <td>
                      <span className="pill series">{post.series ? SERIES_LABEL_MAP[post.series] ?? post.series : '-'}</span>
                    </td>
                    <td>
                      {post.content_role
                        ? CONTENT_ROLE_LABEL_MAP[post.content_role] ?? post.content_role
                        : '-'}
                    </td>
                    <td>{post.media_type ?? '-'}</td>
                    <td>{int(post.reach)}</td>
                    <td>{int(post.save_count)}</td>
                    <td>{int(post.like_count)}</td>
                    <td>{int(post.shares)}</td>
                    <td>{pct(post.save_rate)}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="muted">
                    該当する投稿がありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{selected.title}</h3>
            <div className="grid-2" style={{ marginBottom: 10 }}>
              <div>
                {selected.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.thumbnail_url}
                    alt={selected.title}
                    style={{ width: '100%', borderRadius: 8, border: '1px solid #E7DCCB' }}
                  />
                ) : (
                  <div className="notice">サムネイルなし</div>
                )}
              </div>
              <div>
                <p><strong>シリーズ:</strong> {selected.series ? SERIES_LABEL_MAP[selected.series] ?? selected.series : '-'}</p>
                <p><strong>コンテンツ種別:</strong> {selected.content_role ? CONTENT_ROLE_LABEL_MAP[selected.content_role] ?? selected.content_role : '-'}</p>
                <p><strong>スライド枚数:</strong> {selected.slide_count ?? '-'}</p>
                <p><strong>リーチ:</strong> {int(selected.reach)}</p>
                <p><strong>保存:</strong> {int(selected.save_count)}（{pct(selected.save_rate)}）</p>
                <p><strong>いいね:</strong> {int(selected.like_count)}</p>
                <p><strong>シェア:</strong> {int(selected.shares)}</p>
              </div>
            </div>
            <p className="muted">{selected.caption?.slice(0, 100) ?? '(captionなし)'}</p>
            <label style={{ display: 'block', marginTop: 10 }}>
              ハッシュタグセット（任意）
              <textarea
                className="textarea"
                rows={3}
                value={hashtagDraft}
                onChange={(e) => setHashtagDraft(e.target.value)}
                style={{ width: '100%', marginTop: 6 }}
              />
            </label>
            <div className="actions" style={{ marginTop: 14 }}>
              {selected.permalink && (
                <a className="button-secondary" href={selected.permalink} target="_blank" rel="noreferrer">
                  投稿を開く
                </a>
              )}
              <button className="button-primary" onClick={() => setSelected(null)}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
