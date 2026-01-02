import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { createEmbed, errorEmbed, successEmbed, warningEmbed } from '../../utils/embedBuilder.js';
import { progressBar } from '../../utils/ui.js';
import Character from '../../models/Character.js';
import {
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
  setLootDistribution,
  MAX_PARTY_SIZE,
} from '../../utils/partyService.js';
import { partySessions } from '../../utils/sessionManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('party')
    .setDescription('Gérer votre groupe d\'aventuriers')
    .addSubcommand(sub =>
      sub
        .setName('create')
        .setDescription('Créer un nouveau groupe')
        .addStringOption(opt =>
          opt
            .setName('nom')
            .setDescription('Nom du groupe (optionnel)')
            .setRequired(false)
            .setMaxLength(32)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('invite')
        .setDescription('Inviter un joueur dans votre groupe')
        .addUserOption(opt =>
          opt
            .setName('joueur')
            .setDescription('Le joueur à inviter')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('kick')
        .setDescription('Exclure un membre du groupe')
        .addUserOption(opt =>
          opt
            .setName('joueur')
            .setDescription('Le joueur à exclure')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('leave')
        .setDescription('Quitter votre groupe actuel')
    )
    .addSubcommand(sub =>
      sub
        .setName('disband')
        .setDescription('Dissoudre le groupe (chef uniquement)')
    )
    .addSubcommand(sub =>
      sub
        .setName('info')
        .setDescription('Voir les informations de votre groupe')
    )
    .addSubcommand(sub =>
      sub
        .setName('invites')
        .setDescription('Voir vos invitations en attente')
    )
    .addSubcommand(sub =>
      sub
        .setName('settings')
        .setDescription('Modifier les paramètres du groupe (chef uniquement)')
    )
    .addSubcommand(sub =>
      sub
        .setName('promote')
        .setDescription('Transférer le leadership à un autre membre')
        .addUserOption(opt =>
          opt
            .setName('joueur')
            .setDescription('Le nouveau chef')
            .setRequired(true)
        )
    ),
  
  cooldown: 3,
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;
    const userId = interaction.user.id;
    
    // Vérifier que l'utilisateur a un personnage
    const character = await Character.findOne({ userId, guildId });
    if (!character) {
      return interaction.reply({
        embeds: [errorEmbed('Erreur', 'Vous n\'avez pas de personnage. Utilisez `/create` pour en créer un.')],
        ephemeral: true,
      });
    }
    
    switch (subcommand) {
      case 'create':
        return handleCreate(interaction, guildId, userId, character);
      case 'invite':
        return handleInvite(interaction, guildId, userId);
      case 'kick':
        return handleKick(interaction, guildId, userId);
      case 'leave':
        return handleLeave(interaction, guildId, userId);
      case 'disband':
        return handleDisband(interaction, guildId, userId);
      case 'info':
        return handleInfo(interaction, guildId, userId);
      case 'invites':
        return handleInvites(interaction, guildId, userId);
      case 'settings':
        return handleSettings(interaction, guildId, userId);
      case 'promote':
        return handlePromote(interaction, guildId, userId);
      default:
        return interaction.reply({
          embeds: [errorEmbed('Erreur', 'Sous-commande inconnue.')],
          ephemeral: true,
        });
    }
  },
  
  // Gestion des boutons
  async handleButton(interaction) {
    const [, action, ...args] = interaction.customId.split('_');
    const guildId = interaction.guildId;
    const userId = interaction.user.id;
    
    switch (action) {
      case 'accept':
        return handleAcceptInvite(interaction, guildId, userId, args[0]);
      case 'decline':
        return handleDeclineInvite(interaction, guildId, userId, args[0]);
      case 'confirmDisband':
        return handleConfirmDisband(interaction, guildId, userId);
      case 'cancelDisband':
        return interaction.update({
          embeds: [successEmbed('Annulé', 'La dissolution du groupe a été annulée.')],
          components: [],
        });
      default:
        return interaction.reply({ content: 'Action inconnue.', ephemeral: true });
    }
  },
  
  // Gestion des menus
  async handleSelectMenu(interaction) {
    const [, action] = interaction.customId.split('_');
    const guildId = interaction.guildId;
    const userId = interaction.user.id;
    const value = interaction.values[0];
    
    if (action === 'loot') {
      const result = await setLootDistribution(guildId, userId, value);
      if (!result.success) {
        return interaction.reply({
          embeds: [errorEmbed('Erreur', result.error)],
          ephemeral: true,
        });
      }
      
      const modeLabels = {
        roundrobin: '🔄 Tour par tour',
        random: '🎲 Aléatoire',
        leader: '👑 Chef uniquement',
        freeforall: '🏃 Premier arrivé',
      };
      
      return interaction.update({
        embeds: [successEmbed('Paramètres mis à jour', `Mode de distribution: ${modeLabels[value]}`)],
        components: [],
      });
    }
  },
};

// ============================================================
// HANDLERS DE SOUS-COMMANDES
// ============================================================

async function handleCreate(interaction, guildId, userId, character) {
  const partyName = interaction.options.getString('nom');
  
  const result = await createParty(guildId, {
    playerId: userId,
    playerName: interaction.user.displayName,
  });
  
  if (!result.success) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', result.error)],
      ephemeral: true,
    });
  }
  
  // Mettre à jour le nom si fourni
  if (partyName) {
    result.party.name = partyName;
    await result.party.save();
  }
  
  const embed = createEmbed({
    title: '👥 Groupe créé !',
    description: partyName 
      ? `Le groupe **${partyName}** a été créé.`
      : 'Votre groupe a été créé.',
    color: 0x22C55E,
    fields: [
      {
        name: '👑 Chef',
        value: `${character.name} (${interaction.user})`,
        inline: true,
      },
      {
        name: '👥 Membres',
        value: `1/${MAX_PARTY_SIZE}`,
        inline: true,
      },
      {
        name: '📍 Zone',
        value: character.location || 'Inconnue',
        inline: true,
      },
    ],
    footer: { text: 'Utilisez /party invite pour inviter des joueurs' },
  });
  
  return interaction.reply({ embeds: [embed] });
}

