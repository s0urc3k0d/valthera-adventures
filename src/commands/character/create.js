import { 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import Character from '../../models/Character.js';
import { errorEmbed } from '../../utils/embedBuilder.js';
import { card, hpBar, separator, getRarityEmoji } from '../../utils/ui.js';
import { getItem, getStarterKit } from '../../utils/itemService.js';
import logger from '../../utils/logger.js';
import racesData from '../../data/races.json' assert { type: 'json' };
import classesData from '../../data/classes.json' assert { type: 'json' };
import backgroundsData from '../../data/backgrounds.json' assert { type: 'json' };
import skillsData from '../../data/skills.json' assert { type: 'json' };
import { creationSessions } from '../../utils/sessionManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('create')
    .setDescription('Créer un nouveau personnage'),
  
  cooldown: 10,
  
  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guildId;
    
    // Vérifier si le joueur a déjà un personnage
    const existingCharacter = await Character.findByDiscordId(userId, guildId);
    if (existingCharacter) {
      return interaction.reply({
        embeds: [errorEmbed(
          'Personnage existant',
          `Vous avez déjà un personnage: **${existingCharacter.name}**\nUtilisez \`/sheet\` pour voir votre feuille de personnage.`
        )],
        ephemeral: true,
      });
    }
    
    // Initialiser l'état de création avec sessionManager (TTL automatique)
    creationSessions.set(userId, {
      odUserId: userId,
      odGuildId: guildId,
      step: 'intro',
      name: null,
      race: null,
      subrace: null,
      class: null,
      background: null,
      attributes: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
      pointsRemaining: 27,
      skills: [],
      skillsRemaining: 0,
      startingGear: 'standard',
    });
    
    // Afficher l'introduction/tutoriel
    await interaction.reply({
      embeds: [createIntroEmbed()],
      components: [createIntroButtons()],
      ephemeral: true,
    });
  },
  
  // Gestion des modaux
  async handleModal(interaction, client, params) {
    const userId = interaction.user.id;
    const state = creationSessions.get(userId);
    
    if (!state) {
      return interaction.reply({
        embeds: [errorEmbed('Session expirée', 'Veuillez recommencer avec `/create`.')],
        ephemeral: true,
      });
    }
    
    // Vérification du propriétaire
    if (state.odUserId !== interaction.user.id) {
      return interaction.reply({
        embeds: [errorEmbed('Session invalide', 'Cette session ne vous appartient pas.')],
        ephemeral: true,
      });
    }
    
    if (params[0] === 'name') {
      const name = interaction.fields.getTextInputValue('characterName').trim();
      
      // Validation du nom
      if (!/^[a-zA-ZÀ-ÿ\s'-]{2,32}$/.test(name)) {
        return interaction.reply({
          embeds: [errorEmbed(
            'Nom invalide',
            'Le nom doit contenir uniquement des lettres, espaces, apostrophes ou tirets (2-32 caractères).'
          )],
          ephemeral: true,
        });
      }
      
      state.name = name;
      state.step = 'race';
      
      await interaction.reply({
        embeds: [createRaceSelectionEmbed()],
        components: [createRaceSelectMenu()],
        ephemeral: true,
      });
    }
  },
  
  // Gestion des menus de sélection
  async handleSelectMenu(interaction, client, params) {
    const userId = interaction.user.id;
    const state = creationSessions.get(userId);
    
    logger.debug(`handleSelectMenu appelé: params=${JSON.stringify(params)}, userId=${userId}, hasState=${!!state}`);
    
    if (!state) {
      return interaction.reply({
        embeds: [errorEmbed('Session expirée', 'Veuillez recommencer avec `/create`.')],
        ephemeral: true,
      });
    }
    
    // Vérification du propriétaire
    if (state.odUserId !== interaction.user.id) {
      return interaction.reply({
        embeds: [errorEmbed('Session invalide', 'Cette session ne vous appartient pas.')],
        ephemeral: true,
      });
    }
    
    const [menuType] = params;
    const selected = interaction.values[0];
    
    logger.debug(`Menu type: ${menuType}, selected: ${selected}, currentStep: ${state.step}`);
    
    switch (menuType) {
      case 'race':
        state.race = selected;
        state.step = 'subrace';
        
        const race = racesData[selected];
        if (race.subraces && Object.keys(race.subraces).length > 0) {
          await interaction.update({
            embeds: [createSubraceSelectionEmbed(race)],
            components: [createSubraceSelectMenu(race)],
          });
        } else {
          state.step = 'class';
          await interaction.update({
            embeds: [createClassSelectionEmbed()],
            components: createClassSelectMenus(),
          });
        }
        break;
        
      case 'subrace':
        state.subrace = selected;
        state.step = 'class';
        await interaction.update({
          embeds: [createClassSelectionEmbed()],
          components: createClassSelectMenus(),
        });
        break;
        
      case 'class':
        state.class = selected;
        state.step = 'background';
        await interaction.update({
          embeds: [createBackgroundSelectionEmbed()],
          components: createBackgroundSelectMenus(),
        });
        break;
        
      case 'background':
        state.background = selected;
        state.step = 'attributes';
        await interaction.update({
          embeds: [createAttributeEmbed(state)],
          components: createAttributeComponents(state),
        });
        break;
        
      case 'skills':
        state.skills = interaction.values;
        if (state.skills.length === state.skillsRemaining) {
          state.step = 'equipment';
          await interaction.update({
            embeds: [createEquipmentChoiceEmbed(state)],
            components: createEquipmentButtons(),
          });
        } else {
          await interaction.update({
            embeds: [createSkillSelectionEmbed(state)],
            components: createSkillSelectMenu(state),
          });
        }
        break;
    }
  },
  
  // Gestion des boutons
  async handleButton(interaction, client, params) {
    const userId = interaction.user.id;
    const state = creationSessions.get(userId);
    
    if (!state) {
      return interaction.reply({
        embeds: [errorEmbed('Session expirée', 'Veuillez recommencer avec `/create`.')],
        ephemeral: true,
      });
    }
    
    // Vérification du propriétaire
    if (state.odUserId !== interaction.user.id) {
      return interaction.reply({
        embeds: [errorEmbed('Session invalide', 'Cette session ne vous appartient pas.')],
        ephemeral: true,
      });
    }
    
    const [action, param] = params;
    
    switch (action) {
      case 'start':
        const modal = new ModalBuilder()
          .setCustomId('create:name')
          .setTitle('🎭 Nom de Personnage');
        
        const nameInput = new TextInputBuilder()
          .setCustomId('characterName')
          .setLabel('Comment s\'appelle votre héros?')
          .setPlaceholder('Ex: Thorin, Elara, Zephyr...')
          .setStyle(TextInputStyle.Short)
          .setMinLength(2)
          .setMaxLength(32)
          .setRequired(true);
        
        modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
        await interaction.showModal(modal);
        break;
        
      case 'tutorial':
        await interaction.update({
          embeds: [createTutorialEmbed()],
          components: [createTutorialButtons()],
        });
        break;
        
      case 'tutorial_back':
        await interaction.update({
          embeds: [createIntroEmbed()],
          components: [createIntroButtons()],
        });
        break;
        
      case 'attr':
        await handleAttributeChange(interaction, state, param);
        break;
        
      case 'attr_confirm':
        if (state.pointsRemaining > 0) {
          return interaction.reply({
            content: `⚠️ Il vous reste **${state.pointsRemaining}** points à dépenser!`,
            ephemeral: true,
          });
        }
        const cls = classesData[state.class];
        state.skillsRemaining = cls.numSkills || 2;
        state.step = 'skills';
        await interaction.update({
          embeds: [createSkillSelectionEmbed(state)],
          components: createSkillSelectMenu(state),
        });
        break;
        
      case 'equip':
        state.startingGear = param;
        state.step = 'confirm';
        await interaction.update({
          embeds: [createConfirmationEmbed(state)],
          components: createConfirmationButtons(),
        });
        break;
        
      case 'confirm':
        await finalizeCharacter(interaction, state);
        break;
        
      case 'cancel':
        creationSessions.delete(userId);
        await interaction.update({
          embeds: [errorEmbed('❌ Création annulée', 'Vous pouvez recommencer avec `/create`.')],
          components: [],
        });
        break;
    }
  },
};

