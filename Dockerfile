# Shipvisualization – Docker für Coolify/Self-Hosting
# Next.js 15 Standalone Build

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-Zeit Env (für NEXT_PUBLIC_*)
ARG NEXT_PUBLIC_ZSG_API_URL
ENV NEXT_PUBLIC_ZSG_API_URL=${NEXT_PUBLIC_ZSG_API_URL}

RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Standalone-Ausgabe + public + static
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
