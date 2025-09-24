const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkregistration')
    .setDescription('Check a car registration by plate')
    .addStringOption(option =>
      option.setName('plate')
        .setDescription('License plate to check')
        .setRequired(true)
    ),

  async execute(interaction) {
    const allowedRoles = ['1372308043454349403', '1405164435634524234'];

    if (!allowedRoles.some(roleId => interaction.member.roles.cache.has(roleId))) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command. (Requires WSP or another allowed role)',
        ephemeral: true
      });
    }

    await interaction.deferReply();

    // Load fresh registration data from JSON
    const filePath = path.join(__dirname, '..', 'data', 'registrations.json');
    const registrations = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Normalize input plate to lowercase
    const plateInput = interaction.options.getString('plate');
    const plateKey = plateInput.toLowerCase();

    // Find registration by matching plate
    const reg = Object.values(registrations).find(r => r.plate.toLowerCase() === plateKey);

    if (!reg) {
      return interaction.editReply({
        content: `❌ No registration found for plate \`${plateInput.toUpperCase()}\`.`
      });
    }

    const yearStr = reg.year ? String(reg.year) : 'Unknown';

    const embed = new EmbedBuilder()
      .setTitle(`Registration Check Info for ${String(reg.plate).toUpperCase()}`)
      .setColor('#ff9900')
      .addFields(
        { name: '🪪 Plate', value: String(reg.plate ?? 'Unknown'), inline: true },
        { name: '🚗 Make', value: String(reg.make ?? 'Unknown'), inline: true },
        { name: '🚗 Trim', value: String(reg.trim ?? 'Unknown'), inline: true },
        { name: '🚗 Type', value: String(reg.type ?? 'Unknown'), inline: true },
        { name: '🚗 Model', value: String(reg.model ?? 'Unknown'), inline: true },
        { name: '🌈 Color', value: typeof reg.color === 'string' ? reg.color : JSON.stringify(reg.color), inline: true },
        { name: '🖼️ State', value: String(reg.state ?? 'Unknown'), inline: true },
        { name: '📅 Year', value: yearStr, inline: true }
      )
      .setFooter({ text: `Registered by user ID ${String(reg.userId ?? 'Unknown')}` })
      .setDescription(`Registered by <@${reg.userId}>`)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
