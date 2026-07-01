# react-vite-strapi

Local development setup for a React (Vite) frontend and a Strapi + PostgreSQL backend.

## Prerequisites

- Node.js 24.x (see `.node-version`)
- Docker + Docker Compose

## First-time setup

1. Copy `.env.example` to `.env` and fill in real values:
   - Generate each Strapi secret with `openssl rand -base64 32`
   - Pick a local `DATABASE_PASSWORD`
2. Start the backend + database:
   ```bash
   docker compose up db strapi
   ```
3. Open http://localhost:1337/admin and create the first admin user.
4. In a separate terminal, start the frontend:
   ```bash
   cd frontend
   npm ci
   npm run dev
   ```
5. Open http://localhost:5173 — API calls to `/api/*` and `/uploads/*` are proxied to Strapi.

## Repository layout

- `frontend/` — React + Vite + TypeScript app (runs on the host)
- `backend/` — Strapi + TypeScript app (runs in Docker)
- `compose.yaml` — `db` (PostgreSQL) and `strapi` services for local development
