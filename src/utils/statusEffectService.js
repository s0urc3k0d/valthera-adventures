/**
 * Service de gestion des effets de statut et conditions
 * Gère l'application, le suivi et la résolution des effets
 */

import statusEffectsData from '../data/statusEffects.json' assert { type: 'json' };
import { roll } from './dice.js';
import logger from './logger.js';

/**
 * Applique un effet de statut à un participant
 * @param {Object} participant - Le participant cible
 * @param {string} effectId - ID de l'effet
 * @param {Object} options - Options (durée, source, etc.)
 * @returns {Object} Résultat de l'application
 */
export function applyStatusEffect(participant, effectId, options = {}) {
  const {
    duration = 1,
    source = null,
    stacks = 1,
    saveDC = 0,
    saveAbility = null,
  } = options;
  
  // Trouver l'effet
  const effectData = getEffectData(effectId);
  if (!effectData) {
    return { success: false, error: `Effet inconnu: ${effectId}` };
  }
  
  // Vérifier les immunités
  if (isImmuneToEffect(participant, effectId)) {
    return {
      success: false,
      immune: true,
      message: `${participant.name} est immunisé à ${effectData.name}!`,
    };
  }
  
  // Vérifier si l'effet existe déjà
  if (!participant.statusEffects) {
    participant.statusEffects = [];
  }
  
  const existingEffect = participant.statusEffects.find(e => e.id === effectId);
  
  if (existingEffect) {
    if (effectData.canStack) {
      // Empiler l'effet
      existingEffect.stacks = Math.min(
        existingEffect.stacks + stacks,
        effectData.maxStacks || 99
      );
      existingEffect.duration = Math.max(existingEffect.duration, duration);
      
      return {
        success: true,
        stacked: true,
        message: `${effectData.emoji} ${participant.name} a maintenant ${existingEffect.stacks} niveaux de ${effectData.name}!`,
      };
    } else {
      // Rafraîchir la durée
      existingEffect.duration = Math.max(existingEffect.duration, duration);
      
      return {
        success: true,
        refreshed: true,
        message: `${effectData.emoji} ${effectData.name} est rafraîchi sur ${participant.name}!`,
      };
    }
  }
  
  // Ajouter le nouvel effet
  const newEffect = {
    id: effectId,
    name: effectData.name,
    emoji: effectData.emoji,
    duration,
    source,
    stacks,
    saveDC,
    saveAbility,
    appliedAt: Date.now(),
  };
  
  // Copier les propriétés de dégâts/soins
  if (effectData.damagePerTurn) {
    newEffect.damagePerTurn = effectData.damagePerTurn;
    newEffect.damageType = effectData.damageType;
  }
  if (effectData.healingPerTurn) {
    newEffect.healingPerTurn = effectData.healingPerTurn;
  }
  
  participant.statusEffects.push(newEffect);
  
  logger.combat(`Effet appliqué: ${effectId} sur ${participant.name}`, {
    duration,
    source,
  });
  
  return {
    success: true,
    applied: true,
    effect: newEffect,
    message: `${effectData.emoji} ${participant.name} est maintenant **${effectData.name}**! (${duration} tours)`,
  };
}

/**
 * Retire un effet de statut
 * @param {Object} participant - Le participant
 * @param {string} effectId - ID de l'effet à retirer
 * @param {Object} options - Options (retirer tous les stacks, etc.)
 */
export function removeStatusEffect(participant, effectId, options = {}) {
  if (!participant.statusEffects) return { success: false };
  
  const { removeAllStacks = true, stacksToRemove = 1 } = options;
  
  const effectIndex = participant.statusEffects.findIndex(e => e.id === effectId);
  if (effectIndex === -1) {
    return { success: false, notFound: true };
  }
  
  const effect = participant.statusEffects[effectIndex];
  const effectData = getEffectData(effectId);
  
  if (!removeAllStacks && effect.stacks > stacksToRemove) {
    effect.stacks -= stacksToRemove;
    return {
      success: true,
      reducedStacks: true,
      remainingStacks: effect.stacks,
      message: `${effectData.emoji} ${effect.name} réduit à ${effect.stacks} niveaux sur ${participant.name}.`,
    };
  }
  
  participant.statusEffects.splice(effectIndex, 1);
  
  return {
    success: true,
    removed: true,
    message: `✨ ${participant.name} n'est plus **${effectData?.name || effectId}**!`,
  };
}

