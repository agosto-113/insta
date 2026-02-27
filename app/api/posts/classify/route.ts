import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { classifyPost } from '@/lib/classify';

type Body = {
  postId: string;
  caption?: string | null;
  title?: string | null;
};

export async function POST(request: Request) {
  try {
    const { postId, caption, title } = (await request.json()) as Body;
    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    const result = await classifyPost(title, caption);

    const supabase = createSupabaseAdmin();
    const { error } = await supabase
      .from('media_items')
      .update({
        series: result.series,
        content_role: result.content_role,
        ai_confidence: result.confidence,
        ai_reason: result.reason,
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', postId);

    if (error) throw error;

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Parse failed'
      },
      { status: 500 }
    );
  }
}
