import Card from '@/components/ui/Card';
import { getPostsWithLatestInsights } from '@/lib/posts';
import { buildHashtagAggregates, buildHashtagSetPerformance } from '@/lib/hashtags';

function int(value: number) {
  return new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 0 }).format(value);
}

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export default async function HashtagsPage() {
  const posts = await getPostsWithLatestInsights({ limit: 300 });
  const hashtags = buildHashtagAggregates(posts);
  const sets = buildHashtagSetPerformance(posts);
  const top = hashtags[0] ?? null;

  return (
    <main className="page">
      <div className="header-row">
        <div>
          <div className="badge">Hashtag Analytics</div>
          <h1 className="title" style={{ fontSize: 32 }}>ハッシュタグ分析</h1>
          <p className="subtitle">自分の投稿に使ったハッシュタグごとの平均成績を確認します</p>
        </div>
      </div>

      <Card>
        <h3 className="section-title">保存率トップのハッシュタグ</h3>
        <p className="muted" style={{ margin: 0 }}>
          {top
            ? `${top.tag} の平均保存率が最も高いです（${pct(top.avgSaveRate)} / 平均リーチ ${int(top.avgReach)}）`
            : 'まだハッシュタグ付き投稿がありません。'}
        </p>
      </Card>

      <div className="grid-2" style={{ marginTop: 12 }}>
        <Card>
          <h3 className="section-title">ハッシュタグ別パフォーマンス</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>タグ</th>
                  <th>投稿数</th>
                  <th>平均リーチ</th>
                  <th>平均保存率</th>
                  <th>平均いいね</th>
                  <th>総保存数</th>
                </tr>
              </thead>
              <tbody>
                {hashtags.slice(0, 25).map((row) => (
                  <tr key={row.tag}>
                    <td>{row.tag}</td>
                    <td>{int(row.posts)}</td>
                    <td>{int(row.avgReach)}</td>
                    <td>{pct(row.avgSaveRate)}</td>
                    <td>{int(row.avgLikes)}</td>
                    <td>{int(row.totalSaves)}</td>
                  </tr>
                ))}
                {hashtags.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted">ハッシュタグを含む投稿がありません。</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h3 className="section-title">最近よく使うハッシュタグセット</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>セット</th>
                  <th>投稿数</th>
                  <th>平均リーチ</th>
                  <th>平均保存率</th>
                  <th>平均いいね</th>
                </tr>
              </thead>
              <tbody>
                {sets.map((row) => (
                  <tr key={row.key}>
                    <td style={{ minWidth: 300 }}>{row.label}</td>
                    <td>{int(row.posts)}</td>
                    <td>{int(row.avgReach)}</td>
                    <td>{pct(row.avgSaveRate)}</td>
                    <td>{int(row.avgLikes)}</td>
                  </tr>
                ))}
                {sets.length === 0 && (
                  <tr>
                    <td colSpan={5} className="muted">ハッシュタグセットのデータがありません。</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </main>
  );
}
