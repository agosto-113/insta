import { NextResponse } from 'next/server';
import { buildWeeklyReportText } from '@/lib/report';

export async function GET() {
  try {
    const text = await buildWeeklyReportText();
    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to build weekly report' },
      { status: 500 }
    );
  }
}
