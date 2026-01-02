/**
 * Commande /look - Examiner la zone actuelle
 * Affiche les détails, NPCs, boutiques et points d'intérêt
 */

import { 
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from 'discord.js';
import Character from '../../models/Character.js';
import { createEmbed, errorEmbed } from '../../utils/embedBuilder.js';
import zonesData from '../../data/zones.json' assert { type: 'json' };

export default {
  data: new SlashCommandBuilder()
    .setName('look')
    .setDescription('Examiner la zone actuelle')
    .addStringOption(opt =>
      opt.setName('cible')
        .setDescription('Ce que vous voulez examiner')
        .setRequired(false)
        .addChoices(
          { name: '🗺️ Zone (vue générale)', value: 'zone' },
          { name: '👥 PNJs présents', value: 'npcs' },
          { name: '🏪 Boutiques', value: 'shops' },
          { name: '📍 Points d\'intérêt', value: 'pois' },
          { name: '🔗 Destinations', value: 'connections' },
        )
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
    
    const zone = zonesData.find(z => z.id === character.location);
    if (!zone) {
      return interaction.reply({
        embeds: [errorEmbed('Erreur', 'Zone actuelle inconnue.')],
        ephemeral: true,
      });
    }
    
    const target = interaction.options.getString('cible') || 'zone';
    
    switch (target) {
      case 'zone':
        await showZoneOverview(interaction, character, zone);
        break;
      case 'npcs':
        await showNPCs(interaction, character, zone);
        break;
      case 'shops':
        await showShops(interaction, character, zone);
        break;
      case 'pois':
        await showPOIs(interaction, character, zone);
        break;
      case 'connections':
        await showConnections(interaction, character, zone);
        break;
    }
  },
  
  async handleButton(interaction, client, params) {
    const [action, ...args] = params;
    const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    const zone = zonesData.find(z => z.id === character?.location);
    
    if (!character || !zone) return;
    
    switch (action) {
      case 'npcs':
        await showNPCs(interaction, character, zone, true);
        break;
      case 'shops':
        await showShops(interaction, character, zone, true);
        break;
      case 'pois':
        await showPOIs(interaction, character, zone, true);
        break;
      case 'connections':
        await showConnections(interaction, character, zone, true);
        break;
    }
  },
};

// ============================================================
// VUE GÉNÉRALE DE LA ZONE
// ============================================================

async function showZoneOverview(interaction, character, zone) {
  const embed = createEmbed({
    title: `${zone.emoji} ${zone.name}`,
    description: zone.description,
    color: zone.color || 0x3B82F6,
  });
  
  // Informations de base
  const infoLines = [
    `📊 **Type:** ${getZoneTypeName(zone.type)}`,
    `🎯 **Niveau:** ${zone.level.min}-${zone.level.max} (recommandé: ${zone.level.recommended})`,
    zone.safeZone ? '🏠 **Zone sûre**' : '⚠️ **Zone dangereuse**',
    zone.restingAllowed ? '💤 Repos autorisé' : '🚫 Repos interdit',
  ];
  
  if (!zone.safeZone) {
    const encounterPercent = Math.round(zone.encounterRate * 100);
    infoLines.push(`👹 Chance de rencontre: ${encounterPercent}%`);
  }
  
  embed.addFields({
    name: '📋 Informations',
    value: infoLines.join('\n'),
    inline: false,
  });
  
  // Résumé du contenu
  const contentLines = [];
  
  if (zone.npcs?.length > 0) {
    contentLines.push(`👥 **${zone.npcs.length}** PNJ(s)`);
  }
  if (zone.shops?.length > 0) {
    contentLines.push(`🏪 **${zone.shops.length}** boutique(s)`);
  }
  if (zone.pointsOfInterest?.length > 0) {
    const discovered = zone.pointsOfInterest.filter(poi => 
      !poi.discoverable || character.discoveredPOIs?.includes(`${zone.id}:${poi.id}`)
    ).length;
    contentLines.push(`📍 **${discovered}/${zone.pointsOfInterest.length}** lieu(x) découvert(s)`);
  }
  if (zone.services?.length > 0) {
    contentLines.push(`🛎️ **${zone.services.length}** service(s)`);
  }
  
  const connectedCount = zone.connectedZones?.filter(c => 
    !c.hidden || character.discoveredZones?.includes(c.zoneId)
  ).length || 0;
  contentLines.push(`🔗 **${connectedCount}** destination(s) accessible(s)`);
  
  if (contentLines.length > 0) {
    embed.addFields({
      name: '📦 Contenu',
      value: contentLines.join('\n'),
      inline: false,
    });
  }
  
  // Environnement
  if (zone.environment) {
    const envLines = [];
    if (zone.environment.lighting) {
      const lightEmoji = { normal: '☀️', bright: '✨', dim: '🌙', dark: '🌑' };
      envLines.push(`${lightEmoji[zone.environment.lighting] || '🌤️'} Lumière: ${zone.environment.lighting}`);
    }
    if (zone.environment.terrain) {
      const terrainEmoji = { normal: '🟢', difficult: '🟡', hazardous: '🔴' };
      envLines.push(`${terrainEmoji[zone.environment.terrain] || '⚪'} Terrain: ${zone.environment.terrain}`);
    }
    if (envLines.length > 0) {
      embed.addFields({
        name: '🌍 Environnement',
        value: envLines.join('\n'),
        inline: true,
      });
    }
  }
  
  // Boutons de navigation
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('look:npcs')
      .setLabel('PNJs')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('👥')
      .setDisabled(!zone.npcs?.length),
    new ButtonBuilder()
      .setCustomId('look:shops')
      .setLabel('Boutiques')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🏪')
      .setDisabled(!zone.shops?.length),
    new ButtonBuilder()
      .setCustomId('look:pois')
      .setLabel('Lieux')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('📍')
      .setDisabled(!zone.pointsOfInterest?.length),
    new ButtonBuilder()
      .setCustomId('look:connections')
      .setLabel('Destinations')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🔗'),
  );
  
  await interaction.reply({
    embeds: [embed],
    components: [row],
  });
}

