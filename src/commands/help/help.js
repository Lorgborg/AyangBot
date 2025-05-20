import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder } from 'discord.js'; 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Lists all available commands');

async function execute(interaction) {
  //read commands folder to get all .js files
  function getCommandFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let files = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(getCommandFiles(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith(".mjs"))) { //allow .mjs files
        files.push(fullPath);
      }
    }
    return files;
  }

  const commandsFolder = path.resolve(__dirname, '..');
  const commandFiles = getCommandFiles(commandsFolder);

  const embed = new EmbedBuilder()
    .setTitle('DND Commands Commands')
    .setColor(0xB22222)
    .setTimestamp();


  for (const filePath of commandFiles) {
    const fileUrl = pathToFileURL(filePath).href;
    const commandModule = await import(fileUrl);
    const command = commandModule.default ?? commandModule;

    if (command?.data && command?.data.name && command?.data.description) {
      embed.addFields({
        name: `/${command.data.name}`,
        value: command.data.description,
        inline: false,
      });
    }
  }

  // If no commands there are no commands
  if (embed.data.fields.length === 0) {
    embed.setDescription('No commands found.');
  }

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });
}

export default { data, execute };
