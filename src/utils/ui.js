/**
 * Valthera Adventures - Système d'Interface Utilisateur Discord
 * 
 * Ce module centralise tous les composants UI pour garantir
 * une expérience cohérente et attrayante pour les joueurs.
 */

import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder,
} from 'discord.js';
import constants from '../config/constants.js';

const { embedColors, emojis } = constants.bot;

// ============================================================
// 🎨 CONFIGURATION DES THÈMES
// ============================================================

export const themes = {
  // Thème principal violet
  primary: {
    color: embedColors.primary,
    accent: '🟣',
    border: '═',
  },
  // Combat - rouge agressif
  combat: {
    color: embedColors.combat,
    accent: '⚔️',
    border: '━',
  },
  // Succès - vert
  success: {
    color: embedColors.success,
    accent: '✅',
    border: '─',
  },
  // Erreur - rouge
  error: {
    color: embedColors.error,
    accent: '❌',
    border: '─',
  },
  // Info - bleu
  info: {
    color: embedColors.info,
    accent: 'ℹ️',
    border: '─',
  },
  // Or/économie
  gold: {
    color: embedColors.gold,
    accent: '💰',
    border: '═',
  },
  // Quête
  quest: {
    color: embedColors.legendary,
    accent: '📜',
    border: '═',
  },
  // Inventaire
  inventory: {
    color: 0x6366f1,
    accent: '🎒',
    border: '─',
  },
  // Exploration
  exploration: {
    color: 0x059669,
    accent: '🗺️',
    border: '═',
  },
};

// ============================================================
// 📊 BARRES DE PROGRESSION STYLISÉES
// ============================================================

/**
 * Crée une barre de progression avec style
 */
export function progressBar(current, max, options = {}) {
  const {
    length = 10,
    filled = '█',
    empty = '░',
    showPercent = false,
    showValues = true,
    brackets = false,
  } = options;

  const percentage = Math.max(0, Math.min(current / max, 1));
  const filledCount = Math.round(percentage * length);
  const emptyCount = length - filledCount;
  
  let bar = filled.repeat(filledCount) + empty.repeat(emptyCount);
  
  if (brackets) {
    bar = `[${bar}]`;
  }
  
  const parts = [bar];
  
  if (showValues) {
    parts.push(`${current}/${max}`);
  }
  
  if (showPercent) {
    parts.push(`(${Math.round(percentage * 100)}%)`);
  }
  
  return parts.join(' ');
}

/**
 * Barre de HP avec couleur dynamique et emoji
 */
export function hpBar(current, max, options = {}) {
  const { showEmoji = true, compact = false } = options;
  
  const percentage = current / max;
  let indicator, color;
  
  if (percentage > 0.75) {
    indicator = '🟢';
    color = 'healthy';
  } else if (percentage > 0.5) {
    indicator = '🟡';
    color = 'hurt';
  } else if (percentage > 0.25) {
    indicator = '🟠';
    color = 'wounded';
  } else if (percentage > 0) {
    indicator = '🔴';
    color = 'critical';
  } else {
    indicator = '💀';
    color = 'dead';
  }
  
  const bar = progressBar(current, max, { 
    length: compact ? 8 : 10,
    showValues: true,
    showPercent: false,
  });
  
  return showEmoji ? `${indicator} ${bar}` : bar;
}

/**
 * Barre d'XP stylisée
 */
export function xpBar(currentXP, requiredXP, level) {
  const bar = progressBar(currentXP, requiredXP, {
    length: 12,
    filled: '▰',
    empty: '▱',
    showPercent: true,
  });
  
  return `✨ Niveau ${level} ${bar}`;
}

/**
 * Barre de mana/ressource
 */
export function resourceBar(current, max, emoji = '💠') {
  const bar = progressBar(current, max, {
    length: 8,
    filled: '◆',
    empty: '◇',
    showValues: true,
  });
  
  return `${emoji} ${bar}`;
}

// ============================================================
// 📦 CARTES D'AFFICHAGE
// ============================================================

