/**
 * Commande /combat - Système de combat unifié et simplifié
 * Tout intégré via boutons et menus déroulants
 */

import { 
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from 'discord.js';
import Character from '../../models/Character.js';
import { hpBar } from '../../utils/ui.js';
import { errorEmbed, createEmbed } from '../../utils/embedBuilder.js';
import { roll } from '../../utils/dice.js';
import { getItem } from '../../utils/itemService.js';
import { combatSessions } from '../../utils/sessionManager.js';
import { checkKillObjective } from '../../utils/questService.js';
import Party from '../../models/Party.js';
import { distributeRewards } from '../../utils/partyService.js';
import monstersData from '../../data/monsters.json' assert { type: 'json' };
import spellsData from '../../data/spells.json' assert { type: 'json' };
import classAbilitiesData from '../../data/classAbilities.json' assert { type: 'json' };

// Classes pouvant lancer des sorts
const SPELLCASTING_CLASSES = {
  wizard: 'int', sorcerer: 'cha', warlock: 'cha', bard: 'cha',
  cleric: 'wis', druid: 'wis', paladin: 'cha', ranger: 'wis',
};

export default {
  data: new SlashCommandBuilder()
    .setName('combat')
    .setDescription('Système de combat')
    .addSubcommand(sub => 
      sub.setName('start')
        .setDescription('Lancer un combat')
        .addStringOption(opt =>
          opt.setName('monstre')
            .setDescription('Type de monstre')
            .setRequired(false)
            .addChoices(
              { name: '👺 Gobelin (Facile)', value: 'goblin' },
              { name: '🐺 Loup (Facile)', value: 'wolf' },
              { name: '💀 Squelette (Facile)', value: 'skeleton' },
              { name: '🗡️ Bandit (Normal)', value: 'bandit' },
              { name: '👹 Orc (Normal)', value: 'orc' },
              { name: '🕷️ Araignée géante (Normal)', value: 'giant_spider' },
              { name: '🧟 Zombie (Difficile)', value: 'zombie' },
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName('status')
        .setDescription('Voir l\'état du combat en cours')
    ),
  
  cooldown: 2,
  
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    
    if (sub === 'start') {
      await startCombat(interaction);
    } else if (sub === 'status') {
      await showStatus(interaction);
    }
  },
  
  async handleButton(interaction, client, params) {
    const [action] = params;
    const session = combatSessions.get(interaction.user.id);
    
    if (!session) {
      return interaction.reply({
        embeds: [errorEmbed('Pas de combat', 'Vous n\'êtes pas en combat. Utilisez `/combat start`.')],
        ephemeral: true,
      });
    }
    
    // Vérification pour les combats de groupe
    if (session.isGroupCombat) {
      // Vérifier que c'est bien le tour de ce joueur
      const currentCombatant = session.combatants[session.currentTurnIndex];
      if (currentCombatant && currentCombatant.odUserId !== interaction.user.id) {
        return interaction.reply({
          embeds: [errorEmbed('Pas votre tour', `C'est le tour de **${currentCombatant.character.name}**!`)],
          ephemeral: true,
        });
      }
    } else {
      // Vérification propriétaire solo
      if (session.odUserId !== interaction.user.id) {
        return interaction.reply({
          embeds: [errorEmbed('Action interdite', 'Ce combat ne vous appartient pas!')],
          ephemeral: true,
        });
      }
    }
    
    switch (action) {
      case 'attack': await doAttack(interaction, session); break;
      case 'defend': await doDefend(interaction, session); break;
      case 'spell': await showSpellMenu(interaction, session); break;
      case 'ability': await showAbilityMenu(interaction, session); break;
      case 'flee': await doFlee(interaction, session); break;
      case 'back': await showMainMenu(interaction, session); break;
      case 'quit': await forceEnd(interaction, session); break;
    }
  },
  
  async handleSelectMenu(interaction, client, params) {
    const [menuType] = params;
    const session = combatSessions.get(interaction.user.id);
    
    if (!session) {
      return interaction.reply({
        embeds: [errorEmbed('Combat expiré', 'Le combat n\'existe plus.')],
        ephemeral: true,
      });
    }
    
    const selected = interaction.values[0];
    
    if (menuType === 'spell') {
      await castSpell(interaction, session, selected);
    } else if (menuType === 'ability') {
      await useAbility(interaction, session, selected);
    }
  },
};

// ============================================================
// DÉMARRAGE DU COMBAT
// ============================================================

async function startCombat(interaction) {
  const character = await Character.findByDiscordId(interaction.user.id, interaction.guildId);
  
  if (!character) {
    return interaction.reply({
      embeds: [errorEmbed('Pas de personnage', 'Créez un personnage avec `/create`.')],
      ephemeral: true,
    });
  }
  
  if (combatSessions.has(interaction.user.id)) {
    return interaction.reply({
      embeds: [errorEmbed('Déjà en combat', 'Terminez votre combat actuel d\'abord.')],
      ephemeral: true,
    });
  }
  
  // Vérifier si le joueur est dans un groupe
  const party = await Party.findByPlayer(interaction.guildId, interaction.user.id);
  
  // Si en groupe, vérifier que les autres membres ne sont pas en combat
  if (party) {
    for (const member of party.members) {
      if (member.playerId !== interaction.user.id && combatSessions.has(member.playerId)) {
        return interaction.reply({
          embeds: [errorEmbed('Groupe en combat', `${member.characterName} est déjà en combat. Attendez qu'il termine.`)],
          ephemeral: true,
        });
      }
    }
  }
  
  // Créer le monstre (avec scaling si groupe)
  const monsterId = interaction.options.getString('monstre') || 'goblin';
  const template = monstersData[monsterId];
  if (!template) {
    return interaction.reply({ embeds: [errorEmbed('Erreur', 'Monstre inconnu.')], ephemeral: true });
  }
  
  // Scaling du monstre pour les groupes (bonus HP par membre supplémentaire)
  const groupSize = party ? party.members.length : 1;
  const hpBonus = groupSize > 1 ? Math.floor(template.hp.base * (groupSize - 1) * 0.5) : 0;
  
  const monster = {
    ...template,
    id: monsterId,
    hp: { current: template.hp.base + hpBonus, max: template.hp.base + hpBonus },
  };
  
  // Charger tous les personnages du groupe
  const combatants = [];
  if (party) {
    for (const member of party.members) {
      const memberChar = await Character.findOne({ userId: member.playerId, guildId: interaction.guildId });
      if (memberChar) {
        const init = roll('1d20').total + getMod(memberChar.attributes.dex);
        combatants.push({
          odisId: interaction.guildId,
          odUserId: member.playerId,
          playerName: member.playerName,
          character: memberChar,
          initiative: init,
          defending: false,
          effects: { rage: false, reckless: false },
        });
      }
    }
    // Trier par initiative (décroissant)
    combatants.sort((a, b) => b.initiative - a.initiative);
  } else {
    // Solo
    const init = roll('1d20').total + getMod(character.attributes.dex);
    combatants.push({
      odisId: interaction.guildId,
      odUserId: interaction.user.id,
      playerName: interaction.user.displayName,
      character,
      initiative: init,
      defending: false,
      effects: { rage: false, reckless: false },
    });
  }
  
  const monsterInit = roll('1d20').total + getMod(template.attributes?.dex || 10);
  
  // Déterminer l'ordre de combat
  const highestPlayerInit = combatants[0].initiative;
  const playersFirst = highestPlayerInit >= monsterInit;
  
  // Session de combat (groupe ou solo)
  const session = {
    odUserId: interaction.user.id, // Initiateur
    odGuildId: interaction.guildId,
    isGroupCombat: !!party,
    party: party || null,
    combatants,
    currentTurnIndex: 0,
    character: combatants.find(c => c.odUserId === interaction.user.id)?.character || character,
    monster,
    round: 1,
    playerTurn: playersFirst,
    defending: false,
    effects: { rage: false, reckless: false, stunned: false },
  };
  
  // Enregistrer la session pour tous les membres du groupe
  if (party) {
    for (const member of party.members) {
      combatSessions.set(member.playerId, session);
    }
  } else {
    combatSessions.set(interaction.user.id, session);
  }
  
  // Message d'initiative
  let initText = '';
  if (party) {
    const initOrder = combatants.map(c => `${c.character.name}: ${c.initiative}`).join(', ');
    initText = playersFirst
      ? `👥 **Combat de groupe!**\n⚡ Initiative: ${initOrder}\n\n🎯 C'est au tour de **${combatants[0].character.name}**!`
      : `👥 **Combat de groupe!**\n⚡ Initiative: ${initOrder}\n\n👹 ${monster.name} commence! (${monsterInit})`;
  } else {
    initText = playersFirst
      ? `⚡ Vous agissez en premier! (${highestPlayerInit} vs ${monsterInit})`
      : `👹 ${monster.name} commence! (${monsterInit} vs ${highestPlayerInit})`;
  }
  
  await interaction.reply({
    embeds: [buildEmbed(session, `⚔️ **Combat contre ${monster.name}!**\n\n${initText}`)],
    components: session.playerTurn ? buildMainButtons(session) : buildWaitButton(),
  });
  
  // Monstre commence
  if (!session.playerTurn) {
    setTimeout(() => monsterTurn(interaction, session), 1200);
  }
}

// ============================================================
// ACTIONS DU JOUEUR
// ============================================================

async function doAttack(interaction, session) {
  if (!session.playerTurn) {
    return interaction.reply({ content: '⏳ Ce n\'est pas votre tour!', ephemeral: true });
  }
  
  // Récupérer le combattant actuel (groupe ou solo)
  const currentCombatant = session.isGroupCombat 
    ? session.combatants[session.currentTurnIndex] 
    : { character: session.character, defending: session.defending, effects: session.effects };
  
  const { character, monster } = { character: currentCombatant.character, monster: session.monster };
  const weapon = getEquippedWeapon(character);
  
  // Calculs
  const strMod = getMod(character.attributes.str);
  const dexMod = getMod(character.attributes.dex);
  const profBonus = getProfBonus(character.level);
  
  let attackMod = strMod + profBonus;
  let damageDice = '1d4';
  let bonusDmg = strMod;
  
  if (weapon) {
    damageDice = weapon.stats?.damage || '1d4';
    if (weapon.stats?.properties?.includes('finesse')) {
      attackMod = Math.max(strMod, dexMod) + profBonus;
      bonusDmg = Math.max(strMod, dexMod);
    }
  }
  
  // Rage bonus
  if (currentCombatant.effects?.rage) bonusDmg += 2;
  
  // Jet d'attaque
  const d20 = roll('1d20').total;
  const attackTotal = d20 + attackMod;
  const isCrit = d20 === 20;
  const isFumble = d20 === 1;
  
  let resultText = session.isGroupCombat ? `⚔️ **${character.name}** attaque!\n` : '';
  
  if (isFumble) {
    resultText += `💀 **Échec critique!** L'attaque rate lamentablement.`;
  } else if (isCrit || attackTotal >= monster.ac) {
    let damage = roll(damageDice).total + bonusDmg;
    if (isCrit) damage = roll(damageDice).total + damage; // Double dés
    damage = Math.max(1, damage);
    
    monster.hp.current = Math.max(0, monster.hp.current - damage);
    
    resultText += isCrit
      ? `💥 **CRITIQUE!** **${damage}** dégâts!`
      : `⚔️ Touché! **${damage}** dégâts. (${attackTotal} vs CA ${monster.ac})`;
  } else {
    resultText += `❌ Raté! (${attackTotal} vs CA ${monster.ac})`;
  }
  
  if (session.isGroupCombat) {
    currentCombatant.defending = false;
  } else {
    session.defending = false;
  }
  
  // Victoire?
  if (monster.hp.current <= 0) {
    return endCombat(interaction, session, 'victory', resultText, interaction.user.id);
  }
  
  // Passage au tour suivant
  await advanceTurn(interaction, session, resultText);
}

async function doDefend(interaction, session) {
  if (!session.playerTurn) {
    return interaction.reply({ content: '⏳ Ce n\'est pas votre tour!', ephemeral: true });
  }
  
  // Récupérer le combattant actuel
  const currentCombatant = session.isGroupCombat 
    ? session.combatants[session.currentTurnIndex] 
    : null;
  
  if (session.isGroupCombat) {
    currentCombatant.defending = true;
  } else {
    session.defending = true;
  }
  
  const charName = session.isGroupCombat ? currentCombatant.character.name : session.character.name;
  const resultText = `🛡️ **${charName}** se défend! (+2 CA ce tour)`;
  
  // Passage au tour suivant
  await advanceTurn(interaction, session, resultText);
}

async function doFlee(interaction, session) {
  if (!session.playerTurn) {
    return interaction.reply({ content: '⏳ Ce n\'est pas votre tour!', ephemeral: true });
  }
  
  // En groupe, seul le leader peut faire fuir tout le groupe
  if (session.isGroupCombat) {
    const currentCombatant = session.combatants[session.currentTurnIndex];
    if (currentCombatant.odUserId !== session.party.leaderId) {
      return interaction.reply({
        content: '❌ Seul le chef du groupe peut ordonner la fuite!',
        ephemeral: true,
      });
    }
  }
  
  const character = session.isGroupCombat 
    ? session.combatants[session.currentTurnIndex].character 
    : session.character;
  
  const dexMod = getMod(character.attributes.dex);
  const fleeRoll = roll('1d20').total + dexMod;
  
  if (fleeRoll >= 10) {
    // Supprimer la session pour tous les membres
    if (session.isGroupCombat) {
      for (const combatant of session.combatants) {
        combatSessions.delete(combatant.odUserId);
      }
    } else {
      combatSessions.delete(interaction.user.id);
    }
    
    const fleeText = session.isGroupCombat 
      ? `Le groupe parvient à fuir!` 
      : `Vous parvenez à fuir!`;
    
    return interaction.update({
      embeds: [createEmbed({
        title: '🏃 Fuite réussie!',
        description: `${fleeText} (${fleeRoll} vs DD 10)`,
        color: 0xF59E0B,
      })],
      components: [],
    });
  }
  
  const failText = session.isGroupCombat 
    ? `🏃 Fuite ratée! Le groupe ne peut pas s'échapper. (${fleeRoll} vs DD 10)` 
    : `🏃 Fuite ratée! (${fleeRoll} vs DD 10)`;
  
  // Passage au tour suivant
  await advanceTurn(interaction, session, failText);
}

/**
 * Gère le passage au tour suivant (joueur suivant ou monstre)
 */
async function advanceTurn(interaction, session, resultText) {
  if (session.isGroupCombat) {
    // Passer au combattant suivant
    session.currentTurnIndex++;
    
    // Si tous les joueurs ont joué, tour du monstre
    if (session.currentTurnIndex >= session.combatants.length) {
      session.currentTurnIndex = 0;
      session.playerTurn = false;
      
      await interaction.update({
        embeds: [buildEmbed(session, resultText)],
        components: buildWaitButton(),
      });
      
      setTimeout(() => monsterTurn(interaction, session), 1200);
    } else {
      // Prochain joueur
      const nextCombatant = session.combatants[session.currentTurnIndex];
      const nextTurnText = `${resultText}\n\n🎯 **Tour de ${nextCombatant.character.name}!**`;
      
      await interaction.update({
        embeds: [buildEmbed(session, nextTurnText)],
        components: buildMainButtons(session),
      });
    }
  } else {
    // Combat solo - tour du monstre
    session.playerTurn = false;
    
    await interaction.update({
      embeds: [buildEmbed(session, resultText)],
      components: buildWaitButton(),
    });
    
    setTimeout(() => monsterTurn(interaction, session), 1200);
  }
}

// ============================================================
// SORTS (MENU DÉROULANT)
// ============================================================

async function showSpellMenu(interaction, session) {
  if (!session.playerTurn) {
    return interaction.reply({ content: '⏳ Ce n\'est pas votre tour!', ephemeral: true });
  }
  
  // Récupérer le personnage actuel
  const character = session.isGroupCombat 
    ? session.combatants[session.currentTurnIndex].character 
    : session.character;
  
  const charClass = character.class.toLowerCase();
  
  if (!SPELLCASTING_CLASSES[charClass]) {
    return interaction.reply({ content: '❌ Votre classe ne peut pas lancer de sorts.', ephemeral: true });
  }
  
  const spells = [];
  
  // Cantrips
  for (const id of character.spellcasting?.cantrips || []) {
    const spell = spellsData.cantrips?.[id];
    if (spell) spells.push({ ...spell, id, level: 0 });
  }
  
  // Sorts avec emplacements
  const known = [...new Set([
    ...(character.spellcasting?.knownSpells || []),
    ...(character.spellcasting?.preparedSpells || []),
  ])];
  
  for (const id of known) {
    const spell = findSpell(id);
    if (spell && spell.level > 0) {
      const slots = character.spellcasting?.spellSlots?.[spell.level]?.current || 0;
      if (slots > 0) spells.push({ ...spell, id });
    }
  }
  
  if (spells.length === 0) {
    return interaction.reply({ 
      content: '❌ Pas de sorts disponibles (pas de sorts connus ou plus d\'emplacements).', 
      ephemeral: true,
    });
  }
  
  const options = spells.slice(0, 25).map(s => ({
    label: s.name,
    value: s.id,
    description: s.level === 0 ? `Tour de magie` : `Niveau ${s.level}`,
    emoji: s.school === 'evocation' ? '🔥' : s.school === 'necromancy' ? '💀' : '✨',
  }));
  
  const menu = new StringSelectMenuBuilder()
    .setCustomId('combat:spell')
    .setPlaceholder('🔮 Choisissez un sort...')
    .addOptions(options);
  
  await interaction.update({
    embeds: [buildEmbed(session, '🔮 **Sélectionnez un sort:**')],
    components: [
      new ActionRowBuilder().addComponents(menu),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('combat:back').setLabel('Retour').setStyle(ButtonStyle.Secondary).setEmoji('◀️')
      ),
    ],
  });
}

async function castSpell(interaction, session, spellId) {
  // Récupérer le personnage actuel (groupe ou solo)
  const character = session.isGroupCombat 
    ? session.combatants[session.currentTurnIndex].character 
    : session.character;
  const { monster } = session;
  const spell = findSpell(spellId) || spellsData.cantrips?.[spellId];
  
  if (!spell) {
    return interaction.reply({ content: '❌ Sort inconnu.', ephemeral: true });
  }
  
  const charClass = character.class.toLowerCase();
  const spellAbility = SPELLCASTING_CLASSES[charClass] || 'int';
  const spellMod = getMod(character.attributes[spellAbility]);
  const profBonus = getProfBonus(character.level);
  const spellDC = 8 + profBonus + spellMod;
  const spellAttack = profBonus + spellMod;
  const spellLevel = spell.level || 0;
  
  // Consommer l'emplacement
  if (spellLevel > 0) {
    if (!character.spellcasting?.spellSlots?.[spellLevel]?.current) {
      return interaction.reply({ content: '❌ Plus d\'emplacements de ce niveau!', ephemeral: true });
    }
    character.spellcasting.spellSlots[spellLevel].current--;
  }
  
  let resultText = session.isGroupCombat ? `✨ **${character.name}** lance ` : '✨ ';
  resultText += `**${spell.name}**!\n`;
  
  // Résolution
  if (spell.attackType === 'ranged' || spell.attackType === 'melee') {
    const d20 = roll('1d20').total;
    const attackTotal = d20 + spellAttack;
    const isCrit = d20 === 20;
    
    if (d20 === 1) {
      resultText += `💀 Échec critique! Le sort rate.`;
    } else if (isCrit || attackTotal >= monster.ac) {
      const damage = rollSpellDamage(spell.damage, isCrit, character.level);
      monster.hp.current = Math.max(0, monster.hp.current - damage);
      resultText += isCrit
        ? `💥 CRITIQUE! **${damage}** dégâts ${spell.damageType}!`
        : `🎯 Touché! **${damage}** dégâts. (${attackTotal} vs CA ${monster.ac})`;
    } else {
      resultText += `❌ Raté! (${attackTotal} vs CA ${monster.ac})`;
    }
  } else if (spell.savingThrow) {
    const monsterMod = getMod(monster.attributes?.[spell.savingThrow.ability] || 10);
    const saveRoll = roll('1d20').total + monsterMod;
    const saved = saveRoll >= spellDC;
    
    let damage = rollSpellDamage(spell.damage, false, character.level);
    
    if (saved && spell.savingThrow.halfOnSuccess) {
      damage = Math.floor(damage / 2);
      resultText += `⚠️ ${monster.name} résiste! **${damage}** dégâts (moitié). [${saveRoll} vs DD ${spellDC}]`;
    } else if (saved) {
      damage = 0;
      resultText += `🛡️ ${monster.name} esquive! [${saveRoll} vs DD ${spellDC}]`;
    } else {
      resultText += `💥 **${damage}** dégâts ${spell.damageType}! [${saveRoll} vs DD ${spellDC}]`;
    }
    monster.hp.current = Math.max(0, monster.hp.current - damage);
  } else if (spell.healing) {
    const healing = rollSpellDamage(spell.healing, false, character.level);
    const oldHp = character.hp.current;
    character.hp.current = Math.min(character.hp.max, character.hp.current + healing);
    resultText += `💚 +**${character.hp.current - oldHp}** PV!`;
  } else {
    resultText += `L'effet est appliqué!`;
  }
  
  // Emplacements restants
  if (spellLevel > 0) {
    const slotsLeft = character.spellcasting.spellSlots[spellLevel].current;
    const slotsMax = character.spellcasting.spellSlots[spellLevel].max;
    resultText += `\n📊 Emplacements niv.${spellLevel}: ${slotsLeft}/${slotsMax}`;
  }
  
  if (session.isGroupCombat) {
    session.combatants[session.currentTurnIndex].defending = false;
  } else {
    session.defending = false;
  }
  await character.save();
  
  // Victoire?
  if (monster.hp.current <= 0) {
    return endCombat(interaction, session, 'victory', resultText, interaction.user.id);
  }
  
  // Passage au tour suivant
  await advanceTurn(interaction, session, resultText);
}

// ============================================================
// CAPACITÉS (MENU DÉROULANT)
// ============================================================

async function showAbilityMenu(interaction, session) {
  if (!session.playerTurn) {
    return interaction.reply({ content: '⏳ Ce n\'est pas votre tour!', ephemeral: true });
  }
  
  // Récupérer le personnage actuel (groupe ou solo)
  const character = session.isGroupCombat 
    ? session.combatants[session.currentTurnIndex].character 
    : session.character;
  
  const charClass = character.class.toLowerCase();
  const classData = classAbilitiesData[charClass];
  
  if (!classData?.abilities) {
    return interaction.reply({ content: '❌ Pas de capacités pour votre classe.', ephemeral: true });
  }
  
  const abilities = [];
  
  for (const [id, ability] of Object.entries(classData.abilities)) {
    if (ability.actionType === 'passive') continue;
    if (character.level < (ability.level || 1)) continue;
    
    const uses = getAbilityUses(character, id, ability);
    if (uses.remaining > 0 || uses.max === null) {
      abilities.push({ ...ability, id, uses });
    }
  }
  
  if (abilities.length === 0) {
    return interaction.reply({ 
      content: '❌ Aucune capacité disponible (niveau insuffisant ou plus d\'utilisations).', 
      ephemeral: true,
    });
  }
  
  const options = abilities.slice(0, 25).map(a => ({
    label: a.name,
    value: a.id,
    description: a.uses.max ? `${a.uses.remaining}/${a.uses.max}` : a.type,
    emoji: a.type === 'healing' ? '💚' : a.type === 'buff' ? '😤' : '⚡',
  }));
  
  const menu = new StringSelectMenuBuilder()
    .setCustomId('combat:ability')
    .setPlaceholder('⚡ Choisissez une capacité...')
    .addOptions(options);
  
  await interaction.update({
    embeds: [buildEmbed(session, '⚡ **Sélectionnez une capacité:**')],
    components: [
      new ActionRowBuilder().addComponents(menu),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('combat:back').setLabel('Retour').setStyle(ButtonStyle.Secondary).setEmoji('◀️')
      ),
    ],
  });
}

