# Vercel Setup Instructions

## The Problem

When running `vercel build`, Vercel detects Nx and tries to adjust default settings, but it's looking for `package.json` in the wrong location:
```
/vercel/path0/evoque-api/apps/evoque-web/package.json
```

## Solution 1: Set Root Directory in Vercel Dashboard (Recommended)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **General**
3. Set **Root Directory** to: `evoque-api`
4. Click **Save**

This tells Vercel that all commands should run from the `evoque-api` directory where the `package.json` file exists.

## Solution 2: Run vercel build from evoque-api directory

When running `vercel build` locally or in CI, make sure you're in the `evoque-api` directory:

```bash
cd evoque-api
vercel build
```

## Solution 3: Update Vercel Project Settings

If you're using Vercel CLI or dashboard, ensure these settings:

**Root Directory:** `evoque-api` (not empty, not `evoque-api/apps/evoque-web`)

**Install Command:** `npm install --legacy-peer-deps`

**Build Command:** `npm install --legacy-peer-deps && npx nx build evoque-web --skip-nx-cache`

**Output Directory:** `dist/apps/evoque-web/.next`

The `vercel.json` file in the `evoque-api` directory should be automatically detected when the root directory is set correctly.

## Important Notes

- The `package.json` is located at: `evoque-api/package.json`
- The `vercel.json` is located at: `evoque-api/vercel.json`
- Vercel's Nx detection should work once the root directory is correctly set
- All build commands should run from the `evoque-api` directory

## Testing Locally

To test the build locally (if you have Vercel CLI installed):

```bash
cd evoque-api
vercel build
```

Make sure you're in the `evoque-api` directory when running this command.
