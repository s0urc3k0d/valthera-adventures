/**
 * Service de gestion des quêtes
 * Acceptation, progression, complétion et récompenses
 */

import Character from '../models/Character.js';
import { getItem, addToInventory } from './itemService.js';
import logger from './logger.js';
import questsData from '../data/quests.json' assert { type: 'json' };
import factionsData from '../data/factions.json' assert { type: 'json' };

/**
 * Récupère une quête par son ID
 */
export function getQuest(questId) {
  return questsData[questId] || null;
}

/**
 * Récupère toutes les quêtes
 */
export function getAllQuests() {
  return Object.values(questsData);
}

/**
 * Récupère les quêtes par type
 */
export function getQuestsByType(type) {
  return Object.values(questsData).filter(q => q.type === type);
}

/**
 * Vérifie si un personnage peut accepter une quête
 */
export function canAcceptQuest(character, questId) {
  const quest = getQuest(questId);
  if (!quest) return { canAccept: false, reason: 'Quête introuvable.' };
  
  // Vérifier si déjà active ou complétée
  const existingQuest = character.quests?.find(q => q.questId === questId);
  if (existingQuest) {
    if (existingQuest.status === 'active') {
      return { canAccept: false, reason: 'Vous avez déjà cette quête en cours.' };
    }
    if (existingQuest.status === 'completed' && !quest.isRepeatable) {
      return { canAccept: false, reason: 'Vous avez déjà terminé cette quête.' };
    }
    if (existingQuest.status === 'completed' && quest.isRepeatable) {
      // Vérifier le cooldown
      const timeSinceCompletion = Date.now() - new Date(existingQuest.completedAt).getTime();
      if (timeSinceCompletion < (quest.repeatCooldown || 0)) {
        const remaining = Math.ceil((quest.repeatCooldown - timeSinceCompletion) / 3600000);
        return { canAccept: false, reason: `Vous devez attendre ${remaining}h avant de refaire cette quête.` };
      }
    }
  }
  
  // Vérifier le niveau
  if (quest.prerequisites?.level && character.level < quest.prerequisites.level) {
    return { canAccept: false, reason: `Niveau ${quest.prerequisites.level} requis.` };
  }
  
  // Vérifier les quêtes prérequises
  if (quest.prerequisites?.quests?.length > 0) {
    for (const prereqId of quest.prerequisites.quests) {
      const prereq = character.quests?.find(q => q.questId === prereqId && q.status === 'completed');
      if (!prereq) {
        const prereqQuest = getQuest(prereqId);
        return { canAccept: false, reason: `Vous devez d'abord compléter "${prereqQuest?.title || prereqId}".` };
      }
    }
  }
  
  // Vérifier la réputation requise
  if (quest.prerequisites?.reputation?.length > 0) {
    for (const rep of quest.prerequisites.reputation) {
      const currentRep = character.reputation?.get(rep.factionId) || 0;
      if (currentRep < rep.amount) {
        const faction = factionsData[rep.factionId];
        return { canAccept: false, reason: `Réputation insuffisante avec ${faction?.name || rep.factionId}.` };
      }
    }
  }
  
  // Vérifier la classe
  if (quest.prerequisites?.class?.length > 0) {
    if (!quest.prerequisites.class.includes(character.class.toLowerCase())) {
      return { canAccept: false, reason: 'Cette quête n\'est pas disponible pour votre classe.' };
    }
  }
  
  // Vérifier la race
  if (quest.prerequisites?.race?.length > 0) {
    if (!quest.prerequisites.race.includes(character.race.toLowerCase())) {
      return { canAccept: false, reason: 'Cette quête n\'est pas disponible pour votre race.' };
    }
  }
  
  return { canAccept: true, reason: null };
}

/**
 * Accepte une quête pour un personnage
 */
export async function acceptQuest(character, questId) {
  const quest = getQuest(questId);
  if (!quest) return { success: false, error: 'Quête introuvable.' };
  
  const check = canAcceptQuest(character, questId);
  if (!check.canAccept) return { success: false, error: check.reason };
  
  // Initialiser le tableau de quêtes si nécessaire
  if (!character.quests) character.quests = [];
  
  // Supprimer l'ancienne entrée si répétable
  const existingIndex = character.quests.findIndex(q => q.questId === questId);
  if (existingIndex !== -1) {
    character.quests.splice(existingIndex, 1);
  }
  
  // Créer le suivi de progression
  const progress = {};
  for (const obj of quest.objectives) {
    progress[obj.id] = { current: 0, required: obj.required, completed: false };
  }
  
  // Ajouter la quête
  character.quests.push({
    questId,
    status: 'active',
    progress,
    startedAt: new Date(),
    completedAt: null,
  });
  
  await character.save();
  
  logger.game(`Quête acceptée: ${quest.title}`, {
    userId: character.userId,
    questId,
  });
  
  return { success: true, quest };
}

