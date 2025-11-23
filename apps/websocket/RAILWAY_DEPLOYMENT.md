# Railway Deployment Configuration for WebSocket Service

## Setup

1. Connect your repository to Railway
2. **CRITICAL**: Set the **Root Directory** to the monorepo root (`/`) - NOT `websocket/`
3. Set the **Dockerfile Path** to `websocket/Dockerfile` (NOT `apps/websocket/Dockerfile`)
4. Configure environment variables (see below)

## Configure Watch Paths

To prevent deployments when unrelated files change, configure **Watch Paths** in Railway:

1. Go to your Railway service settings
2. Navigate to **Deploy** → **Watch Paths**
3. Add the following watch paths (relative to repository root):

   ```
   websocket/**
   evoque-api/prisma/**
   evoque-api/prisma.config.ts
   evoque-api/generated/**
   package.json
   nx.json
   tsconfig.base.json
   websocket/Dockerfile
   websocket/railway.json
   ```

This ensures the `websocket` service only deploys when:
- Files in `websocket/` change
- Prisma schema or config changes (needed for Prisma Client generation)
- Root configuration files change
- Dockerfile or railway.json changes

**Excluded paths** (won't trigger deployments):
- `evoque-api/apps/**` - Evoque API service (separate deployment)
- `evoque-api/apps/evoque-web/**` - Web app (separate deployment)
- `apps/nuo/**` - Nuo app (separate deployment)
- Other unrelated files

## Environment Variables

Required environment variables:

- `PORT` - Server port (default: 4001, Railway will override this)
- `DATABASE_URL` - PostgreSQL connection string (required)
- `JWT_SECRET` - JWT secret for authentication (required)
- `PUSHER_APP_ID` - Pusher application ID (required)
- `PUSHER_KEY` - Pusher key (required)
- `PUSHER_SECRET` - Pusher secret (required)
- `PUSHER_CLUSTER` - Pusher cluster (required)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins (optional, defaults to `http://localhost:3000`)

## Common Deployment Issues

### Issue: "Cannot find module '@generated/prisma'"

**Cause**: The Dockerfile is missing Prisma runtime dependencies or path resolution.

**Solution**: Ensure the Dockerfile includes:
- Installation of `@prisma/client`, `@prisma/adapter-pg`, `pg`, and `tsconfig-paths`
- Running the app with `node -r tsconfig-paths/register`

### Issue: "Dockerfile not found"

**Cause**: Railway root directory is set incorrectly.

**Solution**: 
- Set Root Directory to `/` (monorepo root)
- Set Dockerfile Path to `websocket/Dockerfile`

### Issue: "Build fails with 'evoque-api' not found"

**Cause**: Railway root directory is set to `websocket/` instead of `/`.

**Solution**: Set Root Directory to `/` (monorepo root) so the Dockerfile can access `evoque-api/` directory.

### Issue: "Prisma Client generation fails"

**Cause**: Missing `DATABASE_URL` environment variable during build.

**Solution**: The Dockerfile uses a dummy DATABASE_URL for generation. Ensure the build completes successfully. The actual `DATABASE_URL` is only needed at runtime.

### Issue: "Port already in use" or "Cannot bind to port"

**Cause**: Railway sets the `PORT` environment variable automatically.

**Solution**: The application reads `process.env.PORT || 4001`, so Railway's port will be used automatically. No action needed.

## Verification

After deployment, verify the service is running:

1. Check Railway logs for: `🚀 WebSocket Pusher API is running on: http://localhost:${PORT}/api`
2. Test the health endpoint (if available)
3. Verify Pusher authentication endpoint is accessible

## Notes

- The `.railwayignore` file helps exclude files from the Docker build context, but watch paths in Railway's dashboard control which file changes trigger deployments.
- The Dockerfile assumes the build context is the monorepo root, so Railway must be configured with the root directory set to the monorepo root.
- Prisma Client is generated from `evoque-api/prisma/schema.prisma` during the build process.