async function handleInvite(interaction, guildId, userId) {
  const targetUser = interaction.options.getUser('joueur');
  
  if (targetUser.id === userId) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Vous ne pouvez pas vous inviter vous-même.')],
      ephemeral: true,
    });
  }
  
  if (targetUser.bot) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Vous ne pouvez pas inviter un bot.')],
      ephemeral: true,
    });
  }
  
  // Vérifier que la cible a un personnage
  const targetCharacter = await Character.findOne({ userId: targetUser.id, guildId });
  if (!targetCharacter) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Ce joueur n\'a pas de personnage.')],
      ephemeral: true,
    });
  }
  
  const result = await inviteToParty(guildId, userId, {
    playerId: targetUser.id,
    playerName: targetUser.displayName,
  });
  
  if (!result.success) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', result.error)],
      ephemeral: true,
    });
  }
  
  // Envoyer une notification au joueur invité
  const inviteEmbed = createEmbed({
    title: '📨 Invitation de groupe',
    description: `**${interaction.user.displayName}** vous invite à rejoindre son groupe !`,
    color: 0x3B82F6,
    fields: [
      {
        name: '👥 Groupe',
        value: result.party.name || 'Groupe sans nom',
        inline: true,
      },
      {
        name: '👥 Membres',
        value: `${result.party.members.length}/${MAX_PARTY_SIZE}`,
        inline: true,
      },
    ],
    footer: { text: 'L\'invitation expire dans 5 minutes' },
  });
  
  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`party_accept_${result.party._id}`)
      .setLabel('Accepter')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅'),
    new ButtonBuilder()
      .setCustomId(`party_decline_${result.party._id}`)
      .setLabel('Refuser')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('❌')
  );
  
  // Répondre à l'inviteur
  await interaction.reply({
    embeds: [successEmbed('Invitation envoyée', `${targetUser} a été invité dans votre groupe.`)],
  });
  
  // Mentionner le joueur invité
  await interaction.channel.send({
    content: `${targetUser}`,
    embeds: [inviteEmbed],
    components: [buttons],
  });
}

async function handleKick(interaction, guildId, userId) {
  const targetUser = interaction.options.getUser('joueur');
  
  const result = await kickFromParty(guildId, userId, targetUser.id);
  
  if (!result.success) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', result.error)],
      ephemeral: true,
    });
  }
  
  return interaction.reply({
    embeds: [successEmbed('Membre exclu', `${targetUser} a été exclu du groupe.`)],
  });
}

