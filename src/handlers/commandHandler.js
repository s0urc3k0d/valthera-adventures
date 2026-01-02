import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Collection } from 'discord.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Charge récursivement toutes les commandes depuis le dossier commands
 * @param {Client} client - Client Discord
 */
export async function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  
  if (!fs.existsSync(commandsPath)) {
    logger.warn('Dossier commands non trouvé');
    return;
  }
  
  await loadCommandsFromDirectory(client, commandsPath);
}

/**
 * Charge les commandes d'un répertoire récursivement
 * @param {Client} client - Client Discord
 * @param {string} directory - Chemin du répertoire
 */
async function loadCommandsFromDirectory(client, directory) {
  const items = fs.readdirSync(directory, { withFileTypes: true });
  
  for (const item of items) {
    const itemPath = path.join(directory, item.name);
    
    if (item.isDirectory()) {
      // Charger récursivement les sous-dossiers
      await loadCommandsFromDirectory(client, itemPath);
    } else if (item.name.endsWith('.js')) {
      try {
        const fileUrl = pathToFileURL(itemPath).href;
        const command = await import(fileUrl);
        
        // Vérifier que la commande a les propriétés requises
        if (command.default?.data && command.default?.execute) {
          client.commands.set(command.default.data.name, command.default);
          logger.debug(`Commande chargée: ${command.default.data.name}`);
        } else if (command.data && command.execute) {
          client.commands.set(command.data.name, command);
          logger.debug(`Commande chargée: ${command.data.name}`);
        } else {
          logger.warn(`La commande ${item.name} ne contient pas les propriétés requises (data, execute)`);
        }
      } catch (error) {
        logger.error(`Erreur lors du chargement de la commande ${item.name}:`, error);
      }
    }
  }
}

/**
 * Recharge une commande spécifique
 * @param {Client} client - Client Discord
 * @param {string} commandName - Nom de la commande
 */
export async function reloadCommand(client, commandName) {
  const command = client.commands.get(commandName);
  
  if (!command) {
    throw new Error(`Commande "${commandName}" non trouvée`);
  }
  
  // Trouver le fichier de la commande
  const commandsPath = path.join(__dirname, '..', 'commands');
  const filePath = findCommandFile(commandsPath, commandName);
  
  if (!filePath) {
    throw new Error(`Fichier de la commande "${commandName}" non trouvé`);
  }
  
  // Supprimer du cache et recharger
  delete require.cache[require.resolve(filePath)];
  
  try {
    const fileUrl = pathToFileURL(filePath).href + `?update=${Date.now()}`;
    const newCommand = await import(fileUrl);
    
    if (newCommand.default?.data && newCommand.default?.execute) {
      client.commands.set(commandName, newCommand.default);
    } else if (newCommand.data && newCommand.execute) {
      client.commands.set(commandName, newCommand);
    }
    
    logger.info(`Commande rechargée: ${commandName}`);
    return true;
  } catch (error) {
    logger.error(`Erreur lors du rechargement de ${commandName}:`, error);
    throw error;
  }
}

/**
 * Trouve le fichier d'une commande
 * @param {string} directory - Répertoire de recherche
 * @param {string} commandName - Nom de la commande
 * @returns {string|null} Chemin du fichier ou null
 */
function findCommandFile(directory, commandName) {
  const items = fs.readdirSync(directory, { withFileTypes: true });
  
  for (const item of items) {
    const itemPath = path.join(directory, item.name);
    
    if (item.isDirectory()) {
      const found = findCommandFile(itemPath, commandName);
      if (found) return found;
    } else if (item.name === `${commandName}.js`) {
      return itemPath;
    }
  }
  
  return null;
}

/**
 * Récupère toutes les commandes pour le déploiement
 * @param {Client} client - Client Discord
 * @returns {Array} Tableau des données de commandes
 */
export function getCommandsData(client) {
  return [...client.commands.values()].map(cmd => cmd.data.toJSON());
}
