import { Sword, Wand2, Crosshair, Heart, Trees, ShieldCheck } from 'lucide-react';
import classesData from '../../../../src/data/classes.json';
import classAbilitiesData from '../../../../src/data/classAbilities.json';

export const metadata = {
  title: 'Classes',
  description: 'Les 6 classes jouables de Valthera Adventures',
};

const classIcons: Record<string, any> = {
  guerrier: Sword,
  mage: Wand2,
  voleur: Crosshair,
  clerc: Heart,
  rodeur: Trees,
  paladin: ShieldCheck,
};

const classColors: Record<string, { gradient: string; text: string; bg: string }> = {
  guerrier: { gradient: 'from-red-600 to-red-800', text: 'text-red-400', bg: 'bg-red-500/20' },
  mage: { gradient: 'from-blue-600 to-blue-800', text: 'text-blue-400', bg: 'bg-blue-500/20' },
  voleur: { gradient: 'from-green-600 to-green-800', text: 'text-green-400', bg: 'bg-green-500/20' },
  clerc: { gradient: 'from-yellow-600 to-yellow-800', text: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  rodeur: { gradient: 'from-emerald-600 to-emerald-800', text: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  paladin: { gradient: 'from-amber-500 to-amber-700', text: 'text-amber-400', bg: 'bg-amber-500/20' },
};

export default function ClassesPage() {
  // Convertir les données JSON en tableau
  const classes = Object.entries(classesData).map(([id, data]: [string, any]) => ({
    id,
    ...data,
    abilities: (classAbilitiesData as any)[id] || [],
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white font-medieval mb-4">
          Classes
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Choisissez parmi 6 classes uniques, chacune avec ses propres forces, 
          faiblesses et capacités spéciales.
        </p>
      </div>

      {/* Classes Grid */}
      <div className="space-y-12">
        {classes.map((cls) => {
          const Icon = classIcons[cls.id] || Sword;
          const colors = classColors[cls.id] || classColors.guerrier;

          return (
            <div key={cls.id} id={cls.id} className="card overflow-hidden">
              {/* Header */}
              <div className={`bg-gradient-to-r ${colors.gradient} p-8 relative`}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative flex items-center gap-6">
                  <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center">
                    <Icon className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white font-medieval mb-2">
                      {cls.name}
                    </h2>
                    <p className="text-white/80 text-lg">{cls.description}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Stats */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Statistiques de base</h3>
                    <div className="space-y-3">
                      {Object.entries(cls.baseStats || {}).map(([stat, value]) => (
                        <div key={stat} className="flex items-center gap-3">
                          <span className="text-sm text-gray-400 capitalize w-24">
                            {stat === 'strength' ? 'Force' :
                             stat === 'dexterity' ? 'Dextérité' :
                             stat === 'constitution' ? 'Constitution' :
                             stat === 'intelligence' ? 'Intelligence' :
                             stat === 'wisdom' ? 'Sagesse' :
                             stat === 'charisma' ? 'Charisme' : stat}
                          </span>
                          <div className="flex-1 flex gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div
                                key={i}
                                className={`h-2 flex-1 rounded ${
                                  i <= Math.floor((value as number) / 3)
                                    ? colors.bg.replace('/20', '')
                                    : 'bg-gray-700'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-white w-8 text-right">{value as number}</span>
                        </div>
                      ))}
                    </div>

                    {/* HP & Mana */}
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">PV de base</span>
                        <span className="text-red-400 font-medium">{cls.baseHealth || 20}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Mana de base</span>
                        <span className="text-blue-400 font-medium">{cls.baseMana || 10}</span>
                      </div>
                    </div>
                  </div>

                  {/* Starting Equipment */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Équipement de départ</h3>
                    {cls.startingEquipment ? (
                      <ul className="space-y-2">
                        {Object.entries(cls.startingEquipment).map(([slot, item]) => (
                          <li key={slot} className="flex items-center gap-2 text-gray-300">
                            <span className={`w-2 h-2 rounded-full ${colors.bg.replace('/20', '')}`} />
                            <span className="capitalize text-gray-500">{slot}:</span>
                            <span>{item as string}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 italic">Aucun équipement de départ</p>
                    )}

                    {/* Starting Spells */}
                    {cls.startingSpells && cls.startingSpells.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-semibold text-gray-400 mb-2">Sorts de départ</h4>
                        <div className="flex flex-wrap gap-2">
                          {cls.startingSpells.map((spell: string) => (
                            <span key={spell} className={`badge ${colors.bg} ${colors.text}`}>
                              {spell}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Abilities */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Capacités</h3>
                    {cls.abilities && cls.abilities.length > 0 ? (
                      <div className="space-y-3">
                        {cls.abilities.slice(0, 4).map((ability: any) => (
                          <div key={ability.id} className="bg-gray-800/50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-white">{ability.name}</span>
                              <span className="text-xs text-gray-500">Nv.{ability.levelRequired || 1}</span>
                            </div>
                            <p className="text-sm text-gray-400">{ability.description}</p>
                          </div>
                        ))}
                        {cls.abilities.length > 4 && (
                          <p className="text-sm text-gray-500 text-center">
                            Et {cls.abilities.length - 4} autres capacités...
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">Capacités en cours de développement</p>
                    )}
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
