import mongoose, { Schema, Model } from 'mongoose';

// Types pour le Character (correspondant au modèle du bot)
export interface ICharacter {
  odiscordUserId: string;
  name: string;
  race: string;
  class: string;
  background?: string;
  level: number;
  experience: number;
  gold: number;
  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  health: {
    current: number;
    max: number;
  };
  mana: {
    current: number;
    max: number;
  };
  inventory: Array<{
    itemId: string;
    quantity: number;
    equipped?: boolean;
  }>;
  equipment: {
    weapon?: string;
    armor?: string;
    accessory?: string;
  };
  skills: string[];
  spells: string[];
  abilities: string[];
  location: {
    zoneId: string;
    subZone?: string;
  };
  reputation: Map<string, number>;
  achievements: string[];
  statistics: {
    monstersKilled: number;
    questsCompleted: number;
    goldEarned: number;
    goldSpent: number;
    deaths: number;
    damageDealt: number;
    damageTaken: number;
    healingDone: number;
    itemsCrafted: number;
    itemsSold: number;
    zonesExplored: number;
  };
  statusEffects: Array<{
    effectId: string;
    duration: number;
    appliedAt: Date;
  }>;
  cooldowns: Map<string, Date>;
  createdAt: Date;
  updatedAt: Date;
}

// Schéma Character (réplique du bot)
const CharacterSchema = new Schema<ICharacter>(
  {
    odiscordUserId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    race: { type: String, required: true },
    class: { type: String, required: true },
    background: String,
    level: { type: Number, default: 1 },
    experience: { type: Number, default: 0 },
    gold: { type: Number, default: 100 },
    stats: {
      strength: { type: Number, default: 10 },
      dexterity: { type: Number, default: 10 },
      constitution: { type: Number, default: 10 },
      intelligence: { type: Number, default: 10 },
      wisdom: { type: Number, default: 10 },
      charisma: { type: Number, default: 10 },
    },
    health: {
      current: { type: Number, default: 20 },
      max: { type: Number, default: 20 },
    },
    mana: {
      current: { type: Number, default: 10 },
      max: { type: Number, default: 10 },
    },
    inventory: [
      {
        itemId: String,
        quantity: { type: Number, default: 1 },
        equipped: { type: Boolean, default: false },
      },
    ],
    equipment: {
      weapon: String,
      armor: String,
      accessory: String,
    },
    skills: [String],
    spells: [String],
    abilities: [String],
    location: {
      zoneId: { type: String, default: 'val-serein' },
      subZone: String,
    },
    reputation: { type: Map, of: Number, default: {} },
    achievements: [String],
    statistics: {
      monstersKilled: { type: Number, default: 0 },
      questsCompleted: { type: Number, default: 0 },
      goldEarned: { type: Number, default: 0 },
      goldSpent: { type: Number, default: 0 },
      deaths: { type: Number, default: 0 },
      damageDealt: { type: Number, default: 0 },
      damageTaken: { type: Number, default: 0 },
      healingDone: { type: Number, default: 0 },
      itemsCrafted: { type: Number, default: 0 },
      itemsSold: { type: Number, default: 0 },
      zonesExplored: { type: Number, default: 0 },
    },
    statusEffects: [
      {
        effectId: String,
        duration: Number,
        appliedAt: Date,
      },
    ],
    cooldowns: { type: Map, of: Date, default: {} },
  },
  {
    timestamps: true,
    collection: 'characters',
  }
);

// Quest Model
export interface IQuest {
  discordUserId: string;
  questId: string;
  status: 'active' | 'completed' | 'failed';
  progress: Map<string, number>;
  startedAt: Date;
  completedAt?: Date;
}

const QuestSchema = new Schema<IQuest>(
  {
    discordUserId: { type: String, required: true, index: true },
    questId: { type: String, required: true },
    status: { type: String, enum: ['active', 'completed', 'failed'], default: 'active' },
    progress: { type: Map, of: Number, default: {} },
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
  },
  {
    timestamps: true,
    collection: 'quests',
  }
);

// Guild Model
export interface IGuild {
  guildId: string;
  name: string;
  tag: string;
  description?: string;
  leaderId: string;
  officers: string[];
  members: Array<{
    odiscordUserId: string;
    rank: string;
    joinedAt: Date;
  }>;
  level: number;
  experience: number;
  treasury: number;
  createdAt: Date;
}

const GuildSchema = new Schema<IGuild>(
  {
    guildId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    tag: { type: String, required: true },
    description: String,
    leaderId: { type: String, required: true },
    officers: [String],
    members: [
      {
        odiscordUserId: String,
        rank: String,
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    level: { type: Number, default: 1 },
    experience: { type: Number, default: 0 },
    treasury: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'guilds',
  }
);

// Export models (avec vérification pour éviter les redéfinitions en dev)
export const Character: Model<ICharacter> =
  mongoose.models.Character || mongoose.model<ICharacter>('Character', CharacterSchema);

export const Quest: Model<IQuest> =
  mongoose.models.Quest || mongoose.model<IQuest>('Quest', QuestSchema);

export const Guild: Model<IGuild> =
  mongoose.models.Guild || mongoose.model<IGuild>('Guild', GuildSchema);
