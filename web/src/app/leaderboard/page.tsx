import { Trophy, Medal, Crown, Coins, Sword, ScrollText } from 'lucide-react';
import { connectDB } from '@/lib/mongodb';
import { Character, Guild } from '@/lib/models';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Classements',
  description: 'Les meilleurs aventuriers de Valthera',
};

export const revalidate = 300; // Revalidate every 5 minutes

async function getLeaderboardData() {
  await connectDB();

  const [topLevel, topGold, topKills, topQuests, topGuilds] = await Promise.all([
    // Top par niveau
    Character.find()
      .sort({ level: -1, experience: -1 })
      .limit(10)
      .select('name race class level experience')
      .lean(),
    // Top par or
    Character.find()
      .sort({ gold: -1 })
      .limit(10)
      .select('name race class gold level')
      .lean(),
    // Top par monstres tués
    Character.find()
      .sort({ 'statistics.monstersKilled': -1 })
      .limit(10)
      .select('name race class statistics.monstersKilled level')
      .lean(),
    // Top par quêtes
    Character.find()
      .sort({ 'statistics.questsCompleted': -1 })
      .limit(10)
      .select('name race class statistics.questsCompleted level')
      .lean(),
    // Top guildes
    Guild.find()
      .sort({ level: -1, experience: -1 })
      .limit(5)
      .select('name tag level members treasury')
      .lean(),
  ]);

  return { topLevel, topGold, topKills, topQuests, topGuilds };
}

const rankColors = ['text-valthera-400', 'text-steel-300', 'text-valthera-600', 'text-valthera-200/60', 'text-valthera-200/60'];
const rankIcons = [Crown, Medal, Medal, null, null];

export default async function LeaderboardPage() {
  const { topLevel, topGold, topKills, topQuests, topGuilds } = await getLeaderboardData();

  const LeaderboardTable = ({ 
    data, 
    valueKey, 
    valueLabel, 
    formatValue = (v: any) => v?.toLocaleString() || '0',
    icon: Icon 
  }: { 
    data: any[]; 
    valueKey: string; 
    valueLabel: string;
    formatValue?: (v: any) => string;
    icon: any;
  }) => (
    <div className="card overflow-hidden">
      <div className="bg-valthera-800/50 px-6 py-4 border-b border-valthera-700 flex items-center gap-3">
        <Icon className="w-5 h-5 text-valthera-400" />
        <h2 className="text-lg font-semibold text-valthera-100 font-medieval">{valueLabel}</h2>
      </div>
      <div className="divide-y divide-valthera-700/50">
        {data.length > 0 ? (
          data.map((player: any, index: number) => {
            const RankIcon = rankIcons[index];
            const value = valueKey.includes('.') 
              ? valueKey.split('.').reduce((o, k) => o?.[k], player)
              : player[valueKey];

            return (
              <div
                key={player._id?.toString() || index}
                className={`flex items-center gap-4 px-6 py-4 hover:bg-valthera-800/30 transition-colors ${
                  index === 0 ? 'bg-valthera-500/10' : ''
                }`}
              >
                {/* Rank */}
                <div className={`w-8 text-center font-bold ${rankColors[index] || 'text-valthera-200/40'}`}>
                  {RankIcon ? (
                    <RankIcon className="w-6 h-6 mx-auto" />
                  ) : (
                    <span>#{index + 1}</span>
                  )}
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-valthera-100 font-medium truncate font-medieval">{player.name}</div>
                  <div className="text-sm text-valthera-200/60 font-body">
                    {player.race} • {player.class} • Nv.{player.level}
                  </div>
                </div>

                {/* Value */}
                <div className={`text-lg font-bold ${index === 0 ? 'text-valthera-400' : 'text-valthera-100'}`}>
                  {formatValue(value)}
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-6 py-8 text-center text-valthera-200/50 font-body">
            Aucun joueur pour le moment
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-valthera-500/20 rounded-2xl flex items-center justify-center border border-valthera-500/30">
            <Trophy className="w-10 h-10 text-valthera-400" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-valthera-100 font-medieval mb-4">
          Classements
        </h1>
        <p className="text-valthera-200/70 font-body">
          Les héros les plus accomplis de Valthera
        </p>
      </div>

      {/* Leaderboards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeaderboardTable
          data={topLevel}
          valueKey="level"
          valueLabel="Top Niveau"
          formatValue={(v) => `Nv.${v}`}
          icon={Crown}
        />

        <LeaderboardTable
          data={topGold}
          valueKey="gold"
          valueLabel="Top Richesse"
          formatValue={(v) => `${v?.toLocaleString() || 0} 💰`}
          icon={Coins}
        />

        <LeaderboardTable
          data={topKills}
          valueKey="statistics.monstersKilled"
          valueLabel="Top Chasseurs"
          formatValue={(v) => `${v?.toLocaleString() || 0} kills`}
          icon={Sword}
        />

        <LeaderboardTable
          data={topQuests}
          valueKey="statistics.questsCompleted"
          valueLabel="Top Aventuriers"
          formatValue={(v) => `${v || 0} quêtes`}
          icon={ScrollText}
        />
      </div>

      {/* Guild Leaderboard */}
      <div className="mt-12">
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-r from-valthera-700 via-valthera-600 to-valthera-500 px-6 py-6 border-b border-valthera-700">
            <h2 className="text-2xl font-bold text-valthera-100 font-medieval flex items-center gap-3">
              <Trophy className="w-8 h-8" />
              Meilleures Guildes
            </h2>
          </div>
          <div className="divide-y divide-valthera-700/50">
            {topGuilds.length > 0 ? (
              topGuilds.map((guild: any, index: number) => (
                <div
                  key={guild._id?.toString() || index}
                  className={`flex items-center gap-6 px-6 py-6 hover:bg-valthera-800/30 transition-colors ${
                    index === 0 ? 'bg-valthera-500/10' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className={`text-2xl font-bold ${rankColors[index] || 'text-valthera-200/40'}`}>
                    #{index + 1}
                  </div>

                  {/* Guild Badge */}
                  <div className="w-14 h-14 bg-gradient-to-br from-valthera-600 to-valthera-500 rounded-xl flex items-center justify-center flex-shrink-0 border border-valthera-400/30">
                    <span className="text-xl font-bold text-valthera-100">{guild.tag}</span>
                  </div>

                  {/* Guild Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xl text-valthera-100 font-medium truncate font-medieval">{guild.name}</div>
                    <div className="text-sm text-valthera-200/60 font-body">
                      {guild.members?.length || 0} membres • Nv.{guild.level}
                    </div>
                  </div>

                  {/* Treasury */}
                  <div className="text-right">
                    <div className="text-lg font-bold text-valthera-400">
                      {guild.treasury?.toLocaleString() || 0} 💰
                    </div>
                    <div className="text-sm text-valthera-200/50 font-body">Trésorerie</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center text-valthera-200/50 font-body">
                Aucune guilde pour le moment. Créez la première avec /guild create !
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
