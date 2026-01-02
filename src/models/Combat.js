import mongoose from 'mongoose';

const combatSchema = new mongoose.Schema({
  // Identifiants
  guildId: {
    type: String,
    required: true,
  },
  channelId: {
    type: String,
    required: true,
  },
  
  // État du combat
  status: {
    type: String,
    enum: ['active', 'victory', 'defeat', 'fled', 'timeout'],
    default: 'active',
  },
  
  // Participants - Joueurs
  players: [{
    odiscordId: String,
    odcharacterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Character' },
    name: String,
    hp: { current: Number, max: Number },
    ac: Number,
    initiative: Number,
    statusEffects: [{ id: String, duration: Number, stacks: Number }],
    isDefending: { type: Boolean, default: false },
    hasActed: { type: Boolean, default: false },
    fled: { type: Boolean, default: false },
  }],
  
  // Participants - Monstres
  monsters: [{
    instanceId: String, // ID unique pour cette instance de combat
    monsterId: String,
    name: String,
    hp: { current: Number, max: Number },
    ac: Number,
    initiative: Number,
    statusEffects: [{ id: String, duration: Number, stacks: Number }],
    isDefending: { type: Boolean, default: false },
    hasActed: { type: Boolean, default: false },
  }],
  
  // Ordre d'initiative
  initiativeOrder: [{
    id: String, // odiscordId ou instanceId
    type: { type: String, enum: ['player', 'monster'] },
    initiative: Number,
    name: String,
  }],
  
  // Tour actuel
  round: {
    type: Number,
    default: 1,
  },
  currentTurnIndex: {
    type: Number,
    default: 0,
  },
  
  // Historique des actions
  actionLog: [{
    round: Number,
    actorId: String,
    actorName: String,
    action: String, // 'attack', 'defend', 'ability', 'item', 'flee'
    targetId: String,
    targetName: String,
    result: {
      hit: Boolean,
      damage: Number,
      damageType: String,
      healing: Number,
      critical: Boolean,
      fumble: Boolean,
      effects: [String],
    },
    description: String,
    timestamp: { type: Date, default: Date.now },
  }],
  
  // Zone du combat
  zoneId: {
    type: String,
    required: true,
  },
  
  // Type de combat
  combatType: {
    type: String,
    enum: ['random', 'boss', 'pvp', 'quest', 'event'],
    default: 'random',
  },
  
  // Loot accumulé
  loot: {
    gold: { type: Number, default: 0 },
    items: [{ itemId: String, quantity: Number }],
    xp: { type: Number, default: 0 },
  },
  
  // Message Discord du combat
  messageId: {
    type: String,
    default: null,
  },
  
  // Timestamps
  startedAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: {
    type: Date,
    default: null,
  },
  lastActionAt: {
    type: Date,
    default: Date.now,
  },
  
  // Timeout (en secondes)
  turnTimeout: {
    type: Number,
    default: 120,
  },
  
}, {
  timestamps: true,
});

// Index
combatSchema.index({ guildId: 1, status: 1 });
combatSchema.index({ channelId: 1 });
combatSchema.index({ 'players.odiscordId': 1 });

// Méthodes
combatSchema.methods.getCurrentTurn = function() {
  if (this.initiativeOrder.length === 0) return null;
  return this.initiativeOrder[this.currentTurnIndex];
};

combatSchema.methods.nextTurn = function() {
  // Marquer le combattant actuel comme ayant agi
  const current = this.getCurrentTurn();
  if (current) {
    if (current.type === 'player') {
      const player = this.players.find(p => p.odiscordId === current.id);
      if (player) player.hasActed = true;
    } else {
      const monster = this.monsters.find(m => m.instanceId === current.id);
      if (monster) monster.hasActed = true;
    }
  }
  
  // Passer au suivant
  this.currentTurnIndex++;
  
  // Nouveau round?
  if (this.currentTurnIndex >= this.initiativeOrder.length) {
    this.currentTurnIndex = 0;
    this.round++;
    
    // Réinitialiser hasActed et diminuer les effets de statut
    this.players.forEach(p => {
      p.hasActed = false;
      p.isDefending = false;
      p.statusEffects = p.statusEffects
        .map(e => ({ ...e, duration: e.duration - 1 }))
        .filter(e => e.duration > 0);
    });
    
    this.monsters.forEach(m => {
      m.hasActed = false;
      m.isDefending = false;
      m.statusEffects = m.statusEffects
        .map(e => ({ ...e, duration: e.duration - 1 }))
        .filter(e => e.duration > 0);
    });
  }
  
  // Sauter les morts et les fuis
  const next = this.getCurrentTurn();
  if (next) {
    if (next.type === 'player') {
      const player = this.players.find(p => p.odiscordId === next.id);
      if (player && (player.hp.current <= 0 || player.fled)) {
        return this.nextTurn();
      }
    } else {
      const monster = this.monsters.find(m => m.instanceId === next.id);
      if (monster && monster.hp.current <= 0) {
        return this.nextTurn();
      }
    }
  }
  
  this.lastActionAt = new Date();
  return this.getCurrentTurn();
};

combatSchema.methods.getPlayer = function(odiscordId) {
  return this.players.find(p => p.odiscordId === odiscordId);
};

combatSchema.methods.getMonster = function(instanceId) {
  return this.monsters.find(m => m.instanceId === instanceId);
};

combatSchema.methods.isPlayerTurn = function(odiscordId) {
  const current = this.getCurrentTurn();
  return current && current.type === 'player' && current.id === odiscordId;
};

combatSchema.methods.areAllMonstersDead = function() {
  return this.monsters.every(m => m.hp.current <= 0);
};

combatSchema.methods.areAllPlayersDead = function() {
  return this.players.every(p => p.hp.current <= 0 || p.fled);
};

combatSchema.methods.addToLog = function(entry) {
  this.actionLog.push({
    round: this.round,
    ...entry,
    timestamp: new Date(),
  });
};

combatSchema.methods.checkCombatEnd = function() {
  if (this.areAllMonstersDead()) {
    this.status = 'victory';
    this.endedAt = new Date();
    return 'victory';
  }
  
  if (this.areAllPlayersDead()) {
    this.status = 'defeat';
    this.endedAt = new Date();
    return 'defeat';
  }
  
  // Tous les joueurs ont fui?
  if (this.players.every(p => p.fled)) {
    this.status = 'fled';
    this.endedAt = new Date();
    return 'fled';
  }
  
  return 'active';
};

// Statiques
combatSchema.statics.findByPlayer = function(odiscordId, guildId) {
  return this.findOne({
    guildId,
    status: 'active',
    'players.odiscordId': odiscordId,
  });
};

combatSchema.statics.findByChannel = function(channelId) {
  return this.findOne({
    channelId,
    status: 'active',
  });
};

combatSchema.statics.cleanupOldCombats = function() {
  const timeout = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes
  return this.updateMany(
    { status: 'active', lastActionAt: { $lt: timeout } },
    { status: 'timeout', endedAt: new Date() }
  );
};

const Combat = mongoose.model('Combat', combatSchema);

export default Combat;
