import Link from 'next/link';
import { getDashboardData } from '@/lib/dashboard';
import { hasCoreEnv } from '@/lib/env';

function pct(n: number | null) {
  if (n === null || Number.isNaN(n)) return '-';
  return `${(n * 100).toFixed(1)}%`;
}

function int(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return '-';
  return new Intl.NumberFormat('ja-JP').format(n);
}

export default async function Home({ searchParams }: { searchParams?: Record<string, string> }) {
  const envReady = hasCoreEnv();
  const data = envReady ? await getDashboardData() : { account: null, series: [], topPosts: [] };

  const latest = data.series[data.series.length - 1];
  const weeklyDelta = data.series.slice(-7).reduce((sum, row) => sum + (row.follower_net_delta ?? 0), 0);
  const totalReach = data.series.slice(-7).reduce((sum, row) => sum + (row.reach ?? 0), 0);
  const totalProfileViews = data.series.slice(-7).reduce((sum, row) => sum + (row.profile_views ?? 0), 0);
  const profileVisitRate = totalReach > 0 ? totalProfileViews / totalReach : null;

  const bars = data.series.slice(-14);
  const maxFollowers = Math.max(...bars.map((b) => b.followers_count ?? 0), 1);

  return (
    <main className="container">
      <div className="header">
        <div>
          <div className="badge">Follower Acquisition Dashboard MVP</div>
          <h1 style={{ margin: '10px 0 6px' }}>
            {data.account?.username ? `@${data.account.username}` : 'Instagram Growth Insights'}
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            フォロワー獲得に効く投稿と、日次インサイト推移を追うためのMVP
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link className="button secondary" href="/connect">Instagram連携</Link>
          <form action="/api/instagram/sync" method="post">
            <button className="button" type="submit">今すぐ同期</button>
          </form>
        </div>
      </div>

      {searchParams?.connected === '1' && <div className="notice ok">Instagramアカウントの接続が完了しました。</div>}
      {searchParams?.error && <div className="notice error">{decodeURIComponent(searchParams.error)}</div>}

      {!envReady && (
        <div className="notice error">
          `.env.local` に Supabase / Meta の環境変数が未設定です。`/Users/hazuki/Documents/New project/.env.example` を元に設定してください。
        </div>
      )}

      {envReady && !data.account && (
        <div className="notice">
          まだ連携済みアカウントがありません。先に <Link href="/connect">Instagram連携</Link> を実行してください。
        </div>
      )}

      <section className="grid">
        <article className="card kpi">
          <h3>現在フォロワー数</h3>
          <p className="kpi-value">{int(latest?.followers_count ?? null)}</p>
          <p className="kpi-sub">最新日次スナップショット</p>
        </article>
        <article className="card kpi">
          <h3>7日純増</h3>
          <p className="kpi-value">{int(weeklyDelta)}</p>
          <p className="kpi-sub">日次差分の合計</p>
        </article>
        <article className="card kpi">
          <h3>プロフィール訪問率 (7日)</h3>
          <p className="kpi-value">{pct(profileVisitRate)}</p>
          <p className="kpi-sub">`profile_views / reach`</p>
        </article>
        <article className="card kpi">
          <h3>当日プロフィールアクセス</h3>
          <p className="kpi-value">{int(latest?.profile_views ?? null)}</p>
          <p className="kpi-sub">フォロー導線の強さを見る</p>
        </article>

        <article className="card panel half">
          <h3>フォロワー推移 (直近14日)</h3>
          {bars.length === 0 ? (
            <p className="muted">データがありません。</p>
          ) : (
            <>
              <div className="spark" aria-hidden>
                {bars.map((row) => {
                  const height = Math.max(4, Math.round(((row.followers_count ?? 0) / maxFollowers) * 150));
                  return <div key={row.metric_date} className="spark-bar" style={{ height }} />;
                })}
              </div>
              <div className="spark-labels">
                <span>{bars[0]?.metric_date}</span>
                <span>{bars[bars.length - 1]?.metric_date}</span>
              </div>
            </>
          )}
        </article>

        <article className="card panel half">
          <h3>日次推移 (直近10日)</h3>
          <table className="table">
            <thead>
              <tr>
                <th>日付</th>
                <th>純増</th>
                <th>リーチ</th>
                <th>プロフィール</th>
                <th>フォロー</th>
              </tr>
            </thead>
            <tbody>
              {data.series.slice(-10).reverse().map((row) => (
                <tr key={row.metric_date}>
                  <td>{row.metric_date}</td>
                  <td>{int(row.follower_net_delta)}</td>
                  <td>{int(row.reach)}</td>
                  <td>{int(row.profile_views)}</td>
                  <td>{int(row.follows)}</td>
                </tr>
              ))}
              {data.series.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">同期後に表示されます。</td>
                </tr>
              )}
            </tbody>
          </table>
        </article>

        <article className="card panel">
          <h3>投稿ランキング (保存率重視 / フォロワー獲得向け)</h3>
          <table className="table">
            <thead>
              <tr>
                <th>投稿</th>
                <th>形式</th>
                <th>リーチ</th>
                <th>保存</th>
                <th>シェア</th>
                <th>保存率</th>
                <th>シェア率</th>
              </tr>
            </thead>
            <tbody>
              {data.topPosts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <div style={{ maxWidth: 420 }}>
                      <div>{post.caption?.slice(0, 72) || '(captionなし)'}</div>
                      <div className="muted">{post.posted_at?.slice(0, 10) ?? '-'} {post.permalink && <a href={post.permalink} target="_blank">open</a>}</div>
                    </div>
                  </td>
                  <td>{post.media_type ?? '-'}</td>
                  <td>{int(post.reach)}</td>
                  <td>{int(post.save_count)}</td>
                  <td>{int(post.shares)}</td>
                  <td>{pct(post.save_rate)}</td>
                  <td>{pct(post.share_rate)}</td>
                </tr>
              ))}
              {data.topPosts.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted">同期後にランキングを表示します。</td>
                </tr>
              )}
            </tbody>
          </table>
        </article>
      </section>
    </main>
  );
}
