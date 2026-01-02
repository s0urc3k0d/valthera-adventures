import { EmbedBuilder } from 'discord.js';
import constants from '../config/constants.js';

const { embedColors } = constants.bot;
const { emojis } = constants;

/**
 * Crée un embed de base avec le style Valthera
 * @param {Object} options - Options de l'embed
 * @returns {EmbedBuilder}
 */
export function createEmbed(options = {}) {
  const embed = new EmbedBuilder()
    .setColor(options.color || embedColors.primary)
    .setTimestamp();
  
  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.footer) embed.setFooter({ text: options.footer });
  if (options.author) embed.setAuthor(options.author);
  if (options.fields) embed.addFields(options.fields);
  
  return embed;
}

/**
 * Embed de succès
 */
export function successEmbed(title, description) {
  return createEmbed({
    title: `${emojis.success} ${title}`,
    description,
    color: embedColors.success,
  });
}

/**
 * Embed d'erreur
 */
export function errorEmbed(title, description) {
  return createEmbed({
    title: `${emojis.error} ${title}`,
    description,
    color: embedColors.error,
  });
}

/**
 * Embed d'avertissement
 */
export function warningEmbed(title, description) {
  return createEmbed({
    title: `${emojis.warning} ${title}`,
    description,
    color: embedColors.warning,
  });
}

/**
 * Embed d'information
 */
export function infoEmbed(title, description) {
  return createEmbed({
    title: `${emojis.info} ${title}`,
    description,
    color: embedColors.info,
  });
}

/**
 * Crée une barre de progression visuelle
 * @param {number} current - Valeur actuelle
 * @param {number} max - Valeur maximale
 * @param {number} length - Longueur de la barre (caractères)
 * @param {string} fillChar - Caractère de remplissage
 * @param {string} emptyChar - Caractère vide
 * @returns {string} Barre de progression
 */
export function createProgressBar(current, max, length = 10, fillChar = '█', emptyChar = '░') {
  const percentage = Math.min(current / max, 1);
  const filled = Math.round(percentage * length);
  const empty = length - filled;
  
  return fillChar.repeat(filled) + emptyChar.repeat(empty);
}

/**
 * Crée une barre de HP colorée
 * @param {number} current - HP actuels
 * @param {number} max - HP max
 * @returns {string} Barre de HP formatée
 */
export function createHPBar(current, max) {
  const percentage = current / max;
  const bar = createProgressBar(current, max, 10);
  
  let color = '🟢'; // Vert > 50%
  if (percentage <= 0.25) color = '🔴'; // Rouge <= 25%
  else if (percentage <= 0.5) color = '🟡'; // Jaune <= 50%
  
  return `${color} ${bar} ${current}/${max}`;
}

/**
 * Crée une barre d'XP
 * @param {number} currentXP - XP actuels
 * @param {number} requiredXP - XP requis pour niveau suivant
 * @returns {string} Barre d'XP formatée
 */
export function createXPBar(currentXP, requiredXP) {
  const bar = createProgressBar(currentXP, requiredXP, 10);
  const percentage = Math.floor((currentXP / requiredXP) * 100);
  
  return `${emojis.xp} ${bar} ${currentXP}/${requiredXP} (${percentage}%)`;
}

/**
 * Embed de feuille de personnage
 * @param {Object} character - Données du personnage
 * @returns {EmbedBuilder}
 */
