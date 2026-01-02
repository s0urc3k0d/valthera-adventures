/**
 * Service de gestion des groupes (Party)
 * Gère la création, les invitations, les kicks et le partage de récompenses
 */

import Party from '../models/Party.js';
import Character from '../models/Character.js';

// Durée d'expiration des invitations (5 minutes)
const INVITE_EXPIRY_MS = 5 * 60 * 1000;

// Taille max du groupe
const MAX_PARTY_SIZE = 6;

/**
 * Crée un nouveau groupe
 * @param {string} guildId - ID du serveur Discord
 * @param {Object} leader - Informations du leader
 * @returns {Object} - { success, party, error }
 */
export async function createParty(guildId, leader) {
  try {
    // Vérifier que le joueur n'est pas déjà dans un groupe
    const existingParty = await Party.findByPlayer(guildId, leader.playerId);
    if (existingParty) {
      return { success: false, error: 'Vous êtes déjà dans un groupe.' };
    }
    
    // Récupérer le personnage
    const character = await Character.findOne({ userId: leader.playerId, guildId });
    if (!character) {
      return { success: false, error: 'Vous n\'avez pas de personnage.' };
    }
    
    // Créer le groupe
    const party = new Party({
      guildId,
      leaderId: leader.playerId,
      members: [{
        odisId: guildId,
        playerId: leader.playerId,
        playerName: leader.playerName,
        characterName: character.name,
        role: 'leader',
      }],
      currentZone: character.location,
    });
    
    await party.save();
    
    return { success: true, party };
  } catch (error) {
    console.error('Erreur createParty:', error);
    return { success: false, error: 'Erreur lors de la création du groupe.' };
  }
}

/**
 * Invite un joueur dans le groupe
 * @param {string} guildId - ID du serveur Discord
 * @param {string} leaderId - ID du leader
 * @param {Object} targetPlayer - Informations du joueur cible
 * @returns {Object} - { success, party, error }
 */
export async function inviteToParty(guildId, leaderId, targetPlayer) {
  try {
    // Récupérer le groupe du leader
    const party = await Party.findByLeader(guildId, leaderId);
    if (!party) {
      return { success: false, error: 'Vous n\'êtes pas chef d\'un groupe.' };
    }
    
    // Vérifier que le groupe n'est pas plein
    if (party.isFull()) {
      return { success: false, error: 'Le groupe est plein (max 6 joueurs).' };
    }
    
    // Vérifier que la cible n'est pas déjà membre
    if (party.isMember(targetPlayer.playerId)) {
      return { success: false, error: 'Ce joueur est déjà dans votre groupe.' };
    }
    
    // Vérifier que la cible n'est pas déjà dans un autre groupe
    const targetParty = await Party.findByPlayer(guildId, targetPlayer.playerId);
    if (targetParty) {
      return { success: false, error: 'Ce joueur est déjà dans un groupe.' };
    }
    
    // Vérifier qu'une invitation n'est pas déjà en attente
    if (party.hasPendingInvite(targetPlayer.playerId)) {
      return { success: false, error: 'Une invitation est déjà en attente pour ce joueur.' };
    }
    
    // Ajouter l'invitation
    party.pendingInvites.push({
      odisId: guildId,
      playerId: targetPlayer.playerId,
      playerName: targetPlayer.playerName,
      invitedAt: new Date(),
      expiresAt: new Date(Date.now() + INVITE_EXPIRY_MS),
    });
    
    await party.save();
    
    return { success: true, party };
  } catch (error) {
    console.error('Erreur inviteToParty:', error);
    return { success: false, error: 'Erreur lors de l\'invitation.' };
  }
}

/**
 * Accepte une invitation de groupe
 * @param {string} guildId - ID du serveur Discord
 * @param {string} playerId - ID du joueur qui accepte
 * @returns {Object} - { success, party, error }
 */
export async function acceptInvite(guildId, playerId) {
  try {
    // Trouver un groupe avec une invitation en attente pour ce joueur
    const party = await Party.findOne({
      guildId,
      'pendingInvites.playerId': playerId,
      disbandedAt: null,
    });
    
    if (!party) {
      return { success: false, error: 'Aucune invitation en attente.' };
    }
    
    // Vérifier que l'invitation n'a pas expiré
    const invite = party.pendingInvites.find(i => i.playerId === playerId);
    if (!invite || invite.expiresAt < new Date()) {
      // Supprimer l'invitation expirée
      party.pendingInvites = party.pendingInvites.filter(i => i.playerId !== playerId);
      await party.save();
      return { success: false, error: 'L\'invitation a expiré.' };
    }
    
    // Vérifier que le groupe n'est pas plein
    if (party.isFull()) {
      return { success: false, error: 'Le groupe est maintenant plein.' };
    }
    
    // Récupérer le personnage
    const character = await Character.findOne({ userId: playerId, guildId });
    if (!character) {
      return { success: false, error: 'Vous n\'avez pas de personnage.' };
    }
    
    // Ajouter le membre
    party.members.push({
      odisId: guildId,
      playerId: playerId,
      playerName: invite.playerName,
      characterName: character.name,
      role: 'member',
    });
    
    // Supprimer l'invitation
    party.pendingInvites = party.pendingInvites.filter(i => i.playerId !== playerId);
    
    await party.save();
    
    return { success: true, party };
  } catch (error) {
    console.error('Erreur acceptInvite:', error);
    return { success: false, error: 'Erreur lors de l\'acceptation.' };
  }
}

