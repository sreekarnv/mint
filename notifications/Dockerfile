# Multi-stage build for production
FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies stage
FROM base AS dependencies
RUN pnpm install

# Production dependencies stage
FROM base AS prod-dependencies
RUN pnpm install --prod

# Build stage
FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN pnpm build || echo "No build script found"

# Production stage
FROM node:22-alpine AS production

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

WORKDIR /app

# Copy production dependencies and source
COPY --from=prod-dependencies /app/node_modules ./node_modules
COPY --from=base /app/package.json ./
COPY . .

# Expose the port
EXPOSE 4002

# Start the application using tsx
CMD ["pnpm", "exec", "tsx", "src/server.ts"]

# Development stage
FROM base AS development

WORKDIR /app

# Copy dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Expose the port
EXPOSE 4002

# Start with tsx watch mode (with polling for Docker compatibility)
CMD ["pnpm", "exec", "tsx", "watch", "src/server.ts"]