async function useAbility(interaction, session, abilityId) {
  // Récupérer le personnage actuel (groupe ou solo)
  const character = session.isGroupCombat 
    ? session.combatants[session.currentTurnIndex].character 
    : session.character;
  const currentCombatant = session.isGroupCombat 
    ? session.combatants[session.currentTurnIndex] 
    : null;
  
  const { monster } = session;
  const charClass = character.class.toLowerCase();
  const ability = classAbilitiesData[charClass]?.abilities?.[abilityId];
  
  if (!ability) {
    return interaction.reply({ content: '❌ Capacité inconnue.', ephemeral: true });
  }
  
  let resultText = session.isGroupCombat ? `⚡ **${character.name}** utilise ` : '⚡ ';
  resultText += `**${ability.name}**!\n`;
  let endsTurn = true;
  
  // Exécution selon le type
  switch (ability.type) {
    case 'healing': {
      const healRoll = roll(ability.healing || '1d10').total + character.level;
      const oldHp = character.hp.current;
      character.hp.current = Math.min(character.hp.max, character.hp.current + healRoll);
      resultText += `💚 +**${character.hp.current - oldHp}** PV!`;
      break;
    }
    
    case 'damage': {
      if (abilityId === 'sneak_attack') {
        const sneakDice = Math.ceil(character.level / 2);
        const damage = roll(`${sneakDice}d6`).total;
        monster.hp.current = Math.max(0, monster.hp.current - damage);
        resultText += `🗡️ **${damage}** dégâts sournois!`;
      } else if (abilityId === 'divine_smite') {
        const damage = roll('2d8').total;
        monster.hp.current = Math.max(0, monster.hp.current - damage);
        resultText += `✨ **${damage}** dégâts radiants!`;
      }
      break;
    }
    
    case 'buff': {
      if (abilityId === 'rage') {
        // En groupe, appliquer à ce combattant spécifiquement
        if (currentCombatant) {
          currentCombatant.effects.rage = true;
        } else {
          session.effects.rage = true;
        }
        resultText += `😤 Rage activée! (+2 dégâts, résistance)`;
      } else if (abilityId === 'action_surge') {
        endsTurn = false;
        resultText += `⚡ Action supplémentaire!`;
      }
      break;
    }
    
    case 'offensive': {
      if (abilityId === 'flurry_of_blows') {
        const martialDie = character.level >= 11 ? '1d8' : character.level >= 5 ? '1d6' : '1d4';
        const dexMod = getMod(character.attributes.dex);
        let totalDmg = 0;
        
        for (let i = 0; i < 2; i++) {
          const atk = roll('1d20').total + dexMod + getProfBonus(character.level);
          if (atk >= monster.ac) {
            totalDmg += Math.max(1, roll(martialDie).total + dexMod);
          }
        }
        
        monster.hp.current = Math.max(0, monster.hp.current - totalDmg);
        resultText += totalDmg > 0 
          ? `👊👊 **${totalDmg}** dégâts!`
          : `👊👊 Raté!`;
      }
      break;
    }
    
    case 'control': {
      if (abilityId === 'stunning_strike') {
        const dc = 8 + getProfBonus(character.level) + getMod(character.attributes.wis);
        const save = roll('1d20').total + getMod(monster.attributes?.con || 10);
        
        if (save < dc) {
          session.effects.stunned = true;
          resultText += `💫 ${monster.name} est étourdi! [${save} vs DD ${dc}]`;
        } else {
          resultText += `${monster.name} résiste! [${save} vs DD ${dc}]`;
        }
      }
      break;
    }
    
    default:
      resultText += `Effet appliqué!`;
  }
  
  // Consommer l'utilisation
  consumeAbilityUse(character, abilityId);
  await character.save();
  
  // Victoire?
  if (monster.hp.current <= 0) {
    return endCombat(interaction, session, 'victory', resultText, interaction.user.id);
  }
  
  if (endsTurn) {
    // Passage au tour suivant
    await advanceTurn(interaction, session, resultText);
  } else {
    await interaction.update({
      embeds: [buildEmbed(session, resultText)],
      components: buildMainButtons(session),
    });
  }
}

