/**
 * Commande /explore - Explorer la zone actuelle
 * Déclenche des rencontres, découvertes et événements
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
import { exploreCooldowns } from '../../utils/sessionManager.js';
import { checkExploreObjective } from '../../utils/questService.js';
import zonesData from '../../data/zones.json' assert { type: 'json' };
import monstersData from '../../data/monsters.json' assert { type: 'json' };

// Cooldown d'exploration (géré par sessionManager avec TTL de 30s)
const EXPLORE_COOLDOWN = 30000; // 30 secondes

// Événements aléatoires
const RANDOM_EVENTS = [
  {
    id: 'treasure_chest',
    name: 'Coffre au trésor',
    emoji: '📦',
    description: 'Vous découvrez un vieux coffre caché sous des branches!',
    type: 'loot',
    rewards: { gold: { min: 5, max: 25 }, xp: 15 },
    chance: 10,
  },
  {
    id: 'healing_spring',
    name: 'Source de guérison',
    emoji: '💧',
    description: 'Une source aux eaux cristallines vous redonne des forces.',
    type: 'heal',
    healPercent: 25,
    chance: 8,
  },
  {
    id: 'lost_traveler',
    name: 'Voyageur perdu',
    emoji: '👤',
    description: 'Un voyageur perdu vous remercie de l\'avoir aidé à retrouver son chemin.',
    type: 'loot',
    rewards: { gold: { min: 2, max: 10 }, xp: 10 },
    chance: 12,
  },
  {
    id: 'ancient_ruins',
    name: 'Ruines anciennes',
    emoji: '🏛️',
    description: 'Vous trouvez des ruines anciennes avec des inscriptions mystérieuses.',
    type: 'discovery',
    rewards: { xp: 25 },
    chance: 5,
  },
  {
    id: 'trap',
    name: 'Piège!',
    emoji: '⚠️',
    description: 'Vous déclenchez un piège caché!',
    type: 'damage',
    damage: '1d6',
    saveDC: 12,
    saveType: 'dex',
    chance: 8,
  },
  {
    id: 'nothing',
    name: 'Calme plat',
    emoji: '🌿',
    description: 'Votre exploration ne révèle rien de particulier.',
    type: 'nothing',
    chance: 40,
  },
];

export default {
  data: new SlashCommandBuilder()
    .setName('explore')
    .setDescription('Explorer la zone actuelle'),
  
  cooldown: 5,
  
  async execute(interaction) {
    const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
    
    if (!character) {
      return interaction.reply({
        embeds: [errorEmbed('Pas de personnage', 'Créez un personnage avec `/create`.')],
        ephemeral: true,
      });
    }
    
    // Vérifier le cooldown (géré par sessionManager avec TTL automatique)
    const lastExplore = exploreCooldowns.get(interaction.user.id);
    if (lastExplore) {
      const elapsed = Date.now() - lastExplore;
      if (elapsed < EXPLORE_COOLDOWN) {
        const remaining = Math.ceil((EXPLORE_COOLDOWN - elapsed) / 1000);
        return interaction.reply({
          embeds: [errorEmbed('Patience!', `Vous pouvez explorer à nouveau dans **${remaining}** secondes.`)],
          ephemeral: true,
        });
      }
    }
    
    const zone = zonesData.find(z => z.id === character.location);
    if (!zone) {
      return interaction.reply({
        embeds: [errorEmbed('Erreur', 'Zone actuelle inconnue.')],
        ephemeral: true,
      });
    }
    
    // Zone sûre = pas de rencontres dangereuses
    if (zone.safeZone) {
      return exploreSafeZone(interaction, character, zone);
    }
    
    // Mettre le cooldown
    exploreCooldowns.set(interaction.user.id, Date.now());
    
    // Mettre à jour les objectifs de quête (explore)
    await checkExploreObjective(character, zone.id);
    
    // Déterminer ce qui se passe
    const encounterRoll = Math.random();
    
    if (encounterRoll < zone.encounterRate) {
      // Rencontre de monstre!
      await triggerMonsterEncounter(interaction, character, zone);
    } else if (Math.random() < 0.4) {
      // Événement aléatoire
      await triggerRandomEvent(interaction, character, zone);
    } else {
      // Découverte de POI
      await discoverPOI(interaction, character, zone);
    }
  },
  
  async handleButton(interaction, client, params) {
    const [action, monsterId] = params;
    
    if (action === 'fight') {
      // Rediriger vers le combat
      await interaction.reply({
        content: `⚔️ Utilisez \`/combat start monstre:${monsterId}\` pour combattre!`,
        ephemeral: true,
      });
    } else if (action === 'flee') {
      const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
      const dexMod = Math.floor((character.attributes.dex - 10) / 2);
      const fleeRoll = roll('1d20').total + dexMod;
      
      if (fleeRoll >= 10) {
        await interaction.update({
          embeds: [createEmbed({
            title: '🏃 Fuite réussie!',
            description: `Vous parvenez à fuir discrètement. (${fleeRoll} vs DD 10)`,
            color: 0x22C55E,
          })],
          components: [],
        });
      } else {
        await interaction.update({
          embeds: [createEmbed({
            title: '❌ Fuite ratée!',
            description: `La créature vous a repéré! (${fleeRoll} vs DD 10)\n\nUtilisez \`/combat start\` pour combattre.`,
            color: 0xEF4444,
          })],
          components: [],
        });
      }
    }
  },
};

// ============================================================
// EXPLORATION ZONE SÛRE
// ============================================================

async function exploreSafeZone(interaction, character, zone) {
  const discoveries = [];
  
  // Lister les POIs
  if (zone.pointsOfInterest?.length > 0) {
    const poi = zone.pointsOfInterest[Math.floor(Math.random() * zone.pointsOfInterest.length)];
    discoveries.push(`📍 **${poi.name}**: ${poi.description}`);
  }
  
  // Lister les NPCs
  if (zone.npcs?.length > 0) {
    const npc = zone.npcs[Math.floor(Math.random() * zone.npcs.length)];
    discoveries.push(`👤 Vous apercevez **${npc.name}** près de ${npc.location}.`);
  }
  
  // Lister les boutiques
  if (zone.shops?.length > 0) {
    discoveries.push(`🏪 ${zone.shops.length} boutique(s) disponible(s) dans cette zone.`);
  }
  
  const embed = createEmbed({
    title: `${zone.emoji} Exploration de ${zone.name}`,
    description: [
      '*C\'est une zone sûre, pas de danger ici.*',
      '',
      discoveries.length > 0 ? discoveries.join('\n\n') : 'Vous vous promenez tranquillement.',
    ].join('\n'),
    color: 0x22C55E,
  });
  
  await interaction.reply({ embeds: [embed] });
}

// ============================================================
// RENCONTRE DE MONSTRE
// ============================================================

async function triggerMonsterEncounter(interaction, character, zone) {
  if (!zone.monsters || zone.monsters.length === 0) {
    return triggerRandomEvent(interaction, character, zone);
  }
  
  // Sélectionner un monstre selon les probabilités
  const totalChance = zone.monsters.reduce((sum, m) => sum + m.spawnChance, 0);
  let roll = Math.random() * totalChance;
  
  let selectedMonster = zone.monsters[0];
  for (const m of zone.monsters) {
    roll -= m.spawnChance;
    if (roll <= 0) {
      selectedMonster = m;
      break;
    }
  }
  
  const monster = monstersData[selectedMonster.monsterId];
  if (!monster) {
    return triggerRandomEvent(interaction, character, zone);
  }
  
  // Nombre de monstres
  const count = Math.floor(Math.random() * (selectedMonster.maxCount - selectedMonster.minCount + 1)) + selectedMonster.minCount;
  
  const embed = createEmbed({
    title: '⚔️ Rencontre!',
    description: [
      count > 1 
        ? `Vous tombez sur **${count} ${monster.name}s**!`
        : `Vous tombez sur un **${monster.name}**!`,
      '',
      `*${monster.description || 'Une créature hostile vous barre la route.'}*`,
      '',
      `❤️ PV: ${monster.hp.base}`,
      `🛡️ CA: ${monster.ac}`,
      `⚔️ Attaque: ${monster.damage}`,
    ].join('\n'),
    color: 0xEF4444,
    thumbnail: monster.image || null,
  });
  
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`explore:fight:${selectedMonster.monsterId}`)
      .setLabel('Combattre!')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('⚔️'),
    new ButtonBuilder()
      .setCustomId(`explore:flee:${selectedMonster.monsterId}`)
      .setLabel('Fuir')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🏃'),
  );
  
  await interaction.reply({
    embeds: [embed],
    components: [row],
  });
}

// ============================================================
// ÉVÉNEMENT ALÉATOIRE
// ============================================================

async function triggerRandomEvent(interaction, character, zone) {
  // Sélectionner un événement
  const totalChance = RANDOM_EVENTS.reduce((sum, e) => sum + e.chance, 0);
  let eventRoll = Math.random() * totalChance;
  
  let event = RANDOM_EVENTS.find(e => e.id === 'nothing');
  for (const e of RANDOM_EVENTS) {
    eventRoll -= e.chance;
    if (eventRoll <= 0) {
      event = e;
      break;
    }
  }
  
  let resultText = event.description;
  let color = 0x6B7280;
  const rewards = [];
  
  switch (event.type) {
    case 'loot': {
      color = 0xF59E0B;
      if (event.rewards.gold) {
        const goldGain = Math.floor(Math.random() * (event.rewards.gold.max - event.rewards.gold.min + 1)) + event.rewards.gold.min;
        character.gold.gold += goldGain;
        rewards.push(`💰 +${goldGain} or`);
      }
      if (event.rewards.xp) {
        character.xp += event.rewards.xp;
        rewards.push(`✨ +${event.rewards.xp} XP`);
      }
      break;
    }
    
    case 'heal': {
      color = 0x22C55E;
      const healAmount = Math.floor(character.hp.max * (event.healPercent / 100));
      const actualHeal = Math.min(healAmount, character.hp.max - character.hp.current);
      character.hp.current = Math.min(character.hp.max, character.hp.current + healAmount);
      rewards.push(`❤️ +${actualHeal} PV`);
      break;
    }
    
    case 'damage': {
      const dexMod = Math.floor((character.attributes.dex - 10) / 2);
      const saveRoll = roll('1d20').total + dexMod;
      
      if (saveRoll >= event.saveDC) {
        color = 0x22C55E;
        resultText += `\n\nVous évitez le piège! (${saveRoll} vs DD ${event.saveDC})`;
        rewards.push(`🛡️ Sauvegarde réussie!`);
      } else {
        color = 0xEF4444;
        const damage = roll(event.damage).total;
        character.hp.current = Math.max(1, character.hp.current - damage);
        resultText += `\n\nVous prenez **${damage}** dégâts! (${saveRoll} vs DD ${event.saveDC})`;
        rewards.push(`💔 -${damage} PV`);
      }
      break;
    }
    
    case 'discovery': {
      color = 0x8B5CF6;
      if (event.rewards?.xp) {
        character.xp += event.rewards.xp;
        rewards.push(`✨ +${event.rewards.xp} XP`);
      }
      break;
    }
    
    case 'nothing':
    default:
      color = 0x6B7280;
      break;
  }
  
  await character.save();
  
  const embed = createEmbed({
    title: `${event.emoji} ${event.name}`,
    description: resultText,
    color,
  });
  
  if (rewards.length > 0) {
    embed.addFields({
      name: '📦 Résultat',
      value: rewards.join('\n'),
      inline: false,
    });
  }
  
  await interaction.reply({ embeds: [embed] });
}

// ============================================================
// DÉCOUVERTE DE POI
// ============================================================

async function discoverPOI(interaction, character, zone) {
  if (!zone.pointsOfInterest || zone.pointsOfInterest.length === 0) {
    return triggerRandomEvent(interaction, character, zone);
  }
  
  // Chercher un POI découvrable non découvert
  const undiscoveredPOIs = zone.pointsOfInterest.filter(poi => {
    if (!poi.discoverable) return false;
    const discovered = character.discoveredPOIs || [];
    return !discovered.includes(`${zone.id}:${poi.id}`);
  });
  
  if (undiscoveredPOIs.length === 0) {
    // Tous découverts, événement aléatoire à la place
    return triggerRandomEvent(interaction, character, zone);
  }
  
  const poi = undiscoveredPOIs[Math.floor(Math.random() * undiscoveredPOIs.length)];
  
  // Jet de découverte
  const wisMod = Math.floor((character.attributes.wis - 10) / 2);
  const discoveryRoll = roll('1d20').total + wisMod;
  
  if (discoveryRoll < (poi.discoveryDC || 10)) {
    // Échec de découverte
    const embed = createEmbed({
      title: '🔍 Exploration',
      description: `Vous explorez attentivement mais ne trouvez rien de particulier.\n\n*(Perception: ${discoveryRoll} vs DD ${poi.discoveryDC || 10})*`,
      color: 0x6B7280,
    });
    
    return interaction.reply({ embeds: [embed] });
  }
  
  // Découverte réussie!
  if (!character.discoveredPOIs) character.discoveredPOIs = [];
  character.discoveredPOIs.push(`${zone.id}:${poi.id}`);
  
  let rewardText = '';
  if (poi.rewards?.xp) {
    character.xp += poi.rewards.xp;
    rewardText = `\n\n✨ **+${poi.rewards.xp} XP** pour cette découverte!`;
  }
  
  await character.save();
  
  const embed = createEmbed({
    title: `🔍 Découverte: ${poi.name}`,
    description: `${poi.description}${rewardText}\n\n*(Perception: ${discoveryRoll} vs DD ${poi.discoveryDC || 10})*`,
    color: 0x8B5CF6,
  });
  
  // Si la découverte révèle une zone cachée
  if (poi.revealsZone) {
    if (!character.discoveredZones.includes(poi.revealsZone)) {
      character.discoveredZones.push(poi.revealsZone);
      const revealedZone = zonesData.find(z => z.id === poi.revealsZone);
      if (revealedZone) {
        embed.addFields({
          name: '🗺️ Nouvelle zone découverte!',
          value: `${revealedZone.emoji} **${revealedZone.name}** est maintenant accessible!`,
          inline: false,
        });
      }
      await character.save();
    }
  }
  
  await interaction.reply({ embeds: [embed] });
}
