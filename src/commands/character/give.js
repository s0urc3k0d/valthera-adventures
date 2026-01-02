import { 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import Character from '../../models/Character.js';
import { errorEmbed } from '../../utils/embedBuilder.js';
import { card, separator, getRarityEmoji, formatGold } from '../../utils/ui.js';
import { getItem, getInventoryItems } from '../../utils/itemService.js';
import logger from '../../utils/logger.js';

// Sessions d'échange en cours
const giveSession = new Map();
const SESSION_TIMEOUT = 60000; // 1 minute

export default {
  data: new SlashCommandBuilder()
    .setName('give')
    .setDescription('Donner un objet ou de l\'or à un autre joueur')
    .addSubcommand(sub =>
      sub
        .setName('item')
        .setDescription('Donner un objet de votre inventaire')
        .addUserOption(option =>
          option
            .setName('joueur')
            .setDescription('Le joueur à qui donner')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('gold')
        .setDescription('Donner de l\'or')
        .addUserOption(option =>
          option
            .setName('joueur')
            .setDescription('Le joueur à qui donner')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('montant')
            .setDescription('Montant en pièces d\'or')
            .setRequired(true)
            .setMinValue(1)
        )
    ),
  
  cooldown: 5,
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('joueur');
    const guildId = interaction.guildId;
    
    // Vérifications de base
    if (targetUser.id === interaction.user.id) {
      return interaction.reply({
        embeds: [errorEmbed('Erreur', 'Vous ne pouvez pas vous donner des objets à vous-même!')],
        ephemeral: true,
      });
    }
    
    if (targetUser.bot) {
      return interaction.reply({
        embeds: [errorEmbed('Erreur', 'Vous ne pouvez pas donner d\'objets à un bot!')],
        ephemeral: true,
      });
    }
    
    // Récupérer les personnages
    const [giverCharacter, receiverCharacter] = await Promise.all([
      Character.findByDiscordId(interaction.user.id, guildId),
      Character.findByDiscordId(targetUser.id, guildId),
    ]);
    
    if (!giverCharacter) {
      return interaction.reply({
        embeds: [errorEmbed('Pas de personnage', 'Vous n\'avez pas de personnage. Utilisez `/create`!')],
        ephemeral: true,
      });
    }
    
    if (!receiverCharacter) {
      return interaction.reply({
        embeds: [errorEmbed('Joueur introuvable', `**${targetUser.username}** n'a pas de personnage.`)],
        ephemeral: true,
      });
    }
    
    // Vérifier si les joueurs sont en combat
    if (giverCharacter.inCombat || receiverCharacter.inCombat) {
      return interaction.reply({
        embeds: [errorEmbed('En combat', 'Impossible de faire un échange pendant un combat!')],
        ephemeral: true,
      });
    }
    
    // Vérifier si les joueurs sont dans la même zone
    if (giverCharacter.location !== receiverCharacter.location) {
      return interaction.reply({
        embeds: [errorEmbed(
          'Trop loin',
          `Vous devez être dans la même zone pour échanger.\n\n` +
          `📍 Vous: **${formatLocation(giverCharacter.location)}**\n` +
          `📍 ${targetUser.username}: **${formatLocation(receiverCharacter.location)}**`
        )],
        ephemeral: true,
      });
    }
    
    if (subcommand === 'gold') {
      await handleGoldGive(interaction, giverCharacter, receiverCharacter, targetUser);
    } else {
      await handleItemGive(interaction, giverCharacter, receiverCharacter, targetUser);
    }
  },
  
  async handleSelectMenu(interaction, client, params) {
    const [menuType] = params;
    const session = giveSession.get(interaction.user.id);
    
    if (!session || Date.now() > session.expiresAt) {
      giveSession.delete(interaction.user.id);
      return interaction.update({
        embeds: [errorEmbed('Session expirée', 'La session d\'échange a expiré. Utilisez `/give` à nouveau.')],
        components: [],
      });
    }
    
    if (menuType === 'item') {
      const itemId = interaction.values[0];
      session.selectedItem = itemId;
      
      // Trouver l'objet dans l'inventaire
      const giver = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
      const inventorySlot = giver.inventory.find(slot => slot.itemId === itemId && !slot.equipped);
      const item = getItem(itemId);
      
      if (!inventorySlot || !item) {
        return interaction.update({
          embeds: [errorEmbed('Erreur', 'Cet objet n\'est plus disponible.')],
          components: [],
        });
      }
      
      // Afficher la confirmation
      await interaction.update({
        embeds: [createGiveConfirmEmbed(item, session.receiverName, interaction.user.username)],
        components: createConfirmButtons(),
      });
    }
  },
  
  async handleButton(interaction, client, params) {
    const [action] = params;
    const session = giveSession.get(interaction.user.id);
    
    if (action === 'cancel') {
      giveSession.delete(interaction.user.id);
      return interaction.update({
        embeds: [errorEmbed('❌ Annulé', 'L\'échange a été annulé.')],
        components: [],
      });
    }
    
    if (action === 'confirm') {
      if (!session || Date.now() > session.expiresAt) {
        giveSession.delete(interaction.user.id);
        return interaction.update({
          embeds: [errorEmbed('Session expirée', 'La session d\'échange a expiré.')],
          components: [],
        });
      }
      
      await executeGiveItem(interaction, session);
    }
  },
};

// ============================================================
// HANDLERS
// ============================================================

async function handleGoldGive(interaction, giverCharacter, receiverCharacter, targetUser) {
  const amount = interaction.options.getInteger('montant');
  
  // Vérifier les fonds
  if (giverCharacter.gold.gold < amount) {
    return interaction.reply({
      embeds: [errorEmbed(
        'Fonds insuffisants',
        `Vous n'avez que **${giverCharacter.gold.gold} PO**.\n` +
        `Vous essayez de donner **${amount} PO**.`
      )],
      ephemeral: true,
    });
  }
  
  // Effectuer le transfert
  giverCharacter.gold.gold -= amount;
  receiverCharacter.gold.gold += amount;
  
  await Promise.all([
    giverCharacter.save(),
    receiverCharacter.save(),
  ]);
  
  logger.game(`Transfert d'or: ${giverCharacter.name} → ${receiverCharacter.name}`, {
    amount,
    giverId: interaction.user.id,
    receiverId: targetUser.id,
  });
  
  const embed = card({
    theme: 'gold',
    title: '💰 Transfert d\'or effectué!',
    description: [
      separator('stars'),
      '',
      `**${giverCharacter.name}** a donné **${amount} PO** à **${receiverCharacter.name}**`,
      '',
      separator('line'),
      '',
      `💰 **Votre solde:** ${formatGold(giverCharacter.gold)}`,
      `💰 **Solde de ${receiverCharacter.name}:** ${formatGold(receiverCharacter.gold)}`,
    ].join('\n'),
  });
  
  await interaction.reply({ embeds: [embed] });
}

async function handleItemGive(interaction, giverCharacter, receiverCharacter, targetUser) {
  // Récupérer les objets non équipés
  const availableItems = giverCharacter.inventory.filter(slot => !slot.equipped);
  
  if (availableItems.length === 0) {
    return interaction.reply({
      embeds: [errorEmbed(
        'Inventaire vide',
        'Vous n\'avez aucun objet à donner (les objets équipés ne peuvent pas être donnés).'
      )],
      ephemeral: true,
    });
  }
  
  // Créer la session
  giveSession.set(interaction.user.id, {
    giverId: interaction.user.id,
    receiverId: targetUser.id,
    receiverName: receiverCharacter.name,
    giverCharacterId: giverCharacter._id,
    receiverCharacterId: receiverCharacter._id,
    selectedItem: null,
    expiresAt: Date.now() + SESSION_TIMEOUT,
  });
  
  // Créer le menu de sélection
  const embed = createItemSelectionEmbed(giverCharacter, receiverCharacter);
  const menu = createItemSelectMenu(availableItems);
  
  await interaction.reply({
    embeds: [embed],
    components: [menu, createCancelButton()],
    ephemeral: true,
  });
}

async function executeGiveItem(interaction, session) {
  const [giverCharacter, receiverCharacter] = await Promise.all([
    Character.findById(session.giverCharacterId),
    Character.findById(session.receiverCharacterId),
  ]);
  
  if (!giverCharacter || !receiverCharacter) {
    giveSession.delete(interaction.user.id);
    return interaction.update({
      embeds: [errorEmbed('Erreur', 'Un des personnages est introuvable.')],
      components: [],
    });
  }
  
  // Trouver et retirer l'objet du donneur
  const itemIndex = giverCharacter.inventory.findIndex(
    slot => slot.itemId === session.selectedItem && !slot.equipped
  );
  
  if (itemIndex === -1) {
    giveSession.delete(interaction.user.id);
    return interaction.update({
      embeds: [errorEmbed('Erreur', 'L\'objet n\'est plus disponible dans votre inventaire.')],
      components: [],
    });
  }
  
  const inventorySlot = giverCharacter.inventory[itemIndex];
  const item = getItem(session.selectedItem);
  
  // Transférer l'objet
  if (inventorySlot.quantity > 1) {
    inventorySlot.quantity--;
  } else {
    giverCharacter.inventory.splice(itemIndex, 1);
  }
  
  // Ajouter au receveur
  const existingSlot = receiverCharacter.inventory.find(
    slot => slot.itemId === session.selectedItem && !slot.equipped
  );
  
  if (existingSlot) {
    existingSlot.quantity++;
  } else {
    receiverCharacter.inventory.push({
      itemId: session.selectedItem,
      quantity: 1,
      equipped: false,
      slot: null,
    });
  }
  
  await Promise.all([
    giverCharacter.save(),
    receiverCharacter.save(),
  ]);
  
  giveSession.delete(interaction.user.id);
  
  logger.game(`Transfert d'objet: ${giverCharacter.name} → ${receiverCharacter.name}`, {
    itemId: session.selectedItem,
    itemName: item?.name,
    giverId: interaction.user.id,
    receiverId: session.receiverId,
  });
  
  const embed = card({
    theme: 'success',
    title: '🎁 Objet donné avec succès!',
    description: [
      separator('stars'),
      '',
      `**${giverCharacter.name}** a donné:`,
      '',
      `${getRarityEmoji(item?.rarity)} **${item?.name || session.selectedItem}**`,
      `*${item?.description?.substring(0, 100) || 'Aucune description'}*`,
      '',
      `➡️ à **${receiverCharacter.name}**`,
      '',
      separator('dots'),
      '',
      `📦 Votre inventaire: ${giverCharacter.inventory.length} objets`,
    ].join('\n'),
  });
  
  await interaction.update({
    embeds: [embed],
    components: [],
  });
}

// ============================================================
// EMBEDS & COMPONENTS
// ============================================================

function createItemSelectionEmbed(giverCharacter, receiverCharacter) {
  return card({
    theme: 'inventory',
    title: '🎁 Donner un objet',
    description: [
      `Sélectionnez un objet à donner à **${receiverCharacter.name}**.`,
      '',
      separator('line'),
      '',
      '⚠️ **Notes:**',
      '• Les objets équipés ne peuvent pas être donnés',
      '• L\'échange est irréversible',
      '• Session expire dans 60 secondes',
    ].join('\n'),
  });
}

function createItemSelectMenu(items) {
  const uniqueItems = [];
  const seenIds = new Set();
  
  for (const slot of items) {
    if (!seenIds.has(slot.itemId)) {
      seenIds.add(slot.itemId);
      uniqueItems.push(slot);
    }
  }
  
  const options = uniqueItems.slice(0, 25).map(slot => {
    const item = getItem(slot.itemId);
    const quantity = items.filter(s => s.itemId === slot.itemId).reduce((sum, s) => sum + s.quantity, 0);
    
    return {
      label: item?.name || slot.itemId,
      value: slot.itemId,
      description: quantity > 1 ? `x${quantity} - ${item?.type || 'objet'}` : item?.type || 'objet',
      emoji: item?.emoji || '📦',
    };
  });
  
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('give:item')
      .setPlaceholder('📦 Sélectionnez un objet...')
      .addOptions(options)
  );
}

