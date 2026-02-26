import { config } from '@/lib/env';

type TokenResponse = {
  access_token: string;
  user_id?: string | number;
  token_type?: string;
  expires_in?: number;
  permissions?: string[];
  scope?: string;
  [key: string]: unknown;
};

export type InstagramProfile = {
  igUserId: string;
  username: string | null;
  accountType: string | null;
  profilePictureUrl: string | null;
  raw: any;
};

export type InstagramMedia = {
  igMediaId: string;
  caption: string | null;
  mediaType: string | null;
  mediaProductType: string | null;
  permalink: string | null;
  thumbnailUrl: string | null;
  mediaUrl: string | null;
  postedAt: string | null;
  likeCount: number | null;
  commentsCount: number | null;
  raw: any;
};

export type AccountDailyInsights = {
  metricDate: string;
  followersCount: number | null;
  follows: number | null;
  reach: number | null;
  profileViews: number | null;
  impressions: number | null;
  raw: any;
};

export type MediaDailyInsights = {
  metricDate: string;
  reach: number | null;
  impressions: number | null;
  plays: number | null;
  saveCount: number | null;
  shares: number | null;
  likeCount: number | null;
  commentsCount: number | null;
  raw: any;
};

function buildGraphUrl(path: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(`${config.metaGraphBaseUrl}/${config.metaApiVersion}${path}`);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function safeJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Meta response is not JSON: ${text.slice(0, 400)}`);
  }
}

async function graphGet<T>(path: string, accessToken: string, params?: Record<string, string | number | undefined>) {
  const url = buildGraphUrl(path, { ...params, access_token: accessToken });
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    const err = await safeJson<{ error?: { message?: string } }>(response);
    throw new Error(err.error?.message ?? `Meta GET failed: ${response.status}`);
  }
  return safeJson<T>(response);
}

function metricValue(raw: any, names: string[]): number | null {
  const data = raw?.data;
  if (!Array.isArray(data)) return null;
  for (const name of names) {
    const item = data.find((x: any) => x?.name === name);
    if (!item) continue;
    const value = item.total_value?.value ?? item.values?.[0]?.value ?? item.value;
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() !== '') return Number(value);
  }
  return null;
}

function todayUtcDate() {
  return new Date().toISOString().slice(0, 10);
}

export function buildInstagramAuthorizeUrl(state: string) {
  if (!config.metaAppId || !config.metaRedirectUri) {
    throw new Error('META_APP_ID / META_REDIRECT_URI are required');
  }

  const url = new URL(config.instagramAuthorizeUrl);
  url.searchParams.set('enable_fb_login', '0');
  url.searchParams.set('force_authentication', '1');
  url.searchParams.set('client_id', config.metaAppId);
  url.searchParams.set('app_id', config.metaAppId);
  url.searchParams.set('redirect_uri', config.metaRedirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', [
    'instagram_business_basic',
    'instagram_business_manage_insights'
  ].join(','));
  url.searchParams.set('state', state);
  return url.toString();
}

export async function exchangeCodeForAccessToken(code: string): Promise<TokenResponse> {
  if (!config.metaAppId || !config.metaAppSecret || !config.metaRedirectUri) {
    throw new Error('META_APP_ID / META_APP_SECRET / META_REDIRECT_URI are required');
  }

  const body = new URLSearchParams({
    client_id: config.metaAppId,
    client_secret: config.metaAppSecret,
    grant_type: 'authorization_code',
    redirect_uri: config.metaRedirectUri,
    code
  });

  const response = await fetch(config.instagramTokenUrl, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    cache: 'no-store'
  });

  if (!response.ok) {
    const err = await safeJson<{ error_message?: string; error?: { message?: string } }>(response);
    throw new Error(err.error_message ?? err.error?.message ?? `Token exchange failed: ${response.status}`);
  }

  return safeJson<TokenResponse>(response);
}

export async function fetchInstagramProfile(accessToken: string): Promise<InstagramProfile> {
  const result = await graphGet<any>('/me', accessToken, {
    fields: 'id,user_id,username,account_type,profile_picture_url'
  });

  return {
    igUserId: String(result.user_id ?? result.id),
    username: result.username ?? null,
    accountType: result.account_type ?? 'BUSINESS_OR_CREATOR',
    profilePictureUrl: result.profile_picture_url ?? null,
    raw: result
  };
}

export async function fetchAccountDailyInsights(accessToken: string, igUserId: string): Promise<AccountDailyInsights> {
  const [insightsRaw, profileRaw] = await Promise.all([
    graphGet<any>(`/${igUserId}/insights`, accessToken, {
      // Instagram Login route uses a different metric set than classic Graph examples.
      metric: 'reach,profile_views,views,follows_and_unfollows',
      period: 'day'
    }),
    graphGet<any>(`/${igUserId}`, accessToken, {
      fields: 'followers_count'
    })
  ]);

  const followsAndUnfollows = (Array.isArray(insightsRaw?.data)
    ? insightsRaw.data.find((item: any) => item?.name === 'follows_and_unfollows')
    : null) as any;
  const followsValue = followsAndUnfollows?.total_value?.breakdowns?.[0]?.results?.find?.(
    (row: any) => row?.dimension_values?.includes?.('FOLLOWS')
  )?.value;

  return {
    metricDate: todayUtcDate(),
    followersCount:
      typeof profileRaw?.followers_count === 'number'
        ? profileRaw.followers_count
        : typeof profileRaw?.follower_count === 'number'
          ? profileRaw.follower_count
          : null,
    follows: typeof followsValue === 'number' ? followsValue : null,
    reach: metricValue(insightsRaw, ['reach', 'accounts_reached']),
    profileViews: metricValue(insightsRaw, ['profile_views']),
    impressions: metricValue(insightsRaw, ['views', 'impressions']),
    raw: { insights: insightsRaw, profile: profileRaw }
  };
}

export async function fetchRecentMedia(accessToken: string, igUserId: string, limit = 25): Promise<InstagramMedia[]> {
  const raw = await graphGet<any>(`/${igUserId}/media`, accessToken, {
    fields: 'id,caption,media_type,media_product_type,permalink,thumbnail_url,media_url,timestamp,like_count,comments_count',
    limit
  });

  const items = Array.isArray(raw.data) ? raw.data : [];
  return items.map((item: any) => ({
    igMediaId: String(item.id),
    caption: item.caption ?? null,
    mediaType: item.media_type ?? null,
    mediaProductType: item.media_product_type ?? null,
    permalink: item.permalink ?? null,
    thumbnailUrl: item.thumbnail_url ?? null,
    mediaUrl: item.media_url ?? null,
    postedAt: item.timestamp ?? null,
    likeCount: typeof item.like_count === 'number' ? item.like_count : null,
    commentsCount: typeof item.comments_count === 'number' ? item.comments_count : null,
    raw: item
  }));
}

export async function fetchMediaDailyInsights(accessToken: string, mediaId: string, fallback?: { likeCount?: number | null; commentsCount?: number | null }): Promise<MediaDailyInsights> {
  let raw: any = { data: [] };
  try {
    raw = await graphGet<any>(`/${mediaId}/insights`, accessToken, {
      metric: 'reach,impressions,plays,saves,shares'
    });
  } catch (error) {
    raw = { error: (error as Error).message, data: [] };
  }

  return {
    metricDate: todayUtcDate(),
    reach: metricValue(raw, ['reach', 'accounts_reached']),
    impressions: metricValue(raw, ['impressions', 'views']),
    plays: metricValue(raw, ['plays', 'video_views']),
    saveCount: metricValue(raw, ['saves', 'saved']),
    shares: metricValue(raw, ['shares']),
    likeCount: fallback?.likeCount ?? null,
    commentsCount: fallback?.commentsCount ?? null,
    raw
  };
}
