'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sword, Wand2, Crosshair, Heart, Trees, ShieldCheck } from 'lucide-react';

const classes = [
  {
    id: 'guerrier',
    name: 'Guerrier',
    description: 'Maître des armes et de la stratégie de combat',
    icon: Sword,
    color: 'from-red-600 to-red-800',
    textColor: 'text-red-400',
    stats: { force: 5, constitution: 4, dextérité: 3 },
  },
  {
    id: 'mage',
    name: 'Mage',
    description: 'Manipulateur des arcanes et des éléments',
    icon: Wand2,
    color: 'from-blue-600 to-blue-800',
    textColor: 'text-blue-400',
    stats: { intelligence: 5, sagesse: 4, charisme: 3 },
  },
  {
    id: 'voleur',
    name: 'Voleur',
    description: 'Expert en furtivité et attaques sournoises',
    icon: Crosshair,
    color: 'from-green-600 to-green-800',
    textColor: 'text-green-400',
    stats: { dextérité: 5, intelligence: 3, charisme: 3 },
  },
  {
    id: 'clerc',
    name: 'Clerc',
    description: 'Guérisseur divin et protecteur sacré',
    icon: Heart,
    color: 'from-yellow-600 to-yellow-800',
    textColor: 'text-yellow-400',
    stats: { sagesse: 5, constitution: 4, charisme: 3 },
  },
  {
    id: 'rodeur',
    name: 'Rôdeur',
    description: 'Pisteur et archer de la nature',
    icon: Trees,
    color: 'from-emerald-600 to-emerald-800',
    textColor: 'text-emerald-400',
    stats: { dextérité: 4, sagesse: 4, constitution: 3 },
  },
  {
    id: 'paladin',
    name: 'Paladin',
    description: 'Champion sacré alliant foi et combat',
    icon: ShieldCheck,
    color: 'from-amber-500 to-amber-700',
    textColor: 'text-amber-400',
    stats: { force: 4, charisme: 4, constitution: 4 },
  },
];

export function ClassesPreview() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-title"
          >
            Choisissez Votre Destinée
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="section-subtitle max-w-2xl mx-auto"
          >
            6 classes uniques avec des capacités, des sorts et des styles de jeu différents.
            Quelle sera votre voie ?
          </motion.p>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls, index) => (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * index }}
              className="card-hover overflow-hidden group"
            >
              {/* Header with gradient */}
              <div className={`bg-gradient-to-r ${cls.color} p-6 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <cls.icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white font-medieval">{cls.name}</h3>
                    <p className="text-white/80 text-sm">{cls.description}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="p-6">
                <div className="space-y-3">
                  {Object.entries(cls.stats).map(([stat, value]) => (
                    <div key={stat} className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 capitalize w-24">{stat}</span>
                      <div className="flex-1 flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-2 flex-1 rounded ${
                              i <= value ? cls.textColor.replace('text-', 'bg-') : 'bg-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link href="/wiki/classes" className="btn-secondary">
            Voir toutes les classes en détail
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