function createGiveConfirmEmbed(item, receiverName, giverName) {
  return card({
    theme: 'warning',
    title: '⚠️ Confirmer le don',
    description: [
      `**${giverName}**, vous êtes sur le point de donner:`,
      '',
      `${getRarityEmoji(item.rarity)} **${item.name}**`,
      `*${item.description?.substring(0, 100) || 'Aucune description'}*`,
      '',
      `💰 Valeur: **${item.price || 0} PO**`,
      '',
      separator('line'),
      '',
      `➡️ à **${receiverName}**`,
      '',
      '⚠️ **Cette action est irréversible!**',
    ].join('\n'),
  });
}

function createConfirmButtons() {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('give:cancel')
      .setLabel('Annuler')
      .setEmoji('❌')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('give:confirm')
      .setLabel('Confirmer le don')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success),
  )];
}

function createCancelButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('give:cancel')
      .setLabel('Annuler')
      .setEmoji('❌')
      .setStyle(ButtonStyle.Danger),
  );
}

function formatLocation(locationId) {
  const locations = {
    'val-serein': '🏰 Val-Serein',
    'whispering-woods': '🌲 Bois des Murmures',
    'shadowfen-marshes': '🏚️ Marais de Sombrefagne',
    'frostpeak-mountains': '🏔️ Monts Givrés',
    'ancient-ruins': '🏛️ Ruines Anciennes',
  };
  return locations[locationId] || locationId;
}
