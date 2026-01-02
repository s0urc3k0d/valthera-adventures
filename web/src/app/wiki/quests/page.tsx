'use client';

import Link from 'next/link';
import { useState } from 'react';

type Quest = {
  id: string;
  title: string;
  description: string;
  type: 'main' | 'side' | 'daily';
  category: string;
  emoji: string;
  giver: { name: string; location: string };
  level: { min: number; max: number; recommended: number };
  objectives: string[];
  rewards: { xp: number; gold: number; items?: string[] };
};

const quests: Quest[] = [
  {
    id: 'main_01_welcome',
    title: 'Bienvenue à Valthera',
    description: 'Vous venez d\'arriver à Valthera, la capitale du royaume. Elena Vent-Murmurant, de la Guilde des Aventuriers, souhaite vous rencontrer pour vous guider dans vos premiers pas.',
    type: 'main',
    category: 'Introduction',
    emoji: '📜',
    giver: { name: 'Elena Vent-Murmurant', location: 'Valthera' },
    level: { min: 1, max: 5, recommended: 1 },
    objectives: [
      'Parler à Elena Vent-Murmurant',
      'Explorer les Bois Murmurants',
      'Vaincre un loup',
      'Retourner voir Elena'
    ],
    rewards: { xp: 100, gold: 25, items: ['Potion de soins x3'] }
  },
  {
    id: 'main_02_whispers',
    title: 'Les Murmures de la Forêt',
    description: 'Des villageois ont signalé des bruits étranges venant des Bois Murmurants. Elena vous demande d\'enquêter sur le Cercle des Fées.',
    type: 'main',
    category: 'Mystère',
    emoji: '🧚',
    giver: { name: 'Elena Vent-Murmurant', location: 'Valthera' },
    level: { min: 2, max: 6, recommended: 3 },
    objectives: [
      'Découvrir le Cercle des Fées',
      'Collecter 5 Herbes Lunaires',
      'Enquêter sur les murmures',
      'Rapporter vos découvertes'
    ],
    rewards: { xp: 200, gold: 50, items: ['Anneau de la Fée'] }
  },
  {
    id: 'main_03_mines',
    title: 'Le Roi Déchu',
    description: 'Les Mines d\'Argent sont hantées par l\'esprit du dernier roi nain. Seul un aventurier courageux pourra libérer son âme tourmentée.',
    type: 'main',
    category: 'Donjon',
    emoji: '👑',
    giver: { name: 'Marcus Main-de-Fer', location: 'Valthera' },
    level: { min: 5, max: 8, recommended: 7 },
    objectives: [
      'Entrer dans les Mines d\'Argent',
      'Atteindre le niveau 3',
      'Vaincre le Roi des Mines',
      'Récupérer la Couronne Royale'
    ],
    rewards: { xp: 1000, gold: 250, items: ['Couronne du Roi Déchu', 'Titre: Libérateur des Mines'] }
  },
  {
    id: 'side_01_herbs',
    title: 'Herbes Médicinales',
    description: 'L\'apothicaire de Valthera a besoin d\'herbes fraîches pour préparer ses remèdes.',
    type: 'side',
    category: 'Récolte',
    emoji: '🌿',
    giver: { name: 'Apothicaire Mira', location: 'Valthera' },
    level: { min: 1, max: 10, recommended: 2 },
    objectives: [
      'Récolter 10 Herbes Médicinales dans les Bois Murmurants'
    ],
    rewards: { xp: 50, gold: 30, items: ['Potion de soins x2'] }
  },
  {
    id: 'side_02_wolves',
    title: 'La Meute Sauvage',
    description: 'Les loups deviennent trop nombreux dans les Bois Murmurants et menacent les voyageurs.',
    type: 'side',
    category: 'Chasse',
    emoji: '🐺',
    giver: { name: 'Ranger Chêne', location: 'Bois Murmurants' },
    level: { min: 1, max: 5, recommended: 2 },
    objectives: [
      'Éliminer 5 loups dans les Bois Murmurants'
    ],
    rewards: { xp: 75, gold: 40, items: ['Peau de loup x3'] }
  },
  {
    id: 'side_03_spider',
    title: 'Infestation Arachnéenne',
    description: 'Des araignées géantes ont élu domicile dans les tunnels des mines. Les mineurs ont besoin d\'aide.',
    type: 'side',
    category: 'Extermination',
    emoji: '🕷️',
    giver: { name: 'Chef Mineur Durin', location: 'Mines d\'Argent' },
    level: { min: 2, max: 6, recommended: 3 },
    objectives: [
      'Éliminer 8 araignées géantes',
      'Détruire 3 nids d\'araignées'
    ],
    rewards: { xp: 150, gold: 75, items: ['Soie d\'araignée x5'] }
  },
  {
    id: 'side_04_delivery',
    title: 'Livraison Urgente',
    description: 'Un colis important doit être livré au Ranger Chêne dans les Bois Murmurants.',
    type: 'side',
    category: 'Livraison',
    emoji: '📦',
    giver: { name: 'Lyra Touche-Argent', location: 'Valthera' },
    level: { min: 1, max: 10, recommended: 1 },
    objectives: [
      'Prendre le colis chez Lyra',
      'Le livrer au Ranger Chêne'
    ],
    rewards: { xp: 30, gold: 20 }
  },
  {
    id: 'daily_hunt',
    title: 'Chasse du Jour',
    description: 'La guilde recherche des chasseurs pour réguler la faune locale.',
    type: 'daily',
    category: 'Chasse',
    emoji: '🎯',
    giver: { name: 'Tableau de la Guilde', location: 'Valthera' },
    level: { min: 1, max: 99, recommended: 1 },
    objectives: [
      'Vaincre 3 créatures dans n\'importe quelle zone'
    ],
    rewards: { xp: 50, gold: 25 }
  },
  {
    id: 'daily_gather',
    title: 'Récolte Quotidienne',
    description: 'Les artisans ont besoin de matériaux pour leurs créations.',
    type: 'daily',
    category: 'Récolte',
    emoji: '🌾',
    giver: { name: 'Tableau de la Guilde', location: 'Valthera' },
    level: { min: 1, max: 99, recommended: 1 },
    objectives: [
      'Récolter 5 ressources dans n\'importe quelle zone'
    ],
    rewards: { xp: 40, gold: 20 }
  }
];

const typeColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
  main: { bg: 'bg-legendary/10', text: 'text-legendary', border: 'border-legendary/50', label: 'Quête Principale' },
  side: { bg: 'bg-rare/10', text: 'text-rare', border: 'border-rare/50', label: 'Quête Secondaire' },
  daily: { bg: 'bg-uncommon/10', text: 'text-uncommon', border: 'border-uncommon/50', label: 'Quête Journalière' }
};

export default function QuestsPage() {
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);

  const filteredQuests = filterType === 'all'
    ? quests
    : quests.filter(q => q.type === filterType);

  const mainQuests = quests.filter(q => q.type === 'main');
  const sideQuests = quests.filter(q => q.type === 'side');
  const dailyQuests = quests.filter(q => q.type === 'daily');

  return (
    <div className="min-h-screen bg-valthera-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-valthera-900 to-valthera-950 border-b border-valthera-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 text-sm text-valthera-400 mb-4">
            <Link href="/wiki" className="hover:text-valthera-200 transition-colors">Wiki</Link>
            <span>/</span>
            <span className="text-valthera-200">Quêtes</span>
          </div>
          <h1 className="text-4xl font-medieval text-valthera-100 mb-4">
            📜 Journal des Quêtes
          </h1>
          <p className="text-valthera-300 max-w-3xl">
            Découvrez toutes les quêtes disponibles dans Valthera. Des missions principales épiques aux 
            tâches quotidiennes, chaque aventure offre des récompenses uniques.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-legendary/10 border border-legendary/30 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-legendary">{mainQuests.length}</p>
            <p className="text-valthera-400">Quêtes Principales</p>
          </div>
          <div className="bg-rare/10 border border-rare/30 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-rare">{sideQuests.length}</p>
            <p className="text-valthera-400">Quêtes Secondaires</p>
          </div>
          <div className="bg-uncommon/10 border border-uncommon/30 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-uncommon">{dailyQuests.length}</p>
            <p className="text-valthera-400">Quêtes Journalières</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {['all', 'main', 'side', 'daily'].map((type) => (
            <button
              key={type}
              onClick={() => {
                setFilterType(type);
                setSelectedQuest(null);
              }}
              className={`px-4 py-2 rounded-lg border transition-all ${
                filterType === type
                  ? type === 'all'
                    ? 'bg-valthera-700 border-valthera-500 text-valthera-100'
                    : `${typeColors[type].bg} ${typeColors[type].text} ${typeColors[type].border}`
                  : 'bg-valthera-900/50 border-valthera-800 text-valthera-400 hover:bg-valthera-800/50'
              }`}
            >
              {type === 'all' ? 'Toutes' : typeColors[type].label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quest List */}
          <div className="lg:col-span-1 space-y-3">
            {filteredQuests.map((quest) => {
              const colors = typeColors[quest.type];
              return (
                <button
                  key={quest.id}
                  onClick={() => setSelectedQuest(quest)}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    selectedQuest?.id === quest.id
                      ? `${colors.bg} ${colors.border} ring-1 ring-offset-1 ring-offset-valthera-950 ring-valthera-500`
                      : 'bg-valthera-900/50 border-valthera-800 hover:bg-valthera-800/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{quest.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-medieval text-valthera-100 truncate">{quest.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`px-2 py-0.5 rounded ${colors.bg} ${colors.text} border ${colors.border}`}>
                          {quest.type === 'main' ? 'Principal' : quest.type === 'side' ? 'Secondaire' : 'Journalier'}
                        </span>
                        <span className="text-valthera-500">Niv. {quest.level.recommended}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quest Details */}
          <div className="lg:col-span-2">
            {selectedQuest ? (
              <div className={`bg-valthera-900/50 rounded-xl border overflow-hidden ${typeColors[selectedQuest.type].border}`}>
                {/* Header */}
                <div className={`p-6 ${typeColors[selectedQuest.type].bg}`}>
                  <div className="flex items-start gap-4">
                    <span className="text-6xl">{selectedQuest.emoji}</span>
                    <div className="flex-1">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm mb-2 ${typeColors[selectedQuest.type].bg} ${typeColors[selectedQuest.type].text} border ${typeColors[selectedQuest.type].border}`}>
                        {typeColors[selectedQuest.type].label}
                      </span>
                      <h2 className="text-3xl font-medieval text-valthera-100 mb-2">{selectedQuest.title}</h2>
                      <div className="flex items-center gap-4 text-sm text-valthera-400">
                        <span>📍 {selectedQuest.giver.location}</span>
                        <span>👤 {selectedQuest.giver.name}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Description */}
                  <p className="text-valthera-300 text-lg leading-relaxed">{selectedQuest.description}</p>

                  {/* Level */}
                  <div className="bg-valthera-800/30 rounded-lg p-4 border border-valthera-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-valthera-400 text-sm">Niveau requis</p>
                        <p className="text-valthera-100 font-medium">{selectedQuest.level.min} - {selectedQuest.level.max}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-valthera-400 text-sm">Niveau recommandé</p>
                        <p className="text-legendary font-bold text-xl">{selectedQuest.level.recommended}</p>
                      </div>
                    </div>
                  </div>

                  {/* Objectives */}
                  <div>
                    <h3 className="text-lg font-medieval text-valthera-200 mb-3">📋 Objectifs</h3>
                    <div className="space-y-2">
                      {selectedQuest.objectives.map((obj, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-valthera-800/30 rounded-lg border border-valthera-700">
                          <span className="w-6 h-6 rounded-full bg-valthera-700 text-valthera-300 flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <span className="text-valthera-200">{obj}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rewards */}
                  <div>
                    <h3 className="text-lg font-medieval text-valthera-200 mb-3">🎁 Récompenses</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="bg-valthera-800/30 rounded-lg p-4 border border-valthera-700 text-center">
                        <p className="text-3xl font-bold text-rare mb-1">{selectedQuest.rewards.xp}</p>
                        <p className="text-valthera-400 text-sm">Points d'expérience</p>
                      </div>
                      <div className="bg-valthera-800/30 rounded-lg p-4 border border-valthera-700 text-center">
                        <p className="text-3xl font-bold text-legendary mb-1">{selectedQuest.rewards.gold}</p>
                        <p className="text-valthera-400 text-sm">Pièces d'or</p>
                      </div>
                    </div>
                    {selectedQuest.rewards.items && selectedQuest.rewards.items.length > 0 && (
                      <div className="mt-4 p-4 bg-epic/10 rounded-lg border border-epic/30">
                        <p className="text-epic font-medium mb-2">🎒 Objets bonus</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedQuest.rewards.items.map((item) => (
                            <span key={item} className="px-3 py-1 bg-valthera-800 text-valthera-200 rounded-full text-sm">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-valthera-900/50 rounded-xl border border-valthera-800 p-12 text-center">
                <span className="text-6xl mb-4 block">📜</span>
                <h3 className="text-xl font-medieval text-valthera-100 mb-2">Sélectionnez une Quête</h3>
                <p className="text-valthera-400">
                  Cliquez sur une quête dans la liste pour voir ses détails et récompenses.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
