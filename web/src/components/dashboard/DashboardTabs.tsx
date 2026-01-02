'use client';

import { useState } from 'react';
import { User, Sword, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { OverviewTab } from './tabs/OverviewTab';
import { InventoryTab } from './tabs/InventoryTab';
import { QuestsTab } from './tabs/QuestsTab';
import { StatsTab } from './tabs/StatsTab';
import { GuildTab } from './tabs/GuildTab';
import type { ICharacter, IGuild, ICharacterQuest } from '@/lib/models';
import { getItemName } from '@/lib/gameData';

// XP formula from bot: Math.floor(100 * Math.pow(level, 1.5))
function xpToLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

// Normaliser les données du personnage pour gérer les différences entre bot et web models
function normalizeCharacter(char: any) {
  // Get attributes from bot format (str, dex) or web format (strength, dexterity)
  const attrs = char.attributes || {};
  const characterAttributes = {
    strength: attrs.str ?? attrs.strength ?? 10,
    dexterity: attrs.dex ?? attrs.dexterity ?? 10,
    constitution: attrs.con ?? attrs.constitution ?? 10,
    intelligence: attrs.int ?? attrs.intelligence ?? 10,
    wisdom: attrs.wis ?? attrs.wisdom ?? 10,
    charisma: attrs.cha ?? attrs.charisma ?? 10,
  };

  // Extract equipped items from inventory
  const inventory = char.inventory || [];
  const getEquippedItem = (slots: string[]) => {
    const item = inventory.find((i: any) => i.equipped && slots.includes(i.slot));
    if (!item) return null;
    // Use custom name if set, otherwise get French name from gameData
    return item.customName || getItemName(item.itemId);
  };

  // Build equipment object with item names (French)
  const equipment = {
    weapon: getEquippedItem(['mainHand', 'offHand']),
    armor: getEquippedItem(['chest', 'head', 'legs', 'feet', 'hands']),
    accessory: getEquippedItem(['ring1', 'ring2', 'amulet', 'belt', 'cape']),
  };

  // Get current XP and calculate XP for next level
  const currentXp = char.xp ?? char.experience ?? 0;
  const currentLevel = char.level ?? 1;
  const xpForNextLevel = xpToLevel(currentLevel + 1);

  return {
    ...char,
    // Health: bot uses 'hp', web expects 'health'
    health: char.health || char.hp || { current: 10, max: 10 },
    // Mana: bot might not have mana for all classes
    mana: char.mana || { current: 0, max: 0 },
    // Attributes (str, dex, etc.) in web format (full names)
    stats: characterAttributes,
    // Statistics (monstersKilled, deaths, etc.) - bot uses 'stats' field
    statistics: char.stats || {},
    // Equipment with item names (French)
    equipment,
    // Experience values
    experience: currentXp,
    xpForNextLevel,
    // Gold: display just gold pieces, not converted to copper
    goldTotal: typeof char.gold === 'number' 
      ? char.gold 
      : (char.gold?.gold || 0),
    // Full gold breakdown for display
    goldBreakdown: {
      copper: char.gold?.copper || 0,
      silver: char.gold?.silver || 0,
      gold: char.gold?.gold || 0,
      platinum: char.gold?.platinum || 0,
    },
  };
}

interface DashboardTabsProps {
  character: any; // Using any to handle both formats
  quests: ICharacterQuest[];
  guild: IGuild | null;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const tabs = [
  { id: 'overview', label: 'Aperçu', icon: User },
  { id: 'inventory', label: 'Inventaire', icon: ShieldCheck },
  { id: 'quests', label: 'Quêtes', icon: Sword },
  { id: 'stats', label: 'Statistiques', icon: Sword },
  { id: 'guild', label: 'Guilde', icon: ShieldCheck },
];

export function DashboardTabs({ character: rawCharacter, quests, guild, user }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Normaliser les données du personnage
  const character = normalizeCharacter(rawCharacter);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab character={character} />;
      case 'inventory':
        return <InventoryTab character={character} />;
      case 'quests':
        return <QuestsTab quests={quests} />;
      case 'stats':
        return <StatsTab character={character} />;
      case 'guild':
        return <GuildTab guild={guild} character={character} />;
      default:
        return null;
    }
  };

  // Calculer la progression d'XP (using pre-calculated xpForNextLevel from normalizeCharacter)
  const xpProgress = character.xpForNextLevel > 0 
    ? (character.experience / character.xpForNextLevel) * 100 
    : 0;

  return (
    <div>
      {/* Header avec infos personnage */}
      <div className="card p-6 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            {user.image ? (
              <Image
                src={user.image}
                alt={character.name}
                width={80}
                height={80}
                className="rounded-xl"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-valthera-600 flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-valthera-600 rounded-full text-xs font-bold text-white">
              Nv.{character.level}
            </div>
          </div>

          {/* Infos principales */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-valthera-100 font-medieval">
              {character.name}
            </h1>
            <p className="text-valthera-200/60 font-body">
              {character.race} • {character.class}
              {character.background && ` • ${character.background}`}
            </p>

            {/* Barres HP/Mana/XP */}
            <div className="mt-4 space-y-2 max-w-md">
              {/* HP */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-valthera-200/60 w-10">PV</span>
                <div className="flex-1 progress-bar">
                  <div
                    className="progress-fill progress-health"
                    style={{ width: `${(character.health.current / character.health.max) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-valthera-200 w-16 text-right">
                  {character.health.current}/{character.health.max}
                </span>
              </div>

              {/* Mana */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-valthera-200/60 w-10">Mana</span>
                <div className="flex-1 progress-bar">
                  <div
                    className="progress-fill progress-mana"
                    style={{ width: `${(character.mana.current / character.mana.max) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-valthera-200 w-16 text-right">
                  {character.mana.current}/{character.mana.max}
                </span>
              </div>

              {/* XP */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-valthera-200/60 w-10">XP</span>
                <div className="flex-1 progress-bar">
                  <div
                    className="progress-fill progress-xp"
                    style={{ width: `${Math.min(xpProgress, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-valthera-200 w-20 text-right">
                  {character.experience}/{character.xpForNextLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Gold */}
          <div className="text-center md:text-right">
            <div className="text-3xl font-bold text-gradient-gold font-medieval">
              {(character.goldTotal || 0).toLocaleString()}
            </div>
            <div className="text-sm text-valthera-200/60 font-body">Pièces d'or</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-valthera">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-valthera-600 text-valthera-100 shadow-gold'
                : 'bg-valthera-800/50 text-valthera-200/60 hover:bg-valthera-800 hover:text-valthera-100 border border-valthera-700/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderTabContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