/**
 * Refuse une invitation de groupe
 * @param {string} guildId - ID du serveur Discord
 * @param {string} playerId - ID du joueur qui refuse
 * @returns {Object} - { success, error }
 */
export async function declineInvite(guildId, playerId) {
  try {
    const party = await Party.findOne({
      guildId,
      'pendingInvites.playerId': playerId,
      disbandedAt: null,
    });
    
    if (!party) {
      return { success: false, error: 'Aucune invitation en attente.' };
    }
    
    party.pendingInvites = party.pendingInvites.filter(i => i.playerId !== playerId);
    await party.save();
    
    return { success: true };
  } catch (error) {
    console.error('Erreur declineInvite:', error);
    return { success: false, error: 'Erreur lors du refus.' };
  }
}

/**
 * Kick un membre du groupe
 * @param {string} guildId - ID du serveur Discord
 * @param {string} leaderId - ID du leader
 * @param {string} targetId - ID du joueur à kick
 * @returns {Object} - { success, party, error }
 */
export async function kickFromParty(guildId, leaderId, targetId) {
  try {
    const party = await Party.findByLeader(guildId, leaderId);
    if (!party) {
      return { success: false, error: 'Vous n\'êtes pas chef d\'un groupe.' };
    }
    
    if (targetId === leaderId) {
      return { success: false, error: 'Vous ne pouvez pas vous kick vous-même.' };
    }
    
    if (!party.isMember(targetId)) {
      return { success: false, error: 'Ce joueur n\'est pas dans votre groupe.' };
    }
    
    party.members = party.members.filter(m => m.playerId !== targetId);
    await party.save();
    
    return { success: true, party };
  } catch (error) {
    console.error('Erreur kickFromParty:', error);
    return { success: false, error: 'Erreur lors de l\'exclusion.' };
  }
}

/**
 * Quitte le groupe
 * @param {string} guildId - ID du serveur Discord
 * @param {string} playerId - ID du joueur qui quitte
 * @returns {Object} - { success, disbanded, newLeader, error }
 */
export async function leaveParty(guildId, playerId) {
  try {
    const party = await Party.findByPlayer(guildId, playerId);
    if (!party) {
      return { success: false, error: 'Vous n\'êtes pas dans un groupe.' };
    }
    
    const isLeader = party.isLeader(playerId);
    
    // Retirer le membre
    party.members = party.members.filter(m => m.playerId !== playerId);
    
    // Si le groupe est vide ou si c'était le leader et qu'il reste des membres
    if (party.members.length === 0) {
      party.disbandedAt = new Date();
      await party.save();
      return { success: true, disbanded: true };
    }
    
    // Si c'était le leader, promouvoir le premier membre
    let newLeader = null;
    if (isLeader) {
      const firstMember = party.members[0];
      firstMember.role = 'leader';
      party.leaderId = firstMember.playerId;
      newLeader = firstMember;
    }
    
    await party.save();
    
    return { success: true, disbanded: false, newLeader };
  } catch (error) {
    console.error('Erreur leaveParty:', error);
    return { success: false, error: 'Erreur lors du départ.' };
  }
}

/**
 * Dissout le groupe
 * @param {string} guildId - ID du serveur Discord
 * @param {string} leaderId - ID du leader
 * @returns {Object} - { success, error }
 */
export async function disbandParty(guildId, leaderId) {
  try {
    const party = await Party.findByLeader(guildId, leaderId);
    if (!party) {
      return { success: false, error: 'Vous n\'êtes pas chef d\'un groupe.' };
    }
    
    party.disbandedAt = new Date();
    await party.save();
    
    return { success: true };
  } catch (error) {
    console.error('Erreur disbandParty:', error);
    return { success: false, error: 'Erreur lors de la dissolution.' };
  }
}

/**
 * Récupère le groupe d'un joueur
 * @param {string} guildId - ID du serveur Discord
 * @param {string} playerId - ID du joueur
 * @returns {Party|null}
 */
export async function getParty(guildId, playerId) {
  return Party.findByPlayer(guildId, playerId);
}

/**
 * Récupère les invitations en attente pour un joueur
 * @param {string} guildId - ID du serveur Discord
 * @param {string} playerId - ID du joueur
 * @returns {Array} - Liste des parties avec invitations en attente
 */
export async function getPendingInvites(guildId, playerId) {
  const parties = await Party.find({
    guildId,
    'pendingInvites.playerId': playerId,
    disbandedAt: null,
  });
  
  // Filtrer les invitations expirées
  return parties.filter(party => {
    const invite = party.pendingInvites.find(i => i.playerId === playerId);
    return invite && invite.expiresAt > new Date();
  });
}

