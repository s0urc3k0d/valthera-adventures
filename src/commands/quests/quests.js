/**
 * Commande /quests - Gestion du journal de quêtes
 * Voir, suivre, abandonner les quêtes
 */

import { 
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from 'discord.js';
import Character from '../../models/Character.js';
import { createEmbed, errorEmbed, successEmbed } from '../../utils/embedBuilder.js';
import { card, hpBar, progressBar, separator } from '../../utils/ui.js';
import {
  getQuest,
  getActiveQuests,
  getCompletedQuests,
  getAvailableQuests,
  acceptQuest,
  completeQuest,
  abandonQuest,
  getAllReputations,
} from '../../utils/questService.js';
import { questSessions } from '../../utils/sessionManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('quests')
    .setDescription('Gérer votre journal de quêtes')
    .addSubcommand(sub =>
      sub.setName('journal')
        .setDescription('Voir vos quêtes en cours')
    )
    .addSubcommand(sub =>
      sub.setName('available')
        .setDescription('Voir les quêtes disponibles')
    )
    .addSubcommand(sub =>
      sub.setName('completed')
        .setDescription('Voir vos quêtes terminées')
    )
    .addSubcommand(sub =>
      sub.setName('reputation')
        .setDescription('Voir votre réputation avec les factions')
    ),
  
  cooldown: 3,
  
  async execute(interaction) {
    const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    
    if (!character) {
      return interaction.reply({
        embeds: [errorEmbed('Pas de personnage', 'Créez un personnage avec `/create`.')],
        ephemeral: true,
      });
    }
    
    const sub = interaction.options.getSubcommand();
    
    // Créer la session
    questSessions.set(interaction.user.id, {
      odUserId: interaction.user.id,
      odGuildId: interaction.guildId,
      character,
      view: sub,
      page: 1,
    });
    
    switch (sub) {
      case 'journal':
        await showJournal(interaction, character);
        break;
      case 'available':
        await showAvailable(interaction, character);
        break;
      case 'completed':
        await showCompleted(interaction, character);
        break;
      case 'reputation':
        await showReputation(interaction, character);
        break;
    }
  },
  
  async handleButton(interaction, client, params) {
    const session = questSessions.get(interaction.user.id);
    if (!session) {
      return interaction.reply({
        embeds: [errorEmbed('Session expirée', 'Utilisez `/quests` à nouveau.')],
        ephemeral: true,
      });
    }
    
    if (session.odUserId !== interaction.user.id) {
      return interaction.reply({
        embeds: [errorEmbed('Session invalide', 'Cette session ne vous appartient pas.')],
        ephemeral: true,
      });
    }
    
    // Recharger le personnage
    session.character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    
    const [action, ...args] = params;
    
    switch (action) {
      case 'view':
        session.view = args[0];
        if (args[0] === 'journal') await showJournal(interaction, session.character, true);
        else if (args[0] === 'available') await showAvailable(interaction, session.character, true);
        else if (args[0] === 'completed') await showCompleted(interaction, session.character, true);
        else if (args[0] === 'reputation') await showReputation(interaction, session.character, true);
        break;
        
      case 'accept':
        await handleAccept(interaction, session.character, args[0]);
        break;
        
      case 'complete':
        await handleComplete(interaction, session.character, args[0]);
        break;
        
      case 'abandon':
        await handleAbandon(interaction, session.character, args[0]);
        break;
        
      case 'details':
        await showQuestDetails(interaction, session.character, args[0]);
        break;
    }
  },
  
  async handleSelectMenu(interaction, client, params) {
    const session = questSessions.get(interaction.user.id);
    if (!session) {
      return interaction.reply({
        embeds: [errorEmbed('Session expirée', 'Utilisez `/quests` à nouveau.')],
        ephemeral: true,
      });
    }
    
    if (session.odUserId !== interaction.user.id) {
      return interaction.reply({
        embeds: [errorEmbed('Session invalide', 'Cette session ne vous appartient pas.')],
        ephemeral: true,
      });
    }
    
    session.character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    
    const [menuType] = params;
    const selected = interaction.values[0];
    
    if (menuType === 'quest') {
      await showQuestDetails(interaction, session.character, selected, true);
    }
  },
};

