import mongoose from 'mongoose';

const characterSchema = new mongoose.Schema({
  // Identifiants Discord
  userId: {
    type: String,
    required: true,
    index: true,
  },
  guildId: {
    type: String,
    required: true,
    index: true,
  },
  
  // Informations de base
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 32,
  },
  race: {
    type: String,
    required: true,
  },
  subrace: {
    type: String,
    default: null,
  },
  class: {
    type: String,
    required: true,
  },
  subclass: {
    type: String,
    default: null,
  },
  background: {
    type: String,
    default: 'Aventurier',
  },
  
  // Progression
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 20,
  },
  xp: {
    type: Number,
    default: 0,
    min: 0,
  },
  
  // Attributs
  attributes: {
    str: { type: Number, default: 10, min: 1, max: 30 },
    dex: { type: Number, default: 10, min: 1, max: 30 },
    con: { type: Number, default: 10, min: 1, max: 30 },
    int: { type: Number, default: 10, min: 1, max: 30 },
    wis: { type: Number, default: 10, min: 1, max: 30 },
    cha: { type: Number, default: 10, min: 1, max: 30 },
  },
  
  // Points de vie
  hp: {
    current: { type: Number, default: 10 },
    max: { type: Number, default: 10 },
    temp: { type: Number, default: 0 },
  },
  hitDice: {
    current: { type: Number, default: 1 },
    max: { type: Number, default: 1 },
    type: { type: String, default: 'd8' },
  },
  
  // Combat
  ac: {
    type: Number,
    default: 10,
  },
  initiative: {
    type: Number,
    default: 0,
  },
  speed: {
    type: Number,
    default: 30,
  },
  
  // Économie
  gold: {
    copper: { type: Number, default: 0 },
    silver: { type: Number, default: 0 },
    gold: { type: Number, default: 0 },
    platinum: { type: Number, default: 0 },
  },
  
  // Inventaire
  inventory: [{
    itemId: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    equipped: { type: Boolean, default: false },
    slot: { type: String, default: null },
    customName: { type: String, default: null },
    enchantments: [String],
  }],
  
  // Équipement actuel (références aux items de l'inventaire)
  equipment: {
    mainHand: { type: mongoose.Schema.Types.ObjectId, default: null },
    offHand: { type: mongoose.Schema.Types.ObjectId, default: null },
    head: { type: mongoose.Schema.Types.ObjectId, default: null },
    chest: { type: mongoose.Schema.Types.ObjectId, default: null },
    legs: { type: mongoose.Schema.Types.ObjectId, default: null },
    feet: { type: mongoose.Schema.Types.ObjectId, default: null },
    hands: { type: mongoose.Schema.Types.ObjectId, default: null },
    ring1: { type: mongoose.Schema.Types.ObjectId, default: null },
    ring2: { type: mongoose.Schema.Types.ObjectId, default: null },
    amulet: { type: mongoose.Schema.Types.ObjectId, default: null },
    belt: { type: mongoose.Schema.Types.ObjectId, default: null },
    cape: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  
  // Quêtes
  quests: [{
    questId: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['active', 'completed', 'failed', 'abandoned'],
      default: 'active',
    },
    progress: { type: mongoose.Schema.Types.Mixed, default: {} },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  }],
  
  // Compétences et capacités
  proficiencies: {
    savingThrows: [String],
    skills: [String],
    weapons: [String],
    armor: [String],
    tools: [String],
    languages: [String],
  },
  
  abilities: [{
    id: { type: String, required: true },
    uses: { type: Number, default: 0 },
    maxUses: { type: Number, default: null },
    rechargeOn: { type: String, enum: ['shortRest', 'longRest', 'dawn', null], default: null },
  }],
  
  // Sorts (pour les classes magiques)
  spellcasting: {
    spellcastingAbility: { type: String, default: null },
    spellSaveDC: { type: Number, default: 8 },
    spellAttackBonus: { type: Number, default: 0 },
    spellSlots: {
      1: { current: Number, max: Number },
      2: { current: Number, max: Number },
      3: { current: Number, max: Number },
      4: { current: Number, max: Number },
      5: { current: Number, max: Number },
      6: { current: Number, max: Number },
      7: { current: Number, max: Number },
      8: { current: Number, max: Number },
      9: { current: Number, max: Number },
    },
    knownSpells: [String],
    preparedSpells: [String],
    cantrips: [String],
  },
  
  // Position et exploration
  location: {
    type: String,
    default: 'val-serein',
  },
  discoveredZones: [String],
  discoveredPOIs: [String], // Format: "zoneId:poiId"
  
  // Réputation avec les factions
  reputation: {
    type: Map,
    of: Number,
    default: new Map(),
  },
  
  // Statistiques
  stats: {
    monstersKilled: { type: Number, default: 0 },
    questsCompleted: { type: Number, default: 0 },
    goldEarned: { type: Number, default: 0 },
    goldSpent: { type: Number, default: 0 },
    deaths: { type: Number, default: 0 },
    criticalHits: { type: Number, default: 0 },
    distanceTraveled: { type: Number, default: 0 },
    itemsFound: { type: Number, default: 0 },
    itemsCrafted: { type: Number, default: 0 },
    itemsBought: { type: Number, default: 0 },
    itemsSold: { type: Number, default: 0 },
    totalPlayTime: { type: Number, default: 0 }, // En minutes
  },
  
  // Effets de statut actifs
  statusEffects: [{
    id: { type: String, required: true },
    duration: { type: Number, default: 1 }, // En tours
    source: { type: String, default: null },
    stacks: { type: Number, default: 1 },
  }],
  
  // Repos
  lastShortRest: {
    type: Date,
    default: null,
  },
  lastLongRest: {
    type: Date,
    default: null,
  },
  
  // Combat actif
  inCombat: {
    type: Boolean,
    default: false,
  },
  combatId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  
  // Flags et états
  flags: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map(),
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index composé pour recherche rapide
characterSchema.index({ userId: 1, guildId: 1 }, { unique: true });
characterSchema.index({ level: -1 });
characterSchema.index({ 'stats.monstersKilled': -1 });

