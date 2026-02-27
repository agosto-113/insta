import { createSupabaseAdmin } from '@/lib/supabase';
import {
  fetchAccountDailyInsights,
  fetchInstagramProfile,
  fetchMediaDailyInsights,
  maybeRefreshStoredToken,
  fetchRecentMedia,
  type InstagramMedia
} from '@/lib/meta';
import { chunkArray, classifyPost } from '@/lib/classify';
import { captionToTitle } from '@/lib/posts';

function isoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export async function getConnectedAccounts() {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('ig_tokens')
    .select('access_token, account_id, expires_at, token_type, ig_accounts(id, ig_user_id, username)')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return ((data ?? []) as any[]).map((row) => ({
    accountId: row.account_id,
    accessToken: row.access_token,
    expiresAt: row.expires_at ?? null,
    tokenType: row.token_type ?? null,
    account: Array.isArray(row.ig_accounts) ? row.ig_accounts[0] : row.ig_accounts
  }));
}

export async function syncOneAccount(accountId: string, accessToken: string, expiresAt: string | null = null) {
  const supabase = createSupabaseAdmin();
  let resolvedToken = accessToken;

  const refreshed = await maybeRefreshStoredToken({ accessToken, expiresAt });
  if (refreshed) {
    resolvedToken = refreshed.accessToken;
    await supabase
      .from('ig_tokens')
      .upsert(
        {
          account_id: accountId,
          access_token: refreshed.accessToken,
          token_type: refreshed.tokenType,
          expires_at: refreshed.expiresAt,
          raw_token_response: refreshed.raw as any,
          updated_at: new Date().toISOString()
        } as any,
        { onConflict: 'account_id' }
      );
  }

  const profile = await fetchInstagramProfile(resolvedToken);

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

  const accountInsights = await fetchAccountDailyInsights(resolvedToken, profile.igUserId);
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

  const media = await fetchRecentMedia(resolvedToken, profile.igUserId, 30);
  for (const item of media) {
    await upsertMediaAndInsights(resolvedAccountId, resolvedToken, item);
  }

  await classifyUnclassifiedMedia(resolvedAccountId);

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
        slide_count: item.slideCount,
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

async function classifyUnclassifiedMedia(accountId: string) {
  const supabase = createSupabaseAdmin();

  const { data: unclassified } = await supabase
    .from('media_items')
    .select('id, caption')
    .eq('account_id', accountId)
    .is('series', null)
    .order('posted_at', { ascending: false })
    .limit(20);

  if (!unclassified || unclassified.length === 0) return;

  const groups = chunkArray(unclassified as Array<{ id: string; caption: string | null }>, 5);

  for (const group of groups) {
    await Promise.all(
      group.map(async (post) => {
        const title = captionToTitle(post.caption);
        const result = await classifyPost(title, post.caption);

        await (supabase as any)
          .from('media_items')
          .update({
            series: result.series,
            content_role: result.content_role,
            ai_confidence: result.confidence,
            ai_reason: result.reason,
            updated_at: new Date().toISOString()
          })
          .eq('id', post.id);
      })
    );
  }
}

export async function syncAllConnectedAccounts() {
  const rows = await getConnectedAccounts();
  const results = [] as Array<{ accountId: string; username: string | null; syncedAt: string; metricDate: string; mediaCount: number }>;

  for (const row of rows) {
    results.push(await syncOneAccount(row.accountId, row.accessToken, row.expiresAt));
  }

  return {
    count: results.length,
    date: isoDate(),
    results
  };
}