async function handleLeave(interaction, guildId, userId) {
  const result = await leaveParty(guildId, userId);
  
  if (!result.success) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', result.error)],
      ephemeral: true,
    });
  }
  
  if (result.disbanded) {
    return interaction.reply({
      embeds: [successEmbed('Groupe dissous', 'Vous avez quitté le groupe et il a été dissous car vous étiez le dernier membre.')],
    });
  }
  
  let message = 'Vous avez quitté le groupe.';
  if (result.newLeader) {
    message += `\n**${result.newLeader.characterName}** est maintenant le chef.`;
  }
  
  return interaction.reply({
    embeds: [successEmbed('Groupe quitté', message)],
  });
}

async function handleDisband(interaction, guildId, userId) {
  const party = await getParty(guildId, userId);
  
  if (!party) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Vous n\'êtes pas dans un groupe.')],
      ephemeral: true,
    });
  }
  
  if (!party.isLeader(userId)) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Seul le chef peut dissoudre le groupe.')],
      ephemeral: true,
    });
  }
  
  const confirmEmbed = warningEmbed(
    '⚠️ Confirmation',
    `Êtes-vous sûr de vouloir dissoudre le groupe ?\n\nCette action affectera **${party.members.length}** membre(s).`
  );
  
  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('party_confirmDisband')
      .setLabel('Dissoudre')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('💔'),
    new ButtonBuilder()
      .setCustomId('party_cancelDisband')
      .setLabel('Annuler')
      .setStyle(ButtonStyle.Secondary)
  );
  
  return interaction.reply({
    embeds: [confirmEmbed],
    components: [buttons],
  });
}

async function handleInfo(interaction, guildId, userId) {
  const party = await getParty(guildId, userId);
  
  if (!party) {
    return interaction.reply({
      embeds: [errorEmbed('Aucun groupe', 'Vous n\'êtes pas dans un groupe.\nUtilisez `/party create` pour en créer un.')],
      ephemeral: true,
    });
  }
  
  const leader = party.members.find(m => m.role === 'leader');
  const memberList = party.members
    .map(m => {
      const roleEmoji = m.role === 'leader' ? '👑' : '👤';
      return `${roleEmoji} **${m.characterName}** (${m.playerName})`;
    })
    .join('\n');
  
  const lootModeLabels = {
    roundrobin: '🔄 Tour par tour',
    random: '🎲 Aléatoire',
    leader: '👑 Chef uniquement',
    freeforall: '🏃 Premier arrivé',
  };
  
  const statusLabels = {
    idle: '💤 Repos',
    exploring: '🗺️ Exploration',
    combat: '⚔️ Combat',
    dungeon: '🏰 Donjon',
  };
  
  const embed = createEmbed({
    title: `👥 ${party.name || 'Groupe'}`,
    color: 0x3B82F6,
    fields: [
      {
        name: `📋 Membres (${party.members.length}/${MAX_PARTY_SIZE})`,
        value: memberList,
        inline: false,
      },
      {
        name: '📊 État',
        value: statusLabels[party.status] || party.status,
        inline: true,
      },
      {
        name: '📍 Zone',
        value: party.currentZone || 'Variable',
        inline: true,
      },
      {
        name: '💰 Distribution loot',
        value: lootModeLabels[party.settings.lootDistribution],
        inline: true,
      },
      {
        name: '📈 Statistiques',
        value: [
          `⚔️ Monstres: ${party.stats.monstersKilled}`,
          `📜 Quêtes: ${party.stats.questsCompleted}`,
          `✨ XP gagné: ${party.stats.totalXpEarned}`,
          `💰 Or gagné: ${party.stats.totalGoldEarned}`,
        ].join('\n'),
        inline: false,
      },
    ],
    footer: { text: `Créé le ${party.createdAt.toLocaleDateString('fr-FR')}` },
  });
  
  return interaction.reply({ embeds: [embed] });
}

async function handleInvites(interaction, guildId, userId) {
  const invites = await getPendingInvites(guildId, userId);
  
  if (invites.length === 0) {
    return interaction.reply({
      embeds: [errorEmbed('Aucune invitation', 'Vous n\'avez aucune invitation en attente.')],
      ephemeral: true,
    });
  }
  
  const embed = createEmbed({
    title: '📨 Invitations en attente',
    description: 'Vous avez des invitations de groupe en attente.',
    color: 0x3B82F6,
  });
  
  const components = [];
  
  for (const party of invites) {
    const leader = party.members.find(m => m.role === 'leader');
    const invite = party.pendingInvites.find(i => i.playerId === userId);
    const timeLeft = Math.round((invite.expiresAt - Date.now()) / 1000 / 60);
    
    embed.addFields({
      name: party.name || 'Groupe sans nom',
      value: [
        `👑 Chef: ${leader?.characterName || 'Inconnu'}`,
        `👥 Membres: ${party.members.length}/${MAX_PARTY_SIZE}`,
        `⏰ Expire dans: ${timeLeft} min`,
      ].join('\n'),
      inline: true,
    });
    
    components.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`party_accept_${party._id}`)
          .setLabel(`Rejoindre ${party.name || 'ce groupe'}`)
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId(`party_decline_${party._id}`)
          .setLabel('Refuser')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
      )
    );
  }
  
  return interaction.reply({
    embeds: [embed],
    components: components.slice(0, 5), // Max 5 action rows
    ephemeral: true,
  });
}

