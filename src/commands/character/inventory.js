/**
 * Commande /inventory - Gestion de l'inventaire
 * Interface intuitive avec pagination, filtres et actions
 */

import { 
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import Character from '../../models/Character.js';
import { 
  card, 
  hpBar, 
  progressBar,
  button,
  paginationButtons,
  getRarityEmoji,
  getRarityName,
  formatGold,
  separator,
} from '../../utils/ui.js';
import { errorEmbed, successEmbed } from '../../utils/embedBuilder.js';
import { 
  getItem, 
  getInventoryItems,
  calculateInventoryWeight,
  calculateCarryCapacity,
  useConsumable,
  removeFromInventory,
} from '../../utils/itemService.js';
import { inventorySessions } from '../../utils/sessionManager.js';
import logger from '../../utils/logger.js';

// Configuration de la pagination
const ITEMS_PER_PAGE = 8;

export default {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Gérer votre inventaire')
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Action à effectuer')
        .setRequired(false)
        .addChoices(
          { name: '📦 Voir l\'inventaire', value: 'view' },
          { name: '⚔️ Équipement', value: 'equipment' },
          { name: '🧪 Utiliser', value: 'use' },
        )),
  
  cooldown: 3,
  
  async execute(interaction) {
    const character = await Character.findByDiscordId(
      interaction.user.id,
      interaction.guildId
    );
    
    if (!character) {
      return interaction.reply({
        embeds: [errorEmbed(
          'Pas de personnage',
          'Vous n\'avez pas encore de personnage. Utilisez `/create` pour en créer un!'
        )],
        ephemeral: true,
      });
    }
    
    const action = interaction.options.getString('action') || 'view';
    
    // Initialiser la session d'inventaire (TTL automatique de 10 min)
    const session = {
      odUserId: interaction.user.id,
      odGuildId: interaction.guildId,
      page: 1,
      filter: 'all',
      character,
    };
    inventorySessions.set(interaction.user.id, session);
    
    switch (action) {
      case 'view':
        await showInventory(interaction, session);
        break;
      case 'equipment':
        await showEquipment(interaction, session);
        break;
      case 'use':
        await showUsableItems(interaction, session);
        break;
      default:
        await showInventory(interaction, session);
    }
  },
  
  // Gestion des boutons
  async handleButton(interaction, client, params) {
    const session = inventorySessions.get(interaction.user.id);
    if (!session) {
      return interaction.reply({
        embeds: [errorEmbed('Session expirée', 'Utilisez `/inventory` à nouveau.')],
        ephemeral: true,
      });
    }
    
    // Vérification du propriétaire
    if (session.odUserId !== interaction.user.id) {
      return interaction.reply({
        embeds: [errorEmbed('Session invalide', 'Cette session ne vous appartient pas.')],
        ephemeral: true,
      });
    }
    
    // Recharger le personnage pour avoir les données à jour
    session.character = await Character.findByDiscordId(
      interaction.user.id,
      interaction.guildId
    );
    
    const [action, ...args] = params;
    
    switch (action) {
      case 'page':
        await handlePagination(interaction, session, args[0]);
        break;
      case 'filter':
        await handleFilter(interaction, session, args[0]);
        break;
      case 'equip':
        await handleEquip(interaction, session, args[0]);
        break;
      case 'unequip':
        await handleUnequip(interaction, session, args[0]);
        break;
      case 'use':
        await handleUse(interaction, session, args[0]);
        break;
      case 'drop':
        await handleDrop(interaction, session, args[0]);
        break;
      case 'view':
        session.filter = 'all';
        session.page = 1;
        await showInventory(interaction, session, true);
        break;
      case 'equipment':
        await showEquipment(interaction, session, true);
        break;
      case 'usable':
        await showUsableItems(interaction, session, true);
        break;
    }
  },
  
  // Gestion des menus de sélection
  async handleSelectMenu(interaction, client, params) {
    const session = inventorySessions.get(interaction.user.id);
    if (!session) {
      return interaction.reply({
        embeds: [errorEmbed('Session expirée', 'Utilisez `/inventory` à nouveau.')],
        ephemeral: true,
      });
    }
    
    // Vérification du propriétaire
    if (session.odUserId !== interaction.user.id) {
      return interaction.reply({
        embeds: [errorEmbed('Session invalide', 'Cette session ne vous appartient pas.')],
        ephemeral: true,
      });
    }
    
    session.character = await Character.findByDiscordId(
      interaction.user.id,
      interaction.guildId
    );
    
    const [menuType] = params;
    const selected = interaction.values[0];
    
    switch (menuType) {
      case 'item':
        await showItemDetails(interaction, session, selected);
        break;
      case 'use':
        await confirmUseItem(interaction, session, selected);
        break;
      case 'equip':
        await confirmEquipItem(interaction, session, selected);
        break;
    }
  },
};

