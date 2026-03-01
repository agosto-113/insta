import type { PostWithMetrics } from '@/lib/posts';

export type HashtagAggregate = {
  tag: string;
  posts: number;
  avgReach: number;
  avgSaveRate: number;
  avgLikes: number;
  totalSaves: number;
  recentPostTitle: string | null;
  recentPostedAt: string | null;
};

export type HashtagSetPerformance = {
  key: string;
  label: string;
  posts: number;
  avgReach: number;
  avgSaveRate: number;
  avgLikes: number;
};

export function extractHashtags(text: string | null | undefined): string[] {
  if (!text) return [];
  const matches = text.match(/#[\p{L}\p{N}_ぁ-んァ-ヶ一-龠ー]+/gu) ?? [];
  const normalized = matches.map((tag) => tag.toLowerCase());
  return Array.from(new Set(normalized));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildHashtagAggregates(posts: PostWithMetrics[]): HashtagAggregate[] {
  const map = new Map<string, {
    posts: number;
    reaches: number[];
    saveRates: number[];
    likes: number[];
    totalSaves: number;
    recentPostTitle: string | null;
    recentPostedAt: string | null;
  }>();

  for (const post of posts) {
    const tags = extractHashtags(post.caption);
    for (const tag of tags) {
      const current = map.get(tag) ?? {
        posts: 0,
        reaches: [],
        saveRates: [],
        likes: [],
        totalSaves: 0,
        recentPostTitle: null,
        recentPostedAt: null
      };

      current.posts += 1;
      if (typeof post.reach === 'number') current.reaches.push(post.reach);
      if (typeof post.save_rate === 'number') current.saveRates.push(post.save_rate);
      if (typeof post.like_count === 'number') current.likes.push(post.like_count);
      current.totalSaves += post.save_count ?? 0;

      if (!current.recentPostedAt || (post.posted_at ?? '') > current.recentPostedAt) {
        current.recentPostedAt = post.posted_at;
        current.recentPostTitle = post.title;
      }

      map.set(tag, current);
    }
  }

  return Array.from(map.entries())
    .map(([tag, row]) => ({
      tag,
      posts: row.posts,
      avgReach: average(row.reaches),
      avgSaveRate: average(row.saveRates),
      avgLikes: average(row.likes),
      totalSaves: row.totalSaves,
      recentPostTitle: row.recentPostTitle,
      recentPostedAt: row.recentPostedAt
    }))
    .sort((a, b) => b.avgSaveRate - a.avgSaveRate);
}

export function buildHashtagSetPerformance(posts: PostWithMetrics[]): HashtagSetPerformance[] {
  const map = new Map<string, { posts: number; reaches: number[]; saveRates: number[]; likes: number[] }>();

  for (const post of posts) {
    const tags = extractHashtags(post.caption);
    if (tags.length === 0) continue;
    const key = tags.join(' ');
    const current = map.get(key) ?? { posts: 0, reaches: [], saveRates: [], likes: [] };
    current.posts += 1;
    if (typeof post.reach === 'number') current.reaches.push(post.reach);
    if (typeof post.save_rate === 'number') current.saveRates.push(post.save_rate);
    if (typeof post.like_count === 'number') current.likes.push(post.like_count);
    map.set(key, current);
  }

  return Array.from(map.entries())
    .map(([key, row]) => ({
      key,
      label: key,
      posts: row.posts,
      avgReach: average(row.reaches),
      avgSaveRate: average(row.saveRates),
      avgLikes: average(row.likes)
    }))
    .sort((a, b) => b.avgSaveRate - a.avgSaveRate)
    .slice(0, 20);
}