// ============================================================
// TOUR DU MONSTRE
// ============================================================

async function monsterTurn(interaction, session) {
  const { monster } = session;
  
  // Monstre étourdi?
  if (session.effects.stunned) {
    session.effects.stunned = false;
    session.playerTurn = true;
    session.currentTurnIndex = 0;
    session.round++;
    
    const nextTurnText = session.isGroupCombat 
      ? `💫 ${monster.name} est étourdi!\n\n🎯 **Round ${session.round}** - Tour de **${session.combatants[0].character.name}**!`
      : `💫 ${monster.name} est étourdi!\n\n🎯 **Round ${session.round}** - À vous!`;
    
    try {
      await interaction.editReply({
        embeds: [buildEmbed(session, nextTurnText)],
        components: buildMainButtons(session),
      });
    } catch (e) { /* interaction expirée */ }
    return;
  }
  
  // Choisir la cible (aléatoire en groupe, sinon le joueur)
  let target;
  let targetCombatant = null;
  
  if (session.isGroupCombat) {
    // Cibler un membre aléatoire encore en vie
    const aliveMembers = session.combatants.filter(c => c.character.hp.current > 0);
    if (aliveMembers.length === 0) {
      return endCombat(interaction, session, 'defeat', 'Tout le groupe a été vaincu!');
    }
    targetCombatant = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
    target = targetCombatant.character;
  } else {
    target = session.character;
  }
  
  // Attaque du monstre
  const attackBonus = monster.attackBonus || 3;
  const d20 = roll('1d20').total;
  const defendBonus = targetCombatant ? (targetCombatant.defending ? 2 : 0) : (session.defending ? 2 : 0);
  const playerAC = target.ac + defendBonus;
  const attackTotal = d20 + attackBonus;
  
  let resultText = session.isGroupCombat ? `👹 ${monster.name} attaque **${target.name}**!\n` : '';
  
  if (d20 === 1) {
    resultText += `💀 ${monster.name} rate complètement!`;
  } else if (d20 === 20 || attackTotal >= playerAC) {
    let damage = roll(monster.damage || '1d6').total;
    if (d20 === 20) damage *= 2;
    
    // Rage = résistance
    const hasRage = targetCombatant ? targetCombatant.effects?.rage : session.effects.rage;
    if (hasRage) {
      damage = Math.floor(damage / 2);
      resultText += `😤 Rage absorbe les dégâts!\n`;
    }
    
    target.hp.current = Math.max(0, target.hp.current - damage);
    resultText += d20 === 20
      ? `💥 CRITIQUE! **${damage}** dégâts!`
      : `⚔️ Touché! **${damage}** dégâts. (${attackTotal} vs CA ${playerAC})`;
  } else {
    resultText += `❌ Raté! (${attackTotal} vs CA ${playerAC})`;
  }
  
  // Reset défense
  if (targetCombatant) {
    targetCombatant.defending = false;
  } else {
    session.defending = false;
  }
  session.effects.reckless = false;
  await target.save();
  
  // Vérifier les défaites
  if (session.isGroupCombat) {
    // Vérifier si tous les membres sont KO
    const aliveAfter = session.combatants.filter(c => c.character.hp.current > 0);
    if (aliveAfter.length === 0) {
      return endCombat(interaction, session, 'defeat', resultText);
    }
    
    // Si la cible est KO, message
    if (target.hp.current <= 0) {
      resultText += `\n💀 **${target.name}** est inconscient!`;
    }
  } else if (target.hp.current <= 0) {
    return endCombat(interaction, session, 'defeat', resultText);
  }
  
  // Tour des joueurs
  session.playerTurn = true;
  session.currentTurnIndex = 0;
  session.round++;
  
  // En groupe, trouver le premier joueur vivant
  if (session.isGroupCombat) {
    while (session.currentTurnIndex < session.combatants.length && 
           session.combatants[session.currentTurnIndex].character.hp.current <= 0) {
      session.currentTurnIndex++;
    }
    if (session.currentTurnIndex >= session.combatants.length) {
      session.currentTurnIndex = 0;
    }
  }
  
  const nextPlayer = session.isGroupCombat 
    ? session.combatants[session.currentTurnIndex].character.name 
    : session.character.name;
  
  const turnText = session.isGroupCombat 
    ? `${resultText}\n\n🎯 **Round ${session.round}** - Tour de **${nextPlayer}**!`
    : `${resultText}\n\n🎯 **Round ${session.round}** - À vous!`;
  
  try {
    await interaction.editReply({
      embeds: [buildEmbed(session, turnText)],
      components: buildMainButtons(session),
    });
  } catch (e) { /* interaction expirée */ }
}

