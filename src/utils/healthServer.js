/**
 * Serveur HTTP minimal pour les health checks et le monitoring
 * Permet à un reverse proxy externe (nginx) de vérifier l'état du bot
 */

import http from 'http';
import mongoose from 'mongoose';
import logger from './logger.js';

let client = null;
let server = null;

/**
 * Démarre le serveur de health check
 * @param {Client} discordClient - Le client Discord
 * @param {number} port - Port d'écoute (défaut: 3000)
 */
export function startHealthServer(discordClient, port = 3000) {
  client = discordClient;
  
  server = http.createServer(async (req, res) => {
    // CORS pour les appels depuis nginx
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    switch (url.pathname) {
      case '/health':
      case '/healthz':
        return handleHealth(req, res);
      
      case '/ready':
      case '/readyz':
        return handleReady(req, res);
      
      case '/metrics':
        return handleMetrics(req, res);
      
      case '/status':
        return handleStatus(req, res);
      
      default:
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Not found' }));
    }
  });
  
  server.listen(port, '0.0.0.0', () => {
    logger.info(`🏥 Health server listening on port ${port}`);
  });
  
  server.on('error', (err) => {
    logger.error('Health server error:', err);
  });
  
  return server;
}

/**
 * Arrête le serveur de health check
 */
export function stopHealthServer() {
  if (server) {
    server.close();
    server = null;
    logger.info('🏥 Health server stopped');
  }
}

/**
 * /health - Liveness probe (le processus est-il vivant?)
 */
function handleHealth(req, res) {
  res.statusCode = 200;
  res.end(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));
}

/**
 * /ready - Readiness probe (le service est-il prêt à recevoir du trafic?)
 */
function handleReady(req, res) {
  const mongoReady = mongoose.connection.readyState === 1;
  const discordReady = client?.isReady() ?? false;
  
  const isReady = mongoReady && discordReady;
  
  res.statusCode = isReady ? 200 : 503;
  res.end(JSON.stringify({
    status: isReady ? 'ready' : 'not ready',
    checks: {
      mongodb: mongoReady ? 'connected' : 'disconnected',
      discord: discordReady ? 'connected' : 'disconnected',
    },
    timestamp: new Date().toISOString(),
  }));
}

/**
 * /metrics - Métriques basiques (compatible Prometheus format texte)
 */
function handleMetrics(req, res) {
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();
  
  const guildCount = client?.guilds?.cache?.size ?? 0;
  const userCount = client?.users?.cache?.size ?? 0;
  const commandCount = client?.commands?.size ?? 0;
  
  // Format Prometheus
  const metrics = [
    `# HELP valthera_uptime_seconds Bot uptime in seconds`,
    `# TYPE valthera_uptime_seconds gauge`,
    `valthera_uptime_seconds ${uptime.toFixed(2)}`,
    '',
    `# HELP valthera_memory_heap_used_bytes Heap memory used`,
    `# TYPE valthera_memory_heap_used_bytes gauge`,
    `valthera_memory_heap_used_bytes ${memUsage.heapUsed}`,
    '',
    `# HELP valthera_memory_rss_bytes RSS memory`,
    `# TYPE valthera_memory_rss_bytes gauge`,
    `valthera_memory_rss_bytes ${memUsage.rss}`,
    '',
    `# HELP valthera_guilds_total Number of guilds`,
    `# TYPE valthera_guilds_total gauge`,
    `valthera_guilds_total ${guildCount}`,
    '',
    `# HELP valthera_users_cached Number of cached users`,
    `# TYPE valthera_users_cached gauge`,
    `valthera_users_cached ${userCount}`,
    '',
    `# HELP valthera_commands_total Number of loaded commands`,
    `# TYPE valthera_commands_total gauge`,
    `valthera_commands_total ${commandCount}`,
    '',
  ].join('\n');
  
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.statusCode = 200;
  res.end(metrics);
}

/**
 * /status - Status détaillé en JSON
 */
async function handleStatus(req, res) {
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();
  
  let dbStatus = 'disconnected';
  let dbPing = null;
  
  try {
    if (mongoose.connection.readyState === 1) {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      dbPing = Date.now() - start;
      dbStatus = 'connected';
    }
  } catch (e) {
    dbStatus = 'error';
  }
  
  const status = {
    status: 'ok',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: {
      seconds: Math.floor(uptime),
      human: formatUptime(uptime),
    },
    memory: {
      heapUsed: formatBytes(memUsage.heapUsed),
      heapTotal: formatBytes(memUsage.heapTotal),
      rss: formatBytes(memUsage.rss),
    },
    discord: {
      status: client?.isReady() ? 'connected' : 'disconnected',
      ping: client?.ws?.ping ?? null,
      guilds: client?.guilds?.cache?.size ?? 0,
      users: client?.users?.cache?.size ?? 0,
    },
    database: {
      status: dbStatus,
      ping: dbPing,
    },
    timestamp: new Date().toISOString(),
  };
  
  res.statusCode = 200;
  res.end(JSON.stringify(status, null, 2));
}

// Utilitaires
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  parts.push(`${secs}s`);
  
  return parts.join(' ');
}

function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(2)} ${units[i]}`;
}

export default { startHealthServer, stopHealthServer };
