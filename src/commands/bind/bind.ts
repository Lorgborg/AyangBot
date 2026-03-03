import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle, ChatInputCommandInteraction  } from 'discord.js';
import { tagToId } from "../../util/riotAPI.js"
import { MongoClient } from 'mongodb';
const MONGO_URI = process.env.MONGO_URI
if(MONGO_URI == null) {
    throw new Error("I really should have modularized this. no mongo uri stupid")
}

const dbClient = new MongoClient(MONGO_URI);

export default {
    data: new SlashCommandBuilder()
        .setName('bind')
        .setDescription('Binds your league account to your discord account, no login necessary!'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply()

        dbClient.connect().then(async () => {
            const db = dbClient.db('DND');
            const league = db.collection('league');
            const found = await league.findOne({userId: interaction.user.id})
            console.log(`${interaction.user.id}`)
            if(found == null) {
                const modal = new ModalBuilder()
                    .setCustomId('usernameModal')
                    .setTitle('Enter Username');

                const usernameInput = new TextInputBuilder()
                    .setCustomId('usernameInput')
                    .setLabel('Username with # tag')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('user#1Tag')
                    .setRequired(true);

                const row = new ActionRowBuilder<TextInputBuilder>().addComponents(usernameInput)
                
                modal.addComponents(row);

                await interaction.showModal(modal);
            } else if(found.userId === interaction.user.id){
                interaction.reply("You're already bound to an account!")
            }
        })
    },
};