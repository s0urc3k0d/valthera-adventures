import mongoose from 'mongoose';

const questSchema = new mongoose.Schema({
  // Identifiant unique
  id: {
    type: String,
    required: true,
    unique: true,
  },
  
  // Informations de base
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  shortDescription: {
    type: String,
    default: '',
  },
  
  // Type de quête
  type: {
    type: String,
    enum: ['main', 'side', 'contract', 'daily', 'event'],
    default: 'side',
  },
  
  // Donneur de quête
  giver: {
    npcId: { type: String, required: true },
    npcName: { type: String, required: true },
    location: { type: String, required: true },
  },
  
  // Niveau recommandé
  level: {
    min: { type: Number, default: 1 },
    max: { type: Number, default: 20 },
    recommended: { type: Number, default: 1 },
  },
  
  // Objectifs
  objectives: [{
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['kill', 'collect', 'talk', 'explore', 'escort', 'deliver', 'craft', 'use', 'reach', 'survive'],
      required: true,
    },
    description: { type: String, required: true },
    target: { type: String, required: true }, // monsterId, itemId, npcId, zoneId
    required: { type: Number, default: 1 },
    optional: { type: Boolean, default: false },
    hidden: { type: Boolean, default: false },
    order: { type: Number, default: 0 }, // Pour les objectifs séquentiels
  }],
  
  // Récompenses
  rewards: {
    xp: { type: Number, default: 0 },
    gold: { type: Number, default: 0 },
    items: [{
      itemId: String,
      quantity: { type: Number, default: 1 },
      chance: { type: Number, default: 100 },
    }],
    reputation: [{
      factionId: String,
      amount: Number,
    }],
    unlocks: [String], // IDs de quêtes, zones, etc.
  },
  
  // Récompenses optionnelles (choix)
  optionalRewards: [{
    items: [{
      itemId: String,
      quantity: { type: Number, default: 1 },
    }],
    gold: { type: Number, default: 0 },
  }],
  
  // Prérequis
  prerequisites: {
    quests: [String], // Quêtes à compléter avant
    level: { type: Number, default: 0 },
    reputation: [{
      factionId: String,
      amount: Number,
    }],
    items: [String], // Items à posséder
    class: [String],
    race: [String],
  },
  
  // Conditions d'échec
  failConditions: [{
    type: { type: String },
    target: { type: String },
    description: { type: String },
  }],
  
  // Limite de temps
  timeLimit: {
    enabled: { type: Boolean, default: false },
    duration: { type: Number, default: 0 }, // En minutes
  },
  
  // Répétable
  repeatable: {
    type: Boolean,
    default: false,
  },
  repeatCooldown: {
    type: Number,
    default: 0, // En heures
  },
  
  // Dialogues
  dialogues: {
    intro: { type: String, default: '' },
    inProgress: { type: String, default: '' },
    completion: { type: String, default: '' },
    failure: { type: String, default: '' },
  },
  
  // Étapes narratives
  stages: [{
    id: String,
    title: String,
    description: String,
    dialogue: String,
  }],
  
  // Zone(s) associée(s)
  zones: [String],
  
  // Chaîne de quêtes
  chain: {
    id: { type: String, default: null },
    order: { type: Number, default: 0 },
    nextQuest: { type: String, default: null },
  },
  
  // Tags
  tags: [String],
  
  // Actif
  active: {
    type: Boolean,
    default: true,
  },
  
  // Événement spécial
  event: {
    eventId: { type: String, default: null },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
  },
  
  // Difficulté
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'deadly'],
    default: 'medium',
  },
  
  // Groupe requis
  partyRequired: {
    type: Boolean,
    default: false,
  },
  minPartySize: {
    type: Number,
    default: 1,
  },
  
}, {
  timestamps: true,
});

// Index
questSchema.index({ id: 1 });
questSchema.index({ type: 1 });
questSchema.index({ 'level.recommended': 1 });
questSchema.index({ zones: 1 });
questSchema.index({ 'chain.id': 1 });
questSchema.index({ active: 1 });

// Méthodes
questSchema.methods.checkPrerequisites = function(character) {
  const prereqs = this.prerequisites;
  
  // Niveau
  if (character.level < prereqs.level) return false;
  
  // Quêtes
  for (const questId of prereqs.quests) {
    const quest = character.quests.find(q => q.questId === questId);
    if (!quest || quest.status !== 'completed') return false;
  }
  
  // Classe
  if (prereqs.class.length > 0 && !prereqs.class.includes(character.class)) {
    return false;
  }
  
  // Race
  if (prereqs.race.length > 0 && !prereqs.race.includes(character.race)) {
    return false;
  }
  
  return true;
};

questSchema.methods.getObjectiveProgress = function(characterProgress) {
  return this.objectives.map(obj => ({
    ...obj.toObject(),
    current: characterProgress[obj.id] || 0,
    completed: (characterProgress[obj.id] || 0) >= obj.required,
  }));
};

// Statiques
questSchema.statics.findByType = function(type) {
  return this.find({ type, active: true });
};

questSchema.statics.findByZone = function(zoneId) {
  return this.find({ zones: zoneId, active: true });
};

questSchema.statics.findAvailable = function(character) {
  return this.find({
    active: true,
    'level.min': { $lte: character.level },
    'level.max': { $gte: character.level },
  });
};

questSchema.statics.getDailies = function() {
  return this.find({ type: 'daily', active: true });
};

const Quest = mongoose.model('Quest', questSchema);

export default Quest;
