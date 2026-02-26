import { NextRequest, NextResponse } from 'next/server';
import { syncAllConnectedAccounts } from '@/lib/sync';

export async function POST(_request: NextRequest) {
  try {
    const result = await syncAllConnectedAccounts();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown sync error' },
      { status: 500 }
    );
  }
}