// ============================================================
// AFFICHAGES PRINCIPAUX
// ============================================================

/**
 * Affiche l'inventaire paginé
 */
async function showInventory(interaction, session, isUpdate = false) {
  const { character, page, filter } = session;
  
  // Récupérer les items filtrés
  let typeFilter = null;
  if (filter !== 'all') {
    const filterMap = {
      'weapon': 'weapon',
      'armor': 'armor',
      'consumable': 'consumable',
      'accessory': 'accessory',
      'misc': 'misc',
    };
    typeFilter = filterMap[filter];
  }
  
  const allItems = getInventoryItems(character, { type: typeFilter, sortBy: 'rarity' });
  const totalPages = Math.max(1, Math.ceil(allItems.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  session.page = currentPage;
  
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = allItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  
  // Calcul du poids
  const weight = calculateInventoryWeight(character);
  const maxWeight = calculateCarryCapacity(character);
  const weightPercent = Math.round((weight / maxWeight) * 100);
  const weightBar = progressBar(weight, maxWeight, { length: 10, showValues: false });
  
  // Construction de l'embed
  const embed = card({
    theme: 'inventory',
    title: `🎒 Inventaire de ${character.name}`,
    description: buildInventoryDescription(pageItems, allItems.length),
    footer: {
      text: `Page ${currentPage}/${totalPages} • ${allItems.length} objet(s) • Poids: ${weight.toFixed(1)}/${maxWeight} lb (${weightPercent}%)`,
    },
  });
  
  // Ajouter le résumé de l'or
  embed.addFields({
    name: '💰 Bourse',
    value: formatGold(character.gold),
    inline: true,
  });
  
  embed.addFields({
    name: '⚖️ Capacité',
    value: `${weightBar} ${weightPercent}%`,
    inline: true,
  });
  
  // Composants
  const components = [
    createFilterRow(filter),
    createNavigationRow(session),
  ];
  
  if (totalPages > 1) {
    components.push(paginationButtons('inventory:page', currentPage, totalPages));
  }
  
  // Ajouter le menu de sélection d'item si des items existent
  if (pageItems.length > 0) {
    components.push(createItemSelectMenu(pageItems));
  }
  
  const payload = { embeds: [embed], components };
  
  if (isUpdate) {
    await interaction.update(payload);
  } else {
    await interaction.reply({ ...payload, ephemeral: true });
  }
}

/**
 * Affiche l'équipement actuel
 */
async function showEquipment(interaction, session, isUpdate = false) {
  const { character } = session;
  
  const equipmentSlots = [
    { id: 'mainHand', name: 'Main principale', emoji: '🗡️' },
    { id: 'offHand', name: 'Main secondaire', emoji: '🛡️' },
    { id: 'head', name: 'Tête', emoji: '👒' },
    { id: 'chest', name: 'Torse', emoji: '👕' },
    { id: 'hands', name: 'Mains', emoji: '🧤' },
    { id: 'legs', name: 'Jambes', emoji: '👖' },
    { id: 'feet', name: 'Pieds', emoji: '👢' },
    { id: 'ring1', name: 'Anneau 1', emoji: '💍' },
    { id: 'ring2', name: 'Anneau 2', emoji: '💍' },
    { id: 'amulet', name: 'Amulette', emoji: '📿' },
    { id: 'cape', name: 'Cape', emoji: '🧥' },
    { id: 'belt', name: 'Ceinture', emoji: '🎗️' },
  ];
  
  const equippedItems = character.inventory.filter(slot => slot.equipped);
  
  let equipmentText = '';
  for (const slot of equipmentSlots) {
    const equipped = equippedItems.find(i => i.slot === slot.id);
    const item = equipped ? getItem(equipped.itemId) : null;
    
    if (item) {
      const rarityEmoji = getRarityEmoji(item.rarity);
      equipmentText += `${slot.emoji} **${slot.name}:** ${rarityEmoji} ${item.name}\n`;
    } else {
      equipmentText += `${slot.emoji} **${slot.name}:** *Vide*\n`;
    }
  }
  
  const embed = card({
    theme: 'primary',
    title: `⚔️ Équipement de ${character.name}`,
    description: equipmentText,
  });
  
  // Statistiques d'équipement
  embed.addFields({
    name: '📊 Statistiques',
    value: [
      `🛡️ **Classe d'Armure:** ${character.ac}`,
      `💪 **Bonus d'attaque:** +${calculateAttackBonus(character)}`,
      `🏃 **Vitesse:** ${character.speed} ft`,
    ].join('\n'),
    inline: false,
  });
  
  const components = [
    createNavigationRow(session),
    createEquipmentActionsRow(equippedItems),
  ].filter(Boolean);
  
  const payload = { embeds: [embed], components };
  
  if (isUpdate) {
    await interaction.update(payload);
  } else {
    await interaction.reply({ ...payload, ephemeral: true });
  }
}

/**
 * Affiche les items utilisables
 */
async function showUsableItems(interaction, session, isUpdate = false) {
  const { character } = session;
  
  const usableItems = getInventoryItems(character, { type: 'consumable' });
  
  const embed = card({
    theme: 'info',
    title: `🧪 Objets utilisables`,
    description: usableItems.length > 0 
      ? buildUsableItemsList(usableItems)
      : '*Vous n\'avez aucun objet utilisable.*',
  });
  
  const components = [createNavigationRow(session)];
  
  if (usableItems.length > 0) {
    components.push(createUseItemMenu(usableItems));
  }
  
  const payload = { embeds: [embed], components };
  
  if (isUpdate) {
    await interaction.update(payload);
  } else {
    await interaction.reply({ ...payload, ephemeral: true });
  }
}

// ============================================================
// HANDLERS D'ACTIONS
// ============================================================

async function handlePagination(interaction, session, direction) {
  const items = getInventoryItems(session.character);
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  
  switch (direction) {
    case 'first':
      session.page = 1;
      break;
    case 'prev':
      session.page = Math.max(1, session.page - 1);
      break;
    case 'next':
      session.page = Math.min(totalPages, session.page + 1);
      break;
    case 'last':
      session.page = totalPages;
      break;
  }
  
  await showInventory(interaction, session, true);
}

async function handleFilter(interaction, session, filter) {
  session.filter = filter;
  session.page = 1;
  await showInventory(interaction, session, true);
}

async function handleEquip(interaction, session, inventoryIndex) {
  const { character } = session;
  const slot = character.inventory[parseInt(inventoryIndex)];
  
  if (!slot) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Item non trouvé.')],
      ephemeral: true,
    });
  }
  
  const item = getItem(slot.itemId);
  if (!item) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Item invalide.')],
      ephemeral: true,
    });
  }
  
  // Déterminer le slot d'équipement
  let equipSlot = item.slot;
  if (item.type === 'weapon') {
    equipSlot = 'mainHand';
  }
  
  if (!equipSlot) {
    return interaction.reply({
      embeds: [errorEmbed('Non équipable', 'Cet objet ne peut pas être équipé.')],
      ephemeral: true,
    });
  }
  
  // Déséquiper l'item actuel si présent
  const currentEquipped = character.inventory.find(
    i => i.equipped && i.slot === equipSlot
  );
  if (currentEquipped) {
    currentEquipped.equipped = false;
    currentEquipped.slot = null;
  }
  
  // Équiper le nouvel item
  slot.equipped = true;
  slot.slot = equipSlot;
  
  // Recalculer la CA si c'est une armure
  if (item.type === 'armor') {
    recalculateAC(character);
  }
  
  await character.save();
  
  logger.game(`${character.name} a équipé ${item.name}`, {
    userId: interaction.user.id,
    item: item.id,
  });
  
  await interaction.update({
    embeds: [successEmbed(
      'Objet équipé!',
      `Vous avez équipé **${item.name}**.`
    )],
    components: [createNavigationRow(session)],
  });
}

