import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { createEmbed, errorEmbed, successEmbed, warningEmbed } from '../../utils/embedBuilder.js';
import Character from '../../models/Character.js';
import Trade from '../../models/Trade.js';
import { tradeSessions } from '../../utils/sessionManager.js';
import { getItem } from '../../utils/itemService.js';
import itemsData from '../../data/items.json' assert { type: 'json' };

// Durée d'expiration des échanges (10 minutes)
const TRADE_EXPIRY_MS = 10 * 60 * 1000;

export default {
  data: new SlashCommandBuilder()
    .setName('trade')
    .setDescription('Échanger des objets avec un autre joueur')
    .addSubcommand(sub =>
      sub
        .setName('request')
        .setDescription('Proposer un échange à un joueur')
        .addUserOption(opt =>
          opt
            .setName('joueur')
            .setDescription('Le joueur avec qui échanger')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('cancel')
        .setDescription('Annuler l\'échange en cours')
    )
    .addSubcommand(sub =>
      sub
        .setName('status')
        .setDescription('Voir l\'état de votre échange en cours')
    ),
  
  cooldown: 3,
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;
    const userId = interaction.user.id;
    
    // Vérifier que l'utilisateur a un personnage
    const character = await Character.findOne({ userId, guildId });
    if (!character) {
      return interaction.reply({
        embeds: [errorEmbed('Erreur', 'Vous n\'avez pas de personnage. Utilisez `/create` pour en créer un.')],
        ephemeral: true,
      });
    }
    
    switch (subcommand) {
      case 'request':
        return handleRequest(interaction, guildId, userId, character);
      case 'cancel':
        return handleCancel(interaction, guildId, userId);
      case 'status':
        return handleStatus(interaction, guildId, userId);
      default:
        return interaction.reply({
          embeds: [errorEmbed('Erreur', 'Sous-commande inconnue.')],
          ephemeral: true,
        });
    }
  },
  
  // Gestion des boutons
  async handleButton(interaction) {
    const [, action, ...args] = interaction.customId.split('_');
    const guildId = interaction.guildId;
    const userId = interaction.user.id;
    
    switch (action) {
      case 'accept':
        return handleAcceptTrade(interaction, guildId, userId);
      case 'decline':
        return handleDeclineTrade(interaction, guildId, userId);
      case 'addItem':
        return handleAddItemMenu(interaction, guildId, userId);
      case 'addGold':
        return handleAddGoldMenu(interaction, guildId, userId);
      case 'confirm':
        return handleConfirm(interaction, guildId, userId);
      case 'unconfirm':
        return handleUnconfirm(interaction, guildId, userId);
      default:
        return interaction.reply({ content: 'Action inconnue.', ephemeral: true });
    }
  },
  
  // Gestion des menus
  async handleSelectMenu(interaction) {
    const [, action] = interaction.customId.split('_');
    const guildId = interaction.guildId;
    const userId = interaction.user.id;
    const value = interaction.values[0];
    
    if (action === 'selectItem') {
      return handleSelectItem(interaction, guildId, userId, value);
    }
  },
};

// ============================================================
// HANDLERS DE SOUS-COMMANDES
// ============================================================

