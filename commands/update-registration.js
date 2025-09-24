const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

function safeString(val) {
  if (val === null || val === undefined) return 'N/A';
  if (typeof val === 'object') return JSON.stringify(val, null, 2);
  return String(val);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('update-registration')
    .setDescription('Update one or more fields of your vehicle using the license plate.')
    .addStringOption(option =>
      option.setName('plate')
        .setDescription('The license plate of your vehicle')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('color')
        .setDescription('New color')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('make')
        .setDescription('New make')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('trim')
        .setDescription('New trim')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('model')
        .setDescription('New model')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('type')
        .setDescription('New type')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('state')
        .setDescription('New state')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('year')
        .setDescription('New year')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('newplate')
        .setDescription('Change the plate')
        .setRequired(false)
    ),

  async execute(interaction) {
    const filePath = path.join(__dirname, '..', 'data', 'registrations.json');

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '{}');
    }

    const vehicles = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const plate = interaction.options.getString('plate');

    const vehicleId = Object.keys(vehicles).find(id => vehicles[id].plate.toLowerCase() === plate.toLowerCase());
    const vehicle = vehicles[vehicleId];

    if (!vehicle) {
      return interaction.reply({ content: '❌ Vehicle not found with that plate.', ephemeral: true });
    }

    if (vehicle.userId !== interaction.user.id) {
      return interaction.reply({ content: '❌ You can only update your own vehicle.', ephemeral: true });
    }

    const fieldsToUpdate = ['color', 'make', 'trim', 'model', 'type', 'state', 'year', 'newplate'];
    let changes = [];

    for (const field of fieldsToUpdate) {
      let value;
      if (field === 'year') {
        value = interaction.options.getInteger(field);
      } else {
        value = interaction.options.getString(field);
      }

      if (value !== null) {
        
        if (typeof value === 'object') {
          
          value = JSON.stringify(value);
        }

        if (field === 'newplate') {
          vehicle['plate'] = value;
          changes.push(`Plate → **${value}**`);
        } else {
          vehicle[field] = value;
          changes.push(`${field.charAt(0).toUpperCase() + field.slice(1)} → **${value}**`);
        }
      }
    }

    if (changes.length === 0) {
      return interaction.reply({ content: '⚠️ No updates were provided.', ephemeral: true });
    }

    vehicles[vehicleId] = vehicle;
    fs.writeFileSync(filePath, JSON.stringify(vehicles, null, 2));

    const embed = new EmbedBuilder()
      .setTitle(`✅ Vehicle Updated`)
      .setDescription(`Here are the new details for your vehicle:`)
      .addFields(
        { name: 'Plate', value: safeString(vehicle.plate), inline: true },
        { name: 'Make', value: safeString(vehicle.make), inline: true },
        { name: 'Trim', value: safeString(vehicle.trim), inline: true },
        { name: 'Model', value: safeString(vehicle.model), inline: true },
        { name: 'Type', value: safeString(vehicle.type), inline: true },
        { name: 'Color', value: safeString(vehicle.color), inline: true },
        { name: 'State', value: safeString(vehicle.state), inline: true },
        { name: 'Year', value: safeString(vehicle.year), inline: true }
      )
      .setFooter({ text: `Vehicle ID: ${vehicleId}` })
      .setColor('Green');

    await interaction.reply({ embeds: [embed] });

    try {
      await interaction.user.send({ embeds: [embed] });
    } catch {
      console.warn('❌ Could not send DM to user.');
    }
  }
};