async function handleUnequip(interaction, session, inventoryIndex) {
  const { character } = session;
  const slot = character.inventory[parseInt(inventoryIndex)];
  
  if (!slot || !slot.equipped) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Cet objet n\'est pas équipé.')],
      ephemeral: true,
    });
  }
  
  const item = getItem(slot.itemId);
  
  slot.equipped = false;
  slot.slot = null;
  
  // Recalculer la CA si c'est une armure
  if (item.type === 'armor') {
    recalculateAC(character);
  }
  
  await character.save();
  
  await interaction.update({
    embeds: [successEmbed(
      'Objet déséquipé',
      `Vous avez déséquipé **${item.name}**.`
    )],
    components: [createNavigationRow(session)],
  });
}

async function handleUse(interaction, session, inventoryIndex) {
  const { character } = session;
  const slot = character.inventory[parseInt(inventoryIndex)];
  
  if (!slot) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Item non trouvé.')],
      ephemeral: true,
    });
  }
  
  const item = getItem(slot.itemId);
  if (!item || item.type !== 'consumable') {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Cet objet ne peut pas être utilisé.')],
      ephemeral: true,
    });
  }
  
  // Utiliser l'item
  const result = useConsumable(item, character);
  
  if (result.success) {
    // Retirer l'item de l'inventaire
    removeFromInventory(character, slot.itemId, 1);
    await character.save();
    
    logger.game(`${character.name} a utilisé ${item.name}`, {
      userId: interaction.user.id,
      result: result.changes,
    });
    
    const embed = card({
      theme: 'success',
      title: '✨ Objet utilisé!',
      description: result.message,
    });
    
    // Afficher les changements
    if (result.changes.hp) {
      embed.addFields({
        name: '❤️ Points de vie',
        value: `${result.changes.hp.before} → **${result.changes.hp.after}** (+${result.changes.hp.change})`,
        inline: true,
      });
    }
    
    await interaction.update({
      embeds: [embed],
      components: [createNavigationRow(session)],
    });
  } else {
    await interaction.reply({
      embeds: [errorEmbed('Échec', result.message)],
      ephemeral: true,
    });
  }
}

