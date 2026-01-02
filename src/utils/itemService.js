/**
 * Service de gestion des items
 * Centralise toutes les opérations sur les items
 */

import itemsData from '../data/items.json' assert { type: 'json' };
import { roll } from './dice.js';

// Fusionner toutes les catégories d'items en un seul objet
const allItems = {
  ...itemsData.weapons,
  ...itemsData.armor,
  ...itemsData.consumables,
  ...itemsData.accessories,
  ...itemsData.misc,
};

/**
 * Récupère un item par son ID
 * @param {string} itemId - ID de l'item
 * @returns {Object|null} Item ou null
 */
export function getItem(itemId) {
  return allItems[itemId] || null;
}

/**
 * Récupère tous les items d'une catégorie
 * @param {string} category - Catégorie (weapons, armor, consumables, accessories, misc)
 * @returns {Object} Items de la catégorie
 */
export function getItemsByCategory(category) {
  return itemsData[category] || {};
}

/**
 * Récupère tous les items d'un type
 * @param {string} type - Type d'item (weapon, armor, consumable, accessory, misc)
 * @returns {Array} Liste des items
 */
export function getItemsByType(type) {
  return Object.values(allItems).filter(item => item.type === type);
}

/**
 * Récupère le kit de départ d'une classe
 * @param {string} className - Nom de la classe (en minuscule)
 * @returns {Array} Liste des IDs d'items
 */
export function getStarterKit(className) {
  const classKey = className.toLowerCase();
  return itemsData.starterKits[classKey] || itemsData.starterKits.warrior;
}

/**
 * Vérifie si un personnage peut équiper un item
 * @param {Object} character - Le personnage
 * @param {Object} item - L'item
 * @returns {Object} { canEquip: boolean, reason: string }
 */
export function canEquipItem(character, item) {
  // Vérifier les requirements
  if (item.requirements) {
    for (const [attr, minValue] of Object.entries(item.requirements)) {
      if (character.attributes[attr] < minValue) {
        return {
          canEquip: false,
          reason: `${attr.toUpperCase()} insuffisant (${character.attributes[attr]}/${minValue})`,
        };
      }
    }
  }
  
  // Vérifier les proficiences d'armure
  if (item.type === 'armor' && item.subtype !== 'shield' && item.subtype !== 'helmet') {
    const armorProf = character.proficiencies?.armor || [];
    if (!armorProf.includes(item.subtype) && !armorProf.includes('all')) {
      return {
        canEquip: false,
        reason: `Non maîtrisé (armure ${item.subtype})`,
      };
    }
  }
  
  return { canEquip: true, reason: '' };
}

/**
 * Calcule les dégâts d'une arme
 * @param {Object} weapon - L'arme
 * @param {Object} character - Le personnage
 * @param {boolean} versatile - Utiliser en mode versatile (deux mains)
 * @returns {Object} Résultat du jet de dégâts
 */
export function calculateWeaponDamage(weapon, character, versatile = false) {
  const damage = versatile && weapon.stats.versatileDamage 
    ? weapon.stats.versatileDamage 
    : weapon.stats.damage;
  
  // Déterminer le modificateur (Force ou Dex si finesse)
  let modifier = Math.floor((character.attributes.str - 10) / 2);
  if (weapon.stats.properties?.includes('finesse')) {
    const dexMod = Math.floor((character.attributes.dex - 10) / 2);
    modifier = Math.max(modifier, dexMod);
  }
  
  const rollResult = roll(damage);
  
  return {
    ...rollResult,
    modifier,
    total: rollResult.total + modifier,
    damageType: weapon.stats.damageType,
  };
}

/**
 * Calcule la CA totale d'une armure
 * @param {Object} armor - L'armure
 * @param {Object} character - Le personnage
 * @returns {number} CA totale
 */
