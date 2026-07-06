# Build Vite
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Use a placeholder as default so the built assets can be patched at container runtime
# by the entrypoint script with the actual `VITE_API_URL` provided by Render.
ARG VITE_API_URL=%%VITE_API_URL%%
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Nginx pour servir le build
FROM nginx:1.25-alpine AS runner

LABEL maintainer="TontiTrack"

# Copier le build depuis l'étape builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Config Nginx custom
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Supprimer la config Nginx par défaut si présent
RUN rm -f /etc/nginx/conf.d/default.conf.default || true

# Entrypoint script will replace placeholders in built assets with runtime env vars
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget -qO- http://localhost:80 || exit 1

ENTRYPOINT ["/entrypoint.sh"]