// ============================================================
// FONCTIONS D'AFFICHAGE
// ============================================================

function createIntroEmbed() {
  return card({
    theme: 'quest',
    title: '🌟 Bienvenue à Valthera!',
    description: [
      '```',
      '  ⚔️ CRÉATION DE PERSONNAGE ⚔️',
      '```',
      '',
      'Vous êtes sur le point de créer votre héros dans le monde de **Valthera**.',
      'Un royaume où l\'aventure vous attend à chaque tournant!',
      '',
      separator('dots'),
      '',
      '📋 **Étapes de création:**',
      '',
      '1️⃣ **Nom** - Choisissez un nom héroïque',
      '2️⃣ **Race** - Humain, Elfe, Nain...',
      '3️⃣ **Classe** - Guerrier, Magicien, Roublard...',
      '4️⃣ **Historique** - Votre passé et origine',
      '5️⃣ **Attributs** - Force, Dextérité, etc.',
      '6️⃣ **Compétences** - Vos talents spéciaux',
      '7️⃣ **Équipement** - Armes et armures de départ',
      '',
      separator('dots'),
      '',
      '💡 *Nouveau dans les RPG? Cliquez sur "Guide" pour un tutoriel!*',
    ].join('\n'),
  });
}

function createIntroButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('create:start')
      .setLabel('Commencer')
      .setEmoji('🎭')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('create:tutorial')
      .setLabel('Guide du Débutant')
      .setEmoji('📖')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('create:cancel')
      .setLabel('Annuler')
      .setStyle(ButtonStyle.Danger),
  );
}

