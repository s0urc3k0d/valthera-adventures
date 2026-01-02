import { SlashCommandBuilder } from 'discord.js';
import Character from '../../models/Character.js';
import { createEmbed, errorEmbed, infoEmbed } from '../../utils/embedBuilder.js';
import zonesData from '../../data/zones.json' assert { type: 'json' };
import constants from '../../config/constants.js';

export default {
  data: new SlashCommandBuilder()
    .setName('map')
    .setDescription('Afficher la carte des zones'),
  
  cooldown: 5,
  
  async execute(interaction) {
    const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    
    if (!character) {
      return interaction.reply({
        embeds: [errorEmbed(
          'Personnage non trouvé',
          'Vous n\'avez pas encore de personnage. Utilisez `/create` pour en créer un!'
        )],
        ephemeral: true,
      });
    }
    
    const currentZone = zonesData.find(z => z.id === character.location);
    const discoveredZones = character.discoveredZones || [];
    
    const embed = createEmbed({
      title: '🗺️ Carte de Valthera',
      description: `Position actuelle: **${currentZone?.name || 'Inconnue'}**`,
      color: constants.bot.embedColors.info,
    });
    
    // Zones découvertes
    const zonesList = zonesData
      .filter(zone => discoveredZones.includes(zone.id))
      .map(zone => {
        const isCurrent = zone.id === character.location;
        const levelInfo = `Niv. ${zone.level.min}-${zone.level.max}`;
        const typeEmoji = getZoneTypeEmoji(zone.type);
        return `${typeEmoji} ${isCurrent ? '**→ ' : ''}${zone.name}${isCurrent ? ' ←**' : ''} (${levelInfo})`;
      })
      .join('\n');
    
    embed.addFields({
      name: `📍 Zones découvertes (${discoveredZones.length})`,
      value: zonesList || 'Aucune zone découverte',
      inline: false,
    });
    
    // Connexions depuis la zone actuelle
    if (currentZone?.connectedZones) {
      const connections = currentZone.connectedZones
        .filter(conn => !conn.hidden || discoveredZones.includes(conn.zoneId))
        .map(conn => {
          const targetZone = zonesData.find(z => z.id === conn.zoneId);
          if (!targetZone) return null;
          
          const discovered = discoveredZones.includes(conn.zoneId);
          const canTravel = !conn.requirements?.level || character.level >= conn.requirements.level;
          const status = discovered ? (canTravel ? '✅' : '🔒') : '❓';
          const name = discovered ? targetZone.name : '???';
          const time = `${conn.travelTime} min`;
          const cost = conn.travelCost > 0 ? `, ${conn.travelCost} PO` : '';
          
          return `${status} ${name} (${time}${cost})`;
        })
        .filter(Boolean)
        .join('\n');
      
      embed.addFields({
        name: '🚶 Destinations accessibles',
        value: connections || 'Aucune destination accessible',
        inline: false,
      });
    }
    
    // Légende
    embed.addFields({
      name: '📋 Légende',
      value: [
        '🏰 Ville | 🌲 Forêt | ⛏️ Donjon',
        '🏔️ Montagne | 🌾 Plaine | 🏜️ Désert',
        '✅ Accessible | 🔒 Niveau requis | ❓ Non découvert',
      ].join('\n'),
      inline: false,
    });
    
    embed.setFooter({
      text: 'Utilisez /travel <destination> pour voyager',
    });
    
    await interaction.reply({ embeds: [embed] });
  },
};

function getZoneTypeEmoji(type) {
  const emojis = {
    town: '🏰',
    forest: '🌲',
    dungeon: '⛏️',
    mountain: '🏔️',
    wilderness: '🌾',
    desert: '🏜️',
    swamp: '🌿',
    coast: '🏖️',
    underground: '🕳️',
    special: '✨',
  };
  return emojis[type] || '📍';
}
