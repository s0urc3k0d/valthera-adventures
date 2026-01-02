'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Skull, Users, ShoppingBag, Compass } from 'lucide-react';

// Données des zones (simplifié depuis zones.json)
const zones = [
  {
    id: 'valthera_city',
    name: 'Cité de Valthera',
    type: 'city',
    level: '1-5',
    description: 'La capitale du royaume, un hub pour les aventuriers',
    x: 50,
    y: 45,
    color: 'bg-amber-500',
    features: ['Boutiques', 'Taverne', 'Guilde', 'Quêtes'],
  },
  {
    id: 'darkwood_forest',
    name: 'Forêt de Darkwood',
    type: 'forest',
    level: '1-3',
    description: 'Une forêt mystérieuse aux arbres centenaires',
    x: 30,
    y: 30,
    color: 'bg-green-600',
    features: ['Gobelins', 'Loups', 'Herbes'],
  },
  {
    id: 'crystal_caves',
    name: 'Grottes de Cristal',
    type: 'dungeon',
    level: '3-6',
    description: 'Des cavernes remplies de cristaux magiques',
    x: 70,
    y: 25,
    color: 'bg-cyan-500',
    features: ['Minerais', 'Slimes', 'Boss'],
  },
  {
    id: 'shadow_swamp',
    name: 'Marais des Ombres',
    type: 'swamp',
    level: '4-7',
    description: 'Un marécage dangereux infesté de créatures',
    x: 20,
    y: 60,
    color: 'bg-purple-600',
    features: ['Zombies', 'Sorcières', 'Poisons'],
  },
  {
    id: 'dragon_peak',
    name: 'Pic du Dragon',
    type: 'mountain',
    level: '8-10',
    description: 'Le sommet où réside le dragon ancestral',
    x: 80,
    y: 15,
    color: 'bg-red-600',
    features: ['Dragons', 'Trésors', 'Boss'],
  },
  {
    id: 'sunken_ruins',
    name: 'Ruines Englouties',
    type: 'ruins',
    level: '5-8',
    description: 'Les vestiges d\'une ancienne civilisation',
    x: 65,
    y: 70,
    color: 'bg-blue-600',
    features: ['Squelettes', 'Artefacts', 'Pièges'],
  },
  {
    id: 'merchant_road',
    name: 'Route des Marchands',
    type: 'road',
    level: '2-4',
    description: 'La route commerciale principale du royaume',
    x: 45,
    y: 55,
    color: 'bg-yellow-600',
    features: ['Bandits', 'Caravanes', 'Commerce'],
  },
  {
    id: 'frozen_tundra',
    name: 'Toundra Gelée',
    type: 'tundra',
    level: '6-9',
    description: 'Les terres glacées du nord',
    x: 35,
    y: 10,
    color: 'bg-sky-400',
    features: ['Yetis', 'Loups', 'Blizzards'],
  },
];

const typeIcons: Record<string, any> = {
  city: ShoppingBag,
  forest: Compass,
  dungeon: Skull,
  swamp: Skull,
  mountain: MapPin,
  ruins: Skull,
  road: Users,
  tundra: Compass,
};

