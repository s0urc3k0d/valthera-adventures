/**
 * Commande /craft - Système d'artisanat
 * Permet de fabriquer des objets à partir de matériaux
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
import { getItem } from '../../utils/itemService.js';
import { roll } from '../../utils/dice.js';
import recipesData from '../../data/recipes.json' assert { type: 'json' };

const ITEMS_PER_PAGE = 8;

export default {
  data: new SlashCommandBuilder()
    .setName('craft')
    .setDescription('Fabriquer des objets avec des matériaux')
    .addStringOption(opt =>
      opt.setName('recette')
        .setDescription('La recette à fabriquer')
        .setRequired(false)
        .setAutocomplete(true)
    ),
  
  cooldown: 3,
  
  async autocomplete(interaction) {
    const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    if (!character) return interaction.respond([]);
    
    const focusedValue = interaction.options.getFocused().toLowerCase();
    
    // Filtrer les recettes disponibles
    const availableRecipes = Object.values(recipesData.recipes)
      .filter(recipe => {
        // Vérifier le niveau requis
        if (recipe.requirements?.level && character.level < recipe.requirements.level) {
          return false;
        }
        // Filtrer par nom
        return recipe.name.toLowerCase().includes(focusedValue);
      })
      .slice(0, 25)
      .map(recipe => {
        const canCraft = hasAllMaterials(character, recipe);
        const emoji = canCraft ? '✅' : '❌';
        return {
          name: `${emoji} ${recipe.emoji || '📦'} ${recipe.name}`,
          value: recipe.id,
        };
      });
    
    await interaction.respond(availableRecipes);
  },
  
  async execute(interaction) {
    const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    
    if (!character) {
      return interaction.reply({
        embeds: [errorEmbed('Pas de personnage', 'Créez un personnage avec `/create`.')],
        ephemeral: true,
      });
    }
    
    const recipeId = interaction.options.getString('recette');
    
    if (!recipeId) {
      // Afficher le menu d'artisanat
      return showCraftingMenu(interaction, character, null, 0);
    }
    
    // Afficher les détails de la recette
    await showRecipeDetails(interaction, character, recipeId);
  },
  
  async handleButton(interaction, client, params) {
    const [action, ...args] = params;
    const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    
    if (!character) return;
    
    switch (action) {
      case 'menu': {
        const [category, pageStr] = args;
        await showCraftingMenu(interaction, character, category === 'all' ? null : category, parseInt(pageStr || '0'), true);
        break;
      }
      case 'recipe': {
        const [recipeId] = args;
        await showRecipeDetails(interaction, character, recipeId, true);
        break;
      }
      case 'craft': {
        const [recipeId] = args;
        await craftItem(interaction, character, recipeId);
        break;
      }
    }
  },
  
  async handleSelectMenu(interaction, client, params) {
    const [menuType] = params;
    const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    
    if (!character) return;
    
    if (menuType === 'category') {
      const category = interaction.values[0];
      await showCraftingMenu(interaction, character, category === 'all' ? null : category, 0, true);
    } else if (menuType === 'recipe') {
      const recipeId = interaction.values[0];
      await showRecipeDetails(interaction, character, recipeId, true);
    }
  },
};

// ============================================================
// MENU D'ARTISANAT
// ============================================================

async function showCraftingMenu(interaction, character, category = null, page = 0, isUpdate = false) {
  // Filtrer les recettes
  let recipes = Object.values(recipesData.recipes).filter(recipe => {
    // Vérifier le niveau requis
    if (recipe.requirements?.level && character.level < recipe.requirements.level) {
      return false;
    }
    // Filtrer par catégorie
    if (category && recipe.category !== category) {
      return false;
    }
    return true;
  });
  
  // Trier par catégorie puis par niveau
  recipes.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return (a.requirements?.level || 0) - (b.requirements?.level || 0);
  });
  
  const totalPages = Math.ceil(recipes.length / ITEMS_PER_PAGE);
  const pageRecipes = recipes.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  
  const embed = createEmbed({
    title: '⚒️ Artisanat',
    description: [
      `*Fabriquez des objets à partir de vos matériaux.*`,
      '',
      category ? `**Catégorie:** ${recipesData.categories[category]?.name || category}` : '**Toutes les catégories**',
    ].join('\n'),
    color: 0x8B5A2B,
    footer: { text: `Page ${page + 1}/${Math.max(1, totalPages)} • ${recipes.length} recettes disponibles` },
  });
  
  // Liste des recettes
  if (pageRecipes.length > 0) {
    const recipeList = pageRecipes.map(recipe => {
      const canCraft = hasAllMaterials(character, recipe);
      const statusEmoji = canCraft ? '✅' : '❌';
      const categoryInfo = recipesData.categories[recipe.category];
      
      return [
        `${statusEmoji} ${recipe.emoji || '📦'} **${recipe.name}**`,
        `   └ ${categoryInfo?.emoji || '📂'} ${categoryInfo?.name || recipe.category} | DC ${recipe.dc}`,
      ].join('\n');
    }).join('\n\n');
    
    embed.addFields({
      name: '📜 Recettes',
      value: recipeList,
      inline: false,
    });
  } else {
    embed.addFields({
      name: '📜 Recettes',
      value: '*Aucune recette disponible dans cette catégorie.*',
      inline: false,
    });
  }
  
  // Composants
  const components = [];
  
  // Menu de sélection de catégorie
  const categoryOptions = [
    { label: 'Toutes les catégories', value: 'all', emoji: '📂' },
    ...Object.entries(recipesData.categories).map(([id, cat]) => ({
      label: cat.name,
      value: id,
      emoji: cat.emoji,
      description: cat.description.substring(0, 50),
    })),
  ];
  
  components.push(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('craft:category')
        .setPlaceholder('📂 Filtrer par catégorie...')
        .addOptions(categoryOptions)
    )
  );
  
  // Menu de sélection de recette
  if (pageRecipes.length > 0) {
    const recipeOptions = pageRecipes.map(recipe => {
      const canCraft = hasAllMaterials(character, recipe);
      return {
        label: recipe.name,
        value: recipe.id,
        emoji: canCraft ? '✅' : '❌',
        description: `DC ${recipe.dc} | ${recipesData.categories[recipe.category]?.name || recipe.category}`,
      };
    });
    
    components.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('craft:recipe')
          .setPlaceholder('⚒️ Choisir une recette...')
          .addOptions(recipeOptions)
      )
    );
  }
  
  // Boutons de navigation
  const navButtons = [];
  
  if (page > 0) {
    navButtons.push(
      new ButtonBuilder()
        .setCustomId(`craft:menu:${category || 'all'}:${page - 1}`)
        .setLabel('◀️')
        .setStyle(ButtonStyle.Secondary)
    );
  }
  
  if (page < totalPages - 1) {
    navButtons.push(
      new ButtonBuilder()
        .setCustomId(`craft:menu:${category || 'all'}:${page + 1}`)
        .setLabel('▶️')
        .setStyle(ButtonStyle.Secondary)
    );
  }
  
  if (navButtons.length > 0) {
    components.push(new ActionRowBuilder().addComponents(navButtons));
  }
  
  isUpdate
    ? await interaction.update({ embeds: [embed], components })
    : await interaction.reply({ embeds: [embed], components });
}

// ============================================================
// DÉTAILS D'UNE RECETTE
// ============================================================

async function showRecipeDetails(interaction, character, recipeId, isUpdate = false) {
  const recipe = recipesData.recipes[recipeId];
  
  if (!recipe) {
    const embed = errorEmbed('Recette inconnue', 'Cette recette n\'existe pas.');
    return isUpdate
      ? interaction.update({ embeds: [embed], components: [] })
      : interaction.reply({ embeds: [embed], ephemeral: true });
  }
  
  // Vérifier le niveau requis
  if (recipe.requirements?.level && character.level < recipe.requirements.level) {
    const embed = errorEmbed('Niveau insuffisant', `Cette recette nécessite le niveau **${recipe.requirements.level}**.`);
    return isUpdate
      ? interaction.update({ embeds: [embed], components: [] })
      : interaction.reply({ embeds: [embed], ephemeral: true });
  }
  
  const resultItem = getItem(recipe.result);
  const categoryInfo = recipesData.categories[recipe.category];
  const canCraft = hasAllMaterials(character, recipe);
  
  // Calculer le bonus de compétence si applicable
  let skillBonus = 0;
  let skillName = 'Aucune';
  
  if (recipe.skill !== 'none') {
    const skillMod = getSkillModifier(character, recipe.skill);
    skillBonus = skillMod;
    skillName = getSkillName(recipe.skill);
  }
  
  const embed = createEmbed({
    title: `${recipe.emoji || '📦'} ${recipe.name}`,
    description: recipe.description,
    color: canCraft ? 0x22C55E : 0xEF4444,
  });
  
  // Informations sur le résultat
  embed.addFields({
    name: '📦 Résultat',
    value: [
      `${resultItem?.emoji || '📦'} **${resultItem?.name || recipe.result}** x${recipe.quantity}`,
      resultItem?.description ? `*${resultItem.description}*` : '',
    ].filter(Boolean).join('\n'),
    inline: false,
  });
  
  // Matériaux requis
  const materialsDisplay = recipe.materials.map(mat => {
    const item = getItem(mat.itemId);
    const owned = getOwnedQuantity(character, mat.itemId);
    const hasEnough = owned >= mat.quantity;
    const emoji = hasEnough ? '✅' : '❌';
    
    return `${emoji} ${item?.emoji || '📦'} **${item?.name || mat.itemId}** - ${owned}/${mat.quantity}`;
  }).join('\n');
  
  embed.addFields({
    name: '📋 Matériaux requis',
    value: materialsDisplay,
    inline: true,
  });
  
  // Informations de fabrication
  embed.addFields({
    name: '⚙️ Fabrication',
    value: [
      `${categoryInfo?.emoji || '📂'} **Catégorie:** ${categoryInfo?.name || recipe.category}`,
      `🎯 **Compétence:** ${skillName}`,
      `📊 **DC:** ${recipe.dc}`,
      `🎲 **Bonus:** +${skillBonus}`,
      `⏱️ **Temps:** ${formatTime(recipe.time)}`,
    ].join('\n'),
    inline: true,
  });
  
  // Chance de succès
  const successChance = calculateSuccessChance(recipe.dc, skillBonus);
  embed.addFields({
    name: '📈 Chances de succès',
    value: [
      `🎲 **${successChance}%** de réussite`,
      `*Jet: 1d20 + ${skillBonus} ≥ ${recipe.dc}*`,
    ].join('\n'),
    inline: false,
  });
  
  // Boutons
  const buttons = [
    new ButtonBuilder()
      .setCustomId(`craft:craft:${recipeId}`)
      .setLabel('Fabriquer')
      .setStyle(ButtonStyle.Success)
      .setEmoji('⚒️')
      .setDisabled(!canCraft),
    new ButtonBuilder()
      .setCustomId('craft:menu:all:0')
      .setLabel('Retour')
      .setStyle(ButtonStyle.Secondary),
  ];
  
  const row = new ActionRowBuilder().addComponents(buttons);
  
  isUpdate
    ? await interaction.update({ embeds: [embed], components: [row] })
    : await interaction.reply({ embeds: [embed], components: [row] });
}

// ============================================================
// FABRICATION
// ============================================================

async function craftItem(interaction, character, recipeId) {
  const recipe = recipesData.recipes[recipeId];
  
  if (!recipe) {
    return interaction.update({
      embeds: [errorEmbed('Recette inconnue', 'Cette recette n\'existe pas.')],
      components: [],
    });
  }
  
  // Vérifier les matériaux
  if (!hasAllMaterials(character, recipe)) {
    return interaction.update({
      embeds: [errorEmbed('Matériaux manquants', 'Vous n\'avez pas tous les matériaux nécessaires.')],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`craft:recipe:${recipeId}`)
            .setLabel('Retour')
            .setStyle(ButtonStyle.Secondary)
        ),
      ],
    });
  }
  
  // Consommer les matériaux
  for (const mat of recipe.materials) {
    const invIndex = character.inventory.findIndex(i => i.itemId === mat.itemId);
    if (invIndex !== -1) {
      character.inventory[invIndex].quantity -= mat.quantity;
      if (character.inventory[invIndex].quantity <= 0) {
        character.inventory.splice(invIndex, 1);
      }
    }
  }
  
  // Calculer le bonus de compétence
  let skillBonus = 0;
  if (recipe.skill !== 'none') {
    skillBonus = getSkillModifier(character, recipe.skill);
  }
  
  // Effectuer le jet
  const diceRoll = roll('1d20');
  const total = diceRoll.total + skillBonus;
  const success = total >= recipe.dc;
  
  let embed;
  
  if (success) {
    // Ajouter l'item fabriqué
    const existingItem = character.inventory.find(i => i.itemId === recipe.result && !i.equipped);
    if (existingItem) {
      existingItem.quantity += recipe.quantity;
    } else {
      character.inventory.push({
        itemId: recipe.result,
        quantity: recipe.quantity,
        equipped: false,
      });
    }
    
    // Stats
    character.stats.itemsCrafted = (character.stats.itemsCrafted || 0) + recipe.quantity;
    
    const resultItem = getItem(recipe.result);
    
    embed = successEmbed(
      '⚒️ Fabrication réussie!',
      [
        `🎲 Jet: **${diceRoll.total}** + ${skillBonus} = **${total}** vs DC ${recipe.dc}`,
        '',
        `Vous avez fabriqué:`,
        `${resultItem?.emoji || '📦'} **${resultItem?.name || recipe.result}** x${recipe.quantity}`,
      ].join('\n')
    );
  } else {
    // Échec - matériaux perdus mais on récupère 50% (arrondi inférieur)
    const recoveredMaterials = [];
    
    for (const mat of recipe.materials) {
      const recovered = Math.floor(mat.quantity * 0.5);
      if (recovered > 0) {
        const existingItem = character.inventory.find(i => i.itemId === mat.itemId);
        if (existingItem) {
          existingItem.quantity += recovered;
        } else {
          character.inventory.push({
            itemId: mat.itemId,
            quantity: recovered,
            equipped: false,
          });
        }
        
        const item = getItem(mat.itemId);
        recoveredMaterials.push(`${item?.emoji || '📦'} ${item?.name || mat.itemId} x${recovered}`);
      }
    }
    
    embed = errorEmbed(
      '❌ Échec de fabrication',
      [
        `🎲 Jet: **${diceRoll.total}** + ${skillBonus} = **${total}** vs DC ${recipe.dc}`,
        '',
        `La fabrication a échoué et vos matériaux ont été endommagés.`,
        '',
        recoveredMaterials.length > 0
          ? `♻️ **Matériaux récupérés (50%):**\n${recoveredMaterials.join('\n')}`
          : '*Aucun matériau récupéré.*',
      ].join('\n')
    );
  }
  
  await character.save();
  
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`craft:recipe:${recipeId}`)
      .setLabel('Refaire')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🔄'),
    new ButtonBuilder()
      .setCustomId('craft:menu:all:0')
      .setLabel('Menu')
      .setStyle(ButtonStyle.Secondary),
  );
  
  await interaction.update({ embeds: [embed], components: [row] });
}

// ============================================================
// UTILITAIRES
// ============================================================

function hasAllMaterials(character, recipe) {
  return recipe.materials.every(mat => {
    return getOwnedQuantity(character, mat.itemId) >= mat.quantity;
  });
}

function getOwnedQuantity(character, itemId) {
  const item = character.inventory.find(i => i.itemId === itemId);
  return item?.quantity || 0;
}

function getSkillModifier(character, skillName) {
  // Mapping des compétences vers les attributs
  const skillAttributes = {
    acrobatics: 'dex',
    animal_handling: 'wis',
    arcana: 'int',
    athletics: 'str',
    deception: 'cha',
    history: 'int',
    insight: 'wis',
    intimidation: 'cha',
    investigation: 'int',
    medicine: 'wis',
    nature: 'int',
    perception: 'wis',
    performance: 'cha',
    persuasion: 'cha',
    religion: 'int',
    sleight_of_hand: 'dex',
    stealth: 'dex',
    survival: 'wis',
  };
  
  const attr = skillAttributes[skillName] || 'int';
  const attrValue = character.attributes?.[attr] || 10;
  const modifier = Math.floor((attrValue - 10) / 2);
  
  // Vérifier si le personnage est compétent
  const isProficient = character.skills?.includes(skillName) || false;
  const profBonus = isProficient ? Math.ceil(character.level / 4) + 1 : 0;
  
  return modifier + profBonus;
}

function getSkillName(skill) {
  const names = {
    acrobatics: 'Acrobatie',
    animal_handling: 'Dressage',
    arcana: 'Arcanes',
    athletics: 'Athlétisme',
    deception: 'Tromperie',
    history: 'Histoire',
    insight: 'Perspicacité',
    intimidation: 'Intimidation',
    investigation: 'Investigation',
    medicine: 'Médecine',
    nature: 'Nature',
    perception: 'Perception',
    performance: 'Représentation',
    persuasion: 'Persuasion',
    religion: 'Religion',
    sleight_of_hand: 'Escamotage',
    stealth: 'Discrétion',
    survival: 'Survie',
    none: 'Aucune',
  };
  return names[skill] || skill;
}

function calculateSuccessChance(dc, bonus) {
  // Nombre minimum à obtenir sur 1d20 pour réussir
  const minRoll = dc - bonus;
  
  if (minRoll <= 1) return 100; // 1 réussit toujours (nat 1 = échec automatique en D&D, mais simplifions)
  if (minRoll > 20) return 0; // Impossible
  
  // Chance = (21 - minRoll) * 5%
  return Math.max(0, Math.min(100, (21 - minRoll) * 5));
}

function formatTime(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}
