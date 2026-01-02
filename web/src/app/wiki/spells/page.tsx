'use client';

import Link from 'next/link';
import { useState } from 'react';

type Spell = {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string[];
  duration: string;
  description: string;
  damage?: string;
  damageType?: string;
  effect?: string;
  classes: string[];
  emoji: string;
};

const spells: Spell[] = [
  // Cantrips (Level 0)
  { id: 'fire_bolt', name: 'Trait de feu', level: 0, school: 'Évocation', castingTime: 'Action', range: '120 pieds', components: ['V', 'S'], duration: 'Instantané', description: 'Vous lancez un trait de feu sur une créature ou un objet à portée.', damage: '1d10 → 4d10', damageType: 'Feu', classes: ['Magicien', 'Ensorceleur'], emoji: '🔥' },
  { id: 'ray_of_frost', name: 'Rayon de givre', level: 0, school: 'Évocation', castingTime: 'Action', range: '60 pieds', components: ['V', 'S'], duration: 'Instantané', description: 'Un rayon de lumière bleutée glaciale fonce vers une créature à portée.', damage: '1d8 → 4d8', damageType: 'Froid', effect: 'Ralentit la cible', classes: ['Magicien', 'Ensorceleur'], emoji: '❄️' },
  { id: 'sacred_flame', name: 'Flamme sacrée', level: 0, school: 'Évocation', castingTime: 'Action', range: '60 pieds', components: ['V', 'S'], duration: 'Instantané', description: 'Une lumière semblable à une flamme descend sur une créature visible à portée.', damage: '1d8 → 4d8', damageType: 'Radiant', classes: ['Clerc'], emoji: '✨' },
  { id: 'eldritch_blast', name: 'Décharge occulte', level: 0, school: 'Évocation', castingTime: 'Action', range: '120 pieds', components: ['V', 'S'], duration: 'Instantané', description: 'Un rayon d\'énergie crépitante fonce vers une créature à portée.', damage: '1d10 → 4d10', damageType: 'Force', effect: 'Multiple rayons aux niveaux supérieurs', classes: ['Occultiste'], emoji: '💜' },
  { id: 'shocking_grasp', name: 'Poigne électrique', level: 0, school: 'Évocation', castingTime: 'Action', range: 'Contact', components: ['V', 'S'], duration: 'Instantané', description: 'Un éclair jaillit de votre main pour frapper une créature à portée.', damage: '1d8 → 4d8', damageType: 'Foudre', effect: 'Empêche les réactions', classes: ['Magicien', 'Ensorceleur'], emoji: '⚡' },
  { id: 'vicious_mockery', name: 'Moquerie cruelle', level: 0, school: 'Enchantement', castingTime: 'Action', range: '60 pieds', components: ['V'], duration: 'Instantané', description: 'Vous lancez une série d\'insultes magiques à une créature visible.', damage: '1d4 → 4d4', damageType: 'Psychique', effect: 'Désavantage sur prochaine attaque', classes: ['Barde'], emoji: '🎭' },
  { id: 'chill_touch', name: 'Contact glacial', level: 0, school: 'Nécromancie', castingTime: 'Action', range: '120 pieds', components: ['V', 'S'], duration: '1 round', description: 'Une main squelettique fantomatique s\'accroche à la cible.', damage: '1d8 → 4d8', damageType: 'Nécrotique', effect: 'Empêche la guérison', classes: ['Magicien', 'Ensorceleur', 'Occultiste'], emoji: '💀' },
  { id: 'light', name: 'Lumière', level: 0, school: 'Évocation', castingTime: 'Action', range: 'Contact', components: ['V', 'M'], duration: '1 heure', description: 'Vous touchez un objet qui émet une lumière vive dans un rayon de 6 mètres.', classes: ['Magicien', 'Clerc', 'Barde'], emoji: '💡' },
  { id: 'mage_hand', name: 'Main de mage', level: 0, school: 'Invocation', castingTime: 'Action', range: '30 pieds', components: ['V', 'S'], duration: '1 minute', description: 'Une main spectrale flottante apparaît et peut manipuler des objets.', classes: ['Magicien', 'Ensorceleur', 'Occultiste'], emoji: '✋' },
  
  // Level 1 Spells
  { id: 'magic_missile', name: 'Projectile magique', level: 1, school: 'Évocation', castingTime: 'Action', range: '120 pieds', components: ['V', 'S'], duration: 'Instantané', description: 'Vous créez trois projectiles de force magique qui touchent automatiquement.', damage: '3d4+3', damageType: 'Force', effect: 'Touche automatique', classes: ['Magicien', 'Ensorceleur'], emoji: '✨' },
  { id: 'burning_hands', name: 'Mains brûlantes', level: 1, school: 'Évocation', castingTime: 'Action', range: 'Cône 15 pieds', components: ['V', 'S'], duration: 'Instantané', description: 'Des flammes jaillissent de vos doigts en un cône dévastateur.', damage: '3d6', damageType: 'Feu', classes: ['Magicien', 'Ensorceleur'], emoji: '🔥' },
  { id: 'shield', name: 'Bouclier', level: 1, school: 'Abjuration', castingTime: 'Réaction', range: 'Soi-même', components: ['V', 'S'], duration: '1 round', description: 'Une barrière de force invisible vous protège.', effect: '+5 à la CA jusqu\'au prochain tour', classes: ['Magicien', 'Ensorceleur'], emoji: '🛡️' },
  { id: 'cure_wounds', name: 'Soin des blessures', level: 1, school: 'Évocation', castingTime: 'Action', range: 'Contact', components: ['V', 'S'], duration: 'Instantané', description: 'Vous touchez une créature et lui rendez des points de vie.', effect: 'Soigne 1d8 + modificateur', classes: ['Clerc', 'Barde', 'Druide', 'Paladin', 'Rôdeur'], emoji: '💚' },
  { id: 'thunderwave', name: 'Vague tonnante', level: 1, school: 'Évocation', castingTime: 'Action', range: 'Cube 15 pieds', components: ['V', 'S'], duration: 'Instantané', description: 'Une vague de force tonnante émane de vous.', damage: '2d8', damageType: 'Tonnerre', effect: 'Repousse les créatures', classes: ['Magicien', 'Ensorceleur', 'Barde', 'Druide'], emoji: '💨' },
  { id: 'hex', name: 'Maléfice', level: 1, school: 'Enchantement', castingTime: 'Action bonus', range: '90 pieds', components: ['V', 'S', 'M'], duration: 'Concentration, 1 heure', description: 'Vous maudissez une créature, lui infligeant des dégâts supplémentaires.', damage: '+1d6 nécrotique', effect: 'Désavantage sur une caractéristique', classes: ['Occultiste'], emoji: '🔮' },
  { id: 'healing_word', name: 'Mot de guérison', level: 1, school: 'Évocation', castingTime: 'Action bonus', range: '60 pieds', components: ['V'], duration: 'Instantané', description: 'Vous murmurez des mots de pouvoir qui soignent à distance.', effect: 'Soigne 1d4 + modificateur', classes: ['Clerc', 'Barde', 'Druide'], emoji: '💬' },
  
  // Level 2 Spells
  { id: 'scorching_ray', name: 'Rayon ardent', level: 2, school: 'Évocation', castingTime: 'Action', range: '120 pieds', components: ['V', 'S'], duration: 'Instantané', description: 'Vous créez trois rayons de feu que vous lancez sur vos cibles.', damage: '3x2d6', damageType: 'Feu', classes: ['Magicien', 'Ensorceleur'], emoji: '🔥' },
  { id: 'misty_step', name: 'Pas brumeux', level: 2, school: 'Invocation', castingTime: 'Action bonus', range: 'Soi-même', components: ['V'], duration: 'Instantané', description: 'Vous vous téléportez jusqu\'à 30 pieds dans un espace inoccupé visible.', effect: 'Téléportation 30 pieds', classes: ['Magicien', 'Ensorceleur', 'Occultiste'], emoji: '💨' },
  { id: 'hold_person', name: 'Immobiliser un humanoïde', level: 2, school: 'Enchantement', castingTime: 'Action', range: '60 pieds', components: ['V', 'S', 'M'], duration: 'Concentration, 1 minute', description: 'La cible doit réussir un jet de Sagesse ou être paralysée.', effect: 'Paralysie', classes: ['Clerc', 'Barde', 'Druide', 'Ensorceleur', 'Magicien', 'Occultiste'], emoji: '🔒' },
  { id: 'spiritual_weapon', name: 'Arme spirituelle', level: 2, school: 'Évocation', castingTime: 'Action bonus', range: '60 pieds', components: ['V', 'S'], duration: '1 minute', description: 'Vous créez une arme spectrale flottante qui attaque vos ennemis.', damage: '1d8 + modificateur', damageType: 'Force', classes: ['Clerc'], emoji: '⚔️' },
  
  // Level 3 Spells
  { id: 'fireball', name: 'Boule de feu', level: 3, school: 'Évocation', castingTime: 'Action', range: '150 pieds', components: ['V', 'S', 'M'], duration: 'Instantané', description: 'Une explosion de flammes dévastatrice dans une sphère de 20 pieds.', damage: '8d6', damageType: 'Feu', effect: 'Zone de 20 pieds de rayon', classes: ['Magicien', 'Ensorceleur'], emoji: '🔥' },
  { id: 'lightning_bolt', name: 'Éclair', level: 3, school: 'Évocation', castingTime: 'Action', range: 'Ligne 100 pieds', components: ['V', 'S', 'M'], duration: 'Instantané', description: 'Un éclair jaillit de vos doigts en une ligne de 100 pieds.', damage: '8d6', damageType: 'Foudre', classes: ['Magicien', 'Ensorceleur'], emoji: '⚡' },
  { id: 'counterspell', name: 'Contresort', level: 3, school: 'Abjuration', castingTime: 'Réaction', range: '60 pieds', components: ['S'], duration: 'Instantané', description: 'Vous tentez d\'interrompre une créature en train de lancer un sort.', effect: 'Annule les sorts de niveau 3 ou moins', classes: ['Magicien', 'Ensorceleur', 'Occultiste'], emoji: '🚫' },
  { id: 'revivify', name: 'Revigorer', level: 3, school: 'Nécromancie', castingTime: 'Action', range: 'Contact', components: ['V', 'S', 'M'], duration: 'Instantané', description: 'Vous touchez une créature morte depuis moins d\'une minute et la ramenez à la vie.', effect: 'Résurrection (1 PV)', classes: ['Clerc', 'Paladin'], emoji: '💫' },
  
  // Level 4 Spells
  { id: 'dimension_door', name: 'Porte dimensionnelle', level: 4, school: 'Invocation', castingTime: 'Action', range: '500 pieds', components: ['V'], duration: 'Instantané', description: 'Vous vous téléportez jusqu\'à 500 pieds avec un allié.', effect: 'Téléportation 500 pieds', classes: ['Magicien', 'Ensorceleur', 'Occultiste', 'Barde'], emoji: '🚪' },
  { id: 'ice_storm', name: 'Tempête de grêle', level: 4, school: 'Évocation', castingTime: 'Action', range: '300 pieds', components: ['V', 'S', 'M'], duration: 'Instantané', description: 'Une pluie de grêlons glacés s\'abat sur une zone.', damage: '2d8 + 4d6', damageType: 'Contondant + Froid', effect: 'Terrain difficile', classes: ['Magicien', 'Ensorceleur', 'Druide'], emoji: '🌨️' },
  
  // Level 5 Spells
  { id: 'cone_of_cold', name: 'Cône de froid', level: 5, school: 'Évocation', castingTime: 'Action', range: 'Cône 60 pieds', components: ['V', 'S', 'M'], duration: 'Instantané', description: 'Un souffle d\'air glacial émane de vos mains en un cône.', damage: '8d8', damageType: 'Froid', classes: ['Magicien', 'Ensorceleur'], emoji: '❄️' },
  { id: 'raise_dead', name: 'Rappel à la vie', level: 5, school: 'Nécromancie', castingTime: '1 heure', range: 'Contact', components: ['V', 'S', 'M'], duration: 'Instantané', description: 'Vous ramenez à la vie une créature morte depuis moins de 10 jours.', effect: 'Résurrection complète', classes: ['Clerc', 'Barde', 'Paladin'], emoji: '⭐' },
];