/**
 * Met à jour la progression d'un objectif
 */
export async function updateQuestProgress(character, objectiveType, target, amount = 1) {
  const updates = [];
  
  if (!character.quests) return updates;
  
  for (const questEntry of character.quests) {
    if (questEntry.status !== 'active') continue;
    
    const quest = getQuest(questEntry.questId);
    if (!quest) continue;
    
    for (const objective of quest.objectives) {
      // Vérifier si l'objectif correspond
      if (objective.type !== objectiveType) continue;
      if (objective.target !== target && objective.target !== 'any' && objective.target !== 'any_other') continue;
      
      // Vérifier l'ordre des objectifs séquentiels
      if (objective.order > 1) {
        const prevObjectives = quest.objectives.filter(o => o.order < objective.order);
        const allPrevComplete = prevObjectives.every(o => questEntry.progress[o.id]?.completed);
        if (!allPrevComplete) continue;
      }
      
      // Mettre à jour la progression
      const prog = questEntry.progress[objective.id];
      if (prog && !prog.completed) {
        prog.current = Math.min(prog.current + amount, prog.required);
        
        if (prog.current >= prog.required) {
          prog.completed = true;
          updates.push({
            questId: quest.id,
            questTitle: quest.title,
            objectiveId: objective.id,
            objectiveDesc: objective.description,
            completed: true,
          });
        } else {
          updates.push({
            questId: quest.id,
            questTitle: quest.title,
            objectiveId: objective.id,
            objectiveDesc: objective.description,
            current: prog.current,
            required: prog.required,
          });
        }
      }
    }
    
    // Vérifier si la quête est terminée
    const allComplete = quest.objectives
      .filter(o => !o.optional)
      .every(o => questEntry.progress[o.id]?.completed);
    
    if (allComplete && questEntry.status === 'active') {
      questEntry.status = 'ready_to_complete';
    }
  }
  
  if (updates.length > 0) {
    await character.save();
  }
  
  return updates;
}

/**
 * Complète une quête et donne les récompenses
 */
export async function completeQuest(character, questId) {
  const questEntry = character.quests?.find(q => q.questId === questId);
  if (!questEntry) return { success: false, error: 'Quête non trouvée dans votre journal.' };
  
  const quest = getQuest(questId);
  if (!quest) return { success: false, error: 'Quête introuvable.' };
  
  // Vérifier si tous les objectifs obligatoires sont complétés
  const allComplete = quest.objectives
    .filter(o => !o.optional)
    .every(o => questEntry.progress[o.id]?.completed);
  
  if (!allComplete) {
    return { success: false, error: 'Vous n\'avez pas terminé tous les objectifs.' };
  }
  
  // Donner les récompenses
  const rewards = { xp: 0, gold: 0, items: [], reputation: [] };
  
  // XP
  if (quest.rewards.xp) {
    character.xp += quest.rewards.xp;
    rewards.xp = quest.rewards.xp;
  }
  
  // Or
  if (quest.rewards.gold) {
    character.gold.gold += quest.rewards.gold;
    rewards.gold = quest.rewards.gold;
  }
  
  // Items
  if (quest.rewards.items?.length > 0) {
    for (const itemReward of quest.rewards.items) {
      // Vérifier la chance de drop
      if (itemReward.chance && Math.random() * 100 > itemReward.chance) continue;
      
      const item = getItem(itemReward.itemId);
      if (item) {
        addToInventory(character, itemReward.itemId, itemReward.quantity || 1);
        rewards.items.push({ item, quantity: itemReward.quantity || 1 });
      }
    }
  }
  
  // Réputation
  if (quest.rewards.reputation?.length > 0) {
    for (const rep of quest.rewards.reputation) {
      const currentRep = character.reputation?.get(rep.factionId) || 0;
      if (!character.reputation) character.reputation = new Map();
      character.reputation.set(rep.factionId, currentRep + rep.amount);
      rewards.reputation.push({
        factionId: rep.factionId,
        faction: factionsData[rep.factionId],
        amount: rep.amount,
        newTotal: currentRep + rep.amount,
      });
    }
  }
  
  // Marquer comme complétée
  questEntry.status = 'completed';
  questEntry.completedAt = new Date();
  
  // Mettre à jour les stats
  character.stats.questsCompleted = (character.stats.questsCompleted || 0) + 1;
  
  await character.save();
  
  logger.game(`Quête complétée: ${quest.title}`, {
    userId: character.userId,
    questId,
    rewards,
  });
  
  return { success: true, quest, rewards };
}