async function handleRequest(interaction, guildId, userId, character) {
  const targetUser = interaction.options.getUser('joueur');
  
  if (targetUser.id === userId) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Vous ne pouvez pas échanger avec vous-même.')],
      ephemeral: true,
    });
  }
  
  if (targetUser.bot) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Vous ne pouvez pas échanger avec un bot.')],
      ephemeral: true,
    });
  }
  
  // Vérifier que la cible a un personnage
  const targetCharacter = await Character.findOne({ userId: targetUser.id, guildId });
  if (!targetCharacter) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Ce joueur n\'a pas de personnage.')],
      ephemeral: true,
    });
  }
  
  // Vérifier qu'aucun des deux n'a un échange en cours
  const existingTrade = await Trade.findActiveByPlayer(guildId, userId);
  if (existingTrade) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Vous avez déjà un échange en cours. Annulez-le d\'abord avec `/trade cancel`.')],
      ephemeral: true,
    });
  }
  
  const targetExistingTrade = await Trade.findActiveByPlayer(guildId, targetUser.id);
  if (targetExistingTrade) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Ce joueur a déjà un échange en cours.')],
      ephemeral: true,
    });
  }
  
  // Créer l'échange
  const trade = new Trade({
    guildId,
    initiator: {
      odisId: guildId,
      playerId: userId,
      playerName: interaction.user.displayName,
      characterName: character.name,
    },
    target: {
      odisId: guildId,
      playerId: targetUser.id,
      playerName: targetUser.displayName,
      characterName: targetCharacter.name,
    },
    status: 'pending',
    expiresAt: new Date(Date.now() + TRADE_EXPIRY_MS),
  });
  
  await trade.save();
  
  // Créer l'embed de demande
  const requestEmbed = createEmbed({
    title: '🔄 Demande d\'échange',
    description: `**${character.name}** souhaite échanger avec **${targetCharacter.name}** !`,
    color: 0x3B82F6,
    footer: { text: 'L\'échange expire dans 10 minutes' },
  });
  
  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('trade_accept')
      .setLabel('Accepter')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅'),
    new ButtonBuilder()
      .setCustomId('trade_decline')
      .setLabel('Refuser')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('❌')
  );
  
  await interaction.reply({
    embeds: [successEmbed('Demande envoyée', `Une demande d'échange a été envoyée à ${targetUser}.`)],
  });
  
  const message = await interaction.channel.send({
    content: `${targetUser}`,
    embeds: [requestEmbed],
    components: [buttons],
  });
  
  // Sauvegarder les IDs du message
  trade.messageId = message.id;
  trade.channelId = interaction.channelId;
  await trade.save();
}

async function handleCancel(interaction, guildId, userId) {
  const trade = await Trade.findActiveByPlayer(guildId, userId);
  
  if (!trade) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Vous n\'avez pas d\'échange en cours.')],
      ephemeral: true,
    });
  }
  
  trade.status = 'cancelled';
  await trade.save();
  
  return interaction.reply({
    embeds: [successEmbed('Échange annulé', 'L\'échange a été annulé.')],
  });
}

async function handleStatus(interaction, guildId, userId) {
  const trade = await Trade.findActiveByPlayer(guildId, userId);
  
  if (!trade) {
    return interaction.reply({
      embeds: [errorEmbed('Pas d\'échange', 'Vous n\'avez pas d\'échange en cours.')],
      ephemeral: true,
    });
  }
  
  const embed = buildTradeEmbed(trade);
  const components = buildTradeComponents(trade, userId);
  
  return interaction.reply({
    embeds: [embed],
    components,
    ephemeral: true,
  });
}

// ============================================================
// HANDLERS DE BOUTONS
// ============================================================

async function handleAcceptTrade(interaction, guildId, userId) {
  const trade = await Trade.findOne({
    guildId,
    'target.playerId': userId,
    status: 'pending',
  });
  
  if (!trade) {
    return interaction.update({
      embeds: [errorEmbed('Erreur', 'Échange introuvable ou expiré.')],
      components: [],
    });
  }
  
  trade.status = 'active';
  await trade.save();
  
  const embed = buildTradeEmbed(trade);
  const components = buildTradeComponents(trade, userId);
  
  return interaction.update({
    content: `${interaction.user} <@${trade.initiator.playerId}>`,
    embeds: [embed],
    components,
  });
}

async function handleDeclineTrade(interaction, guildId, userId) {
  const trade = await Trade.findOne({
    guildId,
    'target.playerId': userId,
    status: 'pending',
  });
  
  if (!trade) {
    return interaction.update({
      embeds: [errorEmbed('Erreur', 'Échange introuvable.')],
      components: [],
    });
  }
  
  trade.status = 'cancelled';
  await trade.save();
  
  return interaction.update({
    embeds: [errorEmbed('Échange refusé', `**${trade.target.characterName}** a refusé l'échange.`)],
    components: [],
  });
}