// ============================================================
// AFFICHAGE DU JOURNAL
// ============================================================

async function showJournal(interaction, character, isUpdate = false) {
  const activeQuests = getActiveQuests(character);
  
  const lines = [];
  
  if (activeQuests.length === 0) {
    lines.push('*Vous n\'avez aucune quête en cours.*');
    lines.push('');
    lines.push('Utilisez `/quests available` pour voir les quêtes disponibles,');
    lines.push('ou parlez aux PNJ avec `/talk`.');
  } else {
    for (const quest of activeQuests) {
      const typeEmoji = getQuestTypeEmoji(quest.type);
      const statusEmoji = quest.status === 'ready_to_complete' ? '✅' : '📋';
      
      // Calculer la progression globale
      const objectives = quest.objectives.filter(o => !o.optional && !o.hidden);
      const completed = objectives.filter(o => quest.progress[o.id]?.completed).length;
      const total = objectives.length;
      const progressPercent = Math.round((completed / total) * 100);
      
      lines.push(`${statusEmoji} ${typeEmoji} **${quest.title}**`);
      lines.push(`└─ ${progressBar(progressPercent, 100, 10)} ${completed}/${total} objectifs`);
      
      // Afficher le prochain objectif non complété
      const nextObj = objectives.find(o => !quest.progress[o.id]?.completed);
      if (nextObj) {
        const prog = quest.progress[nextObj.id];
        lines.push(`   ➤ ${nextObj.description} (${prog.current}/${prog.required})`);
      }
      lines.push('');
    }
  }
  
  const embed = card({
    theme: 'default',
    title: '📜 Journal de Quêtes',
    description: lines.join('\n'),
    footer: `${activeQuests.length} quête(s) active(s)`,
  });
  
  const components = [];
  
  // Menu de sélection si des quêtes existent
  if (activeQuests.length > 0) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('quests:quest')
      .setPlaceholder('Sélectionner une quête pour les détails')
      .addOptions(
        activeQuests.slice(0, 25).map(q => ({
          label: q.title,
          description: q.shortDescription?.substring(0, 50) || q.type,
          value: q.id,
          emoji: getQuestTypeEmoji(q.type),
        }))
      );
    components.push(new ActionRowBuilder().addComponents(selectMenu));
  }
  
  // Boutons de navigation
  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('quests:view:journal')
      .setLabel('En cours')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('quests:view:available')
      .setLabel('Disponibles')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('quests:view:completed')
      .setLabel('Terminées')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('quests:view:reputation')
      .setLabel('Réputation')
      .setStyle(ButtonStyle.Secondary),
  );
  components.push(navRow);
  
  const payload = { embeds: [embed], components };
  
  if (isUpdate) {
    await interaction.update(payload);
  } else {
    await interaction.reply(payload);
  }
}

// ============================================================
// QUÊTES DISPONIBLES
// ============================================================

