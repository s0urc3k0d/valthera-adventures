import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AuthProvider } from '@/components/providers/AuthProvider';

export const metadata: Metadata = {
  title: {
    default: 'Valthera Adventures - Discord RPG Bot',
    template: '%s | Valthera Adventures',
  },
  description: 'Un bot Discord RPG complet inspiré de D&D. Créez votre personnage, explorez des zones uniques, combattez des monstres et accomplissez des quêtes épiques.',
  keywords: ['discord', 'bot', 'rpg', 'dnd', 'dungeons and dragons', 'game', 'adventure', 'valthera'],
  authors: [{ name: 'Valthera Team' }],
  openGraph: {
    title: 'Valthera Adventures',
    description: 'Embarquez pour une aventure épique dans le monde de Valthera',
    url: 'https://valthera.example.com',
    siteName: 'Valthera Adventures',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Valthera Adventures',
    description: 'Embarquez pour une aventure épique dans le monde de Valthera',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
