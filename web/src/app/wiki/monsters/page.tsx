'use client';

import Link from 'next/link';
import { useState } from 'react';

const monsters = [
  {
    id: 'goblin',
    name: 'Gobelin',
    emoji: '👺',
    level: 1,
    type: 'humanoïde',
    description: 'Petite créature sournoise vivant en groupe. Les gobelins sont faibles individuellement mais dangereux en nombre.',
    stats: { hp: 7, ac: 15, damage: '1d6+2' },
    xp: 50,
    abilities: ['Embuscade', 'Fuite'],
    weaknesses: ['Lumière vive'],
    loot: [
      { item: 'Or', chance: '100%', amount: '1-5' },
      { item: 'Dague rouillée', chance: '30%' },
      { item: 'Oreille de gobelin', chance: '50%' }
    ],
    locations: ['Bois Murmurants', 'Mines d\'Argent']
  },
  {
    id: 'wolf',
    name: 'Loup',
    emoji: '🐺',
    level: 1,
    type: 'bête',
    description: 'Prédateur rapide et agile. Les loups chassent en meute et sont particulièrement dangereux la nuit.',
    stats: { hp: 11, ac: 13, damage: '2d4+2' },
    xp: 50,
    abilities: ['Tactique de meute', 'Morsure'],
    weaknesses: ['Feu'],
    loot: [
      { item: 'Or', chance: '50%', amount: '1-3' },
      { item: 'Peau de loup', chance: '60%' },
      { item: 'Croc de loup', chance: '40%' }
    ],
    locations: ['Bois Murmurants', 'Clairière Lunaire']
  },
  {
    id: 'skeleton',
    name: 'Squelette',
    emoji: '💀',
    level: 2,
    type: 'mort-vivant',
    description: 'Ossements animés par une magie noire. Les squelettes sont des gardiens communs des lieux maudits.',
    stats: { hp: 13, ac: 13, damage: '1d6+2' },
    xp: 50,
    abilities: ['Vulnérabilité au contondant', 'Résistance au perforant'],
    weaknesses: ['Dégâts contondants', 'Magie sacrée'],
    loot: [
      { item: 'Or', chance: '75%', amount: '2-8' },
      { item: 'Os poli', chance: '50%' },
      { item: 'Épée rouillée', chance: '20%' }
    ],
    locations: ['Mines d\'Argent']
  },
  {
    id: 'giant_spider',
    name: 'Araignée Géante',
    emoji: '🕷️',
    level: 2,
    type: 'bête',
    description: 'Arachnide massive capable de tisser des toiles résistantes. Son venin paralyse ses proies.',
    stats: { hp: 26, ac: 14, damage: '1d8+3' },
    xp: 200,
    abilities: ['Toile', 'Venin (paralysie)', 'Escalade'],
    weaknesses: ['Feu'],
    loot: [
      { item: 'Or', chance: '60%', amount: '3-10' },
      { item: 'Soie d\'araignée', chance: '70%' },
      { item: 'Venin d\'araignée', chance: '30%' },
      { item: 'Œil d\'araignée', chance: '20%' }
    ],
    locations: ['Bois Murmurants', 'Mines d\'Argent']
  },
  {
    id: 'orc',
    name: 'Orc',
    emoji: '👹',
    level: 3,
    type: 'humanoïde',
    description: 'Guerrier brutal et agressif. Les orcs sont des combattants féroces qui ne reculent devant rien.',
    stats: { hp: 15, ac: 13, damage: '1d12+3' },
    xp: 100,
    abilities: ['Agression', 'Rage'],
    weaknesses: ['Tactique'],
    loot: [
      { item: 'Or', chance: '100%', amount: '5-15' },
      { item: 'Grande hache', chance: '25%' },
      { item: 'Défense d\'orc', chance: '40%' },
      { item: 'Armure de cuir', chance: '15%' }
    ],
    locations: ['Mines d\'Argent']
  },
  {
    id: 'spectral_wolf',
    name: 'Loup Spectral',
    emoji: '👻',
    level: 3,
    type: 'mort-vivant',
    description: 'Esprit d\'un loup tué dans la Clairière Lunaire. Il traque les intrus avec une détermination surnaturelle.',
    stats: { hp: 22, ac: 12, damage: '2d6' },
    xp: 150,
    abilities: ['Incorporéité', 'Hurlement terrifiant', 'Vision nocturne'],
    weaknesses: ['Magie sacrée', 'Argent'],
    loot: [
      { item: 'Essence spectrale', chance: '40%' },
      { item: 'Croc fantomatique', chance: '30%' }
    ],
    locations: ['Clairière Lunaire']
  },
  {
    id: 'mine_king',
    name: 'Roi des Mines',
    emoji: '👑',
    level: 7,
    type: 'boss',
    description: 'L\'ancien roi nain des mines, transformé en spectre vengeur. Il garde jalousement les trésors de son royaume déchu.',
    stats: { hp: 120, ac: 18, damage: '2d10+5' },
    xp: 1000,
    abilities: ['Frappe dévastatrice', 'Invocation de squelettes', 'Aura de terreur', 'Phase 2 enragée'],
    weaknesses: ['Armes bénies', 'Lumière'],
    loot: [
      { item: 'Or', chance: '100%', amount: '50-100' },
      { item: 'Couronne du Roi Déchu', chance: '100%' },
      { item: 'Hache Royale', chance: '50%' },
      { item: 'Gemme de l\'âme', chance: '25%' }
    ],
    locations: ['Mines d\'Argent (Niveau 3)']
  }
];

