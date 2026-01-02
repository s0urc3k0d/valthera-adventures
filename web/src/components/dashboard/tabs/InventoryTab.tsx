'use client';

import { Package, Sword, Shield, FlaskConical, Scroll, Gem } from 'lucide-react';

interface InventoryTabProps {
  character: any;
}

// Mapping des types d'items vers icônes et couleurs
const itemTypeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  weapon: { icon: Sword, color: 'text-blood-400', bg: 'bg-blood-500/20' },
  armor: { icon: Shield, color: 'text-steel-400', bg: 'bg-steel-500/20' },
  potion: { icon: FlaskConical, color: 'text-forest-400', bg: 'bg-forest-500/20' },
  scroll: { icon: Scroll, color: 'text-rarity-epic', bg: 'bg-rarity-epic/20' },
  material: { icon: Gem, color: 'text-valthera-400', bg: 'bg-valthera-400/20' },
  default: { icon: Package, color: 'text-valthera-200', bg: 'bg-valthera-700/20' },
};

const rarityConfig: Record<string, { border: string; text: string; glow: string }> = {
  common: { border: 'border-rarity-common', text: 'text-rarity-common', glow: '' },
  uncommon: { border: 'border-rarity-uncommon', text: 'text-rarity-uncommon', glow: '' },
  rare: { border: 'border-rarity-rare', text: 'text-rarity-rare', glow: 'shadow-rarity-rare/20' },
  epic: { border: 'border-rarity-epic', text: 'text-rarity-epic', glow: 'shadow-rarity-epic/20' },
  legendary: { border: 'border-rarity-legendary', text: 'text-rarity-legendary', glow: 'shadow-rarity-legendary/30 shadow-lg animate-pulse-gold' },
};

export function InventoryTab({ character }: InventoryTabProps) {
  // Pour l'instant on affiche les items bruts
  // TODO: Charger les détails des items depuis la base de données
  const inventory = character.inventory || [];

  const equippedItems = inventory.filter((item: any) => item.equipped);
  const bagItems = inventory.filter((item: any) => !item.equipped);

  return (
    <div className="space-y-6">
      {/* Stats inventaire */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-valthera-100">{inventory.length}</div>
          <div className="text-sm text-valthera-200/60 font-body">Objets total</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-forest-400">{equippedItems.length}</div>
          <div className="text-sm text-valthera-200/60 font-body">Équipés</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-valthera-400">{(character.goldTotal || 0).toLocaleString()}</div>
          <div className="text-sm text-valthera-200/60 font-body">Or</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-rarity-epic">50</div>
          <div className="text-sm text-valthera-200/60 font-body">Capacité max</div>
        </div>
      </div>

      {/* Inventaire */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-valthera-100 font-medieval mb-6">
          Sac à dos ({bagItems.length} objets)
        </h2>

        {bagItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {bagItems.map((item: any, index: number) => {
              const config = itemTypeConfig.default;
              const Icon = config.icon;
              const rarity = rarityConfig.common;

              return (
                <div
                  key={`${item.itemId}-${index}`}
                  className={`relative bg-valthera-800/50 rounded-xl p-4 border ${rarity.border} ${rarity.glow} hover:scale-105 transition-transform cursor-pointer group`}
                >
                  {/* Quantité */}
                  {item.quantity > 1 && (
                    <div className="absolute -top-2 -right-2 bg-valthera-600 text-valthera-100 text-xs font-bold px-2 py-0.5 rounded-full">
                      x{item.quantity}
                    </div>
                  )}

                  {/* Icône */}
                  <div className={`w-12 h-12 ${config.bg} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                    <Icon className={`w-6 h-6 ${config.color}`} />
                  </div>

                  {/* Nom */}
                  <div className={`text-sm text-center ${rarity.text} truncate font-body`}>
                    {item.itemId.replace(/_/g, ' ')}
                  </div>

                  {/* Tooltip au survol */}
                  <div className="tooltip bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 group-hover:opacity-100 group-hover:visible">
                    <div className="font-medium text-valthera-100">{item.itemId.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-valthera-200/60 mt-1 font-body">
                      Quantité: {item.quantity}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-valthera-600 mx-auto mb-4" />
            <p className="text-valthera-200/50 font-body">Votre inventaire est vide</p>
            <p className="text-valthera-200/40 text-sm mt-2 font-body">
              Explorez et combattez pour collecter des objets !
            </p>
          </div>
        )}
      </div>

      {/* Légende raretés */}
      <div className="card p-4">
        <div className="text-sm text-valthera-200/60 mb-3 font-body">Raretés</div>
        <div className="flex flex-wrap gap-4">
          {Object.entries(rarityConfig).map(([rarity, config]) => (
            <div key={rarity} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${config.border} border-2`} />
              <span className={`text-sm ${config.text} capitalize font-body`}>{rarity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