async function showAvailable(interaction, character, isUpdate = false) {
  const available = getAvailableQuests(character, character.location);
  
  const lines = [];
  
  if (available.length === 0) {
    lines.push('*Aucune quête disponible ici pour le moment.*');
    lines.push('');
    lines.push('Essayez de voyager vers d\'autres zones');
    lines.push('ou de parler aux PNJ.');
  } else {
    // Grouper par type
    const byType = {};
    for (const quest of available) {
      if (!byType[quest.type]) byType[quest.type] = [];
      byType[quest.type].push(quest);
    }
    
    for (const [type, quests] of Object.entries(byType)) {
      const typeEmoji = getQuestTypeEmoji(type);
      const typeName = getQuestTypeName(type);
      lines.push(`**${typeEmoji} ${typeName}**`);
      
      for (const quest of quests.slice(0, 5)) {
        lines.push(`• ${quest.emoji || '📋'} ${quest.title}`);
        lines.push(`  └─ Niv. ${quest.level.recommended} | ${quest.shortDescription}`);
      }
      lines.push('');
    }
  }
  
  const embed = card({
    theme: 'info',
    title: '📋 Quêtes Disponibles',
    description: lines.join('\n'),
    footer: `${available.length} quête(s) disponible(s) • Utilisez /talk pour accepter`,
  });
  
  const components = [];
  
  // Menu de sélection
  if (available.length > 0) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('quests:quest')
      .setPlaceholder('Voir les détails d\'une quête')
      .addOptions(
        available.slice(0, 25).map(q => ({
          label: q.title,
          description: `Niv. ${q.level.recommended} - ${q.giver.npcName}`,
          value: q.id,
          emoji: q.emoji || getQuestTypeEmoji(q.type),
        }))
      );
    components.push(new ActionRowBuilder().addComponents(selectMenu));
  }
  
  // Boutons de navigation
  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('quests:view:journal')
      .setLabel('En cours')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('quests:view:available')
      .setLabel('Disponibles')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('quests:view:completed')
      .setLabel('Terminées')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('quests:view:reputation')
      .setLabel('Réputation')
      .setStyle(ButtonStyle.Secondary),
  );
  components.push(navRow);
  
  const payload = { embeds: [embed], components };
  
  if (isUpdate) {
    await interaction.update(payload);
  } else {
    await interaction.reply(payload);
  }
}

// ============================================================
// QUÊTES TERMINÉES
// ============================================================

async function showCompleted(interaction, character, isUpdate = false) {
  const completed = getCompletedQuests(character);
  
  const lines = [];
  
  if (completed.length === 0) {
    lines.push('*Vous n\'avez pas encore terminé de quêtes.*');
    lines.push('');
    lines.push('Complétez des quêtes pour gagner de l\'XP,');
    lines.push('de l\'or et améliorer votre réputation !');
  } else {
    // Limiter à 15 dernières
    const recent = completed.slice(-15).reverse();
    
    for (const quest of recent) {
      const typeEmoji = getQuestTypeEmoji(quest.type);
      const date = new Date(quest.completedAt).toLocaleDateString('fr-FR');
      lines.push(`${typeEmoji} **${quest.title}** ✅`);
      lines.push(`└─ Complétée le ${date}`);
    }
    
    if (completed.length > 15) {
      lines.push('');
      lines.push(`*...et ${completed.length - 15} autre(s)*`);
    }
  }
  
  const embed = card({
    theme: 'success',
    title: '✅ Quêtes Terminées',
    description: lines.join('\n'),
    footer: `${completed.length} quête(s) complétée(s) au total`,
  });
  
  // Boutons de navigation
  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('quests:view:journal')
      .setLabel('En cours')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('quests:view:available')
      .setLabel('Disponibles')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('quests:view:completed')
      .setLabel('Terminées')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('quests:view:reputation')
      .setLabel('Réputation')
      .setStyle(ButtonStyle.Secondary),
  );
  
  const payload = { embeds: [embed], components: [navRow] };
  
  if (isUpdate) {
    await interaction.update(payload);
  } else {
    await interaction.reply(payload);
  }
}

// ============================================================
// RÉPUTATION
// ============================================================