export function characterSheetEmbed(character) {
  const { attributes } = character;
  
  const embed = createEmbed({
    title: `📜 ${character.name}`,
    color: embedColors.primary,
    thumbnail: character.avatar || null,
  });
  
  // Informations générales
  embed.addFields({
    name: '👤 Informations',
    value: [
      `**Race:** ${character.race}`,
      `**Classe:** ${character.class}`,
      `**Niveau:** ${character.level}`,
    ].join('\n'),
    inline: true,
  });
  
  // Stats vitales
  embed.addFields({
    name: '💫 Stats',
    value: [
      `${emojis.hp} **PV:** ${character.hp.current}/${character.hp.max}`,
      `${emojis.ac} **CA:** ${character.ac}`,
      createXPBar(character.xp, constants.game.xpToLevel(character.level + 1)),
    ].join('\n'),
    inline: true,
  });
  
  // Attributs
  embed.addFields({
    name: '📊 Attributs',
    value: [
      `${emojis.str} **FOR:** ${attributes.str} (${formatModifier(attributes.str)})`,
      `${emojis.dex} **DEX:** ${attributes.dex} (${formatModifier(attributes.dex)})`,
      `${emojis.con} **CON:** ${attributes.con} (${formatModifier(attributes.con)})`,
      `${emojis.int} **INT:** ${attributes.int} (${formatModifier(attributes.int)})`,
      `${emojis.wis} **SAG:** ${attributes.wis} (${formatModifier(attributes.wis)})`,
      `${emojis.cha} **CHA:** ${attributes.cha} (${formatModifier(attributes.cha)})`,
    ].join('\n'),
    inline: false,
  });
  
  // Or
  embed.addFields({
    name: `${emojis.gold} Richesse`,
    value: formatGold(character.gold),
    inline: true,
  });
  
  // Localisation
  embed.addFields({
    name: `${emojis.map} Position`,
    value: character.location || 'Inconnue',
    inline: true,
  });
  
  return embed;
}

/**
 * Embed de combat
 * @param {Object} combatState - État du combat
 * @returns {EmbedBuilder}
 */
export function combatEmbed(combatState) {
  const embed = createEmbed({
    title: `${emojis.combat} Combat en cours!`,
    color: embedColors.combat,
  });
  
  // Affichage des participants
  const playerFields = combatState.players.map(p => ({
    name: `${p.name} (Joueur)`,
    value: createHPBar(p.hp.current, p.hp.max),
    inline: true,
  }));
  
  const monsterFields = combatState.monsters.map(m => ({
    name: `${m.name}`,
    value: createHPBar(m.hp.current, m.hp.max),
    inline: true,
  }));
  
  embed.addFields([...playerFields, ...monsterFields]);
  
  // Tour actuel
  if (combatState.currentTurn) {
    embed.addFields({
      name: '🎯 Tour actuel',
      value: `C'est au tour de **${combatState.currentTurn.name}**`,
      inline: false,
    });
  }
  
  return embed;
}

/**
 * Embed d'inventaire
 * @param {Object} character - Personnage
 * @param {Array} items - Liste des items
 * @param {number} page - Page actuelle
 * @param {number} totalPages - Nombre total de pages
 * @returns {EmbedBuilder}
 */
export function inventoryEmbed(character, items, page = 1, totalPages = 1) {
  const embed = createEmbed({
    title: `${emojis.inventory} Inventaire de ${character.name}`,
    color: embedColors.primary,
    footer: `Page ${page}/${totalPages} | Poids: ${character.currentWeight}/${character.maxWeight} lb`,
  });
  
  if (items.length === 0) {
    embed.setDescription('Votre inventaire est vide.');
    return embed;
  }
  
  const itemList = items.map(item => {
    const equipped = item.equipped ? ' 🔹' : '';
    const quantity = item.quantity > 1 ? ` (x${item.quantity})` : '';
    const rarityColor = getRarityEmoji(item.rarity);
    return `${rarityColor} **${item.name}**${quantity}${equipped}`;
  }).join('\n');
  
  embed.setDescription(itemList);
  
  return embed;
}

/**
 * Embed de boutique
 * @param {Object} shop - Données de la boutique
 * @param {Array} items - Items en vente
 * @param {number} page - Page actuelle
 * @param {number} totalPages - Nombre total de pages
 * @returns {EmbedBuilder}
 */
