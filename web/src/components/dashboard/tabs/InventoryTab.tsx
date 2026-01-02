'use client';

import { Package, Sword, Shield, FlaskConical, Scroll, Gem } from 'lucide-react';
import type { ICharacter } from '@/lib/models';

interface InventoryTabProps {
  character: ICharacter;
}

// Mapping des types d'items vers icônes et couleurs
const itemTypeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  weapon: { icon: Sword, color: 'text-red-400', bg: 'bg-red-500/20' },
  armor: { icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  potion: { icon: FlaskConical, color: 'text-green-400', bg: 'bg-green-500/20' },
  scroll: { icon: Scroll, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  material: { icon: Gem, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  default: { icon: Package, color: 'text-gray-400', bg: 'bg-gray-500/20' },
};

const rarityConfig: Record<string, { border: string; text: string; glow: string }> = {
  common: { border: 'border-gray-500', text: 'text-gray-400', glow: '' },
  uncommon: { border: 'border-green-500', text: 'text-green-400', glow: '' },
  rare: { border: 'border-blue-500', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
  epic: { border: 'border-purple-500', text: 'text-purple-400', glow: 'shadow-purple-500/20' },
  legendary: { border: 'border-amber-500', text: 'text-amber-400', glow: 'shadow-amber-500/30 shadow-lg' },
};

export function InventoryTab({ character }: InventoryTabProps) {
  // Pour l'instant on affiche les items bruts
  // TODO: Charger les détails des items depuis la base de données
  const inventory = character.inventory || [];

  const equippedItems = inventory.filter((item) => item.equipped);
  const bagItems = inventory.filter((item) => !item.equipped);

  return (
    <div className="space-y-6">
      {/* Stats inventaire */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-white">{inventory.length}</div>
          <div className="text-sm text-gray-400">Objets total</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{equippedItems.length}</div>
          <div className="text-sm text-gray-400">Équipés</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{character.gold.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Or</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">50</div>
          <div className="text-sm text-gray-400">Capacité max</div>
        </div>
      </div>

      {/* Inventaire */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-white font-medieval mb-6">
          Sac à dos ({bagItems.length} objets)
        </h2>

        {bagItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {bagItems.map((item, index) => {
              const config = itemTypeConfig.default;
              const Icon = config.icon;
              const rarity = rarityConfig.common;

              return (
                <div
                  key={`${item.itemId}-${index}`}
                  className={`relative bg-gray-800/50 rounded-xl p-4 border ${rarity.border} ${rarity.glow} hover:scale-105 transition-transform cursor-pointer group`}
                >
                  {/* Quantité */}
                  {item.quantity > 1 && (
                    <div className="absolute -top-2 -right-2 bg-valthera-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      x{item.quantity}
                    </div>
                  )}

                  {/* Icône */}
                  <div className={`w-12 h-12 ${config.bg} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                    <Icon className={`w-6 h-6 ${config.color}`} />
                  </div>

                  {/* Nom */}
                  <div className={`text-sm text-center ${rarity.text} truncate`}>
                    {item.itemId.replace(/_/g, ' ')}
                  </div>

                  {/* Tooltip au survol */}
                  <div className="tooltip bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 group-hover:opacity-100 group-hover:visible">
                    <div className="font-medium text-white">{item.itemId.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Quantité: {item.quantity}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">Votre inventaire est vide</p>
            <p className="text-gray-600 text-sm mt-2">
              Explorez et combattez pour collecter des objets !
            </p>
          </div>
        )}
      </div>

      {/* Légende raretés */}
      <div className="card p-4">
        <div className="text-sm text-gray-400 mb-3">Raretés</div>
        <div className="flex flex-wrap gap-4">
          {Object.entries(rarityConfig).map(([rarity, config]) => (
            <div key={rarity} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${config.border} border-2`} />
              <span className={`text-sm ${config.text} capitalize`}>{rarity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
