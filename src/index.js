// Require the necessary discord.js classes
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { fileURLToPath, pathToFileURL } from 'node:url';
dotenv.config();

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

// Log in to Discord with your client's token
client.login(process.env.token);
console.log('Logged in to Discord');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const foldersPath = path.join(__dirname, 'commands');
const entries = fs.readdirSync(foldersPath, { withFileTypes: true });

(async () => {
    for (const entry of entries) {
        if (entry.isDirectory()) {
            const commandsPath = path.join(foldersPath, entry.name);
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                const fileUrl = pathToFileURL(filePath).href;
                const commandModule = await import(fileUrl);
                const command = commandModule.default;
                if ('data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command);
                    console.log(`Command ${command.data.name} loaded from ${filePath}`);
                } else {
                    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
                }
            }
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            const filePath = path.join(foldersPath, entry.name);
            const fileUrl = pathToFileURL(filePath).href;
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

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const eventDefault = await import(pathToFileURL(filePath).href);
    const event = eventDefault.default;
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
    console.log(`Event ${event.name} loaded from ${filePath}`);
}