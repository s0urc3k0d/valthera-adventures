import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';
import { connectDB } from '@/lib/mongodb';
import { Character, Guild } from '@/lib/models';

export const metadata = {
  title: 'Mon Personnage',
  description: 'Consultez les détails de votre personnage Valthera',
};

async function getCharacterData(discordId: string) {
  await connectDB();

  const [character, guild] = await Promise.all([
    Character.findOne({ userId: discordId }).lean(),
    Guild.findOne({ 'members.playerId': discordId }).lean(),
  ]);

  // Les quêtes sont stockées dans le character
  const quests = character?.quests || [];

  return { character, quests, guild };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/api/auth/signin?callbackUrl=/dashboard');
  }

  const discordId = (session.user as any).discordId;
  const { character, quests, guild } = await getCharacterData(discordId);

  if (!character) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🎭</div>
          <h1 className="text-2xl font-bold text-valthera-100 font-medieval mb-4">
            Aucun Personnage Trouvé
          </h1>
          <p className="text-valthera-200/70 mb-8 font-body">
            Vous n'avez pas encore créé de personnage dans Valthera Adventures. 
            Utilisez la commande <code className="text-valthera-400 bg-valthera-800/50 px-2 py-1 rounded">/create</code> sur Discord pour commencer votre aventure !
          </p>
          <a
            href="/invite"
            className="btn-gold"
          >
            Ajouter le Bot à Discord
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <DashboardTabs 
        character={JSON.parse(JSON.stringify(character))}
        quests={JSON.parse(JSON.stringify(quests))}
        guild={guild ? JSON.parse(JSON.stringify(guild)) : null}
        user={session.user}
      />
    </div>
  );
}