export function shopEmbed(shop, items, page = 1, totalPages = 1) {
  const embed = createEmbed({
    title: `${emojis.shop} ${shop.name}`,
    description: shop.description || 'Bienvenue dans ma boutique!',
    color: embedColors.gold,
    footer: `Page ${page}/${totalPages}`,
  });
  
  if (items.length === 0) {
    embed.addFields({
      name: 'Stock',
      value: 'Aucun article disponible pour le moment.',
    });
    return embed;
  }
  
  const itemList = items.map(item => {
    const rarityEmoji = getRarityEmoji(item.rarity);
    return `${rarityEmoji} **${item.name}** - ${formatGold({ gold: item.price })}`;
  }).join('\n');
  
  embed.addFields({
    name: 'Articles en vente',
    value: itemList,
  });
  
  return embed;
}

/**
 * Embed de quête
 * @param {Object} quest - Données de la quête
 * @returns {EmbedBuilder}
 */
export function questEmbed(quest) {
  const typeColors = {
    main: embedColors.legendary,
    side: embedColors.rare,
    contract: embedColors.uncommon,
    daily: embedColors.common,
  };
  
  const embed = createEmbed({
    title: `${emojis.quest} ${quest.title}`,
    description: quest.description,
    color: typeColors[quest.type] || embedColors.info,
  });
  
  // Objectifs
  const objectives = quest.objectives.map(obj => {
    const status = obj.current >= obj.required ? '✅' : '⬜';
    return `${status} ${obj.description} (${obj.current}/${obj.required})`;
  }).join('\n');
  
  embed.addFields({
    name: '📋 Objectifs',
    value: objectives,
  });
  
  // Récompenses
  const rewards = [];
  if (quest.rewards.xp) rewards.push(`${emojis.xp} ${quest.rewards.xp} XP`);
  if (quest.rewards.gold) rewards.push(`${emojis.gold} ${quest.rewards.gold} PO`);
  if (quest.rewards.items?.length) {
    rewards.push(`🎁 ${quest.rewards.items.length} objet(s)`);
  }
  
  embed.addFields({
    name: '🏆 Récompenses',
    value: rewards.join(' | '),
  });
  
  return embed;
}

/**
 * Formate un modificateur d'attribut
 * @param {number} score - Score d'attribut
 * @returns {string} Modificateur formaté
 */
function formatModifier(score) {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

/**
 * Formate l'or pour l'affichage
 * @param {Object} gold - { copper, silver, gold, platinum }
 * @returns {string} Or formaté
 */
export function formatGold(gold) {
  const parts = [];
  if (gold.platinum) parts.push(`${gold.platinum} PP`);
  if (gold.gold) parts.push(`${gold.gold} PO`);
  if (gold.silver) parts.push(`${gold.silver} PA`);
  if (gold.copper) parts.push(`${gold.copper} PC`);
  
  return parts.length > 0 ? parts.join(' ') : '0 PO';
}

/**
 * Retourne l'emoji de rareté
 * @param {string} rarity - Niveau de rareté
 * @returns {string} Emoji correspondant
 */
export function getRarityEmoji(rarity) {
  const rarityEmojis = {
    common: '⚪',
    uncommon: '🟢',
    rare: '🔵',
    epic: '🟣',
    legendary: '🟠',
    artifact: '🔴',
  };
  return rarityEmojis[rarity] || '⚪';
}

/**
 * Retourne la couleur de rareté
 * @param {string} rarity - Niveau de rareté
 * @returns {number} Couleur hexadécimale
 */
export function getRarityColor(rarity) {
  return constants.rarities[rarity]?.color || embedColors.common;
}

export default {
  createEmbed,
  successEmbed,
  errorEmbed,
  warningEmbed,
  infoEmbed,
  createProgressBar,
  createHPBar,
  createXPBar,
  characterSheetEmbed,
  combatEmbed,
  inventoryEmbed,
  shopEmbed,
  questEmbed,
  formatGold,
  getRarityEmoji,
  getRarityColor,
};
