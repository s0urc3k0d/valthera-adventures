/**
 * Gestionnaire de sessions avec Time-To-Live (TTL)
 * Centralise la gestion des états temporaires avec nettoyage automatique
 */

import logger from './logger.js';

/**
 * Classe SessionManager - Gère les sessions avec expiration automatique
 */
export class SessionManager {
  /**
   * @param {string} name - Nom du manager (pour les logs)
   * @param {number} defaultTTL - Durée de vie par défaut en ms (15 minutes)
   * @param {number} cleanupInterval - Intervalle de nettoyage en ms (1 minute)
   */
  constructor(name, defaultTTL = 15 * 60 * 1000, cleanupInterval = 60 * 1000) {
    this.name = name;
    this.defaultTTL = defaultTTL;
    this.sessions = new Map();
    this.timers = new Map();
    
    // Démarrer le nettoyage périodique
    this.cleanupTimer = setInterval(() => this.cleanup(), cleanupInterval);
    
    logger.debug(`SessionManager "${name}" initialisé (TTL: ${defaultTTL}ms)`);
  }
  
  /**
   * Créer ou mettre à jour une session
   * @param {string} key - Clé de la session (généralement odUserId)
   * @param {Object} data - Données de la session
   * @param {number} ttl - Durée de vie personnalisée (optionnel)
   */
  set(key, data, ttl = this.defaultTTL) {
    // Annuler l'ancien timer si existant
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }
    
    // Stocker avec métadonnées
    this.sessions.set(key, {
      data,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
    });
    
    // Configurer l'expiration automatique
    const timer = setTimeout(() => {
      this.delete(key);
      logger.debug(`Session "${this.name}:${key}" expirée automatiquement`);
    }, ttl);
    
    this.timers.set(key, timer);
    
    return data;
  }
  
  /**
   * Récupérer une session
   * @param {string} key - Clé de la session
   * @returns {Object|null} Données ou null si expirée/inexistante
   */
  get(key) {
    const session = this.sessions.get(key);
    
    if (!session) return null;
    
    // Vérifier l'expiration
    if (Date.now() > session.expiresAt) {
      this.delete(key);
      return null;
    }
    
    return session.data;
  }
  
  /**
   * Vérifier si une session existe
   * @param {string} key - Clé de la session
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }
  
  /**
   * Supprimer une session
   * @param {string} key - Clé de la session
   * @returns {boolean} true si supprimée
   */
  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    return this.sessions.delete(key);
  }
  
  /**
   * Rafraîchir le TTL d'une session
   * @param {string} key - Clé de la session
   * @param {number} ttl - Nouveau TTL (optionnel)
   * @returns {boolean} true si rafraîchie
   */
  refresh(key, ttl = this.defaultTTL) {
    const data = this.get(key);
    if (data) {
      this.set(key, data, ttl);
      return true;
    }
    return false;
  }
  
  /**
   * Mettre à jour les données d'une session
   * @param {string} key - Clé de la session
   * @param {Object} updates - Modifications à appliquer
   * @returns {Object|null} Session mise à jour ou null
   */
  update(key, updates) {
    const data = this.get(key);
    if (!data) return null;
    
    const newData = { ...data, ...updates };
    
    // Garder le même TTL restant
    const session = this.sessions.get(key);
    const remainingTTL = session.expiresAt - Date.now();
    
    this.set(key, newData, remainingTTL);
    return newData;
  }
  
  /**
   * Nettoyer les sessions expirées
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, session] of this.sessions) {
      if (now > session.expiresAt) {
        this.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug(`SessionManager "${this.name}": ${cleaned} session(s) nettoyée(s)`);
    }
  }
  
  /**
   * Obtenir le nombre de sessions actives
   * @returns {number}
   */
  get size() {
    return this.sessions.size;
  }
  
  /**
   * Vider toutes les sessions
   */
  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.sessions.clear();
    this.timers.clear();
    logger.debug(`SessionManager "${this.name}": toutes les sessions supprimées`);
  }
  
  /**
   * Arrêter le manager (pour cleanup propre)
   */
  destroy() {
    clearInterval(this.cleanupTimer);
    this.clear();
    logger.debug(`SessionManager "${this.name}" détruit`);
  }
  
  /**
   * Obtenir des statistiques
   * @returns {Object}
   */
  getStats() {
    const now = Date.now();
    let expiringSoon = 0;
    
    for (const session of this.sessions.values()) {
      if (session.expiresAt - now < 60000) { // < 1 minute
        expiringSoon++;
      }
    }
    
    return {
      name: this.name,
      activeSessions: this.sessions.size,
      expiringSoon,
      defaultTTL: this.defaultTTL,
    };
  }
}

