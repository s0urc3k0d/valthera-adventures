/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone pour Docker
  output: 'standalone',
  
  // Permettre l'import des fichiers JSON du bot
  transpilePackages: [],
  
  // Images externes (avatars Discord)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        pathname: '/avatars/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        pathname: '/embed/avatars/**',
      },
    ],
  },

  // Variables d'environnement publiques
  env: {
    NEXT_PUBLIC_BOT_INVITE_URL: process.env.NEXT_PUBLIC_BOT_INVITE_URL,
    NEXT_PUBLIC_DISCORD_SERVER_URL: process.env.NEXT_PUBLIC_DISCORD_SERVER_URL,
  },

  // Redirections
  async redirects() {
    return [
      {
        source: '/invite',
        destination: process.env.NEXT_PUBLIC_BOT_INVITE_URL || '/',
        permanent: false,
      },
      {
        source: '/discord',
        destination: process.env.NEXT_PUBLIC_DISCORD_SERVER_URL || '/',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
