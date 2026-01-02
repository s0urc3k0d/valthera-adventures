# 🐉 Valthera Adventures - Guide de Démarrage

## 📦 Installation Rapide

### Prérequis
- Node.js 20+ 
- Docker & Docker Compose (recommandé) ou MongoDB local
- Un bot Discord créé sur [Discord Developer Portal](https://discord.com/developers/applications)

### 1. Configuration

```bash
# Cloner et installer
cd ValtheraAdventures
npm install

# Configurer l'environnement
cp .env.example .env
# Éditez .env avec vos tokens Discord
```

### 2. Variables d'environnement (.env)

```env
DISCORD_TOKEN=votre_token_bot
CLIENT_ID=votre_client_id
GUILD_ID=votre_serveur_test_id

# Pour Docker (défaut dans docker-compose)
MONGODB_URI=mongodb://mongo:27017/valthera

# Pour développement local sans Docker
# MONGODB_URI=mongodb://localhost:27017/valthera

# Port du serveur de monitoring (optionnel, défaut: 3000)
HEALTH_PORT=3000
```

### 3. Lancement avec Docker (Recommandé)

```bash
# Construire et lancer
docker-compose up -d

# Voir les logs
docker-compose logs -f bot

# Voir le status des services
docker-compose ps

# Arrêter
docker-compose down

# Reconstruire après modifications
docker-compose up -d --build
```

#### Endpoints de monitoring

Une fois lancé, ces endpoints sont disponibles sur le port 3000:

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Liveness probe (200 = processus en vie) |
| `GET /ready` | Readiness probe (200 = MongoDB + Discord connectés) |
| `GET /metrics` | Métriques format Prometheus |
| `GET /status` | Status détaillé JSON |

Exemple: `curl http://localhost:3000/health`

#### Avec nginx externe (reverse proxy)

Un exemple de configuration nginx est fourni dans `nginx/valthera.conf.example`.

```bash
# Sur votre hôte (pas dans Docker)
sudo cp nginx/valthera.conf.example /etc/nginx/sites-available/valthera.conf
sudo ln -s /etc/nginx/sites-available/valthera.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo nginx -s reload
```

#### Outils de debug

```bash
# Lancer Mongo Express (interface web MongoDB sur port 8081)
docker-compose --profile debug up -d

# Accéder: http://localhost:8081
# Login: admin / changeme (ou votre MONGO_EXPRESS_PASSWORD)
```

### 4. Lancement sans Docker (Développement)

```bash
# Démarrer MongoDB localement d'abord
mongod --dbpath ./data/db

# Puis dans un autre terminal:
npm run deploy-commands  # Enregistrer les commandes Discord
npm run dev              # Mode développement avec hot-reload
# ou
npm start                # Mode production
```

## 🎮 Commandes Disponibles

| Commande | Description |
|----------|-------------|
| `/create` | Créer un personnage |
| `/sheet` | Voir sa feuille de personnage |
| `/stats` | Statistiques détaillées |
| `/help` | Aide et liste des commandes |
| `/map` | Carte des zones |

## 🏗️ Structure du Projet

```
src/
├── commands/          # Commandes Discord par catégorie
├── config/            # Configuration et constantes
├── data/              # Données statiques (races, classes, zones)
├── events/            # Événements Discord
├── handlers/          # Gestionnaires (commandes, événements)
├── models/            # Modèles MongoDB
├── scripts/           # Scripts utilitaires
└── utils/             # Fonctions utilitaires
```

## 📝 Prochaines Étapes

1. **Phase 2** : Système de combat complet
2. **Phase 3** : Exploration et rencontres
3. **Phase 4** : Économie et boutiques
4. **Phase 5** : Système de quêtes

## 🐛 Dépannage

**Les commandes n'apparaissent pas?**
- Vérifiez que le bot a les permissions "applications.commands"
- Relancez `npm run deploy-commands`
- En dev, les commandes sont instantanées sur le GUILD_ID

**Erreur de connexion MongoDB?**
- Vérifiez que MongoDB est lancé
- Vérifiez l'URI dans .env

**Le bot ne répond pas?**
- Vérifiez les logs avec `docker-compose logs -f bot`
- Vérifiez que le token est correct

## 📚 Documentation

- [Discord.js Guide](https://discordjs.guide/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [D&D 5E SRD](https://www.dndbeyond.com/sources/basic-rules)

---

*Bon courage pour votre aventure à Valthera!* ⚔️