function createTutorialEmbed() {
  return card({
    theme: 'info',
    title: '📖 Guide du Débutant',
    description: [
      '**🎭 Qu\'est-ce qu\'un RPG?**',
      'Un jeu de rôle où vous incarnez un personnage dans un monde fantastique.',
      '',
      separator('dots'),
      '',
      '**🧬 La Race**',
      'Détermine vos origines et bonus naturels:',
      '• `Humain` - Polyvalent, +1 à tout',
      '• `Elfe` - Agile, vision dans le noir',
      '• `Nain` - Robuste, résistant',
      '',
      '**⚔️ La Classe**',
      'Détermine votre style de jeu:',
      '• `Guerrier` - Combat au corps à corps',
      '• `Magicien` - Sorts puissants',
      '• `Roublard` - Discrétion et ruse',
      '',
      '**📊 Les Attributs**',
      '• `FOR` - Force physique, dégâts mêlée',
      '• `DEX` - Agilité, esquive, attaques à distance',
      '• `CON` - Endurance, points de vie',
      '• `INT` - Intelligence, sorts de magicien',
      '• `SAG` - Sagesse, perception, sorts de clerc',
      '• `CHA` - Charisme, persuasion, sorts de barde',
      '',
      '💡 *Conseil: Montez les attributs liés à votre classe!*',
    ].join('\n'),
  });
}

function createTutorialButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('create:tutorial_back')
      .setLabel('Retour')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('create:start')
      .setLabel('Commencer!')
      .setEmoji('🎭')
      .setStyle(ButtonStyle.Success),
  );
}

function createRaceSelectionEmbed() {
  const raceList = Object.values(racesData)
    .map(r => `${r.emoji} **${r.name}**\n┗ *${r.description.substring(0, 60)}...*`)
    .join('\n\n');
  
  return card({
    theme: 'primary',
    title: '🧬 Étape 1/7 - Choisissez votre Race',
    description: [
      'Votre race détermine vos traits innés et bonus raciaux.',
      '',
      separator('line'),
      '',
      raceList,
    ].join('\n'),
  });
}

function createRaceSelectMenu() {
  const options = Object.values(racesData).slice(0, 25).map(race => ({
    label: race.name,
    value: race.id,
    description: formatBonus(race.abilityScoreIncrease),
    emoji: race.emoji,
  }));
  
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('create:race')
      .setPlaceholder('🧬 Sélectionnez une race...')
      .addOptions(options)
  );
}

