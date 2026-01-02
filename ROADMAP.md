# 🗺️ Valthera Adventures - Roadmap

> Dernière mise à jour : Janvier 2026

## 📊 État Actuel du Projet

### 🌐 Interface Web (Nouveau!)
Une interface web complète a été développée avec Next.js 14 :
- **Page d'accueil** présentant le projet
- **Wiki** avec documentation des commandes et classes
- **Dashboard joueur** avec connexion Discord OAuth2
- **Leaderboards** multi-catégories
- **Carte interactive** des zones

Voir [web/README.md](web/README.md) pour plus de détails.

### ✅ Phase 0 - Fondations (Complété)
- [x] Structure du projet
- [x] Configuration Docker & Docker Compose
- [x] Modèles de données MongoDB (Character, Monster, Item, Quest, Zone, Combat)
- [x] Système de commandes Discord.js
- [x] Handlers d'événements et d'interactions
- [x] Données de base (races D&D 5E, classes, zones initiales)
- [x] Utilitaires (système de dés, embeds, logger)
- [x] Commandes de base (`/create`, `/sheet`, `/stats`, `/help`, `/map`)
- [x] **Système UI unifié** (`src/utils/ui.js`) - Thèmes, barres de progression, cartes stylisées
- [x] **Base de données items** (`src/data/items.json`) - 60+ objets complets
- [x] **Base de données monstres** (`src/data/monsters.json`) - 15+ créatures

---

## 🎯 Phases de Développement

### 📦 Phase 1 - Core Gameplay (Semaines 1-3)
> Priorité: **HAUTE** | Statut: ✅ **Complété**

#### Création de Personnage ✅
> Implémenté dans `src/commands/character/create.js` + données dans `src/data/`
- [x] Validation complète des attributs (Point Buy 27 pts, min 8, max 15)
- [x] Système de backgrounds/historiques (`src/data/backgrounds.json` - 12 historiques)
- [x] Sélection d'équipement de départ (standard ou or)
- [x] Sélection de compétences selon la classe (`src/data/skills.json` - 18 compétences)
- [x] Tutoriel interactif intégré (Guide du Débutant)
- [x] Interface en 7 étapes avec navigation fluide

#### Système d'Inventaire ✅
> Implémenté dans `src/commands/character/inventory.js` + `src/utils/itemService.js`
- [x] Commande `/inventory` - Affichage paginé (8 items/page)
- [x] Commande `/equip <item>` - Équiper un objet (via boutons)
- [x] Commande `/unequip <slot>` - Déséquiper (via boutons)
- [x] Commande `/use <item>` - Utiliser un consommable (via boutons)
- [x] Commande `/drop <item>` - Jeter un objet (via boutons)
- [x] Commande `/give <player> <item>` - Donner un objet (`src/commands/character/give.js`)
- [x] Commande `/give gold` - Donner de l'or à un joueur
- [x] Calcul automatique du poids et encombrement
- [x] Tri et filtrage de l'inventaire (5 filtres: tout, armes, armures, consommables, divers)

#### Système de Combat (Base) ✅
> Implémenté dans `src/commands/combat/combat.js` + `src/utils/combatService.js`
- [x] Commande `/combat test` - Lancer un combat test
- [x] Actions via boutons (Attaquer, Défendre, Fuir)
- [x] Commande `/combat status` - État du combat
- [x] Initiative automatique (Dex + bonus)
- [x] Système de tours avec IA des monstres
- [x] Calcul des dégâts et types
- [x] Coups critiques (20) et échecs critiques (1)
- [x] Fin de combat et distribution de loot/XP
- [x] Interface visuelle avec barres de PV

#### Feuille de Personnage Améliorée ✅
> Implémenté dans `src/commands/character/sheet.js` avec nouvelle UI
- [x] Vue Résumé (identité, PV, XP, stats de jeu)
- [x] Vue Statistiques (attributs, jets de sauvegarde, maîtrises)
- [x] Vue Équipement (12 emplacements visuels)
- [x] Vue Capacités (traits raciaux, capacités de classe)
- [x] Navigation par boutons entre les vues

