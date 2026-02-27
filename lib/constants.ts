export const SERIES_OPTIONS = [
  { value: 'judgment', label: '判断基準' },
  { value: 'distance', label: '距離感' },
  { value: 'emotion', label: '感情整理' },
  { value: 'thinking', label: '思考の癖' },
  { value: 'procrastination', label: '先延ばし' },
  { value: 'journaling', label: 'ジャーナリング' },
  { value: 'love', label: '恋愛×思考整理' },
  { value: 'tsuki', label: 'つきの思考開示' }
] as const;

export const CONTENT_ROLE_OPTIONS = [
  { value: 'template', label: '① 型を渡す' },
  { value: 'trust', label: '② 信頼を積む' }
] as const;

export const SERIES_LABEL_MAP: Record<string, string> = Object.fromEntries(
  SERIES_OPTIONS.map((option) => [option.value, option.label])
);

export const CONTENT_ROLE_LABEL_MAP: Record<string, string> = Object.fromEntries(
  CONTENT_ROLE_OPTIONS.map((option) => [option.value, option.label])
);
