/**
 * Service de capacités de classe
 * Gère l'utilisation des capacités spéciales des différentes classes
 */

import classAbilitiesData from '../data/classAbilities.json' assert { type: 'json' };
import { roll } from './dice.js';
import { applyStatusEffect, removeStatusEffect } from './statusEffectService.js';
import logger from './logger.js';

/**
 * Récupère les capacités disponibles d'un personnage
 * @param {Object} character - Le personnage
 * @returns {Array} Liste des capacités disponibles
 */
export function getAvailableAbilities(character) {
  const charClass = character.class.toLowerCase();
  const classData = classAbilitiesData[charClass];
  
  if (!classData) return [];
  
  const abilities = [];
  
  for (const [abilityId, ability] of Object.entries(classData.abilities || {})) {
    // Vérifier le niveau requis
    if (character.level < ability.level) continue;
    
    // Vérifier les utilisations restantes
    const usesRemaining = getAbilityUses(character, abilityId, ability);
    const maxUses = getMaxAbilityUses(character, ability);
    
    abilities.push({
      ...ability,
      id: abilityId,
      usesRemaining,
      maxUses,
      canUse: usesRemaining > 0 || maxUses === null || ability.actionType === 'passive',
    });
  }
  
  return abilities;
}

/**
 * Utilise une capacité de classe
 * @param {Object} character - Le personnage
 * @param {string} abilityId - ID de la capacité
 * @param {Object} combat - Combat actif (si applicable)
 * @param {Object} target - Cible (si applicable)
 * @returns {Object} Résultat de l'utilisation
 */
export async function useAbility(character, abilityId, combat = null, target = null) {
  const charClass = character.class.toLowerCase();
  const classData = classAbilitiesData[charClass];
  
  if (!classData) {
    return { success: false, error: 'Classe non trouvée' };
  }
  
  const ability = classData.abilities?.[abilityId];
  if (!ability) {
    return { success: false, error: 'Capacité non trouvée' };
  }
  
  // Vérifier le niveau
  if (character.level < ability.level) {
    return { 
      success: false, 
      error: `Vous devez être niveau ${ability.level} pour utiliser ${ability.name}.` 
    };
  }
  
  // Vérifier les utilisations
  const usesRemaining = getAbilityUses(character, abilityId, ability);
  const maxUses = getMaxAbilityUses(character, ability);
  
  if (maxUses !== null && usesRemaining <= 0) {
    return { 
      success: false, 
      error: `${ability.name} n'a plus d'utilisations. Prenez un repos pour récupérer!` 
    };
  }
  
  // Vérifier les ressources (Ki, Rage, etc.)
  if (ability.resource) {
    const resourceCheck = checkResource(character, ability.resource, ability.cost || 1);
    if (!resourceCheck.success) {
      return resourceCheck;
    }
  }
  
  // Exécuter la capacité selon son type
  let result;
  switch (ability.type) {
    case 'healing':
      result = await executeHealingAbility(character, ability);
      break;
    case 'buff':
      result = await executeBuffAbility(character, ability, combat);
      break;
    case 'damage':
      result = await executeDamageAbility(character, ability, target, combat);
      break;
    case 'control':
      result = await executeControlAbility(character, ability, target, combat);
      break;
    case 'defensive':
      result = await executeDefensiveAbility(character, ability, combat);
      break;
    case 'offensive':
      result = await executeOffensiveAbility(character, ability, combat);
      break;
    case 'utility':
      result = await executeUtilityAbility(character, ability, combat);
      break;
    default:
      result = await executeGenericAbility(character, ability, combat, target);
  }
  
  // Consommer l'utilisation si nécessaire
  if (result.success && maxUses !== null) {
    consumeAbilityUse(character, abilityId);
  }
  
  // Consommer les ressources
  if (result.success && ability.resource) {
    consumeResource(character, ability.resource, ability.cost || 1);
  }
  
  logger.combat(`${character.name} utilise ${ability.name}`, result);
  
  return result;
}

