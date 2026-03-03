import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();
import { MongoClient } from 'mongodb';

const { MONGO_URI } = process.env
if(MONGO_URI == null) {
    throw new Error("hey dummy, mongouri is null")
}
const dbClient = new MongoClient(MONGO_URI);

// map of prompts to their assigned skills
const skills = {
    strength: ['str', 'strength', 'athletics', 'ath'],
    dexterity: ['dex', 'dexterity', 'acrobatics', 'acr', 'stealth', 'ste', 'sleight', 'sleight of hand', 'hand'],
    constitution: ['con', 'constitution'],
    intelligence: ['int', 'intelligence', 'arcana', 'arc', 'history', 'his', 'investigation', 'inv', 'nature', 'nat', 'religion', 'rel'],
    wisdom: ['wis', 'wisdom', 'animal handling', 'animal', 'ani', 'insight', 'ins', 'medicine', 'med', 'meds', 'perception', 'perc', 'survival', 'sur', 'surv'],
    charisma: ['ch', 'cha', 'charisma', 'deception', 'dec', 'intimidation', 'intimidate', 'inti', 'performance', 'perf', 'pers', 'persuasion']
}

const actions = {
    athletics: ['ath', 'athletics'],
    acrobatics: ['acr', 'acrobatics'],
    stealth: ['ste', 'stealth'],
    arcana: ['arc', 'arcana'],
    history: ['his', 'history'],
    investigation: ['inv', 'investigation'],
    nature: ['nat', 'nature'],
    religion: ['rel', 'religion'],
    animalHandling: ['ani', 'animal handling', 'animal'],
    insight: ['ins', 'insight'],
    medicine: ['med', 'medicine', 'meds'],
    perception: ['perc', 'perception'],
    survival: ['sur', 'survival'],
    deception: ['dec', 'deception'],
    intimidation: ['intimidate', 'inti', 'intimidation'],
    performance: ['perf', 'performance'],
    persuasion: ['pers', 'persuasion'], 
    intelligence: ['int', 'intelligence'],
    strength: ['str', 'strength'],
    dexterity: ['dex', 'dexterity'],
    constitution: ['con', 'constitution'],
    wisdom: ['wis', 'wisdom'],
    charisma: ['ch', 'cha', 'charisma'],
    sleight: ['sleight', 'sleight of hand', 'hand']
}

// increased attributes that come specifically from races
const raceBuffs = {
    elf: {
        history: 2,
        animalHandling: 2,
        sleight: -2
    },
    dwarf: {
        intimidation: 2,
        history: 2,
        acrobatics: -2,
        arcana: -2
    },
    vampire: {
        intimidation: 2,
        history: 2,
        survival: -2,
        acrobatics: -2
    },
    avian: {
        acrobatics: 2,
        perception: 2,
        stealth: -2,
        sleight: -2
    },
    chronos: {
        insight: 2,
        investigation: 2,
        religion: -2,
        arcana: -2
    },
    serpentine: {
        animalHandling: 2,
        religion: 2,
        stealth: -2,
        history: -2
    },
    orc: {
        athletics: 2,
        intimidation: 2,
        sleight: -2,
        religion: -2
    },
    geitlan: {
        acrobatics: 2,
        athletics: 2,
        medicine: -2,
        arcana: -2
    },
    shade: {
        stealth: 2,
        sleight: 2,
        medicine: -2,
        history: -2
    },
    nymph: {
        medicine: 2,
        nature: 2,
        deception: -2,
        performance: -2
    },
    vulpin: {
        animalHandling: 2,
        deception: 2,
        religion: -2,
        intimidation: -2
    },
    pigman: {
        persuasion: 2,
        perception: 2,
        investigation: -2,
        animalHandling: -2
    },
    crowbane: {
        intimidation: 2,
        performance: 2,
        acrobatics: -2,
        athletics: -2
    },
    cyclops: {
        intimidation: 2,
        persuasion: 2,
        perception: -2,
        sleight: -2
    },
    illeceobruo: {
        nature: 2,
        deception: 2,
        medicine: -2,
        animalHandling: -2
    },
    ratfolkMousefolk: {
        stealth: 2,
        perception: 2,
        intimidation: -2,
        arcana: -2
    }
};


const classBuffs = {
    exorcist: {
        arcana: 3
    },
    priest: {
        religion: 3
    },
}

// Helper to safely look up a value in a buff object by a dynamic string key
function getBuff(buffObj: Partial<Record<string, number>> | undefined, key: string | undefined): number {
    if (!buffObj || !key) return 0;
    return buffObj[key] ?? 0;
}