async function handleDrop(interaction, session, inventoryIndex) {
  const { character } = session;
  const slot = character.inventory[parseInt(inventoryIndex)];
  
  if (!slot) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Item non trouvé.')],
      ephemeral: true,
    });
  }
  
  if (slot.equipped) {
    return interaction.reply({
      embeds: [errorEmbed('Impossible', 'Vous devez d\'abord déséquiper cet objet.')],
      ephemeral: true,
    });
  }
  
  const item = getItem(slot.itemId);
  removeFromInventory(character, slot.itemId, 1);
  await character.save();
  
  await interaction.update({
    embeds: [successEmbed(
      'Objet jeté',
      `Vous avez jeté **${item.name}**.`
    )],
    components: [createNavigationRow(session)],
  });
}

async function showItemDetails(interaction, session, inventoryIndex) {
  const { character } = session;
  const slot = character.inventory[parseInt(inventoryIndex)];
  
  if (!slot) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Item non trouvé.')],
      ephemeral: true,
    });
  }
  
  const item = getItem(slot.itemId);
  const rarityColor = getRarityColor(item.rarity);
  
  const embed = card({
    theme: 'primary',
    title: `${item.emoji || '📦'} ${item.name}`,
    description: item.description,
  });
  
  embed.setColor(rarityColor);
  
  // Informations de base
  embed.addFields({
    name: '📋 Informations',
    value: [
      `**Type:** ${item.type}`,
      `**Rareté:** ${getRarityEmoji(item.rarity)} ${getRarityName(item.rarity)}`,
      `**Poids:** ${item.weight} lb`,
      `**Prix:** ${formatGold(item.price)}`,
    ].join('\n'),
    inline: true,
  });
  
  // Stats selon le type
  if (item.stats) {
    const statsLines = [];
    if (item.stats.damage) statsLines.push(`⚔️ Dégâts: ${item.stats.damage} ${item.stats.damageType}`);
    if (item.stats.armorClass) statsLines.push(`🛡️ CA: ${item.stats.armorClass}`);
    if (item.stats.armorClassBonus) statsLines.push(`🛡️ CA: +${item.stats.armorClassBonus}`);
    if (item.stats.healing) statsLines.push(`❤️ Soins: ${item.stats.healing}`);
    if (item.stats.properties?.length) statsLines.push(`✨ ${item.stats.properties.join(', ')}`);
    
    if (statsLines.length > 0) {
      embed.addFields({
        name: '📊 Statistiques',
        value: statsLines.join('\n'),
        inline: true,
      });
    }
  }
  
  // Quantité
  embed.addFields({
    name: '🔢 Quantité',
    value: `${slot.quantity}`,
    inline: true,
  });
  
  // Boutons d'action
  const actions = new ActionRowBuilder();
  
  if (item.type === 'consumable') {
    actions.addComponents(
      button(`inventory:use:${inventoryIndex}`, 'Utiliser', { style: 'success', emoji: '🧪' })
    );
  }
  
  if (['weapon', 'armor', 'accessory'].includes(item.type) && item.slot) {
    if (slot.equipped) {
      actions.addComponents(
        button(`inventory:unequip:${inventoryIndex}`, 'Déséquiper', { style: 'secondary', emoji: '📤' })
      );
    } else {
      actions.addComponents(
        button(`inventory:equip:${inventoryIndex}`, 'Équiper', { style: 'primary', emoji: '📥' })
      );
    }
  }
  
  actions.addComponents(
    button(`inventory:drop:${inventoryIndex}`, 'Jeter', { style: 'danger', emoji: '🗑️' }),
    button('inventory:view', 'Retour', { style: 'secondary', emoji: '◀️' })
  );
  
  await interaction.update({
    embeds: [embed],
    components: [actions],
  });
}

