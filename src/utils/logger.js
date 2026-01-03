import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.join(__dirname, '../../logs');

// Vérifier si on peut écrire dans le dossier logs
let canWriteLogs = false;
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  fs.accessSync(logsDir, fs.constants.W_OK);
  canWriteLogs = true;
} catch (err) {
  console.warn(`⚠️ Cannot write to logs directory: ${logsDir}. File logging disabled.`);
}

// Format personnalisé pour la console
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `[${timestamp}] ${level}: ${message} ${metaString}`;
  })
);

// Format pour les fichiers
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Configuration des transports - toujours la console
const transports = [
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || 'debug',
  }),
];

// Ajouter les fichiers seulement si on peut écrire
if (canWriteLogs) {
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'valthera-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info',
    }),
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
    })
  );
}

// Création du logger
const loggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  transports,
};

// Ajouter les handlers d'exceptions seulement si on peut écrire
if (canWriteLogs) {
  loggerOptions.exceptionHandlers = [
    new DailyRotateFile({
      filename: path.join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ];
  loggerOptions.rejectionHandlers = [
    new DailyRotateFile({
      filename: path.join(logsDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ];
}

const logger = winston.createLogger(loggerOptions);

// Méthodes helper pour les catégories de log
logger.game = (message, meta = {}) => {
  logger.info(message, { category: 'game', ...meta });
};

logger.combat = (message, meta = {}) => {
  logger.info(message, { category: 'combat', ...meta });
};

logger.economy = (message, meta = {}) => {
  logger.info(message, { category: 'economy', ...meta });
};

logger.command = (message, meta = {}) => {
  logger.debug(message, { category: 'command', ...meta });
};

export default logger;
