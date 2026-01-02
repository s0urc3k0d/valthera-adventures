import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
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
  
  // Type et catégorie
  type: {
    type: String,
    enum: ['weapon', 'armor', 'shield', 'consumable', 'accessory', 'tool', 'quest', 'treasure', 'material', 'ammunition'],
    required: true,
  },
  subtype: {
    type: String,
    default: null,
    // Weapons: 'sword', 'axe', 'bow', 'staff', 'dagger', etc.
    // Armor: 'light', 'medium', 'heavy'
    // Accessory: 'ring', 'amulet', 'belt', 'cape'
    // Consumable: 'potion', 'scroll', 'food'
  },
  
  // Rareté
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'artifact'],
    default: 'common',
  },
  
  // Économie
  value: {
    type: Number,
    default: 0,
  },
  sellable: {
    type: Boolean,
    default: true,
  },
  
  // Poids et empilement
  weight: {
    type: Number,
    default: 0,
  },
  stackable: {
    type: Boolean,
    default: false,
  },
  maxStack: {
    type: Number,
    default: 1,
  },
  
  // Slot d'équipement
  slot: {
    type: String,
    enum: ['mainHand', 'offHand', 'twoHand', 'head', 'chest', 'legs', 'feet', 'hands', 'ring', 'amulet', 'belt', 'cape', null],
    default: null,
  },
  
  // Stats d'arme
  weapon: {
    damage: { type: String, default: null }, // "1d8"
    damageType: { type: String, default: null },
    properties: [String], // 'finesse', 'versatile', 'two-handed', 'light', 'heavy', etc.
    versatileDamage: { type: String, default: null },
    range: { type: String, default: null }, // "30/120"
    attackBonus: { type: Number, default: 0 },
  },
  
  // Stats d'armure
  armor: {
    baseAC: { type: Number, default: null },
    maxDexBonus: { type: Number, default: null },
    stealthDisadvantage: { type: Boolean, default: false },
    strengthRequirement: { type: Number, default: 0 },
  },
  
  // Bonus aux attributs/stats
  bonuses: {
    str: { type: Number, default: 0 },
    dex: { type: Number, default: 0 },
    con: { type: Number, default: 0 },
    int: { type: Number, default: 0 },
    wis: { type: Number, default: 0 },
    cha: { type: Number, default: 0 },
    ac: { type: Number, default: 0 },
    hp: { type: Number, default: 0 },
    attackBonus: { type: Number, default: 0 },
    damageBonus: { type: Number, default: 0 },
    spellDC: { type: Number, default: 0 },
    initiative: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
  },
  
  // Résistances conférées
  resistances: [String],
  immunities: [String],
  
  // Effets consommables
  consumable: {
    effect: { type: String, default: null }, // 'heal', 'buff', 'damage', 'restore', 'teleport'
    value: { type: String, default: null }, // "2d4+2" pour heal
    duration: { type: Number, default: 0 }, // Tours ou minutes
    statusEffect: { type: String, default: null },
  },
  
  // Effets spéciaux
  effects: [{
    name: { type: String },
    description: { type: String },
    trigger: { type: String }, // 'onHit', 'onCrit', 'onEquip', 'passive'
    chance: { type: Number, default: 100 },
    value: { type: mongoose.Schema.Types.Mixed },
  }],
  
  // Prérequis
  requirements: {
    level: { type: Number, default: 0 },
    class: [String],
    race: [String],
    attributes: {
      str: { type: Number, default: 0 },
      dex: { type: Number, default: 0 },
      con: { type: Number, default: 0 },
      int: { type: Number, default: 0 },
      wis: { type: Number, default: 0 },
      cha: { type: Number, default: 0 },
    },
  },
  
  // Enchantement
  enchantable: {
    type: Boolean,
    default: true,
  },
  maxEnchantments: {
    type: Number,
    default: 1,
  },
  
  // Pour les objets de quête
  questItem: {
    type: Boolean,
    default: false,
  },
  questId: {
    type: String,
    default: null,
  },
  
  // Crafting
  craftable: {
    type: Boolean,
    default: false,
  },
  craftingRecipe: {
    materials: [{
      itemId: String,
      quantity: Number,
    }],
    skill: String,
    skillLevel: Number,
  },
  
  // Visuel
  image: String,
  emoji: String,
  
  // Tags
  tags: [String],
  
  // Magique?
  magical: {
    type: Boolean,
    default: false,
  },
  attunement: {
    type: Boolean,
    default: false,
  },
  
}, {
  timestamps: true,
});

// Index
itemSchema.index({ id: 1 });
itemSchema.index({ type: 1 });
itemSchema.index({ rarity: 1 });
itemSchema.index({ slot: 1 });
itemSchema.index({ tags: 1 });

// Méthodes
itemSchema.methods.getSellPrice = function() {
  return Math.floor(this.value * 0.5);
};

itemSchema.methods.canEquip = function(character) {
  // Vérifier le niveau
  if (character.level < this.requirements.level) return false;
  
  // Vérifier la classe
  if (this.requirements.class.length > 0 && 
      !this.requirements.class.includes(character.class)) {
    return false;
  }
  
  // Vérifier les attributs
  const attrs = this.requirements.attributes;
  if (character.attributes.str < attrs.str ||
      character.attributes.dex < attrs.dex ||
      character.attributes.con < attrs.con ||
      character.attributes.int < attrs.int ||
      character.attributes.wis < attrs.wis ||
      character.attributes.cha < attrs.cha) {
    return false;
  }
  
  return true;
};

// Statiques
itemSchema.statics.findByType = function(type) {
  return this.find({ type });
};

itemSchema.statics.findByRarity = function(rarity) {
  return this.find({ rarity });
};

itemSchema.statics.findEquipment = function(slot) {
  return this.find({ slot });
};

itemSchema.statics.findShopItems = function(shopType) {
  const typeMap = {
    armorer: ['weapon', 'armor', 'shield'],
    apothecary: ['consumable'],
    general: ['tool', 'ammunition', 'material'],
    rare: { magical: true },
  };
  
  if (shopType === 'rare') {
    return this.find(typeMap.rare);
  }
  return this.find({ type: { $in: typeMap[shopType] || [] } });
};

const Item = mongoose.model('Item', itemSchema);

export default Item;
