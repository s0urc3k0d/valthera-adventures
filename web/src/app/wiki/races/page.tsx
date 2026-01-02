'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Feature {
  name: string;
  description: string;
}

interface Subrace {
  id: string;
  name: string;
  emoji: string;
  description: string;
  bonusAbilities: Record<string, number>;
  features: Feature[];
}

interface Race {
  id: string;
  name: string;
  emoji: string;
  description: string;
  traits: string[];
  abilities: Record<string, number>;
  features: Feature[];
  languages: string[];
  speed: number;
  size: string;
  subraces: Subrace[];
}

const races: Race[] = [
  {
    id: 'human',
    name: 'Humain',
    emoji: '👤',
    description: 'Les humains sont l\'une des races les plus répandues de Valthera. Leur adaptabilité et leur ambition les ont menés aux quatre coins du royaume.',
    traits: ['Adaptabilité exceptionnelle', 'Détermination sans faille', 'Diversité culturelle'],
    abilities: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    features: [
      { name: 'Polyvalent', description: 'Les humains gagnent +1 à toutes les caractéristiques.' },
      { name: 'Compétence supplémentaire', description: 'Les humains gagnent une compétence supplémentaire de leur choix.' },
      { name: 'Langue supplémentaire', description: 'Les humains parlent le commun et une langue supplémentaire.' }
    ],
    languages: ['Commun', 'Une langue au choix'],
    speed: 30,
    size: 'Moyenne',
    subraces: []
  },
  {
    id: 'elf',
    name: 'Elfe',
    emoji: '🧝',
    description: 'Les elfes sont un peuple ancien doté d\'une grâce surnaturelle et d\'une longue vie. Ils excellent dans la magie et le tir à l\'arc.',
    traits: ['Vision dans le noir', 'Sens aiguisés', 'Ascendance féerique'],
    abilities: { str: 0, dex: 2, con: 0, int: 0, wis: 0, cha: 0 },
    features: [
      { name: 'Vision dans le noir', description: 'Vous pouvez voir dans la lumière faible comme si c\'était une lumière vive.' },
      { name: 'Ascendance féerique', description: 'Vous avez l\'avantage contre les effets de charme et êtes immunisé à l\'endormissement magique.' },
      { name: 'Transe', description: 'Les elfes n\'ont pas besoin de dormir, ils méditent 4 heures par jour.' }
    ],
    languages: ['Commun', 'Elfique'],
    speed: 30,
    size: 'Moyenne',
    subraces: [
      {
        id: 'high_elf',
        name: 'Haut-Elfe',
        emoji: '✨',
        description: 'Les Hauts-Elfes sont les gardiens des traditions magiques anciennes.',
        bonusAbilities: { int: 1 },
        features: [
          { name: 'Entraînement aux armes elfiques', description: 'Maîtrise de l\'épée longue, épée courte, arc court et arc long.' },
          { name: 'Tour de magie', description: 'Vous connaissez un tour de magie de la liste du magicien.' },
          { name: 'Langue supplémentaire', description: 'Vous parlez une langue additionnelle.' }
        ]
      },
      {
        id: 'wood_elf',
        name: 'Elfe des Bois',
        emoji: '🌲',
        description: 'Les Elfes des Bois vivent en harmonie avec la nature et sont des chasseurs redoutables.',
        bonusAbilities: { wis: 1 },
        features: [
          { name: 'Entraînement aux armes elfiques', description: 'Maîtrise de l\'épée longue, épée courte, arc court et arc long.' },
          { name: 'Pied léger', description: 'Votre vitesse de base est de 35 pieds.' },
          { name: 'Cachette naturelle', description: 'Vous pouvez vous cacher même si vous êtes légèrement obscurci par la végétation.' }
        ]
      },
      {
        id: 'drow',
        name: 'Drow',
        emoji: '🌙',
        description: 'Les Drows vivent dans les profondeurs et sont redoutés pour leur magie sombre.',
        bonusAbilities: { cha: 1 },
        features: [
          { name: 'Vision dans le noir supérieure', description: 'Votre vision dans le noir s\'étend à 120 pieds.' },
          { name: 'Magie drow', description: 'Vous connaissez le sort Lumières dansantes.' },
          { name: 'Sensibilité au soleil', description: 'Vous avez un désavantage à la lumière vive.' }
        ]
      }
    ]
  },
  {
    id: 'dwarf',
    name: 'Nain',
    emoji: '⛏️',
    description: 'Les nains sont un peuple robuste et fier, maîtres forgerons et guerriers redoutables. Ils vivent dans les montagnes de Valthera.',
    traits: ['Résistance au poison', 'Vision dans le noir', 'Savoir de la pierre'],
    abilities: { str: 0, dex: 0, con: 2, int: 0, wis: 0, cha: 0 },
    features: [
      { name: 'Vision dans le noir', description: 'Vous pouvez voir dans la lumière faible comme si c\'était une lumière vive.' },
      { name: 'Résistance naine', description: 'Vous avez l\'avantage contre le poison et la résistance aux dégâts de poison.' },
      { name: 'Entraînement aux armes naines', description: 'Maîtrise de la hache d\'armes, hachette, marteau léger et marteau de guerre.' }
    ],
    languages: ['Commun', 'Nain'],
    speed: 25,
    size: 'Moyenne',
    subraces: [
      {
        id: 'hill_dwarf',
        name: 'Nain des Collines',
        emoji: '🏔️',
        description: 'Les Nains des Collines sont robustes et sages, souvent prêtres ou guérisseurs.',
        bonusAbilities: { wis: 1 },
        features: [
          { name: 'Ténacité naine', description: 'Vos points de vie maximum augmentent de 1 à chaque niveau.' }
        ]
      },
      {
        id: 'mountain_dwarf',
        name: 'Nain des Montagnes',
        emoji: '⛰️',
        description: 'Les Nains des Montagnes sont des guerriers et forgerons légendaires.',
        bonusAbilities: { str: 2 },
        features: [
          { name: 'Entraînement aux armures naines', description: 'Vous maîtrisez les armures légères et intermédiaires.' }
        ]
      }
    ]
  },
  {
    id: 'halfling',
    name: 'Halfelin',
    emoji: '🍀',
    description: 'Les halfelins sont un peuple joyeux et chanceux. Petits mais agiles, ils excellent à se sortir des situations délicates.',
    traits: ['Chanceux', 'Brave', 'Agilité halfeline'],
    abilities: { str: 0, dex: 2, con: 0, int: 0, wis: 0, cha: 0 },
    features: [
      { name: 'Chanceux', description: 'Quand vous obtenez un 1 sur un d20, vous pouvez relancer le dé.' },
      { name: 'Brave', description: 'Vous avez l\'avantage contre la terreur.' },
      { name: 'Agilité halfeline', description: 'Vous pouvez vous déplacer à travers l\'espace de créatures plus grandes.' }
    ],
    languages: ['Commun', 'Halfelin'],
    speed: 25,
    size: 'Petite',
    subraces: [
      {
        id: 'lightfoot',
        name: 'Pied-léger',
        emoji: '👣',
        description: 'Les Pied-légers sont discrets et charmeurs, parfaits pour l\'aventure.',
        bonusAbilities: { cha: 1 },
        features: [
          { name: 'Discrétion naturelle', description: 'Vous pouvez vous cacher derrière une créature d\'une taille supérieure.' }
        ]
      },
      {
        id: 'stout',
        name: 'Robuste',
        emoji: '💪',
        description: 'Les Halfelins Robustes ont un sang de nain et résistent au poison.',
        bonusAbilities: { con: 1 },
        features: [
          { name: 'Résistance des robustes', description: 'Vous avez l\'avantage contre le poison et la résistance aux dégâts de poison.' }
        ]
      }
    ]
  }
];

