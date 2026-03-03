import { ChatInputCommandInteraction, Client, Collection, Events, Interaction, MessageFlags } from 'discord.js';

interface command {
    data: any; // or more specific SlashCommandBuilder type
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

interface extendedClient extends Client {
    commands: Collection<string, command>;
}

export default {
	name: Events.InteractionCreate,
	async execute(interaction: Interaction) {
		if (!interaction.isChatInputCommand()) return;

		const client = interaction.client as extendedClient
		const command = client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
			}
		}
	},
};
