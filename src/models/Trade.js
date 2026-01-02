import mongoose from 'mongoose';

const tradeItemSchema = new mongoose.Schema({
  itemId: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
}, { _id: false });

const tradeSchema = new mongoose.Schema({
  // Identifiant Discord du serveur
  guildId: {
    type: String,
    required: true,
    index: true,
  },
  
  // Initiateur de l'échange
  initiator: {
    odisId: { type: String, required: true },
    playerId: { type: String, required: true },
    playerName: { type: String, required: true },
    characterName: { type: String, required: true },
    items: { type: [tradeItemSchema], default: [] },
    gold: { type: Number, default: 0 },
    confirmed: { type: Boolean, default: false },
  },
  
  // Receveur de l'échange
  target: {
    odisId: { type: String, required: true },
    playerId: { type: String, required: true },
    playerName: { type: String, required: true },
    characterName: { type: String, required: true },
    items: { type: [tradeItemSchema], default: [] },
    gold: { type: Number, default: 0 },
    confirmed: { type: Boolean, default: false },
  },
  
  // État de l'échange
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled', 'expired'],
    default: 'pending',
  },
  
  // Message Discord associé
  messageId: {
    type: String,
    default: null,
  },
  channelId: {
    type: String,
    default: null,
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  completedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Index
tradeSchema.index({ guildId: 1, 'initiator.playerId': 1 });
tradeSchema.index({ guildId: 1, 'target.playerId': 1 });
tradeSchema.index({ status: 1 });
tradeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Méthodes d'instance
tradeSchema.methods.isParticipant = function(playerId) {
  return this.initiator.playerId === playerId || this.target.playerId === playerId;
};

tradeSchema.methods.getParticipantSide = function(playerId) {
  if (this.initiator.playerId === playerId) return 'initiator';
  if (this.target.playerId === playerId) return 'target';
  return null;
};

tradeSchema.methods.canComplete = function() {
  return this.initiator.confirmed && this.target.confirmed;
};

tradeSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Méthodes statiques
tradeSchema.statics.findActiveByPlayer = async function(guildId, playerId) {
  return this.findOne({
    guildId,
    status: { $in: ['pending', 'active'] },
    $or: [
      { 'initiator.playerId': playerId },
      { 'target.playerId': playerId },
    ],
  });
};

tradeSchema.statics.findPendingBetween = async function(guildId, player1Id, player2Id) {
  return this.findOne({
    guildId,
    status: 'pending',
    $or: [
      { 'initiator.playerId': player1Id, 'target.playerId': player2Id },
      { 'initiator.playerId': player2Id, 'target.playerId': player1Id },
    ],
  });
};

const Trade = mongoose.model('Trade', tradeSchema);

export default Trade;
