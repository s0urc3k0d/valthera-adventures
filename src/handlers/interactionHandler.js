import { Collection } from 'discord.js';
import logger from '../utils/logger.js';
import { errorEmbed } from '../utils/embedBuilder.js';

/**
 * Répond à une interaction de manière sûre (gère les cas replied/deferred)
 */
async function safeReply(interaction, options) {
  try {
    if (interaction.replied || interaction.deferred) {
      return await interaction.followUp(options);
    } else {
      return await interaction.reply(options);
    }
  } catch (error) {
    // Interaction probablement expirée (>3s)
    logger.warn(`Impossible de répondre à l'interaction: ${error.message}`);
    return null;
  }
}

/**
 * Met à jour une interaction de manière sûre
 */
async function safeUpdate(interaction, options) {
  try {
    if (interaction.replied || interaction.deferred) {
      return await interaction.editReply(options);
    } else {
      return await interaction.update(options);
    }
  } catch (error) {
    // Fallback vers reply si update échoue
    try {
      return await interaction.reply({ ...options, ephemeral: true });
    } catch {
      logger.warn(`Impossible de mettre à jour l'interaction: ${error.message}`);
      return null;
    }
  }
}

/**
 * Gère les interactions Discord (commandes slash, boutons, menus)
 * @param {Interaction} interaction - Interaction Discord
 * @param {Client} client - Client Discord
 */
export async function handleInteraction(interaction, client) {
  logger.debug(`Interaction reçue: type=${interaction.type}, customId=${interaction.customId || 'N/A'}`);
  
  // Gestion des commandes slash
  if (interaction.isChatInputCommand()) {
    await handleCommand(interaction, client);
  }
  // Gestion des boutons
  else if (interaction.isButton()) {
    logger.debug(`Bouton cliqué: ${interaction.customId}`);
    await handleButton(interaction, client);
  }
  // Gestion des menus de sélection
  else if (interaction.isStringSelectMenu()) {
    logger.debug(`Menu sélectionné: ${interaction.customId}, valeur: ${interaction.values?.[0]}`);
    await handleSelectMenu(interaction, client);
  }
  // Gestion des modaux
  else if (interaction.isModalSubmit()) {
    await handleModal(interaction, client);
  }
  // Gestion des autocomplètes
  else if (interaction.isAutocomplete()) {
    await handleAutocomplete(interaction, client);
  }
}

/**
 * Gère une commande slash
 * @param {CommandInteraction} interaction - Interaction de commande
 * @param {Client} client - Client Discord
 */
