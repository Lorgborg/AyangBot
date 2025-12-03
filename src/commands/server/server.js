import { SlashCommandBuilder } from 'discord.js';
import osu from "node-os-utils";
import { exec } from "child_process"

function isSessionRunning(name){
    return new Promise((resolve) => {
        exec(`tmux has-session -t ${name}`, (error) => {
            if(error) {
                resolve(false);
            } else {
                resolve(true);
            }
        })
    })
}

export default {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Replies with Pong!'),
    async execute(interaction) {
        await interaction.deferReply();
        const reply = await interaction.fetchReply();
        const cpuUsage = await osu.cpu.usage()
        const ramUsage = await osu.mem.info()
        let minecraftState = 'Minecraft session is running with no errors'
        let playitState = 'Playit tunnel is running with no errors'
        let vintagestoryState = 'Vintage story is running with no errors'
        if(!await isSessionRunning('minecraft')){
            minecraftState = 'Minecraft session is not running' 
        } else if(!await isSessionRunning('playit')) {
            playitState = 'Playit tunnel is not running'
        } else if(!await isSessionRunning('vintagestory')) {
            vintagestoryState = 'Vintage story is not running'
        }
        interaction.editReply(`\`\`\`Ram Usage: ${ramUsage.usedMemMb} mb/${ramUsage.totalMemMb} mb\nCPU Usage: ${cpuUsage}%\n${minecraftState}\n${playitState}\n${vintagestoryState} \`\`\``);
    },
};