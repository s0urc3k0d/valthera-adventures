import mongoose from 'mongoose';

const guildMemberSchema = new mongoose.Schema({
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
  rank: {
    type: String,
    enum: ['leader', 'officer', 'veteran', 'member', 'recruit'],
    default: 'recruit',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  contribution: {
    gold: { type: Number, default: 0 },
    quests: { type: Number, default: 0 },
    monsters: { type: Number, default: 0 },
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const guildInviteSchema = new mongoose.Schema({
  playerId: {
    type: String,
    required: true,
  },
  playerName: {
    type: String,
    required: true,
  },
  invitedBy: {
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

const guildBankItemSchema = new mongoose.Schema({
  itemId: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
  depositedBy: {
    type: String,
    required: true,
  },
  depositedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const guildSchema = new mongoose.Schema({
  // Identifiant Discord du serveur
  guildId: {
    type: String,
    required: true,
    index: true,
  },
  
  // Informations de base
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 32,
  },
  tag: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    minlength: 2,
    maxlength: 5,
  },
  description: {
    type: String,
    default: '',
    maxlength: 500,
  },
  motd: {
    type: String,
    default: '',
    maxlength: 200,
  },
  
  // Fondateur
  founderId: {
    type: String,
    required: true,
  },
  
  // Membres
  members: {
    type: [guildMemberSchema],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 50;
      },
      message: 'Une guilde ne peut pas avoir plus de 50 membres.',
    },
  },
  
  // Invitations
  pendingInvites: {
    type: [guildInviteSchema],
    default: [],
  },
  
  // Coffre de guilde
  bank: {
    gold: { type: Number, default: 0 },
    items: {
      type: [guildBankItemSchema],
      default: [],
    },
  },
  
  // Niveau et expérience de guilde
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
  
  // Statistiques
  stats: {
    totalMonstersKilled: { type: Number, default: 0 },
    totalQuestsCompleted: { type: Number, default: 0 },
    totalGoldEarned: { type: Number, default: 0 },
    totalMembersJoined: { type: Number, default: 0 },
  },
  
  // Paramètres
  settings: {
    recruitmentOpen: { type: Boolean, default: true },
    minLevelToJoin: { type: Number, default: 1 },
    bankAccessRank: { 
      type: String, 
      enum: ['leader', 'officer', 'veteran', 'member', 'recruit'],
      default: 'veteran',
    },
    inviteRank: {
      type: String,
      enum: ['leader', 'officer', 'veteran', 'member'],
      default: 'officer',
    },
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

// Index
guildSchema.index({ guildId: 1, name: 1 });
guildSchema.index({ 'members.playerId': 1 });
guildSchema.index({ tag: 1 }, { unique: true });

// Constantes pour les rangs
const RANK_ORDER = ['recruit', 'member', 'veteran', 'officer', 'leader'];

// Méthodes d'instance
guildSchema.methods.isFull = function() {
  return this.members.length >= 50;
};

guildSchema.methods.isLeader = function(playerId) {
  const member = this.members.find(m => m.playerId === playerId);
  return member?.rank === 'leader';
};

guildSchema.methods.isOfficer = function(playerId) {
  const member = this.members.find(m => m.playerId === playerId);
  return member?.rank === 'officer' || member?.rank === 'leader';
};

guildSchema.methods.isMember = function(playerId) {
  return this.members.some(m => m.playerId === playerId);
};

guildSchema.methods.getMember = function(playerId) {
  return this.members.find(m => m.playerId === playerId);
};

guildSchema.methods.getMemberCount = function() {
  return this.members.length;
};

guildSchema.methods.hasPermission = function(playerId, requiredRank) {
  const member = this.members.find(m => m.playerId === playerId);
  if (!member) return false;
  
  const memberRankIndex = RANK_ORDER.indexOf(member.rank);
  const requiredRankIndex = RANK_ORDER.indexOf(requiredRank);
  
  return memberRankIndex >= requiredRankIndex;
};

guildSchema.methods.hasPendingInvite = function(playerId) {
  return this.pendingInvites.some(i => i.playerId === playerId && i.expiresAt > new Date());
};

// XP requis par niveau de guilde
guildSchema.methods.getRequiredXp = function() {
  return this.level * 1000;
};

guildSchema.methods.canLevelUp = function() {
  return this.xp >= this.getRequiredXp() && this.level < 20;
};

// Méthodes statiques
guildSchema.statics.findByPlayer = async function(guildId, playerId) {
  return this.findOne({
    guildId,
    'members.playerId': playerId,
    disbandedAt: null,
  });
};

guildSchema.statics.findByName = async function(guildId, name) {
  return this.findOne({
    guildId,
    name: { $regex: new RegExp(`^${name}$`, 'i') },
    disbandedAt: null,
  });
};

guildSchema.statics.findByTag = async function(tag) {
  return this.findOne({
    tag: tag.toUpperCase(),
    disbandedAt: null,
  });
};

const Guild = mongoose.model('Guild', guildSchema);

export default Guild;
