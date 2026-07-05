# ── Étape 1 : Installation des dépendances de production ───────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# ── Étape 1b : Dépendances complètes (dev + prod) pour le développement ─────
FROM node:20-alpine AS deps-dev

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Point d'entrée dev avec hot reload via nodemon
CMD ["npx", "nodemon", "src/server.js"]

# Image de production
FROM node:20-alpine AS runner

# Métadonnées
LABEL maintainer="TontiTrack"
LABEL version="1.0.0"

WORKDIR /app

# Créer un user non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S nodeuser -u 1001

# Copier les dépendances de prod depuis l'étape deps
COPY --from=deps /app/node_modules ./node_modules

# Copier le code source
COPY --chown=nodeuser:nodejs . .

# Créer le dossier writable
RUN mkdir -p /app/uploads && \
    chown -R nodeuser:nodejs /app/uploads
    
# Passer au user non-root
USER nodeuser

# Port exposé (documentation)
EXPOSE 5000

# Variables d'environnement par défaut
ENV NODE_ENV=production

# Health check — Docker redémarre le container si l'API ne répond plus
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

# Démarrage — server.js est le vrai point d'entrée (contient app.listen)
CMD ["node", "src/server.js"]
