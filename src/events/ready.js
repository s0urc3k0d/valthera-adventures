import { Events, ActivityType } from 'discord.js';
import logger from '../utils/logger.js';

export default {
  name: Events.ClientReady,
  once: true,
  
  async execute(client) {
    logger.info(`✅ Connecté en tant que ${client.user.tag}!`);
    logger.info(`📊 Serveurs: ${client.guilds.cache.size}`);
    logger.info(`👥 Utilisateurs: ${client.users.cache.size}`);
    
    // Définir le statut du bot
    client.user.setPresence({
      activities: [{
        name: '/create pour commencer!',
        type: ActivityType.Playing,
      }],
      status: 'online',
    });
    
    // Log des guildes
    client.guilds.cache.forEach(guild => {
      logger.info(`  - ${guild.name} (${guild.memberCount} membres)`);
    });
    
    logger.info('🎮 Valthera Adventures est prêt!');
  },
};
