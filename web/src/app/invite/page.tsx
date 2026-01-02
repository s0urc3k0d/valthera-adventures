import Link from 'next/link';

export default function InvitePage() {
  // Discord bot invite link
  const DISCORD_BOT_INVITE = 'https://discord.com/oauth2/authorize?client_id=1456637041683992627&permissions=277025770560&scope=bot%20applications.commands';
  const DISCORD_SERVER_INVITE = 'https://discord.com/invite/zddp4ErzMq';

  return (
    <div className="min-h-screen bg-valthera-950 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-gradient-to-b from-valthera-900 to-valthera-900/50 rounded-2xl border border-valthera-800 overflow-hidden">
          {/* Header with decoration */}
          <div className="relative bg-gradient-to-r from-valthera-800 to-valthera-900 p-8 text-center">
            <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-5"></div>
            <div className="relative">
              <span className="text-8xl block mb-4">🐉</span>
              <h1 className="text-4xl font-medieval text-valthera-100 mb-2">
                Inviter Valthera
              </h1>
              <p className="text-valthera-400">
                Ajoutez le bot RPG sur votre serveur Discord
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="flex items-start gap-3 p-4 bg-valthera-800/30 rounded-lg">
                <span className="text-2xl">⚔️</span>
                <div>
                  <h3 className="font-medium text-valthera-200">Combats Épiques</h3>
                  <p className="text-valthera-400 text-sm">Système de combat tour par tour</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-valthera-800/30 rounded-lg">
                <span className="text-2xl">🗺️</span>
                <div>
                  <h3 className="font-medium text-valthera-200">Monde Ouvert</h3>
                  <p className="text-valthera-400 text-sm">Explorez des zones variées</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-valthera-800/30 rounded-lg">
                <span className="text-2xl">👥</span>
                <div>
                  <h3 className="font-medium text-valthera-200">Multijoueur</h3>
                  <p className="text-valthera-400 text-sm">Guildes, groupes et commerce</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-valthera-800/30 rounded-lg">
                <span className="text-2xl">📜</span>
                <div>
                  <h3 className="font-medium text-valthera-200">Quêtes & Histoire</h3>
                  <p className="text-valthera-400 text-sm">Des dizaines de quêtes à découvrir</p>
                </div>
              </div>
            </div>

            {/* Invite Button */}
            <a
              href={DISCORD_BOT_INVITE}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 px-6 bg-[#5865F2] hover:bg-[#4752C4] text-white text-center font-medium rounded-xl transition-colors mb-4"
            >
              <span className="flex items-center justify-center gap-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Ajouter à Discord
              </span>
            </a>

            {/* Secondary action */}
            <a
              href={DISCORD_SERVER_INVITE}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 px-6 bg-valthera-800/50 hover:bg-valthera-800 text-valthera-200 text-center font-medium rounded-xl transition-colors border border-valthera-700"
            >
              Rejoindre le serveur officiel
            </a>

            {/* Permissions info */}
            <div className="mt-8 p-4 bg-valthera-800/20 rounded-lg border border-valthera-800">
              <h4 className="font-medium text-valthera-200 mb-2 flex items-center gap-2">
                <span>🔒</span> Permissions requises
              </h4>
              <ul className="text-valthera-400 text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <span className="text-uncommon text-xs">✓</span> Envoyer des messages
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-uncommon text-xs">✓</span> Utiliser les commandes slash
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-uncommon text-xs">✓</span> Intégrer des liens (embeds)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-uncommon text-xs">✓</span> Joindre des fichiers
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-uncommon text-xs">✓</span> Ajouter des réactions
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link href="/" className="text-valthera-400 hover:text-valthera-200 transition-colors">
            ← Retour à l'accueil
          </Link>
        </div>

        {/* Multi-server note */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-forest-900/20 border border-forest-800 rounded-lg">
            <span className="text-forest-400">🌐</span>
            <p className="text-forest-300 text-sm">
              <strong>Multi-serveur :</strong> Votre personnage vous suit sur tous les serveurs Discord !
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
