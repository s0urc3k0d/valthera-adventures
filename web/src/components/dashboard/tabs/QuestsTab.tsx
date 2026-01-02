'use client';

import { ScrollText, CheckCircle, Clock, XCircle } from 'lucide-react';
import type { IQuest } from '@/lib/models';

interface QuestsTabProps {
  quests: IQuest[];
}

const statusConfig = {
  active: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'En cours' },
  completed: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Terminée' },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Échouée' },
};

export function QuestsTab({ quests }: QuestsTabProps) {
  const activeQuests = quests.filter((q) => q.status === 'active');
  const completedQuests = quests.filter((q) => q.status === 'completed');
  const failedQuests = quests.filter((q) => q.status === 'failed');

  const QuestCard = ({ quest }: { quest: IQuest }) => {
    const config = statusConfig[quest.status];
    const Icon = config.icon;

    // Calculer la progression
    const progressEntries = quest.progress ? Object.entries(quest.progress) : [];
    const totalProgress = progressEntries.length > 0
      ? progressEntries.reduce((acc, [_, val]) => acc + (val as number), 0) / progressEntries.length
      : 0;

    return (
      <div className="card-hover p-4">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 ${config.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-medium truncate">
                {quest.questId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </h3>
              <span className={`badge ${config.bg} ${config.color}`}>
                {config.label}
              </span>
            </div>

            {quest.status === 'active' && progressEntries.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>Progression</span>
                  <span>{Math.round(totalProgress * 100)}%</span>
                </div>
                <div className="progress-bar h-2">
                  <div
                    className="progress-fill bg-valthera-500"
                    style={{ width: `${totalProgress * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500 mt-2">
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
          <div className="text-2xl font-bold text-blue-400">{activeQuests.length}</div>
          <div className="text-sm text-gray-400">En cours</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{completedQuests.length}</div>
          <div className="text-sm text-gray-400">Terminées</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{failedQuests.length}</div>
          <div className="text-sm text-gray-400">Échouées</div>
        </div>
      </div>

      {/* Quêtes actives */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-white font-medieval mb-6">
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
            <ScrollText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">Aucune quête active</p>
            <p className="text-gray-600 text-sm mt-1">
              Parlez aux PNJ avec /talk pour découvrir des quêtes
            </p>
          </div>
        )}
      </div>

      {/* Quêtes terminées */}
      {completedQuests.length > 0 && (
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white font-medieval mb-6">
            Quêtes Terminées ({completedQuests.length})
          </h2>
          <div className="space-y-4">
            {completedQuests.slice(0, 5).map((quest) => (
              <QuestCard key={`${quest.questId}-${quest.completedAt}`} quest={quest} />
            ))}
            {completedQuests.length > 5 && (
              <p className="text-gray-500 text-sm text-center">
                Et {completedQuests.length - 5} autres quêtes terminées...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
