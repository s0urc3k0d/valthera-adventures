'use client';

import { Sword, Wand2, Crosshair, Heart, Trees, ShieldCheck, Shield, Music, BookOpen, Flame, Skull, Sparkles } from 'lucide-react';

export default function ClassesPage() {
  // Données des classes (basé sur D&D 5E)
  const classesData = [
    {
      id: 'fighter',
      name: 'Guerrier',
      description: "Maîtres du combat martial, experts de toutes les armes et armures. Que ce soit avec une épée et un bouclier, ou une grande arme à deux mains, le guerrier excelle au corps à corps.",
      icon: Sword,
      gradient: 'from-red-600 to-red-800',
      textColor: 'text-red-400',
      bgColor: 'bg-red-500/20',
      hitDie: 'd10',
      primaryAbility: 'Force ou Dextérité',
      savingThrows: 'Force, Constitution',
      armorProficiencies: 'Toutes armures, boucliers',
      weaponProficiencies: 'Armes simples et martiales',
      features: [
        { name: 'Second Wind', level: 1, description: 'Récupérez 1d10 + niveau PV en action bonus une fois par repos court.' },
        { name: 'Style de Combat', level: 1, description: "Choisissez un style de combat: Duel, Défense, Combat à deux armes, etc." },
        { name: 'Sursaut d\'Action', level: 2, description: 'Une action supplémentaire une fois par repos court.' },
        { name: 'Attaque Supplémentaire', level: 5, description: 'Attaquez deux fois au lieu d\'une lorsque vous prenez l\'action Attaquer.' },
      ],
    },
    {
      id: 'wizard',
      name: 'Magicien',
      description: "Érudits de la magie arcanique, les magiciens passent leur vie à étudier les secrets des sorts. Leur pouvoir vient de leur intelligence et de leur grimoire.",
      icon: Wand2,
      gradient: 'from-blue-600 to-blue-800',
      textColor: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      hitDie: 'd6',
      primaryAbility: 'Intelligence',
      savingThrows: 'Intelligence, Sagesse',
      armorProficiencies: 'Aucune',
      weaponProficiencies: 'Dagues, fléchettes, frondes, bâtons, arbalètes légères',
      features: [
        { name: 'Incantation', level: 1, description: 'Lancez des sorts arcaniques en utilisant l\'Intelligence.' },
        { name: 'Récupération Arcanique', level: 1, description: 'Récupérez des emplacements de sorts une fois par jour.' },
        { name: 'Tradition Arcanique', level: 2, description: "Choisissez une école de magie: Évocation, Abjuration, Illusion, etc." },
        { name: 'Maîtrise des Sorts', level: 18, description: 'Lancez certains sorts à volonté.' },
      ],
    },
    {
      id: 'rogue',
      name: 'Roublard',
      description: "Maîtres de la furtivité et de la ruse, les roublards frappent dans l'ombre avec une précision mortelle. Ils excellent dans les compétences et les attaques sournoises.",
      icon: Crosshair,
      gradient: 'from-green-600 to-green-800',
      textColor: 'text-green-400',
      bgColor: 'bg-green-500/20',
      hitDie: 'd8',
      primaryAbility: 'Dextérité',
      savingThrows: 'Dextérité, Intelligence',
      armorProficiencies: 'Armures légères',
      weaponProficiencies: 'Armes simples, arbalètes de poing, épées courtes/longues, rapières',
      features: [
        { name: 'Attaque Sournoise', level: 1, description: "Infligez 1d6 dégâts supplémentaires avec avantage ou allié adjacent." },
        { name: 'Argot des Voleurs', level: 1, description: 'Langage secret des roublards.' },
        { name: 'Ruse', level: 2, description: 'Se cacher, se désengager ou foncer en action bonus.' },
        { name: 'Esquive Instinctive', level: 5, description: 'Divisez par deux les dégâts d\'une attaque en réaction.' },
      ],
    },
    {
      id: 'cleric',
      name: 'Clerc',
      description: "Champions des dieux, les clercs canalisent la puissance divine pour soigner les alliés et châtier les ennemis. Leur foi est leur plus grande arme.",
      icon: Heart,
      gradient: 'from-yellow-500 to-yellow-700',
      textColor: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      hitDie: 'd8',
      primaryAbility: 'Sagesse',
      savingThrows: 'Sagesse, Charisme',
      armorProficiencies: 'Armures légères et intermédiaires, boucliers',
      weaponProficiencies: 'Armes simples',
      features: [
        { name: 'Incantation', level: 1, description: 'Lancez des sorts divins en utilisant la Sagesse.' },
        { name: 'Domaine Divin', level: 1, description: 'Choisissez un domaine: Vie, Guerre, Lumière, etc.' },
        { name: 'Renvoi des Morts-vivants', level: 2, description: 'Repoussez les morts-vivants avec votre symbole sacré.' },
        { name: 'Intervention Divine', level: 10, description: 'Demandez l\'aide directe de votre divinité.' },
      ],
    },
    {
      id: 'ranger',
      name: 'Rôdeur',
      description: "Chasseurs des étendues sauvages, les rôdeurs traquent leurs proies avec une expertise inégalée. Ils combinent compétences martiales et magie de la nature.",
      icon: Trees,
      gradient: 'from-emerald-600 to-emerald-800',
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
      hitDie: 'd10',
      primaryAbility: 'Dextérité et Sagesse',
      savingThrows: 'Force, Dextérité',
      armorProficiencies: 'Armures légères et intermédiaires, boucliers',
      weaponProficiencies: 'Armes simples et martiales',
      features: [
        { name: 'Ennemi Juré', level: 1, description: 'Bonus contre un type de créature choisi.' },
        { name: 'Explorateur-né', level: 1, description: 'Avantages en terrain choisi.' },
        { name: 'Style de Combat', level: 2, description: 'Archerie ou Combat à deux armes.' },
        { name: 'Incantation', level: 2, description: 'Lancez des sorts de rôdeur.' },
      ],
    },
    {
      id: 'paladin',
      name: 'Paladin',
      description: "Chevaliers saints liés par un serment sacré, les paladins combinent prouesses martiales et magie divine pour défendre la justice et punir le mal.",
      icon: ShieldCheck,
      gradient: 'from-amber-500 to-amber-700',
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      hitDie: 'd10',
      primaryAbility: 'Force et Charisme',
      savingThrows: 'Sagesse, Charisme',
      armorProficiencies: 'Toutes armures, boucliers',
      weaponProficiencies: 'Armes simples et martiales',
      features: [
        { name: 'Sens Divin', level: 1, description: 'Détectez le mal et le bien à proximité.' },
        { name: 'Imposition des Mains', level: 1, description: 'Soignez avec une réserve de points égale à 5× niveau.' },
        { name: 'Châtiment Divin', level: 2, description: 'Dépensez un emplacement pour +2d8 dégâts radiants.' },
        { name: 'Serment Sacré', level: 3, description: 'Choisissez: Dévotion, Anciens, Vengeance, etc.' },
      ],
    },
    {
      id: 'barbarian',
      name: 'Barbare',
      description: "Guerriers primitifs animés par une rage dévastatrice, les barbares sont des combattants féroces qui absorbent les dégâts et frappent avec une force brutale.",
      icon: Flame,
      gradient: 'from-orange-600 to-red-700',
      textColor: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      hitDie: 'd12',
      primaryAbility: 'Force',
      savingThrows: 'Force, Constitution',
      armorProficiencies: 'Armures légères et intermédiaires, boucliers',
      weaponProficiencies: 'Armes simples et martiales',
      features: [
        { name: 'Rage', level: 1, description: 'Bonus aux dégâts, résistance aux dégâts physiques.' },
        { name: 'Défense sans Armure', level: 1, description: 'CA = 10 + Dex + Con sans armure.' },
        { name: 'Attaque Téméraire', level: 2, description: 'Avantage aux attaques, mais ennemis ont avantage contre vous.' },
        { name: 'Sens du Danger', level: 2, description: 'Avantage aux jets de Dextérité contre effets visibles.' },
      ],
    },
    {
      id: 'bard',
      name: 'Barde',
      description: "Artistes et conteurs dont les mots et la musique sont imprégnés de magie. Les bardes inspirent leurs alliés et démoralisent leurs ennemis.",
      icon: Music,
      gradient: 'from-pink-500 to-purple-600',
      textColor: 'text-pink-400',
      bgColor: 'bg-pink-500/20',
      hitDie: 'd8',
      primaryAbility: 'Charisme',
      savingThrows: 'Dextérité, Charisme',
      armorProficiencies: 'Armures légères',
      weaponProficiencies: 'Armes simples, arbalètes de poing, épées, rapières',
      features: [
        { name: 'Incantation', level: 1, description: 'Lancez des sorts bardiques via le Charisme.' },
        { name: 'Inspiration Bardique', level: 1, description: 'Donnez un d6 bonus à un allié.' },
        { name: 'Touche-à-tout', level: 2, description: 'Ajoutez la moitié de votre bonus de maîtrise aux tests non maîtrisés.' },
        { name: 'Collège Bardique', level: 3, description: 'Choisissez: Savoir, Vaillance, Éloquence, etc.' },
      ],
    },
    {
      id: 'monk',
      name: 'Moine',
      description: "Maîtres des arts martiaux qui canalisent leur ki intérieur pour accomplir des prouesses surhumaines. Ils sont rapides, mortels et résistants.",
      icon: Sparkles,
      gradient: 'from-cyan-500 to-blue-600',
      textColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20',
      hitDie: 'd8',
      primaryAbility: 'Dextérité et Sagesse',
      savingThrows: 'Force, Dextérité',
      armorProficiencies: 'Aucune',
      weaponProficiencies: 'Armes simples, épées courtes',
      features: [
        { name: 'Arts Martiaux', level: 1, description: "Utilisez Dex pour les attaques à mains nues, dégâts d'arts martiaux." },
        { name: 'Défense sans Armure', level: 1, description: 'CA = 10 + Dex + Sag sans armure.' },
        { name: 'Ki', level: 2, description: 'Points de ki pour déluge de coups, désengagement patient, etc.' },
        { name: 'Déplacement sans Armure', level: 2, description: 'Vitesse +10 pieds sans armure.' },
      ],
    },
    {
      id: 'warlock',
      name: 'Occultiste',
      description: "Mages qui ont conclu un pacte avec une entité puissante. En échange de leur service, ils reçoivent des pouvoirs arcaniques uniques.",
      icon: Skull,
      gradient: 'from-purple-600 to-purple-900',
      textColor: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      hitDie: 'd8',
      primaryAbility: 'Charisme',
      savingThrows: 'Sagesse, Charisme',
      armorProficiencies: 'Armures légères',
      weaponProficiencies: 'Armes simples',
      features: [
        { name: 'Patron d\'Outre-monde', level: 1, description: 'Choisissez: Fiélon, Archifée, Grand Ancien, etc.' },
        { name: 'Magie de Pacte', level: 1, description: 'Emplacements récupérés sur repos court.' },
        { name: 'Invocations Occultes', level: 2, description: 'Pouvoirs spéciaux accordés par votre patron.' },
        { name: 'Don du Pacte', level: 3, description: 'Chaîne, Lame ou Tome.' },
      ],
    },
    {
      id: 'sorcerer',
      name: 'Ensorceleur',
      description: "Nés avec une magie innée coulant dans leurs veines, les ensorceleurs manipulent la magie brute avec une flexibilité que les magiciens ne peuvent qu'envier.",
      icon: BookOpen,
      gradient: 'from-red-500 to-orange-500',
      textColor: 'text-orange-300',
      bgColor: 'bg-orange-500/20',
      hitDie: 'd6',
      primaryAbility: 'Charisme',
      savingThrows: 'Constitution, Charisme',
      armorProficiencies: 'Aucune',
      weaponProficiencies: 'Dagues, fléchettes, frondes, bâtons, arbalètes légères',
      features: [
        { name: 'Incantation', level: 1, description: 'Lancez des sorts innés via le Charisme.' },
        { name: 'Origine Magique', level: 1, description: 'Source de votre pouvoir: Draconique, Magie Sauvage, etc.' },
        { name: 'Points de Sorcellerie', level: 2, description: 'Pool de points pour métamagies.' },
        { name: 'Métamagie', level: 3, description: 'Modifiez vos sorts: Sort étendu, Sort jumeau, etc.' },
      ],
    },
    {
      id: 'druid',
      name: 'Druide',
      description: "Gardiens de la nature qui canalisent la magie primordiale. Ils peuvent se transformer en animaux et commander aux éléments.",
      icon: Trees,
      gradient: 'from-green-600 to-teal-600',
      textColor: 'text-teal-400',
      bgColor: 'bg-teal-500/20',
      hitDie: 'd8',
      primaryAbility: 'Sagesse',
      savingThrows: 'Intelligence, Sagesse',
      armorProficiencies: 'Armures légères et intermédiaires (non-métal), boucliers (non-métal)',
      weaponProficiencies: 'Gourdin, dague, fléchette, javeline, masse, bâton, cimeterre, fronde, serpe',
      features: [
        { name: 'Druidique', level: 1, description: 'Langage secret des druides.' },
        { name: 'Incantation', level: 1, description: 'Lancez des sorts druidiques via la Sagesse.' },
        { name: 'Forme Sauvage', level: 2, description: 'Transformez-vous en animal.' },
        { name: 'Cercle Druidique', level: 2, description: 'Choisissez: Terre, Lune, Rêves, etc.' },
      ],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-valthera-100 font-medieval mb-4">
          Classes
        </h1>
        <p className="text-valthera-200/70 max-w-2xl mx-auto font-body">
          Choisissez parmi 12 classes uniques inspirées de D&D 5e, chacune avec ses propres forces, 
          faiblesses et capacités spéciales.
        </p>
      </div>

      {/* Quick Navigation */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {classesData.map((cls) => {
          const Icon = cls.icon;
          return (
            <a
              key={cls.id}
              href={`#${cls.id}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${cls.bgColor} ${cls.textColor} hover:opacity-80 transition-opacity`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{cls.name}</span>
            </a>
          );
        })}
      </div>

      {/* Classes Grid */}
      <div className="space-y-12">
        {classesData.map((cls) => {
          const Icon = cls.icon;

          return (
            <div key={cls.id} id={cls.id} className="card overflow-hidden scroll-mt-24">
              {/* Header */}
              <div className={`bg-gradient-to-r ${cls.gradient} p-8 relative`}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative flex items-center gap-6">
                  <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center">
                    <Icon className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white font-medieval mb-2">
                      {cls.name}
                    </h2>
                    <p className="text-white/80 text-lg max-w-2xl">{cls.description}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Stats */}
                  <div>
                    <h3 className="text-lg font-semibold text-valthera-100 mb-4 font-medieval">Caractéristiques</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-valthera-200/60 font-body">Dé de vie</span>
                        <span className={`font-bold ${cls.textColor}`}>{cls.hitDie}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-valthera-200/60 font-body">Caractéristique principale</span>
                        <span className="text-valthera-100 text-sm text-right">{cls.primaryAbility}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-valthera-200/60 font-body">Jets de sauvegarde</span>
                        <span className="text-valthera-100 text-sm text-right">{cls.savingThrows}</span>
                      </div>
                    </div>
                  </div>

                  {/* Proficiencies */}
                  <div>
                    <h3 className="text-lg font-semibold text-valthera-100 mb-4 font-medieval">Maîtrises</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-valthera-200/50 font-body">Armures</span>
                        <p className="text-valthera-200 text-sm font-body">{cls.armorProficiencies || 'Aucune'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-valthera-200/50 font-body">Armes</span>
                        <p className="text-valthera-200 text-sm font-body">{cls.weaponProficiencies}</p>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h3 className="text-lg font-semibold text-valthera-100 mb-4 font-medieval">Capacités principales</h3>
                    <div className="space-y-3">
                      {cls.features.map((feature) => (
                        <div key={feature.name} className="bg-valthera-800/50 rounded-lg p-3 border border-valthera-700/50">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-valthera-100 text-sm">{feature.name}</span>
                            <span className="text-xs text-valthera-200/50">Nv.{feature.level}</span>
                          </div>
                          <p className="text-xs text-valthera-200/60 font-body">{feature.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
