import { NextResponse } from 'next/server';
import { getPostsWithLatestInsights } from '@/lib/posts';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const series = searchParams.get('series');
    const posts = await getPostsWithLatestInsights({
      series: series && series !== 'all' ? series : null,
      limit: 300
    });

    return NextResponse.json({ posts });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load posts' },
      { status: 500 }
    );
  }
}
