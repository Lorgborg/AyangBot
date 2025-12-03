import { SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();
import { MongoClient } from 'mongodb';
const dbClient = new MongoClient(process.env.MONGO_URI);

export default {
    data: new SlashCommandBuilder()
        .setName('delete')
        .setDescription('Deletes your current user!'),
    async execute(interaction) {
        await interaction.deferReply();

        // deletes the character from the database
        dbClient.connect().then(async () => {
            const db = dbClient.db('DND');
            const characters = db.collection('characters');
            await characters.deleteOne({
                userId: interaction.user.id
            });
            await interaction.followUp("Your character has been deleted from the database!");
        }).catch(async err => {
            console.error("Database connection error:", err);
            await interaction.followUp("There was an error deleting your character. Please try again later.");
        }).finally(() => {
            dbClient.close()
        });
    },
};