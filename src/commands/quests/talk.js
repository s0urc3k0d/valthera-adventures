/**
 * Commande /talk - Dialoguer avec les PNJ
 * Système de dialogues interactifs avec arbres de conversation
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
import { card, separator } from '../../utils/ui.js';
import { dialogueSessions } from '../../utils/sessionManager.js';
import { 
  acceptQuest, 
  completeQuest, 
  checkTalkObjective,
  getAvailableQuests,
} from '../../utils/questService.js';
import zonesData from '../../data/zones.json' assert { type: 'json' };
import dialoguesData from '../../data/dialogues.json' assert { type: 'json' };
import questsData from '../../data/quests.json' assert { type: 'json' };

export default {
  data: new SlashCommandBuilder()
    .setName('talk')
    .setDescription('Parler à un PNJ')
    .addStringOption(opt =>
      opt.setName('npc')
        .setDescription('Le PNJ à qui parler')
        .setRequired(false)
        .setAutocomplete(true)
    ),
  
  cooldown: 2,
  
  async autocomplete(interaction) {
    const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    if (!character) return interaction.respond([]);
    
    const zone = zonesData.find(z => z.id === character.location);
    if (!zone?.npcs) return interaction.respond([]);
    
    const focusedValue = interaction.options.getFocused().toLowerCase();
    
    const npcs = zone.npcs
      .filter(npc => npc.name.toLowerCase().includes(focusedValue))
      .map(npc => ({
        name: `${getNpcEmoji(npc.type)} ${npc.name} (${npc.location})`,
        value: npc.npcId,
      }))
      .slice(0, 25);
    
    await interaction.respond(npcs);
  },
  
  async execute(interaction) {
    const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    
    if (!character) {
      return interaction.reply({
        embeds: [errorEmbed('Pas de personnage', 'Créez un personnage avec `/create`.')],
        ephemeral: true,
      });
    }
    
    const zone = zonesData.find(z => z.id === character.location);
    if (!zone) {
      return interaction.reply({
        embeds: [errorEmbed('Erreur', 'Zone actuelle inconnue.')],
        ephemeral: true,
      });
    }
    
    const npcId = interaction.options.getString('npc');
    
    if (!npcId) {
      // Afficher la liste des PNJ disponibles
      return showNpcList(interaction, character, zone);
    }
    
    // Trouver le PNJ
    const npc = zone.npcs?.find(n => n.npcId === npcId);
    if (!npc) {
      return interaction.reply({
        embeds: [errorEmbed('PNJ introuvable', 'Ce PNJ n\'est pas dans cette zone.')],
        ephemeral: true,
      });
    }
    
    // Démarrer le dialogue
    await startDialogue(interaction, character, npc);
  },
  
  async handleButton(interaction, client, params) {
    const session = dialogueSessions.get(interaction.user.id);
    if (!session) {
      return interaction.reply({
        embeds: [errorEmbed('Session expirée', 'Utilisez `/talk` à nouveau.')],
        ephemeral: true,
      });
    }
    
    if (session.odUserId !== interaction.user.id) {
      return interaction.reply({
        embeds: [errorEmbed('Session invalide', 'Cette conversation ne vous appartient pas.')],
        ephemeral: true,
      });
    }
    
    // Recharger le personnage
    session.character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    
    const [action, ...args] = params;
    
    switch (action) {
      case 'response':
        await handleResponse(interaction, session, parseInt(args[0]));
        break;
        
      case 'npc':
        // Sélectionner un PNJ
        const zone = zonesData.find(z => z.id === session.character.location);
        const npc = zone?.npcs?.find(n => n.npcId === args[0]);
        if (npc) {
          await startDialogue(interaction, session.character, npc, true);
        }
        break;
        
      case 'end':
        dialogueSessions.delete(interaction.user.id);
        await interaction.update({
          embeds: [createEmbed({
            title: '👋 Fin de la conversation',
            description: 'Vous mettez fin à la conversation.',
            color: 0x6B7280,
          })],
          components: [],
        });
        break;
    }
  },
  
  async handleSelectMenu(interaction, client, params) {
    const session = dialogueSessions.get(interaction.user.id);
    if (!session) {
      return interaction.reply({
        embeds: [errorEmbed('Session expirée', 'Utilisez `/talk` à nouveau.')],
        ephemeral: true,
      });
    }
    
    if (session.odUserId !== interaction.user.id) {
      return interaction.reply({
        embeds: [errorEmbed('Session invalide', 'Cette conversation ne vous appartient pas.')],
        ephemeral: true,
      });
    }
    
    session.character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    
    const [menuType] = params;
    const selected = interaction.values[0];
    
    if (menuType === 'npc') {
      const zone = zonesData.find(z => z.id === session.character.location);
      const npc = zone?.npcs?.find(n => n.npcId === selected);
      if (npc) {
        await startDialogue(interaction, session.character, npc, true);
      }
    }
  },
};

// ============================================================
// LISTE DES PNJ
// ============================================================

async function showNpcList(interaction, character, zone) {
  const npcs = zone.npcs || [];
  
  if (npcs.length === 0) {
    return interaction.reply({
      embeds: [errorEmbed('Personne ici', 'Il n\'y a personne à qui parler dans cette zone.')],
      ephemeral: true,
    });
  }
  
  // Créer la session
  dialogueSessions.set(interaction.user.id, {
    odUserId: interaction.user.id,
    odGuildId: interaction.guildId,
    character,
    currentNpc: null,
    currentDialogue: null,
    currentNode: null,
  });
  
  const lines = [];
  lines.push(`Vous êtes à **${zone.emoji} ${zone.name}**.`);
  lines.push('');
  lines.push('**PNJ disponibles:**');
  
  for (const npc of npcs) {
    const emoji = getNpcEmoji(npc.type);
    const availableQuests = getAvailableQuestsFromNpc(character, npc.npcId);
    const questIndicator = availableQuests.length > 0 ? ' 📋' : '';
    
    lines.push(`${emoji} **${npc.name}**${questIndicator}`);
    lines.push(`   └─ ${npc.location}`);
  }
  
  const embed = card({
    theme: 'default',
    title: '👥 Avec qui voulez-vous parler ?',
    description: lines.join('\n'),
    footer: '📋 = Quête disponible',
  });
  
  // Menu de sélection
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('talk:npc')
    .setPlaceholder('Choisir un PNJ')
    .addOptions(
      npcs.map(npc => {
        const availableQuests = getAvailableQuestsFromNpc(character, npc.npcId);
        return {
          label: npc.name,
          description: npc.location,
          value: npc.npcId,
          emoji: availableQuests.length > 0 ? '📋' : getNpcEmoji(npc.type),
        };
      })
    );
  
  await interaction.reply({
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(selectMenu)],
  });
}

// ============================================================
// DÉMARRER UN DIALOGUE
// ============================================================

async function startDialogue(interaction, character, npc, isUpdate = false) {
  // Mettre à jour la progression des quêtes (objectif "talk")
  const questUpdates = await checkTalkObjective(character, npc.npcId);
  
  // Sauvegarder si des quêtes ont été mises à jour
  if (questUpdates.length > 0) {
    await character.save();
  }
  
  // Trouver le dialogue approprié
  const dialogue = findDialogueForNpc(character, npc.npcId);
  
  if (!dialogue) {
    // Dialogue générique
    return showGenericDialogue(interaction, character, npc, questUpdates, isUpdate);
  }
  
  // Créer/mettre à jour la session
  dialogueSessions.set(interaction.user.id, {
    odUserId: interaction.user.id,
    odGuildId: interaction.guildId,
    character,
    currentNpc: npc,
    currentDialogue: dialogue,
    currentNode: 'start',
  });
  
  // Afficher le premier nœud
  await showDialogueNode(interaction, dialogue, 'start', character, npc, questUpdates, isUpdate);
}

// ============================================================
// AFFICHER UN NŒUD DE DIALOGUE
// ============================================================

async function showDialogueNode(interaction, dialogue, nodeId, character, npc, questUpdates = [], isUpdate = false) {
  const node = dialogue.nodes[nodeId];
  if (!node) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Dialogue corrompu.')],
      ephemeral: true,
    });
  }
  
  // Remplacer les variables
  let text = node.text
    .replace(/{playerName}/g, character.name)
    .replace(/{npcName}/g, npc.name);
  
  const lines = [];
  
  // Portrait et nom du PNJ
  lines.push(`**${dialogue.portrait || '👤'} ${npc.name}**`);
  lines.push('');
  lines.push(text);
  
  // Afficher les mises à jour de quêtes
  if (questUpdates.length > 0) {
    lines.push('');
    lines.push(separator('Progression'));
    for (const update of questUpdates) {
      if (update.completed) {
        lines.push(`✅ **${update.questTitle}** - ${update.objectiveDesc}`);
      } else {
        lines.push(`📋 **${update.questTitle}** - ${update.objectiveDesc} (${update.current}/${update.required})`);
      }
    }
  }
  
  const embed = createEmbed({
    title: dialogue.title || 'Conversation',
    description: lines.join('\n'),
    color: 0x5865F2,
    footer: { text: `En conversation avec ${npc.name}` },
  });
  
  // Créer les boutons de réponse
  const components = [];
  
  if (node.responses && node.responses.length > 0) {
    // Maximum 5 boutons par row
    const rows = [];
    let currentRow = new ActionRowBuilder();
    
    for (let i = 0; i < node.responses.length && i < 5; i++) {
      const response = node.responses[i];
      
      currentRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`talk:response:${i}`)
          .setLabel(truncateLabel(response.text))
          .setStyle(ButtonStyle.Primary)
      );
    }
    
    if (currentRow.components.length > 0) {
      components.push(currentRow);
    }
    
    // Si plus de 5 réponses, ajouter une autre row
    if (node.responses.length > 5) {
      currentRow = new ActionRowBuilder();
      for (let i = 5; i < node.responses.length && i < 10; i++) {
        const response = node.responses[i];
        currentRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`talk:response:${i}`)
            .setLabel(truncateLabel(response.text))
            .setStyle(ButtonStyle.Primary)
        );
      }
      if (currentRow.components.length > 0) {
        components.push(currentRow);
      }
    }
  }
  
  // Bouton quitter
  const endRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('talk:end')
      .setLabel('Partir')
      .setStyle(ButtonStyle.Secondary)
  );
  components.push(endRow);
  
  const payload = { embeds: [embed], components };
  
  if (isUpdate) {
    await interaction.update(payload);
  } else {
    await interaction.reply(payload);
  }
}

// ============================================================
// GÉRER UNE RÉPONSE
// ============================================================

async function handleResponse(interaction, session, responseIndex) {
  const { currentDialogue, currentNode, character, currentNpc } = session;
  
  if (!currentDialogue || !currentNode) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Dialogue non initialisé.')],
      ephemeral: true,
    });
  }
  
  const node = currentDialogue.nodes[currentNode];
  if (!node?.responses?.[responseIndex]) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Réponse invalide.')],
      ephemeral: true,
    });
  }
  
  const response = node.responses[responseIndex];
  
  // Exécuter l'effet de la réponse
  let effectResult = null;
  if (response.effect) {
    effectResult = await executeDialogueEffect(response.effect, session.character);
    // Recharger le personnage après l'effet
    session.character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
  }
  
  // Aller au nœud suivant ou terminer
  if (response.next === null || response.effect?.type === 'end_dialogue') {
    // Fin du dialogue
    dialogueSessions.delete(interaction.user.id);
    
    let endText = '👋 *La conversation se termine.*';
    
    // Message spécial si quête acceptée/complétée
    if (effectResult?.questAccepted) {
      endText = `✅ **Quête acceptée:** ${effectResult.questTitle}`;
    } else if (effectResult?.questCompleted) {
      endText = `🏆 **Quête terminée:** ${effectResult.questTitle}`;
    }
    
    await interaction.update({
      embeds: [createEmbed({
        title: `${currentDialogue.portrait || '👤'} ${currentNpc.name}`,
        description: endText,
        color: 0x22C55E,
      })],
      components: [],
    });
  } else {
    // Continuer le dialogue
    session.currentNode = response.next;
    dialogueSessions.set(interaction.user.id, session);
    
    await showDialogueNode(interaction, currentDialogue, response.next, session.character, currentNpc, [], true);
  }
}

// ============================================================
// DIALOGUE GÉNÉRIQUE
// ============================================================

async function showGenericDialogue(interaction, character, npc, questUpdates, isUpdate = false) {
  // Créer la session
  dialogueSessions.set(interaction.user.id, {
    odUserId: interaction.user.id,
    odGuildId: interaction.guildId,
    character,
    currentNpc: npc,
    currentDialogue: null,
    currentNode: null,
  });
  
  const lines = [];
  const emoji = getNpcEmoji(npc.type);
  
  lines.push(`**${emoji} ${npc.name}**`);
  lines.push('');
  
  // Message selon le type de PNJ
  switch (npc.type) {
    case 'merchant':
      lines.push(`*"Bienvenue dans ma boutique, ${character.name} ! Puis-je vous aider ?"*`);
      lines.push('');
      lines.push('💡 Utilisez `/shop` pour voir les articles.');
      break;
    case 'questgiver':
      lines.push(`*"Ah, un aventurier ! J'ai peut-être du travail pour vous..."*`);
      break;
    case 'innkeeper':
      lines.push(`*"Bienvenue ! Une chambre ou une bière ?"*`);
      lines.push('');
      lines.push('💡 Utilisez `/rest` pour vous reposer.');
      break;
    case 'guard':
      lines.push(`*"Circulez, pas de problème ici."*`);
      break;
    default:
      lines.push(`*${npc.name} vous salue d'un signe de tête.*`);
  }
  
  // Quêtes disponibles
  const availableQuests = getAvailableQuestsFromNpc(character, npc.npcId);
  if (availableQuests.length > 0) {
    lines.push('');
    lines.push(separator('Quêtes disponibles'));
    for (const quest of availableQuests.slice(0, 3)) {
      lines.push(`📋 **${quest.title}** (Niv. ${quest.level.recommended})`);
      lines.push(`   ${quest.shortDescription}`);
    }
  }
  
  // Mises à jour de quêtes
  if (questUpdates.length > 0) {
    lines.push('');
    lines.push(separator('Progression'));
    for (const update of questUpdates) {
      if (update.completed) {
        lines.push(`✅ **${update.questTitle}** - Objectif complété !`);
      }
    }
  }
  
  const embed = createEmbed({
    title: '💬 Conversation',
    description: lines.join('\n'),
    color: 0x5865F2,
  });
  
  // Boutons
  const components = [];
  const actionRow = new ActionRowBuilder();
  
  // Bouton quête si disponible
  if (availableQuests.length > 0) {
    actionRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`talk:quest:${availableQuests[0].id}`)
        .setLabel('Accepter la quête')
        .setStyle(ButtonStyle.Success)
        .setEmoji('📋')
    );
  }
  
  actionRow.addComponents(
    new ButtonBuilder()
      .setCustomId('talk:end')
      .setLabel('Partir')
      .setStyle(ButtonStyle.Secondary)
  );
  
  components.push(actionRow);
  
  const payload = { embeds: [embed], components };
  
  if (isUpdate) {
    await interaction.update(payload);
  } else {
    await interaction.reply(payload);
  }
}

// ============================================================
// EFFETS DE DIALOGUE
// ============================================================

async function executeDialogueEffect(effect, character) {
  switch (effect.type) {
    case 'accept_quest':
      const acceptResult = await acceptQuest(character, effect.questId);
      if (acceptResult.success) {
        return { questAccepted: true, questTitle: acceptResult.quest.title };
      }
      break;
      
    case 'complete_quest':
      const completeResult = await completeQuest(character, effect.questId);
      if (completeResult.success) {
        return { questCompleted: true, questTitle: completeResult.quest.title, rewards: completeResult.rewards };
      }
      break;
      
    case 'open_shop':
      // Le shop sera géré par la commande /shop
      return { openShop: true };
      
    case 'open_sell':
      return { openSell: true };
      
    case 'end_dialogue':
      return { endDialogue: true };
      
    case 'give_item':
      // Donner un item au joueur
      // TODO: implémenter
      break;
      
    case 'give_gold':
      character.gold.gold += effect.amount || 0;
      await character.save();
      return { goldGiven: effect.amount };
      
    case 'set_flag':
      // Système de flags pour les choix de dialogue
      // TODO: implémenter
      break;
  }
  
  return null;
}

// ============================================================
// HELPERS
// ============================================================

function findDialogueForNpc(character, npcId) {
  // Chercher un dialogue spécifique basé sur les conditions
  for (const [dialogueId, dialogue] of Object.entries(dialoguesData)) {
    if (dialogue.npcId !== npcId) continue;
    
    // Vérifier les conditions de déclenchement
    if (dialogue.triggerCondition) {
      const { questId, objectiveComplete, status } = dialogue.triggerCondition;
      
      if (questId) {
        const questEntry = character.quests?.find(q => q.questId === questId);
        
        if (status === 'completed' && questEntry?.status !== 'completed') continue;
        if (objectiveComplete && !questEntry?.progress[objectiveComplete]?.completed) continue;
      }
    }
    
    return dialogue;
  }
  
  // Chercher un dialogue par défaut (sans condition)
  for (const [dialogueId, dialogue] of Object.entries(dialoguesData)) {
    if (dialogue.npcId === npcId && !dialogue.triggerCondition) {
      return dialogue;
    }
  }
  
  return null;
}

function getAvailableQuestsFromNpc(character, npcId) {
  return Object.values(questsData).filter(quest => {
    if (quest.giver?.npcId !== npcId) return false;
    
    // Vérifier si déjà active ou complétée
    const existing = character.quests?.find(q => q.questId === quest.id);
    if (existing?.status === 'active') return false;
    if (existing?.status === 'completed' && !quest.isRepeatable) return false;
    
    // Vérifier le niveau
    if (quest.prerequisites?.level && character.level < quest.prerequisites.level) return false;
    
    // Vérifier les quêtes prérequises
    if (quest.prerequisites?.quests?.length > 0) {
      for (const prereqId of quest.prerequisites.quests) {
        const prereq = character.quests?.find(q => q.questId === prereqId && q.status === 'completed');
        if (!prereq) return false;
      }
    }
    
    return true;
  });
}

function getNpcEmoji(type) {
  const emojis = {
    merchant: '🛒',
    questgiver: '📋',
    innkeeper: '🍺',
    guard: '🛡️',
    blacksmith: '⚒️',
    alchemist: '⚗️',
    priest: '✨',
    trainer: '⚔️',
  };
  return emojis[type] || '👤';
}

function truncateLabel(text) {
  if (text.length <= 80) return text;
  return text.substring(0, 77) + '...';
}