// ============================================================
// FIN DE COMBAT
// ============================================================

async function endCombat(interaction, session, result, lastAction, killerId = null) {
  const { monster } = session;
  
  // Supprimer les sessions de tous les participants
  if (session.isGroupCombat) {
    for (const combatant of session.combatants) {
      combatSessions.delete(combatant.odUserId);
    }
  } else {
    combatSessions.delete(session.odUserId);
  }
  
  let embed;
  
  if (result === 'victory') {
    const baseXp = monster.xpReward || 50;
    const baseGold = Math.floor(Math.random() * 15) + 5;
    
    if (session.isGroupCombat && session.party) {
      // Distribution en groupe via partyService
      const rewards = { xp: baseXp, gold: baseGold, items: [] };
      const distribution = await distributeRewards(session.party, rewards, killerId);
      
      // Appliquer les récompenses à chaque membre
      const rewardTexts = [];
      for (const combatant of session.combatants) {
        const memberRewards = distribution[combatant.odUserId];
        if (memberRewards) {
          combatant.character.xp += memberRewards.xp;
          combatant.character.currency = combatant.character.currency || { pp: 0, gp: 0, sp: 0, cp: 0 };
          combatant.character.currency.gp += memberRewards.gold;
          combatant.character.stats.monstersKilled = (combatant.character.stats.monstersKilled || 0) + 1;
          await combatant.character.save();
          
          rewardTexts.push(`**${combatant.character.name}**: +${memberRewards.xp} XP, +${memberRewards.gold} po`);
        }
      }
      
      // Mise à jour des objectifs de quête pour le tueur
      let questText = '';
      if (killerId) {
        const killerCombatant = session.combatants.find(c => c.odUserId === killerId);
        if (killerCombatant) {
          const questUpdates = await checkKillObjective(killerCombatant.character, monster.id);
          for (const update of questUpdates) {
            if (update.completed) {
              questText += `\n✅ **Quête:** ${update.objectiveDesc} terminé !`;
            } else {
              questText += `\n📋 **Quête:** ${update.objectiveDesc} (${update.current}/${update.required})`;
            }
          }
        }
      }
      
      // Afficher les PV de chaque membre
      const hpTexts = session.combatants.map(c => 
        `${c.character.name}: **${c.character.hp.current}/${c.character.hp.max}** PV`
      ).join('\n');
      
      embed = createEmbed({
        title: '🏆 Victoire du groupe!',
        description: [
          lastAction,
          '',
          `**${monster.name}** est vaincu!`,
          '',
          '**💰 Récompenses:**',
          ...rewardTexts,
          '',
          '**❤️ État du groupe:**',
          hpTexts,
          questText,
        ].join('\n'),
        color: 0x22C55E,
      });
    } else {
      // Combat solo
      const character = session.character;
      character.xp += baseXp;
      character.currency = character.currency || { pp: 0, gp: 0, sp: 0, cp: 0 };
      character.currency.gp += baseGold;
      character.stats.monstersKilled = (character.stats.monstersKilled || 0) + 1;
      
      const questUpdates = await checkKillObjective(character, monster.id);
      await character.save();
      
      let questText = '';
      for (const update of questUpdates) {
        if (update.completed) {
          questText += `\n\n✅ **Quête:** ${update.objectiveDesc} terminé !`;
        } else {
          questText += `\n\n📋 **Quête:** ${update.objectiveDesc} (${update.current}/${update.required})`;
        }
      }
      
      embed = createEmbed({
        title: '🏆 Victoire!',
        description: `${lastAction}\n\n**${monster.name}** est vaincu!\n\n✨ **+${baseXp}** XP\n💰 **+${baseGold}** or\n\n❤️ PV: **${character.hp.current}/${character.hp.max}**${questText}`,
        color: 0x22C55E,
      });
    }
  } else {
    // Défaite
    if (session.isGroupCombat) {
      // Remettre tous les membres à 25% PV
      const hpTexts = [];
      for (const combatant of session.combatants) {
        combatant.character.hp.current = Math.ceil(combatant.character.hp.max * 0.25);
        combatant.character.stats.deaths = (combatant.character.stats.deaths || 0) + 1;
        await combatant.character.save();
        hpTexts.push(`${combatant.character.name}: **${combatant.character.hp.current}** PV`);
      }
      
      embed = createEmbed({
        title: '💀 Défaite du groupe...',
        description: [
          lastAction,
          '',
          `Le groupe a été vaincu par **${monster.name}**...`,
          '',
          '**Vous vous réveillez:**',
          ...hpTexts,
        ].join('\n'),
        color: 0xEF4444,
      });
    } else {
      const character = session.character;
      character.hp.current = Math.ceil(character.hp.max * 0.25);
      character.stats.deaths = (character.stats.deaths || 0) + 1;
      await character.save();
      
      embed = createEmbed({
        title: '💀 Défaite...',
        description: `${lastAction}\n\nVous avez été vaincu par **${monster.name}**...\n\nVous vous réveillez avec **${character.hp.current}** PV.`,
        color: 0xEF4444,
      });
    }
  }
  
  try {
    await interaction.update({ embeds: [embed], components: [] });
  } catch (e) {
    await interaction.editReply({ embeds: [embed], components: [] });
  }
}

