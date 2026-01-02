import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { createEmbed, errorEmbed, successEmbed, warningEmbed } from '../../utils/embedBuilder.js';
import { progressBar } from '../../utils/ui.js';
import Character from '../../models/Character.js';
import {
  createGuild,
  inviteToGuild,
  acceptGuildInvite,
  declineGuildInvite,
  kickFromGuild,
  leaveGuild,
  promoteMember,
  demoteMember,
  getGuild,
  getPendingGuildInvites,
  setMotd,
  depositGold,
  withdrawGold,
  GUILD_CREATION_COST,
  MAX_GUILD_SIZE,
  RANK_LABELS,
} from '../../utils/guildService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('guild')
    .setDescription('Gérer votre guilde')
    .addSubcommand(sub =>
      sub
        .setName('create')
        .setDescription(`Créer une nouvelle guilde (${GUILD_CREATION_COST} po)`)
        .addStringOption(opt =>
          opt
            .setName('nom')
            .setDescription('Nom de la guilde')
            .setRequired(true)
            .setMinLength(3)
            .setMaxLength(32)
        )
        .addStringOption(opt =>
          opt
            .setName('tag')
            .setDescription('Tag de la guilde (2-5 caractères)')
            .setRequired(true)
            .setMinLength(2)
            .setMaxLength(5)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('invite')
        .setDescription('Inviter un joueur dans votre guilde')
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
        .setDescription('Exclure un membre de la guilde')
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
        .setDescription('Quitter votre guilde')
    )
    .addSubcommand(sub =>
      sub
        .setName('info')
        .setDescription('Voir les informations de votre guilde')
    )
    .addSubcommand(sub =>
      sub
        .setName('members')
        .setDescription('Voir la liste des membres')
    )
    .addSubcommand(sub =>
      sub
        .setName('invites')
        .setDescription('Voir vos invitations de guilde en attente')
    )
    .addSubcommand(sub =>
      sub
        .setName('promote')
        .setDescription('Promouvoir un membre')
        .addUserOption(opt =>
          opt
            .setName('joueur')
            .setDescription('Le joueur à promouvoir')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('demote')
        .setDescription('Rétrograder un membre')
        .addUserOption(opt =>
          opt
            .setName('joueur')
            .setDescription('Le joueur à rétrograder')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('motd')
        .setDescription('Changer le message du jour')
        .addStringOption(opt =>
          opt
            .setName('message')
            .setDescription('Le nouveau message (vide pour effacer)')
            .setRequired(false)
            .setMaxLength(200)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('bank')
        .setDescription('Gérer le coffre de guilde')
        .addStringOption(opt =>
          opt
            .setName('action')
            .setDescription('Action à effectuer')
            .setRequired(true)
            .addChoices(
              { name: 'Voir', value: 'view' },
              { name: 'Déposer', value: 'deposit' },
              { name: 'Retirer', value: 'withdraw' }
            )
        )
        .addIntegerOption(opt =>
          opt
            .setName('montant')
            .setDescription('Montant en or (pour dépôt/retrait)')
            .setRequired(false)
            .setMinValue(1)
        )
    ),
  
  cooldown: 3,
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;
    const userId = interaction.user.id;
    
    // Vérifier que l'utilisateur a un personnage (sauf pour invites)
    if (subcommand !== 'invites') {
      const character = await Character.findOne({ userId });
      if (!character) {
        return interaction.reply({
          embeds: [errorEmbed('Erreur', 'Vous n\'avez pas de personnage. Utilisez `/create` pour en créer un.')],
          ephemeral: true,
        });
      }
    }
    
    switch (subcommand) {
      case 'create':
        return handleCreate(interaction, guildId, userId);
      case 'invite':
        return handleInvite(interaction, guildId, userId);
      case 'kick':
        return handleKick(interaction, guildId, userId);
      case 'leave':
        return handleLeave(interaction, guildId, userId);
      case 'info':
        return handleInfo(interaction, guildId, userId);
      case 'members':
        return handleMembers(interaction, guildId, userId);
      case 'invites':
        return handleInvites(interaction, guildId, userId);
      case 'promote':
        return handlePromote(interaction, guildId, userId);
      case 'demote':
        return handleDemote(interaction, guildId, userId);
      case 'motd':
        return handleMotd(interaction, guildId, userId);
      case 'bank':
        return handleBank(interaction, guildId, userId);
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
      case 'acceptGuild':
        return handleAcceptInvite(interaction, guildId, userId, args[0]);
      case 'declineGuild':
        return handleDeclineInvite(interaction, guildId, userId, args[0]);
      default:
        return interaction.reply({ content: 'Action inconnue.', ephemeral: true });
    }
  },
};

// ============================================================
// HANDLERS DE SOUS-COMMANDES
// ============================================================

async function handleCreate(interaction, guildId, userId) {
  const name = interaction.options.getString('nom');
  const tag = interaction.options.getString('tag');
  
  const result = await createGuild(guildId, {
    playerId: userId,
    playerName: interaction.user.displayName,
  }, name, tag);
  
  if (!result.success) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', result.error)],
      ephemeral: true,
    });
  }
  
  const embed = createEmbed({
    title: '🏰 Guilde créée !',
    description: `La guilde **[${result.guild.tag}] ${result.guild.name}** a été créée.`,
    color: 0xF59E0B,
    fields: [
      {
        name: '👑 Fondateur',
        value: interaction.user.displayName,
        inline: true,
      },
      {
        name: '👥 Membres',
        value: `1/${MAX_GUILD_SIZE}`,
        inline: true,
      },
      {
        name: '💰 Coût',
        value: `${GUILD_CREATION_COST} po`,
        inline: true,
      },
    ],
    footer: { text: 'Utilisez /guild invite pour recruter des membres' },
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
  const targetCharacter = await Character.findOne({ userId: targetUser.id });
  if (!targetCharacter) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Ce joueur n\'a pas de personnage.')],
      ephemeral: true,
    });
  }
  
  const result = await inviteToGuild(guildId, userId, {
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
    title: '📨 Invitation de guilde',
    description: `**${interaction.user.displayName}** vous invite à rejoindre la guilde **[${result.guild.tag}] ${result.guild.name}** !`,
    color: 0xF59E0B,
    fields: [
      {
        name: '👥 Membres',
        value: `${result.guild.members.length}/${MAX_GUILD_SIZE}`,
        inline: true,
      },
      {
        name: '📊 Niveau',
        value: `${result.guild.level}`,
        inline: true,
      },
    ],
    footer: { text: 'L\'invitation expire dans 24 heures' },
  });
  
  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`guild_acceptGuild_${result.guild._id}`)
      .setLabel('Rejoindre')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅'),
    new ButtonBuilder()
      .setCustomId(`guild_declineGuild_${result.guild._id}`)
      .setLabel('Refuser')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('❌')
  );
  
  await interaction.reply({
    embeds: [successEmbed('Invitation envoyée', `${targetUser} a été invité dans votre guilde.`)],
  });
  
  await interaction.channel.send({
    content: `${targetUser}`,
    embeds: [inviteEmbed],
    components: [buttons],
  });
}

