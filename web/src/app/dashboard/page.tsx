import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';
import { connectDB } from '@/lib/mongodb';
import { Character, Quest, Guild } from '@/lib/models';

export const metadata = {
  title: 'Mon Personnage',
  description: 'Consultez les détails de votre personnage Valthera',
};

async function getCharacterData(discordId: string) {
  await connectDB();

  const [character, quests, guild] = await Promise.all([
    Character.findOne({ odiscordUserId: discordId }).lean(),
    Quest.find({ odiscordUserId: discordId }).lean(),
    Guild.findOne({ 'members.odiscordUserId': discordId }).lean(),
  ]);

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
          <h1 className="text-2xl font-bold text-white font-medieval mb-4">
            Aucun Personnage Trouvé
          </h1>
          <p className="text-gray-400 mb-8">
            Vous n'avez pas encore créé de personnage dans Valthera Adventures. 
            Utilisez la commande <code className="text-valthera-400">/create</code> sur Discord pour commencer votre aventure !
          </p>
          <a
            href="/invite"
            className="btn-primary"
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