function createSubraceSelectionEmbed(race) {
  const subraceList = Object.values(race.subraces)
    .map(sr => `${sr.emoji || race.emoji} **${sr.name}**\n┗ *${sr.description}*`)
    .join('\n\n');
  
  return card({
    theme: 'primary',
    title: `🧬 Sous-race de ${race.name}`,
    description: [
      `Choisissez votre variante de ${race.name}.`,
      '',
      separator('line'),
      '',
      subraceList,
    ].join('\n'),
  });
}

function createSubraceSelectMenu(race) {
  const options = Object.values(race.subraces).map(sr => ({
    label: sr.name,
    value: sr.id,
    description: formatBonus(sr.abilityScoreIncrease) || race.name,
    emoji: sr.emoji || race.emoji,
  }));
  
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('create:subrace')
      .setPlaceholder('🧬 Sélectionnez une sous-race...')
      .addOptions(options)
  );
}

function createClassSelectionEmbed() {
  const categories = {
    'Combattants': ['fighter', 'barbarian', 'paladin', 'ranger', 'monk'],
    'Lanceurs de sorts': ['wizard', 'sorcerer', 'warlock', 'cleric', 'druid', 'bard'],
    'Spécialistes': ['rogue'],
  };
  
  let description = 'Votre classe détermine vos capacités et style de combat.\n\n';
  
  for (const [category, classIds] of Object.entries(categories)) {
    const classes = classIds
      .filter(id => classesData[id])
      .map(id => {
        const c = classesData[id];
        return `${c.emoji} **${c.name}** - ${c.hitDie}`;
      });
    
    if (classes.length > 0) {
      description += `**${category}**\n${classes.join('\n')}\n\n`;
    }
  }
  
  return card({
    theme: 'combat',
    title: '⚔️ Étape 2/7 - Choisissez votre Classe',
    description,
  });
}

function createClassSelectMenus() {
  const options = Object.values(classesData).slice(0, 25).map(cls => ({
    label: cls.name,
    value: cls.id,
    description: `${cls.hitDie} | ${cls.description.substring(0, 50)}...`,
    emoji: cls.emoji,
  }));
  
  return [new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('create:class')
      .setPlaceholder('⚔️ Sélectionnez une classe...')
      .addOptions(options)
  )];
}

function createBackgroundSelectionEmbed() {
  const bgList = Object.values(backgroundsData)
    .slice(0, 12)
    .map(bg => `${bg.emoji} **${bg.name}** - *${bg.description.substring(0, 50)}...*`)
    .join('\n');
  
  return card({
    theme: 'quest',
    title: '📜 Étape 3/7 - Choisissez votre Historique',
    description: [
      'Votre historique définit votre passé et vous donne des compétences bonus.',
      '',
      separator('line'),
      '',
      bgList,
    ].join('\n'),
  });
}

function createBackgroundSelectMenus() {
  const options = Object.values(backgroundsData).slice(0, 25).map(bg => ({
    label: bg.name,
    value: bg.id,
    description: bg.skillProficiencies.map(s => skillsData[s]?.name || s).join(', '),
    emoji: bg.emoji,
  }));
  
  return [new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('create:background')
      .setPlaceholder('📜 Sélectionnez un historique...')
      .addOptions(options)
  )];
}