async function handleAddItemMenu(interaction, guildId, userId) {
  const trade = await Trade.findActiveByPlayer(guildId, userId);
  
  if (!trade || trade.status !== 'active') {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Pas d\'échange actif.')],
      ephemeral: true,
    });
  }
  
  const character = await Character.findOne({ userId, guildId });
  if (!character || !character.inventory || character.inventory.length === 0) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Votre inventaire est vide.')],
      ephemeral: true,
    });
  }
  
  // Créer le menu de sélection d'items
  const side = trade.getParticipantSide(userId);
  const alreadyAdded = trade[side].items.map(i => i.itemId);
  
  const availableItems = character.inventory
    .filter(i => !alreadyAdded.includes(i.itemId))
    .slice(0, 25);
  
  if (availableItems.length === 0) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Vous avez déjà ajouté tous vos objets disponibles.')],
      ephemeral: true,
    });
  }
  
  const options = availableItems.map(inv => {
    const item = getItem(inv.itemId);
    return {
      label: item?.name || inv.itemId,
      description: `Quantité: ${inv.quantity}`,
      value: inv.itemId,
      emoji: getItemEmoji(item?.type),
    };
  });
  
  const menu = new StringSelectMenuBuilder()
    .setCustomId('trade_selectItem')
    .setPlaceholder('Choisir un objet à ajouter')
    .addOptions(options);
  
  const row = new ActionRowBuilder().addComponents(menu);
  
  return interaction.reply({
    embeds: [createEmbed({
      title: '📦 Ajouter un objet',
      description: 'Sélectionnez un objet à ajouter à l\'échange.',
      color: 0x3B82F6,
    })],
    components: [row],
    ephemeral: true,
  });
}

async function handleSelectItem(interaction, guildId, userId, itemId) {
  const trade = await Trade.findActiveByPlayer(guildId, userId);
  
  if (!trade || trade.status !== 'active') {
    return interaction.update({
      embeds: [errorEmbed('Erreur', 'Pas d\'échange actif.')],
      components: [],
    });
  }
  
  const character = await Character.findOne({ userId, guildId });
  const invItem = character.inventory.find(i => i.itemId === itemId);
  
  if (!invItem) {
    return interaction.update({
      embeds: [errorEmbed('Erreur', 'Objet non trouvé dans votre inventaire.')],
      components: [],
    });
  }
  
  const side = trade.getParticipantSide(userId);
  
  // Reset les confirmations si modification
  trade.initiator.confirmed = false;
  trade.target.confirmed = false;
  
  // Ajouter l'item (ou augmenter la quantité)
  const existing = trade[side].items.find(i => i.itemId === itemId);
  if (existing) {
    if (existing.quantity < invItem.quantity) {
      existing.quantity += 1;
    }
  } else {
    trade[side].items.push({ itemId, quantity: 1 });
  }
  
  await trade.save();
  
  const item = getItem(itemId);
  
  // Mettre à jour l'embed de l'échange
  const embed = buildTradeEmbed(trade);
  const components = buildTradeComponents(trade, userId);
  
  await interaction.update({
    embeds: [successEmbed('Objet ajouté', `**${item?.name || itemId}** ajouté à l'échange.`)],
    components: [],
  });
  
  // Mettre à jour le message principal si possible
  try {
    const channel = interaction.channel;
    const message = await channel.messages.fetch(trade.messageId);
    await message.edit({
      embeds: [embed],
      components,
    });
  } catch (e) {
    // Message peut avoir été supprimé
  }
}

async function handleAddGoldMenu(interaction, guildId, userId) {
  // Pour simplifier, on ajoute 10 po à chaque clic
  const trade = await Trade.findActiveByPlayer(guildId, userId);
  
  if (!trade || trade.status !== 'active') {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Pas d\'échange actif.')],
      ephemeral: true,
    });
  }
  
  const character = await Character.findOne({ userId, guildId });
  const side = trade.getParticipantSide(userId);
  const currentGold = trade[side].gold;
  
  if (character.currency.gp <= currentGold) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Vous n\'avez plus d\'or disponible.')],
      ephemeral: true,
    });
  }
  
  // Reset les confirmations
  trade.initiator.confirmed = false;
  trade.target.confirmed = false;
  
  // Ajouter 10 po (ou le max disponible)
  const toAdd = Math.min(10, character.currency.gp - currentGold);
  trade[side].gold += toAdd;
  
  await trade.save();
  
  const embed = buildTradeEmbed(trade);
  const components = buildTradeComponents(trade, userId);
  
  await interaction.reply({
    embeds: [successEmbed('Or ajouté', `+${toAdd} po ajouté à l'échange. Total: ${trade[side].gold} po`)],
    ephemeral: true,
  });
  
  // Mettre à jour le message principal
  try {
    const channel = interaction.channel;
    const message = await channel.messages.fetch(trade.messageId);
    await message.edit({
      embeds: [embed],
      components,
    });
  } catch (e) {
    // Ignorer
  }
}