---

### ⚔️ Phase 2 - Combat Avancé (Semaines 4-6)
> Priorité: **HAUTE** | Statut: ✅ **Complété**

#### Système de Combat Unifié ✅
> Implémenté dans `src/commands/combat/combat.js` (système simplifié tout-en-un)
- [x] **Interface centralisée** - Tout via boutons et menus déroulants
- [x] Actions de base: Attaquer, Défendre, Fuir
- [x] **Bouton Sorts 🔮** - Menu déroulant pour lancer des sorts (classes magiques)
- [x] **Bouton Capacités ⚡** - Menu déroulant pour utiliser les capacités de classe
- [x] Initiative automatique (1d20 + DEX)
- [x] Tour du monstre automatique avec délai visuel
- [x] Proficiency bonus qui scale avec le niveau
- [x] Coups critiques (nat 20) et échecs critiques (nat 1)

#### Capacités de Classe ✅
> Données dans `src/data/classAbilities.json`
- [x] 12 classes complètes avec leurs capacités
- [x] Capacités actives: Second Wind, Sneak Attack, Divine Smite, Rage, etc.
- [x] Système de ressources (Ki, Rage uses, Lay on Hands, etc.)
- [x] Effets intégrés: healing, damage, buff, control
- [x] Utilisations limitées par repos

#### Système de Sorts ✅
> Données dans `src/data/spells.json`
- [x] 40+ sorts D&D 5E (cantrips + niveaux 1-3)
- [x] Emplacements de sorts gérés automatiquement
- [x] Scaling des cantrips par niveau
- [x] Sorts d'attaque (jet d'attaque vs CA)
- [x] Sorts à sauvegarde (demi-dégâts ou rien)
- [x] Sorts de soin

#### Effets de Statut ✅
> Données dans `src/data/statusEffects.json` + `src/utils/statusEffectService.js`
- [x] 15 conditions D&D (Poisoned, Stunned, Paralyzed, etc.)
- [x] 20+ effets de sorts (Burning, Blessed, Hasted, etc.)
- [x] Effets intégrés au combat (Rage résistance, Stun perte de tour)

---

### 🗺️ Phase 3 - Exploration (Semaines 7-9)
> Priorité: **HAUTE** | Statut: ✅ **Complété**

#### Système de Voyage ✅
> Implémenté dans `src/commands/exploration/travel.js`
- [x] Commande `/travel` - Menu de voyage avec destinations
- [x] `/travel <destination>` - Voyage direct avec autocomplete
- [x] Vérification des prérequis (niveau, quêtes, items)
- [x] Coût de voyage en or
- [x] Temps de trajet simulé
- [x] Découverte automatique des zones visitées

#### Système d'Exploration ✅
> Implémenté dans `src/commands/exploration/explore.js`
- [x] Commande `/explore` - Explorer la zone actuelle
- [x] Rencontres aléatoires de monstres (selon `encounterRate`)
- [x] Événements aléatoires (trésor, source de soin, piège, etc.)
- [x] Découverte de points d'intérêt (jet de Perception)
- [x] Zones sûres vs dangereuses
- [x] Cooldown d'exploration (30 secondes)

#### Commande Look ✅
> Implémenté dans `src/commands/exploration/look.js`
- [x] Commande `/look` - Vue générale de la zone
- [x] `/look npcs` - Liste des PNJs présents
- [x] `/look shops` - Boutiques et services disponibles
- [x] `/look pois` - Points d'intérêt (découverts/non découverts)
- [x] `/look connections` - Destinations accessibles
- [x] Navigation par boutons entre les vues

#### Système de Repos ✅
> Implémenté dans `src/commands/exploration/rest.js`
- [x] Commande `/rest` - Menu de repos
- [x] Repos court (1h) - Utilisation des dés de vie
- [x] Repos long (8h) - Récupération complète
- [x] Récupération des PV, emplacements de sorts, capacités
- [x] Récupération des dés de vie (moitié sur repos long)
- [x] Zones où le repos est interdit (donjons)
- [ ] Effets mécaniques (pluie = -2 Perception, etc.)
- [ ] Événements météo spéciaux