async function handleKick(interaction, guildId, userId) {
  const targetUser = interaction.options.getUser('joueur');
  
  const result = await kickFromGuild(guildId, userId, targetUser.id);
  
  if (!result.success) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', result.error)],
      ephemeral: true,
    });
  }
  
  return interaction.reply({
    embeds: [successEmbed('Membre exclu', `**${result.kickedMember.characterName}** a été exclu de la guilde.`)],
  });
}

async function handleLeave(interaction, guildId, userId) {
  const result = await leaveGuild(guildId, userId);
  
  if (!result.success) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', result.error)],
      ephemeral: true,
    });
  }
  
  if (result.disbanded) {
    return interaction.reply({
      embeds: [successEmbed('Guilde dissoute', 'Vous avez quitté la guilde et elle a été dissoute car vous étiez le dernier membre.')],
    });
  }
  
  return interaction.reply({
    embeds: [successEmbed('Guilde quittée', 'Vous avez quitté la guilde.')],
  });
}

async function handleInfo(interaction, guildId, userId) {
  const guild = await getGuild(guildId, userId);
  
  if (!guild) {
    return interaction.reply({
      embeds: [errorEmbed('Aucune guilde', 'Vous n\'êtes pas dans une guilde.\nUtilisez `/guild create` pour en créer une.')],
      ephemeral: true,
    });
  }
  
  const leader = guild.members.find(m => m.rank === 'leader');
  const xpProgress = progressBar(guild.xp, guild.getRequiredXp(), 10);
  
  const embed = createEmbed({
    title: `🏰 [${guild.tag}] ${guild.name}`,
    description: guild.description || '*Aucune description*',
    color: 0xF59E0B,
    fields: [
      {
        name: '👑 Chef',
        value: leader?.characterName || 'Inconnu',
        inline: true,
      },
      {
        name: '👥 Membres',
        value: `${guild.members.length}/${MAX_GUILD_SIZE}`,
        inline: true,
      },
      {
        name: '📊 Niveau',
        value: `${guild.level}`,
        inline: true,
      },
      {
        name: '✨ Expérience',
        value: `${xpProgress} ${guild.xp}/${guild.getRequiredXp()}`,
        inline: false,
      },
      {
        name: '💰 Coffre',
        value: `${guild.bank.gold} po`,
        inline: true,
      },
      {
        name: '📦 Objets',
        value: `${guild.bank.items.length}`,
        inline: true,
      },
    ],
    footer: { text: `Créée le ${guild.createdAt.toLocaleDateString('fr-FR')}` },
  });
  
  if (guild.motd) {
    embed.addFields({
      name: '📢 Message du jour',
      value: guild.motd,
      inline: false,
    });
  }
  
  return interaction.reply({ embeds: [embed] });
}