async function forceEnd(interaction, session) {
  // Supprimer les sessions de tous les participants
  if (session.isGroupCombat) {
    for (const combatant of session.combatants) {
      combatSessions.delete(combatant.odUserId);
    }
  } else {
    combatSessions.delete(interaction.user.id);
  }
  
  await interaction.update({
    embeds: [createEmbed({
      title: '🚪 Combat abandonné',
      description: session.isGroupCombat ? 'Le groupe a quitté le combat.' : 'Vous avez quitté le combat.',
      color: 0x6B7280,
    })],
    components: [],
  });
}

async function showStatus(interaction) {
  const session = combatSessions.get(interaction.user.id);
  
  if (!session) {
    return interaction.reply({
      embeds: [errorEmbed('Pas de combat', 'Vous n\'êtes pas en combat.')],
      ephemeral: true,
    });
  }
  
  await interaction.reply({
    embeds: [buildEmbed(session, '📊 État du combat')],
    ephemeral: true,
  });
}

async function showMainMenu(interaction, session) {
  await interaction.update({
    embeds: [buildEmbed(session, '🎯 **Votre tour!**')],
    components: buildMainButtons(session),
  });
}

// ============================================================
// INTERFACE (EMBEDS & BOUTONS)
// ============================================================

function buildEmbed(session, message) {
  const { monster, round, effects } = session;
  
  const embed = createEmbed({
    title: session.isGroupCombat ? `⚔️ Combat de groupe - Round ${round}` : `⚔️ Combat - Round ${round}`,
    description: message,
    color: 0xEF4444,
  });
  
  if (session.isGroupCombat) {
    // Afficher tous les membres du groupe
    for (let i = 0; i < session.combatants.length; i++) {
      const combatant = session.combatants[i];
      const char = combatant.character;
      const isCurrentTurn = session.playerTurn && i === session.currentTurnIndex;
      
      const charHp = hpBar(char.hp.current, char.hp.max, { compact: true });
      const status = [];
      if (combatant.defending) status.push('🛡️');
      if (combatant.effects?.rage) status.push('😤');
      if (char.hp.current <= 0) status.push('💀');
      
      const turnIndicator = isCurrentTurn ? '➤ ' : '';
      
      embed.addFields({
        name: `${turnIndicator}🧑 ${char.name} ${status.join('')}`,
        value: `${charHp}\nCA: ${char.ac}`,
        inline: true,
      });
    }
    
    // Ligne vide pour séparer
    if (session.combatants.length % 3 !== 0) {
      const empties = 3 - (session.combatants.length % 3);
      for (let i = 0; i < empties; i++) {
        embed.addFields({ name: '\u200b', value: '\u200b', inline: true });
      }
    }
  } else {
    // Combat solo
    const character = session.character;
    const playerHp = hpBar(character.hp.current, character.hp.max, { compact: true });
    const playerStatus = [];
    if (session.defending) playerStatus.push('🛡️');
    if (session.effects.rage) playerStatus.push('😤');
    
    embed.addFields({
      name: `🧑 ${character.name} ${playerStatus.join('')}`,
      value: `${playerHp}\nCA: ${character.ac}`,
      inline: true,
    });
  }
  
  // Monstre
  const monsterHp = hpBar(monster.hp.current, monster.hp.max, { compact: true });
  const monsterStatus = [];
  if (effects.stunned) monsterStatus.push('💫');
  
  embed.addFields({
    name: `${monster.emoji || '👹'} ${monster.name} ${monsterStatus.join('')}`,
    value: `${monsterHp}\nCA: ${monster.ac}`,
    inline: true,
  });
  
  return embed;
}

