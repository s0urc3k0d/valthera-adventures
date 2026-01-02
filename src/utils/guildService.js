/**
 * Service de gestion des guildes
 * Gère la création, les invitations, les rangs et le coffre de guilde
 */

import Guild from '../models/Guild.js';
import Character from '../models/Character.js';

// Durée d'expiration des invitations (24 heures)
const INVITE_EXPIRY_MS = 24 * 60 * 60 * 1000;

// Taille max de guilde
const MAX_GUILD_SIZE = 50;

// Coût de création de guilde (en or)
const GUILD_CREATION_COST = 500;

// Ordre des rangs (du plus bas au plus haut)
const RANK_ORDER = ['recruit', 'member', 'veteran', 'officer', 'leader'];

// Labels des rangs
const RANK_LABELS = {
  recruit: '🌱 Recrue',
  member: '👤 Membre',
  veteran: '⭐ Vétéran',
  officer: '🎖️ Officier',
  leader: '👑 Chef',
};

/**
 * Crée une nouvelle guilde
 * @param {string} guildId - ID du serveur Discord
 * @param {Object} founder - Informations du fondateur
 * @param {string} name - Nom de la guilde
 * @param {string} tag - Tag de la guilde (2-5 caractères)
 * @returns {Object} - { success, guild, error }
 */
export async function createGuild(guildId, founder, name, tag) {
  try {
    // Vérifier que le joueur n'est pas déjà dans une guilde
    const existingGuild = await Guild.findByPlayer(guildId, founder.playerId);
    if (existingGuild) {
      return { success: false, error: 'Vous êtes déjà dans une guilde.' };
    }
    
    // Vérifier que le nom n'est pas déjà pris
    const nameExists = await Guild.findByName(guildId, name);
    if (nameExists) {
      return { success: false, error: 'Ce nom de guilde est déjà utilisé.' };
    }
    
    // Vérifier que le tag n'est pas déjà pris
    const tagExists = await Guild.findByTag(tag);
    if (tagExists) {
      return { success: false, error: 'Ce tag de guilde est déjà utilisé.' };
    }
    
    // Récupérer le personnage et vérifier l'or
    const character = await Character.findOne({ userId: founder.playerId, guildId });
    if (!character) {
      return { success: false, error: 'Vous n\'avez pas de personnage.' };
    }
    
    const totalGold = (character.currency.pp * 10) + character.currency.gp + 
                      (character.currency.sp / 10) + (character.currency.cp / 100);
    if (totalGold < GUILD_CREATION_COST) {
      return { success: false, error: `Vous avez besoin de ${GUILD_CREATION_COST} po pour créer une guilde.` };
    }
    
    // Déduire l'or
    character.currency.gp -= GUILD_CREATION_COST;
    if (character.currency.gp < 0) {
      // Convertir depuis platine si nécessaire
      const needed = Math.abs(character.currency.gp);
      const ppNeeded = Math.ceil(needed / 10);
      character.currency.pp -= ppNeeded;
      character.currency.gp += ppNeeded * 10;
    }
    await character.save();
    
    // Créer la guilde
    const guild = new Guild({
      guildId,
      name,
      tag: tag.toUpperCase(),
      founderId: founder.playerId,
      members: [{
        odisId: guildId,
        playerId: founder.playerId,
        playerName: founder.playerName,
        characterName: character.name,
        rank: 'leader',
      }],
    });
    
    await guild.save();
    
    return { success: true, guild };
  } catch (error) {
    console.error('Erreur createGuild:', error);
    if (error.code === 11000) {
      return { success: false, error: 'Ce nom ou tag est déjà utilisé.' };
    }
    return { success: false, error: 'Erreur lors de la création de la guilde.' };
  }
}

/**
 * Invite un joueur dans la guilde
 * @param {string} guildId - ID du serveur Discord
 * @param {string} inviterId - ID du joueur qui invite
 * @param {Object} targetPlayer - Informations du joueur cible
 * @returns {Object} - { success, guild, error }
 */
