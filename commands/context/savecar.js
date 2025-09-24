const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const { saveRegistrations, loadRegistrations } = require('../../utils/registrationStorage');

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('Save Car')
    .setType(ApplicationCommandType.Message),

  async execute(interaction) {
    const message = interaction.targetMessage;

    if (!message.embeds || message.embeds.length === 0) {
      return interaction.reply({ content: '❌ This message does not contain an embed.', ephemeral: true });
    }

    const embed = message.embeds[0];

    if (!embed.title || !embed.title.toLowerCase().includes('car registration')) {
      return interaction.reply({ content: '❌ This message is not a valid car registration (missing "Car Registration" title).', ephemeral: true });
    }

    // Hole User-ID aus den Erwähnungen in der Message (nicht im Embed!)
    let userId = null;
    if (message.mentions.users.size > 0) {
      userId = message.mentions.users.first().id;
    } else {
      // Fallback: User, der den Command ausführt
      userId = interaction.user.id;
    }

    // Extract data from embed fields
    const data = {};
    for (const field of embed.fields) {
      const name = field.name.toLowerCase();
      const value = field.value;

      if (name.includes('plate')) data.plate = value;
      else if (name.includes('make')) data.make = value;
      else if (name.includes('trim')) data.trim = value;
      else if (name.includes('type')) data.type = value;
      else if (name.includes('model')) data.model = value;
      else if (name.includes('color')) data.color = value;
      else if (name.includes('state')) data.state = value;
      else if (name.includes('year')) {
        const yearNum = parseInt(value);
        data.year = isNaN(yearNum) ? null : yearNum;
      }
    }

    if (!data.plate) {
      return interaction.reply({ content: '❌ Plate number is missing and required.', ephemeral: true });
    }

    data.userId = userId;

    // Load existing registrations from your storage util
    const registrations = loadRegistrations();

    // Add or update the registration
    registrations.set(data.plate.toLowerCase(), data);

    // Save registrations back to storage
    saveRegistrations(registrations);

    await interaction.reply({ content: `✅ Registration for plate \`${data.plate}\` saved successfully!`, ephemeral: true });
  }
};
