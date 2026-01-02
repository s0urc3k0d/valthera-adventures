/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette Valthera - Thème fantasy sombre brun/doré
        valthera: {
          950: '#0D0705',
          900: '#1A0F08',
          800: '#2D1B0E',
          700: '#4A2C17',
          600: '#6B3D1F',
          500: '#8B5A2B',
          400: '#C9A227',
          300: '#D4AF37',
          200: '#E8D5A3',
          100: '#F5ECD7',
        },
        // Couleurs secondaires
        blood: {
          600: '#8B0000',
          500: '#A52A2A',
          400: '#CD5C5C',
        },
        forest: {
          700: '#1B4D3E',
          600: '#2E5A4B',
          500: '#3D7A5A',
        },
        steel: {
          600: '#4A5568',
          500: '#6B7280',
          400: '#9CA3AF',
        },
        // Raretés
        rarity: {
          common: '#9CA3AF',
          uncommon: '#22C55E',
          rare: '#3B82F6',
          epic: '#A855F7',
          legendary: '#D4AF37',
        },
        // Couleurs RPG
        health: {
          low: '#8B0000',
          medium: '#C9A227',
          high: '#3D7A5A',
        },
        mana: '#3b82f6',
        xp: '#a855f7',
        // Classes
        class: {
          warrior: '#8B0000',
          mage: '#3B82F6',
          rogue: '#3D7A5A',
          cleric: '#D4AF37',
          ranger: '#2E5A4B',
          paladin: '#C9A227',
          barbarian: '#A52A2A',
          bard: '#A855F7',
          monk: '#4A5568',
          warlock: '#6B3D1F',
          sorcerer: '#CD5C5C',
          druid: '#1B4D3E',
        },
      },
      fontFamily: {
        medieval: ['Cinzel', 'serif'],
        body: ['Crimson Text', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'valthera-gradient': 'linear-gradient(180deg, #0D0705 0%, #1A0F08 50%, #2D1B0E 100%)',
        'holographic': 'linear-gradient(125deg, rgba(255,215,0,0.3) 0%, rgba(255,140,0,0.25) 15%, rgba(255,69,0,0.2) 30%, rgba(138,43,226,0.25) 50%, rgba(75,0,130,0.2) 70%, rgba(255,215,0,0.3) 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'shine': 'shine 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'legendary-shimmer': 'legendaryShimmer 3s linear infinite',
        'epic-glow': 'epicGlow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        shine: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(201, 162, 39, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(201, 162, 39, 0.8)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(212, 175, 55, 0.5)' },
          '50%': { boxShadow: '0 0 25px rgba(212, 175, 55, 0.8)' },
        },
        legendaryShimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        epicGlow: {
          '0%': { boxShadow: '0 0 10px rgba(168, 85, 247, 0.4)' },
          '100%': { boxShadow: '0 0 30px rgba(168, 85, 247, 0.7)' },
        },
      },
      boxShadow: {
        'gold': '0 0 15px rgba(212, 175, 55, 0.4)',
        'gold-lg': '0 0 30px rgba(212, 175, 55, 0.6)',
        'epic': '0 0 15px rgba(168, 85, 247, 0.4)',
        'legendary': '0 0 20px rgba(212, 175, 55, 0.5)',
      },
    },
  },
  plugins: [],
};