/**
 * Abandonne une quête
 */
export async function abandonQuest(character, questId) {
  const questIndex = character.quests?.findIndex(q => q.questId === questId && q.status === 'active');
  if (questIndex === -1) return { success: false, error: 'Quête non trouvée ou déjà terminée.' };
  
  const quest = getQuest(questId);
  
  // Marquer comme abandonnée
  character.quests[questIndex].status = 'abandoned';
  await character.save();
  
  logger.game(`Quête abandonnée: ${quest?.title || questId}`, {
    userId: character.userId,
    questId,
  });
  
  return { success: true, quest };
}

/**
 * Récupère les quêtes actives d'un personnage
 */
export function getActiveQuests(character) {
  if (!character.quests) return [];
  
  return character.quests
    .filter(q => q.status === 'active' || q.status === 'ready_to_complete')
    .map(q => {
      const quest = getQuest(q.questId);
      return {
        ...quest,
        progress: q.progress,
        status: q.status,
        startedAt: q.startedAt,
      };
    })
    .filter(Boolean);
}

/**
 * Récupère les quêtes complétées d'un personnage
 */
export function getCompletedQuests(character) {
  if (!character.quests) return [];
  
  return character.quests
    .filter(q => q.status === 'completed')
    .map(q => {
      const quest = getQuest(q.questId);
      return {
        ...quest,
        completedAt: q.completedAt,
      };
    })
    .filter(Boolean);
}

/**
 * Récupère les quêtes disponibles pour un personnage (non acceptées)
 */
export function getAvailableQuests(character, location = null) {
  const available = [];
  
  for (const quest of Object.values(questsData)) {
    // Filtrer par location si spécifié
    if (location && quest.giver?.location !== location) continue;
    
    // Vérifier si le personnage peut accepter
    const check = canAcceptQuest(character, quest.id);
    if (check.canAccept) {
      available.push(quest);
    }
  }
  
  return available;
}

/**
 * Récupère le rang d'un personnage dans une faction
 */
export function getFactionRank(character, factionId) {
  const faction = factionsData[factionId];
  if (!faction) return null;
  
  const rep = character.reputation?.get(factionId) || 0;
  
  let currentRank = faction.ranks[0];
  for (const rank of faction.ranks) {
    if (rep >= rank.minRep) {
      currentRank = rank;
    } else {
      break;
    }
  }
  
  // Trouver le prochain rang
  const currentIndex = faction.ranks.findIndex(r => r.name === currentRank.name);
  const nextRank = faction.ranks[currentIndex + 1] || null;
  
  return {
    faction,
    currentRank,
    nextRank,
    currentRep: rep,
    toNextRank: nextRank ? nextRank.minRep - rep : 0,
  };
}

/**
 * Récupère toutes les réputations d'un personnage
 */
export function getAllReputations(character) {
  const reputations = [];
  
  for (const [factionId, faction] of Object.entries(factionsData)) {
    if (faction.hidden) {
      // Ne montrer que si le joueur a de la réputation
      const rep = character.reputation?.get(factionId) || 0;
      if (rep <= 0) continue;
    }
    
    const rankInfo = getFactionRank(character, factionId);
    if (rankInfo) {
      reputations.push(rankInfo);
    }
  }
  
  return reputations;
}

/**
 * Vérifie si un objectif de type "talk" est valide
 */
export async function checkTalkObjective(character, npcId) {
  return await updateQuestProgress(character, 'talk', npcId, 1);
}

/**
 * Vérifie si un objectif de type "kill" est valide
 */
export async function checkKillObjective(character, monsterId) {
  return await updateQuestProgress(character, 'kill', monsterId, 1);
}

/**
 * Vérifie si un objectif de type "reach" est valide
 */
export async function checkReachObjective(character, zoneId) {
  return await updateQuestProgress(character, 'reach', zoneId, 1);
}

/**
 * Vérifie si un objectif de type "explore" est valide
 */
export async function checkExploreObjective(character, target) {
  return await updateQuestProgress(character, 'explore', target, 1);
}

/**
 * Vérifie si un objectif de type "collect" est valide
 */
export async function checkCollectObjective(character, itemId, amount = 1) {
  return await updateQuestProgress(character, 'collect', itemId, amount);
}
