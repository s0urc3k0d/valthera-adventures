'use client';

import { ScrollText, CheckCircle, Clock, XCircle } from 'lucide-react';
import type { ICharacterQuest } from '@/lib/models';
import { getQuestTitle, getQuestDescription, calculateQuestProgress } from '@/lib/gameData';

interface QuestsTabProps {
  quests: ICharacterQuest[];
}

const statusConfig = {
  active: { icon: Clock, color: 'text-rarity-rare', bg: 'bg-rarity-rare/20', label: 'En cours' },
  completed: { icon: CheckCircle, color: 'text-forest-400', bg: 'bg-forest-500/20', label: 'Terminée' },
  failed: { icon: XCircle, color: 'text-blood-400', bg: 'bg-blood-500/20', label: 'Échouée' },
};

export function QuestsTab({ quests }: QuestsTabProps) {
  const activeQuests = quests.filter((q) => q.status === 'active');
  const completedQuests = quests.filter((q) => q.status === 'completed');
  const failedQuests = quests.filter((q) => q.status === 'failed');

  const QuestCard = ({ quest }: { quest: ICharacterQuest }) => {
    const config = statusConfig[quest.status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    // Get quest details from game data
    const questTitle = getQuestTitle(quest.questId);
    const questDescription = getQuestDescription(quest.questId);

    // Calculate real progress based on quest objectives
    const progress = quest.progress || {};
    const progressPercent = calculateQuestProgress(quest.questId, progress);

    return (
      <div className="card-hover p-4">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 ${config.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-valthera-100 font-medium truncate font-medieval">
                {questTitle}
              </h3>
              <span className={`badge ${config.bg} ${config.color}`}>
                {config.label}
              </span>
            </div>

            {questDescription && (
              <p className="text-sm text-valthera-200/60 font-body mb-2 line-clamp-2">
                {questDescription}
              </p>
            )}

            {quest.status === 'active' && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-valthera-200/60 mb-1 font-body">
                  <span>Progression</span>
                  <span>{Math.round(progressPercent * 100)}%</span>
                </div>
                <div className="progress-bar h-2">
                  <div
                    className="progress-fill bg-valthera-500"
                    style={{ width: `${progressPercent * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="text-xs text-valthera-200/50 mt-2 font-body">
              Commencée le {new Date(quest.startedAt).toLocaleDateString('fr-FR')}
              {quest.completedAt && (
                <> • Terminée le {new Date(quest.completedAt).toLocaleDateString('fr-FR')}</>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats quêtes */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-rarity-rare">{activeQuests.length}</div>
          <div className="text-sm text-valthera-200/60 font-body">En cours</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-forest-400">{completedQuests.length}</div>
          <div className="text-sm text-valthera-200/60 font-body">Terminées</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blood-400">{failedQuests.length}</div>
          <div className="text-sm text-valthera-200/60 font-body">Échouées</div>
        </div>
      </div>

      {/* Quêtes actives */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-valthera-100 font-medieval mb-6">
          Quêtes Actives ({activeQuests.length})
        </h2>

        {activeQuests.length > 0 ? (
          <div className="space-y-4">
            {activeQuests.map((quest) => (
              <QuestCard key={`${quest.questId}-${quest.startedAt}`} quest={quest} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ScrollText className="w-12 h-12 text-valthera-600 mx-auto mb-3" />
            <p className="text-valthera-200/50 font-body">Aucune quête active</p>
            <p className="text-valthera-200/40 text-sm mt-1 font-body">
              Parlez aux PNJ avec /talk pour découvrir des quêtes
            </p>
          </div>
        )}
      </div>

      {/* Quêtes terminées */}
      {completedQuests.length > 0 && (
        <div className="card p-6">
          <h2 className="text-xl font-bold text-valthera-100 font-medieval mb-6">
            Quêtes Terminées ({completedQuests.length})
          </h2>
          <div className="space-y-4">
            {completedQuests.slice(0, 5).map((quest) => (
              <QuestCard key={`${quest.questId}-${quest.completedAt}`} quest={quest} />
            ))}
            {completedQuests.length > 5 && (
              <p className="text-valthera-200/50 text-sm text-center font-body">
                Et {completedQuests.length - 5} autres quêtes terminées...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