function createAttributeEmbed(state) {
  const race = racesData[state.race];
  const subrace = state.subrace ? race.subraces[state.subrace] : null;
  const cls = classesData[state.class];
  
  const racialBonus = { ...race.abilityScoreIncrease };
  if (subrace?.abilityScoreIncrease) {
    for (const [attr, bonus] of Object.entries(subrace.abilityScoreIncrease)) {
      racialBonus[attr] = (racialBonus[attr] || 0) + bonus;
    }
  }
  
  const attrConfig = [
    { id: 'str', name: 'Force', emoji: '💪', recommended: cls.primaryAbility?.includes('str') },
    { id: 'dex', name: 'Dextérité', emoji: '🏃', recommended: cls.primaryAbility?.includes('dex') },
    { id: 'con', name: 'Constitution', emoji: '🫀', recommended: true },
    { id: 'int', name: 'Intelligence', emoji: '🧠', recommended: cls.primaryAbility?.includes('int') },
    { id: 'wis', name: 'Sagesse', emoji: '👁️', recommended: cls.primaryAbility?.includes('wis') },
    { id: 'cha', name: 'Charisme', emoji: '💬', recommended: cls.primaryAbility?.includes('cha') },
  ];
  
  const attrList = attrConfig.map(attr => {
    const value = state.attributes[attr.id];
    const bonus = racialBonus[attr.id] || 0;
    const total = value + bonus;
    const mod = Math.floor((total - 10) / 2);
    const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
    const bonusStr = bonus > 0 ? ` *(+${bonus})*` : '';
    const recStr = attr.recommended ? ' ⭐' : '';
    
    return `${attr.emoji} **${attr.name}:** ${value}${bonusStr} → **${total}** (${modStr})${recStr}`;
  }).join('\n');
  
  const pointsBar = createPointsBar(state.pointsRemaining, 27);
  
  return card({
    theme: 'primary',
    title: '📊 Étape 4/7 - Répartissez vos Attributs',
    description: [
      `**${state.name}** - ${race.name} ${cls.name}`,
      '',
      separator('line'),
      '',
      `**Points restants:** ${state.pointsRemaining}/27`,
      pointsBar,
      '',
      attrList,
      '',
      separator('dots'),
      '⭐ = Attribut recommandé pour votre classe',
      '*Coût: 8→13 = 1pt | 14→15 = 2pts*',
    ].join('\n'),
  });
}

function createAttributeComponents(state) {
  const attrs = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const labels = ['FOR', 'DEX', 'CON', 'INT', 'SAG', 'CHA'];
  const emojis = ['💪', '🏃', '🫀', '🧠', '👁️', '💬'];
  
  const rows = [];
  
  // Ligne 1: STR, DEX, CON (boutons - et + seulement, 2 boutons par attribut = 6 max, mais on fait 5)
  // Nouvelle approche: 2 lignes avec 3 attributs chacune, format compact
  // [STR-] [STR: 8] [STR+] [DEX-] [DEX: 8] -> 5 boutons max par ligne impossible avec ce format
  
  // Solution: Utiliser un format avec moins de boutons
  // Ligne 1: FOR- FOR+ DEX- DEX+ CON- (5)
  // Ligne 2: CON+ INT- INT+ WIS- WIS+ (5)  
  // Ligne 3: CHA- CHA+ [valeurs dans embed]
  // Ou mieux: Utiliser des boutons avec emoji + label combinés
  
  // Format alternatif: 3 lignes de 4 boutons (- attr + | - attr +)
  // Ligne 1: FOR- FOR+ | DEX- DEX+ (4 boutons)
  // Ligne 2: CON- CON+ | INT- INT+ (4 boutons)
  // Ligne 3: SAG- SAG+ | CHA- CHA+ (4 boutons)
  // Ligne 4: Annuler | Continuer
  
  for (let i = 0; i < 3; i++) {
    const row = new ActionRowBuilder();
    for (let j = 0; j < 2; j++) {
      const idx = i * 2 + j;
      const attr = attrs[idx];
      const value = state.attributes[attr];
      const cost = getAttributeCost(value, true);
      
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`create:attr:${attr}_down`)
          .setLabel(`${labels[idx]} −`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(value <= 8),
        new ButtonBuilder()
          .setCustomId(`create:attr:${attr}_up`)
          .setLabel(`${labels[idx]} ${value} +`)
          .setStyle(value > 8 ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(value >= 15 || state.pointsRemaining < cost)
      );
    }
    rows.push(row);
  }
  
  rows.push(new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('create:cancel')
      .setLabel('Annuler')
      .setEmoji('❌')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('create:attr_confirm')
      .setLabel('Continuer')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success)
      .setDisabled(state.pointsRemaining > 0)
  ));
  
  return rows;
}

