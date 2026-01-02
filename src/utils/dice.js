/**
 * Système de dés D&D 5E
 * Gère tous les jets de dés avec modificateurs, avantage/désavantage
 */

/**
 * Lance un dé simple
 * @param {number} sides - Nombre de faces du dé
 * @returns {number} Résultat du lancer
 */
export function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Parse une notation de dé (ex: "2d6+3")
 * @param {string} notation - Notation du dé
 * @returns {Object} { count, sides, modifier }
 */
export function parseDiceNotation(notation) {
  const regex = /^(\d+)?d(\d+)([+-]\d+)?$/i;
  const match = notation.match(regex);
  
  if (!match) {
    throw new Error(`Notation de dé invalide: ${notation}`);
  }
  
  return {
    count: parseInt(match[1]) || 1,
    sides: parseInt(match[2]),
    modifier: parseInt(match[3]) || 0,
  };
}

/**
 * Lance des dés selon une notation
 * @param {string} notation - Notation du dé (ex: "2d6+3", "1d20", "4d6")
 * @param {string} mode - 'normal', 'advantage', 'disadvantage'
 * @returns {Object} { total, rolls, modifier, notation, isCritical, isFumble }
 */
export function roll(notation, mode = 'normal') {
  const { count, sides, modifier } = parseDiceNotation(notation);
  
  let rolls = [];
  let total = 0;
  let isCritical = false;
  let isFumble = false;
  
  // Gestion de l'avantage/désavantage pour les d20
  if (sides === 20 && count === 1 && (mode === 'advantage' || mode === 'disadvantage')) {
    const roll1 = rollDie(20);
    const roll2 = rollDie(20);
    rolls = [roll1, roll2];
    
    if (mode === 'advantage') {
      total = Math.max(roll1, roll2);
    } else {
      total = Math.min(roll1, roll2);
    }
    
    isCritical = total === 20;
    isFumble = total === 1;
  } else {
    // Jets normaux
    for (let i = 0; i < count; i++) {
      const result = rollDie(sides);
      rolls.push(result);
      total += result;
      
      // Vérification critique/fumble sur d20
      if (sides === 20 && count === 1) {
        isCritical = result === 20;
        isFumble = result === 1;
      }
    }
  }
  
  total += modifier;
  
  return {
    total,
    rolls,
    modifier,
    notation,
    mode,
    isCritical,
    isFumble,
    naturalRoll: rolls.length === 1 ? rolls[0] : null,
  };
}

/**
 * Jet d'attaque D&D 5E
 * @param {number} attackBonus - Bonus d'attaque total
 * @param {number} targetAC - Classe d'armure de la cible
 * @param {string} mode - 'normal', 'advantage', 'disadvantage'
 * @returns {Object} Résultat du jet d'attaque
 */
export function rollAttack(attackBonus, targetAC, mode = 'normal') {
  const result = roll('1d20', mode);
  const attackRoll = result.naturalRoll + attackBonus;
  
  return {
    ...result,
    attackBonus,
    attackRoll,
    targetAC,
    hits: result.isCritical || (!result.isFumble && attackRoll >= targetAC),
    isCriticalHit: result.isCritical,
    isCriticalMiss: result.isFumble,
  };
}

/**
 * Jet de dégâts
 * @param {string} damageNotation - Notation des dégâts (ex: "2d6+3")
 * @param {boolean} isCritical - Si le coup est critique
 * @param {string} damageType - Type de dégâts
 * @returns {Object} Résultat des dégâts
 */
export function rollDamage(damageNotation, isCritical = false, damageType = 'slashing') {
  const { count, sides, modifier } = parseDiceNotation(damageNotation);
  
  // En cas de critique, on double les dés (pas le modificateur)
  const diceCount = isCritical ? count * 2 : count;
  const critNotation = `${diceCount}d${sides}${modifier >= 0 ? '+' : ''}${modifier}`;
  
  const result = roll(critNotation);
  
  return {
    ...result,
    damageType,
    isCritical,
    originalNotation: damageNotation,
  };
}

/**
 * Jet de sauvegarde
 * @param {number} savingThrowBonus - Bonus de sauvegarde
 * @param {number} dc - Difficulté (DC)
 * @param {string} mode - 'normal', 'advantage', 'disadvantage'
 * @returns {Object} Résultat du jet de sauvegarde
 */