/**
 * Transfère le leadership
 * @param {string} guildId - ID du serveur Discord
 * @param {string} leaderId - ID du leader actuel
 * @param {string} newLeaderId - ID du nouveau leader
 * @returns {Object} - { success, party, error }
 */
export async function transferLeadership(guildId, leaderId, newLeaderId) {
  try {
    const party = await Party.findByLeader(guildId, leaderId);
    if (!party) {
      return { success: false, error: 'Vous n\'êtes pas chef d\'un groupe.' };
    }
    
    if (!party.isMember(newLeaderId)) {
      return { success: false, error: 'Ce joueur n\'est pas dans votre groupe.' };
    }
    
    // Mettre à jour les rôles
    const oldLeader = party.members.find(m => m.playerId === leaderId);
    const newLeader = party.members.find(m => m.playerId === newLeaderId);
    
    oldLeader.role = 'member';
    newLeader.role = 'leader';
    party.leaderId = newLeaderId;
    
    await party.save();
    
    return { success: true, party };
  } catch (error) {
    console.error('Erreur transferLeadership:', error);
    return { success: false, error: 'Erreur lors du transfert.' };
  }
}

/**
 * Distribue les récompenses au groupe
 * @param {Party} party - Le groupe
 * @param {Object} rewards - { xp, gold, items }
 * @param {string} killerId - ID du joueur qui a tué (pour roundrobin)
 * @returns {Object} - Distribution des récompenses par joueur
 */
export async function distributeRewards(party, rewards, killerId = null) {
  const { xp = 0, gold = 0, items = [] } = rewards;
  const distribution = {};
  const memberCount = party.members.length;
  
  // Initialiser la distribution
  for (const member of party.members) {
    distribution[member.playerId] = { xp: 0, gold: 0, items: [] };
  }
  
  // XP partagé équitablement
  if (party.settings.xpShare) {
    const xpPerMember = Math.floor(xp / memberCount);
    for (const member of party.members) {
      distribution[member.playerId].xp = xpPerMember;
    }
  } else {
    // XP seulement au killer
    if (killerId && distribution[killerId]) {
      distribution[killerId].xp = xp;
    }
  }
  
  // Or partagé équitablement
  const goldPerMember = Math.floor(gold / memberCount);
  for (const member of party.members) {
    distribution[member.playerId].gold = goldPerMember;
  }
  
  // Distribution des items selon le mode
  if (items.length > 0) {
    switch (party.settings.lootDistribution) {
      case 'roundrobin': {
        // Tour par tour - le killer a priorité
        const orderedMembers = [...party.members];
        if (killerId) {
          const killerIndex = orderedMembers.findIndex(m => m.playerId === killerId);
          if (killerIndex > 0) {
            const [killer] = orderedMembers.splice(killerIndex, 1);
            orderedMembers.unshift(killer);
          }
        }
        items.forEach((item, index) => {
          const member = orderedMembers[index % orderedMembers.length];
          distribution[member.playerId].items.push(item);
        });
        break;
      }
      case 'random': {
        // Distribution aléatoire
        for (const item of items) {
          const randomMember = party.members[Math.floor(Math.random() * memberCount)];
          distribution[randomMember.playerId].items.push(item);
        }
        break;
      }
      case 'leader': {
        // Tout au leader
        distribution[party.leaderId].items.push(...items);
        break;
      }
      case 'freeforall':
      default: {
        // Tout au premier (killer si défini)
        const recipientId = killerId || party.leaderId;
        distribution[recipientId].items.push(...items);
        break;
      }
    }
  }
  
  // Mettre à jour les stats du groupe
  party.stats.totalXpEarned += xp;
  party.stats.totalGoldEarned += gold;
  await party.save();
  
  return distribution;
}

/**
 * Met à jour le paramètre de distribution du loot
 * @param {string} guildId - ID du serveur Discord
 * @param {string} leaderId - ID du leader
 * @param {string} mode - Mode de distribution
 * @returns {Object} - { success, party, error }
 */
export async function setLootDistribution(guildId, leaderId, mode) {
  try {
    const party = await Party.findByLeader(guildId, leaderId);
    if (!party) {
      return { success: false, error: 'Vous n\'êtes pas chef d\'un groupe.' };
    }
    
    const validModes = ['roundrobin', 'random', 'leader', 'freeforall'];
    if (!validModes.includes(mode)) {
      return { success: false, error: 'Mode de distribution invalide.' };
    }
    
    party.settings.lootDistribution = mode;
    await party.save();
    
    return { success: true, party };
  } catch (error) {
    console.error('Erreur setLootDistribution:', error);
    return { success: false, error: 'Erreur lors de la modification.' };
  }
}

export default {
  createParty,
  inviteToParty,
  acceptInvite,
  declineInvite,
  kickFromParty,
  leaveParty,
  disbandParty,
  getParty,
  getPendingInvites,
  transferLeadership,
  distributeRewards,
  setLootDistribution,
  MAX_PARTY_SIZE,
};
