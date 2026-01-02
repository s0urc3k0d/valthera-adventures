/**
 * Commande /sell - Vendre des objets de l'inventaire
 * Permet de vendre des items aux marchands
 */

import { 
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from 'discord.js';
import Character from '../../models/Character.js';
import { createEmbed, errorEmbed, successEmbed } from '../../utils/embedBuilder.js';
import { getItem } from '../../utils/itemService.js';
import zonesData from '../../data/zones.json' assert { type: 'json' };

// Coefficient de revente (50% du prix d'achat)
const SELL_RATIO = 0.5;
const ITEMS_PER_PAGE = 10;

export default {
  data: new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Vendre des objets de votre inventaire')
    .addStringOption(opt =>
      opt.setName('item')
        .setDescription('Objet à vendre')
        .setRequired(false)
        .setAutocomplete(true)
    )
    .addIntegerOption(opt =>
      opt.setName('quantité')
        .setDescription('Quantité à vendre')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(99)
    ),
  
  cooldown: 2,
  
  async autocomplete(interaction) {
    const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    if (!character?.inventory) return interaction.respond([]);
    
    const focusedValue = interaction.options.getFocused().toLowerCase();
    
    // Items vendables (non équipés)
    const sellableItems = character.inventory
      .filter(invItem => !invItem.equipped)
      .map(invItem => {
        const item = getItem(invItem.itemId);
        if (!item) return null;
        const sellPrice = Math.floor(item.price * SELL_RATIO);
        return {
          invItem,
          item,
          sellPrice,
        };
      })
      .filter(data => data && data.item.name.toLowerCase().includes(focusedValue))
      .slice(0, 25)
      .map(data => ({
        name: `${data.item.emoji || '📦'} ${data.item.name} (x${data.invItem.quantity}) - ${data.sellPrice} po`,
        value: data.item.id,
      }));
    
    await interaction.respond(sellableItems);
  },
  
  async execute(interaction) {
    const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    
    if (!character) {
      return interaction.reply({
        embeds: [errorEmbed('Pas de personnage', 'Créez un personnage avec `/create`.')],
        ephemeral: true,
      });
    }
    
    const zone = zonesData.find(z => z.id === character.location);
    
    // Vérifier qu'il y a une boutique dans la zone
    if (!zone?.shops || zone.shops.length === 0) {
      return interaction.reply({
        embeds: [errorEmbed('Pas de marchand', `Il n'y a pas de marchand pour acheter vos objets dans **${zone?.name || 'cette zone'}**.`)],
        ephemeral: true,
      });
    }
    
    const itemId = interaction.options.getString('item');
    const quantity = interaction.options.getInteger('quantité') || 1;
    
    if (!itemId) {
      // Afficher le menu de vente
      return showSellMenu(interaction, character, 0);
    }
    
    // Vendre l'item spécifié
    await sellItem(interaction, character, itemId, quantity);
  },
  
  async handleButton(interaction, client, params) {
    const [action, ...args] = params;
    const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    
    if (!character) return;
    
    switch (action) {
      case 'page': {
        const [pageStr] = args;
        await showSellMenu(interaction, character, parseInt(pageStr), true);
        break;
      }
      case 'confirm': {
        const [itemId, qtyStr] = args;
        await sellItem(interaction, character, itemId, parseInt(qtyStr), true);
        break;
      }
      case 'sellall': {
        await sellAllJunk(interaction, character);
        break;
      }
    }
  },
  
  async handleSelectMenu(interaction, client, params) {
    const [menuType] = params;
    const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    
    if (!character) return;
    
    if (menuType === 'item') {
      const itemId = interaction.values[0];
      await showSellConfirmation(interaction, character, itemId);
    }
  },
};

// ============================================================
// MENU DE VENTE
// ============================================================

async function showSellMenu(interaction, character, page = 0, isUpdate = false) {
  // Items vendables (non équipés)
  const sellableItems = character.inventory
    .filter(invItem => !invItem.equipped)
    .map(invItem => {
      const item = getItem(invItem.itemId);
      if (!item) return null;
      return {
        invItem,
        item,
        sellPrice: Math.floor(item.price * SELL_RATIO),
        totalValue: Math.floor(item.price * SELL_RATIO) * invItem.quantity,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.totalValue - a.totalValue);
  
  if (sellableItems.length === 0) {
    const embed = createEmbed({
      title: '💰 Vendre des objets',
      description: '*Vous n\'avez aucun objet à vendre.*\n\nLes objets équipés ne peuvent pas être vendus.',
      color: 0x6B7280,
    });
    
    return isUpdate
      ? interaction.update({ embeds: [embed], components: [] })
      : interaction.reply({ embeds: [embed] });
  }
  
  // Calculer la valeur totale
  const totalValue = sellableItems.reduce((sum, data) => sum + data.totalValue, 0);
  
  // Pagination
  const totalPages = Math.ceil(sellableItems.length / ITEMS_PER_PAGE);
  const pageItems = sellableItems.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  
  const embed = createEmbed({
    title: '💰 Vendre des objets',
    description: [
      `💰 Votre or: **${formatGold(character.gold)}**`,
      `📦 Valeur totale de revente: **${totalValue} po**`,
      '',
      `*Prix de vente = 50% du prix d'achat*`,
    ].join('\n'),
    color: 0xF59E0B,
    footer: { text: `Page ${page + 1}/${totalPages} • ${sellableItems.length} objets vendables` },
  });
  
  // Liste des items
  const itemList = pageItems.map(data => {
    const rarityEmoji = getRarityEmoji(data.item.rarity);
    return `${data.item.emoji || '📦'} **${data.item.name}** ${rarityEmoji} x${data.invItem.quantity}\n   └ ${data.sellPrice} po/unité (total: ${data.totalValue} po)`;
  }).join('\n\n');
  
  embed.addFields({
    name: '📦 Inventaire',
    value: itemList,
    inline: false,
  });
  
  // Menu de sélection
  const components = [];
  
  const options = pageItems.map(data => ({
    label: `${data.item.name} (x${data.invItem.quantity})`,
    value: data.item.id,
    description: `${data.sellPrice} po/unité`,
    emoji: data.item.emoji || '📦',
  }));
  
  components.push(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('sell:item')
        .setPlaceholder('💰 Choisir un objet à vendre...')
        .addOptions(options)
    )
  );
  
  // Boutons de navigation
  const navButtons = [];
  
  if (page > 0) {
    navButtons.push(
      new ButtonBuilder()
        .setCustomId(`sell:page:${page - 1}`)
        .setLabel('◀️ Précédent')
        .setStyle(ButtonStyle.Secondary)
    );
  }
  
  // Bouton vendre tout le junk
  const junkItems = sellableItems.filter(data => data.item.rarity === 'common' && data.item.type === 'misc');
  if (junkItems.length > 0) {
    const junkValue = junkItems.reduce((sum, data) => sum + data.totalValue, 0);
    navButtons.push(
      new ButtonBuilder()
        .setCustomId('sell:sellall')
        .setLabel(`Vendre le bazar (${junkValue} po)`)
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🗑️')
    );
  }
  
  if (page < totalPages - 1) {
    navButtons.push(
      new ButtonBuilder()
        .setCustomId(`sell:page:${page + 1}`)
        .setLabel('Suivant ▶️')
        .setStyle(ButtonStyle.Secondary)
    );
  }
  
  if (navButtons.length > 0) {
    components.push(new ActionRowBuilder().addComponents(navButtons));
  }
  
  isUpdate
    ? await interaction.update({ embeds: [embed], components })
    : await interaction.reply({ embeds: [embed], components });
}

// ============================================================
// CONFIRMATION DE VENTE
// ============================================================

async function showSellConfirmation(interaction, character, itemId) {
  const invItem = character.inventory.find(i => i.itemId === itemId && !i.equipped);
  const item = getItem(itemId);
  
  if (!invItem || !item) {
    return interaction.reply({
      embeds: [errorEmbed('Item introuvable', 'Vous ne possédez pas cet objet.')],
      ephemeral: true,
    });
  }
  
  const sellPrice = Math.floor(item.price * SELL_RATIO);
  const maxQty = invItem.quantity;
  
  const embed = createEmbed({
    title: `💰 Vendre ${item.name}`,
    description: [
      `${item.emoji || '📦'} **${item.name}**`,
      item.description,
      '',
      `💰 Prix de vente: **${sellPrice} po** / unité`,
      `📦 Quantité possédée: **${maxQty}**`,
      '',
      `💵 Vente totale (x${maxQty}): **${sellPrice * maxQty} po**`,
    ].join('\n'),
    color: 0xF59E0B,
  });
  
  // Boutons pour différentes quantités
  const buttons = [];
  
  buttons.push(
    new ButtonBuilder()
      .setCustomId(`sell:confirm:${itemId}:1`)
      .setLabel(`Vendre 1 (${sellPrice} po)`)
      .setStyle(ButtonStyle.Success)
  );
  
  if (maxQty >= 5) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`sell:confirm:${itemId}:5`)
        .setLabel(`Vendre 5 (${sellPrice * 5} po)`)
        .setStyle(ButtonStyle.Success)
    );
  }
  
  if (maxQty > 1) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`sell:confirm:${itemId}:${maxQty}`)
        .setLabel(`Vendre tout (${sellPrice * maxQty} po)`)
        .setStyle(ButtonStyle.Danger)
    );
  }
  
  buttons.push(
    new ButtonBuilder()
      .setCustomId('sell:page:0')
      .setLabel('Annuler')
      .setStyle(ButtonStyle.Secondary)
  );
  
  await interaction.update({
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(buttons.slice(0, 5))],
  });
}

