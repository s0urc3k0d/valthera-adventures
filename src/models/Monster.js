import mongoose from 'mongoose';

const monsterSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: [
      'aberration', 'beast', 'celestial', 'construct', 'dragon',
      'elemental', 'fey', 'fiend', 'giant', 'humanoid',
      'monstrosity', 'ooze', 'plant', 'undead'
    ],
    required: true,
  },
  size: {
    type: String,
    enum: ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'],
    default: 'medium',
  },
  alignment: {
    type: String,
    default: 'neutral',
  },
  
  // Challenge Rating et XP
  cr: {
    type: Number,
    required: true,
    min: 0,
    max: 30,
  },
  xpReward: {
    type: Number,
    required: true,
  },
  
  // Stats de combat
  hp: {
    type: Number,
    required: true,
  },
  ac: {
    type: Number,
    required: true,
  },
  speed: {
    walk: { type: Number, default: 30 },
    fly: { type: Number, default: 0 },
    swim: { type: Number, default: 0 },
    climb: { type: Number, default: 0 },
    burrow: { type: Number, default: 0 },
  },
  
  // Attributs
  attributes: {
    str: { type: Number, default: 10 },
    dex: { type: Number, default: 10 },
    con: { type: Number, default: 10 },
    int: { type: Number, default: 10 },
    wis: { type: Number, default: 10 },
    cha: { type: Number, default: 10 },
  },
  
  // Attaques
  attacks: [{
    name: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['melee', 'ranged', 'spell'],
      default: 'melee',
    },
    bonus: { type: Number, default: 0 },
    damage: { type: String, required: true }, // "2d6+3"
    damageType: { 
      type: String, 
      default: 'slashing',
    },
    reach: { type: Number, default: 5 },
    range: { type: String, default: null }, // "30/60"
    description: { type: String, default: '' },
    effects: [{
      type: { type: String },
      dc: { type: Number },
      save: { type: String },
      onFail: { type: String },
    }],
  }],
  
  // Capacités spéciales
  abilities: [{
    name: { type: String, required: true },
    description: { type: String, required: true },
    recharge: { type: String, default: null }, // "5-6", "short rest", etc.
    uses: { type: Number, default: null },
  }],
  
  // Actions légendaires
  legendaryActions: {
    count: { type: Number, default: 0 },
    actions: [{
      name: String,
      cost: { type: Number, default: 1 },
      description: String,
    }],
  },
  
  // Résistances et immunités
  resistances: [String],
  immunities: [String],
  vulnerabilities: [String],
  conditionImmunities: [String],
  
  // Sauvegardes
  savingThrows: {
    str: { type: Number, default: null },
    dex: { type: Number, default: null },
    con: { type: Number, default: null },
    int: { type: Number, default: null },
    wis: { type: Number, default: null },
    cha: { type: Number, default: null },
  },
  
  // Compétences
  skills: {
    type: Map,
    of: Number,
    default: new Map(),
  },
  
  // Sens
  senses: {
    darkvision: { type: Number, default: 0 },
    blindsight: { type: Number, default: 0 },
    tremorsense: { type: Number, default: 0 },
    truesight: { type: Number, default: 0 },
    passivePerception: { type: Number, default: 10 },
  },
  
  // Langues
  languages: [String],
  
  // Loot
  lootTable: {
    type: String,
    default: null,
  },
  guaranteedLoot: [{
    itemId: String,
    chance: { type: Number, default: 100 },
  }],
  goldDrop: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
  },
  
  // Zones où on peut le trouver
  zones: [String],
  
  // Comportement IA
  behavior: {
    aggression: { type: Number, default: 50 }, // 0-100
    fleeThreshold: { type: Number, default: 20 }, // % HP
    preferredTarget: { type: String, default: 'closest' }, // 'closest', 'weakest', 'strongest', 'random'
  },
  
  // Boss?
  isBoss: {
    type: Boolean,
    default: false,
  },
  bossPhases: [{
    hpThreshold: Number,
    abilities: [String],
    description: String,
  }],
  
  // Image/Emoji
  image: String,
  emoji: String,
  
  // Tags pour recherche
  tags: [String],
  
}, {
  timestamps: true,
});

// Index
monsterSchema.index({ id: 1 });
monsterSchema.index({ cr: 1 });
monsterSchema.index({ type: 1 });
monsterSchema.index({ zones: 1 });
monsterSchema.index({ tags: 1 });

// Méthodes
monsterSchema.methods.getModifier = function(attribute) {
  return Math.floor((this.attributes[attribute] - 10) / 2);
};

monsterSchema.methods.getRandomAttack = function() {
  if (this.attacks.length === 0) return null;
  return this.attacks[Math.floor(Math.random() * this.attacks.length)];
};

// Statiques
monsterSchema.statics.findByZone = function(zoneId) {
  return this.find({ zones: zoneId });
};

monsterSchema.statics.findByCR = function(minCR, maxCR) {
  return this.find({ cr: { $gte: minCR, $lte: maxCR } });
};

monsterSchema.statics.getRandomForZone = async function(zoneId, level) {
  const monsters = await this.find({ 
    zones: zoneId,
    cr: { $gte: level - 2, $lte: level + 2 }
  });
  
  if (monsters.length === 0) return null;
  return monsters[Math.floor(Math.random() * monsters.length)];
};

const Monster = mongoose.model('Monster', monsterSchema);

export default Monster;
