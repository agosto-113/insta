import { createSupabaseAdmin } from '@/lib/supabase';

export type DashboardData = {
  account: { id: string; username: string | null } | null;
  series: Array<{
    metric_date: string;
    followers_count: number | null;
    follower_net_delta: number | null;
    reach: number | null;
    profile_views: number | null;
    follows: number | null;
  }>;
  topPosts: Array<{
    id: string;
    ig_media_id: string;
    media_type: string | null;
    permalink: string | null;
    caption: string | null;
    posted_at: string | null;
    reach: number | null;
    save_count: number | null;
    shares: number | null;
    like_count: number | null;
    comments_count: number | null;
    save_rate: number | null;
    share_rate: number | null;
  }>;
};

export async function getDashboardData(days = 30): Promise<DashboardData> {
  const supabase = createSupabaseAdmin();

  const { data: accountRaw } = await supabase
    .from('ig_accounts')
    .select('id, username')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const account = accountRaw as any;

  if (!account) {
    return { account: null, series: [], topPosts: [] };
  }

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  const sinceDate = since.toISOString().slice(0, 10);

  const { data: seriesRows } = await supabase
    .from('growth_overview')
    .select('metric_date, followers_count, follower_net_delta, reach, profile_views, follows')
    .eq('account_id', account.id)
    .gte('metric_date', sinceDate)
    .order('metric_date', { ascending: true });

  const { data: topRows } = await supabase
    .from('media_insights_daily')
    .select(`
      like_count,
      comments_count,
      save_count,
      shares,
      reach,
      media_items!inner(id, ig_media_id, media_type, permalink, caption, posted_at, account_id)
    `)
    .eq('media_items.account_id', account.id)
    .order('metric_date', { ascending: false })
    .limit(100);

  const topPosts = (topRows ?? [])
    .map((row: any) => {
      const media = Array.isArray(row.media_items) ? row.media_items[0] : row.media_items;
      const reach = row.reach ?? null;
      const saveRate = typeof reach === 'number' && reach > 0 && typeof row.save_count === 'number'
        ? row.save_count / reach
        : null;
      const shareRate = typeof reach === 'number' && reach > 0 && typeof row.shares === 'number'
        ? row.shares / reach
        : null;
      return {
        id: media.id,
        ig_media_id: media.ig_media_id,
        media_type: media.media_type,
        permalink: media.permalink,
        caption: media.caption,
        posted_at: media.posted_at,
        reach,
        save_count: row.save_count,
        shares: row.shares,
        like_count: row.like_count,
        comments_count: row.comments_count,
        save_rate: saveRate,
        share_rate: shareRate
      };
    })
    .sort((a, b) => (b.save_rate ?? -1) - (a.save_rate ?? -1))
    .slice(0, 12);

  return {
    account,
    series: (seriesRows ?? []) as DashboardData['series'],
    topPosts
  };
}
