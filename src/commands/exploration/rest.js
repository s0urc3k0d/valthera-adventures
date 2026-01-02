/**
 * Commande /rest - Se reposer pour récupérer
 * Repos court (1h) ou long (8h)
 */

import { 
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import Character from '../../models/Character.js';
import { createEmbed, errorEmbed, successEmbed } from '../../utils/embedBuilder.js';
import { roll } from '../../utils/dice.js';
import { hpBar } from '../../utils/ui.js';
import { restCooldowns } from '../../utils/sessionManager.js';
import zonesData from '../../data/zones.json' assert { type: 'json' };
import classAbilitiesData from '../../data/classAbilities.json' assert { type: 'json' };

// Cooldowns de repos (gérés par sessionManager avec TTL automatique)
const SHORT_REST_COOLDOWN = 60000;  // 1 minute (représente 1h en jeu)
const LONG_REST_COOLDOWN = 300000;  // 5 minutes (représente 8h en jeu)

export default {
  data: new SlashCommandBuilder()
    .setName('rest')
    .setDescription('Se reposer pour récupérer')
    .addStringOption(opt =>
      opt.setName('type')
        .setDescription('Type de repos')
        .setRequired(false)
        .addChoices(
          { name: '☕ Repos court (1h) - Utiliser dés de vie', value: 'short' },
          { name: '🛏️ Repos long (8h) - Récupération complète', value: 'long' },
        )
    ),
  
  cooldown: 5,
  
  async execute(interaction) {
    const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    
    if (!character) {
      return interaction.reply({
        embeds: [errorEmbed('Pas de personnage', 'Créez un personnage avec `/create`.')],
        ephemeral: true,
      });
    }
    
    const zone = zonesData.find(z => z.id === character.location);
    
    // Vérifier si le repos est autorisé
    if (zone && !zone.restingAllowed) {
      return interaction.reply({
        embeds: [errorEmbed('Repos impossible', `Vous ne pouvez pas vous reposer dans **${zone.name}**. C'est trop dangereux ici!`)],
        ephemeral: true,
      });
    }
    
    const restType = interaction.options.getString('type');
    
    if (!restType) {
      // Afficher le menu de choix
      return showRestMenu(interaction, character, zone);
    }
    
    if (restType === 'short') {
      await doShortRest(interaction, character, zone);
    } else {
      await doLongRest(interaction, character, zone);
    }
  },
  
  async handleButton(interaction, client, params) {
    const [action, ...args] = params;
    const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    const zone = zonesData.find(z => z.id === character?.location);
    
    if (!character) return;
    
    switch (action) {
      case 'short':
        await doShortRest(interaction, character, zone, true);
        break;
      case 'long':
        await doLongRest(interaction, character, zone, true);
        break;
      case 'hitdie':
        await useHitDie(interaction, character);
        break;
      case 'cancel':
        await interaction.update({
          embeds: [createEmbed({
            title: '🚫 Repos annulé',
            description: 'Vous décidez de rester éveillé.',
            color: 0x6B7280,
          })],
          components: [],
        });
        break;
    }
  },
};

// ============================================================
// MENU DE REPOS
// ============================================================

async function showRestMenu(interaction, character, zone) {
  const embed = createEmbed({
    title: '💤 Se reposer',
    description: [
      `📍 **${zone?.name || 'Zone actuelle'}**`,
      '',
      '**☕ Repos court (1h)**',
      '• Utiliser des dés de vie pour récupérer des PV',
      '• Récupérer certaines capacités',
      '',
      '**🛏️ Repos long (8h)**',
      '• Récupérer tous les PV',
      '• Récupérer tous les emplacements de sorts',
      '• Récupérer toutes les capacités',
      '• Récupérer la moitié des dés de vie max',
    ].join('\n'),
    color: 0x6366F1,
  });
  
  // État actuel
  const hpStatus = hpBar(character.hp.current, character.hp.max, { compact: true });
  const hitDiceStatus = `${character.hitDice?.current || 0}/${character.hitDice?.max || character.level}`;
  
  embed.addFields({
    name: '📊 État actuel',
    value: [
      `❤️ PV: ${hpStatus}`,
      `🎲 Dés de vie: ${hitDiceStatus}`,
    ].join('\n'),
    inline: false,
  });
  
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('rest:short')
      .setLabel('Repos court (1h)')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('☕'),
    new ButtonBuilder()
      .setCustomId('rest:long')
      .setLabel('Repos long (8h)')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🛏️'),
    new ButtonBuilder()
      .setCustomId('rest:cancel')
      .setLabel('Annuler')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('❌'),
  );
  
  await interaction.reply({
    embeds: [embed],
    components: [row],
  });
}

// ============================================================
// REPOS COURT
// ============================================================