// ============================================================
// VENTE D'UN ITEM
// ============================================================

async function sellItem(interaction, character, itemId, quantity, isUpdate = false) {
  const invItemIndex = character.inventory.findIndex(i => i.itemId === itemId && !i.equipped);
  
  if (invItemIndex === -1) {
    const embed = errorEmbed('Item introuvable', 'Vous ne possédez pas cet objet ou il est équipé.');
    return isUpdate
      ? interaction.update({ embeds: [embed], components: [] })
      : interaction.reply({ embeds: [embed], ephemeral: true });
  }
  
  const invItem = character.inventory[invItemIndex];
  const item = getItem(itemId);
  
  if (!item) {
    const embed = errorEmbed('Item invalide', 'Cet objet n\'existe pas.');
    return isUpdate
      ? interaction.update({ embeds: [embed], components: [] })
      : interaction.reply({ embeds: [embed], ephemeral: true });
  }
  
  // Ajuster la quantité
  const actualQty = Math.min(quantity, invItem.quantity);
  const sellPrice = Math.floor(item.price * SELL_RATIO);
  const totalGold = sellPrice * actualQty;
  
  // Ajouter l'or
  character.gold.gold += totalGold;
  character.stats.goldEarned = (character.stats.goldEarned || 0) + totalGold;
  
  // Retirer l'item
  if (invItem.quantity <= actualQty) {
    character.inventory.splice(invItemIndex, 1);
  } else {
    invItem.quantity -= actualQty;
  }
  
  await character.save();
  
  const embed = successEmbed(
    '💰 Vente réussie!',
    [
      `Vous avez vendu **${actualQty}x ${item.emoji || '📦'} ${item.name}**!`,
      '',
      `💰 +**${totalGold}** po`,
      `💰 Total: **${formatGold(character.gold)}**`,
    ].join('\n')
  );
  
  // Bouton pour continuer
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('sell:page:0')
      .setLabel('Continuer à vendre')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('💰'),
  );
  
  isUpdate
    ? await interaction.update({ embeds: [embed], components: [row] })
    : await interaction.reply({ embeds: [embed], components: [row] });
}

