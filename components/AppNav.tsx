'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems: Array<{ href: '/' | '/series' | '/posts' | '/hashtags' | '/connect'; label: string }> = [
  { href: '/', label: 'ダッシュボード' },
  { href: '/series', label: 'シリーズ分析' },
  { href: '/posts', label: '投稿一覧・編集' },
  { href: '/hashtags', label: 'ハッシュタグ分析' },
  { href: '/connect', label: '連携' }
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <aside className="app-nav">
      <div className="app-title">思考の取説ノート｜つき 🌙</div>
      <nav>
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`nav-link ${active ? 'active' : ''}`}>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
