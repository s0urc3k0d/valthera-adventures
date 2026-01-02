'use client';

import Link from 'next/link';
import { useState } from 'react';

type Item = {
  id: string;
  name: string;
  type: string;
  subtype: string;
  rarity: string;
  description: string;
  price: number;
  emoji: string;
  stats?: Record<string, unknown>;
};

const items: { weapons: Item[]; armor: Item[]; consumables: Item[]; materials: Item[] } = {
  weapons: [
    { id: 'dagger', name: 'Dague', type: 'weapon', subtype: 'melee', rarity: 'common', description: 'Une petite lame effilée, parfaite pour les coups rapides et discrets.', price: 2, emoji: '🗡️', stats: { damage: '1d4', damageType: 'piercing', properties: ['finesse', 'light', 'thrown'] } },
    { id: 'shortsword', name: 'Épée courte', type: 'weapon', subtype: 'melee', rarity: 'common', description: 'Une lame légère et maniable, idéale pour le combat rapproché.', price: 10, emoji: '⚔️', stats: { damage: '1d6', damageType: 'piercing', properties: ['finesse', 'light'] } },
    { id: 'longsword', name: 'Épée longue', type: 'weapon', subtype: 'melee', rarity: 'common', description: 'Une épée classique à une main, symbole des guerriers de Valthera.', price: 15, emoji: '⚔️', stats: { damage: '1d8', damageType: 'slashing', properties: ['versatile'] } },
    { id: 'greatsword', name: 'Épée à deux mains', type: 'weapon', subtype: 'melee', rarity: 'common', description: 'Une lame massive nécessitant deux mains, dévastatrice au combat.', price: 50, emoji: '🗡️', stats: { damage: '2d6', damageType: 'slashing', properties: ['heavy', 'two-handed'] } },
    { id: 'battleaxe', name: 'Hache de bataille', type: 'weapon', subtype: 'melee', rarity: 'common', description: 'Une hache robuste, favorite des nains et des barbares.', price: 10, emoji: '🪓', stats: { damage: '1d8', damageType: 'slashing', properties: ['versatile'] } },
    { id: 'greataxe', name: 'Grande hache', type: 'weapon', subtype: 'melee', rarity: 'common', description: 'Une hache énorme capable de trancher un homme en deux.', price: 30, emoji: '🪓', stats: { damage: '1d12', damageType: 'slashing', properties: ['heavy', 'two-handed'] } },
    { id: 'mace', name: 'Masse d\'armes', type: 'weapon', subtype: 'melee', rarity: 'common', description: 'Une arme contondante efficace contre les armures.', price: 5, emoji: '🔨', stats: { damage: '1d6', damageType: 'bludgeoning' } },
    { id: 'warhammer', name: 'Marteau de guerre', type: 'weapon', subtype: 'melee', rarity: 'common', description: 'Un marteau lourd capable de briser os et armures.', price: 15, emoji: '🔨', stats: { damage: '1d8', damageType: 'bludgeoning', properties: ['versatile'] } },
    { id: 'rapier', name: 'Rapière', type: 'weapon', subtype: 'melee', rarity: 'common', description: 'Une fine lame d\'estoc, arme de prédilection des duellistes.', price: 25, emoji: '🤺', stats: { damage: '1d8', damageType: 'piercing', properties: ['finesse'] } },
    { id: 'shortbow', name: 'Arc court', type: 'weapon', subtype: 'ranged', rarity: 'common', description: 'Un arc léger et maniable pour le combat à distance.', price: 25, emoji: '🏹', stats: { damage: '1d6', damageType: 'piercing', range: '80/320' } },
    { id: 'longbow', name: 'Arc long', type: 'weapon', subtype: 'ranged', rarity: 'common', description: 'Un grand arc puissant pour les tireurs expérimentés.', price: 50, emoji: '🏹', stats: { damage: '1d8', damageType: 'piercing', range: '150/600' } },
    { id: 'quarterstaff', name: 'Bâton', type: 'weapon', subtype: 'melee', rarity: 'common', description: 'Un bâton de bois simple mais polyvalent.', price: 2, emoji: '🪄', stats: { damage: '1d6', damageType: 'bludgeoning', properties: ['versatile'] } },
    { id: 'flame_tongue', name: 'Langue de Feu', type: 'weapon', subtype: 'melee', rarity: 'rare', description: 'Une épée magique dont la lame s\'enflamme sur commande.', price: 500, emoji: '🔥', stats: { damage: '1d8+2d6 feu', damageType: 'slashing+fire' } },
    { id: 'frostbrand', name: 'Lame de Givre', type: 'weapon', subtype: 'melee', rarity: 'epic', description: 'Une arme légendaire imprégnée du froid éternel.', price: 1000, emoji: '❄️', stats: { damage: '1d8+2d6 froid', damageType: 'slashing+cold' } },
    { id: 'vorpal_blade', name: 'Lame Vorpale', type: 'weapon', subtype: 'melee', rarity: 'legendary', description: 'La légendaire lame capable de décapiter ses victimes.', price: 5000, emoji: '⚡', stats: { damage: '2d6+3', damageType: 'slashing', special: 'Décapitation sur critique' } },
  ],
  armor: [
    { id: 'leather_armor', name: 'Armure de cuir', type: 'armor', subtype: 'light', rarity: 'common', description: 'Cuir souple offrant mobilité et protection légère.', price: 10, emoji: '🥋', stats: { armorClass: 11 } },
    { id: 'studded_leather', name: 'Cuir clouté', type: 'armor', subtype: 'light', rarity: 'common', description: 'Armure de cuir renforcée de rivets métalliques.', price: 45, emoji: '🥋', stats: { armorClass: 12 } },
    { id: 'chain_shirt', name: 'Chemise de mailles', type: 'armor', subtype: 'medium', rarity: 'common', description: 'Une cotte de mailles légère offrant une bonne protection.', price: 50, emoji: '⛓️', stats: { armorClass: 13 } },
    { id: 'scale_mail', name: 'Armure d\'écailles', type: 'armor', subtype: 'medium', rarity: 'common', description: 'Écailles métalliques cousues sur du cuir.', price: 50, emoji: '🛡️', stats: { armorClass: 14 } },
    { id: 'breastplate', name: 'Cuirasse', type: 'armor', subtype: 'medium', rarity: 'uncommon', description: 'Une solide plaque de métal protégeant le torse.', price: 400, emoji: '🛡️', stats: { armorClass: 14 } },
    { id: 'half_plate', name: 'Demi-plate', type: 'armor', subtype: 'medium', rarity: 'uncommon', description: 'Protection partielle de plaques métalliques.', price: 750, emoji: '🛡️', stats: { armorClass: 15 } },
    { id: 'chain_mail', name: 'Cotte de mailles', type: 'armor', subtype: 'heavy', rarity: 'common', description: 'Une armure complète de mailles métalliques entrelacées.', price: 75, emoji: '⛓️', stats: { armorClass: 16 } },
    { id: 'splint_armor', name: 'Armure à attelles', type: 'armor', subtype: 'heavy', rarity: 'uncommon', description: 'Bandes de métal vertical rivetées sur cuir.', price: 200, emoji: '🛡️', stats: { armorClass: 17 } },
    { id: 'plate_armor', name: 'Armure de plates', type: 'armor', subtype: 'heavy', rarity: 'rare', description: 'L\'armure ultime, protection complète du corps.', price: 1500, emoji: '🛡️', stats: { armorClass: 18 } },
    { id: 'mithral_armor', name: 'Armure en Mithral', type: 'armor', subtype: 'medium', rarity: 'epic', description: 'Armure légère forgée dans le métal elfique.', price: 3000, emoji: '✨', stats: { armorClass: 16, special: 'Pas de désavantage en Discrétion' } },
    { id: 'adamantine_armor', name: 'Armure en Adamantine', type: 'armor', subtype: 'heavy', rarity: 'legendary', description: 'Armure quasi-indestructible en adamantine.', price: 5000, emoji: '💎', stats: { armorClass: 18, special: 'Immunité aux coups critiques' } },
  ],
  consumables: [
    { id: 'health_potion', name: 'Potion de soins', type: 'consumable', subtype: 'potion', rarity: 'common', description: 'Restaure 2d4+2 points de vie.', price: 50, emoji: '🧪', stats: { healing: '2d4+2' } },
    { id: 'greater_health_potion', name: 'Potion de soins supérieure', type: 'consumable', subtype: 'potion', rarity: 'uncommon', description: 'Restaure 4d4+4 points de vie.', price: 150, emoji: '🧪', stats: { healing: '4d4+4' } },
    { id: 'superior_health_potion', name: 'Potion de soins excellente', type: 'consumable', subtype: 'potion', rarity: 'rare', description: 'Restaure 8d4+8 points de vie.', price: 500, emoji: '🧪', stats: { healing: '8d4+8' } },
    { id: 'mana_potion', name: 'Potion de mana', type: 'consumable', subtype: 'potion', rarity: 'common', description: 'Restaure 1d4+1 points de mana.', price: 75, emoji: '💙', stats: { mana: '1d4+1' } },
    { id: 'antidote', name: 'Antidote', type: 'consumable', subtype: 'potion', rarity: 'common', description: 'Guérit les empoisonnements.', price: 50, emoji: '💚', stats: { effect: 'Soigne poison' } },
    { id: 'potion_of_strength', name: 'Potion de force', type: 'consumable', subtype: 'potion', rarity: 'uncommon', description: 'Augmente la Force de 2 pendant 1 heure.', price: 200, emoji: '💪', stats: { buff: 'FOR +2', duration: '1h' } },
    { id: 'potion_of_invisibility', name: 'Potion d\'invisibilité', type: 'consumable', subtype: 'potion', rarity: 'rare', description: 'Vous rend invisible pendant 1 heure.', price: 500, emoji: '👻', stats: { effect: 'Invisibilité', duration: '1h' } },
    { id: 'ration', name: 'Rations', type: 'consumable', subtype: 'food', rarity: 'common', description: 'Nourriture séchée pour une journée.', price: 5, emoji: '🍖', stats: { satiety: 1 } },
    { id: 'elixir_of_life', name: 'Élixir de vie', type: 'consumable', subtype: 'potion', rarity: 'legendary', description: 'Ressuscite un allié tombé au combat.', price: 5000, emoji: '⭐', stats: { effect: 'Résurrection' } },
  ],
  materials: [
    { id: 'iron_ore', name: 'Minerai de fer', type: 'material', subtype: 'ore', rarity: 'common', description: 'Minerai brut utilisé pour forger des équipements.', price: 5, emoji: '🪨' },
    { id: 'silver_ore', name: 'Minerai d\'argent', type: 'material', subtype: 'ore', rarity: 'uncommon', description: 'Métal précieux et efficace contre les lycanthropes.', price: 25, emoji: '🪨' },
    { id: 'gold_ore', name: 'Minerai d\'or', type: 'material', subtype: 'ore', rarity: 'rare', description: 'Métal précieux utilisé en joaillerie.', price: 100, emoji: '🪨' },
    { id: 'mithral_ore', name: 'Minerai de mithral', type: 'material', subtype: 'ore', rarity: 'epic', description: 'Métal elfique léger et résistant.', price: 500, emoji: '💎' },
    { id: 'wolf_pelt', name: 'Peau de loup', type: 'material', subtype: 'leather', rarity: 'common', description: 'Fourrure utilisée pour l\'artisanat.', price: 10, emoji: '🐺' },
    { id: 'spider_silk', name: 'Soie d\'araignée', type: 'material', subtype: 'cloth', rarity: 'uncommon', description: 'Fil résistant pour armures légères.', price: 50, emoji: '🕸️' },
    { id: 'moonflower', name: 'Fleur de lune', type: 'material', subtype: 'herb', rarity: 'uncommon', description: 'Ingrédient alchimique rare.', price: 30, emoji: '🌸' },
    { id: 'dragon_scale', name: 'Écaille de dragon', type: 'material', subtype: 'scale', rarity: 'legendary', description: 'Matériau ultime pour les armures.', price: 2500, emoji: '🐉' },
    { id: 'fairy_dust', name: 'Poussière de fée', type: 'material', subtype: 'magical', rarity: 'rare', description: 'Composant magique scintillant.', price: 200, emoji: '✨' },
  ]
};

