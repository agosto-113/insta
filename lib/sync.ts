import { createSupabaseAdmin } from '@/lib/supabase';
import {
  fetchAccountDailyInsights,
  fetchInstagramProfile,
  fetchMediaDailyInsights,
  fetchRecentMedia,
  type InstagramMedia
} from '@/lib/meta';

function isoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export async function getConnectedAccounts() {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('ig_tokens')
    .select('access_token, account_id, ig_accounts(id, ig_user_id, username)')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return ((data ?? []) as any[]).map((row) => ({
    accountId: row.account_id,
    accessToken: row.access_token,
    account: Array.isArray(row.ig_accounts) ? row.ig_accounts[0] : row.ig_accounts
  }));
}

export async function syncOneAccount(accountId: string, accessToken: string) {
  const supabase = createSupabaseAdmin();

  const profile = await fetchInstagramProfile(accessToken);

  const { data: accountRowRaw, error: accountError } = await supabase
    .from('ig_accounts')
    .upsert(
      {
        id: accountId,
        ig_user_id: profile.igUserId,
        username: profile.username,
        account_type: profile.accountType,
        profile_picture_url: profile.profilePictureUrl,
        updated_at: new Date().toISOString()
      } as any,
      { onConflict: 'ig_user_id' }
    )
    .select('id')
    .single();

  if (accountError) throw accountError;
  const accountRow = accountRowRaw as any;
  const resolvedAccountId = accountRow.id;

  const accountInsights = await fetchAccountDailyInsights(accessToken, profile.igUserId);
  const { error: dailyError } = await supabase.from('account_daily_metrics').upsert(
    {
      account_id: resolvedAccountId,
      metric_date: accountInsights.metricDate,
      followers_count: accountInsights.followersCount,
      follows: accountInsights.follows,
      reach: accountInsights.reach,
      profile_views: accountInsights.profileViews,
      impressions: accountInsights.impressions,
      raw_payload: accountInsights.raw as any,
      updated_at: new Date().toISOString()
    } as any,
    { onConflict: 'account_id,metric_date' }
  );
  if (dailyError) throw dailyError;

  const media = await fetchRecentMedia(accessToken, profile.igUserId, 30);
  for (const item of media) {
    await upsertMediaAndInsights(resolvedAccountId, accessToken, item);
  }

  return {
    accountId: resolvedAccountId,
    username: profile.username,
    syncedAt: new Date().toISOString(),
    metricDate: accountInsights.metricDate,
    mediaCount: media.length
  };
}

async function upsertMediaAndInsights(accountId: string, accessToken: string, item: InstagramMedia) {
  const supabase = createSupabaseAdmin();
  const { data: mediaRowRaw, error: mediaError } = await supabase
    .from('media_items')
    .upsert(
      {
        account_id: accountId,
        ig_media_id: item.igMediaId,
        caption: item.caption,
        media_type: item.mediaType,
        media_product_type: item.mediaProductType,
        permalink: item.permalink,
        thumbnail_url: item.thumbnailUrl,
        media_url: item.mediaUrl,
        posted_at: item.postedAt,
        updated_at: new Date().toISOString()
      } as any,
      { onConflict: 'ig_media_id' }
    )
    .select('id')
    .single();

  if (mediaError) throw mediaError;
  const mediaRow = mediaRowRaw as any;

  const insights = await fetchMediaDailyInsights(accessToken, item.igMediaId, {
    likeCount: item.likeCount,
    commentsCount: item.commentsCount
  });

  const { error: insightError } = await supabase.from('media_insights_daily').upsert(
    {
      media_item_id: mediaRow.id,
      metric_date: insights.metricDate,
      like_count: insights.likeCount,
      comments_count: insights.commentsCount,
      save_count: insights.saveCount,
      shares: insights.shares,
      reach: insights.reach,
      plays: insights.plays,
      impressions: insights.impressions,
      raw_payload: insights.raw as any,
      updated_at: new Date().toISOString()
    } as any,
    { onConflict: 'media_item_id,metric_date' }
  );

  if (insightError) throw insightError;
}

export async function syncAllConnectedAccounts() {
  const rows = await getConnectedAccounts();
  const results = [] as Array<{ accountId: string; username: string | null; syncedAt: string; metricDate: string; mediaCount: number }>;

  for (const row of rows) {
    results.push(await syncOneAccount(row.accountId, row.accessToken));
  }

  return {
    count: results.length,
    date: isoDate(),
    results
  };
}