const schools: Record<string, { color: string; emoji: string }> = {
  'Évocation': { color: 'text-blood-400', emoji: '🔥' },
  'Abjuration': { color: 'text-rare', emoji: '🛡️' },
  'Invocation': { color: 'text-epic', emoji: '✨' },
  'Enchantement': { color: 'text-legendary', emoji: '💫' },
  'Nécromancie': { color: 'text-steel-400', emoji: '💀' },
  'Transmutation': { color: 'text-uncommon', emoji: '🔄' },
  'Divination': { color: 'text-rare', emoji: '👁️' },
  'Illusion': { color: 'text-epic', emoji: '🌀' },
};

const levelColors: Record<number, string> = {
  0: 'bg-steel-800 text-steel-200 border-steel-700',
  1: 'bg-uncommon/10 text-uncommon border-uncommon/50',
  2: 'bg-rare/10 text-rare border-rare/50',
  3: 'bg-epic/10 text-epic border-epic/50',
  4: 'bg-legendary/10 text-legendary border-legendary/50',
  5: 'bg-blood-900/50 text-blood-300 border-blood-700',
};

export default function SpellsPage() {
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);

  const allClasses = [...new Set(spells.flatMap(s => s.classes))].sort();
  
  const filteredSpells = spells.filter(spell => {
    if (filterLevel !== null && spell.level !== filterLevel) return false;
    if (filterClass !== 'all' && !spell.classes.includes(filterClass)) return false;
    return true;
  });

  const groupedSpells = filteredSpells.reduce((acc, spell) => {
    const level = spell.level;
    if (!acc[level]) acc[level] = [];
    acc[level].push(spell);
    return acc;
  }, {} as Record<number, Spell[]>);

  return (
    <div className="min-h-screen bg-valthera-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-valthera-900 to-valthera-950 border-b border-valthera-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 text-sm text-valthera-400 mb-4">
            <Link href="/wiki" className="hover:text-valthera-200 transition-colors">Wiki</Link>
            <span>/</span>
            <span className="text-valthera-200">Sorts</span>
          </div>
          <h1 className="text-4xl font-medieval text-valthera-100 mb-4">
            ✨ Grimoire des Sorts
          </h1>
          <p className="text-valthera-300 max-w-3xl">
            Explorez tous les sorts disponibles dans Valthera. Des tours de magie basiques 
            aux sorts dévastateurs de haut niveau.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          {/* Level Filter */}
          <div>
            <p className="text-valthera-400 text-sm mb-2">Niveau</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterLevel(null)}
                className={`px-3 py-1 rounded-lg border transition-all ${
                  filterLevel === null
                    ? 'bg-valthera-700 border-valthera-500 text-valthera-100'
                    : 'bg-valthera-900/50 border-valthera-800 text-valthera-400 hover:bg-valthera-800/50'
                }`}
              >
                Tous
              </button>
              {[0, 1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setFilterLevel(level)}
                  className={`px-3 py-1 rounded-lg border transition-all ${
                    filterLevel === level
                      ? levelColors[level]
                      : 'bg-valthera-900/50 border-valthera-800 text-valthera-400 hover:bg-valthera-800/50'
                  }`}
                >
                  {level === 0 ? 'Tour' : `Niv. ${level}`}
                </button>
              ))}
            </div>
          </div>

          {/* Class Filter */}
          <div>
            <p className="text-valthera-400 text-sm mb-2">Classe</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterClass('all')}
                className={`px-3 py-1 rounded-lg border transition-all ${
                  filterClass === 'all'
                    ? 'bg-valthera-700 border-valthera-500 text-valthera-100'
                    : 'bg-valthera-900/50 border-valthera-800 text-valthera-400 hover:bg-valthera-800/50'
                }`}
              >
                Toutes
              </button>
              {allClasses.map((cls) => (
                <button
                  key={cls}
                  onClick={() => setFilterClass(cls)}
                  className={`px-3 py-1 rounded-lg border transition-all ${
                    filterClass === cls
                      ? 'bg-valthera-700 border-valthera-500 text-valthera-100'
                      : 'bg-valthera-900/50 border-valthera-800 text-valthera-400 hover:bg-valthera-800/50'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Spell List */}
          <div className="lg:col-span-1 space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {Object.entries(groupedSpells)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([level, levelSpells]) => (
                <div key={level}>
                  <h3 className={`text-lg font-medieval mb-3 ${Number(level) === 0 ? 'text-steel-300' : 'text-valthera-200'}`}>
                    {Number(level) === 0 ? '🔮 Tours de magie' : `⭐ Niveau ${level}`}
                  </h3>
                  <div className="space-y-2">
                    {levelSpells.map((spell) => (
                      <button
                        key={spell.id}
                        onClick={() => setSelectedSpell(spell)}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          selectedSpell?.id === spell.id
                            ? `${levelColors[spell.level]} ring-1 ring-offset-1 ring-offset-valthera-950 ring-valthera-500`
                            : 'bg-valthera-900/50 border-valthera-800 hover:bg-valthera-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{spell.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-valthera-100 truncate">{spell.name}</h4>
                            <p className={`text-xs ${schools[spell.school]?.color || 'text-valthera-400'}`}>
                              {schools[spell.school]?.emoji} {spell.school}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          {/* Spell Details */}
          <div className="lg:col-span-2">
            {selectedSpell ? (
              <div className={`bg-valthera-900/50 rounded-xl border overflow-hidden ${levelColors[selectedSpell.level].split(' ')[2]}`}>
                {/* Header */}
                <div className={`p-6 ${levelColors[selectedSpell.level].split(' ').slice(0, 2).join(' ')}`}>
                  <div className="flex items-start gap-4">
                    <span className="text-6xl">{selectedSpell.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-medieval text-valthera-100">{selectedSpell.name}</h2>
                        <span className={`px-3 py-1 rounded-full text-sm border ${levelColors[selectedSpell.level]}`}>
                          {selectedSpell.level === 0 ? 'Tour de magie' : `Niveau ${selectedSpell.level}`}
                        </span>
                      </div>
                      <p className={`${schools[selectedSpell.school]?.color || 'text-valthera-400'}`}>
                        {schools[selectedSpell.school]?.emoji} {selectedSpell.school}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <p className="text-valthera-300 text-lg">{selectedSpell.description}</p>

                  {/* Stats Grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-valthera-800/30 rounded-lg p-3 border border-valthera-700">
                      <p className="text-xs text-valthera-400 uppercase tracking-wider mb-1">Incantation</p>
                      <p className="text-valthera-100 font-medium">{selectedSpell.castingTime}</p>
                    </div>
                    <div className="bg-valthera-800/30 rounded-lg p-3 border border-valthera-700">
                      <p className="text-xs text-valthera-400 uppercase tracking-wider mb-1">Portée</p>
                      <p className="text-valthera-100 font-medium">{selectedSpell.range}</p>
                    </div>
                    <div className="bg-valthera-800/30 rounded-lg p-3 border border-valthera-700">
                      <p className="text-xs text-valthera-400 uppercase tracking-wider mb-1">Composantes</p>
                      <p className="text-valthera-100 font-medium">{selectedSpell.components.join(', ')}</p>
                    </div>
                    <div className="bg-valthera-800/30 rounded-lg p-3 border border-valthera-700">
                      <p className="text-xs text-valthera-400 uppercase tracking-wider mb-1">Durée</p>
                      <p className="text-valthera-100 font-medium">{selectedSpell.duration}</p>
                    </div>
                  </div>

                  {/* Damage & Effect */}
                  {(selectedSpell.damage || selectedSpell.effect) && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {selectedSpell.damage && (
                        <div className="bg-blood-900/20 rounded-lg p-4 border border-blood-800">
                          <p className="text-xs text-valthera-400 uppercase tracking-wider mb-1">Dégâts</p>
                          <p className="text-2xl font-bold text-blood-400">{selectedSpell.damage}</p>
                          {selectedSpell.damageType && (
                            <p className="text-valthera-400 text-sm">{selectedSpell.damageType}</p>
                          )}
                        </div>
                      )}
                      {selectedSpell.effect && (
                        <div className="bg-epic/10 rounded-lg p-4 border border-epic/30">
                          <p className="text-xs text-valthera-400 uppercase tracking-wider mb-1">Effet</p>
                          <p className="text-epic font-medium">{selectedSpell.effect}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Classes */}
                  <div>
                    <h3 className="text-lg font-medieval text-valthera-200 mb-3">📚 Classes</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedSpell.classes.map((cls) => (
                        <span key={cls} className="px-3 py-1 bg-valthera-800 text-valthera-200 rounded-full text-sm border border-valthera-700">
                          {cls}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-valthera-900/50 rounded-xl border border-valthera-800 p-12 text-center">
                <span className="text-6xl mb-4 block">✨</span>
                <h3 className="text-xl font-medieval text-valthera-100 mb-2">Sélectionnez un Sort</h3>
                <p className="text-valthera-400">
                  Cliquez sur un sort dans la liste pour voir ses détails et effets.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
