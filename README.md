# Stream Overlay — Alert Box temps réel

Bot Discord + API WebSocket pour afficher des médias en direct sur OBS.

## Stack

- **TypeScript** (Node.js 20+)
- **Fastify** + **Socket.io** — API HTTP & WebSocket
- **discord.js v14** — Slash Commands
- **Prisma ORM** + **PostgreSQL**

---

## Installation

### 1. Cloner et installer

```bash
npm install
```

### 2. Variables d'environnement

```bash
cp .env.example .env
```

Remplir `.env` :

| Variable | Description |
|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` |
| `DISCORD_TOKEN` | Token du bot (portail développeurs Discord) |
| `DISCORD_CLIENT_ID` | Application ID (portail développeurs Discord) |
| `PORT` | Port HTTP (défaut : 3000) |
| `PUBLIC_URL` | URL publique de l'overlay (ex: `https://monsite.com`) |

### 3. Base de données

```bash
# Générer le client Prisma
npm run prisma:generate

# Appliquer les migrations
npm run prisma:migrate
```

### 4. Démarrage

```bash
# Développement
npm run dev

# Production
npm run build && npm start
```

---

## Utilisation

### Bot Discord

| Commande | Description |
|---|---|
| `/send <url> [duree] [texte]` | Envoie un média sur l'overlay |
| `/client` | Affiche l'URL de votre overlay |

**Types supportés :**
- Images : `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.avif`, `.svg`
- Vidéos : `.mp4`, `.webm`, `.ogg`, `.mov`

### OBS / Streamlabs

1. Ajouter une **Source Navigateur**
2. Coller l'URL affichée par `/client`
3. Largeur : **1920**, Hauteur : **1080**
4. Cocher **"Fond personnalisé transparent"**

---

## Architecture

```
src/
├── index.ts                    # Point d'entrée
├── server.ts                   # Fastify + plugins + GracefulServer
├── loaders/
│   ├── discordLoader.ts        # Bot Discord + déploiement des commandes
│   └── socketLoader.ts         # Gestion des rooms Socket.io
├── components/discord/
│   └── commands.ts             # Logique /send et /client
└── services/
    ├── env.ts                  # Validation des variables d'environnement
    ├── prisma.ts               # Singleton PrismaClient
    └── queueWorker.ts          # Worker de file d'attente

public/
└── overlay.html                # Frontend OBS (fond transparent)

prisma/
└── schema.prisma               # Schéma PostgreSQL
```

### Flux de données

```
Discord /send
    │
    ▼
prisma.queue.create (executionDate calculée)
    │
    ▼
queueWorker (poll toutes les 2s)
    │  busyUntil dépassé ?
    ▼
io.to(guildId).emit('media:play', payload)
    │
    ▼
overlay.html (OBS Browser Source)
    └── <video autoplay> ou <img> affiché pendant `duration` secondes
```

---

## Arrêt propre

L'application gère `SIGTERM` / `SIGINT` via `@gquittet/graceful-server` :

1. Plus de nouvelles connexions acceptées
2. Worker arrêté
3. Bot Discord déconnecté
4. Socket.io fermé
5. Prisma / PostgreSQL déconnecté

Idéal pour Docker, PM2, et déploiements Kubernetes.
