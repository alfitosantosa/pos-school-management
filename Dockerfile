# ==========================================
# PRODUCTION-READY DOCKERFILE - OPTIMIZED FOR SIZE
# ==========================================

# Stage 1: Dependencies (Minimal cache)
FROM node:24-alpine AS deps
WORKDIR /app

# Install dependencies in single layer dengan cleanup
RUN apk add --no-cache curl \
    && rm -rf /var/cache/apk/* /tmp/*

# Copy package files
COPY package.json package-lock.json* yarn.lock* bun.lock* ./

# Install dependencies dan cleanup dalam satu layer
RUN npm install  \
    && rm -rf /tmp/*

# ==========================================
# Stage 2: Builder (dengan cleanup aggressive)
FROM node:24-alpine AS builder
WORKDIR /app

# Copy dependencies dari deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    SKIP_ENV_VALIDATION=1

# Generate Prisma & Build dalam single layer dengan cleanup
RUN npx prisma generate \
    && npm run build \
    && rm -rf /tmp/* \
    && rm -rf .next/cache \
    && rm -rf node_modules/.cache \
    && find . -name "*.map" -type f -delete \
    && find . -name "*.test.*" -type f -delete

# ==========================================
# Stage 3: Production Runner (Ultra minimal)
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Install curl dan cleanup dalam satu layer
RUN apk add --no-cache curl \
    && rm -rf /var/cache/apk/* /tmp/*

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy hanya file yang dibutuhkan
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma (hanya yang diperlukan)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Switch to non-root user
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/api/health || exit 1

CMD ["node", "server.js"]