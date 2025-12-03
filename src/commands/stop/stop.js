import { SlashCommandBuilder } from 'discord.js';
import { exec } from "child_process"

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

function killProcess(name){
    return new Promise((resolve) => {
        exec(`tmux kill-session -t ${name}`, (error) => {
            if(error) {
                resolve({
                    message: "an error occured :("
                });
            } else {
                resolve({
                    message: `process ${name} has been killed`
                });
            }
        })
    })
}

export default {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stops the minecraft server from running, please use this with caution')
        .addStringOption(option => 
            option.setName('process')
                .setDescription('Set which process you want to kill, choose between: minecraft, playit or vintagestory')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const process = interaction.options.getString('process')

        if(["minecraft", "playit", "vintagestory"].includes(process)){
            console.log(`running script for: ${process}`)
            if(!await isSessionRunning(process)){
                interaction.editReply(`${process} is not yet running...`)
                return;
            }
            const script = await killProcess(process)
            interaction.editReply(`${script.message}`)
        } else if(process == "all"){
            interaction.editReply(`${mcScript.message}\n${playitScript.message}`)
        } else {
            interaction.editReply("The process you placed does not exist. Please input either: minecraft, playit or vintagestory")
        }
    },
};