async function confirmUseItem(interaction, session, inventoryIndex) {
  await handleUse(interaction, session, inventoryIndex);
}

async function confirmEquipItem(interaction, session, inventoryIndex) {
  await handleEquip(interaction, session, inventoryIndex);
}

// ============================================================
// COMPOSANTS UI
// ============================================================

function createFilterRow(activeFilter) {
  const filters = [
    { id: 'all', label: 'Tout', emoji: '📦' },
    { id: 'weapon', label: 'Armes', emoji: '⚔️' },
    { id: 'armor', label: 'Armures', emoji: '🛡️' },
    { id: 'consumable', label: 'Conso.', emoji: '🧪' },
    { id: 'misc', label: 'Divers', emoji: '📿' },
  ];
  
  return new ActionRowBuilder().addComponents(
    ...filters.map(f => 
      new ButtonBuilder()
        .setCustomId(`inventory:filter:${f.id}`)
        .setLabel(f.label)
        .setEmoji(f.emoji)
        .setStyle(activeFilter === f.id ? ButtonStyle.Primary : ButtonStyle.Secondary)
    )
  );
}

function createNavigationRow(session) {
  return new ActionRowBuilder().addComponents(
    button('inventory:view', 'Inventaire', { style: 'primary', emoji: '🎒' }),
    button('inventory:equipment', 'Équipement', { style: 'secondary', emoji: '⚔️' }),
    button('inventory:usable', 'Utiliser', { style: 'secondary', emoji: '🧪' }),
  );
}

function createItemSelectMenu(items) {
  const options = items.slice(0, 25).map((item, index) => ({
    label: `${item.name}${item.quantity > 1 ? ` (x${item.quantity})` : ''}`,
    value: `${item._inventoryIndex}`,
    description: `${getRarityName(item.rarity)} - ${item.type}`,
    emoji: item.emoji || getRarityEmoji(item.rarity),
  }));
  
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('inventory:item')
      .setPlaceholder('🔍 Sélectionner un objet pour voir les détails...')
      .addOptions(options)
  );
}