/**
 * Exécute Second Wind du Guerrier
 */
async function executeHealingAbility(character, ability) {
  let healingFormula = ability.healing;
  
  // Remplacer "level" par le niveau réel
  healingFormula = healingFormula.replace('level', character.level);
  
  // Calculer les soins
  const healRoll = roll(healingFormula);
  const oldHp = character.hp.current;
  character.hp.current = Math.min(character.hp.max, character.hp.current + healRoll.total);
  const actualHeal = character.hp.current - oldHp;
  
  return {
    success: true,
    ability: ability.name,
    emoji: ability.emoji,
    healing: actualHeal,
    roll: healRoll,
    message: `${ability.emoji} **${ability.name}!** ${character.name} récupère **${actualHeal} PV**! (${healRoll.total} soins, ${oldHp} → ${character.hp.current})`,
  };
}

/**
 * Exécute Rage du Barbare ou autres buffs
 */
async function executeBuffAbility(character, ability, combat) {
  const participant = combat?.participants?.find(p => p.id === character.userId);
  
  if (ability.id === 'rage') {
    // Appliquer l'effet de rage
    const rageBonus = getRageBonus(character.level);
    
    applyStatusEffect(participant || character, 'raging', {
      duration: ability.duration || 10,
      source: 'rage',
    });
    
    return {
      success: true,
      ability: ability.name,
      emoji: ability.emoji,
      effect: 'raging',
      damageBonus: rageBonus,
      message: `${ability.emoji} **${ability.name}!** ${character.name} entre en rage! (+${rageBonus} dégâts, résistance aux dégâts physiques)`,
    };
  }
  
  if (ability.id === 'action_surge') {
    return {
      success: true,
      ability: ability.name,
      emoji: ability.emoji,
      effect: 'extra_action',
      message: `${ability.emoji} **${ability.name}!** ${character.name} gagne une action supplémentaire ce tour!`,
    };
  }
  
  // Buff générique
  return {
    success: true,
    ability: ability.name,
    emoji: ability.emoji,
    message: `${ability.emoji} **${ability.name}!** ${character.name} active ${ability.name}!`,
  };
}

/**
 * Exécute Attaque Sournoise ou Divine Smite
 */
async function executeDamageAbility(character, ability, target, combat) {
  if (ability.id === 'sneak_attack') {
    // Calculer les dés de sneak attack selon le niveau
    const sneakDice = getSneakAttackDice(character.level);
    const damageRoll = roll(sneakDice);
    
    return {
      success: true,
      ability: ability.name,
      emoji: ability.emoji,
      damage: damageRoll.total,
      damageRoll,
      damageType: 'piercing',
      message: `${ability.emoji} **${ability.name}!** ${character.name} inflige **${damageRoll.total}** dégâts supplémentaires!`,
      // Le flag pour indiquer que c'est un bonus aux dégâts
      isBonusDamage: true,
    };
  }
  
  if (ability.id === 'divine_smite') {
    // Le niveau d'emplacement détermine les dégâts
    const slotLevel = ability.slotUsed || 1;
    const baseDice = 2 + slotLevel; // 2d8 + 1d8 par niveau au-dessus de 1
    const smiteDice = `${baseDice}d8`;
    const damageRoll = roll(smiteDice);
    
    // Bonus contre morts-vivants/fiélons
    let totalDamage = damageRoll.total;
    if (target?.creatureType === 'undead' || target?.creatureType === 'fiend') {
      const bonusRoll = roll('1d8');
      totalDamage += bonusRoll.total;
    }
    
    return {
      success: true,
      ability: ability.name,
      emoji: ability.emoji,
      damage: totalDamage,
      damageRoll,
      damageType: 'radiant',
      message: `${ability.emoji} **${ability.name}!** ${character.name} canalise l'énergie divine pour **${totalDamage}** dégâts radiants!`,
      isBonusDamage: true,
    };
  }
  
  return {
    success: true,
    ability: ability.name,
    emoji: ability.emoji,
    message: `${ability.emoji} ${character.name} utilise ${ability.name}!`,
  };
}