---

### 💰 Phase 4 - Économie (Semaines 10-12)
> Priorité: **MOYENNE** | Statut: ✅ **Complété**

#### Boutiques et Marchands ✅
> Implémenté dans `src/commands/economy/shop.js`
- [x] Commande `/shop [type]` - Voir les boutiques par zone
- [x] Menu interactif avec pagination
- [x] Détails des items (stats, prix, rareté)
- [x] Achat avec vérification du gold
- [x] 6 types de boutiques (armurier, forgeron, apothicaire, etc.)
- [x] Prix variables selon le type de boutique (markup)

#### Système de Vente ✅
> Implémenté dans `src/commands/economy/sell.js`
- [x] Commande `/sell [item] [quantité]` - Vendre des objets
- [x] Menu interactif avec inventaire vendable
- [x] Prix de revente à 50%
- [x] Vente en masse (tout le bazar)
- [x] Autocomplete sur l'inventaire

#### Système Monétaire Complet ✅
> Implémenté dans `src/commands/economy/wallet.js`
- [x] Commande `/wallet` - Voir sa bourse détaillée
- [x] Affichage PP/PO/PA/PC
- [x] Consolidation automatique des devises
- [x] Division des pièces (or → argent, etc.)
- [x] Statistiques de gains/dépenses
- [x] Calcul du poids des pièces (50 = 1 lb)

#### Artisanat ✅
> Implémenté dans `src/commands/economy/craft.js` + `src/data/recipes.json`
- [x] Commande `/craft [recette]` - Fabriquer des objets
- [x] 17 recettes (potions, armes, armures, accessoires)
- [x] 5 catégories (basique, alchimie, forge, cuir, enchantement)
- [x] Système de DC avec jets de compétence
- [x] Consommation des matériaux
- [x] Récupération partielle (50%) en cas d'échec
- [x] Recettes débloquées par niveau

#### Enchantement
- [ ] Amélioration d'équipement (+1, +2, etc.)
- [ ] Ajout de propriétés magiques
- [ ] Système de gemmes/runes
- [ ] Désenchantement pour récupérer des matériaux

---

### 📜 Phase 5 - Quêtes (Semaines 13-16)
> Priorité: **MOYENNE** | Statut: ✅ **Complété**

#### Système de Quêtes ✅
> Implémenté dans `src/commands/quests/quests.js` + `src/utils/questService.js`
- [x] Commande `/quests journal` - Quêtes actives avec progression
- [x] Commande `/quests available` - Quêtes disponibles (filtrage par niveau, prérequis)
- [x] Commande `/quests completed` - Historique des quêtes terminées
- [x] Commande `/quests reputation` - Réputation avec les factions
- [x] Acceptation et abandon de quêtes via boutons
- [x] 12 quêtes initiales (principales, secondaires, contrats, journalières)
- [x] Quêtes principales (histoire de Valthera)
- [x] Quêtes secondaires (exploration, aide aux PNJs)
- [x] Contrats (missions de la Guilde des Aventuriers)
- [x] Quêtes journalières (réinitialisées quotidiennement)

#### Objectifs Dynamiques ✅
> Implémenté dans `src/utils/questService.js`
- [x] Suivi automatique des objectifs (kill, collect, talk, explore, reach, deliver)
- [x] Intégration dans combat.js (checkKillObjective)
- [x] Intégration dans explore.js (checkExploreObjective)
- [x] Intégration dans travel.js (checkReachObjective)
- [x] Objectifs multiples par quête avec progression indépendante
- [x] Affichage de la progression dans les embeds de jeu
- [ ] Objectifs cachés/bonus
- [ ] Choix avec conséquences