function buildMainButtons(session) {
  // En groupe, utiliser le personnage du combattant actuel
  const character = session.isGroupCombat 
    ? session.combatants[session.currentTurnIndex]?.character 
    : session.character;
  
  if (!character) return [];
  
  const charClass = character.class.toLowerCase();
  
  // Ligne 1: Actions de base
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('combat:attack').setLabel('Attaquer').setStyle(ButtonStyle.Danger).setEmoji('⚔️'),
    new ButtonBuilder().setCustomId('combat:defend').setLabel('Défendre').setStyle(ButtonStyle.Primary).setEmoji('🛡️'),
    new ButtonBuilder().setCustomId('combat:flee').setLabel('Fuir').setStyle(ButtonStyle.Secondary).setEmoji('🏃'),
  );
  
  // Ligne 2: Sorts/Capacités (si disponibles)
  const row2Components = [];
  
  if (SPELLCASTING_CLASSES[charClass]) {
    row2Components.push(
      new ButtonBuilder().setCustomId('combat:spell').setLabel('Sorts').setStyle(ButtonStyle.Primary).setEmoji('🔮')
    );
  }
  
  if (classAbilitiesData[charClass]?.abilities) {
    row2Components.push(
      new ButtonBuilder().setCustomId('combat:ability').setLabel('Capacités').setStyle(ButtonStyle.Primary).setEmoji('⚡')
    );
  }
  
  row2Components.push(
    new ButtonBuilder().setCustomId('combat:quit').setLabel('Quitter').setStyle(ButtonStyle.Secondary).setEmoji('🚪')
  );
  
  const components = [row1];
  
  if (row2Components.length > 1) {
    components.push(new ActionRowBuilder().addComponents(row2Components));
  } else {
    row1.addComponents(row2Components[0]);
  }
  
  return components;
}

