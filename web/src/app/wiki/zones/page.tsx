'use client';

import Link from 'next/link';
import { useState } from 'react';

const zones = [
  {
    id: 'val-serein',
    name: 'Val-Serein',
    emoji: '🏰',
    type: 'city',
    typeName: 'Capitale',
    level: { min: 1, max: 99 },
    description: 'La capitale du royaume de Valthera, un havre de paix pour tous les aventuriers. Ici se trouvent la Guilde des Aventuriers, de nombreux marchands et les institutions du royaume.',
    features: ['Zone sécurisée', 'Commerces', 'Guilde des Aventuriers', 'Repos gratuit'],
    npcs: [
      { id: 'elena-whisperwind', name: 'Elena Vent-Murmurant', role: 'Maîtresse de Guilde', emoji: '👩‍💼' },
      { id: 'marcus-ironhand', name: 'Marcus Main-de-Fer', role: 'Forgeron', emoji: '⚒️' },
      { id: 'lyra-silvertouch', name: 'Lyra Touche-Argent', role: 'Marchande', emoji: '💰' },
      { id: 'old-thom', name: 'Vieux Thom', role: 'Tavernier', emoji: '🍺' }
    ],
    resources: [],
    monsters: [],
    connections: ['whispering-woods', 'silver-mines'],
    color: 'valthera'
  },
  {
    id: 'whispering-woods',
    name: 'Bois Murmurants',
    emoji: '🌲',
    type: 'wilderness',
    typeName: 'Forêt',
    level: { min: 1, max: 5 },
    description: 'Une forêt ancienne aux arbres séculaires. Les légendes parlent de fées et d\'esprits qui habitent ces lieux. C\'est l\'endroit idéal pour les aventuriers débutants.',
    features: ['Zone de départ', 'Ressources naturelles', 'Faune sauvage'],
    npcs: [
      { id: 'ranger-oak', name: 'Ranger Chêne', role: 'Garde forestier', emoji: '🏹' }
    ],
    resources: [
      { name: 'Herbes médicinales', rarity: 'common', emoji: '🌿' },
      { name: 'Bois de chêne', rarity: 'common', emoji: '🪵' },
      { name: 'Fleur de lune', rarity: 'uncommon', emoji: '🌸' },
      { name: 'Champignon lumineux', rarity: 'rare', emoji: '🍄' }
    ],
    monsters: [
      { name: 'Loup', level: 1, emoji: '🐺' },
      { name: 'Gobelin', level: 1, emoji: '👺' },
      { name: 'Araignée géante', level: 2, emoji: '🕷️' }
    ],
    connections: ['val-serein', 'moonlit-glade'],
    color: 'forest'
  },
  {
    id: 'silver-mines',
    name: 'Mines d\'Argent',
    emoji: '⛏️',
    type: 'dungeon',
    typeName: 'Donjon',
    level: { min: 3, max: 7 },
    description: 'Des mines abandonnées depuis des décennies, maintenant infestées de créatures hostiles. On dit qu\'un trésor est caché dans les profondeurs...',
    features: ['Donjon à 3 étages', 'Boss final', 'Trésors cachés'],
    npcs: [],
    resources: [
      { name: 'Minerai d\'argent', rarity: 'common', emoji: '🪨' },
      { name: 'Cristal de quartz', rarity: 'uncommon', emoji: '💎' },
      { name: 'Gemme rare', rarity: 'rare', emoji: '💠' }
    ],
    monsters: [
      { name: 'Squelette', level: 2, emoji: '💀' },
      { name: 'Araignée géante', level: 2, emoji: '🕷️' },
      { name: 'Orc', level: 3, emoji: '👹' },
      { name: 'Roi des Mines (Boss)', level: 7, emoji: '👑' }
    ],
    connections: ['val-serein'],
    color: 'steel'
  },
  {
    id: 'moonlit-glade',
    name: 'Clairière Lunaire',
    emoji: '🌙',
    type: 'wilderness',
    typeName: 'Zone enchantée',
    level: { min: 2, max: 6 },
    description: 'Une clairière magique baignée d\'une lumière argentée perpétuelle. Les fées et créatures féeriques y résident, et la magie y est particulièrement puissante.',
    features: ['Zone magique', 'Créatures féeriques', 'Herbes rares'],
    npcs: [
      { id: 'fairy-queen', name: 'Reine des Fées', role: 'Souveraine', emoji: '👸' }
    ],
    resources: [
      { name: 'Poussière de fée', rarity: 'rare', emoji: '✨' },
      { name: 'Larme de lune', rarity: 'epic', emoji: '💧' },
      { name: 'Fleur éthérée', rarity: 'uncommon', emoji: '🌺' }
    ],
    monsters: [
      { name: 'Esprit follet', level: 2, emoji: '🧚' },
      { name: 'Loup spectral', level: 3, emoji: '👻' },
      { name: 'Gardien de la clairière', level: 5, emoji: '🌳' }
    ],
    connections: ['whispering-woods'],
    color: 'legendary'
  }
];

