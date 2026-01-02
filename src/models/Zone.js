import mongoose from 'mongoose';

const zoneSchema = new mongoose.Schema({
  // Identifiant unique
  id: {
    type: String,
    required: true,
    unique: true,
  },
  
  // Informations de base
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  shortDescription: {
    type: String,
    default: '',
  },
  
  // Type de zone
  type: {
    type: String,
    enum: ['town', 'dungeon', 'wilderness', 'forest', 'mountain', 'swamp', 'desert', 'coast', 'underground', 'special'],
    required: true,
  },
  
  // Niveau
  level: {
    min: { type: Number, default: 1 },
    max: { type: Number, default: 20 },
    recommended: { type: Number, default: 1 },
  },
  
  // Connexions
  connectedZones: [{
    zoneId: { type: String, required: true },
    travelTime: { type: Number, default: 30 }, // En minutes
    travelCost: { type: Number, default: 0 },
    requirements: {
      level: { type: Number, default: 0 },
      quest: { type: String, default: null },
      item: { type: String, default: null },
    },
    hidden: { type: Boolean, default: false },
  }],
  
  // Monstres
  monsters: [{
    monsterId: { type: String, required: true },
    spawnChance: { type: Number, default: 100 },
    minCount: { type: Number, default: 1 },
    maxCount: { type: Number, default: 1 },
    conditions: {
      timeOfDay: [String], // 'day', 'night', 'dawn', 'dusk'
      weather: [String],
    },
  }],
  
  // Ressources récoltables
  resources: [{
    resourceId: { type: String, required: true },
    gatherChance: { type: Number, default: 100 },
    minQuantity: { type: Number, default: 1 },
    maxQuantity: { type: Number, default: 1 },
    skill: { type: String, default: null },
    skillDC: { type: Number, default: 10 },
  }],
  
  // PNJs
  npcs: [{
    npcId: { type: String, required: true },
    name: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['merchant', 'questgiver', 'trainer', 'innkeeper', 'blacksmith', 'guard', 'citizen', 'special'],
    },
    location: { type: String, default: '' },
    available: { type: Boolean, default: true },
  }],
  
  // Points d'intérêt
  pointsOfInterest: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    type: { type: String }, // 'landmark', 'dungeon_entrance', 'treasure', 'secret'
    discoverable: { type: Boolean, default: true },
    discoveryDC: { type: Number, default: 15 },
    rewards: {
      xp: Number,
      items: [String],
    },
  }],
  
  // Boutiques (pour les villes)
  shops: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { 
      type: String,
      enum: ['armorer', 'apothecary', 'general', 'rare', 'blacksmith', 'enchanter'],
    },
    npcId: { type: String },
    inventory: [String], // Item IDs
    refreshInterval: { type: Number, default: 24 }, // Heures
  }],
  
  // Services (pour les villes)
  services: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { 
      type: String,
      enum: ['inn', 'temple', 'guild', 'bank', 'stable', 'trainer'],
    },
    cost: { type: Number, default: 0 },
    description: { type: String },
  }],
  
  // Effets environnementaux
  environment: {
    lighting: { type: String, default: 'normal' }, // 'bright', 'normal', 'dim', 'dark'
    terrain: { type: String, default: 'normal' }, // 'difficult', 'normal', 'hazardous'
    hazards: [{
      type: { type: String },
      damage: { type: String },
      saveDC: { type: Number },
      saveType: { type: String },
    }],
  },
  
  // Météo applicable
  weatherEffects: {
    type: Boolean,
    default: true,
  },
  possibleWeather: [String],
  
  // Rencontres aléatoires
  encounterRate: {
    type: Number,
    default: 0.3, // 30%
  },
  
  // Est-ce un repos sûr?
  safeZone: {
    type: Boolean,
    default: false,
  },
  restingAllowed: {
    type: Boolean,
    default: true,
  },
  
  // Donjon spécifique
  dungeon: {
    floors: { type: Number, default: 1 },
    bossId: { type: String, default: null },
    respawnTime: { type: Number, default: 24 }, // Heures
    instance: { type: Boolean, default: false },
  },
  
  // Événements spéciaux
  events: [{
    eventId: { type: String },
    trigger: { type: String }, // 'enter', 'explore', 'time'
    chance: { type: Number, default: 100 },
  }],
  
  // Faction contrôlant la zone
  faction: {
    type: String,
    default: null,
  },
  
  // Coordonnées pour la carte
  coordinates: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
  },
  
  // Région
  region: {
    type: String,
    default: 'valthera',
  },
  
  // Image et visuel
  image: String,
  emoji: String,
  color: Number,
  
  // Tags
  tags: [String],
  
  // Actif
  active: {
    type: Boolean,
    default: true,
  },
  
}, {
  timestamps: true,
});

// Index
zoneSchema.index({ id: 1 });
zoneSchema.index({ type: 1 });
zoneSchema.index({ 'level.recommended': 1 });
zoneSchema.index({ region: 1 });
zoneSchema.index({ active: 1 });

// Méthodes
zoneSchema.methods.getRandomMonster = function() {
  const availableMonsters = this.monsters.filter(m => 
    Math.random() * 100 <= m.spawnChance
  );
  
  if (availableMonsters.length === 0) return null;
  return availableMonsters[Math.floor(Math.random() * availableMonsters.length)];
};

zoneSchema.methods.getConnectedZone = function(zoneId) {
  return this.connectedZones.find(z => z.zoneId === zoneId);
};

zoneSchema.methods.canTravelTo = function(zoneId, character) {
  const connection = this.getConnectedZone(zoneId);
  if (!connection) return { canTravel: false, reason: 'Zone non connectée' };
  
  if (connection.requirements.level > character.level) {
    return { canTravel: false, reason: `Niveau ${connection.requirements.level} requis` };
  }
  
  // Autres vérifications...
  
  return { canTravel: true, travelTime: connection.travelTime, cost: connection.travelCost };
};

// Statiques
zoneSchema.statics.findByType = function(type) {
  return this.find({ type, active: true });
};

zoneSchema.statics.findTowns = function() {
  return this.find({ type: 'town', active: true });
};

zoneSchema.statics.findByRegion = function(region) {
  return this.find({ region, active: true });
};

zoneSchema.statics.findStartingZone = function() {
  return this.findOne({ id: 'valthera-city' });
};

const Zone = mongoose.model('Zone', zoneSchema);

export default Zone;
