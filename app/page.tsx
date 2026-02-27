import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import Card from '@/components/ui/Card';
import SyncNowButton from '@/components/SyncNowButton';
import LineChartSimple from '@/components/LineChartSimple';
import ActionSuggest from '@/components/ActionSuggest';
import PostRankingTable from '@/components/PostRankingTable';
import { getDashboardData, getPhaseBadge } from '@/lib/dashboard';
import { hasCoreEnv } from '@/lib/env';

function int(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return '-';
  return new Intl.NumberFormat('ja-JP').format(n);
}

function pct(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return '-';
  return `${(n * 100).toFixed(1)}%`;
}

function deltaPt(thisWeek: number, lastWeek: number) {
  const diff = (thisWeek - lastWeek) * 100;
  const sign = diff >= 0 ? '▲' : '▼';
  return `${sign}${Math.abs(diff).toFixed(1)}pt`;
}

export default async function Home({ searchParams }: { searchParams?: Record<string, string> }) {
  noStore();

  const envReady = hasCoreEnv();
  const data = envReady ? await getDashboardData() : await getDashboardData(0);
  const latest = data.daily[data.daily.length - 1];
  const followers = latest?.followers_count ?? 0;
  const phase = getPhaseBadge(followers);
  const totalReach7d = data.daily.slice(-7).reduce((sum, row) => sum + (row.reach ?? 0), 0);
  const profileViews7d = data.daily.slice(-7).reduce((sum, row) => sum + (row.profile_views ?? 0), 0);
  const profileVisitRate = totalReach7d > 0 ? profileViews7d / totalReach7d : null;
  const progress = data.phaseProgressTarget > 0
    ? Math.min(100, Math.round((data.phaseProgressCurrent / data.phaseProgressTarget) * 100))
    : 0;

  return (
    <main className="page">
      <div className="header-row">
        <div>
          <div className="badge">Follower Acquisition Dashboard MVP</div>
          <h1 className="title">思考の取説ノート｜つき 🌙</h1>
          <p className="subtitle">フォロワー獲得に効く投稿と、日次インサイト推移を追うためのMVP</p>
          <div className="phase-badge" style={{ background: phase.color, color: phase.color === '#0F172A' ? '#FFFBF5' : '#0F172A', marginTop: 10 }}>
            {phase.label}
          </div>
        </div>

        <div className="actions">
          <Link className="button-secondary" href="/connect">Instagram連携</Link>
          <SyncNowButton />
        </div>
      </div>

      {searchParams?.connected === '1' && <div className="notice ok">Instagramアカウントの接続が完了しました。</div>}
      {searchParams?.synced === '1' && <div className="notice ok">同期が完了しました。（対象アカウント: {searchParams?.count ?? '0'}件）</div>}
      {searchParams?.error && <div className="notice error">{decodeURIComponent(searchParams.error)}</div>}

      {!envReady && (
        <div className="notice error">
          `.env.local` の Supabase / Meta 環境変数が未設定です。
        </div>
      )}

      <section className="kpi-grid" style={{ marginTop: 12 }}>
        <Card className="kpi-card">
          <h3 className="section-title">現在フォロワー数</h3>
          <div className="kpi-value">{int(followers)}</div>
          <div className="kpi-sub">最新日次スナップショット</div>
        </Card>

        <Card className="kpi-card">
          <h3 className="section-title">7日純増</h3>
          <div className="kpi-value">{data.weeklyGrowth >= 0 ? '+' : ''}{int(data.weeklyGrowth)}</div>
          <div className="kpi-sub">日次差分の合計</div>
        </Card>

        <Card className="kpi-card">
          <h3 className="section-title">プロフィール訪問率（7日）</h3>
          <div className="kpi-value">{pct(profileVisitRate)}</div>
          <div className="kpi-sub">profile_views / reach</div>
        </Card>

        <Card className="kpi-card">
          <h3 className="section-title">当日プロフィールアクセス</h3>
          <div className="kpi-value">{int(latest?.profile_views)}</div>
          <div className="kpi-sub">フォロー導線の強さを見る</div>
        </Card>

        <Card className="kpi-card">
          <h3 className="section-title">平均保存率（最重要KPI）</h3>
          <div className="kpi-value">{pct(data.avgSaveRateThisWeek)}</div>
          <div className="kpi-sub">{deltaPt(data.avgSaveRateThisWeek, data.avgSaveRateLastWeek)}（先週比）</div>
        </Card>

        <Card className={`kpi-card ${data.avgSaveRateThisWeek < 0.02 ? 'kpi-warning' : ''}`}>
          <h3 className="section-title">次のフェーズまで</h3>
          <div className="kpi-value">あと {int(data.phaseProgressRemaining)}人</div>
          <div className="progress"><span style={{ width: `${progress}%` }} /></div>
        </Card>
      </section>

      <section className="grid-2">
        <Card>
          <h3 className="section-title">フォロワー推移（直近14日）</h3>
          <LineChartSimple points={data.chartPoints} />
        </Card>

        <Card>
          <h3 className="section-title">日次推移（直近10日）</h3>
          <div className="table-wrap">
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
                {data.daily.slice(-10).reverse().map((row) => (
                  <tr key={row.metric_date}>
                    <td>{row.metric_date}</td>
                    <td>{row.follower_net_delta != null ? `${row.follower_net_delta >= 0 ? '+' : ''}${int(row.follower_net_delta)}` : '-'}</td>
                    <td>{int(row.reach)}</td>
                    <td>{int(row.profile_views)}</td>
                    <td>{int(row.follows)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <div style={{ marginTop: 12 }}>
        <ActionSuggest
          data={{
            avgSaveRateThisWeek: data.avgSaveRateThisWeek,
            avgSaveRateLastWeek: data.avgSaveRateLastWeek,
            weeklyGrowth: data.weeklyGrowth,
            recentThreeSeries: data.recentThreeSeries,
            postsThisWeek: data.postsThisWeek
          }}
        />
      </div>

      <section style={{ marginTop: 12 }}>
        <PostRankingTable posts={data.topPosts} />
      </section>
    </main>
  );
}
