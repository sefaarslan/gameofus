# syntax=docker/dockerfile:1
# Self-host (Coolify / Docker) imajı. Vercel bu dosyayı kullanmaz.
# Derleme:  docker build -t gameofus \
#             --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
#             --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=... \
#             --build-arg NEXT_PUBLIC_SITE_URL=https://gameofus.app .
# Gizli anahtarlar (SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY, ...) imaja GİRMEZ; çalışma zamanında ortam değişkeni olarak verilir.
# Mimari: aynı Dockerfile hem amd64 hem arm64 (Hetzner CAX) için derlenir.
FROM node:22-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* değerleri derleme sırasında istemci koduna gömülür; bu yüzden build arg'dır.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    BUILD_STANDALONE=1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# `standalone` çıktısı yalnızca gereken node_modules'u içerir; public ve statik dosyalar ayrıca kopyalanır.
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
