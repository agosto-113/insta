import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    const { data: account } = await supabase
      .from('ig_accounts')
      .select('id, username')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!account) {
      return NextResponse.json({ ok: false, reason: 'no_account' });
    }

    const { data: latestDaily } = await supabase
      .from('account_daily_metrics')
      .select('metric_date, updated_at')
      .eq('account_id', (account as any).id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const latestDate = (latestDaily as any)?.metric_date ?? null;
    const today = new Date().toISOString().slice(0, 10);
    const stale = !latestDate || latestDate < today;

    return NextResponse.json({
      ok: true,
      username: (account as any).username ?? null,
      latest_metric_date: latestDate,
      last_synced_at: (latestDaily as any)?.updated_at ?? null,
      stale,
      now_utc: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'cron status failed' },
      { status: 500 }
    );
  }
}
