# React (Vite) + Strapi 開発環境セットアップ設計

## 目的・スコープ

React + Vite (フロントエンド) と Strapi + PostgreSQL (バックエンド) の**開発環境**を構築する。

- 対象: ローカル開発環境のみ
- 対象外（将来対応）: 本番用Dockerfile、`compose.production-like.yaml`、S3/MinIO、ECS、CI/CD

将来的に本番展開する前提はあるが、今回のタスクでは開発時にストレスなく動く状態を作ることに集中する。

## 全体構成

```
react-vite-strapi/
├─ frontend/                     React + Vite + TypeScript
│  ├─ src/
│  ├─ vite.config.ts             /api, /uploads を Strapi へプロキシ
│  ├─ package.json
│  ├─ package-lock.json          コミット対象（バージョン固定）
│  └─ .env.development
├─ backend/                      Strapi (TypeScript, Strapi 5系)
│  ├─ src/
│  ├─ config/
│  ├─ public/uploads/            ローカル保存（.gitignoreでファイル自体は除外）
│  ├─ package.json
│  └─ package-lock.json          コミット対象（バージョン固定）
├─ compose.yaml                  db(postgres) + strapi(develop)
├─ .env                          Compose用の環境変数（.gitignore対象）
├─ .env.example                  上記のテンプレート（コミット対象）
├─ .node-version                 Node.js バージョン固定（24系LTS）
├─ .gitignore
└─ README.md
```

モノレポ管理ツール（Turborepo等）は導入しない。単純なディレクトリ分割で十分な規模。

## フロントエンド（ホストOS上で `npm run dev`）

- `npm create vite@latest frontend -- --template react-ts` で作成
- Node.js 24 LTS を前提とする（`.node-version` と `package.json` の `engines.node` に明記）
- パッケージマネージャは npm（`package-lock.json` をコミット）
- `vite.config.ts` に以下のプロキシ設定を追加

  ```typescript
  server: {
    port: 5173,
    proxy: {
      "/api": { target: env.DEV_API_PROXY_TARGET ?? "http://localhost:1337", changeOrigin: true },
      "/uploads": { target: env.DEV_API_PROXY_TARGET ?? "http://localhost:1337", changeOrigin: true },
    },
  }
  ```

- `.env.development` に `DEV_API_PROXY_TARGET=http://localhost:1337`
- React側はAPIを相対パス（例: `fetch("/api/articles")`）で呼び出す。ホスト名を意識しない実装にする

## バックエンド + DB（Docker Compose）

- `npx create-strapi-app@latest backend --typescript --no-run` で作成し、データベースはPostgreSQLを指定
- `compose.yaml` に以下の2サービスを定義

  - `db`: `postgres:17-alpine`、named volume でデータ永続化、`pg_isready` によるhealthcheck
  - `strapi`: `npm run develop` で起動。ソースコードをbind mount、`node_modules` は専用named volumeで分離（ホストとコンテナのネイティブ依存差異を避ける）、`public/uploads` をbind mountしてアップロードファイルをホストにも反映。`depends_on: db (service_healthy)`

- Strapiの各種シークレット（`APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `ENCRYPTION_KEY`）は開発用のダミー値を `.env` に定義し、Composeが読み込む
- データベース接続はPostgreSQLを使用し、本番と同一製品にする（SQLiteは使わない）

## 環境変数

- `.env.example` をコミットし、実際の `.env`（DB接続情報・Strapiシークレット等の値）は `.gitignore` 対象
- フロントエンドの `.env.development` はダミーのローカル向け値のみを含むためコミット対象

## アップロードファイル

- 開発時点は `public/uploads`（ローカルファイルシステム）にシンプルに保存
- 本番移行時はStrapi公式のS3プロバイダー設定を追加するだけで対応可能な設計とする（今回は実装しない）

## 動作確認手順

1. `docker compose up db strapi` を実行
2. `http://localhost:1337/admin` にアクセスし、管理者アカウントを作成
3. `cd frontend && npm ci && npm run dev` を実行
4. `http://localhost:5173` にアクセスし、Reactアプリが表示されることを確認
5. Reactから `/api/*` 経由でStrapiのコンテンツにアクセスできることを確認（プロキシ疎通確認）

## Git

- `git init` 済み、`.gitignore` に `node_modules/`, `.env`, `public/uploads/*`（`.gitkeep`は残す）, ビルド成果物等を含める
- 初期セットアップ内容を最初のコミットとして記録する
