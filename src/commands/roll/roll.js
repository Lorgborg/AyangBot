import { SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();
import { MongoClient } from 'mongodb';
const dbClient = new MongoClient(process.env.MONGO_URI);

export default {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Rolls a Dice, e.g., 1d20, 2d6+3, 1d8-2')
        .addStringOption(option =>
            option.setName('dice')
                .setDescription('The number of sides on the dice. Example: 1d20')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('modifier')
                .setDescription('Stat modifier (e.g., charisma, persuasion, athletics). leave empty otherwise')
                .setRequired(false)
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const dice = interaction.options.getString('dice');
        const charModifier = interaction.options.getString('modifier');
        let charMods = 0;
        // Match XdY, XdY+Z, or XdY-Z
        const match = dice.match(/^(\d+)d(\d+)([+-]\d+)?$/i);

        if (!match) {
            await interaction.editReply({ content: 'Please use the format XdY, XdY+Z, or XdY-Z (e.g., 1d20, 2d6+3, 1d8-2).', ephemeral: true });
            return;
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

                // map of prompts to their assigned skills
                const skills = {
                    strength: ['str', 'strength', 'athletics', 'ath'],
                    dexterity: ['dex', 'dexterity', 'acrobatics', 'acr', 'stealth', 'ste'],
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
                    charisma: ['ch', 'cha', 'charisma']
                }

                // increased attributes that come specifically from races
                const raceBuffs = {
                    human: {
                        intelligence: 2,
                        religion: 3
                    }
                }

                // matches inputted character modifier into appropriate skills using the skills map
                const skillMatch = Object.entries(skills).find(([key, values]) =>
                    values.includes(charModifier.toLowerCase())
                )?.[0];

                const actionMatch = Object.entries(actions).find(([key, values]) =>
                    values.includes(charModifier.toLowerCase())
                )?.[0];

                console.log(`Skill match: ${skillMatch}`);
                console.log(`Action match: ${actionMatch}`);

                // gets the modifier of the character's skill
                const raw = characters[0][skillMatch];
                const skillVal = Math.floor(Math.round(raw-10)/2)

                // checks if the race has any modifiers to the stats
                const characterRace = characters[0]["race"].toLowerCase();
                const raceVal = raceBuffs[characterRace][actionMatch] ? raceBuffs[characterRace][actionMatch] : 0;

                console.log(`Race bonus: ${raceVal}`);

                // adds skillval and raceval to finally be added to the total value
                charMods = skillVal + raceVal;
                console.log(`Final character modifier: ${charMods}`);
            } else if (!characters || characters.length === 0) {
                // says you don't have a character if no char is found
                await interaction.editReply({
                    content: 'You rolled the dice with a modifier, but you don\'t have a registered character. Run command `/new` to create a new character.',
                    ephemeral: true,
                });
                return
            }
        }

        const rolls = parseInt(match[1], 10);
        const sides = parseInt(match[2], 10);
        const modifier = match[3] ? parseInt(match[3], 10) : 0;

        if (rolls < 1 || sides < 2 || rolls > 100) {
            await interaction.editReply({ content: 'Please use a reasonable dice format (e.g., 1d20, 2d6, max 100 dice).', ephemeral: true });
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