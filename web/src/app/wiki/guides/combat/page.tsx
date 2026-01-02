import Link from 'next/link';

export default function CombatGuide() {
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
            <span className="text-valthera-200">Combat</span>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">⚔️</span>
            <div>
              <h1 className="text-4xl font-medieval text-valthera-100">Guide du Combat</h1>
              <div className="flex items-center gap-4 text-sm text-valthera-400 mt-2">
                <span className="px-2 py-0.5 bg-rare/10 text-rare rounded border border-rare/30">Intermédiaire</span>
                <span>⏱️ 10 min de lecture</span>
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
              Le combat dans Valthera est stratégique et basé sur des jets de dés. 
              Ce guide vous expliquera les mécaniques de combat, les différentes actions 
              disponibles et les stratégies pour optimiser vos chances de victoire.
            </p>
          </div>

          {/* Combat Basics */}
          <section className="mb-10">
            <h2 className="text-2xl font-medieval text-valthera-100 mb-4">🎲 Les Bases du Combat</h2>
            <div className="bg-valthera-900/30 rounded-lg p-6 border border-valthera-800">
              <h3 className="font-medieval text-valthera-200 mb-3">Initiative</h3>
              <p className="text-valthera-300 mb-4">
                Au début de chaque combat, l'ordre des tours est déterminé par un jet d'initiative 
                (1d20 + modificateur de Dextérité). Les personnages agissent du plus haut au plus bas.
              </p>

              <h3 className="font-medieval text-valthera-200 mb-3 mt-6">Jet d'Attaque</h3>
              <div className="bg-valthera-800/50 rounded-lg p-4 border border-valthera-700 mb-4">
                <p className="text-valthera-200 font-mono text-lg text-center">
                  1d20 + Modificateur d'attaque ≥ Classe d'Armure (CA)
                </p>
              </div>
              <p className="text-valthera-400 text-sm">
                Si le résultat égale ou dépasse la CA de la cible, l'attaque touche.
              </p>

              <h3 className="font-medieval text-valthera-200 mb-3 mt-6">Dégâts</h3>
              <p className="text-valthera-300 mb-4">
                Les dégâts dépendent de votre arme. Par exemple, une épée longue inflige 1d8 + 
                votre modificateur de Force.
              </p>

              <div className="bg-blood-900/20 rounded p-4 border-l-4 border-blood-500 mt-4">
                <p className="text-valthera-300 text-sm">
                  <strong className="text-blood-400">⚠️ Coup Critique :</strong> Un 20 naturel double les dés de dégâts !
                </p>
              </div>
            </div>
          </section>

          {/* Actions in Combat */}
          <section className="mb-10">
            <h2 className="text-2xl font-medieval text-valthera-100 mb-4">🎯 Actions de Combat</h2>
            <div className="space-y-4">
              <div className="bg-valthera-900/30 rounded-lg p-5 border border-valthera-800">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">⚔️</span>
                  <h3 className="font-medieval text-valthera-200">Attaque</h3>
                </div>
                <p className="text-valthera-400">Attaquez avec votre arme équipée. Action principale du combat.</p>
              </div>
              
              <div className="bg-valthera-900/30 rounded-lg p-5 border border-valthera-800">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">✨</span>
                  <h3 className="font-medieval text-valthera-200">Sort</h3>
                </div>
                <p className="text-valthera-400">Lancez un sort si votre classe le permet. Consomme du mana.</p>
              </div>
              
              <div className="bg-valthera-900/30 rounded-lg p-5 border border-valthera-800">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🛡️</span>
                  <h3 className="font-medieval text-valthera-200">Défense</h3>
                </div>
                <p className="text-valthera-400">Adoptez une posture défensive (+2 CA jusqu'au prochain tour).</p>
              </div>
              
              <div className="bg-valthera-900/30 rounded-lg p-5 border border-valthera-800">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🧪</span>
                  <h3 className="font-medieval text-valthera-200">Utiliser un Objet</h3>
                </div>
                <p className="text-valthera-400">Buvez une potion ou utilisez un objet de votre inventaire.</p>
              </div>
              
              <div className="bg-valthera-900/30 rounded-lg p-5 border border-valthera-800">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🏃</span>
                  <h3 className="font-medieval text-valthera-200">Fuir</h3>
                </div>
                <p className="text-valthera-400">Tentez de fuir le combat. Nécessite un jet réussi.</p>
              </div>
            </div>
          </section>

          {/* Stats Explained */}
          <section className="mb-10">
            <h2 className="text-2xl font-medieval text-valthera-100 mb-4">📊 Statistiques Importantes</h2>
            <div className="bg-valthera-900/30 rounded-lg p-6 border border-valthera-800">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-blood-400 font-medium mb-2">❤️ Points de Vie (PV)</h4>
                  <p className="text-valthera-400 text-sm">Votre santé. À 0, vous tombez inconscient.</p>
                </div>
                <div>
                  <h4 className="text-rare font-medium mb-2">💙 Points de Mana (PM)</h4>
                  <p className="text-valthera-400 text-sm">Énergie magique pour lancer des sorts.</p>
                </div>
                <div>
                  <h4 className="text-steel-400 font-medium mb-2">🛡️ Classe d'Armure (CA)</h4>
                  <p className="text-valthera-400 text-sm">Difficulté à vous toucher. Plus c'est haut, mieux c'est.</p>
                </div>
                <div>
                  <h4 className="text-legendary font-medium mb-2">⚔️ Bonus d'Attaque</h4>
                  <p className="text-valthera-400 text-sm">Ajouté à vos jets d'attaque.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Combat Tips */}
          <section className="mb-10">
            <h2 className="text-2xl font-medieval text-valthera-100 mb-4">💡 Stratégies de Combat</h2>
            <div className="space-y-4">
              <div className="bg-forest-900/20 rounded-lg p-5 border border-forest-800">
                <h3 className="text-forest-300 font-medium mb-2">Pour les Guerriers</h3>
                <ul className="text-valthera-400 text-sm space-y-1">
                  <li>• Utilisez la Défense quand vous êtes en mauvaise posture</li>
                  <li>• Gardez des potions de soins pour les urgences</li>
                  <li>• Positionnez-vous pour protéger vos alliés plus fragiles</li>
                </ul>
              </div>
              
              <div className="bg-epic/10 rounded-lg p-5 border border-epic/30">
                <h3 className="text-epic font-medium mb-2">Pour les Mages</h3>
                <ul className="text-valthera-400 text-sm space-y-1">
                  <li>• Gérez votre mana - gardez-en pour les moments critiques</li>
                  <li>• Les sorts de zone sont efficaces contre les groupes</li>
                  <li>• Utilisez des tours de magie pour économiser le mana</li>
                </ul>
              </div>
              
              <div className="bg-legendary/10 rounded-lg p-5 border border-legendary/30">
                <h3 className="text-legendary font-medium mb-2">Pour les Soigneurs</h3>
                <ul className="text-valthera-400 text-sm space-y-1">
                  <li>• Priorisez les soins sur les alliés en danger</li>
                  <li>• Gardez un sort de résurrection pour les cas extrêmes</li>
                  <li>• N'oubliez pas que vous pouvez aussi faire des dégâts</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Group Combat */}
          <section className="mb-10">
            <h2 className="text-2xl font-medieval text-valthera-100 mb-4">👥 Combat en Groupe</h2>
            <div className="bg-valthera-900/30 rounded-lg p-6 border border-valthera-800">
              <p className="text-valthera-300 mb-4">
                Les combats en groupe permettent d'affronter des défis plus difficiles et offrent 
                des bonus de coordination :
              </p>
              <ul className="space-y-3 text-valthera-400">
                <li className="flex items-start gap-3">
                  <span className="text-uncommon">✓</span>
                  <span><strong className="text-valthera-200">Attaques de flanc :</strong> +2 au jet d'attaque si un allié est adjacent à la cible</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-uncommon">✓</span>
                  <span><strong className="text-valthera-200">Protection mutuelle :</strong> Les tanks peuvent protéger les alliés fragiles</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-uncommon">✓</span>
                  <span><strong className="text-valthera-200">Synergie de classe :</strong> Les buffs et debuffs s'appliquent à tout le groupe</span>
                </li>
              </ul>
              <div className="mt-4 p-4 bg-valthera-800/30 rounded border border-valthera-700">
                <p className="text-valthera-300 text-sm">
                  Utilisez <code className="px-1.5 py-0.5 bg-valthera-700 rounded text-valthera-100">/party create</code> pour 
                  créer un groupe et <code className="px-1.5 py-0.5 bg-valthera-700 rounded text-valthera-100">/party invite @joueur</code> pour inviter des membres.
                </p>
              </div>
            </div>
          </section>

          {/* Navigation */}
          <section>
            <h2 className="text-2xl font-medieval text-valthera-100 mb-4">📚 Guides Connexes</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/wiki/monsters" className="block bg-valthera-900/30 rounded-lg p-6 border border-valthera-800 hover:bg-valthera-800/30 hover:border-valthera-700 transition-all">
                <span className="text-3xl mb-2 block">👹</span>
                <h3 className="font-medieval text-valthera-200 mb-1">Bestiaire</h3>
                <p className="text-valthera-400 text-sm">Connaissez vos ennemis et leurs faiblesses.</p>
              </Link>
              <Link href="/wiki/spells" className="block bg-valthera-900/30 rounded-lg p-6 border border-valthera-800 hover:bg-valthera-800/30 hover:border-valthera-700 transition-all">
                <span className="text-3xl mb-2 block">✨</span>
                <h3 className="font-medieval text-valthera-200 mb-1">Grimoire</h3>
                <p className="text-valthera-400 text-sm">Tous les sorts disponibles.</p>
              </Link>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
