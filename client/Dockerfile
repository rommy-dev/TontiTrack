# Build Vite
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Nginx pour servir le build
FROM nginx:1.25-alpine AS runner

LABEL maintainer="TontiTrack"

# Copier le build depuis l'étape builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Config Nginx custom
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Supprimer la config Nginx par défaut
RUN rm -f /etc/nginx/conf.d/default.conf.default

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget -qO- http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
