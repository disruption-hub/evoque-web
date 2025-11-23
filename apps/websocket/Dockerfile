# Use Node.js 22
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files from monorepo root
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Install dependencies
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client before build
# Need to use evoque-api's prisma config
# DATABASE_URL is required by prisma.config.ts but not needed for generation
# Using a dummy URL just to satisfy the config validation
WORKDIR /app/evoque-api
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Build the NestJS websocket application
# Need to build from evoque-api workspace, not root workspace
WORKDIR /app/evoque-api
RUN npx nx build websocket

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy package.json to install Prisma dependencies at root
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# Install Prisma runtime dependencies at root level
# These are needed because the generated Prisma Client at /app/evoque-api/generated/prisma requires them
# Node.js will resolve these from /app/node_modules when the generated client requires them
RUN npm install --omit=dev --no-save \
    @prisma/client@^7.0.0 \
    @prisma/client-runtime-utils@7.0.0 \
    @prisma/adapter-pg@^7.0.0 \
    pg@^8.16.3 \
    tsconfig-paths@^4.2.0

# Copy generated Prisma client (needed at runtime)
COPY --from=builder /app/evoque-api/generated ./evoque-api/generated

# Copy built application (built from evoque-api workspace, so output is in evoque-api/dist)
COPY --from=builder /app/evoque-api/dist/apps/websocket ./dist/apps/websocket

# Install production dependencies from the built package.json
WORKDIR /app/dist/apps/websocket
RUN npm install --omit=dev

# Go back to app root
WORKDIR /app

# Expose port (Railway will set PORT env var)
EXPOSE 4001

# Start the application with tsconfig-paths to resolve @generated/prisma imports
CMD ["node", "-r", "tsconfig-paths/register", "dist/apps/websocket/main.js"]

