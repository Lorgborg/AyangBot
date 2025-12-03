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
                { name: '/update', value: 'Updates your current character!'},
                { name: '/delete', value: 'Deletes your current character.' },
                { name: '/roll', value: "Rolls a dice. Format: <roll>D<face><modifier>. ex: 1d20 is 1 roll of a 20 faced die. 2d6+2 is 2 rolls of a 6 faced die with a +2 modifier. \nOptional: The second argument is for your skills, typing this will automatically add your modifier based on your character's stats. Type `/skills` for the available skills and their aliases" },
                { name: '/run', value: "Runs the different server process such as: minecraft, playit and vintagestory. Ensure both playit and minecraft is running"},
                { name: '/stop', value: "Stops the server processes"},
                { name: '/server', value: "Shows the used specs of the server and the current running processes."}
            )
        await interaction.reply({ embeds: [embed] });
    },
};