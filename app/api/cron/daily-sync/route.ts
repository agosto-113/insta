import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/env';
import { syncAllConnectedAccounts } from '@/lib/sync';

async function runCron(request: NextRequest) {
  const auth = request.headers.get('authorization');
  const expected = config.cronSecret ? `Bearer ${config.cronSecret}` : null;

  if (!expected || auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncAllConnectedAccounts();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown cron sync error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return runCron(request);
}

export async function POST(request: NextRequest) {
  return runCron(request);
}
