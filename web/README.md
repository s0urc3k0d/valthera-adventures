# Valthera Adventures - Interface Web

Interface web pour le bot Discord RPG Valthera Adventures.

## 🚀 Fonctionnalités

- **Page d'accueil** : Présentation du projet avec statistiques live
- **Wiki complet** : Documentation des commandes, classes, races, zones, etc.
- **Dashboard joueur** : Connexion Discord OAuth2 pour voir son personnage
- **Leaderboard** : Classements des meilleurs joueurs et guildes
- **Carte interactive** : Visualisation des zones du monde de Valthera

## 🛠️ Stack Technique

- **Framework** : Next.js 14 (App Router)
- **UI** : TailwindCSS, Framer Motion, Lucide Icons
- **Auth** : NextAuth.js avec Discord OAuth2
- **Database** : MongoDB (même base que le bot)
- **Styling** : Thème fantasy sombre personnalisé

## 📦 Installation

### Développement local

```bash
# Depuis le dossier web/
npm install
npm run dev
```

Le site sera accessible sur http://localhost:3001

### Variables d'environnement

Copiez `.env.example` vers `.env` et configurez :

```env
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=votre-secret-32-caracteres

DISCORD_CLIENT_ID=votre_client_id
DISCORD_CLIENT_SECRET=votre_client_secret

MONGODB_URI=mongodb://localhost:27017/valthera
```

### Configuration Discord OAuth2

1. Allez sur [Discord Developer Portal](https://discord.com/developers/applications)
2. Sélectionnez votre application (ou créez-en une)
3. Dans **OAuth2** > **Redirects**, ajoutez :
   - `http://localhost:3001/api/auth/callback/discord` (dev)
   - `https://votredomaine.com/api/auth/callback/discord` (prod)
4. Copiez le **Client ID** et **Client Secret**

## 🐳 Docker

Le site web est inclus dans le docker-compose principal :

```bash
# Depuis la racine du projet
docker-compose up -d

# Le site sera sur http://localhost:3001
# Le bot sur http://localhost:3000 (health checks)
```

## 📁 Structure

```
src/
├── app/                    # Routes Next.js (App Router)
│   ├── api/               # API Routes
│   │   ├── auth/         # NextAuth endpoints
│   │   └── stats/        # Statistiques publiques
│   ├── dashboard/        # Pages protégées (auth required)
│   ├── leaderboard/      # Classements
│   ├── map/              # Carte interactive
│   └── wiki/             # Documentation
├── components/            # Composants React
│   ├── dashboard/        # Composants du dashboard
│   ├── home/             # Sections de la page d'accueil
│   ├── layout/           # Navbar, Footer
│   └── providers/        # Context providers
└── lib/                   # Utilitaires
    ├── models.ts         # Modèles Mongoose (miroir du bot)
    └── mongodb.ts        # Connection MongoDB
```

## 🎨 Personnalisation

Le thème est configurable dans `tailwind.config.js` :

- Couleurs `valthera-*` : Palette principale (violet)
- Couleurs `class-*` : Couleurs par classe de personnage
- Couleurs `rarity-*` : Couleurs de rareté des items

## 📝 Notes

- Le site partage la même base MongoDB que le bot
- Les modèles dans `lib/models.ts` doivent correspondre à ceux du bot
- Les données statiques (classes, races, etc.) sont importées directement depuis `../src/data/`
