import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { buildInstagramAuthorizeUrl } from '@/lib/meta';

export async function GET() {
  const state = randomUUID();
  cookies().set('ig_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10,
    path: '/'
  });

  const url = buildInstagramAuthorizeUrl(state);
  return NextResponse.json({ url });
}
