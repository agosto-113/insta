const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
] as const;

export function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

export function hasCoreEnv(): boolean {
  return required.every((key) => Boolean(process.env[key]));
}

export const config = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  metaAppId: process.env.META_APP_ID,
  metaAppSecret: process.env.META_APP_SECRET,
  metaApiVersion: process.env.META_API_VERSION ?? 'v21.0',
  metaGraphBaseUrl: process.env.META_GRAPH_BASE_URL ?? 'https://graph.facebook.com',
  instagramAuthorizeUrl: process.env.INSTAGRAM_OAUTH_AUTHORIZE_URL ?? 'https://www.instagram.com/oauth/authorize',
  instagramTokenUrl: process.env.INSTAGRAM_OAUTH_TOKEN_URL ?? 'https://api.instagram.com/oauth/access_token',
  metaRedirectUri: process.env.META_REDIRECT_URI,
  cronSecret: process.env.CRON_SECRET
};
