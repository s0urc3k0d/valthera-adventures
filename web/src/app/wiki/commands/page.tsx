import { Terminal, Info } from 'lucide-react';

export const metadata = {
  title: 'Commandes',
  description: 'Liste complète des commandes Discord de Valthera Adventures',
};

// Données des commandes (correspondant au bot)
const commandCategories = [
  {
    name: 'Personnage',
    emoji: '👤',
    commands: [
      {
        name: '/create',
        description: 'Créer un nouveau personnage',
        usage: '/create',
        options: [],
      },
      {
        name: '/sheet',
        description: 'Afficher votre feuille de personnage',
        usage: '/sheet',
        options: [],
      },
      {
        name: '/stats',
        description: 'Voir vos statistiques détaillées',
        usage: '/stats',
        options: [],
      },
      {
        name: '/inventory',
        description: 'Gérer votre inventaire',
        usage: '/inventory [page]',
        options: [{ name: 'page', type: 'number', optional: true }],
      },
      {
        name: '/give',
        description: 'Donner un objet ou de l\'or à un joueur (admin)',
        usage: '/give <joueur> <type> <valeur>',
        options: [
          { name: 'joueur', type: 'user', optional: false },
          { name: 'type', type: 'string', optional: false },
          { name: 'valeur', type: 'string', optional: false },
        ],
      },
    ],
  },
  {
    name: 'Combat',
    emoji: '⚔️',
    commands: [
      {
        name: '/combat',
        description: 'Lancer un combat contre un monstre',
        usage: '/combat [monstre]',
        options: [{ name: 'monstre', type: 'string', optional: true }],
      },
    ],
  },
  {
    name: 'Exploration',
    emoji: '🗺️',
    commands: [
      {
        name: '/explore',
        description: 'Explorer la zone actuelle',
        usage: '/explore',
        options: [],
      },
      {
        name: '/travel',
        description: 'Voyager vers une autre zone',
        usage: '/travel <zone>',
        options: [{ name: 'zone', type: 'string', optional: false }],
      },
      {
        name: '/map',
        description: 'Afficher la carte du monde',
        usage: '/map',
        options: [],
      },
      {
        name: '/look',
        description: 'Observer les environs',
        usage: '/look',
        options: [],
      },
      {
        name: '/rest',
        description: 'Se reposer pour récupérer',
        usage: '/rest',
        options: [],
      },
    ],
  },
  {
    name: 'Économie',
    emoji: '💰',
    commands: [
      {
        name: '/shop',
        description: 'Accéder à la boutique',
        usage: '/shop [catégorie]',
        options: [{ name: 'catégorie', type: 'string', optional: true }],
      },
      {
        name: '/sell',
        description: 'Vendre un objet',
        usage: '/sell <objet> [quantité]',
        options: [
          { name: 'objet', type: 'string', optional: false },
          { name: 'quantité', type: 'number', optional: true },
        ],
      },
      {
        name: '/craft',
        description: 'Crafter un objet',
        usage: '/craft <recette>',
        options: [{ name: 'recette', type: 'string', optional: false }],
      },
      {
        name: '/wallet',
        description: 'Voir votre portefeuille',
        usage: '/wallet',
        options: [],
      },
    ],
  },
  {
    name: 'Quêtes',
    emoji: '📜',
    commands: [
      {
        name: '/quests',
        description: 'Voir vos quêtes actives',
        usage: '/quests',
        options: [],
      },
      {
        name: '/talk',
        description: 'Parler à un PNJ',
        usage: '/talk <pnj>',
        options: [{ name: 'pnj', type: 'string', optional: false }],
      },
    ],
  },
  {
    name: 'Social',
    emoji: '👥',
    commands: [
      {
        name: '/party',
        description: 'Gérer votre groupe',
        usage: '/party <action> [joueur]',
        options: [
          { name: 'action', type: 'string', optional: false },
          { name: 'joueur', type: 'user', optional: true },
        ],
      },
      {
        name: '/guild',
        description: 'Gérer votre guilde',
        usage: '/guild <action> [options]',
        options: [{ name: 'action', type: 'string', optional: false }],
      },
      {
        name: '/trade',
        description: 'Échanger avec un joueur',
        usage: '/trade <joueur>',
        options: [{ name: 'joueur', type: 'user', optional: false }],
      },
    ],
  },
  {
    name: 'Informations',
    emoji: 'ℹ️',
    commands: [
      {
        name: '/help',
        description: 'Afficher l\'aide',
        usage: '/help [commande]',
        options: [{ name: 'commande', type: 'string', optional: true }],
      },
    ],
  },
];

export default function CommandsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <Terminal className="w-6 h-6 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white font-medieval">
            Commandes
          </h1>
        </div>
        <p className="text-gray-400">
          Liste complète des commandes slash disponibles dans Valthera Adventures.
          Toutes les commandes commencent par <code className="text-valthera-400">/</code>
        </p>
      </div>

      {/* Info box */}
      <div className="card p-4 mb-8 border-blue-500/30 bg-blue-500/5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <div className="text-white font-medium">Comment utiliser les commandes</div>
            <p className="text-sm text-gray-400 mt-1">
              Tapez <code className="text-valthera-400">/</code> dans Discord pour voir la liste des commandes.
              Les options entre <code className="text-gray-500">[crochets]</code> sont optionnelles,
              celles entre <code className="text-gray-500">&lt;chevrons&gt;</code> sont obligatoires.
            </p>
          </div>
        </div>
      </div>

      {/* Command Categories */}
      <div className="space-y-8">
        {commandCategories.map((category) => (
          <div key={category.name} className="card overflow-hidden">
            {/* Category Header */}
            <div className="bg-gray-800/50 px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white flex items-center gap-3">
                <span className="text-2xl">{category.emoji}</span>
                {category.name}
                <span className="text-sm text-gray-400 font-normal">
                  ({category.commands.length} commandes)
                </span>
              </h2>
            </div>

            {/* Commands List */}
            <div className="divide-y divide-gray-800">
              {category.commands.map((command) => (
                <div key={command.name} className="p-6 hover:bg-gray-800/30 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* Command name */}
                    <div className="md:w-48 flex-shrink-0">
                      <code className="text-valthera-400 font-mono text-lg">
                        {command.name}
                      </code>
                    </div>

                    {/* Description & Usage */}
                    <div className="flex-1">
                      <p className="text-gray-300 mb-2">{command.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Usage:</span>
                        <code className="text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded">
                          {command.usage}
                        </code>
                      </div>

                      {/* Options */}
                      {command.options.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {command.options.map((option) => (
                            <span
                              key={option.name}
                              className={`text-xs px-2 py-1 rounded ${
                                option.optional
                                  ? 'bg-gray-700 text-gray-300'
                                  : 'bg-valthera-500/20 text-valthera-300'
                              }`}
                            >
                              {option.name}: {option.type}
                              {option.optional && ' (optionnel)'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
