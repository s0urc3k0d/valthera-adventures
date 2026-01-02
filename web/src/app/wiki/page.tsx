import Link from 'next/link';
import { 
  Terminal, 
  Users, 
  Sword, 
  Map, 
  Package, 
  Skull,
  ScrollText,
  Sparkles
} from 'lucide-react';

export const metadata = {
  title: 'Wiki',
  description: 'Documentation complète de Valthera Adventures',
};

const categories = [
  {
    href: '/wiki/commands',
    title: 'Commandes',
    description: 'Toutes les commandes Discord disponibles',
    icon: Terminal,
    color: 'from-valthera-600 to-valthera-800',
    count: '20+',
  },
  {
    href: '/wiki/classes',
    title: 'Classes',
    description: 'Les 12 classes jouables et leurs capacités',
    icon: Sword,
    color: 'from-blood-600 to-blood-500',
    count: '12',
  },
  {
    href: '/wiki/races',
    title: 'Races',
    description: 'Les races disponibles et leurs bonus',
    icon: Users,
    color: 'from-forest-700 to-forest-600',
    count: '9',
  },
  {
    href: '/wiki/zones',
    title: 'Zones',
    description: 'Les régions de Valthera à explorer',
    icon: Map,
    color: 'from-forest-600 to-forest-500',
    count: '8+',
  },
  {
    href: '/wiki/items',
    title: 'Objets',
    description: 'Armes, armures, potions et plus',
    icon: Package,
    color: 'from-valthera-500 to-valthera-400',
    count: '60+',
  },
  {
    href: '/wiki/monsters',
    title: 'Monstres',
    description: 'Les créatures qui peuplent Valthera',
    icon: Skull,
    color: 'from-rarity-epic to-purple-600',
    count: '15+',
  },
  {
    href: '/wiki/quests',
    title: 'Quêtes',
    description: 'Les aventures qui vous attendent',
    icon: ScrollText,
    color: 'from-valthera-700 to-valthera-600',
    count: '12+',
  },
  {
    href: '/wiki/spells',
    title: 'Sorts & Capacités',
    description: 'Magie et techniques spéciales',
    icon: Sparkles,
    color: 'from-rarity-legendary to-valthera-400',
    count: '40+',
  },
];

export default function WikiPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-valthera-100 font-medieval mb-4">
          Wiki Valthera
        </h1>
        <p className="text-valthera-200/70 max-w-2xl mx-auto font-body">
          Tout ce que vous devez savoir sur le monde de Valthera Adventures. 
          Classes, races, zones, monstres et plus encore.
        </p>
      </div>

      {/* Quick Search */}
      <div className="max-w-xl mx-auto mb-12">
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher dans le wiki..."
            className="input pr-20"
          />
          <kbd className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-valthera-800 rounded text-xs text-valthera-300 border border-valthera-700">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((category) => (
          <Link
            key={category.href}
            href={category.href}
            className="card-hover overflow-hidden group"
          >
            {/* Header with gradient */}
            <div className={`bg-gradient-to-r ${category.color} p-6 relative`}>
              <div className="absolute inset-0 bg-black/20" />
              <category.icon className="w-10 h-10 text-white relative z-10 group-hover:scale-110 transition-transform" />
              <div className="absolute top-4 right-4 px-2 py-1 bg-white/20 rounded-full text-xs text-white font-medium">
                {category.count}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-valthera-100 mb-2 group-hover:text-valthera-300 transition-colors font-medieval">
                {category.title}
              </h3>
              <p className="text-sm text-valthera-200/60 font-body">
                {category.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Links */}
      <div className="mt-16 card p-8">
        <h2 className="text-xl font-bold text-valthera-100 font-medieval mb-6">
          Guides Populaires
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/wiki/guides/getting-started"
            className="flex items-center gap-3 p-4 bg-valthera-800/50 rounded-xl hover:bg-valthera-800 transition-colors border border-valthera-700/50"
          >
            <span className="text-2xl">🚀</span>
            <div>
              <div className="text-valthera-100 font-medium font-medieval">Guide de démarrage</div>
              <div className="text-sm text-valthera-200/60 font-body">Vos premiers pas</div>
            </div>
          </Link>
          <Link
            href="/wiki/guides/combat"
            className="flex items-center gap-3 p-4 bg-valthera-800/50 rounded-xl hover:bg-valthera-800 transition-colors border border-valthera-700/50"
          >
            <span className="text-2xl">⚔️</span>
            <div>
              <div className="text-valthera-100 font-medium font-medieval">Guide du combat</div>
              <div className="text-sm text-valthera-200/60 font-body">Maîtrisez les combats</div>
            </div>
          </Link>
          <Link
            href="/wiki/guides/economy"
            className="flex items-center gap-3 p-4 bg-valthera-800/50 rounded-xl hover:bg-valthera-800 transition-colors border border-valthera-700/50"
          >
            <span className="text-2xl">💰</span>
            <div>
              <div className="text-valthera-100 font-medium font-medieval">Guide économique</div>
              <div className="text-sm text-valthera-200/60 font-body">Devenez riche</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