/**
 * Exécute Frappe Étourdissante ou autres contrôles
 */
async function executeControlAbility(character, ability, target, combat) {
  if (ability.id === 'stunning_strike') {
    // Jet de sauvegarde Constitution
    const kiDC = 8 + character.getProficiencyBonus() + character.getModifier('wis');
    
    // Le monstre fait son jet
    const conMod = Math.floor((target?.attributes?.con || 10 - 10) / 2);
    const saveRoll = roll('1d20');
    const total = saveRoll.total + conMod;
    
    const saved = total >= kiDC;
    
    if (!saved && target) {
      applyStatusEffect(target, 'stunned', {
        duration: 1,
        source: 'stunning_strike',
      });
    }
    
    return {
      success: true,
      ability: ability.name,
      emoji: ability.emoji,
      saveDC: kiDC,
      saveRoll: saveRoll.total,
      targetSaved: saved,
      effect: saved ? null : 'stunned',
      message: saved
        ? `${ability.emoji} **${ability.name}!** ${target?.name || 'La cible'} résiste! (${total} vs DD ${kiDC})`
        : `${ability.emoji} **${ability.name}!** ${target?.name || 'La cible'} est étourdie! (${total} vs DD ${kiDC})`,
    };
  }
  
  return {
    success: true,
    ability: ability.name,
    emoji: ability.emoji,
    message: `${ability.emoji} ${character.name} utilise ${ability.name}!`,
  };
}

/**
 * Exécute Esquive Instinctive ou Évasion
 */
async function executeDefensiveAbility(character, ability, combat) {
  if (ability.id === 'uncanny_dodge') {
    return {
      success: true,
      ability: ability.name,
      emoji: ability.emoji,
      effect: 'halve_damage',
      message: `${ability.emoji} **${ability.name}!** ${character.name} utilise sa réaction pour réduire les dégâts de moitié!`,
      isReaction: true,
    };
  }
  
  if (ability.id === 'patient_defense') {
    return {
      success: true,
      ability: ability.name,
      emoji: ability.emoji,
      effect: 'dodge',
      message: `${ability.emoji} **${ability.name}!** ${character.name} adopte la posture du Dodge! (Désavantage sur les attaques contre lui)`,
    };
  }
  
  return {
    success: true,
    ability: ability.name,
    emoji: ability.emoji,
    message: `${ability.emoji} ${character.name} utilise ${ability.name}!`,
  };
}

/**
 * Exécute Attaque Téméraire ou Déluge de Coups
 */
async function executeOffensiveAbility(character, ability, combat) {
  if (ability.id === 'reckless_attack') {
    return {
      success: true,
      ability: ability.name,
      emoji: ability.emoji,
      effect: {
        advantageOnAttacks: true,
        grantAdvantageToEnemies: true,
      },
      message: `${ability.emoji} **${ability.name}!** ${character.name} attaque avec témérité! (Avantage sur ses attaques, mais les ennemis ont aussi l'avantage)`,
    };
  }
  
  if (ability.id === 'flurry_of_blows') {
    const martialDie = getMartialArtsDie(character.level);
    const dexMod = character.getModifier('dex');
    
    // Deux attaques supplémentaires
    const results = [];
    for (let i = 0; i < 2; i++) {
      const attackRoll = roll('1d20');
      const attackTotal = attackRoll.total + dexMod + character.getProficiencyBonus();
      const damageRoll = roll(martialDie);
      const damageTotal = damageRoll.total + dexMod;
      
      results.push({
        attackRoll: attackRoll.total,
        attackTotal,
        damageRoll: damageRoll.total,
        damageTotal,
      });
    }
    
    return {
      success: true,
      ability: ability.name,
      emoji: ability.emoji,
      attacks: results,
      message: `${ability.emoji} **${ability.name}!** ${character.name} effectue deux frappes rapides! Attaques: ${results.map(r => r.attackTotal).join(', ')}`,
    };
  }
  
  return {
    success: true,
    ability: ability.name,
    emoji: ability.emoji,
    message: `${ability.emoji} ${character.name} utilise ${ability.name}!`,
  };
}