function createSkillSelectionEmbed(state) {
  const cls = classesData[state.class];
  const bg = backgroundsData[state.background];
  
  const bgSkills = bg.skillProficiencies.map(s => skillsData[s]?.name || s);
  
  const selectedStr = state.skills.length > 0
    ? state.skills.map(s => skillsData[s]?.name || s).join(', ')
    : '*Aucune sélectionnée*';
  
  return card({
    theme: 'info',
    title: '🎯 Étape 5/7 - Choisissez vos Compétences',
    description: [
      `**${cls.name}** - Choisissez **${state.skillsRemaining}** compétences`,
      '',
      separator('line'),
      '',
      `📜 **Compétences de l'historique (${bg.name}):**`,
      `┗ ${bgSkills.join(', ')}`,
      '',
      `⚔️ **Compétences sélectionnées:**`,
      `┗ ${selectedStr}`,
      '',
      separator('dots'),
      '*Sélectionnez les compétences dans le menu ci-dessous*',
    ].join('\n'),
  });
}

function createSkillSelectMenu(state) {
  const cls = classesData[state.class];
  const bg = backgroundsData[state.background];
  
  const options = cls.skillChoices
    .filter(s => !bg.skillProficiencies.includes(s))
    .map(skillId => {
      const skill = skillsData[skillId];
      if (!skill) return null;
      return {
        label: skill.name,
        value: skillId,
        description: `${skill.ability.toUpperCase()} - ${skill.description.substring(0, 50)}`,
        emoji: skill.emoji,
        default: state.skills.includes(skillId),
      };
    })
    .filter(Boolean);
  
  return [new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('create:skills')
      .setPlaceholder(`🎯 Choisissez ${state.skillsRemaining} compétence(s)...`)
      .setMinValues(state.skillsRemaining)
      .setMaxValues(state.skillsRemaining)
      .addOptions(options)
  )];
}

function createEquipmentChoiceEmbed(state) {
  const cls = classesData[state.class];
  const starterKit = getStarterKit(state.class);
  
  const goldRange = cls.startingGold || { min: 50, max: 100 };
  
  let equipmentList = '*Équipement standard non disponible*';
  if (starterKit) {
    equipmentList = starterKit.map(itemId => {
      const item = getItem(itemId);
      return item ? `• ${getRarityEmoji(item.rarity)} ${item.name}` : `• ${itemId}`;
    }).join('\n');
  }
  
  return card({
    theme: 'inventory',
    title: '🎒 Étape 6/7 - Équipement de Départ',
    description: [
      `Choisissez comment équiper votre **${cls.name}**.`,
      '',
      separator('line'),
      '',
      '**📦 Option A - Équipement Standard:**',
      equipmentList,
      '',
      separator('dots'),
      '',
      `**💰 Option B - Or de Départ:**`,
      `Recevez **${goldRange.min}-${goldRange.max} PO** pour acheter votre équipement.`,
      '*Vous commencerez sans équipement mais avec plus de liberté.*',
    ].join('\n'),
  });
}

function createEquipmentButtons() {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('create:equip:standard')
      .setLabel('Équipement Standard')
      .setEmoji('📦')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('create:equip:gold')
      .setLabel('Or de Départ')
      .setEmoji('💰')
      .setStyle(ButtonStyle.Secondary),
  )];
}