// ============================================================
// LISTE DES PNJs
// ============================================================

async function showNPCs(interaction, character, zone, isUpdate = false) {
  if (!zone.npcs || zone.npcs.length === 0) {
    const embed = createEmbed({
      title: `👥 PNJs - ${zone.name}`,
      description: '*Aucun PNJ présent dans cette zone.*',
      color: 0x6B7280,
    });
    
    return isUpdate 
      ? interaction.update({ embeds: [embed], components: [] })
      : interaction.reply({ embeds: [embed] });
  }
  
  const npcList = zone.npcs.map(npc => {
    const typeEmoji = {
      merchant: '🛒',
      questgiver: '❗',
      innkeeper: '🍺',
      trainer: '📚',
      guard: '🛡️',
      villager: '👤',
    };
    
    return [
      `${typeEmoji[npc.type] || '👤'} **${npc.name}**`,
      `   └ ${getNPCTypeName(npc.type)} • ${npc.location}`,
    ].join('\n');
  }).join('\n\n');
  
  const embed = createEmbed({
    title: `👥 PNJs - ${zone.name}`,
    description: npcList,
    color: 0x3B82F6,
    footer: { text: 'Interagissez avec les PNJs via les commandes dédiées (bientôt)' },
  });
  
  isUpdate 
    ? await interaction.update({ embeds: [embed], components: [] })
    : await interaction.reply({ embeds: [embed] });
}

// ============================================================
// LISTE DES BOUTIQUES
// ============================================================

async function showShops(interaction, character, zone, isUpdate = false) {
  const allShops = [...(zone.shops || []), ...(zone.services || [])];
  
  if (allShops.length === 0) {
    const embed = createEmbed({
      title: `🏪 Commerces - ${zone.name}`,
      description: '*Aucun commerce dans cette zone.*',
      color: 0x6B7280,
    });
    
    return isUpdate 
      ? interaction.update({ embeds: [embed], components: [] })
      : interaction.reply({ embeds: [embed] });
  }
  
  const shopList = [];
  
  // Boutiques
  if (zone.shops?.length > 0) {
    shopList.push('**🛒 Boutiques:**');
    for (const shop of zone.shops) {
      const typeEmoji = {
        armorer: '🛡️',
        weaponsmith: '⚔️',
        apothecary: '🧪',
        general: '📦',
        magic: '✨',
        blacksmith: '🔨',
      };
      shopList.push(`${typeEmoji[shop.type] || '🏪'} **${shop.name}** - ${getShopTypeName(shop.type)}`);
    }
  }
  
  // Services
  if (zone.services?.length > 0) {
    if (shopList.length > 0) shopList.push('');
    shopList.push('**🛎️ Services:**');
    for (const service of zone.services) {
      const typeEmoji = {
        inn: '🏨',
        temple: '⛪',
        guild: '🏛️',
        stable: '🐴',
        bank: '🏦',
      };
      const cost = service.cost > 0 ? ` (${service.cost} po)` : ' (gratuit)';
      shopList.push(`${typeEmoji[service.type] || '🛎️'} **${service.name}**${cost}`);
      if (service.description) {
        shopList.push(`   └ *${service.description}*`);
      }
    }
  }
  
  const embed = createEmbed({
    title: `🏪 Commerces - ${zone.name}`,
    description: shopList.join('\n'),
    color: 0xF59E0B,
    footer: { text: 'Utilisez /shop pour acheter (bientôt disponible)' },
  });
  
  isUpdate 
    ? await interaction.update({ embeds: [embed], components: [] })
    : await interaction.reply({ embeds: [embed] });
}

// ============================================================
// POINTS D'INTÉRÊT
// ============================================================

