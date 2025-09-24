
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { saveRegistrations } = require('../utils/registrationStorage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deleteregistration')
    .setDescription('Delete a car registration (Owner or Admin)')
    .addStringOption(option =>
      option.setName('plate').setDescription('License Plate').setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    const plateInput = interaction.options.getString('plate');
    const plate = plateInput.toLowerCase();

    if (!interaction.client.registrations || !interaction.client.registrations.has(plate)) {
      return interaction.editReply({
        content: `❌ No registration found for plate \`${plateInput.toUpperCase()}\`.`
      });
    }

    const reg = interaction.client.registrations.get(plate);

    if (interaction.user.id !== reg.userId &&
        !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.editReply({
        content: '❌ You are not allowed to delete this registration.'
      });
    }

    interaction.client.registrations.delete(plate);
    saveRegistrations(interaction.client.registrations);

    await interaction.editReply({
      content: `✅ Registration for plate \`${plateInput.toUpperCase()}\` has been deleted.`
    });

    try {
      const owner = await interaction.client.users.fetch(reg.userId);
      await owner.send(`❌ Your car registration for plate \`${plateInput.toUpperCase()}\` has been deleted by ${interaction.user.tag}.`);
    } catch (err) {
      console.warn(`Could not DM owner of plate ${plateInput.toUpperCase()}`);
    }
  }
};