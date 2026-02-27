import Card from '@/components/ui/Card';
import { SERIES_LABEL_MAP } from '@/lib/constants';

export type DashboardSuggestionInput = {
  avgSaveRateThisWeek: number;
  avgSaveRateLastWeek: number;
  weeklyGrowth: number;
  recentThreeSeries: Array<string | null>;
  postsThisWeek: number;
};

type Suggestion = {
  message: string;
  priority: 'high' | 'normal';
};

function generateSuggestions(data: DashboardSuggestionInput): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (data.avgSaveRateThisWeek < data.avgSaveRateLastWeek) {
    suggestions.push({
      message: '保存率が下がっています。判断基準・チェックリスト系を増やしてみて',
      priority: 'high'
    });
  }

  if (data.weeklyGrowth < 70) {
    suggestions.push({
      message: 'フォロワーペースが遅めです。タイトルに問いかけ型を試してみて',
      priority: 'normal'
    });
  }

  const onlyNonNull = data.recentThreeSeries.filter(Boolean) as string[];
  if (
    onlyNonNull.length === 3 &&
    onlyNonNull.every((series) => series === onlyNonNull[0])
  ) {
    const label = SERIES_LABEL_MAP[onlyNonNull[0]] ?? onlyNonNull[0];
    suggestions.push({
      message: `「${label}」が続いています。別シリーズを挟むとパターン感が薄れます`,
      priority: 'normal'
    });
  }

  if (data.postsThisWeek < 7) {
    suggestions.push({
      message: `今週あと ${7 - data.postsThisWeek} 本でペースを保てます`,
      priority: 'normal'
    });
  }

  return suggestions;
}

export default function ActionSuggest({ data }: { data: DashboardSuggestionInput }) {
  const suggestions = generateSuggestions(data);

  return (
    <Card>
      <h3 className="section-title">アクションサジェスト</h3>
      {suggestions.length === 0 ? (
        <p className="muted">今週は順調です🌙</p>
      ) : (
        <div className="suggest-list">
          {suggestions.map((suggestion, idx) => (
            <div
              key={`${suggestion.message}-${idx}`}
              className={`suggest-item ${suggestion.priority === 'high' ? 'high' : ''}`}
            >
              {suggestion.message}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
