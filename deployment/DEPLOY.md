# 🚀 Guide de Déploiement Valthera Adventures

## Prérequis

### Sur votre VPS
- **Ubuntu 22.04+** ou Debian 11+
- **Docker** et **Docker Compose** installés
- **Port 80 et 443** ouverts dans le firewall
- **Nom de domaine** pointant vers l'IP du VPS

### Installer Docker (si nécessaire)
```bash
# Installation Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajouter votre utilisateur au groupe docker
sudo usermod -aG docker $USER
newgrp docker

# Installer Docker Compose
sudo apt install docker-compose-plugin
```

---

## Configuration Discord (IMPORTANT)

### 1. Discord Developer Portal
Rendez-vous sur https://discord.com/developers/applications

### 2. Sélectionner votre Application
Client ID: `1456637041683992627`

### 3. Configuration Bot (onglet "Bot")

#### Token du Bot
1. Cliquez sur **"Reset Token"**
2. Copiez le token (ne le partagez jamais !)
3. Stockez-le dans le fichier `.env`

#### Privileged Gateway Intents (OBLIGATOIRE)
Activez ces options :
- ✅ **PRESENCE INTENT** - Pour afficher le statut des joueurs
- ✅ **SERVER MEMBERS INTENT** - Pour gérer les membres du serveur
- ✅ **MESSAGE CONTENT INTENT** - Pour lire le contenu des messages

### 4. Configuration OAuth2 (onglet "OAuth2")

#### General
- **Client Secret**: `D_zeJIcV88GUfy2lCgV2-WRpJiellnXY`

#### Redirects
Ajoutez ces URLs de redirection :
```
https://valthera-adventures.sourcekod.fr/api/auth/callback/discord
https://www.valthera-adventures.sourcekod.fr/api/auth/callback/discord
```

### 5. Permissions du Bot (onglet "Bot" > "Bot Permissions")
Cochez les permissions suivantes :

**General Permissions:**
- ✅ Read Messages/View Channels
- ✅ Send Messages
- ✅ Send Messages in Threads
- ✅ Embed Links
- ✅ Attach Files
- ✅ Read Message History
- ✅ Use External Emojis
- ✅ Add Reactions

**Slash Commands:**
- ✅ Use Slash Commands

### 6. URL d'Invitation du Bot
Utilisez cette URL pour inviter le bot (remplacez si nécessaire) :
```
https://discord.com/oauth2/authorize?client_id=1456637041683992627&permissions=277025770560&scope=bot%20applications.commands
```

---

## Étapes de Déploiement

### 1. Cloner le Repository
```bash
cd /opt
git clone https://github.com/votre-repo/ValtheraAdventures.git
cd ValtheraAdventures/deployment
```

### 2. Configuration de l'Environnement
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer le fichier
nano .env
```

Remplissez les valeurs :
```env
DISCORD_TOKEN=votre_token_bot_ici
DISCORD_CLIENT_ID=1456637041683992627
DISCORD_CLIENT_SECRET=D_zeJIcV88GUfy2lCgV2-WRpJiellnXY
GUILD_ID=id_de_votre_serveur_discord
NEXTAUTH_URL=https://valthera-adventures.sourcekod.fr
NEXTAUTH_SECRET=générez_avec_openssl_rand_base64_32
DOMAIN=valthera-adventures.sourcekod.fr
```

### 3. Générer NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

### 4. Initialiser SSL
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh init
```

### 5. Déployer l'Application
```bash
./scripts/deploy.sh deploy
```

### 6. Obtenir le Certificat SSL
```bash
./scripts/deploy.sh ssl
```

### 7. Déployer les Commandes Discord
```bash
./scripts/deploy.sh commands
```

---

## Commandes Utiles

```bash
# Voir les logs
./scripts/deploy.sh logs

# Redémarrer les services
./scripts/deploy.sh restart

# Arrêter les services
./scripts/deploy.sh stop

# Voir le statut
./scripts/deploy.sh status

# Mettre à jour
git pull
./scripts/deploy.sh deploy
./scripts/deploy.sh commands
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
│                    (Port 80 & 443)                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx (Reverse Proxy)                     │
│               SSL/TLS + Load Balancing                       │
│         valthera-adventures.sourcekod.fr                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
          ▼                               ▼
┌─────────────────────┐       ┌─────────────────────┐
│   Web App (Next.js) │       │   Bot Discord       │
│      Port 3001      │       │   (Discord.js)      │
└──────────┬──────────┘       └──────────┬──────────┘
           │                             │
           └──────────────┬──────────────┘
                          │
                          ▼
            ┌─────────────────────────┐
            │   MongoDB (Database)    │
            │       Port 27017        │
            └─────────────────────────┘
```

---

## Dépannage

### Le bot ne répond pas
1. Vérifiez le token dans `.env`
2. Vérifiez les Intents dans Discord Developer Portal
3. Consultez les logs : `./scripts/deploy.sh logs`

### Erreur SSL
1. Vérifiez que le domaine pointe vers le VPS
2. Attendez la propagation DNS (jusqu'à 48h)
3. Réessayez : `./scripts/deploy.sh ssl`

### Erreur de connexion MongoDB
1. Vérifiez que le conteneur MongoDB fonctionne : `docker ps`
2. Vérifiez les logs : `docker logs valthera-mongo`

### Commandes Discord non visibles
1. Attendez quelques minutes (cache Discord)
2. Redéployez : `./scripts/deploy.sh commands`
3. Vérifiez le GUILD_ID dans `.env`

---

## Liens Utiles

- **Site Web**: https://valthera-adventures.sourcekod.fr
- **Inviter le Bot**: https://discord.com/oauth2/authorize?client_id=1456637041683992627
- **Serveur Discord**: https://discord.com/invite/zddp4ErzMq
- **Discord Developer Portal**: https://discord.com/developers/applications/1456637041683992627
