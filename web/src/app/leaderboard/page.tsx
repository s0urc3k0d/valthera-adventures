import { Trophy, Medal, Crown, Coins, Sword, ScrollText } from 'lucide-react';
import { connectDB } from '@/lib/mongodb';
import { Character, Guild } from '@/lib/models';

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

const rankColors = ['text-amber-400', 'text-gray-300', 'text-amber-600', 'text-gray-400', 'text-gray-400'];
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
      <div className="bg-gray-800/50 px-6 py-4 border-b border-gray-800 flex items-center gap-3">
        <Icon className="w-5 h-5 text-valthera-400" />
        <h2 className="text-lg font-semibold text-white">{valueLabel}</h2>
      </div>
      <div className="divide-y divide-gray-800">
        {data.length > 0 ? (
          data.map((player: any, index: number) => {
            const RankIcon = rankIcons[index];
            const value = valueKey.includes('.') 
              ? valueKey.split('.').reduce((o, k) => o?.[k], player)
              : player[valueKey];

            return (
              <div
                key={player._id?.toString() || index}
                className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-800/30 transition-colors ${
                  index === 0 ? 'bg-amber-500/5' : ''
                }`}
              >
                {/* Rank */}
                <div className={`w-8 text-center font-bold ${rankColors[index] || 'text-gray-500'}`}>
                  {RankIcon ? (
                    <RankIcon className="w-6 h-6 mx-auto" />
                  ) : (
                    <span>#{index + 1}</span>
                  )}
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">{player.name}</div>
                  <div className="text-sm text-gray-500">
                    {player.race} • {player.class} • Nv.{player.level}
                  </div>
                </div>

                {/* Value */}
                <div className={`text-lg font-bold ${index === 0 ? 'text-amber-400' : 'text-white'}`}>
                  {formatValue(value)}
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
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
          <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center">
            <Trophy className="w-10 h-10 text-amber-400" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white font-medieval mb-4">
          Classements
        </h1>
        <p className="text-gray-400">
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
          <div className="bg-gradient-to-r from-valthera-600 to-purple-600 px-6 py-6 border-b border-gray-800">
            <h2 className="text-2xl font-bold text-white font-medieval flex items-center gap-3">
              <Trophy className="w-8 h-8" />
              Meilleures Guildes
            </h2>
          </div>
          <div className="divide-y divide-gray-800">
            {topGuilds.length > 0 ? (
              topGuilds.map((guild: any, index: number) => (
                <div
                  key={guild._id?.toString() || index}
                  className={`flex items-center gap-6 px-6 py-6 hover:bg-gray-800/30 transition-colors ${
                    index === 0 ? 'bg-valthera-500/5' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className={`text-2xl font-bold ${rankColors[index] || 'text-gray-500'}`}>
                    #{index + 1}
                  </div>

                  {/* Guild Badge */}
                  <div className="w-14 h-14 bg-gradient-to-br from-valthera-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-white">{guild.tag}</span>
                  </div>

                  {/* Guild Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xl text-white font-medium truncate">{guild.name}</div>
                    <div className="text-sm text-gray-500">
                      {guild.members?.length || 0} membres • Nv.{guild.level}
                    </div>
                  </div>

                  {/* Treasury */}
                  <div className="text-right">
                    <div className="text-lg font-bold text-amber-400">
                      {guild.treasury?.toLocaleString() || 0} 💰
                    </div>
                    <div className="text-sm text-gray-500">Trésorerie</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">
                Aucune guilde pour le moment. Créez la première avec /guild create !
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
