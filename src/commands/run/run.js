import { SlashCommandBuilder } from 'discord.js';
import { spawn, exec } from 'child_process';

function isSessionRunning(name){
    return new Promise((resolve) => {
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

function runScript(name, path) {
    return new Promise((resolve, reject) => {
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
                    mesage: `an error occured: stderr: ${child.stderr}, ${child.signalCode}`
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
    async execute(interaction) {
        await interaction.deferReply();
        const reply = await interaction.fetchReply();
        const process = await interaction.options.getString('process')

        if(["minecraft", "playit", "vintagestory"].includes(process)){
            console.log(`running script for: ${process}`)
            if(await isSessionRunning(process)){
                interaction.editReply(`${process} is already running, please turn it off first`)
                return;
            }
            const script = await runScript(`${process}`, `./${process}.sh`)
            interaction.editReply(`${script.message}`)
        } else if(process == "all"){
            interaction.editReply(`${mcScript.message}\n${playitScript.message}`)
        } else {
            interaction.editReply("The process you placed does not exist. Please input either: minecraft, playit or vintagestory")
        }
    },
};