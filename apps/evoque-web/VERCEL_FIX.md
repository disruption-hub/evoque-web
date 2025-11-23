# Vercel Deployment Fix for evoque-web

## The Problem

When you set the Root Directory in Vercel to `evoque-api/apps/evoque-web`, Vercel looks for `package.json` in that directory, but it doesn't exist there. The `package.json` and `nx.json` are located in `evoque-api/`.

## Solution: Change Root Directory in Vercel Dashboard

**This is the recommended fix:**

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Navigate to your project → **Settings** → **General**
3. Under **Root Directory**, change it from `evoque-api/apps/evoque-web` to: `evoque-api`
4. Click **Save**
5. Redeploy your project

The `vercel.json` file in the `evoque-api/` directory will be automatically used, which has the correct configuration.

## Why This Works

- The `package.json` is at: `evoque-api/package.json` ✓
- The `nx.json` is at: `evoque-api/nx.json` ✓
- The `vercel.json` is at: `evoque-api/vercel.json` ✓
- All build commands run from `evoque-api/` where Nx can find everything it needs

## Alternative: If You Must Keep Root as `evoque-api/apps/evoque-web`

If you absolutely need to keep the root directory as `evoque-api/apps/evoque-web`, the `vercel.json` in this directory should work, but you may encounter issues with Vercel's Nx detection. The paths in the vercel.json are correct (going up two levels to reach `evoque-api/`), but Vercel's automatic Nx detection might fail.

In that case, you may need to:
1. Ensure the build command explicitly changes to the correct directory
2. Make sure all paths are relative to `evoque-api/apps/evoque-web`

However, **changing the root directory to `evoque-api` is strongly recommended** as it's the standard approach for Nx monorepos.

