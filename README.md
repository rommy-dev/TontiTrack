# TontiTrack

> Plateforme de gestion de tontines et prêts collectifs — stack MERN, prête pour la production.

TontiTrack digitalise la gestion des tontines (rotating savings groups) et des prêts collectifs communautaires : suivi des contributions, calcul automatique des dettes, gestion des pénalités, notifications, exports comptables et support multi-devise.

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Démarrage rapide avec Docker Compose](#démarrage-rapide-avec-docker-compose)
- [Variables d'environnement](#variables-denvironnement)
- [Développement sans Docker](#développement-sans-docker)
- [Tests](#tests)
- [Déploiement](#déploiement)
- [Structure du projet](#structure-du-projet)
- [Licence](#licence)

## Fonctionnalités

### MVP
- Authentification JWT avec rotation des refresh tokens
- Création et gestion de groupes de tontine
- Ajout et gestion des membres
- Suivi des contributions par cycle
- Calcul automatique des dettes
- Historique complet des transactions

### Avancées
- Notifications automatiques (cron jobs)
- Dashboard analytics avec agrégations MongoDB (Recharts)
- Gestion des pénalités de retard
- Export PDF / Excel des rapports
- Support multi-devise (conversion automatique selon la devise préférée de l'utilisateur)
- Paramètres de groupe et contrôles administrateur

## Stack technique

**Backend**
- Node.js / Express — architecture Controller → Service → Model
- MongoDB (Atlas) — clusters séparés dev/prod
- JWT (access + refresh token rotatif)
- PDFKit, ExcelJS — génération de rapports
- node-cron — tâches planifiées (rappels, pénalités)
- Jest + Babel-Jest + MongoMemoryServer — tests isolés

**Frontend**
- React + Vite
- TailwindCSS
- Zustand — état global (thème dark/light, préférences UI)
- TanStack React Query — gestion des données serveur et cache
- Axios — intercepteurs pour le rafraîchissement silencieux des tokens
- Recharts — visualisation analytics

**Infrastructure**
- Docker / Docker Compose (dev et prod)
- Nginx (service statique du client en production)
- MongoDB Atlas (dual cluster : `tontitrack-dev` / `tontitrack-prod`)

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│   Client    │  HTTPS  │    Server    │  Driver │  MongoDB Atlas   │
│ React (SPA) │────────▶│ Express API  │────────▶│ (dev / prod)     │
│  + Nginx    │◀────────│  JWT Auth    │◀────────│                  │
└─────────────┘         └──────────────┘         └─────────────────┘
```

Le backend suit une séparation stricte **Controller → Service → Model** :
- **Controller** : validation des requêtes HTTP, pas de logique métier
- **Service** : logique métier pure (calcul de dettes, transactions de compensation, machines à état)
- **Model** : schémas Mongoose et contraintes de données

Principe clé : **immuabilité financière**. Les corrections ne modifient jamais un enregistrement existant ; elles créent une transaction de compensation, garantissant une piste d'audit complète.

## Prérequis

- Docker et Docker Compose installés
- Un compte MongoDB Atlas (ou MongoDB local si vous adaptez `docker-compose.yml`)
- Node.js 18+ (uniquement si vous développez sans Docker)

## Démarrage rapide avec Docker Compose

1. Cloner le repo :
   ```bash
   git clone https://github.com/rommy-dev/tontitrack.git
   cd tontitrack
   ```

2. Créer les fichiers d'environnement à partir des exemples :
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```
   Puis renseigner vos valeurs (URI MongoDB, secrets JWT, etc. — voir [Variables d'environnement](#variables-denvironnement)).

3. Lancer l'environnement de développement :
   ```bash
   docker compose up --build
   ```

4. Lancer en arrière-plan (detached) :
   ```bash
   docker compose up -d --build
   ```

5. Voir les logs d'un service spécifique :
   ```bash
   docker compose logs -f server
   docker compose logs -f client
   ```

6. Arrêter les services :
   ```bash
   docker compose down
   ```

7. Arrêter et supprimer les volumes (reset complet, y compris données Mongo locales le cas échéant) :
   ```bash
   docker compose down -v
   ```

8. Reconstruire un seul service après modification de son `Dockerfile` :
   ```bash
   docker compose build server
   docker compose up -d server
   ```

### Environnement de production (local)

Pour tester la configuration de production en local avant déploiement :

```bash
docker compose -f docker-compose.prod.yml up --build
```

```bash
docker compose -f docker-compose.prod.yml down
```

## Variables d'environnement

### `server/.env`

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` / `production` |
| `PORT` | Port d'écoute du serveur Express |
| `MONGODB_URI` | URI de connexion Atlas (dev ou prod selon l'environnement) |
| `JWT_ACCESS_SECRET` | Secret de signature des access tokens |
| `JWT_REFRESH_SECRET` | Secret de signature des refresh tokens (distinct du précédent) |
| `JWT_ACCESS_EXPIRY` | Durée de vie de l'access token (ex : `15m`) |
| `JWT_REFRESH_EXPIRY` | Durée de vie du refresh token (ex : `7d`) |
| `CLIENT_URL` | URL du frontend, utilisée pour la config CORS |

### `client/.env`

| Variable | Description |
|---|---|
| `VITE_API_URL` | URL de base de l'API backend |

> ⚠️ Ne jamais committer les fichiers `.env` réels. Seuls les `.env.example` doivent être versionnés.

## Développement sans Docker

**Backend**
```bash
cd server
npm install
npm run dev
```

**Frontend**
```bash
cd client
npm install
npm run dev
```

## Tests

```bash
cd server
npm test
```

Les tests utilisent `MongoMemoryServer` pour une isolation complète — aucune connexion à une base Atlas réelle n'est nécessaire pendant les tests.

## Déploiement

Le projet est conçu pour un déploiement sur Render avec deux services distincts :
- **Backend** : Web Service Docker (ou build natif Node), connecté à `tontitrack-prod` sur Atlas
- **Frontend** : Static Site (build Vite) ou Web Service Docker avec Nginx

Voir `docker-compose.prod.yml` comme référence pour la configuration des variables d'environnement de production.

## Structure du projet

```
.
├── client/                  # Application React (Vite + Tailwind)
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── nginx.conf
├── server/                  # API Express
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   └── ...
│   ├── tests/
│   └── Dockerfile
├── docker-compose.yml       # Environnement de développement
├── docker-compose.prod.yml  # Environnement de production
└── mongo-init.js            # Script d'initialisation MongoDB
```

## Licence

MIT — voir [LICENSE](LICENSE).