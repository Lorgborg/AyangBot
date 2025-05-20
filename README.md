# AyangBot
A bot created for the DnD sessions in the sigma gang server

## Installation
Clone the GitHub into your local device and ask me for the .env file if you want to run the bot from your device. After this, run **npm install** to install all dependencies.

## Running the file
Run the file with the command **npm run start** in order to start the bot. If any changes are made towards the commands, run **npm run reload** in order to reload the commands. If changes arre not reflected, restart the bot.

## Making contributions
Commands must have their own folders within the commands folder. Like how ping.js is inside a folder named ping. Events are placed inside the events folder and not the index to ensure a clean main file.

## Current things needed help with
**/help** command, hopefully embeded to help users navigate bot commands

**/create** command, to make a new character. The user using this command should be dm'ed by the bot and asked to input character details such as: name, class, race and stats

update **/roll** command to make use of the modifiers of users

**/bind** which should bind a main character for that user. Users can have multiple characters, binding a character uses that character's stats when rolling

**/update** command, which should update a user's selected stat. Hopefully this is implemented with an embed or through dms. Or maybe both that's also cool

**utility functions for json modification**. modifying the JSON file currently is done manually. Some utility functions should be made to modify it for the **/update** and **/create** functions. These util function should be in a seperate folder, the functions, updateCharacter, addCharacter and deleteCharacter should be added


These are the required things for the bot to be considered ready for deployement.

## Additional functions
Custom message for when a character dies
A way to save character images, so that the embeds can include character messages (This can also be done manually, but ewwww)

### Thank you for your support!