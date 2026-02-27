import Card from '@/components/ui/Card';
import { getDashboardData } from '@/lib/dashboard';
import { contentRoleRatio } from '@/lib/posts';

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export default async function SeriesPage() {
  const data = await getDashboardData();
  const top = data.seriesAggregates[0];
  const roleRatio = contentRoleRatio(data.topPosts);

  return (
    <main className="page">
      <div className="header-row">
        <div>
          <div className="badge">Series Analytics</div>
          <h1 className="title" style={{ fontSize: 32 }}>シリーズ別パフォーマンス</h1>
        </div>
      </div>

      <Card>
        <h3 className="section-title">保存率トップシリーズ</h3>
        <p className="muted" style={{ margin: 0 }}>
          {top
            ? `${top.label}シリーズの平均保存率が最も高い（${pct(top.avgSaveRate)}）`
            : 'シリーズデータがまだありません。'}
        </p>
      </Card>

      <div className="grid-2" style={{ marginTop: 12 }}>
        <Card>
          <h3 className="section-title">シリーズ別 平均保存率</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>シリーズ</th>
                  <th>平均保存率</th>
                  <th>投稿本数</th>
                </tr>
              </thead>
              <tbody>
                {data.seriesAggregates.map((row) => (
                  <tr key={row.series}>
                    <td>{row.label}</td>
                    <td>{pct(row.avgSaveRate)}</td>
                    <td>{row.posts}</td>
                  </tr>
                ))}
                {data.seriesAggregates.length === 0 && (
                  <tr>
                    <td colSpan={3} className="muted">データがありません。</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h3 className="section-title">コンテンツ種別比率（目標 70:30）</h3>
          <p>{roleRatio.labels.template}: {pct(roleRatio.templateRate)}</p>
          <p>{roleRatio.labels.trust}: {pct(roleRatio.trustRate)}</p>
          <div className="progress" style={{ marginTop: 10 }}>
            <span style={{ width: `${Math.round(roleRatio.templateRate * 100)}%` }} />
          </div>
          <p className="muted tiny" style={{ marginTop: 8 }}>
            目標ベースライン: ①型 70% / ②信頼 30%
          </p>
        </Card>
      </div>
    </main>
  );
}
