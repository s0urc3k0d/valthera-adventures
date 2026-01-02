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
        <Shield className="w-20 h-20 text-valthera-600 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-valthera-100 font-medieval mb-4">
          Aucune Guilde
        </h2>
        <p className="text-valthera-200/60 max-w-md mx-auto mb-6 font-body">
          Vous n'êtes membre d'aucune guilde pour le moment. 
          Rejoignez ou créez une guilde sur Discord avec la commande{' '}
          <code className="text-valthera-400 bg-valthera-800/50 px-2 py-0.5 rounded">/guild</code>
        </p>
        <div className="flex justify-center gap-4">
          <div className="card p-4 text-center">
            <div className="text-sm text-valthera-200/60 mb-2 font-body">Créer une guilde</div>
            <code className="text-valthera-400 text-sm">/guild create</code>
          </div>
          <div className="card p-4 text-center">
            <div className="text-sm text-valthera-200/60 mb-2 font-body">Rejoindre</div>
            <code className="text-valthera-400 text-sm">/guild join</code>
          </div>
        </div>
      </div>
    );
  }

  const isLeader = guild.leaderId === character.userId;
  const isOfficer = guild.officers?.includes(character.userId);
  const memberInfo = guild.members.find((m) => m.playerId === character.userId);

  // Calculer XP pour niveau suivant
  const xpForNextLevel = guild.level * 5000;
  const xpProgress = (guild.experience / xpForNextLevel) * 100;

  return (
    <div className="space-y-6">
      {/* Header Guilde */}
      <div className="card p-6">
        <div className="flex items-start gap-6">
          {/* Logo/Badge */}
          <div className="w-20 h-20 bg-gradient-to-br from-valthera-600 to-valthera-500 rounded-2xl flex items-center justify-center flex-shrink-0 border border-valthera-400/30">
            <span className="text-3xl font-bold text-valthera-100 font-medieval">
              {guild.tag}
            </span>
          </div>

          {/* Infos */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-valthera-100 font-medieval">
                {guild.name}
              </h1>
              <span className="badge bg-valthera-600/30 text-valthera-300 border border-valthera-500/30">Nv.{guild.level}</span>
              {isLeader && (
                <span className="badge-gold flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Chef
                </span>
              )}
              {!isLeader && isOfficer && (
                <span className="badge bg-rarity-rare/20 text-rarity-rare flex items-center gap-1 border border-rarity-rare/30">
                  <Star className="w-3 h-3" /> Officier
                </span>
              )}
            </div>

            {guild.description && (
              <p className="text-valthera-200/60 mb-4 font-body">{guild.description}</p>
            )}

            {/* Barre XP Guilde */}
            <div className="max-w-md">
              <div className="flex items-center justify-between text-xs text-valthera-200/60 mb-1 font-body">
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
            <div className="flex items-center gap-2 text-valthera-400">
              <Coins className="w-5 h-5" />
              <span className="text-2xl font-bold font-medieval">
                {guild.treasury.toLocaleString()}
              </span>
            </div>
            <div className="text-sm text-valthera-200/60 font-body">Trésorerie</div>
          </div>
        </div>
      </div>

      {/* Stats Guilde */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <Users className="w-6 h-6 text-rarity-rare mx-auto mb-2" />
          <div className="text-2xl font-bold text-valthera-100">{guild.members.length}</div>
          <div className="text-sm text-valthera-200/60 font-body">Membres</div>
        </div>
        <div className="card p-4 text-center">
          <Star className="w-6 h-6 text-rarity-epic mx-auto mb-2" />
          <div className="text-2xl font-bold text-valthera-100">{guild.officers?.length || 0}</div>
          <div className="text-sm text-valthera-200/60 font-body">Officiers</div>
        </div>
        <div className="card p-4 text-center">
          <Shield className="w-6 h-6 text-valthera-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-valthera-100">{guild.level}</div>
          <div className="text-sm text-valthera-200/60 font-body">Niveau</div>
        </div>
        <div className="card p-4 text-center">
          <Coins className="w-6 h-6 text-valthera-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-valthera-100">{guild.treasury.toLocaleString()}</div>
          <div className="text-sm text-valthera-200/60 font-body">Trésorerie</div>
        </div>
      </div>

      {/* Liste des membres */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-valthera-100 font-medieval mb-6">
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
                const isCurrentUser = member.playerId === character.userId;
                const isMemberLeader = member.playerId === guild.leaderId;
                const isMemberOfficer = guild.officers?.includes(member.playerId);

                return (
                  <tr
                    key={member.playerId}
                    className={isCurrentUser ? 'bg-valthera-500/10' : ''}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-valthera-700 flex items-center justify-center">
                          <Users className="w-4 h-4 text-valthera-300" />
                        </div>
                        <span className={isCurrentUser ? 'text-valthera-400 font-medium' : 'text-valthera-100'}>
                          {member.playerName || member.characterName || member.playerId.slice(0, 8) + '...'}
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
                        <span className="badge bg-rarity-rare/20 text-rarity-rare flex items-center gap-1 w-fit border border-rarity-rare/30">
                          <Star className="w-3 h-3" /> Officier
                        </span>
                      ) : (
                        <span className="badge bg-valthera-700/50 text-valthera-200 w-fit border border-valthera-600/30">
                          {member.rank || 'Membre'}
                        </span>
                      )}
                    </td>
                    <td className="text-valthera-200/60">
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