async function handleMembers(interaction, guildId, userId) {
  const guild = await getGuild(guildId, userId);
  
  if (!guild) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Vous n\'êtes pas dans une guilde.')],
      ephemeral: true,
    });
  }
  
  // Trier par rang puis par date d'adhésion
  const sortedMembers = [...guild.members].sort((a, b) => {
    const rankOrder = ['leader', 'officer', 'veteran', 'member', 'recruit'];
    const rankDiff = rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
    if (rankDiff !== 0) return rankDiff;
    return new Date(a.joinedAt) - new Date(b.joinedAt);
  });
  
  const memberList = sortedMembers.map(m => {
    const rankEmoji = RANK_LABELS[m.rank].split(' ')[0];
    return `${rankEmoji} **${m.characterName}** (${m.playerName}) - ${RANK_LABELS[m.rank].split(' ').slice(1).join(' ')}`;
  }).join('\n');
  
  const embed = createEmbed({
    title: `👥 Membres de [${guild.tag}] ${guild.name}`,
    description: memberList || '*Aucun membre*',
    color: 0xF59E0B,
    footer: { text: `${guild.members.length}/${MAX_GUILD_SIZE} membres` },
  });
  
  return interaction.reply({ embeds: [embed] });
}

async function handleInvites(interaction, guildId, userId) {
  const invites = await getPendingGuildInvites(guildId, userId);
  
  if (invites.length === 0) {
    return interaction.reply({
      embeds: [errorEmbed('Aucune invitation', 'Vous n\'avez aucune invitation de guilde en attente.')],
      ephemeral: true,
    });
  }
  
  const embed = createEmbed({
    title: '📨 Invitations de guilde',
    description: 'Vous avez des invitations en attente.',
    color: 0xF59E0B,
  });
  
  const components = [];
  
  for (const guild of invites) {
    embed.addFields({
      name: `[${guild.tag}] ${guild.name}`,
      value: `👥 ${guild.members.length} membres | 📊 Niveau ${guild.level}`,
      inline: true,
    });
    
    components.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`guild_acceptGuild_${guild._id}`)
          .setLabel(`Rejoindre ${guild.name}`)
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId(`guild_declineGuild_${guild._id}`)
          .setLabel('Refuser')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
      )
    );
  }
  
  return interaction.reply({
    embeds: [embed],
    components: components.slice(0, 5),
    ephemeral: true,
  });
}

async function handlePromote(interaction, guildId, userId) {
  const targetUser = interaction.options.getUser('joueur');
  
  const result = await promoteMember(guildId, userId, targetUser.id);
  
  if (!result.success) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', result.error)],
      ephemeral: true,
    });
  }
  
  return interaction.reply({
    embeds: [successEmbed('Promotion', `${targetUser} a été promu au rang **${RANK_LABELS[result.newRank]}**.`)],
  });
}

