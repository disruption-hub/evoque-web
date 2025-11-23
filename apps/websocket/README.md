# WebSocket Pusher API

WebSocket API service using Pusher for real-time communication.

## Railway Deployment

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed deployment instructions and troubleshooting.

**Quick Setup:**
1. Create a new Railway service
2. **CRITICAL**: Set the **Root Directory** to the monorepo root (`/`) - NOT `websocket/`
3. Set the **Dockerfile Path** to `websocket/Dockerfile` (NOT `apps/websocket/Dockerfile`)
4. Configure environment variables (see below)
5. Configure Watch Paths (see RAILWAY_DEPLOYMENT.md for details)
6. Deploy

**Note**: The Dockerfile assumes the build context is the monorepo root, so Railway must be configured with the root directory set to the monorepo root.

## Environment Variables

See `.env.example` for required environment variables:
- `PORT` - Server port (default: 4001)
- `JWT_SECRET` - JWT secret for authentication
- `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` - Pusher credentials
- `DATABASE_URL` - PostgreSQL connection string
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins

## Local Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Production Start

```bash
npm run start:prod
```