/**
 * Crée une carte d'embed stylisée
 */
export function card(options = {}) {
  const {
    theme = 'primary',
    title,
    description,
    fields = [],
    thumbnail,
    image,
    footer,
    author,
    timestamp = true,
  } = options;

  const themeConfig = themes[theme] || themes.primary;
  
  const embed = new EmbedBuilder()
    .setColor(themeConfig.color);
  
  if (title) {
    embed.setTitle(title);
  }
  
  if (description) {
    embed.setDescription(description);
  }
  
  if (fields.length > 0) {
    embed.addFields(fields);
  }
  
  if (thumbnail) {
    embed.setThumbnail(thumbnail);
  }
  
  if (image) {
    embed.setImage(image);
  }
  
  if (footer) {
    embed.setFooter(typeof footer === 'string' ? { text: footer } : footer);
  }
  
  if (author) {
    embed.setAuthor(typeof author === 'string' ? { name: author } : author);
  }
  
  if (timestamp) {
    embed.setTimestamp();
  }
  
  return embed;
}

/**
 * Carte de personnage compacte (pour listes, combats, etc.)
 */
export function characterCard(character, options = {}) {
  const { compact = false, showStats = true } = options;
  
  const hpDisplay = hpBar(character.hp.current, character.hp.max, { compact });
  
  if (compact) {
    return [
      `**${character.name}**`,
      `${character.race} ${character.class} Niv.${character.level}`,
      hpDisplay,
    ].join('\n');
  }
  
  const lines = [
    `**${character.name}**`,
    `*${character.race}${character.subrace ? ` (${character.subrace})` : ''} - ${character.class} Niv.${character.level}*`,
    '',
    `${emojis.hp} **PV:** ${hpDisplay}`,
    `${emojis.ac} **CA:** ${character.ac} │ 🏃 **Vitesse:** ${character.speed} ft`,
  ];
  
  if (showStats) {
    lines.push(
      '',
      formatAttributes(character.attributes),
    );
  }
  
  return lines.join('\n');
}

/**
 * Carte d'item stylisée
 */
export function itemCard(item, options = {}) {
  const { showPrice = false, showDescription = true, compact = false } = options;
  
  const rarityEmoji = getRarityEmoji(item.rarity);
  const rarityName = getRarityName(item.rarity);
  
  if (compact) {
    const qty = item.quantity > 1 ? ` x${item.quantity}` : '';
    const equipped = item.equipped ? ' 🔹' : '';
    return `${rarityEmoji} **${item.name}**${qty}${equipped}`;
  }
  
  const lines = [
    `${rarityEmoji} **${item.name}**`,
    `*${rarityName} - ${item.type}*`,
  ];
  
  if (showDescription && item.description) {
    lines.push('', `> ${item.description}`);
  }
  
  if (item.stats) {
    const statLines = [];
    if (item.stats.damage) statLines.push(`⚔️ Dégâts: ${item.stats.damage}`);
    if (item.stats.armorClass) statLines.push(`🛡️ CA: +${item.stats.armorClass}`);
    if (item.stats.healing) statLines.push(`❤️ Soins: ${item.stats.healing}`);
    if (statLines.length) {
      lines.push('', statLines.join(' │ '));
    }
  }
  
  if (showPrice) {
    lines.push(`💰 Prix: ${formatGold(item.price)}`);
  }
  
  return lines.join('\n');
}

/**
 * Carte de monstre pour le combat
 */
export function monsterCard(monster, options = {}) {
  const { showHP = true, showStats = false } = options;
  
  const lines = [
    `**${monster.emoji || '👹'} ${monster.name}**`,
    `*${monster.type} - Niveau ${monster.level}*`,
  ];
  
  if (showHP) {
    lines.push('', hpBar(monster.hp.current, monster.hp.max));
  }
  
  if (showStats) {
    lines.push(
      '',
      `🛡️ CA: ${monster.ac} │ ⚔️ Attaque: +${monster.attackBonus}`,
      `💥 Dégâts: ${monster.damage}`,
    );
  }
  
  return lines.join('\n');
}

