# ── Base image ─────────────────────────────────────────────
FROM node:20-slim AS base

WORKDIR /app

# ── Dépendances production uniquement ──────────────────────
FROM base AS deps

COPY package*.json ./
RUN npm ci --only=production


# ── Runtime production ──────────────────────────────────────
FROM base AS runner

LABEL maintainer="TontiTrack"
LABEL version="1.0.0"

WORKDIR /app

# Installer les dépendances production
COPY --from=deps /app/node_modules ./node_modules

# Copier le code source
COPY --chown=node:node . .

# Dossier writable (logs / uploads)
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

# Sécurité : user non-root officiel Node
USER node

# Port API
EXPOSE 5000

ENV NODE_ENV=production

# Healthcheck sans dépendances externes
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start app
CMD ["node", "src/server.js"]