/**
 * Commande /wallet - Gestion du porte-monnaie
 * Affiche le détail des devises et permet les conversions
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

// Taux de conversion D&D standard
// 1 pp = 10 po = 100 pa = 1000 pc
const CONVERSION_RATES = {
  platinum: { gold: 10, silver: 100, copper: 1000 },
  gold: { platinum: 0.1, silver: 10, copper: 100 },
  silver: { platinum: 0.01, gold: 0.1, copper: 10 },
  copper: { platinum: 0.001, gold: 0.01, silver: 0.1 },
};

const CURRENCY_NAMES = {
  platinum: { name: 'Platine', short: 'pp', emoji: '⚪' },
  gold: { name: 'Or', short: 'po', emoji: '🟡' },
  silver: { name: 'Argent', short: 'pa', emoji: '⚫' },
  copper: { name: 'Cuivre', short: 'pc', emoji: '🟤' },
};

export default {
  data: new SlashCommandBuilder()
    .setName('wallet')
    .setDescription('Affiche votre porte-monnaie et permet les conversions'),
  
  cooldown: 2,
  
  async execute(interaction) {
    const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    
    if (!character) {
      return interaction.reply({
        embeds: [errorEmbed('Pas de personnage', 'Créez un personnage avec `/create`.')],
        ephemeral: true,
      });
    }
    
    await showWallet(interaction, character);
  },
  
  async handleButton(interaction, client, params) {
    const [action, ...args] = params;
    const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    
    if (!character) return;
    
    switch (action) {
      case 'view':
        await showWallet(interaction, character, true);
        break;
      case 'consolidate':
        await consolidateCurrency(interaction, character);
        break;
      case 'split':
        await showSplitMenu(interaction, character);
        break;
    }
  },
  
  async handleSelectMenu(interaction, client, params) {
    const [menuType] = params;
    const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    
    if (!character) return;
    
    if (menuType === 'split') {
      const [from, to, amount] = interaction.values[0].split(':');
      await splitCurrency(interaction, character, from, to, parseInt(amount));
    }
  },
};

// ============================================================
// AFFICHAGE DU PORTE-MONNAIE
// ============================================================

async function showWallet(interaction, character, isUpdate = false) {
  const { gold } = character;
  
  // Calculer la valeur totale en pièces d'or
  const totalInGold = (
    gold.platinum * 10 +
    gold.gold +
    gold.silver / 10 +
    gold.copper / 100
  );
  
  // Calculer le poids (règle D&D: 50 pièces = 1 livre)
  const totalCoins = gold.platinum + gold.gold + gold.silver + gold.copper;
  const weight = (totalCoins / 50).toFixed(1);
  
  const embed = createEmbed({
    title: '💰 Porte-monnaie',
    description: `*Aventurier ${character.name}*`,
    color: 0xF59E0B,
    thumbnail: interaction.user.displayAvatarURL(),
  });
  
  // Affichage des devises
  const currencyDisplay = [
    `⚪ **Platine**: ${gold.platinum} pp`,
    `🟡 **Or**: ${gold.gold} po`,
    `⚫ **Argent**: ${gold.silver} pa`,
    `🟤 **Cuivre**: ${gold.copper} pc`,
  ].join('\n');
  
  embed.addFields(
    {
      name: '💵 Devises',
      value: currencyDisplay,
      inline: true,
    },
    {
      name: '📊 Statistiques',
      value: [
        `💰 Valeur totale: **${totalInGold.toFixed(2)} po**`,
        `⚖️ Poids: **${weight} lb**`,
        `🪙 Total pièces: **${totalCoins}**`,
      ].join('\n'),
      inline: true,
    }
  );
  
  // Statistiques de gain
  const earned = character.stats?.goldEarned || 0;
  const spent = character.stats?.goldSpent || 0;
  
  embed.addFields({
    name: '📈 Historique',
    value: [
      `⬆️ Total gagné: **${earned} po**`,
      `⬇️ Total dépensé: **${spent} po**`,
      `📊 Ratio: **${earned > 0 ? (spent / earned * 100).toFixed(0) : 0}%** dépensé`,
    ].join('\n'),
    inline: false,
  });
  
  // Taux de conversion
  embed.addFields({
    name: '📖 Taux de conversion',
    value: [
      '`1 pp = 10 po = 100 pa = 1000 pc`',
      '*Les conversions vers le haut arrondissent à l\'inférieur*',
    ].join('\n'),
    inline: false,
  });
  
  // Boutons
  const components = [];
  
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('wallet:consolidate')
      .setLabel('Consolider en or')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🟡')
      .setDisabled(gold.silver === 0 && gold.copper === 0),
    new ButtonBuilder()
      .setCustomId('wallet:split')
      .setLabel('Diviser')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('💱')
      .setDisabled(gold.platinum === 0 && gold.gold === 0 && gold.silver === 0),
  );
  
  components.push(row1);
  
  isUpdate
    ? await interaction.update({ embeds: [embed], components })
    : await interaction.reply({ embeds: [embed], components });
}

// ============================================================
// CONSOLIDATION
// ============================================================

async function consolidateCurrency(interaction, character) {
  const { gold } = character;
  
  // Convertir tout en cuivre d'abord
  let totalCopper = 
    gold.platinum * 1000 +
    gold.gold * 100 +
    gold.silver * 10 +
    gold.copper;
  
  // Reconvertir de manière optimale
  const newPlatinum = Math.floor(totalCopper / 1000);
  totalCopper %= 1000;
  
  const newGold = Math.floor(totalCopper / 100);
  totalCopper %= 100;
  
  const newSilver = Math.floor(totalCopper / 10);
  const newCopper = totalCopper % 10;
  
  // Sauvegarder
  const oldGold = { ...gold };
  
  character.gold.platinum = newPlatinum;
  character.gold.gold = newGold;
  character.gold.silver = newSilver;
  character.gold.copper = newCopper;
  
  await character.save();
  
  const embed = successEmbed(
    '💱 Consolidation terminée',
    [
      '**Avant:**',
      `⚪ ${oldGold.platinum} pp | 🟡 ${oldGold.gold} po | ⚫ ${oldGold.silver} pa | 🟤 ${oldGold.copper} pc`,
      '',
      '**Après:**',
      `⚪ ${newPlatinum} pp | 🟡 ${newGold} po | ⚫ ${newSilver} pa | 🟤 ${newCopper} pc`,
    ].join('\n')
  );
  
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('wallet:view')
      .setLabel('Retour')
      .setStyle(ButtonStyle.Secondary)
  );
  
  await interaction.update({ embeds: [embed], components: [row] });
}

// ============================================================
// MENU DE DIVISION
// ============================================================

async function showSplitMenu(interaction, character) {
  const { gold } = character;
  
  const embed = createEmbed({
    title: '💱 Diviser des pièces',
    description: 'Choisissez quelle conversion effectuer.\n*Les pièces de valeur supérieure sont converties en pièces de valeur inférieure.*',
    color: 0x3B82F6,
  });
  
  // Options de division disponibles
  const options = [];
  
  if (gold.platinum >= 1) {
    options.push({
      label: `1 Platine → 10 Or`,
      description: `Vous avez ${gold.platinum} pp`,
      value: 'platinum:gold:1',
      emoji: '⚪',
    });
  }
  
  if (gold.gold >= 1) {
    options.push({
      label: `1 Or → 10 Argent`,
      description: `Vous avez ${gold.gold} po`,
      value: 'gold:silver:1',
      emoji: '🟡',
    });
    
    if (gold.gold >= 10) {
      options.push({
        label: `10 Or → 100 Argent`,
        description: `Conversion en masse`,
        value: 'gold:silver:10',
        emoji: '🟡',
      });
    }
  }
  
  if (gold.silver >= 1) {
    options.push({
      label: `1 Argent → 10 Cuivre`,
      description: `Vous avez ${gold.silver} pa`,
      value: 'silver:copper:1',
      emoji: '⚫',
    });
    
    if (gold.silver >= 10) {
      options.push({
        label: `10 Argent → 100 Cuivre`,
        description: `Conversion en masse`,
        value: 'silver:copper:10',
        emoji: '⚫',
      });
    }
  }
  
  if (options.length === 0) {
    embed.setDescription('*Vous n\'avez pas de pièces à diviser.*');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('wallet:view')
        .setLabel('Retour')
        .setStyle(ButtonStyle.Secondary)
    );
    return interaction.update({ embeds: [embed], components: [row] });
  }
  
  const select = new StringSelectMenuBuilder()
    .setCustomId('wallet:split')
    .setPlaceholder('💱 Choisir une conversion...')
    .addOptions(options);
  
  const row1 = new ActionRowBuilder().addComponents(select);
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('wallet:view')
      .setLabel('Annuler')
      .setStyle(ButtonStyle.Secondary)
  );
  
  await interaction.update({ embeds: [embed], components: [row1, row2] });
}

// ============================================================
// DIVISION
// ============================================================

async function splitCurrency(interaction, character, from, to, amount) {
  const { gold } = character;
  
  // Vérifier les fonds
  if (gold[from] < amount) {
    return interaction.update({
      embeds: [errorEmbed('Fonds insuffisants', `Vous n'avez pas assez de ${CURRENCY_NAMES[from].name.toLowerCase()}.`)],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('wallet:view')
            .setLabel('Retour')
            .setStyle(ButtonStyle.Secondary)
        ),
      ],
    });
  }
  
  const rate = CONVERSION_RATES[from][to];
  const received = Math.floor(amount * rate);
  
  // Effectuer la conversion
  gold[from] -= amount;
  gold[to] += received;
  
  await character.save();
  
  const embed = successEmbed(
    '💱 Conversion effectuée',
    [
      `${CURRENCY_NAMES[from].emoji} -**${amount}** ${CURRENCY_NAMES[from].short}`,
      `${CURRENCY_NAMES[to].emoji} +**${received}** ${CURRENCY_NAMES[to].short}`,
    ].join('\n')
  );
  
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('wallet:view')
      .setLabel('Voir le porte-monnaie')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('wallet:split')
      .setLabel('Autre conversion')
      .setStyle(ButtonStyle.Secondary),
  );
  
  await interaction.update({ embeds: [embed], components: [row] });
}