function createUseItemMenu(items) {
  const options = items.slice(0, 25).map((item, index) => ({
    label: `${item.name}${item.quantity > 1 ? ` (x${item.quantity})` : ''}`,
    value: `${item._inventoryIndex}`,
    description: item.description?.substring(0, 100) || 'Objet utilisable',
    emoji: item.emoji || '🧪',
  }));
  
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('inventory:use')
      .setPlaceholder('🧪 Sélectionner un objet à utiliser...')
      .addOptions(options)
  );
}

function createEquipmentActionsRow(equippedItems) {
  // Note: Le bouton retour n'est plus nécessaire car createNavigationRow 
  // contient déjà le bouton "Inventaire" qui sert de retour
  return null;
}

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

function buildInventoryDescription(items, totalCount) {
  if (items.length === 0) {
    return [
      separator('stars'),
      '',
      '*Votre sac est vide...*',
      '*Explorez le monde pour trouver des trésors!*',
      '',
      separator('stars'),
    ].join('\n');
  }
  
  const lines = [separator('line'), ''];
  
  for (const item of items) {
    const rarityEmoji = getRarityEmoji(item.rarity);
    const qty = item.quantity > 1 ? ` x${item.quantity}` : '';
    const equipped = item.equipped ? ' 🔹' : '';
    
    lines.push(`${rarityEmoji} **${item.name}**${qty}${equipped}`);
    lines.push(`   *${item.type} - ${getRarityName(item.rarity)}*`);
  }
  
  lines.push('', separator('line'));
  
  return lines.join('\n');
}

function buildUsableItemsList(items) {
  const lines = [];
  
  for (const item of items) {
    const qty = item.quantity > 1 ? ` (x${item.quantity})` : '';
    lines.push(`${item.emoji || '🧪'} **${item.name}**${qty}`);
    
    // Description de l'effet
    if (item.stats?.healing) {
      lines.push(`   ❤️ Restaure ${item.stats.healing} PV`);
    } else if (item.stats?.effect) {
      lines.push(`   ✨ ${item.stats.effect}`);
    }
  }
  
  return lines.join('\n');
}

function calculateAttackBonus(character) {
  const strMod = Math.floor((character.attributes.str - 10) / 2);
  const profBonus = getProficiencyBonus(character.level);
  return strMod + profBonus;
}

function getProficiencyBonus(level) {
  if (level <= 4) return 2;
  if (level <= 8) return 3;
  if (level <= 12) return 4;
  if (level <= 16) return 5;
  return 6;
}

function recalculateAC(character) {
  const dexMod = Math.floor((character.attributes.dex - 10) / 2);
  let baseAC = 10 + dexMod;
  
  // Trouver l'armure équipée
  const armorSlot = character.inventory.find(
    slot => slot.equipped && slot.slot === 'chest'
  );
  
  if (armorSlot) {
    const armor = getItem(armorSlot.itemId);
    if (armor?.stats?.armorClass) {
      baseAC = armor.stats.armorClass;
      if (armor.stats.dexBonus) {
        if (armor.stats.maxDexBonus !== null && armor.stats.maxDexBonus !== undefined) {
          baseAC += Math.min(dexMod, armor.stats.maxDexBonus);
        } else {
          baseAC += dexMod;
        }
      }
    }
  }
  
  // Bonus de bouclier
  const shieldSlot = character.inventory.find(
    slot => slot.equipped && slot.slot === 'offHand'
  );
  
  if (shieldSlot) {
    const shield = getItem(shieldSlot.itemId);
    if (shield?.stats?.armorClassBonus) {
      baseAC += shield.stats.armorClassBonus;
    }
  }
  
  character.ac = baseAC;
}

function getRarityColor(rarity) {
  const colors = {
    common: 0x9ca3af,
    uncommon: 0x22c55e,
    rare: 0x3b82f6,
    epic: 0xa855f7,
    legendary: 0xff8c00,
    artifact: 0xef4444,
  };
  return colors[rarity] || colors.common;
}