/**
 * Exécute Action Rusée ou autres utilitaires
 */
async function executeUtilityAbility(character, ability, combat) {
  if (ability.id === 'cunning_action') {
    return {
      success: true,
      ability: ability.name,
      emoji: ability.emoji,
      options: ability.options,
      message: `${ability.emoji} **${ability.name}!** ${character.name} peut effectuer Dash, Disengage ou Hide en action bonus!`,
    };
  }
  
  if (ability.id === 'step_of_the_wind') {
    return {
      success: true,
      ability: ability.name,
      emoji: ability.emoji,
      effect: {
        dashOrDisengage: true,
        doubleJump: true,
      },
      message: `${ability.emoji} **${ability.name}!** ${character.name} se déplace avec une grâce surnaturelle!`,
    };
  }
  
  return {
    success: true,
    ability: ability.name,
    emoji: ability.emoji,
    message: `${ability.emoji} ${character.name} utilise ${ability.name}!`,
  };
}

/**
 * Exécution générique d'une capacité
 */
async function executeGenericAbility(character, ability, combat, target) {
  return {
    success: true,
    ability: ability.name,
    emoji: ability.emoji || '✨',
    message: `${ability.emoji || '✨'} **${ability.name}!** ${character.name} utilise sa capacité!`,
  };
}

// ============================================================
// GESTION DES RESSOURCES
// ============================================================

/**
 * Récupère les utilisations restantes d'une capacité
 */
function getAbilityUses(character, abilityId, ability) {
  // Capacités passives = illimitées
  if (ability.actionType === 'passive') return Infinity;
  
  // Chercher dans les utilisations stockées du personnage
  const stored = character.abilities?.find(a => a.id === abilityId);
  if (stored) {
    return stored.maxUses - stored.uses;
  }
  
  // Par défaut, retourner le max
  return getMaxAbilityUses(character, ability);
}

/**
 * Calcule le nombre max d'utilisations
 */
function getMaxAbilityUses(character, ability) {
  if (ability.actionType === 'passive') return null;
  
  let maxUses = ability.uses || 1;
  
  // Vérifier les augmentations par niveau
  if (ability.usesAtLevel) {
    for (const [level, uses] of Object.entries(ability.usesAtLevel)) {
      if (character.level >= parseInt(level)) {
        maxUses = uses;
      }
    }
  }
  
  return maxUses;
}

/**
 * Consomme une utilisation
 */
function consumeAbilityUse(character, abilityId) {
  if (!character.abilities) character.abilities = [];
  
  let stored = character.abilities.find(a => a.id === abilityId);
  if (!stored) {
    stored = { id: abilityId, uses: 0, maxUses: null, rechargeOn: 'shortRest' };
    character.abilities.push(stored);
  }
  
  stored.uses++;
}

/**
 * Vérifie une ressource (Ki, Rage, etc.)
 */
function checkResource(character, resourceId, cost) {
  const charClass = character.class.toLowerCase();
  const classData = classAbilitiesData[charClass];
  const resourceDef = classData?.resources?.find(r => r.id === resourceId);
  
  if (!resourceDef) {
    return { success: true }; // Pas de ressource requise
  }
  
  const maxResource = calculateMaxResource(character, resourceDef);
  const currentResource = character.resources?.[resourceId] ?? maxResource;
  
  if (currentResource < cost) {
    return {
      success: false,
      error: `Pas assez de ${resourceDef.name}! (${currentResource}/${maxResource}, coût: ${cost})`,
    };
  }
  
  return { success: true, current: currentResource, max: maxResource };
}

