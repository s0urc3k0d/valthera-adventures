# Valthera Adventures - Bot Discord RPG

## 📋 Vue d'ensemble

Valthera Adventures est un bot Discord RPG complet basé sur l'univers Valthera et le système D&D 5E 2024. Les joueurs créent des personnages, explorent des zones, combattent des créatures, accomplissent des quêtes et progressent dans un monde fantasy immersif.

## 🎯 Fonctionnalités Principales

### 1. Création de Personnage
- **Races disponibles** (D&D 5E) :
  - Humain, Elfe (Haut-Elfe, Elfe des Bois, Drow), Nain (des Montagnes, des Collines)
  - Halfelin (Pied-léger, Robuste), Gnome (des Roches, des Forêts)
  - Demi-Elfe, Demi-Orc, Tieffelin, Draconien
  
- **Classes disponibles** (D&D 5E) :
  - Guerrier, Magicien, Roublard, Clerc, Paladin, Rôdeur
  - Barbare, Barde, Druide, Moine, Sorcier, Occultiste
  
- **Attributs** :
  - Force, Dextérité, Constitution, Intelligence, Sagesse, Charisme
  - Système de points à répartir (27 points de base)
  - Bonus raciaux appliqués automatiquement
  
- **Caractéristiques** :
  - Points de Vie (calculés selon classe + CON)
  - Classe d'Armure de base
  - Niveau de départ : 1
  - Or de départ selon classe

### 2. Système de Combat
- **Mécanique D&D 5E** :
  - Jets d'attaque : 1d20 + modificateurs
  - Jets de dégâts selon arme/sort
  - Système d'initiative (Dex)
  - Coups critiques (20 naturel) et échecs critiques (1 naturel)
  