#### Dialogues et PNJ ✅
> Implémenté dans `src/commands/quests/talk.js` + `src/data/dialogues.json`
- [x] Commande `/talk` - Liste des PNJs de la zone
- [x] Commande `/talk pnj:<nom>` - Parler à un PNJ spécifique
- [x] Système de dialogues interactifs avec boutons
- [x] Arbres de dialogue ramifiés (nodes et réponses)
- [x] Effets de dialogue (accept_quest, complete_quest, open_shop, give_gold)
- [x] Dialogues génériques pour PNJs sans arbre spécifique
- [ ] PNJ avec personnalité avancée
- [ ] Relations évolutives avec les PNJ

#### Réputation ✅
> Implémenté dans `src/data/factions.json` + `src/utils/questService.js`
- [x] Système de 6 factions (Guilde des Aventuriers, Couronne, Marchands, etc.)
- [x] 5 rangs de réputation par faction (Neutre → Exalté)
- [x] Gains de réputation via quêtes complétées
- [x] Affichage de la réputation dans `/quests reputation`
- [x] Perks débloqués par rang (réductions, accès spéciaux)
- [x] Relations entre factions (alliés/ennemis)
- [ ] Pertes de réputation par actions négatives
- [ ] Déblocage de quêtes par réputation

---

### 👥 Phase 6 - Social (Semaines 17-20)
> Priorité: **MOYENNE** | Statut: ✅ **Complété**

#### Système de Groupe ✅
> Implémenté dans `src/commands/social/party.js` + `src/utils/partyService.js`
- [x] Commande `/party create` - Créer un groupe
- [x] Commande `/party invite <player>` - Inviter un joueur
- [x] Commande `/party kick <player>` - Exclure un membre
- [x] Commande `/party leave` - Quitter le groupe
- [x] Commande `/party disband` - Dissoudre le groupe (chef)
- [x] Commande `/party info` - Informations du groupe
- [x] Commande `/party invites` - Voir les invitations en attente
- [x] Commande `/party settings` - Configurer le groupe
- [x] Commande `/party promote` - Transférer le leadership
- [x] Distribution du loot configurable (tour par tour, aléatoire, chef décide, libre)
- [x] Limite de 6 joueurs par groupe
- [x] Combat en groupe (intégration combat.js)
- [x] Partage d'XP automatique via partyService.distributeRewards()

