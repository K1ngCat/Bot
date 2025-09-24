/**
 * @file wiperecord.js - A Discord.js slash command to completely delete a user's ticket records.
 * @author Your Name/Bot Name
 * @version 2.0.0
 *
 * This command is restricted to members with the "Manage Messages" permission.
 * It provides clear feedback for all outcomes using embeds and handles potential
 * errors like missing files, invalid users, or failed DMs.
 */

// Import necessary modules from discord.js and Node.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
// Define the path to the tickets data file, located one directory up from the command's folder.
const ticketsFile = path.join(__dirname, '..', 'tickets.json');

// --- Helper Functions ---

/**
 * Loads and parses the ticket data from the JSON file.
 * This function is designed to be safe and will not crash if the file is missing or corrupt.
 * @returns {Array<object>} An array of ticket objects. Returns an empty array on failure.
 */
function loadTickets() {
  // First, check if the file even exists. If not, log it and return an empty array.
  if (!fs.existsSync(ticketsFile)) {
    console.log(`[INFO] tickets.json not found at ${ticketsFile}. A new file will be created on the next save.`);
    return [];
  }
  try {
    // Read the file's content.
    const fileContent = fs.readFileSync(ticketsFile, 'utf8');
    // If the file is empty, it's not valid JSON. Return an empty array.
    if (fileContent.trim() === '') {
      return [];
    }
    // Parse the JSON content and return it.
    return JSON.parse(fileContent);
  } catch (error) {
    // If parsing fails, log the error and return an empty array to prevent a crash.
    console.error('[ERROR] Failed to load or parse tickets.json:', error);
    return [];
  }
}

/**
 * Saves the provided ticket data to the JSON file.
 * @param {Array<object>} tickets The array of ticket objects to be saved.
 * @throws {Error} Throws an error if writing to the file fails, which should be caught by the caller.
 */
function saveTickets(tickets) {
  try {
    // Convert the tickets array to a nicely formatted JSON string and write it to the file.
    fs.writeFileSync(ticketsFile, JSON.stringify(tickets, null, 2), 'utf8');
  } catch (error) {
    // If writing fails, log the error and re-throw it to be handled by the command's logic.
    console.error('[ERROR] Failed to write to tickets.json:', error);
    throw error;
  }
}


// --- Command Definition ---
module.exports = {
  // Define the command's structure and properties using SlashCommandBuilder
  data: new SlashCommandBuilder()
    .setName('wiperecord')
    .setDescription("Deletes all ticket records for a user (Moderator only).")
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user whose ticket record you want to wipe.')
        .setRequired(true)
    )
    // This ensures only members with "Manage Messages" or "Administrator" can see and use it.
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false), // This command should only be used in a server.

  // The main execution logic for the command
  async execute(interaction) {
    // Defer the reply to prevent timeouts and make it visible only to the moderator.
    // The `flags: 64` makes the response ephemeral.
    await interaction.deferReply({ flags: 64 });

    const moderator = interaction.user;
    // Get the GuildMember object. This is the most reliable way to find a user in the current server.
    const targetMember = interaction.options.getMember('user');

    // **Primary User Check:** If targetMember is null, the user isn't in the server.
    if (!targetMember) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000) // Red
        .setTitle('User Not Found')
        .setDescription('❌ Could not find the specified user in this server. Please select a valid member.');
      return interaction.editReply({ embeds: [embed] });
    }
    
    const targetUser = targetMember.user;

    // Load all current tickets.
    const allTickets = loadTickets();

    // Check if the target user has any records in the first place.
    const userHasRecords = allTickets.some(ticket => ticket.userId === targetUser.id);

    if (!userHasRecords) {
      const embed = new EmbedBuilder()
        .setColor(0xFFD700) // Yellow
        .setTitle('No Records Found')
        .setDescription(`✅ **${targetUser.tag}** already has a clean record. No action was taken.`);
      return interaction.editReply({ embeds: [embed] });
    }

    // Create a new array containing all tickets EXCEPT those belonging to the target user.
    const updatedTickets = allTickets.filter(ticket => ticket.userId !== targetUser.id);

    // **Save Operation:** Attempt to save the filtered data.
    try {
      saveTickets(updatedTickets);
    } catch (error) {
      // If saving fails, inform the moderator of the critical error.
      const embed = new EmbedBuilder()
        .setColor(0xFF0000) // Red
        .setTitle('File System Error')
        .setDescription('❌ A critical error occurred while trying to save the updated records. The operation was aborted.');
      return interaction.editReply({ embeds: [embed] });
    }

    // **DM Notification:** Try to notify the user that their record was wiped.
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(0xFF0000) // Red
        .setTitle('Ticket Record Wiped')
        .setDescription(`Your ticket records in the **${interaction.guild.name}** server have been wiped by a moderator.`)
        .addFields({ name: 'Moderator', value: moderator.tag, inline: true })
        .setTimestamp();
      await targetUser.send({ embeds: [dmEmbed] });
    } catch (error) {
      // If the DM fails, it's not critical. Log a warning and continue.
      console.warn(`[WARN] Could not DM ${targetUser.tag} about their wiped record. They may have DMs disabled.`);
    }

    // **Success Confirmation:** Inform the moderator that the operation was successful.
    const successEmbed = new EmbedBuilder()
      .setColor(0x00FF00) // Green
      .setTitle('Record Wiped Successfully')
      .setDescription(`✅ All ticket records for **${targetUser.tag}** have been permanently deleted.`)
      .setTimestamp();

    await interaction.editReply({ embeds: [successEmbed] });
  }
};