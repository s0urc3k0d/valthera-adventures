import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, infoEmbed } from '../../utils/embedBuilder.js';
import constants from '../../config/constants.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Afficher l\'aide et la liste des commandes')
    .addStringOption(option =>
      option
        .setName('commande')
        .setDescription('Obtenir de l\'aide sur une commande spécifique')
        .setRequired(false)
        .addChoices(
          { name: 'create', value: 'create' },
          { name: 'sheet', value: 'sheet' },
          { name: 'combat', value: 'combat' },
          { name: 'explore', value: 'explore' },
          { name: 'travel', value: 'travel' },
          { name: 'look', value: 'look' },
          { name: 'rest', value: 'rest' },
          { name: 'inventory', value: 'inventory' },
          { name: 'shop', value: 'shop' },
          { name: 'sell', value: 'sell' },
          { name: 'wallet', value: 'wallet' },
          { name: 'craft', value: 'craft' },
          { name: 'quests', value: 'quests' },
          { name: 'talk', value: 'talk' },
          { name: 'party', value: 'party' },
          { name: 'guild', value: 'guild' },
          { name: 'trade', value: 'trade' }
        )
    ),
  
  cooldown: 3,
  
  async execute(interaction) {
    const commandName = interaction.options.getString('commande');
    
    if (commandName) {
      const commandHelp = getCommandHelp(commandName);
      return interaction.reply({ embeds: [commandHelp], ephemeral: true });
    }
    
    const embed = createEmbed({
      title: '📖 Valthera Adventures - Aide',
      description: [
        'Bienvenue dans **Valthera Adventures**!',
        'Un RPG Discord basé sur D&D 5E.',
        '',
        '*Utilisez `/help <commande>` pour plus de détails.*',
      ].join('\n'),
      color: constants.bot.embedColors.info,
    });
    
    embed.addFields({
      name: '👤 Personnage',
      value: [
        '`/create` - Créer un nouveau personnage',
        '`/sheet` - Feuille de personnage',
        '`/stats` - Statistiques détaillées',
        '`/inventory` - Gérer votre inventaire',
        '`/give` - Donner un item (admin)',
      ].join('\n'),
      inline: true,
    });
    
    embed.addFields({
      name: '⚔️ Combat',
      value: [
        '`/combat start` - Lancer un combat',
        '`/combat status` - État du combat',
        '',
        '*Actions via boutons:*',
        '⚔️ Attaque | 🛡️ Défense | 🏃 Fuite',
        '✨ Sorts | 💪 Capacités',
      ].join('\n'),
      inline: true,
    });
    
    embed.addFields({
      name: '🗺️ Exploration',
      value: [
        '`/travel` - Voyager vers une zone',
        '`/explore` - Explorer la zone',
        '`/look` - Examiner les alentours',
        '`/map` - Voir la carte',
        '`/rest` - Se reposer',
      ].join('\n'),
      inline: true,
    });
    
    embed.addFields({
      name: '💰 Économie',
      value: [
        '`/shop` - Voir les boutiques',
        '`/sell` - Vendre des objets',
        '`/wallet` - Votre porte-monnaie',
        '`/craft` - Fabriquer des objets',
      ].join('\n'),
      inline: true,
    });
    
    embed.addFields({
      name: '📜 Quêtes',
      value: [
        '`/quests journal` - Quêtes actives',
        '`/quests available` - Quêtes disponibles',
        '`/quests reputation` - Réputation',
        '`/talk` - Parler aux PNJs',
      ].join('\n'),
      inline: true,
    });
    
    embed.addFields({
      name: '� Social',
      value: [
        '`/party` - Système de groupe',
        '`/guild` - Système de guilde',
        '`/trade` - Échanger avec joueurs',
      ].join('\n'),
      inline: true,
    });
    
    embed.addFields({
      name: '�💤 Repos',
      value: [
        '`/rest` - Menu de repos',
        '☕ Court (1h) - Dés de vie',
        '🛏️ Long (8h) - Récupération totale',
      ].join('\n'),
      inline: true,
    });
    
    embed.addFields({
      name: 'ℹ️ Informations',
      value: [
        '`/help` - Cette aide',
        '`/help <cmd>` - Détails commande',
      ].join('\n'),
      inline: true,
    });
    
    embed.setFooter({
      text: 'Que votre aventure à Valthera soit épique! ⚔️🐉',
    });
    
    await interaction.reply({ embeds: [embed] });
  },
};

