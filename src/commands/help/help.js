import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Lists all the commands!'),
    async execute(interaction) {
        await interaction.reply('Pong!');
    },
};