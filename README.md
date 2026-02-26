# Instagram Growth Insights MVP

Instagram Business / Creator アカウント向けの、フォロワー獲得分析MVPです。

## できること（MVP）
- Instagram OAuth連携（Meta / Instagram Login想定）
- アカウント日次インサイト取得（reach, profile_views, follows, followers_count など）
- 投稿/リール単位のインサイト取得（save, share, reach, plays など）
- Supabaseに日次スナップショット保存
- フォロワー獲得向けダッシュボード（7日純増、プロフィール訪問率、保存率ランキング）

## 構成
- Next.js (App Router)
- Supabase (Postgres)
- Meta Instagram API

## セットアップ
1. 依存関係をインストール
```bash
npm install
```

2. 環境変数を設定
```bash
cp .env.example .env.local
```

3. Supabase にスキーマを適用
- `/Users/hazuki/Documents/New project/supabase/schema.sql` を SQL Editor で実行

4. Meta App を設定
- Instagram Login を有効化
- Redirect URI を `.env.local` の `META_REDIRECT_URI` に合わせる
- 必要スコープを許可

5. 起動
```bash
npm run dev
```

## 主要ルート
- `/` ダッシュボード
- `/connect` Instagram連携開始
- `GET /api/auth/instagram/url` OAuth URL取得
- `GET /api/auth/instagram/callback` OAuthコールバック
- `POST /api/instagram/sync` 手動同期
- `GET/POST /api/cron/daily-sync` Cron同期（`Authorization: Bearer <CRON_SECRET>`）

## 日次自動同期（本番 / Vercel Cron）
このプロジェクトは `vercel.json` を同梱しており、Vercel デプロイ時に毎日 1 回 Cron 実行されます。

- スケジュール: `15 0 * * *`（UTC, 毎日 00:15）
- 実行先: `/api/cron/daily-sync`

### Vercel 側で必要な環境変数
- `CRON_SECRET`（長いランダム文字列）
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `META_APP_ID`
- `META_APP_SECRET`
- `META_REDIRECT_URI`（本番URLの callback）
- `META_GRAPH_BASE_URL`（Instagram Login構成なら `https://graph.instagram.com`）
- `INSTAGRAM_OAUTH_AUTHORIZE_URL`
- `INSTAGRAM_OAUTH_TOKEN_URL`

### 手動でCron疎通確認（本番/ローカル）
`CRON_SECRET` を設定した状態で、以下を実行:

```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://<your-domain>/api/cron/daily-sync
```

ローカル確認（ngrok経由）:

```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://<your-ngrok-domain>.ngrok-free.app/api/cron/daily-sync
```

### 運用メモ
- `upsert` 保存なので日次の再実行は基本安全です（同日上書き）
- `CRON_SECRET` は漏えい時にすぐローテーションしてください
- 時刻を日本時間に合わせたい場合は Cron を UTC換算で調整してください

## 注意
- Meta側のアプリ設定・レビュー状況によって取得可能指標が変わります。
- 一部メトリクス名はアカウント種別/メディア種別で差分があるため、`lib/meta.ts` にフォールバックを入れています。
- 本番前に APIレスポンスを見ながらメトリクス名の調整が必要です。
