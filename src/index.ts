// Require the necessary discord.js classes
import { Client, Collection, Events, GatewayIntentBits, Partials, ActivityType, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, CollectorEventTypes, ClientUser } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tagToId, idToSummoner } from './util/riotAPI.js';
import { MongoClient } from 'mongodb';
dotenv.config();

// ensures mongoUri is not null
const mongoUri = process.env.MONGO_URI
if(mongoUri == null) {
    throw new Error("mongo uri is not defined in environemnt variable")
}
const dbClient = new MongoClient(mongoUri);

// client wrapper for client class. Fixes paramater issues not present in Client object idk
class clientWrapper extends Client {
    commands: Collection<string, any>;
    declare user: ClientUser;
    constructor(){
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.MessageContent,
            ],
            partials: [Partials.Channel]
        })
        this.commands = new Collection();
    }
    
}

const client = new clientWrapper()

// Log in to Discord with your client's token
const token = process.env.token;
if(token == undefined) {
    throw new Error("token is not defined environment values")
}

client.login(token);
console.log('Logged in to Discord');

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);
const foldersPath: string = path.join(__dirname, 'commands');
const entries: fs.Dirent<string>[] = fs.readdirSync(foldersPath, { withFileTypes: true });

(async () => {
    for (const entry of entries) {
        if (entry.isDirectory()) {
            const commandsPath: string = path.join(foldersPath, entry.name);
            const commandFiles: string[] = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));
            for (const file of commandFiles) {
                const filePath: string = path.join(commandsPath, file);
                const fileUrl: string = pathToFileURL(filePath).href;
                const commandModule = await import(fileUrl);
                const command = commandModule.default;
                if ('data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command);
                    console.log(`Command ${command.data.name} loaded from ${filePath}`);
                } else {
                    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
                }
            }
        } else if (entry.isFile() && entry.name.endsWith('.ts')) {
            const filePath: string = path.join(foldersPath, entry.name);
            const fileUrl: string = pathToFileURL(filePath).href;
            const commandModule = await import(fileUrl);
            const command = commandModule.default;
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                console.log(`Command ${command.data.name} loaded from ${filePath}`);
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }
    }
})();

const eventsPath: string = path.join(__dirname, 'events');
const eventFiles: string[] = fs.readdirSync(eventsPath).filter(file => file.endsWith('.ts'));

interface DiscordEvent {
    name: string;
    once?: boolean;
    execute: (...args: any[]) => Promise<void>
}

for (const file of eventFiles) {
	const filePath:string = path.join(eventsPath, file);
	const eventDefault = await import(pathToFileURL(filePath).href) as { default: DiscordEvent };    // unsure what typing this pathToFileURL produces
    const event = eventDefault.default;
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
    console.log(`Event ${event.name} loaded from ${filePath}`);
}

client.on("ready", () => {
    client.user.setActivity("Julian when DND", {type: ActivityType.Custom})
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;


    // handles modal interaction
    if (interaction.customId === 'usernameModal') {
        const username: string = interaction.fields.getTextInputValue('usernameInput');
        console.log(username); // Will correctly show: ILoveBeyonce#1FAN

        const partition: string[] = username.split("#")
        const res = await tagToId(partition[0], partition[1])
        if(res.status == 404) {
            interaction.editReply(`Could not find user ${partition[0]}#${partition[1]}`);
            return
        }
        const info = res.data
        console.log(info)
        const summonerInfoRes = await idToSummoner(info.puuid)
        const summonerInfo = summonerInfoRes.data;

        const embed = new EmbedBuilder()
            .setAuthor({
                name: `${info.gameName}#${info.tagLine}`,
                iconURL: `https://ddragon.leagueoflegends.com/cdn/15.24.1/img/profileicon/${summonerInfo.profileIconId}.png`,
            })
            .setDescription(`Level ${summonerInfo.summonerLevel}`);

        const yes = new ButtonBuilder().setCustomId('yes').setLabel('Yes').setStyle(ButtonStyle.Primary)
        const no = new ButtonBuilder().setCustomId('no').setLabel('No').setStyle(ButtonStyle.Primary)

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(yes, no)

        const response = await interaction.reply({
            content: "is this you?",
            embeds: [embed],
            components: [row],
            withResponse: true
        });

        // I don't know what type this should be
        const collectorFilter = (i: any) => i.user.id === interaction.user.id;
        try {
            // filters collection by user
            if(response == null || response.resource == null || response.resource.message == null) {
                console.log("res is null stupid")
                return
            }
            const confirmation = await response.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

            if (confirmation.customId === 'yes') {

                // connects to db to check if user has already bound to a user
                dbClient.connect().then(async () => {
                    // mongodb check conducted here
                    const db = dbClient.db('DND');
                    const league = db.collection('league');
                    const exists = await league.findOne({ userId: interaction.user.id })
                    if(exists == null) {
                        confirmation.update({
                            content: "Sorry, could not find user with id " + interaction.user.id
                        })
                        return
                    }

                    const oldSummoner = await idToSummoner(exists.puuid)
                    if (oldSummoner.status === 400){
                        confirmation.update({content: "Bad request - Did you input the wrong user"})
                    }
                    
                    // in the case where a user has bound before, ask if the inputted user should replace older user
                    if(exists != null) {
                        // create the row for answering if user should be replaced
                        const replaceUserYes = new ButtonBuilder().setCustomId('replaceUserYes').setLabel('Yes').setStyle(ButtonStyle.Primary)
                        const replaceUserNo = new ButtonBuilder().setCustomId('replaceUserNo').setLabel('No').setStyle(ButtonStyle.Primary)
                        const replaceUserRow = new ActionRowBuilder<ButtonBuilder>().addComponents(replaceUserYes, replaceUserNo)
                        
                        // edit the inputted embed and create new embed to show old user
                        embed.setTitle("New User")

                        const oldEmbed = new EmbedBuilder()
                            .setTitle("Old User")

                        await confirmation.update({
                            content: "You already have a user, replace current user with previous user? ",
                            embeds: [embed],
                            components: [replaceUserRow]
                        })
                        return
                    }
                    await league.insertOne({
                        userId: interaction.user.id,
                        puuid: summonerInfo.puuid,
                    })
                })
                await confirmation.update({ content: `The user has been binded!`, components: [] });
            } else if (confirmation.customId === 'no') {
                await confirmation.update({ content: 'Binding cancelled...', components: [] });
            }
        } catch (e){
            await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
            console.log(e)
        }        
    }
});