/**
 * Commande /shop - Voir et interagir avec les boutiques
 * Affiche les items disponibles à l'achat dans la zone
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
import { getItem, getItemsByCategory } from '../../utils/itemService.js';
import { hpBar, getRarityColor } from '../../utils/ui.js';
import zonesData from '../../data/zones.json' assert { type: 'json' };
import itemsData from '../../data/items.json' assert { type: 'json' };

// Types de boutiques et leurs inventaires
const SHOP_INVENTORIES = {
  armorer: {
    name: 'Armurier',
    emoji: '🛡️',
    categories: ['armor'],
    markup: 1.0, // Pas de majoration
  },
  weaponsmith: {
    name: 'Forgeron d\'armes',
    emoji: '⚔️',
    categories: ['weapons'],
    markup: 1.0,
  },
  blacksmith: {
    name: 'Forge',
    emoji: '🔨',
    categories: ['weapons', 'armor'],
    markup: 1.0,
  },
  apothecary: {
    name: 'Apothicaire',
    emoji: '🧪',
    categories: ['consumables'],
    filter: item => item.subtype === 'potion' || item.subtype === 'ingredient',
    markup: 1.2,
  },
  general: {
    name: 'Bazar général',
    emoji: '📦',
    categories: ['consumables', 'misc', 'accessories'],
    markup: 1.1,
  },
  magic: {
    name: 'Boutique magique',
    emoji: '✨',
    categories: ['weapons', 'armor', 'accessories'],
    filter: item => item.rarity !== 'common',
    markup: 1.5,
  },
};

const ITEMS_PER_PAGE = 8;

export default {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Voir les boutiques de la zone')
    .addStringOption(opt =>
      opt.setName('boutique')
        .setDescription('Nom de la boutique')
        .setRequired(false)
        .setAutocomplete(true)
    ),
  
  cooldown: 3,
  
  async autocomplete(interaction) {
    const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    if (!character) return interaction.respond([]);
    
    const zone = zonesData.find(z => z.id === character.location);
    if (!zone?.shops) return interaction.respond([]);
    
    const focusedValue = interaction.options.getFocused().toLowerCase();
    
    const shops = zone.shops
      .filter(shop => shop.name.toLowerCase().includes(focusedValue))
      .map(shop => ({
        name: `${SHOP_INVENTORIES[shop.type]?.emoji || '🏪'} ${shop.name}`,
        value: shop.id,
      }))
      .slice(0, 25);
    
    await interaction.respond(shops);
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
    
    if (!zone?.shops || zone.shops.length === 0) {
      return interaction.reply({
        embeds: [errorEmbed('Pas de boutique', `Il n'y a pas de boutique dans **${zone?.name || 'cette zone'}**.`)],
        ephemeral: true,
      });
    }
    
    const shopId = interaction.options.getString('boutique');
    
    if (!shopId) {
      // Afficher la liste des boutiques
      return showShopList(interaction, character, zone);
    }
    
    // Afficher une boutique spécifique
    const shop = zone.shops.find(s => s.id === shopId);
    if (!shop) {
      return interaction.reply({
        embeds: [errorEmbed('Boutique introuvable', 'Cette boutique n\'existe pas.')],
        ephemeral: true,
      });
    }
    
    await showShopInventory(interaction, character, zone, shop, 0);
  },
  
  async handleButton(interaction, client, params) {
    const [action, ...args] = params;
    const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    const zone = zonesData.find(z => z.id === character?.location);
    
    if (!character || !zone) return;
    
    switch (action) {
      case 'view': {
        const [shopId] = args;
        const shop = zone.shops?.find(s => s.id === shopId);
        if (shop) await showShopInventory(interaction, character, zone, shop, 0, true);
        break;
      }
      case 'page': {
        const [shopId, pageStr] = args;
        const page = parseInt(pageStr);
        const shop = zone.shops?.find(s => s.id === shopId);
        if (shop) await showShopInventory(interaction, character, zone, shop, page, true);
        break;
      }
      case 'buy': {
        const [itemId, shopId] = args;
        await buyItem(interaction, character, zone, itemId, shopId);
        break;
      }
      case 'back': {
        await showShopList(interaction, character, zone, true);
        break;
      }
    }
  },
  
  async handleSelectMenu(interaction, client, params) {
    const [menuType, shopId] = params;
    const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    const zone = zonesData.find(z => z.id === character?.location);
    
    if (!character || !zone) return;
    
    if (menuType === 'item') {
      const itemId = interaction.values[0];
      await showItemDetails(interaction, character, zone, itemId, shopId);
    }
  },
};

// ============================================================
// LISTE DES BOUTIQUES
// ============================================================

async function showShopList(interaction, character, zone, isUpdate = false) {
  const embed = createEmbed({
    title: `🏪 Boutiques de ${zone.name}`,
    description: `💰 Votre or: **${formatGold(character.gold)}**\n\nChoisissez une boutique:`,
    color: 0xF59E0B,
  });
  
  const shopList = zone.shops.map(shop => {
    const shopType = SHOP_INVENTORIES[shop.type] || { name: 'Boutique', emoji: '🏪' };
    return `${shopType.emoji} **${shop.name}**\n   └ ${shopType.name}`;
  }).join('\n\n');
  
  embed.addFields({
    name: '📋 Commerces disponibles',
    value: shopList || 'Aucune boutique',
    inline: false,
  });
  
  // Boutons pour chaque boutique
  const rows = [];
  const buttons = zone.shops.slice(0, 5).map(shop => {
    const shopType = SHOP_INVENTORIES[shop.type] || { emoji: '🏪' };
    return new ButtonBuilder()
      .setCustomId(`shop:view:${shop.id}`)
      .setLabel(shop.name.substring(0, 20))
      .setStyle(ButtonStyle.Primary)
      .setEmoji(shopType.emoji);
  });
  
  if (buttons.length > 0) {
    rows.push(new ActionRowBuilder().addComponents(buttons.slice(0, 5)));
  }
  
  isUpdate
    ? await interaction.update({ embeds: [embed], components: rows })
    : await interaction.reply({ embeds: [embed], components: rows });
}

// ============================================================
// INVENTAIRE D'UNE BOUTIQUE
// ============================================================

async function showShopInventory(interaction, character, zone, shop, page = 0, isUpdate = false) {
  const shopType = SHOP_INVENTORIES[shop.type] || { 
    name: 'Boutique', 
    emoji: '🏪', 
    categories: ['misc'], 
    markup: 1.0 
  };
  
  // Récupérer les items disponibles
  let items = [];
  for (const category of shopType.categories) {
    const categoryItems = Object.values(itemsData[category] || {});
    items.push(...categoryItems);
  }
  
  // Appliquer le filtre si présent
  if (shopType.filter) {
    items = items.filter(shopType.filter);
  }
  
  // Filtrer par rareté max selon le niveau de la zone
  const maxRarity = getMaxRarityForZone(zone);
  items = items.filter(item => getRarityLevel(item.rarity) <= maxRarity);
  
  // Trier par prix
  items.sort((a, b) => a.price - b.price);
  
  // Pagination
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const pageItems = items.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  
  const embed = createEmbed({
    title: `${shopType.emoji} ${shop.name}`,
    description: [
      `💰 Votre or: **${formatGold(character.gold)}**`,
      shopType.markup > 1 ? `*Prix majorés de ${Math.round((shopType.markup - 1) * 100)}%*` : '',
      '',
      `Sélectionnez un objet pour l'acheter:`,
    ].filter(Boolean).join('\n'),
    color: 0xF59E0B,
    footer: { text: `Page ${page + 1}/${totalPages} • ${items.length} articles` },
  });
  
  // Liste des items
  const itemList = pageItems.map(item => {
    const price = Math.ceil(item.price * shopType.markup);
    const canAfford = getTotalGold(character.gold) >= price;
    const rarityEmoji = getRarityEmoji(item.rarity);
    return `${canAfford ? '✅' : '❌'} ${item.emoji || '📦'} **${item.name}** ${rarityEmoji}\n   └ ${price} po`;
  }).join('\n\n');
  
  embed.addFields({
    name: '📦 Articles',
    value: itemList || '*Aucun article disponible*',
    inline: false,
  });
  
  // Menu de sélection
  const components = [];
  
  if (pageItems.length > 0) {
    const options = pageItems.map(item => {
      const price = Math.ceil(item.price * shopType.markup);
      return {
        label: item.name,
        value: item.id,
        description: `${price} po - ${item.rarity}`,
        emoji: item.emoji || '📦',
      };
    });
    
    components.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`shop:item:${shop.id}`)
          .setPlaceholder('🛒 Choisir un article...')
          .addOptions(options)
      )
    );
  }
  
  // Boutons de navigation
  const navButtons = [];
  
  if (page > 0) {
    navButtons.push(
      new ButtonBuilder()
        .setCustomId(`shop:page:${shop.id}:${page - 1}`)
        .setLabel('◀️ Précédent')
        .setStyle(ButtonStyle.Secondary)
    );
  }
  
  navButtons.push(
    new ButtonBuilder()
      .setCustomId('shop:back')
      .setLabel('Retour')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🏪')
  );
  
  if (page < totalPages - 1) {
    navButtons.push(
      new ButtonBuilder()
        .setCustomId(`shop:page:${shop.id}:${page + 1}`)
        .setLabel('Suivant ▶️')
        .setStyle(ButtonStyle.Secondary)
    );
  }
  
  components.push(new ActionRowBuilder().addComponents(navButtons));
  
  isUpdate
    ? await interaction.update({ embeds: [embed], components })
    : await interaction.reply({ embeds: [embed], components });
}

// ============================================================
// DÉTAILS D'UN ITEM
// ============================================================

async function showItemDetails(interaction, character, zone, itemId, shopId) {
  const item = getItem(itemId);
  const shop = zone.shops?.find(s => s.id === shopId);
  const shopType = SHOP_INVENTORIES[shop?.type] || { markup: 1.0 };
  
  if (!item) {
    return interaction.reply({
      embeds: [errorEmbed('Item introuvable', 'Cet objet n\'existe pas.')],
      ephemeral: true,
    });
  }
  
  const price = Math.ceil(item.price * shopType.markup);
  const canAfford = getTotalGold(character.gold) >= price;
  
  const embed = createEmbed({
    title: `${item.emoji || '📦'} ${item.name}`,
    description: item.description,
    color: getRarityColor(item.rarity),
  });
  
  // Stats
  const stats = [];
  stats.push(`💰 **Prix:** ${price} po`);
  stats.push(`⚖️ **Poids:** ${item.weight} lb`);
  stats.push(`✨ **Rareté:** ${item.rarity}`);
  
  if (item.stats) {
    if (item.stats.damage) stats.push(`⚔️ **Dégâts:** ${item.stats.damage} ${item.stats.damageType || ''}`);
    if (item.stats.ac) stats.push(`🛡️ **CA:** ${item.stats.ac}${item.stats.maxDex ? ` (Dex max +${item.stats.maxDex})` : ''}`);
    if (item.stats.healing) stats.push(`❤️ **Soin:** ${item.stats.healing}`);
    if (item.stats.properties?.length > 0) stats.push(`📋 **Propriétés:** ${item.stats.properties.join(', ')}`);
  }
  
  if (item.requirements && Object.keys(item.requirements).length > 0) {
    const reqs = Object.entries(item.requirements).map(([stat, val]) => `${stat.toUpperCase()} ${val}`).join(', ');
    stats.push(`📊 **Requis:** ${reqs}`);
  }
  
  embed.addFields({
    name: '📋 Informations',
    value: stats.join('\n'),
    inline: false,
  });
  
  // Vérifier si le joueur a déjà cet item
  const ownedQty = character.inventory?.filter(i => i.itemId === itemId).reduce((sum, i) => sum + i.quantity, 0) || 0;
  if (ownedQty > 0) {
    embed.addFields({
      name: '📦 Inventaire',
      value: `Vous possédez déjà **${ownedQty}** exemplaire(s).`,
      inline: false,
    });
  }
  
  // Boutons
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`shop:buy:${itemId}:${shopId}`)
      .setLabel(`Acheter (${price} po)`)
      .setStyle(canAfford ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setEmoji('🛒')
      .setDisabled(!canAfford),
    new ButtonBuilder()
      .setCustomId(`shop:view:${shopId}`)
      .setLabel('Retour')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('◀️'),
  );
  
  if (!canAfford) {
    embed.setFooter({ text: `❌ Il vous manque ${price - getTotalGold(character.gold)} po` });
  }
  
  await interaction.update({ embeds: [embed], components: [row] });
}

// ============================================================
// ACHAT D'UN ITEM
// ============================================================

async function buyItem(interaction, character, zone, itemId, shopId) {
  const item = getItem(itemId);
  const shop = zone.shops?.find(s => s.id === shopId);
  const shopType = SHOP_INVENTORIES[shop?.type] || { markup: 1.0 };
  
  if (!item) {
    return interaction.reply({
      embeds: [errorEmbed('Item introuvable', 'Cet objet n\'existe pas.')],
      ephemeral: true,
    });
  }
  
  const price = Math.ceil(item.price * shopType.markup);
  const totalGold = getTotalGold(character.gold);
  
  if (totalGold < price) {
    return interaction.reply({
      embeds: [errorEmbed('Pas assez d\'or', `Il vous faut **${price}** po (vous avez ${totalGold} po).`)],
      ephemeral: true,
    });
  }
  
  // Déduire l'or
  character.gold.gold -= price;
  
  // Convertir si négatif (utiliser les PP puis PA)
  if (character.gold.gold < 0) {
    while (character.gold.gold < 0 && character.gold.platinum > 0) {
      character.gold.platinum--;
      character.gold.gold += 10;
    }
    while (character.gold.gold < 0 && character.gold.silver > 0) {
      character.gold.silver -= 10;
      character.gold.gold++;
    }
  }
  
  // Ajouter l'item à l'inventaire
  const existingItem = character.inventory.find(i => i.itemId === itemId && !i.equipped);
  if (existingItem && item.stackable !== false) {
    existingItem.quantity++;
  } else {
    character.inventory.push({
      itemId: itemId,
      quantity: 1,
      equipped: false,
      slot: null,
    });
  }
  
  // Statistiques
  character.stats.goldSpent = (character.stats.goldSpent || 0) + price;
  
  await character.save();
  
  const embed = successEmbed(
    '🛒 Achat réussi!',
    [
      `Vous avez acheté **${item.emoji || '📦'} ${item.name}**!`,
      '',
      `💰 -**${price}** po`,
      `💰 Reste: **${formatGold(character.gold)}**`,
    ].join('\n')
  );
  
  // Boutons pour continuer
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`shop:view:${shopId}`)
      .setLabel('Continuer les achats')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🛒'),
    new ButtonBuilder()
      .setCustomId('shop:back')
      .setLabel('Autres boutiques')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🏪'),
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

function getTotalGold(gold) {
  return (gold.platinum || 0) * 10 + (gold.gold || 0) + (gold.silver || 0) / 10 + (gold.copper || 0) / 100;
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

function getRarityLevel(rarity) {
  const levels = {
    common: 1,
    uncommon: 2,
    rare: 3,
    'very rare': 4,
    legendary: 5,
    artifact: 6,
  };
  return levels[rarity] || 1;
}

function getMaxRarityForZone(zone) {
  const maxLevel = zone.level?.max || 5;
  if (maxLevel <= 5) return 2;  // Uncommon max
  if (maxLevel <= 10) return 3; // Rare max
  if (maxLevel <= 15) return 4; // Very Rare max
  return 5; // Legendary
}
