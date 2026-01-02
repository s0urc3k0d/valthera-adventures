import Link from 'next/link';

export default function GettingStartedGuide() {
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
            <span className="text-valthera-200">Premiers Pas</span>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">🎮</span>
            <div>
              <h1 className="text-4xl font-medieval text-valthera-100">Premiers Pas</h1>
              <div className="flex items-center gap-4 text-sm text-valthera-400 mt-2">
                <span className="px-2 py-0.5 bg-uncommon/10 text-uncommon rounded border border-uncommon/30">Débutant</span>
                <span>⏱️ 5 min de lecture</span>
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
              Bienvenue dans Valthera ! Ce guide vous accompagnera dans vos premiers pas 
              dans ce monde fantastique. Vous apprendrez à créer votre personnage, 
              comprendre les commandes de base et débuter votre aventure.
            </p>
          </div>

          {/* Step 1 */}
          <section className="mb-10">
            <h2 className="text-2xl font-medieval text-valthera-100 flex items-center gap-3 mb-4">
              <span className="w-10 h-10 rounded-full bg-valthera-800 flex items-center justify-center text-lg">1</span>
              Inviter le Bot
            </h2>
            <div className="bg-valthera-900/30 rounded-lg p-6 border border-valthera-800">
              <p className="text-valthera-300 mb-4">
                Commencez par inviter Valthera sur votre serveur Discord en utilisant le lien d'invitation.
                Le bot nécessite les permissions suivantes :
              </p>
              <ul className="space-y-2 text-valthera-400">
                <li className="flex items-center gap-2">
                  <span className="text-uncommon">✓</span> Envoyer des messages
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-uncommon">✓</span> Utiliser les commandes slash
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-uncommon">✓</span> Intégrer des liens
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-uncommon">✓</span> Joindre des fichiers
                </li>
              </ul>
              <div className="mt-4">
                <Link href="/invite" className="inline-flex items-center gap-2 px-4 py-2 bg-valthera-700 text-valthera-100 rounded-lg hover:bg-valthera-600 transition-colors">
                  <span>🤖</span> Inviter Valthera
                </Link>
              </div>
            </div>
          </section>

          {/* Step 2 */}
          <section className="mb-10">
            <h2 className="text-2xl font-medieval text-valthera-100 flex items-center gap-3 mb-4">
              <span className="w-10 h-10 rounded-full bg-valthera-800 flex items-center justify-center text-lg">2</span>
              Créer votre Personnage
            </h2>
            <div className="bg-valthera-900/30 rounded-lg p-6 border border-valthera-800">
              <p className="text-valthera-300 mb-4">
                Utilisez la commande <code className="px-2 py-0.5 bg-valthera-800 rounded text-valthera-200">/create</code> pour créer votre personnage.
                Vous devrez choisir :
              </p>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="bg-valthera-800/50 rounded-lg p-4 border border-valthera-700">
                  <h4 className="font-medium text-valthera-200 mb-2">🧬 Race</h4>
                  <p className="text-valthera-400 text-sm">Humain, Elfe, Nain ou Halfelin - chacun avec des bonus uniques.</p>
                </div>
                <div className="bg-valthera-800/50 rounded-lg p-4 border border-valthera-700">
                  <h4 className="font-medium text-valthera-200 mb-2">⚔️ Classe</h4>
                  <p className="text-valthera-400 text-sm">Guerrier, Mage, Voleur, Clerc... définit votre style de jeu.</p>
                </div>
                <div className="bg-valthera-800/50 rounded-lg p-4 border border-valthera-700">
                  <h4 className="font-medium text-valthera-200 mb-2">📜 Background</h4>
                  <p className="text-valthera-400 text-sm">Votre histoire personnelle qui donne des compétences bonus.</p>
                </div>
              </div>
              <div className="bg-valthera-800/30 rounded p-4 border-l-4 border-legendary">
                <p className="text-valthera-300 text-sm">
                  <strong className="text-legendary">💡 Conseil :</strong> Pour débuter, le Guerrier Humain est un excellent choix 
                  grâce à sa polyvalence et sa résistance.
                </p>
              </div>
            </div>
          </section>

          {/* Step 3 */}
          <section className="mb-10">
            <h2 className="text-2xl font-medieval text-valthera-100 flex items-center gap-3 mb-4">
              <span className="w-10 h-10 rounded-full bg-valthera-800 flex items-center justify-center text-lg">3</span>
              Commandes Essentielles
            </h2>
            <div className="bg-valthera-900/30 rounded-lg p-6 border border-valthera-800">
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-3 bg-valthera-800/30 rounded-lg">
                  <code className="px-2 py-1 bg-valthera-700 rounded text-valthera-100 whitespace-nowrap">/sheet</code>
                  <p className="text-valthera-400">Affiche votre fiche de personnage avec toutes vos statistiques.</p>
                </div>
                <div className="flex items-start gap-4 p-3 bg-valthera-800/30 rounded-lg">
                  <code className="px-2 py-1 bg-valthera-700 rounded text-valthera-100 whitespace-nowrap">/inventory</code>
                  <p className="text-valthera-400">Consultez votre inventaire et équipez des objets.</p>
                </div>
                <div className="flex items-start gap-4 p-3 bg-valthera-800/30 rounded-lg">
                  <code className="px-2 py-1 bg-valthera-700 rounded text-valthera-100 whitespace-nowrap">/map</code>
                  <p className="text-valthera-400">Voir la carte du monde et votre position actuelle.</p>
                </div>
                <div className="flex items-start gap-4 p-3 bg-valthera-800/30 rounded-lg">
                  <code className="px-2 py-1 bg-valthera-700 rounded text-valthera-100 whitespace-nowrap">/travel</code>
                  <p className="text-valthera-400">Voyagez vers une nouvelle zone.</p>
                </div>
                <div className="flex items-start gap-4 p-3 bg-valthera-800/30 rounded-lg">
                  <code className="px-2 py-1 bg-valthera-700 rounded text-valthera-100 whitespace-nowrap">/explore</code>
                  <p className="text-valthera-400">Explorez la zone actuelle pour trouver des ressources ou des rencontres.</p>
                </div>
                <div className="flex items-start gap-4 p-3 bg-valthera-800/30 rounded-lg">
                  <code className="px-2 py-1 bg-valthera-700 rounded text-valthera-100 whitespace-nowrap">/help</code>
                  <p className="text-valthera-400">Liste toutes les commandes disponibles.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Step 4 */}
          <section className="mb-10">
            <h2 className="text-2xl font-medieval text-valthera-100 flex items-center gap-3 mb-4">
              <span className="w-10 h-10 rounded-full bg-valthera-800 flex items-center justify-center text-lg">4</span>
              Votre Première Quête
            </h2>
            <div className="bg-valthera-900/30 rounded-lg p-6 border border-valthera-800">
              <p className="text-valthera-300 mb-4">
                Dès la création de votre personnage, vous recevrez automatiquement la quête 
                <span className="text-legendary"> "Bienvenue à Valthera"</span>. Cette quête d'introduction vous guidera à travers :
              </p>
              <ol className="space-y-3 text-valthera-400">
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-valthera-700 flex items-center justify-center text-sm text-valthera-200">1</span>
                  Rencontrer Elena à la Guilde des Aventuriers
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-valthera-700 flex items-center justify-center text-sm text-valthera-200">2</span>
                  Voyager vers les Bois Murmurants
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-valthera-700 flex items-center justify-center text-sm text-valthera-200">3</span>
                  Vaincre votre premier monstre
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-valthera-700 flex items-center justify-center text-sm text-valthera-200">4</span>
                  Retourner faire votre rapport
                </li>
              </ol>
              <p className="text-valthera-300 mt-4">
                Utilisez <code className="px-2 py-0.5 bg-valthera-800 rounded text-valthera-200">/quests</code> pour suivre votre progression.
              </p>
            </div>
          </section>

          {/* Next Steps */}
          <section>
            <h2 className="text-2xl font-medieval text-valthera-100 mb-4">🚀 Et Ensuite ?</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/wiki/guides/combat" className="block bg-valthera-900/30 rounded-lg p-6 border border-valthera-800 hover:bg-valthera-800/30 hover:border-valthera-700 transition-all">
                <span className="text-3xl mb-2 block">⚔️</span>
                <h3 className="font-medieval text-valthera-200 mb-1">Guide du Combat</h3>
                <p className="text-valthera-400 text-sm">Maîtrisez les mécaniques de combat.</p>
              </Link>
              <Link href="/wiki/guides/economy" className="block bg-valthera-900/30 rounded-lg p-6 border border-valthera-800 hover:bg-valthera-800/30 hover:border-valthera-700 transition-all">
                <span className="text-3xl mb-2 block">💰</span>
                <h3 className="font-medieval text-valthera-200 mb-1">Économie & Artisanat</h3>
                <p className="text-valthera-400 text-sm">Gérez votre or et craftez des objets.</p>
              </Link>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