function buildWaitButton() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('combat:wait')
        .setLabel('Tour de l\'ennemi...')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
        .setEmoji('⏳')
    ),
  ];
}

// ============================================================
// UTILITAIRES
// ============================================================

function getMod(score) {
  return Math.floor((score - 10) / 2);
}

function getProfBonus(level) {
  return Math.ceil(level / 4) + 1;
}

function getEquippedWeapon(character) {
  const slot = character.inventory?.find(i => i.equipped && i.slot === 'mainHand');
  if (slot) return getItem(slot.itemId);
  return null;
}

function findSpell(spellId) {
  for (const level of ['level1', 'level2', 'level3']) {
    if (spellsData[level]?.[spellId]) {
      return { ...spellsData[level][spellId], level: parseInt(level.replace('level', '')) };
    }
  }
  return null;
}

function rollSpellDamage(expr, isCrit, charLevel) {
  if (!expr) return 0;
  
  // Scaling cantrips
  let formula = expr;
  if (charLevel >= 17) formula = formula.replace(/^1d/, '4d');
  else if (charLevel >= 11) formula = formula.replace(/^1d/, '3d');
  else if (charLevel >= 5) formula = formula.replace(/^1d/, '2d');
  
  const result = roll(formula).total;
  return isCrit ? result * 2 : result;
}

function getAbilityUses(character, abilityId, ability) {
  if (!ability.uses) return { remaining: Infinity, max: null };
  
  const stored = character.abilities?.find(a => a.id === abilityId);
  const used = stored?.uses || 0;
  
  return { remaining: Math.max(0, ability.uses - used), max: ability.uses };
}

function consumeAbilityUse(character, abilityId) {
  if (!character.abilities) character.abilities = [];
  
  let stored = character.abilities.find(a => a.id === abilityId);
  if (!stored) {
    stored = { id: abilityId, uses: 0 };
    character.abilities.push(stored);
  }
  stored.uses++;
}