/**
 * Traite les effets de début de tour
 * @param {Object} participant - Le participant actif
 * @param {Object} combat - État du combat
 * @returns {Array} Messages des effets appliqués
 */
export function processStartOfTurnEffects(participant, combat) {
  const messages = [];
  if (!participant.statusEffects?.length) return messages;
  
  for (const effect of participant.statusEffects) {
    const effectData = getEffectData(effect.id);
    if (!effectData) continue;
    
    // Dégâts au début du tour
    if (effect.damagePerTurn) {
      const dmg = roll(effect.damagePerTurn);
      participant.hp.current = Math.max(0, participant.hp.current - dmg.total);
      
      messages.push({
        type: 'damage',
        effect: effectData.name,
        emoji: effectData.emoji,
        damage: dmg.total,
        damageType: effect.damageType,
        message: `${effectData.emoji} ${participant.name} subit **${dmg.total}** dégâts de ${effectData.name}!`,
      });
      
      combat.log.push({
        round: combat.round,
        action: 'status_damage',
        target: participant.name,
        effect: effectData.name,
        damage: dmg.total,
        timestamp: new Date(),
      });
    }
    
    // Soins au début du tour
    if (effect.healingPerTurn) {
      const heal = roll(effect.healingPerTurn);
      const oldHp = participant.hp.current;
      participant.hp.current = Math.min(participant.hp.max, participant.hp.current + heal.total);
      const actualHeal = participant.hp.current - oldHp;
      
      if (actualHeal > 0) {
        messages.push({
          type: 'healing',
          effect: effectData.name,
          emoji: effectData.emoji,
          healing: actualHeal,
          message: `${effectData.emoji} ${participant.name} récupère **${actualHeal}** PV grâce à ${effectData.name}!`,
        });
      }
    }
    
    // Jets de sauvegarde de début de tour
    if (shouldSaveAtStartOfTurn(effect.id)) {
      messages.push({
        type: 'save_required',
        effect: effectData.name,
        emoji: effectData.emoji,
        ability: effect.saveAbility,
        dc: effect.saveDC,
        message: `⚠️ ${participant.name} doit faire un jet de ${effect.saveAbility?.toUpperCase() || 'SAU'} DD ${effect.saveDC} pour ${effectData.name}!`,
      });
    }
  }
  
  return messages;
}

/**
 * Traite les effets de fin de tour
 * @param {Object} participant - Le participant actif
 * @param {Object} combat - État du combat
 * @returns {Array} Messages et effets expirés
 */
export function processEndOfTurnEffects(participant, combat) {
  const messages = [];
  const expiredEffects = [];
  
  if (!participant.statusEffects?.length) return { messages, expiredEffects };
  
  for (const effect of participant.statusEffects) {
    const effectData = getEffectData(effect.id);
    
    // Réduire la durée
    effect.duration--;
    
    // Effet expiré
    if (effect.duration <= 0) {
      expiredEffects.push(effect.id);
      messages.push({
        type: 'expired',
        effect: effectData?.name || effect.id,
        emoji: effectData?.emoji || '✨',
        message: `✨ ${effectData?.name || effect.id} se dissipe sur ${participant.name}.`,
      });
    }
    
    // Jets de sauvegarde de fin de tour pour certains effets
    if (shouldSaveAtEndOfTurn(effect.id) && effect.saveDC > 0) {
      messages.push({
        type: 'save_opportunity',
        effect: effectData?.name,
        emoji: effectData?.emoji,
        ability: effect.saveAbility,
        dc: effect.saveDC,
        message: `🎲 ${participant.name} peut tenter un jet de ${effect.saveAbility?.toUpperCase()} DD ${effect.saveDC} pour se libérer de ${effectData?.name}!`,
      });
    }
  }
  
  // Retirer les effets expirés
  participant.statusEffects = participant.statusEffects.filter(
    e => !expiredEffects.includes(e.id)
  );
  
  return { messages, expiredEffects };
}

/**
 * Vérifie si un effet affecte un jet
 * @param {Object} participant - Le participant
 * @param {string} rollType - Type de jet ('attack', 'save', 'check')
 * @param {string} ability - Caractéristique utilisée
 * @returns {Object} Modificateurs à appliquer
 */