// ============================================================
// 🔘 COMPOSANTS INTERACTIFS
// ============================================================

/**
 * Styles de boutons prédéfinis
 */
export const buttonStyles = {
  primary: ButtonStyle.Primary,      // Bleu - Action principale
  secondary: ButtonStyle.Secondary,  // Gris - Action secondaire
  success: ButtonStyle.Success,      // Vert - Confirmation
  danger: ButtonStyle.Danger,        // Rouge - Action dangereuse
  link: ButtonStyle.Link,            // Lien externe
};

/**
 * Crée un bouton stylisé
 */
export function button(id, label, options = {}) {
  const {
    style = 'primary',
    emoji,
    disabled = false,
    url,
  } = options;

  const btn = new ButtonBuilder()
    .setLabel(label)
    .setStyle(buttonStyles[style] || ButtonStyle.Primary)
    .setDisabled(disabled);
  
  if (url && style === 'link') {
    btn.setURL(url);
  } else {
    btn.setCustomId(id);
  }
  
  if (emoji) {
    btn.setEmoji(emoji);
  }
  
  return btn;
}

/**
 * Crée une rangée de boutons d'action pour le combat
 */
export function combatActionButtons(options = {}) {
  const { disabled = false, canFlee = true } = options;
  
  return new ActionRowBuilder().addComponents(
    button('combat:attack', 'Attaquer', { 
      style: 'danger', 
      emoji: '⚔️',
      disabled,
    }),
    button('combat:defend', 'Défendre', { 
      style: 'primary', 
      emoji: '🛡️',
      disabled,
    }),
    button('combat:ability', 'Capacité', { 
      style: 'secondary', 
      emoji: '✨',
      disabled,
    }),
    button('combat:item', 'Objet', { 
      style: 'secondary', 
      emoji: '🎒',
      disabled,
    }),
    button('combat:flee', 'Fuir', { 
      style: 'secondary', 
      emoji: '🏃',
      disabled: disabled || !canFlee,
    }),
  );
}

/**
 * Crée des boutons de navigation (pagination)
 */
export function paginationButtons(prefix, currentPage, totalPages, options = {}) {
  const { extraButtons = [] } = options;
  
  const row = new ActionRowBuilder().addComponents(
    button(`${prefix}:first`, '⏮️', { 
      style: 'secondary',
      disabled: currentPage <= 1,
    }),
    button(`${prefix}:prev`, '◀️', { 
      style: 'secondary',
      disabled: currentPage <= 1,
    }),
    button(`${prefix}:page`, `${currentPage}/${totalPages}`, { 
      style: 'secondary',
      disabled: true,
    }),
    button(`${prefix}:next`, '▶️', { 
      style: 'secondary',
      disabled: currentPage >= totalPages,
    }),
    button(`${prefix}:last`, '⏭️', { 
      style: 'secondary',
      disabled: currentPage >= totalPages,
    }),
  );
  
  return row;
}

/**
 * Crée des boutons de confirmation
 */
export function confirmButtons(prefix, options = {}) {
  const { 
    confirmLabel = 'Confirmer', 
    cancelLabel = 'Annuler',
    confirmEmoji = '✅',
    cancelEmoji = '❌',
  } = options;
  
  return new ActionRowBuilder().addComponents(
    button(`${prefix}:confirm`, confirmLabel, { 
      style: 'success',
      emoji: confirmEmoji,
    }),
    button(`${prefix}:cancel`, cancelLabel, { 
      style: 'danger',
      emoji: cancelEmoji,
    }),
  );
}

/**
 * Crée un menu de sélection stylisé
 */
export function selectMenu(id, placeholder, selectOptions, options = {}) {
  const { disabled = false, minValues = 1, maxValues = 1 } = options;
  
  const menu = new StringSelectMenuBuilder()
    .setCustomId(id)
    .setPlaceholder(placeholder)
    .setMinValues(minValues)
    .setMaxValues(maxValues)
    .setDisabled(disabled)
    .addOptions(selectOptions);
  
  return new ActionRowBuilder().addComponents(menu);
}

