'use client';

import { 
  Skull, 
  Swords, 
  Coins, 
  Heart, 
  Target, 
  Shield, 
  Map, 
  Hammer,
  ShoppingCart,
  ScrollText
} from 'lucide-react';
interface StatsTabProps {
  character: any;
}

export function StatsTab({ character }: StatsTabProps) {
  const stats = character.statistics || {};

  const statGroups = [
    {
      title: 'Combat',
      stats: [
        { key: 'monstersKilled', label: 'Monstres tués', icon: Skull, color: 'text-blood-400' },
        { key: 'damageDealt', label: 'Dégâts infligés', icon: Swords, color: 'text-valthera-500' },
        { key: 'damageTaken', label: 'Dégâts subis', icon: Target, color: 'text-valthera-400' },
        { key: 'healingDone', label: 'Soins prodigués', icon: Heart, color: 'text-forest-400' },
        { key: 'deaths', label: 'Morts', icon: Shield, color: 'text-steel-400' },
      ],
    },
    {
      title: 'Économie',
      stats: [
        { key: 'goldEarned', label: 'Or gagné', icon: Coins, color: 'text-valthera-400' },
        { key: 'goldSpent', label: 'Or dépensé', icon: ShoppingCart, color: 'text-valthera-500' },
        { key: 'itemsCrafted', label: 'Objets craftés', icon: Hammer, color: 'text-rarity-rare' },
        { key: 'itemsSold', label: 'Objets vendus', icon: ShoppingCart, color: 'text-rarity-epic' },
      ],
    },
    {
      title: 'Exploration',
      stats: [
        { key: 'zonesExplored', label: 'Zones explorées', icon: Map, color: 'text-forest-400' },
        { key: 'questsCompleted', label: 'Quêtes complétées', icon: ScrollText, color: 'text-rarity-epic' },
      ],
    },
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  // Calculer le K/D ratio
  const kdRatio = stats.deaths > 0 
    ? (stats.monstersKilled / stats.deaths).toFixed(2)
    : stats.monstersKilled > 0 ? '∞' : '0';

  // Calculer le profit net
  const netProfit = (stats.goldEarned || 0) - (stats.goldSpent || 0);

  return (
    <div className="space-y-6">
      {/* Stats highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-blood-400 font-medieval">
            {formatNumber(stats.monstersKilled || 0)}
          </div>
          <div className="text-sm text-valthera-200/60 font-body">Monstres tués</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-rarity-epic font-medieval">
            {formatNumber(stats.questsCompleted || 0)}
          </div>
          <div className="text-sm text-valthera-200/60 font-body">Quêtes</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-valthera-400 font-medieval">
            {kdRatio}
          </div>
          <div className="text-sm text-valthera-200/60 font-body">K/D Ratio</div>
        </div>
        <div className="card p-4 text-center">
          <div className={`text-3xl font-bold font-medieval ${netProfit >= 0 ? 'text-forest-400' : 'text-blood-400'}`}>
            {netProfit >= 0 ? '+' : ''}{formatNumber(netProfit)}
          </div>
          <div className="text-sm text-valthera-200/60 font-body">Profit net</div>
        </div>
      </div>

      {/* Groupes de stats détaillées */}
      {statGroups.map((group) => (
        <div key={group.title} className="card p-6">
          <h2 className="text-xl font-bold text-valthera-100 font-medieval mb-6">{group.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.stats.map(({ key, label, icon: Icon, color }) => (
              <div
                key={key}
                className="flex items-center gap-4 bg-valthera-800/50 rounded-xl p-4 hover:bg-valthera-800 transition-colors border border-valthera-700/50"
              >
                <div className={`w-12 h-12 rounded-xl bg-valthera-700/50 flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-valthera-100">
                    {formatNumber((stats as any)[key] || 0)}
                  </div>
                  <div className="text-sm text-valthera-200/60 font-body">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Graphique de progression (placeholder) */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-valthera-100 font-medieval mb-6">Progression</h2>
        <div className="bg-valthera-800/50 rounded-xl p-8 text-center border border-valthera-700/50">
          <p className="text-valthera-200/50 font-body">
            📊 Graphiques de progression à venir dans une prochaine mise à jour
          </p>
        </div>
      </div>
    </div>
  );
}