function createConfirmationEmbed(state) {
  const race = racesData[state.race];
  const subrace = state.subrace ? race.subraces[state.subrace] : null;
  const cls = classesData[state.class];
  const bg = backgroundsData[state.background];
  
  const finalAttributes = calculateFinalAttributes(state);
  
  const conMod = Math.floor((finalAttributes.con - 10) / 2);
  const dexMod = Math.floor((finalAttributes.dex - 10) / 2);
  const hitDieMax = parseInt(cls.hitDie.substring(1));
  const maxHP = hitDieMax + conMod;
  const baseAC = 10 + dexMod;
  
  const allSkills = [...bg.skillProficiencies, ...state.skills]
    .map(s => skillsData[s]?.name || s);
  
  const attrDisplay = Object.entries(finalAttributes)
    .map(([attr, val]) => {
      const mod = Math.floor((val - 10) / 2);
      return `${attr.toUpperCase()}: **${val}** (${mod >= 0 ? '+' : ''}${mod})`;
    })
    .join(' | ');
  
  return card({
    theme: 'success',
    title: '✨ Étape 7/7 - Confirmation',
    description: [
      '```',
      `  ${state.name.toUpperCase()}`,
      '```',
      '',
      `${race.emoji} **Race:** ${race.name}${subrace ? ` (${subrace.name})` : ''}`,
      `${cls.emoji} **Classe:** ${cls.name}`,
      `${bg.emoji} **Historique:** ${bg.name}`,
      '',
      separator('line'),
      '',
      '**📊 Attributs:**',
      attrDisplay,
      '',
      `❤️ **PV:** ${maxHP} | 🛡️ **CA:** ${baseAC} | 🏃 **Vitesse:** ${race.speed} ft`,
      '',
      `🎯 **Compétences:** ${allSkills.join(', ')}`,
      '',
      `🎒 **Départ:** ${state.startingGear === 'standard' ? 'Équipement standard' : 'Or de départ'}`,
      '',
      separator('stars'),
      '',
      '*Êtes-vous prêt à commencer votre aventure?*',
    ].join('\n'),
  });
}

function createConfirmationButtons() {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('create:cancel')
      .setLabel('Recommencer')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('create:confirm')
      .setLabel('Créer mon personnage!')
      .setEmoji('✨')
      .setStyle(ButtonStyle.Success),
  )];
}

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

async function handleAttributeChange(interaction, state, param) {
  const [attribute, direction] = param.split('_');
  
  if (direction === 'up') {
    const cost = getAttributeCost(state.attributes[attribute], true);
    if (state.attributes[attribute] >= 15) {
      return interaction.reply({ content: '⚠️ Maximum de 15 atteint!', ephemeral: true });
    }
    if (state.pointsRemaining < cost) {
      return interaction.reply({ 
        content: `⚠️ Pas assez de points! Coût: ${cost}, Disponibles: ${state.pointsRemaining}`, 
        ephemeral: true 
      });
    }
    state.attributes[attribute]++;
    state.pointsRemaining -= cost;
  } else if (direction === 'down') {
    if (state.attributes[attribute] <= 8) {
      return interaction.reply({ content: '⚠️ Minimum de 8 atteint!', ephemeral: true });
    }
    const refund = getAttributeCost(state.attributes[attribute] - 1, true);
    state.attributes[attribute]--;
    state.pointsRemaining += refund;
  }
  
  await interaction.update({
    embeds: [createAttributeEmbed(state)],
    components: createAttributeComponents(state),
  });
}

function getAttributeCost(currentValue, increase) {
  if (increase) {
    return currentValue >= 13 ? 2 : 1;
  } else {
    return currentValue >= 14 ? 2 : 1;
  }
}

function calculateFinalAttributes(state) {
  const race = racesData[state.race];
  const subrace = state.subrace ? race.subraces[state.subrace] : null;
  
  const finalAttributes = { ...state.attributes };
  
  for (const [attr, bonus] of Object.entries(race.abilityScoreIncrease || {})) {
    finalAttributes[attr] = (finalAttributes[attr] || 0) + bonus;
  }
  
  if (subrace?.abilityScoreIncrease) {
    for (const [attr, bonus] of Object.entries(subrace.abilityScoreIncrease)) {
      finalAttributes[attr] = (finalAttributes[attr] || 0) + bonus;
    }
  }
  
  return finalAttributes;
}

function formatBonus(abilityScoreIncrease) {
  if (!abilityScoreIncrease) return '';
  return Object.entries(abilityScoreIncrease)
    .map(([attr, bonus]) => `+${bonus} ${attr.toUpperCase()}`)
    .join(', ');
}

function createPointsBar(remaining, max) {
  const filled = max - remaining;
  const barLength = 20;
  const filledLength = Math.round((filled / max) * barLength);
  const emptyLength = barLength - filledLength;
  
  return `\`[${'█'.repeat(filledLength)}${'░'.repeat(emptyLength)}]\``;
}