export async function inviteToGuild(guildId, inviterId, targetPlayer) {
  try {
    // Récupérer la guilde de l'inviteur
    const guild = await Guild.findByPlayer(guildId, inviterId);
    if (!guild) {
      return { success: false, error: 'Vous n\'êtes pas dans une guilde.' };
    }
    
    // Vérifier les permissions
    if (!guild.hasPermission(inviterId, guild.settings.inviteRank)) {
      return { success: false, error: 'Vous n\'avez pas la permission d\'inviter.' };
    }
    
    // Vérifier que la guilde n'est pas pleine
    if (guild.isFull()) {
      return { success: false, error: 'La guilde est pleine (max 50 membres).' };
    }
    
    // Vérifier que la cible n'est pas déjà membre
    if (guild.isMember(targetPlayer.playerId)) {
      return { success: false, error: 'Ce joueur est déjà dans votre guilde.' };
    }
    
    // Vérifier que la cible n'est pas déjà dans une autre guilde
    const targetGuild = await Guild.findByPlayer(guildId, targetPlayer.playerId);
    if (targetGuild) {
      return { success: false, error: 'Ce joueur est déjà dans une guilde.' };
    }
    
    // Vérifier qu'une invitation n'est pas déjà en attente
    if (guild.hasPendingInvite(targetPlayer.playerId)) {
      return { success: false, error: 'Une invitation est déjà en attente pour ce joueur.' };
    }
    
    // Ajouter l'invitation
    guild.pendingInvites.push({
      playerId: targetPlayer.playerId,
      playerName: targetPlayer.playerName,
      invitedBy: inviterId,
      invitedAt: new Date(),
      expiresAt: new Date(Date.now() + INVITE_EXPIRY_MS),
    });
    
    await guild.save();
    
    return { success: true, guild };
  } catch (error) {
    console.error('Erreur inviteToGuild:', error);
    return { success: false, error: 'Erreur lors de l\'invitation.' };
  }
}

/**
 * Accepte une invitation de guilde
 * @param {string} guildId - ID du serveur Discord
 * @param {string} playerId - ID du joueur qui accepte
 * @param {string} guildName - Nom de la guilde (optionnel si une seule invitation)
 * @returns {Object} - { success, guild, error }
 */
export async function acceptGuildInvite(guildId, playerId, guildName = null) {
  try {
    // Trouver une guilde avec une invitation en attente pour ce joueur
    let query = {
      guildId,
      'pendingInvites.playerId': playerId,
      disbandedAt: null,
    };
    
    if (guildName) {
      query.name = { $regex: new RegExp(`^${guildName}$`, 'i') };
    }
    
    const guild = await Guild.findOne(query);
    
    if (!guild) {
      return { success: false, error: 'Aucune invitation en attente.' };
    }
    
    // Vérifier que l'invitation n'a pas expiré
    const invite = guild.pendingInvites.find(i => i.playerId === playerId);
    if (!invite || invite.expiresAt < new Date()) {
      guild.pendingInvites = guild.pendingInvites.filter(i => i.playerId !== playerId);
      await guild.save();
      return { success: false, error: 'L\'invitation a expiré.' };
    }
    
    // Vérifier que la guilde n'est pas pleine
    if (guild.isFull()) {
      return { success: false, error: 'La guilde est maintenant pleine.' };
    }
    
    // Récupérer le personnage
    const character = await Character.findOne({ userId: playerId, guildId });
    if (!character) {
      return { success: false, error: 'Vous n\'avez pas de personnage.' };
    }
    
    // Vérifier le niveau minimum
    if (character.level < guild.settings.minLevelToJoin) {
      return { success: false, error: `Niveau ${guild.settings.minLevelToJoin} minimum requis.` };
    }
    
    // Ajouter le membre
    guild.members.push({
      odisId: guildId,
      playerId: playerId,
      playerName: invite.playerName,
      characterName: character.name,
      rank: 'recruit',
    });
    
    // Supprimer l'invitation
    guild.pendingInvites = guild.pendingInvites.filter(i => i.playerId !== playerId);
    guild.stats.totalMembersJoined += 1;
    
    await guild.save();
    
    return { success: true, guild };
  } catch (error) {
    console.error('Erreur acceptGuildInvite:', error);
    return { success: false, error: 'Erreur lors de l\'acceptation.' };
  }
}