export function calculateArmorAC(armor, character) {
  if (armor.stats.armorClassBonus) {
    // Bouclier - juste un bonus
    return armor.stats.armorClassBonus;
  }
  
  let ac = armor.stats.armorClass;
  
  if (armor.stats.dexBonus) {
    const dexMod = Math.floor((character.attributes.dex - 10) / 2);
    if (armor.stats.maxDexBonus !== null) {
      ac += Math.min(dexMod, armor.stats.maxDexBonus);
    } else {
      ac += dexMod;
    }
  }
  
  return ac;
}

/**
 * Applique l'effet d'un consommable
 * @param {Object} item - Le consommable
 * @param {Object} character - Le personnage
 * @returns {Object} Résultat de l'utilisation
 */
export function useConsumable(item, character) {
  const result = {
    success: true,
    message: '',
    changes: {},
  };
  
  switch (item.stats.effect) {
    case 'heal': {
      const healRoll = roll(item.stats.healing);
      const healAmount = healRoll.total;
      const oldHp = character.hp.current;
      character.hp.current = Math.min(character.hp.current + healAmount, character.hp.max);
      const actualHeal = character.hp.current - oldHp;
      
      result.message = `🧪 Vous utilisez **${item.name}** et récupérez **${actualHeal} PV**!`;
      result.changes = { 
        hp: { before: oldHp, after: character.hp.current, change: actualHeal },
        roll: healRoll,
      };
      break;
    }
    
    case 'restoreMana': {
      const slots = character.spellcasting?.spellSlots;
      if (slots) {
        const level = item.stats.restoreSpellSlot;
        if (slots[level] && slots[level].current < slots[level].max) {
          slots[level].current++;
          result.message = `💙 Vous utilisez **${item.name}** et récupérez un emplacement de sort de niveau ${level}!`;
          result.changes = { spellSlot: { level, restored: 1 } };
        } else {
          result.success = false;
          result.message = `Vous n'avez pas d'emplacement de niveau ${level} à récupérer.`;
        }
      } else {
        result.success = false;
        result.message = `Vous n'avez pas de capacité de lancement de sorts.`;
      }
      break;
    }
    
    case 'cure': {
      const effectToRemove = item.stats.removeEffect;
      if (character.statusEffects?.includes(effectToRemove)) {
        character.statusEffects = character.statusEffects.filter(e => e !== effectToRemove);
        result.message = `💚 Vous utilisez **${item.name}** et vous êtes guéri de l'effet **${effectToRemove}**!`;
        result.changes = { removedEffect: effectToRemove };
      } else {
        result.success = false;
        result.message = `Vous n'êtes pas affecté par cet état.`;
      }
      break;
    }
    
    case 'buff': {
      // Les buffs sont gérés par le système de combat
      result.message = `✨ Vous utilisez **${item.name}**!`;
      result.changes = { buff: item.stats };
      break;
    }
    
    case 'food': {
      result.message = `🍖 Vous mangez **${item.name}**. Vous êtes rassasié.`;
      result.changes = { fed: true };
      break;
    }
    
    case 'light': {
      result.message = `🔥 Vous allumez une **${item.name}**. Elle éclaire dans un rayon de ${item.stats.lightRadius} pieds.`;
      result.changes = { light: item.stats.lightRadius };
      break;
    }
    
    default:
      result.message = `Vous utilisez **${item.name}**.`;
  }
  
  return result;
}

/**
 * Ajoute un item à l'inventaire d'un personnage
 * @param {Object} character - Le personnage
 * @param {string} itemId - ID de l'item
 * @param {number} quantity - Quantité
 * @returns {Object} Résultat
 */
