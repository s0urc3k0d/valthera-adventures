'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sword, Shield, Sparkles, ChevronRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-valthera-950 via-valthera-900/80 to-valthera-950" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-valthera-500/15 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-valthera-400/10 rounded-full blur-3xl animate-pulse-slow animation-delay-300" />
      </div>

      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 left-[15%] text-valthera-500/40"
        >
          <Sword className="w-12 h-12" />
        </motion.div>
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-40 right-[20%] text-valthera-400/40"
        >
          <Shield className="w-16 h-16" />
        </motion.div>
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-32 left-[25%] text-valthera-300/30"
        >
          <Sparkles className="w-10 h-10" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium text-valthera-300 bg-valthera-600/20 border border-valthera-500/30 rounded-full font-body">
            ⚔️ Bot Discord RPG
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold font-medieval mb-6"
        >
          <span className="text-valthera-100">Bienvenue à </span>
          <span className="text-gradient-gold">Valthera</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-valthera-200/80 mb-8 max-w-3xl mx-auto leading-relaxed font-body"
        >
          Embarquez pour une aventure épique directement sur Discord. 
          Créez votre héros, explorez des donjons, combattez des monstres 
          et forgez votre légende.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a 
            href="https://discord.com/oauth2/authorize?client_id=1456637041683992627&permissions=277025770560&scope=bot%20applications.commands" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-gold text-lg px-8 py-3"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            Ajouter à Discord
          </a>
          <Link href="/wiki" className="btn-secondary text-lg px-8 py-3">
            Découvrir le Wiki
            <ChevronRight className="w-5 h-5" />
          </Link>
        </motion.div>

        {/* Stats mini */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 flex flex-wrap justify-center gap-8 text-center"
        >
          <div>
            <div className="text-3xl font-bold text-valthera-300 font-medieval">12</div>
            <div className="text-sm text-valthera-200/60 font-body">Classes</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-valthera-300 font-medieval">9</div>
            <div className="text-sm text-valthera-200/60 font-body">Races</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-valthera-300 font-medieval">8+</div>
            <div className="text-sm text-valthera-200/60 font-body">Zones</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-valthera-300 font-medieval">15+</div>
            <div className="text-sm text-valthera-200/60 font-body">Monstres</div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{ 
          opacity: { delay: 1 },
          y: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
        }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-valthera-600 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-valthera-400 rounded-full" />
        </div>
      </motion.div>
    </section>
  );
}