const abilityNames: Record<string, string> = {
  str: 'Force',
  dex: 'Dextérité',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Sagesse',
  cha: 'Charisme'
};

export default function RacesPage() {
  const [selectedRace, setSelectedRace] = useState<string | null>(null);
  const [selectedSubrace, setSelectedSubrace] = useState<string | null>(null);

  const activeRace = races.find(r => r.id === selectedRace);
  const activeSubrace = activeRace?.subraces.find(s => s.id === selectedSubrace);

  const formatAbilities = (abilities: Record<string, number>, bonusAbilities?: Record<string, number>) => {
    const allAbilities = { ...abilities };
    if (bonusAbilities) {
      Object.entries(bonusAbilities).forEach(([key, value]) => {
        allAbilities[key] = (allAbilities[key] || 0) + value;
      });
    }
    
    return Object.entries(allAbilities)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => `${abilityNames[key]} +${value}`)
      .join(', ');
  };

  return (
    <div className="min-h-screen bg-valthera-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-valthera-900 to-valthera-950 border-b border-valthera-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 text-sm text-valthera-400 mb-4">
            <Link href="/wiki" className="hover:text-valthera-200 transition-colors">Wiki</Link>
            <span>/</span>
            <span className="text-valthera-200">Races</span>
          </div>
          <h1 className="text-4xl font-medieval text-valthera-100 mb-4">
            🧬 Les Races de Valthera
          </h1>
          <p className="text-valthera-300 max-w-3xl">
            Choisissez votre race pour définir votre héritage et vos capacités innées. 
            Chaque race possède des traits uniques qui influenceront votre style de jeu.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Race List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-medieval text-valthera-100 mb-4">Choisir une Race</h2>
            {races.map((race) => (
              <button
                key={race.id}
                onClick={() => {
                  setSelectedRace(race.id);
                  setSelectedSubrace(null);
                }}
                className={`w-full p-4 rounded-lg border text-left transition-all ${
                  selectedRace === race.id
                    ? 'bg-valthera-800 border-valthera-500 shadow-lg shadow-valthera-900/50'
                    : 'bg-valthera-900/50 border-valthera-800 hover:bg-valthera-800/50 hover:border-valthera-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{race.emoji}</span>
                  <div>
                    <h3 className="font-medieval text-valthera-100">{race.name}</h3>
                    <p className="text-sm text-valthera-400">
                      {formatAbilities(race.abilities) || 'Bonus variés'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Race Details */}
          <div className="lg:col-span-2">
            {activeRace ? (
              <div className="space-y-6">
                {/* Race Header */}
                <div className="bg-valthera-900/50 rounded-xl border border-valthera-800 p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <span className="text-6xl">{activeRace.emoji}</span>
                    <div>
                      <h2 className="text-3xl font-medieval text-valthera-100 mb-2">{activeRace.name}</h2>
                      <p className="text-valthera-300">{activeRace.description}</p>
                    </div>
                  </div>

                  {/* Base Stats */}
                  <div className="grid sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-valthera-800/50 rounded-lg p-3">
                      <p className="text-xs text-valthera-400 uppercase tracking-wider mb-1">Taille</p>
                      <p className="text-valthera-100 font-medium">{activeRace.size}</p>
                    </div>
                    <div className="bg-valthera-800/50 rounded-lg p-3">
                      <p className="text-xs text-valthera-400 uppercase tracking-wider mb-1">Vitesse</p>
                      <p className="text-valthera-100 font-medium">{activeRace.speed} pieds</p>
                    </div>
                    <div className="bg-valthera-800/50 rounded-lg p-3">
                      <p className="text-xs text-valthera-400 uppercase tracking-wider mb-1">Langues</p>
                      <p className="text-valthera-100 font-medium text-sm">{activeRace.languages.join(', ')}</p>
                    </div>
                  </div>

                  {/* Ability Bonuses */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medieval text-valthera-200 mb-3">Bonus de Caractéristiques</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(activeRace.abilities).map(([key, value]) => (
                        value > 0 && (
                          <span key={key} className="px-3 py-1 bg-valthera-700 text-valthera-100 rounded-full text-sm">
                            {abilityNames[key]} +{value}
                          </span>
                        )
                      ))}
                      {Object.values(activeRace.abilities).every(v => v === 1) && (
                        <span className="text-valthera-400 text-sm">(+1 à toutes les caractéristiques)</span>
                      )}
                    </div>
                  </div>

                  {/* Traits */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medieval text-valthera-200 mb-3">Traits Raciaux</h3>
                    <div className="flex flex-wrap gap-2">
                      {activeRace.traits.map((trait) => (
                        <span key={trait} className="px-3 py-1 bg-forest-900/50 text-forest-300 rounded-full text-sm border border-forest-800">
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h3 className="text-lg font-medieval text-valthera-200 mb-3">Capacités</h3>
                    <div className="space-y-3">
                      {activeRace.features.map((feature) => (
                        <div key={feature.name} className="bg-valthera-800/30 rounded-lg p-4 border border-valthera-800">
                          <h4 className="font-semibold text-valthera-100 mb-1">{feature.name}</h4>
                          <p className="text-valthera-400 text-sm">{feature.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Subraces */}
                {activeRace.subraces.length > 0 && (
                  <div className="bg-valthera-900/50 rounded-xl border border-valthera-800 p-6">
                    <h3 className="text-xl font-medieval text-valthera-100 mb-4">Sous-races</h3>
                    
                    {/* Subrace Tabs */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {activeRace.subraces.map((subrace) => (
                        <button
                          key={subrace.id}
                          onClick={() => setSelectedSubrace(subrace.id === selectedSubrace ? null : subrace.id)}
                          className={`px-4 py-2 rounded-lg border transition-all ${
                            selectedSubrace === subrace.id
                              ? 'bg-valthera-700 border-valthera-500 text-valthera-100'
                              : 'bg-valthera-800/50 border-valthera-700 text-valthera-300 hover:bg-valthera-800 hover:text-valthera-100'
                          }`}
                        >
                          <span className="mr-2">{subrace.emoji}</span>
                          {subrace.name}
                        </button>
                      ))}
                    </div>

                    {/* Subrace Details */}
                    {activeSubrace && (
                      <div className="bg-valthera-800/30 rounded-lg p-5 border border-valthera-700">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-4xl">{activeSubrace.emoji}</span>
                          <div>
                            <h4 className="text-xl font-medieval text-valthera-100">{activeSubrace.name}</h4>
                            <p className="text-sm text-valthera-400">
                              Bonus: {formatAbilities({}, activeSubrace.bonusAbilities)}
                            </p>
                          </div>
                        </div>
                        <p className="text-valthera-300 mb-4">{activeSubrace.description}</p>
                        
                        <h5 className="font-semibold text-valthera-200 mb-2">Capacités supplémentaires</h5>
                        <div className="space-y-2">
                          {activeSubrace.features.map((feature) => (
                            <div key={feature.name} className="bg-valthera-900/50 rounded p-3">
                              <span className="font-medium text-valthera-100">{feature.name}:</span>{' '}
                              <span className="text-valthera-400 text-sm">{feature.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-valthera-900/50 rounded-xl border border-valthera-800 p-12 text-center">
                <span className="text-6xl mb-4 block">🧬</span>
                <h3 className="text-xl font-medieval text-valthera-100 mb-2">Sélectionnez une Race</h3>
                <p className="text-valthera-400">
                  Cliquez sur une race dans la liste pour voir ses détails et sous-races.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