async function handleSettings(interaction, guildId, userId) {
  const party = await getParty(guildId, userId);
  
  if (!party) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Vous n\'êtes pas dans un groupe.')],
      ephemeral: true,
    });
  }
  
  if (!party.isLeader(userId)) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Seul le chef peut modifier les paramètres.')],
      ephemeral: true,
    });
  }
  
  const embed = createEmbed({
    title: '⚙️ Paramètres du groupe',
    description: 'Modifiez les paramètres de votre groupe.',
    color: 0x6B7280,
    fields: [
      {
        name: '💰 Distribution du loot',
        value: 'Choisissez comment le butin est distribué entre les membres.',
        inline: false,
      },
    ],
  });
  
  const lootMenu = new StringSelectMenuBuilder()
    .setCustomId('party_loot')
    .setPlaceholder('Mode de distribution')
    .addOptions([
      {
        label: 'Tour par tour',
        description: 'Les items sont distribués équitablement en rotation',
        value: 'roundrobin',
        emoji: '🔄',
        default: party.settings.lootDistribution === 'roundrobin',
      },
      {
        label: 'Aléatoire',
        description: 'Chaque item va à un membre au hasard',
        value: 'random',
        emoji: '🎲',
        default: party.settings.lootDistribution === 'random',
      },
      {
        label: 'Chef uniquement',
        description: 'Tous les items vont au chef du groupe',
        value: 'leader',
        emoji: '👑',
        default: party.settings.lootDistribution === 'leader',
      },
      {
        label: 'Premier arrivé',
        description: 'Les items vont à celui qui tue le monstre',
        value: 'freeforall',
        emoji: '🏃',
        default: party.settings.lootDistribution === 'freeforall',
      },
    ]);
  
  const row = new ActionRowBuilder().addComponents(lootMenu);
  
  return interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true,
  });
}

async function handlePromote(interaction, guildId, userId) {
  const targetUser = interaction.options.getUser('joueur');
  
  if (targetUser.id === userId) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Vous êtes déjà le chef.')],
      ephemeral: true,
    });
  }
  
  const result = await transferLeadership(guildId, userId, targetUser.id);
  
  if (!result.success) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', result.error)],
      ephemeral: true,
    });
  }
  
  return interaction.reply({
    embeds: [successEmbed('Leadership transféré', `${targetUser} est maintenant le chef du groupe.`)],
  });
}

// ============================================================
// HANDLERS DE BOUTONS
// ============================================================

async function handleAcceptInvite(interaction, guildId, userId, partyId) {
  const result = await acceptInvite(guildId, userId);
  
  if (!result.success) {
    return interaction.update({
      embeds: [errorEmbed('Erreur', result.error)],
      components: [],
    });
  }
  
  const member = result.party.members.find(m => m.playerId === userId);
  
  return interaction.update({
    embeds: [successEmbed('Groupe rejoint !', `Vous avez rejoint le groupe **${result.party.name || 'sans nom'}** en tant que **${member.characterName}**.`)],
    components: [],
  });
}

async function handleDeclineInvite(interaction, guildId, userId, partyId) {
  const result = await declineInvite(guildId, userId);
  
  if (!result.success) {
    return interaction.update({
      embeds: [errorEmbed('Erreur', result.error)],
      components: [],
    });
  }
  
  return interaction.update({
    embeds: [successEmbed('Invitation refusée', 'Vous avez refusé l\'invitation.')],
    components: [],
  });
}

async function handleConfirmDisband(interaction, guildId, userId) {
  const result = await disbandParty(guildId, userId);
  
  if (!result.success) {
    return interaction.update({
      embeds: [errorEmbed('Erreur', result.error)],
      components: [],
    });
  }
  
  return interaction.update({
    embeds: [successEmbed('Groupe dissous', 'Le groupe a été dissous. Tous les membres ont été libérés.')],
    components: [],
  });
}
