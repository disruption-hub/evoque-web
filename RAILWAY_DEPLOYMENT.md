# Railway Deployment Configuration

## Setup

1. Connect your repository to Railway
2. Set the **Root Directory** to `evoque-api/` (or leave as root if deploying from monorepo root)
3. Set the **Dockerfile Path** to `Dockerfile` (or `evoque-api/Dockerfile` if root is monorepo root)
4. Configure environment variables

## Configure Watch Paths

To prevent deployments when unrelated files change, configure **Watch Paths** in Railway:

1. Go to your Railway service settings
2. Navigate to **Deploy** → **Watch Paths**
3. Add the following watch paths (relative to repository root):

   ```
   evoque-api/apps/evoque-api/**
   evoque-api/prisma/**
   evoque-api/prisma.config.ts
   evoque-api/package.json
   evoque-api/nx.json
   evoque-api/tsconfig.base.json
   evoque-api/Dockerfile
   evoque-api/railway.json
   ```

This ensures the `evoque-api` service only deploys when:
- Files in `evoque-api/apps/evoque-api/` change
- Prisma schema or config changes
- Root configuration files change
- Dockerfile or railway.json changes

**Excluded paths** (won't trigger deployments):
- `apps/websocket/**` - WebSocket service (separate deployment)
- `apps/evoque-web/**` - Web app (separate deployment)
- `apps/*-e2e/**` - E2E tests
- Other unrelated files

**Note**: The `.railwayignore` file helps exclude files from the Docker build context, but watch paths in Railway's dashboard control which file changes trigger deployments.

