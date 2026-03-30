# Livechat CacaBox

Bot Discord + WebSocket overlay + Dashboard web pour streamers.

## Structure

```
stream-overlay/
├── apps/
│   ├── api/          Backend Fastify + Socket.io + Bot Discord
│   └── web/          Frontend Qwik + Tailwind CSS (→ Vercel)
├── packages/
│   └── types/        Types TypeScript partagés
├── vercel.json
└── package.json
```

## Démarrage rapide

### 1. Installer les dépendances
```bash
npm install
```

### 2. Configurer le backend
```bash
cd apps/api
cp .env.example .env
# Remplir .env avec vos clés Discord et DATABASE_URL
npm run prisma:generate
npm run prisma:migrate
```

### 3. Configurer le frontend
```bash
cd apps/web
cp .env.example .env
# Mettre PUBLIC_API_URL=http://localhost:3000
```

### 4. Lancer en développement
```bash
# Depuis la racine — lance api + web en parallèle
npm run dev:api   # Backend sur :3000
npm run dev:web   # Frontend sur :5173
```

## Variables d'environnement — API

| Variable | Requis | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `DISCORD_TOKEN` | ✅ | Token du bot Discord |
| `DISCORD_CLIENT_ID` | ✅ | Application ID Discord |
| `DISCORD_CLIENT_SECRET` | cloud | Secret OAuth2 Discord |
| `MODE` | ❌ | `self-hosted` (défaut) ou `cloud` |
| `PUBLIC_URL` | ❌ | URL publique du backend |
| `FRONTEND_URL` | ❌ | URL du frontend Qwik |
| `SESSION_SECRET` | ❌ | Clé secrète pour les sessions |

## Déploiement

- **Frontend** → Vercel (automatique depuis GitHub)
- **Backend** → VPS avec `npm start` ou Docker
- **Tunnel local** → `cloudflared tunnel --url http://localhost:3000`

## Commandes Discord

| Commande | Description |
|---|---|
| `/image [duree] [texte]` | Pièce jointe image |
| `/video [duree] [texte]` | Pièce jointe vidéo |
| `/url <lien> [duree] [texte]` | URL directe |
| `/client` | URL overlay OBS |

## Licence
MIT
