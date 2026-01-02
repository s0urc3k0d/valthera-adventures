import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Charge tous les événements depuis le dossier events
 * @param {Client} client - Client Discord
 */
export async function loadEvents(client) {
  const eventsPath = path.join(__dirname, '..', 'events');
  
  if (!fs.existsSync(eventsPath)) {
    logger.warn('Dossier events non trouvé');
    return;
  }
  
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    
    try {
      const fileUrl = pathToFileURL(filePath).href;
      const event = await import(fileUrl);
      const eventModule = event.default || event;
      
      if (!eventModule.name || !eventModule.execute) {
        logger.warn(`L'événement ${file} ne contient pas les propriétés requises (name, execute)`);
        continue;
      }
      
      if (eventModule.once) {
        client.once(eventModule.name, (...args) => eventModule.execute(...args, client));
      } else {
        client.on(eventModule.name, (...args) => eventModule.execute(...args, client));
      }
      
      logger.debug(`Événement chargé: ${eventModule.name}`);
    } catch (error) {
      logger.error(`Erreur lors du chargement de l'événement ${file}:`, error);
    }
  }
}
