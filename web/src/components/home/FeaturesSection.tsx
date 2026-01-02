'use client';

import { motion } from 'framer-motion';
import { 
  Sword, 
  Users, 
  Map, 
  ShoppingBag, 
  ScrollText, 
  Shield,
  Sparkles,
  Coins
} from 'lucide-react';

const features = [
  {
    icon: Sword,
    title: 'Combat Dynamique',
    description: 'Système de combat tour par tour inspiré de D&D avec sorts, capacités et effets de statut.',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
  },
  {
    icon: Users,
    title: 'Groupes & Guildes',
    description: 'Formez des groupes avec vos amis, créez des guildes et affrontez des défis ensemble.',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Map,
    title: 'Exploration',
    description: 'Explorez des zones uniques, découvrez des trésors cachés et rencontrez des PNJ.',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: ShoppingBag,
    title: 'Économie',
    description: 'Achetez, vendez et craftez des équipements. Commercez avec d\'autres joueurs.',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
  {
    icon: ScrollText,
    title: 'Quêtes Épiques',
    description: 'Des dizaines de quêtes avec des dialogues, des choix et des récompenses uniques.',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: Shield,
    title: 'Classes & Races',
    description: '6 classes et 7 races avec des capacités uniques pour personnaliser votre héros.',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
  },
  {
    icon: Sparkles,
    title: 'Système de Niveau',
    description: 'Progressez, débloquez des capacités et devenez plus puissant.',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
  },
  {
    icon: Coins,
    title: 'Récompenses',
    description: 'Loot, or, expérience et objets rares à collecter et équiper.',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function FeaturesSection() {
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
            Un RPG Complet sur Discord
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="section-subtitle max-w-2xl mx-auto"
          >
            Tout ce dont vous avez besoin pour vivre une aventure épique, 
            directement depuis votre serveur Discord préféré.
          </motion.p>
        </div>

        {/* Features Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="card-hover p-6 group"
            >
              <div className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