async function handleConfirm(interaction, guildId, userId) {
  const trade = await Trade.findActiveByPlayer(guildId, userId);
  
  if (!trade || trade.status !== 'active') {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Pas d\'échange actif.')],
      ephemeral: true,
    });
  }
  
  const side = trade.getParticipantSide(userId);
  trade[side].confirmed = true;
  
  // Si les deux ont confirmé, effectuer l'échange
  if (trade.canComplete()) {
    const result = await executeTrade(trade, guildId);
    
    if (!result.success) {
      trade.initiator.confirmed = false;
      trade.target.confirmed = false;
      await trade.save();
      
      return interaction.update({
        embeds: [errorEmbed('Erreur', result.error)],
        components: buildTradeComponents(trade, userId),
      });
    }
    
    trade.status = 'completed';
    trade.completedAt = new Date();
    await trade.save();
    
    return interaction.update({
      embeds: [successEmbed('🎉 Échange complété !', 
        `L'échange entre **${trade.initiator.characterName}** et **${trade.target.characterName}** a été effectué avec succès !`)],
      components: [],
    });
  }
  
  await trade.save();
  
  const embed = buildTradeEmbed(trade);
  const components = buildTradeComponents(trade, userId);
  
  return interaction.update({
    embeds: [embed],
    components,
  });
}

async function handleUnconfirm(interaction, guildId, userId) {
  const trade = await Trade.findActiveByPlayer(guildId, userId);
  
  if (!trade || trade.status !== 'active') {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Pas d\'échange actif.')],
      ephemeral: true,
    });
  }
  
  const side = trade.getParticipantSide(userId);
  trade[side].confirmed = false;
  await trade.save();
  
  const embed = buildTradeEmbed(trade);
  const components = buildTradeComponents(trade, userId);
  
  return interaction.update({
    embeds: [embed],
    components,
  });
}

// ============================================================
// UTILITAIRES
// ============================================================

function buildTradeEmbed(trade) {
  const initiatorItems = trade.initiator.items.map(i => {
    const item = getItem(i.itemId);
    return `${getItemEmoji(item?.type)} ${item?.name || i.itemId} x${i.quantity}`;
  }).join('\n') || '*Aucun objet*';
  
  const targetItems = trade.target.items.map(i => {
    const item = getItem(i.itemId);
    return `${getItemEmoji(item?.type)} ${item?.name || i.itemId} x${i.quantity}`;
  }).join('\n') || '*Aucun objet*';
  
  const initiatorStatus = trade.initiator.confirmed ? '✅ Confirmé' : '⏳ En attente';
  const targetStatus = trade.target.confirmed ? '✅ Confirmé' : '⏳ En attente';
  
  return createEmbed({
    title: '🔄 Échange en cours',
    color: 0x3B82F6,
    fields: [
      {
        name: `${trade.initiator.characterName} ${initiatorStatus}`,
        value: [
          '**Objets:**',
          initiatorItems,
          '',
          `**Or:** ${trade.initiator.gold} po`,
        ].join('\n'),
        inline: true,
      },
      {
        name: '⇄',
        value: '\u200b',
        inline: true,
      },
      {
        name: `${trade.target.characterName} ${targetStatus}`,
        value: [
          '**Objets:**',
          targetItems,
          '',
          `**Or:** ${trade.target.gold} po`,
        ].join('\n'),
        inline: true,
      },
    ],
    footer: { text: 'Les deux joueurs doivent confirmer pour finaliser' },
  });
}