async function showReputation(interaction, character, isUpdate = false) {
  const reputations = getAllReputations(character);
  
  const lines = [];
  
  if (reputations.length === 0) {
    lines.push('*Vous n\'avez pas encore de réputation avec les factions.*');
    lines.push('');
    lines.push('Complétez des quêtes pour gagner en réputation !');
  } else {
    for (const rep of reputations) {
      const { faction, currentRank, nextRank, currentRep, toNextRank } = rep;
      
      lines.push(`${faction.emoji} **${faction.name}**`);
      lines.push(`└─ Rang: **${currentRank.name}** (${currentRep} rep)`);
      
      if (nextRank) {
        const progress = currentRep - currentRank.minRep;
        const needed = nextRank.minRep - currentRank.minRep;
        lines.push(`   ${progressBar(progress, needed, 10)} ${toNextRank} pour ${nextRank.name}`);
      } else {
        lines.push(`   🏆 Rang maximum atteint !`);
      }
      
      // Afficher quelques avantages
      if (currentRank.perks?.length > 0) {
        lines.push(`   ⭐ ${currentRank.perks.slice(0, 2).join(', ')}`);
      }
      lines.push('');
    }
  }
  
  const embed = card({
    theme: 'info',
    title: '🏛️ Réputation des Factions',
    description: lines.join('\n'),
    footer: 'Complétez des quêtes pour améliorer votre réputation',
  });
  
  // Boutons de navigation
  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('quests:view:journal')
      .setLabel('En cours')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('quests:view:available')
      .setLabel('Disponibles')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('quests:view:completed')
      .setLabel('Terminées')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('quests:view:reputation')
      .setLabel('Réputation')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
  );
  
  const payload = { embeds: [embed], components: [navRow] };
  
  if (isUpdate) {
    await interaction.update(payload);
  } else {
    await interaction.reply(payload);
  }
}

// ============================================================
// DÉTAILS D'UNE QUÊTE
// ============================================================

async function showQuestDetails(interaction, character, questId, isUpdate = false) {
  const quest = getQuest(questId);
  if (!quest) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Quête introuvable.')],
      ephemeral: true,
    });
  }
  
  // Vérifier si le joueur a cette quête
  const questEntry = character.quests?.find(q => q.questId === questId);
  const isActive = questEntry?.status === 'active' || questEntry?.status === 'ready_to_complete';
  
  const lines = [];
  
  // Description
  lines.push(quest.description);
  lines.push('');
  
  // Informations
  lines.push(separator('Informations'));
  lines.push(`📍 **Donneur:** ${quest.giver.npcName}`);
  lines.push(`🎯 **Niveau:** ${quest.level.recommended}`);
  lines.push(`📁 **Type:** ${getQuestTypeName(quest.type)}`);
  lines.push('');
  
  // Objectifs
  lines.push(separator('Objectifs'));
  for (const obj of quest.objectives.filter(o => !o.hidden)) {
    const isComplete = questEntry?.progress[obj.id]?.completed;
    const current = questEntry?.progress[obj.id]?.current || 0;
    const emoji = isComplete ? '✅' : (obj.optional ? '⭐' : '⬜');
    
    if (isActive) {
      lines.push(`${emoji} ${obj.description} (${current}/${obj.required})`);
    } else {
      lines.push(`${emoji} ${obj.description}`);
    }
  }
  lines.push('');
  
  // Récompenses
  lines.push(separator('Récompenses'));
  if (quest.rewards.xp) lines.push(`✨ **${quest.rewards.xp}** XP`);
  if (quest.rewards.gold) lines.push(`💰 **${quest.rewards.gold}** or`);
  if (quest.rewards.items?.length > 0) {
    for (const item of quest.rewards.items) {
      const chance = item.chance && item.chance < 100 ? ` (${item.chance}%)` : '';
      lines.push(`📦 ${item.quantity}x ${item.itemId}${chance}`);
    }
  }
  if (quest.rewards.reputation?.length > 0) {
    for (const rep of quest.rewards.reputation) {
      lines.push(`🏛️ +${rep.amount} rep ${rep.factionId}`);
    }
  }
  
  const embed = card({
    theme: isActive ? 'default' : 'info',
    title: `${quest.emoji || '📋'} ${quest.title}`,
    description: lines.join('\n'),
    footer: isActive ? 'Quête en cours' : 'Parlez au PNJ pour accepter',
  });
  
  // Boutons d'action
  const actionRow = new ActionRowBuilder();
  
  if (questEntry?.status === 'ready_to_complete') {
    actionRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`quests:complete:${questId}`)
        .setLabel('Terminer la quête')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅')
    );
  }
  
  if (isActive) {
    actionRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`quests:abandon:${questId}`)
        .setLabel('Abandonner')
        .setStyle(ButtonStyle.Danger)
    );
  } else if (!questEntry || questEntry.status !== 'completed') {
    actionRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`quests:accept:${questId}`)
        .setLabel('Accepter')
        .setStyle(ButtonStyle.Success)
    );
  }
  
  actionRow.addComponents(
    new ButtonBuilder()
      .setCustomId('quests:view:journal')
      .setLabel('Retour')
      .setStyle(ButtonStyle.Secondary)
  );
  
  const payload = { embeds: [embed], components: [actionRow] };
  
  if (isUpdate) {
    await interaction.update(payload);
  } else {
    await interaction.reply(payload);
  }
}

