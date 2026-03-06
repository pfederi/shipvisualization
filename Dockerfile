# Shipvisualization – Docker für Coolify
# Next.js 15 Standalone Build

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Dependencies (inkl. devDependencies für Build: tailwind, postcss, typescript, etc.)
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
ENV NODE_ENV=development
RUN npm ci

# Builder
FROM base AS builder
RUN apk add --no-cache util-linux
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_ZSG_API_URL
ENV NEXT_PUBLIC_ZSG_API_URL=${NEXT_PUBLIC_ZSG_API_URL}
ENV NODE_ENV=production

# Optional: Build auf wenige CPUs beschränken (z. B. --build-arg BUILD_CPUS=2)
# 0 oder leer = alle CPUs
ARG BUILD_CPUS=0
RUN if [ "$BUILD_CPUS" -gt 0 ] 2>/dev/null; then \
      taskset -c $(seq -s, 0 $((BUILD_CPUS-1))) npm run build; \
    else npm run build; fi

# Runner
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Standalone + public + static (Next.js)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# data/ wird zur Laufzeit von admin-config gelesen
COPY --from=builder --chown=nextjs:nodejs /app/data ./data

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
