import 'dotenv/config';

export default {
  discord: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID, // Pour le développement
  },
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/valthera',
  },
  environment: process.env.NODE_ENV || 'development',
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  game: {
    startingGold: parseInt(process.env.DEFAULT_STARTING_GOLD) || 100,
    xpMultiplier: parseFloat(process.env.XP_MULTIPLIER) || 1.0,
    dropRateMultiplier: parseFloat(process.env.DROP_RATE_MULTIPLIER) || 1.0,
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 300,
  },
  admins: JSON.parse(process.env.ADMIN_USER_IDS || '[]'),
};
