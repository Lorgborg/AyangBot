import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();
import { MongoClient } from 'mongodb';
const dbClient = new MongoClient(process.env.MONGO_URI);

export default {
    data: new SlashCommandBuilder()
        .setName('new')
        .setDescription('Creates a new character for your user!'),
    async execute(interaction) {
        

        const dmChannel = await interaction.user.createDM();
        interaction.user.send("Creating a new character, please input your character details after prompted.")
        await interaction.reply({ content: "Sent you a DM to make a new character!", ephemeral: true });

        const answers = [];
        const questions = [
            "What is your character's name?",
            "What is your character's class?",
            "What is your character's race?",
            "What is your character's alignment?",
            "I will now ask for modifiers. Should be in the raw form, input 16 instead of +3\nWhat is your Strength modifier?",
            "Dexterity modifier?",
            "Constitution modifier?",
            "Intelligence modifier?",
            "Wisdom modifier?",
            "Charisma modifier?",
            "I will now ask for character details\nWhat is your character's age?",
            "height?",
            "weight?",
            "gender?",
            "do you agree to stone Julian with bricks?"
        ];

        for(let i = 0; i < questions.length; i++) {
            const res = await ask(dmChannel, interaction.user, questions[i])
            if(res === null) {
                await dmChannel.send("Error Occured");
                return;
            }
            answers.push(res)
        }
        const character = {
            name: answers[0],
            class: answers[1],
            race: answers[2],
            alignment: answers[3],
            strength: answers[4],
            dexterity: answers[5],
            constitution: answers[6],
            intelligence: answers[7],
            wisdom: answers[8],
            charisma: answers[9],
            age: answers[10],
            height: answers[11],
            weight: answers[12],
            gender: answers[13]
        }

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
        let problems = true;
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
                    await characters.insertOne({
                        userId: interaction.user.id,
                        ...character
                    });
                    await dmChannel.send("Your character has been saved to the database!");
                }).catch(async err => {
                    console.error("Database connection error:", err);
                    await dmChannel.send("There was an error saving your character. Please try again later.");
                }).finally(() => {
                    dbClient.close()
                });
            }
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