async function handleDemote(interaction, guildId, userId) {
  const targetUser = interaction.options.getUser('joueur');
  
  const result = await demoteMember(guildId, userId, targetUser.id);
  
  if (!result.success) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', result.error)],
      ephemeral: true,
    });
  }
  
  return interaction.reply({
    embeds: [successEmbed('Rétrogradation', `${targetUser} a été rétrogradé au rang **${RANK_LABELS[result.newRank]}**.`)],
  });
}

async function handleMotd(interaction, guildId, userId) {
  const message = interaction.options.getString('message') || '';
  
  const result = await setMotd(guildId, userId, message);
  
  if (!result.success) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', result.error)],
      ephemeral: true,
    });
  }
  
  if (message) {
    return interaction.reply({
      embeds: [successEmbed('MOTD mis à jour', `📢 ${message}`)],
    });
  } else {
    return interaction.reply({
      embeds: [successEmbed('MOTD effacé', 'Le message du jour a été effacé.')],
    });
  }
}

async function handleBank(interaction, guildId, userId) {
  const action = interaction.options.getString('action');
  const amount = interaction.options.getInteger('montant');
  
  const guild = await getGuild(guildId, userId);
  if (!guild) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Vous n\'êtes pas dans une guilde.')],
      ephemeral: true,
    });
  }
  
  switch (action) {
    case 'view': {
      const embed = createEmbed({
        title: '💰 Coffre de guilde',
        description: `**[${guild.tag}] ${guild.name}**`,
        color: 0xF59E0B,
        fields: [
          {
            name: '💰 Or',
            value: `${guild.bank.gold} po`,
            inline: true,
          },
          {
            name: '📦 Objets',
            value: `${guild.bank.items.length}`,
            inline: true,
          },
          {
            name: '🔒 Accès',
            value: RANK_LABELS[guild.settings.bankAccessRank],
            inline: true,
          },
        ],
      });
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    case 'deposit': {
      if (!amount) {
        return interaction.reply({
          embeds: [errorEmbed('Erreur', 'Spécifiez un montant à déposer.')],
          ephemeral: true,
        });
      }
      
      const result = await depositGold(guildId, userId, amount);
      if (!result.success) {
        return interaction.reply({
          embeds: [errorEmbed('Erreur', result.error)],
          ephemeral: true,
        });
      }
      
      return interaction.reply({
        embeds: [successEmbed('Dépôt effectué', `Vous avez déposé **${amount} po** dans le coffre.\nNouveau solde: **${result.guild.bank.gold} po**`)],
      });
    }
    
    case 'withdraw': {
      if (!amount) {
        return interaction.reply({
          embeds: [errorEmbed('Erreur', 'Spécifiez un montant à retirer.')],
          ephemeral: true,
        });
      }
      
      const result = await withdrawGold(guildId, userId, amount);
      if (!result.success) {
        return interaction.reply({
          embeds: [errorEmbed('Erreur', result.error)],
          ephemeral: true,
        });
      }
      
      return interaction.reply({
        embeds: [successEmbed('Retrait effectué', `Vous avez retiré **${amount} po** du coffre.\nNouveau solde: **${result.guild.bank.gold} po**`)],
      });
    }
    
    default:
      return interaction.reply({
        embeds: [errorEmbed('Erreur', 'Action inconnue.')],
        ephemeral: true,
      });
  }
}

// ============================================================
// HANDLERS DE BOUTONS
// ============================================================

async function handleAcceptInvite(interaction, guildId, userId, guildDbId) {
  const result = await acceptGuildInvite(guildId, userId);
  
  if (!result.success) {
    return interaction.update({
      embeds: [errorEmbed('Erreur', result.error)],
      components: [],
    });
  }
  
  return interaction.update({
    embeds: [successEmbed('Guilde rejointe !', `Vous avez rejoint **[${result.guild.tag}] ${result.guild.name}** !`)],
    components: [],
  });
}

async function handleDeclineInvite(interaction, guildId, userId, guildDbId) {
  const result = await declineGuildInvite(guildId, userId);
  
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
