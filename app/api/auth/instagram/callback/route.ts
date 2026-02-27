import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForAccessToken, fetchInstagramProfile, normalizeTokenForStorage } from '@/lib/meta';
import { config } from '@/lib/env';
import { createSupabaseAdmin } from '@/lib/supabase';

function expiresAt(expiresIn?: number) {
  if (!expiresIn) return null;
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const appBaseUrl = config.appUrl || url.origin;
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error_description') ?? url.searchParams.get('error');
  const state = url.searchParams.get('state');
  const storedState = cookies().get('ig_oauth_state')?.value;

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, appBaseUrl));
  }
  if (!code) {
    return NextResponse.redirect(new URL('/?error=missing_code', appBaseUrl));
  }
  // In production, some browsers/extensions can drop this transient cookie.
  // Reject only when both values exist and clearly mismatch.
  if (state && storedState && state !== storedState) {
    return NextResponse.redirect(new URL('/?error=invalid_state', appBaseUrl));
  }

  try {
    const token = await exchangeCodeForAccessToken(code);
    const storedToken = await normalizeTokenForStorage(token);
    const profile = await fetchInstagramProfile(token.access_token);
    const supabase = createSupabaseAdmin();

    const { data: accountRowRaw, error: accountError } = await supabase
      .from('ig_accounts')
      .upsert(
        {
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

    const { error: tokenError } = await supabase.from('ig_tokens').upsert(
      {
        account_id: accountRow.id,
        access_token: storedToken.accessToken,
        token_type: storedToken.tokenType,
        expires_at: storedToken.expiresAt ?? expiresAt(typeof token.expires_in === 'number' ? token.expires_in : undefined),
        scope: Array.isArray(token.permissions)
          ? token.permissions.join(',')
          : typeof token.scope === 'string'
            ? token.scope
            : null,
        raw_token_response: storedToken.raw as any,
        updated_at: new Date().toISOString()
      } as any,
      { onConflict: 'account_id' }
    );

    if (tokenError) throw tokenError;

    cookies().delete('ig_oauth_state');
    return NextResponse.redirect(new URL('/?connected=1', appBaseUrl));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'callback_error';
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(message)}`, appBaseUrl));
  }
}
