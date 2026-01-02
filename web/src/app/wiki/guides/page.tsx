import Link from 'next/link';

const guides = [
  {
    id: 'getting-started',
    title: 'Premiers Pas',
    description: 'Apprenez les bases de Valthera et créez votre premier personnage.',
    emoji: '🎮',
    difficulty: 'Débutant',
    readTime: '5 min'
  },
  {
    id: 'combat',
    title: 'Guide du Combat',
    description: 'Maîtrisez les mécaniques de combat et les stratégies avancées.',
    emoji: '⚔️',
    difficulty: 'Intermédiaire',
    readTime: '10 min'
  },
  {
    id: 'economy',
    title: 'Économie & Artisanat',
    description: 'Gérez votre or, craftez des objets et développez votre richesse.',
    emoji: '💰',
    difficulty: 'Intermédiaire',
    readTime: '8 min'
  }
];

const difficultyColors: Record<string, string> = {
  'Débutant': 'bg-uncommon/10 text-uncommon border-uncommon/30',
  'Intermédiaire': 'bg-rare/10 text-rare border-rare/30',
  'Avancé': 'bg-epic/10 text-epic border-epic/30'
};

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-valthera-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-valthera-900 to-valthera-950 border-b border-valthera-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 text-sm text-valthera-400 mb-4">
            <Link href="/wiki" className="hover:text-valthera-200 transition-colors">Wiki</Link>
            <span>/</span>
            <span className="text-valthera-200">Guides</span>
          </div>
          <h1 className="text-4xl font-medieval text-valthera-100 mb-4">
            📖 Guides & Tutoriels
          </h1>
          <p className="text-valthera-300 max-w-3xl">
            Des guides complets pour maîtriser tous les aspects de Valthera. 
            Que vous soyez débutant ou vétéran, vous trouverez des conseils utiles.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <Link
              key={guide.id}
              href={`/wiki/guides/${guide.id}`}
              className="group bg-valthera-900/50 rounded-xl border border-valthera-800 p-6 hover:bg-valthera-800/50 hover:border-valthera-700 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-5xl">{guide.emoji}</span>
                <span className={`px-3 py-1 rounded-full text-xs border ${difficultyColors[guide.difficulty]}`}>
                  {guide.difficulty}
                </span>
              </div>
              <h2 className="text-xl font-medieval text-valthera-100 mb-2 group-hover:text-valthera-200 transition-colors">
                {guide.title}
              </h2>
              <p className="text-valthera-400 mb-4">{guide.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-valthera-500">⏱️ {guide.readTime}</span>
                <span className="text-valthera-500 group-hover:text-valthera-300 transition-colors">
                  Lire →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Tips Section */}
        <div className="mt-12 bg-valthera-900/50 rounded-xl border border-valthera-800 p-8">
          <h2 className="text-2xl font-medieval text-valthera-100 mb-6">💡 Conseils Rapides</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <span className="text-3xl">🗡️</span>
              <div>
                <h3 className="font-medium text-valthera-200 mb-1">Équipez-vous</h3>
                <p className="text-valthera-400 text-sm">Visitez le forgeron dès le début pour obtenir un équipement de base.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-3xl">🗺️</span>
              <div>
                <h3 className="font-medium text-valthera-200 mb-1">Explorez</h3>
                <p className="text-valthera-400 text-sm">Utilisez /explore régulièrement pour découvrir des ressources et événements.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-3xl">👥</span>
              <div>
                <h3 className="font-medium text-valthera-200 mb-1">Groupez-vous</h3>
                <p className="text-valthera-400 text-sm">Les combats en groupe permettent d'affronter des défis plus difficiles.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-3xl">💊</span>
              <div>
                <h3 className="font-medium text-valthera-200 mb-1">Reposez-vous</h3>
                <p className="text-valthera-400 text-sm">Utilisez /rest à Valthera pour récupérer vos PV et mana gratuitement.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