/**
 * Refuse une invitation de guilde
 * @param {string} guildId - ID du serveur Discord
 * @param {string} playerId - ID du joueur qui refuse
 * @param {string} guildName - Nom de la guilde
 * @returns {Object} - { success, error }
 */
export async function declineGuildInvite(guildId, playerId, guildName = null) {
  try {
    let query = {
      guildId,
      'pendingInvites.playerId': playerId,
      disbandedAt: null,
    };
    
    if (guildName) {
      query.name = { $regex: new RegExp(`^${guildName}$`, 'i') };
    }
    
    const guild = await Guild.findOne(query);
    
    if (!guild) {
      return { success: false, error: 'Aucune invitation en attente.' };
    }
    
    guild.pendingInvites = guild.pendingInvites.filter(i => i.playerId !== playerId);
    await guild.save();
    
    return { success: true };
  } catch (error) {
    console.error('Erreur declineGuildInvite:', error);
    return { success: false, error: 'Erreur lors du refus.' };
  }
}

/**
 * Kick un membre de la guilde
 * @param {string} guildId - ID du serveur Discord
 * @param {string} kickerId - ID du joueur qui kick
 * @param {string} targetId - ID du joueur à kick
 * @returns {Object} - { success, guild, error }
 */
export async function kickFromGuild(guildId, kickerId, targetId) {
  try {
    const guild = await Guild.findByPlayer(guildId, kickerId);
    if (!guild) {
      return { success: false, error: 'Vous n\'êtes pas dans une guilde.' };
    }
    
    if (targetId === kickerId) {
      return { success: false, error: 'Utilisez /guild leave pour quitter.' };
    }
    
    if (!guild.isMember(targetId)) {
      return { success: false, error: 'Ce joueur n\'est pas dans votre guilde.' };
    }
    
    const kicker = guild.getMember(kickerId);
    const target = guild.getMember(targetId);
    
    // Vérifier que le kicker a un rang supérieur
    const kickerRank = RANK_ORDER.indexOf(kicker.rank);
    const targetRank = RANK_ORDER.indexOf(target.rank);
    
    if (kickerRank <= targetRank) {
      return { success: false, error: 'Vous ne pouvez pas kick un membre de rang égal ou supérieur.' };
    }
    
    guild.members = guild.members.filter(m => m.playerId !== targetId);
    await guild.save();
    
    return { success: true, guild, kickedMember: target };
  } catch (error) {
    console.error('Erreur kickFromGuild:', error);
    return { success: false, error: 'Erreur lors de l\'exclusion.' };
  }
}

/**
 * Quitte la guilde
 * @param {string} guildId - ID du serveur Discord
 * @param {string} playerId - ID du joueur qui quitte
 * @returns {Object} - { success, disbanded, newLeader, error }
 */
export async function leaveGuild(guildId, playerId) {
  try {
    const guild = await Guild.findByPlayer(guildId, playerId);
    if (!guild) {
      return { success: false, error: 'Vous n\'êtes pas dans une guilde.' };
    }
    
    const isLeader = guild.isLeader(playerId);
    
    // Si c'est le leader, il doit d'abord transférer le leadership
    if (isLeader && guild.members.length > 1) {
      return { success: false, error: 'Transférez le leadership avant de quitter (/guild promote).' };
    }
    
    // Retirer le membre
    guild.members = guild.members.filter(m => m.playerId !== playerId);
    
    // Si la guilde est vide, la dissoudre
    if (guild.members.length === 0) {
      guild.disbandedAt = new Date();
      await guild.save();
      return { success: true, disbanded: true };
    }
    
    await guild.save();
    
    return { success: true, disbanded: false };
  } catch (error) {
    console.error('Erreur leaveGuild:', error);
    return { success: false, error: 'Erreur lors du départ.' };
  }
}

