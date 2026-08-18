# ==========================================
# PRODUCTION-READY DOCKERFILE
# NEXT.JS + BUN + PRISMA
# ==========================================

# ==========================================
# Stage 1: Dependencies
# ==========================================
FROM oven/bun:latest-alpine AS deps

WORKDIR /app

# Copy dependency files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile


# ==========================================
# Stage 2: Builder
# ==========================================
FROM oven/bun:latest-alpine AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source
COPY . .

# Environment variables
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    SKIP_ENV_VALIDATION=1

# Prisma generate + Next.js build
RUN bunx prisma generate && \
    bun run build && \
    rm -rf /tmp/* \
    .next/cache \
    node_modules/.cache


# ==========================================
# Stage 3: Production Runner
# ==========================================
FROM oven/bun:latest-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8788 \
    HOSTNAME=0.0.0.0

# Install curl untuk healthcheck
RUN apk add --no-cache curl

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public
COPY --from=builder /app/public ./public

# Copy package.json
COPY --from=builder /app/package.json ./package.json

# Copy standalone Next.js
COPY --from=builder --chown=nextjs:nodejs \
    /app/.next/standalone ./

# Copy static files
COPY --from=builder --chown=nextjs:nodejs \
    /app/.next/static ./.next/static

# Switch user
USER nextjs

EXPOSE 8788

# Healthcheck
HEALTHCHECK \
    --interval=30s \
    --timeout=10s \
    --start-period=40s \
    --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Next.js standalone server
CMD ["bun", "server.js"]