// ============================================================
// VENDRE TOUT LE JUNK
// ============================================================

async function sellAllJunk(interaction, character) {
  const junkItems = [];
  let totalGold = 0;
  
  // Identifier les items "junk" (commun + misc)
  for (let i = character.inventory.length - 1; i >= 0; i--) {
    const invItem = character.inventory[i];
    if (invItem.equipped) continue;
    
    const item = getItem(invItem.itemId);
    if (!item) continue;
    
    if (item.rarity === 'common' && item.type === 'misc') {
      const sellPrice = Math.floor(item.price * SELL_RATIO) * invItem.quantity;
      junkItems.push({ item, quantity: invItem.quantity, value: sellPrice });
      totalGold += sellPrice;
      character.inventory.splice(i, 1);
    }
  }
  
  if (junkItems.length === 0) {
    return interaction.update({
      embeds: [errorEmbed('Rien à vendre', 'Vous n\'avez pas d\'objets de bazar à vendre.')],
      components: [],
    });
  }
  
  // Ajouter l'or
  character.gold.gold += totalGold;
  character.stats.goldEarned = (character.stats.goldEarned || 0) + totalGold;
  
  await character.save();
  
  const itemList = junkItems.map(j => `${j.item.emoji || '📦'} ${j.item.name} x${j.quantity}`).join(', ');
  
  const embed = successEmbed(
    '🗑️ Bazar vendu!',
    [
      `Objets vendus: ${itemList}`,
      '',
      `💰 +**${totalGold}** po`,
      `💰 Total: **${formatGold(character.gold)}**`,
    ].join('\n')
  );
  
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('sell:page:0')
      .setLabel('Continuer')
      .setStyle(ButtonStyle.Primary)
  );
  
  await interaction.update({ embeds: [embed], components: [row] });
}

// ============================================================
// UTILITAIRES
// ============================================================

function formatGold(gold) {
  const parts = [];
  if (gold.platinum > 0) parts.push(`${gold.platinum} pp`);
  if (gold.gold > 0 || parts.length === 0) parts.push(`${gold.gold} po`);
  if (gold.silver > 0) parts.push(`${gold.silver} pa`);
  if (gold.copper > 0) parts.push(`${gold.copper} pc`);
  return parts.join(' ');
}

function getRarityEmoji(rarity) {
  const emojis = {
    common: '⚪',
    uncommon: '🟢',
    rare: '🔵',
    'very rare': '🟣',
    legendary: '🟡',
    artifact: '🔴',
  };
  return emojis[rarity] || '⚪';
}