function getCommandHelp(command) {
  const helps = {
    create: {
      title: '/create',
      description: 'Créez votre personnage pour Valthera Adventures.',
      fields: [
        { name: 'Usage', value: '`/create`', inline: false },
        { name: 'Étapes', value: '1. Choisir un nom\n2. Choisir une race (et sous-race)\n3. Choisir une classe\n4. Choisir un historique\n5. Répartir les attributs (Point Buy)\n6. Choisir les compétences', inline: false },
        { name: 'Note', value: 'Un seul personnage par serveur. Session de 15 minutes.', inline: false },
      ],
    },
    sheet: {
      title: '/sheet',
      description: 'Affiche votre feuille de personnage complète avec navigation par boutons.',
      fields: [
        { name: 'Usage', value: '`/sheet [joueur] [vue]`', inline: false },
        { name: 'Options', value: '`joueur` - Voir la feuille d\'un autre joueur\n`vue` - Résumé, Stats, Équipement, Capacités', inline: false },
        { name: 'Navigation', value: 'Utilisez les boutons pour changer de vue.', inline: false },
      ],
    },
    combat: {
      title: '/combat',
      description: 'Système de combat au tour par tour contre des monstres.',
      fields: [
        { name: 'Usage', value: '`/combat start [monstre]` - Lancer un combat\n`/combat status` - Voir l\'état actuel', inline: false },
        { name: 'Actions (boutons)', value: '⚔️ **Attaque** - Attaque de base avec votre arme\n🛡️ **Défense** - +2 CA jusqu\'au prochain tour\n🏃 **Fuite** - Jet de Dextérité pour fuir', inline: false },
        { name: 'Magie (menus)', value: '✨ **Sorts** - Lancer un sort connu\n💪 **Capacités** - Utiliser une capacité de classe', inline: false },
        { name: 'Mécanique', value: 'Initiative → Tour joueur/monstre → Victoire/Défaite', inline: false },
      ],
    },
    explore: {
      title: '/explore',
      description: 'Explorez la zone actuelle pour découvrir des trésors et rencontres.',
      fields: [
        { name: 'Usage', value: '`/explore`', inline: false },
        { name: 'Résultats possibles', value: '⚔️ Rencontre de monstre\n📦 Coffre au trésor\n💧 Source de guérison\n🏛️ Ruines anciennes\n⚠️ Piège\n🌿 Rien de spécial', inline: false },
        { name: 'Découvertes', value: 'Les POIs cachés nécessitent un jet de Perception.', inline: false },
        { name: 'Cooldown', value: '30 secondes entre chaque exploration.', inline: false },
      ],
    },
    travel: {
      title: '/travel',
      description: 'Voyagez vers une zone connectée à votre position actuelle.',
      fields: [
        { name: 'Usage', value: '`/travel` - Menu des destinations\n`/travel <destination>` - Voyage direct', inline: false },
        { name: 'Prérequis', value: 'Certaines zones requièrent:\n- Niveau minimum\n- Quête complétée\n- Objet spécifique', inline: false },
        { name: 'Coût', value: 'Certains voyages coûtent de l\'or.', inline: false },
      ],
    },
    look: {
      title: '/look',
      description: 'Examinez les alentours de la zone actuelle.',
      fields: [
        { name: 'Usage', value: '`/look` - Vue générale', inline: false },
        { name: 'Informations', value: '👤 PNJs présents\n🏪 Boutiques et services\n📍 Points d\'intérêt\n🗺️ Zones connectées', inline: false },
        { name: 'Navigation', value: 'Boutons pour filtrer par catégorie.', inline: false },
      ],
    },
    rest: {
      title: '/rest',
      description: 'Reposez-vous pour récupérer PV et capacités.',
      fields: [
        { name: 'Usage', value: '`/rest` - Menu de choix\n`/rest type:short` - Repos court\n`/rest type:long` - Repos long', inline: false },
        { name: '☕ Repos court (1h)', value: '- Utilisez vos dés de vie pour récupérer des PV\n- Récupère certaines capacités (recharge: shortRest)', inline: false },
        { name: '🛏️ Repos long (8h)', value: '- Récupération complète des PV\n- Récupère tous les emplacements de sorts\n- Récupère toutes les capacités\n- Récupère la moitié des dés de vie', inline: false },
        { name: 'Restrictions', value: 'Impossible dans les donjons ou zones dangereuses.', inline: false },
      ],
    },
    inventory: {
      title: '/inventory',
      description: 'Gérez votre inventaire avec pagination et filtres.',
      fields: [
        { name: 'Usage', value: '`/inventory` - Voir l\'inventaire\n`/inventory action:equipment` - Équipement\n`/inventory action:use` - Items utilisables', inline: false },
        { name: 'Actions', value: '⚔️ Équiper/Déséquiper\n🧪 Utiliser un consommable\n🗑️ Jeter un objet', inline: false },
        { name: 'Filtres', value: 'Par catégorie: Armes, Armures, Consommables, etc.', inline: false },
      ],
    },
    shop: {
      title: '/shop',
      description: 'Visitez les boutiques de la zone pour acheter des équipements.',
      fields: [
        { name: 'Usage', value: '`/shop` - Liste des boutiques\n`/shop boutique:<nom>` - Boutique spécifique', inline: false },
        { name: 'Types de boutiques', value: '🛡️ Armurier - Armures\n⚔️ Forgeron - Armes\n🧪 Apothicaire - Potions\n📦 Bazar - Divers\n✨ Magique - Objets rares', inline: false },
        { name: 'Achat', value: 'Sélectionnez un item → Détails → Acheter', inline: false },
      ],
    },
    sell: {
      title: '/sell',
      description: 'Vendez vos objets aux marchands de la zone.',
      fields: [
        { name: 'Usage', value: '`/sell` - Menu de vente\n`/sell item:<nom> quantité:<n>`', inline: false },
        { name: 'Prix', value: 'Prix de vente = 50% du prix d\'achat', inline: false },
        { name: 'Vente rapide', value: '🗑️ "Vendre le bazar" - Vend tous les objets communs misc', inline: false },
        { name: 'Note', value: 'Les objets équipés ne peuvent pas être vendus.', inline: false },
      ],
    },
    wallet: {
      title: '/wallet',
      description: 'Consultez votre porte-monnaie et gérez vos devises.',
      fields: [
        { name: 'Usage', value: '`/wallet`', inline: false },
        { name: 'Devises', value: '⚪ Platine (pp) = 10 po\n🟡 Or (po) = 10 pa\n⚫ Argent (pa) = 10 pc\n🟤 Cuivre (pc)', inline: false },
        { name: 'Actions', value: '🟡 Consolider - Convertit vers le haut\n💱 Diviser - Convertit vers le bas', inline: false },
      ],
    },
    craft: {
      title: '/craft',
      description: 'Fabriquez des objets à partir de matériaux collectés.',
      fields: [
        { name: 'Usage', value: '`/craft` - Liste des recettes\n`/craft recette:<nom>`', inline: false },
        { name: 'Catégories', value: '🔨 Basique - Torches, cordes\n⚗️ Alchimie - Potions\n⚒️ Forge - Armes, armures\n🦺 Cuir - Armures légères\n✨ Enchantement - Objets magiques', inline: false },
        { name: 'Mécanique', value: '1. Avoir les matériaux\n2. Jet de compétence vs DC\n3. Succès = objet créé\n4. Échec = 50% matériaux récupérés', inline: false },
      ],
    },
    quests: {
      title: '/quests',
      description: 'Gérez vos quêtes et suivez votre progression.',
      fields: [
        { name: 'Usage', value: '`/quests journal` - Quêtes actives\n`/quests available` - Quêtes disponibles\n`/quests completed` - Historique\n`/quests reputation` - Réputation', inline: false },
        { name: 'Types de quêtes', value: '📜 **Principales** - Histoire de Valthera\n📋 **Secondaires** - Quêtes optionnelles\n📄 **Contrats** - Missions de guilde\n⏰ **Journalières** - Reset quotidien', inline: false },
        { name: 'Objectifs', value: '⚔️ Tuer des monstres\n📦 Collecter des items\n💬 Parler à des PNJs\n🗺️ Explorer des zones\n🚶 Atteindre des lieux', inline: false },
        { name: 'Récompenses', value: 'XP, Or, Objets, Réputation', inline: false },
      ],
    },
    talk: {
      title: '/talk',
      description: 'Parlez aux PNJs de la zone pour dialoguer et accepter des quêtes.',
      fields: [
        { name: 'Usage', value: '`/talk` - Liste des PNJs\n`/talk pnj:<nom>` - Parler à un PNJ', inline: false },
        { name: 'Dialogues', value: 'Les PNJs ont des dialogues ramifiés.\nChoisissez vos réponses avec les boutons.', inline: false },
        { name: 'Actions possibles', value: '📜 Accepter des quêtes\n✅ Rendre des quêtes\n🛒 Ouvrir une boutique\n💬 Obtenir des informations', inline: false },
        { name: 'Note', value: 'Certains dialogues nécessitent des quêtes actives ou une réputation suffisante.', inline: false },
      ],
    },
    party: {
      title: '/party',
      description: 'Formez un groupe avec d\'autres aventuriers pour jouer ensemble.',
      fields: [
        { name: 'Usage', value: '`/party create` - Créer un groupe\n`/party invite @joueur` - Inviter quelqu\'un\n`/party info` - Infos du groupe\n`/party leave` - Quitter le groupe\n`/party disband` - Dissoudre (chef)', inline: false },
        { name: 'Taille', value: 'Maximum 6 membres par groupe', inline: true },
        { name: 'Rôles', value: '👑 Chef - Peut inviter/expulser\n👤 Membre - Participant', inline: true },
        { name: 'Distribution du butin', value: '🔄 **Tour par tour** - Chacun son tour\n🎲 **Aléatoire** - Au hasard\n👑 **Chef décide** - Le leader distribue\n🆓 **Libre** - Premier arrivé', inline: false },
        { name: 'Avantages', value: 'Combat en groupe, partage d\'XP et de butin automatique.', inline: false },
      ],
    },
    guild: {
      title: '/guild',
      description: 'Rejoignez ou créez une guilde pour des avantages permanents.',
      fields: [
        { name: 'Usage', value: '`/guild create <nom> <tag>` - Créer (500 po)\n`/guild info` - Infos de guilde\n`/guild members` - Liste des membres\n`/guild bank` - Banque de guilde\n`/guild leave` - Quitter', inline: false },
        { name: 'Coût création', value: '500 pièces d\'or', inline: true },
        { name: 'Taille max', value: '50 membres', inline: true },
        { name: 'Rangs', value: '🌱 Recrue → 👤 Membre → ⭐ Vétéran → 🎖️ Officier → 👑 Chef', inline: false },
        { name: 'Banque', value: 'Les membres peuvent déposer/retirer de l\'or selon leur rang.', inline: false },
        { name: 'Progression', value: 'La guilde gagne de l\'XP et monte en niveau pour des bonus.', inline: false },
      ],
    },
    trade: {
      title: '/trade',
      description: 'Échangez des objets et de l\'or avec d\'autres joueurs.',
      fields: [
        { name: 'Usage', value: '`/trade request @joueur` - Proposer un échange\n`/trade cancel` - Annuler\n`/trade status` - Voir l\'échange en cours', inline: false },
        { name: 'Comment ça marche', value: '1. Proposez un échange à un joueur\n2. Il accepte ou refuse\n3. Ajoutez objets et or\n4. Les deux confirment\n5. Échange effectué!', inline: false },
        { name: 'Actions', value: '📦 Ajouter un objet\n💰 Ajouter de l\'or (+10 po)\n✅ Confirmer l\'échange\n❌ Annuler', inline: false },
        { name: 'Sécurité', value: 'Les deux joueurs doivent confirmer. L\'échange expire après 10 minutes.', inline: false },
      ],
    },
  };
  
  const help = helps[command];
  if (!help) {
    return infoEmbed('Aide', 'Commande non trouvée.');
  }
  
  const embed = createEmbed({
    title: `📖 ${help.title}`,
    description: help.description,
    color: constants.bot.embedColors.info,
  });
  
  for (const field of help.fields) {
    embed.addFields(field);
  }
  
  return embed;
}