/**
 * Options de filtre pour l'inventaire
 */
export function inventoryFilterButtons(prefix, activeFilter = 'all') {
  const filters = [
    { id: 'all', label: 'Tout', emoji: '📦' },
    { id: 'weapon', label: 'Armes', emoji: '⚔️' },
    { id: 'armor', label: 'Armures', emoji: '🛡️' },
    { id: 'consumable', label: 'Consommables', emoji: '🧪' },
    { id: 'misc', label: 'Divers', emoji: '📿' },
  ];
  
  return new ActionRowBuilder().addComponents(
    ...filters.map(f => 
      button(`${prefix}:filter:${f.id}`, f.label, {
        style: activeFilter === f.id ? 'primary' : 'secondary',
        emoji: f.emoji,
      })
    )
  );
}

// ============================================================
// 🎮 AFFICHAGES DE JEU
// ============================================================

/**
 * Affiche les attributs de manière compacte
 */
export function formatAttributes(attributes, options = {}) {
  const { inline = true, showMod = true } = options;
  
  const attrEmojis = {
    str: '💪',
    dex: '🏃',
    con: '🫀',
    int: '🧠',
    wis: '👁️',
    cha: '💬',
  };
  
  const attrNames = {
    str: 'FOR',
    dex: 'DEX',
    con: 'CON',
    int: 'INT',
    wis: 'SAG',
    cha: 'CHA',
  };
  
  const formatted = Object.entries(attributes).map(([attr, value]) => {
    const mod = Math.floor((value - 10) / 2);
    const modStr = showMod ? ` (${mod >= 0 ? '+' : ''}${mod})` : '';
    return `${attrEmojis[attr]} ${attrNames[attr]}: **${value}**${modStr}`;
  });
  
  if (inline) {
    // Format: FOR: 14 (+2) │ DEX: 12 (+1) │ ...
    return formatted.join(' │ ');
  }
  
  return formatted.join('\n');
}

/**
 * Affiche l'équipement du personnage
 */
export function formatEquipment(equipment, items) {
  const slots = {
    mainHand: { name: 'Main principale', emoji: '🗡️' },
    offHand: { name: 'Main secondaire', emoji: '🛡️' },
    head: { name: 'Tête', emoji: '👒' },
    chest: { name: 'Torse', emoji: '👕' },
    legs: { name: 'Jambes', emoji: '👖' },
    feet: { name: 'Pieds', emoji: '👢' },
    hands: { name: 'Mains', emoji: '🧤' },
    ring1: { name: 'Anneau 1', emoji: '💍' },
    ring2: { name: 'Anneau 2', emoji: '💍' },
    amulet: { name: 'Amulette', emoji: '📿' },
  };
  
  const lines = [];
  
  for (const [slot, config] of Object.entries(slots)) {
    const itemId = equipment[slot];
    const item = items?.find(i => i._id?.toString() === itemId?.toString());
    const itemName = item ? `**${item.name}**` : '*Vide*';
    lines.push(`${config.emoji} ${config.name}: ${itemName}`);
  }
  
  return lines.join('\n');
}

/**
 * Affiche la monnaie de manière stylisée
 */
export function formatGold(gold) {
  if (typeof gold === 'number') {
    return `${gold} 🪙`;
  }
  
  const parts = [];
  if (gold.platinum) parts.push(`${gold.platinum} <:platinum:>PP`);
  if (gold.gold) parts.push(`${gold.gold} 🪙PO`);
  if (gold.silver) parts.push(`${gold.silver} 🥈PA`);
  if (gold.copper) parts.push(`${gold.copper} 🥉PC`);
  
  return parts.length > 0 ? parts.join(' ') : '0 🪙PO';
}

/**
 * Convertit l'or total en pièces
 */
