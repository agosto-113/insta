import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

type PatchBody = {
  series?: string | null;
  content_role?: string | null;
  slide_count?: number | null;
  hashtag_set?: string | null;
  ai_confidence?: number | null;
};

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = (await request.json()) as PatchBody;
    const supabase = createSupabaseAdmin();

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if ('series' in body) payload.series = body.series;
    if ('content_role' in body) payload.content_role = body.content_role;
    if ('slide_count' in body) payload.slide_count = body.slide_count;
    if ('hashtag_set' in body) payload.hashtag_set = body.hashtag_set;
    if ('ai_confidence' in body) payload.ai_confidence = body.ai_confidence;

    const { data, error } = await supabase
      .from('media_items')
      .update(payload as never)
      .eq('id', params.id)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ post: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Patch failed' },
      { status: 500 }
    );
  }
}
