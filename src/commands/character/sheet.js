import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import Character from '../../models/Character.js';
import { errorEmbed } from '../../utils/embedBuilder.js';
import { 
  card, 
  hpBar, 
  xpBar, 
  formatAttributes, 
  formatGold,
  separator,
  button,
  getRarityEmoji,
} from '../../utils/ui.js';
import { getItem, getInventoryItems, calculateInventoryWeight, calculateCarryCapacity } from '../../utils/itemService.js';
import constants from '../../config/constants.js';

const { emojis } = constants.bot;

export default {
  data: new SlashCommandBuilder()
    .setName('sheet')
    .setDescription('Afficher votre feuille de personnage')
    .addUserOption(option =>
      option
        .setName('joueur')
        .setDescription('Voir la feuille d\'un autre joueur')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('vue')
        .setDescription('Type de vue')
        .setRequired(false)
        .addChoices(
          { name: '📜 Résumé', value: 'summary' },
          { name: '📊 Statistiques', value: 'stats' },
          { name: '⚔️ Équipement', value: 'equipment' },
          { name: '✨ Capacités', value: 'abilities' },
        )
    ),
  
  cooldown: 3,
  
  async execute(interaction) {
    const targetUser = interaction.options.getUser('joueur') || interaction.user;
    const view = interaction.options.getString('vue') || 'summary';
    const guildId = interaction.guildId;
    
    const character = await Character.findByDiscordId(targetUser.id, guildId);
    
    if (!character) {
      const isOwn = targetUser.id === interaction.user.id;
      return interaction.reply({
        embeds: [errorEmbed(
          'Personnage non trouvé',
          isOwn
            ? 'Vous n\'avez pas encore de personnage. Utilisez `/create` pour en créer un!'
            : `${targetUser.username} n'a pas encore de personnage.`
        )],
        ephemeral: true,
      });
    }
    
    let embed;
    switch (view) {
      case 'stats':
        embed = createStatsEmbed(character);
        break;
      case 'equipment':
        embed = createEquipmentEmbed(character);
        break;
      case 'abilities':
        embed = createAbilitiesEmbed(character);
        break;
      default:
        embed = createSummaryEmbed(character, targetUser);
    }
    
    // Boutons de navigation
    const navRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('sheet:summary')
        .setLabel('Résumé')
        .setEmoji('📜')
        .setStyle(view === 'summary' ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('sheet:stats')
        .setLabel('Stats')
        .setEmoji('📊')
        .setStyle(view === 'stats' ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('sheet:equipment')
        .setLabel('Équipement')
        .setEmoji('⚔️')
        .setStyle(view === 'equipment' ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('sheet:abilities')
        .setLabel('Capacités')
        .setEmoji('✨')
        .setStyle(view === 'abilities' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    );
    
    await interaction.reply({ 
      embeds: [embed],
      components: [navRow],
    });
  },
  
  async handleButton(interaction, client, params) {
    const [view] = params;
    const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    
    if (!character) {
      return interaction.reply({
        embeds: [errorEmbed('Personnage non trouvé', 'Vous n\'avez pas de personnage.')],
        ephemeral: true,
      });
    }
    
    let embed;
    switch (view) {
      case 'stats':
        embed = createStatsEmbed(character);
        break;
      case 'equipment':
        embed = createEquipmentEmbed(character);
        break;
      case 'abilities':
        embed = createAbilitiesEmbed(character);
        break;
      default:
        embed = createSummaryEmbed(character, interaction.user);
    }
    
    const navRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('sheet:summary')
        .setLabel('Résumé')
        .setEmoji('📜')
        .setStyle(view === 'summary' ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('sheet:stats')
        .setLabel('Stats')
        .setEmoji('📊')
        .setStyle(view === 'stats' ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('sheet:equipment')
        .setLabel('Équipement')
        .setEmoji('⚔️')
        .setStyle(view === 'equipment' ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('sheet:abilities')
        .setLabel('Capacités')
        .setEmoji('✨')
        .setStyle(view === 'abilities' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    );
    
    await interaction.update({
      embeds: [embed],
      components: [navRow],
    });
  },
};

/**
 * Crée l'embed de résumé principal
 */
function createSummaryEmbed(character, user) {
  const xpRequired = constants.game.xpToLevel(character.level + 1);
  
  const embed = card({
    theme: 'primary',
    title: `📜 ${character.name}`,
    thumbnail: user?.displayAvatarURL?.() || null,
  });
  
  // Bannière d'identité
  const identityText = [
    `*${character.race}${character.subrace ? ` (${character.subrace})` : ''} - ${character.class}*`,
    `**Niveau ${character.level}**`,
    '',
    separator('stars'),
  ].join('\n');
  
  embed.setDescription(identityText);
  
  // Stats vitales avec barres visuelles
  const hpDisplay = hpBar(character.hp.current, character.hp.max);
  const xpDisplay = xpBar(character.xp, xpRequired, character.level);
  
  embed.addFields({
    name: '❤️ Points de Vie',
    value: hpDisplay,
    inline: false,
  });
  
  embed.addFields({
    name: '✨ Expérience',
    value: xpDisplay,
    inline: false,
  });
  
  // Stats de combat compactes
  embed.addFields({
    name: '⚔️ Combat',
    value: [
      `🛡️ **CA:** ${character.ac}`,
      `🏃 **Vitesse:** ${character.speed} ft`,
      `🎯 **Initiative:** +${Math.floor((character.attributes.dex - 10) / 2)}`,
    ].join('\n'),
    inline: true,
  });
  
  // Richesse
  embed.addFields({
    name: '💰 Richesse',
    value: formatGold(character.gold),
    inline: true,
  });
  
  // Position
  embed.addFields({
    name: '🗺️ Position',
    value: formatLocation(character.location),
    inline: true,
  });
  
  // Statistiques de jeu
  const playStats = [
    `⚔️ Monstres tués: ${character.stats?.monstersKilled || 0}`,
    `📜 Quêtes terminées: ${character.stats?.questsCompleted || 0}`,
    `💀 Morts: ${character.stats?.deaths || 0}`,
  ].join('\n');
  
  embed.addFields({
    name: '📊 Statistiques',
    value: playStats,
    inline: false,
  });
  
  return embed;
}

/**
 * Crée l'embed des statistiques détaillées
 */
function createStatsEmbed(character) {
  const embed = card({
    theme: 'info',
    title: `📊 Statistiques de ${character.name}`,
  });
  
  // Attributs avec modificateurs
  const attrs = character.attributes;
  const attrLines = [
    `💪 **Force:** ${attrs.str} (${formatMod(attrs.str)})`,
    `🏃 **Dextérité:** ${attrs.dex} (${formatMod(attrs.dex)})`,
    `🫀 **Constitution:** ${attrs.con} (${formatMod(attrs.con)})`,
    `🧠 **Intelligence:** ${attrs.int} (${formatMod(attrs.int)})`,
    `👁️ **Sagesse:** ${attrs.wis} (${formatMod(attrs.wis)})`,
    `💬 **Charisme:** ${attrs.cha} (${formatMod(attrs.cha)})`,
  ];
  
  embed.addFields({
    name: '📈 Attributs',
    value: attrLines.join('\n'),
    inline: false,
  });
  
  // Jets de sauvegarde
  const profBonus = getProficiencyBonus(character.level);
  const savingThrows = character.proficiencies?.savingThrows || [];
  
  const saveLines = [
    `💪 FOR: ${formatSave(attrs.str, savingThrows.includes('str'), profBonus)}`,
    `🏃 DEX: ${formatSave(attrs.dex, savingThrows.includes('dex'), profBonus)}`,
    `🫀 CON: ${formatSave(attrs.con, savingThrows.includes('con'), profBonus)}`,
    `🧠 INT: ${formatSave(attrs.int, savingThrows.includes('int'), profBonus)}`,
    `👁️ SAG: ${formatSave(attrs.wis, savingThrows.includes('wis'), profBonus)}`,
    `💬 CHA: ${formatSave(attrs.cha, savingThrows.includes('cha'), profBonus)}`,
  ];
  
  embed.addFields({
    name: '🎲 Jets de Sauvegarde',
    value: saveLines.join('\n'),
    inline: true,
  });
  
  // Bonus de maîtrise et stats dérivées
  embed.addFields({
    name: '📋 Statistiques Dérivées',
    value: [
      `🎯 **Bonus de maîtrise:** +${profBonus}`,
      `❤️ **PV Max:** ${character.hp.max}`,
      `🎲 **Dé de vie:** ${character.hitDice?.max || 1}${character.hitDice?.type || 'd8'}`,
      `⚡ **Initiative:** +${Math.floor((attrs.dex - 10) / 2)}`,
    ].join('\n'),
    inline: true,
  });
  
  // Maîtrises
  const profs = [];
  if (character.proficiencies?.armor?.length) {
    profs.push(`🛡️ **Armures:** ${character.proficiencies.armor.join(', ')}`);
  }
  if (character.proficiencies?.weapons?.length) {
    profs.push(`⚔️ **Armes:** ${character.proficiencies.weapons.join(', ')}`);
  }
  if (character.proficiencies?.languages?.length) {
    profs.push(`🗣️ **Langues:** ${character.proficiencies.languages.join(', ')}`);
  }
  
  if (profs.length > 0) {
    embed.addFields({
      name: '📚 Maîtrises',
      value: profs.join('\n'),
      inline: false,
    });
  }
  
  return embed;
}

/**
 * Crée l'embed d'équipement
 */
function createEquipmentEmbed(character) {
  const embed = card({
    theme: 'inventory',
    title: `⚔️ Équipement de ${character.name}`,
  });
  
  const slots = [
    { id: 'mainHand', name: 'Main principale', emoji: '🗡️' },
    { id: 'offHand', name: 'Main secondaire', emoji: '🛡️' },
    { id: 'head', name: 'Tête', emoji: '👒' },
    { id: 'chest', name: 'Torse', emoji: '👕' },
    { id: 'hands', name: 'Mains', emoji: '🧤' },
    { id: 'legs', name: 'Jambes', emoji: '👖' },
    { id: 'feet', name: 'Pieds', emoji: '👢' },
    { id: 'ring1', name: 'Anneau 1', emoji: '💍' },
    { id: 'ring2', name: 'Anneau 2', emoji: '💍' },
    { id: 'amulet', name: 'Amulette', emoji: '📿' },
    { id: 'cape', name: 'Cape', emoji: '🧥' },
    { id: 'belt', name: 'Ceinture', emoji: '🎗️' },
  ];
  
  const equippedItems = character.inventory?.filter(slot => slot.equipped) || [];
  
  const leftSlots = slots.slice(0, 6);
  const rightSlots = slots.slice(6);
  
  const formatSlot = (slot) => {
    const equipped = equippedItems.find(i => i.slot === slot.id);
    const item = equipped ? getItem(equipped.itemId) : null;
    
    if (item) {
      return `${slot.emoji} ${getRarityEmoji(item.rarity)} **${item.name}**`;
    }
    return `${slot.emoji} *Vide*`;
  };
  
  embed.addFields({
    name: '🎯 Équipement principal',
    value: leftSlots.map(formatSlot).join('\n'),
    inline: true,
  });
  
  embed.addFields({
    name: '💎 Accessoires',
    value: rightSlots.map(formatSlot).join('\n'),
    inline: true,
  });
  
  // Statistiques d'équipement
  const weight = calculateInventoryWeight(character);
  const maxWeight = calculateCarryCapacity(character);
  
  embed.addFields({
    name: '📊 Statistiques',
    value: [
      `🛡️ **Classe d'Armure:** ${character.ac}`,
      `⚖️ **Poids:** ${weight.toFixed(1)}/${maxWeight} lb`,
      `📦 **Objets:** ${character.inventory?.length || 0}`,
    ].join('\n'),
    inline: false,
  });
  
  return embed;
}

/**
 * Crée l'embed des capacités
 */
function createAbilitiesEmbed(character) {
  const embed = card({
    theme: 'quest',
    title: `✨ Capacités de ${character.name}`,
  });
  
  // Traits raciaux (à implémenter selon les races)
  embed.addFields({
    name: '🧬 Traits Raciaux',
    value: getRacialTraits(character.race, character.subrace),
    inline: false,
  });
  
  // Capacités de classe
  embed.addFields({
    name: '⚔️ Capacités de Classe',
    value: getClassAbilities(character.class, character.level),
    inline: false,
  });
  
  // Sorts (si applicable)
  if (character.spellcasting?.knownSpells?.length > 0) {
    const spellSlots = character.spellcasting.spellSlots;
    const slotsDisplay = Object.entries(spellSlots || {})
      .filter(([_, slot]) => slot?.max > 0)
      .map(([level, slot]) => `Niv.${level}: ${slot.current}/${slot.max}`)
      .join(' | ');
    
    embed.addFields({
      name: '📖 Sorts',
      value: [
        `**Emplacements:** ${slotsDisplay || 'Aucun'}`,
        `**Sorts connus:** ${character.spellcasting.knownSpells.length}`,
      ].join('\n'),
      inline: false,
    });
  }
  
  return embed;
}

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

function formatMod(score) {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function formatSave(score, proficient, profBonus) {
  const mod = Math.floor((score - 10) / 2);
  const total = proficient ? mod + profBonus : mod;
  const profMark = proficient ? ' ⭐' : '';
  return `${total >= 0 ? '+' : ''}${total}${profMark}`;
}

function getProficiencyBonus(level) {
  if (level <= 4) return 2;
  if (level <= 8) return 3;
  if (level <= 12) return 4;
  if (level <= 16) return 5;
  return 6;
}

function formatLocation(locationId) {
  const locations = {
    'val-serein': '🏰 Val-Serein',
    'whispering-woods': '🌲 Bois des Murmures',
    'shadowfen-marshes': '🏚️ Marais de Sombrefagne',
    'frostpeak-mountains': '🏔️ Monts Givrés',
    'ancient-ruins': '🏛️ Ruines Anciennes',
    'bloodstone-canyon': '🗻 Canyon Sangpierre',
    'forgotten-crypt': '⚰️ Crypte Oubliée',
  };
  return locations[locationId] || locationId;
}

function getRacialTraits(race, subrace) {
  const traits = {
    'Humain': '• **Versatile:** +1 à tous les attributs\n• **Langues supplémentaires**',
    'Elfe': '• **Vision dans le noir:** 60 ft\n• **Sens aiguisés:** Maîtrise Perception\n• **Transe:** 4h de repos',
    'Nain': '• **Vision dans le noir:** 60 ft\n• **Résistance naine:** Avantage vs poison\n• **Entraînement aux armes**',
    'Halfelin': '• **Chanceux:** Relance les 1 naturels\n• **Brave:** Avantage vs peur\n• **Agilité halfeline**',
    'Demi-Orc': '• **Vision dans le noir:** 60 ft\n• **Endurance implacable:** Évite l\'inconscience\n• **Attaques sauvages**',
    'Tieffelin': '• **Vision dans le noir:** 60 ft\n• **Résistance infernale:** Résistance feu\n• **Héritage infernal**',
    'Gnome': '• **Vision dans le noir:** 60 ft\n• **Ruse gnome:** Avantage vs magie\n• **Petite taille**',
    'Demi-Elfe': '• **Vision dans le noir:** 60 ft\n• **Ascendance féerique:** Résistance charme\n• **Polyvalence**',
    'Dragonide': '• **Souffle draconique:** Attaque de zone\n• **Résistance élémentaire**',
    'Aasimar': '• **Vision dans le noir:** 60 ft\n• **Résistance céleste:** Résistance radiant/nécrotique\n• **Mains guérisseuses**',
  };
  return traits[race] || '*Traits raciaux non définis*';
}

function getClassAbilities(className, level) {
  const abilities = {
    'Guerrier': level >= 1 
      ? '• **Second souffle:** Récupérer PV (1/repos court)\n• **Style de combat:** Bonus passif' 
      : '*Aucune capacité*',
    'Roublard': level >= 1 
      ? '• **Attaque sournoise:** Dégâts supplémentaires\n• **Argot des voleurs:** Langage secret' 
      : '*Aucune capacité*',
    'Magicien': level >= 1 
      ? '• **Incantation:** Lancer des sorts\n• **Récupération arcanique:** Récupérer des emplacements' 
      : '*Aucune capacité*',
    'Clerc': level >= 1 
      ? '• **Incantation:** Sorts divins\n• **Domaine divin:** Pouvoirs de domaine' 
      : '*Aucune capacité*',
    'Paladin': level >= 1 
      ? '• **Sens du divin:** Détecter le mal\n• **Imposition des mains:** Soins' 
      : '*Aucune capacité*',
    'Barbare': level >= 1 
      ? '• **Rage:** +2 dégâts, résistance\n• **Défense sans armure:** CA = 10 + DEX + CON' 
      : '*Aucune capacité*',
    'Rôdeur': level >= 1 
      ? '• **Ennemi juré:** Bonus contre un type\n• **Explorateur né:** Avantages exploration' 
      : '*Aucune capacité*',
    'Barde': level >= 1 
      ? '• **Incantation:** Sorts bardiques\n• **Inspiration bardique:** Bonus aux alliés' 
      : '*Aucune capacité*',
    'Moine': level >= 1 
      ? '• **Défense sans armure:** CA spéciale\n• **Arts martiaux:** Attaques améliorées' 
      : '*Aucune capacité*',
    'Druide': level >= 1 
      ? '• **Druidique:** Langage secret\n• **Incantation:** Sorts de la nature' 
      : '*Aucune capacité*',
    'Ensorceleur': level >= 1 
      ? '• **Incantation:** Magie innée\n• **Origine magique:** Pouvoirs spéciaux' 
      : '*Aucune capacité*',
    'Sorcier': level >= 1 
      ? '• **Magie de pacte:** Sorts de pacte\n• **Protecteur:** Pouvoirs du patron' 
      : '*Aucune capacité*',
  };
  return abilities[className] || '*Capacités de classe non définies*';
}
