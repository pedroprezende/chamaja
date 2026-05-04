# ChamaJá - Services Marketplace

## Overview
ChamaJá is a Brazilian services marketplace app built with Expo (React Native) + Express + tRPC. It connects users with local service providers across categories like repairs, automotive, beauty, health, and more.

## Architecture

- **Frontend**: Expo / Metro bundler (React Native Web), running on port 5000
- **Backend**: Express + tRPC server, running on port 3000
- **Database**: MySQL via Drizzle ORM (`DATABASE_URL` env var required)
- **Auth**: Firebase + custom OAuth (Manus platform OAuth)
- **Styling**: NativeWind (TailwindCSS for React Native)

## Project Structure

```
app/          - Expo Router pages (file-based routing)
components/   - Shared UI components
constants/    - App constants including OAuth config
drizzle/      - Database schema and migrations
hooks/        - React hooks
lib/          - Core libraries (auth, Firebase, tRPC client, theme)
server/       - Express backend
  _core/      - Core server setup (index, OAuth, context, env, cookies)
  routers.ts  - tRPC router definitions
  db.ts       - Database access functions
  storage.ts  - Storage helpers
shared/       - Shared constants between frontend and backend
scripts/      - Utility scripts (env loader, QR code generator)
```

## Development

```bash
pnpm dev          # Run both frontend and backend concurrently
pnpm dev:server   # Run backend only (port 3000)
pnpm dev:metro    # Run Expo Metro web only (port 5000)
pnpm db:push      # Run Drizzle migrations
```

## Key Configuration

- **Metro port**: 5000 (configured for Replit webview)
- **API port**: 3000 (Express backend)
- **URL derivation**: Frontend derives API URL by replacing `5000-` with `3000-` in the hostname (Replit proxy pattern)
- **Metro host**: Patched to listen on `0.0.0.0` for Replit proxy compatibility

## Environment Variables

Required:
- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - Cookie signing secret
- `OAUTH_SERVER_URL` - OAuth server URL
- `VITE_APP_ID` - Application ID

Firebase (EXPO_PUBLIC_ prefix):
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

## Workflow

Single workflow: **Start application** (`pnpm dev`)
- Runs Metro (port 5000) + Express server (port 3000) concurrently

## Deployment

Configured as `autoscale` deployment target.