// ============================================================
// INSTANCES GLOBALES
// ============================================================

// Sessions de création de personnage (15 min)
export const creationSessions = new SessionManager('creation', 15 * 60 * 1000);

// Sessions de combat (30 min)
export const combatSessions = new SessionManager('combat', 30 * 60 * 1000);

// Sessions de voyage (5 min)
export const travelSessions = new SessionManager('travel', 5 * 60 * 1000);

// Sessions d'inventaire (10 min)
export const inventorySessions = new SessionManager('inventory', 10 * 60 * 1000);

// Sessions de boutique (10 min)
export const shopSessions = new SessionManager('shop', 10 * 60 * 1000);

// Sessions de quêtes (15 min)
export const questSessions = new SessionManager('quest', 15 * 60 * 1000);

// Sessions de dialogue (10 min)
export const dialogueSessions = new SessionManager('dialogue', 10 * 60 * 1000);

// Sessions de party (30 min)
export const partySessions = new SessionManager('party', 30 * 60 * 1000);

// Sessions d'échange (10 min)
export const tradeSessions = new SessionManager('trade', 10 * 60 * 1000);

// Cooldowns d'exploration (cooldown de 30 secondes)
export const exploreCooldowns = new SessionManager('exploreCooldown', 30 * 1000);

// Cooldowns de repos
export const restCooldowns = new SessionManager('restCooldown', 5 * 60 * 1000);

// ============================================================
// UTILITAIRES
// ============================================================

/**
 * Vérifie si l'utilisateur qui interagit est le propriétaire de la session
 * @param {Interaction} interaction - L'interaction Discord
 * @param {SessionManager} sessionManager - Le gestionnaire de sessions
 * @param {string} sessionKey - La clé de session (souvent odUserId)
 * @returns {boolean} true si autorisé
 */
export function verifySessionOwner(interaction, sessionManager, sessionKey = null) {
  const key = sessionKey || interaction.user.id;
  const session = sessionManager.get(key);
  
  if (!session) return false;
  
  // Si la session a un userId, vérifier qu'il correspond
  if (session.userId && session.userId !== interaction.user.id) {
    return false;
  }
  
  return true;
}

/**
 * Middleware pour vérifier le propriétaire d'une session
 * Utilisé dans les handlers de boutons/menus
 */
export function requireSessionOwner(sessionManager, sessionKeyFn = (interaction) => interaction.user.id) {
  return async (interaction) => {
    const key = sessionKeyFn(interaction);
    const session = sessionManager.get(key);
    
    if (!session) {
      return { valid: false, error: 'Session expirée ou inexistante.' };
    }
    
    if (session.userId && session.userId !== interaction.user.id) {
      return { valid: false, error: 'Cette action ne vous appartient pas.' };
    }
    
    return { valid: true, session };
  };
}

export default {
  SessionManager,
  creationSessions,
  combatSessions,
  travelSessions,
  inventorySessions,
  shopSessions,
  questSessions,
  dialogueSessions,
  partySessions,
  tradeSessions,
  exploreCooldowns,
  restCooldowns,
  verifySessionOwner,
  requireSessionOwner,
};
