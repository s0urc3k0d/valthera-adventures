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
import type { ICharacter } from '@/lib/models';

interface StatsTabProps {
  character: ICharacter;
}

export function StatsTab({ character }: StatsTabProps) {
  const stats = character.statistics || {};

  const statGroups = [
    {
      title: 'Combat',
      stats: [
        { key: 'monstersKilled', label: 'Monstres tués', icon: Skull, color: 'text-red-400' },
        { key: 'damageDealt', label: 'Dégâts infligés', icon: Swords, color: 'text-orange-400' },
        { key: 'damageTaken', label: 'Dégâts subis', icon: Target, color: 'text-yellow-400' },
        { key: 'healingDone', label: 'Soins prodigués', icon: Heart, color: 'text-green-400' },
        { key: 'deaths', label: 'Morts', icon: Shield, color: 'text-gray-400' },
      ],
    },
    {
      title: 'Économie',
      stats: [
        { key: 'goldEarned', label: 'Or gagné', icon: Coins, color: 'text-amber-400' },
        { key: 'goldSpent', label: 'Or dépensé', icon: ShoppingCart, color: 'text-amber-500' },
        { key: 'itemsCrafted', label: 'Objets craftés', icon: Hammer, color: 'text-blue-400' },
        { key: 'itemsSold', label: 'Objets vendus', icon: ShoppingCart, color: 'text-purple-400' },
      ],
    },
    {
      title: 'Exploration',
      stats: [
        { key: 'zonesExplored', label: 'Zones explorées', icon: Map, color: 'text-green-400' },
        { key: 'questsCompleted', label: 'Quêtes complétées', icon: ScrollText, color: 'text-purple-400' },
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
          <div className="text-3xl font-bold text-red-400 font-medieval">
            {formatNumber(stats.monstersKilled || 0)}
          </div>
          <div className="text-sm text-gray-400">Monstres tués</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-purple-400 font-medieval">
            {formatNumber(stats.questsCompleted || 0)}
          </div>
          <div className="text-sm text-gray-400">Quêtes</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-amber-400 font-medieval">
            {kdRatio}
          </div>
          <div className="text-sm text-gray-400">K/D Ratio</div>
        </div>
        <div className="card p-4 text-center">
          <div className={`text-3xl font-bold font-medieval ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {netProfit >= 0 ? '+' : ''}{formatNumber(netProfit)}
          </div>
          <div className="text-sm text-gray-400">Profit net</div>
        </div>
      </div>

      {/* Groupes de stats détaillées */}
      {statGroups.map((group) => (
        <div key={group.title} className="card p-6">
          <h2 className="text-xl font-bold text-white font-medieval mb-6">{group.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.stats.map(({ key, label, icon: Icon, color }) => (
              <div
                key={key}
                className="flex items-center gap-4 bg-gray-800/50 rounded-xl p-4 hover:bg-gray-800 transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl bg-gray-700/50 flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {formatNumber((stats as any)[key] || 0)}
                  </div>
                  <div className="text-sm text-gray-400">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Graphique de progression (placeholder) */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-white font-medieval mb-6">Progression</h2>
        <div className="bg-gray-800/50 rounded-xl p-8 text-center">
          <p className="text-gray-500">
            📊 Graphiques de progression à venir dans une prochaine mise à jour
          </p>
        </div>
      </div>
    </div>
  );
}
