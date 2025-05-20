import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder } from 'discord.js';
import characterData from '../../characters.json' with { type: 'json' };

export default {
    data: new SlashCommandBuilder()
        .setName('character')
        .setDescription('Replies with an Embed of the user\'s character!'),
    async execute(interaction, client, args) {
        let row = null;
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)

        for (const [key, value] of Object.entries(characterData.default)) {
            await interaction.deferReply();
            if(interaction.user.id == key) {
                if(value.length == 0) {
                    embed.setTitle('No Characters Found')
                    embed.setDescription('You have no characters. Please create one using the `/create` command.')
                }
                if(value.length == 1) {
                    const character = value[0]
                    console.log(character)
                    embed.setTitle(character.name)
                    embed.setDescription(`Race: ${character.race} Class: ${character.class}`)
                    embed.addFields(
                        { name: 'Str', value: "`" + character.stats.strength + "`", inline: true },
                        { name: 'Dex', value: "`" + character.stats.dexterity + "`", inline: true  },
                        { name: 'Con', value: "`" + character.stats.constitution + "`", inline: true  },
                        { name: 'Int', value: "`" + character.stats.intelligence + "`", inline: true  },
                        { name: 'Wis', value: "`" + character.stats.wisdom + "`", inline: true  },
                        { name: 'Cha', value: "`" + character.stats.charisma + "`", inline: true  },
                    )
                } else if(value.length > 1) {
                    embed.setTitle('Multiple Characters')
                    embed.setDescription('You have multiple characters. Please specify which one you want to see.')
                    for (const character of value) {
                        embed.addFields(
                            { name: character.name, value: `Race: ${character.race}` },
                        )
                    }
                    const buttons = value.map((character, index) => {
                        return new ButtonBuilder()
                            .setCustomId(`character_${index}`)
                            .setLabel(character.name)
                            .setStyle('Primary');
                    });

                    row = new ActionRowBuilder()
                        .addComponents(buttons);
                    embed.setFooter({ text: 'Click a button to choose the characters.' });
                }
            } else {
                embed.setTitle('You aren\'t registered')
                embed.setDescription(`${interaction.user.id} is not in the db or something.`)
            }
        }

        if(row !== null) {
            await interaction.editReply({ embeds: [embed], components: [row] });
        } else {
            await interaction.editReply({ embeds: [embed] });
        }
        
    }
};