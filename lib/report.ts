import { getDashboardData } from '@/lib/dashboard';
import { buildHashtagAggregates, buildHashtagSetPerformance } from '@/lib/hashtags';
import { getPostsWithLatestInsights } from '@/lib/posts';
import { CONTENT_ROLE_LABEL_MAP, SERIES_LABEL_MAP } from '@/lib/constants';

function int(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '未取得';
  return new Intl.NumberFormat('ja-JP').format(value);
}

function pct(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '未取得';
  return `${(value * 100).toFixed(1)}%`;
}

function daysSince(dateString: string | null) {
  if (!dateString) return null;
  const posted = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - posted.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export async function buildWeeklyReportText() {
  const dashboard = await getDashboardData();
  const posts = await getPostsWithLatestInsights({ limit: 100 });
  const hashtags = buildHashtagAggregates(posts).slice(0, 10);
  const hashtagSets = buildHashtagSetPerformance(posts).slice(0, 5);
  const latest = dashboard.daily[dashboard.daily.length - 1] ?? null;
  const daily7 = dashboard.daily.slice(-7);
  const post7 = posts.filter((post) => post.posted_at && daysSince(post.posted_at) != null && (daysSince(post.posted_at) as number) <= 7);

  const topPosts = posts
    .slice()
    .sort((a, b) => (b.save_rate ?? -1) - (a.save_rate ?? -1))
    .slice(0, 10)
    .map((post, index) => {
      const likes = post.like_count ?? 0;
      const comments = post.comments_count ?? 0;
      const saves = post.save_count ?? 0;
      const shares = post.shares ?? 0;
      const engagementTotal = likes + comments + saves + shares;
      const engagementRate = post.reach ? engagementTotal / post.reach : null;
      const exploreReachRate = null;
      const followRate = null;

      return [
        `${index + 1}. ${post.title}`,
        `- post_id: ${post.id}`,
        `- permalink: ${post.permalink ?? '未取得'}`,
        `- post_type: ${post.media_type ?? '未取得'}`,
        `- posted_at: ${post.posted_at ?? '未取得'}`,
        `- caption: ${(post.caption ?? '').slice(0, 140) || '未取得'}`,
        `- slide_count: ${post.slide_count ?? '未取得'}`,
        `- series: ${post.series ? SERIES_LABEL_MAP[post.series] ?? post.series : '未設定'}`,
        `- post_role: ${post.content_role ? CONTENT_ROLE_LABEL_MAP[post.content_role] ?? post.content_role : '未設定'}`,
        `- hashtag_set: ${post.hashtag_set ?? 'captionから抽出'}`,
        `- reach: ${int(post.reach)}`,
        `- impressions: ${int(post.impressions)}`,
        `- reach_from_hashtag: 未取得`,
        `- reach_from_explore: 未取得`,
        `- reach_from_followers: 未取得`,
        `- reach_from_profile: 未取得`,
        `- reach_from_other: 未取得`,
        `- explore_reach_rate: ${pct(exploreReachRate)}`,
        `- likes: ${int(post.like_count)}`,
        `- comments: ${int(post.comments_count)}`,
        `- saves: ${int(post.save_count)}`,
        `- shares: ${int(post.shares)}`,
        `- engagement_total: ${int(engagementTotal)}`,
        `- save_rate: ${pct(post.save_rate)}`,
        `- engagement_rate: ${pct(engagementRate)}`,
        `- profile_visits: 未取得`,
        `- follows: 未取得`,
        `- follow_rate: ${pct(followRate)}`,
        `- video_views: ${int(post.plays)}`,
        `- avg_watch_time: 未取得`,
        `- video_duration: 未取得`,
        `- completion_rate: 未取得`,
        `- save_rate_rank: ${index + 1}`,
        `- explore_rate_rank: 未取得`,
        `- engagement_rate_rank: 未計算`,
        `- days_since_posted: ${daysSince(post.posted_at) ?? '未取得'}`
      ].join('\n');
    });

  const engagementRank = posts
    .slice()
    .map((post) => {
      const likes = post.like_count ?? 0;
      const comments = post.comments_count ?? 0;
      const saves = post.save_count ?? 0;
      const shares = post.shares ?? 0;
      const engagementTotal = likes + comments + saves + shares;
      return {
        ...post,
        engagementRate: post.reach ? engagementTotal / post.reach : null
      };
    })
    .sort((a, b) => (b.engagementRate ?? -1) - (a.engagementRate ?? -1))
    .slice(0, 5)
    .map((post, index) => `- ${index + 1}. ${post.title} / engagement_rate=${pct(post.engagementRate)} / save_rate=${pct(post.save_rate)}`)
    .join('\n');

  const hashtagSection = hashtags
    .map((tag, index) => `- ${index + 1}. ${tag.tag} / posts=${tag.posts} / avg_reach=${int(tag.avgReach)} / avg_save_rate=${pct(tag.avgSaveRate)} / avg_likes=${int(tag.avgLikes)}`)
    .join('\n');

  const hashtagSetSection = hashtagSets
    .map((row, index) => `- ${index + 1}. ${row.label} / posts=${row.posts} / avg_reach=${int(row.avgReach)} / avg_save_rate=${pct(row.avgSaveRate)}`)
    .join('\n');

  const dailySection = daily7
    .map((row) => `- date=${row.metric_date} / follower_count=${int(row.followers_count)} / follower_diff=${row.follower_net_delta == null ? '未取得' : row.follower_net_delta}`)
    .join('\n');

  return [
    '# Instagram週次レポート',
    '',
    'Claudeにそのまま貼って分析してください。',
    '',
    '## アカウント概要',
    `- username: ${dashboard.account?.username ?? '未連携'}`,
    `- report_generated_at: ${new Date().toISOString()}`,
    `- latest_date: ${latest?.metric_date ?? '未取得'}`,
    `- follower_count: ${int(latest?.followers_count)}`,
    `- weekly_follower_diff: ${dashboard.weeklyGrowth}`,
    `- avg_save_rate_this_week: ${pct(dashboard.avgSaveRateThisWeek)}`,
    `- avg_save_rate_last_week: ${pct(dashboard.avgSaveRateLastWeek)}`,
    `- posts_this_week: ${dashboard.postsThisWeek}`,
    '',
    '## アカウント全体（日次・直近7日）',
    dailySection || '- データなし',
    '',
    '## 投稿別詳細（保存率順TOP10）',
    topPosts.join('\n\n') || '- データなし',
    '',
    '## エンゲージメント率TOP5',
    engagementRank || '- データなし',
    '',
    '## シリーズ別パフォーマンス',
    dashboard.seriesAggregates
      .map((row) => `- ${row.label} / posts=${row.posts} / avg_save_rate=${pct(row.avgSaveRate)} / template=${row.templateCount} / trust=${row.trustCount}`)
      .join('\n') || '- データなし',
    '',
    '## ハッシュタグ別パフォーマンス',
    hashtagSection || '- データなし',
    '',
    '## ハッシュタグセット別パフォーマンス',
    hashtagSetSection || '- データなし',
    '',
    '## 注意',
    '- reach_from_hashtag / reach_from_explore / reach_from_followers / reach_from_profile / reach_from_other は現在のAPIでは未取得',
    '- post単位の profile_visits / follows も未取得',
    '- avg_watch_time / video_duration / completion_rate も未取得',
    '- 保存数はMetaが返した投稿だけ埋まる'
  ].join('\n');
}
