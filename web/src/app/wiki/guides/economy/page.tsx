import Link from 'next/link';

export default function EconomyGuide() {
  return (
    <div className="min-h-screen bg-valthera-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-valthera-900 to-valthera-950 border-b border-valthera-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 text-sm text-valthera-400 mb-4">
            <Link href="/wiki" className="hover:text-valthera-200 transition-colors">Wiki</Link>
            <span>/</span>
            <Link href="/wiki/guides" className="hover:text-valthera-200 transition-colors">Guides</Link>
            <span>/</span>
            <span className="text-valthera-200">Économie</span>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">💰</span>
            <div>
              <h1 className="text-4xl font-medieval text-valthera-100">Économie & Artisanat</h1>
              <div className="flex items-center gap-4 text-sm text-valthera-400 mt-2">
                <span className="px-2 py-0.5 bg-rare/10 text-rare rounded border border-rare/30">Intermédiaire</span>
                <span>⏱️ 8 min de lecture</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="prose prose-invert prose-valthera max-w-none">
          {/* Introduction */}
          <div className="bg-valthera-900/50 rounded-xl border border-valthera-800 p-6 mb-8">
            <p className="text-valthera-300 text-lg leading-relaxed m-0">
              L'économie de Valthera est au cœur de votre progression. Apprenez à gagner de l'or, 
              gérer vos ressources et maîtriser l'artisanat pour créer des équipements puissants.
            </p>
          </div>

          {/* Earning Gold */}
          <section className="mb-10">
            <h2 className="text-2xl font-medieval text-valthera-100 mb-4">💰 Gagner de l'Or</h2>
            <div className="bg-valthera-900/30 rounded-lg p-6 border border-valthera-800">
              <p className="text-valthera-300 mb-4">Il existe plusieurs façons d'accumuler des richesses :</p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-valthera-800/30 rounded-lg">
                  <span className="text-3xl">⚔️</span>
                  <div>
                    <h4 className="font-medium text-valthera-200 mb-1">Combat</h4>
                    <p className="text-valthera-400 text-sm">Les monstres vaincus laissent tomber de l'or. Plus le monstre est puissant, plus la récompense est élevée.</p>
                    <p className="text-legendary text-sm mt-1">💡 Conseil : Les boss de donjon donnent d'excellentes récompenses.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-valthera-800/30 rounded-lg">
                  <span className="text-3xl">📜</span>
                  <div>
                    <h4 className="font-medium text-valthera-200 mb-1">Quêtes</h4>
                    <p className="text-valthera-400 text-sm">Complétez des quêtes pour recevoir de l'or et des objets en récompense.</p>
                    <p className="text-legendary text-sm mt-1">💡 Conseil : Les quêtes journalières sont une source stable de revenus.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-valthera-800/30 rounded-lg">
                  <span className="text-3xl">🏪</span>
                  <div>
                    <h4 className="font-medium text-valthera-200 mb-1">Vente d'Objets</h4>
                    <p className="text-valthera-400 text-sm">Vendez les objets inutilisés aux marchands avec <code className="px-1.5 py-0.5 bg-valthera-700 rounded text-valthera-100">/sell</code>.</p>
                    <p className="text-legendary text-sm mt-1">💡 Conseil : Les matériaux rares se vendent très bien.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-valthera-800/30 rounded-lg">
                  <span className="text-3xl">🤝</span>
                  <div>
                    <h4 className="font-medium text-valthera-200 mb-1">Commerce entre Joueurs</h4>
                    <p className="text-valthera-400 text-sm">Échangez avec d'autres joueurs via <code className="px-1.5 py-0.5 bg-valthera-700 rounded text-valthera-100">/trade</code>.</p>
                    <p className="text-legendary text-sm mt-1">💡 Conseil : Les objets craftés ont souvent plus de valeur.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Shops */}
          <section className="mb-10">
            <h2 className="text-2xl font-medieval text-valthera-100 mb-4">🏪 Les Boutiques</h2>
            <div className="bg-valthera-900/30 rounded-lg p-6 border border-valthera-800">
              <p className="text-valthera-300 mb-4">
                Utilisez <code className="px-2 py-0.5 bg-valthera-800 rounded text-valthera-200">/shop</code> pour 
                accéder aux différentes boutiques de Valthera :
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-valthera-800/30 rounded-lg p-4 border border-valthera-700">
                  <h4 className="font-medium text-valthera-200 flex items-center gap-2 mb-2">
                    <span>⚔️</span> Forgeron
                  </h4>
                  <p className="text-valthera-400 text-sm">Armes et armures de base à avancées.</p>
                </div>
                
                <div className="bg-valthera-800/30 rounded-lg p-4 border border-valthera-700">
                  <h4 className="font-medium text-valthera-200 flex items-center gap-2 mb-2">
                    <span>🧪</span> Apothicaire
                  </h4>
                  <p className="text-valthera-400 text-sm">Potions de soins, mana et buff temporaires.</p>
                </div>
                
                <div className="bg-valthera-800/30 rounded-lg p-4 border border-valthera-700">
                  <h4 className="font-medium text-valthera-200 flex items-center gap-2 mb-2">
                    <span>📜</span> Marchand Général
                  </h4>
                  <p className="text-valthera-400 text-sm">Objets divers, rations et matériaux basiques.</p>
                </div>
                
                <div className="bg-valthera-800/30 rounded-lg p-4 border border-valthera-700">
                  <h4 className="font-medium text-valthera-200 flex items-center gap-2 mb-2">
                    <span>✨</span> Enchanteur
                  </h4>
                  <p className="text-valthera-400 text-sm">Objets magiques et enchantements (niveau élevé requis).</p>
                </div>
              </div>
            </div>
          </section>

          {/* Crafting */}
          <section className="mb-10">
            <h2 className="text-2xl font-medieval text-valthera-100 mb-4">🔨 Artisanat</h2>
            <div className="bg-valthera-900/30 rounded-lg p-6 border border-valthera-800">
              <p className="text-valthera-300 mb-4">
                L'artisanat vous permet de créer des objets souvent supérieurs à ceux des boutiques.
                Utilisez <code className="px-2 py-0.5 bg-valthera-800 rounded text-valthera-200">/craft</code> pour 
                voir les recettes disponibles.
              </p>

              <h3 className="font-medieval text-valthera-200 mb-3 mt-6">Comment ça fonctionne</h3>
              <ol className="space-y-3 text-valthera-400 mb-6">
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-valthera-700 flex items-center justify-center text-sm text-valthera-200">1</span>
                  <span>Récoltez des matériaux en explorant (<code className="px-1 py-0.5 bg-valthera-800 rounded text-valthera-100">/explore</code>)</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-valthera-700 flex items-center justify-center text-sm text-valthera-200">2</span>
                  <span>Consultez les recettes avec <code className="px-1 py-0.5 bg-valthera-800 rounded text-valthera-100">/craft recipes</code></span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-valthera-700 flex items-center justify-center text-sm text-valthera-200">3</span>
                  <span>Craftez l'objet avec <code className="px-1 py-0.5 bg-valthera-800 rounded text-valthera-100">/craft [recette]</code></span>
                </li>
              </ol>

              <h3 className="font-medieval text-valthera-200 mb-3">Exemples de Recettes</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-valthera-800/30 rounded-lg border border-valthera-700">
                  <div className="flex items-center gap-3">
                    <span>🧪</span>
                    <span className="text-valthera-200">Potion de soins</span>
                  </div>
                  <span className="text-valthera-400 text-sm">2x Herbe médicinale + 1x Fiole vide</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-valthera-800/30 rounded-lg border border-valthera-700">
                  <div className="flex items-center gap-3">
                    <span>⚔️</span>
                    <span className="text-rare">Épée d'acier</span>
                  </div>
                  <span className="text-valthera-400 text-sm">3x Minerai de fer + 1x Charbon</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-valthera-800/30 rounded-lg border border-valthera-700">
                  <div className="flex items-center gap-3">
                    <span>🛡️</span>
                    <span className="text-epic">Armure de mithral</span>
                  </div>
                  <span className="text-valthera-400 text-sm">5x Mithral + 2x Cuir + 1x Gemme rare</span>
                </div>
              </div>
            </div>
          </section>

          {/* Resources */}
          <section className="mb-10">
            <h2 className="text-2xl font-medieval text-valthera-100 mb-4">🎒 Ressources par Zone</h2>
            <div className="bg-valthera-900/30 rounded-lg p-6 border border-valthera-800">
              <p className="text-valthera-300 mb-4">
                Chaque zone propose des ressources différentes. Planifiez vos expéditions !
              </p>
              
              <div className="space-y-4">
                <div className="p-4 bg-forest-900/20 rounded-lg border border-forest-800">
                  <h4 className="font-medium text-forest-300 mb-2">🌲 Bois Murmurants</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-valthera-800 text-valthera-200 rounded text-sm">Herbes médicinales</span>
                    <span className="px-2 py-1 bg-valthera-800 text-valthera-200 rounded text-sm">Bois de chêne</span>
                    <span className="px-2 py-1 bg-valthera-800 text-uncommon rounded text-sm">Fleur de lune</span>
                    <span className="px-2 py-1 bg-valthera-800 text-rare rounded text-sm">Champignon lumineux</span>
                  </div>
                </div>
                
                <div className="p-4 bg-steel-900/20 rounded-lg border border-steel-800">
                  <h4 className="font-medium text-steel-300 mb-2">⛏️ Mines d'Argent</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-valthera-800 text-valthera-200 rounded text-sm">Minerai de fer</span>
                    <span className="px-2 py-1 bg-valthera-800 text-uncommon rounded text-sm">Minerai d'argent</span>
                    <span className="px-2 py-1 bg-valthera-800 text-rare rounded text-sm">Cristal de quartz</span>
                    <span className="px-2 py-1 bg-valthera-800 text-epic rounded text-sm">Mithral</span>
                  </div>
                </div>
                
                <div className="p-4 bg-legendary/10 rounded-lg border border-legendary/30">
                  <h4 className="font-medium text-legendary mb-2">🌙 Clairière Lunaire</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-valthera-800 text-uncommon rounded text-sm">Fleur éthérée</span>
                    <span className="px-2 py-1 bg-valthera-800 text-rare rounded text-sm">Poussière de fée</span>
                    <span className="px-2 py-1 bg-valthera-800 text-epic rounded text-sm">Larme de lune</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tips */}
          <section className="mb-10">
            <h2 className="text-2xl font-medieval text-valthera-100 mb-4">💡 Conseils d'Expert</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-valthera-900/30 rounded-lg p-5 border border-valthera-800">
                <h4 className="font-medium text-valthera-200 mb-2">📈 Investissement</h4>
                <p className="text-valthera-400 text-sm">Achetez des matériaux bon marché et craftez pour revendre plus cher.</p>
              </div>
              <div className="bg-valthera-900/30 rounded-lg p-5 border border-valthera-800">
                <h4 className="font-medium text-valthera-200 mb-2">🎯 Spécialisation</h4>
                <p className="text-valthera-400 text-sm">Concentrez-vous sur un type de craft pour maîtriser les recettes.</p>
              </div>
              <div className="bg-valthera-900/30 rounded-lg p-5 border border-valthera-800">
                <h4 className="font-medium text-valthera-200 mb-2">🏦 Épargne</h4>
                <p className="text-valthera-400 text-sm">Gardez de l'or pour les urgences et les objets rares en vente.</p>
              </div>
              <div className="bg-valthera-900/30 rounded-lg p-5 border border-valthera-800">
                <h4 className="font-medium text-valthera-200 mb-2">🤝 Réseau</h4>
                <p className="text-valthera-400 text-sm">Rejoignez une guilde pour accéder aux bonus économiques collectifs.</p>
              </div>
            </div>
          </section>

          {/* Navigation */}
          <section>
            <h2 className="text-2xl font-medieval text-valthera-100 mb-4">📚 Guides Connexes</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/wiki/items" className="block bg-valthera-900/30 rounded-lg p-6 border border-valthera-800 hover:bg-valthera-800/30 hover:border-valthera-700 transition-all">
                <span className="text-3xl mb-2 block">🎒</span>
                <h3 className="font-medieval text-valthera-200 mb-1">Catalogue des Objets</h3>
                <p className="text-valthera-400 text-sm">Tous les objets disponibles et leurs prix.</p>
              </Link>
              <Link href="/wiki/zones" className="block bg-valthera-900/30 rounded-lg p-6 border border-valthera-800 hover:bg-valthera-800/30 hover:border-valthera-700 transition-all">
                <span className="text-3xl mb-2 block">🗺️</span>
                <h3 className="font-medieval text-valthera-200 mb-1">Zones de Valthera</h3>
                <p className="text-valthera-400 text-sm">Découvrez où trouver chaque ressource.</p>
              </Link>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
