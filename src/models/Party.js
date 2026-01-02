import mongoose from 'mongoose';

const partyMemberSchema = new mongoose.Schema({
  odisId: {
    type: String,
    required: true,
  },
  playerId: {
    type: String,
    required: true,
  },
  playerName: {
    type: String,
    required: true,
  },
  characterName: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['leader', 'member'],
    default: 'member',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const partyInviteSchema = new mongoose.Schema({
  odisId: {
    type: String,
    required: true,
  },
  playerId: {
    type: String,
    required: true,
  },
  playerName: {
    type: String,
    required: true,
  },
  invitedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, { _id: false });

const partySchema = new mongoose.Schema({
  // Identifiant Discord du serveur
  guildId: {
    type: String,
    required: true,
    index: true,
  },
  
  // Nom du groupe (optionnel)
  name: {
    type: String,
    default: null,
    maxlength: 32,
  },
  
  // Chef du groupe
  leaderId: {
    type: String,
    required: true,
    index: true,
  },
  
  // Membres du groupe
  members: {
    type: [partyMemberSchema],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 6;
      },
      message: 'Un groupe ne peut pas avoir plus de 6 membres.',
    },
  },
  
  // Invitations en attente
  pendingInvites: {
    type: [partyInviteSchema],
    default: [],
  },
  
  // Paramètres du groupe
  settings: {
    lootDistribution: {
      type: String,
      enum: ['roundrobin', 'random', 'leader', 'freeforall'],
      default: 'roundrobin',
    },
    xpShare: {
      type: Boolean,
      default: true,
    },
    autoAcceptInvites: {
      type: Boolean,
      default: false,
    },
  },
  
  // État du groupe
  status: {
    type: String,
    enum: ['idle', 'exploring', 'combat', 'dungeon'],
    default: 'idle',
  },
  
  // Zone actuelle (tous les membres doivent être dans la même zone)
  currentZone: {
    type: String,
    default: null,
  },
  
  // Combat de groupe en cours
  combatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Combat',
    default: null,
  },
  
  // Statistiques
  stats: {
    monstersKilled: { type: Number, default: 0 },
    questsCompleted: { type: Number, default: 0 },
    totalXpEarned: { type: Number, default: 0 },
    totalGoldEarned: { type: Number, default: 0 },
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  disbandedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Index composé pour recherche rapide
partySchema.index({ guildId: 1, leaderId: 1 });
partySchema.index({ 'members.playerId': 1 });

// Méthodes d'instance
partySchema.methods.isFull = function() {
  return this.members.length >= 6;
};

partySchema.methods.isLeader = function(playerId) {
  return this.leaderId === playerId;
};

partySchema.methods.isMember = function(playerId) {
  return this.members.some(m => m.playerId === playerId);
};

partySchema.methods.hasPendingInvite = function(playerId) {
  return this.pendingInvites.some(i => i.playerId === playerId && i.expiresAt > new Date());
};

partySchema.methods.getMember = function(playerId) {
  return this.members.find(m => m.playerId === playerId);
};

partySchema.methods.getMemberCount = function() {
  return this.members.length;
};

// Méthodes statiques
partySchema.statics.findByPlayer = async function(guildId, playerId) {
  return this.findOne({
    guildId,
    'members.playerId': playerId,
    disbandedAt: null,
  });
};

partySchema.statics.findByLeader = async function(guildId, leaderId) {
  return this.findOne({
    guildId,
    leaderId,
    disbandedAt: null,
  });
};

const Party = mongoose.model('Party', partySchema);

export default Party;
