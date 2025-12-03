import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();
import { MongoClient } from 'mongodb';
const dbClient = new MongoClient(process.env.MONGO_URI);

export default {
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('Updates the user\'s character information!'),
    async execute(interaction) {
        await interaction.deferReply();

        await dbClient.connect();
        const db = dbClient.db('DND');
        const collection = db.collection('characters');
        const characters = await collection.find({ userId: interaction.user.id }).toArray()
        const character = characters[0]
        console.log(characters)

        const dmChannel = await interaction.user.createDM();
        if(characters.length === 0) {
            await interaction.editReply("You do not have a character. Type `/new` to make a new character")
            return;
        } else if(characters.length === 1) {
            await interaction.editReply("check your DMS fool")
            const embed = new EmbedBuilder()
                .setColor("Gold")
                .setTitle("Your Character Stats!")
                .addFields(
                    { name: "Name", value: character.name },
                    { name: "Class", value: character.class },
                    { name: "Race", value: character.race },
                    { name: "Alignment", value: character.alignment },
                    { name: "Strength", value: character.strength },
                    { name: "Dexterity", value: character.dexterity },
                    { name: "Constitution", value: character.constitution },
                    { name: "Intelligence", value: character.intelligence },
                    { name: "Wisdom", value: character.wisdom },
                    { name: "Charisma", value: character.charisma },
                    { name: "Age", value: character.age },
                    { name: "Height", value: character.height },
                    { name: "Weight", value: character.weight },
                    { name: "Gender", value: character.gender }
                );
            await dmChannel.send({ embeds: [embed] });
            let problems = true
            while (problems) {
                const res = await ask(dmChannel, interaction.user, "If you want to change anything, type the stat you want to change, e.g., `name`, `class`, and then type the new value. Otherwise, type `done` to finish!")
                if(res != "done") {
                    const res2 = await ask(dmChannel, interaction.user, `What do you want to change ${res} to?`)
                    character[res.toLowerCase()] = res2;
                    const updated = new EmbedBuilder()
                        .setColor("Gold")
                        .setTitle("Your Updated Character Stats!")
                        .setDescription(`Changed ${res} to ${res2}`)
                        .addFields(
                            { name: "Name", value: character.name },
                            { name: "Class", value: character.class },
                            { name: "Race", value: character.race },
                            { name: "Alignment", value: character.alignment },
                            { name: "Strength", value: character.strength },
                            { name: "Dexterity", value: character.dexterity },
                            { name: "Constitution", value: character.constitution },
                            { name: "Intelligence", value: character.intelligence },
                            { name: "Wisdom", value: character.wisdom },
                            { name: "Charisma", value: character.charisma },
                            { name: "Age", value: character.age },
                            { name: "Height", value: character.height },
                            { name: "Weight", value: character.weight },
                            { name: "Gender", value: character.gender }
                        );
                    await dmChannel.send({ embeds: [updated] });
                } else {
                    problems = false;
                    await dmChannel.send("Finished creating your character!");
                    dbClient.connect().then(async () => {
                        const db = dbClient.db('DND');
                        const characters = db.collection('characters');
                        await characters.updateOne(
                            { userId: interaction.user.id },
                            { $set: character }
                        );
                        await dmChannel.send("Your character has been saved to the database!");
                    }).catch(async err => {
                        console.error("Database connection error:", err);
                        await dmChannel.send("There was an error saving your character. Please try again later.");
                    }).finally(() => {
                        dbClient.close()
                    });
                }
            }
        } else {
            interaction.editReply(`an error has occurred`)
        }
    },
};

async function ask(channel, user, question) {
    await channel.send(question);
    const filter = response => response.author.id === user.id;

    try {
        const collected = await channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
        return collected.first().content;
    } catch {
        return null;
    }
    
}