export function getEffectModifiers(participant, rollType, ability = null) {
  const modifiers = {
    advantage: false,
    disadvantage: false,
    bonus: 0,
    penalty: 0,
    autoFail: false,
    autoCrit: false,
  };
  
  if (!participant.statusEffects?.length) return modifiers;
  
  for (const effect of participant.statusEffects) {
    const effectData = getEffectData(effect.id);
    if (!effectData?.effects) continue;
    
    const effects = effectData.effects;
    
    // Vérifier les modificateurs selon le type de jet
    switch (rollType) {
      case 'attack':
        if (effects.disadvantageOnAttacks) modifiers.disadvantage = true;
        if (effects.advantageOnAttacks) modifiers.advantage = true;
        if (effects.attackBonus) modifiers.bonus += parseBonus(effects.attackBonus);
        if (effects.attackPenalty) modifiers.penalty += parseBonus(effects.attackPenalty);
        break;
        
      case 'save':
        if (effects.disadvantageOnSaves) modifiers.disadvantage = true;
        if (effects.advantageDexSaves && ability === 'dex') modifiers.advantage = true;
        if (effects.saveBonus) modifiers.bonus += parseBonus(effects.saveBonus);
        if (effects.savePenalty) modifiers.penalty += parseBonus(effects.savePenalty);
        if (effects.autoFailSaves?.includes(ability)) modifiers.autoFail = true;
        break;
        
      case 'check':
        if (effects.disadvantageOnChecks) modifiers.disadvantage = true;
        break;
    }
    
    // Effets qui donnent avantage aux attaquants
    if (rollType === 'attack_against') {
      if (effects.attackersHaveAdvantage) modifiers.advantage = true;
      if (effects.adjacentAttacksCrit) modifiers.autoCrit = true;
    }
  }
  
  // Si on a à la fois avantage et désavantage, ils s'annulent
  if (modifiers.advantage && modifiers.disadvantage) {
    modifiers.advantage = false;
    modifiers.disadvantage = false;
  }
  
  return modifiers;
}

/**
 * Vérifie si un participant peut agir
 * @param {Object} participant - Le participant
 * @returns {Object} { canAct: boolean, canMove: boolean, canSpeak: boolean, reason: string }
 */
export function canParticipantAct(participant) {
  const result = {
    canAct: true,
    canMove: true,
    canSpeak: true,
    canReact: true,
    reason: null,
  };
  
  if (!participant.statusEffects?.length) return result;
  
  for (const effect of participant.statusEffects) {
    const effectData = getEffectData(effect.id);
    if (!effectData?.effects) continue;
    
    const effects = effectData.effects;
    
    if (effects.incapacitated || effects.noActions) {
      result.canAct = false;
      result.reason = effectData.name;
    }
    
    if (effects.cannotMove || effects.speedZero) {
      result.canMove = false;
    }
    
    if (effects.cannotSpeak) {
      result.canSpeak = false;
    }
    
    if (effects.noReactions) {
      result.canReact = false;
    }
  }
  
  return result;
}

/**
 * Calcule la CA modifiée par les effets
 * @param {Object} participant - Le participant
 * @param {number} baseAC - CA de base
 * @returns {number} CA modifiée
 */
export function getModifiedAC(participant, baseAC) {
  let ac = baseAC;
  
  if (!participant.statusEffects?.length) return ac;
  
  for (const effect of participant.statusEffects) {
    const effectData = getEffectData(effect.id);
    if (!effectData?.effects) continue;
    
    if (effectData.effects.acBonus) {
      ac += effectData.effects.acBonus;
    }
    if (effectData.effects.acPenalty) {
      ac -= effectData.effects.acPenalty;
    }
  }
  
  return Math.max(0, ac);
}

/**
 * Vérifie les résistances/immunités aux dégâts
 * @param {Object} participant - Le participant
 * @param {string} damageType - Type de dégâts
 * @param {number} damage - Dégâts bruts
 * @returns {Object} { finalDamage: number, resisted: boolean, immune: boolean }
 */
export function applyDamageResistances(participant, damageType, damage) {
  const result = {
    finalDamage: damage,
    resisted: false,
    immune: false,
    absorbed: 0,
  };
  
  if (!participant.statusEffects?.length) return result;
  
  for (const effect of participant.statusEffects) {
    const effectData = getEffectData(effect.id);
    if (!effectData?.effects) continue;
    
    const effects = effectData.effects;
    
    // Résistance à tout
    if (effects.resistAll) {
      result.finalDamage = Math.floor(result.finalDamage / 2);
      result.resisted = true;
    }
    
    // Résistances spécifiques
    if (effects.resistances?.includes(damageType)) {
      result.finalDamage = Math.floor(result.finalDamage / 2);
      result.resisted = true;
    }
    
    // Immunités spécifiques
    if (effects.immunities?.includes(damageType)) {
      result.finalDamage = 0;
      result.immune = true;
    }
  }
  
  return result;
}

