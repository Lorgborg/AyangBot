import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Lists all the commands!'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Available Commands')
            .setDescription('Type `/new` to make a new character. After making a new character, you can use `/roll` to roll and add automatic modifiers based on your character\'s stats. Example: `/roll 1d20 persuasion`')
            .addFields(
                { name: '/ping', value: 'Replies with discord ping!' },
                { name: '/character', value: 'Displays your character\'s information.' },
                { name: '/new', value: 'Creates a new character.' },
                { name: '/delete', value: 'Deletes your current character.' },
                { name: '/roll', value: 'Rolls a dice. Format: <roll>D<face>. ex: 1d20 is 1 roll of a 20 faced die' }
            )
        await interaction.reply({ embeds: [embed] });
    },
};