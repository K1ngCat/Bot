


const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');


const ticketsFile = path.join(__dirname, '..', 'tickets.json');

function loadTickets() {
  
  if (!fs.existsSync(ticketsFile)) {
    console.log(`[INFO] tickets.json not found at ${ticketsFile}. A new file will be created on the next save.`);
    return [];
  }
  try {
   
    const fileContent = fs.readFileSync(ticketsFile, 'utf8');
    
    if (fileContent.trim() === '') {
      return [];
    }
   
    return JSON.parse(fileContent);
  } catch (error) {
    
    console.error('[ERROR] Failed to load or parse tickets.json:', error);
    return [];
  }
}


function saveTickets(tickets) {
  try {
    
    fs.writeFileSync(ticketsFile, JSON.stringify(tickets, null, 2), 'utf8');
  } catch (error) {
    
    console.error('[ERROR] Failed to write to tickets.json:', error);
    throw error;
  }
}



module.exports = {
  
  data: new SlashCommandBuilder()
    .setName('wiperecord')
    .setDescription("Deletes all ticket records for a user (Moderator only).")
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user whose ticket record you want to wipe.')
        .setRequired(true)
    )
   
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false), 

  
  async execute(interaction) {
    
    await interaction.deferReply({ flags: 64 });

    const moderator = interaction.user;
    
    const targetMember = interaction.options.getMember('user');

    
    if (!targetMember) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000) // Red
        .setTitle('User Not Found')
        .setDescription('❌ Could not find the specified user in this server. Please select a valid member.');
      return interaction.editReply({ embeds: [embed] });
    }
    
    const targetUser = targetMember.user;

    
    const allTickets = loadTickets();

    
    const userHasRecords = allTickets.some(ticket => ticket.userId === targetUser.id);

    if (!userHasRecords) {
      const embed = new EmbedBuilder()
        .setColor(0xFFD700) 
        .setTitle('No Records Found')
        .setDescription(`✅ **${targetUser.tag}** already has a clean record. No action was taken.`);
      return interaction.editReply({ embeds: [embed] });
    }

    
    const updatedTickets = allTickets.filter(ticket => ticket.userId !== targetUser.id);

    
    try {
      saveTickets(updatedTickets);
    } catch (error) {
      
      const embed = new EmbedBuilder()
        .setColor(0xFF0000) 
        .setTitle('File System Error')
        .setDescription('❌ A critical error occurred while trying to save the updated records. The operation was aborted.');
      return interaction.editReply({ embeds: [embed] });
    }

    
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(0xFF0000) 
        .setTitle('Ticket Record Wiped')
        .setDescription(`Your ticket records in the **${interaction.guild.name}** server have been wiped by a moderator.`)
        .addFields({ name: 'Moderator', value: moderator.tag, inline: true })
        .setTimestamp();
      await targetUser.send({ embeds: [dmEmbed] });
    } catch (error) {
      
      console.warn(`[WARN] Could not DM ${targetUser.tag} about their wiped record. They may have DMs disabled.`);
    }

    
    const successEmbed = new EmbedBuilder()
      .setColor(0x00FF00) 
      .setTitle('Record Wiped Successfully')
      .setDescription(`✅ All ticket records for **${targetUser.tag}** have been permanently deleted.`)
      .setTimestamp();

    await interaction.editReply({ embeds: [successEmbed] });
  }
};