// ============================================================
// ACTIONS
// ============================================================

async function handleAccept(interaction, character, questId) {
  const result = await acceptQuest(character, questId);
  
  if (!result.success) {
    return interaction.reply({
      embeds: [errorEmbed('Impossible', result.error)],
      ephemeral: true,
    });
  }
  
  const embed = successEmbed(
    'Quête acceptée !',
    `Vous avez accepté **${result.quest.title}**.\n\nConsultez votre journal avec \`/quests journal\`.`
  );
  
  await interaction.update({
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('quests:view:journal')
          .setLabel('Voir le journal')
          .setStyle(ButtonStyle.Primary)
      )
    ],
  });
}

async function handleComplete(interaction, character, questId) {
  const result = await completeQuest(character, questId);
  
  if (!result.success) {
    return interaction.reply({
      embeds: [errorEmbed('Impossible', result.error)],
      ephemeral: true,
    });
  }
  
  const { quest, rewards } = result;
  
  const rewardLines = [];
  if (rewards.xp) rewardLines.push(`✨ **+${rewards.xp}** XP`);
  if (rewards.gold) rewardLines.push(`💰 **+${rewards.gold}** or`);
  for (const item of rewards.items) {
    rewardLines.push(`📦 **+${item.quantity}x** ${item.item.name}`);
  }
  for (const rep of rewards.reputation) {
    rewardLines.push(`🏛️ **+${rep.amount}** rep avec ${rep.faction?.name || rep.factionId}`);
  }
  
  const embed = createEmbed({
    title: '🏆 Quête terminée !',
    description: [
      `**${quest.title}** est maintenant complète !`,
      '',
      '**Récompenses obtenues:**',
      ...rewardLines,
    ].join('\n'),
    color: 0x22C55E,
  });
  
  await interaction.update({
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('quests:view:journal')
          .setLabel('Voir le journal')
          .setStyle(ButtonStyle.Primary)
      )
    ],
  });
}

async function handleAbandon(interaction, character, questId) {
  const result = await abandonQuest(character, questId);
  
  if (!result.success) {
    return interaction.reply({
      embeds: [errorEmbed('Impossible', result.error)],
      ephemeral: true,
    });
  }
  
  const embed = createEmbed({
    title: '❌ Quête abandonnée',
    description: `Vous avez abandonné **${result.quest?.title || 'la quête'}**.`,
    color: 0xEF4444,
  });
  
  await interaction.update({
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('quests:view:journal')
          .setLabel('Voir le journal')
          .setStyle(ButtonStyle.Secondary)
      )
    ],
  });
}

// ============================================================
// HELPERS
// ============================================================

function getQuestTypeEmoji(type) {
  const emojis = {
    main: '⭐',
    side: '📋',
    contract: '📜',
    daily: '🔄',
    event: '🎉',
  };
  return emojis[type] || '📋';
}

function getQuestTypeName(type) {
  const names = {
    main: 'Quête principale',
    side: 'Quête secondaire',
    contract: 'Contrat',
    daily: 'Quotidienne',
    event: 'Événement',
  };
  return names[type] || 'Quête';
}