#### Système de Guilde ✅
> Implémenté dans `src/commands/social/guild.js` + `src/utils/guildService.js`
- [x] Création de guilde (500 po)
- [x] Tag unique de guilde (2-5 caractères)
- [x] 5 rangs (Recrue → Membre → Vétéran → Officier → Chef)
- [x] Système de permissions par rang
- [x] Promotion/Rétrogradation des membres
- [x] Coffre de guilde (dépôt/retrait d'or)
- [x] Message du jour (MOTD)
- [x] Progression de niveau (XP de guilde)
- [x] Limite de 50 membres
- [ ] Quêtes de guilde
- [ ] Classement des guildes

#### Échanges ✅
> Implémenté dans `src/commands/social/trade.js`
- [x] Commande `/trade request <player>` - Proposer un échange
- [x] Commande `/trade cancel` - Annuler un échange
- [x] Commande `/trade status` - État de l'échange en cours
- [x] Interface d'échange interactive (boutons)
- [x] Ajout d'objets et d'or
- [x] Double confirmation requise
- [x] Expiration automatique (10 minutes)
- [x] Vérification des ressources avant échange

#### Communication
- [ ] Chat de groupe
- [ ] Chat de guilde
- [ ] Système de mail in-game
- [ ] Notifications personnalisables

---

### 🏆 Phase 7 - Endgame (Semaines 21-26)
> Priorité: **BASSE** | Statut: ⏳ Planifié

#### Donjons
- [ ] Donjons instanciés
- [ ] Progression par étages
- [ ] Boss avec mécaniques spéciales
- [ ] Loot de donjon exclusif
- [ ] Donjons journaliers/hebdomadaires

#### Raids
- [ ] Boss de monde (communautaires)
- [ ] Raids multi-groupes (12-24 joueurs)
- [ ] Phases de boss
- [ ] Rewards exclusifs

#### PvP
- [ ] Duels consentis
- [ ] Arène PvP
- [ ] Classement PvP
- [ ] Saisons compétitives
- [ ] Récompenses saisonnières

#### Housing
- [ ] Achat de propriété
- [ ] Personnalisation de la maison
- [ ] Stockage étendu
- [ ] Bonus de repos à domicile
- [ ] Visite des maisons d'autres joueurs

#### Compagnons
- [ ] Recrutement de PNJ compagnons
- [ ] Familiers et montures
- [ ] Équipement de compagnon
- [ ] Capacités de compagnon

---

## 🔌 Intégrations Possibles

### 🎮 Discord

| Intégration | Description | Priorité |
|-------------|-------------|----------|
| Slash Commands | ✅ Implémenté | - |
| Boutons interactifs | ✅ Implémenté | - |
| Menus sélecteurs | ✅ Implémenté | - |
| Modaux | ✅ Implémenté | - |
| Threads pour combats | Créer un thread par combat | Moyenne |
| Webhooks | Notifications d'événements | Basse |
| Rich Presence | Afficher l'activité du joueur | Basse |
| Voice Activities | Mini-jeux vocaux | Très basse |

### 💾 Base de Données

| Technologie | Usage | Priorité |
|-------------|-------|----------|
| MongoDB | ✅ Base principale | - |
| Redis | Cache et sessions | Haute |
| Elasticsearch | Recherche avancée (items, quêtes) | Basse |
| InfluxDB | Métriques et analytics | Basse |

### 🖥️ Infrastructure

| Service | Usage | Priorité |
|---------|-------|----------|
| Docker | ✅ Containerisation | - |
| nginx | Reverse proxy (VPS) | Haute |
| PM2 | Alternative à Docker | Moyenne |
| Kubernetes | Orchestration multi-instances | Très basse |
| GitHub Actions | CI/CD automatisé | Moyenne |

### 📊 Monitoring & Analytics

| Service | Usage | Priorité |
|---------|-------|----------|
| Winston | ✅ Logging | - |
| Prometheus | Métriques applicatives | Moyenne |
| Grafana | Dashboard de monitoring | Moyenne |
| Sentry | Error tracking | Haute |
| DataDog | APM complet | Basse |

### 🌐 API & Web

| Intégration | Description | Priorité |
|-------------|-------------|----------|
| Express.js | ✅ Health Server (API de santé) | - |
| Next.js 14 | ✅ Interface web complète | - |
| NextAuth.js | ✅ Login via Discord OAuth2 | - |
| TailwindCSS | ✅ Styling de l'interface web | - |
| Socket.io | Temps réel web | Basse |
| OpenAPI/Swagger | Documentation API | Basse |

### 🤖 Intelligence Artificielle

| Intégration | Usage | Priorité |
|-------------|-------|----------|
| OpenAI GPT | Génération de dialogues PNJ | Basse |
| Stable Diffusion | Génération d'avatars | Très basse |
| LangChain | IA narrative avancée | Très basse |

### 🎨 Assets & Médias

| Service | Usage | Priorité |
|---------|-------|----------|
| Cloudinary | Stockage d'images | Basse |
| D&D Beyond API | Données officielles D&D | Moyenne |
| Open5e API | Données SRD gratuites | Haute |
| IconFinder | Icônes d'items | Basse |

### 💳 Monétisation (Optionnel)

| Service | Usage | Priorité |
|---------|-------|----------|
| Stripe | Paiements (cosmétiques) | Très basse |
| Ko-fi/Patreon | Donations | Basse |
| Discord Premium | Perks serveur | Basse |

### 🔒 Sécurité

| Intégration | Usage | Priorité |
|-------------|-------------|----------|
| Rate Limiting | ✅ Anti-spam basique | - |
| Helmet.js | Headers sécurisés (API) | Moyenne |
| JWT | Authentification API | Moyenne |
| Audit Logs | Traçabilité admin | Haute |

### 📱 Multi-plateforme (Futur)

| Plateforme | Faisabilité | Priorité |
|------------|-------------|----------|
| Web App | ✅ Interface web complète (Next.js) | - |
| Mobile (PWA) | ✅ Manifest PWA configuré | - |
| Mobile (React Native) | App mobile native | Très basse |
| Twitch Extension | Overlay stream | Très basse |

---

## 📅 Timeline Estimée

```
2026 Q1 (Jan-Mar)
├── Phase 1: Core Gameplay ████████████████ 100% ✅
├── Phase 2: Combat Avancé ████████████████ 100% ✅
├── Phase 3: Exploration   ████████████████ 100% ✅
├── Phase 4: Économie      ████████████████ 100% ✅
├── Phase 5: Quêtes        ████████████████ 100% ✅
└── Phase 6: Social        ████████████████ 100% ✅

2026 Q2 (Avr-Juin)
├── Interface Web          ████████████████ 100% ✅
├── Docker & Deployment    ████████████████ 100% ✅
└── Phase 7: Endgame       ████░░░░░░░░░░░░ 25%

2026 Q3 (Juil-Sep)
├── Phase 7: Endgame       ████████████████ 100%
├── Polish & Balance       ████████████████ 100%
└── Intégrations avancées  ████████░░░░░░░░ 50%

2026 Q4 (Oct-Déc)
├── Contenu additionnel    ████████████████ 100%
├── Tests communautaires   ████████████████ 100%
└── Launch Public          🚀
```

---

## 🎯 Objectifs par Jalon

### v0.1.0 - Alpha Privée ✅
- [x] Création de personnage complète
- [x] Combat fonctionnel (PvE)
- [x] 3 zones explorables
- [x] 15+ monstres différents
- [x] Inventaire de base

### v0.2.0 - Alpha Publique ✅
- [x] 8 zones
- [x] 15+ monstres
- [x] Système de quêtes complet
- [x] Boutiques fonctionnelles
- [x] Système de groupe

### v0.5.0 - Bêta ✅
- [x] 8+ zones avec connections
- [x] 15+ monstres
- [x] 12 classes jouables
- [x] Système de sorts complet (40+ sorts)
- [x] Guildes complètes
- [x] 12+ quêtes
- [x] Interface web complète

### v0.6.0 - Bêta Web ✅
- [x] Page d'accueil présentant le projet
- [x] Wiki avec commandes et classes
- [x] Dashboard joueur avec OAuth Discord
- [x] Leaderboards multi-catégories
- [x] Carte interactive
- [x] Docker deployment
- [x] Health monitoring API

### v1.0.0 - Release
- [ ] Contenu complet niveaux 1-20
- [ ] Donjons et raids
- [ ] PvP
- [ ] Housing
- [ ] Événements saisonniers
- [ ] Documentation complète

---

## 📝 Notes de Développement

### Priorités Immédiates
1. ✅ Système de combat de base - **Complété**
2. ✅ Système d'inventaire - **Complété**
3. ✅ Création des monstres - **Complété**
4. ✅ Interface web - **Complété**
5. Ajouter plus de contenu (zones, monstres, quêtes)
6. Implémenter les donjons

### Décisions Techniques Prises
- [x] Redis vs mémoire pour le cache de combat? → **Mémoire pour MVP, Redis en v1.0**
- [x] API REST maintenant ou plus tard? → **Express health server + Next.js API**
- [ ] Sharding Discord à partir de combien de serveurs?
- [ ] Tests automatisés: Jest ou Vitest?

### Risques Identifiés
- ⚠️ Équilibrage des classes (nécessite beaucoup de tests)
- ⚠️ Performance avec beaucoup de combats simultanés
- ⚠️ Complexité du système de sorts D&D 5E
- ⚠️ Gestion de la data (backup, migration)

---

## 🤝 Contribution

Les contributions sont les bienvenues! Priorités:
1. Bug fixes
2. Nouveaux monstres/items
3. Équilibrage
4. Traductions
5. Documentation

---

*Roadmap mise à jour régulièrement selon l'avancement du projet.*

*Que votre aventure à Valthera soit épique!* ⚔️🐉