export default {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Rolls a Dice, e.g., 1d20, 2d6+3, 1d8-2')
        .addStringOption(option =>
            option.setName('dice')
                .setDescription('The number of sides on the dice. Example: 1d20 OR a modifier like: arcana')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('modifier')
                .setDescription('Stat modifier (e.g., charisma, persuasion, athletics). leave empty otherwise')
                .setRequired(false)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });
        const dice = interaction.options.getString('dice');
        const charModifier = interaction.options.getString('modifier');
        let charMods = 0;

        if(dice == null) {
            await interaction.reply("hey, dice has no value somehow")
            return
        }
        // Match XdY, XdY+Z, or XdY-Z
        const match = dice.match(/^(\d+)d(\d+)([+-]\d+)?$/i);

        if (!match) {
            const skillMatch = Object.entries(skills).find(([key, values]) =>
                values.includes(dice.toLowerCase())
            )?.[0] as keyof typeof skills;

            const actionMatch = Object.entries(actions).find(([key, values]) =>
                values.includes(dice.toLowerCase())
            )?.[0] as keyof typeof actions;

            if(!skillMatch || !actionMatch) {
                console.log("not found: " + skillMatch + " " + actionMatch)
                await interaction.editReply({
                    content: "Please input either:\ndice roll:`/roll 1d20` is 1 roll of a 20 faced die\nor a stat: `/roll investigation`\nor a combination of both: `/roll 1d20+3 investigation`",
                })
                return;
            }
            const db = dbClient.db('DND');
            const charactersCollection = db.collection('characters');

            const characters = await charactersCollection
                .find({ userId: interaction.user.id })
                .toArray();
            
            if(!characters || characters.length <= 0) {

                await interaction.editReply({
                    content: 'You rolled the dice with a modifier, but you don\'t have a registered character. Run command `/new` to create a new character.'
                });
                return
            }

            // gets the modifier of the character's skill
            const raw = characters[0][skillMatch];
            const skillVal = Math.floor(Math.round(raw-10)/2)

            const charClass = characters[0]["class"].toLowerCase() as keyof typeof classBuffs;
            const classMatch = classBuffs[charClass] as Partial<Record<string, number>> | undefined;
            const classVal = getBuff(classMatch, actionMatch);

            // checks if the race has any modifiers to the stats
            const characterRace = characters[0]["race"].toLowerCase() as keyof typeof raceBuffs;
            const raceMatch = raceBuffs[characterRace] as Partial<Record<string, number>> | undefined;
            const raceVal = getBuff(raceMatch, actionMatch);

            const res = Math.floor(Math.random() * 20) + 1 + raceVal + skillVal + classVal
            console.log(`${raceVal} ${skillVal}`)
            let skillString = ''
            let raceString = ''
            let classString = '';
            if(skillVal != 0){
                skillString = (skillVal > 0) ? `+${skillVal}` : `-${skillVal}`
            }
            if(raceVal != 0){
                raceString = (raceVal > 0) ? `+${raceVal}` : `${raceVal}`
            }
            if(classVal != 0){
                classString = (classVal > 0) ? `+${classVal}` : `${classVal}`
            }

            await interaction.editReply(
                `🎲 Rolling for ${dice}, \`[1d20${raceString}${skillString}${classString}]\` Result: \`[${res}]\` `
            );
            return
        }

        if(charModifier) {
            console.log(`charModifier: ${charModifier}`);
            const db = dbClient.db('DND');
            const charactersCollection = db.collection('characters');

            const characters = await charactersCollection
                .find({ userId: interaction.user.id })
                .toArray();

            // checks if there's a returned character and that it's only one
            if (characters.length === 1) {
                console.log(`Character found: ${characters[0].name}`);

                // matches inputted character modifier into appropriate skills using the skills map
                const skillMatch = Object.entries(skills).find(([key, values]) =>
                    values.includes(charModifier.toLowerCase())
                )?.[0];

                if(skillMatch == null) {
                    return
                }

                const actionMatch = Object.entries(actions).find(([key, values]) =>
                    values.includes(charModifier.toLowerCase())
                )?.[0];

                console.log(`Skill match: ${skillMatch}`);
                console.log(`Action match: ${actionMatch}`);

                // gets the modifier of the character's skill
                const raw = characters[0][skillMatch];
                const skillVal = Math.floor(Math.round(raw-10)/2)

                // checks if the class got modifiers
                const charClass = characters[0]["class"].toLowerCase() as keyof typeof classBuffs;
                const classMatch = classBuffs[charClass] as Partial<Record<string, number>> | undefined;
                const classVal = getBuff(classMatch, actionMatch);

                // checks if the race has any modifiers to the stats
                const characterRace = characters[0]["race"].toLowerCase() as keyof typeof raceBuffs;
                const raceMatch = raceBuffs[characterRace] as Partial<Record<string, number>> | undefined;
                const raceVal = getBuff(raceMatch, actionMatch);
                console.log(`Race bonus: ${raceVal}`);

                // adds skillval and raceval and class val to finally be added to the total value
                charMods = skillVal + raceVal + classVal;
                console.log(`Final character modifier: ${skillVal}, ${classVal}, ${raceVal}: ${charMods}`);
            } else if (!characters || characters.length === 0) {
                // says you don't have a character if no char is found
                await interaction.editReply({
                    content: 'You rolled the dice with a modifier, but you don\'t have a registered character. Run command `/new` to create a new character.'
                });
                return
            }
        }

        const rolls = parseInt(match[1], 10);
        const sides = parseInt(match[2], 10);
        const modifier = match[3] ? parseInt(match[3], 10) : 0;

        if (rolls < 1 || sides < 2 || rolls > 100) {
            await interaction.editReply({ content: 'Please use a reasonable dice format (e.g., 1d20, 2d6, max 100 dice).' });
            return;
        }

        const results = [];
        for (let i = 0; i < rolls; i++) {
            results.push(Math.floor(Math.random() * sides) + 1);
        }
        let total = results.reduce((a, b) => a + b, 0) + modifier + charMods;

        let modifierText = '';
        if (total <= 0) total = 1;
        if (modifier > 0) modifierText = `+${modifier}`;
        if (modifier < 0) modifierText = `-${Math.abs(modifier)}`;

        let charModifierText = '';
        if(charModifier){
            if (charMods > 0) charModifierText = `+${charMods}`;
            if (charMods < 0) charModifierText = `-${Math.abs(charMods)}`;
        }

        await interaction.editReply(
            `🎲 Rolling \`[${rolls}d${sides}${modifierText}${charModifierText}] Result: [${results.join(',')}${modifier !== 0 ? `${modifier >= 0 ? '+' : '-'}${Math.abs(modifier)}]` : ']'} \`(Total: \`${total}\`)`
        );
    },
};