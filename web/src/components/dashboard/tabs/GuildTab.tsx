'use client';

import { Shield, Users, Crown, Star, Coins } from 'lucide-react';
import type { IGuild, ICharacter } from '@/lib/models';

interface GuildTabProps {
  guild: IGuild | null;
  character: ICharacter;
}

export function GuildTab({ guild, character }: GuildTabProps) {
  if (!guild) {
    return (
      <div className="card p-12 text-center">
        <Shield className="w-20 h-20 text-gray-600 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white font-medieval mb-4">
          Aucune Guilde
        </h2>
        <p className="text-gray-400 max-w-md mx-auto mb-6">
          Vous n'êtes membre d'aucune guilde pour le moment. 
          Rejoignez ou créez une guilde sur Discord avec la commande{' '}
          <code className="text-valthera-400">/guild</code>
        </p>
        <div className="flex justify-center gap-4">
          <div className="card p-4 text-center">
            <div className="text-sm text-gray-400 mb-2">Créer une guilde</div>
            <code className="text-valthera-400 text-sm">/guild create</code>
          </div>
          <div className="card p-4 text-center">
            <div className="text-sm text-gray-400 mb-2">Rejoindre</div>
            <code className="text-valthera-400 text-sm">/guild join</code>
          </div>
        </div>
      </div>
    );
  }

  const isLeader = guild.leaderId === character.odiscordUserId;
  const isOfficer = guild.officers?.includes(character.odiscordUserId);
  const memberInfo = guild.members.find((m) => m.odiscordUserId === character.odiscordUserId);

  // Calculer XP pour niveau suivant
  const xpForNextLevel = guild.level * 5000;
  const xpProgress = (guild.experience / xpForNextLevel) * 100;

  return (
    <div className="space-y-6">
      {/* Header Guilde */}
      <div className="card p-6">
        <div className="flex items-start gap-6">
          {/* Logo/Badge */}
          <div className="w-20 h-20 bg-gradient-to-br from-valthera-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-3xl font-bold text-white font-medieval">
              {guild.tag}
            </span>
          </div>

          {/* Infos */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white font-medieval">
                {guild.name}
              </h1>
              <span className="badge-primary">Nv.{guild.level}</span>
              {isLeader && (
                <span className="badge-gold flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Chef
                </span>
              )}
              {!isLeader && isOfficer && (
                <span className="badge bg-blue-500/20 text-blue-300 flex items-center gap-1">
                  <Star className="w-3 h-3" /> Officier
                </span>
              )}
            </div>

            {guild.description && (
              <p className="text-gray-400 mb-4">{guild.description}</p>
            )}

            {/* Barre XP Guilde */}
            <div className="max-w-md">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Expérience de guilde</span>
                <span>{guild.experience.toLocaleString()} / {xpForNextLevel.toLocaleString()}</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill progress-xp"
                  style={{ width: `${Math.min(xpProgress, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Trésorerie */}
          <div className="text-right">
            <div className="flex items-center gap-2 text-amber-400">
              <Coins className="w-5 h-5" />
              <span className="text-2xl font-bold font-medieval">
                {guild.treasury.toLocaleString()}
              </span>
            </div>
            <div className="text-sm text-gray-400">Trésorerie</div>
          </div>
        </div>
      </div>

      {/* Stats Guilde */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{guild.members.length}</div>
          <div className="text-sm text-gray-400">Membres</div>
        </div>
        <div className="card p-4 text-center">
          <Star className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{guild.officers?.length || 0}</div>
          <div className="text-sm text-gray-400">Officiers</div>
        </div>
        <div className="card p-4 text-center">
          <Shield className="w-6 h-6 text-valthera-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{guild.level}</div>
          <div className="text-sm text-gray-400">Niveau</div>
        </div>
        <div className="card p-4 text-center">
          <Coins className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{guild.treasury.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Trésorerie</div>
        </div>
      </div>

      {/* Liste des membres */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-white font-medieval mb-6">
          Membres ({guild.members.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="table-dark">
            <thead>
              <tr>
                <th>Membre</th>
                <th>Rang</th>
                <th>Rejoint le</th>
              </tr>
            </thead>
            <tbody>
              {guild.members.map((member) => {
                const isCurrentUser = member.odiscordUserId === character.odiscordUserId;
                const isMemberLeader = member.odiscordUserId === guild.leaderId;
                const isMemberOfficer = guild.officers?.includes(member.odiscordUserId);

                return (
                  <tr
                    key={member.odiscordUserId}
                    className={isCurrentUser ? 'bg-valthera-500/10' : ''}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                          <Users className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className={isCurrentUser ? 'text-valthera-400 font-medium' : 'text-white'}>
                          {member.odiscordUserId.slice(0, 8)}...
                          {isCurrentUser && ' (Vous)'}
                        </span>
                      </div>
                    </td>
                    <td>
                      {isMemberLeader ? (
                        <span className="badge-gold flex items-center gap-1 w-fit">
                          <Crown className="w-3 h-3" /> Chef
                        </span>
                      ) : isMemberOfficer ? (
                        <span className="badge bg-blue-500/20 text-blue-300 flex items-center gap-1 w-fit">
                          <Star className="w-3 h-3" /> Officier
                        </span>
                      ) : (
                        <span className="badge bg-gray-500/20 text-gray-300 w-fit">
                          {member.rank || 'Membre'}
                        </span>
                      )}
                    </td>
                    <td className="text-gray-400">
                      {new Date(member.joinedAt).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
