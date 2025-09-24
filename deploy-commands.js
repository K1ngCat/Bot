const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');
require('dotenv').config();

const { TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('❌ Fehler: .env ist unvollständig. Bitte TOKEN, CLIENT_ID und GUILD_ID angeben.');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`⚠️ Die Datei '${file}' hat kein gültiges 'data' oder 'execute' Feld.`);
  }
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log(`🔁 Registriere ${commands.length} Slash-Commands für Guild ${GUILD_ID}...`);

    const data = await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands },
    );

    console.log(`✅ Erfolgreich ${data.length} Slash-Commands in Guild ${GUILD_ID} registriert.`);
  } catch (error) {
    console.error('❌ Fehler beim Registrieren der Commands:', error);
  }
})();