/**
 * Promeut un membre
 * @param {string} guildId - ID du serveur Discord
 * @param {string} promoterId - ID du joueur qui promeut
 * @param {string} targetId - ID du joueur à promouvoir
 * @returns {Object} - { success, guild, newRank, error }
 */
export async function promoteMember(guildId, promoterId, targetId) {
  try {
    const guild = await Guild.findByPlayer(guildId, promoterId);
    if (!guild) {
      return { success: false, error: 'Vous n\'êtes pas dans une guilde.' };
    }
    
    if (!guild.isMember(targetId)) {
      return { success: false, error: 'Ce joueur n\'est pas dans votre guilde.' };
    }
    
    const promoter = guild.getMember(promoterId);
    const target = guild.getMember(targetId);
    
    const promoterRank = RANK_ORDER.indexOf(promoter.rank);
    const targetRank = RANK_ORDER.indexOf(target.rank);
    
    // Vérifier les permissions
    if (promoterRank <= targetRank) {
      return { success: false, error: 'Vous ne pouvez pas promouvoir ce membre.' };
    }
    
    // Ne peut pas promouvoir au-dessus de son propre rang - 1
    if (targetRank >= promoterRank - 1) {
      return { success: false, error: 'Vous ne pouvez pas promouvoir ce membre plus haut.' };
    }
    
    // Cas spécial: transfert de leadership
    if (target.rank === 'officer' && promoter.rank === 'leader') {
      promoter.rank = 'officer';
      target.rank = 'leader';
      guild.founderId = targetId;
    } else {
      // Promotion normale
      const newRankIndex = Math.min(targetRank + 1, RANK_ORDER.length - 2); // Max officer
      target.rank = RANK_ORDER[newRankIndex];
    }
    
    await guild.save();
    
    return { success: true, guild, newRank: target.rank };
  } catch (error) {
    console.error('Erreur promoteMember:', error);
    return { success: false, error: 'Erreur lors de la promotion.' };
  }
}

/**
 * Rétrograde un membre
 * @param {string} guildId - ID du serveur Discord
 * @param {string} demoterId - ID du joueur qui rétrograde
 * @param {string} targetId - ID du joueur à rétrograder
 * @returns {Object} - { success, guild, newRank, error }
 */
export async function demoteMember(guildId, demoterId, targetId) {
  try {
    const guild = await Guild.findByPlayer(guildId, demoterId);
    if (!guild) {
      return { success: false, error: 'Vous n\'êtes pas dans une guilde.' };
    }
    
    if (!guild.isMember(targetId)) {
      return { success: false, error: 'Ce joueur n\'est pas dans votre guilde.' };
    }
    
    const demoter = guild.getMember(demoterId);
    const target = guild.getMember(targetId);
    
    const demoterRank = RANK_ORDER.indexOf(demoter.rank);
    const targetRank = RANK_ORDER.indexOf(target.rank);
    
    // Vérifier les permissions
    if (demoterRank <= targetRank) {
      return { success: false, error: 'Vous ne pouvez pas rétrograder ce membre.' };
    }
    
    if (target.rank === 'recruit') {
      return { success: false, error: 'Ce membre a déjà le rang le plus bas.' };
    }
    
    // Rétrogradation
    const newRankIndex = Math.max(targetRank - 1, 0);
    target.rank = RANK_ORDER[newRankIndex];
    
    await guild.save();
    
    return { success: true, guild, newRank: target.rank };
  } catch (error) {
    console.error('Erreur demoteMember:', error);
    return { success: false, error: 'Erreur lors de la rétrogradation.' };
  }
}

/**
 * Récupère la guilde d'un joueur
 * @param {string} guildId - ID du serveur Discord
 * @param {string} playerId - ID du joueur
 * @returns {Guild|null}
 */
export async function getGuild(guildId, playerId) {
  return Guild.findByPlayer(guildId, playerId);
}

/**
 * Récupère les invitations en attente pour un joueur
 * @param {string} guildId - ID du serveur Discord
 * @param {string} playerId - ID du joueur
 * @returns {Array} - Liste des guildes avec invitations en attente
 */