async function doShortRest(interaction, character, zone, isUpdate = false) {
  const userId = interaction.user.id;
  
  // Vérifier le cooldown
  const lastRest = restCooldowns.get(`${userId}:short`);
  if (lastRest && Date.now() - lastRest < SHORT_REST_COOLDOWN) {
    const remaining = Math.ceil((SHORT_REST_COOLDOWN - (Date.now() - lastRest)) / 1000);
    const embed = errorEmbed('Trop tôt', `Vous devez attendre **${remaining}** secondes avant un autre repos court.`);
    return isUpdate 
      ? interaction.update({ embeds: [embed], components: [] })
      : interaction.reply({ embeds: [embed], ephemeral: true });
  }
  
  restCooldowns.set(`${userId}:short`, Date.now());
  
  const results = [];
  
  // Récupérer les capacités de repos court
  const charClass = character.class.toLowerCase();
  const classData = classAbilitiesData[charClass];
  
  if (classData?.abilities) {
    for (const [abilityId, ability] of Object.entries(classData.abilities)) {
      if (ability.rechargeOn === 'shortRest') {
        const stored = character.abilities?.find(a => a.id === abilityId);
        if (stored && stored.uses > 0) {
          stored.uses = 0;
          results.push(`⚡ **${ability.name}** rechargé`);
        }
      }
    }
  }
  
  // Récupérer les ressources de classe (Ki, etc.)
  if (classData?.resource?.rechargeOn === 'shortRest') {
    // Reset des utilisations liées à la ressource
    results.push(`✨ **${classData.resource.name}** restauré`);
  }
  
  await character.save();
  
  // Interface pour utiliser les dés de vie
  const hitDiceCurrent = character.hitDice?.current ?? character.level;
  const hitDiceMax = character.hitDice?.max ?? character.level;
  const needsHealing = character.hp.current < character.hp.max;
  
  const embed = createEmbed({
    title: '☕ Repos court (1h)',
    description: [
      `Vous prenez un repos d'une heure.`,
      '',
      results.length > 0 ? '**Récupérations:**\n' + results.join('\n') : '',
      '',
      needsHealing && hitDiceCurrent > 0
        ? `🎲 Vous avez **${hitDiceCurrent}** dé(s) de vie disponible(s) pour vous soigner.`
        : hitDiceCurrent === 0
          ? '🎲 Plus de dés de vie disponibles.'
          : '❤️ Vos PV sont déjà au maximum!',
    ].filter(Boolean).join('\n'),
    color: 0x6366F1,
  });
  
  // État actuel
  const hpStatus = hpBar(character.hp.current, character.hp.max, { compact: true });
  embed.addFields({
    name: '📊 État',
    value: [
      `❤️ PV: ${hpStatus}`,
      `🎲 Dés de vie: ${hitDiceCurrent}/${hitDiceMax}`,
    ].join('\n'),
    inline: false,
  });
  
  const components = [];
  
  if (needsHealing && hitDiceCurrent > 0) {
    components.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('rest:hitdie')
          .setLabel(`Utiliser un dé de vie (${character.hitDice?.type || 'd8'})`)
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎲'),
        new ButtonBuilder()
          .setCustomId('rest:cancel')
          .setLabel('Terminer')
          .setStyle(ButtonStyle.Secondary)
      )
    );
  }
  
  isUpdate 
    ? await interaction.update({ embeds: [embed], components })
    : await interaction.reply({ embeds: [embed], components });
}

// ============================================================
// UTILISER UN DÉ DE VIE
// ============================================================

async function useHitDie(interaction, character) {
  const hitDiceCurrent = character.hitDice?.current ?? character.level;
  
  if (hitDiceCurrent <= 0) {
    return interaction.reply({
      embeds: [errorEmbed('Plus de dés', 'Vous n\'avez plus de dés de vie.')],
      ephemeral: true,
    });
  }
  
  if (character.hp.current >= character.hp.max) {
    return interaction.reply({
      embeds: [errorEmbed('PV max', 'Vos PV sont déjà au maximum!')],
      ephemeral: true,
    });
  }
  
  // Lancer le dé de vie
  const hitDieType = character.hitDice?.type || 'd8';
  const conMod = Math.floor((character.attributes.con - 10) / 2);
  const hitDieRoll = roll(`1${hitDieType}`).total;
  const healing = Math.max(1, hitDieRoll + conMod);
  
  const oldHp = character.hp.current;
  character.hp.current = Math.min(character.hp.max, character.hp.current + healing);
  const actualHealing = character.hp.current - oldHp;
  
  // Décrémenter les dés de vie
  if (!character.hitDice) {
    character.hitDice = { current: character.level, max: character.level, type: 'd8' };
  }
  character.hitDice.current--;
  
  await character.save();
  
  const embed = createEmbed({
    title: '🎲 Dé de vie utilisé',
    description: [
      `Résultat: **${hitDieRoll}** (1${hitDieType}) + **${conMod}** (CON) = **${healing}**`,
      '',
      `❤️ +**${actualHealing}** PV (${oldHp} → ${character.hp.current}/${character.hp.max})`,
    ].join('\n'),
    color: 0x22C55E,
  });
  
  // Encore des dés et besoin de soin?
  const canContinue = character.hitDice.current > 0 && character.hp.current < character.hp.max;
  
  embed.addFields({
    name: '📊 État',
    value: [
      `❤️ PV: ${hpBar(character.hp.current, character.hp.max, { compact: true })}`,
      `🎲 Dés de vie restants: ${character.hitDice.current}/${character.hitDice.max}`,
    ].join('\n'),
    inline: false,
  });
  
  const components = [];
  
  if (canContinue) {
    components.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('rest:hitdie')
          .setLabel(`Utiliser un autre dé`)
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎲'),
        new ButtonBuilder()
          .setCustomId('rest:cancel')
          .setLabel('Terminer')
          .setStyle(ButtonStyle.Secondary)
      )
    );
  }
  
  await interaction.update({ embeds: [embed], components });
}

