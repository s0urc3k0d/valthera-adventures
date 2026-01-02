import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];
const commandsPath = path.join(__dirname, '..', 'commands');

async function loadCommandsFromDirectory(directory) {
  const items = fs.readdirSync(directory, { withFileTypes: true });
  
  for (const item of items) {
    const itemPath = path.join(directory, item.name);
    
    if (item.isDirectory()) {
      await loadCommandsFromDirectory(itemPath);
    } else if (item.name.endsWith('.js')) {
      const fileUrl = pathToFileURL(itemPath).href;
      const command = await import(fileUrl);
      
      if (command.default?.data) {
        commands.push(command.default.data.toJSON());
        console.log(`✓ Commande chargée: ${command.default.data.name}`);
      } else if (command.data) {
        commands.push(command.data.toJSON());
        console.log(`✓ Commande chargée: ${command.data.name}`);
      }
    }
  }
}

async function deployCommands() {
  try {
    console.log('📝 Chargement des commandes...\n');
    await loadCommandsFromDirectory(commandsPath);
    
    console.log(`\n🚀 Déploiement de ${commands.length} commandes...\n`);
    
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    
    // Déploiement global (pour la production)
    // Note: Les commandes globales peuvent prendre jusqu'à 1h pour se propager
    if (process.env.NODE_ENV === 'production') {
      const data = await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
        { body: commands }
      );
      console.log(`✅ ${data.length} commandes déployées globalement!`);
    } 
    // Déploiement sur un serveur spécifique (pour le développement)
    else {
      if (!process.env.GUILD_ID) {
        console.error('❌ GUILD_ID non défini dans .env pour le déploiement de développement');
        process.exit(1);
      }
      
      const data = await rest.put(
        Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log(`✅ ${data.length} commandes déployées sur le serveur de développement!`);
    }
    
    // Terminer le processus proprement
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur lors du déploiement des commandes:', error);
    process.exit(1);
  }
}

deployCommands();
