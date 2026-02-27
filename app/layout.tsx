import type { Metadata } from 'next';
import './globals.css';
import AppNav from '@/components/AppNav';

export const metadata: Metadata = {
  title: 'Instagram Growth Insights MVP',
  description: 'Follower acquisition dashboard for Instagram professional accounts.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Noto+Serif+JP:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="app-shell">
          <AppNav />
          <div className="app-main">{children}</div>
        </div>
      </body>
    </html>
  );
}