/**
 * Consomme une ressource
 */
function consumeResource(character, resourceId, cost) {
  if (!character.resources) character.resources = {};
  
  const charClass = character.class.toLowerCase();
  const classData = classAbilitiesData[charClass];
  const resourceDef = classData?.resources?.find(r => r.id === resourceId);
  
  if (!resourceDef) return;
  
  const maxResource = calculateMaxResource(character, resourceDef);
  const currentResource = character.resources[resourceId] ?? maxResource;
  
  character.resources[resourceId] = Math.max(0, currentResource - cost);
}

/**
 * Calcule le maximum d'une ressource
 */
function calculateMaxResource(character, resourceDef) {
  let max = resourceDef.maxUses;
  
  if (max === 'level') {
    return character.level;
  }
  
  if (typeof max === 'object') {
    // Progression par niveau
    for (const [level, value] of Object.entries(max)) {
      if (character.level >= parseInt(level)) {
        max = value;
      }
    }
  }
  
  if (typeof max === 'string' && max.includes('cha_mod')) {
    max = Math.max(1, character.getModifier('cha'));
  }
  
  return max;
}

/**
 * Récupère les ressources lors d'un repos
 * @param {Object} character - Le personnage
 * @param {string} restType - 'short' ou 'long'
 */
export function recoverResourcesOnRest(character, restType) {
  const charClass = character.class.toLowerCase();
  const classData = classAbilitiesData[charClass];
  
  if (!classData) return;
  
  // Récupérer les ressources
  for (const resource of classData.resources || []) {
    if (restType === 'long' || resource.recoversOn === 'short') {
      const max = calculateMaxResource(character, resource);
      if (!character.resources) character.resources = {};
      character.resources[resource.id] = max;
    }
  }
  
  // Récupérer les utilisations de capacités
  for (const [abilityId, ability] of Object.entries(classData.abilities || {})) {
    if (ability.actionType === 'passive') continue;
    
    const shouldRecover = 
      (restType === 'long') ||
      (restType === 'short' && ability.usesPerRest === 'short');
    
    if (shouldRecover) {
      const stored = character.abilities?.find(a => a.id === abilityId);
      if (stored) {
        stored.uses = 0;
      }
    }
  }
}

// ============================================================
// CALCULS PAR CLASSE
// ============================================================

/**
 * Bonus de dégâts de Rage selon le niveau
 */
function getRageBonus(level) {
  if (level >= 16) return 4;
  if (level >= 9) return 3;
  return 2;
}

/**
 * Dés de Sneak Attack selon le niveau
 */
function getSneakAttackDice(level) {
  const dice = Math.ceil(level / 2);
  return `${dice}d6`;
}

/**
 * Dé d'arts martiaux selon le niveau
 */
function getMartialArtsDie(level) {
  if (level >= 17) return '1d10';
  if (level >= 11) return '1d8';
  if (level >= 5) return '1d6';
  return '1d4';
}

/**
 * Récupère le nombre de points de Ki
 */
export function getKiPoints(character) {
  if (character.class.toLowerCase() !== 'monk') return 0;
  return character.level;
}

/**
 * Récupère les infos de ressources pour affichage
 */
export function getResourceInfo(character) {
  const charClass = character.class.toLowerCase();
  const classData = classAbilitiesData[charClass];
  
  if (!classData?.resources?.length) return [];
  
  return classData.resources.map(resource => {
    const max = calculateMaxResource(character, resource);
    const current = character.resources?.[resource.id] ?? max;
    
    return {
      id: resource.id,
      name: resource.name,
      current,
      max,
      recoversOn: resource.recoversOn,
    };
  });
}

// Export par défaut
export default {
  getAvailableAbilities,
  useAbility,
  recoverResourcesOnRest,
  getKiPoints,
  getResourceInfo,
};