const typeColors: Record<string, { bg: string; text: string }> = {
  'humanoïde': { bg: 'bg-valthera-800', text: 'text-valthera-200' },
  'bête': { bg: 'bg-forest-900', text: 'text-forest-200' },
  'mort-vivant': { bg: 'bg-steel-800', text: 'text-steel-200' },
  'boss': { bg: 'bg-legendary/20', text: 'text-legendary' }
};

const difficultyColor = (level: number) => {
  if (level <= 1) return 'text-uncommon';
  if (level <= 3) return 'text-rare';
  if (level <= 5) return 'text-epic';
  return 'text-legendary';
};

export default function MonstersPage() {
  const [selectedMonster, setSelectedMonster] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const activeMonster = monsters.find(m => m.id === selectedMonster);
  const filteredMonsters = filterType === 'all' 
    ? monsters 
    : monsters.filter(m => m.type === filterType);

  const types = ['all', ...Array.from(new Set(monsters.map(m => m.type)))];

  return (
    <div className="min-h-screen bg-valthera-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-valthera-900 to-valthera-950 border-b border-valthera-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 text-sm text-valthera-400 mb-4">
            <Link href="/wiki" className="hover:text-valthera-200 transition-colors">Wiki</Link>
            <span>/</span>
            <span className="text-valthera-200">Monstres</span>
          </div>
          <h1 className="text-4xl font-medieval text-valthera-100 mb-4">
            ⚔️ Bestiaire de Valthera
          </h1>
          <p className="text-valthera-300 max-w-3xl">
            Découvrez les créatures qui peuplent Valthera. Connaître vos ennemis est la clé de la victoire !
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {types.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg border transition-all capitalize ${
                filterType === type
                  ? 'bg-valthera-700 border-valthera-500 text-valthera-100'
                  : 'bg-valthera-900/50 border-valthera-800 text-valthera-400 hover:bg-valthera-800/50'
              }`}
            >
              {type === 'all' ? 'Tous' : type}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Monster List */}
          <div className="lg:col-span-1 space-y-3">
            {filteredMonsters.map((monster) => (
              <button
                key={monster.id}
                onClick={() => setSelectedMonster(monster.id)}
                className={`w-full p-4 rounded-lg border text-left transition-all ${
                  selectedMonster === monster.id
                    ? 'bg-valthera-800 border-valthera-500 shadow-lg'
                    : 'bg-valthera-900/50 border-valthera-800 hover:bg-valthera-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{monster.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medieval text-valthera-100">{monster.name}</h3>
                      <span className={`text-sm font-bold ${difficultyColor(monster.level)}`}>
                        Niv. {monster.level}
                      </span>
                    </div>
                    <p className="text-sm text-valthera-400 capitalize">{monster.type}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Monster Details */}
          <div className="lg:col-span-2">
            {activeMonster ? (
              <div className="bg-valthera-900/50 rounded-xl border border-valthera-800 overflow-hidden">
                {/* Header */}
                <div className={`p-6 ${activeMonster.type === 'boss' ? 'bg-gradient-to-r from-legendary/20 to-transparent' : 'bg-valthera-800/30'}`}>
                  <div className="flex items-start gap-4">
                    <span className="text-6xl">{activeMonster.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-medieval text-valthera-100">{activeMonster.name}</h2>
                        {activeMonster.type === 'boss' && (
                          <span className="px-3 py-1 bg-legendary/20 text-legendary border border-legendary/50 rounded-full text-sm font-bold">
                            BOSS
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={`px-2 py-1 rounded ${typeColors[activeMonster.type]?.bg || 'bg-valthera-800'} ${typeColors[activeMonster.type]?.text || 'text-valthera-200'} capitalize`}>
                          {activeMonster.type}
                        </span>
                        <span className={`font-bold ${difficultyColor(activeMonster.level)}`}>
                          Niveau {activeMonster.level}
                        </span>
                        <span className="text-valthera-400">
                          {activeMonster.xp} XP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <p className="text-valthera-300">{activeMonster.description}</p>

                  {/* Stats */}
                  <div>
                    <h3 className="text-lg font-medieval text-valthera-200 mb-3">📊 Statistiques</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blood-900/30 rounded-lg p-4 text-center border border-blood-800">
                        <p className="text-xs text-valthera-400 uppercase tracking-wider mb-1">Points de Vie</p>
                        <p className="text-2xl font-bold text-blood-400">{activeMonster.stats.hp}</p>
                      </div>
                      <div className="bg-steel-900/30 rounded-lg p-4 text-center border border-steel-800">
                        <p className="text-xs text-valthera-400 uppercase tracking-wider mb-1">Classe d'Armure</p>
                        <p className="text-2xl font-bold text-steel-400">{activeMonster.stats.ac}</p>
                      </div>
                      <div className="bg-valthera-800/30 rounded-lg p-4 text-center border border-valthera-700">
                        <p className="text-xs text-valthera-400 uppercase tracking-wider mb-1">Dégâts</p>
                        <p className="text-2xl font-bold text-valthera-300">{activeMonster.stats.damage}</p>
                      </div>
                    </div>
                  </div>

                  {/* Abilities & Weaknesses */}
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medieval text-valthera-200 mb-3">⚡ Capacités</h3>
                      <div className="space-y-2">
                        {activeMonster.abilities.map((ability) => (
                          <div key={ability} className="flex items-center gap-2 p-2 bg-valthera-800/30 rounded-lg">
                            <span className="w-2 h-2 bg-valthera-500 rounded-full"></span>
                            <span className="text-valthera-200">{ability}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medieval text-valthera-200 mb-3">💔 Faiblesses</h3>
                      <div className="space-y-2">
                        {activeMonster.weaknesses.map((weakness) => (
                          <div key={weakness} className="flex items-center gap-2 p-2 bg-blood-900/20 rounded-lg border border-blood-900/50">
                            <span className="w-2 h-2 bg-blood-500 rounded-full"></span>
                            <span className="text-blood-300">{weakness}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Loot */}
                  <div>
                    <h3 className="text-lg font-medieval text-valthera-200 mb-3">🎁 Butin</h3>
                    <div className="bg-valthera-800/30 rounded-lg border border-valthera-700 overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-valthera-700">
                            <th className="text-left p-3 text-valthera-400 text-sm">Objet</th>
                            <th className="text-right p-3 text-valthera-400 text-sm">Chance</th>
                            <th className="text-right p-3 text-valthera-400 text-sm">Quantité</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeMonster.loot.map((item) => (
                            <tr key={item.item} className="border-b border-valthera-800 last:border-0">
                              <td className="p-3 text-valthera-200">{item.item}</td>
                              <td className="p-3 text-right text-valthera-400">{item.chance}</td>
                              <td className="p-3 text-right text-valthera-400">{item.amount || '1'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Locations */}
                  <div>
                    <h3 className="text-lg font-medieval text-valthera-200 mb-3">📍 Localisations</h3>
                    <div className="flex flex-wrap gap-2">
                      {activeMonster.locations.map((location) => (
                        <span key={location} className="px-3 py-1 bg-forest-900/30 text-forest-300 rounded-full text-sm border border-forest-800">
                          {location}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-valthera-900/50 rounded-xl border border-valthera-800 p-12 text-center">
                <span className="text-6xl mb-4 block">⚔️</span>
                <h3 className="text-xl font-medieval text-valthera-100 mb-2">Sélectionnez un Monstre</h3>
                <p className="text-valthera-400">
                  Cliquez sur un monstre dans la liste pour voir ses statistiques et son butin.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