function buildTradeComponents(trade, userId) {
  const side = trade.getParticipantSide(userId);
  const isConfirmed = trade[side]?.confirmed;
  
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('trade_addItem')
      .setLabel('Ajouter objet')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('📦')
      .setDisabled(isConfirmed),
    new ButtonBuilder()
      .setCustomId('trade_addGold')
      .setLabel('+10 po')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('💰')
      .setDisabled(isConfirmed)
  );
  
  const row2 = new ActionRowBuilder().addComponents(
    isConfirmed
      ? new ButtonBuilder()
          .setCustomId('trade_unconfirm')
          .setLabel('Annuler confirmation')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('↩️')
      : new ButtonBuilder()
          .setCustomId('trade_confirm')
          .setLabel('Confirmer')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
    new ButtonBuilder()
      .setCustomId('trade_decline')
      .setLabel('Annuler échange')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('❌')
  );
  
  return [row1, row2];
}

async function executeTrade(trade, guildId) {
  try {
    const initiatorChar = await Character.findOne({ userId: trade.initiator.playerId, guildId });
    const targetChar = await Character.findOne({ userId: trade.target.playerId, guildId });
    
    if (!initiatorChar || !targetChar) {
      return { success: false, error: 'Un des personnages est introuvable.' };
    }
    
    // Vérifier que les joueurs ont toujours les items
    for (const tradeItem of trade.initiator.items) {
      const invItem = initiatorChar.inventory.find(i => i.itemId === tradeItem.itemId);
      if (!invItem || invItem.quantity < tradeItem.quantity) {
        return { success: false, error: `${trade.initiator.characterName} n'a plus l'objet requis.` };
      }
    }
    
    for (const tradeItem of trade.target.items) {
      const invItem = targetChar.inventory.find(i => i.itemId === tradeItem.itemId);
      if (!invItem || invItem.quantity < tradeItem.quantity) {
        return { success: false, error: `${trade.target.characterName} n'a plus l'objet requis.` };
      }
    }
    
    // Vérifier l'or
    if (initiatorChar.currency.gp < trade.initiator.gold) {
      return { success: false, error: `${trade.initiator.characterName} n'a plus assez d'or.` };
    }
    if (targetChar.currency.gp < trade.target.gold) {
      return { success: false, error: `${trade.target.characterName} n'a plus assez d'or.` };
    }
    
    // Effectuer les transferts d'items
    // Initiator → Target
    for (const tradeItem of trade.initiator.items) {
      // Retirer de l'initiateur
      const invItem = initiatorChar.inventory.find(i => i.itemId === tradeItem.itemId);
      invItem.quantity -= tradeItem.quantity;
      if (invItem.quantity <= 0) {
        initiatorChar.inventory = initiatorChar.inventory.filter(i => i.itemId !== tradeItem.itemId);
      }
      
      // Ajouter à la cible
      const targetInvItem = targetChar.inventory.find(i => i.itemId === tradeItem.itemId);
      if (targetInvItem) {
        targetInvItem.quantity += tradeItem.quantity;
      } else {
        targetChar.inventory.push({ itemId: tradeItem.itemId, quantity: tradeItem.quantity });
      }
    }
    
    // Target → Initiator
    for (const tradeItem of trade.target.items) {
      // Retirer de la cible
      const invItem = targetChar.inventory.find(i => i.itemId === tradeItem.itemId);
      invItem.quantity -= tradeItem.quantity;
      if (invItem.quantity <= 0) {
        targetChar.inventory = targetChar.inventory.filter(i => i.itemId !== tradeItem.itemId);
      }
      
      // Ajouter à l'initiateur
      const initInvItem = initiatorChar.inventory.find(i => i.itemId === tradeItem.itemId);
      if (initInvItem) {
        initInvItem.quantity += tradeItem.quantity;
      } else {
        initiatorChar.inventory.push({ itemId: tradeItem.itemId, quantity: tradeItem.quantity });
      }
    }
    
    // Transferts d'or
    initiatorChar.currency.gp -= trade.initiator.gold;
    initiatorChar.currency.gp += trade.target.gold;
    
    targetChar.currency.gp -= trade.target.gold;
    targetChar.currency.gp += trade.initiator.gold;
    
    await initiatorChar.save();
    await targetChar.save();
    
    return { success: true };
  } catch (error) {
    console.error('Erreur executeTrade:', error);
    return { success: false, error: 'Erreur lors de l\'échange.' };
  }
}

function getItemEmoji(type) {
  const emojis = {
    weapon: '⚔️',
    armor: '🛡️',
    consumable: '🧪',
    material: '📦',
    quest: '📜',
    misc: '💎',
  };
  return emojis[type] || '📦';
}
