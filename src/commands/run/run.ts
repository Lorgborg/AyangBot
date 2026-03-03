import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { spawn, exec } from 'child_process';

function isSessionRunning(name: string): Promise<boolean>{
    return new Promise<boolean>((resolve) => {
        exec(`tmux has-session -t ${name}`, (error) => {
            if(error) {
                resolve(false);
            } else {
                console.log("I am running yes")
                resolve(true);
            }
        })
    })
}

interface processReturn {
    message: string
}

function runScript(name: string, path: string): Promise<processReturn> {
    return new Promise<processReturn>((resolve, reject) => {
        const child = spawn('sh', [path]);

        child.once('error', (error) => {
            resolve({
                message: `${name} falied to fail with the error details:\n${error}`
            })
        })

        process.nextTick(() => {
            if(!child.killed){
                resolve({
                    message: `${name} started out succesfully (detached)`
                })
            } else if(child.killed){
                resolve({
                    message: `an error occured: stderr: ${child.stderr}, ${child.signalCode}`
                })
            }
        })
    })
}

export default {
    data: new SlashCommandBuilder()
        .setName('run')
        .setDescription('Runs the server processes in the event that it\'s down!')
        .addStringOption(option => 
            option.setName('process')
                .setDescription('Set which process you want to turn on, choose between: minecraft, playit or vintagestory')
                .setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const reply = await interaction.fetchReply();
        const process = interaction.options.getString('process')
        if(process == null) {
            interaction.editReply("yeah process isn't there")
            return
        }

        if(["minecraft", "playit", "vintagestory"].includes(process)){
            console.log(`running script for: ${process}`)
            if(await isSessionRunning(process)){
                interaction.editReply(`${process} is already running, please turn it off first`)
                return;
            }
            const script = await runScript(`${process}`, `./${process}.sh`)
            interaction.editReply(`${script.message}`)
        } else if(process == "all"){
            const mcScript = await runScript("minecraft", "./minecraft.sh")
            const playitScript = await runScript("playit", "./playit.sh")
            const vintageStoryScript = await runScript("vintagestory", "./vintagestory.sh")
            interaction.editReply(`${mcScript.message}\n${playitScript.message}\n\n${vintageStoryScript.message}`)
        } else {
            interaction.editReply("The process you placed does not exist. Please input either: minecraft, playit or vintagestory")
        }
    },
};