const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  city: { bg: 'bg-valthera-800', text: 'text-valthera-200', border: 'border-valthera-600' },
  wilderness: { bg: 'bg-forest-900', text: 'text-forest-200', border: 'border-forest-700' },
  dungeon: { bg: 'bg-blood-900', text: 'text-blood-200', border: 'border-blood-700' }
};

const rarityColors: Record<string, string> = {
  common: 'text-steel-400',
  uncommon: 'text-uncommon',
  rare: 'text-rare',
  epic: 'text-epic',
  legendary: 'text-legendary'
};

export default function ZonesPage() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const activeZone = zones.find(z => z.id === selectedZone);

  return (
    <div className="min-h-screen bg-valthera-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-valthera-900 to-valthera-950 border-b border-valthera-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 text-sm text-valthera-400 mb-4">
            <Link href="/wiki" className="hover:text-valthera-200 transition-colors">Wiki</Link>
            <span>/</span>
            <span className="text-valthera-200">Zones</span>
          </div>
          <h1 className="text-4xl font-medieval text-valthera-100 mb-4">
            🗺️ Zones de Valthera
          </h1>
          <p className="text-valthera-300 max-w-3xl">
            Explorez les différentes régions du royaume de Valthera. Chaque zone offre des défis, 
            des ressources et des rencontres uniques.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Zone Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {zones.map((zone) => {
            const colors = typeColors[zone.type];
            return (
              <button
                key={zone.id}
                onClick={() => setSelectedZone(zone.id)}
                className={`p-5 rounded-xl border text-left transition-all ${
                  selectedZone === zone.id
                    ? `${colors.bg} ${colors.border} ring-2 ring-offset-2 ring-offset-valthera-950 ring-valthera-500`
                    : 'bg-valthera-900/50 border-valthera-800 hover:bg-valthera-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-4xl">{zone.emoji}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${colors.bg} ${colors.text} border ${colors.border}`}>
                    {zone.typeName}
                  </span>
                </div>
                <h3 className="font-medieval text-lg text-valthera-100 mb-1">{zone.name}</h3>
                <p className="text-sm text-valthera-400">
                  Niveau {zone.level.min}-{zone.level.max}
                </p>
              </button>
            );
          })}
        </div>

        {/* Zone Details */}
        {activeZone ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-valthera-900/50 rounded-xl border border-valthera-800 p-6">
                <div className="flex items-start gap-4 mb-6">
                  <span className="text-6xl">{activeZone.emoji}</span>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-3xl font-medieval text-valthera-100">{activeZone.name}</h2>
                      <span className={`px-3 py-1 rounded-full text-sm ${typeColors[activeZone.type].bg} ${typeColors[activeZone.type].text} border ${typeColors[activeZone.type].border}`}>
                        {activeZone.typeName}
                      </span>
                    </div>
                    <p className="text-valthera-400">
                      Niveau recommandé: <span className="text-valthera-200 font-medium">{activeZone.level.min} - {activeZone.level.max}</span>
                    </p>
                  </div>
                </div>

                <p className="text-valthera-300 mb-6">{activeZone.description}</p>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {activeZone.features.map((feature) => (
                    <span key={feature} className="px-3 py-1 bg-valthera-800 text-valthera-200 rounded-full text-sm">
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Connections */}
                <div>
                  <h3 className="text-lg font-medieval text-valthera-200 mb-3">🔗 Zones Connectées</h3>
                  <div className="flex flex-wrap gap-2">
                    {activeZone.connections.map((connId) => {
                      const connZone = zones.find(z => z.id === connId);
                      return connZone && (
                        <button
                          key={connId}
                          onClick={() => setSelectedZone(connId)}
                          className="px-4 py-2 bg-valthera-800/50 hover:bg-valthera-700 text-valthera-200 rounded-lg transition-colors border border-valthera-700"
                        >
                          {connZone.emoji} {connZone.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Monsters */}
              {activeZone.monsters.length > 0 && (
                <div className="bg-valthera-900/50 rounded-xl border border-valthera-800 p-6">
                  <h3 className="text-xl font-medieval text-valthera-100 mb-4">⚔️ Monstres</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {activeZone.monsters.map((monster) => (
                      <div key={monster.name} className="flex items-center gap-3 p-3 bg-valthera-800/50 rounded-lg border border-valthera-700">
                        <span className="text-2xl">{monster.emoji}</span>
                        <div>
                          <p className="font-medium text-valthera-100">{monster.name}</p>
                          <p className="text-sm text-valthera-400">Niveau {monster.level}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* NPCs */}
              {activeZone.npcs.length > 0 && (
                <div className="bg-valthera-900/50 rounded-xl border border-valthera-800 p-6">
                  <h3 className="text-lg font-medieval text-valthera-100 mb-4">👥 PNJ</h3>
                  <div className="space-y-3">
                    {activeZone.npcs.map((npc) => (
                      <div key={npc.id} className="flex items-center gap-3 p-3 bg-valthera-800/30 rounded-lg">
                        <span className="text-2xl">{npc.emoji}</span>
                        <div>
                          <p className="font-medium text-valthera-100">{npc.name}</p>
                          <p className="text-sm text-valthera-400">{npc.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resources */}
              {activeZone.resources.length > 0 && (
                <div className="bg-valthera-900/50 rounded-xl border border-valthera-800 p-6">
                  <h3 className="text-lg font-medieval text-valthera-100 mb-4">🎒 Ressources</h3>
                  <div className="space-y-2">
                    {activeZone.resources.map((resource) => (
                      <div key={resource.name} className="flex items-center justify-between p-2 bg-valthera-800/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span>{resource.emoji}</span>
                          <span className="text-valthera-200">{resource.name}</span>
                        </div>
                        <span className={`text-sm capitalize ${rarityColors[resource.rarity]}`}>
                          {resource.rarity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-valthera-900/50 rounded-xl border border-valthera-800 p-12 text-center">
            <span className="text-6xl mb-4 block">🗺️</span>
            <h3 className="text-xl font-medieval text-valthera-100 mb-2">Sélectionnez une Zone</h3>
            <p className="text-valthera-400">
              Cliquez sur une zone ci-dessus pour voir ses détails, monstres et ressources.
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="mt-12 bg-valthera-900/50 rounded-xl border border-valthera-800 p-6">
          <h3 className="text-lg font-medieval text-valthera-100 mb-4">📖 Légende des Types de Zones</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-valthera-800/30 rounded-lg">
              <span className="text-2xl">🏰</span>
              <div>
                <p className="font-medium text-valthera-100">Ville</p>
                <p className="text-sm text-valthera-400">Zone sécurisée avec commerces</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-forest-900/30 rounded-lg">
              <span className="text-2xl">🌲</span>
              <div>
                <p className="font-medium text-valthera-100">Territoire Sauvage</p>
                <p className="text-sm text-valthera-400">Exploration et ressources</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blood-900/30 rounded-lg">
              <span className="text-2xl">⛏️</span>
              <div>
                <p className="font-medium text-valthera-100">Donjon</p>
                <p className="text-sm text-valthera-400">Défis et boss</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
