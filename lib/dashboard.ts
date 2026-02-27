import { createSupabaseAdmin } from '@/lib/supabase';
import { buildSeriesAggregates, getPostsWithLatestInsights, type PostWithMetrics } from '@/lib/posts';

export type DashboardData = {
  account: { id: string; username: string | null } | null;
  daily: Array<{
    metric_date: string;
    followers_count: number | null;
    follower_net_delta: number | null;
    reach: number | null;
    profile_views: number | null;
    follows: number | null;
  }>;
  topPosts: PostWithMetrics[];
  chartPoints: Array<{
    date: string;
    value: number | null;
    posts: Array<{
      id: string;
      title: string;
      series: string | null;
      saveRate: number | null;
      reach: number | null;
    }>;
  }>;
  avgSaveRateThisWeek: number;
  avgSaveRateLastWeek: number;
  weeklyGrowth: number;
  postsThisWeek: number;
  recentThreeSeries: Array<string | null>;
  phaseProgressTarget: number;
  phaseProgressCurrent: number;
  phaseProgressRemaining: number;
  seriesAggregates: ReturnType<typeof buildSeriesAggregates>;
};

function toDateOnly(value: string | null) {
  if (!value) return null;
  return value.slice(0, 10);
}

function weekStart(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? 6 : day - 1;
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function getPhaseBadge(followers: number) {
  if (followers < 1000) return { label: 'Phase 1 ｜ 土台構築', color: '#E7DCCB' };
  if (followers < 5000) return { label: 'Phase 2 ｜ 信頼構築', color: '#CBD5E1' };
  return { label: 'Phase 3 ｜ 収益化', color: '#0F172A' };
}

function getPhaseProgress(followers: number) {
  if (followers < 1000) {
    return {
      current: followers,
      target: 1000,
      remaining: 1000 - followers
    };
  }
  if (followers < 5000) {
    return {
      current: followers - 1000,
      target: 4000,
      remaining: 5000 - followers
    };
  }
  return {
    current: Math.min(followers - 5000, 5000),
    target: 5000,
    remaining: Math.max(10000 - followers, 0)
  };
}

export async function getDashboardData(days = 45): Promise<DashboardData> {
  const supabase = createSupabaseAdmin();

  const { data: accountRaw } = await supabase
    .from('ig_accounts')
    .select('id, username')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const account = (accountRaw ?? null) as DashboardData['account'];
  if (!account) {
    return {
      account: null,
      daily: [],
      topPosts: [],
      chartPoints: [],
      avgSaveRateThisWeek: 0,
      avgSaveRateLastWeek: 0,
      weeklyGrowth: 0,
      postsThisWeek: 0,
      recentThreeSeries: [],
      phaseProgressTarget: 1000,
      phaseProgressCurrent: 0,
      phaseProgressRemaining: 1000,
      seriesAggregates: []
    };
  }

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceDate = since.toISOString().slice(0, 10);

  const { data: dailyRows } = await supabase
    .from('growth_overview')
    .select('metric_date, followers_count, follower_net_delta, reach, profile_views, follows')
    .eq('account_id', account.id)
    .gte('metric_date', sinceDate)
    .order('metric_date', { ascending: true });

  const daily = ((dailyRows ?? []) as DashboardData['daily']).filter((row) => Boolean(row.metric_date));

  const allPosts = await getPostsWithLatestInsights({ accountId: account.id, limit: 300 });

  const startThisWeek = weekStart();
  const startLastWeek = new Date(startThisWeek);
  startLastWeek.setDate(startLastWeek.getDate() - 7);

  const postsThisWeek = allPosts.filter((post) => {
    if (!post.posted_at) return false;
    return new Date(post.posted_at) >= startThisWeek;
  }).length;

  const thisWeekRates = allPosts
    .filter((post) => post.posted_at && new Date(post.posted_at) >= startThisWeek)
    .map((post) => post.save_rate)
    .filter((rate): rate is number => typeof rate === 'number');

  const lastWeekRates = allPosts
    .filter((post) => {
      if (!post.posted_at) return false;
      const posted = new Date(post.posted_at);
      return posted >= startLastWeek && posted < startThisWeek;
    })
    .map((post) => post.save_rate)
    .filter((rate): rate is number => typeof rate === 'number');

  const avgSaveRateThisWeek = thisWeekRates.length > 0
    ? thisWeekRates.reduce((sum, rate) => sum + rate, 0) / thisWeekRates.length
    : 0;

  const avgSaveRateLastWeek = lastWeekRates.length > 0
    ? lastWeekRates.reduce((sum, rate) => sum + rate, 0) / lastWeekRates.length
    : 0;

  const weeklyGrowth = daily.slice(-7).reduce((sum, row) => sum + (row.follower_net_delta ?? 0), 0);

  const recentThreeSeries = allPosts
    .slice()
    .sort((a, b) => (b.posted_at ?? '').localeCompare(a.posted_at ?? ''))
    .slice(0, 3)
    .map((post) => post.series);

  const postDotsByDate = new Map<string, DashboardData['chartPoints'][number]['posts']>();
  for (const post of allPosts.slice(0, 80)) {
    const date = toDateOnly(post.posted_at);
    if (!date) continue;
    const rows = postDotsByDate.get(date) ?? [];
    rows.push({
      id: post.id,
      title: post.title,
      series: post.series,
      saveRate: post.save_rate,
      reach: post.reach
    });
    postDotsByDate.set(date, rows.slice(0, 2));
  }

  const chartPoints = daily.slice(-14).map((row) => ({
    date: row.metric_date,
    value: row.followers_count,
    posts: postDotsByDate.get(row.metric_date) ?? []
  }));

  const topPosts = allPosts
    .slice()
    .sort((a, b) => (b.save_rate ?? -1) - (a.save_rate ?? -1))
    .slice(0, 30);

  const latestFollowers = daily[daily.length - 1]?.followers_count ?? 0;
  const phase = getPhaseProgress(latestFollowers ?? 0);

  return {
    account,
    daily,
    topPosts,
    chartPoints,
    avgSaveRateThisWeek,
    avgSaveRateLastWeek,
    weeklyGrowth,
    postsThisWeek,
    recentThreeSeries,
    phaseProgressTarget: phase.target,
    phaseProgressCurrent: phase.current,
    phaseProgressRemaining: phase.remaining,
    seriesAggregates: buildSeriesAggregates(allPosts)
  };
}
