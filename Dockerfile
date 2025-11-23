# Use Node.js 18 LTS
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
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

# Build the NestJS application
RUN npx nx build evoque-api

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/dist/apps/evoque-api ./dist/apps/evoque-api

# Install production dependencies from the built package.json
WORKDIR /app/dist/apps/evoque-api
RUN npm install --omit=dev

# Go back to app root
WORKDIR /app

# Expose port (Railway will set PORT env var)
EXPOSE 3000

# Start the application
CMD ["node", "dist/apps/evoque-api/main.js"]