async function showPOIs(interaction, character, zone, isUpdate = false) {
  if (!zone.pointsOfInterest || zone.pointsOfInterest.length === 0) {
    const embed = createEmbed({
      title: `📍 Lieux - ${zone.name}`,
      description: '*Aucun lieu notable dans cette zone.*',
      color: 0x6B7280,
    });
    
    return isUpdate 
      ? interaction.update({ embeds: [embed], components: [] })
      : interaction.reply({ embeds: [embed] });
  }
  
  const poiList = zone.pointsOfInterest.map(poi => {
    const isDiscovered = !poi.discoverable || character.discoveredPOIs?.includes(`${zone.id}:${poi.id}`);
    
    if (!isDiscovered) {
      return `❓ **???** - *Non découvert*`;
    }
    
    const typeEmoji = {
      landmark: '🏛️',
      secret: '🔮',
      dungeon: '🏰',
      camp: '⛺',
      shrine: '⛩️',
    };
    
    return [
      `${typeEmoji[poi.type] || '📍'} **${poi.name}**`,
      `   └ *${poi.description}*`,
    ].join('\n');
  }).join('\n\n');
  
  const discovered = zone.pointsOfInterest.filter(poi => 
    !poi.discoverable || character.discoveredPOIs?.includes(`${zone.id}:${poi.id}`)
  ).length;
  
  const embed = createEmbed({
    title: `📍 Lieux - ${zone.name}`,
    description: poiList,
    color: 0x8B5CF6,
    footer: { text: `${discovered}/${zone.pointsOfInterest.length} découvert(s) • Utilisez /explore pour découvrir` },
  });
  
  isUpdate 
    ? await interaction.update({ embeds: [embed], components: [] })
    : await interaction.reply({ embeds: [embed] });
}

// ============================================================
// CONNEXIONS / DESTINATIONS
// ============================================================

async function showConnections(interaction, character, zone, isUpdate = false) {
  if (!zone.connectedZones || zone.connectedZones.length === 0) {
    const embed = createEmbed({
      title: `🔗 Destinations - ${zone.name}`,
      description: '*Aucune destination accessible.*',
      color: 0x6B7280,
    });
    
    return isUpdate 
      ? interaction.update({ embeds: [embed], components: [] })
      : interaction.reply({ embeds: [embed] });
  }
  
  const destinations = zone.connectedZones
    .filter(conn => !conn.hidden || character.discoveredZones?.includes(conn.zoneId))
    .map(conn => {
      const destZone = zonesData.find(z => z.id === conn.zoneId);
      if (!destZone) return null;
      
      // Vérifier les prérequis
      let status = '✅';
      let requirementText = '';
      
      if (conn.requirements) {
        if (conn.requirements.level && character.level < conn.requirements.level) {
          status = '🔒';
          requirementText = ` (Niv. ${conn.requirements.level} requis)`;
        } else if (conn.requirements.quest) {
          const hasQuest = character.quests?.find(q => q.questId === conn.requirements.quest && q.status === 'completed');
          if (!hasQuest) {
            status = '🔒';
            requirementText = ` (Quête requise)`;
          }
        }
      }
      
      const costText = conn.travelCost > 0 ? ` | 💰 ${conn.travelCost} po` : '';
      
      return [
        `${status} ${destZone.emoji} **${destZone.name}**${requirementText}`,
        `   └ ⏱️ ${conn.travelTime} min${costText} | Niv. ${destZone.level.min}-${destZone.level.max}`,
      ].join('\n');
    })
    .filter(Boolean)
    .join('\n\n');
  
  const embed = createEmbed({
    title: `🔗 Destinations depuis ${zone.name}`,
    description: destinations || '*Aucune destination accessible.*',
    color: 0x3B82F6,
    footer: { text: 'Utilisez /travel <destination> pour voyager' },
  });
  
  isUpdate 
    ? await interaction.update({ embeds: [embed], components: [] })
    : await interaction.reply({ embeds: [embed] });
}

// ============================================================
// UTILITAIRES
// ============================================================

function getZoneTypeName(type) {
  const types = {
    town: 'Ville',
    village: 'Village',
    forest: 'Forêt',
    wilderness: 'Nature sauvage',
    dungeon: 'Donjon',
    cave: 'Caverne',
    mountain: 'Montagne',
    swamp: 'Marécage',
    desert: 'Désert',
    coast: 'Côte',
  };
  return types[type] || type;
}

function getNPCTypeName(type) {
  const types = {
    merchant: 'Marchand',
    questgiver: 'Donneur de quêtes',
    innkeeper: 'Aubergiste',
    trainer: 'Maître',
    guard: 'Garde',
    villager: 'Villageois',
  };
  return types[type] || type;
}

function getShopTypeName(type) {
  const types = {
    armorer: 'Armurier',
    weaponsmith: 'Forgeron d\'armes',
    apothecary: 'Apothicaire',
    general: 'Bazar général',
    magic: 'Boutique magique',
    blacksmith: 'Forge',
  };
  return types[type] || type;
}
