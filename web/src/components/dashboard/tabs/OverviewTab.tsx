'use client';

import { Sword, Shield, Zap, Heart, Brain, Star, MapPin } from 'lucide-react';

interface OverviewTabProps {
  character: any;
}

const statIcons: Record<string, any> = {
  strength: Sword,
  dexterity: Zap,
  constitution: Heart,
  intelligence: Brain,
  wisdom: Star,
  charisma: Shield,
};

const statNames: Record<string, string> = {
  strength: 'Force',
  dexterity: 'Dextérité',
  constitution: 'Constitution',
  intelligence: 'Intelligence',
  wisdom: 'Sagesse',
  charisma: 'Charisme',
};

export function OverviewTab({ character }: OverviewTabProps) {
  const getModifier = (value: number) => {
    const mod = Math.floor((value - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Statistiques */}
      <div className="lg:col-span-2">
        <div className="card p-6">
          <h2 className="text-xl font-bold text-valthera-100 font-medieval mb-6">Caractéristiques</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(character.stats).map(([stat, value]: [string, any]) => {
              const Icon = statIcons[stat] || Sword;
              return (
                <div
                  key={stat}
                  className="bg-valthera-800/50 rounded-xl p-4 text-center hover:bg-valthera-800 transition-colors border border-valthera-700/50"
                >
                  <Icon className="w-6 h-6 text-valthera-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-valthera-100">{value}</div>
                  <div className="text-xs text-valthera-200/60 font-body">{statNames[stat]}</div>
                  <div className="text-sm text-valthera-400 mt-1">
                    {getModifier(value)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Équipement */}
        <div className="card p-6 mt-6">
          <h2 className="text-xl font-bold text-valthera-100 font-medieval mb-6">Équipement</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Arme */}
            <div className="bg-valthera-800/50 rounded-xl p-4 border border-valthera-700/50">
              <div className="text-xs text-valthera-200/60 mb-2 font-body">Arme</div>
              {character.equipment.weapon ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blood-500/20 rounded-lg flex items-center justify-center">
                    <Sword className="w-5 h-5 text-blood-400" />
                  </div>
                  <span className="text-valthera-100">{character.equipment.weapon}</span>
                </div>
              ) : (
                <span className="text-valthera-200/50 italic font-body">Aucune arme équipée</span>
              )}
            </div>

            {/* Armure */}
            <div className="bg-valthera-800/50 rounded-xl p-4 border border-valthera-700/50">
              <div className="text-xs text-valthera-200/60 mb-2 font-body">Armure</div>
              {character.equipment.armor ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-steel-500/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-steel-400" />
                  </div>
                  <span className="text-valthera-100">{character.equipment.armor}</span>
                </div>
              ) : (
                <span className="text-valthera-200/50 italic font-body">Aucune armure équipée</span>
              )}
            </div>

            {/* Accessoire */}
            <div className="bg-valthera-800/50 rounded-xl p-4 border border-valthera-700/50">
              <div className="text-xs text-valthera-200/60 mb-2 font-body">Accessoire</div>
              {character.equipment.accessory ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rarity-epic/20 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-rarity-epic" />
                  </div>
                  <span className="text-white">{character.equipment.accessory}</span>
                </div>
              ) : (
                <span className="text-gray-500 italic">Aucun accessoire équipé</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Position actuelle */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white font-medieval mb-4">Position</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <div className="text-white font-medium">
                {character.location?.zoneId?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Inconnu'}
              </div>
              {character.location?.subZone && (
                <div className="text-sm text-gray-400">{character.location.subZone}</div>
              )}
            </div>
          </div>
        </div>

        {/* Compétences */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white font-medieval mb-4">Compétences</h2>
          {character.skills?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {character.skills.map((skill: any) => (
                <span key={skill} className="badge-primary">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">Aucune compétence acquise</p>
          )}
        </div>

        {/* Sorts */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white font-medieval mb-4">Sorts</h2>
          {character.spells?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {character.spells.map((spell: any) => (
                <span key={spell} className="badge bg-blue-500/20 text-blue-300">
                  {spell}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">Aucun sort appris</p>
          )}
        </div>

        {/* Capacités */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white font-medieval mb-4">Capacités</h2>
          {character.abilities?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {character.abilities.map((ability: any) => (
                <span key={ability} className="badge bg-amber-500/20 text-amber-300">
                  {ability}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">Aucune capacité débloquée</p>
          )}
        </div>
      </div>
    </div>
  );
}
