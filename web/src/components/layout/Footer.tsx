import Link from 'next/link';
import { Sword, Github, Heart } from 'lucide-react';

const footerLinks = {
  navigation: [
    { href: '/', label: 'Accueil' },
    { href: '/wiki', label: 'Wiki' },
    { href: '/leaderboard', label: 'Classements' },
    { href: '/map', label: 'Carte' },
  ],
  wiki: [
    { href: '/wiki/commands', label: 'Commandes' },
    { href: '/wiki/classes', label: 'Classes' },
    { href: '/wiki/races', label: 'Races' },
    { href: '/wiki/zones', label: 'Zones' },
  ],
  legal: [
    { href: '/privacy', label: 'Confidentialité' },
    { href: '/terms', label: 'Conditions' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-gray-900/50 border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-valthera-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sword className="w-6 h-6 text-white" />
              </div>
              <span className="font-medieval text-xl text-white">Valthera</span>
            </Link>
            <p className="text-gray-400 text-sm mb-4">
              Un bot Discord RPG complet inspiré de Dungeons & Dragons. 
              Créez votre héros et partez à l'aventure !
            </p>
            <div className="flex gap-4">
              <a
                href="https://github.com/s0urc3k0d/valthera-adventures"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold text-white mb-4">Navigation</h3>
            <ul className="space-y-2">
              {footerLinks.navigation.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-valthera-400 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Wiki */}
          <div>
            <h3 className="font-semibold text-white mb-4">Wiki</h3>
            <ul className="space-y-2">
              {footerLinks.wiki.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-valthera-400 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-white mb-4">Légal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-valthera-400 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Valthera Adventures. Tous droits réservés.
          </p>
          <p className="text-gray-500 text-sm flex items-center gap-1">
            Fait avec <Heart className="w-4 h-4 text-red-500" /> pour les aventuriers
          </p>
        </div>
      </div>
    </footer>
  );
}
