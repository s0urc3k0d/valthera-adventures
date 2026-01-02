import { SlashCommandBuilder } from 'discord.js';
import Character from '../../models/Character.js';
import { createEmbed, errorEmbed, createProgressBar } from '../../utils/embedBuilder.js';
import constants from '../../config/constants.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Voir vos statistiques détaillées'),
  
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
    
    const { emojis } = constants.bot;
    const profBonus = character.getProficiencyBonus();
    
    // Calcul XP nécessaire pour le prochain niveau
    const xpForNextLevel = constants.game.xpToLevel(character.level + 1);
    const xpProgress = character.xp;
    const xpPercentage = Math.floor((xpProgress / xpForNextLevel) * 100);
    
    // Modificateurs d'attributs
    const getModStr = (score) => {
      const mod = Math.floor((score - 10) / 2);
      return mod >= 0 ? `+${mod}` : `${mod}`;
    };
    
    const embed = createEmbed({
      title: `📊 Statistiques de ${character.name}`,
      color: constants.bot.embedColors.info,
    });
    
    // Section Progression
    const xpBar = createProgressBar(xpProgress, xpForNextLevel, 10);
    embed.addFields({
      name: '📈 Progression',
      value: [
        `**Niveau:** ${character.level}`,
        `**XP:** ${xpProgress} / ${xpForNextLevel} (${xpPercentage}%)`,
        `${xpBar}`,
        `**Bonus de Maîtrise:** +${profBonus}`,
      ].join('\n'),
      inline: false,
    });
    
    // Section Combat
    embed.addFields({
      name: '⚔️ Combat',
      value: [
        `${emojis.hp} **Points de Vie:** ${character.hp.current}/${character.hp.max}${character.hp.temp > 0 ? ` (+${character.hp.temp} temp)` : ''}`,
        `${emojis.ac} **Classe d'Armure:** ${character.ac}`,
        `🏃 **Vitesse:** ${character.speed} pieds`,
        `🎯 **Initiative:** ${getModStr(character.attributes.dex)}`,
        `🎲 **Dés de Vie:** ${character.hitDice.current}/${character.hitDice.max} (${character.hitDice.type})`,
      ].join('\n'),
      inline: true,
    });
    
    // Section Attributs détaillés
    const attrLines = [
      `${emojis.str} **FOR:** ${character.attributes.str} (${getModStr(character.attributes.str)})`,
      `${emojis.dex} **DEX:** ${character.attributes.dex} (${getModStr(character.attributes.dex)})`,
      `${emojis.con} **CON:** ${character.attributes.con} (${getModStr(character.attributes.con)})`,
      `${emojis.int} **INT:** ${character.attributes.int} (${getModStr(character.attributes.int)})`,
      `${emojis.wis} **SAG:** ${character.attributes.wis} (${getModStr(character.attributes.wis)})`,
      `${emojis.cha} **CHA:** ${character.attributes.cha} (${getModStr(character.attributes.cha)})`,
    ];
    
    embed.addFields({
      name: '📋 Attributs',
      value: attrLines.join('\n'),
      inline: true,
    });
    
    // Section Jets de Sauvegarde
    const saves = character.proficiencies.savingThrows || [];
    const saveLines = ['str', 'dex', 'con', 'int', 'wis', 'cha'].map(attr => {
      const mod = Math.floor((character.attributes[attr] - 10) / 2);
      const isProficient = saves.includes(attr);
      const bonus = isProficient ? mod + profBonus : mod;
      const bonusStr = bonus >= 0 ? `+${bonus}` : `${bonus}`;
      return `**${attr.toUpperCase()}:** ${bonusStr}${isProficient ? ' ★' : ''}`;
    });
    
    embed.addFields({
      name: '🛡️ Sauvegardes',
      value: saveLines.join('\n'),
      inline: true,
    });
    
    // Section Statistiques de jeu
    embed.addFields({
      name: '🏆 Accomplissements',
      value: [
        `🐉 **Monstres vaincus:** ${character.stats.monstersKilled}`,
        `📜 **Quêtes complétées:** ${character.stats.questsCompleted}`,
        `💀 **Morts:** ${character.stats.deaths}`,
        `💥 **Coups critiques:** ${character.stats.criticalHits}`,
      ].join('\n'),
      inline: true,
    });
    
    embed.addFields({
      name: '💰 Économie',
      value: [
        `${emojis.gold} **Or gagné:** ${character.stats.goldEarned} PO`,
        `💸 **Or dépensé:** ${character.stats.goldSpent} PO`,
        `🎁 **Objets trouvés:** ${character.stats.itemsFound}`,
        `🗺️ **Distance parcourue:** ${character.stats.distanceTraveled}`,
      ].join('\n'),
      inline: true,
    });
    
    // Maîtrises
    const proficiencyList = [];
    if (character.proficiencies.armor?.length > 0) {
      proficiencyList.push(`**Armures:** ${character.proficiencies.armor.join(', ')}`);
    }
    if (character.proficiencies.weapons?.length > 0) {
      proficiencyList.push(`**Armes:** ${character.proficiencies.weapons.slice(0, 5).join(', ')}${character.proficiencies.weapons.length > 5 ? '...' : ''}`);
    }
    if (character.proficiencies.languages?.length > 0) {
      proficiencyList.push(`**Langues:** ${character.proficiencies.languages.join(', ')}`);
    }
    
    if (proficiencyList.length > 0) {
      embed.addFields({
        name: '📚 Maîtrises',
        value: proficiencyList.join('\n'),
        inline: false,
      });
    }
    
    // Footer avec timestamp
    embed.setFooter({
      text: `Personnage créé le ${character.createdAt.toLocaleDateString('fr-FR')}`,
    });
    
    await interaction.reply({ embeds: [embed] });
  },
};
