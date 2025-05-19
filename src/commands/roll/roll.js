import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Rolls a Dice, e.g., 1d20, 2d6+3, 1d8-2')
        .addStringOption(option =>
            option.setName('dice')
                .setDescription('The number of sides on the dice. Example: 1d20')
                .setRequired(true)),
    async execute(interaction) {
        const dice = interaction.options.getString('dice');
        // Match XdY, XdY+Z, or XdY-Z
        const match = dice.match(/^(\d+)d(\d+)([+-]\d+)?$/i);

        if (!match) {
            await interaction.reply({ content: 'Please use the format XdY, XdY+Z, or XdY-Z (e.g., 1d20, 2d6+3, 1d8-2).', ephemeral: true });
            return;
        }

        const rolls = parseInt(match[1], 10);
        const sides = parseInt(match[2], 10);
        const modifier = match[3] ? parseInt(match[3], 10) : 0;

        if (rolls < 1 || sides < 2 || rolls > 100) {
            await interaction.reply({ content: 'Please use a reasonable dice format (e.g., 1d20, 2d6, max 100 dice).', ephemeral: true });
            return;
        }

        const results = [];
        for (let i = 0; i < rolls; i++) {
            results.push(Math.floor(Math.random() * sides) + 1);
        }
        let total = results.reduce((a, b) => a + b, 0) + modifier;

        let modifierText = '';
        if (total <= 0) total = 1;
        if (modifier > 0) modifierText = `+${modifier}`;
        if (modifier < 0) modifierText = `-${Math.abs(modifier)}`;

        await interaction.reply(
            `🎲 Rolling \`[${rolls}d${sides}${modifierText}] Result: [${results.join(',')}${modifier !== 0 ? `${modifier >= 0 ? '+' : '-'}${Math.abs(modifier)}]` : ''} \`(Total: \`${total}\`)`
        );
    },
};