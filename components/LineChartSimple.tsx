'use client';

type PostDot = {
  id: string;
  title: string;
  series: string | null;
  saveRate: number | null;
  reach: number | null;
};

type Point = {
  date: string;
  value: number | null;
  posts: PostDot[];
};

type Props = {
  points: Point[];
};

function toPct(v: number | null) {
  if (v == null || Number.isNaN(v)) return '-';
  return `${(v * 100).toFixed(1)}%`;
}

export default function LineChartSimple({ points }: Props) {
  const width = 860;
  const height = 260;
  const padding = 24;

  const values = points.map((point) => point.value).filter((v): v is number => typeof v === 'number');
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const toX = (index: number) =>
    points.length <= 1
      ? width / 2
      : padding + (index * (width - padding * 2)) / (points.length - 1);

  const toY = (value: number) => height - padding - ((value - min) / range) * (height - padding * 2);

  const linePath = points
    .map((point, index) => {
      const value = point.value ?? min;
      return `${index === 0 ? 'M' : 'L'} ${toX(index)} ${toY(value)}`;
    })
    .join(' ');

  return (
    <div className="line-chart-wrap">
      <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="フォロワー推移">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#E7DCCB" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#E7DCCB" />
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={padding}
            y1={padding + ratio * (height - padding * 2)}
            x2={width - padding}
            y2={padding + ratio * (height - padding * 2)}
            stroke="#E7DCCB"
            strokeDasharray="2 2"
          />
        ))}

        <path d={linePath} fill="none" stroke="#0F172A" strokeWidth="2" />

        {points.map((point, index) => {
          const value = point.value ?? min;
          return (
            <circle key={`${point.date}-base`} cx={toX(index)} cy={toY(value)} r="3" fill="#0F172A" />
          );
        })}

        {points.flatMap((point, index) =>
          point.posts.map((post, postIndex) => {
            const value = point.value ?? min;
            return (
              <g key={post.id}>
                <circle
                  cx={toX(index)}
                  cy={toY(value) - 10 - postIndex * 8}
                  r="4"
                  fill="#0F172A"
                  opacity="0.75"
                >
                  <title>
                    {`${post.title}\n${post.series ?? '-'}\n保存率: ${toPct(post.saveRate)}\nリーチ: ${post.reach ?? '-'}`}
                  </title>
                </circle>
              </g>
            );
          })
        )}
      </svg>

      {points.length > 1 && (
        <div className="line-chart-labels">
          <span>{points[0]?.date}</span>
          <span>{points[points.length - 1]?.date}</span>
        </div>
      )}
      <p className="muted tiny">● は投稿日（ホバーで投稿タイトル/シリーズ/保存率/リーチ）</p>
    </div>
  );
}
