import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();
import { MongoClient } from 'mongodb';
const dbClient = new MongoClient(process.env.MONGO_URI);

export default {
  data: new SlashCommandBuilder()
    .setName('character')
    .setDescription("Replies with an Embed of the user's character!")
    .addStringOption(option => 
      option.setName('player')
        .setDescription('@ a user to get their user card')
        .setRequired(false)
    ),

  async execute(interaction) {
    const embed = new EmbedBuilder().setColor(0x0099FF);
    await interaction.deferReply();
    const player = interaction.options.getString('player');

    try {
      let userId = interaction.user.id
      if(player) {
        userId = player.replace(/[<@!>]/g, '');
      }
      if (!dbClient.topology || !dbClient.topology.isConnected()) {
        await dbClient.connect();
      }

      const db = dbClient.db('DND');
      const charactersCollection = db.collection('characters');

      const characters = await charactersCollection
        .find({ userId: userId })
        .toArray();

      if (!characters || characters.length === 0) {
        await interaction.editReply({
          content: 'No character data found for you. Run command `/new` to create a new character.',
          ephemeral: true,
        });
        return;
      }

      const character = characters[0]; // for now, show only first character
      embed
        .setTitle(character.name)
        .setDescription(`Race: ${character.race} | Class: ${character.class}`)
        .addFields(
          { name: 'Str', value: `\`${character.strength}\``, inline: true },
          { name: 'Dex', value: `\`${character.dexterity}\``, inline: true },
          { name: 'Con', value: `\`${character.constitution}\``, inline: true },
          { name: 'Int', value: `\`${character.intelligence}\``, inline: true },
          { name: 'Wis', value: `\`${character.wisdom}\``, inline: true },
          { name: 'Cha', value: `\`${character.charisma}\``, inline: true }
        );

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error("Database error:", err);
      await interaction.editReply({
        content: '❌ Database error. Please try again later.',
        ephemeral: true,
      });
    }
  },
};