const categories = [
  { id: 'weapons', name: 'Armes', emoji: '⚔️' },
  { id: 'armor', name: 'Armures', emoji: '🛡️' },
  { id: 'consumables', name: 'Consommables', emoji: '🧪' },
  { id: 'materials', name: 'Matériaux', emoji: '🎒' },
];

const rarityColors: Record<string, { bg: string; text: string; border: string }> = {
  common: { bg: 'bg-steel-800/50', text: 'text-steel-300', border: 'border-steel-700' },
  uncommon: { bg: 'bg-uncommon/10', text: 'text-uncommon', border: 'border-uncommon/50' },
  rare: { bg: 'bg-rare/10', text: 'text-rare', border: 'border-rare/50' },
  epic: { bg: 'bg-epic/10', text: 'text-epic', border: 'border-epic/50' },
  legendary: { bg: 'bg-legendary/10', text: 'text-legendary', border: 'border-legendary/50' },
};

const rarityNames: Record<string, string> = {
  common: 'Commun',
  uncommon: 'Peu commun',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
};

export default function ItemsPage() {
  const [activeCategory, setActiveCategory] = useState('weapons');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [filterRarity, setFilterRarity] = useState<string>('all');

  const currentItems = items[activeCategory as keyof typeof items] || [];
  const filteredItems = filterRarity === 'all'
    ? currentItems
    : currentItems.filter(item => item.rarity === filterRarity);

  return (
    <div className="min-h-screen bg-valthera-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-valthera-900 to-valthera-950 border-b border-valthera-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 text-sm text-valthera-400 mb-4">
            <Link href="/wiki" className="hover:text-valthera-200 transition-colors">Wiki</Link>
            <span>/</span>
            <span className="text-valthera-200">Objets</span>
          </div>
          <h1 className="text-4xl font-medieval text-valthera-100 mb-4">
            🎒 Catalogue des Objets
          </h1>
          <p className="text-valthera-300 max-w-3xl">
            Parcourez tous les objets disponibles dans Valthera : armes, armures, potions et matériaux d'artisanat.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setSelectedItem(null);
              }}
              className={`px-5 py-3 rounded-lg border transition-all ${
                activeCategory === cat.id
                  ? 'bg-valthera-700 border-valthera-500 text-valthera-100'
                  : 'bg-valthera-900/50 border-valthera-800 text-valthera-400 hover:bg-valthera-800/50'
              }`}
            >
              <span className="mr-2">{cat.emoji}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Rarity Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <span className="text-valthera-400 text-sm self-center mr-2">Rareté:</span>
          {['all', 'common', 'uncommon', 'rare', 'epic', 'legendary'].map((rarity) => (
            <button
              key={rarity}
              onClick={() => setFilterRarity(rarity)}
              className={`px-3 py-1 rounded-full text-sm transition-all ${
                filterRarity === rarity
                  ? rarity === 'all'
                    ? 'bg-valthera-700 text-valthera-100'
                    : `${rarityColors[rarity].bg} ${rarityColors[rarity].text} border ${rarityColors[rarity].border}`
                  : 'bg-valthera-900/50 text-valthera-500 hover:bg-valthera-800/50'
              }`}
            >
              {rarity === 'all' ? 'Tous' : rarityNames[rarity]}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Item List */}
          <div className="lg:col-span-1 space-y-2 max-h-[70vh] overflow-y-auto pr-2">
            {filteredItems.map((item) => {
              const colors = rarityColors[item.rarity];
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    selectedItem?.id === item.id
                      ? `${colors.bg} ${colors.border} ring-1 ring-offset-1 ring-offset-valthera-950 ring-valthera-500`
                      : 'bg-valthera-900/50 border-valthera-800 hover:bg-valthera-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`font-medium truncate ${colors.text}`}>{item.name}</h3>
                        <span className="text-valthera-400 text-sm whitespace-nowrap">{item.price} 💰</span>
                      </div>
                      <p className="text-xs text-valthera-500 capitalize">{item.subtype}</p>
                    </div>
                  </div>
                </button>
              );
            })}
            {filteredItems.length === 0 && (
              <p className="text-center text-valthera-500 py-8">Aucun objet trouvé</p>
            )}
          </div>

          {/* Item Details */}
          <div className="lg:col-span-2">
            {selectedItem ? (
              <div className={`bg-valthera-900/50 rounded-xl border overflow-hidden ${rarityColors[selectedItem.rarity].border}`}>
                {/* Header */}
                <div className={`p-6 ${rarityColors[selectedItem.rarity].bg}`}>
                  <div className="flex items-start gap-4">
                    <span className="text-6xl">{selectedItem.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className={`text-3xl font-medieval ${rarityColors[selectedItem.rarity].text}`}>
                          {selectedItem.name}
                        </h2>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={`px-3 py-1 rounded-full ${rarityColors[selectedItem.rarity].bg} ${rarityColors[selectedItem.rarity].text} border ${rarityColors[selectedItem.rarity].border}`}>
                          {rarityNames[selectedItem.rarity]}
                        </span>
                        <span className="text-valthera-400 capitalize">{selectedItem.type} • {selectedItem.subtype}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-legendary">{selectedItem.price}</p>
                      <p className="text-valthera-400 text-sm">pièces d'or</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <p className="text-valthera-300 text-lg">{selectedItem.description}</p>

                  {/* Stats */}
                  {selectedItem.stats && Object.keys(selectedItem.stats).length > 0 && (
                    <div>
                      <h3 className="text-lg font-medieval text-valthera-200 mb-3">📊 Statistiques</h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {Object.entries(selectedItem.stats).map(([key, value]) => (
                          <div key={key} className="bg-valthera-800/30 rounded-lg p-3 border border-valthera-700">
                            <p className="text-xs text-valthera-400 uppercase tracking-wider mb-1">
                              {key === 'damage' ? 'Dégâts' :
                               key === 'damageType' ? 'Type de dégâts' :
                               key === 'armorClass' ? 'Classe d\'armure' :
                               key === 'healing' ? 'Soins' :
                               key === 'mana' ? 'Mana' :
                               key === 'properties' ? 'Propriétés' :
                               key === 'range' ? 'Portée' :
                               key === 'effect' ? 'Effet' :
                               key === 'duration' ? 'Durée' :
                               key === 'buff' ? 'Bonus' :
                               key === 'special' ? 'Spécial' :
                               key}
                            </p>
                            <p className="text-valthera-100 font-medium">
                              {Array.isArray(value) ? value.join(', ') : String(value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-valthera-900/50 rounded-xl border border-valthera-800 p-12 text-center">
                <span className="text-6xl mb-4 block">🎒</span>
                <h3 className="text-xl font-medieval text-valthera-100 mb-2">Sélectionnez un Objet</h3>
                <p className="text-valthera-400">
                  Cliquez sur un objet dans la liste pour voir ses détails et statistiques.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
