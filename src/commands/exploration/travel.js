/**
 * Commande /travel - Voyager entre les zones
 * Permet de se déplacer vers les zones connectées
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
import { hpBar, progressBar } from '../../utils/ui.js';
import { travelSessions } from '../../utils/sessionManager.js';
import { checkReachObjective } from '../../utils/questService.js';
import zonesData from '../../data/zones.json' assert { type: 'json' };

export default {
  data: new SlashCommandBuilder()
    .setName('travel')
    .setDescription('Voyager vers une autre zone')
    .addStringOption(opt =>
      opt.setName('destination')
        .setDescription('Zone de destination')
        .setRequired(false)
        .setAutocomplete(true)
    ),
  
  cooldown: 3,
  
  async autocomplete(interaction) {
    const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    if (!character) return interaction.respond([]);
    
    const currentZone = zonesData.find(z => z.id === character.location);
    if (!currentZone) return interaction.respond([]);
    
    const focusedValue = interaction.options.getFocused().toLowerCase();
    
    // Zones accessibles
    const destinations = currentZone.connectedZones
      .filter(conn => {
        // Filtrer les zones cachées non découvertes
        if (conn.hidden && !character.discoveredZones?.includes(conn.zoneId)) return false;
        
        const zone = zonesData.find(z => z.id === conn.zoneId);
        if (!zone) return false;
        
        return zone.name.toLowerCase().includes(focusedValue);
      })
      .map(conn => {
        const zone = zonesData.find(z => z.id === conn.zoneId);
        return {
          name: `${zone.emoji} ${zone.name} (${conn.travelTime} min)`,
          value: conn.zoneId,
        };
      })
      .slice(0, 25);
    
    await interaction.respond(destinations);
  },
  
  async execute(interaction) {
    const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    
    if (!character) {
      return interaction.reply({
        embeds: [errorEmbed('Pas de personnage', 'Créez un personnage avec `/create`.')],
        ephemeral: true,
      });
    }
    
    // Vérifier si déjà en voyage
    if (travelSessions.has(interaction.user.id)) {
      return interaction.reply({
        embeds: [errorEmbed('Déjà en voyage', 'Vous êtes déjà en train de voyager!')],
        ephemeral: true,
      });
    }
    
    const destination = interaction.options.getString('destination');
    const currentZone = zonesData.find(z => z.id === character.location);
    
    if (!currentZone) {
      return interaction.reply({
        embeds: [errorEmbed('Erreur', 'Zone actuelle inconnue.')],
        ephemeral: true,
      });
    }
    
    // Si pas de destination, afficher les choix
    if (!destination) {
      return showTravelMenu(interaction, character, currentZone);
    }
    
    // Voyager vers la destination
    await startTravel(interaction, character, currentZone, destination);
  },
  
  async handleButton(interaction, client, params) {
    const [action, zoneId] = params;
    
    if (action === 'go') {
      const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
      const currentZone = zonesData.find(z => z.id === character.location);
      await startTravel(interaction, character, currentZone, zoneId);
    } else if (action === 'cancel') {
      await interaction.update({
        embeds: [createEmbed({
          title: '🚫 Voyage annulé',
          description: 'Vous restez sur place.',
          color: 0x6B7280,
        })],
        components: [],
      });
    }
  },
  
  async handleSelectMenu(interaction, client, params) {
    const zoneId = interaction.values[0];
    const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    const currentZone = zonesData.find(z => z.id === character.location);
    await startTravel(interaction, character, currentZone, zoneId);
  },
};

// ============================================================
// AFFICHAGE DU MENU DE VOYAGE
// ============================================================

async function showTravelMenu(interaction, character, currentZone) {
  const destinations = [];
  
  for (const conn of currentZone.connectedZones) {
    // Zones cachées
    if (conn.hidden && !character.discoveredZones?.includes(conn.zoneId)) continue;
    
    const zone = zonesData.find(z => z.id === conn.zoneId);
    if (!zone) continue;
    
    // Vérifier les prérequis
    const canTravel = checkRequirements(character, conn.requirements);
    
    destinations.push({
      zone,
      conn,
      canTravel,
      reason: canTravel ? null : getRequirementReason(character, conn.requirements),
    });
  }
  
  if (destinations.length === 0) {
    return interaction.reply({
      embeds: [errorEmbed('Aucune destination', 'Aucune zone accessible depuis ici.')],
      ephemeral: true,
    });
  }
  
  // Créer l'embed
  const embed = createEmbed({
    title: `🗺️ Voyager depuis ${currentZone.name}`,
    description: `Choisissez votre destination:\n\n${destinations.map(d => {
      const status = d.canTravel ? '✅' : '🔒';
      const cost = d.conn.travelCost > 0 ? ` | 💰 ${d.conn.travelCost} po` : '';
      const reason = d.reason ? `\n   └ *${d.reason}*` : '';
      return `${status} **${d.zone.emoji} ${d.zone.name}**\n   ⏱️ ${d.conn.travelTime} min${cost}${reason}`;
    }).join('\n\n')}`,
    color: 0x3B82F6,
  });
  
  // Créer le menu de sélection
  const options = destinations
    .filter(d => d.canTravel)
    .map(d => ({
      label: d.zone.name,
      value: d.zone.id,
      description: `${d.conn.travelTime} min${d.conn.travelCost > 0 ? ` - ${d.conn.travelCost} po` : ''}`,
      emoji: d.zone.emoji,
    }));
  
  const components = [];
  
  if (options.length > 0) {
    components.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('travel:select')
          .setPlaceholder('🚶 Choisir une destination...')
          .addOptions(options)
      )
    );
  }
  
  components.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('travel:cancel')
        .setLabel('Annuler')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('❌')
    )
  );
  
  await interaction.reply({
    embeds: [embed],
    components,
  });
}

// ============================================================
// DÉMARRAGE DU VOYAGE
// ============================================================

async function startTravel(interaction, character, currentZone, destinationId) {
  const conn = currentZone.connectedZones.find(c => c.zoneId === destinationId);
  
  if (!conn) {
    return interaction.reply({
      embeds: [errorEmbed('Destination invalide', 'Cette zone n\'est pas accessible depuis ici.')],
      ephemeral: true,
    });
  }
  
  const destZone = zonesData.find(z => z.id === destinationId);
  if (!destZone) {
    return interaction.reply({
      embeds: [errorEmbed('Erreur', 'Zone de destination inconnue.')],
      ephemeral: true,
    });
  }
  
  // Vérifier les prérequis
  if (!checkRequirements(character, conn.requirements)) {
    const reason = getRequirementReason(character, conn.requirements);
    return interaction.reply({
      embeds: [errorEmbed('Accès refusé', reason)],
      ephemeral: true,
    });
  }
  
  // Vérifier le coût
  if (conn.travelCost > 0 && character.gold.gold < conn.travelCost) {
    return interaction.reply({
      embeds: [errorEmbed('Pas assez d\'or', `Il vous faut ${conn.travelCost} po pour ce voyage.`)],
      ephemeral: true,
    });
  }
  
  // Payer le coût
  if (conn.travelCost > 0) {
    character.gold.gold -= conn.travelCost;
  }
  
  // Marquer le voyage en cours (avec TTL automatique de 5 min)
  travelSessions.set(interaction.user.id, {
    odUserId: interaction.user.id,
    odGuildId: interaction.guildId,
    destination: destinationId,
    startedAt: Date.now(),
  });
  
  // Embed de départ
  const embed = createEmbed({
    title: '🚶 En route...',
    description: [
      `Vous quittez **${currentZone.emoji} ${currentZone.name}**`,
      `Direction: **${destZone.emoji} ${destZone.name}**`,
      '',
      `⏱️ Temps de trajet: **${conn.travelTime}** minutes`,
      conn.travelCost > 0 ? `💰 Coût: **${conn.travelCost}** po` : '',
    ].filter(Boolean).join('\n'),
    color: 0xF59E0B,
  });
  
  // Répondre ou mettre à jour
  const reply = interaction.replied || interaction.deferred
    ? await interaction.editReply({ embeds: [embed], components: [] })
    : await interaction.reply({ embeds: [embed], components: [] });
  
  // Simuler le temps de voyage (réduit pour le jeu: 1 min réel = 10 min jeu)
  const realTime = Math.min(conn.travelTime * 100, 5000); // Max 5 secondes
  
  await new Promise(resolve => setTimeout(resolve, realTime));
  
  // Arrivée
  character.location = destinationId;
  
  // Découvrir la zone si nouvelle
  if (!character.discoveredZones) character.discoveredZones = [];
  if (!character.discoveredZones.includes(destinationId)) {
    character.discoveredZones.push(destinationId);
  }
  
  // Mettre à jour les objectifs de quête (reach)
  const questUpdates = await checkReachObjective(character, destinationId);
  
  await character.save();
  travelSessions.delete(interaction.user.id);
  
  // Construire le message de quête
  let questText = '';
  if (questUpdates.length > 0) {
    for (const update of questUpdates) {
      if (update.completed) {
        questText += `\n\n✅ **Quête:** ${update.objectiveDesc} terminé !`;
      } else {
        questText += `\n\n📋 **Quête:** ${update.objectiveDesc} (${update.current}/${update.required})`;
      }
    }
  }
  
  // Embed d'arrivée
  const arrivalEmbed = createEmbed({
    title: `${destZone.emoji} Arrivée à ${destZone.name}`,
    description: destZone.description,
    color: destZone.color || 0x22C55E,
    fields: [
      {
        name: '📊 Informations',
        value: [
          `🎯 Niveau recommandé: ${destZone.level.min}-${destZone.level.max}`,
          `${destZone.safeZone ? '🏠 Zone sûre' : '⚠️ Zone dangereuse'}`,
          destZone.restingAllowed ? '💤 Repos autorisé' : '🚫 Repos interdit',
        ].join('\n'),
        inline: true,
      },
      {
        name: '🔗 Connexions',
        value: destZone.connectedZones
          .filter(c => !c.hidden || character.discoveredZones.includes(c.zoneId))
          .map(c => {
            const z = zonesData.find(zone => zone.id === c.zoneId);
            return z ? `${z.emoji} ${z.name}` : null;
          })
          .filter(Boolean)
          .join('\n') || 'Aucune',
        inline: true,
      },
    ],
  });
  
  // Progression de quête
  if (questText) {
    arrivalEmbed.addFields({
      name: '📜 Progression de Quête',
      value: questText.trim(),
      inline: false,
    });
  }
  
  // Conseils
  const tips = [];
  if (!destZone.safeZone) tips.push('💡 Utilisez `/explore` pour explorer la zone');
  if (destZone.npcs?.length > 0) tips.push('💡 Utilisez `/look` pour voir les PNJs');
  if (destZone.shops?.length > 0) tips.push('💡 Des boutiques sont disponibles ici');
  
  if (tips.length > 0) {
    arrivalEmbed.addFields({
      name: '💡 Conseils',
      value: tips.join('\n'),
      inline: false,
    });
  }
  
  try {
    await interaction.editReply({ embeds: [arrivalEmbed], components: [] });
  } catch (e) {
    // Interaction expirée
  }
}

// ============================================================
// UTILITAIRES
// ============================================================

function checkRequirements(character, requirements) {
  if (!requirements) return true;
  
  if (requirements.level && character.level < requirements.level) return false;
  if (requirements.quest) {
    const quest = character.quests?.find(q => q.questId === requirements.quest && q.status === 'completed');
    if (!quest) return false;
  }
  if (requirements.item) {
    const item = character.inventory?.find(i => i.itemId === requirements.item);
    if (!item) return false;
  }
  
  return true;
}

function getRequirementReason(character, requirements) {
  if (!requirements) return null;
  
  if (requirements.level && character.level < requirements.level) {
    return `Niveau ${requirements.level} requis (vous êtes niveau ${character.level})`;
  }
  if (requirements.quest) {
    return `Quête "${requirements.quest}" requise`;
  }
  if (requirements.item) {
    return `Objet requis manquant`;
  }
  
  return 'Prérequis non remplis';
}
