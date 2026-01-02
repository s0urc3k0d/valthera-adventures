'use client';

import { motion } from 'framer-motion';
import { Users, Swords, Map, ScrollText } from 'lucide-react';
import useSWR from 'swr';

interface Stats {
  totalPlayers: number;
  totalCombats: number;
  totalQuests: number;
  totalZonesExplored: number;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Stats par défaut (remplacées par les vraies stats si l'API est disponible)
const defaultStats = {
  totalPlayers: 0,
  totalCombats: 0,
  totalQuests: 0,
  totalZonesExplored: 0,
};

const statItems = [
  { key: 'totalPlayers', label: 'Aventuriers', icon: Users, color: 'text-blue-400' },
  { key: 'totalCombats', label: 'Combats', icon: Swords, color: 'text-red-400' },
  { key: 'totalQuests', label: 'Quêtes complétées', icon: ScrollText, color: 'text-purple-400' },
  { key: 'totalZonesExplored', label: 'Explorations', icon: Map, color: 'text-green-400' },
];

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function StatsSection() {
  const { data: stats } = useSWR<Stats>('/api/stats', fetcher, {
    fallbackData: defaultStats,
    refreshInterval: 60000, // Refresh every minute
  });

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-transparent via-valthera-950/20 to-transparent">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="section-title">Statistiques Live</h2>
          <p className="section-subtitle">Le monde de Valthera en temps réel</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {statItems.map((item, index) => {
            const value = stats?.[item.key as keyof Stats] ?? 0;
            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
                className="stat-card group"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gray-800/50 ${item.color} mb-4 group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="stat-value">{formatNumber(value)}</div>
                <div className="stat-label">{item.label}</div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