export function goldToPieces(totalCopper) {
  const platinum = Math.floor(totalCopper / 1000);
  totalCopper %= 1000;
  const gold = Math.floor(totalCopper / 100);
  totalCopper %= 100;
  const silver = Math.floor(totalCopper / 10);
  const copper = totalCopper % 10;
  
  return { platinum, gold, silver, copper };
}

// ============================================================
// 📊 UTILITAIRES DE RARETÉ
// ============================================================

export function getRarityEmoji(rarity) {
  const emojis = {
    common: '⚪',
    uncommon: '🟢',
    rare: '🔵',
    epic: '🟣',
    legendary: '🟠',
    artifact: '🔴',
  };
  return emojis[rarity] || '⚪';
}

export function getRarityName(rarity) {
  const names = {
    common: 'Commun',
    uncommon: 'Peu commun',
    rare: 'Rare',
    epic: 'Épique',
    legendary: 'Légendaire',
    artifact: 'Artefact',
  };
  return names[rarity] || 'Commun';
}

export function getRarityColor(rarity) {
  return constants.rarities[rarity]?.color || embedColors.common;
}

// ============================================================
// 🎲 AFFICHAGES DE JETS DE DÉS
// ============================================================

/**
 * Formate un résultat de jet de dé
 */
export function formatDiceRoll(rollResult, options = {}) {
  const { showBreakdown = true, label = '' } = options;
  
  let text = '';
  
  if (label) {
    text += `**${label}:** `;
  }
  
  // Emoji selon le résultat
  let emoji = '🎲';
  if (rollResult.critical) emoji = '💥';
  else if (rollResult.fumble) emoji = '💀';
  else if (rollResult.total >= 20) emoji = '✨';
  
  text += `${emoji} **${rollResult.total}**`;
  
  if (showBreakdown && rollResult.rolls) {
    const rollsStr = rollResult.rolls.join(', ');
    text += ` *(${rollResult.diceNotation}: [${rollsStr}]`;
    if (rollResult.modifier) {
      const modSign = rollResult.modifier >= 0 ? '+' : '';
      text += ` ${modSign}${rollResult.modifier}`;
    }
    text += ')*';
  }
  
  if (rollResult.advantage) text += ' 🔼 Avantage';
  if (rollResult.disadvantage) text += ' 🔽 Désavantage';
  
  return text;
}

/**
 * Crée un séparateur visuel
 */
export function separator(style = 'line') {
  const separators = {
    line: '─────────────────────────',
    double: '═════════════════════════',
    dots: '• • • • • • • • • • • • •',
    stars: '✧ ─────────────── ✧',
    fancy: '╔═══════════════════════╗',
  };
  return separators[style] || separators.line;
}

/**
 * Encadre du texte
 */
export function boxText(text, options = {}) {
  const { width = 30, style = 'simple' } = options;
  
  const styles = {
    simple: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
    double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
    rounded: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
  };
  
  const s = styles[style] || styles.simple;
  const lines = text.split('\n');
  const maxLen = Math.max(...lines.map(l => l.length), width);
  
  const top = s.tl + s.h.repeat(maxLen + 2) + s.tr;
  const bottom = s.bl + s.h.repeat(maxLen + 2) + s.br;
  const middle = lines.map(l => `${s.v} ${l.padEnd(maxLen)} ${s.v}`).join('\n');
  
  return `\`\`\`\n${top}\n${middle}\n${bottom}\n\`\`\``;
}

// ============================================================
// 📤 EXPORT PAR DÉFAUT
// ============================================================

export default {
  themes,
  progressBar,
  hpBar,
  xpBar,
  resourceBar,
  card,
  characterCard,
  itemCard,
  monsterCard,
  button,
  buttonStyles,
  combatActionButtons,
  paginationButtons,
  confirmButtons,
  selectMenu,
  inventoryFilterButtons,
  formatAttributes,
  formatEquipment,
  formatGold,
  goldToPieces,
  getRarityEmoji,
  getRarityName,
  getRarityColor,
  formatDiceRoll,
  separator,
  boxText,
};