/**
 * Gère le jet de concentration quand un lanceur de sort prend des dégâts
 * @param {Object} participant - Le lanceur de sort
 * @param {number} damage - Dégâts reçus
 * @returns {Object|null} Résultat du jet ou null si pas de concentration
 */
export function checkConcentration(participant, damage) {
  const concentrating = participant.statusEffects?.find(e => e.id === 'concentrating');
  if (!concentrating) return null;
  
  // DD = max(10, dégâts / 2)
  const dc = Math.max(10, Math.floor(damage / 2));
  
  // Jet de Constitution
  const conMod = Math.floor((participant.attributes?.con || 10 - 10) / 2);
  const saveRoll = roll('1d20');
  const total = saveRoll.total + conMod;
  
  const success = total >= dc;
  
  if (!success) {
    // Briser la concentration
    removeStatusEffect(participant, 'concentrating');
  }
  
  return {
    dc,
    roll: saveRoll.total,
    modifier: conMod,
    total,
    success,
    message: success
      ? `🎯 ${participant.name} maintient sa concentration! (${total} vs DD ${dc})`
      : `💫 ${participant.name} perd sa concentration! (${total} vs DD ${dc})`,
  };
}

/**
 * Liste les effets actifs d'un participant
 * @param {Object} participant - Le participant
 * @returns {Array} Liste formatée des effets
 */
export function listActiveEffects(participant) {
  if (!participant.statusEffects?.length) return [];
  
  return participant.statusEffects.map(effect => {
    const effectData = getEffectData(effect.id);
    return {
      id: effect.id,
      name: effectData?.name || effect.id,
      emoji: effectData?.emoji || '❓',
      duration: effect.duration,
      stacks: effect.stacks,
      source: effect.source,
      description: effectData?.description?.substring(0, 60) || '',
    };
  });
}

/**
 * Formate les effets pour l'affichage
 * @param {Object} participant - Le participant
 * @returns {string} Texte formaté
 */
export function formatActiveEffects(participant) {
  const effects = listActiveEffects(participant);
  if (effects.length === 0) return '';
  
  return effects.map(e => {
    const stackText = e.stacks > 1 ? ` ×${e.stacks}` : '';
    const durationText = e.duration > 0 ? ` (${e.duration}t)` : '';
    return `${e.emoji} ${e.name}${stackText}${durationText}`;
  }).join(' • ');
}

// ============================================================
// FONCTIONS UTILITAIRES PRIVÉES
// ============================================================

/**
 * Récupère les données d'un effet
 */
function getEffectData(effectId) {
  return statusEffectsData.conditions?.[effectId] ||
         statusEffectsData.spellEffects?.[effectId] ||
         null;
}

/**
 * Vérifie si un participant est immunisé à un effet
 */
function isImmuneToEffect(participant, effectId) {
  // Vérifier les immunités de type de créature
  const type = participant.creatureType || participant.type;
  const immunities = statusEffectsData.immunities?.[type];
  
  if (immunities) {
    if (Array.isArray(immunities) && immunities.includes(effectId)) {
      return true;
    }
    if (immunities.immune?.includes(effectId)) {
      return true;
    }
  }
  
  // Vérifier les immunités d'autres effets actifs
  for (const effect of participant.statusEffects || []) {
    const effectData = getEffectData(effect.id);
    if (effectData?.effects?.immunities?.includes(effectId)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Vérifie si un effet nécessite un jet de sauvegarde en début de tour
 */
function shouldSaveAtStartOfTurn(effectId) {
  return statusEffectsData.savingThrows?.startOfTurn?.includes(effectId) || false;
}

/**
 * Vérifie si un effet nécessite un jet de sauvegarde en fin de tour
 */
function shouldSaveAtEndOfTurn(effectId) {
  return statusEffectsData.savingThrows?.endOfTurn?.includes(effectId) || false;
}

/**
 * Parse un bonus qui peut être un nombre ou un dé
 */
function parseBonus(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.includes('d')) {
    const result = roll(value);
    return result.total;
  }
  return parseInt(value) || 0;
}

// Export par défaut
export default {
  applyStatusEffect,
  removeStatusEffect,
  processStartOfTurnEffects,
  processEndOfTurnEffects,
  getEffectModifiers,
  canParticipantAct,
  getModifiedAC,
  applyDamageResistances,
  checkConcentration,
  listActiveEffects,
  formatActiveEffects,
};
