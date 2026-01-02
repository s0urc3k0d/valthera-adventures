import { Client, GatewayIntentBits, Collection, Partials } from 'discord.js';
import mongoose from 'mongoose';
import config from './config/config.js';
import constants from './config/constants.js';
import logger from './utils/logger.js';
import { loadCommands } from './handlers/commandHandler.js';
import { loadEvents } from './handlers/eventHandler.js';
import { startHealthServer, stopHealthServer } from './utils/healthServer.js';

// Création du client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
  ],
});

// Collections pour les commandes et cooldowns
client.commands = new Collection();
client.cooldowns = new Collection();
client.constants = constants;
client.config = config;

// Fonction principale de démarrage
async function start() {
  try {
    logger.info('🚀 Démarrage de Valthera Adventures...');

    // Connexion à MongoDB
    logger.info('📦 Connexion à la base de données...');
    await mongoose.connect(config.database.uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info('✅ Connecté à MongoDB');

    // Chargement des commandes
    logger.info('📝 Chargement des commandes...');
    await loadCommands(client);
    logger.info(`✅ ${client.commands.size} commandes chargées`);

    // Chargement des événements
    logger.info('🎯 Chargement des événements...');
    await loadEvents(client);
    logger.info('✅ Événements chargés');

    // Connexion à Discord
    logger.info('🔌 Connexion à Discord...');
    await client.login(config.discord.token);
    
    // Démarrer le serveur de health check (pour nginx/monitoring)
    const healthPort = parseInt(process.env.HEALTH_PORT) || 3000;
    startHealthServer(client, healthPort);

  } catch (error) {
    logger.error('❌ Erreur lors du démarrage:', error);
    process.exit(1);
  }
}

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Arrêt propre
process.on('SIGINT', async () => {
  logger.info('🛑 Arrêt du bot...');
  stopHealthServer();
  await mongoose.connection.close();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('🛑 Arrêt du bot (SIGTERM)...');
  stopHealthServer();
  await mongoose.connection.close();
  client.destroy();
  process.exit(0);
});

// Démarrage
start();
