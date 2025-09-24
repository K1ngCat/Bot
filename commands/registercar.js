const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { saveRegistrations } = require('../utils/registrationStorage');
const ms = require('ms'); 

const VIP_ROLE_ID = '1409486868214452255';
const BOOSTER_ROLE_ID = '1403091358419259433';
const MAX_REGULAR = 5;
const MAX_VIP = 12;
const EXPIRY_MS = 1000 * 60 * 60 * 24 * 90; 

module.exports = {
  data: new SlashCommandBuilder()
    .setName('registercar')
    .setDescription('Register a car in the database')
    .addStringOption(option =>
      option.setName('plate').setDescription('License Plate').setRequired(true))
    .addStringOption(option =>
      option.setName('make').setDescription('Car Make').setRequired(true))
    .addStringOption(option =>
      option.setName('trim').setDescription('Car Trim').setRequired(true))
    .addStringOption(option =>
      option.setName('type').setDescription('Car Type').setRequired(true))
    .addStringOption(option =>
      option.setName('model').setDescription('Car Model').setRequired(true))
    .addStringOption(option =>
      option.setName('color').setDescription('Car Color').setRequired(true))
    .addStringOption(option =>
      option.setName('state').setDescription('The State').setRequired(true))
    .addIntegerOption(option =>
      option.setName('year').setDescription('Year').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    const plateRaw = interaction.options.getString('plate');
    const plate = plateRaw.toLowerCase();

    if (!/^[a-z0-9-]{1,10}$/i.test(plateRaw)) {
      return interaction.editReply({ content: '❌ Invalid plate format.' });
    }

    if (!interaction.client.registrations) {
      interaction.client.registrations = new Map();
    }

    if (interaction.client.registrations.has(plate)) {
      return interaction.editReply({
        content: `❌ This plate (\`${plateRaw.toUpperCase()}\`) is already registered.`
      });
    }

    
    const userRegistrations = [...interaction.client.registrations.values()].filter(reg => reg.userId === interaction.user.id);
    
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const hasVip = member.roles.cache.has(VIP_ROLE_ID);
    const hasBooster = member.roles.cache.has(BOOSTER_ROLE_ID);

    const maxAllowed = (hasVip || hasBooster) ? MAX_VIP : MAX_REGULAR;

    if (userRegistrations.length >= maxAllowed) {
      return interaction.editReply({
        content: `❌ You have reached the maximum of ${maxAllowed} registered cars.`
      });
    }

    
    const now = Date.now();
    const expiresAt = now + EXPIRY_MS;
    const expiryDate = new Date(expiresAt);

    const regData = {
      plate: plateRaw.toUpperCase(),
      make: interaction.options.getString('make'),
      trim: interaction.options.getString('trim'),
      type: interaction.options.getString('type'),
      model: interaction.options.getString('model'),
      color: interaction.options.getString('color'),
      state: interaction.options.getString('state'),
      year: interaction.options.getInteger('year'),
      userId: interaction.user.id,
      registeredAt: now,
      expiresAt 
    };

    interaction.client.registrations.set(plate, regData);
    saveRegistrations(interaction.client.registrations);

    const embed = new EmbedBuilder()
      .setTitle('Car Registration')
      .setColor('#00ff00')
      .addFields(
        { name: '🪪 Plate', value: String(regData.plate), inline: true },
        { name: '🚗 Make', value: String(regData.make), inline: true },
        { name: '🚗 Trim', value: String(regData.trim), inline: true },
        { name: '🚗 Type', value: String(regData.type), inline: true },
        { name: '🚗 Model', value: String(regData.model), inline: true },
        { name: '🌈 Color', value: String(regData.color), inline: true },
        { name: '🖼️ State', value: String(regData.state), inline: true },
        { name: '📅 Year', value: String(regData.year ?? 'Unknown'), inline: true },
        { name: '⏳ Expires In', value: `<t:${Math.floor(expiresAt / 1000)}:R>`, inline: true }
      )
      .setFooter({ text: `Registered by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({
      content: `<@${interaction.user.id}> registered a car:`,
      embeds: [embed]
    });

    
    try {
      await interaction.user.send({
        content: `✅ Your car has been successfully registered. It will expire <t:${Math.floor(expiresAt / 1000)}:R> (<t:${Math.floor(expiresAt / 1000)}:f>).`,
        embeds: [embed]
      });
    } catch {
      console.warn(`Could not DM user ${interaction.user.tag}`);
    }

    
    try {
      const msg = await interaction.fetchReply();
      if (msg && msg.react) await msg.react('✅');
    } catch {
      
    }
  }
};