export function rollSavingThrow(savingThrowBonus, dc, mode = 'normal') {
  const result = roll('1d20', mode);
  const saveRoll = result.naturalRoll + savingThrowBonus;
  
  return {
    ...result,
    savingThrowBonus,
    saveRoll,
    dc,
    success: result.isCritical || (!result.isFumble && saveRoll >= dc),
    autoCriticalSuccess: result.isCritical,
    autoCriticalFail: result.isFumble,
  };
}

/**
 * Jet de compétence
 * @param {number} skillBonus - Bonus de compétence total
 * @param {number} dc - Difficulté (DC)
 * @param {string} mode - 'normal', 'advantage', 'disadvantage'
 * @returns {Object} Résultat du jet de compétence
 */
export function rollSkillCheck(skillBonus, dc, mode = 'normal') {
  const result = roll('1d20', mode);
  const checkRoll = result.naturalRoll + skillBonus;
  
  return {
    ...result,
    skillBonus,
    checkRoll,
    dc,
    success: checkRoll >= dc,
    margin: checkRoll - dc,
  };
}

/**
 * Jet d'initiative
 * @param {number} dexModifier - Modificateur de Dextérité
 * @param {number} bonusInitiative - Bonus d'initiative supplémentaire
 * @returns {Object} Résultat de l'initiative
 */
export function rollInitiative(dexModifier, bonusInitiative = 0) {
  const result = roll('1d20');
  
  return {
    ...result,
    initiative: result.total + dexModifier + bonusInitiative,
    dexModifier,
    bonusInitiative,
  };
}

/**
 * Calcule le modificateur d'attribut D&D 5E
 * @param {number} score - Score d'attribut (1-30)
 * @returns {number} Modificateur
 */
export function getAttributeModifier(score) {
  return Math.floor((score - 10) / 2);
}

/**
 * Lance plusieurs dés et garde les X meilleurs/pires
 * @param {number} count - Nombre de dés à lancer
 * @param {number} sides - Nombre de faces
 * @param {number} keep - Nombre de dés à garder
 * @param {string} keepType - 'highest' ou 'lowest'
 * @returns {Object} Résultat
 */
export function rollAndKeep(count, sides, keep, keepType = 'highest') {
  const rolls = [];
  for (let i = 0; i < count; i++) {
    rolls.push(rollDie(sides));
  }
  
  const sorted = [...rolls].sort((a, b) => 
    keepType === 'highest' ? b - a : a - b
  );
  
  const kept = sorted.slice(0, keep);
  const dropped = sorted.slice(keep);
  const total = kept.reduce((sum, r) => sum + r, 0);
  
  return {
    total,
    rolls,
    kept,
    dropped,
    keepType,
  };
}

/**
 * Génère des scores d'attributs (4d6 drop lowest)
 * @returns {number[]} 6 scores d'attributs
 */
export function rollAttributeScores() {
  const scores = [];
  for (let i = 0; i < 6; i++) {
    const result = rollAndKeep(4, 6, 3, 'highest');
    scores.push(result.total);
  }
  return scores.sort((a, b) => b - a);
}

/**
 * Formate le résultat d'un jet pour l'affichage
 * @param {Object} rollResult - Résultat d'un jet
 * @returns {string} Texte formaté
 */
export function formatRollResult(rollResult) {
  const { notation, rolls, modifier, total, mode, isCritical, isFumble } = rollResult;
  
  let text = `🎲 ${notation}`;
  
  if (mode && mode !== 'normal') {
    text += ` (${mode === 'advantage' ? 'Avantage' : 'Désavantage'})`;
  }
  
  text += `: [${rolls.join(', ')}]`;
  
  if (modifier !== 0) {
    text += ` ${modifier >= 0 ? '+' : ''}${modifier}`;
  }
  
  text += ` = **${total}**`;
  
  if (isCritical) {
    text += ' 💥 CRITIQUE!';
  } else if (isFumble) {
    text += ' 💀 ÉCHEC CRITIQUE!';
  }
  
  return text;
}

export default {
  roll,
  rollDie,
  rollAttack,
  rollDamage,
  rollSavingThrow,
  rollSkillCheck,
  rollInitiative,
  rollAndKeep,
  rollAttributeScores,
  getAttributeModifier,
  parseDiceNotation,
  formatRollResult,
};