// Méthodes d'instance
characterSchema.methods.getModifier = function(attribute) {
  return Math.floor((this.attributes[attribute] - 10) / 2);
};

characterSchema.methods.getProficiencyBonus = function() {
  return Math.ceil(this.level / 4) + 1;
};

characterSchema.methods.heal = function(amount) {
  this.hp.current = Math.min(this.hp.current + amount, this.hp.max);
  return this.hp.current;
};

characterSchema.methods.takeDamage = function(amount) {
  // D'abord les HP temporaires
  if (this.hp.temp > 0) {
    const tempDamage = Math.min(amount, this.hp.temp);
    this.hp.temp -= tempDamage;
    amount -= tempDamage;
  }
  
  this.hp.current = Math.max(this.hp.current - amount, 0);
  return this.hp.current;
};

characterSchema.methods.addXP = function(amount) {
  this.xp += amount;
  return this.xp;
};

characterSchema.methods.addGold = function(goldObj) {
  if (goldObj.copper) this.gold.copper += goldObj.copper;
  if (goldObj.silver) this.gold.silver += goldObj.silver;
  if (goldObj.gold) this.gold.gold += goldObj.gold;
  if (goldObj.platinum) this.gold.platinum += goldObj.platinum;
};

characterSchema.methods.getTotalGoldValue = function() {
  return this.gold.copper + 
         (this.gold.silver * 10) + 
         (this.gold.gold * 100) + 
         (this.gold.platinum * 1000);
};

characterSchema.methods.isAlive = function() {
  return this.hp.current > 0;
};

// Méthodes statiques
characterSchema.statics.findByDiscordId = function(userId, guildId) {
  return this.findOne({ userId, guildId });
};

characterSchema.statics.getLeaderboard = function(guildId, type = 'level', limit = 10) {
  const sortField = type === 'level' ? { level: -1, xp: -1 } : { [`stats.${type}`]: -1 };
  return this.find({ guildId }).sort(sortField).limit(limit);
};

// Hooks
characterSchema.pre('save', function(next) {
  this.lastActive = new Date();
  next();
});

const Character = mongoose.model('Character', characterSchema);

export default Character;