export default function MapPage() {
  const [selectedZone, setSelectedZone] = useState<typeof zones[0] | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white font-medieval mb-4">
          Carte de Valthera
        </h1>
        <p className="text-gray-400">
          Explorez les différentes régions du royaume. Cliquez sur une zone pour plus de détails.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="card p-4 aspect-[4/3] relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800">
              {/* Grid overlay */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                  backgroundSize: '50px 50px',
                }}
              />
            </div>

            {/* Zone markers */}
            {zones.map((zone) => {
              const Icon = typeIcons[zone.type] || MapPin;
              const isSelected = selectedZone?.id === zone.id;
              const isHovered = hoveredZone === zone.id;

              return (
                <motion.button
                  key={zone.id}
                  onClick={() => setSelectedZone(zone)}
                  onMouseEnter={() => setHoveredZone(zone.id)}
                  onMouseLeave={() => setHoveredZone(null)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Marker */}
                  <div
                    className={`w-10 h-10 ${zone.color} rounded-full flex items-center justify-center shadow-lg transition-all ${
                      isSelected ? 'ring-4 ring-white/50 scale-125' : ''
                    } ${isHovered ? 'ring-2 ring-white/30' : ''}`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Label */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900/90 rounded text-xs text-white whitespace-nowrap transition-opacity ${
                      isHovered || isSelected ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {zone.name}
                    <span className="ml-2 text-gray-400">Nv.{zone.level}</span>
                  </div>

                  {/* Pulse effect for selected */}
                  {isSelected && (
                    <div className={`absolute inset-0 ${zone.color} rounded-full animate-ping opacity-50`} />
                  )}
                </motion.button>
              );
            })}

            {/* Connections (simplified) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(139, 92, 246, 0.3)" />
                  <stop offset="100%" stopColor="rgba(139, 92, 246, 0.1)" />
                </linearGradient>
              </defs>
              {/* Route from city to forest */}
              <line x1="50%" y1="45%" x2="30%" y2="30%" stroke="url(#pathGradient)" strokeWidth="2" strokeDasharray="5,5" />
              {/* Route from city to merchant road */}
              <line x1="50%" y1="45%" x2="45%" y2="55%" stroke="url(#pathGradient)" strokeWidth="2" strokeDasharray="5,5" />
              {/* Route from city to caves */}
              <line x1="50%" y1="45%" x2="70%" y2="25%" stroke="url(#pathGradient)" strokeWidth="2" strokeDasharray="5,5" />
            </svg>
          </div>

          {/* Legend */}
          <div className="card p-4 mt-4">
            <div className="text-sm text-gray-400 mb-3">Légende</div>
            <div className="flex flex-wrap gap-4">
              {[
                { color: 'bg-amber-500', label: 'Ville' },
                { color: 'bg-green-600', label: 'Forêt' },
                { color: 'bg-cyan-500', label: 'Donjon' },
                { color: 'bg-purple-600', label: 'Marais' },
                { color: 'bg-red-600', label: 'Montagne' },
                { color: 'bg-blue-600', label: 'Ruines' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`w-4 h-4 ${item.color} rounded-full`} />
                  <span className="text-sm text-gray-300">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Zone Details Panel */}
        <div>
          {selectedZone ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card overflow-hidden"
            >
              {/* Header */}
              <div className={`${selectedZone.color} p-6`}>
                <h2 className="text-2xl font-bold text-white font-medieval mb-2">
                  {selectedZone.name}
                </h2>
                <div className="flex items-center gap-4 text-white/80">
                  <span className="flex items-center gap-1">
                    <Skull className="w-4 h-4" />
                    Niveau {selectedZone.level}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <p className="text-gray-300">{selectedZone.description}</p>

                {/* Features */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Points d'intérêt</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedZone.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-800">
                  <p className="text-sm text-gray-500 mb-3">
                    Pour voyager ici, utilisez la commande :
                  </p>
                  <code className="block px-4 py-2 bg-gray-800 rounded-lg text-valthera-400">
                    /travel {selectedZone.id}
                  </code>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="card p-8 text-center">
              <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Sélectionnez une zone
              </h3>
              <p className="text-gray-500 text-sm">
                Cliquez sur un marqueur sur la carte pour voir les détails de la zone.
              </p>
            </div>
          )}

          {/* Quick Travel */}
          <div className="card p-6 mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Zones par niveau</h3>
            <div className="space-y-2">
              {zones
                .sort((a, b) => parseInt(a.level) - parseInt(b.level))
                .map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => setSelectedZone(zone)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                      selectedZone?.id === zone.id
                        ? 'bg-valthera-600/20 border border-valthera-500/50'
                        : 'bg-gray-800/50 hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-white">{zone.name}</span>
                    <span className="text-sm text-gray-400">Nv.{zone.level}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