- **Actions en combat** :
  - Attaquer (attaque de base ou compétence)
  - Défendre (+2 CA jusqu'au prochain tour)
  - Utiliser un objet (potion, parchemin)
  - Fuir (jet de Dex contre poursuite)
  
- **Système de tour par tour** :
  - Initiative détermine l'ordre
  - Affichage des HP des combattants
  - Calcul automatique des dégâts/soins
  - Gestion des effets de statut (poison, brûlure, étourdissement, etc.)
  
- **Types de dégâts** :
  - Physiques : Tranchant, Contondant, Perforant
  - Magiques : Feu, Froid, Foudre, Poison, Force, Nécrotique, Radiant

### 3. Exploration et Zones
- **Types de zones** :
  - Villes (hubs principaux avec PNJs)
  - Donjons (difficultés variables)
  - Forêts, Montagnes, Marais, Déserts
  - Zones spéciales/événementielles
  
- **Caractéristiques des zones** :
  - Niveau recommandé
  - Types de créatures rencontrées
  - Ressources disponibles
  - Points d'intérêt
  
- **Voyage** :
  - Coût en temps/énergie
  - Rencontres aléatoires pendant le voyage
  - Découverte de nouvelles zones
  - Système de carte interactive

### 4. Villes et PNJ
- **Marchands** :
  - Armurier (armes et armures)
  - Apothicaire (potions et composants)
  - Général (objets divers)
  - Marchand rare (objets magiques)
  - Stock qui se renouvelle périodiquement
  
- **Donneurs de quêtes** :
  - Quêtes principales (histoire)
  - Quêtes secondaires (exploration, collecte)
  - Contrats (éliminations, escorte)
  - Quêtes récurrentes (dailies)
  
- **Autres PNJ** :
  - Maître de guilde (progression de guilde)
  - Entraîneur (réinitialisation de talents)
  - Aubergiste (repos et rumeurs)
  - Forgeron enchanteur (amélioration d'équipement)

### 5. Système d'Inventaire
- **Gestion** :
  - Limite de poids basée sur la Force
  - Catégories : Armes, Armures, Consommables, Composants, Objets de quête, Trésors
  - Empilable pour les consommables
  - Système de sac à dos avec slots
  
- **Types d'objets** :
  - **Armes** : Dégâts, type, propriétés spéciales, rareté
  - **Armures** : CA, type, pénalité de Dex, prérequis de Force
  - **Accessoires** : Anneaux, amulettes, ceintures (bonus divers)
  - **Consommables** : Potions, parchemins, nourriture
  - **Objets de quête** : Non vendables, non jetables

### 6. Système d'Équipement
- **Slots d'équipement** :
  - Arme principale
  - Arme secondaire/Bouclier
  - Tête, Torse, Jambes, Pieds, Mains
  - 2x Anneaux, Amulette, Ceinture, Cape
  
- **Bonus d'équipement** :
  - Bonus aux attributs (+1 Force, +2 Dex, etc.)
  - Bonus aux compétences
  - Résistances aux éléments
  - Effets spéciaux (régénération, immunités)
  
- **Raretés** :
  - Commun (blanc)
  - Peu commun (vert)
  - Rare (bleu)
  - Épique (violet)
  - Légendaire (orange)
  - Artefact (rouge)

### 7. Système de Loot
- **Tables de butin** :
  - Butin par type de créature
  - Butin par niveau de zone
  - Butin de boss (garanti + aléatoire)
  
- **Système de drop** :
  - Pourcentage de chance par rareté
  - Augmentation avec niveau de joueur
  - Bonus de chance au butin (équipement)
  
- **Types de récompenses** :
  - Or (toujours)
  - Équipement
  - Composants d'artisanat
  - Objets de quête
  - Expérience

### 8. Progression et Niveaux
- **Système d'XP** :
  - XP par combat (selon difficulté)
  - XP de quête
  - XP d'exploration (découverte)
  - Courbe de progression exponentielle
  
- **Montée de niveau** :
  - Augmentation des HP (dé de vie + CON)
  - Points de compétence tous les 4 niveaux
  - Nouvelles capacités de classe
  - Augmentation des bonus de maîtrise
  
- **Capacités de classe** :
  - Débloquées à des niveaux spécifiques
  - Passives et actives
  - Utilisations limitées (repos court/long)
  
- **Compétences** :
  - Arbre de talents par classe
  - Spécialisations (niveau 3)
  - Points de talent à répartir

### 9. Système de Quêtes
- **Types de quêtes** :
  - **Principale** : Progression de l'histoire
  - **Secondaire** : Exploration et lore
  - **Contrat** : Objectif unique avec récompense
  - **Récurrente** : Répétable quotidiennement
  
- **Objectifs** :
  - Éliminer X créatures
  - Collecter X objets
  - Parler à un PNJ
  - Explorer une zone
  - Escorter un PNJ
  - Résoudre une énigme
  
- **Récompenses** :
  - XP
  - Or
  - Objets (fixes ou choix)
  - Réputation
  - Débloquage de contenu

### 10. Système Économique
- **Monnaies** :
  - Pièces de cuivre (PC)
  - Pièces d'argent (PA) = 10 PC
  - Pièces d'or (PO) = 10 PA
  - Pièces de platine (PP) = 10 PO
  
- **Sources de revenus** :
  - Butin de créatures
  - Récompenses de quêtes
  - Vente d'objets
  - Artisanat
  
- **Dépenses** :
  - Achats chez marchands
  - Réparations d'équipement
  - Services (enchantements, identification)
  - Repos à l'auberge
  - Voyage rapide

### 11. Systèmes Avancés

#### A. Artisanat
- Collecte de ressources dans les zones
- Recettes déblocables
- Compétences d'artisanat (Alchimie, Forge, Enchantement)
- Création d'objets uniques

#### B. Guildes/Factions
- Rejoindre une faction
- Quêtes de faction
- Réputation avec les factions
- Récompenses exclusives
- Conflit entre factions

#### C. Repos
- **Repos court** (1h) : Récupération de HP (dés de vie), recharge capacités limitées
- **Repos long** (8h) : Récupération complète, recharge toutes capacités
- Coût et lieu requis

#### D. Météo et Temps
- Cycle jour/nuit
- Météo dynamique affectant gameplay
- Événements saisonniers
- Bonus/malus selon conditions

#### E. Compagnons
- Recrutement de PNJ
- Gestion d'une équipe
- Compétences de compagnon
- Équipement de compagnon

#### F. Housing/Base
- Acquisition d'une base
- Amélioration de la base
- Stockage étendu
- Bonus de repos

## 🏗️ Architecture Technique

### Structure du Projet
```
valthera-bot/
├── src/
│   ├── commands/
│   │   ├── character/
│   │   │   ├── create.js
│   │   │   ├── sheet.js
│   │   │   ├── levelup.js
│   │   │   └── stats.js
│   │   ├── combat/
│   │   │   ├── attack.js
│   │   │   ├── defend.js
│   │   │   ├── flee.js
│   │   │   └── useitem.js
│   │   ├── exploration/
│   │   │   ├── travel.js
│   │   │   ├── explore.js
│   │   │   ├── rest.js
│   │   │   └── map.js
│   │   ├── inventory/
│   │   │   ├── inventory.js
│   │   │   ├── equip.js
│   │   │   ├── use.js
│   │   │   └── drop.js
│   │   ├── social/
│   │   │   ├── trade.js
│   │   │   ├── party.js
│   │   │   └── guild.js
│   │   ├── town/
│   │   │   ├── shop.js
│   │   │   ├── quests.js
│   │   │   ├── inn.js
│   │   │   └── services.js
│   │   └── admin/
│   │       ├── spawn.js
│   │       ├── event.js
│   │       └── maintenance.js
│   ├── models/
│   │   ├── Character.js
│   │   ├── Monster.js
│   │   ├── Item.js
│   │   ├── Quest.js
│   │   ├── Zone.js
│   │   └── Combat.js
│   ├── data/
│   │   ├── races.json
│   │   ├── classes.json
│   │   ├── monsters.json
│   │   ├── items.json
│   │   ├── quests.json
│   │   ├── zones.json
│   │   ├── shops.json
│   │   └── loot-tables.json
│   ├── utils/
│   │   ├── dice.js
│   │   ├── combat-engine.js
│   │   ├── loot-generator.js
│   │   ├── xp-calculator.js
│   │   ├── damage-calculator.js
│   │   └── embed-builder.js
│   ├── handlers/
│   │   ├── command-handler.js
│   │   ├── event-handler.js
│   │   └── interaction-handler.js
│   ├── events/
│   │   ├── ready.js
│   │   ├── interactionCreate.js
│   │   └── messageCreate.js
│   └── index.js
├── database/
│   └── schema.sql
├── config/
│   ├── config.json
│   └── constants.js
├── .env
├── package.json
└── README.md
```

### Technologies
- **Node.js** v18+
- **Discord.js** v14
- **Base de données** : PostgreSQL ou MongoDB
- **ORM** : Sequelize (PostgreSQL) ou Mongoose (MongoDB)
- **Cache** : Node-cache pour performances
- **Planification** : node-cron pour événements

### Modèles de Données

#### Character
```javascript
{
  userId: String,
  guildId: String,
  name: String,
  race: String,
  class: String,
  level: Number,
  xp: Number,
  attributes: {
    str: Number,
    dex: Number,
    con: Number,
    int: Number,
    wis: Number,
    cha: Number
  },
  hp: { current: Number, max: Number },
  ac: Number,
  gold: { copper: Number, silver: Number, gold: Number, platinum: Number },
  inventory: [{ itemId: String, quantity: Number, equipped: Boolean, slot: String }],
  quests: [{ questId: String, progress: Object, status: String }],
  location: String,
  abilities: [String],
  skills: Object,
  reputation: Object,
  lastRest: Date,
  createdAt: Date
}
```

#### Monster
```javascript
{
  id: String,
  name: String,
  type: String,
  level: Number,
  hp: Number,
  ac: Number,
  attributes: Object,
  attacks: [{
    name: String,
    damage: String,
    type: String,
    bonus: Number
  }],
  xpReward: Number,
  lootTable: String,
  abilities: [String],
  resistances: [String],
  immunities: [String],
  zone: String
}
```

#### Item
```javascript
{
  id: String,
  name: String,
  type: String, // weapon, armor, consumable, quest, treasure
  rarity: String,
  value: Number,
  weight: Number,
  slot: String,
  stats: Object, // bonus, damage, ac, effects
  requirements: Object,
  description: String,
  stackable: Boolean,
  maxStack: Number
}
```

#### Quest
```javascript
{
  id: String,
  title: String,
  description: String,
  type: String, // main, side, contract, daily
  giver: String,
  level: Number,
  objectives: [{
    type: String,
    target: String,
    current: Number,
    required: Number
  }],
  rewards: {
    xp: Number,
    gold: Number,
    items: [String],
    reputation: Object
  },
  prerequisites: [String],
  repeatable: Boolean,
  timeLimit: Number
}
```

#### Zone
```javascript
{
  id: String,
  name: String,
  type: String, // town, dungeon, wilderness
  level: Number,
  description: String,
  connectedZones: [String],
  monsters: [String],
  resources: [String],
  npcs: [String],
  pointsOfInterest: [Object],
  weatherEffects: Boolean
}
```

## 💬 Commandes Discord

### Personnage
- `/create` - Créer un nouveau personnage (assistant interactif)
- `/sheet` - Afficher la feuille de personnage
- `/stats` - Voir les statistiques détaillées
- `/levelup` - Monter de niveau (si XP suffisant)
- `/rest [short|long]` - Se reposer pour récupérer

### Combat
- `/attack <cible>` - Attaquer une créature
- `/defend` - Adopter une posture défensive
- `/ability <nom>` - Utiliser une capacité spéciale
- `/useitem <objet>` - Utiliser un objet en combat
- `/flee` - Tenter de fuir le combat

### Exploration
- `/travel <zone>` - Voyager vers une zone
- `/explore` - Explorer la zone actuelle
- `/map` - Afficher la carte des zones
- `/look` - Examiner les alentours

### Inventaire
- `/inventory` - Afficher l'inventaire
- `/equip <objet>` - Équiper un objet
- `/unequip <slot>` - Déséquiper un slot
- `/use <objet>` - Utiliser un objet
- `/drop <objet>` - Jeter un objet
- `/give <joueur> <objet>` - Donner un objet

### Ville
- `/shop [type]` - Accéder aux marchands
- `/buy <objet> [quantité]` - Acheter un objet
- `/sell <objet> [quantité]` - Vendre un objet
- `/quests` - Voir les quêtes disponibles
- `/quest accept <id>` - Accepter une quête
- `/quest track <id>` - Suivre une quête
- `/quest abandon <id>` - Abandonner une quête
- `/inn` - Se reposer à l'auberge

### Social
- `/party create` - Créer un groupe
- `/party invite <joueur>` - Inviter dans le groupe
- `/party leave` - Quitter le groupe
- `/trade <joueur>` - Initier un échange
- `/guild info` - Informations sur la guilde

### Informations
- `/help [commande]` - Aide sur les commandes
- `/rules` - Règles du jeu
- `/leaderboard [type]` - Classements
- `/profile [joueur]` - Profil d'un joueur
- `/wiki <sujet>` - Informations sur le jeu

## 🎨 Interface Utilisateur

### Embeds Discord
Tous les retours utilisent des embeds riches avec :
- Couleurs selon le type (info, succès, erreur, combat)
- Champs structurés
- Images/icônes pour les objets et personnages
- Barres de progression (HP, XP)
- Timestamps

### Composants Interactifs
- **Boutons** : Actions rapides (attaquer, défendre, fuir)
- **Menus sélecteurs** : Choix multiples (objets, cibles)
- **Modaux** : Saisie de données (nom de personnage, quantité)

### Système de Pagination
Pour inventaires, boutiques, quêtes avec nombreux items

## 🎲 Mécanique de Dés (D&D 5E)

### Implémentation
```javascript
// Exemples de jets
roll('1d20') // Jet simple
roll('1d20+5') // Jet avec modificateur
roll('2d6+3') // Dégâts
roll('1d20', 'advantage') // Avantage (2d20 garder le meilleur)
roll('1d20', 'disadvantage') // Désavantage
```

### Modificateurs
- Bonus de maîtrise : +2 à +6 (selon niveau)
- Modificateurs d'attribut : (attribut - 10) / 2
- Bonus d'équipement
- Effets temporaires

## 🔐 Permissions et Sécurité

### Rôles Discord
- **Joueur** : Commandes de base
- **Maître du Jeu** : Spawn, événements, modifications
- **Admin** : Configuration, maintenance

### Anti-triche
- Cooldowns sur commandes
- Validation des transactions
- Log des actions importantes
- Rate limiting

### Backups
- Sauvegarde automatique toutes les heures
- Backup quotidien de la base
- Système de rollback

## 🌟 Systèmes Spéciaux Valthera

### Lore et Histoire
- Événements liés à l'univers Valthera
- Quêtes narratives immersives
- PNJ récurrents avec personnalité
- Découverte progressive du monde

### Événements Mondiaux
- Boss de monde (raid communautaire)
- Invasions de zones
- Festivals saisonniers
- Événements limités

### Achievements
- Système de hauts faits
- Récompenses cosmétiques
- Titres déblocables
- Progression longue terme

## 📊 Analytics et Logs

### Statistiques Suivies
- Créatures tuées
- Quêtes complétées
- Objets trouvés
- Distance parcourue
- Or dépensé
- Temps de jeu

### Logs Système
- Combats
- Transactions
- Changements de niveau
- Bugs/erreurs

## 🚀 Installation et Déploiement

### Prérequis
```bash
Node.js >= 18.0.0
PostgreSQL >= 14 ou MongoDB >= 6
Discord Bot Token
```

### Variables d'Environnement (.env)
```
DISCORD_TOKEN=votre_token_bot
CLIENT_ID=votre_client_id
DATABASE_URL=postgresql://user:pass@localhost:5432/valthera
NODE_ENV=production
LOG_LEVEL=info
```

### Installation
```bash
npm install
npm run setup-db
npm run deploy-commands
npm start
```

### Déploiement Production
- Hébergement recommandé : VPS, Heroku, Railway
- PM2 pour gestion de process
- Nginx comme reverse proxy si API web
- Monitoring avec Prometheus/Grafana

## 🔄 Roadmap Futures Fonctionnalités

### Phase 2
- PvP arène
- Crafting avancé avec recettes légendaires
- Montures et familiers
- Système de construction (housing)

### Phase 3
- Raids multi-joueurs
- Donjons procéduraux
- Système d'enchantement complexe
- Saisons compétitives

### Phase 4
- Cross-server (sharding)
- Marché économique entre joueurs
- Système de métiers/professions
- Mode hardcore (permadeath)

## 📝 Notes de Développement

### Priorités d'Implémentation
1. **Core** : Création personnage, combat basique, inventaire
2. **Exploration** : Zones, voyage, rencontres
3. **Économie** : Shops, loot, or
4. **Progression** : XP, niveaux, capacités
5. **Quêtes** : Système de quêtes complet
6. **Social** : Groupes, guildes, échanges
7. **Polish** : UI/UX, équilibrage, bugs

### Équilibrage
- Tester la progression 1-20
- Ajuster les drops selon rareté
- Balancer la difficulté des zones
- Équilibrer les classes

### Performance
- Index sur requêtes fréquentes
- Cache pour données statiques
- Batch operations pour combats multiples
- Optimisation des embeds

## 🐛 Tests

### Tests Unitaires
- Utils (dés, calculs)
- Générateurs (loot, monstres)
- Validation des données

### Tests d'Intégration
- Flux de création de personnage
- Combat complet
- Système de quêtes
- Transactions

### Tests Manuels
- Commandes Discord
- Interactions utilisateur
- Edge cases

## 📚 Documentation Additionnelle

### Pour les Joueurs
- Guide du débutant
- Wiki des classes et races
- Cartes des zones
- Base de données des objets

### Pour les Développeurs
- Documentation API
- Architecture des systèmes
- Guide de contribution
- Standards de code

## 🤝 Contribution

### Guidelines
- Fork et Pull Request
- Tests avant commit
- Respecter l'architecture
- Documenter le code

### Code Style
- ESLint + Prettier
- Conventions de nommage claires
- Commentaires pour logique complexe

## 📄 Licence

À définir (suggéré : MIT pour open-source)

## 🎮 Valthera Lore Integration

### Univers
- Reprendre les factions de Valthera
- Utiliser les emplacements canoniques
- Événements liés au lore existant

### Personnalisation
- Noms de lieux spécifiques à Valthera
- PNJ issus de vos campagnes
- Objets légendaires de l'univers
- Quêtes qui enrichissent le lore

---

**Contact** : [Votre Discord/Email]
**Documentation** : [Lien vers wiki]
**Repo GitHub** : [Lien vers repo]

*Que votre aventure à Valthera soit épique !* ⚔️🐉