export async function getPendingGuildInvites(guildId, playerId) {
  const guilds = await Guild.find({
    guildId,
    'pendingInvites.playerId': playerId,
    disbandedAt: null,
  });
  
  // Filtrer les invitations expirées
  return guilds.filter(guild => {
    const invite = guild.pendingInvites.find(i => i.playerId === playerId);
    return invite && invite.expiresAt > new Date();
  });
}

/**
 * Met à jour le message du jour
 * @param {string} guildId - ID du serveur Discord
 * @param {string} playerId - ID du joueur
 * @param {string} motd - Nouveau message
 * @returns {Object} - { success, guild, error }
 */
export async function setMotd(guildId, playerId, motd) {
  try {
    const guild = await Guild.findByPlayer(guildId, playerId);
    if (!guild) {
      return { success: false, error: 'Vous n\'êtes pas dans une guilde.' };
    }
    
    if (!guild.hasPermission(playerId, 'officer')) {
      return { success: false, error: 'Seuls les officiers peuvent changer le MOTD.' };
    }
    
    guild.motd = motd;
    await guild.save();
    
    return { success: true, guild };
  } catch (error) {
    console.error('Erreur setMotd:', error);
    return { success: false, error: 'Erreur lors de la modification.' };
  }
}

/**
 * Dépose de l'or dans le coffre de guilde
 * @param {string} guildId - ID du serveur Discord
 * @param {string} playerId - ID du joueur
 * @param {number} amount - Montant en or
 * @returns {Object} - { success, guild, error }
 */
export async function depositGold(guildId, playerId, amount) {
  try {
    const guild = await Guild.findByPlayer(guildId, playerId);
    if (!guild) {
      return { success: false, error: 'Vous n\'êtes pas dans une guilde.' };
    }
    
    const character = await Character.findOne({ userId: playerId, guildId });
    if (!character) {
      return { success: false, error: 'Vous n\'avez pas de personnage.' };
    }
    
    if (character.currency.gp < amount) {
      return { success: false, error: 'Vous n\'avez pas assez d\'or.' };
    }
    
    character.currency.gp -= amount;
    guild.bank.gold += amount;
    
    // Mettre à jour la contribution
    const member = guild.getMember(playerId);
    member.contribution.gold += amount;
    
    await character.save();
    await guild.save();
    
    return { success: true, guild };
  } catch (error) {
    console.error('Erreur depositGold:', error);
    return { success: false, error: 'Erreur lors du dépôt.' };
  }
}

/**
 * Retire de l'or du coffre de guilde
 * @param {string} guildId - ID du serveur Discord
 * @param {string} playerId - ID du joueur
 * @param {number} amount - Montant en or
 * @returns {Object} - { success, guild, error }
 */
export async function withdrawGold(guildId, playerId, amount) {
  try {
    const guild = await Guild.findByPlayer(guildId, playerId);
    if (!guild) {
      return { success: false, error: 'Vous n\'êtes pas dans une guilde.' };
    }
    
    if (!guild.hasPermission(playerId, guild.settings.bankAccessRank)) {
      return { success: false, error: 'Vous n\'avez pas accès au coffre.' };
    }
    
    if (guild.bank.gold < amount) {
      return { success: false, error: 'Le coffre ne contient pas assez d\'or.' };
    }
    
    const character = await Character.findOne({ userId: playerId, guildId });
    if (!character) {
      return { success: false, error: 'Vous n\'avez pas de personnage.' };
    }
    
    guild.bank.gold -= amount;
    character.currency.gp += amount;
    
    await guild.save();
    await character.save();
    
    return { success: true, guild };
  } catch (error) {
    console.error('Erreur withdrawGold:', error);
    return { success: false, error: 'Erreur lors du retrait.' };
  }
}

// Constantes exportées
export {
  GUILD_CREATION_COST,
  MAX_GUILD_SIZE,
  RANK_ORDER,
  RANK_LABELS,
};