export function addToInventory(character, itemId, quantity = 1) {
  const item = getItem(itemId);
  if (!item) {
    return { success: false, message: 'Item inconnu.' };
  }
  
  // Chercher si l'item existe déjà et est stackable
  const existingSlot = character.inventory.find(
    slot => slot.itemId === itemId && !slot.equipped
  );
  
  if (existingSlot && item.stackable) {
    const maxStack = item.maxStack || 99;
    const newQty = Math.min(existingSlot.quantity + quantity, maxStack);
    const added = newQty - existingSlot.quantity;
    existingSlot.quantity = newQty;
    
    return { 
      success: true, 
      message: `+${added} ${item.name}`,
      added,
      total: newQty,
    };
  }
  
  // Ajouter un nouveau slot
  character.inventory.push({
    itemId,
    quantity: item.stackable ? quantity : 1,
    equipped: false,
    slot: null,
  });
  
  return { 
    success: true, 
    message: `+${quantity} ${item.name}`,
    added: quantity,
    total: quantity,
  };
}

/**
 * Retire un item de l'inventaire
 * @param {Object} character - Le personnage
 * @param {string} itemId - ID de l'item
 * @param {number} quantity - Quantité
 * @returns {Object} Résultat
 */
export function removeFromInventory(character, itemId, quantity = 1) {
  const slotIndex = character.inventory.findIndex(
    slot => slot.itemId === itemId && !slot.equipped
  );
  
  if (slotIndex === -1) {
    return { success: false, message: 'Item non trouvé dans l\'inventaire.' };
  }
  
  const slot = character.inventory[slotIndex];
  const item = getItem(itemId);
  
  if (slot.quantity <= quantity) {
    character.inventory.splice(slotIndex, 1);
    return { 
      success: true, 
      message: `-${slot.quantity} ${item.name}`,
      removed: slot.quantity,
    };
  }
  
  slot.quantity -= quantity;
  return { 
    success: true, 
    message: `-${quantity} ${item.name}`,
    removed: quantity,
    remaining: slot.quantity,
  };
}

/**
 * Calcule le poids total de l'inventaire
 * @param {Object} character - Le personnage
 * @returns {number} Poids total en livres
 */
export function calculateInventoryWeight(character) {
  return character.inventory.reduce((total, slot) => {
    const item = getItem(slot.itemId);
    if (!item) return total;
    return total + (item.weight * slot.quantity);
  }, 0);
}

/**
 * Calcule la capacité de charge maximale
 * @param {Object} character - Le personnage
 * @returns {number} Capacité en livres
 */
export function calculateCarryCapacity(character) {
  return character.attributes.str * 15;
}

/**
 * Récupère les items de l'inventaire enrichis avec leurs données
 * @param {Object} character - Le personnage
 * @param {Object} options - Options de filtrage
 * @returns {Array} Items enrichis
 */
export function getInventoryItems(character, options = {}) {
  const { type, equipped, sortBy = 'name' } = options;
  
  let items = character.inventory.map(slot => {
    const itemData = getItem(slot.itemId);
    if (!itemData) return null;
    
    return {
      ...itemData,
      quantity: slot.quantity,
      equipped: slot.equipped,
      slot: slot.slot,
      customName: slot.customName,
      enchantments: slot.enchantments,
      _inventoryIndex: character.inventory.indexOf(slot),
    };
  }).filter(Boolean);
  
  // Filtrage par type
  if (type) {
    items = items.filter(item => item.type === type);
  }
  
  // Filtrage par équipé/non équipé
  if (equipped !== undefined) {
    items = items.filter(item => item.equipped === equipped);
  }
  
  // Tri
  items.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'rarity':
        const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'artifact'];
        return rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity);
      case 'type':
        return a.type.localeCompare(b.type);
      case 'price':
        return b.price - a.price;
      default:
        return 0;
    }
  });
  
  return items;
}

export default {
  getItem,
  getItemsByCategory,
  getItemsByType,
  getStarterKit,
  canEquipItem,
  calculateWeaponDamage,
  calculateArmorAC,
  useConsumable,
  addToInventory,
  removeFromInventory,
  calculateInventoryWeight,
  calculateCarryCapacity,
  getInventoryItems,
};
