# Vercel Deployment Guide

This guide explains how to deploy the `evoque-web` Next.js application to Vercel.

## Prerequisites

1. Vercel account (sign up at https://vercel.com)
2. GitHub/GitLab/Bitbucket repository connected to Vercel
3. PostgreSQL database (for Prisma)
4. AWS S3 bucket configured (for media uploads)

## Project Structure

This is an Nx monorepo with the Next.js app located at:
```
evoque-api/apps/evoque-web
```

## Deployment Steps

### 1. Connect Repository to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your Git repository
4. Configure the project settings (see below)

### 2. Configure Vercel Project Settings

In the Vercel dashboard, configure these settings:

**Project Name:**
```
evoque-web
```

**Framework Preset:**
```
Next.js
```

**Build Command:**
```bash
npm install --legacy-peer-deps && npx nx build evoque-web --skip-nx-cache
```

**Output Directory:**
```
dist/apps/evoque-web/.next
```

**Install Command:**
```bash
npm install --legacy-peer-deps
```

**Root Directory:**
```
evoque-api
```
(Set this in Vercel dashboard if deploying from monorepo root)

**Node Version:**
```
20.x (or latest LTS)
```

### 3. Environment Variables

Add the following environment variables in the Vercel dashboard:

#### Required Variables:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-jwt-secret-key-here
NODE_ENV=production
```

#### AWS S3 Configuration (choose one approach):

**Option A: Server-side only (recommended for security):**
```env
S3_ACCESS_KEY_ID=your-access-key-id
S3_SECRET_ACCESS_KEY=your-secret-access-key
S3_BUCKET_NAME=your-bucket-name
S3_REGION=us-east-1
S3_URL_PREFIX=https://your-bucket.s3.us-east-1.amazonaws.com
```

**Option B: Client-side access (if needed):**
```env
NEXT_PUBLIC_S3_ACCESS_KEY_ID=your-access-key-id
NEXT_PUBLIC_S3_SECRET_ACCESS_KEY=your-secret-access-key
NEXT_PUBLIC_S3_BUCKET_NAME=your-bucket-name
NEXT_PUBLIC_S3_REGION=us-east-1
NEXT_PUBLIC_S3_URL_PREFIX=https://your-bucket.s3.us-east-1.amazonaws.com
```

#### Optional Variables:

```env
NEXT_PUBLIC_API_URL=https://your-api-url.com
```

### 4. Database Setup

Before deploying, ensure your PostgreSQL database is accessible from Vercel's serverless functions:

1. Set up a PostgreSQL database (recommended: Vercel Postgres, Supabase, or Neon)
2. Update the `DATABASE_URL` environment variable
3. Run Prisma migrations:

```bash
cd evoque-api
npx prisma migrate deploy
```

Or manually run migrations if using a separate migration tool.

### 5. Prisma Schema Location

The Prisma schema is located at:
```
evoque-api/prisma/schema.prisma
```

Prisma generates the client to:
```
evoque-api/generated/prisma
```

Ensure this path is correct in your `tsconfig.base.json` and `tsconfig.json` files.

### 6. Build Configuration

The `vercel.json` file in the `evoque-api` directory configures:
- Build command
- Output directory
- Framework detection
- Root directory

### 7. Deployment

Once configured:

1. Push your code to the connected Git repository
2. Vercel will automatically detect the push and start a new deployment
3. Monitor the deployment in the Vercel dashboard
4. Check build logs if any issues occur

### 8. Post-Deployment

After successful deployment:

1. Verify all environment variables are set correctly
2. Test database connectivity
3. Test API routes
4. Test file uploads (S3 integration)
5. Monitor function logs in Vercel dashboard

## Troubleshooting

### Build Fails

**Issue:** Build command fails
**Solution:** 
- Check that `NODE_ENV=production` is set
- Ensure all dependencies are installed with `--legacy-peer-deps`
- Check build logs for specific errors

### Prisma Client Errors

**Issue:** Prisma client not found or adapter errors
**Solution:**
- Ensure `DATABASE_URL` is set in environment variables
- Check that Prisma client is generated: `npx prisma generate`
- Verify adapter setup in `src/lib/prisma.ts`

### Environment Variables Not Working

**Issue:** Environment variables not accessible
**Solution:**
- Restart the deployment after adding new environment variables
- Check that variables are prefixed correctly (`NEXT_PUBLIC_` for client-side)
- Verify variables are set for the correct environment (Production/Preview/Development)

### Database Connection Issues

**Issue:** Cannot connect to database
**Solution:**
- Verify `DATABASE_URL` is correct
- Check database allows connections from Vercel IPs
- Ensure SSL is enabled if required: `DATABASE_URL=postgresql://...?sslmode=require`

### S3 Upload Issues

**Issue:** File uploads fail
**Solution:**
- Verify AWS credentials are correct
- Check S3 bucket permissions
- Verify CORS configuration on S3 bucket allows Vercel domain
- Check environment variables are set correctly

## Additional Notes

- The application uses Next.js 16 with the App Router
- Server components are used for admin layouts
- API routes handle database operations
- Media uploads use AWS S3
- Authentication uses JWT tokens

## Support

For issues or questions:
1. Check Vercel deployment logs
2. Review application logs
3. Check environment variable configuration
4. Verify database and S3 connectivity