async function handleCommand(interaction, client) {
  const command = client.commands.get(interaction.commandName);
  
  if (!command) {
    logger.warn(`Commande inconnue: ${interaction.commandName}`);
    return;
  }
  
  // Vérification du cooldown
  const cooldownResult = checkCooldown(interaction, client, command);
  if (cooldownResult) {
    return interaction.reply({
      embeds: [errorEmbed('Cooldown', cooldownResult)],
      ephemeral: true,
    });
  }
  
  try {
    logger.command(`Exécution de /${interaction.commandName}`, {
      user: interaction.user.tag,
      userId: interaction.user.id,
      guild: interaction.guild?.name,
      guildId: interaction.guildId,
    });
    
    await command.execute(interaction, client);
  } catch (error) {
    logger.error(`Erreur lors de l'exécution de /${interaction.commandName}:`, error);
    
    const errorMessage = {
      embeds: [errorEmbed('Erreur', 'Une erreur est survenue lors de l\'exécution de cette commande.')],
      ephemeral: true,
    };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}

/**
 * Gère une interaction de bouton
 * @param {ButtonInteraction} interaction - Interaction de bouton
 * @param {Client} client - Client Discord
 */
async function handleButton(interaction, client) {
  // Support des deux formats: "commandName:action:params" et "commandName_action_params"
  const separator = interaction.customId.includes(':') ? ':' : '_';
  const [action, ...params] = interaction.customId.split(separator);
  
  // Les handlers de boutons peuvent être dans les commandes
  // Format customId: "commandName:action:params" ou "commandName_action_params"
  const command = client.commands.get(action);
  
  if (command?.handleButton) {
    try {
      await command.handleButton(interaction, client, params);
    } catch (error) {
      logger.error(`Erreur lors du traitement du bouton ${interaction.customId}:`, error);
      await safeReply(interaction, {
        embeds: [errorEmbed('Erreur', 'Une erreur est survenue.')],
        ephemeral: true,
      });
    }
  } else {
    logger.warn(`Handler de bouton non trouvé: ${action}`);
    await safeReply(interaction, {
      embeds: [errorEmbed('Action invalide', 'Ce bouton n\'est plus valide.')],
      ephemeral: true,
    });
  }
}

/**
 * Gère une interaction de menu de sélection
 * @param {StringSelectMenuInteraction} interaction - Interaction de menu
 * @param {Client} client - Client Discord
 */
async function handleSelectMenu(interaction, client) {
  // Support des deux formats: "commandName:action:params" et "commandName_action_params"
  const separator = interaction.customId.includes(':') ? ':' : '_';
  const [action, ...params] = interaction.customId.split(separator);
  
  const command = client.commands.get(action);
  
  if (command?.handleSelectMenu) {
    try {
      await command.handleSelectMenu(interaction, client, params);
    } catch (error) {
      logger.error(`Erreur lors du traitement du menu ${interaction.customId}:`, error);
      await safeReply(interaction, {
        embeds: [errorEmbed('Erreur', 'Une erreur est survenue.')],
        ephemeral: true,
      });
    }
  } else {
    logger.warn(`Handler de menu non trouvé: ${action}`);
    await safeReply(interaction, {
      embeds: [errorEmbed('Action invalide', 'Ce menu n\'est plus valide.')],
      ephemeral: true,
    });
  }
}

/**
 * Gère une soumission de modal
 * @param {ModalSubmitInteraction} interaction - Interaction de modal
 * @param {Client} client - Client Discord
 */
async function handleModal(interaction, client) {
  const [action, ...params] = interaction.customId.split(':');
  
  const command = client.commands.get(action);
  
  if (command?.handleModal) {
    try {
      await command.handleModal(interaction, client, params);
    } catch (error) {
      logger.error(`Erreur lors du traitement du modal ${interaction.customId}:`, error);
      await safeReply(interaction, {
        embeds: [errorEmbed('Erreur', 'Une erreur est survenue.')],
        ephemeral: true,
      });
    }
  } else {
    logger.warn(`Handler de modal non trouvé: ${action}`);
    await safeReply(interaction, {
      embeds: [errorEmbed('Action invalide', 'Ce formulaire n\'est plus valide.')],
      ephemeral: true,
    });
  }
}

/**
 * Gère une requête d'autocomplétion
 * @param {AutocompleteInteraction} interaction - Interaction d'autocomplete
 * @param {Client} client - Client Discord
 */
async function handleAutocomplete(interaction, client) {
  const command = client.commands.get(interaction.commandName);
  
  if (command?.autocomplete) {
    try {
      await command.autocomplete(interaction, client);
    } catch (error) {
      logger.error(`Erreur lors de l'autocomplétion pour ${interaction.commandName}:`, error);
      // Autocomplete ne peut pas afficher d'erreur, juste retourner vide
      try {
        await interaction.respond([]);
      } catch {
        // Ignorer si déjà répondu
      }
    }
  }
}

/**
 * Vérifie le cooldown d'une commande
 * @param {Interaction} interaction - Interaction
 * @param {Client} client - Client Discord
 * @param {Object} command - Commande
 * @returns {string|null} Message d'erreur ou null si OK
 */
function checkCooldown(interaction, client, command) {
  if (!command.cooldown) return null;
  
  const { cooldowns } = client;
  
  if (!cooldowns.has(command.data.name)) {
    cooldowns.set(command.data.name, new Collection());
  }
  
  const now = Date.now();
  const timestamps = cooldowns.get(command.data.name);
  const cooldownAmount = (command.cooldown || client.constants.bot.cooldowns.default) * 1000;
  
  if (timestamps.has(interaction.user.id)) {
    const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
    
    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return `Veuillez attendre **${timeLeft.toFixed(1)}** secondes avant de réutiliser \`/${command.data.name}\`.`;
    }
  }
  
  timestamps.set(interaction.user.id, now);
  setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
  
  return null;
}

export default {
  handleInteraction,
  safeReply,
  safeUpdate,
};
