import { config } from '@/lib/env';
import { SERIES_OPTIONS } from '@/lib/constants';

export type ClassificationResult = {
  series: string;
  content_role: 'template' | 'trust';
  confidence: number;
  reason: string;
};

const SERIES_SET = new Set(SERIES_OPTIONS.map((option) => option.value));

const SERIES_DEFINITIONS = `
- judgment（判断基準）: 迷ったとき・決断・向いてる向いてない・選択の判断軸
- distance（距離感）: 人間関係の距離・断り方・境界線・LINE・職場・友人
- emotion（感情整理）: イライラ・比較・落ち込み・感情の名前付け・感情仕分け
- thinking（思考の癖）: 完璧主義・自己批判・思い込み・認知のパターン
- procrastination（先延ばし）: 先延ばし・行動できない・やる気・動けない
- journaling（ジャーナリング）: 書く・質問・ワーク・ノート・自分に問いかける
- love（恋愛×思考整理）: 恋愛・パートナー・好き・気持ちの整理（恋愛文脈）
- tsuki（つきの思考開示）: つき自身の気づき・なぜこの考え方に至ったか
`;

const ROLE_DEFINITIONS = `
- template（型を渡す）: チェックリスト・言い換えテンプレ・判断基準など「使える型」が主役
- trust（信頼を積む）: つきの視点・思考背景が見える。型を渡しつつ人柄が伝わる投稿
`;

function pickSeriesByKeyword(text: string): string {
  const lower = text.toLowerCase();
  if (/(恋|好き|彼|彼女|パートナー|恋愛)/.test(lower)) return 'love';
  if (/(先延ばし|動けない|やる気| procrast)/.test(lower)) return 'procrastination';
  if (/(ジャーナル|ノート|書く|問い)/.test(lower)) return 'journaling';
  if (/(判断|決断|基準|選択)/.test(lower)) return 'judgment';
  if (/(距離|境界|断り|人間関係|line|職場)/.test(lower)) return 'distance';
  if (/(感情|イライラ|落ち込み|比較)/.test(lower)) return 'emotion';
  if (/(思考|完璧主義|自己批判|思い込み|認知)/.test(lower)) return 'thinking';
  return 'tsuki';
}

function fallbackClassify(title: string | null | undefined, caption: string | null | undefined): ClassificationResult {
  const text = `${title ?? ''}\n${caption ?? ''}`;
  const series = pickSeriesByKeyword(text);
  const content_role: 'template' | 'trust' = /(チェック|テンプレ|ステップ|方法|基準)/.test(text) ? 'template' : 'trust';

  return {
    series,
    content_role,
    confidence: 0.55,
    reason: 'heuristic'
  };
}

function normalizeResult(raw: any): ClassificationResult {
  const series = SERIES_SET.has(raw?.series) ? raw.series : 'tsuki';
  const contentRole = raw?.content_role === 'template' ? 'template' : 'trust';
  const confidence = typeof raw?.confidence === 'number' ? Math.max(0, Math.min(1, raw.confidence)) : 0.5;
  const reason = typeof raw?.reason === 'string' ? raw.reason.slice(0, 50) : 'model';

  return {
    series,
    content_role: contentRole,
    confidence,
    reason
  };
}

export async function classifyPost(title: string | null | undefined, caption: string | null | undefined): Promise<ClassificationResult> {
  if (!config.anthropicApiKey) {
    return fallbackClassify(title, caption);
  }

  const prompt = `
あなたはInstagramアカウント「思考の取説ノート｜つき」の投稿シリーズ分類アシスタントです。

## 投稿タイトル
${title ?? '（なし）'}

## キャプション（冒頭200文字）
${(caption ?? '（なし）').slice(0, 200)}

## シリーズ定義
${SERIES_DEFINITIONS}

## コンテンツ種別定義
${ROLE_DEFINITIONS}

## 出力形式（JSONのみ。説明文不要）
{
  "series": "シリーズのvalue値（例: judgment）",
  "content_role": "template または trust",
  "confidence": 0.0,
  "reason": "20文字以内で判定理由"
}
`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.anthropicApiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    return fallbackClassify(title, caption);
  }

  const payload = (await response.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = payload.content?.find((item) => item.type === 'text')?.text ?? '';

  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return normalizeResult(parsed);
  } catch {
    return fallbackClassify(title, caption);
  }
}

export function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
