import { createSupabaseAdmin } from '@/lib/supabase';
import { CONTENT_ROLE_LABEL_MAP, SERIES_LABEL_MAP } from '@/lib/constants';

export type PostWithMetrics = {
  id: string;
  account_id: string;
  ig_media_id: string;
  caption: string | null;
  title: string;
  media_type: string | null;
  media_product_type: string | null;
  permalink: string | null;
  thumbnail_url: string | null;
  media_url: string | null;
  posted_at: string | null;
  series: string | null;
  slide_count: number | null;
  content_role: string | null;
  ai_confidence: number | null;
  ai_reason: string | null;
  hashtag_set: string | null;
  reach: number | null;
  save_count: number | null;
  shares: number | null;
  like_count: number | null;
  comments_count: number | null;
  save_rate: number | null;
  share_rate: number | null;
  metric_date: string | null;
};

export function captionToTitle(caption: string | null) {
  if (!caption) return '（captionなし）';
  const firstLine = caption.split('\n').find((line) => line.trim().length > 0) ?? caption;
  return firstLine.slice(0, 60);
}

function ymd(iso: string | null) {
  if (!iso) return null;
  return iso.slice(0, 10);
}

export async function getLatestAccountId(): Promise<string | null> {
  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from('ig_accounts')
    .select('id')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

export async function getPostsWithLatestInsights(input?: {
  accountId?: string | null;
  series?: string | null;
  limit?: number;
}): Promise<PostWithMetrics[]> {
  const supabase = createSupabaseAdmin();
  const accountId = input?.accountId ?? (await getLatestAccountId());
  if (!accountId) return [];

  let mediaQuery = supabase
    .from('media_items')
    .select(
      'id, account_id, ig_media_id, caption, media_type, media_product_type, permalink, thumbnail_url, media_url, posted_at, series, slide_count, content_role, ai_confidence, ai_reason, hashtag_set'
    )
    .eq('account_id', accountId)
    .order('posted_at', { ascending: false })
    .limit(input?.limit ?? 200);

  if (input?.series) mediaQuery = mediaQuery.eq('series', input.series);
  const { data: mediaRows } = await mediaQuery;

  const mediaItems = (mediaRows ?? []) as Array<Record<string, any>>;
  if (mediaItems.length === 0) return [];

  const mediaIds = mediaItems.map((item) => item.id);
  const { data: insightRows } = await supabase
    .from('media_insights_daily')
    .select('media_item_id, metric_date, like_count, comments_count, save_count, shares, reach')
    .in('media_item_id', mediaIds)
    .order('metric_date', { ascending: false });

  const latestInsightByMedia = new Map<string, Record<string, any>>();
  for (const row of (insightRows ?? []) as Array<Record<string, any>>) {
    if (!latestInsightByMedia.has(row.media_item_id)) {
      latestInsightByMedia.set(row.media_item_id, row);
    }
  }

  return mediaItems.map((item) => {
    const insight = latestInsightByMedia.get(item.id);
    const reach = typeof insight?.reach === 'number' ? insight.reach : null;
    const saveCount = typeof insight?.save_count === 'number' ? insight.save_count : null;
    const shares = typeof insight?.shares === 'number' ? insight.shares : null;

    return {
      id: item.id,
      account_id: item.account_id,
      ig_media_id: item.ig_media_id,
      caption: item.caption,
      title: captionToTitle(item.caption),
      media_type: item.media_type,
      media_product_type: item.media_product_type,
      permalink: item.permalink,
      thumbnail_url: item.thumbnail_url,
      media_url: item.media_url,
      posted_at: item.posted_at,
      series: item.series,
      slide_count: item.slide_count,
      content_role: item.content_role,
      ai_confidence: item.ai_confidence,
      ai_reason: item.ai_reason,
      hashtag_set: item.hashtag_set,
      reach,
      save_count: saveCount,
      shares,
      like_count: typeof insight?.like_count === 'number' ? insight.like_count : null,
      comments_count: typeof insight?.comments_count === 'number' ? insight.comments_count : null,
      save_rate: reach && saveCount != null ? saveCount / reach : null,
      share_rate: reach && shares != null ? shares / reach : null,
      metric_date: insight?.metric_date ?? ymd(item.posted_at)
    };
  });
}

export type SeriesAggregate = {
  series: string;
  label: string;
  avgSaveRate: number;
  posts: number;
  templateCount: number;
  trustCount: number;
};

export function buildSeriesAggregates(posts: PostWithMetrics[]): SeriesAggregate[] {
  const map = new Map<string, { sum: number; count: number; posts: number; templateCount: number; trustCount: number }>();

  for (const post of posts) {
    if (!post.series) continue;
    const current = map.get(post.series) ?? { sum: 0, count: 0, posts: 0, templateCount: 0, trustCount: 0 };
    current.posts += 1;
    if (post.save_rate != null) {
      current.sum += post.save_rate;
      current.count += 1;
    }
    if (post.content_role === 'template') current.templateCount += 1;
    if (post.content_role === 'trust') current.trustCount += 1;
    map.set(post.series, current);
  }

  return Array.from(map.entries())
    .map(([series, row]) => ({
      series,
      label: SERIES_LABEL_MAP[series] ?? series,
      avgSaveRate: row.count > 0 ? row.sum / row.count : 0,
      posts: row.posts,
      templateCount: row.templateCount,
      trustCount: row.trustCount
    }))
    .sort((a, b) => b.avgSaveRate - a.avgSaveRate);
}

export function contentRoleRatio(posts: PostWithMetrics[]) {
  const template = posts.filter((post) => post.content_role === 'template').length;
  const trust = posts.filter((post) => post.content_role === 'trust').length;
  const total = template + trust;

  return {
    template,
    trust,
    templateRate: total > 0 ? template / total : 0,
    trustRate: total > 0 ? trust / total : 0,
    labels: {
      template: CONTENT_ROLE_LABEL_MAP.template,
      trust: CONTENT_ROLE_LABEL_MAP.trust
    }
  };
}
