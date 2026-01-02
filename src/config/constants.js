export default {
  // Bot Configuration
  bot: {
    prefix: '!',
    embedColors: {
      primary: 0x7c3aed,      // Violet - Couleur principale
      success: 0x22c55e,      // Vert - Succès
      error: 0xef4444,        // Rouge - Erreur
      warning: 0xf59e0b,      // Orange - Avertissement
      info: 0x3b82f6,         // Bleu - Information
      combat: 0xdc2626,       // Rouge foncé - Combat
      gold: 0xfbbf24,         // Or - Économie
      xp: 0x8b5cf6,           // Violet clair - Expérience
      legendary: 0xff8c00,    // Orange - Légendaire
      epic: 0xa855f7,         // Violet - Épique
      rare: 0x3b82f6,         // Bleu - Rare
      uncommon: 0x22c55e,     // Vert - Peu commun
      common: 0x9ca3af,       // Gris - Commun
    },
    cooldowns: {
      default: 3,             // Secondes
      combat: 1,
      exploration: 5,
      shop: 2,
    },
  },

  // Game Configuration
  game: {
    // Starting values
    startingLevel: 1,
    startingXP: 0,
    baseAttributePoints: 27,
    attributeMinimum: 8,
    attributeMaximum: 15,
    
    // Progression
    xpToLevel: (level) => Math.floor(100 * Math.pow(level, 1.5)),
    maxLevel: 20,
    
    // Combat
    criticalHitMultiplier: 2,
    criticalHitRoll: 20,
    criticalFailRoll: 1,
    baseAC: 10,
    
    // Rest
    shortRestDuration: 1,     // Heures
    longRestDuration: 8,      // Heures
    shortRestHealDice: 1,     // Nombre de dés de vie
    
    // Economy
    sellPriceMultiplier: 0.5, // 50% du prix d'achat
    innRestCost: 5,           // Pièces d'or
    
    // Inventory
    baseCarryCapacity: 150,   // Livres (lb)
    carryCapacityPerStr: 15,  // Livres par point de Force
    
    // Exploration
    encounterChance: 0.3,     // 30% de chance de rencontre
    discoveryChance: 0.1,     // 10% de chance de découverte
  },

  // Proficiency Bonus by Level
  proficiencyBonus: {
    1: 2, 2: 2, 3: 2, 4: 2,
    5: 3, 6: 3, 7: 3, 8: 3,
    9: 4, 10: 4, 11: 4, 12: 4,
    13: 5, 14: 5, 15: 5, 16: 5,
    17: 6, 18: 6, 19: 6, 20: 6,
  },

  // Rarity Configuration
  rarities: {
    common: { name: 'Commun', color: 0x9ca3af, dropChance: 0.60 },
    uncommon: { name: 'Peu commun', color: 0x22c55e, dropChance: 0.25 },
    rare: { name: 'Rare', color: 0x3b82f6, dropChance: 0.10 },
    epic: { name: 'Épique', color: 0xa855f7, dropChance: 0.04 },
    legendary: { name: 'Légendaire', color: 0xff8c00, dropChance: 0.009 },
    artifact: { name: 'Artefact', color: 0xef4444, dropChance: 0.001 },
  },

  // Equipment Slots
  equipmentSlots: [
    'mainHand',
    'offHand',
    'head',
    'chest',
    'legs',
    'feet',
    'hands',
    'ring1',
    'ring2',
    'amulet',
    'belt',
    'cape',
  ],

  // Damage Types
  damageTypes: {
    physical: ['slashing', 'bludgeoning', 'piercing'],
    magical: ['fire', 'cold', 'lightning', 'poison', 'force', 'necrotic', 'radiant', 'psychic', 'thunder', 'acid'],
  },

  // Status Effects
  statusEffects: {
    poisoned: { name: 'Empoisonné', duration: 3, damagePerTurn: '1d4' },
    burning: { name: 'En feu', duration: 2, damagePerTurn: '1d6' },
    stunned: { name: 'Étourdi', duration: 1, skipTurn: true },
    blinded: { name: 'Aveuglé', duration: 2, attackDisadvantage: true },
    charmed: { name: 'Charmé', duration: 3, cannotAttackSource: true },
    frightened: { name: 'Effrayé', duration: 2, attackDisadvantage: true },
    paralyzed: { name: 'Paralysé', duration: 1, autoFail: ['str', 'dex'] },
    prone: { name: 'À terre', duration: 1, meleeAdvantage: true, rangedDisadvantage: true },
  },

  // Currency
  currency: {
    copper: { name: 'Pièce de cuivre', abbrev: 'PC', value: 1 },
    silver: { name: "Pièce d'argent", abbrev: 'PA', value: 10 },
    gold: { name: "Pièce d'or", abbrev: 'PO', value: 100 },
    platinum: { name: 'Pièce de platine', abbrev: 'PP', value: 1000 },
  },

  // Emojis (can be replaced with custom Discord emojis)
  emojis: {
    // Stats
    hp: '❤️',
    ac: '🛡️',
    xp: '✨',
    level: '📊',
    gold: '💰',
    
    // Attributes
    str: '💪',
    dex: '🏃',
    con: '🫀',
    int: '🧠',
    wis: '👁️',
    cha: '💬',
    
    // Actions
    attack: '⚔️',
    defend: '🛡️',
    flee: '🏃💨',
    use: '🎒',
    
    // Status
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    
    // Dice
    d20: '🎲',
    critical: '💥',
    fumble: '💀',
    
    // Misc
    quest: '📜',
    shop: '🏪',
    inventory: '🎒',
    map: '🗺️',
    rest: '🏕️',
    combat: '⚔️',
  },

  // API Rate Limits
  rateLimits: {
    commandsPerMinute: 30,
    combatActionsPerSecond: 2,
  },

  // Cache TTL (in seconds)
  cacheTTL: {
    character: 300,
    zone: 600,
    items: 3600,
    quests: 600,
  },
};