// ============================================================
// REPOS LONG
// ============================================================

async function doLongRest(interaction, character, zone, isUpdate = false) {
  const userId = interaction.user.id;
  
  // Vérifier le cooldown
  const lastRest = restCooldowns.get(`${userId}:long`);
  if (lastRest && Date.now() - lastRest < LONG_REST_COOLDOWN) {
    const remaining = Math.ceil((LONG_REST_COOLDOWN - (Date.now() - lastRest)) / 1000);
    const embed = errorEmbed('Trop tôt', `Vous devez attendre **${remaining}** secondes avant un autre repos long.`);
    return isUpdate 
      ? interaction.update({ embeds: [embed], components: [] })
      : interaction.reply({ embeds: [embed], ephemeral: true });
  }
  
  restCooldowns.set(`${userId}:long`, Date.now());
  
  const results = [];
  const oldHp = character.hp.current;
  
  // 1. Récupérer tous les PV
  character.hp.current = character.hp.max;
  if (oldHp < character.hp.max) {
    results.push(`❤️ PV restaurés: ${oldHp} → **${character.hp.max}**`);
  }
  
  // 2. Récupérer la moitié des dés de vie (minimum 1)
  if (!character.hitDice) {
    character.hitDice = { current: character.level, max: character.level, type: 'd8' };
  }
  const hitDiceToRecover = Math.max(1, Math.floor(character.hitDice.max / 2));
  const oldHitDice = character.hitDice.current;
  character.hitDice.current = Math.min(character.hitDice.max, character.hitDice.current + hitDiceToRecover);
  if (character.hitDice.current > oldHitDice) {
    results.push(`🎲 Dés de vie récupérés: +${character.hitDice.current - oldHitDice}`);
  }
  
  // 3. Récupérer tous les emplacements de sorts
  if (character.spellcasting?.spellSlots) {
    let slotsRecovered = false;
    for (const level of Object.keys(character.spellcasting.spellSlots)) {
      const slot = character.spellcasting.spellSlots[level];
      if (slot && slot.max && slot.current < slot.max) {
        slot.current = slot.max;
        slotsRecovered = true;
      }
    }
    if (slotsRecovered) {
      results.push(`✨ Emplacements de sorts restaurés`);
    }
  }
  
  // 4. Récupérer toutes les capacités
  const charClass = character.class.toLowerCase();
  const classData = classAbilitiesData[charClass];
  
  if (character.abilities?.length > 0) {
    let abilitiesRecovered = false;
    for (const stored of character.abilities) {
      if (stored.uses > 0) {
        stored.uses = 0;
        abilitiesRecovered = true;
      }
    }
    if (abilitiesRecovered) {
      results.push(`⚡ Capacités de classe restaurées`);
    }
  }
  
  // 5. Retirer les effets temporaires (futurs status effects)
  // TODO: Intégrer avec statusEffectService
  
  await character.save();
  
  const embed = createEmbed({
    title: '🛏️ Repos long (8h)',
    description: [
      `Vous passez une nuit de repos complète.`,
      '',
      '**Récupérations:**',
      results.length > 0 ? results.join('\n') : '*Vous étiez déjà en pleine forme!*',
    ].join('\n'),
    color: 0x22C55E,
  });
  
  // État final
  embed.addFields({
    name: '📊 État après repos',
    value: [
      `❤️ PV: **${character.hp.current}/${character.hp.max}**`,
      `🎲 Dés de vie: **${character.hitDice.current}/${character.hitDice.max}**`,
    ].join('\n'),
    inline: false,
  });
  
  // Conseil
  if (!zone?.safeZone) {
    embed.setFooter({ text: '⚠️ Attention: vous étiez dans une zone dangereuse!' });
  }
  
  isUpdate 
    ? await interaction.update({ embeds: [embed], components: [] })
    : await interaction.reply({ embeds: [embed] });
}