async function finalizeCharacter(interaction, state) {
  const userId = interaction.user.id;
  const guildId = interaction.guildId;
  
  try {
    const race = racesData[state.race];
    const subrace = state.subrace ? race.subraces[state.subrace] : null;
    const cls = classesData[state.class];
    const bg = backgroundsData[state.background];
    
    const finalAttributes = calculateFinalAttributes(state);
    
    const hitDieMax = parseInt(cls.hitDie.substring(1));
    const conMod = Math.floor((finalAttributes.con - 10) / 2);
    const dexMod = Math.floor((finalAttributes.dex - 10) / 2);
    const maxHP = hitDieMax + conMod;
    const baseAC = 10 + dexMod;
    
    let inventory = [];
    let startingGold = 0;
    
    if (state.startingGear === 'standard') {
      const starterKit = getStarterKit(state.class);
      if (starterKit) {
        inventory = starterKit.map(itemId => ({
          itemId,
          quantity: 1,
          equipped: false,
          slot: null,
        }));
      }
      startingGold = Math.floor(Math.random() * 10) + 5;
    } else {
      const range = cls.startingGold || { min: 50, max: 100 };
      startingGold = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    }
    
    const allSkillProficiencies = [...bg.skillProficiencies, ...state.skills];
    
    const character = new Character({
      userId,
      guildId,
      name: state.name,
      race: race.name,
      subrace: subrace?.name || null,
      class: cls.name,
      level: 1,
      xp: 0,
      attributes: finalAttributes,
      hp: { current: maxHP, max: maxHP, temp: 0 },
      hitDice: { current: 1, max: 1, type: cls.hitDie },
      ac: baseAC,
      speed: subrace?.speed || race.speed,
      gold: { copper: 0, silver: 0, gold: startingGold, platinum: 0 },
      inventory,
      background: bg.name,
      proficiencies: {
        savingThrows: cls.savingThrows || [],
        skills: allSkillProficiencies,
        armor: cls.armorProficiencies || [],
        weapons: cls.weaponProficiencies || [],
        tools: bg.toolProficiencies || [],
        languages: race.languages || [],
      },
      location: 'val-serein',
      discoveredZones: ['val-serein'],
      stats: {
        monstersKilled: 0,
        questsCompleted: 0,
        deaths: 0,
        goldEarned: startingGold,
        damageDealt: 0,
        damageTaken: 0,
      },
    });
    
    await character.save();
    
    creationSessions.delete(userId);
    
    logger.game(`Nouveau personnage créé: ${state.name}`, {
      userId,
      guildId,
      race: race.name,
      class: cls.name,
      background: bg.name,
    });
    
    const successEmbed = card({
      theme: 'success',
      title: '🎉 Personnage créé avec succès!',
      thumbnail: interaction.user.displayAvatarURL(),
      description: [
        '```',
        `  Bienvenue à Valthera, ${state.name}!`,
        '```',
        '',
        `${race.emoji} **${race.name}${subrace ? ` (${subrace.name})` : ''}** ${cls.emoji} **${cls.name}**`,
        '',
        hpBar(maxHP, maxHP),
        '',
        `🛡️ **CA:** ${baseAC} | 💰 **Or:** ${startingGold} PO`,
        '',
        separator('stars'),
        '',
        '📍 Vous vous trouvez à **Val-Serein**, capitale du royaume de Valthera.',
        '',
        '**Prochaines étapes:**',
        '• `/sheet` - Voir votre feuille de personnage',
        '• `/inventory` - Gérer votre inventaire',
        '• `/combat test` - Tester le combat',
        '• `/explore` - Explorer le monde',
      ].join('\n'),
    });
    
    await interaction.update({
      embeds: [successEmbed],
      components: [],
    });
    
  } catch (error) {
    logger.error('Erreur lors de la création du personnage:', error);
    await interaction.update({
      embeds: [errorEmbed('Erreur', 'Une erreur est survenue lors de la création du personnage.')],
      components: [],
    });
  }
}
