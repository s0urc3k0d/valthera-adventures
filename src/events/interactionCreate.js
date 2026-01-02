import { Events } from 'discord.js';
import { handleInteraction } from '../handlers/interactionHandler.js';

export default {
  name: Events.InteractionCreate,
  once: false,
  
  async execute(interaction, client) {
    await handleInteraction(interaction, client);
  },
};
